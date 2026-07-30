// ============================================================
// TrafficWatch AI — AI Command Dashboard
//
// Premium command dashboard with:
// - 16 animated KPI cards with live counter animations
// - Real-time activity feed with auto-scrolling
// - Critical alert panel
// - Interactive charts (6 tabs)
// - Live incident map
// - Recent cases with quick status view
// - Dangerous roads + repeat offenders
// - Regional statistics
// - AI detection performance
// - Quick actions
// ============================================================

import { useState, useCallback, useMemo, memo } from "react";
import { useNavigate } from "react-router";
import { AppLayout } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AnimatedCounter } from "@/components/ui/animated-counter";
import { LiveIncidentFeed } from "@/components/LiveIncidentFeed";
import { AlertPanel } from "@/components/AlertPanel";
import { IncidentMap } from "@/components/IncidentMap";
import { useAuth } from "@/hooks/use-auth";
import { useNetwork } from "@/hooks/use-network";
import { useRealtimeDashboard } from "@/hooks/use-realtime-dashboard";
import { useRealtimeIncidents } from "@/hooks/use-realtime-incidents";
import { useResponsive } from "@/hooks/use-mobile";
import { motion } from "framer-motion";
import {
  BarChart3,
  Car,
  AlertTriangle,
  CheckCircle2,
  Clock,
  TrendingUp,
  TrendingDown,
  Shield,
  Plus,
  Activity,
  Users,
  Camera,
  Route,
  Gavel,
  Repeat,
  Calendar,
  ExternalLink,
  Search,
  List,
  Brain,
  Crosshair,
  PieChart,
  LineChart,
  BarChart,
  AreaChart,
  FileText,
  Map,
  ChevronRight,
  Wifi,
  WifiOff,
  Zap,
  Flame,
  Target,
} from "lucide-react";
import {
  LineChart as ReLineChart,
  Line,
  BarChart as ReBarChart,
  Bar,
  AreaChart as ReAreaChart,
  Area,
  PieChart as RePieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar as ReRadar,
} from "recharts";

// ═══════════════════════════════════════════════════════════
// MOCK DATA
// ═══════════════════════════════════════════════════════════

const violationTrendData = [
  { month: "Jan", violations: 145, accidents: 38, citations: 120 },
  { month: "Feb", violations: 132, accidents: 42, citations: 108 },
  { month: "Mar", violations: 158, accidents: 35, citations: 134 },
  { month: "Apr", violations: 172, accidents: 48, citations: 145 },
  { month: "May", violations: 165, accidents: 40, citations: 138 },
  { month: "Jun", violations: 189, accidents: 55, citations: 156 },
  { month: "Jul", violations: 201, accidents: 52, citations: 168 },
];

const violationTypeData = [
  { name: "Speeding", count: 312, fill: "#ef4444" },
  { name: "Red Light", count: 178, fill: "#f97316" },
  { name: "No Seat Belt", count: 145, fill: "#eab308" },
  { name: "Illegal Parking", count: 98, fill: "#22c55e" },
  { name: "Dangerous Overtaking", count: 76, fill: "#3b82f6" },
  { name: "Phone While Driving", count: 54, fill: "#8b5cf6" },
  { name: "No Helmet", count: 42, fill: "#ec4899" },
];

const weeklyActivityData = [
  { day: "Mon", reports: 28, resolved: 22, citations: 25 },
  { day: "Tue", reports: 35, resolved: 30, citations: 32 },
  { day: "Wed", reports: 42, resolved: 38, citations: 39 },
  { day: "Thu", reports: 38, resolved: 35, citations: 36 },
  { day: "Fri", reports: 45, resolved: 40, citations: 42 },
  { day: "Sat", reports: 30, resolved: 28, citations: 27 },
  { day: "Sun", reports: 22, resolved: 20, citations: 19 },
];

const countyData = [
  { name: "Montserrado", incidents: 445, resolved: 382, rate: 86 },
  { name: "Nimba", incidents: 178, resolved: 145, rate: 81 },
  { name: "Bong", incidents: 134, resolved: 112, rate: 84 },
  { name: "Lofa", incidents: 98, resolved: 76, rate: 78 },
  { name: "Grand Bassa", incidents: 87, resolved: 71, rate: 82 },
  { name: "Margibi", incidents: 76, resolved: 62, rate: 82 },
  { name: "Gbarpolu", incidents: 45, resolved: 38, rate: 84 },
  { name: "Grand Cape Mount", incidents: 52, resolved: 42, rate: 81 },
];

const aiDetectionData = [
  { name: "Plate Detection", accuracy: 94, processed: 1256, confirmed: 1180 },
  { name: "Violation Detection", accuracy: 88, processed: 892, confirmed: 785 },
  { name: "Vehicle Classification", accuracy: 92, processed: 1050, confirmed: 966 },
  { name: "Color Detection", accuracy: 96, processed: 980, confirmed: 941 },
  { name: "OCR Accuracy", accuracy: 85, processed: 1130, confirmed: 960 },
];

const dangerousRoadsData = [
  { road: "UN Drive, Monrovia", incidents: 78, severity: "high" },
  { road: "Ganta Highway, Km 45", incidents: 62, severity: "critical" },
  { road: "Broad Street, Monrovia", incidents: 55, severity: "high" },
  { road: "Buchanan Highway", incidents: 48, severity: "medium" },
  { road: "Tubman Blvd", incidents: 42, severity: "medium" },
  { road: "Market Junction, Paynesville", incidents: 38, severity: "medium" },
  { road: "Robertsfield Highway", incidents: 32, severity: "low" },
  { road: "Voinjama Road", incidents: 28, severity: "low" },
];

const repeatOffendersData = [
  { plate: "LBR-4521", violations: 7, lastDate: "2026-07-26", risk: "high" },
  { plate: "LBR-7890", violations: 5, lastDate: "2026-07-25", risk: "high" },
  { plate: "LBR-3342", violations: 4, lastDate: "2026-07-24", risk: "medium" },
  { plate: "LBR-1123", violations: 3, lastDate: "2026-07-23", risk: "medium" },
  { plate: "LBR-9981", violations: 3, lastDate: "2026-07-22", risk: "low" },
];

