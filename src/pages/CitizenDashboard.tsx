import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router";
import { CitizenLayout } from "@/pages/CitizenLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
// eslint-disable-next-line @typescript-eslint/no-unused-vars
  SelectContent,
// eslint-disable-next-line @typescript-eslint/no-unused-vars
  SelectItem,
// eslint-disable-next-line @typescript-eslint/no-unused-vars
  SelectTrigger,
// eslint-disable-next-line @typescript-eslint/no-unused-vars
  SelectValue,
} from "@/components/ui/select";
import {
// eslint-disable-next-line @typescript-eslint/no-unused-vars
  Car,
  FileText,
  Plus,
  Megaphone,
  CheckCircle2,
  Clock,
  AlertTriangle,
  XCircle,
  ArrowRight,
  MapPin,
// eslint-disable-next-line @typescript-eslint/no-unused-vars
  Phone,
  Shield,
  Eye,
  Loader2,
// eslint-disable-next-line @typescript-eslint/no-unused-vars
  Send,
// eslint-disable-next-line @typescript-eslint/no-unused-vars
  Camera,
// eslint-disable-next-line @typescript-eslint/no-unused-vars
  Upload,
// eslint-disable-next-line @typescript-eslint/no-unused-vars
  WifiOff,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/supabase/client";
import { useCallback } from "react";
import { Card } from "@/components/ui/card";
import { CardContent } from "@/components/ui/card";

// ─── Types ─────────────────────────────────────────────

interface CitizenReport {
  id: string;
  reference_number: string;
  report_type: string;
  violation_type: string | null;
  description: string;
  location_address: string | null;
  status: string;
  is_read: boolean;
  evidence_count: number;
  created_at: string;
  updated_at: string;
}

interface SafetyNotice {
  id: string;
  title: string;
  content: string;
  notice_type: string;
  severity: string;
  county_code: string | null;
  published_at: string | null;
}

const REPORT_STATUS_LABELS: Record<string, string> = {
  submitted: "Submitted",
  under_review: "Under Review",
  accepted: "Accepted",
  rejected: "Rejected",
  converted_to_case: "Case Created",
  closed: "Closed",
};

const REPORT_STATUS_COLORS: Record<string, string> = {
  submitted: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  under_review: "bg-amber-500/10 text-amber-500 border-amber-500/20",
  accepted: "bg-green-500/10 text-green-500 border-green-500/20",
  rejected: "bg-red-500/10 text-red-500 border-red-500/20",
  converted_to_case: "bg-purple-500/10 text-purple-500 border-purple-500/20",
  closed: "bg-secondary text-muted-foreground",
};

const REPORT_TYPE_LABELS: Record<string, string> = {
  traffic_violation: "Traffic Violation",
  accident: "Accident",
  road_hazard: "Road Hazard",
  police_assistance: "Police Assistance",
  general_complaint: "General Complaint",
  other: "Other",
};

export default function CitizenDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();

  // Store reports locally (will connect to Supabase)
  const [reports, setReports] = useState<CitizenReport[]>([]);
  const [notices, setNotices] = useState<SafetyNotice[]>([]);
  const [loading, setLoading] = useState(true);

  // Load reports and notices
  useEffect(() => {
    const loadData = async () => {
      try {
        // Try to fetch from Supabase
        const [reportsRes, noticesRes] = await Promise.all([
          supabase
            .from("citizen_reports")
            .select("*")
            .eq("citizen_id", user?.id)
            .order("created_at", { ascending: false })
            .limit(5),
          supabase
            .from("road_safety_notices")
            .select("*")
            .eq("is_published", true)
            .order("published_at", { ascending: false })
            .limit(3),
        ]);

        if (reportsRes.data) setReports(reportsRes.data as CitizenReport[]);
        if (noticesRes.data) setNotices(noticesRes.data as SafetyNotice[]);
      } catch (err) {
        // Silent fail — fall back to empty state
        console.debug("Citizen data load:", err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [user?.id]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "submitted": return <Clock className="w-3.5 h-3.5" />;
      case "under_review": return <AlertTriangle className="w-3.5 h-3.5" />;
      case "accepted": return <CheckCircle2 className="w-3.5 h-3.5" />;
      case "rejected": return <XCircle className="w-3.5 h-3.5" />;
      case "converted_to_case": return <Shield className="w-3.5 h-3.5" />;
      default: return <Clock className="w-3.5 h-3.5" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical": return "bg-red-500/10 text-red-500";
      case "warning": return "bg-amber-500/10 text-amber-500";
      case "caution": return "bg-yellow-500/10 text-yellow-500";
      default: return "bg-blue-500/10 text-blue-500";
    }
  };

  // ─── Render ─────────────────────────────────────────

  return (
    <CitizenLayout>
      <div className="space-y-6">
        {/* Hero Section */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-background border border-border/50 p-6 sm:p-8">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
          <div className="relative z-10">
            <h1 className="text-2xl sm:text-3xl font-bold">
              Welcome to TrafficWatch
            </h1>
            <p className="text-sm text-muted-foreground mt-2 max-w-lg">
              Liberia's intelligent traffic monitoring platform. Report violations, track your submissions, and stay informed about road safety.
            </p>
            <div className="flex flex-wrap gap-3 mt-6">
              <Button
                className="clay-btn rounded-xl"
                onClick={() => navigate("/citizen/report")}
              >
                <Plus className="w-4 h-4 mr-1" />
                Report an Incident
              </Button>
              <Button
                variant="outline"
                className="rounded-xl"
                onClick={() => navigate("/citizen/reports")}
              >
                <FileText className="w-4 h-4 mr-1" />
                View My Reports
              </Button>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* My Recent Reports */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <FileText className="w-4 h-4 text-primary" />
                My Recent Reports
              </h2>
              <Button
                variant="ghost"
                size="sm"
                className="text-xs rounded-xl"
                onClick={() => navigate("/citizen/reports")}
              >
                View All <ArrowRight className="w-3 h-3 ml-1" />
              </Button>
            </div>

            {loading ? (
              <Card className="clay-card !rounded-2xl border-border/50">
                <CardContent className="p-8 text-center">
                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground mx-auto" />
                  <p className="text-sm text-muted-foreground mt-3">Loading reports...</p>
                </CardContent>
              </Card>
            ) : reports.length === 0 ? (
              <Card className="clay-card !rounded-2xl border-border/50">
                <CardContent className="p-8 text-center">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto">
                    <FileText className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="font-semibold mt-4">No Reports Yet</h3>
                  <p className="text-sm text-muted-foreground mt-2">
                    You haven't submitted any reports yet. Report a traffic violation or incident to get started.
                  </p>
                  <Button
                    className="clay-btn rounded-xl mt-4"
                    onClick={() => navigate("/citizen/report")}
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Submit Your First Report
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {reports.map((report) => (
                  <Link
                    key={report.id}
                    to={`/citizen/reports/${report.id}`}
                    className="block"
                  >
                    <Card className="clay-card !rounded-2xl border-border/50 hover:border-primary/30 transition-all hover:shadow-md cursor-pointer">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-mono font-medium text-primary">
                                {report.reference_number}
                              </span>
                              <Badge
                                variant="outline"
                                className={`text-[10px] px-1.5 py-0 h-4 ${REPORT_STATUS_COLORS[report.status]}`}
                              >
                                {getStatusIcon(report.status)}
                                <span className="ml-1">{REPORT_STATUS_LABELS[report.status]}</span>
                              </Badge>
                            </div>
                            <h3 className="text-sm font-semibold mt-1 truncate">
                              {REPORT_TYPE_LABELS[report.report_type] || report.report_type}
                              {report.violation_type && ` — ${report.violation_type}`}
                            </h3>
                            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                              {report.description}
                            </p>
                            <div className="flex items-center gap-3 mt-2 text-[10px] text-muted-foreground">
                              <span>{new Date(report.created_at).toLocaleDateString()}</span>
                              {report.location_address && (
                                <span className="flex items-center gap-1">
                                  <MapPin className="w-3 h-3" />
                                  {report.location_address}
                                </span>
                              )}
                              {report.evidence_count > 0 && (
                                <span>{report.evidence_count} file(s)</span>
                              )}
                            </div>
                          </div>
                          <Eye className="w-4 h-4 text-muted-foreground shrink-0 mt-1" />
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Safety Notices Sidebar */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Megaphone className="w-4 h-4 text-primary" />
              Safety Notices
            </h2>

            {loading ? (
              <Card className="clay-card !rounded-2xl border-border/50">
                <CardContent className="p-6 text-center">
                  <Loader2 className="w-5 h-5 animate-spin text-muted-foreground mx-auto" />
                </CardContent>
              </Card>
            ) : notices.length === 0 ? (
              <Card className="clay-card !rounded-2xl border-border/50">
                <CardContent className="p-6 text-center">
                  <Megaphone className="w-8 h-8 text-muted-foreground mx-auto" />
                  <p className="text-xs text-muted-foreground mt-2">No current notices</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {notices.map((notice) => (
                  <Card key={notice.id} className="clay-card !rounded-2xl border-border/50 overflow-hidden">
                    <div className={`h-1 ${
                      notice.severity === "critical" ? "bg-red-500" :
                      notice.severity === "warning" ? "bg-amber-500" :
                      notice.severity === "caution" ? "bg-yellow-500" : "bg-blue-500"
                    }`} />
                    <CardContent className="p-4">
                      <div className="flex items-start gap-2">
                        <Badge
                          variant="outline"
                          className={`text-[9px] px-1.5 py-0 h-4 shrink-0 mt-0.5 ${getSeverityColor(notice.severity)}`}
                        >
                          {notice.notice_type.replace(/_/g, " ")}
                        </Badge>
                      </div>
                      <h3 className="text-sm font-semibold mt-2">{notice.title}</h3>
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-3">{notice.content}</p>
                      {notice.published_at && (
                        <p className="text-[10px] text-muted-foreground mt-2">
                          {new Date(notice.published_at).toLocaleDateString()}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {/* Quick Links */}
            <Card className="clay-card !rounded-2xl border-border/50 bg-gradient-to-br from-primary/5 to-transparent">
              <CardContent className="p-4 space-y-3">
                <h3 className="text-sm font-semibold">Quick Actions</h3>
                <Button
                  variant="outline"
                  className="w-full justify-start rounded-xl text-xs"
                  onClick={() => navigate("/citizen/report")}
                >
                  <Plus className="w-3.5 h-3.5 mr-2" />
                  Report a Violation
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start rounded-xl text-xs"
                  onClick={() => navigate("/citizen/safety")}
                >
                  <Megaphone className="w-3.5 h-3.5 mr-2" />
                  View All Notices
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </CitizenLayout>
  );
}
