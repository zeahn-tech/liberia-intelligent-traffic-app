import { describe, it, expect, afterAll } from "vitest";
import {
  offlineGet,
  offlineSet,
  offlineDelete,
  offlineGetAll,
  offlineClear,
  offlineCount,
  addToSyncQueue,
  getPendingSyncQueue,
  updateSyncStatus,
  clearCompletedSync,
  saveDraft,
  getDraft,
  getAllDrafts,
  deleteDraft,
  clearAllDrafts,
  setCache,
  getCache,
} from "@/lib/offline";

describe("Offline Storage", () => {
  // ── Generic CRUD (using 'drafts' store with keyPath "id") ─
  describe("CRUD operations", () => {
    afterAll(async () => {
      await offlineClear("drafts");
    });

    it("sets and gets a value", async () => {
      await offlineSet("drafts", "test-key", { id: "test-key", name: "test", value: 123 });
// eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = await offlineGet<any>("drafts", "test-key");
      expect(result).toBeDefined();
      expect(result.name).toBe("test");
      expect(result.value).toBe(123);
    });

    it("returns undefined for missing key", async () => {
      const result = await offlineGet("drafts", "nonexistent-key");
      expect(result).toBeUndefined();
    });

    it("deletes a value", async () => {
      await offlineSet("drafts", "delete-test", { id: "delete-test", data: "to-delete" });
      await offlineDelete("drafts", "delete-test");
      const result = await offlineGet("drafts", "delete-test");
      expect(result).toBeUndefined();
    });

    it("gets all values from a store", async () => {
      await offlineClear("drafts");
      await offlineSet("drafts", "a", { id: "a", type: "incident", data: {} });
      await offlineSet("drafts", "b", { id: "b", type: "incident", data: {} });
      const all = await offlineGetAll("drafts");
      expect(all.length).toBe(2);
    });

    it("counts records in a store", async () => {
      await offlineClear("drafts");
      await offlineSet("drafts", "c1", { id: "c1", type: "incident", data: {} });
      await offlineSet("drafts", "c2", { id: "c2", type: "incident", data: {} });
      await offlineSet("drafts", "c3", { id: "c3", type: "incident", data: {} });
      const count = await offlineCount("drafts");
      expect(count).toBe(3);
    });

    it("clears all records from a store", async () => {
      await offlineSet("drafts", "x", { id: "x", type: "note", data: {} });
      await offlineClear("drafts");
      const count = await offlineCount("drafts");
      expect(count).toBe(0);
    });
  });

  // ── Sync Queue ──────────────────────────────────
  describe("Sync Queue", () => {
    afterAll(async () => {
      await offlineClear("pending_sync");
    });

    it("adds an entry to the sync queue", async () => {
      const id = await addToSyncQueue({
        tableName: "incidents",
        recordId: "test-inc-001",
        operation: "create",
        payload: { title: "Test Incident" },
      });
      expect(id).toBeGreaterThan(0);
    });

    it("retrieves pending sync entries", async () => {
      await offlineClear("pending_sync");
      await addToSyncQueue({
        tableName: "incidents",
        recordId: "test-inc-002",
        operation: "update",
        payload: { status: "resolved" },
      });
      const queue = await getPendingSyncQueue();
      expect(queue.length).toBeGreaterThanOrEqual(1);
      expect(queue[0].tableName).toBe("incidents");
      expect(queue[0].status).toBe("pending");
    });

    it("updates sync entry status", async () => {
      await offlineClear("pending_sync");
      const id = await addToSyncQueue({
        tableName: "evidence",
        recordId: "ev-001",
        operation: "create",
        payload: { file: "photo.jpg" },
      });
      await updateSyncStatus(id, "completed");
      const queue = await getPendingSyncQueue();
// eslint-disable-next-line @typescript-eslint/no-explicit-any
      const entry = queue.find((e: any) => e.id === id);
      expect(entry).toBeDefined();
      expect(entry!.status).toBe("completed");
    });

    it("clears completed sync entries", async () => {
      await offlineClear("pending_sync");
      const id1 = await addToSyncQueue({
        tableName: "test", recordId: "t1", operation: "create", payload: {},
      });
      const id2 = await addToSyncQueue({
        tableName: "test", recordId: "t2", operation: "create", payload: {},
      });
      await updateSyncStatus(id1, "completed");
      await clearCompletedSync();
      const queue = await getPendingSyncQueue();
// eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect(queue.find((e: any) => e.id === id1)).toBeUndefined();
// eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect(queue.find((e: any) => e.id === id2)).toBeDefined();
    });
  });

  // ── Drafts ──────────────────────────────────────
  describe("Drafts", () => {
    afterAll(async () => {
      await clearAllDrafts();
    });

    it("saves a draft", async () => {
      await saveDraft({
        id: "draft-001",
        type: "incident",
        data: { title: "Draft Incident", description: "Work in progress" },
      });
      const draft = await getDraft("draft-001");
      expect(draft).toBeDefined();
      expect(draft?.type).toBe("incident");
      expect(draft?.data.title).toBe("Draft Incident");
    });

    it("updates an existing draft", async () => {
      await saveDraft({
        id: "draft-001",
        type: "incident",
        data: { title: "Updated Draft" },
      });
      const draft = await getDraft("draft-001");
      expect(draft?.data.title).toBe("Updated Draft");
    });

    it("retrieves all drafts filtered by type", async () => {
      await clearAllDrafts();
      await saveDraft({ id: "d1", type: "incident", data: {} });
      await saveDraft({ id: "d2", type: "evidence", data: {} });
      await saveDraft({ id: "d3", type: "incident", data: {} });
      const incidents = await getAllDrafts("incident");
      expect(incidents.length).toBe(2);
    });

    it("deletes a draft", async () => {
      await saveDraft({ id: "draft-to-delete", type: "note", data: {} });
      await deleteDraft("draft-to-delete");
      const draft = await getDraft("draft-to-delete");
      expect(draft).toBeUndefined();
    });

    it("clears all drafts", async () => {
      await saveDraft({ id: "clear-1", type: "incident", data: {} });
      await saveDraft({ id: "clear-2", type: "incident", data: {} });
      await clearAllDrafts();
      const all = await getAllDrafts();
      expect(all.length).toBe(0);
    });
  });

  // ── Cache ────────────────────────────────────────
  describe("Cache", () => {
    afterAll(async () => {
      await offlineClear("cache");
    });

    it("sets and gets a cached value", async () => {
      await setCache("route-data", { incidents: [1, 2, 3] }, 60);
// eslint-disable-next-line @typescript-eslint/no-explicit-any
      const cached = await getCache<any>("route-data");
      expect(cached).toBeDefined();
      expect(cached.incidents).toEqual([1, 2, 3]);
    });

    it("returns null for expired cache", async () => {
      await setCache("expired-key", "data", 0);
      await new Promise((r) => setTimeout(r, 10));
      const result = await getCache("expired-key");
      expect(result).toBeNull();
    });

    it("returns null for missing cache", async () => {
      const result = await getCache("missing-key");
      expect(result).toBeNull();
    });
  });
});