const officerActivityData = [
  { name: "Sgt. Kollie", reports: 48, resolved: 42, citations: 45, rating: 96 },
  { name: "Ofc. Tarplah", reports: 36, resolved: 30, citations: 33, rating: 88 },
  { name: "Ofc. Flomo", reports: 29, resolved: 24, citations: 27, rating: 91 },
  { name: "Sgt. Kamara", reports: 22, resolved: 18, citations: 20, rating: 85 },
];

const timeOfDayData = [
  { time: "00-04", incidents: 23 },
  { time: "04-08", incidents: 45 },
  { time: "08-12", incidents: 128 },
  { time: "12-16", incidents: 156 },
  { time: "16-20", incidents: 198 },
  { time: "20-24", incidents: 87 },
];

const regionalStatsData = [
  { name: "Montserrado", violations: 445, clearance: 86, officers: 120, stations: 4 },
  { name: "North Central", violations: 312, clearance: 82, officers: 85, stations: 3 },
  { name: "Western", violations: 178, clearance: 79, officers: 55, stations: 2 },
  { name: "North Western", violations: 98, clearance: 78, officers: 40, stations: 2 },
  { name: "South Central", violations: 163, clearance: 81, officers: 50, stations: 2 },
  { name: "Eastern", violations: 125, clearance: 76, officers: 35, stations: 1 },
  { name: "South Eastern", violations: 87, clearance: 74, officers: 30, stations: 1 },
];

const recentCasesData = [
  { id: "INC-2026-0891", title: "Speeding — White Toyota Corolla", status: "assigned", severity: "serious", created_at: "2026-07-27T09:30:00Z", officer: "Sgt. Kollie" },
  { id: "INC-2026-0890", title: "Dangerous Overtaking — Blue Bus", status: "investigating", severity: "high", created_at: "2026-07-27T08:15:00Z", officer: "Ofc. Flomo" },
  { id: "INC-2026-0889", title: "No Helmet — Motorcycle", status: "submitted", severity: "moderate", created_at: "2026-07-27T07:45:00Z", officer: "Ofc. Tarplah" },
  { id: "INC-2026-0888", title: "Illegal Parking — SUV", status: "resolved", severity: "minor", created_at: "2026-07-27T06:30:00Z", officer: "Sgt. Kamara" },
  { id: "INC-2026-0887", title: "Red Light Violation — Truck", status: "under_review", severity: "serious", created_at: "2026-07-26T22:10:00Z", officer: "Sgt. Kollie" },
];

const mockAlerts = [
  { id: "alert-1", type: "critical" as const, title: "High-Speed Chase in Progress", description: "Vehicle LBR-4521 evading checkpoint on Ganta Highway. Speed 140 km/h. Units responding.", timestamp: new Date().toISOString(), location: "Ganta Highway, Km 45", actionable: true, actionLabel: "View pursuit" },
  { id: "alert-2", type: "critical" as const, title: "Wanted Vehicle Alert", description: "Plate LBR-7890 flagged as stolen. Last seen on Tubman Blvd heading east. Immediate interception recommended.", timestamp: new Date(Date.now() - 120000).toISOString(), location: "Tubman Blvd, Monrovia", actionable: true },
  { id: "alert-3", type: "high" as const, title: "Multiple Violations at Intersection", description: "AI detected 3 red-light violations at Broad & Randall intersection in last 15 minutes. Camera feed available.", timestamp: new Date(Date.now() - 300000).toISOString(), location: "Broad Street, Monrovia", actionable: true },
  { id: "alert-4", type: "warning" as const, title: "Camera Offline — UN Drive", description: "Traffic camera CAM-012 at UN Drive junction has been offline for 45 minutes. Maintenance notified.", timestamp: new Date(Date.now() - 600000).toISOString(), location: "UN Drive, Monrovia" },
  { id: "alert-5", type: "info" as const, title: "ANPR System Peak Performance", description: "License plate recognition system processed 1,256 plates in the last hour. 94% accuracy rate.", timestamp: new Date(Date.now() - 1800000).toISOString() },
  { id: "alert-6", type: "warning" as const, title: "Officer Down — Safety Check", description: "Officer LBR-3342 has not checked in for 3 hours. Last known location: Buchanan Highway. Please confirm status.", timestamp: new Date(Date.now() - 3600000).toISOString(), location: "Buchanan Highway", actionable: true },
];

// ═══════════════════════════════════════════════════════════
// HELPER COMPONENTS
// ═══════════════════════════════════════════════════════════

