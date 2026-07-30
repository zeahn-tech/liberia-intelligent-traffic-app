import { useState, useEffect } from "react";
import { CitizenLayout } from "@/pages/CitizenLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Clock,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Shield,
  MapPin,
  FileText,
  MessageSquare,
  Loader2,
  Car,
  Phone,
  Mail,
  Eye,
// eslint-disable-next-line @typescript-eslint/no-unused-vars
  EyeOff,
  Lock,
} from "lucide-react";
import { supabase } from "@/supabase/client";
import { useParams } from "react-router";
import { useNavigate } from "react-router";
import { Card } from "@/components/ui/card";
import { CardContent } from "@/components/ui/card";
import { CardHeader } from "@/components/ui/card";
import { CardTitle } from "@/components/ui/card";

interface CitizenReport {
  id: string;
  reference_number: string;
  report_type: string;
  violation_type: string | null;
  description: string;
  location_address: string | null;
  location_county: string | null;
  location_lat: number | null;
  location_lng: number | null;
  vehicle_plate: string | null;
  vehicle_type: string | null;
  vehicle_color: string | null;
  is_anonymous: boolean;
  reporter_name: string | null;
  reporter_phone: string | null;
  reporter_email: string | null;
  status: string;
  status_notes: string | null;
  rejection_reason: string | null;
  converted_incident_id: string | null;
  evidence_count: number;
  created_at: string;
  updated_at: string;
}

interface Comment {
  id: string;
  message: string;
  is_from_police: boolean;
  author_role: string | null;
  created_at: string;
}

const REPORT_STATUS_LABELS: Record<string, string> = {
  submitted: "Submitted",
  under_review: "Under Review",
  accepted: "Accepted",
  rejected: "Rejected",
  converted_to_case: "Case Created",
  closed: "Closed",
};

const REPORT_STATUS_BG: Record<string, string> = {
  submitted: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  under_review: "bg-amber-500/10 text-amber-500 border-amber-500/20",
  accepted: "bg-green-500/10 text-green-500 border-green-500/20",
  rejected: "bg-red-500/10 text-red-500 border-red-500/20",
  converted_to_case: "bg-purple-500/10 text-purple-500 border-purple-500/20",
  closed: "bg-secondary text-muted-foreground",
};

const STATUS_ICONS: Record<string, React.ReactNode> = {
  submitted: <Clock className="w-5 h-5" />,
  under_review: <AlertTriangle className="w-5 h-5" />,
  accepted: <CheckCircle2 className="w-5 h-5" />,
  rejected: <XCircle className="w-5 h-5" />,
  converted_to_case: <Shield className="w-5 h-5" />,
  closed: <CheckCircle2 className="w-5 h-5" />,
};

const REPORT_TYPE_LABELS: Record<string, string> = {
  traffic_violation: "Traffic Violation",
  accident: "Accident",
  road_hazard: "Road Hazard",
  police_assistance: "Police Assistance Request",
  general_complaint: "General Complaint",
  other: "Other",
};

