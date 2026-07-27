import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AppLayout } from "@/components/AppLayout";
import {
  BarChart3,
  Car,
  AlertTriangle,
  CheckCircle2,
  Clock,
  MapPin,
  TrendingUp,
  TrendingDown,
  Shield,
  Plus,
  ExternalLink,
  Activity,
  Navigation,
} from "lucide-react";
import { IncidentMap } from "@/components/IncidentMap";
import type { MapPoint, MapLayerType } from "@/components/IncidentMap";
import { useNavigate } from "react-router";
import { motion } from "framer-motion";

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const statsCards = [
    {
      title: "Total Incidents",
      value: "1,247",
      change: "+12.5%",
      trend: "up",
      icon: Car,
      color: "from-blue-400/30 to-blue-600/30",
    },
    {
      title: "Pending Review",
      value: "38",
      change: "-5.2%",
      trend: "down",
      icon: Clock,
      color: "from-amber-400/30 to-amber-600/30",
    },
    {
      title: "Resolved Today",
      value: "24",
      change: "+8.1%",
      trend: "up",
      icon: CheckCircle2,
      color: "from-emerald-400/30 to-emerald-600/30",
    },
    {
      title: "Critical Alerts",
      value: "7",
      change: "+2",
      trend: "up",
      icon: AlertTriangle,
      color: "from-rose-400/30 to-rose-600/30",
    },
  ];

  const recentIncidents = [
    {
      id: "INC-2024-0891",
      type: "Speeding",
      plate: "LBR-4521",
      location: "Monrovia, UN Drive",
      status: "Under Review",
      severity: "Moderate",
      time: "2 min ago",
    },
    {
      id: "INC-2024-0890",
      type: "Red Light Violation",
      plate: "LBR-7890",
      location: "Monrovia, Broad Street",
      status: "Submitted",
      severity: "Serious",
      time: "15 min ago",
    },
    {
      id: "INC-2024-0889",
      type: "Illegal Parking",
      plate: "LBR-1123",
      location: "Paynesville, Market Junction",
      status: "Resolved",
      severity: "Minor",
      time: "1 hour ago",
    },
    {
      id: "INC-2024-0888",
      type: "Dangerous Overtaking",
      plate: "LBR-5567",
      location: "Ganta Highway, Km 45",
      status: "Under Review",
      severity: "Critical",
      time: "2 hours ago",
    },
    {
      id: "INC-2024-0887",
      type: "No Seat Belt",
      plate: "LBR-3342",
      location: "Monrovia, Tubman Blvd",
      status: "Resolved",
      severity: "Minor",
      time: "3 hours ago",
    },
  ];

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
              Welcome, {user?.profile?.full_name?.split(" ")[0] || "Officer"}
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              Here's your traffic enforcement overview for today
            </p>
          </div>
          <div className="flex gap-3">
            <Button
              variant="outline"
              className="rounded-xl"
              onClick={() => navigate("/incidents")}
            >
              <BarChart3 className="w-4 h-4 mr-2" />
              View All
            </Button>
            <Button
              className="clay-btn rounded-xl"
              onClick={() => navigate("/incidents/new")}
            >
              <Plus className="w-4 h-4 mr-2" />
              New Report
            </Button>
          </div>
        </div>

        {/* User info badge */}
        <div className="flex items-center gap-3 clay-card bg-card/60 p-4 rounded-xl">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
            <Shield className="w-5 h-5 text-primary-foreground" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">
              {user?.profile?.full_name || "Officer"} — #{user?.profile?.badge_number || "N/A"}
            </p>
            <p className="text-xs text-muted-foreground">
              {user?.profile?.station || "No station"} · {user?.profile?.role || "Officer"}
            </p>
          </div>
          <Badge variant="outline" className="clay-pill text-xs py-1">
            <Activity className="w-3 h-3 mr-1 text-success" />
            Active
          </Badge>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {statsCards.map((stat, i) => (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <Card className="clay-card border-border/50 !rounded-2xl">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">{stat.title}</p>
                      <p className="text-2xl font-bold">{stat.value}</p>
                      <div className={`flex items-center gap-1 text-xs ${
                        stat.trend === "up" ? "text-success" : "text-destructive"
                      }`}>
                        {stat.trend === "up" ? (
                          <TrendingUp className="w-3 h-3" />
                        ) : (
                          <TrendingDown className="w-3 h-3" />
                        )}
                        {stat.change}
                        <span className="text-muted-foreground ml-1">vs yesterday</span>
                      </div>
                    </div>
                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center`}>
                      <stat.icon className="w-5 h-5 text-foreground" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Map + Recent Incidents */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Map */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-2"
          >
            <Card className="clay-card border-border/50 !rounded-2xl overflow-hidden">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Incident Map</CardTitle>
                    <CardDescription>Real-time incident locations</CardDescription>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-xl"
                    onClick={() => navigate("/incidents")}
                  >
                    <MapPin className="w-4 h-4 mr-1" />
                    View All
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-0 h-[300px]">
                <IncidentMap
                  height="300px"
                  showControls={true}
                  showSearch={true}
                  showLayerToggle={false}
                  showGeolocation={true}
                  onMarkerClick={(id) => navigate(`/incidents/${id}`)}
                />
              </CardContent>
            </Card>
          </motion.div>

          {/* Recent Incidents */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
          >
            <Card className="clay-card border-border/50 !rounded-2xl h-full">
              <CardHeader className="pb-3">
                <CardTitle>Recent Incidents</CardTitle>
                <CardDescription>Latest reported violations</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-border/50">
                  {recentIncidents.map((incident) => (
                    <div
                      key={incident.id}
                      className="flex items-start gap-3 p-4 hover:bg-secondary/50 transition-colors cursor-pointer"
                      onClick={() => navigate(`/incidents/${incident.id}`)}
                    >
                      <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                        incident.severity === "Critical" ? "bg-destructive" :
                        incident.severity === "Serious" ? "bg-warning" :
                        incident.severity === "Moderate" ? "bg-info" : "bg-success"
                      }`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{incident.type}</p>
                        <p className="text-xs text-muted-foreground truncate">{incident.plate} · {incident.location}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className="clay-pill text-[10px] px-1.5 py-0 h-4">
                            {incident.severity}
                          </Badge>
                          <span className="text-[10px] text-muted-foreground">{incident.time}</span>
                        </div>
                      </div>
                      <Badge className={`clay-pill text-[10px] px-2 py-0 h-5 shrink-0 ${
                        incident.status === "Resolved" ? "bg-success/10 text-success" :
                        incident.status === "Under Review" ? "bg-warning/10 text-warning" :
                        incident.status === "Assigned" ? "bg-blue-500/10 text-blue-500" :
                        incident.status === "Investigating" ? "bg-purple-500/10 text-purple-500" :
                        incident.status === "Confirmed" ? "bg-emerald-500/10 text-emerald-500" :
                        "bg-info/10 text-info"
                      }`}>
                        {incident.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Quick Actions */}
        <div className="grid sm:grid-cols-3 gap-4">
          <Button
            variant="outline"
            className="clay-card h-auto p-5 rounded-xl flex-col items-start gap-2 !shadow-sm"
            onClick={() => navigate("/incidents/new")}
          >
            <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
              <Plus className="w-5 h-5 text-primary" />
            </div>
            <div className="text-left">
              <p className="text-sm font-semibold">New Incident Report</p>
              <p className="text-xs text-muted-foreground">Create a new traffic violation report</p>
            </div>
          </Button>
          <Button
            variant="outline"
            className="clay-card h-auto p-5 rounded-xl flex-col items-start gap-2 !shadow-sm"
            onClick={() => navigate("/incidents")}
          >
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 flex items-center justify-center">
              <MapPin className="w-5 h-5 text-amber-500" />
            </div>
            <div className="text-left">
              <p className="text-sm font-semibold">Browse Incidents</p>
              <p className="text-xs text-muted-foreground">View and filter all traffic incidents</p>
            </div>
          </Button>
          <Button
            variant="outline"
            className="clay-card h-auto p-5 rounded-xl flex-col items-start gap-2 !shadow-sm"
            onClick={() => navigate("/settings")}
          >
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-emerald-500" />
            </div>
            <div className="text-left">
              <p className="text-sm font-semibold">Analytics & Reports</p>
              <p className="text-xs text-muted-foreground">View statistics and generate reports</p>
            </div>
          </Button>
        </div>
      </div>
    </AppLayout>
  );
}
