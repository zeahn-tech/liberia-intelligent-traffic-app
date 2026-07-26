import { useState } from "react";
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
  ChevronRight,
  WifiOff,
  Image,
  Video,
  File,
} from "lucide-react";
import { IncidentMap } from "@/components/IncidentMap";

export default function IncidentDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("overview");

  // Mock incident data
  const incident = {
    id: id || "INC-2024-0891",
    type: "Speeding",
    plate: "LBR-4521",
    location: "Monrovia, UN Drive",
    description: "Vehicle observed traveling at an estimated 95 km/h in a 50 km/h zone. Officer visually confirmed speed using calibrated radar gun. Driver was notified and vehicle was stopped at the next checkpoint.",
    severity: "moderate" as string,
    status: "under_review",
    date: "2024-07-26T09:23:00",
    officer: "Sgt. John Kollie",
    officer_badge: "LNP-8741",
    officer_station: "Monrovia Central",
    vehicle_type: "Sedan",
    vehicle_color: "White",
    lat: 6.3156,
    lng: -10.8074,
    ai_analysis: {
      detected: true,
      violation: "Speeding",
      confidence: 94.7,
      summary: "AI analysis confirms vehicle exceeding posted speed limit. Front license plate clearly visible. Vehicle identified as white Toyota Corolla. Estimated speed: 92-98 km/h.",
      vehicle: "White Toyota Corolla",
      plate: "LBR-4521 (confirmed)",
      severity: "moderate",
      objects: ["Vehicle", "License Plate", "Road Sign", "Speed Limit Sign"],
      reviewed: false,
    },
    evidence: [
      { id: "EV-001", type: "photo", name: "Front view", file: "photo_001.jpg", size: "2.4 MB" },
      { id: "EV-002", type: "photo", name: "License plate", file: "photo_002.jpg", size: "1.8 MB" },
      { id: "EV-003", type: "video", name: "Speed radar footage", file: "video_001.mp4", size: "15.2 MB" },
      { id: "EV-004", type: "document", name: "Officer notes", file: "notes_001.pdf", size: "0.3 MB" },
    ],
    timeline: [
      { action: "Incident Reported", time: "2024-07-26 09:23", user: "Sgt. John Kollie" },
      { action: "Evidence Uploaded", time: "2024-07-26 09:30", user: "Sgt. John Kollie" },
      { action: "AI Analysis Complete", time: "2024-07-26 09:32", user: "TrafficWatch AI" },
      { action: "Submitted for Review", time: "2024-07-26 09:35", user: "Sgt. John Kollie" },
    ],
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "draft": return "bg-secondary text-secondary-foreground";
      case "submitted": return "bg-info/10 text-info border-info/20";
      case "under_review": return "bg-warning/10 text-warning border-warning/20";
      case "approved": return "bg-success/10 text-success border-success/20";
      case "rejected": return "bg-destructive/10 text-destructive border-destructive/20";
      case "resolved": return "bg-success/10 text-success border-success/20";
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
                <Badge className={`clay-pill text-xs px-3 py-0.5 h-5 ${getStatusColor(incident.status)}`}>
                  {incident.status.replace("_", " ")}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                {incident.plate} · {incident.vehicle_color} {incident.vehicle_type}
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
              <TabsList className="grid grid-cols-4 rounded-xl p-1 bg-secondary">
                <TabsTrigger value="overview" className="rounded-lg text-xs">
                  <FileText className="w-3.5 h-3.5 mr-1" />
                  Overview
                </TabsTrigger>
                <TabsTrigger value="evidence" className="rounded-lg text-xs">
                  <Camera className="w-3.5 h-3.5 mr-1" />
                  Evidence (4)
                </TabsTrigger>
                <TabsTrigger value="ai" className="rounded-lg text-xs">
                  <Brain className="w-3.5 h-3.5 mr-1" />
                  AI Analysis
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

                {/* Mini map */}
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
                      <CardDescription>{incident.evidence.length} files attached</CardDescription>
                    </div>
                    <Button variant="outline" size="sm" className="rounded-xl">
                      <Camera className="w-4 h-4 mr-1" />
                      Add Evidence
                    </Button>
                  </CardHeader>
                  <CardContent>
                    <div className="grid sm:grid-cols-2 gap-3">
                      {incident.evidence.map((ev) => (
                        <div key={ev.id} className="flex items-center gap-3 p-3 rounded-xl bg-secondary/30 hover:bg-secondary/50 transition-colors cursor-pointer">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                            ev.type === "photo" ? "bg-blue-500/10" :
                            ev.type === "video" ? "bg-purple-500/10" :
                            "bg-amber-500/10"
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

              {/* AI Analysis Tab */}
              <TabsContent value="ai" className="space-y-4 mt-4">
                <Card className={`clay-card border-border/50 !rounded-2xl overflow-hidden ${
                  incident.ai_analysis.confidence >= 90 ? "ring-2 ring-success/20" : ""
                }`}>
                  <CardHeader className="pb-3 border-b border-border/50 bg-gradient-to-r from-primary/5 to-accent/5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                          <Brain className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <CardTitle className="text-base">AI Analysis Results</CardTitle>
                          <CardDescription>TrafficWatch AI Detection Engine</CardDescription>
                        </div>
                      </div>
                      <Badge className={`clay-pill text-xs px-3 py-0.5 h-6 ${
                        incident.ai_analysis.confidence >= 90 ? "bg-success/10 text-success" :
                        incident.ai_analysis.confidence >= 70 ? "bg-warning/10 text-warning" :
                        "bg-destructive/10 text-destructive"
                      }`}>
                        {incident.ai_analysis.confidence}% confidence
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="p-6 space-y-4">
                    {/* Confidence bar */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">Detection Confidence</span>
                        <span className="font-medium">{incident.ai_analysis.confidence}%</span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-secondary overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-1000 ${
                            incident.ai_analysis.confidence >= 90 ? "bg-success" :
                            incident.ai_analysis.confidence >= 70 ? "bg-warning" :
                            "bg-destructive"
                          }`}
                          style={{ width: `${incident.ai_analysis.confidence}%` }}
                        />
                      </div>
                    </div>

                    {/* Analysis summary */}
                    <div className="p-4 rounded-xl bg-secondary/30 text-sm leading-relaxed">
                      <p className="font-medium mb-1">AI Summary</p>
                      <p className="text-muted-foreground">{incident.ai_analysis.summary}</p>
                    </div>

                    {/* Detected details */}
                    <div className="grid sm:grid-cols-2 gap-3">
                      {[
                        { label: "Detected Violation", value: incident.ai_analysis.violation },
                        { label: "Vehicle", value: incident.ai_analysis.vehicle },
                        { label: "License Plate", value: incident.ai_analysis.plate },
                        { label: "Estimated Severity", value: incident.ai_analysis.severity },
                      ].map((det) => (
                        <div key={det.label} className="flex justify-between items-center p-3 rounded-xl bg-secondary/20">
                          <span className="text-xs text-muted-foreground">{det.label}</span>
                          <span className="text-xs font-medium">{det.value}</span>
                        </div>
                      ))}
                    </div>

                    {/* Detected objects */}
                    <div>
                      <p className="text-xs text-muted-foreground mb-2">Detected Objects</p>
                      <div className="flex flex-wrap gap-2">
                        {incident.ai_analysis.objects.map((obj) => (
                          <Badge key={obj} variant="outline" className="clay-pill text-[10px] px-2 py-0.5">
                            {obj}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    {/* Review actions */}
                    <div className="border-t border-border/50 pt-4">
                      <p className="text-xs text-muted-foreground mb-3 font-medium">
                        AI results require officer review before final determination
                      </p>
                      <div className="flex gap-3">
                        <Button className="flex-1 clay-btn rounded-xl bg-success hover:bg-success/90 text-white">
                          <CheckCircle2 className="w-4 h-4 mr-2" />
                          Confirm AI Findings
                        </Button>
                        <Button variant="outline" className="flex-1 rounded-xl border-destructive/30 text-destructive hover:bg-destructive/10">
                          <XCircle className="w-4 h-4 mr-2" />
                          Reject & Override
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
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
                        {incident.timeline.map((event, i) => (
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
            {/* Actions */}
            <Card className="clay-card border-border/50 !rounded-2xl">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button className="w-full clay-btn rounded-xl" variant="default">
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Approve Report
                </Button>
                <Button className="w-full rounded-xl" variant="outline">
                  <Edit className="w-4 h-4 mr-2" />
                  Request Revision
                </Button>
                <Button className="w-full rounded-xl" variant="outline">
                  <Share2 className="w-4 h-4 mr-2" />
                  Share Report
                </Button>
                <Button className="w-full rounded-xl" variant="outline">
                  <Download className="w-4 h-4 mr-2" />
                  Export PDF
                </Button>
                <Button variant="ghost" className="w-full rounded-xl text-destructive hover:text-destructive hover:bg-destructive/10">
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Report
                </Button>
              </CardContent>
            </Card>

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

            {/* Related info */}
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
    </AppLayout>
  );
}
