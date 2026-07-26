import { useState, useCallback } from "react";
import { useNavigate, useParams } from "react-router";
import { AppLayout } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  ArrowLeft,
  Car,
  MapPin,
  Clock,
  User,
  Shield,
  Camera,
  FileText,
  Brain,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Download,
  Share2,
  Trash2,
  Edit,
  WifiOff,
  Image,
  Video,
  File,
  ScanLine,
  RefreshCw,
  ArrowUpCircle,
  UserPlus,
  Users,
  Eye,
  FileSpreadsheet,
  GripVertical,
  MessageSquare,
} from "lucide-react";
import { IncidentMap } from "@/components/IncidentMap";
import { AIAnalysisPanel } from "@/ai/components/AIAnalysisPanel";
import { ANPREditor } from "@/ai/components/ANPREditor";
import { submitForAnalysis, reviewAnalysisResult, getAnalysisResultsForIncident } from "@/ai/pipeline";
import { providerRegistry } from "@/ai/registry";
import type { AIAnalysisResult } from "@/ai/types";
import { useAuth } from "@/hooks/use-auth";
import { AssignDialog } from "@/components/AssignDialog";
import { EscalateDialog } from "@/components/EscalateDialog";
import { InvolvedPersons } from "@/components/InvolvedPersons";
import { ReportGenerator } from "@/components/ReportGenerator";
import { toast } from "sonner";

