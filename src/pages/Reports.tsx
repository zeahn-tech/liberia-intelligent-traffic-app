import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Download, Plus, FileSpreadsheet } from "lucide-react";

export default function Reports() {
  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-primary/25 to-primary/5 flex items-center justify-center shadow-sm border border-primary/10">
              <FileText className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Reports</h1>
              <p className="text-sm text-muted-foreground">Generate and export official reports</p>
            </div>
          </div>
          <Button className="rounded-xl"><Plus className="w-4 h-4 mr-1.5" />New Report</Button>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            { title: "Daily Violation Summary", desc: "All violations from today", icon: FileText },
            { title: "Weekly Activity Report", desc: "Officer activities this week", icon: FileSpreadsheet },
            { title: "Monthly Analytics", desc: "Monthly enforcement statistics", icon: FileText },
            { title: "Incident Case Report", desc: "Detailed incident analysis", icon: FileText },
            { title: "AI Detection Report", desc: "AI-assisted detection results", icon: FileText },
            { title: "Custom Report", desc: "Build a custom report", icon: FileSpreadsheet },
          ].map((r) => (
            <Card key={r.title} className="card-premium cursor-pointer hover:border-primary/30 transition-all group">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                      <r.icon className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold">{r.title}</h3>
                      <p className="text-[10px] text-muted-foreground">{r.desc}</p>
                    </div>
                  </div>
                  <Download className="w-4 h-4 text-muted-foreground/30 group-hover:text-primary transition-colors" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </AppLayout>
  );
}
