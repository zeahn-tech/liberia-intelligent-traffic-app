import { useState } from "react";
import { useNavigate } from "react-router";
import { motion, AnimatePresence } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { IncidentMap } from "@/components/IncidentMap";
import { useAuth } from "@/hooks/use-auth";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  BarChart3,
// eslint-disable-next-line @typescript-eslint/no-unused-vars
  Bell,
  Brain,
  Camera,
  Car,
  CheckCircle2,
// eslint-disable-next-line @typescript-eslint/no-unused-vars
  ChevronDown,
// eslint-disable-next-line @typescript-eslint/no-unused-vars
  ChevronRight,
// eslint-disable-next-line @typescript-eslint/no-unused-vars
  ChevronUp,
  Clock,
  Crosshair,
  ExternalLink,
// eslint-disable-next-line @typescript-eslint/no-unused-vars
  FileText,
// eslint-disable-next-line @typescript-eslint/no-unused-vars
  Flag,
  Gavel,
  Gauge,
  Globe,
// eslint-disable-next-line @typescript-eslint/no-unused-vars
  Layers,
// eslint-disable-next-line @typescript-eslint/no-unused-vars
  List,
// eslint-disable-next-line @typescript-eslint/no-unused-vars
  Loader2,
  MapPin,
  Maximize2,
// eslint-disable-next-line @typescript-eslint/no-unused-vars
  Menu,
  Minimize2,
// eslint-disable-next-line @typescript-eslint/no-unused-vars
  Monitor,
// eslint-disable-next-line @typescript-eslint/no-unused-vars
  Moon,
// eslint-disable-next-line @typescript-eslint/no-unused-vars
  MoreHorizontal,
// eslint-disable-next-line @typescript-eslint/no-unused-vars
  Navigation,
  PieChart,
// eslint-disable-next-line @typescript-eslint/no-unused-vars
  Plus,
  Repeat,
  Route,
// eslint-disable-next-line @typescript-eslint/no-unused-vars
  Search,
// eslint-disable-next-line @typescript-eslint/no-unused-vars
  Settings,
  Shield,
// eslint-disable-next-line @typescript-eslint/no-unused-vars
  ShieldAlert,
// eslint-disable-next-line @typescript-eslint/no-unused-vars
  Sun,
  TrendingDown,
  TrendingUp,
  Users,
// eslint-disable-next-line @typescript-eslint/no-unused-vars
  Video,
  Wifi,
// eslint-disable-next-line @typescript-eslint/no-unused-vars
  WifiOff,
// eslint-disable-next-line @typescript-eslint/no-unused-vars
  X,
  Zap,
} from "lucide-react";
import {
// eslint-disable-next-line @typescript-eslint/no-unused-vars
  LineChart as ReLineChart,
  Line,
  BarChart as ReBarChart,
  Bar,
// eslint-disable-next-line @typescript-eslint/no-unused-vars
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
// eslint-disable-next-line @typescript-eslint/no-unused-vars
  RadarChart,
// eslint-disable-next-line @typescript-eslint/no-unused-vars
  RadialBarChart,
// eslint-disable-next-line @typescript-eslint/no-unused-vars
  RadialBar,
// eslint-disable-next-line @typescript-eslint/no-unused-vars
  PolarGrid,
// eslint-disable-next-line @typescript-eslint/no-unused-vars
  PolarAngleAxis,
// eslint-disable-next-line @typescript-eslint/no-unused-vars
  PolarRadiusAxis,
// eslint-disable-next-line @typescript-eslint/no-unused-vars
  Radar as ReRadar,
  ComposedChart,
} from "recharts";

// ─── Theme Colors ─────────────────────────────────────

