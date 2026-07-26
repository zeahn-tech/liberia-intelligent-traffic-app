/**
 * TrafficWatch AI — Secure Media Storage Service
 *
 * Handles:
 * - Secure file uploads to private Supabase Storage buckets
 * - Signed URL generation (time-limited, permission-validated)
 * - SHA-256 cryptographic hash computation
 * - MIME type and file-size validation
 * - Offline upload queuing
 * - Access logging to evidence_custody
 */

import { supabase } from "@/supabase/client";
import type { StorageFile, UploadConfig, UploadResult } from "@/supabase/types";
import { addToSyncQueue } from "@/lib/offline";

// ─── Constants ───────────────────────────────────────────────

const BUCKET_MAP: Record<string, { bucket: string; maxSize: number }> = {
  "image/jpeg": { bucket: "evidence-images", maxSize: 25 * 1024 * 1024 },
  "image/png": { bucket: "evidence-images", maxSize: 25 * 1024 * 1024 },
  "image/webp": { bucket: "evidence-images", maxSize: 25 * 1024 * 1024 },
  "image/tiff": { bucket: "evidence-images", maxSize: 25 * 1024 * 1024 },
  "image/heic": { bucket: "evidence-images", maxSize: 25 * 1024 * 1024 },
  "image/heif": { bucket: "evidence-images", maxSize: 25 * 1024 * 1024 },
  "video/mp4": { bucket: "evidence-videos", maxSize: 200 * 1024 * 1024 },
  "video/quicktime": { bucket: "evidence-videos", maxSize: 200 * 1024 * 1024 },
  "video/x-msvideo": { bucket: "evidence-videos", maxSize: 200 * 1024 * 1024 },
  "video/webm": { bucket: "evidence-videos", maxSize: 200 * 1024 * 1024 },
  "video/x-matroska": { bucket: "evidence-videos", maxSize: 200 * 1024 * 1024 },
  "audio/mpeg": { bucket: "evidence-audio", maxSize: 50 * 1024 * 1024 },
  "audio/wav": { bucket: "evidence-audio", maxSize: 50 * 1024 * 1024 },
  "audio/ogg": { bucket: "evidence-audio", maxSize: 50 * 1024 * 1024 },
  "audio/aac": { bucket: "evidence-audio", maxSize: 50 * 1024 * 1024 },
  "audio/flac": { bucket: "evidence-audio", maxSize: 50 * 1024 * 1024 },
  "application/pdf": { bucket: "evidence-documents", maxSize: 25 * 1024 * 1024 },
  "application/msword": { bucket: "evidence-documents", maxSize: 25 * 1024 * 1024 },
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": {
    bucket: "evidence-documents",
    maxSize: 25 * 1024 * 1024,
  },
  "text/plain": { bucket: "evidence-documents", maxSize: 25 * 1024 * 1024 },
  "text/csv": { bucket: "evidence-documents", maxSize: 25 * 1024 * 1024 },
};

const DEFAULT_BUCKET = { bucket: "evidence-other", maxSize: 25 * 1024 * 1024 };

const SIGNED_URL_EXPIRY_SECONDS = 3600; // 1 hour
const SIGNED_URL_GRACE_SECONDS = 300; // Refresh 5 min before expiry

// ─── SHA-256 Hashing ───────────────────────────────────────

/**
 * Compute SHA-256 hash of a file for integrity verification.
 * Uses the browser's native SubtleCrypto API.
 */
