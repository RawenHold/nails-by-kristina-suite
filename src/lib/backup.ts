import JSZip from "jszip";
import { supabase } from "@/integrations/supabase/client";
import { flushQueue, getPendingCount } from "@/lib/offline/queue";

/**
 * Tables exported as JSON. Order matters on RESTORE because of FK chains:
 * we insert parents (clients, services, expense_categories, ...) before children
 * (appointments, appointment_services, visits, visit_photos, ...).
 */
const TABLE_ORDER = [
  "master_profile",
  "clients",
  "services",
  "expense_categories",
  "tags",
  "message_templates",
  "appointments",
  "appointment_services",
  "client_tags",
  "visits",
  "visit_tags",
  "visit_photos",
  "incomes",
  "expenses",
  "reminders",
  "timer_sessions",
] as const;

type TableName = typeof TABLE_ORDER[number];

export interface BackupManifest {
  version: 1;
  created_at: string;
  owner_id: string;
  app: "k-nails-finance";
  table_counts: Record<string, number>;
  photo_count: number;
  avatar_count?: number;
}

export type ProgressFn = (msg: string, pct?: number) => void;

/* ---------------------------------- EXPORT --------------------------------- */

export async function createBackup(onProgress: ProgressFn = () => {}): Promise<Blob> {
  const { data: auth } = await supabase.auth.getUser();
  const user = auth.user;
  if (!user) throw new Error("Не авторизован");

  // Flush any pending offline mutations first so the backup is up to date
  const pending = await getPendingCount();
  if (pending > 0) {
    if (typeof navigator !== "undefined" && !navigator.onLine) {
      throw new Error(`Есть ${pending} несинхронизированных записей — подключитесь к интернету перед экспортом`);
    }
    onProgress("Синхронизация очереди…", 1);
    await flushQueue();
  }

  const zip = new JSZip();
  const dataFolder = zip.folder("data")!;
  const photoFolder = zip.folder("photos")!;
  const avatarFolder = zip.folder("avatars")!;
  const counts: Record<string, number> = {};

  // 1) Dump every table as JSON
  const totalTables = TABLE_ORDER.length;
  for (let i = 0; i < totalTables; i++) {
    const table = TABLE_ORDER[i];
    onProgress(`Экспорт: ${table}`, Math.round((i / (totalTables + 1)) * 75));
    // RLS already filters to owner; we don't need .eq("owner_id", user.id)
    const { data, error } = await supabase.from(table).select("*");
    if (error) throw new Error(`${table}: ${error.message}`);
    counts[table] = data?.length ?? 0;
    dataFolder.file(`${table}.json`, JSON.stringify(data ?? [], null, 2));
  }

  // 2) Download every visit photo from the private storage bucket
  onProgress("Сбор фотографий…", 75);
  const { data: photos } = await supabase
    .from("visit_photos")
    .select("storage_path");
  const photoPaths = (photos ?? []).map((p) => p.storage_path).filter(Boolean);
  let photoOk = 0;
  for (let i = 0; i < photoPaths.length; i++) {
    const path = photoPaths[i];
    onProgress(`Фото ${i + 1}/${photoPaths.length}`, 75 + Math.round((i / Math.max(1, photoPaths.length)) * 18));
    const { data: blob, error } = await supabase.storage.from("visit-photos").download(path);
    if (error || !blob) continue; // skip broken files; backup keeps going
    photoFolder.file(path, blob);
    photoOk++;
  }

  // 2b) Download all master-avatar files for this user (bucket: master-avatars)
  onProgress("Сбор аватаров…", 94);
  let avatarOk = 0;
  try {
    const { data: avatarList } = await supabase.storage
      .from("master-avatars")
      .list(user.id);
    if (avatarList && avatarList.length > 0) {
      for (const f of avatarList) {
        const path = `${user.id}/${f.name}`;
        const { data: blob, error } = await supabase.storage
          .from("master-avatars")
          .download(path);
        if (error || !blob) continue;
        avatarFolder.file(path, blob);
        avatarOk++;
      }
    }
  } catch (e) {
    console.warn("avatar export skipped:", e);
  }

  // 3) Manifest
  const manifest: BackupManifest = {
    version: 1,
    created_at: new Date().toISOString(),
    owner_id: user.id,
    app: "k-nails-finance",
    table_counts: counts,
    photo_count: photoOk,
    avatar_count: avatarOk,
  };
  zip.file("manifest.json", JSON.stringify(manifest, null, 2));

  onProgress("Упаковка архива…", 99);
  const blob = await zip.generateAsync({ type: "blob", compression: "DEFLATE", compressionOptions: { level: 6 } });
  onProgress("Готово", 100);
  return blob;
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/* --------------------------------- RESTORE --------------------------------- */

/**
 * Restores a backup ZIP onto the current account.
 * Strategy: rewrite owner_id on every row to the *current* user (so restore works
 * across devices/accounts), keep original IDs so FK relationships remain intact,
 * upsert by primary key, then re-upload all photos.
 *
 * NOTE: This is additive/upsert — it will NOT delete rows that exist in the DB
 * but not in the backup. That's the safe default.
 */
export async function restoreBackup(file: File, onProgress: ProgressFn = () => {}): Promise<BackupManifest> {
  const { data: auth } = await supabase.auth.getUser();
  const user = auth.user;
  if (!user) throw new Error("Не авторизован");

  onProgress("Чтение архива…", 2);
  const zip = await JSZip.loadAsync(file);

  const manifestFile = zip.file("manifest.json");
  if (!manifestFile) throw new Error("Это не файл бэкапа (нет manifest.json)");
  const manifest: BackupManifest = JSON.parse(await manifestFile.async("string"));
  if (manifest.app !== "k-nails-finance") throw new Error("Архив от другого приложения");

  const totalTables = TABLE_ORDER.length;
  for (let i = 0; i < totalTables; i++) {
    const table = TABLE_ORDER[i];
    onProgress(`Восстановление: ${table}`, Math.round((i / (totalTables + 1)) * 65));
    const file = zip.file(`data/${table}.json`);
    if (!file) continue;
    const rows: any[] = JSON.parse(await file.async("string"));
    if (!rows.length) continue;

    // Rewrite owner_id where the column exists, so the data lands on this account.
    const remapped = rows.map((r) => ("owner_id" in r ? { ...r, owner_id: user.id } : r));

    // master_profile has a UNIQUE(owner_id) — upsert by owner_id, not id, to
    // avoid duplicate-key conflict when a profile row already exists.
    const conflictTarget = table === "master_profile" ? "owner_id" : "id";

    // Upsert in chunks (Postgres has a payload-size limit).
    const chunkSize = 200;
    for (let j = 0; j < remapped.length; j += chunkSize) {
      const chunk = remapped.slice(j, j + chunkSize);
      const { error } = await supabase.from(table).upsert(chunk, { onConflict: conflictTarget });
      if (error) throw new Error(`${table}: ${error.message}`);
    }
  }

  // Restore visit photos
  const photoFolder = zip.folder("photos");
  if (photoFolder) {
    const photoEntries: { path: string; blob: Blob }[] = [];
    const promises: Promise<void>[] = [];
    photoFolder.forEach((relPath, entry) => {
      if (entry.dir) return;
      promises.push(
        entry.async("blob").then((b) => {
          photoEntries.push({ path: relPath, blob: b });
        })
      );
    });
    await Promise.all(promises);

    for (let i = 0; i < photoEntries.length; i++) {
      const { path, blob } = photoEntries[i];
      onProgress(`Фото ${i + 1}/${photoEntries.length}`, 68 + Math.round((i / Math.max(1, photoEntries.length)) * 22));
      const { error } = await supabase.storage
        .from("visit-photos")
        .upload(path, blob, { upsert: true, contentType: blob.type || "image/jpeg" });
      if (error && !/duplicate|exists/i.test(error.message)) {
        console.warn("photo restore failed:", path, error.message);
      }
    }
  }

  // Restore master avatars — strip the original owner folder and use current user's id.
  const avatarFolder = zip.folder("avatars");
  if (avatarFolder) {
    const entries: { path: string; blob: Blob }[] = [];
    const ps: Promise<void>[] = [];
    avatarFolder.forEach((relPath, entry) => {
      if (entry.dir) return;
      ps.push(entry.async("blob").then((b) => { entries.push({ path: relPath, blob: b }); }));
    });
    await Promise.all(ps);

    for (let i = 0; i < entries.length; i++) {
      const { path, blob } = entries[i];
      // path like "<old-owner>/avatar-xxx.jpg" — re-root to current user folder
      const filename = path.split("/").pop() || `avatar-${Date.now()}.jpg`;
      const targetPath = `${user.id}/${filename}`;
      onProgress(`Аватар ${i + 1}/${entries.length}`, 92 + Math.round((i / Math.max(1, entries.length)) * 7));
      const { error } = await supabase.storage
        .from("master-avatars")
        .upload(targetPath, blob, { upsert: true, contentType: blob.type || "image/jpeg" });
      if (error && !/duplicate|exists/i.test(error.message)) {
        console.warn("avatar restore failed:", path, error.message);
      }
    }

    // If we restored avatars, point master_profile.avatar_url at the latest one
    // for this user (handles the case where the JSON row carried the OLD URL).
    if (entries.length > 0) {
      const last = entries[entries.length - 1];
      const filename = last.path.split("/").pop()!;
      const { data: pub } = supabase.storage
        .from("master-avatars")
        .getPublicUrl(`${user.id}/${filename}`);
      await supabase
        .from("master_profile")
        .upsert({ owner_id: user.id, avatar_url: pub.publicUrl }, { onConflict: "owner_id" });
    }
  }

  onProgress("Готово", 100);
  return manifest;
}
