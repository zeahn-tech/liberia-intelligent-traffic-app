import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Brain, Upload, History, Settings } from "lucide-react";

export default function AIDetection() {
  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-primary/25 to-primary/5 flex items-center justify-center shadow-sm border border-primary/10">
              <Brain className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight">AI Detection</h1>
              <p className="text-sm text-muted-foreground">AI-assisted traffic violation analysis</p>
            </div>
          </div>
          <Button className="rounded-xl"><Upload className="w-4 h-4 mr-1.5" />Analyze Media</Button>
        </div>

        <div className="grid lg:grid-cols-3 gap-4">
          <Card className="card-premium lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-sm font-semibold">Analysis Queue</CardTitle>
              <CardDescription className="text-[11px]">Pending and completed AI analyses</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Brain className="w-12 h-12 text-muted-foreground/30 mb-4" />
                <h3 className="font-semibold text-sm">No Analyses Yet</h3>
                <p className="text-xs text-muted-foreground mt-1 max-w-sm">
                  Upload traffic camera footage, officer body cam, or citizen-submitted media for AI-powered violation detection.
                </p>
                <Button variant="outline" size="sm" className="mt-4 rounded-xl">
                  <Upload className="w-3.5 h-3.5 mr-1.5" />
                  Upload Media for Analysis
                </Button>
              </div>
            </CardContent>
          </Card>
          <div className="space-y-4">
            <Card className="card-premium">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold">Detection Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {[
                  { label: "Detections Today", value: "0", icon: Brain },
                  { label: "Avg Confidence", value: "—", icon: History },
                  { label: "Models Active", value: "3", icon: Settings },
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
