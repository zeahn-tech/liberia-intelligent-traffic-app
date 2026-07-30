import { useState, useRef, useCallback, type ChangeEvent, type DragEvent } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
// eslint-disable-next-line @typescript-eslint/no-unused-vars
  Upload,
  X,
  File,
  Image,
  Video,
  Music,
  FileText,
// eslint-disable-next-line @typescript-eslint/no-unused-vars
  Shield,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Lock,
  WifiOff,
// eslint-disable-next-line @typescript-eslint/no-unused-vars
  RefreshCw,
  Maximize2,
// eslint-disable-next-line @typescript-eslint/no-unused-vars
  Ruler,
  Clock,
} from "lucide-react";
import {
  validateFile,
  computeSHA256,
// eslint-disable-next-line @typescript-eslint/no-unused-vars
  getBucketForMime,
  uploadEvidenceFile,
// eslint-disable-next-line @typescript-eslint/no-unused-vars
  extractFileMetadata,
// eslint-disable-next-line @typescript-eslint/no-unused-vars
  getAllAcceptedMimeTypes,
// eslint-disable-next-line @typescript-eslint/no-unused-vars
  getSizeLimitLabel,
  type FileMetadata,
} from "@/lib/storage";

// ─── Constants ───────────────────────────────────────────────

const MAX_DISPLAY_FILES = 50;
const HASH_PREVIEW_LENGTH = 16;

const FILE_TYPE_ICONS: Record<string, React.ReactNode> = {
  "image/jpeg": <Image className="w-8 h-8 text-blue-400" />,
  "image/png": <Image className="w-8 h-8 text-blue-400" />,
  "image/webp": <Image className="w-8 h-8 text-blue-400" />,
  "video/mp4": <Video className="w-8 h-8 text-purple-400" />,
  "video/quicktime": <Video className="w-8 h-8 text-purple-400" />,
  "video/webm": <Video className="w-8 h-8 text-purple-400" />,
  "audio/mpeg": <Music className="w-8 h-8 text-amber-400" />,
  "audio/wav": <Music className="w-8 h-8 text-amber-400" />,
  "application/pdf": <FileText className="w-8 h-8 text-red-400" />,
};

const FILE_TYPE_BG: Record<string, string> = {
  "image/jpeg": "from-blue-500/10 to-blue-600/5",
  "image/png": "from-blue-500/10 to-blue-600/5",
  "image/webp": "from-blue-500/10 to-blue-600/5",
  "video/mp4": "from-purple-500/10 to-purple-600/5",
  "video/quicktime": "from-purple-500/10 to-purple-600/5",
  "video/webm": "from-purple-500/10 to-purple-600/5",
  "audio/mpeg": "from-amber-500/10 to-amber-600/5",
  "audio/wav": "from-amber-500/10 to-amber-600/5",
  "application/pdf": "from-red-500/10 to-red-600/5",
};

// ─── Types ──────────────────────────────────────────────────

export interface FileItem {
  id: string;
  file: File;
  status: "pending" | "validating" | "uploading" | "completed" | "error";
  progress: number;
  error?: string;
  sha256Hash?: string;
  bucket?: string;
  evidenceId?: string;
  /** Whether the upload was queued for offline sync */
  isOffline?: boolean;
  /** Upload verification status */
  verificationStatus?: "verified" | "warning" | "unverified";
  /** Extracted file metadata */
  metadata?: FileMetadata;
  /** Number of retry attempts */
  retryCount?: number;
}

export interface EvidenceUploadProps {
  incidentId: string;
  onUploadComplete?: (results: Array<{ file: File; evidenceId: string; sha256Hash: string; bucket: string }>) => void;
  maxFiles?: number;
  className?: string;
}

// ─── Component ─────────────────────────────────────────────

