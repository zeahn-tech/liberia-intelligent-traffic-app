import { useEffect, useRef, useState } from "react";
import { MapPin, Loader2 } from "lucide-react";

// Simplified map component using Leaflet
interface IncidentMarker {
  id: string;
  lat: number;
  lng: number;
  title: string;
  severity: "minor" | "moderate" | "serious" | "critical";
}

interface IncidentMapProps {
  markers?: IncidentMarker[];
  center?: [number, number];
  zoom?: number;
  height?: string;
  onMarkerClick?: (id: string) => void;
  interactive?: boolean;
}

export function IncidentMap({
  markers = [],
  center = [6.3156, -10.8074], // Monrovia, Liberia
  zoom = 10,
  height = "400px",
  onMarkerClick,
  interactive = true,
}: IncidentMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [leafletInstance, setLeafletInstance] = useState<any>(null);

  useEffect(() => {
    let map: any = null;
    let L: any = null;

    async function initMap() {
      try {
        L = await import("leaflet");

        // Fix default icon issue with Leaflet + bundlers
        delete (L.Icon.Default.prototype as any)._getIconUrl;
        L.Icon.Default.mergeOptions({
          iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
          iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
          shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
        });

        if (mapRef.current && !map) {
          map = L.map(mapRef.current, {
            center: center,
            zoom: zoom,
            zoomControl: interactive,
            dragging: interactive,
            scrollWheelZoom: interactive,
            attributionControl: true,
          });

          L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
            maxZoom: 19,
          }).addTo(map);

          // Add markers
          markers.forEach((marker) => {
            const markerColor =
              marker.severity === "critical" ? "#ef4444" :
              marker.severity === "serious" ? "#f59e0b" :
              marker.severity === "moderate" ? "#3b82f6" :
              "#22c55e";

            const icon = L.divIcon({
              className: "custom-marker",
              html: `<div style="
                width: 24px; height: 24px; background: ${markerColor};
                border: 3px solid white; border-radius: 50%;
                box-shadow: 0 2px 8px rgba(0,0,0,0.3);
                cursor: pointer;
              "></div>`,
              iconSize: [24, 24],
              iconAnchor: [12, 12],
            });

            const m = L.marker([marker.lat, marker.lng], { icon })
              .addTo(map)
              .bindPopup(`<div style="font-family: system-ui; padding: 4px;">
                <p style="font-weight: 600; margin: 0 0 4px;">${marker.title}</p>
                <p style="margin: 0; font-size: 12px; color: #666;">
                  Severity: <span style="color: ${markerColor};">${marker.severity}</span>
                </p>
              </div>`);

            if (onMarkerClick) {
              m.on("click", () => onMarkerClick(marker.id));
            }
          });

          setLeafletInstance(map);
          setMapLoaded(true);

          // Invalidate size after mounting
          setTimeout(() => map.invalidateSize(), 100);
        }
      } catch (err) {
        console.error("Failed to load map:", err);
        setMapLoaded(false);
      }
    }

    initMap();

    return () => {
      if (map) {
        map.remove();
      }
    };
  }, []);

  // Update markers when they change
  useEffect(() => {
    // For simplicity, we'll just show the map with initial markers
  }, [markers]);

  return (
    <div className="relative w-full" style={{ height }}>
      {!mapLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-secondary/30 rounded-xl">
          <div className="text-center space-y-2">
            <Loader2 className="w-6 h-6 animate-spin text-primary mx-auto" />
            <p className="text-sm text-muted-foreground">Loading map...</p>
          </div>
        </div>
      )}
      <div ref={mapRef} className="w-full h-full rounded-xl" style={{ zIndex: 0 }} />
    </div>
  );
}