const CC_COLORS = {
  slate: { bg: "from-slate-900/90 to-slate-950/90", border: "border-slate-700/50", text: "text-slate-400" },
  red: { accent: "bg-red-500", text: "text-red-400", bg: "bg-red-500/10" },
  amber: { accent: "bg-amber-500", text: "text-amber-400", bg: "bg-amber-500/10" },
  emerald: { accent: "bg-emerald-500", text: "text-emerald-400", bg: "bg-emerald-500/10" },
  blue: { accent: "bg-blue-500", text: "text-blue-400", bg: "bg-blue-500/10" },
  purple: { accent: "bg-purple-500", text: "text-purple-400", bg: "bg-purple-500/10" },
  cyan: { accent: "bg-cyan-500", text: "text-cyan-400", bg: "bg-cyan-500/10" },
};

const SEVERITY_STYLES: Record<string, string> = {
  critical: "text-red-400 bg-red-500/10 border-red-500/20",
  serious: "text-orange-400 bg-orange-500/10 border-orange-500/20",
  moderate: "text-amber-400 bg-amber-500/10 border-amber-500/20",
  minor: "text-blue-400 bg-blue-500/10 border-blue-500/20",
};


// ─── Mock Data ────────────────────────────────────────

const violationTrendData = [
  { month: "Jan", violations: 145, accidents: 38, citations: 120 },
  { month: "Feb", violations: 132, accidents: 42, citations: 108 },
  { month: "Mar", violations: 158, accidents: 35, citations: 134 },
  { month: "Apr", violations: 172, accidents: 48, citations: 145 },
  { month: "May", violations: 165, accidents: 40, citations: 138 },
  { month: "Jun", violations: 189, accidents: 55, citations: 156 },
  { month: "Jul", violations: 201, accidents: 52, citations: 168 },
  { month: "Aug", violations: 215, accidents: 58, citations: 178, prediction: true },
  { month: "Sep", violations: 232, accidents: 62, citations: 190, prediction: true },
];

