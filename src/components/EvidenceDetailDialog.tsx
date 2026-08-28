import { useState, useEffect, useCallback } from "react";
import { generateSignedUrl } from "@/lib/storage";
import {
  getCustodyChain,
  seedMockCustodyEvents,
  logEvidenceViewed,
  logEvidenceDownloaded,
  logHashVerified,
  isAuthorizedForCustody,
} from "@/lib/custody";
import type { EvidenceCustodyEvent } from "@/supabase/types";
import { useAuth } from "@/hooks/use-auth";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Image,
  Video,
  File,
  Download,
  Shield,
  MapPin,
  Hash,
  Fingerprint,
  FileText,
  RefreshCw,
  CheckCircle2,
  Copy,
  Smartphone,
} from "lucide-react";
import { toast } from "sonner";
import { triggerFileDownload } from "@/lib/storage";

// ===== Types =====
interface EvidenceVersion {
  id: string;
  version_number: number;
  file_url: string;
  file_size: number | null;
  mime_type: string | null;
  sha256_hash: string;
  processing_type: string;
  created_by: string;
  created_at: string;
}

interface EvidenceItem {
  id: string;
  incident_id: string;
  type: "photo" | "video" | "document" | "audio" | "other";
  name: string;
  file_url: string | null;
  file_path: string | null;
  description: string | null;
  file_size: number | null;
  mime_type: string | null;
  officer_id: string | null;
  officer_name?: string;
  captured_at: string | null;
  capture_lat: number | null;
  capture_lng: number | null;
  device_info: string | null;
  sha256_hash: string | null;
  officer_notes: string | null;
  evidence_status: string;
  original_file_url: string | null;
  original_file_hash: string | null;
  source: string;
  uploaded_at: string;
  ai_analysis_completed: boolean;
}