export function EvidenceUpload({
  incidentId,
  onUploadComplete,
  maxFiles = 20,
  className = "",
}: EvidenceUploadProps) {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadingCount, setUploadingCount] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const addFiles = useCallback(
    (newFiles: FileList | File[]) => {
      const remaining = maxFiles - files.length;
      if (remaining <= 0) return;

      const toAdd = Array.from(newFiles).slice(0, remaining);
      const items: FileItem[] = toAdd.map((file) => ({
        id: crypto.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`,
        file,
        status: "pending" as const,
        progress: 0,
      }));

      setFiles((prev) => [...prev, ...items]);
    },
    [files.length, maxFiles],
  );

  const removeFile = useCallback((id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  }, []);

  const clearAll = useCallback(() => {
    setFiles([]);
  }, []);

  // ── Drag & Drop handlers ──────────────────────────────────

  const handleDragOver = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback(
    (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragOver(false);
      if (e.dataTransfer.files) {
        addFiles(e.dataTransfer.files);
      }
    },
    [addFiles],
  );

  const handleFileInput = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      if (e.target.files) {
        addFiles(e.target.files);
        e.target.value = "";
      }
    },
    [addFiles],
  );

  // ── Upload Logic ──────────────────────────────────────────

  const uploadAll = useCallback(async () => {
    const pending = files.filter((f) => f.status === "pending" || f.status === "error");
    if (pending.length === 0) return;

    setUploadingCount(pending.length);
    const completed: Array<{ file: File; evidenceId: string; sha256Hash: string; bucket: string }> = [];

    for (const item of pending) {
      // Validate
      setFiles((prev) =>
        prev.map((f) => (f.id === item.id ? { ...f, status: "validating" as const, progress: 10 } : f)),
      );

      const validation = validateFile(item.file);
      if (!validation.valid) {
        setFiles((prev) =>
          prev.map((f) =>
            f.id === item.id ? { ...f, status: "error" as const, error: validation.error, progress: 0 } : f,
          ),
        );
        continue;
      }

      // Hash
      let hash = "";
      try {
        hash = await computeSHA256(item.file);
        setFiles((prev) =>
          prev.map((f) => (f.id === item.id ? { ...f, sha256Hash: hash, progress: 30 } : f)),
        );
// eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (err) {
        setFiles((prev) =>
          prev.map((f) =>
            f.id === item.id
              ? { ...f, status: "error" as const, error: "Failed to compute file hash", progress: 0 }
              : f,
          ),
        );
        continue;
      }

      // Upload
      setFiles((prev) =>
        prev.map((f) => (f.id === item.id ? { ...f, status: "uploading" as const, progress: 50 } : f)),
      );

      const tempEvidenceId = crypto.randomUUID?.() || `${Date.now()}-ev-${Math.random().toString(36).slice(2, 8)}`;

      try {
        const result = await uploadEvidenceFile(item.file, incidentId, tempEvidenceId);
        if (result.success) {
          setFiles((prev) =>
            prev.map((f) =>
              f.id === item.id
                ? {
                    ...f,
// eslint-disable-next-line @typescript-eslint/no-explicit-any
                    status: (result.isOffline ? "uploading" : "completed") as any,
                    progress: result.isOffline ? 90 : 100,
                    bucket: result.bucket,
                    evidenceId: tempEvidenceId,
                    isOffline: result.isOffline,
                    verificationStatus: result.verificationStatus,
                    metadata: result.metadata,
                  }
                : f,
            ),
          );
          if (!result.isOffline) {
            completed.push({
              file: item.file,
              evidenceId: result.filePath || tempEvidenceId,
              sha256Hash: result.sha256Hash || hash,
              bucket: result.bucket || validation.bucket,
            });
          }
        } else {
          setFiles((prev) =>
            prev.map((f) =>
              f.id === item.id
                ? { ...f, status: "error" as const, error: result.error || "Upload failed", progress: 0, retryCount: (f.retryCount || 0) + 1 }
                : f,
            ),
          );
        }
      } catch (err) {
        setFiles((prev) =>
          prev.map((f) =>
            f.id === item.id
              ? { ...f, status: "error" as const, error: err instanceof Error ? err.message : "Upload failed", progress: 0, retryCount: (f.retryCount || 0) + 1 }
              : f,
          ),
        );
      }
    }

    setUploadingCount(0);
    if (completed.length > 0 && onUploadComplete) {
      onUploadComplete(completed);
    }
  }, [files, incidentId, onUploadComplete]);

  // ── Render ───────────────────────────────────────────────

  const pendingCount = files.filter((f) => f.status === "pending" || f.status === "validating" || f.status === "uploading").length;
  const completedCount = files.filter((f) => f.status === "completed").length;
  const errorCount = files.filter((f) => f.status === "error").length;

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Drop zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`
          relative cursor-pointer rounded-2xl border-2 border-dashed p-8 text-center transition-all
          ${isDragOver
            ? "border-primary bg-primary/5 shadow-lg shadow-primary/10"
            : "border-border/50 hover:border-primary/40 hover:bg-muted/30"
          }
          ${files.length > 0 ? "pb-4" : ""}
        `}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/jpeg,image/png,image/webp,image/tiff,video/mp4,video/quicktime,video/webm,video/x-msvideo,audio/mpeg,audio/wav,audio/ogg,application/pdf,application/msword,text/plain,text/csv"
          className="hidden"
          onChange={handleFileInput}
        />

        <div className="flex flex-col items-center gap-3">
          <div className="rounded-full bg-primary/10 p-4 clay-circle">
            <Lock className="w-6 h-6 text-primary" />
          </div>
          <div>
            <p className="text-sm font-medium">
              {isDragOver ? "Drop files to upload securely" : "Drag & drop evidence files here"}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              or click to browse — Images, videos, audio, documents accepted
            </p>
          </div>
          <div className="flex flex-wrap justify-center gap-2 mt-1">
            {["Images (25 MB)", "Videos (200 MB)", "Audio (50 MB)", "Docs (25 MB)"].map((label) => (
              <Badge key={label} variant="outline" className="text-[9px] px-2 py-0 clay-pill">
                {label}
              </Badge>
            ))}
          </div>
        </div>
      </div>

      {/* File list */}
      {files.length > 0 && (
        <Card className="clay-card !rounded-2xl overflow-hidden">
          <CardContent className="p-0">
            <div className="flex items-center justify-between px-4 py-2 border-b border-border/50 bg-muted/20">
              <p className="text-xs font-medium text-muted-foreground">
                {files.length} file{files.length !== 1 ? "s" : ""} selected
                {pendingCount > 0 && ` (${pendingCount} pending)`}
                {completedCount > 0 && ` · ${completedCount} uploaded`}
                {errorCount > 0 && ` · ${errorCount} failed`}
              </p>
              <div className="flex gap-2">
                {pendingCount === 0 && completedCount > 0 && (
                  <Button variant="ghost" size="sm" className="h-7 text-xs clay-btn-ghost" onClick={clearAll}>
                    Clear
                  </Button>
                )}
              </div>
            </div>

            <div className="max-h-64 overflow-y-auto divide-y divide-border/30">
              {files.slice(0, MAX_DISPLAY_FILES).map((item) => (
                <div key={item.id} className="flex items-center gap-3 px-4 py-2.5 group hover:bg-muted/20 transition-colors">
                  {/* File icon */}
                  <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${FILE_TYPE_BG[item.file.type] || "from-secondary/50 to-secondary/20"} flex items-center justify-center shrink-0`}>
                    {FILE_TYPE_ICONS[item.file.type] || <File className="w-5 h-5 text-muted-foreground" />}
                  </div>

                  {/* File info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium truncate">{item.file.name}</p>
                    <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                      <span className="text-[10px] text-muted-foreground">
                        {(item.file.size / 1024).toFixed(0)} KB
                      </span>
                      {item.sha256Hash && (
                        <span className="text-[9px] text-muted-foreground font-mono" title={item.sha256Hash}>
                          SHA-256: {item.sha256Hash.slice(0, HASH_PREVIEW_LENGTH)}...
                        </span>
                      )}
                      {item.status === "completed" && item.bucket && (
                        <Badge variant="outline" className="text-[8px] px-1 py-0 h-3.5 clay-pill">
                          {item.bucket.replace("evidence-", "")}
                        </Badge>
                      )}
                      {/* Verification status badge */}
                      {item.status === "completed" && item.verificationStatus === "verified" && (
                        <Badge variant="outline" className="text-[8px] px-1 py-0 h-3.5 bg-emerald-500/10 text-emerald-500 border-emerald-500/20 clay-pill">
                          <CheckCircle2 className="w-2 h-2 mr-0.5" />
                          Verified
                        </Badge>
                      )}
                      {item.status === "completed" && item.verificationStatus === "warning" && (
                        <Badge variant="outline" className="text-[8px] px-1 py-0 h-3.5 bg-amber-500/10 text-amber-500 border-amber-500/20 clay-pill">
                          <AlertCircle className="w-2 h-2 mr-0.5" />
                          Unverified
                        </Badge>
                      )}
                      {/* Offline badge */}
                      {item.isOffline && (
                        <Badge variant="outline" className="text-[8px] px-1 py-0 h-3.5 bg-amber-500/10 text-amber-500 border-amber-500/20 clay-pill">
                          <WifiOff className="w-2 h-2 mr-0.5" />
                          Queued Offline
                        </Badge>
                      )}
                      {/* Image dimensions */}
                      {item.metadata?.width && item.metadata?.height && (
                        <span className="text-[9px] text-muted-foreground flex items-center gap-0.5">
                          <Maximize2 className="w-2 h-2" />
                          {item.metadata.width}×{item.metadata.height}
                        </span>
                      )}
                      {/* Estimated duration */}
                      {item.metadata?.duration && (
                        <span className="text-[9px] text-muted-foreground flex items-center gap-0.5">
                          <Clock className="w-2 h-2" />
                          ~{item.metadata.duration > 60
                            ? `${Math.floor(item.metadata.duration / 60)}m ${item.metadata.duration % 60}s`
                            : `${item.metadata.duration}s`}
                        </span>
                      )}
                      {/* Retry count badge */}
                      {item.status === "error" && item.retryCount && item.retryCount > 0 && (
                        <span className="text-[9px] text-destructive">
                          Retry {item.retryCount}
                        </span>
                      )}
                    </div>
                    {/* Progress bar */}
                    {(item.status === "validating" || item.status === "uploading") && !item.isOffline && (
                      <Progress value={item.progress} className="h-1 mt-1.5" />
                    )}
                    {/* Offline queue progress */}
                    {item.isOffline && (
                      <div className="flex items-center gap-1.5 mt-1">
                        <Progress value={90} className="h-1 flex-1 bg-amber-500/20" />
                        <span className="text-[8px] text-amber-500 font-medium">Queued</span>
                      </div>
                    )}
                    {/* Error message */}
                    {item.status === "error" && item.error && (
                      <p className="text-[10px] text-destructive mt-0.5">{item.error}</p>
                    )}
                  </div>

                  {/* Status icon */}
                  <div className="flex items-center gap-1 shrink-0">
                    {item.status === "validating" && <Loader2 className="w-4 h-4 text-muted-foreground animate-spin" />}
                    {item.status === "uploading" && (
                      <div className="flex items-center gap-1">
                        <Loader2 className="w-3.5 h-3.5 text-primary animate-spin" />
                        <span className="text-[10px] text-muted-foreground">{item.progress}%</span>
                      </div>
                    )}
                    {item.status === "completed" && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
                    {item.status === "error" && <AlertCircle className="w-4 h-4 text-destructive" />}
                    {(item.status === "pending" || item.status === "error") && (
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        className="opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6"
                        onClick={() => removeFile(item.id)}
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Upload button */}
            {pendingCount > 0 && (
              <div className="px-4 py-3 border-t border-border/50 bg-muted/10">
                <Button
                  className="w-full clay-btn rounded-xl"
                  onClick={uploadAll}
                  disabled={uploadingCount > 0}
                >
                  {uploadingCount > 0 ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Uploading {uploadingCount} file{uploadingCount !== 1 ? "s" : ""}...
                    </>
                  ) : (
                    <>
                      <Lock className="w-4 h-4 mr-2" />
                      Upload {pendingCount} file{pendingCount !== 1 ? "s" : ""} securely
                    </>
                  )}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
