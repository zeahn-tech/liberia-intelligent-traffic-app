/**
 * TrafficWatch AI — Interactive National Traffic Map
 *
 * Built with react-leaflet v5, Leaflet, and leaflet.markercluster.
 *
 * Features:
 * - Traffic incidents, accidents, checkpoints, cameras, stations,
 *   patrols, road closures, congestion, dangerous locations
 * - Marker clustering for performance
 * - Layer filtering / toggling
 * - Search by location or incident
 * - Geolocation (browser GPS)
 * - Incident detail panel
 * - Map/list synchronization
 * - Role-based access control (sensitive police info hidden from unauthorized)
 * - County boundaries (Liberia)
 * - Heat map (congestion density)
 */

import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import {
  MapContainer,
  TileLayer,
// eslint-disable-next-line @typescript-eslint/no-unused-vars
  Marker,
// eslint-disable-next-line @typescript-eslint/no-unused-vars
  Popup,
  useMap,
  useMapEvents,
// eslint-disable-next-line @typescript-eslint/no-unused-vars
  Circle,
// eslint-disable-next-line @typescript-eslint/no-unused-vars
  CircleMarker,
  GeoJSON,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";
import "leaflet.markercluster";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
// eslint-disable-next-line @typescript-eslint/no-unused-vars
  ScrollArea
} from "@/components/ui/scroll-area";
import { useAuth } from "@/hooks/use-auth";
import {
// eslint-disable-next-line @typescript-eslint/no-unused-vars
  MapPin,
// eslint-disable-next-line @typescript-eslint/no-unused-vars
  Navigation,
  Search,
// eslint-disable-next-line @typescript-eslint/no-unused-vars
  Layers,
// eslint-disable-next-line @typescript-eslint/no-unused-vars
  Car,
  AlertTriangle,
  Camera,
  Shield,
// eslint-disable-next-line @typescript-eslint/no-unused-vars
  Truck,
  X,
// eslint-disable-next-line @typescript-eslint/no-unused-vars
  CircleOff,
  Flame,
  Gauge,
  Crosshair,
  Loader2,
// eslint-disable-next-line @typescript-eslint/no-unused-vars
  ChevronRight,
  HeartPulse,
  Construction,
// eslint-disable-next-line @typescript-eslint/no-unused-vars
  Route,
  Users,
} from "lucide-react";

// ─── Fix Leaflet default icon ─────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

// ─── Types ─────────────────────────────────────────────────

export type MapLayerType =
  | "incidents"
  | "accidents"
  | "checkpoints"
  | "cameras"
  | "stations"
  | "patrols"
  | "closures"
  | "congestion"
  | "dangerous";

export interface MapPoint {
  id: string;
  lat: number;
  lng: number;
  title: string;
  subtitle?: string;
  type: MapLayerType;
  severity?: "minor" | "moderate" | "serious" | "critical";
  status?: string;
  time?: string;
  details?: Record<string, string>;
  sensitive?: boolean; // If true, only authorized roles can see details
}

export interface MapBounds {
  north: number;
  south: number;
  east: number;
  west: number;
}

export interface IncidentMapProps {
  incidents?: MapPoint[];
  center?: [number, number];
  zoom?: number;
  height?: string;
  className?: string;
  onMarkerClick?: (id: string, type: MapLayerType) => void;
  onBoundsChange?: (bounds: MapBounds) => void;
  showControls?: boolean;
  showSearch?: boolean;
  showLayerToggle?: boolean;
  showGeolocation?: boolean;
  interactive?: boolean;
  selectedIncidentId?: string | null;
}

// ─── Layer Config ──────────────────────────────────────────

interface LayerConfig {
  label: string;
  icon: React.ReactNode;
  color: string;
  fillColor: string;
  cluster: boolean;
}

