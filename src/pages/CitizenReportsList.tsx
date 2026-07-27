import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router";
import { CitizenLayout } from "@/pages/CitizenLayout";
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
  ArrowLeft,
  FileText,
  Plus,
  Search,
  MapPin,
  Eye,
  Clock,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Shield,
  Loader2,
  Filter,
} from "lucide-react";
import { supabase } from "@/supabase/client";
import { useAuth } from "@/hooks/use-auth";

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
  police_assistance: "Police Assistance Request",
  general_complaint: "General Complaint",
  other: "Other",
};

export default function CitizenReportsList() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [reports, setReports] = useState<CitizenReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    const loadReports = async () => {
      try {
        let query = supabase
          .from("citizen_reports")
          .select("*")
          .eq("citizen_id", user?.id)
          .order("created_at", { ascending: false });

        const { data, error } = await query;
        if (!error && data) setReports(data as CitizenReport[]);
      } catch (err) {
        console.debug("Load reports error:", err);
      } finally {
        setLoading(false);
      }
    };
    loadReports();
  }, [user?.id]);

  const filteredReports = reports.filter((r) => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      if (!r.reference_number.toLowerCase().includes(q) &&
          !r.description.toLowerCase().includes(q) &&
          !(REPORT_TYPE_LABELS[r.report_type]?.toLowerCase() || "").includes(q)) {
        return false;
      }
    }
    if (statusFilter !== "all" && r.status !== statusFilter) return false;
    return true;
  });

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

  return (
    <CitizenLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="rounded-xl" onClick={() => navigate("/citizen")}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-xl font-bold">My Reports</h1>
              <p className="text-sm text-muted-foreground">Track your submitted reports and incidents</p>
            </div>
          </div>
          <Button className="clay-btn rounded-xl" onClick={() => navigate("/citizen/report")}>
            <Plus className="w-4 h-4 mr-1" />
            New Report
          </Button>
        </div>

        {/* Filters */}
        <Card className="clay-card border-border/50 !rounded-2xl">
          <CardContent className="p-4">
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search reports..."
                  className="pl-9 clay-inset"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[150px] clay-inset">
                  <Filter className="w-3.5 h-3.5 mr-1" />
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="submitted">Submitted</SelectItem>
                  <SelectItem value="under_review">Under Review</SelectItem>
                  <SelectItem value="accepted">Accepted</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                  <SelectItem value="converted_to_case">Case Created</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Reports List */}
        {loading ? (
          <Card className="clay-card !rounded-2xl border-border/50">
            <CardContent className="p-12 text-center">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground mx-auto" />
              <p className="text-sm text-muted-foreground mt-3">Loading reports...</p>
            </CardContent>
          </Card>
        ) : filteredReports.length === 0 ? (
          <Card className="clay-card !rounded-2xl border-border/50">
            <CardContent className="p-12 text-center">
              <FileText className="w-10 h-10 text-muted-foreground mx-auto" />
              <h3 className="font-semibold mt-4">No Reports Found</h3>
              <p className="text-sm text-muted-foreground mt-2">
                {searchQuery || statusFilter !== "all"
                  ? "No reports match your search criteria. Try adjusting your filters."
                  : "You haven't submitted any reports yet."}
              </p>
              {!searchQuery && statusFilter === "all" && (
                <Button className="clay-btn rounded-xl mt-4" onClick={() => navigate("/citizen/report")}>
                  <Plus className="w-4 h-4 mr-1" />
                  Submit Your First Report
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            <p className="text-xs text-muted-foreground">
              Showing {filteredReports.length} report{filteredReports.length !== 1 ? "s" : ""}
            </p>
            {filteredReports.map((report) => (
              <Link key={report.id} to={`/citizen/reports/${report.id}`} className="block">
                <Card className="clay-card !rounded-2xl border-border/50 hover:border-primary/30 transition-all hover:shadow-md cursor-pointer">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
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
                        <h3 className="text-sm font-semibold mt-1">
                          {REPORT_TYPE_LABELS[report.report_type] || report.report_type}
                          {report.violation_type && ` — ${report.violation_type}`}
                        </h3>
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{report.description}</p>
                        <div className="flex items-center gap-3 mt-2 text-[10px] text-muted-foreground">
                          <span>{new Date(report.created_at).toLocaleDateString()}</span>
                          {report.location_address && (
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              <span className="truncate max-w-[150px]">{report.location_address}</span>
                            </span>
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
    </CitizenLayout>
  );
}
