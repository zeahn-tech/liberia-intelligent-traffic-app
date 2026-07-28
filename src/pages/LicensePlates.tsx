import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { IdCard, Search, Camera, Hash, ScanLine } from "lucide-react";

export default function LicensePlates() {
  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-primary/25 to-primary/5 flex items-center justify-center shadow-sm border border-primary/10">
              <IdCard className="w-5 h-5 text-primary" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight">License Plates</h1>
                <Badge variant="outline" className="text-[9px] px-2 bg-cyan-500/10 text-cyan-500 border-cyan-500/20">ANPR</Badge>
              </div>
              <p className="text-sm text-muted-foreground">Automatic Number Plate Recognition</p>
            </div>
          </div>
          <Button className="rounded-xl"><Camera className="w-4 h-4 mr-1.5" />New Scan</Button>
        </div>

        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search by plate number..." className="pl-9 font-mono" />
          </div>
          <Button variant="outline" className="rounded-xl">Search</Button>
        </div>

        <div className="grid lg:grid-cols-3 gap-4">
          <Card className="card-premium lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-sm font-semibold">Plate Scans</CardTitle>
              <CardDescription className="text-[11px]">Recent ANPR detection results</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <ScanLine className="w-12 h-12 text-muted-foreground/30 mb-4" />
                <h3 className="font-semibold text-sm">No Scans Recorded</h3>
                <p className="text-xs text-muted-foreground mt-1 max-w-sm">
                  License plate scans appear here when AI analysis detects and reads plates from uploaded media.
                </p>
              </div>
            </CardContent>
          </Card>
          <div className="space-y-4">
            <Card className="card-premium">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold">Scan Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {[
                  { label: "Scans Today", value: "0", icon: Camera },
                  { label: "Unique Plates", value: "0", icon: Hash },
                  { label: "Avg Confidence", value: "—", icon: ScanLine },
                ].map((s) => (
                  <div key={s.label} className="flex items-center justify-between">
                    <span className="text-[11px] text-muted-foreground">{s.label}</span>
                    <span className="text-sm font-semibold">{s.value}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
