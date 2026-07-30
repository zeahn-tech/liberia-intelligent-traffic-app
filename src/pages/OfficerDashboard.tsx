import { useState, useEffect, useCallback } from "react";
import { AppLayout } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/use-auth";
import { useNetwork } from "@/hooks/use-network";
import { motion, AnimatePresence } from "framer-motion";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  BarChart3,
  Brain,
// eslint-disable-next-line @typescript-eslint/no-unused-vars
  Calendar,
  Camera,
  Car,
  CheckCircle2,
  CheckSquare,
  ChevronRight,
  Clock,
  FileText,
  Image,
  List,
  Loader2,
  MapPin,
  Megaphone,
  MessageSquare,
// eslint-disable-next-line @typescript-eslint/no-unused-vars
  MoreHorizontal,
  Plus,
  RefreshCw,
// eslint-disable-next-line @typescript-eslint/no-unused-vars
  Route,
  Search,
  Shield,
// eslint-disable-next-line @typescript-eslint/no-unused-vars
  ShieldAlert,
// eslint-disable-next-line @typescript-eslint/no-unused-vars
  Smartphone,
// eslint-disable-next-line @typescript-eslint/no-unused-vars
  Star,
// eslint-disable-next-line @typescript-eslint/no-unused-vars
  Upload,
  User,
// eslint-disable-next-line @typescript-eslint/no-unused-vars
  Users,
  Video,
// eslint-disable-next-line @typescript-eslint/no-unused-vars
  Wifi,
  WifiOff,
  X,
// eslint-disable-next-line @typescript-eslint/no-unused-vars
  Zap,
} from "lucide-react";
import { supabase } from "@/supabase/client";
import { getPendingSyncQueue } from "@/lib/offline";
import { EvidenceUpload } from "@/components/EvidenceUpload";
import { toast } from "sonner";
import { useNavigate } from "react-router";

// ─── Types ─────────────────────────────────────────────

interface AssignedIncident {
  id: string;
  title: string;
  description: string | null;
  status: string;
  severity: string;
  vehicle_plate: string | null;
  location_address: string | null;
  created_at: string;
  officer_id: string;
}

interface PendingReview {
  id: string;
  type: "ai_analysis" | "anpr" | "citizen_report";
  title: string;
  description: string;
  created_at: string;
  priority: "low" | "medium" | "high";
}

interface RecentEvidence {
  id: string;
  incident_id: string;
  name: string;
  type: string;
  uploaded_at: string;
  officer_name: string;
  mime_type: string;
}

interface OfficerTask {
  id: string;
  title: string;
  description: string | null;
  task_type: string;
  priority: string;
  status: string;
  reference_type: string | null;
  reference_id: string | null;
  due_at: string | null;
  created_at: string;
}

interface LocalDraft {
  id: string;
  type: "incident" | "evidence" | "note";
  title: string;
  preview: string;
  updatedAt: string;
}

// ─── Theme colors ──────────────────────────────────────

const SEVERITY_COLORS: Record<string, string> = {
  critical: "bg-red-500/10 text-red-500 border-red-500/20",
  serious: "bg-orange-500/10 text-orange-500 border-orange-500/20",
  moderate: "bg-amber-500/10 text-amber-500 border-amber-500/20",
  minor: "bg-blue-500/10 text-blue-500 border-blue-500/20",
};

const STATUS_COLORS: Record<string, string> = {
  draft: "bg-secondary text-muted-foreground",
  submitted: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  under_review: "bg-amber-500/10 text-amber-500 border-amber-500/20",
  assigned: "bg-purple-500/10 text-purple-500 border-purple-500/20",
  investigating: "bg-indigo-500/10 text-indigo-500 border-indigo-500/20",
  escalated: "bg-red-500/10 text-red-500 border-red-500/20",
  confirmed: "bg-green-500/10 text-green-500 border-green-500/20",
  resolved: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
  closed: "bg-secondary text-muted-foreground",
};

const STATUS_ICONS: Record<string, React.ReactNode> = {
  draft: <FileText className="w-3.5 h-3.5" />,
  submitted: <Clock className="w-3.5 h-3.5" />,
  under_review: <Search className="w-3.5 h-3.5" />,
  assigned: <User className="w-3.5 h-3.5" />,
  investigating: <Activity className="w-3.5 h-3.5" />,
  escalated: <AlertTriangle className="w-3.5 h-3.5" />,
  confirmed: <CheckCircle2 className="w-3.5 h-3.5" />,
  resolved: <CheckSquare className="w-3.5 h-3.5" />,
  closed: <X className="w-3.5 h-3.5" />,
};

