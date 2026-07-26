import { openDB, type IDBPDatabase } from "idb";

const DB_NAME = "trafficwatch-offline";
const DB_VERSION = 1;

export type OfflineStore =
  | "incidents"
  | "evidence"
  | "ai_analyses"
  | "ai_analysis_jobs"
  | "anpr_scans"
  | "violation_types"
  | "pending_sync"
  | "drafts"
  | "cache"
  | "user_profile";

let dbPromise: Promise<IDBPDatabase> | null = null;

function getDB(): Promise<IDBPDatabase> {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        // Incidents store
        if (!db.objectStoreNames.contains("incidents")) {
          const incidents = db.createObjectStore("incidents", { keyPath: "id" });
          incidents.createIndex("status", "status");
          incidents.createIndex("severity", "severity");
          incidents.createIndex("officer_id", "officer_id");
          incidents.createIndex("created_at", "created_at");
          incidents.createIndex("synced", "is_synced");
        }

        // Evidence store
        if (!db.objectStoreNames.contains("evidence")) {
          const evidence = db.createObjectStore("evidence", { keyPath: "id" });
          evidence.createIndex("incident_id", "incident_id");
        }

        // AI analyses store
        if (!db.objectStoreNames.contains("ai_analyses")) {
          const ai = db.createObjectStore("ai_analyses", { keyPath: "id" });
          ai.createIndex("incident_id", "incident_id");
        }

        // AI analysis jobs (queue)
        if (!db.objectStoreNames.contains("ai_analysis_jobs")) {
          const jobs = db.createObjectStore("ai_analysis_jobs", { keyPath: "id" });
          jobs.createIndex("incident_id", "incident_id");
          jobs.createIndex("status", "status");
        }

        // ANPR scan records
        if (!db.objectStoreNames.contains("anpr_scans")) {
          const scans = db.createObjectStore("anpr_scans", { keyPath: "id" });
          scans.createIndex("incident_id", "incident_id");
          scans.createIndex("normalized_plate", "normalized_plate");
        }

        // Violation types (cache)
        if (!db.objectStoreNames.contains("violation_types")) {
          db.createObjectStore("violation_types", { keyPath: "id" });
        }

        // Pending sync queue
        if (!db.objectStoreNames.contains("pending_sync")) {
          const sync = db.createObjectStore("pending_sync", {
            keyPath: "id",
            autoIncrement: true,
          });
          sync.createIndex("status", "status");
          sync.createIndex("table_name", "table_name");
          sync.createIndex("created_at", "created_at");
        }

        // Drafts (offline-written, not yet submitted)
        if (!db.objectStoreNames.contains("drafts")) {
          const drafts = db.createObjectStore("drafts", { keyPath: "id" });
          drafts.createIndex("type", "type");
          drafts.createIndex("updated_at", "updated_at");
        }

        // General cache store
        if (!db.objectStoreNames.contains("cache")) {
          const cache = db.createObjectStore("cache", { keyPath: "key" });
          cache.createIndex("expires_at", "expires_at");
        }

        // User profile cache
        if (!db.objectStoreNames.contains("user_profile")) {
          db.createObjectStore("user_profile", { keyPath: "id" });
        }
      },
    });
  }
  return dbPromise;
}

// ===== Generic CRUD Operations =====

export async function offlineGet<T>(store: OfflineStore, key: string): Promise<T | undefined> {
  const db = await getDB();
  return db.get(store, key) as Promise<T | undefined>;
}

export async function offlineSet<T>(store: OfflineStore, key: string, value: T): Promise<void> {
  const db = await getDB();
  await db.put(store, { ...value, id: key } as any);
}

export async function offlineDelete(store: OfflineStore, key: string): Promise<void> {
  const db = await getDB();
  await db.delete(store, key);
}

export async function offlineGetAll<T>(
  store: OfflineStore,
  indexName?: string,
  indexValue?: IDBValidKey
): Promise<T[]> {
  const db = await getDB();
  if (indexName && indexValue !== undefined) {
    return db.getAllFromIndex(store, indexName, indexValue) as Promise<T[]>;
  }
  return db.getAll(store) as Promise<T[]>;
}

export async function offlineClear(store: OfflineStore): Promise<void> {
  const db = await getDB();
  await db.clear(store);
}

export async function offlineCount(
  store: OfflineStore,
  indexName?: string,
  indexValue?: IDBValidKey
): Promise<number> {
  const db = await getDB();
  if (indexName && indexValue !== undefined) {
    return db.countFromIndex(store, indexName, indexValue);
  }
  return db.count(store);
}

