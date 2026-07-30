// ============================================================
// TrafficWatch AI — LicensePlateCard Component
// ============================================================
// Reusable license plate detection card for ANPR results,
// search results, and vehicle identification displays.
// ============================================================

import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { UserAvatar } from "@/components/UserAvatar";
import {
  Car,
  Camera,
  CheckCircle2,
  AlertTriangle,
  Search,
  ExternalLink,
  Shield,
  Clock,
  Repeat,
} from "lucide-react";

// ─── Types ──────────────────────────────────────────────

export interface PlateDetection {
  id: string;
  plateText: string;
  normalizedPlate: string;
  confidence: number;
  isVerified: boolean;
  officerVerified?: boolean;
  officerCorrectedText?: string;
  vehicleType?: string;
  vehicleColor?: string;
  vehicleMake?: string;
  vehicleModel?: string;
  officerName?: string;
  officerBadge?: string;
  scannedAt: string;
  boundingBox?: { x: number; y: number; width: number; height: number };
  /** Whether this plate is wanted/stolen */
  isWanted?: boolean;
  /** Repeat offender violation count */
  repeatCount?: number;
  /** Linked incident count */
  incidentCount?: number;
}

interface LicensePlateCardProps {
  detection: PlateDetection;
  /** Display variant */
  variant?: "card" | "compact" | "detail";
  /** Show action buttons */
  showActions?: boolean;
  /** Show zoom button */
  showExpand?: boolean;
  /** Callback to view plate history */
  onViewHistory?: (plate: string) => void;
  /** Callback to search incidents by plate */
  onSearchIncidents?: (plate: string) => void;
  /** Callback to verify/correct plate */
  onVerify?: (detection: PlateDetection) => void;
  /** Additional className */
  className?: string;
}

// ─── Component ──────────────────────────────────────────

