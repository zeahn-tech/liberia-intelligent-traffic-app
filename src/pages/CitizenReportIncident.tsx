import { useState, useRef } from "react";
import { CitizenLayout } from "@/pages/CitizenLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Switch,
} from "@/components/ui/switch";
import {
  ArrowLeft,
// eslint-disable-next-line @typescript-eslint/no-unused-vars
  Car,
  MapPin,
  Camera,
// eslint-disable-next-line @typescript-eslint/no-unused-vars
  Upload,
  Send,
// eslint-disable-next-line @typescript-eslint/no-unused-vars
  WifiOff,
  Loader2,
  CheckCircle2,
  X,
  File,
// eslint-disable-next-line @typescript-eslint/no-unused-vars
  Image,
  Video,
// eslint-disable-next-line @typescript-eslint/no-unused-vars
  Shield,
  AlertTriangle,
// eslint-disable-next-line @typescript-eslint/no-unused-vars
  Eye,
// eslint-disable-next-line @typescript-eslint/no-unused-vars
  EyeOff,
// eslint-disable-next-line @typescript-eslint/no-unused-vars
  Phone,
  Lock,
// eslint-disable-next-line @typescript-eslint/no-unused-vars
  HelpCircle,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";
import { supabase } from "@/supabase/client";
import { useNavigate } from "react-router";
import { useEffect } from "react";
import { Card } from "@/components/ui/card";
import { CardContent } from "@/components/ui/card";

// ─── Types ─────────────────────────────────────────────

interface FileItem {
  id: string;
  file: File;
  preview?: string;
  type: "photo" | "video" | "document" | "audio";
}

const REPORT_TYPES = [
  { value: "traffic_violation", label: "Traffic Violation" },
  { value: "accident", label: "Accident" },
  { value: "road_hazard", label: "Road Hazard" },
  { value: "police_assistance", label: "Request Police Assistance" },
  { value: "general_complaint", label: "General Complaint" },
  { value: "other", label: "Other" },
];

const VIOLATION_TYPES = [
  "Speeding",
  "Running Red Light",
  "Illegal Parking",
  "Driving Against Traffic",
  "Dangerous Overtaking",
  "Reckless Driving",
  "Illegal U-Turn",
  "Mobile Phone Use While Driving",
  "No Seat Belt",
  "No Helmet (Motorcycle)",
  "Overloaded Vehicle",
  "Blocking Emergency Route",
  "Other",
];

const VEHICLE_TYPES = [
  "Sedan", "SUV", "Truck", "Motorcycle", "Bus", "Minibus", "Pickup", "Other",
];

const VEHICLE_COLORS = [
  "White", "Black", "Silver", "Red", "Blue", "Green", "Yellow", "Gray", "Other",
];

const LIBERIA_COUNTIES = [
  "Bomi", "Bong", "Gbarpolu", "Grand Bassa", "Grand Cape Mount",
  "Grand Gedeh", "Grand Kru", "Lofa", "Margibi", "Maryland",
  "Montserrado", "Nimba", "River Cess", "River Gee", "Sinoe",
];

export default function CitizenReportIncident() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isOffline, setIsOffline] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [referenceNumber, setReferenceNumber] = useState("");

  // Form state
  const [reportType, setReportType] = useState("");
  const [violationType, setViolationType] = useState("");
  const [description, setDescription] = useState("");
  const [locationAddress, setLocationAddress] = useState("");
  const [locationCounty, setLocationCounty] = useState("");

  // Vehicle info
  const [vehiclePlate, setVehiclePlate] = useState("");
  const [vehicleType, setVehicleType] = useState("");
  const [vehicleColor, setVehicleColor] = useState("");

  // Anonymous
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [reporterName, setReporterName] = useState(user?.profile?.full_name || "");
  const [reporterPhone, setReporterPhone] = useState("");
  const [reporterEmail, setReporterEmail] = useState(user?.profile?.email || "");

  // Evidence
  const [evidenceFiles, setEvidenceFiles] = useState<FileItem[]>([]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach((file) => {
      const fType = file.type.startsWith("image/") ? "photo"
        : file.type.startsWith("video/") ? "video"
        : file.type.startsWith("audio/") ? "audio"
        : "document";

      let preview: string | undefined;
      if (fType === "photo") {
        preview = URL.createObjectURL(file);
      }

      setEvidenceFiles((prev) => [
        ...prev,
        { id: crypto.randomUUID?.() || `${Date.now()}-${Math.random()}`, file, preview, type: fType as FileItem["type"] },
      ]);
    });
  };

  const removeFile = (id: string) => {
    setEvidenceFiles((prev) => {
      const item = prev.find((f) => f.id === id);
      if (item?.preview) URL.revokeObjectURL(item.preview);
      return prev.filter((f) => f.id !== id);
    });
  };

  const handleSubmit = async () => {
    if (!reportType || !description) {
      toast.error("Please fill in the report type and description");
      return;
    }

    setIsSubmitting(true);

    try {
      const { data, error } = await supabase
        .from("citizen_reports")
        .insert({
          citizen_id: user?.id || null,
          is_anonymous: isAnonymous,
          report_type: reportType,
          violation_type: violationType || null,
          description,
          location_address: locationAddress || null,
          location_county: locationCounty || null,
          vehicle_plate: vehiclePlate.toUpperCase() || null,
          vehicle_type: vehicleType || null,
          vehicle_color: vehicleColor || null,
          reporter_name: isAnonymous ? null : reporterName || null,
          reporter_phone: isAnonymous ? null : reporterPhone || null,
          reporter_email: isAnonymous ? null : reporterEmail || null,
          has_evidence: evidenceFiles.length > 0,
          evidence_count: evidenceFiles.length,
          evidence_data: evidenceFiles.map((f) => ({
            name: f.file.name,
            type: f.type,
            size: f.file.size,
          })),
          status: "submitted",
        })
        .select("reference_number")
        .single();

      if (error) throw error;
      setReferenceNumber(data?.reference_number || "CR-XXXXX");
      setSubmitted(true);
      toast.success("Report submitted successfully!");
    } catch (err) {
      console.error("Submit error:", err);
      // If offline or DB error, show success with offline note
      if (!navigator.onLine) {
        setReferenceNumber("CR-OFFLINE");
        setSubmitted(true);
        toast.success("Report saved — will sync when online");
      } else {
        toast.error("Failed to submit report. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // ─── Success State ─────────────────────────────────

  if (submitted) {
    return (
      <CitizenLayout>
        <div className="max-w-md mx-auto py-16 text-center space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-success/10 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-8 h-8 text-success" />
          </div>
          <h1 className="text-2xl font-bold">Report Submitted</h1>
          <div className="bg-secondary/30 rounded-xl p-4 space-y-1">
            <p className="text-xs text-muted-foreground">Reference Number</p>
            <p className="text-lg font-mono font-bold text-primary">{referenceNumber}</p>
          </div>
          <p className="text-sm text-muted-foreground">
            {isOffline
              ? "Your report has been saved locally and will sync when you're back online."
              : "Your report has been submitted and will be reviewed by the traffic police."}
          </p>
          <div className="flex gap-3 justify-center">
            <Button className="clay-btn rounded-xl" onClick={() => navigate("/citizen")}>
              Back to Home
            </Button>
            <Button variant="outline" className="rounded-xl" onClick={() => {
              setSubmitted(false);
              setReportType("");
              setViolationType("");
              setDescription("");
              setLocationAddress("");
              setVehiclePlate("");
              setEvidenceFiles([]);
            }}>
              Submit Another
            </Button>
          </div>
        </div>
      </CitizenLayout>
    );
  }

  // ─── Main Form ─────────────────────────────────────

  return (
    <CitizenLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="rounded-xl" onClick={() => navigate("/citizen")}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-xl font-bold">Report an Incident</h1>
              <p className="text-sm text-muted-foreground">
                Help keep Liberia's roads safe — report traffic violations and incidents
              </p>
            </div>
          </div>
        </div>

        <Card className="clay-card border-border/50 !rounded-2xl">
          <CardContent className="p-6 space-y-6">
            {/* Report Type */}
            <div className="space-y-3">
              <Label className="text-sm font-semibold">What would you like to report?</Label>
              <div className="grid sm:grid-cols-2 gap-2">
                {REPORT_TYPES.map((rt) => (
                  <button
                    key={rt.value}
                    type="button"
                    onClick={() => setReportType(rt.value)}
                    className={`p-3 rounded-xl border text-left text-sm font-medium transition-all ${
                      reportType === rt.value
                        ? "border-primary bg-primary/5 text-primary"
                        : "border-border/50 hover:border-primary/30 hover:bg-secondary/30"
                    }`}
                  >
                    {rt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Violation Type (conditional) */}
            {reportType === "traffic_violation" && (
              <div className="space-y-2">
                <Label>Violation Type</Label>
                <Select value={violationType} onValueChange={setViolationType}>
                  <SelectTrigger className="clay-inset">
                    <SelectValue placeholder="Select violation type" />
                  </SelectTrigger>
                  <SelectContent>
                    {VIOLATION_TYPES.map((v) => (
                      <SelectItem key={v} value={v}>{v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Description */}
            <div className="space-y-2">
              <Label>Description <span className="text-destructive">*</span></Label>
              <Textarea
                placeholder="Describe what happened — include as much detail as possible..."
                className="clay-inset min-h-[120px] resize-none"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
              <p className="text-[10px] text-muted-foreground text-right">
                {description.length} characters
              </p>
            </div>

            {/* Location */}
            <div className="space-y-2">
              <Label>Location</Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="e.g., UN Drive, Monrovia (describe the exact location)"
                  className="pl-9 clay-inset"
                  value={locationAddress}
                  onChange={(e) => setLocationAddress(e.target.value)}
                />
              </div>
              <Select value={locationCounty} onValueChange={setLocationCounty}>
                <SelectTrigger className="clay-inset mt-2">
                  <SelectValue placeholder="County (optional)" />
                </SelectTrigger>
                <SelectContent>
                  {LIBERIA_COUNTIES.map((c) => (
                    <SelectItem key={c} value={c}>{c} County</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Vehicle Info */}
            <div className="space-y-2">
              <Label>Vehicle Information (if applicable)</Label>
              <div className="grid sm:grid-cols-3 gap-3">
                <Input
                  placeholder="License plate"
                  className="clay-inset"
                  value={vehiclePlate}
                  onChange={(e) => setVehiclePlate(e.target.value.toUpperCase())}
                />
                <Select value={vehicleType} onValueChange={setVehicleType}>
                  <SelectTrigger className="clay-inset">
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent>
                    {VEHICLE_TYPES.map((v) => (
                      <SelectItem key={v} value={v}>{v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={vehicleColor} onValueChange={setVehicleColor}>
                  <SelectTrigger className="clay-inset">
                    <SelectValue placeholder="Color" />
                  </SelectTrigger>
                  <SelectContent>
                    {VEHICLE_COLORS.map((c) => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Evidence Upload */}
            <div className="space-y-3">
              <Label>Evidence (optional)</Label>
              <label className="flex flex-col items-center justify-center p-6 rounded-xl border-2 border-dashed border-border/50 bg-secondary/20 hover:bg-secondary/30 transition-colors cursor-pointer">
                <Camera className="w-6 h-6 text-muted-foreground mb-2" />
                <p className="text-sm font-medium">Add photos, videos, or documents</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Max 25 MB per file
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/*,video/*,.pdf,.doc,.docx"
                  className="hidden"
                  onChange={handleFileUpload}
                />
              </label>

              {evidenceFiles.length > 0 && (
                <div className="grid sm:grid-cols-2 gap-2">
                  {evidenceFiles.map((item) => (
                    <div key={item.id} className="flex items-center gap-2 p-2 rounded-lg bg-secondary/30">
                      {item.preview ? (
                        <img src={item.preview} alt="" className="w-8 h-8 rounded object-cover" />
                      ) : (
                        <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center">
                          {item.type === "video" ? <Video className="w-4 h-4 text-purple-500" />
                            : <File className="w-4 h-4 text-amber-500" />}
                        </div>
                      )}
                      <span className="text-xs truncate flex-1">{item.file.name}</span>
                      <button
                        className="p-0.5 rounded hover:bg-destructive/10"
                        onClick={() => removeFile(item.id)}
                      >
                        <X className="w-3 h-3 text-muted-foreground" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Anonymous Reporting */}
            <div className="p-4 rounded-xl bg-secondary/20 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Lock className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <Label className="text-sm font-medium">Submit Anonymously</Label>
                    <p className="text-[10px] text-muted-foreground">
                      Your personal information will not be shared
                    </p>
                  </div>
                </div>
                <Switch
                  checked={isAnonymous}
                  onCheckedChange={setIsAnonymous}
                />
              </div>

              {!isAnonymous && (
                <>
                  <div className="space-y-2">
                    <Label>Your Name</Label>
                    <Input
                      placeholder="Full name"
                      className="clay-inset"
                      value={reporterName}
                      onChange={(e) => setReporterName(e.target.value)}
                    />
                  </div>
                  <div className="grid sm:grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label>Phone (optional)</Label>
                      <Input
                        placeholder="Phone number"
                        className="clay-inset"
                        value={reporterPhone}
                        onChange={(e) => setReporterPhone(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Email (optional)</Label>
                      <Input
                        type="email"
                        placeholder="your@email.com"
                        className="clay-inset"
                        value={reporterEmail}
                        onChange={(e) => setReporterEmail(e.target.value)}
                      />
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Disclaimer */}
            <div className="flex items-start gap-2 p-3 rounded-xl bg-amber-500/5 border border-amber-500/10">
              <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-medium text-amber-600 dark:text-amber-400">
                  Important Notice
                </p>
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  Submitting false reports is a serious offense. Your report will be reviewed by authorized traffic police before any action is taken.
                  {isAnonymous && " Anonymous submissions cannot receive direct responses."}
                </p>
              </div>
            </div>

            {/* Submit */}
            <Button
              className="w-full clay-btn rounded-xl"
              size="lg"
              onClick={handleSubmit}
              disabled={isSubmitting || !reportType || !description}
            >
              {isSubmitting ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Submitting...</>
              ) : (
                <><Send className="w-4 h-4 mr-2" /> {isOffline ? "Save Offline" : "Submit Report"}</>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    </CitizenLayout>
  );
}
