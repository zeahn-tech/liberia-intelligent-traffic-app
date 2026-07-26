import { useState } from "react";
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
import {
  FileText,
  Download,
  Printer,
  FileSpreadsheet,
  File,
  Loader2,
  CheckCircle2,
  Shield,
} from "lucide-react";
import { toast } from "sonner";

type ReportFormat = "pdf" | "docx" | "csv" | "summary";
type ReportScope = "full" | "summary" | "evidence" | "ai_analysis";

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
  const [format, setFormat] = useState<ReportFormat>("pdf");
  const [scope, setScope] = useState<ReportScope>("full");
  const [includeEvidence, setIncludeEvidence] = useState(true);
  const [includeAIAnalysis, setIncludeAIAnalysis] = useState(true);
  const [includeSignatures, setIncludeSignatures] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [generated, setGenerated] = useState(false);

  const handleGenerate = async () => {
    setGenerating(true);
    // Simulate report generation
    await new Promise((r) => setTimeout(r, 2000));
    setGenerating(false);
    setGenerated(true);
    toast.success(`${format.toUpperCase()} report generated successfully`);
  };

  const handleDownload = () => {
    toast.success(`Report ${incidentId} downloaded as ${format.toUpperCase()}`);
    onOpenChange(false);
    setGenerated(false);
  };

  const handlePrint = () => {
    toast.success("Report sent to printer");
    onOpenChange(false);
    setGenerated(false);
  };

  const formatIcons: Record<ReportFormat, React.ElementType> = {
    pdf: FileText,
    docx: File,
    csv: FileSpreadsheet,
    summary: FileText,
  };

  const FormatIcon = formatIcons[format];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px] rounded-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            Generate Report
          </DialogTitle>
          <DialogDescription>
            Create an official report for {incidentId}: {incidentTitle}
          </DialogDescription>
        </DialogHeader>

        {generated ? (
          <div className="space-y-4 text-center py-4">
            <div className="w-16 h-16 rounded-2xl bg-success/10 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8 text-success" />
            </div>
            <div>
              <p className="font-semibold">Report Generated</p>
              <p className="text-sm text-muted-foreground">
                {format.toUpperCase()} report for {incidentId} is ready
              </p>
            </div>
            <div className="flex gap-2 justify-center">
              <Button className="clay-btn rounded-xl" onClick={handleDownload}>
                <Download className="w-4 h-4 mr-2" />
                Download
              </Button>
              <Button variant="outline" className="rounded-xl" onClick={handlePrint}>
                <Printer className="w-4 h-4 mr-2" />
                Print
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Format Selection */}
            <div className="space-y-2">
              <Label>Report Format</Label>
              <div className="grid grid-cols-4 gap-2">
                {(["pdf", "docx", "csv", "summary"] as ReportFormat[]).map((f) => {
                  const Icon = formatIcons[f];
                  return (
                    <button
                      key={f}
                      className={`p-3 rounded-xl border text-center transition-all ${
                        format === f
                          ? "bg-primary/10 border-primary/30 text-primary"
                          : "bg-secondary/30 border-border/50 hover:bg-secondary/50"
                      }`}
                      onClick={() => setFormat(f)}
                    >
                      <Icon className="w-5 h-5 mx-auto mb-1" />
                      <p className="text-[10px] font-medium uppercase">{f}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Scope */}
            <div className="space-y-2">
              <Label>Report Scope</Label>
              <Select value={scope} onValueChange={(v) => setScope(v as ReportScope)}>
                <SelectTrigger className="clay-inset">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="full">Full Incident Report</SelectItem>
                  <SelectItem value="summary">Executive Summary</SelectItem>
                  <SelectItem value="evidence">Evidence Only</SelectItem>
                  <SelectItem value="ai_analysis">AI Analysis Only</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Options */}
            <div className="space-y-2">
              <Label>Inclusions</Label>
              <Card className="border-border/50 !rounded-xl">
                <CardContent className="p-3 space-y-2">
                  <label className="flex items-center gap-2 cursor-pointer p-1">
                    <input type="checkbox" checked={includeEvidence}
                      onChange={(e) => setIncludeEvidence(e.target.checked)} className="rounded" />
                    <span className="text-sm">Include evidence attachments</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer p-1">
                    <input type="checkbox" checked={includeAIAnalysis}
                      onChange={(e) => setIncludeAIAnalysis(e.target.checked)} className="rounded" />
                    <span className="text-sm">Include AI analysis results</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer p-1">
                    <input type="checkbox" checked={includeSignatures}
                      onChange={(e) => setIncludeSignatures(e.target.checked)} className="rounded" />
                    <span className="text-sm">Include digital signature block</span>
                  </label>
                </CardContent>
              </Card>
            </div>

            {/* Info */}
            <div className="flex items-center gap-2 p-3 rounded-xl bg-secondary/30">
              <Shield className="w-4 h-4 text-muted-foreground" />
              <p className="text-xs text-muted-foreground">
                Report will be watermarked as an official police document
              </p>
            </div>

            <DialogFooter className="gap-2">
              <Button variant="outline" className="rounded-xl" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button className="clay-btn rounded-xl" onClick={handleGenerate} disabled={generating}>
                {generating ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Generating...</>
                ) : (
                  <><FileText className="w-4 h-4 mr-2" /> Generate Report</>
                )}
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