const KpiCard = memo(function KpiCard({
  title,
  value,
  change,
  trend,
  icon: Icon,
  color,
  subtitle,
  onClick,
  delay = 0,
  liveValue,
}: {
  title: string;
  value: number | string;
  change?: string;
  trend?: "up" | "down" | "neutral";
  icon: any;
  color: string;
  subtitle?: string;
  onClick?: () => void;
  delay?: number;
  liveValue?: number;
}) {
  const numericValue = typeof value === "number" ? value : parseInt(value.replace(/[^0-9]/g, "")) || 0;
  const isNumeric = typeof value === "number" || /^\d+$/.test(value.toString().replace(/[,\s]/g, ""));

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay, duration: 0.4, ease: "easeOut" }}
      whileHover={{ y: -2, transition: { duration: 0.2 } }}
    >
      <Card
        className={`card-premium ${onClick ? "cursor-pointer" : ""} relative overflow-hidden group`}
        onClick={onClick}
      >
        <CardContent className="p-4">
          <div className="flex items-start justify-between">
            <div className="space-y-1.5 flex-1 min-w-0">
              <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider truncate">
                {title}
              </p>
              <div className="flex items-baseline gap-1.5">
                <p className="text-xl sm:text-2xl font-bold text-foreground">
                  {isNumeric ? (
                    <AnimatedCounter
                      value={liveValue ?? numericValue}
                      duration={1200}
                      delay={delay * 1000}
                      compact={numericValue > 999}
                      separator=","
                    />
                  ) : (
                    value
                  )}
                </p>
                {change && (
                  <span className={`text-[10px] font-semibold flex items-center gap-0.5 ${
                    trend === "up" ? "text-emerald-600" :
                    trend === "down" ? "text-red-600" :
                    "text-muted-foreground"
                  }`}>
                    {trend === "up" && <TrendingUp className="w-2.5 h-2.5" />}
                    {trend === "down" && <TrendingDown className="w-2.5 h-2.5" />}
                    {change}
                  </span>
                )}
              </div>
              {subtitle && (
                <p className="text-[10px] text-muted-foreground/70">{subtitle}</p>
              )}
            </div>
            <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center shrink-0 shadow-sm`}>
              <Icon className="w-4 h-4 text-foreground" />
            </div>
          </div>
          {/* Hover glow effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
        </CardContent>
      </Card>
    </motion.div>
  );
});

const SEVERITY_COLORS: Record<string, string> = {
  critical: "bg-red-500/10 text-red-500 border-red-500/20",
  serious: "bg-orange-500/10 text-orange-500 border-orange-500/20",
  high: "bg-orange-500/10 text-orange-500 border-orange-500/20",
  moderate: "bg-amber-500/10 text-amber-500 border-amber-500/20",
  minor: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  low: "bg-gray-500/10 text-gray-500 border-gray-500/20",
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

const ChartCard = memo(function ChartCard({
  title,
  subtitle,
  children,
  className,
  action,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
  action?: React.ReactNode;
}) {
  return (
    <Card className={`card-premium ${className || ""}`}>
      <CardHeader className="pb-3 flex-row items-center justify-between">
        <div>
          <CardTitle className="text-sm font-semibold">{title}</CardTitle>
          {subtitle && <CardDescription className="text-[11px]">{subtitle}</CardDescription>}
        </div>
        {action}
      </CardHeader>
      <CardContent>
        {children}
      </CardContent>
    </Card>
  );
});

const RiskBadge = memo(function RiskBadge({ risk }: { risk: string }) {
  const colors: Record<string, string> = {
    high: "bg-red-500/10 text-red-500 border-red-500/20",
    medium: "bg-amber-500/10 text-amber-500 border-amber-500/20",
    low: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
    critical: "bg-red-500/15 text-red-500 border-red-500/30",
  };
  return (
    <Badge variant="outline" className={`text-[9px] px-1.5 py-0 h-4 ${colors[risk] || colors.low}`}>
      {risk}
    </Badge>
  );
});

const StatusBadge = memo(function StatusBadge({ status }: { status: string }) {
  return (
    <Badge
      variant="outline"
      className={`text-[9px] px-1.5 py-0 h-4 ${STATUS_COLORS[status] || "bg-secondary text-muted-foreground"}`}
    >
      {status.replace(/_/g, " ")}
    </Badge>
  );
});

const ChartTooltipContent = memo(function ChartTooltipContent({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-background border border-border/60 rounded-xl p-3 shadow-xl text-xs space-y-1 backdrop-blur-sm">
      <p className="font-semibold text-foreground mb-1.5 text-[11px]">{label}</p>
      {payload.map((entry: any, i: number) => (
        <div key={i} className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
          <span className="text-muted-foreground">{entry.name}:</span>
          <span className="font-semibold text-foreground">{entry.value.toLocaleString()}</span>
        </div>
      ))}
    </div>
  );
});

// ═══════════════════════════════════════════════════════════
// MAIN DASHBOARD
// ═══════════════════════════════════════════════════════════

export default function Dashboard() {
  const { user } = useAuth();
  const { online } = useNetwork();
  const navigate = useNavigate();
  const responsive = useResponsive();
  const [chartTab, setChartTab] = useState("trends");
  const [dismissedAlerts, setDismissedAlerts] = useState<Set<string>>(new Set());

  // Real-time dashboard data
  const {
    activityFeed,
    liveCounts,
    ready: rtReady,
  } = useRealtimeDashboard();

  const { latestEvent: incidentEvent } = useRealtimeIncidents();

  // Filter out dismissed alerts
  const activeAlerts = useMemo(
    () => mockAlerts.filter((a) => !dismissedAlerts.has(a.id)),
    [dismissedAlerts]
  );

  const handleDismissAlert = useCallback((id: string) => {
    setDismissedAlerts((prev) => new Set(prev).add(id));
  }, []);

  const handleAlertAction = useCallback((alert: any) => {
    if (alert.location?.includes("Ganta")) {
      navigate("/incidents?search=Ganta+Highway");
    } else if (alert.location?.includes("Tubman")) {
      navigate("/incidents?search=LBR-7890");
    } else if (alert.location?.includes("Broad")) {
      navigate("/incidents?view=map");
    } else if (alert.location?.includes("UN Drive")) {
      navigate("/ai-detection");
    } else {
      navigate("/incidents");
    }
  }, [navigate]);

  const handleActivityClick = useCallback((activity: any) => {
    if (activity.referenceId) {
      navigate(`/incidents/${activity.referenceId}`);
    }
  }, [navigate]);

  const handleCaseClick = useCallback((caseId: string) => {
    navigate(`/incidents/${caseId}`);
  }, [navigate]);

  // Memoize system services data to avoid recreating array on each render
  const systemServices = useMemo(() => [
    { label: "Database", status: "operational", color: "bg-emerald-500" },
    { label: "AI Engine", status: "operational", color: "bg-emerald-500" },
    { label: "ANPR Service", status: "operational", color: "bg-emerald-500" },
    { label: "Storage API", status: "degraded", color: "bg-amber-500" },
    { label: "WebSocket", status: "operational", color: "bg-emerald-500" },
  ], []);

  // Responsive grid adjustments
  const kpiGridCols = responsive.isMobile
    ? "grid-cols-2"
    : responsive.isTablet
    ? "grid-cols-3"
    : "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5";

  const isMobile = responsive.isMobile;
  const isCommandCenter = responsive.isCommandCenter;

  return (
    <AppLayout>
      <div className="space-y-5 pb-8">
        {/* ══════════════════════════════════════════════════
             PREMIUM HEADER
             ══════════════════════════════════════════════════ */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
        >
          <div>
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-primary/25 to-primary/5 flex items-center justify-center shadow-sm border border-primary/10">
                <Activity className="w-5 h-5 text-primary" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight">
                    AI Command Dashboard
                  </h1>
                  <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                    <span className="relative flex h-1.5 w-1.5">
                      <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${rtReady ? "bg-emerald-400" : "bg-amber-400"} opacity-75`} />
                      <span className={`relative inline-flex rounded-full h-1.5 w-1.5 ${rtReady ? "bg-emerald-500" : "bg-amber-500"}`} />
                    </span>
                    <span className="text-[9px] font-semibold text-emerald-600 dark:text-emerald-400">
                      {rtReady ? "LIVE" : "CONNECTING"}
                    </span>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">
                  Real-time traffic enforcement intelligence · {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size={isMobile ? "icon" : "sm"}
              className="rounded-xl"
              onClick={() => navigate("/incidents")}
              title="All Incidents"
            >
              <List className="w-4 h-4" />
              {!isMobile && <span className="ml-1.5">All Incidents</span>}
            </Button>
            <Button
              size="sm"
              className="rounded-xl shadow-sm"
              onClick={() => navigate("/incidents/new")}
            >
              <Plus className="w-4 h-4 mr-1.5" />
              {!isMobile && "New Report"}
            </Button>
          </div>
        </motion.div>

        {/* ══════════════════════════════════════════════════
             OFFICER STATUS BAR + CONNECTION
             ══════════════════════════════════════════════════ */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="flex items-center gap-3 bg-gradient-to-r from-card to-card/80 p-3.5 rounded-xl border border-border/50 shadow-sm"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/25 to-primary/5 flex items-center justify-center border border-primary/10">
            <Shield className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="text-sm font-semibold truncate">
                {user?.profile?.full_name || "Officer"}
              </p>
              <span className="text-[10px] text-muted-foreground">— #{user?.profile?.badge_number || "N/A"}</span>
            </div>
            <p className="text-[11px] text-muted-foreground flex items-center gap-1">
              {user?.profile?.station || "No station"}
              {user?.profile?.role ? ` · ${user?.profile?.role.replace(/_/g, " ")}` : ""}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-[10px] py-1 px-2 flex items-center gap-1.5 h-6 bg-emerald-500/10 text-emerald-600 border-emerald-500/20 dark:text-emerald-400">
              <Activity className="w-3 h-3" />
              <span>Active</span>
            </Badge>
            <Badge variant="outline" className={`text-[10px] py-1 px-2 flex items-center gap-1.5 h-6 ${
              online ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20 dark:text-emerald-400" :
              "bg-red-500/10 text-red-600 border-red-500/20"
            }`}>
              {online ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
              <span>{online ? "Online" : "Offline"}</span>
            </Badge>
          </div>
        </motion.div>

        {/* ══════════════════════════════════════════════════
             ALERTS BAR + LIVE FEED (two column on desktop)
             ══════════════════════════════════════════════════ */}
        <div className="grid xl:grid-cols-4 gap-4">
          {/* Alert Panel — takes 3 cols */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="xl:col-span-3"
          >
            <Card className="card-premium overflow-hidden">
              <CardContent className="p-0 max-h-[280px] overflow-y-auto scrollbar-hide">
                <AlertPanel
                  alerts={activeAlerts}
                  maxAlerts={4}
                  onDismiss={handleDismissAlert}
                  onAction={handleAlertAction}
                  title="Active Alerts"
                />
              </CardContent>
            </Card>
          </motion.div>

          {/* Connection status card */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.12 }}
            className="hidden xl:block"
          >
            <Card className="card-premium h-full">
              <CardContent className="p-4 flex flex-col justify-between h-full">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Zap className="w-3.5 h-3.5 text-primary" />
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-foreground/80">
                      System Status
                    </h3>
                  </div>
                  <div className="space-y-2.5">
                    {systemServices.map((service) => (
                      <div key={service.label} className="flex items-center justify-between">
                        <span className="text-[10px] text-muted-foreground">{service.label}</span>
                        <div className="flex items-center gap-1.5">
                          <span className={`w-1.5 h-1.5 rounded-full ${service.color}`} />
                          <span className="text-[9px] font-medium text-muted-foreground capitalize">
                            {service.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-1.5 pt-3 mt-2 border-t border-border/30">
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
                  </span>
                  <span className="text-[9px] text-muted-foreground/60">All systems nominal</span>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* ══════════════════════════════════════════════════
             KPI CARDS — Animated Live Overview
             ══════════════════════════════════════════════════ */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Target className="w-4 h-4 text-primary" />
            <h2 className="text-xs font-semibold text-foreground/70 uppercase tracking-wider">
              Live Overview
            </h2>
            {rtReady && (
              <span className="flex items-center gap-1 text-[9px] text-emerald-600 dark:text-emerald-400 bg-emerald-500/5 px-2 py-0.5 rounded-full">
                <span className="w-1 h-1 rounded-full bg-emerald-500" />
                Real-time
              </span>
            )}
          </div>
          <div className={`grid ${kpiGridCols} gap-2.5`}>
            <KpiCard title="Violations Today" value={47 + liveCounts.newIncidentsToday} change="+8.2%" trend="up" icon={Car} color="from-blue-400/30 to-blue-600/30" subtitle="vs yesterday" delay={0} liveValue={47 + liveCounts.newIncidentsToday} />
            <KpiCard title="This Week" value={312} change="+14.5%" trend="up" icon={Calendar} color="from-cyan-400/30 to-cyan-600/30" subtitle="vs last week" delay={0.02} />
            <KpiCard title="This Month" value={1247} change="+11.3%" trend="up" icon={BarChart3} color="from-violet-400/30 to-violet-600/30" subtitle="vs last month" delay={0.04} />
            <KpiCard title="Live Incidents" value={12 + liveCounts.newIncidentsToday} change={`+${liveCounts.newIncidentsToday}`} trend={liveCounts.newIncidentsToday > 0 ? "up" : "neutral"} icon={Activity} color="from-rose-400/30 to-rose-600/30" subtitle="right now" delay={0.06} liveValue={12 + liveCounts.newIncidentsToday} />
            <KpiCard title="Open Cases" value={89} change="-12.4%" trend="down" icon={FileText} color="from-amber-400/30 to-amber-600/30" subtitle="pending review" delay={0.08} />

            <KpiCard title="Resolved Today" value={24} change="+8.1%" trend="up" icon={CheckCircle2} color="from-emerald-400/30 to-emerald-600/30" subtitle="cleared" delay={0.1} />
            <KpiCard title="Resolved Week" value={156} change="+18.3%" trend="up" icon={CheckCircle2} color="from-teal-400/30 to-teal-600/30" subtitle="total closed" delay={0.12} />
            <KpiCard title="Pending Investigation" value={38} change="-5.2%" trend="down" icon={Search} color="from-orange-400/30 to-orange-600/30" subtitle="needs review" delay={0.14} />
            <KpiCard title="Critical Alerts" value={activeAlerts.filter(a => a.type === "critical").length} change="+2" trend="up" icon={AlertTriangle} color="from-rose-400/30 to-rose-600/30" subtitle="immediate action" delay={0.16} liveValue={activeAlerts.filter(a => a.type === "critical").length} />
            <KpiCard title="Avg Response" value={14} change="-2m" trend="down" icon={Clock} color="from-indigo-400/30 to-indigo-600/30" subtitle="faster than last week" delay={0.18} />

            <KpiCard title="Officers on Duty" value={24} change="+3" trend="up" icon={Users} color="from-green-400/30 to-green-600/30" subtitle="active patrol" delay={0.2} />
            <KpiCard title="Citations Today" value={38} change="+12%" trend="up" icon={Gavel} color="from-purple-400/30 to-purple-600/30" subtitle="issued" delay={0.22} />
            <KpiCard title="AI Detected" value={186 + liveCounts.aiAnalysesCompleted} change="+22%" trend="up" icon={Brain} color="from-fuchsia-400/30 to-fuchsia-600/30" subtitle="this week" delay={0.24} liveValue={186 + liveCounts.aiAnalysesCompleted} />
            <KpiCard title="Active Checkpoints" value={8} change="+1" trend="up" icon={Crosshair} color="from-red-400/30 to-red-600/30" subtitle="operational" delay={0.26} />
            <KpiCard title="Repeat Offenders" value={14} change="+2" trend="up" icon={Repeat} color="from-pink-400/30 to-pink-600/30" subtitle="flagged" delay={0.28} />

            <KpiCard title="Cameras Online" value="32/38" change="84%" trend="neutral" icon={Camera} color="from-sky-400/30 to-sky-600/30" subtitle="6 offline" delay={0.3} />
          </div>
        </div>

        {/* ══════════════════════════════════════════════════
             LIVE FEED + RECENT CASES (2-column)
             ══════════════════════════════════════════════════ */}
        <div className="grid lg:grid-cols-2 gap-4">
          {/* Live Activity Feed */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.32 }}
          >
            <Card className="card-premium overflow-hidden">
              <div className="h-[340px] flex flex-col">
                <LiveIncidentFeed
                  activities={activityFeed}
                  maxItems={15}
                  title="Live Activity Feed"
                  onActivityClick={handleActivityClick}
                />
              </div>
            </Card>
          </motion.div>

          {/* Recent Cases */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
          >
            <Card className="card-premium h-full flex flex-col">
              <CardHeader className="pb-2 flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-sm font-semibold">Recent Cases</CardTitle>
                  <CardDescription className="text-[11px]">Latest incident updates</CardDescription>
                </div>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  className="h-6 w-6 rounded-md text-muted-foreground"
                  onClick={() => navigate("/incidents")}
                  title="View all"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </Button>
              </CardHeader>
              <CardContent className="flex-1 p-0 overflow-y-auto scrollbar-hide">
                <div className="divide-y divide-border/30">
                  {recentCasesData.map((caseItem, i) => (
                    <motion.button
                      key={caseItem.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.35 + i * 0.05 }}
                      className="w-full flex items-start gap-3 px-4 py-3 text-left hover:bg-secondary/30 transition-all group"
                      onClick={() => handleCaseClick(caseItem.id)}
                    >
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                        SEVERITY_COLORS[caseItem.severity] || "bg-secondary"
                      }`}>
                        {caseItem.severity === "critical" || caseItem.severity === "high" || caseItem.severity === "serious"
                          ? <AlertTriangle className="w-3.5 h-3.5" />
                          : <Car className="w-3.5 h-3.5" />
                        }
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <span className="text-[10px] font-mono text-muted-foreground">{caseItem.id}</span>
                          <StatusBadge status={caseItem.status} />
                        </div>
                        <p className="text-xs font-medium truncate group-hover:text-primary transition-colors">
                          {caseItem.title}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[9px] text-muted-foreground/60">{caseItem.officer}</span>
                          <span className="text-[9px] text-muted-foreground/40">·</span>
                          <span className="text-[9px] text-muted-foreground/60">
                            {new Date(caseItem.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>
                      <ChevronRight className="w-3 h-3 text-muted-foreground/30 shrink-0 mt-1 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </motion.button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* ══════════════════════════════════════════════════
             INTERACTIVE CHARTS — 6 tabs
             ══════════════════════════════════════════════════ */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <BarChart3 className="w-4 h-4 text-primary" />
            <h2 className="text-xs font-semibold text-foreground/70 uppercase tracking-wider">
              Analytics & Trends
            </h2>
          </div>

          <Tabs value={chartTab} onValueChange={setChartTab} className="space-y-3">
            {/* Tab buttons — responsive scrolling */}
            <div className="overflow-x-auto scrollbar-hide -mx-1 px-1">
              <TabsList className="inline-flex bg-secondary/50 p-1 rounded-xl gap-0.5 min-w-max">
                <TabsTrigger value="trends" className="rounded-lg data-[state=active]:bg-card data-[state=active]:shadow-sm text-[11px] px-3 py-1.5">
                  <LineChart className="w-3 h-3 mr-1.5 shrink-0" />
                  <span className={isMobile ? "sr-only" : ""}>Trends</span>
                </TabsTrigger>
                <TabsTrigger value="types" className="rounded-lg data-[state=active]:bg-card data-[state=active]:shadow-sm text-[11px] px-3 py-1.5">
                  <PieChart className="w-3 h-3 mr-1.5 shrink-0" />
                  <span className={isMobile ? "sr-only" : ""}>Types</span>
                </TabsTrigger>
                <TabsTrigger value="weekly" className="rounded-lg data-[state=active]:bg-card data-[state=active]:shadow-sm text-[11px] px-3 py-1.5">
                  <BarChart className="w-3 h-3 mr-1.5 shrink-0" />
                  <span className={isMobile ? "sr-only" : ""}>Weekly</span>
                </TabsTrigger>
                <TabsTrigger value="time" className="rounded-lg data-[state=active]:bg-card data-[state=active]:shadow-sm text-[11px] px-3 py-1.5">
                  <AreaChart className="w-3 h-3 mr-1.5 shrink-0" />
                  <span className={isMobile ? "sr-only" : ""}>Time</span>
                </TabsTrigger>
                <TabsTrigger value="ai" className="rounded-lg data-[state=active]:bg-card data-[state=active]:shadow-sm text-[11px] px-3 py-1.5">
                  <Brain className="w-3 h-3 mr-1.5 shrink-0" />
                  <span className={isMobile ? "sr-only" : ""}>AI</span>
                </TabsTrigger>
                <TabsTrigger value="counties" className="rounded-lg data-[state=active]:bg-card data-[state=active]:shadow-sm text-[11px] px-3 py-1.5">
                  <Map className="w-3 h-3 mr-1.5 shrink-0" />
                  <span className={isMobile ? "sr-only" : ""}>Counties</span>
                </TabsTrigger>
              </TabsList>
            </div>

            {/* ── Tab 1: Violation Trends (Line Chart) ── */}
            <TabsContent value="trends" className="mt-0">
              <ChartCard title="Monthly Violation Trends" subtitle="7-month trend analysis with citations and accidents">
                <div className="h-[280px] sm:h-[320px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <ReLineChart data={violationTrendData} margin={{ top: 5, right: 15, left: 0, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.25} />
                      <XAxis dataKey="month" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                      <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                      <Tooltip content={<ChartTooltipContent />} />
                      <Legend wrapperStyle={{ fontSize: "11px" }} />
                      <Line type="monotone" dataKey="violations" stroke="#ef4444" strokeWidth={2.5} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                      <Line type="monotone" dataKey="citations" stroke="#3b82f6" strokeWidth={2.5} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                      <Line type="monotone" dataKey="accidents" stroke="#f97316" strokeWidth={2.5} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                    </ReLineChart>
                  </ResponsiveContainer>
                </div>
              </ChartCard>
            </TabsContent>

            {/* ── Tab 2: Violation Types (Donut Chart) ── */}
            <TabsContent value="types" className="mt-0">
              <div className="grid lg:grid-cols-2 gap-4">
                <ChartCard title="Violation Type Distribution" subtitle="Top 7 violation categories">
                  <div className="h-[280px] sm:h-[320px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <RePieChart>
                        <Pie
                          data={violationTypeData}
                          cx="50%" cy="50%"
                          innerRadius={60} outerRadius={110}
                          paddingAngle={2}
                          dataKey="count"
                        >
                          {violationTypeData.map((entry) => (
                            <Cell key={entry.name} fill={entry.fill} />
                          ))}
                        </Pie>
                        <Tooltip content={<ChartTooltipContent />} />
                        <Legend wrapperStyle={{ fontSize: "10px" }} />
                      </RePieChart>
                    </ResponsiveContainer>
                  </div>
                </ChartCard>
                <ChartCard title="Violation Rankings" subtitle="Counts by type">
                  <div className="space-y-2.5">
                    {violationTypeData.map((v, i) => (
                      <div key={v.name} className="flex items-center gap-3">
                        <span className={`text-xs font-bold w-5 text-right ${i < 3 ? "text-foreground" : "text-muted-foreground"}`}>
                          {i + 1}
                        </span>
                        <div className="flex-1 space-y-0.5">
                          <div className="flex justify-between text-[11px]">
                            <span className="font-medium">{v.name}</span>
                            <span className="text-muted-foreground">{v.count.toLocaleString()}</span>
                          </div>
                          <div className="h-2 bg-secondary rounded-full overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${(v.count / violationTypeData[0].count) * 100}%` }}
                              transition={{ duration: 0.8, delay: i * 0.08 }}
                              className="h-full rounded-full"
                              style={{ backgroundColor: v.fill }}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </ChartCard>
              </div>
            </TabsContent>

            {/* ── Tab 3: Weekly Activity (Bar Chart) ── */}
            <TabsContent value="weekly" className="mt-0">
              <ChartCard title="Weekly Officer Activity" subtitle="Reports, resolved cases, and citations by day">
                <div className="h-[280px] sm:h-[320px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <ReBarChart data={weeklyActivityData} margin={{ top: 5, right: 15, left: 0, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.25} />
                      <XAxis dataKey="day" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                      <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                      <Tooltip content={<ChartTooltipContent />} />
                      <Legend wrapperStyle={{ fontSize: "11px" }} />
                      <Bar dataKey="reports" fill="#ef4444" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="resolved" fill="#22c55e" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="citations" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                    </ReBarChart>
                  </ResponsiveContainer>
                </div>
              </ChartCard>
            </TabsContent>

            {/* ── Tab 4: Time Distribution (Area Chart) ── */}
            <TabsContent value="time" className="mt-0">
              <div className="grid lg:grid-cols-2 gap-4">
                <ChartCard title="Incidents by Time of Day" subtitle="Peak hours analysis">
                  <div className="h-[260px] sm:h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <ReAreaChart data={timeOfDayData} margin={{ top: 5, right: 15, left: 0, bottom: 5 }}>
                        <defs>
                          <linearGradient id="colorIncidents" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.25} />
                        <XAxis dataKey="time" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                        <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                        <Tooltip content={<ChartTooltipContent />} />
                        <Area type="monotone" dataKey="incidents" stroke="#ef4444" strokeWidth={2} fill="url(#colorIncidents)" />
                      </ReAreaChart>
                    </ResponsiveContainer>
                  </div>
                </ChartCard>
                <ChartCard title="Officer Performance" subtitle="Top 4 officers by clearance rate">
                  <div className="space-y-3.5">
                    {officerActivityData.map((o, i) => (
                      <div key={o.name} className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${["from-blue-400/30 to-blue-600/30","from-emerald-400/30 to-emerald-600/30","from-amber-400/30 to-amber-600/30","from-purple-400/30 to-purple-600/30"][i]} flex items-center justify-center shadow-sm`}>
                          <Shield className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium">{o.name}</p>
                          <p className="text-[11px] text-muted-foreground">{o.reports} reports · {o.citations} citations</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400">{o.rating}%</p>
                          <p className="text-[9px] text-muted-foreground">clearance</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </ChartCard>
              </div>
            </TabsContent>

            {/* ── Tab 5: AI Performance (Radar Chart) ── */}
            <TabsContent value="ai" className="mt-0">
              <div className="grid lg:grid-cols-2 gap-4">
                <ChartCard title="AI Detection Accuracy" subtitle="Radar overview of AI model performance">
                  <div className="h-[260px] sm:h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart data={aiDetectionData} cx="50%" cy="50%" outerRadius="75%">
                        <PolarGrid stroke="hsl(var(--border))" strokeOpacity={0.3} />
                        <PolarAngleAxis dataKey="name" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                        <PolarRadiusAxis tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" domain={[0, 100]} />
                        <ReRadar name="Accuracy %" dataKey="accuracy" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.15} />
                        <Tooltip content={<ChartTooltipContent />} />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
                </ChartCard>
                <ChartCard title="AI Processing Stats" subtitle="Processed vs confirmed results">
                  <div className="h-[260px] sm:h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <ReBarChart data={aiDetectionData} margin={{ top: 5, right: 15, left: 0, bottom: 5 }} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.25} />
                        <XAxis type="number" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                        <YAxis dataKey="name" type="category" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" width={90} />
                        <Tooltip content={<ChartTooltipContent />} />
                        <Legend wrapperStyle={{ fontSize: "11px" }} />
                        <Bar dataKey="processed" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
                        <Bar dataKey="confirmed" fill="#22c55e" radius={[0, 4, 4, 0]} />
                      </ReBarChart>
                    </ResponsiveContainer>
                  </div>
                </ChartCard>
              </div>
            </TabsContent>

            {/* ── Tab 6: County Stats (Bar Chart) ── */}
            <TabsContent value="counties" className="mt-0">
              <div className="grid lg:grid-cols-2 gap-4">
                <ChartCard title="Incidents by County" subtitle="Top 8 counties by incident volume">
                  <div className="h-[280px] sm:h-[320px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <ReBarChart data={countyData} margin={{ top: 5, right: 15, left: 0, bottom: 5 }} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.25} />
                        <XAxis type="number" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                        <YAxis dataKey="name" type="category" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" width={85} />
                        <Tooltip content={<ChartTooltipContent />} />
                        <Legend wrapperStyle={{ fontSize: "11px" }} />
                        <Bar dataKey="incidents" fill="#ef4444" radius={[0, 4, 4, 0]} />
                        <Bar dataKey="resolved" fill="#22c55e" radius={[0, 4, 4, 0]} />
                      </ReBarChart>
                    </ResponsiveContainer>
                  </div>
                </ChartCard>
                <ChartCard title="Clearance Rate by County" subtitle="Resolution percentage">
                  <div className="space-y-2">
                    {countyData.map((c, i) => (
                      <div key={c.name} className="flex items-center gap-2.5">
                        <span className="text-[10px] font-medium text-muted-foreground w-20 sm:w-24 truncate" title={c.name}>{c.name}</span>
                        <div className="flex-1">
                          <div className="h-2.5 bg-secondary rounded-full overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${c.rate}%` }}
                              transition={{ duration: 0.8, delay: i * 0.04 }}
                              className="h-full rounded-full"
                              style={{ backgroundColor: c.rate >= 85 ? "#22c55e" : c.rate >= 80 ? "#eab308" : "#f97316" }}
                            />
                          </div>
                        </div>
                        <span className="text-[10px] font-bold w-8 text-right">{c.rate}%</span>
                      </div>
                    ))}
                  </div>
                </ChartCard>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* ══════════════════════════════════════════════════
             MAP + DANGEROUS ROADS
             ══════════════════════════════════════════════════ */}
        <div className="grid lg:grid-cols-3 gap-4">
          {/* Map */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="lg:col-span-2"
          >
            <Card className="card-premium overflow-hidden">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-sm font-semibold">Live Incident Map</CardTitle>
                    <CardDescription className="text-[11px]">Real-time traffic incident locations across Liberia</CardDescription>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-xl text-[11px]"
                    onClick={() => navigate("/incidents?view=map")}
                  >
                    <ExternalLink className="w-3.5 h-3.5 mr-1" />
                    Full Map
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-0 h-[320px] sm:h-[380px]">
                <IncidentMap
                  height="380px"
                  showControls={true}
                  showSearch={true}
                  showLayerToggle={false}
                  showGeolocation={true}
                  onMarkerClick={(id) => navigate(`/incidents/${id}`)}
                />
              </CardContent>
            </Card>
          </motion.div>

          {/* Side panel */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.42 }}
            className="space-y-4"
          >
            {/* Dangerous Roads */}
            <Card className="card-premium">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-sm font-semibold">Most Dangerous Roads</CardTitle>
                    <CardDescription className="text-[11px]">High-incident locations</CardDescription>
                  </div>
                  <Route className="w-4 h-4 text-destructive" />
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-border/30">
                  {dangerousRoadsData.map((road, i) => (
                    <div key={road.road} className="flex items-center gap-3 px-4 py-2 hover:bg-secondary/30 transition-colors">
                      <span className={`text-xs font-bold w-5 text-right ${i < 3 ? "text-foreground" : "text-muted-foreground"}`}>{i + 1}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-[11px] font-medium truncate">{road.road}</p>
                        <p className="text-[10px] text-muted-foreground">{road.incidents} incidents</p>
                      </div>
                      <RiskBadge risk={road.severity} />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Repeat Offenders */}
            <Card className="card-premium">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-sm font-semibold">Repeat Offenders</CardTitle>
                    <CardDescription className="text-[11px]">Flagged license plates</CardDescription>
                  </div>
                  <Repeat className="w-4 h-4 text-amber-500" />
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-border/30">
                  {repeatOffendersData.map((offender) => (
                    <div
                      key={offender.plate}
                      className="flex items-center gap-3 px-4 py-2 hover:bg-secondary/30 transition-colors cursor-pointer"
                      onClick={() => navigate(`/incidents?search=${offender.plate}`)}
                    >
                      <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center">
                        <Car className="w-4 h-4 text-muted-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[11px] font-mono font-semibold">{offender.plate}</p>
                        <p className="text-[10px] text-muted-foreground">{offender.violations} violations · Last {offender.lastDate}</p>
                      </div>
                      <RiskBadge risk={offender.risk} />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* ══════════════════════════════════════════════════
             REGIONAL STATISTICS + AI SUMMARY
             ══════════════════════════════════════════════════ */}
        <div className="grid lg:grid-cols-2 gap-4">
          {/* Regional Statistics */}
          <ChartCard
            title="Regional Statistics"
            subtitle="Police regions — violations, clearance rates, resources"
            action={
              <Badge variant="outline" className="text-[9px] px-2 py-0.5">7 Regions</Badge>
            }
          >
            <div className="overflow-x-auto">
              <table className="w-full text-[11px]">
                <thead>
                  <tr className="border-b border-border/40">
                    <th className="text-left py-2 pr-2 font-medium text-muted-foreground">Region</th>
                    <th className="text-right py-2 px-2 font-medium text-muted-foreground">Violations</th>
                    <th className="text-right py-2 px-2 font-medium text-muted-foreground">Clearance</th>
                    <th className="text-right py-2 px-2 font-medium text-muted-foreground">Officers</th>
                    <th className="text-right py-2 pl-2 font-medium text-muted-foreground">Stations</th>
                  </tr>
                </thead>
                <tbody>
                  {regionalStatsData.map((r) => (
                    <tr key={r.name} className="border-b border-border/10 hover:bg-secondary/20 transition-colors">
                      <td className="py-2 pr-2 font-medium">{r.name}</td>
                      <td className="py-2 px-2 text-right">{r.violations.toLocaleString()}</td>
                      <td className="py-2 px-2 text-right">
                        <span className={`font-semibold ${
                          r.clearance >= 85 ? "text-emerald-600 dark:text-emerald-400" :
                          r.clearance >= 80 ? "text-amber-600 dark:text-amber-400" : "text-red-600 dark:text-red-400"
                        }`}>
                          {r.clearance}%
                        </span>
                      </td>
                      <td className="py-2 px-2 text-right text-muted-foreground">{r.officers}</td>
                      <td className="py-2 pl-2 text-right text-muted-foreground">{r.stations}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </ChartCard>

          {/* AI Detection Summary */}
          <ChartCard
            title="AI Detection Summary"
            subtitle="Model accuracy metrics and processing volumes"
            action={
              <Badge variant="outline" className="text-[9px] px-2 py-0.5 bg-fuchsia-500/10 text-fuchsia-500 border-fuchsia-500/20 flex items-center gap-1">
                <Brain className="w-2.5 h-2.5" />
                AI v2.1
              </Badge>
            }
          >
            <div className="space-y-3.5">
              {aiDetectionData.map((ai) => {
                const confirmRate = ai.processed > 0 ? (ai.confirmed / ai.processed * 100) : 0;
                return (
                  <div key={ai.name}>
                    <div className="flex justify-between text-[11px] mb-0.5">
                      <span className="font-medium">{ai.name}</span>
                      <span className="text-muted-foreground">{ai.processed.toLocaleString()} processed</span>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${ai.accuracy}%` }}
                          transition={{ duration: 1, delay: 0.15 }}
                          className="h-full rounded-full bg-gradient-to-r from-fuchsia-500 to-violet-500"
                        />
                      </div>
                      <span className="text-[11px] font-bold w-10 text-right">{ai.accuracy}%</span>
                    </div>
                    <p className="text-[9px] text-muted-foreground mt-0.5">
                      {ai.confirmed.toLocaleString()} confirmed · {confirmRate.toFixed(1)}% confirmation rate
                    </p>
                  </div>
                );
              })}
            </div>
          </ChartCard>
        </div>

        {/* ══════════════════════════════════════════════════
             QUICK ACTIONS
             ══════════════════════════════════════════════════ */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Button
            variant="outline"
            className="card-premium h-auto p-4 rounded-xl flex-col items-start gap-2.5 !shadow-sm hover:border-primary/30 transition-all group"
            onClick={() => navigate("/incidents/new")}
          >
            <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Plus className="w-5 h-5 text-primary" />
            </div>
            <div className="text-left">
              <p className="text-sm font-semibold">New Report</p>
              <p className="text-[10px] text-muted-foreground">Create traffic violation report</p>
            </div>
          </Button>
          <Button
            variant="outline"
            className="card-premium h-auto p-4 rounded-xl flex-col items-start gap-2.5 !shadow-sm hover:border-amber-500/30 transition-all group"
            onClick={() => navigate("/incidents")}
          >
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Search className="w-5 h-5 text-amber-500" />
            </div>
            <div className="text-left">
              <p className="text-sm font-semibold">Browse Incidents</p>
              <p className="text-[10px] text-muted-foreground">Search and filter all reports</p>
            </div>
          </Button>
          <Button
            variant="outline"
            className="card-premium h-auto p-4 rounded-xl flex-col items-start gap-2.5 !shadow-sm hover:border-emerald-500/30 transition-all group"
            onClick={() => navigate("/evidence")}
          >
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Camera className="w-5 h-5 text-emerald-500" />
            </div>
            <div className="text-left">
              <p className="text-sm font-semibold">Evidence Center</p>
              <p className="text-[10px] text-muted-foreground">Manage digital evidence securely</p>
            </div>
          </Button>
          <Button
            variant="outline"
            className="card-premium h-auto p-4 rounded-xl flex-col items-start gap-2.5 !shadow-sm hover:border-purple-500/30 transition-all group"
            onClick={() => navigate("/command-center")}
          >
            <div className="w-9 h-9 rounded-xl bg-purple-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
              <BarChart3 className="w-5 h-5 text-purple-500" />
            </div>
            <div className="text-left">
              <p className="text-sm font-semibold">Command Center</p>
              <p className="text-[10px] text-muted-foreground">National operational overview</p>
            </div>
          </Button>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between text-[9px] text-muted-foreground/40 pt-2 border-t border-border/20">
          <span>TrafficWatch AI v2.1 · Liberia National Police</span>
          <span>Last updated {new Date().toLocaleTimeString()}</span>
        </div>
      </div>
    </AppLayout>
  );
}
