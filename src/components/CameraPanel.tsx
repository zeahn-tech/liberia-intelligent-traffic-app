// ============================================================
// TrafficWatch AI — Camera Panel Component
//
// Displays:
// - Camera infrastructure list with status indicators
// - Live detection events feed
// - Camera detail panel (with placeholder for future live stream)
// - Camera statistics
//
// FUTURE: When real camera streams are available, the
// <CameraLiveStream /> section will render the actual
// video feed using the appropriate stream gateway.
// ============================================================

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Camera,
  Video,
  MapPin,
  Activity,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  RefreshCw,
// eslint-disable-next-line @typescript-eslint/no-unused-vars
  Eye,
// eslint-disable-next-line @typescript-eslint/no-unused-vars
  EyeOff,
  ChevronDown,
  ChevronUp,
  Monitor,
  Wifi,
  WifiOff,
// eslint-disable-next-line @typescript-eslint/no-unused-vars
  Clock,
// eslint-disable-next-line @typescript-eslint/no-unused-vars
  ExternalLink,
// eslint-disable-next-line @typescript-eslint/no-unused-vars
  Shield,
  Zap,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useCameras } from "@/hooks/use-cameras";

// ─── Status Badge ───────────────────────────────────────

function CameraStatusBadge({ status }: { status: string }) {
  const config: Record<string, { color: string; icon: React.ReactNode; label: string }> = {
    streaming: { color: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20", icon: <Wifi className="h-3 w-3" />, label: "Live" },
    connected: { color: "bg-blue-500/10 text-blue-600 border-blue-500/20", icon: <Wifi className="h-3 w-3" />, label: "Connected" },
    connecting: { color: "bg-amber-500/10 text-amber-600 border-amber-500/20", icon: <RefreshCw className="h-3 w-3 animate-spin" />, label: "Connecting" },
    reconnecting: { color: "bg-amber-500/10 text-amber-600 border-amber-500/20", icon: <RefreshCw className="h-3 w-3 animate-spin" />, label: "Reconnecting" },
    error: { color: "bg-red-500/10 text-red-600 border-red-500/20", icon: <XCircle className="h-3 w-3" />, label: "Error" },
    disconnected: { color: "bg-slate-500/10 text-slate-600 border-slate-500/20", icon: <WifiOff className="h-3 w-3" />, label: "Offline" },
    offline: { color: "bg-slate-500/10 text-slate-600 border-slate-500/20", icon: <WifiOff className="h-3 w-3" />, label: "Offline" },
  };

  const c = config[status] || config.disconnected;
  return (
    <Badge variant="outline" className={cn("gap-1 px-2 py-0.5 text-xs font-medium", c.color)}>
      {c.icon}
      {c.label}
    </Badge>
  );
}

// ─── Camera Live Stream Slot (Future) ───────────────────

function CameraLiveStream({ camera }: { camera: NonNullable<ReturnType<typeof useCameras>["selectedCamera"]> }) {
  return (
    <div className="relative aspect-video w-full overflow-hidden rounded-lg border bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Future Live Stream Placeholder */}
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
        {camera.streamUrl ? (
          <>
            {/* ─── FUTURE LIVE STREAM ──────────────────────
                 When a real stream is available, replace this placeholder with:
                 
                 Option A: HLS Stream (recommended)
                 <video className="h-full w-full object-cover" controls autoPlay muted>
                   <source src={camera.streamUrl} type="application/x-mpegURL" />
                 </video>
                 
                 Option B: WebRTC Stream
                 <video className="h-full w-full object-cover" ref={videoRef} autoPlay playsInline />
                 
                 Option C: MJPEG Stream
                 <img src={camera.streamUrl} className="h-full w-full object-cover" alt="Live feed" />
                 
                 Option D: RTSP (via transcoding proxy)
                 <video className="h-full w-full object-cover" controls autoPlay>
                   <source src={`/api/stream/proxy/${camera.id}`} type="application/x-mpegURL" />
                 </video>
            */}
            <Video className="h-12 w-12 text-slate-600" />
            <p className="text-sm font-medium text-slate-400">Stream URL Configured</p>
            <p className="text-xs text-slate-500">Integration pending — gateway not connected</p>
            <Badge variant="outline" className="mt-2 border-amber-500/30 bg-amber-500/10 text-amber-400">
              <Zap className="mr-1 h-3 w-3" />
              Ready for Stream Gateway
            </Badge>
          </>
        ) : (
          <>
            <Camera className="h-12 w-12 text-slate-600" />
            <p className="text-sm font-medium text-slate-400">No Stream Configured</p>
            <p className="text-xs text-slate-500">This camera has no stream URL assigned</p>
            <p className="mt-2 text-xs text-slate-600">
              To enable live view: add RTSP, HLS, or WebRTC URL to the camera configuration
            </p>
          </>
        )}
      </div>

      {/* Camera Overlay Info */}
      <div className="absolute left-2 top-2 flex items-center gap-2">
        <CameraStatusBadge status={camera.status} />
        <Badge variant="outline" className="border-white/10 bg-black/50 text-xs text-white">
          {camera.resolution || "N/A"}
        </Badge>
      </div>
      <div className="absolute bottom-2 left-2 flex items-center gap-1 text-xs text-white/60">
        <MapPin className="h-3 w-3" />
        {camera.latitude.toFixed(4)}, {camera.longitude.toFixed(4)}
      </div>
    </div>
  );
}

// ─── Camera Stats Cards ─────────────────────────────────

function CameraStats({ stats }: { stats: NonNullable<ReturnType<typeof useCameras>["stats"]> }) {
  const items = [
    { label: "Total Cameras", value: stats.total, icon: Camera, color: "text-blue-500" },
    { label: "Active", value: stats.active, icon: Monitor, color: "text-emerald-500" },
    { label: "Offline", value: stats.offline, icon: WifiOff, color: "text-slate-500" },
    { label: "Events (24h)", value: stats.eventsLast24h, icon: Activity, color: "text-amber-500" },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {items.map((item) => (
        <Card key={item.label} className="border-0 bg-white/50 shadow-sm backdrop-blur-sm dark:bg-slate-800/50">
          <CardContent className="flex items-center gap-3 p-4">
            <div className={cn("rounded-lg bg-white p-2 shadow-sm dark:bg-slate-700", item.color)}>
              <item.icon className="h-4 w-4" />
            </div>
            <div>
              <p className="text-lg font-bold">{item.value}</p>
              <p className="text-xs text-muted-foreground">{item.label}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// ─── Camera List Item ───────────────────────────────────

function CameraListItem({
  camera,
  isSelected,
  onSelect,
}: {
  camera: ReturnType<typeof useCameras>["cameras"][0];
  isSelected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      onClick={onSelect}
      className={cn(
        "flex w-full items-center gap-3 rounded-lg border p-3 text-left transition-all",
        "hover:border-blue-200 hover:bg-blue-50/50 dark:hover:border-blue-800 dark:hover:bg-blue-900/20",
        isSelected && "border-blue-300 bg-blue-50 shadow-sm dark:border-blue-700 dark:bg-blue-900/30"
      )}
    >
      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800">
        <Camera className="h-4 w-4 text-slate-600 dark:text-slate-400" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="truncate text-sm font-medium">{camera.name}</p>
        <p className="truncate text-xs text-muted-foreground">
          {camera.installationType.replace(/_/g, " ")}
          {camera.manufacturer && ` · ${camera.manufacturer}`}
        </p>
      </div>
      <CameraStatusBadge status={camera.status} />
    </button>
  );
}

// ─── Detection Alert Item ───────────────────────────────

function AlertItem({
  alert,
  onAcknowledge,
}: {
  alert: ReturnType<typeof useCameras>["alerts"][0];
  onAcknowledge: () => void;
}) {
  const severityColor = alert.confidence > 0.9
    ? "border-red-300 bg-red-50 dark:border-red-800 dark:bg-red-900/20"
    : alert.confidence > 0.7
    ? "border-amber-300 bg-amber-50 dark:border-amber-800 dark:bg-amber-900/20"
    : "border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/20";

  return (
    <div className={cn("flex items-start gap-3 rounded-lg border p-3", severityColor)}>
      <div className="mt-0.5">
        {alert.confidence > 0.9 ? (
          <AlertTriangle className="h-4 w-4 text-red-500" />
        ) : (
          <Activity className="h-4 w-4 text-amber-500" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium">{alert.eventType.replace(/_/g, " ")}</p>
        <p className="text-xs text-muted-foreground">
          {alert.cameraName}
          {alert.detectedPlate && ` · Plate: ${alert.detectedPlate}`}
          {alert.detectedSpeed && ` · ${alert.detectedSpeed} km/h`}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          Confidence: {Math.round(alert.confidence * 100)}%
        </p>
      </div>
      <Button
        variant="ghost"
        size="icon"
        className="h-6 w-6 shrink-0"
        onClick={onAcknowledge}
        title="Acknowledge"
      >
        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
      </Button>
    </div>
  );
}

// ─── Main CameraPanel Component ─────────────────────────

export function CameraPanel() {
  const {
    cameras, alerts, stats, loading, error,
    selectedCamera, selectCamera,
    refresh, acknowledgeAlert,
  } = useCameras();

  const [showAlerts, setShowAlerts] = useState(true);

  if (loading && cameras.length === 0) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-20 rounded-lg" />
          ))}
        </div>
        <Skeleton className="h-64 rounded-lg" />
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20">
        <CardContent className="flex items-center gap-3 p-4">
          <AlertTriangle className="h-5 w-5 text-red-500" />
          <div>
            <p className="text-sm font-medium text-red-600 dark:text-red-400">Failed to load cameras</p>
            <p className="text-xs text-red-500/70">{error}</p>
          </div>
          <Button variant="outline" size="sm" className="ml-auto" onClick={refresh}>
            <RefreshCw className="mr-1 h-3 w-3" /> Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Camera Infrastructure</h2>
          <p className="text-sm text-muted-foreground">
            {cameras.length} camera{cameras.length !== 1 ? "s" : ""} registered
            · {cameras.filter((c) => c.status === "streaming" || c.status === "connected").length} active
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={refresh}>
          <RefreshCw className="mr-1 h-3 w-3" /> Refresh
        </Button>
      </div>

      {/* Stats */}
      {stats && <CameraStats stats={stats} />}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Camera List */}
        <Card className="lg:col-span-1">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Camera className="h-4 w-4" />
              Cameras
              <Badge variant="secondary" className="ml-auto text-xs">
                {cameras.length}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-2">
            <ScrollArea className="h-[400px] pr-2">
              {cameras.length === 0 ? (
                <div className="flex flex-col items-center gap-2 py-8 text-center">
                  <Camera className="h-8 w-8 text-muted-foreground/50" />
                  <p className="text-sm text-muted-foreground">No cameras registered</p>
                  <p className="text-xs text-muted-foreground/70">
                    Register cameras to enable monitoring
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {cameras.map((camera) => (
                    <CameraListItem
                      key={camera.id}
                      camera={camera}
                      isSelected={selectedCamera?.id === camera.id}
                      onSelect={() => selectCamera(camera)}
                    />
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Camera Detail + Future Live Stream */}
        <Card className="lg:col-span-2">
          {selectedCamera ? (
            <>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2 text-sm">
                      <Video className="h-4 w-4 text-blue-500" />
                      {selectedCamera.name}
                    </CardTitle>
                    <CardDescription>
                      {selectedCamera.installationType.replace(/_/g, " ")}
                      {selectedCamera.manufacturer && ` · ${selectedCamera.manufacturer} ${selectedCamera.model || ""}`}
                    </CardDescription>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => selectCamera(null)}>
                    <XCircle className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Future Live Stream Display */}
                <CameraLiveStream camera={selectedCamera} />

                {/* Camera Details */}
                <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-3">
                  <div>
                    <p className="text-xs text-muted-foreground">Installation</p>
                    <p className="font-medium capitalize">
                      {selectedCamera.installationType.replace(/_/g, " ")}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Status</p>
                    <CameraStatusBadge status={selectedCamera.status} />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Resolution</p>
                    <p className="font-medium">{selectedCamera.resolution || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Orientation</p>
                    <p className="font-medium capitalize">{selectedCamera.orientation || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Location</p>
                    <p className="font-medium">
                      {selectedCamera.latitude.toFixed(4)}, {selectedCamera.longitude.toFixed(4)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Rxdy for Stream</p>
                    <Badge
                      variant="outline"
                      className={cn(
                        selectedCamera.streamUrl
                          ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-600"
                          : "border-slate-500/30 bg-slate-500/10 text-slate-600"
                      )}
                    >
                      {selectedCamera.streamUrl ? "Configured" : "Not Set"}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </>
          ) : (
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <Camera className="mb-3 h-12 w-12 text-muted-foreground/30" />
              <p className="text-sm font-medium text-muted-foreground">Select a Camera</p>
              <p className="mt-1 text-xs text-muted-foreground/70">
                Choose a camera from the list to view details and future live stream
              </p>
            </CardContent>
          )}
        </Card>
      </div>

      {/* Detection Alerts */}
      {alerts.length > 0 && (
        <Card>
          <CardHeader
            className="cursor-pointer pb-3"
            onClick={() => setShowAlerts(!showAlerts)}
          >
            <CardTitle className="flex items-center gap-2 text-sm">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              Pending Alerts
              <Badge variant="secondary" className="ml-auto text-xs">
                {alerts.length}
              </Badge>
              {showAlerts ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </CardTitle>
          </CardHeader>
          <AnimatePresence>
            {showAlerts && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <CardContent className="space-y-2 pt-0">
                  {alerts.slice(0, 10).map((alert) => (
                    <AlertItem
                      key={alert.id}
                      alert={alert}
                      onAcknowledge={() => acknowledgeAlert(alert.id)}
                    />
                  ))}
                  {alerts.length > 10 && (
                    <p className="text-center text-xs text-muted-foreground">
                      +{alerts.length - 10} more alerts
                    </p>
                  )}
                </CardContent>
              </motion.div>
            )}
          </AnimatePresence>
        </Card>
      )}
    </div>
  );
}
