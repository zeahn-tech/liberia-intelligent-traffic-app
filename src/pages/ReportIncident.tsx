import { useState } from "react";
import { useNavigate } from "react-router";
import { AppLayout } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeft,
  Car,
  MapPin,
  Camera,
  Image,
  Video,
  File,
  FileText,
  Save,
  Send,
  Brain,
  WifiOff,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  Upload,
  X,
} from "lucide-react";

export default function ReportIncident() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [showAIAnalysis, setShowAIAnalysis] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    violationType: "",
    licensePlate: "",
    vehicleType: "",
    vehicleColor: "",
    location: "",
    description: "",
    severity: "",
    officerNotes: "",
  });

  const [evidenceFiles, setEvidenceFiles] = useState<
    Array<{ name: string; type: string; size: string; preview?: string }>
  >([]);

  const updateField = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach((file) => {
      const type = file.type.startsWith("image/") ? "photo" : file.type.startsWith("video/") ? "video" : "document";
      const size = file.size > 1024 * 1024
        ? `${(file.size / (1024 * 1024)).toFixed(1)} MB`
        : `${(file.size / 1024).toFixed(0)} KB`;

      let preview: string | undefined;
      if (type === "photo") {
        preview = URL.createObjectURL(file);
      }

      setEvidenceFiles((prev) => [
        ...prev,
        { name: file.name, type, size, preview },
      ]);
    });
  };

  const removeFile = (index: number) => {
    setEvidenceFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleRunAI = async () => {
    setAiLoading(true);
    // Simulate AI analysis
    await new Promise((r) => setTimeout(r, 2000));
    setAiLoading(false);
    setShowAIAnalysis(true);
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    // Simulate submit
    await new Promise((r) => setTimeout(r, 1500));
    setIsSubmitting(false);
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <AppLayout>
        <div className="max-w-md mx-auto py-20 text-center space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-success/10 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-8 h-8 text-success" />
          </div>
          <h1 className="text-2xl font-bold">Report Submitted</h1>
          <p className="text-muted-foreground">
            {isOffline
              ? "Your report has been saved locally and will sync when you're back online."
              : "Your incident report has been submitted for review."}
          </p>
          <div className="flex gap-3 justify-center">
            <Button className="clay-btn rounded-xl" onClick={() => navigate("/incidents")}>
              View All Incidents
            </Button>
            <Button variant="outline" className="rounded-xl" onClick={() => {
              setSubmitted(false);
              setStep(1);
              setFormData({
                violationType: "", licensePlate: "", vehicleType: "",
                vehicleColor: "", location: "", description: "", severity: "",
                officerNotes: "",
              });
              setEvidenceFiles([]);
              setShowAIAnalysis(false);
            }}>
              Submit Another
            </Button>
          </div>
        </div>
      </AppLayout>
    );
  }

  const violationTypes = [
    "Speeding", "Running Red Light", "Illegal Parking", "Driving Against Traffic",
    "Dangerous Overtaking", "Reckless Driving", "Illegal U-Turn",
    "Mobile Phone Use While Driving", "No Seat Belt", "No Helmet (Motorcycle)",
    "Overloaded Vehicle", "Blocking Emergency Route", "Other",
  ];

  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="rounded-xl" onClick={() => navigate("/incidents")}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-xl font-bold">New Incident Report</h1>
              <p className="text-sm text-muted-foreground">
                {isOffline ? "Working offline — data will sync later" : "Fill in the details below"}
              </p>
            </div>
          </div>
          {isOffline && (
            <Badge variant="outline" className="clay-pill bg-amber-500/10 text-amber-500 border-amber-500/20">
              <WifiOff className="w-3 h-3 mr-1" />
              Offline Mode
            </Badge>
          )}
        </div>

        {/* Progress steps */}
        <div className="flex items-center gap-2">
          {[1, 2, 3, 4].map((s) => (
            <div key={s} className="flex items-center gap-2 flex-1">
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold transition-all ${
                step >= s ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"
              }`}>
                {step > s ? <CheckCircle2 className="w-4 h-4" /> : s}
              </div>
              {s < 4 && (
                <div className={`flex-1 h-1 rounded-full transition-all ${
                  step > s ? "bg-primary" : "bg-border"
                }`} />
              )}
            </div>
          ))}
        </div>

        {/* Step 1: Basic Info */}
        {step === 1 && (
          <Card className="clay-card border-border/50 !rounded-2xl">
            <CardHeader>
              <CardTitle>Violation Details</CardTitle>
              <CardDescription>Enter the basic information about the incident</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Violation Type</Label>
                <Select value={formData.violationType} onValueChange={(v) => updateField("violationType", v)}>
                  <SelectTrigger className="clay-inset">
                    <SelectValue placeholder="Select violation type" />
                  </SelectTrigger>
                  <SelectContent>
                    {violationTypes.map((v) => (
                      <SelectItem key={v} value={v}>{v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid sm:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>License Plate</Label>
                  <Input
                    placeholder="LBR-XXXX"
                    className="clay-inset"
                    value={formData.licensePlate}
                    onChange={(e) => updateField("licensePlate", e.target.value.toUpperCase())}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Vehicle Type</Label>
                  <Select value={formData.vehicleType} onValueChange={(v) => updateField("vehicleType", v)}>
                    <SelectTrigger className="clay-inset">
                      <SelectValue placeholder="Type" />
                    </SelectTrigger>
                    <SelectContent>
                      {["Sedan", "SUV", "Truck", "Motorcycle", "Bus", "Minibus", "Pickup", "Other"].map((v) => (
                        <SelectItem key={v} value={v}>{v}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Vehicle Color</Label>
                  <Select value={formData.vehicleColor} onValueChange={(v) => updateField("vehicleColor", v)}>
                    <SelectTrigger className="clay-inset">
                      <SelectValue placeholder="Color" />
                    </SelectTrigger>
                    <SelectContent>
                      {["White", "Black", "Silver", "Red", "Blue", "Green", "Yellow", "Gray", "Other"].map((v) => (
                        <SelectItem key={v} value={v}>{v}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Location / Address</Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
                  <Input
                    placeholder="e.g., Monrovia, UN Drive near Ministerial Complex"
                    className="pl-10 clay-inset"
                    value={formData.location}
                    onChange={(e) => updateField("location", e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Severity</Label>
                <Select value={formData.severity} onValueChange={(v) => updateField("severity", v)}>
                  <SelectTrigger className="clay-inset">
                    <SelectValue placeholder="Select severity" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="minor">Minor</SelectItem>
                    <SelectItem value="moderate">Moderate</SelectItem>
                    <SelectItem value="serious">Serious</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  placeholder="Describe what happened..."
                  className="clay-inset min-h-[100px] resize-none"
                  value={formData.description}
                  onChange={(e) => updateField("description", e.target.value)}
                />
              </div>

              <div className="flex justify-end">
                <Button
                  className="clay-btn rounded-xl"
                  onClick={() => setStep(2)}
                  disabled={!formData.violationType || !formData.location}
                >
                  Next: Evidence
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Evidence */}
        {step === 2 && (
          <Card className="clay-card border-border/50 !rounded-2xl">
            <CardHeader>
              <CardTitle>Evidence Upload</CardTitle>
              <CardDescription>
                Attach photographs, videos, or documents as evidence
                {isOffline && " (files will upload when connected)"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Upload area */}
              <label className="flex flex-col items-center justify-center p-8 rounded-xl border-2 border-dashed border-border/50 bg-secondary/20 hover:bg-secondary/30 transition-colors cursor-pointer">
                <Upload className="w-8 h-8 text-muted-foreground mb-2" />
                <p className="text-sm font-medium">Drop files or click to upload</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Photos, videos, PDFs — max 50 MB each
                </p>
                <input
                  type="file"
                  multiple
                  accept="image/*,video/*,.pdf,.doc,.docx"
                  className="hidden"
                  onChange={handleFileUpload}
                />
              </label>

              {/* Uploaded files */}
              {evidenceFiles.length > 0 && (
                <div className="grid sm:grid-cols-2 gap-3">
                  {evidenceFiles.map((file, index) => (
                    <div key={index} className="flex items-center gap-3 p-3 rounded-xl bg-secondary/30">
                      {file.preview ? (
                        <img src={file.preview} alt="" className="w-10 h-10 rounded-lg object-cover" />
                      ) : (
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                          file.type === "video" ? "bg-purple-500/10" : "bg-amber-500/10"
                        }`}>
                          {file.type === "video" ? <Video className="w-5 h-5 text-purple-500" /> : <File className="w-5 h-5 text-amber-500" />}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{file.name}</p>
                        <p className="text-xs text-muted-foreground">{file.size}</p>
                      </div>
                      <button
                        className="p-1 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
                        onClick={() => removeFile(index)}
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex justify-between">
                <Button variant="outline" className="rounded-xl" onClick={() => setStep(1)}>
                  Back
                </Button>
                <Button className="clay-btn rounded-xl" onClick={() => setStep(3)}>
                  Next: AI Analysis
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 3: AI Analysis */}
        {step === 3 && (
          <Card className="clay-card border-border/50 !rounded-2xl">
            <CardHeader>
              <CardTitle>AI Analysis</CardTitle>
              <CardDescription>
                Run AI analysis on uploaded evidence to detect violations automatically
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {!showAIAnalysis ? (
                <div className="text-center p-8 space-y-4">
                  <Brain className="w-12 h-12 text-primary mx-auto" />
                  <p className="text-sm text-muted-foreground">
                    TrafficWatch AI can analyze your evidence to detect violations, read license plates, and identify vehicle details automatically.
                  </p>
                  <Button
                    className="clay-btn rounded-xl"
                    onClick={handleRunAI}
                    disabled={aiLoading}
                  >
                    {aiLoading ? (
                      <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Analyzing...</>
                    ) : (
                      <><Brain className="w-4 h-4 mr-2" /> Run AI Analysis</>
                    )}
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center gap-3 p-4 rounded-xl bg-success/10 border border-success/20">
                    <CheckCircle2 className="w-5 h-5 text-success shrink-0" />
                    <div>
                      <p className="text-sm font-medium">Analysis Complete</p>
                      <p className="text-xs text-muted-foreground">
                        AI detected potential violations with 94.7% confidence
                      </p>
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-3">
                    {[
                      { label: "Detected Violation", value: formData.violationType || "Speeding", confidence: "94.7%" },
                      { label: "License Plate", value: formData.licensePlate || "LBR-4521", confidence: "98.2%" },
                      { label: "Vehicle", value: `${formData.vehicleColor || "White"} ${formData.vehicleType || "Sedan"}`, confidence: "96.5%" },
                      { label: "Estimated Severity", value: formData.severity || "Moderate", confidence: "89.1%" },
                    ].map((det) => (
                      <div key={det.label} className="p-3 rounded-xl bg-secondary/30">
                        <p className="text-xs text-muted-foreground">{det.label}</p>
                        <p className="text-sm font-medium mt-0.5">{det.value}</p>
                        <p className="text-[10px] text-success mt-1">{det.confidence} confidence</p>
                      </div>
                    ))}
                  </div>

                  <div className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/20">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 text-warning shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs font-medium text-warning">AI Disclaimer</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          AI analysis is an assistive tool only. All results must be reviewed and confirmed by an authorized officer before being used as evidence or legal basis for enforcement action.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex justify-between">
                <Button variant="outline" className="rounded-xl" onClick={() => setStep(2)}>
                  Back
                </Button>
                <Button className="clay-btn rounded-xl" onClick={() => setStep(4)}>
                  Next: Review
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 4: Review & Submit */}
        {step === 4 && (
          <Card className="clay-card border-border/50 !rounded-2xl">
            <CardHeader>
              <CardTitle>Review & Submit</CardTitle>
              <CardDescription>
                Review all the information before submitting the report
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Summary */}
              <div className="space-y-3 p-4 rounded-xl bg-secondary/30">
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: "Violation", value: formData.violationType },
                    { label: "Plate", value: formData.licensePlate },
                    { label: "Vehicle", value: `${formData.vehicleColor} ${formData.vehicleType}` },
                    { label: "Severity", value: formData.severity },
                    { label: "Location", value: formData.location },
                    { label: "Evidence", value: `${evidenceFiles.length} file(s)` },
                  ].map((item) => (
                    <div key={item.label}>
                      <p className="text-xs text-muted-foreground">{item.label}</p>
                      <p className="text-sm font-medium">{item.value || "—"}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Notes */}
              <div className="space-y-2">
                <Label>Officer Notes (optional)</Label>
                <Textarea
                  placeholder="Additional observations or notes..."
                  className="clay-inset min-h-[80px] resize-none"
                  value={formData.officerNotes}
                  onChange={(e) => updateField("officerNotes", e.target.value)}
                />
              </div>

              {/* Save as draft option */}
              <div className="flex items-center gap-2 p-3 rounded-xl bg-secondary/30">
                <Save className="w-4 h-4 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">
                  Your progress is auto-saved as a draft. You can always come back to it later.
                </span>
              </div>

              {isOffline && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-amber-500/10 text-amber-500 text-sm">
                  <WifiOff className="w-4 h-4 shrink-0" />
                  You are offline. The report will be saved locally and submitted when you reconnect.
                </div>
              )}

              <div className="flex justify-between">
                <Button variant="outline" className="rounded-xl" onClick={() => setStep(3)}>
                  Back
                </Button>
                <Button
                  className="clay-btn rounded-xl"
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Submitting...</>
                  ) : (
                    <><Send className="w-4 h-4 mr-2" /> {isOffline ? "Save Offline" : "Submit Report"}</>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}