const LAYER_CONFIG: Record<MapLayerType, LayerConfig> = {
  incidents: {
    label: "Traffic Incidents",
    icon: <AlertTriangle className="w-3.5 h-3.5" />,
    color: "#ef4444",
    fillColor: "#fca5a5",
    cluster: true,
  },
  accidents: {
    label: "Accidents",
    icon: <HeartPulse className="w-3.5 h-3.5" />,
    color: "#dc2626",
    fillColor: "#f87171",
    cluster: true,
  },
  checkpoints: {
    label: "Police Checkpoints",
    icon: <Shield className="w-3.5 h-3.5" />,
    color: "#2563eb",
    fillColor: "#93c5fd",
    cluster: false,
  },
  cameras: {
    label: "Traffic Cameras",
    icon: <Camera className="w-3.5 h-3.5" />,
    color: "#7c3aed",
    fillColor: "#c4b5fd",
    cluster: false,
  },
  stations: {
    label: "Police Stations",
    icon: <Shield className="w-3.5 h-3.5" />,
    color: "#059669",
    fillColor: "#6ee7b7",
    cluster: false,
  },
  patrols: {
    label: "Active Patrols",
    icon: <Users className="w-3.5 h-3.5" />,
    color: "#d97706",
    fillColor: "#fcd34d",
    cluster: false,
  },
  closures: {
    label: "Road Closures",
    icon: <Construction className="w-3.5 h-3.5" />,
    color: "#b91c1c",
    fillColor: "#fca5a5",
    cluster: false,
  },
  congestion: {
    label: "Congestion",
    icon: <Gauge className="w-3.5 h-3.5" />,
    color: "#ea580c",
    fillColor: "#fdba74",
    cluster: false,
  },
  dangerous: {
    label: "Dangerous Locations",
    icon: <Flame className="w-3.5 h-3.5" />,
    color: "#dc2626",
    fillColor: "#fca5a5",
    cluster: false,
  },
};

// ─── Custom Marker Icons ───────────────────────────────────

function createMarkerIcon(color: string, type: MapLayerType): L.DivIcon {
  const size = type === "incidents" || type === "accidents" ? 28 : 24;
  const borderWidth = type === "incidents" || type === "accidents" ? 3 : 2.5;
  return L.divIcon({
    className: "map-marker-icon",
    html: `<div style="
      width: ${size}px; height: ${size}px;
      background: ${color};
      border: ${borderWidth}px solid white;
      border-radius: 50%;
      box-shadow: 0 2px 8px rgba(0,0,0,0.3), 0 0 0 2px ${color}40;
      cursor: pointer;
      transition: transform 0.15s ease;
    "></div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

// ─── Cluster Icon Helper ───────────────────────────────────

function createClusterIcon(cluster: L.MarkerCluster): L.DivIcon {
  const count = cluster.getChildCount();
  let color = "#3b82f6";
  let bgColor = "#dbeafe";
  if (count >= 10) { color = "#ef4444"; bgColor = "#fee2e2"; }
  else if (count >= 5) { color = "#f59e0b"; bgColor = "#fef3c7"; }

  return L.divIcon({
    html: `<div style="
      width: 40px; height: 40px;
      background: ${bgColor};
      border: 2px solid ${color};
      border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      font-size: 12px; font-weight: 700; color: ${color};
      box-shadow: 0 2px 12px rgba(0,0,0,0.15);
    ">${count}</div>`,
    className: "map-cluster-icon",
    iconSize: L.point(40, 40),
  });
}

// ─── Liberia County Boundaries (simplified GeoJSON) ────────

const LIBERIA_COUNTIES = {
  type: "FeatureCollection",
  features: [
    { type: "Feature", properties: { name: "Montserrado" }, geometry: { type: "Polygon", coordinates: [[[-10.9, 6.1], [-10.5, 6.1], [-10.5, 6.6], [-10.9, 6.6], [-10.9, 6.1]]] } },
    { type: "Feature", properties: { name: "Margibi" }, geometry: { type: "Polygon", coordinates: [[[-10.5, 6.0], [-10.2, 6.0], [-10.2, 6.4], [-10.5, 6.4], [-10.5, 6.0]]] } },
    { type: "Feature", properties: { name: "Grand Bassa" }, geometry: { type: "Polygon", coordinates: [[[-10.2, 5.7], [-9.8, 5.7], [-9.8, 6.1], [-10.2, 6.1], [-10.2, 5.7]]] } },
    { type: "Feature", properties: { name: "Bong" }, geometry: { type: "Polygon", coordinates: [[[-10.0, 6.5], [-9.5, 6.5], [-9.5, 7.2], [-10.0, 7.2], [-10.0, 6.5]]] } },
    { type: "Feature", properties: { name: "Nimba" }, geometry: { type: "Polygon", coordinates: [[[-9.0, 6.3], [-8.5, 6.3], [-8.5, 7.5], [-9.0, 7.5], [-9.0, 6.3]]] } },
    { type: "Feature", properties: { name: "Lofa" }, geometry: { type: "Polygon", coordinates: [[[-10.2, 7.5], [-9.5, 7.5], [-9.5, 8.3], [-10.2, 8.3], [-10.2, 7.5]]] } },
  ],
};

