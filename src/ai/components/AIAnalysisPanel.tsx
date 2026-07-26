import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ConfidenceBar } from "./ConfidenceBar";
import { ViolationSummary } from "./ViolationSummary";
import { ANPREditor } from "./ANPREditor";
import { cn } from "@/lib/utils";
import {
  Brain,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Car,
  ScanLine,
  Box,
  FileText,
  ThumbsUp,
  ThumbsDown,
  RotateCcw,
  Loader2,
} from "lucide-react";
import type { AIAnalysisResult, ViolationDetection } from "../types";
import type { ANPRScanRecord } from "../anpr/types";

interface AIAnalysisPanelProps {
  analysis: AIAnalysisResult | null;
  isLoading?: boolean;
  recentScans?: ANPRScanRecord[];
  officerId?: string;
  onConfirm: (notes?: string) => void;
  onReject: (notes?: string, correctedPlate?: string) => void;
  onReanalyze?: () => void;
  className?: string;
  readonly?: boolean;
}

export function AIAnalysisPanel({
  analysis,
  isLoading,
  recentScans = [],
  officerId,
  onConfirm,
  onReject,
  onReanalyze,
  className,
  readonly = false,
}: AIAnalysisPanelProps) {
  const [activeTab, setActiveTab] = useState("violations");
  const [officerNotes, setOfficerNotes] = useState("");
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  if (isLoading) {
    return (
      <Card className={cn("clay-card !rounded-2xl", className)}>
        <CardContent className="p-8 text-center space-y-3">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto animate-pulse">
            <Brain className="w-6 h-6 text-primary" />
          </div>
          <Loader2 className="w-5 h-5 animate-spin mx-auto text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Running AI analysis...</p>
        </CardContent>
      </Card>
    );
  }

  if (!analysis) {
    return (
      <Card className={cn("clay-card !rounded-2xl", className)}>
        <CardContent className="p-6 text-center space-y-3">
          <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center mx-auto">
            <Brain className="w-6 h-6 text-muted-foreground" />
          </div>
          <p className="text-sm text-muted-foreground">
            No AI analysis available. Upload evidence to begin analysis.
          </p>
        </CardContent>
      </Card>
    );
  }

  const handleConfirm = async () => {
    setIsProcessing(true);
    try {
      await onConfirm(officerNotes);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async (correctedPlate?: string) => {
    setIsProcessing(true);
    try {
      await onReject(officerNotes, correctedPlate);
    } finally {
      setIsProcessing(false);
      setShowRejectForm(false);
    }
  };

  const hasViolations = analysis.violations.length > 0;
  const hasPlate = !!analysis.licensePlate;
  const hasObjects = analysis.detectedObjects.length > 0;

  const getStatusColor = () => {
    if (analysis.status === "failed") return "ring-2 ring-destructive/20";
    if (analysis.overallConfidence >= 0.9) return "ring-2 ring-success/20";
    if (analysis.overallConfidence >= 0.7) return "ring-2 ring-warning/20";
    return "";
  };

  return (
    <Card className={cn("clay-card !rounded-2xl overflow-hidden", getStatusColor(), className)}>
      {/* Header */}
      <CardHeader className="pb-3 border-b border-border/50 bg-gradient-to-r from-primary/5 via-accent/5 to-primary/5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Brain className="w-5 h-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-base">AI Analysis Results</CardTitle>
              <CardDescription>
                {analysis.providerName} · {new Date(analysis.timestamps.processingCompleted || analysis.timestamps.submitted).toLocaleString()}
              </CardDescription>
            </div>
          </div>
          <Badge
            variant="outline"
            className={cn(
              "clay-pill text-xs px-3 py-0.5 h-6",
              analysis.status === "completed" && "bg-success/10 text-success border-success/20",
              analysis.status === "failed" && "bg-destructive/10 text-destructive border-destructive/20",
              analysis.status === "processing" && "bg-warning/10 text-warning border-warning/20"
            )}
          >
            {analysis.status === "completed" && `${Math.round(analysis.overallConfidence * 100)}% confidence`}
            {analysis.status === "failed" && "Analysis failed"}
            {analysis.status === "processing" && "Processing..."}
            {analysis.status === "pending" && "Pending"}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <div className="px-4 pt-3">
            <TabsList className="grid grid-cols-3 rounded-xl p-1 bg-secondary w-full">
              <TabsTrigger value="violations" className="rounded-lg text-xs">
                <AlertTriangle className="w-3.5 h-3.5 mr-1" />
                Violations
              </TabsTrigger>
              <TabsTrigger value="plate" className="rounded-lg text-xs">
                <ScanLine className="w-3.5 h-3.5 mr-1" />
                Plate
              </TabsTrigger>
              <TabsTrigger value="objects" className="rounded-lg text-xs">
                <Box className="w-3.5 h-3.5 mr-1" />
                Objects
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Violations tab */}
          <TabsContent value="violations" className="p-4 space-y-3 mt-0">
            {!hasViolations ? (
              <div className="text-center py-6">
                <div className="w-10 h-10 rounded-xl bg-success/10 flex items-center justify-center mx-auto mb-2">
                  <ThumbsUp className="w-5 h-5 text-success" />
                </div>
                <p className="text-sm font-medium">No violations detected</p>
                <p className="text-xs text-muted-foreground mt-1">
                  The AI did not identify any traffic violations in the evidence.
                </p>
              </div>
            ) : (
              <ViolationSummary violations={analysis.violations} />
            )}

            {analysis.detectedObjects.some(
              (o) =>
                o.label.toLowerCase().includes("speed") ||
                o.label.toLowerCase().includes("traffic") ||
                o.label.toLowerCase().includes("sign")
            ) && (
              <div className="flex items-center gap-2 p-2 rounded-lg bg-secondary/20 text-xs text-muted-foreground">
                <AlertTriangle className="w-3 h-3" />
                AI results require officer review before final determination
              </div>
            )}
          </TabsContent>

          {/* Plate tab */}
          <TabsContent value="plate" className="p-4 space-y-3 mt-0">
            <ANPREditor
              plateResult={
                hasPlate
                  ? {
                      plateText: analysis.licensePlate!.plateText,
                      normalizedPlate: analysis.licensePlate!.normalizedPlate,
                      confidence: analysis.licensePlate!.confidence,
                      boundingBox: analysis.licensePlate!.boundingBox,
                      isVerifiedByOfficer: analysis.licensePlate!.isVerifiedByOfficer,
                      officerCorrectedText: analysis.licensePlate!.officerCorrectedText,
                    }
                  : null
              }
              recentScans={recentScans}
              onVerify={(corrected) => onConfirm(`Plate verified: ${corrected}`)}
              onReject={() => {}}
            />
          </TabsContent>

          {/* Objects tab */}
          <TabsContent value="objects" className="p-4 space-y-2 mt-0">
            {!hasObjects ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No objects detected
              </p>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {analysis.detectedObjects.map((obj, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-2 rounded-lg bg-secondary/20 text-xs"
                  >
                    <span>{obj.label}</span>
                    <Badge
                      variant="outline"
                      className={cn(
                        "clay-pill text-[10px] px-1.5 h-4",
                        obj.confidence >= 0.9
                          ? "bg-success/10 text-success"
                          : obj.confidence >= 0.7
                          ? "bg-warning/10 text-warning"
                          : "bg-destructive/10 text-destructive"
                      )}
                    >
                      {Math.round(obj.confidence * 100)}%
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* AI Summary */}
        {analysis.summary && (
          <div className="px-4 pb-2">
            <div className="p-3 rounded-xl bg-secondary/20 text-xs leading-relaxed">
              <span className="font-medium text-foreground">AI Summary: </span>
              <span className="text-muted-foreground">{analysis.summary}</span>
            </div>
          </div>
        )}

        {/* Overall confidence */}
        <div className="px-4 pb-2">
          <ConfidenceBar
            score={analysis.overallConfidence}
            label="Overall Confidence"
            size="sm"
          />
        </div>

        {/* Processing info */}
        <div className="px-4 pb-2 flex items-center gap-3 text-[10px] text-muted-foreground">
          <span>Processed in {(analysis.processingTimeMs / 1000).toFixed(1)}s</span>
          <span>·</span>
          <span>Provider: {analysis.providerName}</span>
          {analysis.officerOverride && (
            <>
              <span>·</span>
              <span>Overridden by officer</span>
            </>
          )}
        </div>

        {/* Review actions */}
        {!readonly && !analysis.isReviewed && (
          <div className="border-t border-border/50 p-4 space-y-3">
            <p className="text-xs text-muted-foreground font-medium">
              AI results require officer review before final determination
            </p>

            {showRejectForm && (
              <div className="space-y-2">
                <Textarea
                  placeholder="Provide reason for overriding AI analysis..."
                  className="clay-inset min-h-[80px] text-xs resize-none"
                  value={officerNotes}
                  onChange={(e) => setOfficerNotes(e.target.value)}
                />
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="rounded-xl text-xs"
                    onClick={() => setShowRejectForm(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    className="rounded-xl text-xs bg-destructive hover:bg-destructive/90 text-white"
                    onClick={() => handleReject()}
                    disabled={isProcessing}
                  >
                    {isProcessing ? (
                      <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                    ) : (
                      <ThumbsDown className="w-3 h-3 mr-1" />
                    )}
                    Confirm Rejection
                  </Button>
                </div>
              </div>
            )}

            {!showRejectForm && (
              <div className="flex gap-3">
                <Button
                  className="flex-1 clay-btn rounded-xl bg-success hover:bg-success/90 text-white text-xs"
                  onClick={handleConfirm}
                  disabled={isProcessing}
                >
                  {isProcessing ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                  )}
                  Confirm AI Findings
                </Button>
                <Button
                  variant="outline"
                  className="flex-1 rounded-xl border-destructive/30 text-destructive hover:bg-destructive/10 text-xs"
                  onClick={() => setShowRejectForm(true)}
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  Reject & Override
                </Button>
              </div>
            )}

            {onReanalyze && (
              <Button
                variant="ghost"
                size="sm"
                className="w-full rounded-xl text-xs text-muted-foreground"
                onClick={onReanalyze}
              >
                <RotateCcw className="w-3 h-3 mr-1" />
                Re-run AI Analysis
              </Button>
            )}
          </div>
        )}

        {/* Reviewed status */}
        {analysis.isReviewed && (
          <div className="border-t border-border/50 p-4">
            <div className="flex items-center gap-2 p-3 rounded-xl bg-success/5">
              {analysis.officerOverride ? (
                <ThumbsDown className="w-4 h-4 text-warning" />
              ) : (
                <CheckCircle2 className="w-4 h-4 text-success" />
              )}
              <div className="text-xs">
                <p className="font-medium text-foreground">
                  {analysis.officerOverride
                    ? "AI findings overridden by officer"
                    : "AI findings confirmed by officer"}
                </p>
                {analysis.reviewedBy && (
                  <p className="text-muted-foreground">
                    Reviewed by {analysis.reviewedBy}
                    {analysis.reviewedAt &&
                      ` · ${new Date(analysis.reviewedAt).toLocaleString()}`}
                  </p>
                )}
                {analysis.officerNotes && (
                  <p className="text-muted-foreground mt-1">
                    Notes: {analysis.officerNotes}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
