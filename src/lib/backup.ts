import JSZip from "jszip";
import { supabase } from "@/integrations/supabase/client";

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
}

export type ProgressFn = (msg: string, pct?: number) => void;

/* ---------------------------------- EXPORT --------------------------------- */

export async function createBackup(onProgress: ProgressFn = () => {}): Promise<Blob> {
  const { data: auth } = await supabase.auth.getUser();
  const user = auth.user;
  if (!user) throw new Error("Не авторизован");

  const zip = new JSZip();
  const dataFolder = zip.folder("data")!;
  const photoFolder = zip.folder("photos")!;
  const counts: Record<string, number> = {};

  // 1) Dump every table as JSON
  const totalTables = TABLE_ORDER.length;
  for (let i = 0; i < totalTables; i++) {
    const table = TABLE_ORDER[i];
    onProgress(`Экспорт: ${table}`, Math.round((i / (totalTables + 1)) * 80));
    // RLS already filters to owner; we don't need .eq("owner_id", user.id)
    const { data, error } = await supabase.from(table).select("*");
    if (error) throw new Error(`${table}: ${error.message}`);
    counts[table] = data?.length ?? 0;
    dataFolder.file(`${table}.json`, JSON.stringify(data ?? [], null, 2));
  }

  // 2) Download every visit photo from the private storage bucket
  onProgress("Сбор фотографий…", 80);
  const { data: photos } = await supabase
    .from("visit_photos")
    .select("storage_path");
  const photoPaths = (photos ?? []).map((p) => p.storage_path).filter(Boolean);
  let photoOk = 0;
  for (let i = 0; i < photoPaths.length; i++) {
    const path = photoPaths[i];
    onProgress(`Фото ${i + 1}/${photoPaths.length}`, 80 + Math.round((i / Math.max(1, photoPaths.length)) * 18));
    const { data: blob, error } = await supabase.storage.from("visit-photos").download(path);
    if (error || !blob) continue; // skip broken files; backup keeps going
    photoFolder.file(path, blob);
    photoOk++;
  }

  // 3) Manifest
  const manifest: BackupManifest = {
    version: 1,
    created_at: new Date().toISOString(),
    owner_id: user.id,
    app: "k-nails-finance",
    table_counts: counts,
    photo_count: photoOk,
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
    onProgress(`Восстановление: ${table}`, Math.round((i / (totalTables + 1)) * 70));
    const file = zip.file(`data/${table}.json`);
    if (!file) continue;
    const rows: any[] = JSON.parse(await file.async("string"));
    if (!rows.length) continue;

    // Rewrite owner_id where the column exists, so the data lands on this account.
    const remapped = rows.map((r) => ("owner_id" in r ? { ...r, owner_id: user.id } : r));

    // Upsert in chunks (Postgres has a payload-size limit).
    const chunkSize = 200;
    for (let j = 0; j < remapped.length; j += chunkSize) {
      const chunk = remapped.slice(j, j + chunkSize);
      const { error } = await supabase.from(table).upsert(chunk, { onConflict: "id" });
      if (error) throw new Error(`${table}: ${error.message}`);
    }
  }

  // Restore photos
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
      onProgress(`Фото ${i + 1}/${photoEntries.length}`, 72 + Math.round((i / Math.max(1, photoEntries.length)) * 26));
      const { error } = await supabase.storage
        .from("visit-photos")
        .upload(path, blob, { upsert: true, contentType: blob.type || "image/jpeg" });
      if (error && !/duplicate|exists/i.test(error.message)) {
        // soft-fail per file, don't abort the whole restore
        console.warn("photo restore failed:", path, error.message);
      }
    }
  }

  onProgress("Готово", 100);
  return manifest;
}