// ─── Sample Liberia Map Data ──────────────────────────────

const SAMPLE_DATA: MapPoint[] = [
  // Incidents
  { id: "inc-001", lat: 6.3156, lng: -10.8074, title: "Speeding - LBR-4521", subtitle: "95 km/h in 50 zone", type: "incidents", severity: "serious", status: "under_review", time: "2 min ago", details: { Officer: "Sgt. Kollie", Location: "UN Drive, Monrovia" } },
  { id: "inc-002", lat: 6.3283, lng: -10.8123, title: "Red Light - LBR-7890", subtitle: "Broad & 12th St", type: "incidents", severity: "serious", status: "submitted", time: "15 min ago", details: { Officer: "Ofc. Tarplah", Location: "Broad Street" } },
  { id: "inc-003", lat: 6.2856, lng: -10.7224, title: "Illegal Parking - LBR-1123", subtitle: "Blocking emergency lane", type: "incidents", severity: "minor", status: "resolved", time: "1 hour ago", details: { Officer: "Sgt. Kollie", Location: "Market Junction" } },
  { id: "inc-004", lat: 7.0233, lng: -9.0504, title: "Dangerous Overtaking - LBR-5567", subtitle: "Forced oncoming to brake", type: "incidents", severity: "critical", status: "investigating", time: "2 hours ago", details: { Officer: "Ofc. Flomo", Location: "Ganta Highway" } },
  { id: "inc-005", lat: 6.3055, lng: -10.7955, title: "No Seat Belt - LBR-3342", subtitle: "Driver cited", type: "incidents", severity: "minor", status: "resolved", time: "3 hours ago", details: { Officer: "Ofc. Tarplah", Location: "Tubman Blvd" } },
  { id: "inc-006", lat: 5.8809, lng: -10.0504, title: "Overloaded Vehicle - LBR-2255", subtitle: "Exceeds weight limit", type: "incidents", severity: "moderate", status: "confirmed", time: "4 hours ago", details: { Officer: "Ofc. Flomo", Location: "Buchanan Highway" } },
  { id: "inc-007", lat: 6.3178, lng: -10.8021, title: "Running Red Light - LBR-9981", subtitle: "12th Street intersection", type: "incidents", severity: "serious", status: "draft", time: "5 hours ago", details: { Officer: "Sgt. Kollie", Location: "12th Street" } },
  { id: "inc-008", lat: 7.1038, lng: -9.4761, title: "Speeding - LBR-6712", subtitle: "Voinjama Highway", type: "incidents", severity: "moderate", status: "submitted", time: "30 min ago", details: { Officer: "Ofc. Kromah", Location: "Voinjama Highway" } },
  { id: "inc-009", lat: 5.5133, lng: -9.5822, title: "Reckless Driving - LBR-1234", subtitle: "Greenville area", type: "incidents", severity: "critical", status: "escalated", time: "1 hour ago", details: { Officer: "Ofc. Roberts", Location: "Greenville" } },
  { id: "inc-010", lat: 6.7541, lng: -10.0028, title: "Mobile Phone - LBR-9087", subtitle: "Gbarnga junction", type: "incidents", severity: "moderate", status: "under_review", time: "2 hours ago", details: { Officer: "Sgt. Sumo", Location: "Gbarnga Junction" } },
  // Accidents
  { id: "acc-001", lat: 6.3100, lng: -10.8050, title: "RTC - 2 vehicles", subtitle: "Minor injuries reported", type: "accidents", severity: "serious", time: "45 min ago" },
  { id: "acc-002", lat: 6.2950, lng: -10.7300, title: "Single vehicle collision", subtitle: "Driver transported", type: "accidents", severity: "serious", time: "2 hours ago" },
  // Checkpoints
  { id: "cp-001", lat: 6.3210, lng: -10.8150, title: "UN Drive Checkpoint", subtitle: "2 officers on duty", type: "checkpoints", details: { Unit: "Traffic Division", Status: "Active" } },
  { id: "cp-002", lat: 6.2800, lng: -10.7200, title: "Paynesville Checkpoint", subtitle: "Alcohol testing", type: "checkpoints", details: { Unit: "Highway Patrol", Status: "Active" } },
  { id: "cp-003", lat: 7.0300, lng: -9.0550, title: "Ganta Highway Checkpoint", subtitle: "24hr operation", type: "checkpoints" },
  // Cameras
  { id: "cam-001", lat: 6.3280, lng: -10.8100, title: "Broad & 12th", subtitle: "Traffic light camera", type: "cameras" },
  { id: "cam-002", lat: 6.3150, lng: -10.8000, title: "Tubman Blvd & UN Dr", subtitle: "Speed camera", type: "cameras" },
  { id: "cam-003", lat: 6.2900, lng: -10.7250, title: "Market Junction", subtitle: "Red light camera", type: "cameras" },
  // Stations
  { id: "stn-001", lat: 6.3150, lng: -10.8090, title: "Monrovia Central Police", subtitle: "Traffic Division HQ", type: "stations", details: { Phone: "+231 XXX XXX", Units: "Traffic, K9, Patrol" } },
  { id: "stn-002", lat: 6.2900, lng: -10.7150, title: "Paynesville Police Station", subtitle: "District 8", type: "stations" },
  { id: "stn-003", lat: 7.0100, lng: -9.0400, title: "Ganta Police Station", subtitle: "Nimba County", type: "stations" },
  // Patrols
  { id: "ptl-001", lat: 6.3200, lng: -10.8100, title: "Patrol Unit 3", subtitle: "UN Drive — heading South", type: "patrols", sensitive: true },
  { id: "ptl-002", lat: 6.3000, lng: -10.7900, title: "Patrol Unit 7", subtitle: "Tubman Blvd — stationary", type: "patrols", sensitive: true },
  // Closures
  { id: "clo-001", lat: 6.3080, lng: -10.8080, title: "UN Drive Closed", subtitle: "Road works — until 18:00", type: "closures" },
  { id: "clo-002", lat: 6.3250, lng: -10.8200, title: "Broad St Lane Closure", subtitle: "Utility maintenance", type: "closures" },
  // Congestion
  { id: "con-001", lat: 6.3120, lng: -10.8100, title: "Heavy Traffic", subtitle: "UN Drive — congestion", type: "congestion", severity: "serious" },
  { id: "con-002", lat: 6.3050, lng: -10.8000, title: "Moderate Traffic", subtitle: "Tubman Blvd", type: "congestion", severity: "moderate" },
  { id: "con-003", lat: 6.2950, lng: -10.7300, title: "Light Traffic", subtitle: "Paynesville", type: "congestion", severity: "minor" },
  // Dangerous
  { id: "dng-001", lat: 6.3100, lng: -10.8120, title: "High Accident Zone", subtitle: "UN Drive curve", type: "dangerous", severity: "critical" },
  { id: "dng-002", lat: 6.3300, lng: -10.8150, title: "Poor Lighting", subtitle: "Broad St intersection", type: "dangerous", severity: "serious" },
];