const countyData = [
  { name: "Montserrado", incidents: 445, resolved: 382, rate: 86, trend: "+12%", severity: "high" },
  { name: "Nimba", incidents: 178, resolved: 145, rate: 81, trend: "+5%", severity: "medium" },
  { name: "Bong", incidents: 134, resolved: 112, rate: 84, trend: "+3%", severity: "medium" },
  { name: "Lofa", incidents: 98, resolved: 76, rate: 78, trend: "-2%", severity: "medium" },
  { name: "Grand Bassa", incidents: 87, resolved: 71, rate: 82, trend: "+8%", severity: "low" },
  { name: "Margibi", incidents: 76, resolved: 62, rate: 82, trend: "+1%", severity: "low" },
  { name: "Gbarpolu", incidents: 45, resolved: 38, rate: 84, trend: "-5%", severity: "low" },
  { name: "Grand Cape Mount", incidents: 52, resolved: 42, rate: 81, trend: "+6%", severity: "low" },
  { name: "Maryland", incidents: 38, resolved: 30, rate: 79, trend: "-1%", severity: "low" },
  { name: "Grand Kru", incidents: 28, resolved: 22, rate: 79, trend: "+4%", severity: "low" },
  { name: "River Gee", incidents: 25, resolved: 19, rate: 76, trend: "+2%", severity: "low" },
  { name: "River Cess", incidents: 22, resolved: 17, rate: 77, trend: "-3%", severity: "low" },
  { name: "Grand Gedeh", incidents: 42, resolved: 33, rate: 79, trend: "+7%", severity: "low" },
  { name: "Sinoe", incidents: 32, resolved: 25, rate: 78, trend: "+5%", severity: "low" },
  { name: "Bomi", incidents: 35, resolved: 28, rate: 80, trend: "+2%", severity: "low" },
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

const regionData = [
  { name: "Montserrado", violations: 445, clearance: 86, officers: 120, trend: "up" },
  { name: "North Central", violations: 312, clearance: 82, officers: 85, trend: "up" },
  { name: "South Central", violations: 163, clearance: 81, officers: 50, trend: "up" },
  { name: "Western", violations: 178, clearance: 79, officers: 55, trend: "down" },
  { name: "North Western", violations: 98, clearance: 78, officers: 40, trend: "down" },
  { name: "Eastern", violations: 125, clearance: 76, officers: 35, trend: "up" },
  { name: "South Eastern", violations: 87, clearance: 74, officers: 30, trend: "down" },
];

const dangerousRoadsData = [
  { road: "UN Drive, Monrovia", incidents: 78, severity: "high", trend: "+12%" },
  { road: "Ganta Highway, Km 45", incidents: 62, severity: "critical", trend: "+18%" },
  { road: "Broad Street, Monrovia", incidents: 55, severity: "high", trend: "+8%" },
  { road: "Buchanan Highway", incidents: 48, severity: "medium", trend: "+5%" },
  { road: "Tubman Blvd", incidents: 42, severity: "medium", trend: "-3%" },
  { road: "Market Junction", incidents: 38, severity: "medium", trend: "+2%" },
  { road: "Robertsfield Highway", incidents: 32, severity: "low", trend: "+15%" },
];

const liveAlerts = [
  { id: "alert-1", type: "critical", title: "Critical: RTC on Ganta Highway", location: "Km 45, Ganta Highway", time: "2 min ago", details: "2 vehicles, injuries reported" },
  { id: "alert-2", type: "high", title: "High: Speeding hotspot - UN Drive", location: "Ministerial Complex", time: "15 min ago", details: "8 violations in last hour" },
  { id: "alert-3", type: "high", title: "High: Citizen report - Reckless driving", location: "Broad Street", time: "22 min ago", details: "Witnesses provided statements" },
  { id: "alert-4", type: "medium", title: "Escalated: Illegal parking operation", location: "Market Junction", time: "45 min ago", details: "3 vehicles towed" },
  { id: "alert-5", type: "low", title: "Resolved: Road obstruction cleared", location: "Tubman Blvd", time: "1h ago", details: "Debris removed" },
];

const officerDeployment = [
  { name: "Sgt. Kollie", station: "Monrovia Central", status: "active", cases: 8, today: 3 },
  { name: "Ofc. Tarplah", station: "Monrovia Central", status: "active", cases: 6, today: 2 },
  { name: "Ofc. Flomo", station: "Paynesville", status: "active", cases: 5, today: 1 },
  { name: "Lt. Gbarnga", station: "Ganta Highway", status: "patrol", cases: 4, today: 2 },
  { name: "Ofc. Toe", station: "Monrovia Central", status: "break", cases: 3, today: 0 },
  { name: "Sgt. Kamara", station: "Buchanan", status: "active", cases: 4, today: 2 },
];

const responseTimeData = [
  { range: "< 15m", count: 142 },
  { range: "15-30m", count: 98 },
  { range: "30-45m", count: 56 },
  { range: "45-60m", count: 32 },
  { range: "> 60m", count: 18 },
];

// ─── Helper ──────────────────────────────────────────

function CCGridCard({ children, className = "", highlight = false }: { children: React.ReactNode; className?: string; highlight?: boolean }) {
  return (
    <div className={`rounded-xl border ${highlight ? "border-red-500/30 bg-red-500/[0.03]" : "border-slate-700/30 bg-slate-900/40"} backdrop-blur-sm ${className}`}>
      {children}
    </div>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-slate-900/95 border border-slate-700/50 rounded-xl p-3 shadow-2xl text-xs space-y-1 backdrop-blur-xl">
      <p className="font-medium text-slate-200 mb-1">{label}</p>
// eslint-disable-next-line @typescript-eslint/no-explicit-any
      {payload.map((entry: any, i: number) => (
        <div key={i} className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
          <span className="text-slate-400">{entry.name}:</span>
          <span className="font-medium text-slate-200">{entry.value.toLocaleString()}</span>
        </div>
      ))}
    </div>
  );
}

// ─── Command Center ──────────────────────────────────

export default function CommandCenter() {
  const navigate = useNavigate();
  const [selectedCounty, setSelectedCounty] = useState<string | null>(null);
  const [fullScreen, setFullScreen] = useState(false);

  const now = new Date();
  const timeStr = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  const dateStr = now.toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" });

  return (
    <div className={`min-h-screen bg-slate-950 text-slate-200 ${fullScreen ? "fixed inset-0 z-[9999]" : ""}`}>
      {/* ─── Top Status Ribbon ─── */}
      <div className="bg-slate-900/90 border-b border-slate-800/50 backdrop-blur-xl">
        <div className="flex items-center justify-between px-4 sm:px-6 py-2.5">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center">
                <Shield className="w-3.5 h-3.5 text-white" />
              </div>
              <div>
                <span className="text-sm font-bold text-white tracking-tight">COMMAND CENTER</span>
                <span className="text-[10px] text-slate-500 ml-2 font-mono">v2.1</span>
              </div>
            </div>
            <div className="hidden sm:flex items-center gap-3 text-[11px] text-slate-400">
              <span className="flex items-center gap-1.5">
                <Clock className="w-3 h-3 text-slate-500" />
                {timeStr}
              </span>
              <span className="w-1 h-1 rounded-full bg-slate-700" />
              <span>{dateStr}</span>
              <span className="w-1 h-1 rounded-full bg-slate-700" />
              <span className="flex items-center gap-1.5">
                <Wifi className="w-3 h-3 text-emerald-400" />
                Live
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="text-[11px] text-slate-400 hover:text-white h-7 rounded-lg"
              onClick={() => navigate("/dashboard")}
            >
              <ArrowRight className="w-3 h-3 mr-1 rotate-180" />
              Exit Command Center
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 rounded-lg text-slate-400 hover:text-white"
              onClick={() => setFullScreen(!fullScreen)}
            >
              {fullScreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
            </Button>
          </div>
        </div>
      </div>

      {/* ─── Main Scrollable Content ─── */}
      <ScrollArea className="h-[calc(100vh-49px)]">
        <div className="p-3 sm:p-4 lg:p-5 space-y-4 max-w-[1600px] mx-auto">
          {/* ════════════════════════════════════════════
             SECTION 1: NATIONAL KPI BAR
             ════════════════════════════════════════════ */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5"
          >
            {[
              { label: "VIOLATIONS TODAY", value: "47", change: "+8.2%", trend: "up", icon: Car, color: CC_COLORS.blue },
              { label: "ACTIVE INCIDENTS", value: "12", change: "+3", trend: "up", icon: Activity, color: CC_COLORS.red },
              { label: "OFFICERS ON DUTY", value: "24", change: "+3", trend: "up", icon: Users, color: CC_COLORS.emerald },
              { label: "AVG RESPONSE", value: "14m", change: "-2m", trend: "down", icon: Clock, color: CC_COLORS.amber },
              { label: "CLEARANCE RATE", value: "86%", change: "+4.2%", trend: "up", icon: CheckCircle2, color: CC_COLORS.cyan },
              { label: "CAMERAS ONLINE", value: "32/38", change: "84%", trend: "neutral", icon: Camera, color: CC_COLORS.purple },
            ].map((kpi, i) => {
              const Icon = kpi.icon;
              return (
                <motion.div
                  key={kpi.label}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                >
                  <CCGridCard className="p-3.5">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1.5">
                        <p className="text-[9px] tracking-widest font-medium text-slate-500 uppercase">{kpi.label}</p>
                        <p className="text-xl sm:text-2xl font-bold text-white tracking-tight">{kpi.value}</p>
                        <div className={`flex items-center gap-1 text-[10px] ${
                          kpi.trend === "up" ? "text-emerald-400" :
                          kpi.trend === "down" ? "text-red-400" : "text-slate-500"
                        }`}>
                          {kpi.trend === "up" && <TrendingUp className="w-2.5 h-2.5" />}
                          {kpi.trend === "down" && <TrendingDown className="w-2.5 h-2.5" />}
                          <span>{kpi.change}</span>
                        </div>
                      </div>
                      <div className={`w-8 h-8 rounded-lg ${kpi.color.bg} flex items-center justify-center`}>
                        <Icon className={`w-4 h-4 ${kpi.color.text}`} />
                      </div>
                    </div>
                  </CCGridCard>
                </motion.div>
              );
            })}
          </motion.div>

          {/* ════════════════════════════════════════════
             SECTION 2: LIVE ALERTS + MAP
             ════════════════════════════════════════════ */}
          <div className="grid lg:grid-cols-3 gap-4">
            {/* Critical Alerts */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="lg:col-span-1"
            >
              <CCGridCard highlight className="overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 bg-red-500/[0.04] border-b border-red-500/20">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-md bg-red-500/20 flex items-center justify-center">
                      <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
                    </div>
                    <span className="text-xs font-bold text-red-300 uppercase tracking-wider">Critical Alerts</span>
                  </div>
                  <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-4 bg-red-500/20 text-red-300 border-red-500/30">
                    {liveAlerts.filter(a => a.type === "critical" || a.type === "high").length} active
                  </Badge>
                </div>
                <div className="divide-y divide-red-500/10">
                  <AnimatePresence>
                    {liveAlerts.map((alert) => (
                      <motion.div
                        key={alert.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="px-4 py-2.5 hover:bg-red-500/[0.03] transition-colors cursor-pointer"
                      >
                        <div className="flex items-start gap-2.5">
                          <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                            alert.type === "critical" ? "bg-red-500 animate-pulse" :
                            alert.type === "high" ? "bg-amber-500" :
                            alert.type === "medium" ? "bg-yellow-500" : "bg-slate-500"
                          }`} />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="text-xs font-medium text-slate-200 truncate">{alert.title}</p>
                              <span className="text-[9px] text-slate-500 shrink-0">{alert.time}</span>
                            </div>
                            <p className="text-[10px] text-slate-400 mt-0.5 truncate">{alert.location}</p>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </CCGridCard>
            </motion.div>

            {/* Live Map */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="lg:col-span-2"
            >
              <CCGridCard className="overflow-hidden h-full">
                <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700/30">
                  <div className="flex items-center gap-2">
                    <Globe className="w-4 h-4 text-cyan-400" />
                    <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">Live Incident Map</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-4 bg-cyan-500/10 text-cyan-400 border-cyan-500/20">
                      <MapPin className="w-2.5 h-2.5 mr-1" />
                      15 markers
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-[10px] text-slate-500 h-6 rounded-lg"
                      onClick={() => navigate("/incidents?view=map")}
                    >
                      <ExternalLink className="w-3 h-3 mr-1" />
                      Full Map
                    </Button>
                  </div>
                </div>
                <div className="h-[400px] lg:h-[420px]">
                  <IncidentMap
                    height="100%"
                    showControls={false}
                    showSearch={true}
                    showLayerToggle={true}
                    showGeolocation={true}
                    onMarkerClick={(id) => navigate(`/incidents/${id}`)}
                  />
                </div>
              </CCGridCard>
            </motion.div>
          </div>

          {/* ════════════════════════════════════════════
             SECTION 3: COUNTY + REGIONAL OVERVIEW
             ════════════════════════════════════════════ */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <CCGridCard className="overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700/30">
                <div className="flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-blue-400" />
                  <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">National County Overview</span>
                </div>
                <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-4 bg-slate-800 text-slate-400 border-slate-700/50">
                  15 counties
                </Badge>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-slate-800/50">
                      <th className="text-left py-2.5 px-3 font-medium text-slate-500 uppercase tracking-wider text-[9px]">County</th>
                      <th className="text-right py-2.5 px-3 font-medium text-slate-500 uppercase tracking-wider text-[9px]">Incidents</th>
                      <th className="text-right py-2.5 px-3 font-medium text-slate-500 uppercase tracking-wider text-[9px]">Resolved</th>
                      <th className="text-right py-2.5 px-3 font-medium text-slate-500 uppercase tracking-wider text-[9px]">Rate</th>
                      <th className="text-right py-2.5 px-3 font-medium text-slate-500 uppercase tracking-wider text-[9px]">Trend</th>
                      <th className="text-right py-2.5 px-3 font-medium text-slate-500 uppercase tracking-wider text-[9px]">Severity</th>
                    </tr>
                  </thead>
                  <tbody>
                    {countyData.map((c, i) => (
                      <motion.tr
                        key={c.name}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: i * 0.02 }}
                        className={`border-b border-slate-800/30 hover:bg-slate-800/30 transition-colors cursor-pointer ${
                          selectedCounty === c.name ? "bg-slate-800/40" : ""
                        }`}
                        onClick={() => setSelectedCounty(selectedCounty === c.name ? null : c.name)}
                      >
                        <td className="py-2.5 px-3 font-medium text-slate-200">{c.name}</td>
                        <td className="py-2.5 px-3 text-right text-slate-300">{c.incidents}</td>
                        <td className="py-2.5 px-3 text-right text-slate-400">{c.resolved}</td>
                        <td className="py-2.5 px-3 text-right">
                          <span className={`font-medium ${
                            c.rate >= 85 ? "text-emerald-400" :
                            c.rate >= 80 ? "text-amber-400" : "text-red-400"
                          }`}>
                            {c.rate}%
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <span className={`text-[10px] ${
                            c.trend.startsWith("+") ? "text-red-400" : "text-emerald-400"
                          }`}>
                            {c.trend}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <span className={`text-[10px] ${
                            c.severity === "high" ? "text-red-400" :
                            c.severity === "medium" ? "text-amber-400" : "text-slate-500"
                          }`}>
                            {c.severity}
                          </span>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CCGridCard>
          </motion.div>

          {/* ════════════════════════════════════════════
             SECTION 4: CHARTS GRID
             ════════════════════════════════════════════ */}
          <div className="grid lg:grid-cols-2 gap-4">
            {/* Violation Trends */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
            >
              <CCGridCard className="overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700/30">
                  <div className="flex items-center gap-2">
                    <Activity className="w-4 h-4 text-violet-400" />
                    <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">Violation Trends</span>
                  </div>
                  <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-4 bg-violet-500/10 text-violet-400 border-violet-500/20">
                    +Predicted
                  </Badge>
                </div>
                <div className="p-4 h-[280px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={violationTrendData} margin={{ top: 5, right: 15, left: 0, bottom: 5 }}>
                      <defs>
                        <linearGradient id="trendGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#ef4444" stopOpacity={0.15} />
                          <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.08} />
                      <XAxis dataKey="month" tick={{ fontSize: 10, fill: "#94a3b8" }} stroke="#334155" />
                      <YAxis tick={{ fontSize: 10, fill: "#94a3b8" }} stroke="#334155" />
                      <Tooltip content={<ChartTooltip />} />
                      <Legend wrapperStyle={{ fontSize: "10px", color: "#94a3b8" }} />
                      <Area type="monotone" dataKey="violations" stroke="#ef4444" strokeWidth={2} fill="url(#trendGradient)" />
                      <Bar dataKey="citations" fill="#3b82f6" radius={[2, 2, 0, 0]} opacity={0.6} />
                      <Line type="monotone" dataKey="violations" stroke="#ef4444" strokeWidth={2} dot={{ r: 3, fill: "#ef4444" }} strokeDasharray={violationTrendData.slice(-2).every(d => d.prediction) ? "5 5" : ""} />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </CCGridCard>
            </motion.div>

            {/* Violation Types */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <CCGridCard className="overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700/30">
                  <div className="flex items-center gap-2">
                    <PieChart className="w-4 h-4 text-amber-400" />
                    <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">Violation Distribution</span>
                  </div>
                </div>
                <div className="p-4 h-[280px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <RePieChart>
                      <Pie
                        data={violationTypeData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={2}
                        dataKey="count"
                      >
// eslint-disable-next-line @typescript-eslint/no-unused-vars
                        {violationTypeData.map((entry, index) => (
                          <Cell key={entry.name} fill={entry.fill} />
                        ))}
                      </Pie>
                      <Tooltip content={<ChartTooltip />} />
                      <Legend wrapperStyle={{ fontSize: "10px", color: "#94a3b8" }} />
                    </RePieChart>
                  </ResponsiveContainer>
                </div>
              </CCGridCard>
            </motion.div>
          </div>

          {/* ════════════════════════════════════════════
             SECTION 5: REGIONS + DANGEROUS ROADS + OFFICERS
             ════════════════════════════════════════════ */}
          <div className="grid lg:grid-cols-3 gap-4">
            {/* Regional Overview */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
              <CCGridCard className="overflow-hidden h-full">
                <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700/30">
                  <div className="flex items-center gap-2">
                    <Globe className="w-4 h-4 text-emerald-400" />
                    <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">Police Regions</span>
                  </div>
                </div>
                <div className="divide-y divide-slate-800/50">
                  {regionData.map((r) => (
                    <div key={r.name} className="px-4 py-2.5 hover:bg-slate-800/30 transition-colors">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs font-medium text-slate-200">{r.name}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-slate-400">{r.violations} violations</span>
                          <span className={`text-[10px] ${r.trend === "up" ? "text-red-400" : "text-emerald-400"}`}>
                            {r.trend === "up" ? "↑" : "↓"}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${r.clearance}%` }}
                            transition={{ duration: 1, delay: 0.3 }}
                            className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-emerald-400"
                          />
                        </div>
                        <span className="text-[10px] font-medium text-emerald-400 w-8 text-right">{r.clearance}%</span>
                      </div>
                      <p className="text-[9px] text-slate-600 mt-1">{r.officers} officers deployed</p>
                    </div>
                  ))}
                </div>
              </CCGridCard>
            </motion.div>

            {/* Dangerous Roads */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
              <CCGridCard className="overflow-hidden h-full">
                <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700/30">
                  <div className="flex items-center gap-2">
                    <Route className="w-4 h-4 text-red-400" />
                    <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">High-Risk Locations</span>
                  </div>
                </div>
                <div className="divide-y divide-slate-800/50">
                  {dangerousRoadsData.map((road, i) => (
                    <div key={road.road} className="flex items-center gap-3 px-4 py-2.5 hover:bg-slate-800/30 transition-colors">
                      <span className="text-[10px] font-mono text-slate-600 w-4">{i + 1}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-slate-200 truncate">{road.road}</p>
                        <p className="text-[10px] text-slate-500">{road.incidents} incidents</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] ${
                          road.trend.startsWith("+") ? "text-red-400" : "text-emerald-400"
                        }`}>
                          {road.trend}
                        </span>
                        <span className={`text-[9px] px-1.5 py-0.5 rounded ${
                          road.severity === "critical" ? "text-red-400 bg-red-500/10" :
                          road.severity === "high" ? "text-orange-400 bg-orange-500/10" :
                          road.severity === "medium" ? "text-amber-400 bg-amber-500/10" :
                          "text-slate-400 bg-slate-800"
                        }`}>
                          {road.severity}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CCGridCard>
            </motion.div>

            {/* Officer Deployment */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}>
              <CCGridCard className="overflow-hidden h-full">
                <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700/30">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-blue-400" />
                    <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">Officer Deployment</span>
                  </div>
                  <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-4 bg-slate-800 text-slate-400 border-slate-700/50">
                    <Activity className="w-2.5 h-2.5 mr-1 text-emerald-400" />
                    {officerDeployment.filter(o => o.status === "active").length} active
                  </Badge>
                </div>
                <div className="divide-y divide-slate-800/50">
                  {officerDeployment.map((officer) => (
                    <div key={officer.name} className="flex items-center gap-3 px-4 py-2.5 hover:bg-slate-800/30 transition-colors">
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                        officer.status === "active" ? "bg-emerald-500/20" :
                        officer.status === "patrol" ? "bg-blue-500/20" : "bg-slate-800"
                      }`}>
                        <Shield className={`w-3.5 h-3.5 ${
                          officer.status === "active" ? "text-emerald-400" :
                          officer.status === "patrol" ? "text-blue-400" : "text-slate-500"
                        }`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-slate-200 truncate">{officer.name}</p>
                        <p className="text-[9px] text-slate-500 truncate">{officer.station}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-medium text-slate-300">{officer.today}</p>
                        <p className="text-[9px] text-slate-500">today</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CCGridCard>
            </motion.div>
          </div>

          {/* ════════════════════════════════════════════
             SECTION 6: RESPONSE TIME + REPEAT OFFENDERS
             ════════════════════════════════════════════ */}
          <div className="grid lg:grid-cols-2 gap-4">
            {/* Response Time Distribution */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
              <CCGridCard className="overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700/30">
                  <div className="flex items-center gap-2">
                    <Gauge className="w-4 h-4 text-amber-400" />
                    <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">Response Time Distribution</span>
                  </div>
                  <span className="text-[10px] text-slate-500">Avg: 14m</span>
                </div>
                <div className="p-4 h-[200px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <ReBarChart data={responseTimeData} margin={{ top: 5, right: 15, left: 0, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.08} />
                      <XAxis dataKey="range" tick={{ fontSize: 10, fill: "#94a3b8" }} stroke="#334155" />
                      <YAxis tick={{ fontSize: 10, fill: "#94a3b8" }} stroke="#334155" />
                      <Tooltip content={<ChartTooltip />} />
                      <Bar dataKey="count" fill="#f59e0b" radius={[3, 3, 0, 0]} />
                    </ReBarChart>
                  </ResponsiveContainer>
                </div>
              </CCGridCard>
            </motion.div>

            {/* Quick Stats */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.55 }}>
              <CCGridCard className="overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700/30">
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-purple-400" />
                    <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">Intelligence Summary</span>
                  </div>
                </div>
                <div className="p-4 grid grid-cols-2 gap-3">
                  {[
                    { label: "AI Detections (7d)", value: "1,256", icon: Brain, color: "from-purple-500/20 to-purple-600/10", textColor: "text-purple-400" },
                    { label: "Repeat Offenders", value: "14", icon: Repeat, color: "from-pink-500/20 to-pink-600/10", textColor: "text-pink-400" },
                    { label: "Active Checkpoints", value: "8", icon: Crosshair, color: "from-red-500/20 to-red-600/10", textColor: "text-red-400" },
                    { label: "Citations This Week", value: "892", icon: Gavel, color: "from-blue-500/20 to-blue-600/10", textColor: "text-blue-400" },
                  ].map((stat) => {
                    const Icon = stat.icon;
                    return (
                      <div key={stat.label} className="p-3 rounded-lg bg-slate-800/40 border border-slate-700/30">
                        <div className="flex items-center gap-2 mb-2">
                          <div className={`w-6 h-6 rounded-md bg-gradient-to-br ${stat.color} flex items-center justify-center`}>
                            <Icon className={`w-3 h-3 ${stat.textColor}`} />
                          </div>
                          <span className="text-[9px] text-slate-500 uppercase tracking-wider">{stat.label}</span>
                        </div>
                        <p className={`text-lg font-bold ${stat.textColor}`}>{stat.value}</p>
                      </div>
                    );
                  })}
                </div>
              </CCGridCard>
            </motion.div>
          </div>

          {/* ─── Footer ─── */}
          <div className="text-center py-4">
            <p className="text-[10px] text-slate-700">
              TrafficWatch AI Command Center · Liberia National Police · All data simulated for demonstration
            </p>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}
