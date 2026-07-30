// ============================================================
// TrafficWatch AI — EvidenceViewer Component
// ============================================================
// Reusable evidence display with metadata, thumbnails, status,
// file type badges, and chain-of-custody indicators.
// ============================================================

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  FileImage,
  FileVideo,
  FileAudio,
  FileText,
  File,
  Download,
// eslint-disable-next-line @typescript-eslint/no-unused-vars
  Eye,
// eslint-disable-next-line @typescript-eslint/no-unused-vars
  Lock,
  Shield,
  Clock,
  MapPin,
  User,
  Hash,
  AlertTriangle,
  CheckCircle2,
  Maximize2,
  ExternalLink,
} from "lucide-react";

// ─── Types ──────────────────────────────────────────────

export interface EvidenceItem {
  id: string;
  incidentId?: string;
  type: "photo" | "video" | "audio" | "document" | "other";
  name: string;
  description?: string;
  fileUrl?: string;
  fileSize?: number;
  mimeType?: string;
  uploadedBy?: string;
  uploadedByName?: string;
  uploadedAt?: string;
  capturedAt?: string;
  captureLat?: number;
  captureLng?: number;
  sha256Hash?: string;
  evidenceStatus?: string;
  isAiAnalyzed?: boolean;
  aiConfidence?: number;
  /** Chain-of-custody event count */
  custodyCount?: number;
  /** Whether this evidence has been verified */
  isVerified?: boolean;
  /** Whether this evidence is flagged */
  isFlagged?: boolean;
}

interface EvidenceViewerProps {
  /** Evidence item to display */
  evidence: EvidenceItem;
  /** Size variant */
  variant?: "card" | "compact" | "detail";
  /** Show zoom/expand button */
  showExpand?: boolean;
  /** Show download button */
  showDownload?: boolean;
  /** Show verification badge */
  showVerification?: boolean;
  /** Show full metadata panel */
  showMetadata?: boolean;
  /** Show chain-of-custody count */
  showCustody?: boolean;
  /** Callback when evidence is clicked/expanded */
  onExpand?: (evidence: EvidenceItem) => void;
  /** Callback for download */
  onDownload?: (evidence: EvidenceItem) => void;
  /** Additional className */
  className?: string;
}

// ─── Helpers ────────────────────────────────────────────

const FILE_ICONS: Record<string, React.ElementType> = {
  photo: FileImage,
  video: FileVideo,
  audio: FileAudio,
  document: FileText,
  other: File,
};

const FILE_COLORS: Record<string, string> = {
  photo: "from-blue-400/20 to-blue-600/10 border-blue-200/50 dark:border-blue-800/30",
  video: "from-purple-400/20 to-purple-600/10 border-purple-200/50 dark:border-purple-800/30",
  audio: "from-amber-400/20 to-amber-600/10 border-amber-200/50 dark:border-amber-800/30",
  document: "from-emerald-400/20 to-emerald-600/10 border-emerald-200/50 dark:border-emerald-800/30",
  other: "from-zinc-400/20 to-zinc-600/10 border-zinc-200/50 dark:border-zinc-800/30",
};

const FILE_ICON_COLORS: Record<string, string> = {
  photo: "text-blue-500",
  video: "text-purple-500",
  audio: "text-amber-500",
  document: "text-emerald-500",
  other: "text-muted-foreground",
};

function formatFileSize(bytes?: number): string {
  if (!bytes) return "—";
  const units = ["B", "KB", "MB", "GB"];
  let size = bytes;
  let unit = 0;
  while (size >= 1024 && unit < units.length - 1) {
    size /= 1024;
    unit++;
  }
  return `${size.toFixed(unit === 0 ? 0 : 1)} ${units[unit]}`;
}

function formatTimestamp(ts?: string): string {
  if (!ts) return "—";
  try {
    return new Date(ts).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return ts;
  }
}

