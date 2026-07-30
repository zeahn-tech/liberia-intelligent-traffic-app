import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { AppLayout } from "@/components/AppLayout";
import { EvidenceUpload } from "@/components/EvidenceUpload";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Shield, FileUp, CheckCircle2 } from "lucide-react";

export default function EvidenceUploadPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [incidentId, setIncidentId] = useState(searchParams.get("incidentId") || "");
  const [uploaded, setUploaded] = useState(false);

  const handleUploadComplete = () => {
    setUploaded(true);
  };

  if (uploaded) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 flex items-center justify-center mb-4">
            <CheckCircle2 className="w-8 h-8 text-emerald-500" />
          </div>
          <h2 className="text-xl font-bold">Upload Complete</h2>
          <p className="text-sm text-muted-foreground mt-2">Evidence has been uploaded securely.</p>
          <div className="flex gap-3 mt-6">
            <Button variant="outline" className="rounded-xl" onClick={() => { setUploaded(false); setIncidentId(""); }}>
              Upload More
            </Button>
            <Button className="rounded-xl" onClick={() => navigate(incidentId ? `/incidents/${incidentId}` : "/evidence")}>
              View Evidence
            </Button>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" className="rounded-xl" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-4 h-4 mr-1" />Back
          </Button>
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-primary/25 to-primary/5 flex items-center justify-center shadow-sm border border-primary/10">
              <FileUp className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Upload Evidence</h1>
              <p className="text-sm text-muted-foreground">Securely upload files to the evidence center</p>
            </div>
          </div>
        </div>

        <Card className="card-premium">
          <CardContent className="p-4">
            <div className="space-y-2">
              <Label htmlFor="incident-id" className="text-[11px]">Incident ID (optional)</Label>
              <Input
                id="incident-id"
                placeholder="e.g. INC-2026-0891"
                value={incidentId}
                onChange={(e) => setIncidentId(e.target.value)}
                className="max-w-sm"
              />
            </div>
          </CardContent>
        </Card>

        {incidentId && (
          <EvidenceUpload
            incidentId={incidentId}
            onUploadComplete={handleUploadComplete}
          />
        )}

        {!incidentId && (
          <Card className="card-premium">
            <CardHeader>
              <CardTitle className="text-sm font-semibold"><Shield className="w-4 h-4 inline mr-1.5 text-primary" />Evidence Upload</CardTitle>
              <CardDescription className="text-[11px]">Enter an Incident ID above to begin uploading evidence files.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <FileUp className="w-12 h-12 text-muted-foreground/30 mb-4" />
                <h3 className="font-semibold text-sm">Link to an Incident</h3>
                <p className="text-xs text-muted-foreground mt-1 max-w-sm">
                  Evidence must be linked to an existing incident. Enter the incident case number above to proceed.
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}