export function LicensePlateCard({
  detection,
  variant = "card",
  showActions = true,
  showExpand = true,
  onViewHistory,
  onSearchIncidents,
  onVerify,
  className,
}: LicensePlateCardProps) {
  const confidenceColor =
    detection.confidence >= 90 ? "text-emerald-600 dark:text-emerald-400" :
    detection.confidence >= 75 ? "text-amber-600 dark:text-amber-400" :
    "text-red-600 dark:text-red-400";

  const confidenceBg =
    detection.confidence >= 90 ? "bg-emerald-500/10 border-emerald-500/20" :
    detection.confidence >= 75 ? "bg-amber-500/10 border-amber-500/20" :
    "bg-red-500/10 border-red-500/20";

  // Compact variant
  if (variant === "compact") {
    return (
      <div
        className={cn(
          "flex items-center gap-3 p-2.5 rounded-lg border border-border/50 hover:bg-secondary/30 transition-colors cursor-pointer group",
          className
        )}
        role="button"
        tabIndex={0}
      >
        <div className={cn(
          "w-10 h-10 rounded-lg flex items-center justify-center shrink-0 font-mono font-bold text-xs",
          detection.isVerified ? "bg-emerald-500/10 text-emerald-600" : "bg-amber-500/10 text-amber-600"
        )}>
          {detection.normalizedPlate.substring(0, 3)}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-mono font-bold">{detection.plateText}</p>
          <p className="text-[10px] text-muted-foreground flex items-center gap-1.5">
            <span>Confidence: {detection.confidence}%</span>
            {detection.vehicleType && <span>· {detection.vehicleType}</span>}
          </p>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {detection.isWanted && (
            <Badge variant="outline" className="text-[8px] px-1 py-0 h-3.5 bg-red-500/10 text-red-600 border-red-500/20">
              WANTED
            </Badge>
          )}
          {detection.officerVerified && (
            <CheckCircle2 className="w-3 h-3 text-emerald-500" />
          )}
          <ExternalLink className="w-3 h-3 text-muted-foreground/30 opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
      </div>
    );
  }

  // Detail variant
  if (variant === "detail") {
    return (
      <Card className={cn("border-border/50 overflow-hidden", className)}>
        <CardContent className="p-5">
          {/* Plate display with bounding box visualization */}
          <div className="flex items-center justify-center mb-5">
            <div className={cn(
              "relative w-48 h-20 rounded-xl flex items-center justify-center",
              detection.isWanted ? "bg-red-500/10 border-2 border-red-500/30" :
              detection.isVerified ? "bg-emerald-500/10 border-2 border-emerald-500/30" :
              "bg-secondary border-2 border-border/50"
            )}>
              <span className="text-2xl font-mono font-black tracking-[0.2em] text-foreground">
                {detection.plateText}
              </span>
              {detection.boundingBox && (
                <div
                  className="absolute border-2 border-primary/60 rounded bg-primary/5"
                  style={{
                    left: `${detection.boundingBox.x * 100}%`,
                    top: `${detection.boundingBox.y * 100}%`,
                    width: `${detection.boundingBox.width * 100}%`,
                    height: `${detection.boundingBox.height * 100}%`,
                  }}
                />
              )}
            </div>
          </div>

          {/* Confidence score */}
          <div className={cn("flex items-center gap-2 p-2.5 rounded-lg mb-4", confidenceBg)}>
            <div className={cn("flex-1")}>
              <div className="flex items-center justify-between mb-0.5">
                <span className="text-[10px] text-muted-foreground font-medium">Detection Confidence</span>
                <span className={cn("text-sm font-bold", confidenceColor)}>{detection.confidence}%</span>
              </div>
              <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                <div
                  className={cn(
                    "h-full rounded-full transition-all",
                    detection.confidence >= 90 ? "bg-emerald-500" :
                    detection.confidence >= 75 ? "bg-amber-500" : "bg-red-500"
                  )}
                  style={{ width: `${detection.confidence}%` }}
                />
              </div>
            </div>
          </div>

          {/* Verification status */}
          <div className="flex items-center gap-2 mb-4">
            {detection.officerVerified ? (
              <Badge variant="outline" className="gap-1 bg-emerald-500/10 text-emerald-600 border-emerald-500/20">
                <CheckCircle2 className="w-3 h-3" />
                Verified
              </Badge>
            ) : (
              <Badge variant="outline" className="gap-1 bg-amber-500/10 text-amber-600 border-amber-500/20">
                <AlertTriangle className="w-3 h-3" />
                Pending Verification
              </Badge>
            )}
            {detection.isWanted && (
              <Badge variant="outline" className="gap-1 bg-red-500/10 text-red-600 border-red-500/20">
                <AlertTriangle className="w-3 h-3" />
                WANTED / STOLEN
              </Badge>
            )}
            {detection.repeatCount && detection.repeatCount > 1 && (
              <Badge variant="outline" className="gap-1 bg-orange-500/10 text-orange-600 border-orange-500/20">
                <Repeat className="w-3 h-3" />
                {detection.repeatCount}x Offender
              </Badge>
            )}
          </div>

          {/* Details grid */}
          <div className="grid grid-cols-2 gap-y-2 gap-x-4 mb-4">
            {detection.normalizedPlate && (
              <div>
                <p className="text-[9px] text-muted-foreground uppercase tracking-wider">Normalized</p>
                <p className="text-xs font-mono">{detection.normalizedPlate}</p>
              </div>
            )}
            <div>
              <p className="text-[9px] text-muted-foreground uppercase tracking-wider">Scanned</p>
              <p className="text-xs">{new Date(detection.scannedAt).toLocaleString()}</p>
            </div>
            {detection.vehicleType && (
              <div>
                <p className="text-[9px] text-muted-foreground uppercase tracking-wider">Type</p>
                <p className="text-xs">{detection.vehicleType}</p>
              </div>
            )}
            {detection.vehicleColor && (
              <div>
                <p className="text-[9px] text-muted-foreground uppercase tracking-wider">Color</p>
                <p className="text-xs">{detection.vehicleColor}</p>
              </div>
            )}
          </div>

          {/* Actions */}
          {showActions && (
            <div className="flex gap-2 pt-3 border-t border-border/30">
              {onSearchIncidents && (
                <Button variant="outline" size="sm" className="h-7 text-[10px] rounded-lg" onClick={() => onSearchIncidents(detection.plateText)}>
                  <Search className="w-3 h-3 mr-1" />
                  Search Incidents
                </Button>
              )}
              {onViewHistory && (
                <Button variant="outline" size="sm" className="h-7 text-[10px] rounded-lg" onClick={() => onViewHistory(detection.plateText)}>
                  <Clock className="w-3 h-3 mr-1" />
                  History
                </Button>
              )}
              {!detection.officerVerified && onVerify && (
                <Button size="sm" className="h-7 text-[10px] rounded-lg" onClick={() => onVerify(detection)}>
                  <CheckCircle2 className="w-3 h-3 mr-1" />
                  Verify Plate
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  // Default: card variant
  return (
    <Card className={cn(
      "border-border/50 overflow-hidden transition-all hover:shadow-sm group cursor-pointer",
      detection.isWanted ? "border-red-500/30" :
      detection.officerVerified ? "border-emerald-500/20" : "",
      className
    )}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className={cn(
              "w-12 h-12 rounded-xl flex items-center justify-center shrink-0 font-mono font-bold text-lg tracking-wider",
              detection.isWanted ? "bg-red-500/10 text-red-600 border border-red-500/30" :
              detection.officerVerified ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/30" :
              "bg-secondary border border-border/50"
            )}>
              {detection.plateText.charAt(0)}
            </div>
            <div className="min-w-0">
              <p className="text-base font-mono font-black tracking-[0.15em]">{detection.plateText}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                Confidence: <span className={cn("font-semibold", confidenceColor)}>{detection.confidence}%</span>
                {detection.vehicleType && ` · ${detection.vehicleType}`}
              </p>
            </div>
          </div>
          <div className="flex gap-1 shrink-0">
            {detection.isWanted && (
              <Badge variant="outline" className="text-[8px] px-1 py-0 h-3.5 bg-red-500/10 text-red-600 border-red-500/20">
                STOLEN
              </Badge>
            )}
            {detection.officerVerified && (
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 mb-3">
          <div className={cn("flex-1 h-1.5 bg-secondary rounded-full overflow-hidden")}>
            <div
              className={cn("h-full rounded-full transition-all",
                detection.confidence >= 90 ? "bg-emerald-500" :
                detection.confidence >= 75 ? "bg-amber-500" : "bg-red-500"
              )}
              style={{ width: `${detection.confidence}%` }}
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-muted-foreground">
          {detection.vehicleColor && (
            <span className="flex items-center gap-1">
              <Car className="w-3 h-3" />
              {detection.vehicleColor}
            </span>
          )}
          {detection.vehicleMake && detection.vehicleModel && (
            <span>{detection.vehicleMake} {detection.vehicleModel}</span>
          )}
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {new Date(detection.scannedAt).toLocaleDateString()}
          </span>
          {detection.incidentCount && (
            <span className="flex items-center gap-1">
              <Shield className="w-3 h-3" />
              {detection.incidentCount} incidents
            </span>
          )}
        </div>

        {showActions && (
          <div className="flex items-center gap-2 pt-2.5 mt-2.5 border-t border-border/20">
            {onSearchIncidents && (
              <Button variant="ghost" size="sm" className="h-6 text-[10px] rounded-lg" onClick={() => onSearchIncidents(detection.plateText)}>
                <Search className="w-3 h-3 mr-1" />
                Find Incidents
              </Button>
            )}
            {onViewHistory && (
              <Button variant="ghost" size="sm" className="h-6 text-[10px] rounded-lg" onClick={() => onViewHistory(detection.plateText)}>
                <Clock className="w-3 h-3 mr-1" />
                History
              </Button>
            )}
            {!detection.officerVerified && onVerify && (
              <Button variant="ghost" size="sm" className="h-6 text-[10px] rounded-lg text-emerald-600 hover:text-emerald-700" onClick={() => onVerify(detection)}>
                <CheckCircle2 className="w-3 h-3 mr-1" />
                Verify
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
