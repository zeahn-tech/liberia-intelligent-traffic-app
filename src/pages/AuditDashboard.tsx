import { useState, useCallback, useEffect } from "react";
import { AppLayout } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Shield,
  Search,
  Download,
  Filter,
  X,
  Clock,
  User,
  AlertTriangle,
  Activity,
  RefreshCw,
  Loader2,
  FileDown,
  Calendar,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  CheckCircle2,
  Info,
} from "lucide-react";
import { AuditLog, generateMockAuditEvents, type AuditEvent } from "@/components/AuditLog";
import { toast } from "sonner";
import { usePermission } from "@/lib/permissions";
import { SEVERITY_COLORS } from "@/lib/audit";

// ─── Severity breakdown cards ──────────────────────────

const SEVERITY_CONFIG = [
  { key: "critical", label: "Critical", icon: AlertCircle, color: "text-destructive", bg: "bg-destructive/10" },
  { key: "error", label: "Errors", icon: AlertTriangle, color: "text-red-500", bg: "bg-red-500/10" },
  { key: "warning", label: "Warnings", icon: AlertTriangle, color: "text-amber-500", bg: "bg-amber-500/10" },
  { key: "info", label: "Info", icon: Info, color: "text-blue-500", bg: "bg-blue-500/10" },
] as const;

