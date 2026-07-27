import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Shield,
  ShieldCheck,
  ShieldAlert,
  ShieldOff,
  Lock,
  Key,
  Users,
  FileWarning,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  ExternalLink,
  RefreshCw,
  Search,
  Download,
  Eye,
  EyeOff,
  Activity,
  Server,
  Database,
  Wifi,
  FileText,
  Camera,
  HardDrive,
  LogOut,
  AlertCircle,
  Info,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/hooks/use-auth";
import { usePermission } from "@/lib/permissions";
import { getSecurityArchitectureInfo, getSecurityHeaderStatus } from "@/lib/security";
import type { SecurityArchitectureInfo, SecurityHeaderStatus } from "@/lib/security";
import { supabase } from "@/supabase/client";

export default function SecurityDashboard() {
  const { user } = useAuth();
  const { role, can } = usePermission();
  const [activeTab, setActiveTab] = useState("overview");
  const [eventSearch, setEventSearch] = useState("");
  const [showHeaders, setShowHeaders] = useState(false);

  const architecture = getSecurityArchitectureInfo();
  const headers = getSecurityHeaderStatus();

  const implementedCount = architecture.filter((a) => a.status === "implemented").length;
  const partialCount = architecture.filter((a) => a.status === "partial").length;
  const plannedCount = architecture.filter((a) => a.status === "planned").length;

  if (!can("configure_system") && !can("view_audit_logs")) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <ShieldAlert className="w-16 h-16 text-muted-foreground/40" />
        <h2 className="text-xl font-semibold">Access Restricted</h2>
        <p className="text-muted-foreground text-sm max-w-md text-center">
          You need System Administrator or System Auditor permissions to view the Security Dashboard.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
      >
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Shield className="w-6 h-6 text-primary" />
            Security Dashboard
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Comprehensive security posture overview for TrafficWatch AI
          </p>
        </div>
        <div className="flex items-center gap-2">
          {can("configure_system") && (
            <Button variant="outline" size="sm" className="rounded-xl gap-2">
              <RefreshCw className="w-4 h-4" />
              Run Security Scan
            </Button>
          )}
        </div>
      </motion.div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <SummaryCard
          icon={ShieldCheck}
          label="Implemented"
          value={implementedCount}
          total={architecture.length}
          color="text-emerald-500"
          bg="bg-emerald-500/10"
        />
        <SummaryCard
          icon={ShieldAlert}
          label="Partial"
          value={partialCount}
          total={architecture.length}
          color="text-amber-500"
          bg="bg-amber-500/10"
        />
        <SummaryCard
          icon={ShieldOff}
          label="Planned"
          value={plannedCount}
          total={architecture.length}
          color="text-slate-400"
          bg="bg-slate-400/10"
        />
        <SummaryCard
          icon={Lock}
          label="RLS Tables"
          value={15}
          total={18}
          color="text-blue-500"
          bg="bg-blue-500/10"
        />
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="rounded-xl">
          <TabsTrigger value="overview" className="rounded-lg gap-2">
            <Shield className="w-4 h-4" />
            Architecture
          </TabsTrigger>
          <TabsTrigger value="headers" className="rounded-lg gap-2">
            <Server className="w-4 h-4" />
            Security Headers
          </TabsTrigger>
          <TabsTrigger value="events" className="rounded-lg gap-2">
            <Activity className="w-4 h-4" />
            Events
          </TabsTrigger>
          <TabsTrigger value="guidelines" className="rounded-lg gap-2">
            <FileText className="w-4 h-4" />
            Guidelines
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {architecture.map((item, index) => (
              <ArchitectureCard key={item.name} item={item} index={index} />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="headers" className="space-y-4">
          <Card className="border-border/50 clay-card !rounded-2xl">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">HTTP Security Headers</CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  className="rounded-lg gap-2"
                  onClick={() => setShowHeaders(!showHeaders)}
                >
                  {showHeaders ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  {showHeaders ? "Hide Details" : "Show Details"}
                </Button>
              </div>
              <CardDescription>
                Security headers protect against XSS, clickjacking, MIME sniffing, and other browser-level attacks.
                Configure these on your production server (Nginx, Caddy, Cloudflare, etc.).
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {headers.map((header) => (
                <HeaderRow key={header.name} header={header} showDetails={showHeaders} />
              ))}
            </CardContent>
          </Card>
          <Card className="border-border/50 clay-card !rounded-2xl">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Recommended CSP</CardTitle>
              <CardDescription>
                Copy this Content-Security-Policy header to your production server configuration.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <pre className="bg-muted/50 p-4 rounded-xl text-xs font-mono overflow-x-auto whitespace-pre-wrap break-all">
                {headers.find((h) => h.name === "Content-Security-Policy")?.recommended || "N/A"}
              </pre>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="events" className="space-y-4">
          <Card className="border-border/50 clay-card !rounded-2xl">
            <CardHeader className="pb-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-500" />
                  Security Events
                </CardTitle>
                <div className="relative flex-1 max-w-xs">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search events..."
                    value={eventSearch}
                    onChange={(e) => setEventSearch(e.target.value)}
                    className="pl-9 rounded-xl"
                  />
                </div>
              </div>
              <CardDescription>
                Security events are logged server-side via the security_events table.
                Events visible here require the v17 migration to be applied.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <Activity className="w-12 h-12 mx-auto mb-3 opacity-40" />
                <p className="text-sm font-medium">Security Event Monitoring</p>
                <p className="text-xs mt-1">Events will appear here after the v17 database migration is applied.</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="guidelines" className="space-y-4">
          <Card className="border-border/50 clay-card !rounded-2xl">
            <CardHeader>
              <CardTitle className="text-base">Security Best Practices</CardTitle>
              <CardDescription>
                Operational guidelines for maintaining a secure TrafficWatch AI deployment.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <GuidelineSection
                title="Authentication & Access Control"
                icon={Lock}
                guidelines={[
                  "Enforce strong passwords (min 8 chars, mixed case, numbers, special chars)",
                  "Enable MFA/2FA for all police personnel accounts",
                  "Regularly audit active sessions and revoke unused ones",
                  "Set session timeouts appropriate to operational requirements (15-60 min)",
                  "Never share accounts or credentials between officers",
                  "Use the permission matrix to assign minimum required permissions",
                ]}
              />
              <Separator />
              <GuidelineSection
                title="Evidence & Data Protection"
                icon={HardDrive}
                guidelines={[
                  "All evidence uploads go through MIME validation and size limits",
                  "Evidence files stored in private Supabase buckets — never public",
                  "Use signed URLs (1-hour expiry) for evidence access",
                  "SHA-256 hashing verifies evidence integrity on every access",
                  "Chain of custody automatically logged for every evidence interaction",
                  "Citizen data never exposed to unauthorized roles",
                ]}
              />
              <Separator />
              <GuidelineSection
                title="Audit & Monitoring"
                icon={Activity}
                guidelines={[
                  "All security-sensitive actions are audit-logged immediately",
                  "Review audit logs regularly for suspicious patterns",
                  "Monitor auth failure rates — multiple failures may indicate brute force",
                  "Security events with 'critical' severity require immediate review",
                  "Audit logs are immutable — never modify or delete",
                  "Export and archive audit logs periodically for compliance",
                ]}
              />
              <Separator />
              <GuidelineSection
                title="Development & Deployment"
                icon={Server}
                guidelines={[
                  "Never commit API keys, secrets, or service-role keys to source control",
                  "Use environment variables for all configuration (Keys/API keys tab)",
                  "Apply all database migrations in order — never skip versions",
                  "Supabase anon key is safe in frontend — RLS prevents unauthorized access",
                  "Configure CSP, HSTS, X-Frame-Options on production proxy",
                  "Keep all dependencies updated (npm audit regularly)",
                ]}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ─── Sub-components ──────────────────────────────────

function SummaryCard({
  icon: Icon,
  label,
  value,
  total,
  color,
  bg,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number;
  total: number;
  color: string;
  bg: string;
}) {
  return (
    <Card className="border-border/50 clay-card !rounded-2xl">
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center`}>
            <Icon className={`w-5 h-5 ${color}`} />
          </div>
          <div>
            <p className="text-2xl font-bold">{value}</p>
            <p className="text-xs text-muted-foreground">
              {label} / {total}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function ArchitectureCard({ item, index }: { item: SecurityArchitectureInfo; index: number }) {
  const statusColors: Record<string, string> = {
    implemented: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
    partial: "bg-amber-500/10 text-amber-500 border-amber-500/20",
    planned: "bg-slate-500/10 text-slate-400 border-slate-500/20",
  };

  const statusIcons: Record<string, React.ComponentType<{ className?: string }>> = {
    implemented: CheckCircle2,
    partial: AlertTriangle,
    planned: XCircle,
  };

  const StatusIcon = statusIcons[item.status] || Info;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
    >
      <Card className="border-border/50 clay-card !rounded-2xl h-full">
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between gap-2">
            <CardTitle className="text-sm font-semibold">{item.name}</CardTitle>
            <Badge
              variant="outline"
              className={`shrink-0 text-[10px] px-2 py-0.5 ${statusColors[item.status]}`}
            >
              <StatusIcon className="w-3 h-3 mr-1 inline" />
              {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-muted-foreground mb-2">{item.description}</p>
          <p className="text-[11px] text-muted-foreground/70 leading-relaxed">{item.details}</p>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function HeaderRow({ header, showDetails }: { header: SecurityHeaderStatus; showDetails: boolean }) {
  return (
    <div className="flex items-center justify-between py-2 px-3 rounded-xl bg-secondary/20 hover:bg-secondary/30 transition-colors">
      <div className="flex items-center gap-3 min-w-0">
        {header.present ? (
          <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
        ) : (
          <XCircle className="w-4 h-4 text-muted-foreground shrink-0" />
        )}
        <div className="min-w-0">
          <span className="text-sm font-medium">{header.name}</span>
          {header.critical && !header.present && (
            <span className="text-[10px] text-amber-500 ml-2 font-medium">CRITICAL</span>
          )}
          {showDetails && header.value && (
            <p className="text-xs text-muted-foreground truncate mt-0.5">Current: {header.value}</p>
          )}
        </div>
      </div>
      {showDetails && (
        <span className="text-[10px] text-muted-foreground text-right max-w-[200px] truncate ml-2">
          {header.recommended}
        </span>
      )}
    </div>
  );
}

function GuidelineSection({
  title,
  icon: Icon,
  guidelines,
}: {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  guidelines: string[];
}) {
  return (
    <div>
      <h3 className="text-sm font-semibold flex items-center gap-2 mb-3">
        <Icon className="w-4 h-4 text-primary" />
        {title}
      </h3>
      <ul className="space-y-1.5">
        {guidelines.map((g, i) => (
          <li key={i} className="text-xs text-muted-foreground flex items-start gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-primary/40 mt-1.5 shrink-0" />
            {g}
          </li>
        ))}
      </ul>
    </div>
  );
}
