import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AppLayout } from "@/components/AppLayout";
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
} from "lucide-react";
import { IncidentMap } from "@/components/IncidentMap";
import { useNavigate } from "react-router";
import { motion } from "framer-motion";
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
  RadialBarChart,
  RadialBar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  RadarChart,
  Radar as ReRadar,
} from "recharts";

// ─── Mock Data ─────────────────────────────────────────────

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
  { plate: "LBR-4521", violations: 7, lastDate: "2024-07-26", risk: "high" },
  { plate: "LBR-7890", violations: 5, lastDate: "2024-07-25", risk: "high" },
  { plate: "LBR-3342", violations: 4, lastDate: "2024-07-24", risk: "medium" },
  { plate: "LBR-1123", violations: 3, lastDate: "2024-07-23", risk: "medium" },
  { plate: "LBR-9981", violations: 3, lastDate: "2024-07-22", risk: "low" },
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

const COLORS = ["#ef4444", "#f97316", "#eab308", "#22c55e", "#3b82f6", "#8b5cf6", "#ec4899", "#14b8a6"];

// ─── Helper Components ─────────────────────────────────────

function StatCard({
  title,
  value,
  change,
  trend,
  icon: Icon,
  color,
  subtitle,
  onClick,
  delay = 0,
}: {
  title: string;
  value: string;
  change?: string;
  trend?: "up" | "down" | "neutral";
  icon: any;
  color: string;
  subtitle?: string;
  onClick?: () => void;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
    >
      <Card
        className={`clay-card border-border/50 !rounded-2xl ${onClick ? "cursor-pointer hover:bg-secondary/30 transition-colors" : ""}`}
        onClick={onClick}
      >
        <CardContent className="p-5">
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">{title}</p>
              <p className="text-2xl font-bold">{value}</p>
              {(change || subtitle) && (
                <div className={`flex items-center gap-1 text-xs ${
                  trend === "up" ? "text-success" :
                  trend === "down" ? "text-destructive" :
                  "text-muted-foreground"
                }`}>
                  {trend === "up" && <TrendingUp className="w-3 h-3" />}
                  {trend === "down" && <TrendingDown className="w-3 h-3" />}
                  {change && <span>{change}</span>}
                  {subtitle && <span className="text-muted-foreground">{subtitle}</span>}
                </div>
              )}
            </div>
            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center shrink-0`}>
              <Icon className="w-5 h-5 text-foreground" />
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function MiniChartCard({
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
    <Card className={`clay-card border-border/50 !rounded-2xl ${className || ""}`}>
      <CardHeader className="pb-3 flex-row items-center justify-between">
        <div>
          <CardTitle className="text-base">{title}</CardTitle>
          {subtitle && <CardDescription>{subtitle}</CardDescription>}
        </div>
        {action}
      </CardHeader>
      <CardContent>
        {children}
      </CardContent>
    </Card>
  );
}

function RiskBadge({ risk }: { risk: string }) {
  const colors: Record<string, string> = {
    high: "bg-destructive/10 text-destructive border-destructive/20",
    medium: "bg-warning/10 text-warning border-warning/20",
    low: "bg-success/10 text-success border-success/20",
    critical: "bg-destructive/15 text-destructive border-destructive/30",
  };
  return (
    <Badge variant="outline" className={`clay-pill text-[10px] ${colors[risk] || colors.low}`}>
      {risk}
    </Badge>
  );
}

// ─── Custom Tooltip ───────────────────────────────────────

function ChartTooltipContent({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-background border border-border/50 rounded-xl p-3 shadow-xl text-xs space-y-1">
      <p className="font-medium text-foreground mb-1">{label}</p>
      {payload.map((entry: any, i: number) => (
        <div key={i} className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
          <span className="text-muted-foreground">{entry.name}:</span>
          <span className="font-medium text-foreground">{entry.value.toLocaleString()}</span>
        </div>
      ))}
    </div>
  );
}

// ─── Main Dashboard ────────────────────────────────────────

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [chartTab, setChartTab] = useState<string>("trends");

  return (
    <AppLayout>
      <div className="space-y-6 pb-8">
        {/* ────── Premium Header ────── */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
        >
          <div>
            <div className="flex items-center gap-3 mb-1">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center">
                <Activity className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
                  AI Command Dashboard
                </h1>
                <p className="text-muted-foreground text-sm">
                  Real-time traffic enforcement intelligence
                </p>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="rounded-xl"
              onClick={() => navigate("/incidents")}
            >
              <List className="w-4 h-4 mr-1.5" />
              All Incidents
            </Button>
            <Button
              size="sm"
              className="clay-btn rounded-xl"
              onClick={() => navigate("/incidents/new")}
            >
              <Plus className="w-4 h-4 mr-1.5" />
              New Report
            </Button>
          </div>
        </motion.div>

        {/* ────── Officer Status Bar ────── */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="flex items-center gap-3 clay-card bg-card/60 p-4 rounded-xl"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center">
            <Shield className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">
              {user?.profile?.full_name || "Officer"} — #{user?.profile?.badge_number || "N/A"}
            </p>
            <p className="text-xs text-muted-foreground">
              {user?.profile?.station || "No station"} · {user?.profile?.role || "Officer"}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="clay-pill text-xs py-1 bg-success/10 text-success border-success/20">
              <Activity className="w-3 h-3 mr-1" />
              Active
            </Badge>
            <Badge variant="outline" className="clay-pill text-xs py-1">
              <Clock className="w-3 h-3 mr-1" />
              {new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </Badge>
          </div>
        </motion.div>

        {/* ══════════════════════════════════════════════════
           SECTION 1: KPI CARDS — 4x4 Grid (16 cards)
           ══════════════════════════════════════════════════ */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Activity className="w-4 h-4 text-primary" />
            <h2 className="text-sm font-semibold text-foreground/80 uppercase tracking-wider">
              Live Overview
            </h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
            <StatCard title="Violations Today" value="47" change="+8.2%" trend="up" icon={Car} color="from-blue-400/30 to-blue-600/30" subtitle="vs yesterday" delay={0} />
            <StatCard title="This Week" value="312" change="+14.5%" trend="up" icon={Calendar} color="from-cyan-400/30 to-cyan-600/30" subtitle="vs last week" delay={0.02} />
            <StatCard title="This Month" value="1,247" change="+11.3%" trend="up" icon={BarChart3} color="from-violet-400/30 to-violet-600/30" subtitle="vs last month" delay={0.04} />
            <StatCard title="Live Incidents" value="12" change="+3" trend="up" icon={Activity} color="from-rose-400/30 to-rose-600/30" subtitle="right now" delay={0.06} />
            <StatCard title="Open Cases" value="89" change="-12.4%" trend="down"              icon={FileText} color="from-amber-400/30 to-amber-600/30" subtitle="pending review" delay={0.08} />

            <StatCard title="Resolved Today" value="24" change="+8.1%" trend="up" icon={CheckCircle2} color="from-emerald-400/30 to-emerald-600/30" subtitle="cleared" delay={0.1} />
            <StatCard title="Resolved This Week" value="156" change="+18.3%" trend="up" icon={CheckCircle2} color="from-teal-400/30 to-teal-600/30" subtitle="total closed" delay={0.12} />
            <StatCard title="Pending Investigation" value="38" change="-5.2%" trend="down" icon={Search} color="from-orange-400/30 to-orange-600/30" subtitle="needs review" delay={0.14} />
            <StatCard title="Critical Alerts" value="7" change="+2" trend="up" icon={AlertTriangle} color="from-rose-400/30 to-rose-600/30" subtitle="immediate action" delay={0.16} />
            <StatCard title="Avg Response Time" value="14m" change="-2m" trend="down" icon={Clock} color="from-indigo-400/30 to-indigo-600/30" subtitle="faster than last week" delay={0.18} />

            <StatCard title="Officers on Duty" value="24" change="+3" trend="up" icon={Users} color="from-green-400/30 to-green-600/30" subtitle="active patrol" delay={0.2} />
            <StatCard title="Citations Today" value="38" change="+12%" trend="up" icon={Gavel} color="from-purple-400/30 to-purple-600/30" subtitle="issued" delay={0.22} />
            <StatCard title="AI Detected" value="186" change="+22%" trend="up" icon={Brain} color="from-fuchsia-400/30 to-fuchsia-600/30" subtitle="this week" delay={0.24} />
            <StatCard title="Active Checkpoints" value="8" change="+1" trend="up" icon={Crosshair} color="from-red-400/30 to-red-600/30" subtitle="operational" delay={0.26} />
            <StatCard title="Repeat Offenders" value="14" change="+2" trend="up" icon={Repeat} color="from-pink-400/30 to-pink-600/30" subtitle="flagged" delay={0.28} />

            <StatCard title="Cameras Online" value="32/38" change="84%" trend="neutral" icon={Camera} color="from-sky-400/30 to-sky-600/30" subtitle="6 offline" delay={0.3} />
          </div>
        </div>

        {/* ══════════════════════════════════════════════════
           SECTION 2: INTERACTIVE CHARTS
           ══════════════════════════════════════════════════ */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <BarChart3 className="w-4 h-4 text-primary" />
            <h2 className="text-sm font-semibold text-foreground/80 uppercase tracking-wider">
              Analytics & Trends
            </h2>
          </div>

          <Tabs value={chartTab} onValueChange={setChartTab} className="space-y-4">
            <TabsList className="clay-card bg-secondary/50 p-1 rounded-xl">
              <TabsTrigger value="trends" className="rounded-lg data-[state=active]:bg-card data-[state=active]:clay-card data-[state=active]:shadow-sm">
                <LineChart className="w-3.5 h-3.5 mr-1.5" />
                Violation Trends
              </TabsTrigger>
              <TabsTrigger value="types" className="rounded-lg data-[state=active]:bg-card data-[state=active]:clay-card data-[state=active]:shadow-sm">
                <PieChart className="w-3.5 h-3.5 mr-1.5" />
                Violation Types
              </TabsTrigger>
              <TabsTrigger value="weekly" className="rounded-lg data-[state=active]:bg-card data-[state=active]:clay-card data-[state=active]:shadow-sm">
                <BarChart className="w-3.5 h-3.5 mr-1.5" />
                Weekly Activity
              </TabsTrigger>
              <TabsTrigger value="time" className="rounded-lg data-[state=active]:bg-card data-[state=active]:clay-card data-[state=active]:shadow-sm">
                <AreaChart className="w-3.5 h-3.5 mr-1.5" />
                Time Distribution
              </TabsTrigger>
              <TabsTrigger value="ai" className="rounded-lg data-[state=active]:bg-card data-[state=active]:clay-card data-[state=active]:shadow-sm">
                <Brain className="w-3.5 h-3.5 mr-1.5" />
                AI Performance
              </TabsTrigger>
              <TabsTrigger value="counties" className="rounded-lg data-[state=active]:bg-card data-[state=active]:clay-card data-[state=active]:shadow-sm">
                <Map className="w-3.5 h-3.5 mr-1.5" />
                County Stats
              </TabsTrigger>
            </TabsList>

            {/* ── Tab 1: Violation Trends (Line Chart) ── */}
            <TabsContent value="trends" className="mt-0">
              <MiniChartCard title="Monthly Violation Trends" subtitle="7-month trend analysis with citations and accidents" className="!rounded-2xl">
                <div className="h-[320px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <ReLineChart data={violationTrendData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.3} />
                      <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                      <YAxis tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                      <Tooltip content={<ChartTooltipContent />} />
                      <Legend />
                      <Line type="monotone" dataKey="violations" stroke="#ef4444" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                      <Line type="monotone" dataKey="citations" stroke="#3b82f6" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                      <Line type="monotone" dataKey="accidents" stroke="#f97316" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                    </ReLineChart>
                  </ResponsiveContainer>
                </div>
              </MiniChartCard>
            </TabsContent>

            {/* ── Tab 2: Violation Types (Donut Chart) ── */}
            <TabsContent value="types" className="mt-0">
              <div className="grid lg:grid-cols-2 gap-4">
                <MiniChartCard title="Violation Type Distribution" subtitle="Top 7 violation categories" className="!rounded-2xl">
                  <div className="h-[320px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <RePieChart>
                        <Pie
                          data={violationTypeData}
                          cx="50%"
                          cy="50%"
                          innerRadius={65}
                          outerRadius={120}
                          paddingAngle={3}
                          dataKey="count"
                        >
                          {violationTypeData.map((entry, index) => (
                            <Cell key={entry.name} fill={entry.fill} />
                          ))}
                        </Pie>
                        <Tooltip content={<ChartTooltipContent />} />
                        <Legend />
                      </RePieChart>
                    </ResponsiveContainer>
                  </div>
                </MiniChartCard>
                <MiniChartCard title="Violation Rankings" subtitle="Counts by type" className="!rounded-2xl">
                  <div className="space-y-3">
                    {violationTypeData.map((v, i) => (
                      <div key={v.name} className="flex items-center gap-3">
                        <span className="text-xs font-medium text-muted-foreground w-5">{i + 1}</span>
                        <div className="flex-1 space-y-1">
                          <div className="flex justify-between text-xs">
                            <span className="font-medium">{v.name}</span>
                            <span className="text-muted-foreground">{v.count.toLocaleString()}</span>
                          </div>
                          <div className="h-2 bg-secondary rounded-full overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${(v.count / violationTypeData[0].count) * 100}%` }}
                              transition={{ duration: 0.8, delay: i * 0.1 }}
                              className="h-full rounded-full"
                              style={{ backgroundColor: v.fill }}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </MiniChartCard>
              </div>
            </TabsContent>

            {/* ── Tab 3: Weekly Activity (Bar Chart) ── */}
            <TabsContent value="weekly" className="mt-0">
              <MiniChartCard title="Weekly Officer Activity" subtitle="Reports, resolved cases, and citations by day" className="!rounded-2xl">
                <div className="h-[320px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <ReBarChart data={weeklyActivityData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.3} />
                      <XAxis dataKey="day" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                      <YAxis tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                      <Tooltip content={<ChartTooltipContent />} />
                      <Legend />
                      <Bar dataKey="reports" fill="#ef4444" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="resolved" fill="#22c55e" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="citations" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                    </ReBarChart>
                  </ResponsiveContainer>
                </div>
              </MiniChartCard>
            </TabsContent>

            {/* ── Tab 4: Time Distribution (Area Chart) ── */}
            <TabsContent value="time" className="mt-0">
              <div className="grid lg:grid-cols-2 gap-4">
                <MiniChartCard title="Incidents by Time of Day" subtitle="Peak hours analysis" className="!rounded-2xl">
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <ReAreaChart data={timeOfDayData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                        <defs>
                          <linearGradient id="colorIncidents" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.3} />
                        <XAxis dataKey="time" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                        <YAxis tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                        <Tooltip content={<ChartTooltipContent />} />
                        <Area type="monotone" dataKey="incidents" stroke="#ef4444" strokeWidth={2} fill="url(#colorIncidents)" />
                      </ReAreaChart>
                    </ResponsiveContainer>
                  </div>
                </MiniChartCard>
                <MiniChartCard title="Officer Performance" subtitle="Top 4 officers by clearance rate" className="!rounded-2xl">
                  <div className="space-y-4">
                    {officerActivityData.map((o, i) => (
                      <div key={o.name} className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${["from-blue-400/30 to-blue-600/30","from-emerald-400/30 to-emerald-600/30","from-amber-400/30 to-amber-600/30","from-purple-400/30 to-purple-600/30"][i]} flex items-center justify-center`}>
                          <Shield className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium">{o.name}</p>
                          <p className="text-xs text-muted-foreground">{o.reports} reports · {o.citations} citations</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold text-success">{o.rating}%</p>
                          <p className="text-[10px] text-muted-foreground">clearance</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </MiniChartCard>
              </div>
            </TabsContent>

            {/* ── Tab 5: AI Performance (Radar Chart) ── */}
            <TabsContent value="ai" className="mt-0">
              <div className="grid lg:grid-cols-2 gap-4">
                <MiniChartCard title="AI Detection Accuracy" subtitle="Radar overview of AI model performance" className="!rounded-2xl">
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart data={aiDetectionData} cx="50%" cy="50%" outerRadius="75%">
                        <PolarGrid stroke="hsl(var(--border))" strokeOpacity={0.3} />
                        <PolarAngleAxis dataKey="name" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                        <PolarRadiusAxis tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" domain={[0, 100]} />
                        <ReRadar name="Accuracy %" dataKey="accuracy" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.2} />
                        <Tooltip content={<ChartTooltipContent />} />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
                </MiniChartCard>
                <MiniChartCard title="AI Processing Stats" subtitle="Processed vs confirmed results" className="!rounded-2xl">
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <ReBarChart data={aiDetectionData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.3} />
                        <XAxis type="number" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                        <YAxis dataKey="name" type="category" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" width={100} />
                        <Tooltip content={<ChartTooltipContent />} />
                        <Legend />
                        <Bar dataKey="processed" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
                        <Bar dataKey="confirmed" fill="#22c55e" radius={[0, 4, 4, 0]} />
                      </ReBarChart>
                    </ResponsiveContainer>
                  </div>
                </MiniChartCard>
              </div>
            </TabsContent>

            {/* ── Tab 6: County Stats (Bar Chart) ── */}
            <TabsContent value="counties" className="mt-0">
              <div className="grid lg:grid-cols-2 gap-4">
                <MiniChartCard title="Incidents by County" subtitle="Top 8 counties by incident volume" className="!rounded-2xl">
                  <div className="h-[320px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <ReBarChart data={countyData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.3} />
                        <XAxis type="number" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                        <YAxis dataKey="name" type="category" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" width={100} />
                        <Tooltip content={<ChartTooltipContent />} />
                        <Legend />
                        <Bar dataKey="incidents" fill="#ef4444" radius={[0, 4, 4, 0]} />
                        <Bar dataKey="resolved" fill="#22c55e" radius={[0, 4, 4, 0]} />
                      </ReBarChart>
                    </ResponsiveContainer>
                  </div>
                </MiniChartCard>
                <MiniChartCard title="Clearance Rate by County" subtitle="Resolution percentage" className="!rounded-2xl">
                  <div className="space-y-2.5">
                    {countyData.map((c, i) => (
                      <div key={c.name} className="flex items-center gap-3">
                        <span className="text-xs font-medium text-muted-foreground w-24 truncate" title={c.name}>{c.name}</span>
                        <div className="flex-1">
                          <div className="h-3 bg-secondary rounded-full overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${c.rate}%` }}
                              transition={{ duration: 0.8, delay: i * 0.05 }}
                              className="h-full rounded-full"
                              style={{ backgroundColor: c.rate >= 85 ? "#22c55e" : c.rate >= 80 ? "#eab308" : "#f97316" }}
                            />
                          </div>
                        </div>
                        <span className="text-xs font-bold w-8 text-right">{c.rate}%</span>
                      </div>
                    ))}
                  </div>
                </MiniChartCard>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* ══════════════════════════════════════════════════
           SECTION 3: MAP + DANGEROUS ROADS
           ══════════════════════════════════════════════════ */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Map */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            className="lg:col-span-2"
          >
            <Card className="clay-card border-border/50 !rounded-2xl overflow-hidden">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Live Incident Map</CardTitle>
                    <CardDescription>Real-time traffic incident locations across Liberia</CardDescription>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-xl"
                    onClick={() => navigate("/incidents?view=map")}
                  >
                    <ExternalLink className="w-4 h-4 mr-1" />
                    Full Map
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-0 h-[380px]">
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

          {/* Dangerous Roads + Repeat Offenders */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="space-y-4"
          >
            {/* Dangerous Roads */}
            <Card className="clay-card border-border/50 !rounded-2xl">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base">Most Dangerous Roads</CardTitle>
                    <CardDescription>High-incident locations</CardDescription>
                  </div>
                  <Route className="w-4 h-4 text-destructive" />
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-border/50">
                  {dangerousRoadsData.map((road, i) => (
                    <div key={road.road} className="flex items-center gap-3 px-4 py-2.5 hover:bg-secondary/30 transition-colors">
                      <span className="text-xs font-medium text-muted-foreground w-5">{i + 1}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium truncate">{road.road}</p>
                        <p className="text-[10px] text-muted-foreground">{road.incidents} incidents</p>
                      </div>
                      <RiskBadge risk={road.severity} />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Repeat Offenders */}
            <Card className="clay-card border-border/50 !rounded-2xl">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base">Repeat Offenders</CardTitle>
                    <CardDescription>Flagged license plates</CardDescription>
                  </div>
                  <Repeat className="w-4 h-4 text-warning" />
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-border/50">
                  {repeatOffendersData.map((offender) => (
                    <div key={offender.plate} className="flex items-center gap-3 px-4 py-2.5 hover:bg-secondary/30 transition-colors cursor-pointer"
                      onClick={() => navigate(`/incidents?search=${offender.plate}`)}
                    >
                      <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center">
                        <Car className="w-4 h-4 text-muted-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium">{offender.plate}</p>
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
           SECTION 4: REGIONAL + AI STATISTICS
           ══════════════════════════════════════════════════ */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Regional Statistics */}
          <MiniChartCard
            title="Regional Statistics"
            subtitle="Police regions — violations, clearance rates, resources"
            className="!rounded-2xl"
            action={
              <Badge variant="outline" className="clay-pill">7 Regions</Badge>
            }
          >
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border/50">
                    <th className="text-left py-2 pr-2 font-medium text-muted-foreground">Region</th>
                    <th className="text-right py-2 px-2 font-medium text-muted-foreground">Violations</th>
                    <th className="text-right py-2 px-2 font-medium text-muted-foreground">Clearance</th>
                    <th className="text-right py-2 px-2 font-medium text-muted-foreground">Officers</th>
                    <th className="text-right py-2 pl-2 font-medium text-muted-foreground">Stations</th>
                  </tr>
                </thead>
                <tbody>
                  {regionalStatsData.map((r) => (
                    <tr key={r.name} className="border-b border-border/20 hover:bg-secondary/20 transition-colors">
                      <td className="py-2 pr-2 font-medium">{r.name}</td>
                      <td className="py-2 px-2 text-right">{r.violations}</td>
                      <td className="py-2 px-2 text-right">
                        <span className={`font-medium ${
                          r.clearance >= 85 ? "text-success" :
                          r.clearance >= 80 ? "text-warning" : "text-destructive"
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
          </MiniChartCard>

          {/* AI Detection Summary */}
          <MiniChartCard
            title="AI Detection Summary"
            subtitle="Model accuracy metrics and processing volumes"
            className="!rounded-2xl"
            action={
              <Badge variant="outline" className="clay-pill bg-fuchsia-500/10 text-fuchsia-500 border-fuchsia-500/20">
                <Brain className="w-3 h-3 mr-1" />
                AI v2.1
              </Badge>
            }
          >
            <div className="space-y-4">
              {aiDetectionData.map((ai) => (
                <div key={ai.name}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="font-medium">{ai.name}</span>
                    <span className="text-muted-foreground">{ai.processed.toLocaleString()} processed</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${ai.accuracy}%` }}
                        transition={{ duration: 1, delay: 0.2 }}
                        className="h-full rounded-full bg-gradient-to-r from-fuchsia-500 to-violet-500"
                      />
                    </div>
                    <span className="text-xs font-bold w-10 text-right">{ai.accuracy}%</span>
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    {ai.confirmed.toLocaleString()} confirmed · {(ai.confirmed / ai.processed * 100).toFixed(1)}% confirmed rate
                  </p>
                </div>
              ))}
            </div>
          </MiniChartCard>
        </div>

        {/* ══════════════════════════════════════════════════
           SECTION 5: QUICK ACTIONS
           ══════════════════════════════════════════════════ */}
        <div className="grid sm:grid-cols-4 gap-3">
          <Button
            variant="outline"
            className="clay-card h-auto p-4 rounded-xl flex-col items-start gap-2 !shadow-sm"
            onClick={() => navigate("/incidents/new")}
          >
            <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
              <Plus className="w-5 h-5 text-primary" />
            </div>
            <div className="text-left">
              <p className="text-sm font-semibold">New Report</p>
              <p className="text-xs text-muted-foreground">Create traffic violation report</p>
            </div>
          </Button>
          <Button
            variant="outline"
            className="clay-card h-auto p-4 rounded-xl flex-col items-start gap-2 !shadow-sm"
            onClick={() => navigate("/incidents")}
          >
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 flex items-center justify-center">
              <Search className="w-5 h-5 text-amber-500" />
            </div>
            <div className="text-left">
              <p className="text-sm font-semibold">Browse Incidents</p>
              <p className="text-xs text-muted-foreground">Search and filter all reports</p>
            </div>
          </Button>
          <Button
            variant="outline"
            className="clay-card h-auto p-4 rounded-xl flex-col items-start gap-2 !shadow-sm"
            onClick={() => navigate("/evidence")}
          >
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 flex items-center justify-center">
              <Camera className="w-5 h-5 text-emerald-500" />
            </div>
            <div className="text-left">
              <p className="text-sm font-semibold">Evidence Center</p>
              <p className="text-xs text-muted-foreground">Manage digital evidence securely</p>
            </div>
          </Button>
          <Button
            variant="outline"
            className="clay-card h-auto p-4 rounded-xl flex-col items-start gap-2 !shadow-sm"
            onClick={() => navigate("/settings")}
          >
            <div className="w-9 h-9 rounded-xl bg-purple-500/10 flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-purple-500" />
            </div>
            <div className="text-left">
              <p className="text-sm font-semibold">AI Reports</p>
              <p className="text-xs text-muted-foreground">Generate intelligence summaries</p>
            </div>
          </Button>
        </div>
      </div>
    </AppLayout>
  );
}