export default function AuditDashboard() {
  const { can } = usePermission();
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [severityFilter, setSeverityFilter] = useState<string>("all");
  const [dateRange, setDateRange] = useState<string>("30");
  const [page, setPage] = useState(1);
  const perPage = 25;

  // Load events (using mock for now, real data from query_audit_logs RPC)
  useEffect(() => {
    setLoading(true);
    // Simulate loading from backend
    const timer = setTimeout(() => {
      const mockEvents = generateMockAuditEvents("ALL", 60);
      setEvents(mockEvents);
      setLoading(false);
    }, 600);
    return () => clearTimeout(timer);
  }, [dateRange]);

  // Filter events
  const filteredEvents = events
    .filter((e) => {
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        if (
          !e.description.toLowerCase().includes(q) &&
          !e.performedByName.toLowerCase().includes(q) &&
          !e.targetId.toLowerCase().includes(q) &&
          !e.type.toLowerCase().includes(q)
        )
          return false;
      }
      if (typeFilter !== "all" && e.type !== typeFilter) return false;
      if (severityFilter !== "all" && (e.severity || "info") !== severityFilter) return false;
      return true;
    })
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  // Paginate
  const totalPages = Math.max(1, Math.ceil(filteredEvents.length / perPage));
  const paginatedEvents = filteredEvents.slice((page - 1) * perPage, page * perPage);

  // Statistics
  const stats = {
    total: filteredEvents.length,
    critical: filteredEvents.filter((e) => e.severity === "critical").length,
    error: filteredEvents.filter((e) => e.severity === "error").length,
    warning: filteredEvents.filter((e) => e.severity === "warning").length,
    info: filteredEvents.filter((e) => !e.severity || e.severity === "info").length,
  };

  const handleExport = useCallback(() => {
    // Generate CSV from filtered events
    const headers = ["Action", "Description", "Performed By", "Target Type", "Target ID", "Severity", "Timestamp"];
    const rows = filteredEvents.map((e) => [
      e.type,
      e.description,
      e.performedByName,
      e.targetType,
      e.targetId,
      e.severity || "info",
      e.timestamp,
    ]);

    const csv = [headers, ...rows].map((r) => r.map((c) => `"${c.replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `AuditLog_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`Exported ${filteredEvents.length} audit events`);
  }, [filteredEvents]);

  if (!can("view_audit_logs")) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center py-20">
          <Shield className="w-12 h-12 text-muted-foreground mb-4" />
          <h2 className="text-lg font-semibold mb-2">Access Denied</h2>
          <p className="text-sm text-muted-foreground">
            You do not have permission to view audit logs.
          </p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center">
                <Shield className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Audit Dashboard</h1>
                <p className="text-sm text-muted-foreground">
                  Security-sensitive action log · {filteredEvents.length} events
                </p>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="rounded-xl" onClick={() => setLoading(true)}>
              <RefreshCw className="w-4 h-4 mr-1" />
              Refresh
            </Button>
            <Button variant="outline" size="sm" className="rounded-xl" onClick={handleExport}>
              <FileDown className="w-4 h-4 mr-1" />
              Export CSV
            </Button>
          </div>
        </div>

        {/* Severity breakdown */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {SEVERITY_CONFIG.map((sev) => {
            const count = stats[sev.key as keyof typeof stats] as number;
            const Icon = sev.icon;
            return (
              <Card
                key={sev.key}
                className={`border-border/50 !rounded-2xl cursor-pointer transition-all hover:shadow-md ${
                  severityFilter === sev.key ? "ring-2 ring-primary/30" : ""
                }`}
                onClick={() => setSeverityFilter(severityFilter === sev.key ? "all" : sev.key)}
              >
                <CardContent className="p-4 flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl ${sev.bg} flex items-center justify-center`}>
                    <Icon className={`w-5 h-5 ${sev.color}`} />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{count}</p>
                    <p className="text-xs text-muted-foreground">{sev.label}</p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Filters */}
        <Card className="border-border/50 !rounded-2xl">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <Filter className="w-4 h-4 text-muted-foreground" />
                Filters
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                className="rounded-xl text-xs h-7"
                onClick={() => { setSearchQuery(""); setTypeFilter("all"); setSeverityFilter("all"); setDateRange("30"); }}
              >
                <X className="w-3 h-3 mr-1" />
                Clear
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid sm:grid-cols-4 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Search</Label>
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                  <Input
                    placeholder="Search events..."
                    className="clay-inset pl-8 h-9 text-xs rounded-xl"
                    value={searchQuery}
                    onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Action Type</Label>
                <Select value={typeFilter} onValueChange={(v) => { setTypeFilter(v); setPage(1); }}>
                  <SelectTrigger className="h-9 text-xs rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Actions</SelectItem>
                    <SelectItem value="incident_created">Incident Created</SelectItem>
                    <SelectItem value="incident_status_changed">Status Changed</SelectItem>
                    <SelectItem value="incident_assigned">Assigned</SelectItem>
                    <SelectItem value="evidence_uploaded">Evidence Uploaded</SelectItem>
                    <SelectItem value="evidence_viewed">Evidence Viewed</SelectItem>
                    <SelectItem value="evidence_downloaded">Evidence Downloaded</SelectItem>
                    <SelectItem value="ai_analysis_completed">AI Analysis</SelectItem>
                    <SelectItem value="report_generated">Report Generated</SelectItem>
                    <SelectItem value="user_login">Login</SelectItem>
                    <SelectItem value="user_login_failed">Failed Login</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Severity</Label>
                <Select value={severityFilter} onValueChange={(v) => { setSeverityFilter(v); setPage(1); }}>
                  <SelectTrigger className="h-9 text-xs rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Severities</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                    <SelectItem value="error">Error</SelectItem>
                    <SelectItem value="warning">Warning</SelectItem>
                    <SelectItem value="info">Info</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Date Range</Label>
                <Select value={dateRange} onValueChange={(v) => { setDateRange(v); setPage(1); }}>
                  <SelectTrigger className="h-9 text-xs rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Last 24 hours</SelectItem>
                    <SelectItem value="7">Last 7 days</SelectItem>
                    <SelectItem value="30">Last 30 days</SelectItem>
                    <SelectItem value="90">Last 90 days</SelectItem>
                    <SelectItem value="365">Last year</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Audit log */}
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Loading audit events...</p>
            </div>
          </div>
        ) : (
          <>
            <AuditLog
              events={paginatedEvents}
              title="Security Event Log"
              description={`Page ${page} of ${totalPages} · ${filteredEvents.length} total events`}
              maxHeight="600px"
              showSearch={false}
              showSeverity={true}
              emptyMessage="No audit events match your filters"
            />

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground">
                  Showing {(page - 1) * perPage + 1}–{Math.min(page * perPage, filteredEvents.length)} of{" "}
                  {filteredEvents.length} events
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-xl h-8"
                    disabled={page <= 1}
                    onClick={() => setPage(page - 1)}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                    const pageNum = i + 1;
                    return (
                      <Button
                        key={pageNum}
                        variant={page === pageNum ? "default" : "outline"}
                        size="sm"
                        className="rounded-xl h-8 w-8 p-0"
                        onClick={() => setPage(pageNum)}
                      >
                        {pageNum}
                      </Button>
                    );
                  })}
                  {totalPages > 5 && <span className="text-xs text-muted-foreground">...</span>}
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-xl h-8"
                    disabled={page >= totalPages}
                    onClick={() => setPage(page + 1)}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </AppLayout>
  );
}