function getStatusBadge(status?: string) {
  if (!status) return null;
  const config: Record<string, { color: string; label: string }> = {
    original: { color: "bg-blue-500/10 text-blue-600 border-blue-500/20", label: "Original" },
    processed: { color: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20", label: "Processed" },
    compressed: { color: "bg-amber-500/10 text-amber-600 border-amber-500/20", label: "Compressed" },
    archived: { color: "bg-zinc-500/10 text-zinc-600 border-zinc-500/20", label: "Archived" },
    flagged: { color: "bg-red-500/10 text-red-600 border-red-500/20", label: "Flagged" },
    verified: { color: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20", label: "Verified" },
  };
  const c = config[status] || { color: "bg-secondary text-muted-foreground", label: status };
  return (
    <Badge variant="outline" className={cn("text-[9px] px-1.5 py-0 h-4", c.color)}>
      {c.label}
    </Badge>
  );
}

// ─── Component ──────────────────────────────────────────

export function EvidenceViewer({
  evidence,
  variant = "card",
  showExpand = true,
  showDownload = true,
  showVerification = true,
  showMetadata = true,
  showCustody = true,
  onExpand,
  onDownload,
  className,
}: EvidenceViewerProps) {
  const FileIcon = FILE_ICONS[evidence.type] || File;
  const typeColor = FILE_COLORS[evidence.type] || FILE_COLORS.other;
  const iconColor = FILE_ICON_COLORS[evidence.type] || FILE_ICON_COLORS.other;

  if (variant === "compact") {
    return (
      <div
        className={cn(
          "flex items-center gap-3 p-2.5 rounded-lg border border-border/50 hover:bg-secondary/30 transition-colors cursor-pointer group",
          className
        )}
        onClick={() => onExpand?.(evidence)}
        role="button"
        tabIndex={0}
      >
        <div className={cn("w-8 h-8 rounded-lg bg-gradient-to-br flex items-center justify-center shrink-0", typeColor)}>
          <FileIcon className={cn("w-4 h-4", iconColor)} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium truncate">{evidence.name}</p>
          <p className="text-[10px] text-muted-foreground flex items-center gap-1.5">
            <span>{formatFileSize(evidence.fileSize)}</span>
            {evidence.sha256Hash && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="flex items-center gap-0.5 text-[8px] text-muted-foreground/50 cursor-help">
                      <Hash className="w-2 h-2" />
                      {evidence.sha256Hash.substring(0, 8)}...
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-[10px] font-mono">{evidence.sha256Hash}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </p>
        </div>
        <div className="flex items-center gap-1">
          {getStatusBadge(evidence.evidenceStatus)}
          <ExternalLink className="w-3 h-3 text-muted-foreground/30 opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
      </div>
    );
  }

  // Default: card variant
  return (
    <Card
      className={cn(
        "border-border/50 overflow-hidden transition-all hover:shadow-sm group cursor-pointer",
        typeColor,
        className
      )}
    >
      {/* Thumbnail / Icon area */}
      <div
        className={cn(
          "relative h-28 sm:h-32 flex items-center justify-center bg-gradient-to-br border-b border-border/30",
          typeColor
        )}
        onClick={() => onExpand?.(evidence)}
      >
        {evidence.type === "photo" && evidence.fileUrl ? (
          <img
            src={evidence.fileUrl}
            alt={evidence.name}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="flex flex-col items-center gap-1.5">
            <FileIcon className={cn("w-10 h-10", iconColor)} />
            <span className={cn("text-[10px] font-medium uppercase tracking-wider", iconColor)}>
              {evidence.type}
            </span>
          </div>
        )}

        {/* Overlay badges */}
        <div className="absolute top-2 left-2 flex flex-wrap gap-1">
          {getStatusBadge(evidence.evidenceStatus)}
          {evidence.isAiAnalyzed && (
            <Badge variant="outline" className="text-[8px] px-1 py-0 h-3.5 bg-violet-500/10 text-violet-600 border-violet-500/20">
              AI
            </Badge>
          )}
        </div>

        {/* Top-right actions */}
        <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {showExpand && (
            <Button
              variant="secondary"
              size="icon"
              className="h-6 w-6 rounded-md bg-background/80 backdrop-blur-sm hover:bg-background"
              onClick={(e) => { e.stopPropagation(); onExpand?.(evidence); }}
            >
              <Maximize2 className="w-3 h-3" />
            </Button>
          )}
          {showDownload && evidence.fileUrl && (
            <Button
              variant="secondary"
              size="icon"
              className="h-6 w-6 rounded-md bg-background/80 backdrop-blur-sm hover:bg-background"
              onClick={(e) => { e.stopPropagation(); onDownload?.(evidence); }}
            >
              <Download className="w-3 h-3" />
            </Button>
          )}
        </div>

        {/* Verification badge */}
        {showVerification && evidence.isVerified && (
          <div className="absolute bottom-2 right-2">
            <Badge variant="outline" className="text-[8px] px-1 py-0 h-3.5 bg-emerald-500/10 text-emerald-600 border-emerald-500/20">
              <CheckCircle2 className="w-2.5 h-2.5 mr-0.5" />
              Verified
            </Badge>
          </div>
        )}
        {showVerification && evidence.isFlagged && (
          <div className="absolute bottom-2 right-2">
            <Badge variant="outline" className="text-[8px] px-1 py-0 h-3.5 bg-red-500/10 text-red-600 border-red-500/20">
              <AlertTriangle className="w-2.5 h-2.5 mr-0.5" />
              Flagged
            </Badge>
          </div>
        )}
      </div>

      {/* Metadata */}
      <CardContent className="p-3 space-y-2" onClick={() => onExpand?.(evidence)}>
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold truncate">{evidence.name}</p>
            {evidence.description && (
              <p className="text-[10px] text-muted-foreground line-clamp-2 mt-0.5">
                {evidence.description}
              </p>
            )}
          </div>
        </div>

        {showMetadata && (
          <div className="flex flex-wrap gap-x-3 gap-y-1 text-[10px] text-muted-foreground">
            <span className="flex items-center gap-1">
              <File className="w-2.5 h-2.5" />
              {formatFileSize(evidence.fileSize)}
            </span>
            {evidence.mimeType && (
              <span className="text-[9px] text-muted-foreground/60">{evidence.mimeType}</span>
            )}
            {evidence.uploadedAt && (
              <span className="flex items-center gap-1">
                <Clock className="w-2.5 h-2.5" />
                {formatTimestamp(evidence.uploadedAt)}
              </span>
            )}
            {evidence.captureLat && evidence.captureLng && (
              <span className="flex items-center gap-1">
                <MapPin className="w-2.5 h-2.5" />
                {evidence.captureLat.toFixed(4)}, {evidence.captureLng.toFixed(4)}
              </span>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-1 border-t border-border/20 mt-1">
          <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
            {evidence.uploadedByName && (
              <span className="flex items-center gap-1">
                <User className="w-2.5 h-2.5" />
                {evidence.uploadedByName}
              </span>
            )}
            {evidence.sha256Hash && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="flex items-center gap-0.5 text-[8px] text-muted-foreground/40 cursor-help">
                      <Hash className="w-2 h-2" />
                      <span title={evidence.sha256Hash}>{evidence.sha256Hash.substring(0, 6)}...</span>
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-[10px] font-mono break-all max-w-[200px]">{evidence.sha256Hash}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
          <div className="flex items-center gap-1">
            {showCustody && evidence.custodyCount && evidence.custodyCount > 0 && (
              <span className="text-[9px] text-muted-foreground/50 flex items-center gap-0.5">
                <Shield className="w-2.5 h-2.5" />
                {evidence.custodyCount}
              </span>
            )}
            {evidence.aiConfidence && (
              <span className="text-[9px] text-violet-500/60">
                AI: {Math.round(evidence.aiConfidence)}%
              </span>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