export default function IncidentDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("overview");
  const [aiAnalysis, setAiAnalysis] = useState<AIAnalysisResult | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiInitialized, setAiInitialized] = useState(false);

  // Dialogs
  const [showAssign, setShowAssign] = useState(false);
  const [showEscalate, setShowEscalate] = useState(false);
  const [showReport, setShowReport] = useState(false);

  // Incident state (mutable for status transitions)
  const [incidentStatus, setIncidentStatus] = useState("under_review");
  const [assignedTo, setAssignedTo] = useState<{ id: string; name: string } | null>(null);
  const [timeline, setTimeline] = useState([
    { action: "Incident Reported", time: "2024-07-26 09:23", user: "Sgt. John Kollie" },
    { action: "Evidence Uploaded", time: "2024-07-26 09:30", user: "Sgt. John Kollie" },
    { action: "AI Analysis Complete", time: "2024-07-26 09:32", user: "TrafficWatch AI" },
    { action: "Submitted for Review", time: "2024-07-26 09:35", user: "Sgt. John Kollie" },
  ]);

  const addTimelineEntry = (action: string) => {
    setTimeline(prev => [...prev, {
      action,
      time: new Date().toLocaleString(),
      user: user?.profile?.full_name || "Officer",
    }]);
  };

  // Initialize AI provider
  const initAI = useCallback(async () => {
    if (aiInitialized) return;
    try {
      const existing = providerRegistry.getProvider("vly");
      if (!existing) {
        await providerRegistry.initialize({
          id: "vly",
          name: "TrafficWatch AI Engine",
          version: "1.0",
          capabilities: ["image_analysis", "license_plate_detection", "object_detection", "violation_classification", "ocr"],
        });
      }
      setAiInitialized(true);
    } catch (err) {
      console.error("Failed to initialize AI provider:", err);
    }
  }, [aiInitialized]);

  // Trigger AI analysis
  const handleRunAnalysis = useCallback(async () => {
    if (!id) return;
    await initAI();
    setAiLoading(true);
    try {
      const result = await submitForAnalysis(
        id,
        [{ type: "photo", url: "evidence/front-view.jpg", mimeType: "image/jpeg", fileName: "front_view.jpg" }],
        ["ev-001"]
      );
      setAiAnalysis(result);
      setActiveTab("ai");
      toast.success("AI analysis completed");
      addTimelineEntry("AI Analysis Complete");
    } catch (err) {
      toast.error("AI analysis failed: " + (err instanceof Error ? err.message : "Unknown error"));
    } finally {
      setAiLoading(false);
    }
  }, [id, initAI]);

  const handleConfirmAnalysis = useCallback(async (notes?: string) => {
    if (!aiAnalysis || !user?.id) return;
    try {
      await reviewAnalysisResult(aiAnalysis.id, { confirmed: true, officerId: user.id, notes });
      setAiAnalysis(prev => prev ? { ...prev, isReviewed: true, reviewedBy: user.id, reviewedAt: new Date().toISOString(), officerNotes: notes || "" } : prev);
      toast.success("AI findings confirmed");
      addTimelineEntry("AI Analysis Confirmed");
    } catch (err) {
      toast.error("Failed to confirm analysis");
    }
  }, [aiAnalysis, user]);

  const handleRejectAnalysis = useCallback(async (notes?: string, correctedPlate?: string) => {
    if (!aiAnalysis || !user?.id) return;
    try {
      await reviewAnalysisResult(aiAnalysis.id, { confirmed: false, officerId: user.id, notes, correctedPlate });
      setAiAnalysis(prev => prev ? { ...prev, isReviewed: true, reviewedBy: user.id, reviewedAt: new Date().toISOString(), officerNotes: notes || "", officerOverride: { correctedPlate, notes: notes || "" } } : prev);
      toast.success("AI findings overridden");
      addTimelineEntry("AI Analysis Overridden by Officer");
    } catch (err) {
      toast.error("Failed to override analysis");
    }
  }, [aiAnalysis, user]);

  // Status transition handlers
  const handleAssign = async (officerId: string, role: string, notes?: string) => {
    setAssignedTo({ id: officerId, name: "Officer #" + officerId.slice(-4) });
    setIncidentStatus("assigned");
    addTimelineEntry(`Assigned to ${role} for ${role}`);
    return;
  };

  const handleEscalate = async (level: string, reason: string, notes: string) => {
    setIncidentStatus("escalated");
    addTimelineEntry(`Escalated to ${level} — ${reason.replace(/_/g, " ")}`);
    return;
  };

  const handleStartInvestigation = () => {
    setIncidentStatus("investigating");
    addTimelineEntry("Investigation Started");
    toast.success("Investigation started");
  };

  const handleConfirm = () => {
    setIncidentStatus("confirmed");
    addTimelineEntry("Violation Confirmed");
    toast.success("Incident confirmed");
  };

  const handleResolve = () => {
    setIncidentStatus("resolved");
    addTimelineEntry("Incident Resolved");
    toast.success("Incident resolved");
  };

  const handleClose = () => {
    setIncidentStatus("closed");
    addTimelineEntry("Case Closed");
    toast.success("Case closed");
  };

  const handleReopen = () => {
    setIncidentStatus("under_review");
    addTimelineEntry("Case Reopened for Review");
    toast.success("Case reopened");
  };

  const handleArchive = () => {
    setIncidentStatus("archived");
    addTimelineEntry("Case Archived");
    toast.success("Case archived");
  };

  // Mock incident data
  const incident = {
    id: id || "INC-2024-0891",
    type: "Speeding",
    plate: "LBR-4521",
    location: "Monrovia, UN Drive",
    description: "Vehicle observed traveling at an estimated 95 km/h in a 50 km/h zone. Officer visually confirmed speed using calibrated radar gun. Driver was notified and vehicle was stopped at the next checkpoint.",
    severity: "moderate" as string,
    date: "2024-07-26T09:23:00",
    officer: "Sgt. John Kollie",
    officer_badge: "LNP-8741",
    officer_station: "Monrovia Central",
    vehicle_type: "Sedan",
    vehicle_color: "White",
    lat: 6.3156,
    lng: -10.8074,
    evidence_count: 4,
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "draft": return "bg-secondary text-secondary-foreground";
      case "submitted": return "bg-info/10 text-info border-info/20";
      case "under_review": return "bg-warning/10 text-warning border-warning/20";
      case "assigned": return "bg-blue-500/10 text-blue-500 border-blue-500/20";
      case "investigating": return "bg-purple-500/10 text-purple-500 border-purple-500/20";
      case "escalated": return "bg-orange-500/10 text-orange-500 border-orange-500/20";
      case "confirmed": return "bg-emerald-500/10 text-emerald-500 border-emerald-500/20";
      case "resolved": return "bg-success/10 text-success border-success/20";
      case "closed": return "bg-secondary text-secondary-foreground";
      case "rejected": return "bg-destructive/10 text-destructive border-destructive/20";
      case "archived": return "bg-secondary/50 text-muted-foreground border-border/50";
      default: return "bg-secondary text-secondary-foreground";
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical": return "bg-destructive/10 text-destructive";
      case "serious": return "bg-warning/10 text-warning";
      case "moderate": return "bg-info/10 text-info";
      case "minor": return "bg-success/10 text-success";
      default: return "bg-secondary";
    }
  };

  const canInvestigate = ["submitted", "under_review", "assigned"].includes(incidentStatus);
  const canConfirm = ["investigating", "under_review"].includes(incidentStatus);
  const canResolve = ["confirmed", "under_review", "investigating"].includes(incidentStatus);
  const canClose = ["resolved"].includes(incidentStatus);
  const canReopen = ["closed", "archived", "rejected"].includes(incidentStatus);
  const canArchive = ["closed", "resolved"].includes(incidentStatus);

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Back button */}
        <Button variant="ghost" size="sm" className="rounded-xl -ml-2" onClick={() => navigate("/incidents")}>
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to Incidents
        </Button>

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className={`w-3 h-3 rounded-full mt-2 shrink-0 ${
              incident.severity === "critical" ? "bg-destructive" :
              incident.severity === "serious" ? "bg-warning" :
              incident.severity === "moderate" ? "bg-info" : "bg-success"
            }`} />
            <div>
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-2xl font-bold">{incident.type}</h1>
                <Badge className={`clay-pill text-xs px-3 py-0.5 h-5 ${getStatusColor(incidentStatus)}`}>
                  {incidentStatus.replace("_", " ")}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                {incident.plate} · {incident.vehicle_color} {incident.vehicle_type}
                {assignedTo && ` · Assigned to ${assignedTo.name}`}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="rounded-xl">
              <Edit className="w-4 h-4 mr-1" />
              Edit
            </Button>
            <Button variant="outline" size="sm" className="rounded-xl">
              <Share2 className="w-4 h-4 mr-1" />
              Share
            </Button>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left column - Main content */}
          <div className="lg:col-span-2 space-y-6">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid grid-cols-6 rounded-xl p-1 bg-secondary">
                <TabsTrigger value="overview" className="rounded-lg text-xs">
                  <FileText className="w-3.5 h-3.5 mr-1" />
                  Overview
                </TabsTrigger>
                <TabsTrigger value="evidence" className="rounded-lg text-xs">
                  <Camera className="w-3.5 h-3.5 mr-1" />
                  Evidence ({incident.evidence_count})
                </TabsTrigger>
                <TabsTrigger value="people" className="rounded-lg text-xs">
                  <Users className="w-3.5 h-3.5 mr-1" />
                  People
                </TabsTrigger>
                <TabsTrigger value="ai" className="rounded-lg text-xs">
                  <Brain className="w-3.5 h-3.5 mr-1" />
                  AI Analysis
                </TabsTrigger>
                <TabsTrigger value="anpr" className="rounded-lg text-xs">
                  <ScanLine className="w-3.5 h-3.5 mr-1" />
                  ANPR
                </TabsTrigger>
                <TabsTrigger value="timeline" className="rounded-lg text-xs">
                  <Clock className="w-3.5 h-3.5 mr-1" />
                  Timeline
                </TabsTrigger>
              </TabsList>

              {/* Overview Tab */}
              <TabsContent value="overview" className="space-y-4 mt-4">
                <Card className="clay-card border-border/50 !rounded-2xl">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Incident Details</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid sm:grid-cols-2 gap-4">
                      {[
                        { label: "Violation Type", value: incident.type, icon: Car },
                        { label: "License Plate", value: incident.plate, icon: Shield },
                        { label: "Vehicle", value: `${incident.vehicle_color} ${incident.vehicle_type}`, icon: Car },
                        { label: "Severity", value: incident.severity, icon: AlertTriangle },
                        { label: "Location", value: incident.location, icon: MapPin },
                        { label: "Date & Time", value: new Date(incident.date).toLocaleString(), icon: Clock },
                        { label: "Reporting Officer", value: incident.officer, icon: User },
                        { label: "Badge #", value: incident.officer_badge, icon: Shield },
                      ].map((field) => (
                        <div key={field.label} className="flex items-start gap-3 p-3 rounded-xl bg-secondary/30">
                          <field.icon className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                          <div className="min-w-0">
                            <p className="text-xs text-muted-foreground">{field.label}</p>
                            <p className="text-sm font-medium truncate">{field.value}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="p-4 rounded-xl bg-secondary/30">
                      <p className="text-xs text-muted-foreground mb-2">Description</p>
                      <p className="text-sm leading-relaxed">{incident.description}</p>
                    </div>
                  </CardContent>
                </Card>

                <Card className="clay-card border-border/50 !rounded-2xl overflow-hidden">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Location</CardTitle>
                    <CardDescription>{incident.location}</CardDescription>
                  </CardHeader>
                  <CardContent className="p-0">
                    <IncidentMap
                      markers={[{
                        id: incident.id,
                        lat: incident.lat,
                        lng: incident.lng,
                        title: incident.type,
                        severity: incident.severity as any,
                      }]}
                      center={[incident.lat, incident.lng]}
                      zoom={15}
                      height="250px"
                      interactive={false}
                    />
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Evidence Tab */}
              <TabsContent value="evidence" className="space-y-4 mt-4">
                <Card className="clay-card border-border/50 !rounded-2xl">
                  <CardHeader className="pb-3 flex flex-row items-center justify-between">
                    <div>
                      <CardTitle className="text-base">Evidence Files</CardTitle>
                      <CardDescription>{incident.evidence_count} files attached</CardDescription>
                    </div>
                    <Button variant="outline" size="sm" className="rounded-xl">
                      <Camera className="w-4 h-4 mr-1" />
                      Add Evidence
                    </Button>
                  </CardHeader>
                  <CardContent>
                    <div className="grid sm:grid-cols-2 gap-3">
                      {[
                        { id: "EV-001", type: "photo", name: "Front view", file: "photo_001.jpg", size: "2.4 MB" },
                        { id: "EV-002", type: "photo", name: "License plate", file: "photo_002.jpg", size: "1.8 MB" },
                        { id: "EV-003", type: "video", name: "Speed radar footage", file: "video_001.mp4", size: "15.2 MB" },
                        { id: "EV-004", type: "document", name: "Officer notes", file: "notes_001.pdf", size: "0.3 MB" },
                      ].map((ev) => (
                        <div key={ev.id} className="flex items-center gap-3 p-3 rounded-xl bg-secondary/30 hover:bg-secondary/50 transition-colors cursor-pointer">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                            ev.type === "photo" ? "bg-blue-500/10" :
                            ev.type === "video" ? "bg-purple-500/10" : "bg-amber-500/10"
                          }`}>
                            {ev.type === "photo" ? <Image className="w-5 h-5 text-blue-500" /> :
                             ev.type === "video" ? <Video className="w-5 h-5 text-purple-500" /> :
                             <File className="w-5 h-5 text-amber-500" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{ev.name}</p>
                            <p className="text-xs text-muted-foreground">{ev.file} · {ev.size}</p>
                          </div>
                          <Button variant="ghost" size="icon" className="rounded-xl shrink-0">
                            <Download className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* People Tab */}
              <TabsContent value="people" className="space-y-4 mt-4">
                <InvolvedPersons incidentId={incident.id} />
              </TabsContent>

              {/* AI Analysis Tab */}
              <TabsContent value="ai" className="space-y-4 mt-4">
                {!aiInitialized && !aiAnalysis && (
                  <Card className="clay-card !rounded-2xl">
                    <CardContent className="p-6 text-center space-y-4">
                      <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center mx-auto">
                        <Brain className="w-7 h-7 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-medium mb-1">AI Analysis Ready</p>
                        <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                          Run AI-powered analysis on evidence to detect violations,
                          read license plates, and identify vehicles automatically.
                        </p>
                      </div>
                      <Button className="clay-btn rounded-xl" onClick={handleRunAnalysis} disabled={aiLoading}>
                        {aiLoading ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <Brain className="w-4 h-4 mr-2" />}
                        {aiLoading ? "Analyzing..." : "Run AI Analysis"}
                      </Button>
                    </CardContent>
                  </Card>
                )}
                <AIAnalysisPanel
                  analysis={aiAnalysis}
                  isLoading={aiLoading}
                  officerId={user?.id}
                  onConfirm={handleConfirmAnalysis}
                  onReject={handleRejectAnalysis}
                  onReanalyze={handleRunAnalysis}
                />
              </TabsContent>

              {/* ANPR Tab */}
              <TabsContent value="anpr" className="space-y-4 mt-4">
                <ANPREditor
                  plateResult={aiAnalysis?.licensePlate || null}
                  onVerify={(corrected) => { if (aiAnalysis) handleConfirmAnalysis(`Plate verified: ${corrected}`); }}
                  onReject={() => { if (aiAnalysis) handleRejectAnalysis("Plate detection rejected"); }}
                />
                {!aiAnalysis && (
                  <Card className="clay-card !rounded-2xl">
                    <CardContent className="p-6 text-center space-y-3">
                      <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center mx-auto">
                        <ScanLine className="w-6 h-6 text-muted-foreground" />
                      </div>
                      <p className="text-sm text-muted-foreground">Run AI analysis first to detect license plates via ANPR</p>
                      <Button variant="outline" size="sm" className="rounded-xl" onClick={handleRunAnalysis}>
                        <Brain className="w-4 h-4 mr-2" /> Run Analysis
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              {/* Timeline Tab */}
              <TabsContent value="timeline" className="space-y-4 mt-4">
                <Card className="clay-card border-border/50 !rounded-2xl">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Activity Timeline</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="relative">
                      <div className="absolute left-4 top-0 bottom-0 w-px bg-border" />
                      <div className="space-y-6">
                        {timeline.map((event, i) => (
                          <div key={i} className="relative pl-10">
                            <div className="absolute left-2.5 top-1 w-3 h-3 rounded-full bg-primary border-2 border-card" />
                            <div>
                              <p className="text-sm font-medium">{event.action}</p>
                              <div className="flex items-center gap-2 mt-0.5">
                                <span className="text-xs text-muted-foreground">{event.time}</span>
                                <span className="text-xs text-muted-foreground">by</span>
                                <span className="text-xs font-medium">{event.user}</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Right sidebar */}
          <div className="space-y-4">
            {/* Status Workflow */}
            <Card className="clay-card border-border/50 !rounded-2xl">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Workflow Actions</CardTitle>
                <CardDescription>Manage the incident lifecycle</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {/* Assign */}
                <Button
                  className="w-full rounded-xl"
                  variant="outline"
                  onClick={() => setShowAssign(true)}
                  disabled={!["submitted", "under_review", "draft"].includes(incidentStatus)}
                >
                  <UserPlus className="w-4 h-4 mr-2" />
                  {assignedTo ? "Reassign" : "Assign"}
                </Button>

                {/* Start Investigation */}
                {canInvestigate && (
                  <Button className="w-full rounded-xl" variant="outline" onClick={handleStartInvestigation}>
                    <Search className="w-4 h-4 mr-2" />
                    Start Investigation
                  </Button>
                )}

                {/* Escalate */}
                <Button
                  className="w-full rounded-xl"
                  variant="outline"
                  onClick={() => setShowEscalate(true)}
                  disabled={!["submitted", "under_review", "assigned", "investigating"].includes(incidentStatus)}
                >
                  <ArrowUpCircle className="w-4 h-4 mr-2" />
                  Escalate
                </Button>

                {/* Confirm Violation */}
                {canConfirm && (
                  <Button className="w-full clay-btn rounded-xl" variant="default" onClick={handleConfirm}>
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    Confirm Violation
                  </Button>
                )}

                {/* Resolve */}
                {canResolve && (
                  <Button className="w-full rounded-xl" variant="outline" onClick={handleResolve}>
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    Resolve Incident
                  </Button>
                )}

                {/* Close Case */}
                {canClose && (
                  <Button className="w-full rounded-xl" variant="outline" onClick={handleClose}>
                    <XCircle className="w-4 h-4 mr-2" />
                    Close Case
                  </Button>
                )}

                {/* Reopen */}
                {canReopen && (
                  <Button className="w-full rounded-xl" variant="outline" onClick={handleReopen}>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Reopen Case
                  </Button>
                )}

                {/* Archive */}
                {canArchive && (
                  <Button className="w-full rounded-xl" variant="outline" onClick={handleArchive}>
                    <Archive className="w-4 h-4 mr-2" />
                    Archive
                  </Button>
                )}

                <div className="border-t border-border/50 pt-2 mt-2 space-y-2">
                  <Button className="w-full rounded-xl" variant="outline" onClick={() => setShowReport(true)}>
                    <FileSpreadsheet className="w-4 h-4 mr-2" />
                    Generate Report
                  </Button>
                  <Button className="w-full rounded-xl" variant="outline">
                    <Download className="w-4 h-4 mr-2" />
                    Export PDF
                  </Button>
                  <Button variant="ghost" className="w-full rounded-xl text-destructive hover:text-destructive hover:bg-destructive/10">
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete Report
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Assignee info */}
            {assignedTo && (
              <Card className="clay-card border-border/50 !rounded-2xl">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-blue-500/10 flex items-center justify-center">
                    <User className="w-4 h-4 text-blue-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{assignedTo.name}</p>
                    <p className="text-xs text-muted-foreground">Assigned Investigator</p>
                  </div>
                  <Badge className="clay-pill text-[10px] px-1.5 py-0 h-4 bg-blue-500/10 text-blue-500 border-blue-500/20">
                    Active
                  </Badge>
                </CardContent>
              </Card>
            )}

            {/* Officer notes */}
            <Card className="clay-card border-border/50 !rounded-2xl">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Officer Notes</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Textarea
                  placeholder="Add confidential notes..."
                  className="clay-inset min-h-[100px] resize-none"
                  defaultValue="Driver was cooperative during stop. Admitted to speeding due to medical emergency. Referred to supervisor for discretion."
                />
                <Button className="w-full rounded-xl" variant="outline" size="sm">
                  Save Notes
                </Button>
              </CardContent>
            </Card>

            {/* Info */}
            <Card className="clay-card border-border/50 !rounded-2xl">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <WifiOff className="w-3 h-3" />
                  Download for offline viewing
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <AlertTriangle className="w-3 h-3" />
                  This data is encrypted at rest
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Dialogs */}
      <AssignDialog
        open={showAssign}
        onOpenChange={setShowAssign}
        incidentId={incident.id}
        currentAssignee={assignedTo}
        onAssign={handleAssign}
      />
      <EscalateDialog
        open={showEscalate}
        onOpenChange={setShowEscalate}
        incidentId={incident.id}
        onEscalate={handleEscalate}
      />
      <ReportGenerator
        open={showReport}
        onOpenChange={setShowReport}
        incidentId={incident.id}
        incidentTitle={incident.type}
      />
    </AppLayout>
  );
}

function Search({ className }: { className?: string }) {
  return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>;
}

function Archive({ className }: { className?: string }) {
  return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect width="20" height="5" x="2" y="3" rx="1"/><path d="M4 8v11a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8"/><path d="M10 12h4"/></svg>;
}