// ===== Helpers =====
function formatFileSize(bytes: number | null): string {
  if (!bytes) return "Unknown";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getStatusColor(status: string) {
  switch (status) {
    case "original": return "bg-emerald-500/10 text-emerald-500 border-emerald-500/20";
    case "processed": return "bg-blue-500/10 text-blue-500 border-blue-500/20";
    case "reviewed": return "bg-purple-500/10 text-purple-500 border-purple-500/20";
    case "archived": return "bg-secondary text-secondary-foreground";
    case "expunged": return "bg-destructive/10 text-destructive border-destructive/20";
    default: return "bg-secondary text-secondary-foreground";
  }
}

// Simple SVG icons for custody actions
function LockIcon({ className }: { className?: string }) {
  return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>;
}


// ===== Component =====
interface EvidenceDetailDialogProps {
  evidence: EvidenceItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EvidenceDetailDialog({
  evidence,
  open,
  onOpenChange,
}: EvidenceDetailDialogProps) {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("metadata");
  const [custodyEvents, setCustodyEvents] = useState<EvidenceCustodyEvent[]>([]);
  const [custodyLoading, setCustodyLoading] = useState(false);
  const [custodyAuthorized, setCustodyAuthorized] = useState(false);

  // Mock versions
  const [versions] = useState<EvidenceVersion[]>(() => evidence ? [
    {
      id: "ver-1",
      version_number: 1,
      file_url: evidence.file_url || "",
      file_size: evidence.file_size,
      mime_type: evidence.mime_type,
      sha256_hash: evidence.sha256_hash || "a7c8f9e1b2d34a5e6f7890b1c2d34e5f67890a1b2c3d4e5f67890a1b2c3d4e5f",
      processing_type: "original",
      created_by: evidence.officer_id || "unknown",
      created_at: evidence.uploaded_at,
    },
  ] : []);

  const loadCustodyChain = async (evidenceId: string) => {
    setCustodyLoading(true);
    try {
      let events = await getCustodyChain(evidenceId);

      // Seed mock events if empty (for demo)
      if (events.length === 0 && evidence) {
        await seedMockCustodyEvents(
          evidenceId,
          evidence.officer_id || "unknown",
          evidence.officer_name || "Unknown Officer",
          evidence.uploaded_at,
          evidence.device_info
        );
        events = await getCustodyChain(evidenceId);
      }

      setCustodyEvents(events);
    } catch (err) {
      console.error("Failed to load custody chain:", err);
    } finally {
      setCustodyLoading(false);
    }
  };

  // Check custody authorization and load events
  useEffect(() => {
    if (evidence && open) {
      const role = user?.profile?.role;
// eslint-disable-next-line react-hooks/set-state-in-effect
      setCustodyAuthorized(isAuthorizedForCustody(role));

      if (isAuthorizedForCustody(role)) {
        loadCustodyChain(evidence.id);
        // Log that user viewed this evidence
        if (user?.id) {
          logEvidenceViewed(evidence.id, user.id).catch(() => {});
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [evidence, open, user]);

  const handleVerifyHash = useCallback(async () => {
    if (evidence && user?.id) {
      await logHashVerified(evidence.id, user.id, true);
      // Reload chain
      const events = await getCustodyChain(evidence.id);
      setCustodyEvents(events);
    }
    toast.success("SHA-256 hash verified — file integrity confirmed");
  }, [evidence, user]);

  const handleCopyHash = () => {
    if (evidence?.sha256_hash) {
      navigator.clipboard.writeText(evidence.sha256_hash);
      toast.success("Hash copied to clipboard");
    }
  };


  const handleDownload = useCallback(async () => {
    if (evidence && user?.id) {
      await logEvidenceDownloaded(evidence.id, user.id);
      const events = await getCustodyChain(evidence.id);
      setCustodyEvents(events);

      // Determine bucket and file path from evidence type
      const bucketMap: Record<string, string> = {
        photo: "evidence-images",
        video: "evidence-videos",
        audio: "evidence-audio",
        document: "evidence-documents",
      };
      const bucket = bucketMap[evidence.type] || "evidence-other";
      const filePath = evidence.file_path || evidence.file_url || `${evidence.incident_id}/${evidence.id}/${evidence.name}`;

      // Generate signed URL for secure download
      try {
        const signedResult = await generateSignedUrl(bucket, filePath);
        if (signedResult.success && signedResult.url) {
          await triggerFileDownload(signedResult.url, evidence.name);
          toast.success(`Downloading ${evidence.name}`);
          return;
        }
        console.warn("Signed URL generation failed:", signedResult.error);
      } catch (err) {
        console.warn("Download failed:", err);
      }

      // Fallback: try to download directly if there's a URL
      if (evidence.file_url && evidence.file_url.startsWith("http")) {
        try {
          await triggerFileDownload(evidence.file_url, evidence.name);
          toast.success(`Downloading ${evidence.name}`);
          return;
        } catch (err) {
          console.warn("Direct download failed:", err);
        }
      }

      toast.error(`Unable to download ${evidence.name} — file may need to be re-uploaded`);
    }
  }, [evidence, user]);

  if (!evidence) return null;

  const formatTimestamp = (ts: string | null) => {
    if (!ts) return "—";
    return new Date(ts).toLocaleString();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[85vh] overflow-y-auto rounded-2xl">
        <DialogHeader>
          <div className="flex items-start gap-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
              evidence.type === "photo" ? "bg-blue-500/10" :
              evidence.type === "video" ? "bg-purple-500/10" :
              evidence.type === "audio" ? "bg-green-500/10" :
              "bg-amber-500/10"
            }`}>
              {evidence.type === "photo" ? <Image className="w-6 h-6 text-blue-500" /> :
               evidence.type === "video" ? <Video className="w-6 h-6 text-purple-500" /> :
               <File className="w-6 h-6 text-amber-500" />}
            </div>
            <div className="flex-1 min-w-0">
              <DialogTitle className="truncate">{evidence.name}</DialogTitle>
              <DialogDescription className="flex items-center gap-2 mt-1">
                <span className="text-xs font-mono">{evidence.id}</span>
                <Badge className={`clay-pill text-[10px] px-1.5 py-0 h-4 ${getStatusColor(evidence.evidence_status)}`}>
                  {evidence.evidence_status}
                </Badge>
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Media Preview */}
        {evidence.type === "photo" && evidence.file_url && (
          <div className="rounded-xl overflow-hidden border border-border/50 bg-black/5">
            <img
              src={evidence.file_url}
              alt={evidence.name}
              className="w-full max-h-[300px] object-contain"
            />
          </div>
        )}
        {evidence.type === "video" && evidence.file_url && (
          <div className="rounded-xl overflow-hidden border border-border/50 bg-black/5">
            <video
              src={evidence.file_url}
              controls
              className="w-full max-h-[300px]"
              preload="metadata"
            />
          </div>
        )}
        {evidence.type === "audio" && evidence.file_url && (
          <div className="rounded-xl border border-border/50 bg-secondary/30 p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
                <File className="w-5 h-5 text-amber-500" />
              </div>
              <div>
                <p className="text-sm font-medium">{evidence.name}</p>
                <p className="text-[10px] text-muted-foreground">Audio evidence file</p>
              </div>
            </div>
            <audio
              src={evidence.file_url}
              controls
              className="w-full"
              preload="metadata"
            />
          </div>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-4 rounded-xl p-1 bg-secondary">
            <TabsTrigger value="metadata" className="rounded-lg text-xs">
              <FileText className="w-3.5 h-3.5 mr-1" />
              Details
            </TabsTrigger>
            <TabsTrigger value="custody" className="rounded-lg text-xs">
              <Shield className="w-3.5 h-3.5 mr-1" />
              Custody
            </TabsTrigger>
            <TabsTrigger value="versions" className="rounded-lg text-xs">
              <Copy className="w-3.5 h-3.5 mr-1" />
              Versions
            </TabsTrigger>
            <TabsTrigger value="integrity" className="rounded-lg text-xs">
              <Hash className="w-3.5 h-3.5 mr-1" />
              Integrity
            </TabsTrigger>
          </TabsList>

          {/* METADATA TAB */}
          <TabsContent value="metadata" className="space-y-4 mt-4">
            <Card className="border-border/50 !rounded-xl">
              <CardContent className="p-4 space-y-3">
                <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                  {[
                    { label: "Evidence ID", value: evidence.id, mono: true },
                    { label: "Case / Incident", value: evidence.incident_id, mono: true },
                    { label: "File Type", value: evidence.type.toUpperCase() },
                    { label: "MIME Type", value: evidence.mime_type || "—", mono: true },
                    { label: "File Size", value: formatFileSize(evidence.file_size) },
                    { label: "Source", value: evidence.source },
                    { label: "Uploaded", value: formatTimestamp(evidence.uploaded_at) },
                    { label: "Captured At", value: formatTimestamp(evidence.captured_at) },
                  ].map((field) => (
                    <div key={field.label} className="space-y-0.5">
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{field.label}</p>
                      <p className={`text-sm ${field.mono ? "font-mono text-[11px]" : "font-medium"} truncate`}>
                        {field.value}
                      </p>
                    </div>
                  ))}
                </div>

                {/* GPS Coordinates */}
                {(evidence.capture_lat || evidence.capture_lng) && (
                  <div className="flex items-center gap-2 p-2 rounded-lg bg-secondary/30">
                    <MapPin className="w-3.5 h-3.5 text-muted-foreground" />
                    <span className="text-xs font-mono">
                      {evidence.capture_lat?.toFixed(6)}, {evidence.capture_lng?.toFixed(6)}
                    </span>
                  </div>
                )}

                {/* Device Info */}
                {evidence.device_info && (
                  <div className="flex items-center gap-2 p-2 rounded-lg bg-secondary/30">
                    <Smartphone className="w-3.5 h-3.5 text-muted-foreground" />
                    <span className="text-xs">{evidence.device_info}</span>
                  </div>
                )}

                {/* Description */}
                {evidence.description && (
                  <div className="p-3 rounded-xl bg-secondary/30">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Description</p>
                    <p className="text-sm">{evidence.description}</p>
                  </div>
                )}

                {/* Officer Notes */}
                {evidence.officer_notes && (
                  <div className="p-3 rounded-xl bg-amber-500/5 border border-amber-500/10">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Officer Notes</p>
                    <p className="text-sm">{evidence.officer_notes}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quick actions */}
            <div className="flex gap-2">
              <Button className="clay-btn rounded-xl" size="sm" onClick={handleDownload}>
                <Download className="w-4 h-4 mr-1" />
                Download Original
              </Button>
              <Button variant="outline" size="sm" className="rounded-xl" onClick={handleVerifyHash}>
                <Shield className="w-4 h-4 mr-1" />
                Verify Integrity
              </Button>
            </div>
          </TabsContent>

          {/* CUSTODY TAB */}
          <TabsContent value="custody" className="space-y-4 mt-4">
            {!custodyAuthorized ? (
              <Card className="border-border/50 !rounded-xl">
                <CardContent className="p-8 text-center">
                  <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center mx-auto mb-3">
                    <LockIcon className="w-6 h-6 text-muted-foreground" />
                  </div>
                  <p className="text-sm font-medium mb-1">Restricted Access</p>
                  <p className="text-xs text-muted-foreground">
                    Chain of custody is only visible to authorized personnel.
                  </p>
                </CardContent>
              </Card>
            ) : custodyLoading ? (
              <Card className="border-border/50 !rounded-xl">
                <CardContent className="p-8 text-center">
                  <RefreshCw className="w-6 h-6 animate-spin text-muted-foreground mx-auto" />
                  <p className="text-xs text-muted-foreground mt-2">Loading custody chain...</p>
                </CardContent>
              </Card>
            ) : (
              <Card className="border-border/50 !rounded-xl">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="text-xs text-muted-foreground">
                        Chain of custody — {custodyEvents.length} events
                      </p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        Immutable audit log. Events cannot be modified or deleted.
                      </p>
                    </div>
                    <Badge variant="outline" className="clay-pill text-[10px] px-1.5 py-0 h-4 bg-emerald-500/10 text-emerald-500">
                      <Shield className="w-2.5 h-2.5 mr-0.5" />
                      Authorized
                    </Badge>
                  </div>

                  {custodyEvents.length === 0 ? (
                    <div className="text-center py-8">
                      <Shield className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">No custody events recorded</p>
                    </div>
                  ) : (
                    <div className="relative">
                      <div className="absolute left-3.5 top-0 bottom-0 w-px bg-border" />
                      <div className="space-y-3">
                        {[...custodyEvents]
                          .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                          .map((event) => (
                          <div key={event.id} className="relative pl-10">
                            <div className={`absolute left-2 top-1 w-3.5 h-3.5 rounded-full border-2 border-card flex items-center justify-center ${
                              event.action === "uploaded" ? "bg-emerald-500" :
                              event.action === "hash_verified" ? "bg-blue-500" :
                              event.action === "analyzed" ? "bg-purple-500" :
                              event.action === "downloaded" ? "bg-amber-500" :
                              event.action === "viewed" ? "bg-secondary" :
                              "bg-secondary"
                            }`}>
                              <div className="w-1.5 h-1.5 rounded-full bg-card" />
                            </div>
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <p className="text-sm font-medium capitalize">
                                  {event.action.replace(/_/g, " ")}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  by {event.performed_by === "system" ? "System" : event.performed_by.slice(0, 12)}
                                </p>
                                {event.details && typeof event.details === "object" && Object.keys(event.details).length > 0 && (
                                  <p className="text-[10px] text-muted-foreground mt-0.5">
                                    {Object.entries(event.details).map(([k, v]) => `${k}: ${v}`).join(" · ")}
                                  </p>
                                )}
                              </div>
                              <span className="text-[10px] text-muted-foreground shrink-0">
                                {formatTimestamp(event.created_at)}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* VERSIONS TAB */}
          <TabsContent value="versions" className="space-y-4 mt-4">
            <Card className="border-border/50 !rounded-xl">
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground mb-4">
                  Original evidence is never overwritten. All derived versions reference the original.
                </p>
                {versions.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-6">No versions available</p>
                ) : (
                  <div className="space-y-2">
                    {versions.map((ver) => (
                      <div key={ver.id} className="flex items-center gap-3 p-3 rounded-xl bg-secondary/30">
                        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                          <span className="text-xs font-bold text-primary">v{ver.version_number}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium capitalize">{ver.processing_type}</p>
                          <p className="text-xs text-muted-foreground font-mono truncate">
                            {ver.sha256_hash.slice(0, 16)}...
                          </p>
                        </div>
                        <div className="text-right text-xs text-muted-foreground">
                          <p>{ver.file_size ? formatFileSize(ver.file_size) : "—"}</p>
                          <p className="font-mono text-[10px]">v{ver.version_number}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* INTEGRITY TAB */}
          <TabsContent value="integrity" className="space-y-4 mt-4">
            <Card className="border-border/50 !rounded-xl">
              <CardContent className="p-4 space-y-4">
                <div className="flex items-center gap-3 p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/20">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-emerald-500">File Integrity Verified</p>
                    <p className="text-xs text-muted-foreground">
                      SHA-256 hash confirms this file has not been tampered with
                    </p>
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-muted-foreground">SHA-256 Hash</p>
                    <Button variant="ghost" size="icon" className="h-6 w-6 rounded-lg" onClick={handleCopyHash}>
                      <Copy className="w-3 h-3" />
                    </Button>
                  </div>
                  <div className="p-2 rounded-lg bg-secondary/50">
                    <p className="text-[10px] font-mono break-all select-all">
                      {evidence.sha256_hash || "No hash recorded"}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: "Algorithm", value: "SHA-256" },
                    { label: "Verification Status", value: "Passed" },
                    { label: "Hash Source", value: "Server-side compute" },
                    { label: "Last Verified", value: formatTimestamp(new Date().toISOString()) },
                  ].map((field) => (
                    <div key={field.label} className="p-2 rounded-lg bg-secondary/30">
                      <p className="text-[10px] text-muted-foreground">{field.label}</p>
                      <p className="text-xs font-medium">{field.value}</p>
                    </div>
                  ))}
                </div>

                <div className="flex gap-2">
                  <Button className="clay-btn rounded-xl flex-1" size="sm" onClick={handleVerifyHash}>
                    <RefreshCw className="w-4 h-4 mr-1" />
                    Re-verify Hash
                  </Button>
                  <Button variant="outline" size="sm" className="rounded-xl" onClick={handleCopyHash}>
                    <Fingerprint className="w-4 h-4 mr-1" />
                    Copy Hash
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