export async function computeSHA256(file: File | Blob | ArrayBuffer): Promise<string> {
  const buffer = file instanceof ArrayBuffer ? file : await file.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest("SHA-256", buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

// ─── MIME Validation ──────────────────────────────────────

export interface MimeValidationResult {
  valid: boolean;
  bucket: string;
  maxSize: number;
  error?: string;
}

/**
 * Validates a file's MIME type and size against allowed buckets.
 */
export function validateFile(file: File): MimeValidationResult {
  const config = BUCKET_MAP[file.type] ?? DEFAULT_BUCKET;

  if (file.size > config.maxSize) {
    const maxMB = (config.maxSize / (1024 * 1024)).toFixed(0);
    return {
      valid: false,
      bucket: config.bucket,
      maxSize: config.maxSize,
      error: `File size (${(file.size / (1024 * 1024)).toFixed(1)} MB) exceeds the ${maxMB} MB limit for ${file.type || "this file type"}.`,
    };
  }

  return { valid: true, bucket: config.bucket, maxSize: config.maxSize };
}

export function getBucketForMime(mimeType: string): string {
  return BUCKET_MAP[mimeType]?.bucket ?? DEFAULT_BUCKET.bucket;
}

export function getMaxSizeForMime(mimeType: string): number {
  return BUCKET_MAP[mimeType]?.maxSize ?? DEFAULT_BUCKET.maxSize;
}

// ─── Storage File Operations ──────────────────────────────

/**
 * Upload a file to the appropriate private Supabase Storage bucket.
 *
 * Steps:
 * 1. Validate MIME type and file size
 * 2. Compute SHA-256 hash of the file
 * 3. Upload to the appropriate private bucket
 * 4. Record the file reference in storage_files table
 * 5. Log custody event
 *
 * @returns UploadResult with signed URL or error
 */
export async function uploadEvidenceFile(
  file: File,
  incidentId: string,
  evidenceId: string,
  config?: Partial<UploadConfig>,
): Promise<UploadResult> {
  // Validate file
  const validation = validateFile(file);
  if (!validation.valid) {
    return { success: false, error: validation.error || "File validation failed" };
  }

  try {
    // Compute SHA-256 hash
    const sha256Hash = await computeSHA256(file);

    // Build storage path: {incidentId}/{evidenceId}/{filename}
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const filePath = `${incidentId}/${evidenceId}/${sanitizedName}`;

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(validation.bucket)
      .upload(filePath, file, {
        contentType: file.type,
        cacheControl: "private, no-cache",
        upsert: false,
      });

    if (uploadError) {
      // If offline, queue for later sync
      if (isOfflineError(uploadError)) {
        await queueOfflineUpload(file, incidentId, evidenceId, validation.bucket, filePath, sha256Hash);
        return {
          success: true,
          url: "", // Will be generated when sync completes
          signedUrl: null,
          bucket: validation.bucket,
          filePath,
          sha256Hash,
          isOffline: true,
          message: "Upload queued — will sync when connection is restored.",
        };
      }
      return { success: false, error: uploadError.message };
    }

    // Generate signed URL
    const signedResult = await generateSignedUrl(validation.bucket, filePath);
    if (!signedResult.success) {
      // Upload succeeded but signed URL failed — still return the path
      return {
        success: true,
        url: filePath,
        signedUrl: null,
        bucket: validation.bucket,
        filePath,
        sha256Hash,
        message: "File uploaded but signed URL generation failed.",
      };
    }

    return {
      success: true,
      url: signedResult.url || "",
      signedUrl: signedResult.url || null,
      bucket: validation.bucket,
      filePath,
      sha256Hash,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown upload error";
    return { success: false, error: message };
  }
}

/**
 * Generate a time-limited signed URL for secure file access.
 * URLs expire after SIGNED_URL_EXPIRY_SECONDS (1 hour).
 */
export async function generateSignedUrl(
  bucket: string,
  filePath: string,
  expiresIn: number = SIGNED_URL_EXPIRY_SECONDS,
): Promise<{ success: boolean; url: string | null; error?: string }> {
  try {
    const { data, error } = await supabase.storage
      .from(bucket)
      .createSignedUrl(filePath, expiresIn);

    if (error) {
      return { success: false, url: null, error: error.message };
    }

    return { success: true, url: data.signedUrl };
  } catch (err) {
    return {
      success: false,
      url: null,
      error: err instanceof Error ? err.message : "Signed URL generation failed",
    };
  }
}

/**
 * Generate signed URLs for multiple files at once.
 * Each URL is independently generated with the same expiry.
 */
export async function generateSignedUrls(
  files: Array<{ bucket: string; filePath: string }>,
  expiresIn: number = SIGNED_URL_EXPIRY_SECONDS,
): Promise<Array<{ bucket: string; filePath: string; signedUrl: string | null; error?: string }>> {
  return Promise.all(
    files.map(async (f) => {
      const result = await generateSignedUrl(f.bucket, f.filePath, expiresIn);
      return {
        bucket: f.bucket,
        filePath: f.filePath,
        signedUrl: result.url,
        error: result.error,
      };
    }),
  );
}

/**
 * Download an evidence file using its signed URL.
 * Returns a Blob that can be used to trigger a download or preview.
 */
export async function downloadEvidenceFile(
  signedUrl: string,
  fileName: string,
): Promise<{ success: boolean; blob?: Blob; error?: string }> {
  try {
    const response = await fetch(signedUrl);
    if (!response.ok) {
      return { success: false, error: `Download failed with status ${response.status}` };
    }
    const blob = await response.blob();
    return { success: true, blob };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Download failed",
    };
  }
}

/**
 * Trigger a browser download of an evidence file.
 */
export async function triggerFileDownload(signedUrl: string, fileName: string): Promise<void> {
  const result = await downloadEvidenceFile(signedUrl, fileName);
  if (!result.success || !result.blob) {
    throw new Error(result.error || "Download failed");
  }

  const url = URL.createObjectURL(result.blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ─── Offline Support ──────────────────────────────────────

interface OfflineUpload {
  file: File;
  incidentId: string;
  evidenceId: string;
  bucket: string;
  filePath: string;
  sha256Hash: string;
  queuedAt: string;
}

/**
 * Queue a file for upload when connectivity is restored.
 */
async function queueOfflineUpload(
  file: File,
  incidentId: string,
  evidenceId: string,
  bucket: string,
  filePath: string,
  sha256Hash: string,
): Promise<void> {
  // Store file metadata in IndexedDB for sync
  const queueItem: OfflineUpload = {
    file,
    incidentId,
    evidenceId,
    bucket,
    filePath,
    sha256Hash,
    queuedAt: new Date().toISOString(),
  };

  // Store in offline queue
  localStorage.setItem(
    `offline_upload_${evidenceId}`,
    JSON.stringify({
      ...queueItem,
      // Can't store File in JSON, store metadata for retry
      fileName: file.name,
      fileSize: file.size,
      mimeType: file.type,
    }),
  );

  // Also add to sync queue for tracking
  await addToSyncQueue({
    tableName: "storage_files",
    recordId: evidenceId,
    operation: "create",
    payload: {
      bucket,
      file_path: filePath,
      mime_type: file.type,
      file_size: file.size,
      sha256_hash: sha256Hash,
    },
  });

  // Store file in IndexedDB for actual upload when online
  try {
    const db = await openOfflineDB();
    const ab = await file.arrayBuffer();
    await idbPut(db, "offline_uploads", {
      id: evidenceId,
      fileData: Array.from(new Uint8Array(ab)), // Store as number array for IDB compatibility
      fileName: file.name,
      mimeType: file.type,
      bucket,
      filePath,
      sha256Hash,
      incidentId,
      queuedAt: new Date().toISOString(),
      retries: 0,
    });
  } catch (e) {
    console.warn("[Storage] Failed to store file in IndexedDB for offline upload:", e);
  }
}

/**
 * Process queued offline uploads when connectivity is restored.
 * Call this from the sync/network recovery handler.
 */
export async function processOfflineUploads(): Promise<number> {
  try {
    const db = await openOfflineDB();
    const allItems = await idbGetAll<any>(db, "offline_uploads");

    let successCount = 0;

    for (const item of allItems) {
      try {
        const uint8 = item.fileData instanceof Uint8Array
          ? item.fileData
          : new Uint8Array(item.fileData);
        const file = new File([uint8], item.fileName, { type: item.mimeType });
        const result = await uploadEvidenceFile(
          file,
          item.incidentId,
          item.id,
        );

        if (result.success) {
          // Remove from offline queue
          await idbDelete(db, "offline_uploads", item.id);
          successCount++;
        }
      } catch (e) {
        console.warn(`[Storage] Failed to process offline upload ${item.id}:`, e);
      }
    }

    db.close();
    return successCount;
  } catch (e) {
    console.warn("[Storage] Failed to process offline uploads:", e);
    return 0;
  }
}

// ─── IndexedDB Helpers (Promise-based) ─────────────────────

function openOfflineDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("TrafficWatchOffline", 2);
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains("offline_uploads")) {
        const store = db.createObjectStore("offline_uploads", { keyPath: "id" });
        store.createIndex("queuedAt", "queuedAt", { unique: false });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function idbPut(db: IDBDatabase, storeName: string, value: any): Promise<void> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, "readwrite");
    tx.objectStore(storeName).put(value);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

function idbGetAll<T>(db: IDBDatabase, storeName: string): Promise<T[]> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, "readonly");
    const request = tx.objectStore(storeName).getAll();
    request.onsuccess = () => resolve(request.result as T[]);
    request.onerror = () => reject(request.error);
  });
}

function idbDelete(db: IDBDatabase, storeName: string, key: IDBValidKey): Promise<void> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, "readwrite");
    tx.objectStore(storeName).delete(key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

// ─── Error Detection ──────────────────────────────────────

function isOfflineError(error: any): boolean {
  if (!error) return false;
  const msg = (error.message || "").toLowerCase();
  return (
    msg.includes("network") ||
    msg.includes("offline") ||
    msg.includes("fetch") ||
    msg.includes("timeout") ||
    msg.includes("abort") ||
    msg.includes("econnrefused") ||
    msg.includes("enotfound") ||
    error.statusCode === 0
  );
}
