import { useNavigate, useSearchParams } from "react-router";
import { AppLayout } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
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
  Car,
  MapPin,
  List,
  Search,
  Plus,
  Filter,
  AlertTriangle,
  ChevronRight,
  Download,
// eslint-disable-next-line @typescript-eslint/no-unused-vars
  Calendar,
  WifiOff,
// eslint-disable-next-line @typescript-eslint/no-unused-vars
  Globe,
} from "lucide-react";
import { IncidentMap } from "@/components/IncidentMap";
import { GeoFilter } from "@/components/GeoFilter";
import { geoFilterFromParams } from "@/lib/geography";
import type { GeoFilterState } from "@/supabase/types";

export default function Incidents() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const viewParam = searchParams.get("view");
  const [view, setView] = useState<"list" | "map">(viewParam === "map" ? "map" : "list");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [severityFilter, setSeverityFilter] = useState("all");
  const [geoFilter, setGeoFilter] = useState<GeoFilterState>(geoFilterFromParams(searchParams));
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const incidents = [
    {
      id: "INC-2024-0891",
      type: "Speeding",
      plate: "LBR-4521",
      location: "Monrovia, UN Drive",
      status: "under_review",
      severity: "moderate",
      time: "2024-07-26T09:23:00",
      officer: "Sgt. Kollie",
      lat: 6.3156,
      lng: -10.8074,
      ai_detected: true,
    },
    {
      id: "INC-2024-0890",
      type: "Red Light Violation",
      plate: "LBR-7890",
      location: "Monrovia, Broad Street",
      status: "submitted",
      severity: "serious",
      time: "2024-07-26T08:15:00",
      officer: "Ofc. Tarplah",
      lat: 6.3283,
      lng: -10.8123,
      ai_detected: false,
    },
    {
      id: "INC-2024-0889",
      type: "Illegal Parking",
      plate: "LBR-1123",
      location: "Paynesville, Market Junction",
      status: "resolved",
      severity: "minor",
      time: "2024-07-26T07:45:00",
      officer: "Sgt. Kollie",
      lat: 6.2856,
      lng: -10.7224,
      ai_detected: false,
    },
    {
      id: "INC-2024-0888",
      type: "Dangerous Overtaking",
      plate: "LBR-5567",
      location: "Ganta Highway, Km 45",
      status: "under_review",
      severity: "critical",
      time: "2024-07-26T06:30:00",
      officer: "Ofc. Flomo",
      lat: 7.0233,
      lng: -9.0504,
      ai_detected: true,
    },
    {
      id: "INC-2024-0887",
      type: "No Seat Belt",
      plate: "LBR-3342",
      location: "Monrovia, Tubman Blvd",
      status: "resolved",
      severity: "minor",
      time: "2024-07-25T22:10:00",
      officer: "Ofc. Tarplah",
      lat: 6.3055,
      lng: -10.7955,
      ai_detected: true,
    },
    {
      id: "INC-2024-0886",
      type: "Running Red Light",
      plate: "LBR-9981",
      location: "Monrovia, 12th Street",
      status: "draft",
      severity: "serious",
      time: "2024-07-25T20:00:00",
      officer: "Sgt. Kollie",
      lat: 6.3178,
      lng: -10.8021,
      ai_detected: false,
      is_offline: true,
    },
    {
      id: "INC-2024-0885",
      type: "Overloaded Vehicle",
      plate: "LBR-2255",
      location: "Buchanan Highway",
      status: "approved",
      severity: "moderate",
      time: "2024-07-25T16:45:00",
      officer: "Ofc. Flomo",
      lat: 5.8809,
      lng: -10.0504,
      ai_detected: true,
    },
  ];

  const filteredIncidents = incidents.filter((inc) => {
    if (searchQuery && !inc.plate.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !inc.type.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !inc.location.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    if (statusFilter !== "all" && inc.status !== statusFilter) return false;
    if (severityFilter !== "all" && inc.severity !== severityFilter) return false;
    return true;
  });

  const mapData = useMemo(() => data.map((inc) => ({
    id: inc.id,
    lat: inc.lat,
    lng: inc.lng,
    title: `${inc.type} - ${inc.plate}`,
// eslint-disable-next-line @typescript-eslint/no-explicit-any
    severity: inc.severity as any,
  })), [data]);

  const totalPages = useMemo(() => Math.max(1, Math.ceil(filteredIncidents.length / itemsPerPage)), [filteredIncidents.length, itemsPerPage]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "draft": return "bg-secondary text-secondary-foreground";
      case "submitted": return "bg-info/10 text-info";
      case "under_review": return "bg-warning/10 text-warning";
      case "assigned": return "bg-blue-500/10 text-blue-500";
      case "investigating": return "bg-purple-500/10 text-purple-500";
      case "escalated": return "bg-orange-500/10 text-orange-500";
      case "confirmed": return "bg-emerald-500/10 text-emerald-500";
      case "approved": return "bg-success/10 text-success";
      case "rejected": return "bg-destructive/10 text-destructive";
      case "resolved": return "bg-success/10 text-success";
      case "closed": return "bg-secondary text-secondary-foreground";
      case "archived": return "bg-secondary/50 text-muted-foreground";
      default: return "bg-secondary text-secondary-foreground";
    }
  };

  const getSeverityDot = (severity: string) => {
    switch (severity) {
      case "critical": return "bg-destructive";
      case "serious": return "bg-warning";
      case "moderate": return "bg-info";
      case "minor": return "bg-success";
      default: return "bg-secondary";
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Traffic Incidents</h1>
            <p className="text-sm text-muted-foreground mt-1">
              View and manage all traffic violation reports
            </p>
          </div>
          <div className="flex gap-2">
            {/* View toggle */}
            <div className="flex bg-secondary rounded-xl p-1">
              <button
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  view === "list"
                    ? "bg-card clay-card shadow-sm text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                onClick={() => setView("list")}
              >
                <List className="w-3.5 h-3.5 inline mr-1" />
                List
              </button>
              <button
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  view === "map"
                    ? "bg-card clay-card shadow-sm text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                onClick={() => setView("map")}
              >
                <MapPin className="w-3.5 h-3.5 inline mr-1" />
                Map
              </button>
            </div>
            <Button className="clay-btn rounded-xl" onClick={() => navigate("/incidents/new")}>
              <Plus className="w-4 h-4 mr-1" />
              New Report
            </Button>
          </div>
        </div>

        {/* Geographic Filter */}
        <GeoFilter
          value={geoFilter}
          onChange={setGeoFilter}
          compact={false}
        />

        {/* Filters */}
        <Card className="clay-card border-border/50 !rounded-2xl">
          <CardContent className="p-4">
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by plate, type, location..."
                  className="pl-9 clay-inset"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[140px] clay-inset">
                  <Filter className="w-3.5 h-3.5 mr-1" />
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="submitted">Submitted</SelectItem>
                  <SelectItem value="under_review">Under Review</SelectItem>
                  <SelectItem value="assigned">Assigned</SelectItem>
                  <SelectItem value="investigating">Investigating</SelectItem>
                  <SelectItem value="escalated">Escalated</SelectItem>
                  <SelectItem value="confirmed">Confirmed</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                  <SelectItem value="archived">Archived</SelectItem>
                </SelectContent>
              </Select>
              <Select value={severityFilter} onValueChange={setSeverityFilter}>
                <SelectTrigger className="w-[140px] clay-inset">
                  <AlertTriangle className="w-3.5 h-3.5 mr-1" />
                  <SelectValue placeholder="Severity" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Severity</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                  <SelectItem value="serious">Serious</SelectItem>
                  <SelectItem value="moderate">Moderate</SelectItem>
                  <SelectItem value="minor">Minor</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" size="icon" className="rounded-xl">
                <Download className="w-4 h-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Summary cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Total", count: filteredIncidents.length, color: "text-foreground" },
            { label: "Pending", count: filteredIncidents.filter(i => ["submitted", "under_review", "assigned", "investigating"].includes(i.status)).length, color: "text-warning" },
            { label: "Resolved", count: filteredIncidents.filter(i => ["resolved", "confirmed", "closed"].includes(i.status)).length, color: "text-success" },
            { label: "AI Detected", count: filteredIncidents.filter(i => i.ai_detected).length, color: "text-info" },
          ].map((stat) => (
            <div key={stat.label} className="clay-card bg-card p-4 rounded-xl text-center">
              <p className={`text-xl font-bold ${stat.color}`}>{stat.count}</p>
              <p className="text-xs text-muted-foreground">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Map View */}
        {view === "map" && (
          <Card className="clay-card border-border/50 !rounded-2xl overflow-hidden">
            <CardContent className="p-0">
              <IncidentMap
                height="500px"
                showControls={true}
                showSearch={true}
                showLayerToggle={true}
                showGeolocation={true}
                onMarkerClick={(id) => navigate(`/incidents/${id}`)}
              />
            </CardContent>
          </Card>
        )}

        {/* List View */}
        {view === "list" && (
          <Card className="clay-card border-border/50 !rounded-2xl overflow-hidden">
            <div className="divide-y divide-border/50">
              {/* Header */}
              <div className="hidden sm:grid grid-cols-6 gap-4 px-6 py-3 text-xs font-medium text-muted-foreground bg-secondary/30">
                <span className="col-span-2">Incident</span>
                <span>Location</span>
                <span>Status</span>
                <span>Severity</span>
                <span className="text-right">Actions</span>
              </div>

              {filteredIncidents.length === 0 ? (
                <div className="p-12 text-center">
                  <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center mx-auto mb-3">
                    <Car className="w-6 h-6 text-muted-foreground" />
                  </div>
                  <p className="text-sm text-muted-foreground">No incidents found matching your filters.</p>
                </div>
              ) : (
                filteredIncidents.map((incident) => (
                  <div
                    key={incident.id}
                    className="grid sm:grid-cols-6 gap-3 sm:gap-4 px-4 sm:px-6 py-4 hover:bg-secondary/30 transition-colors cursor-pointer items-center"
                    onClick={() => navigate(`/incidents/${incident.id}`)}
                  >
                    <div className="col-span-2 min-w-0">
                      <div className="flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full shrink-0 ${getSeverityDot(incident.severity)}`} />
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium truncate">{incident.type}</p>
                            {incident.ai_detected && (
                              <Badge variant="outline" className="clay-pill text-[10px] px-1.5 py-0 h-4 bg-info/10 text-info border-info/20 shrink-0">
                                AI
                              </Badge>
                            )}
                            {incident.is_offline && (
                              <Badge variant="outline" className="clay-pill text-[10px] px-1.5 py-0 h-4 bg-amber-500/10 text-amber-500 border-amber-500/20 shrink-0">
                                <WifiOff className="w-2.5 h-2.5 mr-0.5" />
                                Offline
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground truncate">{incident.plate} · {incident.officer}</p>
                        </div>
                      </div>
                    </div>
                    <div className="hidden sm:block min-w-0">
                      <p className="text-sm truncate">{incident.location}</p>
                      <p className="text-xs text-muted-foreground">{new Date(incident.time).toLocaleString()}</p>
                    </div>
                    <div>
                      <Badge className={`clay-pill text-[10px] px-2 py-0 h-5 ${getStatusColor(incident.status)}`}>
                        {incident.status.replace("_", " ")}
                      </Badge>
                    </div>
                    <div>
                      <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                        incident.severity === "critical" ? "bg-destructive/10 text-destructive" :
                        incident.severity === "serious" ? "bg-warning/10 text-warning" :
                        incident.severity === "moderate" ? "bg-info/10 text-info" :
                        "bg-success/10 text-success"
                      }`}>
                        {incident.severity}
                      </span>
                    </div>
                    <div className="text-right">
                      <Button variant="ghost" size="icon" className="rounded-xl">
                        <ChevronRight className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>
        )}

        {/* Pagination */}
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            Showing {filteredIncidents.length} of {incidents.length} incidents
          </p>
          <div className="flex gap-1">
            <Button
              variant="outline"
              size="sm"
              className="rounded-xl"
              disabled={currentPage <= 1 || filteredIncidents.length === 0}
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="rounded-xl"
              disabled={currentPage >= totalPages || filteredIncidents.length === 0}
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            >
              Next
            </Button>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
