import { openDB, type IDBPDatabase } from "idb";
import { supabase } from "@/integrations/supabase/client";

/**
 * Offline mutation queue.
 * Stores pending Supabase writes in IndexedDB and replays them when online.
 *
 * Strategy:
 *  - Каждая мутация — { table, op, payload, match? } — описывает один вызов.
 *  - При вызове `enqueue` мутация СРАЗУ применяется к React Query кэшу
 *    (оптимистично) и попадает в очередь.
 *  - При появлении сети flushQueue() пытается отправить мутации по очереди.
 *  - Last-Write-Wins: сервер просто принимает то, что мы шлём (без version-check).
 */

export type QueueOp = "insert" | "update" | "upsert" | "delete";
export type AnyTable = Parameters<typeof supabase.from>[0];

export interface QueuedMutation {
  id?: number;
  created_at: number;
  table: AnyTable;
  op: QueueOp;
  payload?: any;            // row or partial row
  match?: Record<string, any>; // for update/delete: WHERE filter
  upsertOpts?: { onConflict?: string };
  retries: number;
  lastError?: string;
}

const DB_NAME = "knails-offline";
const STORE = "mutations";
let dbPromise: Promise<IDBPDatabase> | null = null;

function getDB() {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, 1, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE)) {
          db.createObjectStore(STORE, { keyPath: "id", autoIncrement: true });
        }
      },
    });
  }
  return dbPromise;
}

export async function enqueueMutation(
  m: Omit<QueuedMutation, "id" | "created_at" | "retries">
): Promise<number> {
  const db = await getDB();
  const full: QueuedMutation = { ...m, created_at: Date.now(), retries: 0 };
  const id = await db.add(STORE, full);
  notifyChange();
  return id as number;
}

export async function getPendingCount(): Promise<number> {
  try {
    const db = await getDB();
    return await db.count(STORE);
  } catch {
    return 0;
  }
}

export async function getAllPending(): Promise<QueuedMutation[]> {
  const db = await getDB();
  return (await db.getAll(STORE)) as QueuedMutation[];
}

async function deleteMutation(id: number) {
  const db = await getDB();
  await db.delete(STORE, id);
}

async function updateMutation(m: QueuedMutation) {
  const db = await getDB();
  await db.put(STORE, m);
}

/* ------------------------------- replay ---------------------------------- */

async function replayOne(m: QueuedMutation): Promise<void> {
  const q: any = supabase.from(m.table);
  switch (m.op) {
    case "insert": {
      const { error } = await q.insert(m.payload);
      if (error) throw error;
      return;
    }
    case "update": {
      let qb = q.update(m.payload);
      for (const [k, v] of Object.entries(m.match ?? {})) qb = qb.eq(k, v);
      const { error } = await qb;
      if (error) throw error;
      return;
    }
    case "upsert": {
      const { error } = await q.upsert(m.payload, m.upsertOpts);
      if (error) throw error;
      return;
    }
    case "delete": {
      let qb = q.delete();
      for (const [k, v] of Object.entries(m.match ?? {})) qb = qb.eq(k, v);
      const { error } = await qb;
      if (error) throw error;
      return;
    }
  }
}

let flushing = false;

export async function flushQueue(): Promise<{ ok: number; failed: number }> {
  if (flushing) return { ok: 0, failed: 0 };
  if (typeof navigator !== "undefined" && !navigator.onLine) return { ok: 0, failed: 0 };

  flushing = true;
  let ok = 0;
  let failed = 0;
  try {
    const all = (await getAllPending()).sort((a, b) => a.created_at - b.created_at);
    for (const m of all) {
      try {
        await replayOne(m);
        if (m.id != null) await deleteMutation(m.id);
        ok++;
      } catch (e: any) {
        m.retries += 1;
        m.lastError = e?.message ?? String(e);
        // After 5 failed retries, drop to avoid blocking the queue forever.
        if (m.retries >= 5 && m.id != null) {
          console.warn("[offline] dropping mutation after 5 failures", m);
          await deleteMutation(m.id);
        } else {
          await updateMutation(m);
        }
        failed++;
        // stop on first failure to preserve order
        break;
      }
    }
  } finally {
    flushing = false;
    notifyChange();
  }
  return { ok, failed };
}

/* ----------------------------- subscribers ------------------------------- */

const listeners = new Set<() => void>();
export function subscribeQueue(fn: () => void) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}
function notifyChange() {
  listeners.forEach((fn) => {
    try { fn(); } catch {}
  });
}

/* -------------------------- auto-flush on online ------------------------- */

let installed = false;
export function installAutoFlush(onAfterFlush?: () => void) {
  if (installed || typeof window === "undefined") return;
  installed = true;
  const tryFlush = async () => {
    const r = await flushQueue();
    if (r.ok > 0 && onAfterFlush) onAfterFlush();
  };
  window.addEventListener("online", tryFlush);
  // periodic retry while online
  setInterval(() => {
    if (navigator.onLine) tryFlush();
  }, 30_000);
  // initial attempt
  if (navigator.onLine) tryFlush();
}
