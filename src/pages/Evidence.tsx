import { useState, useCallback } from "react";
import { useNavigate } from "react-router";
import { AppLayout } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Search,
  Image,
  Video,
  File,
  Upload,
  Filter,
  Grid3X3,
  List,
  Brain,
  RefreshCw,
  Shield,
  Clock,
  Smartphone,
  CheckCircle2,
  AlertTriangle,
  MoreHorizontal,
  Lock,
} from "lucide-react";
import { submitForAnalysis } from "@/ai/pipeline";
import { providerRegistry } from "@/ai/registry";
import { toast } from "sonner";
import { EvidenceDetailDialog } from "@/components/EvidenceDetailDialog";
import { EvidenceUpload } from "@/components/EvidenceUpload";
import { generateSignedUrl, processOfflineUploads } from "@/lib/storage";

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
  officer_name: string;
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
  custody_count: number;
}

const evidenceItems: EvidenceItem[] = [
  {
    id: "EV-001", incident_id: "INC-2024-0891", type: "photo",
    name: "Front view of vehicle", file_url: "/evidence/ev-001.jpg",
    file_path: null, description: "Driver-side front view of white Toyota Corolla approaching checkpoint at high speed.",
    file_size: 2457600, mime_type: "image/jpeg",
    officer_id: "ofc-001", officer_name: "Sgt. John Kollie",
    captured_at: "2024-07-26T09:23:00Z", capture_lat: 6.3156, capture_lng: -10.8074,
    device_info: "Police Body Camera - Axon Body 3", source: "body_camera",
    sha256_hash: "a7c8f9e1b2d34a5e6f7890b1c2d34e5f67890a1b2c3d4e5f67890a1b2c3d4e5f",
    officer_notes: "Vehicle was approaching at high speed. Radar confirmed 95 km/h in 50 zone.",
    evidence_status: "original", uploaded_at: "2024-07-26T09:25:00Z",
    original_file_url: "/evidence/ev-001.jpg", original_file_hash: "a7c8f9e1b2d34a5e6f7890b1c2d34e5f67890a1b2c3d4e5f67890a1b2c3d4e5f",
    ai_analysis_completed: true, custody_count: 5,
  },
  {
    id: "EV-002", incident_id: "INC-2024-0891", type: "photo",
    name: "License plate close-up", file_url: "/evidence/ev-002.jpg",
    file_path: null, description: "Close-up of front license plate LBR-4521.",
    file_size: 1843200, mime_type: "image/jpeg",
    officer_id: "ofc-001", officer_name: "Sgt. John Kollie",
    captured_at: "2024-07-26T09:24:30Z", capture_lat: 6.3156, capture_lng: -10.8074,
    device_info: "Digital Camera - Canon EOS R5", source: "digital_camera",
    sha256_hash: "b8d9e0f2c3e45b6f7a8b901c2d3e45f67890a1b2c3d4e5f67890a1b2c3d4e5f6",
    officer_notes: "License plate LBR-4521 clearly visible. No damage or obstruction.",
    evidence_status: "original", uploaded_at: "2024-07-26T09:26:00Z",
    original_file_url: "/evidence/ev-002.jpg", original_file_hash: "b8d9e0f2c3e45b6f7a8b901c2d3e45f67890a1b2c3d4e5f67890a1b2c3d4e5f6",
    ai_analysis_completed: true, custody_count: 3,
  },
  {
    id: "EV-003", incident_id: "INC-2024-0891", type: "video",
    name: "Speed radar footage", file_url: "/evidence/ev-003.mp4",
    file_path: null, description: "Continuous radar lock footage showing speed from 95 km/h decreasing to stop.",
    file_size: 15938355, mime_type: "video/mp4",
    officer_id: "ofc-001", officer_name: "Sgt. John Kollie",
    captured_at: "2024-07-26T09:22:55Z", capture_lat: 6.3155, capture_lng: -10.8073,
    device_info: "Radar Speed Gun - Stalker DSR 2", source: "radar",
    sha256_hash: "c9e0f1a3d4f56c7b8c912d3e4f567890a1b2c3d4e5f67890a1b2c3d4e5f6789",
    officer_notes: "Continuous radar lock showing speed from 95 km/h decreasing to stop.",
    evidence_status: "original", uploaded_at: "2024-07-26T09:30:00Z",
    original_file_url: "/evidence/ev-003.mp4", original_file_hash: "c9e0f1a3d4f56c7b8c912d3e4f567890a1b2c3d4e5f67890a1b2c3d4e5f6789",
    ai_analysis_completed: true, custody_count: 4,
  },
  {
    id: "EV-004", incident_id: "INC-2024-0891", type: "document",
    name: "Officer signed notes", file_url: "/evidence/ev-004.pdf",
    file_path: null, description: "Signed statement and incident summary for court submission.",
    file_size: 307200, mime_type: "application/pdf",
    officer_id: "ofc-001", officer_name: "Sgt. John Kollie",
    captured_at: null, capture_lat: null, capture_lng: null,
    device_info: "TrafficWatch App v2.1", source: "app",
    sha256_hash: "d0f1a2b4e5f67c8d9e012f3e4f567890a1b2c3d4e5f67890a1b2c3d4e5f67890",
    officer_notes: "Signed statement and incident summary for court submission.",
    evidence_status: "reviewed", uploaded_at: "2024-07-26T09:35:00Z",
    original_file_url: "/evidence/ev-004.pdf", original_file_hash: "d0f1a2b4e5f67c8d9e012f3e4f567890a1b2c3d4e5f67890a1b2c3d4e5f67890",
    ai_analysis_completed: false, custody_count: 2,
  },
  {
    id: "EV-005", incident_id: "INC-2024-0890", type: "photo",
    name: "Intersection camera view", file_url: "/evidence/ev-005.jpg",
    file_path: null, description: "Traffic camera capture of red light violation at Broad and 12th.",
    file_size: 3248128, mime_type: "image/jpeg",
    officer_id: "ofc-002", officer_name: "Ofc. James Tarplah",
    captured_at: "2024-07-26T08:15:00Z", capture_lat: 6.3283, capture_lng: -10.8123,
    device_info: "Traffic Camera - Hikvision DS-2CD2T47G2", source: "traffic_camera",
    sha256_hash: "e1a2b3c5f6a78d9e0f123a4b5c6d7e8f901a2b3c4d5e67890a1b2c3d4e5f6789",
    officer_notes: null,
    evidence_status: "original", uploaded_at: "2024-07-26T08:20:00Z",
    original_file_url: "/evidence/ev-005.jpg", original_file_hash: "e1a2b3c5f6a78d9e0f123a4b5c6d7e8f901a2b3c4d5e67890a1b2c3d4e5f6789",
    ai_analysis_completed: false, custody_count: 2,
  },
  {
    id: "EV-006", incident_id: "INC-2024-0890", type: "document",
    name: "Traffic light timing log", file_url: "/evidence/ev-006.pdf",
    file_path: null, description: "Automated traffic management system export of signal timing logs.",
    file_size: 102400, mime_type: "application/pdf",
    officer_id: "ofc-002", officer_name: "Ofc. James Tarplah",
    captured_at: null, capture_lat: null, capture_lng: null,
    device_info: "Traffic Management System", source: "system_export",
    sha256_hash: "f2b3c4d6a7b89e0f12345b6c7d8e9f012a3b4c5d6e7f8901a2b3c4d5e6f7890",
    officer_notes: null,
    evidence_status: "processed", uploaded_at: "2024-07-26T08:22:00Z",
    original_file_url: "/evidence/ev-006.pdf", original_file_hash: "f2b3c4d6a7b89e0f12345b6c7d8e9f012a3b4c5d6e7f8901a2b3c4d5e6f7890",
    ai_analysis_completed: false, custody_count: 1,
  },
  {
    id: "EV-007", incident_id: "INC-2024-0888", type: "video",
    name: "Dashcam rear view", file_url: "/evidence/ev-007.mp4",
    file_path: null, description: "Rear-facing dashcam showing overtaking vehicle forcing oncoming traffic to brake.",
    file_size: 23592960, mime_type: "video/mp4",
    officer_id: "ofc-003", officer_name: "Ofc. Patricia Flomo",
    captured_at: "2024-07-26T06:30:00Z", capture_lat: 7.0233, capture_lng: -9.0504,
    device_info: "Vehicle Dashcam - Garmin Dash Cam 67W", source: "dashcam",
    sha256_hash: "a3c4d5e7b8c90f1a23456c7d8e9f01234b5c6d7e8f901a2b3c4d5e6f78901a",
    officer_notes: "Shows overtaking vehicle forcing oncoming traffic to brake suddenly.",
    evidence_status: "original", uploaded_at: "2024-07-26T07:00:00Z",
    original_file_url: "/evidence/ev-007.mp4", original_file_hash: "a3c4d5e7b8c90f1a23456c7d8e9f01234b5c6d7e8f901a2b3c4d5e6f78901a",
    ai_analysis_completed: false, custody_count: 3,
  },
  {
    id: "EV-008", incident_id: "INC-2024-0889", type: "photo",
    name: "Vehicle parked illegally", file_url: "/evidence/ev-008.jpg",
    file_path: null, description: "White sedan blocking designated emergency access lane at Market Junction.",
    file_size: 2048000, mime_type: "image/jpeg",
    officer_id: "ofc-001", officer_name: "Sgt. John Kollie",
    captured_at: "2024-07-26T07:45:00Z", capture_lat: 6.2856, capture_lng: -10.7224,
    device_info: "Smartphone - iPhone 15 Pro", source: "mobile_phone",
    sha256_hash: "b4d5e6f8c9d01a2b34567d8e9f012345c6d7e8f901a2b3c4d5e6f78901a2b",
    officer_notes: "Vehicle blocking designated emergency access lane at Market Junction.",
    evidence_status: "archived", uploaded_at: "2024-07-26T07:50:00Z",
    original_file_url: "/evidence/ev-008.jpg", original_file_hash: "b4d5e6f8c9d01a2b34567d8e9f012345c6d7e8f901a2b3c4d5e6f78901a2b",
    ai_analysis_completed: false, custody_count: 1,
  },
];

