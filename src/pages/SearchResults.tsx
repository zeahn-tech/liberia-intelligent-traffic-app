import { useState, useEffect, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { AppLayout } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
import {
  Camera,
  FileText,
  MessageSquare,
  User,
  Hash,
  Search,
  Loader2,
  ChevronRight,
  ArrowLeft,
// eslint-disable-next-line @typescript-eslint/no-unused-vars
  Calendar,
  AlertTriangle,
  SlidersHorizontal,
  X,
  Clock,
  MapPin,
// eslint-disable-next-line
  ArrowRight,
} from "lucide-react";
import { supabase } from "@/supabase/client";
import type { SearchResult, SearchResponse } from "@/components/GlobalSearch";
import { Car } from "lucide-react";

// ─── Constants ─────────────────────────────────────────

const RESULT_ICONS: Record<string, React.ReactNode> = {
  incident: <Car className="w-4 h-4" />,
  evidence: <Camera className="w-4 h-4" />,
  anpr: <Hash className="w-4 h-4" />,
  citizen_report: <MessageSquare className="w-4 h-4" />,
  person: <User className="w-4 h-4" />,
};

const RESULT_LABELS: Record<string, string> = {
  incident: "Incident",
  evidence: "Evidence",
  anpr: "Plate Scan",
  citizen_report: "Citizen Report",
  person: "Person",
};

const RESULT_COLORS: Record<string, string> = {
  incident: "bg-blue-500/10 text-blue-500",
  evidence: "bg-purple-500/10 text-purple-500",
  anpr: "bg-cyan-500/10 text-cyan-500",
  citizen_report: "bg-amber-500/10 text-amber-500",
  person: "bg-green-500/10 text-green-500",
};

const SEVERITY_COLORS: Record<string, string> = {
  critical: "bg-red-500/10 text-red-500",
  serious: "bg-amber-500/10 text-amber-500",
  moderate: "bg-blue-500/10 text-blue-500",
  minor: "bg-green-500/10 text-green-500",
};

const STATUS_LABELS: Record<string, string> = {
  draft: "Draft",
  submitted: "Submitted",
  under_review: "Under Review",
  assigned: "Assigned",
  investigating: "Investigating",
  escalated: "Escalated",
  confirmed: "Confirmed",
  resolved: "Resolved",
  closed: "Closed",
  rejected: "Rejected",
  verified: "Verified",
  pending: "Pending",
};

const PAGE_SIZE = 20;

// ─── Component ─────────────────────────────────────────

export default function SearchResults() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // Search state
  const [query, setQuery] = useState(searchParams.get("q") || "");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [typeFilter, setTypeFilter] = useState(searchParams.get("type") || "all");
  const [statusFilter, setStatusFilter] = useState(searchParams.get("status") || "");
  const [severityFilter, setSeverityFilter] = useState(searchParams.get("severity") || "");
  const [sortBy, setSortBy] = useState(searchParams.get("sort") || "relevance");
  const [sortOrder, setSortOrder] = useState(searchParams.get("order") || "desc");
  const [dateFrom, setDateFrom] = useState(searchParams.get("from") || "");
  const [dateTo, setDateTo] = useState(searchParams.get("to") || "");
  const [page, setPage] = useState(Number(searchParams.get("page")) || 1);
  const [showFilters, setShowFilters] = useState(false);

  // Type counts
  const [typeCounts, setTypeCounts] = useState<Record<string, number>>({});

  const totalPages = Math.ceil(total / PAGE_SIZE);

  const doSearch = useCallback(async (
    q: string,
    type: string,
    status: string,
    severity: string,
    sort: string,
    order: string,
    from: string,
    to: string,
    pageNum: number
  ) => {
    if (!q || q.length < 2) {
      setResults([]);
      setTotal(0);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data, error: err } = await supabase.rpc("global_search", {
        p_query: q,
        p_limit: PAGE_SIZE,
        p_offset: (pageNum - 1) * PAGE_SIZE,
        p_type_filter: type !== "all" ? type : null,
        p_status_filter: status || null,
        p_severity_filter: severity || null,
        p_date_from: from ? new Date(from).toISOString() : null,
        p_date_to: to ? new Date(to).toISOString() : null,
        p_sort_by: sort,
        p_sort_order: order,
      });

      if (err) throw err;

      const response = data as SearchResponse;
      setResults(response?.results || []);
      setTotal(response?.total || 0);

      // Calculate type counts
      const counts: Record<string, number> = {};
      if (response?.results) {
        for (const r of response.results) {
          counts[r.result_type] = (counts[r.result_type] || 0) + 1;
        }
      }
      setTypeCounts(counts);
// eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      console.error("[SearchResults] Error:", err);
      setError(err?.message || "Search failed");
      setResults([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, []);

  // Search when params change
  useEffect(() => {
    const q = searchParams.get("q") || query;
    if (q) {
// eslint-disable-next-line react-hooks/set-state-in-effect
      doSearch(
        q,
        searchParams.get("type") || "all",
        searchParams.get("status") || "",
        searchParams.get("severity") || "",
        searchParams.get("sort") || "relevance",
        searchParams.get("order") || "desc",
        searchParams.get("from") || "",
        searchParams.get("to") || "",
        Number(searchParams.get("page")) || 1
      );
    }
  }, [searchParams]);

  const updateParams = (updates: Record<string, string | undefined>) => {
    const params = new URLSearchParams(searchParams);
    Object.entries(updates).forEach(([key, value]) => {
      if (value && value !== "all" && value !== "") {
        params.set(key, value);
      } else {
        params.delete(key);
      }
    });
    // Reset to page 1 when filters change
    if (!updates.page) {
      params.delete("page");
      setPage(1);
    }
    setSearchParams(params);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    updateParams({ q: query, page: undefined });
  };

  const handleTypeClick = (type: string) => {
    setTypeFilter(type);
    updateParams({ type, page: undefined });
  };

  const handleResultClick = async (result: SearchResult) => {
    // Save to search history
    const { data: { user: currentUser } } = await supabase.auth.getUser();
    if (currentUser?.id) {
      try {
        await supabase.rpc("save_search_history", {
          p_user_id: currentUser.id,
          p_query: query,
          p_result_type: result.result_type,
          p_result_id: result.result_id,
          p_result_title: result.title,
        });
      } catch { /* silent */ }
    }

    switch (result.result_type) {
      case "incident":
        navigate(`/incidents/${result.result_id}`);
        break;
      case "evidence":
        navigate(`/evidence?highlight=${result.result_id}`);
        break;
      case "anpr":
        navigate(`/incidents/${result.ref_id || ""}`);
        break;
      case "citizen_report":
        navigate(`/review/citizen-reports?id=${result.result_id}`);
        break;
      case "person":
        navigate(`/incidents/${result.ref_id || ""}`);
        break;
    }
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatTimeAgo = (dateStr: string) => {
// eslint-disable-next-line react-hooks/purity
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return formatDate(dateStr);
  };

  // Type breakdown for the sidebar
  const typeBreakdown = [
    { type: "incident", label: "Incidents", icon: Car },
    { type: "evidence", label: "Evidence", icon: Camera },
    { type: "anpr", label: "Plate Scans", icon: Hash },
    { type: "citizen_report", label: "Citizen Reports", icon: MessageSquare },
    { type: "person", label: "People", icon: User },
  ];

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            className="rounded-xl shrink-0"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back
          </Button>
          <div className="flex-1">
            <h1 className="text-xl font-bold">Search</h1>
            <p className="text-sm text-muted-foreground">
              {total > 0 ? `${total} result${total !== 1 ? "s" : ""} found` : "Search across all records"}
            </p>
          </div>
        </div>

        {/* Search Bar */}
        <form onSubmit={handleSearch}>
          <Card className="clay-card border-border/50 !rounded-2xl">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by plate, case number, name, location..."
                    className="pl-9 clay-inset"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    autoFocus
                  />
                  {query && (
                    <button
                      type="button"
                      className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground"
                      onClick={() => { setQuery(""); setResults([]); setTotal(0); }}
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
                <Button type="submit" className="clay-btn rounded-xl" disabled={query.length < 2}>
                  <Search className="w-4 h-4 mr-1" />
                  Search
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className={`rounded-xl ${showFilters ? "bg-primary/10 border-primary/30" : ""}`}
                  onClick={() => setShowFilters(!showFilters)}
                >
                  <SlidersHorizontal className="w-4 h-4" />
                </Button>
              </div>

              {/* Expanded Filters */}
              {showFilters && (
                <div className="grid sm:grid-cols-4 gap-3 mt-4 pt-4 border-t border-border/50">
                  <div className="space-y-1.5">
                    <Label className="text-[10px]">Type</Label>
                    <Select value={typeFilter} onValueChange={(v) => { setTypeFilter(v); updateParams({ type: v }); }}>
                      <SelectTrigger className="h-8 text-xs rounded-xl">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all" className="text-xs">All Types</SelectItem>
                        <SelectItem value="incident" className="text-xs">Incidents</SelectItem>
                        <SelectItem value="evidence" className="text-xs">Evidence</SelectItem>
                        <SelectItem value="anpr" className="text-xs">Plate Scans</SelectItem>
                        <SelectItem value="citizen_report" className="text-xs">Citizen Reports</SelectItem>
                        <SelectItem value="person" className="text-xs">People</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-[10px]">Status</Label>
                    <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); updateParams({ status: v }); }}>
                      <SelectTrigger className="h-8 text-xs rounded-xl">
                        <SelectValue placeholder="Any" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="" className="text-xs">Any Status</SelectItem>
                        {Object.entries(STATUS_LABELS).map(([key, label]) => (
                          <SelectItem key={key} value={key} className="text-xs">{label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-[10px]">Severity</Label>
                    <Select value={severityFilter} onValueChange={(v) => { setSeverityFilter(v); updateParams({ severity: v }); }}>
                      <SelectTrigger className="h-8 text-xs rounded-xl">
                        <SelectValue placeholder="Any" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="" className="text-xs">Any Severity</SelectItem>
                        <SelectItem value="critical" className="text-xs">Critical</SelectItem>
                        <SelectItem value="serious" className="text-xs">Serious</SelectItem>
                        <SelectItem value="moderate" className="text-xs">Moderate</SelectItem>
                        <SelectItem value="minor" className="text-xs">Minor</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-[10px]">Sort By</Label>
                    <Select value={sortBy} onValueChange={(v) => { setSortBy(v); updateParams({ sort: v }); }}>
                      <SelectTrigger className="h-8 text-xs rounded-xl">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="relevance" className="text-xs">Relevance</SelectItem>
                        <SelectItem value="date" className="text-xs">Date</SelectItem>
                        <SelectItem value="status" className="text-xs">Status</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-[10px]">Date From</Label>
                    <Input
                      type="date"
                      className="h-8 text-xs clay-inset"
                      value={dateFrom}
                      onChange={(e) => { setDateFrom(e.target.value); updateParams({ from: e.target.value }); }}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-[10px]">Date To</Label>
                    <Input
                      type="date"
                      className="h-8 text-xs clay-inset"
                      value={dateTo}
                      onChange={(e) => { setDateTo(e.target.value); updateParams({ to: e.target.value }); }}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-[10px]">Order</Label>
                    <Select value={sortOrder} onValueChange={(v) => { setSortOrder(v); updateParams({ order: v }); }}>
                      <SelectTrigger className="h-8 text-xs rounded-xl">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="desc" className="text-xs">Descending</SelectItem>
                        <SelectItem value="asc" className="text-xs">Ascending</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-end">
                    <Button
                      variant="outline"
                      size="sm"
                      className="rounded-xl w-full"
                      onClick={() => {
                        setTypeFilter("all");
                        setStatusFilter("");
                        setSeverityFilter("");
                        setSortBy("relevance");
                        setSortOrder("desc");
                        setDateFrom("");
                        setDateTo("");
                        setPage(1);
                        setSearchParams({ q: query });
                      }}
                    >
                      <X className="w-3.5 h-3.5 mr-1" />
                      Clear Filters
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </form>

        {/* Type Breakdown & Results */}
        {total > 0 && (
          <div className="flex items-center gap-2 flex-wrap">
            <Badge
              className={`clay-pill cursor-pointer text-[10px] px-2.5 py-0.5 h-5 transition-colors ${
                typeFilter === "all" ? "bg-primary text-primary-foreground" : "bg-secondary hover:bg-secondary/80"
              }`}
              onClick={() => handleTypeClick("all")}
            >
              All ({total})
            </Badge>
            {typeBreakdown.map(({ type, label, icon: Icon }) => (
              <Badge
                key={type}
                className={`clay-pill cursor-pointer text-[10px] px-2.5 py-0.5 h-5 transition-colors flex items-center gap-1 ${
                  typeFilter === type
                    ? RESULT_COLORS[type] + " border-current"
                    : "bg-secondary hover:bg-secondary/80"
                }`}
                onClick={() => handleTypeClick(type)}
              >
                <Icon className="w-2.5 h-2.5" />
                {label} ({typeCounts[type] || 0})
              </Badge>
            ))}
          </div>
        )}

        {/* Results List */}
        {loading ? (
          <Card className="clay-card border-border/50 !rounded-2xl">
            <CardContent className="p-16 text-center">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground mx-auto" />
              <p className="text-sm text-muted-foreground mt-3">Searching...</p>
            </CardContent>
          </Card>
        ) : error ? (
          <Card className="clay-card border-border/50 !rounded-2xl">
            <CardContent className="p-10 text-center">
              <AlertTriangle className="w-8 h-8 text-destructive mx-auto mb-3" />
              <p className="text-sm font-medium">Search Error</p>
              <p className="text-xs text-muted-foreground mt-1">{error}</p>
            </CardContent>
          </Card>
        ) : results.length === 0 && query ? (
          <Card className="clay-card border-border/50 !rounded-2xl">
            <CardContent className="p-12 text-center">
              <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center mx-auto mb-3">
                <Search className="w-6 h-6 text-muted-foreground" />
              </div>
              <h3 className="font-semibold">No Results Found</h3>
              <p className="text-sm text-muted-foreground mt-2 max-w-md mx-auto">
                No matches for "{query}". Try different keywords, check spelling, or adjust your filters.
              </p>
              <div className="flex gap-2 justify-center mt-4">
                <Button variant="outline" size="sm" className="rounded-xl" onClick={() => setQuery("")}>
                  Clear Search
                </Button>
                <Button variant="outline" size="sm" className="rounded-xl" onClick={() => setShowFilters(true)}>
                  <SlidersHorizontal className="w-3.5 h-3.5 mr-1" />
                  Adjust Filters
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : results.length === 0 && !query ? (
          <Card className="clay-card border-border/50 !rounded-2xl">
            <CardContent className="p-12 text-center">
              <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center mx-auto mb-3">
                <Search className="w-6 h-6 text-muted-foreground" />
              </div>
              <h3 className="font-semibold">Search the System</h3>
              <p className="text-sm text-muted-foreground mt-2 max-w-md mx-auto">
                Enter a search term above to search across incidents, license plates, evidence, citizen reports, and people.
              </p>
              <div className="flex flex-wrap justify-center gap-2 mt-4">
                {["LBR-4521", "Monrovia", "Speeding", "Sgt. Kollie"].map((s) => (
                  <Badge
                    key={s}
                    variant="outline"
                    className="clay-pill cursor-pointer text-xs py-1 hover:bg-secondary"
                    onClick={() => { setQuery(s); updateParams({ q: s }); }}
                  >
                    {s}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="space-y-2">
              {results.map((result) => (
                <Card
                  key={`${result.result_type}-${result.result_id}`}
                  className="clay-card border-border/50 !rounded-2xl hover:border-primary/30 hover:shadow-md transition-all cursor-pointer"
                  onClick={() => handleResultClick(result)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className={`w-9 h-9 rounded-xl ${RESULT_COLORS[result.result_type] || "bg-secondary"} flex items-center justify-center shrink-0`}>
                        {RESULT_ICONS[result.result_type] || <FileText className="w-4 h-4" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-4 shrink-0">
                            {RESULT_LABELS[result.result_type] || result.result_type}
                          </Badge>
                          {result.severity && (
                            <Badge variant="outline" className={`text-[9px] px-1.5 py-0 h-4 ${SEVERITY_COLORS[result.severity] || ""}`}>
                              {result.severity}
                            </Badge>
                          )}
                          {result.status && (
                            <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-4">
                              {STATUS_LABELS[result.status] || result.status.replace(/_/g, " ")}
                            </Badge>
                          )}
                        </div>
                        <h3 className="text-sm font-semibold mt-1 truncate">
                          {result.title || result.plate || "Untitled"}
                        </h3>
                        {result.description && (
                          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{result.description}</p>
                        )}
                        <div className="flex items-center gap-3 mt-1.5 text-[10px] text-muted-foreground flex-wrap">
                          {result.plate && (
                            <span className="font-mono">{result.plate}</span>
                          )}
                          {result.location && (
                            <span className="flex items-center gap-1 truncate max-w-[200px]">
                              <MapPin className="w-2.5 h-2.5 shrink-0" />
                              <span className="truncate">{result.location}</span>
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <Clock className="w-2.5 h-2.5" />
                            {formatTimeAgo(result.created_at)}
                          </span>
                          {result.person_name && (
                            <span className="flex items-center gap-1">
                              <User className="w-2.5 h-2.5" />
                              {result.person_name}
                            </span>
                          )}
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0 mt-2 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground">
                  Page {page} of {totalPages} · {total} total results
                </p>
                <div className="flex gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-xl"
                    disabled={page <= 1}
                    onClick={() => {
                      const p = page - 1;
                      setPage(p);
                      updateParams({ page: String(p) });
                    }}
                  >
                    Previous
                  </Button>
                  {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                    const pageNum = Math.max(1, Math.min(page - 2, totalPages - 4)) + i;
                    if (pageNum > totalPages) return null;
                    return (
                      <Button
                        key={pageNum}
                        variant={pageNum === page ? "default" : "outline"}
                        size="sm"
                        className={`rounded-xl ${pageNum === page ? "clay-btn" : ""}`}
                        onClick={() => {
                          setPage(pageNum);
                          updateParams({ page: String(pageNum) });
                        }}
                      >
                        {pageNum}
                      </Button>
                    );
                  })}
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-xl"
                    disabled={page >= totalPages}
                    onClick={() => {
                      const p = page + 1;
                      setPage(p);
                      updateParams({ page: String(p) });
                    }}
                  >
                    Next
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
