import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router";
import { AppLayout } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Search,
  Clock,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Shield,
  FileText,
  MapPin,
  Loader2,
  ArrowLeft,
  RefreshCw,
  Flag,
  Car,
  MessageSquare,
  CheckCheck,
  X,
  ExternalLink,
} from "lucide-react";
import { supabase } from "@/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { usePermission } from "@/lib/permissions";
import { toast } from "sonner";

interface CitizenReport {
  id: string;
  reference_number: string;
  report_type: string;
  violation_type: string | null;
  description: string;
  location_address: string | null;
  location_county: string | null;
  is_anonymous: boolean;
  reporter_name: string | null;
  reporter_phone: string | null;
  reporter_email: string | null;
  vehicle_plate: string | null;
  vehicle_type: string | null;
  vehicle_color: string | null;
  has_evidence: boolean;
  evidence_count: number;
  status: string;
  is_read: boolean;
  created_at: string;
  updated_at: string;
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

export default function ReviewCitizenReports() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { can } = usePermission();
  const [reports, setReports] = useState<CitizenReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("submitted");
  const [selectedReport, setSelectedReport] = useState<CitizenReport | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionNotes, setActionNotes] = useState("");
  const [actionType, setActionType] = useState<"accept" | "reject" | "convert" | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const loadReports = useCallback(async () => {
    setLoading(true);
    try {
      let query = supabase
        .from("citizen_reports")
        .select("*")
        .order("created_at", { ascending: false });

      if (statusFilter !== "all") {
        query = query.eq("status", statusFilter);
      }

      const { data, error } = await query;
      if (!error && data) setReports(data as CitizenReport[]);
    } catch (err) {
      console.debug("Load reports error:", err);
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    loadReports();
  }, [loadReports]);

  const handleOpenDetail = (report: CitizenReport) => {
    setSelectedReport(report);
    setDetailOpen(true);
    setActionNotes("");
    setActionType(null);
  };

  const handleAction = async () => {
    if (!selectedReport || !actionType) return;
    setActionLoading(true);

    try {
      if (actionType === "accept") {
        const { error } = await supabase
          .from("citizen_reports")
          .update({ status: "accepted", status_notes: actionNotes || null, reviewed_by: user?.id || null, reviewed_at: new Date().toISOString() })
          .eq("id", selectedReport.id);
        if (error) throw error;
        toast.success(`Report ${selectedReport.reference_number} accepted`);
      } else if (actionType === "reject") {
        const { error } = await supabase
          .from("citizen_reports")
          .update({ status: "rejected", rejection_reason: actionNotes || null, reviewed_by: user?.id || null, reviewed_at: new Date().toISOString() })
          .eq("id", selectedReport.id);
        if (error) throw error;
        toast.success(`Report ${selectedReport.reference_number} rejected`);
      } else if (actionType === "convert") {
        // Convert citizen report to official incident
        const { error } = await supabase.rpc("convert_citizen_report_to_incident", {
          p_report_id: selectedReport.id,
          p_officer_id: user?.id,
          p_title: `Citizen Report: ${REPORT_TYPE_LABELS[selectedReport.report_type] || selectedReport.report_type} — ${selectedReport.violation_type || ""}`,
          p_severity: "moderate",
        });
        if (error) throw error;
        toast.success(`Report ${selectedReport.reference_number} converted to official case`);
      }

      setDetailOpen(false);
      setConfirmOpen(false);
      setActionType(null);
      setActionNotes("");
      loadReports();
    } catch (err) {
      toast.error("Action failed: " + (err instanceof Error ? err.message : "Unknown error"));
    } finally {
      setActionLoading(false);
    }
  };

  const filteredReports = reports.filter((r) => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return r.reference_number.toLowerCase().includes(q) ||
        r.description.toLowerCase().includes(q) ||
        (REPORT_TYPE_LABELS[r.report_type] || "").toLowerCase().includes(q) ||
        (r.location_address || "").toLowerCase().includes(q);
    }
    return true;
  });

  const pendingCount = reports.filter((r) => r.status === "submitted").length;

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">Citizen Reports Review</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Review and process citizen-submitted reports
              {pendingCount > 0 && <span className="ml-2 font-semibold text-primary">({pendingCount} pending)</span>}
            </p>
          </div>
          <Button variant="outline" size="sm" className="rounded-xl" onClick={loadReports} disabled={loading}>
            <RefreshCw className={`w-3.5 h-3.5 mr-1 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>

        {/* Filters */}
        <Card className="clay-card border-border/50 !rounded-2xl">
          <CardContent className="p-4">
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search reports..." className="pl-9 clay-inset" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[160px] clay-inset">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="submitted">Submitted</SelectItem>
                  <SelectItem value="under_review">Under Review</SelectItem>
                  <SelectItem value="accepted">Accepted</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                  <SelectItem value="converted_to_case">Converted to Case</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Reports */}
        {loading ? (
          <Card className="clay-card !rounded-2xl border-border/50">
            <CardContent className="p-12 text-center">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground mx-auto" />
            </CardContent>
          </Card>
        ) : filteredReports.length === 0 ? (
          <Card className="clay-card !rounded-2xl border-border/50">
            <CardContent className="p-12 text-center">
              <FileText className="w-10 h-10 text-muted-foreground mx-auto" />
              <h3 className="font-semibold mt-4">No Reports Found</h3>
              <p className="text-sm text-muted-foreground mt-2">
                {statusFilter !== "all" ? "No reports match the current filter." : "No citizen reports have been submitted yet."}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            <p className="text-xs text-muted-foreground">{filteredReports.length} report{filteredReports.length !== 1 ? "s" : ""}</p>
            {filteredReports.map((report) => (
              <Card
                key={report.id}
                className="clay-card !rounded-2xl border-border/50 hover:border-primary/30 transition-all hover:shadow-md cursor-pointer"
                onClick={() => handleOpenDetail(report)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-mono font-medium text-primary">{report.reference_number}</span>
                        <Badge variant="outline" className={`text-[10px] px-1.5 py-0 h-4 ${REPORT_STATUS_COLORS[report.status]}`}>
                          {REPORT_STATUS_LABELS[report.status]}
                        </Badge>
                        {report.is_anonymous && (
                          <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-3.5 bg-purple-500/10 text-purple-500 border-purple-500/20">
                            Anonymous
                          </Badge>
                        )}
                      </div>
                      <h3 className="text-sm font-semibold mt-1">
                        {REPORT_TYPE_LABELS[report.report_type] || report.report_type}
                        {report.violation_type && ` — ${report.violation_type}`}
                      </h3>
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{report.description}</p>
                      <div className="flex items-center gap-3 mt-2 text-[10px] text-muted-foreground">
                        <span>{new Date(report.created_at).toLocaleDateString()}</span>
                        {report.location_address && (
                          <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{report.location_address}</span>
                        )}
                        {report.has_evidence && <span>{report.evidence_count} file(s)</span>}
                        {!report.is_anonymous && report.reporter_name && <span>by {report.reporter_name}</span>}
                      </div>
                    </div>
                    {report.status === "submitted" && (
                      <div className="flex gap-1 shrink-0">
                        <Badge variant="outline" className="bg-amber-500/10 text-amber-500 border-amber-500/20 text-[10px] px-2 py-0 h-5">
                          Needs Review
                        </Badge>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Detail Dialog */}
        <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
          <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-primary" />
                Citizen Report Review
              </DialogTitle>
              <DialogDescription>
                Review the citizen report and take appropriate action.
              </DialogDescription>
            </DialogHeader>

            {selectedReport && (
              <div className="space-y-4">
                {/* Reference & Status */}
                <div className="flex items-center justify-between">
                  <span className="text-sm font-mono font-medium text-primary">{selectedReport.reference_number}</span>
                  <Badge variant="outline" className={`text-[10px] px-2 py-0 h-5 ${REPORT_STATUS_COLORS[selectedReport.status]}`}>
                    {REPORT_STATUS_LABELS[selectedReport.status]}
                  </Badge>
                </div>

                {/* Type & Violation */}
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Report Type</p>
                  <p className="text-sm font-medium">{REPORT_TYPE_LABELS[selectedReport.report_type]}
                    {selectedReport.violation_type && ` — ${selectedReport.violation_type}`}
                  </p>
                </div>

                {/* Description */}
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Description</p>
                  <p className="text-sm leading-relaxed bg-secondary/20 p-3 rounded-xl">{selectedReport.description}</p>
                </div>

                {/* Location */}
                {selectedReport.location_address && (
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Location</p>
                    <p className="text-sm">{selectedReport.location_address}
                      {selectedReport.location_county && <span className="text-muted-foreground"> ({selectedReport.location_county} County)</span>}
                    </p>
                  </div>
                )}

                {/* Vehicle */}
                {selectedReport.vehicle_plate && (
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Vehicle</p>
                    <p className="text-sm font-mono">{selectedReport.vehicle_plate}
                      {selectedReport.vehicle_type && <span className="text-muted-foreground ml-2">{selectedReport.vehicle_color} {selectedReport.vehicle_type}</span>}
                    </p>
                  </div>
                )}

                {/* Reporter */}
                {!selectedReport.is_anonymous && selectedReport.reporter_name && (
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Reported By</p>
                    <p className="text-sm">{selectedReport.reporter_name}
                      {selectedReport.reporter_phone && <span className="text-muted-foreground ml-2">({selectedReport.reporter_phone})</span>}
                    </p>
                  </div>
                )}

                {selectedReport.is_anonymous && (
                  <div className="flex items-center gap-2 p-2 rounded-lg bg-purple-500/5 text-xs text-purple-500">
                    <Shield className="w-3.5 h-3.5" />
                    Submitted anonymously
                  </div>
                )}

                {/* Timeline */}
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Submitted</p>
                  <p className="text-sm">{new Date(selectedReport.created_at).toLocaleString()}</p>
                </div>

                {/* Action Notes */}
                <div className="space-y-2 pt-2 border-t border-border/50">
                  <Label>Notes / Reason</Label>
                  <Textarea
                    placeholder="Add notes about your decision..."
                    className="clay-inset min-h-[80px] resize-none"
                    value={actionNotes}
                    onChange={(e) => setActionNotes(e.target.value)}
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap gap-2 pt-2">
                  {selectedReport.status === "submitted" || selectedReport.status === "under_review" ? (
                    <>
                      <Button
                        variant="outline"
                        className="rounded-xl flex-1 border-amber-500/30 text-amber-600 hover:bg-amber-500/10"
                        onClick={() => { setActionType("accept"); setConfirmOpen(true); }}
                      >
                        <CheckCircle2 className="w-4 h-4 mr-1" />
                        Accept
                      </Button>
                      <Button
                        variant="outline"
                        className="rounded-xl flex-1 border-red-500/30 text-red-600 hover:bg-red-500/10"
                        onClick={() => { setActionType("reject"); setConfirmOpen(true); }}
                      >
                        <XCircle className="w-4 h-4 mr-1" />
                        Reject
                      </Button>
                      <Button
                        className="clay-btn rounded-xl flex-1"
                        onClick={() => { setActionType("convert"); setConfirmOpen(true); }}
                      >
                        <Shield className="w-4 h-4 mr-1" />
                        Convert to Case
                      </Button>
                    </>
                  ) : (
                    <p className="text-xs text-muted-foreground w-full text-center py-2">
                      This report has already been {selectedReport.status === "converted_to_case" ? "converted to a case" : selectedReport.status}.
                    </p>
                  )}
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Confirm Action Dialog */}
        <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle>Confirm Action</DialogTitle>
              <DialogDescription>
                {actionType === "accept" && "Mark this report as accepted. The citizen will be notified."}
                {actionType === "reject" && "Reject this report. Provide a reason so the citizen understands why."}
                {actionType === "convert" && "Convert this citizen report into an official enforcement case. This will create a new incident record."}
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="flex gap-2">
              <Button variant="outline" className="rounded-xl" onClick={() => setConfirmOpen(false)} disabled={actionLoading}>
                Cancel
              </Button>
              <Button
                className={`rounded-xl ${
                  actionType === "reject" ? "bg-destructive hover:bg-destructive/90"
                  : actionType === "accept" ? "bg-emerald-600 hover:bg-emerald-700"
                  : "clay-btn"
                }`}
                onClick={handleAction}
                disabled={actionLoading}
              >
                {actionLoading ? <><Loader2 className="w-4 h-4 mr-1 animate-spin" /> Processing...</> : "Confirm"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}