// ─── Components ────────────────────────────────────────

function IncidentCard({ incident, onClick }: { incident: AssignedIncident; onClick: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="group"
    >
      <Card
        className="clay-card !rounded-2xl border-border/50 hover:border-primary/30 hover:shadow-md transition-all cursor-pointer"
        onClick={onClick}
      >
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
              SEVERITY_COLORS[incident.severity] || "bg-secondary"
            }`}>
              {incident.severity === "critical" || incident.severity === "serious"
                ? <AlertTriangle className="w-4 h-4" />
                : <Car className="w-4 h-4" />
              }
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <Badge variant="outline" className={`text-[9px] px-1.5 py-0 h-3.5 ${STATUS_COLORS[incident.status] || "bg-secondary"}`}>
                  {STATUS_ICONS[incident.status]}
                  <span className="ml-1">{incident.status.replace(/_/g, " ")}</span>
                </Badge>
                <Badge variant="outline" className={`text-[9px] px-1.5 py-0 h-3.5 ${SEVERITY_COLORS[incident.severity] || ""}`}>
                  {incident.severity}
                </Badge>
              </div>
              <h3 className="text-sm font-semibold truncate">{incident.title}</h3>
              {incident.description && (
                <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{incident.description}</p>
              )}
              <div className="flex items-center gap-3 mt-2 text-[10px] text-muted-foreground">
                <span>{new Date(incident.created_at).toLocaleDateString()}</span>
                {incident.vehicle_plate && (
                  <span className="font-mono">{incident.vehicle_plate}</span>
                )}
                {incident.location_address && (
                  <span className="flex items-center gap-1 truncate max-w-[120px]">
                    <MapPin className="w-2.5 h-2.5 shrink-0" />
                    <span className="truncate">{incident.location_address}</span>
                  </span>
                )}
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0 mt-1 opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function ReviewCard({ review, onClick }: { review: PendingReview; onClick: () => void }) {
  const icons = {
    ai_analysis: <Brain className="w-4 h-4" />,
    anpr: <Camera className="w-4 h-4" />,
    citizen_report: <MessageSquare className="w-4 h-4" />,
  };

  const labels = {
    ai_analysis: "AI Analysis",
    anpr: "Plate Recognition",
    citizen_report: "Citizen Report",
  };

  const priorityColors = {
    high: "bg-red-500/10 text-red-500 border-red-500/20",
    medium: "bg-amber-500/10 text-amber-500 border-amber-500/20",
    low: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
    >
      <Card
        className="clay-card !rounded-2xl border-border/50 hover:border-primary/30 hover:shadow-md transition-all cursor-pointer"
        onClick={onClick}
      >
        <CardContent className="p-3.5">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              {icons[review.type]}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium">{labels[review.type]}</span>
                <Badge variant="outline" className={`text-[8px] px-1.5 py-0 h-3.5 ${priorityColors[review.priority]}`}>
                  {review.priority}
                </Badge>
              </div>
              <p className="text-xs font-semibold mt-0.5 truncate">{review.title}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-1">{review.description}</p>
              <p className="text-[9px] text-muted-foreground mt-1">{new Date(review.created_at).toLocaleDateString()}</p>
            </div>
            <ChevronRight className="w-3.5 h-3.5 text-muted-foreground shrink-0 mt-1" />
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function EvidenceThumb({ evidence }: { evidence: RecentEvidence }) {
  const typeIcons: Record<string, React.ReactNode> = {
    photo: <Image className="w-4 h-4 text-blue-500" />,
    video: <Video className="w-4 h-4 text-purple-500" />,
    document: <FileText className="w-4 h-4 text-amber-500" />,
    audio: <Megaphone className="w-4 h-4 text-green-500" />,
  };
  const typeColors: Record<string, string> = {
    photo: "bg-blue-500/10",
    video: "bg-purple-500/10",
    document: "bg-amber-500/10",
    audio: "bg-green-500/10",
  };

  return (
    <div className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-secondary/30 transition-colors cursor-pointer">
      <div className={`w-8 h-8 rounded-lg ${typeColors[evidence.type] || "bg-secondary"} flex items-center justify-center shrink-0`}>
        {typeIcons[evidence.type] || <FileText className="w-4 h-4" />}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium truncate">{evidence.name}</p>
        <p className="text-[10px] text-muted-foreground">
          {evidence.officer_name} · {new Date(evidence.uploaded_at).toLocaleDateString()}
        </p>
      </div>
    </div>
  );
}

// ─── Main Officer Dashboard ────────────────────────────

export default function OfficerDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { online } = useNetwork();

  // State
  const [assignedIncidents, setAssignedIncidents] = useState<AssignedIncident[]>([]);
  const [pendingReviews, setPendingReviews] = useState<PendingReview[]>([]);
  const [recentEvidence, setRecentEvidence] = useState<RecentEvidence[]>([]);
  const [syncQueueCount, setSyncQueueCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [dashboardTab, setDashboardTab] = useState("cases");
  const [showUploader, setShowUploader] = useState(false);
  const [tasks, setTasks] = useState<OfficerTask[]>([]);
  const [drafts, setDrafts] = useState<LocalDraft[]>([]);
  const [hasDrafts, setHasDrafts] = useState(false);

  // Calculate today's stats from assigned incidents
  const todayStats = {
    assigned: assignedIncidents.length,
    active: assignedIncidents.filter((i) => i.status === "assigned" || i.status === "investigating").length,
    resolved: assignedIncidents.filter((i) => i.status === "resolved" || i.status === "closed").length,
    critical: assignedIncidents.filter((i) => i.severity === "critical" || i.severity === "serious").length,
  };

  // Load data
// eslint-disable-next-line react-hooks/preserve-manual-memoization
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      // In a real app, this would query incident_assignments for the current officer
      // For now, use the incidents table filtered by officer_id
      const { data: incidents } = await supabase
        .from("incidents")
        .select("*")
        .eq("officer_id", user?.id)
        .order("created_at", { ascending: false })
        .limit(10);

      if (incidents) setAssignedIncidents(incidents as AssignedIncident[]);
    } catch (err) {
      console.debug("Load officer data:", err);
    }

    // Mock pending reviews for demo
    setPendingReviews([
      {
        id: "review-1", type: "ai_analysis", priority: "high",
        title: "Speeding violation — LBR-4521",
        description: "AI detected 95 km/h in 50 zone. 92% confidence. Review and confirm.",
        created_at: "2026-07-27T09:30:00Z",
      },
      {
        id: "review-2", type: "anpr", priority: "medium",
        title: "Plate read requires verification",
        description: "ANPR read 'LBR-4821' at 87% confidence. Officer correction needed.",
        created_at: "2026-07-27T08:15:00Z",
      },
      {
        id: "review-3", type: "citizen_report", priority: "medium",
        title: "Citizen report — Reckless Driving",
        description: "Citizen reported dangerous overtaking on UN Drive. Evidence attached.",
        created_at: "2026-07-27T07:45:00Z",
      },
      {
        id: "review-4", type: "ai_analysis", priority: "low",
        title: "Illegal parking — White SUV",
        description: "AI detected vehicle blocking emergency lane. 78% confidence.",
        created_at: "2026-07-26T22:10:00Z",
      },
    ]);

    // Mock recent evidence
    setRecentEvidence([
      { id: "ev-1", incident_id: "INC-001", name: "speed_radar_footage.mp4", type: "video", uploaded_at: "2026-07-27T09:35:00Z", officer_name: "Sgt. Kollie", mime_type: "video/mp4" },
      { id: "ev-2", incident_id: "INC-001", name: "plate_closeup.jpg", type: "photo", uploaded_at: "2026-07-27T09:34:00Z", officer_name: "Sgt. Kollie", mime_type: "image/jpeg" },
      { id: "ev-3", incident_id: "INC-002", name: "intersection_view.jpg", type: "photo", uploaded_at: "2026-07-27T08:20:00Z", officer_name: "Ofc. Tarplah", mime_type: "image/jpeg" },
      { id: "ev-4", incident_id: "INC-003", name: "dashcam_rear.mp4", type: "video", uploaded_at: "2026-07-27T07:00:00Z", officer_name: "Ofc. Flomo", mime_type: "video/mp4" },
      { id: "ev-5", incident_id: "INC-004", name: "officer_notes.pdf", type: "document", uploaded_at: "2026-07-26T17:30:00Z", officer_name: "Sgt. Kollie", mime_type: "application/pdf" },
    ]);

    // Load tasks
    try {
      const { data: taskData } = await supabase
        .from("officer_tasks")
        .select("*")
        .eq("officer_id", user?.id)
        .in("status", ["pending", "in_progress"])
        .order("created_at", { ascending: false })
        .limit(10);
      if (taskData) setTasks(taskData as OfficerTask[]);
    } catch { /* silent */ }

    // Check sync queue
    try {
      const queue = await getPendingSyncQueue();
      setSyncQueueCount(queue.length);
    } catch { /* silent */ }

    // Check local drafts
    try {
      const { getAllDrafts } = await import("@/lib/offline");
      const localDrafts = await getAllDrafts();
      if (localDrafts.length > 0) {
        setDrafts(
// eslint-disable-next-line @typescript-eslint/no-explicit-any
          localDrafts.map((d: any) => ({
            id: d.id,
            type: d.type,
            title: d.data?.title || d.data?.violationType || d.type,
            preview: d.data?.description || "No description",
            updatedAt: d.updatedAt,
          }))
        );
        setHasDrafts(true);
      }
    } catch { /* silent */ }

    setLoading(false);
  }, [user?.id]);

  useEffect(() => {
// eslint-disable-next-line react-hooks/set-state-in-effect
    loadData();
  }, [loadData]);

  // Refresh sync queue periodically
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const queue = await getPendingSyncQueue();
        setSyncQueueCount(queue.length);
      } catch { /* silent */ }
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleUploadComplete = () => {
    toast.success("Evidence uploaded successfully");
    setShowUploader(false);
    loadData();
  };

  return (
    <AppLayout>
      <div className="space-y-6 pb-8">
        {/* ─── Officer Status Header ─── */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-background border border-border/50 p-5 sm:p-6"
        >
          <div className="absolute top-0 right-0 w-48 h-48 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
          <div className="relative z-10">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="flex items-center gap-4 flex-1 min-w-0">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center shrink-0 shadow-lg shadow-primary/10">
                  <Shield className="w-6 h-6 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h1 className="text-xl sm:text-2xl font-bold truncate">
                      {user?.profile?.full_name || "Officer"}
                    </h1>
                    <Badge variant="outline" className="clay-pill text-[10px] px-2 py-0 h-5 bg-primary/10 text-primary border-primary/20">
                      {"Officer"}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                    <span>#{user?.profile?.badge_number || "N/A"}</span>
                    <span className="w-1 h-1 rounded-full bg-muted-foreground/30" />
                    <span>{user?.profile?.station || "No station"}</span>
                    {user?.profile?.department && (
                      <>
                        <span className="w-1 h-1 rounded-full bg-muted-foreground/30" />
                        <span>{user.profile.department}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                {/* Online/Offline */}
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-card/80 border border-border/50">
                  <div className={`w-2 h-2 rounded-full ${online ? "bg-emerald-500" : "bg-destructive"}`} />
                  <span className={`text-xs ${online ? "text-emerald-500" : "text-destructive"}`}>
                    {online ? "Online" : "Offline"}
                  </span>
                </div>

                {/* Sync Queue */}
                {!online && syncQueueCount > 0 && (
                  <Badge variant="outline" className="clay-pill text-[10px] px-2 py-0 h-5 bg-amber-500/10 text-amber-500 border-amber-500/20">
                    <WifiOff className="w-3 h-3 mr-1" />
                    {syncQueueCount} queued
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </motion.div>

        {/* ─── Today's Stats ─── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "My Cases", value: todayStats.assigned.toString(), icon: FileText, color: "from-blue-400/30 to-blue-600/30" },
            { label: "Active", value: todayStats.active.toString(), icon: Activity, color: "from-amber-400/30 to-amber-600/30" },
            { label: "Critical", value: todayStats.critical.toString(), icon: AlertTriangle, color: "from-red-400/30 to-red-600/30" },
            { label: "Resolved", value: todayStats.resolved.toString(), icon: CheckCircle2, color: "from-emerald-400/30 to-emerald-600/30" },
          ].map((stat, i) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Card className="clay-card border-border/50 !rounded-2xl">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">{stat.label}</p>
                        <p className="text-xl font-bold mt-1">{stat.value}</p>
                      </div>
                      <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center`}>
                        <Icon className="w-4 h-4" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>

        {/* ─── Quick Actions ─── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <Button className="clay-btn rounded-xl h-auto py-3" onClick={() => navigate("/incidents/new")}>
            <Plus className="w-4 h-4 mr-1.5" />
            New Incident
          </Button>
          <Button variant="outline" className="rounded-xl h-auto py-3" onClick={() => setShowUploader(!showUploader)}>
            <Camera className="w-4 h-4 mr-1.5" />
            {showUploader ? "Close Upload" : "Upload Evidence"}
          </Button>
          <Button variant="outline" className="rounded-xl h-auto py-3" onClick={() => navigate("/incidents?view=map")}>
            <MapPin className="w-4 h-4 mr-1.5" />
            Incident Map
          </Button>
          <Button variant="outline" className="rounded-xl h-auto py-3" onClick={() => navigate("/incidents")}>
            <Search className="w-4 h-4 mr-1.5" />
            Search Cases
          </Button>
        </div>

        {/* ─── Evidence Upload (collapsible) ─── */}
        <AnimatePresence>
          {showUploader && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <Card className="clay-card !rounded-2xl border-border/50">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Camera className="w-4 h-4 text-primary" />
                    Capture & Upload Evidence
                  </CardTitle>
                  <CardDescription>
                    Upload photos, videos, or documents to an incident. Files stored securely with SHA-256 verification.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <EvidenceUpload
                    incidentId="new"
                    onUploadComplete={handleUploadComplete}
                    maxFiles={10}
                  />
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ─── Main Content Tabs ─── */}
        <Tabs value={dashboardTab} onValueChange={setDashboardTab}>
          <TabsList className="clay-card bg-secondary/50 p-1 rounded-xl w-full sm:w-auto overflow-x-auto">
            <TabsTrigger value="cases" className="rounded-lg data-[state=active]:bg-card data-[state=active]:clay-card text-xs sm:text-sm">
              <FileText className="w-3.5 h-3.5 mr-1.5" />
              My Cases
            </TabsTrigger>
            <TabsTrigger value="review" className="rounded-lg data-[state=active]:bg-card data-[state=active]:clay-card text-xs sm:text-sm">
              <Brain className="w-3.5 h-3.5 mr-1.5" />
              Review Queue
              {pendingReviews.length > 0 && (
                <Badge className="ml-1.5 bg-primary text-primary-foreground text-[9px] px-1.5 py-0 h-3.5">
                  {pendingReviews.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="tasks" className="rounded-lg data-[state=active]:bg-card data-[state=active]:clay-card text-xs sm:text-sm">
              <CheckSquare className="w-3.5 h-3.5 mr-1.5" />
              My Tasks
              {tasks.length > 0 && (
                <Badge className="ml-1.5 bg-primary text-primary-foreground text-[9px] px-1.5 py-0 h-3.5">
                  {tasks.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="evidence" className="rounded-lg data-[state=active]:bg-card data-[state=active]:clay-card text-xs sm:text-sm">
              <Camera className="w-3.5 h-3.5 mr-1.5" />
              Recent Evidence
            </TabsTrigger>
          </TabsList>

          {/* ─── Tab: My Cases ─── */}
          <TabsContent value="cases" className="mt-4 space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">
                {assignedIncidents.length === 0
                  ? "No assigned cases"
                  : `${assignedIncidents.length} case${assignedIncidents.length !== 1 ? "s" : ""}`
                }
              </p>
              <Button variant="ghost" size="sm" className="rounded-xl text-xs" onClick={() => navigate("/incidents")}>
                View All <ArrowRight className="w-3 h-3 ml-1" />
              </Button>
            </div>

            {loading ? (
              <Card className="clay-card !rounded-2xl border-border/50">
                <CardContent className="p-12 text-center">
                  <Loader2 className="w-5 h-5 animate-spin text-muted-foreground mx-auto" />
                </CardContent>
              </Card>
            ) : assignedIncidents.length === 0 ? (
              <Card className="clay-card !rounded-2xl border-border/50">
                <CardContent className="p-10 text-center">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto">
                    <FileText className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="font-semibold mt-4">No Assigned Cases</h3>
                  <p className="text-sm text-muted-foreground mt-2 max-w-xs mx-auto">
                    You don't have any assigned cases yet. Create a new incident or check the incidents list.
                  </p>
                  <div className="flex gap-3 justify-center mt-4">
                    <Button className="clay-btn rounded-xl" onClick={() => navigate("/incidents/new")}>
                      <Plus className="w-4 h-4 mr-1" />
                      New Incident
                    </Button>
                    <Button variant="outline" className="rounded-xl" onClick={() => navigate("/incidents")}>
                      <List className="w-4 h-4 mr-1" />
                      All Incidents
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-2.5">
                {assignedIncidents.map((incident) => (
                  <IncidentCard
                    key={incident.id}
                    incident={incident}
                    onClick={() => navigate(`/incidents/${incident.id}`)}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          {/* ─── Tab: Review Queue ─── */}
          <TabsContent value="review" className="mt-4 space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">
                {pendingReviews.length} item{pendingReviews.length !== 1 ? "s" : ""} pending review
              </p>
              <Button variant="ghost" size="sm" className="rounded-xl text-xs" onClick={loadData}>
                <RefreshCw className="w-3 h-3 mr-1" />
                Refresh
              </Button>
            </div>

            <div className="space-y-2.5">
              {pendingReviews.map((review) => (
                <ReviewCard
                  key={review.id}
                  review={review}
                  onClick={() => {
                    if (review.type === "citizen_report") navigate("/review/citizen-reports");
                    else navigate("/incidents");
                  }}
                />
              ))}
            </div>
          </TabsContent>

          {/* ─── Tab: Tasks ─── */}
          <TabsContent value="tasks" className="mt-4 space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">
                {tasks.length === 0
                  ? "No pending tasks"
                  : `${tasks.length} task${tasks.length !== 1 ? "s" : ""}`
                }
              </p>
              {hasDrafts && (
                <Badge variant="outline" className="clay-pill text-[10px] px-2 py-0 h-5 bg-amber-500/10 text-amber-500 border-amber-500/20">
                  {drafts.length} draft{drafts.length !== 1 ? "s" : ""} offline
                </Badge>
              )}
            </div>

            {loading ? (
              <Card className="clay-card !rounded-2xl border-border/50">
                <CardContent className="p-12 text-center">
                  <Loader2 className="w-5 h-5 animate-spin text-muted-foreground mx-auto" />
                </CardContent>
              </Card>
            ) : tasks.length === 0 && !hasDrafts ? (
              <Card className="clay-card !rounded-2xl border-border/50">
                <CardContent className="p-10 text-center">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto">
                    <CheckSquare className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="font-semibold mt-4">No Pending Tasks</h3>
                  <p className="text-sm text-muted-foreground mt-2 max-w-xs mx-auto">
                    You're all caught up! No pending tasks or drafts require your attention.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-2">
                {/* Drafts section */}
                {hasDrafts && (
                  <div className="mb-2">
                    <div className="flex items-center gap-2 mb-2">
                      <FileText className="w-3.5 h-3.5 text-muted-foreground" />
                      <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Offline Drafts</span>
                    </div>
                    <div className="space-y-1.5">
                      {drafts.slice(0, 3).map((draft) => (
                        <div
                          key={draft.id}
                          className="flex items-center gap-3 p-2.5 rounded-xl bg-amber-500/5 border border-amber-500/10 cursor-pointer hover:bg-amber-500/10 transition-colors"
                          onClick={() => navigate("/incidents/new")}
                        >
                          <div className="w-7 h-7 rounded-lg bg-amber-500/10 flex items-center justify-center">
                            <FileText className="w-3.5 h-3.5 text-amber-500" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium truncate">{draft.title || draft.type}</p>
                            <p className="text-[10px] text-muted-foreground truncate">{draft.preview}</p>
                          </div>
                          <span className="text-[9px] text-muted-foreground shrink-0">
                            {new Date(draft.updatedAt).toLocaleDateString()}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Tasks */}
                {tasks.length > 0 && (
                  <>
                    <div className="flex items-center gap-2 mb-2">
                      <CheckSquare className="w-3.5 h-3.5 text-muted-foreground" />
                      <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                        Assignments
                      </span>
                    </div>
                    <div className="space-y-1.5">
                      {tasks.map((task) => {
                        const priorityDot = {
                          urgent: "bg-red-500",
                          high: "bg-amber-500",
                          normal: "bg-blue-500",
                          low: "bg-gray-400",
                        }[task.priority] || "bg-blue-500";

                        return (
                          <div
                            key={task.id}
                            className="flex items-center gap-3 p-2.5 rounded-xl bg-secondary/20 hover:bg-secondary/40 transition-colors cursor-pointer"
                            onClick={() => {
                              if (task.reference_type === "incident" && task.reference_id)
                                navigate(`/incidents/${task.reference_id}`);
                              else if (task.reference_type === "citizen_report")
                                navigate("/review/citizen-reports");
                            }}
                          >
                            <div className={`w-2 h-2 rounded-full ${priorityDot} shrink-0`} />
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-medium truncate">{task.title}</p>
                              {task.description && (
                                <p className="text-[10px] text-muted-foreground truncate">{task.description}</p>
                              )}
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              {task.due_at && (
                                <span className="text-[9px] text-muted-foreground">
                                  Due {new Date(task.due_at).toLocaleDateString()}
                                </span>
                              )}
                              <Badge variant="outline" className="text-[8px] px-1.5 py-0 h-3.5">
                                {task.task_type.replace(/_/g, " ")}
                              </Badge>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </>
                )}
              </div>
            )}
          </TabsContent>

          {/* ─── Tab: Recent Evidence ─── */}
          <TabsContent value="evidence" className="mt-4 space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">
                {recentEvidence.length} recent file{recentEvidence.length !== 1 ? "s" : ""}
              </p>
              <Button variant="ghost" size="sm" className="rounded-xl text-xs" onClick={() => navigate("/evidence")}>
                View All <ArrowRight className="w-3 h-3 ml-1" />
              </Button>
            </div>

            {recentEvidence.length === 0 ? (
              <Card className="clay-card !rounded-2xl border-border/50">
                <CardContent className="p-10 text-center">
                  <Camera className="w-8 h-8 text-muted-foreground mx-auto" />
                  <p className="text-sm text-muted-foreground mt-2">No recent evidence</p>
                </CardContent>
              </Card>
            ) : (
              <Card className="clay-card !rounded-2xl border-border/50">
                <CardContent className="p-2">
                  <div className="divide-y divide-border/30">
                    {recentEvidence.map((ev) => (
                      <EvidenceThumb key={ev.id} evidence={ev} />
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>

        {/* ─── Footer Quick Links ─── */}
        <div className="grid sm:grid-cols-3 gap-3">
          <Button
            variant="outline"
            className="clay-card h-auto p-4 rounded-xl flex-col items-start gap-2 !shadow-sm"
            onClick={() => navigate("/incidents")}
          >
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center">
                <BarChart3 className="w-4 h-4 text-purple-500" />
              </div>
              <div className="text-left">
                <p className="text-sm font-semibold">All Incidents</p>
                <p className="text-xs text-muted-foreground">Browse, search, filter cases</p>
              </div>
            </div>
          </Button>
          <Button
            variant="outline"
            className="clay-card h-auto p-4 rounded-xl flex-col items-start gap-2 !shadow-sm"
            onClick={() => navigate("/evidence")}
          >
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                <Shield className="w-4 h-4 text-emerald-500" />
              </div>
              <div className="text-left">
                <p className="text-sm font-semibold">Evidence Center</p>
                <p className="text-xs text-muted-foreground">Secure digital evidence vault</p>
              </div>
            </div>
          </Button>
          <Button
            variant="outline"
            className="clay-card h-auto p-4 rounded-xl flex-col items-start gap-2 !shadow-sm"
            onClick={() => navigate("/review/citizen-reports")}
          >
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center">
                <MessageSquare className="w-4 h-4 text-amber-500" />
              </div>
              <div className="text-left">
                <p className="text-sm font-semibold">Citizen Reports</p>
                <p className="text-xs text-muted-foreground">Review public submissions</p>
              </div>
            </div>
          </Button>
        </div>
      </div>
    </AppLayout>
  );
}