// ─── Sub-components ───────────────────────────────────────

/** Handles map events (bounds change, etc.) */
function MapEventsHandler({ onBoundsChange }: { onBoundsChange?: (bounds: MapBounds) => void }) {
  useMapEvents({
    moveend: (e) => {
      if (!onBoundsChange) return;
      const map = e.target;
      const b = map.getBounds();
      onBoundsChange({
        north: b.getNorth(),
        south: b.getSouth(),
        east: b.getEast(),
        west: b.getWest(),
      });
    },
  });
  return null;
}

/** Geolocation handler */
function GeolocateButton() {
  const map = useMap();
  const [locating, setLocating] = useState(false);

  const handleLocate = () => {
    if (!navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        map.setView([pos.coords.latitude, pos.coords.longitude], 15);
        L.circleMarker([pos.coords.latitude, pos.coords.longitude], {
          radius: 8,
          color: "#3b82f6",
          fillColor: "#60a5fa",
          fillOpacity: 0.6,
          weight: 2,
        }).addTo(map);
        setLocating(false);
      },
      () => setLocating(false),
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  return (
    <Button
      variant="outline"
      size="icon-sm"
      className="rounded-xl w-8 h-8 shadow-md"
      onClick={handleLocate}
      disabled={locating}
      title="Find my location"
    >
      {locating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Crosshair className="w-3.5 h-3.5" />}
    </Button>
  );
}

/** Marker layer renderer using marker clusters */
function MarkerLayers({
  points,
  activeLayers,
  userRole,
  onMarkerClick,
}: {
  points: MapPoint[];
  activeLayers: Set<MapLayerType>;
  userRole?: string;
  onMarkerClick?: (id: string, type: MapLayerType) => void;
}) {
  const map = useMap();
  const clusterGroupRef = useRef<L.MarkerClusterGroup | null>(null);
  const layerGroupsRef = useRef<Map<MapLayerType, L.LayerGroup>>(new Map());

  useEffect(() => {
    // Initialize cluster group
    if (!clusterGroupRef.current) {
      clusterGroupRef.current = L.markerClusterGroup({
        chunkedLoading: true,
        maxClusterRadius: 60,
        spiderfyOnMaxZoom: true,
        showCoverageOnHover: false,
        zoomToBoundsOnClick: true,
        iconCreateFunction: createClusterIcon,
      });
      map.addLayer(clusterGroupRef.current);
    }

    // Create layer groups for non-clustered layers
    const nonClusterTypes: MapLayerType[] = ["checkpoints", "cameras", "stations", "patrols", "closures", "congestion", "dangerous"];
    nonClusterTypes.forEach((type) => {
      if (!layerGroupsRef.current.has(type)) {
        const group = L.layerGroup().addTo(map);
        layerGroupsRef.current.set(type, group);
      }
    });

    return () => {
      if (clusterGroupRef.current) map.removeLayer(clusterGroupRef.current);
// eslint-disable-next-line react-hooks/exhaustive-deps
      layerGroupsRef.current.forEach((g) => map.removeLayer(g));
    };
  }, [map]);

  // Update markers when active layers or points change
  useEffect(() => {
    const clusterGroup = clusterGroupRef.current;
    if (!clusterGroup) return;

    // Clear all layers
    clusterGroup.clearLayers();
    layerGroupsRef.current.forEach((g) => g.clearLayers());

    // Filter by active layers and user role
    const filtered = points.filter((p) => {
      if (!activeLayers.has(p.type)) return false;
      // Hide sensitive data from unauthorized roles
      if (p.sensitive && !userRole) return false;
      if (p.sensitive && !["officer", "supervisor", "admin", "investigator"].includes(userRole || "")) return false;
      return true;
    });

    const clusterMarkers: L.Marker[] = [];
    const clusterTypes: MapLayerType[] = ["incidents", "accidents"];

    filtered.forEach((point) => {
      const config = LAYER_CONFIG[point.type];
      const icon = createMarkerIcon(config.color, point.type);
      const marker = L.marker([point.lat, point.lng], { icon });

      // Popup content
      const severityColor = point.severity === "critical" ? "#ef4444" :
        point.severity === "serious" ? "#f59e0b" :
        point.severity === "moderate" ? "#3b82f6" : "#22c55e";

      let popupHtml = `<div style="font-family: system-ui; min-width: 200px;">`;
      popupHtml += `<div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;">`;
      popupHtml += `<div style="width:10px;height:10px;border-radius:50%;background:${config.color};"></div>`;
      popupHtml += `<strong style="font-size:13px;">${point.title}</strong></div>`;
      if (point.subtitle) popupHtml += `<p style="margin:0 0 4px;font-size:12px;color:#666;">${point.subtitle}</p>`;
      if (point.severity) popupHtml += `<p style="margin:0 0 4px;font-size:11px;">Severity: <span style="color:${severityColor};font-weight:600;">${point.severity}</span></p>`;
      if (point.status) popupHtml += `<p style="margin:0 0 4px;font-size:11px;color:#888;">Status: ${point.status}</p>`;
      if (point.time) popupHtml += `<p style="margin:0 0 4px;font-size:11px;color:#888;">${point.time}</p>`;
      if (point.details) {
        Object.entries(point.details).forEach(([k, v]) => {
          popupHtml += `<p style="margin:0 0 2px;font-size:11px;"><strong>${k}:</strong> ${v}</p>`;
        });
      }
      if (onMarkerClick) {
        popupHtml += `<button onclick="parent.postMessage('marker-click:${point.id}:${point.type}','*')" style="margin-top:6px;padding:4px 12px;background:#3b82f6;color:white;border:none;border-radius:6px;font-size:11px;cursor:pointer;">View Details</button>`;
      }
      popupHtml += `</div>`;
      marker.bindPopup(popupHtml);

      if (onMarkerClick) {
        marker.on("click", () => onMarkerClick(point.id, point.type));
      }

      if (clusterTypes.includes(point.type)) {
        clusterMarkers.push(marker);
      } else {
        const group = layerGroupsRef.current.get(point.type);
        if (group) group.addLayer(marker);
      }
    });

    if (clusterMarkers.length > 0) {
      clusterGroup.addLayers(clusterMarkers);
    }
  }, [points, activeLayers, userRole, onMarkerClick]);

  return null;
}

/** Heat map circles for congestion */
function CongestionLayer({ points, visible }: { points: MapPoint[]; visible: boolean }) {
  const map = useMap();
  const layerRef = useRef<L.LayerGroup | null>(null);

  useEffect(() => {
    if (!layerRef.current) {
      layerRef.current = L.layerGroup().addTo(map);
    }
    return () => {
      if (layerRef.current) map.removeLayer(layerRef.current);
    };
  }, [map]);

  useEffect(() => {
    const layer = layerRef.current;
    if (!layer) return;
    layer.clearLayers();

    if (!visible) return;

    const congestionPts = points.filter((p) => p.type === "congestion");
    congestionPts.forEach((pt) => {
      const radius = pt.severity === "serious" ? 300 : pt.severity === "moderate" ? 200 : 100;
      const opacity = pt.severity === "serious" ? 0.3 : pt.severity === "moderate" ? 0.2 : 0.1;
      const color = pt.severity === "serious" ? "#ef4444" : pt.severity === "moderate" ? "#f59e0b" : "#22c55e";

      L.circle([pt.lat, pt.lng], {
        radius,
        color,
        fillColor: color,
        fillOpacity: opacity,
        weight: 1,
        opacity: 0.5,
      }).addTo(layer);
    });
  }, [points, visible]);

  return null;
}

// ─── Main Component ────────────────────────────────────────

export function IncidentMap({
  incidents = SAMPLE_DATA,
  center = [6.3156, -10.8074],
  zoom = 10,
  height = "500px",
  className = "",
  onMarkerClick,
  onBoundsChange,
  showControls = true,
  showSearch = true,
  showLayerToggle = true,
  showGeolocation = true,
  interactive = true,
// eslint-disable-next-line @typescript-eslint/no-unused-vars
  selectedIncidentId,
}: IncidentMapProps) {
  const { user } = useAuth();
  const userRole = user?.profile?.role;
  const [activeLayers, setActiveLayers] = useState<Set<MapLayerType>>(
    new Set(["incidents", "checkpoints", "stations"]),
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<MapPoint[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [showPanel, setShowPanel] = useState(false);
  const [selectedPoint, setSelectedPoint] = useState<MapPoint | null>(null);
  const [mapReady, setMapReady] = useState(false);

  const toggleLayer = useCallback((layer: MapLayerType) => {
    setActiveLayers((prev) => {
      const next = new Set(prev);
      if (next.has(layer)) next.delete(layer);
      else next.add(layer);
      return next;
    });
  }, []);

  // Search handler
  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
    if (!query.trim()) {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }
    const q = query.toLowerCase();
    const results = incidents.filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        p.subtitle?.toLowerCase().includes(q) ||
        p.type.toLowerCase().includes(q) ||
        p.details &&
          Object.values(p.details).some((v) => v?.toLowerCase().includes(q)),
    );
    setSearchResults(results.slice(0, 10));
    setShowSearchResults(true);
  }, [incidents]);

  // Handle marker click from popup
  useEffect(() => {
    const handler = (e: MessageEvent) => {
      if (typeof e.data === "string" && e.data.startsWith("marker-click:")) {
        const [, id, type] = e.data.split(":");
        if (onMarkerClick) onMarkerClick(id, type as MapLayerType);
        setShowPanel(false);
      }
    };
    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, [onMarkerClick]);

  const handleMarkerClick = useCallback((id: string, type: MapLayerType) => {
    const point = incidents.find((p) => p.id === id);
    if (point) {
      setSelectedPoint(point);
      setShowPanel(true);
    }
    if (onMarkerClick) onMarkerClick(id, type);
  }, [incidents, onMarkerClick]);

  // Get count for each layer type
  const layerCounts = useMemo(() => {
    const counts: Partial<Record<MapLayerType, number>> = {};
    incidents.forEach((p) => {
      counts[p.type] = (counts[p.type] || 0) + 1;
    });
    return counts;
  }, [incidents]);

  // Filtered data
  const filteredData = useMemo(() => {
    return incidents.filter((p) => activeLayers.has(p.type));
  }, [incidents, activeLayers]);

  return (
    <div className={`relative ${className}`} style={{ height }}>
      {/* Map Container */}
      <MapContainer
        center={center}
        zoom={zoom}
        className="w-full h-full rounded-xl z-0"
        zoomControl={interactive}
        dragging={interactive}
        scrollWheelZoom={interactive}
        doubleClickZoom={interactive}
        whenReady={() => setMapReady(true)}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          maxZoom={19}
        />

        {/* County boundaries */}
        <GeoJSON
// eslint-disable-next-line @typescript-eslint/no-explicit-any
          data={LIBERIA_COUNTIES as any}
          style={{
            color: "#6b7280",
            weight: 1.5,
            opacity: 0.5,
            fillOpacity: 0.05,
          }}
          onEachFeature={(feature, layer) => {
            layer.bindTooltip(feature.properties.name, {
              permanent: false,
              direction: "center",
              className: "county-tooltip",
            });
          }}
        />

        {/* Event handler */}
        <MapEventsHandler onBoundsChange={onBoundsChange} />

        {/* Marker layers */}
        <MarkerLayers
          points={incidents}
          activeLayers={activeLayers}
          userRole={userRole}
          onMarkerClick={handleMarkerClick}
        />

        {/* Congestion heat circles */}
        <CongestionLayer points={incidents} visible={activeLayers.has("congestion")} />

        {/* Geolocation button inside the map context */}
        {showGeolocation && (
          <div className="leaflet-top leaflet-left" style={{ marginTop: "52px" }}>
            <div className="leaflet-control leaflet-bar">
              <GeolocateButton />
            </div>
          </div>
        )}
      </MapContainer>

      {/* ── Top-left controls ── */}
      {showControls && (
        <div className="absolute top-3 left-3 z-[1000] flex flex-col gap-2">
          {/* Search */}
          {showSearch && (
            <div className="relative">
              <div className="flex items-center bg-card/95 backdrop-blur-sm rounded-xl shadow-md border border-border/50 overflow-hidden w-64">
                <Search className="w-3.5 h-3.5 text-muted-foreground ml-3 shrink-0" />
                <Input
                  placeholder="Search incidents, locations..."
                  className="border-0 bg-transparent h-9 text-xs focus-visible:ring-0"
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  onFocus={() => searchResults.length > 0 && setShowSearchResults(true)}
                />
                {searchQuery && (
                  <Button variant="ghost" size="icon-sm" className="h-7 w-7 mr-1" onClick={() => { setSearchQuery(""); setSearchResults([]); setShowSearchResults(false); }}>
                    <X className="w-3 h-3" />
                  </Button>
                )}
              </div>
              {/* Search results dropdown */}
              {showSearchResults && searchResults.length > 0 && (
                <Card className="absolute top-full mt-1 w-64 rounded-xl shadow-lg border-border/50 max-h-60 overflow-y-auto">
                  <CardContent className="p-1">
                    {searchResults.map((result) => (
                      <button
                        key={result.id}
                        className="w-full text-left px-3 py-2 text-xs hover:bg-secondary/50 rounded-lg transition-colors flex items-center gap-2"
                        onClick={() => {
                          handleMarkerClick(result.id, result.type);
                          setShowSearchResults(false);
                          setSearchQuery("");
                        }}
                      >
                        <div className="w-2 h-2 rounded-full shrink-0" style={{ background: LAYER_CONFIG[result.type].color }} />
                        <span className="font-medium truncate">{result.title}</span>
                      </button>
                    ))}
                  </CardContent>
                </Card>
              )}
            </div>
          )}

        </div>
      )}

      {/* ── Right layer toggle panel ── */}
      {showLayerToggle && (
        <div className="absolute top-3 right-3 z-[1000]">
          <Card className="rounded-xl shadow-md border-border/50 bg-card/95 backdrop-blur-sm w-44">
            <CardContent className="p-2 space-y-0.5">
              <p className="text-[10px] font-medium text-muted-foreground px-2 py-1 uppercase tracking-wider">
                Map Layers
              </p>
              {(Object.keys(LAYER_CONFIG) as MapLayerType[]).map((layer) => {
                const config = LAYER_CONFIG[layer];
                const count = layerCounts[layer] || 0;
                const isActive = activeLayers.has(layer);

                // Hide sensitive layers from unauthorized roles
                if (layer === "patrols" && !["officer", "supervisor", "admin", "investigator"].includes(userRole || "")) {
                  return null;
                }

                return (
                  <button
                    key={layer}
                    className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs transition-all ${
                      isActive ? "bg-secondary/80 text-foreground" : "text-muted-foreground hover:bg-secondary/40"
                    }`}
                    onClick={() => toggleLayer(layer)}
                  >
                    <div className="flex items-center justify-center w-4 h-4">
                      <div
                        className={`w-3.5 h-3.5 rounded-sm border transition-all ${
                          isActive ? "border-transparent" : "border-muted-foreground/30"
                        }`}
                        style={isActive ? { background: config.color } : {}}
                      />
                    </div>
                    <span className="flex-1">{config.label}</span>
                    {count > 0 && (
                      <span className={`text-[10px] font-mono ${isActive ? "text-foreground/70" : "text-muted-foreground/50"}`}>
                        {count}
                      </span>
                    )}
                  </button>
                );
              })}
            </CardContent>
          </Card>
        </div>
      )}

      {/* ── Bottom detail panel ── */}
      {showPanel && selectedPoint && (
        <div className="absolute bottom-3 left-3 right-3 z-[1000]">
          <Card className="rounded-xl shadow-lg border-border/50 bg-card/95 backdrop-blur-sm">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: `${LAYER_CONFIG[selectedPoint.type].color}15` }}
                >
                  <div
                    className="w-4 h-4 rounded-full"
                    style={{ background: LAYER_CONFIG[selectedPoint.type].color }}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold">{selectedPoint.title}</p>
                      {selectedPoint.subtitle && (
                        <p className="text-xs text-muted-foreground">{selectedPoint.subtitle}</p>
                      )}
                    </div>
                    <Button variant="ghost" size="icon-sm" className="h-6 w-6 shrink-0" onClick={() => setShowPanel(false)}>
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-2">
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 clay-pill">
                      {LAYER_CONFIG[selectedPoint.type].label}
                    </Badge>
                    {selectedPoint.severity && (
                      <Badge
                        variant="outline"
                        className="text-[10px] px-1.5 py-0 h-4 clay-pill"
                        style={{
                          background: selectedPoint.severity === "critical" ? "#ef444410" :
                            selectedPoint.severity === "serious" ? "#f59e0b10" :
                            selectedPoint.severity === "moderate" ? "#3b82f610" : "#22c55e10",
                          color: selectedPoint.severity === "critical" ? "#ef4444" :
                            selectedPoint.severity === "serious" ? "#f59e0b" :
                            selectedPoint.severity === "moderate" ? "#3b82f6" : "#22c55e",
                          borderColor: selectedPoint.severity === "critical" ? "#ef444430" :
                            selectedPoint.severity === "serious" ? "#f59e0b30" :
                            selectedPoint.severity === "moderate" ? "#3b82f630" : "#22c55e30",
                        }}
                      >
                        {selectedPoint.severity}
                      </Badge>
                    )}
                    {selectedPoint.status && (
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 clay-pill text-muted-foreground">
                        {selectedPoint.status}
                      </Badge>
                    )}
                    {selectedPoint.time && (
                      <span className="text-[10px] text-muted-foreground self-center">{selectedPoint.time}</span>
                    )}
                  </div>
                  {selectedPoint.details && (
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1 mt-2">
                      {Object.entries(selectedPoint.details).map(([k, v]) => (
                        <div key={k} className="text-[10px]">
                          <span className="text-muted-foreground">{k}:</span>{" "}
                          <span className="font-medium">{v}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ── Loading state ── */}
      {!mapReady && (
        <div className="absolute inset-0 flex items-center justify-center bg-secondary/30 rounded-xl z-[500]">
          <div className="text-center space-y-2">
            <Loader2 className="w-6 h-6 animate-spin text-primary mx-auto" />
            <p className="text-sm text-muted-foreground">Loading map...</p>
          </div>
        </div>
      )}
    </div>
  );
}