export default function Evidence() {
  const navigate = useNavigate();
  const [view, setView] = useState<"grid" | "list">("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const [aiLoading, setAiLoading] = useState<string | null>(null);
  const [aiInitialized, setAiInitialized] = useState(false);
  const [selectedEvidence, setSelectedEvidence] = useState<EvidenceItem | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [showUploader, setShowUploader] = useState(false);

  const initAI = useCallback(async () => {
    if (aiInitialized) return;
    try {
      const existing = providerRegistry.getProvider("vly");
      if (!existing) {
        await providerRegistry.initialize({
          id: "vly", name: "TrafficWatch AI Engine", version: "1.0",
          capabilities: ["image_analysis", "license_plate_detection", "object_detection", "violation_classification", "ocr"],
        });
      }
      setAiInitialized(true);
    } catch (err) {
      console.error("Failed to init AI:", err);
    }
  }, [aiInitialized]);

  const handleOpenDetail = (ev: EvidenceItem) => {
    setSelectedEvidence(ev);
    setDialogOpen(true);
  };

  const handleAnalyzeEvidence = useCallback(async (ev: EvidenceItem) => {
    setAiLoading(ev.id);
    await initAI();
    try {
      await submitForAnalysis(
        ev.incident_id,
        [{ type: ev.type === "video" ? "video" as const : "photo" as const, url: ev.file_url || ev.id, mimeType: ev.mime_type || "image/jpeg", fileName: ev.name }],
        [ev.id]
      );
      toast.success("AI analysis completed for " + ev.name);
    } catch (err) {
      toast.error("Analysis failed: " + (err instanceof Error ? err.message : "Unknown error"));
    } finally {
      setAiLoading(null);
    }
  }, [initAI]);

  const filteredEvidence = evidenceItems.filter((ev) => {
    if (searchQuery && !ev.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !ev.incident_id.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !ev.officer_name.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    if (typeFilter !== "all" && ev.type !== typeFilter) return false;
    if (statusFilter !== "all" && ev.evidence_status !== statusFilter) return false;
    return true;
  });

  const getTypeIcon = (type: string, className = "w-5 h-5") => {
    switch (type) {
      case "photo": return <Image className={className + " text-blue-500"} />;
      case "video": return <Video className={className + " text-purple-500"} />;
      case "document": return <File className={className + " text-amber-500"} />;
      default: return <File className={className} />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "photo": return "from-blue-400/20 to-blue-600/20";
      case "video": return "from-purple-400/20 to-purple-600/20";
      case "document": return "from-amber-400/20 to-amber-600/20";
      default: return "from-secondary/50 to-secondary/20";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "original": return "bg-emerald-500/10 text-emerald-500 border-emerald-500/20";
      case "processed": return "bg-blue-500/10 text-blue-500 border-blue-500/20";
      case "reviewed": return "bg-purple-500/10 text-purple-500 border-purple-500/20";
      case "archived": return "bg-secondary text-secondary-foreground";
      case "expunged": return "bg-destructive/10 text-destructive";
      default: return "bg-secondary text-secondary-foreground";
    }
  };

  const formatSize = (bytes: number | null) => {
    if (!bytes) return "\u2014";
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(0) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  const getSourceIcon = (source: string) => {
    switch (source) {
      case "body_camera": return <Shield className="w-3 h-3" />;
      case "mobile_phone": return <Smartphone className="w-3 h-3" />;
      default: return <Upload className="w-3 h-3" />;
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Digital Evidence Center</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Secure evidence management with chain of custody and integrity verification
            </p>
          </div>
          <div className="flex gap-2">
            <div className="flex bg-secondary rounded-xl p-1">
              <button className={"px-3 py-1.5 rounded-lg text-xs font-medium transition-all " + (view === "grid" ? "bg-card clay-card shadow-sm text-foreground" : "text-muted-foreground")} onClick={() => setView("grid")}>
                <Grid3X3 className="w-3.5 h-3.5" />
              </button>
              <button className={"px-3 py-1.5 rounded-lg text-xs font-medium transition-all " + (view === "list" ? "bg-card clay-card shadow-sm text-foreground" : "text-muted-foreground")} onClick={() => setView("list")}>
                <List className="w-3.5 h-3.5" />
              </button>
            </div>
            <Button className="clay-btn rounded-xl" onClick={() => setShowUploader(!showUploader)}>
              <Upload className="w-4 h-4 mr-1" />
              {showUploader ? "Close" : "Upload Evidence"}
            </Button>
          </div>
        </div>

        {/* Filters */}
        <Card className="clay-card border-border/50 !rounded-2xl">
          <CardContent className="p-4">
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search by name, case, officer..." className="pl-9 clay-inset" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
              </div>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-[130px] clay-inset">
                  <Filter className="w-3.5 h-3.5 mr-1" />
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="photo">Photos</SelectItem>
                  <SelectItem value="video">Videos</SelectItem>
                  <SelectItem value="document">Documents</SelectItem>
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[140px] clay-inset">
                  <Shield className="w-3.5 h-3.5 mr-1" />
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="original">Original</SelectItem>
                  <SelectItem value="processed">Processed</SelectItem>
                  <SelectItem value="reviewed">Reviewed</SelectItem>
                  <SelectItem value="archived">Archived</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Secure Upload Section */}
        {showUploader && (
          <div className="clay-card bg-card p-4 rounded-2xl border border-border/50">
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <Lock className="w-4 h-4 text-primary" />
              Secure Evidence Upload
            </h3>
            <p className="text-xs text-muted-foreground mb-4">
              Files are uploaded to private Supabase Storage buckets with signed URL access.
              SHA-256 hashes are computed client-side before transmission.
            </p>
            <EvidenceUpload
              incidentId="INC-2024-0891"
              onUploadComplete={(results) => {
                toast.success(`${results.length} file(s) uploaded securely`);
                setShowUploader(false);
              }}
            />
          </div>
        )}

        {/* Summary stats */}
        <div className="grid grid-cols-4 gap-3">
          {[
            { label: "Total Files", count: filteredEvidence.length, color: "text-foreground", icon: File },
            { label: "Photos", count: filteredEvidence.filter(e => e.type === "photo").length, color: "text-blue-500", icon: Image },
            { label: "Videos", count: filteredEvidence.filter(e => e.type === "video").length, color: "text-purple-500", icon: Video },
            { label: "Verified", count: filteredEvidence.filter(e => e.sha256_hash).length, color: "text-emerald-500", icon: Shield },
          ].map((stat) => (
            <div key={stat.label} className="clay-card bg-card p-4 rounded-xl text-center">
              <stat.icon className={"w-4 h-4 mx-auto mb-1 " + stat.color} />
              <p className={"text-lg font-bold " + stat.color}>{stat.count}</p>
              <p className="text-[10px] text-muted-foreground">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Grid View */}
        {view === "grid" && (
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {filteredEvidence.map((ev) => (
              <div key={ev.id} className="clay-card bg-card rounded-2xl overflow-hidden group relative cursor-pointer transition-all hover:shadow-md" onClick={() => handleOpenDetail(ev)}>
                <div className={"h-32 bg-gradient-to-br " + getTypeColor(ev.type) + " flex items-center justify-center relative"}>
                  <div className="flex flex-col items-center opacity-50">
                    {ev.type === "photo" ? <Image className="w-8 h-8 text-blue-500/50" /> :
                     ev.type === "video" ? <Video className="w-8 h-8 text-purple-500/50" /> :
                     <File className="w-8 h-8 text-amber-500/50" />}
                  </div>
                  <Badge className={"clay-pill text-[9px] px-1.5 py-0 h-4 absolute top-2 left-2 " + getStatusColor(ev.evidence_status)}>
                    {ev.evidence_status}
                  </Badge>
                  {ev.ai_analysis_completed && (
                    <Badge variant="outline" className="clay-pill text-[9px] px-1.5 py-0 h-4 absolute top-2 right-2 bg-info/10 text-info border-info/20">
                      <Brain className="w-2.5 h-2.5 mr-0.5" /> AI
                    </Badge>
                  )}
                  {ev.sha256_hash && (
                    <div className="absolute bottom-2 left-2 flex items-center gap-1 bg-card/80 backdrop-blur-sm px-1.5 py-0.5 rounded-md">
                      <CheckCircle2 className="w-2.5 h-2.5 text-emerald-500" />
                      <span className="text-[8px] text-emerald-500 font-medium">Verified</span>
                    </div>
                  )}
                </div>
                <div className="p-3 space-y-2">
                  <p className="text-sm font-medium truncate">{ev.name}</p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                      <Clock className="w-2.5 h-2.5" />
                      {new Date(ev.uploaded_at).toLocaleDateString()}
                    </div>
                    <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                      {getSourceIcon(ev.source)}
                      {ev.source.replace(/_/g, " ")}
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] text-muted-foreground">{ev.incident_id} · {ev.officer_name}</p>
                    <p className="text-[10px] font-mono text-muted-foreground">{formatSize(ev.file_size)}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* List View */}
        {view === "list" && (
          <Card className="clay-card border-border/50 !rounded-2xl overflow-hidden">
            <div className="divide-y divide-border/50">
              <div className="hidden sm:grid grid-cols-10 gap-3 px-6 py-3 text-[10px] font-medium text-muted-foreground bg-secondary/30 uppercase tracking-wider">
                <span className="col-span-2">Name</span>
                <span>Case</span>
                <span>Type</span>
                <span>Status</span>
                <span>Source</span>
                <span>Integrity</span>
                <span>Size</span>
                <span>Officer</span>
                <span className="text-right">Actions</span>
              </div>
              {filteredEvidence.map((ev) => (
                <div key={ev.id} className="grid sm:grid-cols-10 gap-3 sm:gap-4 px-4 sm:px-6 py-3 hover:bg-secondary/30 transition-colors items-center cursor-pointer" onClick={() => handleOpenDetail(ev)}>
                  <div className="col-span-2 flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0">{getTypeIcon(ev.type, "w-4 h-4")}</div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{ev.name}</p>
                      <p className="text-[10px] font-mono text-muted-foreground truncate">{ev.id}</p>
                    </div>
                  </div>
                  <p className="text-xs font-mono truncate hidden sm:block">{ev.incident_id}</p>
                  <Badge variant="outline" className="clay-pill text-[10px] px-1.5 py-0 h-4 w-fit">{ev.type}</Badge>
                  <Badge className={"clay-pill text-[10px] px-1.5 py-0 h-4 w-fit " + getStatusColor(ev.evidence_status)}>{ev.evidence_status}</Badge>
                  <div className="flex items-center gap-1 text-[10px] text-muted-foreground hidden sm:flex">
                    {getSourceIcon(ev.source)}
                    <span className="truncate">{ev.source.replace(/_/g, " ")}</span>
                  </div>
                  <div className="hidden sm:flex items-center gap-1">
                    {ev.sha256_hash ? <CheckCircle2 className="w-3 h-3 text-emerald-500" /> : <AlertTriangle className="w-3 h-3 text-muted-foreground" />}
                    <span className={"text-[9px] " + (ev.sha256_hash ? "text-emerald-500" : "text-muted-foreground")}>
                      {ev.sha256_hash ? "Verified" : "No hash"}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground hidden sm:block">{formatSize(ev.file_size)}</p>
                  <p className="text-xs text-muted-foreground truncate hidden sm:block">{ev.officer_name}</p>
                  <div className="flex justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                    <Button variant="ghost" size="icon" className="rounded-lg h-7 w-7" onClick={() => handleOpenDetail(ev)}>
                      <MoreHorizontal className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {filteredEvidence.length === 0 && (
          <div className="text-center py-16">
            <div className="w-16 h-16 rounded-2xl bg-secondary flex items-center justify-center mx-auto mb-4">
              <File className="w-8 h-8 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground">No evidence found</p>
          </div>
        )}
      </div>

      <EvidenceDetailDialog evidence={selectedEvidence} open={dialogOpen} onOpenChange={setDialogOpen} />
    </AppLayout>
  );
}