// ===== Sync Queue Operations =====

export interface SyncQueueEntry {
  id?: number;
  tableName: string;
  recordId: string;
  operation: "create" | "update" | "delete";
  payload: any;
  status: "pending" | "syncing" | "completed" | "failed";
  errorMessage?: string;
  retryCount: number;
  createdAt: string;
  updatedAt: string;
}

export async function addToSyncQueue(entry: Omit<SyncQueueEntry, "id" | "status" | "retryCount" | "createdAt" | "updatedAt">): Promise<number> {
  const db = await getDB();
  const now = new Date().toISOString();
  const queueEntry = {
    tableName: entry.tableName,
    recordId: entry.recordId,
    operation: entry.operation,
    payload: entry.payload,
    status: "pending",
    retryCount: 0,
    createdAt: now,
    updatedAt: now,
  };
  return db.add("pending_sync", queueEntry) as Promise<number>;
}

export async function getPendingSyncQueue(): Promise<any[]> {
  const db = await getDB();
  return db.getAll("pending_sync");
}

export async function updateSyncStatus(
  id: number,
  status: "pending" | "syncing" | "completed" | "failed",
  errorMessage?: string
): Promise<void> {
  const db = await getDB();
  const entry = await db.get("pending_sync", id);
  if (entry) {
    entry.status = status;
    entry.updatedAt = new Date().toISOString();
    if (errorMessage) entry.errorMessage = errorMessage;
    if (status === "failed") entry.retryCount = (entry.retryCount || 0) + 1;
    await db.put("pending_sync", entry);
  }
}

export async function clearCompletedSync(): Promise<void> {
  const db = await getDB();
  const all = await db.getAll("pending_sync");
  for (const entry of all) {
    if (entry.status === "completed") {
      await db.delete("pending_sync", entry.id);
    }
  }
}

// ===== Drafts =====

export interface Draft {
  id: string;
  type: "incident" | "evidence" | "note";
  data: any;
  createdAt: string;
  updatedAt: string;
}

export async function saveDraft(draft: Omit<Draft, "createdAt" | "updatedAt">): Promise<void> {
  const db = await getDB();
  const existing = await db.get("drafts", draft.id);
  const now = new Date().toISOString();
  await db.put("drafts", {
    ...draft,
    createdAt: existing?.createdAt || now,
    updatedAt: now,
  });
}

export async function getDraft(id: string): Promise<Draft | undefined> {
  const db = await getDB();
  return db.get("drafts", id);
}

export async function getAllDrafts(type?: Draft["type"]): Promise<Draft[]> {
  const db = await getDB();
  if (type) {
    return db.getAllFromIndex("drafts", "type", type);
  }
  return db.getAll("drafts");
}

export async function deleteDraft(id: string): Promise<void> {
  const db = await getDB();
  await db.delete("drafts", id);
}

export async function clearAllDrafts(): Promise<void> {
  const db = await getDB();
  await db.clear("drafts");
}

// ===== Cache =====

export interface CacheEntry<T = any> {
  key: string;
  data: T;
  expiresAt: string;
}

export async function setCache<T>(key: string, data: T, ttlMinutes = 60): Promise<void> {
  const db = await getDB();
  const expiresAt = new Date(Date.now() + ttlMinutes * 60 * 1000).toISOString();
  await db.put("cache", { key, data, expiresAt });
}

export async function getCache<T>(key: string): Promise<T | null> {
  const db = await getDB();
  const entry = await db.get("cache", key);
  if (!entry) return null;
  if (new Date(entry.expiresAt) < new Date()) {
    await db.delete("cache", key);
    return null;
  }
  return entry.data as T;
}

export async function clearExpiredCache(): Promise<void> {
  const db = await getDB();
  const all = await db.getAll("cache");
  const now = new Date();
  for (const entry of all) {
    if (new Date(entry.expiresAt) < now) {
      await db.delete("cache", entry.id);
    }
  }
}

// ===== Network Management =====

let onlineListeners: Array<(online: boolean) => void> = [];

export function addOnlineListener(listener: (online: boolean) => void): () => void {
  onlineListeners.push(listener);
  return () => {
    onlineListeners = onlineListeners.filter((l) => l !== listener);
  };
}

export function isOnline(): boolean {
  return navigator.onLine;
}

// Global online/offline event listeners
if (typeof window !== "undefined") {
  window.addEventListener("online", () => {
    onlineListeners.forEach((l) => l(true));
  });
  window.addEventListener("offline", () => {
    onlineListeners.forEach((l) => l(false));
  });
}
