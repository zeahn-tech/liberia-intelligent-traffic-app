import { supabase } from "@/supabase/client";
import {
  getPendingSyncQueue,
  updateSyncStatus,
  clearCompletedSync,
  offlineSet,
  offlineGet,
  setCache,
} from "./offline";
import { getOnlineStatus } from "./network";

type SyncCallback = {
  onStart?: () => void;
  onProgress?: (current: number, total: number) => void;
  onComplete?: (synced: number, failed: number) => void;
  onError?: (error: Error) => void;
};

let isSyncing = false;
let syncCallbacks: SyncCallback[] = [];

export function onSync(callback: SyncCallback): () => void {
  syncCallbacks.push(callback);
  return () => {
    syncCallbacks = syncCallbacks.filter((c) => c !== callback);
  };
}

export function getSyncStatus(): { isSyncing: boolean } {
  return { isSyncing };
}

/**
 * Process the offline sync queue, sending pending operations to Supabase.
 */
export async function processSyncQueue(callbacks?: SyncCallback): Promise<{ synced: number; failed: number }> {
  if (isSyncing) return { synced: 0, failed: 0 };
  if (!navigator.onLine) return { synced: 0, failed: 0 };

  isSyncing = true;
  const allCallbacks: SyncCallback[] = [...syncCallbacks, ...(callbacks ? [callbacks] : [])];

  allCallbacks.forEach((cb) => cb.onStart?.());

  try {
    const queue = await getPendingSyncQueue();
    const pendingItems = queue.filter((item: any) => item.status === "pending" || item.status === "failed");
    const total = pendingItems.length;

    let synced = 0;
    let failed = 0;

    for (let i = 0; i < pendingItems.length; i++) {
      const item = pendingItems[i];

      allCallbacks.forEach((cb: SyncCallback) => cb.onProgress?.(i + 1, total));

      try {
        await updateSyncStatus(item.id, "syncing");

        switch (item.tableName) {
          case "incidents":
            await syncIncident(item);
            break;
          case "evidence":
            await syncEvidence(item);
            break;
          case "ai_analyses":
            await syncAIAnalysis(item);
            break;
          case "ai_analysis_jobs":
            await syncAIAnalysisJob(item);
            break;
          case "anpr_scans":
            await syncANPRScan(item);
            break;
          case "stolen_vehicles":
            await syncStolenVehicle(item);
            break;
          default:
            await syncGenericRecord(item);
        }

        await updateSyncStatus(item.id, "completed");
        synced++;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Unknown sync error";
        await updateSyncStatus(item.id, "failed", errorMessage);
        failed++;
      }
    }

    // Clean up completed entries
    await clearCompletedSync();

    allCallbacks.forEach((cb: SyncCallback) => cb.onComplete?.(synced, failed));

    return { synced, failed };
  } catch (err) {
    const error = err instanceof Error ? err : new Error("Sync process failed");
    allCallbacks.forEach((cb: SyncCallback) => cb.onError?.(error));
    throw error;
  } finally {
    isSyncing = false;
  }
}

// ===== Individual Sync Handlers =====

async function syncIncident(item: any): Promise<void> {
  const { recordId, operation, payload } = item;

  switch (operation) {
    case "create": {
      const { error } = await supabase.from("incidents").insert(payload);
      if (error) throw error;
      // Mark local record as synced
      const local = await offlineGet("incidents", recordId);
      if (local) {
        await offlineSet("incidents", recordId, { ...local, is_synced: true });
      }
      break;
    }
    case "update": {
      const { error } = await supabase
        .from("incidents")
        .update(payload)
        .eq("id", recordId);
      if (error) throw error;
      break;
    }
    case "delete": {
      const { error } = await supabase
        .from("incidents")
        .delete()
        .eq("id", recordId);
      if (error) throw error;
      break;
    }
  }
}

async function syncEvidence(item: any): Promise<void> {
  const { payload } = item;
  // Evidence with file uploads need special handling
  const client = supabase as any;
  const { error } = await client.from("evidence").insert(payload);
  if (error) throw error;
}

async function syncAIAnalysis(item: any): Promise<void> {
  const { recordId, operation, payload } = item;
  const client = supabase as any;

  switch (operation) {
    case "create": {
      const { error } = await client.from("ai_analyses").insert(payload);
      if (error) throw error;
      break;
    }
    case "update": {
      const { error } = await client
        .from("ai_analyses")
        .update(payload)
        .eq("id", recordId);
      if (error) throw error;
      break;
    }
    case "delete": {
      const { error } = await client
        .from("ai_analyses")
        .delete()
        .eq("id", recordId);
      if (error) throw error;
      break;
    }
  }
}

async function syncAIAnalysisJob(item: any): Promise<void> {
  const { recordId, operation, payload } = item;
  const client = supabase as any;

  switch (operation) {
    case "create": {
      const { error } = await client.from("ai_analysis_jobs").insert(payload);
      if (error) throw error;
      break;
    }
    case "update": {
      const { error } = await client
        .from("ai_analysis_jobs")
        .update(payload)
        .eq("id", recordId);
      if (error) throw error;
      break;
    }
  }
}

async function syncANPRScan(item: any): Promise<void> {
  const { recordId, operation, payload } = item;
  const client = supabase as any;

  switch (operation) {
    case "create": {
      const { error } = await client.from("anpr_scans").insert(payload);
      if (error) throw error;
      break;
    }
    case "update": {
      const { error } = await client
        .from("anpr_scans")
        .update(payload)
        .eq("id", recordId);
      if (error) throw error;
      break;
    }
  }
}

async function syncStolenVehicle(item: any): Promise<void> {
  const { recordId, operation, payload } = item;
  const client = supabase as any;

  switch (operation) {
    case "create": {
      const { error } = await client.from("stolen_vehicles").insert(payload);
      if (error) throw error;
      break;
    }
    case "update": {
      const { error } = await client
        .from("stolen_vehicles")
        .update(payload)
        .eq("id", recordId);
      if (error) throw error;
      break;
    }
    case "delete": {
      const { error } = await client
        .from("stolen_vehicles")
        .delete()
        .eq("id", recordId);
      if (error) throw error;
      break;
    }
  }
}

async function syncGenericRecord(item: any): Promise<void> {
  const { tableName, recordId, operation, payload } = item;
  const client = supabase as any;

  switch (operation) {
    case "create": {
      const { error } = await client.from(tableName).insert(payload);
      if (error) throw error;
      break;
    }
    case "update": {
      const { error } = await client.from(tableName).update(payload).eq("id", recordId);
      if (error) throw error;
      break;
    }
    case "delete": {
      const { error } = await client.from(tableName).delete().eq("id", recordId);
      if (error) throw error;
      break;
    }
  }
}

// ===== Automatic Sync on Reconnect =====

let autoSyncInitialized = false;

export function initAutoSync() {
  if (autoSyncInitialized) return;
  autoSyncInitialized = true;

  window.addEventListener("online", () => {
    // Delay slightly to let connection stabilize
    setTimeout(() => {
      processSyncQueue().catch(console.error);
    }, 2000);
  });
}
