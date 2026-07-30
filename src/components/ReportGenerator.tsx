import { useState, useCallback, useRef, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import {
  FileText,
  Download,
  Printer,
  FileSpreadsheet,
  FileJson,
  Loader2,
  CheckCircle2,
  Shield,
  Eye,
  AlertTriangle,
// eslint-disable-next-line @typescript-eslint/no-unused-vars
  File,
  X,
  Copy,
  Info,
  ScrollText,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";
import {
  generateReport,
  fetchReportData,
  buildReportHtml,
  saveReportHistory,
  type ReportFormat,
  type ReportScope,
  type ReportOptions,
  type ReportResult,
  type ReportData,
  SOURCE_LABELS,
} from "@/lib/report-generator";

interface ReportGeneratorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  incidentId: string;
  incidentTitle: string;
}

export function ReportGenerator({
  open,
  onOpenChange,
  incidentId,
  incidentTitle,
}: ReportGeneratorProps) {
  const { user } = useAuth();
  const [format, setFormat] = useState<ReportFormat>("pdf");
  const [scope, setScope] = useState<ReportScope>("full");
  const [includeEvidence, setIncludeEvidence] = useState(true);
  const [includeAIAnalysis, setIncludeAIAnalysis] = useState(true);
  const [includeSignatures, setIncludeSignatures] = useState(true);
  const [sourceLabeling, setSourceLabeling] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [generated, setGenerated] = useState(false);
  const [result, setResult] = useState<ReportResult | null>(null);
  const [previewHtml, setPreviewHtml] = useState<string>("");
  const [showPreview, setShowPreview] = useState(false);
  const [dataLoaded, setDataLoaded] = useState<ReportData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const previewRef = useRef<HTMLIFrameElement>(null);

  // Load data when dialog opens for preview
  useEffect(() => {
    if (open && !dataLoaded) {
      fetchReportData(incidentId)
        .then((data) => {
          setDataLoaded(data);
          // Generate preview HTML for the selected scope
          const html = buildReportHtml(data, {
            incidentId,
            format,
            scope,
            includeEvidence,
            includeAIAnalysis,
            includeSignatures,
            sourceLabeling,
          });
          setPreviewHtml(html);
        })
        .catch((err) => {
          console.error("[ReportGenerator] Failed to load data:", err);
        });
    }
// eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, incidentId]);

  // Regenerate preview when options change
  const updatePreview = useCallback(
    (opts: Partial<ReportOptions>) => {
      if (!dataLoaded) return;
      const options: ReportOptions = {
        incidentId,
        format: opts.format ?? format,
        scope: opts.scope ?? scope,
        includeEvidence: opts.includeEvidence ?? includeEvidence,
        includeAIAnalysis: opts.includeAIAnalysis ?? includeAIAnalysis,
        includeSignatures: opts.includeSignatures ?? includeSignatures,
        sourceLabeling: opts.sourceLabeling ?? sourceLabeling,
      };
      const html = buildReportHtml(dataLoaded, options);
      setPreviewHtml(html);
    },
    [dataLoaded, incidentId, format, scope, includeEvidence, includeAIAnalysis, includeSignatures, sourceLabeling]
  );

  const handleGenerate = async () => {
    if (!user?.id) {
      toast.error("You must be signed in to generate reports");
      return;
    }

    setGenerating(true);
    setError(null);

    try {
      const options: ReportOptions = {
        incidentId,
        format,
        scope,
        includeEvidence,
        includeAIAnalysis,
        includeSignatures,
        sourceLabeling,
      };

      const reportResult = await generateReport(options);
      setResult(reportResult);

      if (!reportResult.success) {
        setError(reportResult.error || "Report generation failed");
        toast.error(reportResult.error || "Failed to generate report");
        return;
      }

      setGenerated(true);
      toast.success(`${format.toUpperCase()} report generated successfully`);

      // Save to report history (fire-and-forget)
      saveReportHistory(
        incidentId,
        user.id,
        options,
        reportResult.url,
        reportResult.blob?.size
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      setError(msg);
      toast.error(`Report generation failed: ${msg}`);
    } finally {
      setGenerating(false);
    }
  };

  const handleDownload = () => {
    if (!result?.url || !result?.filename) return;
    const a = window.document.createElement("a");
    a.href = result.url;
    a.download = result.filename;
    a.click();
    toast.success(`Downloaded ${result.filename}`);
  };

  const handlePrint = () => {
    if (!result?.htmlContent) {
      // Fallback: open preview and print
      const w = window.open("", "_blank");
      if (w) {
        w.document.write(previewHtml);
        w.document.close();
        w.focus();
        setTimeout(() => w.print(), 500);
      }
      return;
    }
    const w = window.open("", "_blank");
    if (w) {
      w.document.write(result.htmlContent);
      w.document.close();
      w.focus();
      setTimeout(() => w.print(), 500);
    }
  };

  const handleCopyHtml = () => {
    navigator.clipboard.writeText(previewHtml);
    toast.success("HTML source copied to clipboard");
  };

  const handlePreview = () => {
    setShowPreview(true);
  };

  // Rebuild preview when options change
  useEffect(() => {
    if (dataLoaded && !generated) {
// eslint-disable-next-line react-hooks/set-state-in-effect
      updatePreview({});
    }
// eslint-disable-next-line react-hooks/exhaustive-deps
  }, [format, scope, includeEvidence, includeAIAnalysis, includeSignatures, sourceLabeling, dataLoaded, generated]);

  const formatIcons: Record<ReportFormat, React.ElementType> = {
    pdf: FileText,
    csv: FileSpreadsheet,
    json: FileJson,
  };

  const formatLabels: Record<ReportFormat, string> = {
    pdf: "PDF Document",
    csv: "CSV Spreadsheet",
    json: "JSON Data",
  };

  const canGenerate = user?.id && !generating && dataLoaded;

  // ── Report Detail Summary ──
  const reportSummary = dataLoaded?.incident && (
    <div className="flex flex-wrap gap-3 p-3 rounded-xl bg-secondary/30 text-xs">
      <span className="flex items-center gap-1">
        <ScrollText className="w-3.5 h-3.5 text-muted-foreground" />
        <strong>Status:</strong> {dataLoaded.incident.status?.replace(/_/g, " ")}
      </span>
      <span className="flex items-center gap-1">
        <Shield className="w-3.5 h-3.5 text-muted-foreground" />
        <strong>Plate:</strong> {dataLoaded.incident.vehicle_plate || "N/A"}
      </span>
      <span className="flex items-center gap-1">
        <Info className="w-3.5 h-3.5 text-muted-foreground" />
        <strong>Evidence:</strong> {dataLoaded.evidence.length} files
      </span>
      <span className="flex items-center gap-1">
        <BrainIcon className="w-3.5 h-3.5 text-muted-foreground" />
        <strong>AI:</strong> {dataLoaded.aiAnalyses.length} analyses
      </span>
    </div>
  );

  return (
    <>
      <Dialog open={open} onOpenChange={(val) => { onOpenChange(val); if (!val) { setGenerated(false); setResult(null); setError(null); } }}>
        <DialogContent className="sm:max-w-[600px] rounded-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              Generate Official Report
            </DialogTitle>
            <DialogDescription>
              Create a professional report for{" "}
              <span className="font-medium text-foreground">{incidentId}</span>
              : {incidentTitle}
            </DialogDescription>
          </DialogHeader>

          {error && (
            <div className="flex items-start gap-3 p-3 rounded-xl bg-destructive/10 border border-destructive/20">
              <AlertTriangle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-destructive">Generation Error</p>
                <p className="text-xs text-destructive/80 mt-0.5">{error}</p>
              </div>
            </div>
          )}

          {generated && result?.success ? (
            <div className="space-y-4 py-2">
              <div className="flex items-center gap-4 p-4 rounded-2xl bg-success/5 border border-success/20">
                <div className="w-14 h-14 rounded-2xl bg-success/10 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-7 h-7 text-success" />
                </div>
                <div>
                  <p className="font-semibold text-sm">Report Generated Successfully</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {formatLabels[format]} — {scope === "full" ? "Full Incident Report" :
                      scope === "summary" ? "Executive Summary" :
                      scope === "evidence" ? "Evidence Only" : "AI Analysis Only"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {result.filename}
                    {result.blob && ` (${(result.blob.size / 1024).toFixed(0)} KB)`}
                  </p>
                </div>
              </div>

              {/* Source labeling notice */}
              {sourceLabeling && (
                <div className="flex flex-wrap gap-2 p-3 rounded-xl bg-secondary/30">
                  <p className="text-[10px] font-medium text-muted-foreground w-full mb-1">Report Source Labels:</p>
                  {Object.values(SOURCE_LABELS).map((sl) => (
                    <span
                      key={sl.label}
                      className="text-[10px] px-2 py-0.5 rounded bg-secondary text-muted-foreground"
                    >
                      {sl.label}
                    </span>
                  ))}
                </div>
              )}

              <div className="flex gap-2 flex-wrap">
                <Button className="clay-btn rounded-xl" onClick={handleDownload}>
                  <Download className="w-4 h-4 mr-2" />
                  Download {format.toUpperCase()}
                </Button>
                <Button variant="outline" className="rounded-xl" onClick={handlePrint}>
                  <Printer className="w-4 h-4 mr-2" />
                  Print
                </Button>
                <Button variant="outline" className="rounded-xl" onClick={handlePreview}>
                  <Eye className="w-4 h-4 mr-2" />
                  Preview
                </Button>
                <Button variant="ghost" size="sm" className="rounded-xl ml-auto" onClick={() => { onOpenChange(false); setGenerated(false); setResult(null); }}>
                  <X className="w-4 h-4" />
                </Button>
              </div>

              {/* Quick actions */}
              <Separator />
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" className="rounded-xl text-xs" onClick={() => { setGenerated(false); setResult(null); }}>
                  <FileText className="w-3.5 h-3.5 mr-1" />
                  Generate Another
                </Button>
                <Button variant="ghost" size="sm" className="rounded-xl text-xs" onClick={handleCopyHtml}>
                  <Copy className="w-3.5 h-3.5 mr-1" />
                  Copy HTML Source
                </Button>
              </div>
            </div>
          ) : (
            <Tabs defaultValue="configure" className="space-y-4">
              <TabsList className="grid grid-cols-2 rounded-xl p-1 bg-secondary">
                <TabsTrigger value="configure" className="rounded-lg text-xs">
                  <FileText className="w-3.5 h-3.5 mr-1" />
                  Configure
                </TabsTrigger>
                <TabsTrigger value="preview" className="rounded-lg text-xs">
                  <Eye className="w-3.5 h-3.5 mr-1" />
                  Preview
                </TabsTrigger>
              </TabsList>

              <TabsContent value="configure" className="space-y-4 mt-0">
                {/* Report data summary */}
                {reportSummary}

                {/* Format Selection */}
                <div className="space-y-2">
                  <Label>Report Format</Label>
                  <div className="grid grid-cols-3 gap-2">
                    {(["pdf", "csv", "json"] as ReportFormat[]).map((f) => {
                      const Icon = formatIcons[f];
                      return (
                        <button
                          key={f}
                          type="button"
                          className={`p-3 rounded-xl border text-center transition-all ${
                            format === f
                              ? "bg-primary/10 border-primary/30 text-primary shadow-sm"
                              : "bg-secondary/30 border-border/50 hover:bg-secondary/50 hover:border-border"
                          }`}
                          onClick={() => { setFormat(f); setGenerated(false); }}
                        >
                          <Icon className="w-5 h-5 mx-auto mb-1" />
                          <p className="text-[10px] font-medium uppercase">{f}</p>
                          <p className="text-[8px] text-muted-foreground mt-0.5">{formatLabels[f]}</p>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Scope */}
                <div className="space-y-2">
                  <Label>Report Scope</Label>
                  <Select
                    value={scope}
                    onValueChange={(v) => { setScope(v as ReportScope); setGenerated(false); }}
                  >
                    <SelectTrigger className="clay-inset">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="full">📋 Full Incident Report</SelectItem>
                      <SelectItem value="summary">📄 Executive Summary</SelectItem>
                      <SelectItem value="evidence">📁 Evidence Only</SelectItem>
                      <SelectItem value="ai_analysis">🧠 AI Analysis Only</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Inclusions */}
                <div className="space-y-2">
                  <Label>Inclusions</Label>
                  <Card className="border-border/50 !rounded-xl">
                    <CardContent className="p-3 space-y-2">
                      <label className="flex items-center gap-2 cursor-pointer p-1 rounded-lg hover:bg-secondary/30 transition-colors">
                        <input
                          type="checkbox"
                          checked={includeEvidence}
                          onChange={(e) => { setIncludeEvidence(e.target.checked); setGenerated(false); }}
                          className="rounded"
                        />
                        <span className="text-sm">📁 Include evidence attachments</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer p-1 rounded-lg hover:bg-secondary/30 transition-colors">
                        <input
                          type="checkbox"
                          checked={includeAIAnalysis}
                          onChange={(e) => { setIncludeAIAnalysis(e.target.checked); setGenerated(false); }}
                          className="rounded"
                        />
                        <span className="text-sm">🧠 Include AI analysis results</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer p-1 rounded-lg hover:bg-secondary/30 transition-colors">
                        <input
                          type="checkbox"
                          checked={includeSignatures}
                          onChange={(e) => { setIncludeSignatures(e.target.checked); setGenerated(false); }}
                          className="rounded"
                        />
                        <span className="text-sm">✍️ Include digital signature block</span>
                      </label>
                      <Separator className="my-1" />
                      <label className="flex items-center gap-2 cursor-pointer p-1 rounded-lg hover:bg-secondary/30 transition-colors">
                        <input
                          type="checkbox"
                          checked={sourceLabeling}
                          onChange={(e) => { setSourceLabeling(e.target.checked); setGenerated(false); }}
                          className="rounded"
                        />
                        <span className="text-sm">🏷️ Enable source labeling</span>
                      </label>
                      {sourceLabeling && (
                        <div className="flex flex-wrap gap-1.5 pl-6 pt-1">
                          {Object.values(SOURCE_LABELS).map((sl) => (
                            <Badge key={sl.label} variant="outline" className="text-[9px] px-1.5 py-0 h-4">
                              {sl.label}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>

                {/* Info banner */}
                <div className="flex items-center gap-2 p-3 rounded-xl bg-secondary/30">
                  <Shield className="w-4 h-4 text-muted-foreground shrink-0" />
                  <p className="text-xs text-muted-foreground">
                    {sourceLabeling
                      ? "Report uses source labels to distinguish original evidence, AI analysis, officer-entered data, verified information, and system records."
                      : "Report will be watermarked as an official law enforcement document."}
                  </p>
                </div>

                <DialogFooter className="gap-2 pt-2">
                  <Button variant="outline" className="rounded-xl" onClick={() => onOpenChange(false)}>
                    Cancel
                  </Button>
                  <Button
                    className="clay-btn rounded-xl"
                    onClick={handleGenerate}
                    disabled={!canGenerate}
                  >
                    {generating ? (
                      <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Generating...</>
                    ) : (
                      <><FileText className="w-4 h-4 mr-2" /> Generate Report</>
                    )}
                  </Button>
                </DialogFooter>
              </TabsContent>

              <TabsContent value="preview" className="space-y-3 mt-0">
                {!dataLoaded ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <>
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-muted-foreground">
                        Preview: {formatLabels[format]} ·{" "}
                        {scope === "full" ? "Full Report" :
                         scope === "summary" ? "Summary" :
                         scope === "evidence" ? "Evidence" : "AI Analysis"}
                      </p>
                      <Badge variant="outline" className="text-[10px]">
                        {sourceLabeling ? "Source labels ON" : "Source labels OFF"}
                      </Badge>
                    </div>
                    <div className="rounded-xl border border-border/50 overflow-hidden bg-white">
                      <iframe
                        ref={previewRef}
                        srcDoc={previewHtml}
                        className="w-full h-[400px]"
                        style={{ background: "#ffffff" }}
                        title="Report Preview"
                        sandbox="allow-same-origin"
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button
                        className="clay-btn rounded-xl flex-1"
                        onClick={handleGenerate}
                        disabled={!canGenerate}
                      >
                        {generating ? (
                          <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Generating...</>
                        ) : (
                          <><Download className="w-4 h-4 mr-2" /> Generate & Download</>
                        )}
                      </Button>
                      <Button variant="outline" className="rounded-xl" onClick={handlePrint}>
                        <Printer className="w-4 h-4 mr-2" />
                        Print
                      </Button>
                    </div>
                  </>
                )}
              </TabsContent>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>

      {/* Full-screen preview dialog */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-[90vw] h-[85vh] rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              Report Preview — {incidentId}
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 rounded-xl overflow-hidden border border-border/50 bg-white h-full min-h-[60vh]">
            {result?.url ? (
              format === "pdf" ? (
                <iframe
                  src={result.url}
                  className="w-full h-full"
                  title="PDF Preview"
                />
              ) : (
                <iframe
                  srcDoc={result.htmlContent || previewHtml}
                  className="w-full h-full"
                  style={{ background: "#ffffff" }}
                  title="Report Preview"
                  sandbox="allow-same-origin"
                />
              )
            ) : (
              <iframe
                srcDoc={previewHtml}
                className="w-full h-full"
                style={{ background: "#ffffff" }}
                title="Report Preview"
                sandbox="allow-same-origin"
              />
            )}
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" className="rounded-xl" onClick={() => setShowPreview(false)}>
              Close
            </Button>
            {result?.url && (
              <Button className="clay-btn rounded-xl" onClick={handleDownload}>
                <Download className="w-4 h-4 mr-2" />
                Download
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

// ─── Inline helper icon components ──────────────────────

function BrainIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 4.5a2.5 2.5 0 0 0-4.96-.46 2.5 2.5 0 0 0-1.98 3.18 2.5 2.5 0 0 0 .08 4.2 2.5 2.5 0 0 0 .24 4.5 2.5 2.5 0 0 0 4.62.78A2.5 2.5 0 0 0 12 19.5a2.5 2.5 0 0 0 4.96.46 2.5 2.5 0 0 0 1.98-3.18 2.5 2.5 0 0 0-.08-4.2 2.5 2.5 0 0 0-.24-4.5 2.5 2.5 0 0 0-4.62-.78A2.5 2.5 0 0 0 12 4.5Z" />
      <path d="M12 4.5V19.5" />
      <path d="M7.5 12H16.5" />
      <path d="M10.5 7.5L12 12L13.5 7.5" />
    </svg>
  );
}
