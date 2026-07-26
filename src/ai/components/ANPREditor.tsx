import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ConfidenceBar } from "./ConfidenceBar";
import { cn } from "@/lib/utils";
import {
  CheckCircle2,
  XCircle,
  Edit3,
  Camera,
  Search,
  AlertTriangle,
  Shield,
  History,
} from "lucide-react";
import { normalizePlateText } from "@/ai/anpr/normalization";

import type { LicensePlateResult } from "../types";
import type { ANPRScanRecord } from "../anpr/types";

interface ANPREditorProps {
  plateResult: LicensePlateResult | null;
  recentScans?: ANPRScanRecord[];
  onVerify: (corrected: string) => void;
  onReject: () => void;
  className?: string;
}

export function ANPREditor({
  plateResult,
  recentScans = [],
  onVerify,
  onReject,
  className,
}: ANPREditorProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedText, setEditedText] = useState(
    plateResult?.normalizedPlate || ""
  );
  const [showHistory, setShowHistory] = useState(false);

  if (!plateResult) {
    return (
      <Card className={cn("clay-card !rounded-2xl", className)}>
        <CardContent className="p-6 text-center">
          <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center mx-auto mb-3">
            <Camera className="w-6 h-6 text-muted-foreground" />
          </div>
          <p className="text-sm text-muted-foreground">
            No license plate detected
          </p>
        </CardContent>
      </Card>
    );
  }

  const handleVerify = () => {
    onVerify(editedText);
    setIsEditing(false);
  };

  const handleCorrect = () => {
    const normalized = normalizePlateText(editedText);
    setEditedText(normalized);
  };

  const isHighConfidence = plateResult.confidence >= 0.9;
  const isMediumConfidence =
    plateResult.confidence >= 0.7 && plateResult.confidence < 0.9;

  return (
    <Card className={cn("clay-card !rounded-2xl overflow-hidden", className)}>
      {/* Header */}
      <CardHeader
        className={cn(
          "pb-3 border-b border-border/50",
          isHighConfidence
            ? "bg-gradient-to-r from-success/5 to-transparent"
            : isMediumConfidence
            ? "bg-gradient-to-r from-warning/5 to-transparent"
            : "bg-gradient-to-r from-destructive/5 to-transparent"
        )}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
              <Shield className="w-4 h-4 text-primary" />
            </div>
            <div>
              <CardTitle className="text-sm">License Plate Detection</CardTitle>
              <CardDescription>ANPR Engine</CardDescription>
            </div>
          </div>
          <Badge
            variant="outline"
            className={cn(
              "clay-pill text-xs px-2 py-0 h-5",
              isHighConfidence && "bg-success/10 text-success border-success/20",
              isMediumConfidence && "bg-warning/10 text-warning border-warning/20",
              !isHighConfidence && !isMediumConfidence && "bg-destructive/10 text-destructive border-destructive/20"
            )}
          >
            {Math.round(plateResult.confidence * 100)}%
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="p-4 space-y-4">
        {/* Plate display */}
        <div className="relative">
          <div className="bg-foreground/5 rounded-xl p-4 text-center">
            {isEditing ? (
              <div className="flex items-center gap-2">
                <Input
                  value={editedText}
                  onChange={(e) => setEditedText(e.target.value.toUpperCase())}
                  className="text-center text-lg font-bold tracking-widest clay-inset"
                  placeholder="Enter plate number"
                  autoFocus
                />
                <Button
                  size="sm"
                  variant="outline"
                  className="rounded-xl"
                  onClick={handleCorrect}
                >
                  <Edit3 className="w-3.5 h-3.5" />
                </Button>
              </div>
            ) : (
              <div className="space-y-1">
                <p className="text-2xl font-bold tracking-[0.2em]">
                  {plateResult.normalizedPlate}
                </p>
                <p className="text-xs text-muted-foreground">
                  {isHighConfidence
                    ? "High confidence match"
                    : isMediumConfidence
                    ? "Medium confidence - review recommended"
                    : "Low confidence - manual verification required"}
                </p>
              </div>
            )}
          </div>

          {/* Bounding box indicator */}
          {plateResult.boundingBox && (
            <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
              <div className="w-3 h-3 border border-muted-foreground/50 rounded" />
              Plate region detected in image
            </div>
          )}
        </div>

        {/* Confidence bar */}
        <ConfidenceBar score={plateResult.confidence} size="sm" />

        {/* Verification status */}
        {plateResult.isVerifiedByOfficer && (
          <div className="flex items-center gap-2 p-2 rounded-lg bg-success/5 text-success text-xs">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Verified by officer
            {plateResult.officerCorrectedText &&
              plateResult.officerCorrectedText !== plateResult.normalizedPlate && (
                <span>
                  (corrected from {plateResult.normalizedPlate})
                </span>
              )}
          </div>
        )}

        {/* Action buttons */}
        <div className="flex gap-2">
          <Button
            size="sm"
            className={cn(
              "flex-1 rounded-xl",
              "bg-success hover:bg-success/90 text-white"
            )}
            onClick={handleVerify}
          >
            <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
            {isEditing ? "Save & Verify" : "Verify Plate"}
          </Button>
          {!isEditing && (
            <>
              <Button
                size="sm"
                variant="outline"
                className="rounded-xl"
                onClick={() => {
                  setEditedText(plateResult.normalizedPlate);
                  setIsEditing(true);
                }}
              >
                <Edit3 className="w-3.5 h-3.5" />
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="rounded-xl border-destructive/30 text-destructive hover:bg-destructive/10"
                onClick={onReject}
              >
                <XCircle className="w-3.5 h-3.5" />
              </Button>
            </>
          )}
        </div>

        {/* Recent scans for same plate */}
        {recentScans.length > 0 && (
          <>
            <Button
              variant="ghost"
              size="sm"
              className="w-full rounded-xl text-xs text-muted-foreground justify-start"
              onClick={() => setShowHistory(!showHistory)}
            >
              <History className="w-3.5 h-3.5 mr-1" />
              {recentScans.length} previous scan{recentScans.length !== 1 ? "s" : ""} for this plate
            </Button>

            {showHistory && (
              <div className="space-y-1.5">
                {recentScans.map((scan, idx) => (
                  <div
                    key={scan.id || idx}
                    className="flex items-center justify-between p-2 rounded-lg bg-secondary/20 text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <Search className="w-3 h-3 text-muted-foreground" />
                      <span>{scan.incidentId}</span>
                    </div>
                    <span className="text-muted-foreground">
                      {new Date(scan.scannedAt).toLocaleDateString()}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