export default function CitizenReportDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [report, setReport] = useState<CitizenReport | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (!id) return;
      try {
        const [{ data: reportData }, { data: commentsData }] = await Promise.all([
          supabase.from("citizen_reports").select("*").eq("id", id).single(),
          supabase.from("citizen_report_comments").select("*").eq("report_id", id).order("created_at", { ascending: true }),
        ]);
        if (reportData) setReport(reportData as CitizenReport);
        if (commentsData) setComments(commentsData as Comment[]);
      } catch (err) {
        console.debug("Load report detail error:", err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  if (loading) {
    return (
      <CitizenLayout>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      </CitizenLayout>
    );
  }

  if (!report) {
    return (
      <CitizenLayout>
        <div className="text-center py-20">
          <FileText className="w-12 h-12 text-muted-foreground mx-auto" />
          <h2 className="text-lg font-semibold mt-4">Report Not Found</h2>
          <p className="text-sm text-muted-foreground mt-2">This report could not be found or you don't have access.</p>
          <Button className="clay-btn rounded-xl mt-4" onClick={() => navigate("/citizen/reports")}>
            Back to Reports
          </Button>
        </div>
      </CitizenLayout>
    );
  }

  return (
    <CitizenLayout>
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Back button */}
        <Button variant="ghost" size="sm" className="rounded-xl w-fit" onClick={() => navigate("/citizen/reports")}>
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to Reports
        </Button>

        {/* Status Banner */}
        <div className={`rounded-2xl p-6 border ${
          report.status === "rejected" ? "bg-red-500/5 border-red-500/20" :
          report.status === "converted_to_case" ? "bg-purple-500/5 border-purple-500/20" :
          report.status === "accepted" ? "bg-green-500/5 border-green-500/20" :
          "bg-blue-500/5 border-blue-500/20"
        }`}>
          <div className="flex items-start gap-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
              REPORT_STATUS_BG[report.status] || "bg-secondary"
            }`}>
              {STATUS_ICONS[report.status] || <Clock className="w-5 h-5" />}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-medium text-primary">{report.reference_number}</span>
                <Badge variant="outline" className={`text-[10px] px-1.5 py-0 h-4 ${REPORT_STATUS_BG[report.status]}`}>
                  {REPORT_STATUS_LABELS[report.status] || report.status}
                </Badge>
              </div>
              <h2 className="text-lg font-semibold mt-2">
                {REPORT_TYPE_LABELS[report.report_type] || report.report_type}
                {report.violation_type && ` — ${report.violation_type}`}
              </h2>
              <p className="text-xs text-muted-foreground mt-1">
                Submitted {new Date(report.created_at).toLocaleDateString("en-US", {
                  year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit"
                })}
              </p>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="md:col-span-2 space-y-4">
            {/* Description */}
            <Card className="clay-card !rounded-2xl border-border/50">
              <CardHeader>
                <CardTitle className="text-base">Description</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-relaxed">{report.description}</p>
              </CardContent>
            </Card>

            {/* Police Message / Status Reason */}
            {(report.status_notes || report.rejection_reason) && (
              <Card className={`clay-card !rounded-2xl border-border/50 ${
                report.rejection_reason ? "bg-red-500/5" : ""
              }`}>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-primary" />
                    {report.rejection_reason ? "Response from Police" : "Official Note"}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm">{report.rejection_reason || report.status_notes}</p>
                </CardContent>
              </Card>
            )}

            {/* Comments */}
            {comments.length > 0 && (
              <Card className="clay-card !rounded-2xl border-border/50">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-primary" />
                    Updates ({comments.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {comments.map((c) => (
                    <div key={c.id} className={`p-3 rounded-xl ${
                      c.is_from_police ? "bg-primary/5 border border-primary/10" : "bg-secondary/30"
                    }`}>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-medium text-muted-foreground">
                          {c.is_from_police ? "Traffic Police" : "You"}
                          {c.author_role && ` · ${c.author_role.replace(/_/g, " ")}`}
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          {new Date(c.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-sm mt-1">{c.message}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar Details */}
          <div className="space-y-4">
            {/* Location */}
            {report.location_address && (
              <Card className="clay-card !rounded-2xl border-border/50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    Location
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm">{report.location_address}</p>
                  {report.location_county && (
                    <p className="text-xs text-muted-foreground mt-1">{report.location_county} County</p>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Vehicle Info */}
            {(report.vehicle_plate || report.vehicle_type) && (
              <Card className="clay-card !rounded-2xl border-border/50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                    <Car className="w-3 h-3" />
                    Vehicle
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-1">
                  {report.vehicle_plate && <p className="text-sm font-mono">{report.vehicle_plate}</p>}
                  {report.vehicle_type && <p className="text-xs text-muted-foreground">{report.vehicle_color} {report.vehicle_type}</p>}
                </CardContent>
              </Card>
            )}

            {/* Reporter (if not anonymous) */}
            {!report.is_anonymous && (
              <Card className="clay-card !rounded-2xl border-border/50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                    <Eye className="w-3 h-3" />
                    Reported By
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-1">
                  {report.reporter_name && <p className="text-sm font-medium">{report.reporter_name}</p>}
                  {report.reporter_phone && <p className="text-xs text-muted-foreground flex items-center gap-1"><Phone className="w-3 h-3" /> {report.reporter_phone}</p>}
                  {report.reporter_email && <p className="text-xs text-muted-foreground flex items-center gap-1"><Mail className="w-3 h-3" /> {report.reporter_email}</p>}
                </CardContent>
              </Card>
            )}

            {report.is_anonymous && (
              <Card className="clay-card !rounded-2xl border-border/50">
                <CardContent className="p-4 text-center">
                  <Lock className="w-5 h-5 text-muted-foreground mx-auto" />
                  <p className="text-xs text-muted-foreground mt-1">Submitted Anonymously</p>
                </CardContent>
              </Card>
            )}

            {/* Converted to case link */}
            {report.converted_incident_id && (
              <Card className="clay-card !rounded-2xl border-border/50 bg-purple-500/5">
                <CardContent className="p-4 text-center">
                  <Shield className="w-5 h-5 text-purple-500 mx-auto" />
                  <p className="text-sm font-medium mt-1">Case Created</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Your report has been converted to an official case (Case #{report.converted_incident_id.slice(0, 8)})
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </CitizenLayout>
  );
}
