import { AppLayout } from "@/components/AppLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart3, TrendingUp, Users, Car, Brain, Activity } from "lucide-react";

import { CardHeader } from "@/components/ui/card";
import { CardTitle } from "@/components/ui/card";
import { CardDescription } from "@/components/ui/card";
import { useState } from "react";
import { useEffect } from "react";
import { useCallback } from "react";
import { Card } from "@/components/ui/card";
import { CardContent } from "@/components/ui/card";
export default function Analytics() {
  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-primary/25 to-primary/5 flex items-center justify-center shadow-sm border border-primary/10">
            <BarChart3 className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Analytics</h1>
            <p className="text-sm text-muted-foreground">Deep dive into enforcement data and trends</p>
          </div>
        </div>

        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList className="bg-secondary/50 p-1 rounded-xl">
            <TabsTrigger value="overview" className="rounded-lg text-[11px] px-3 py-1.5">Overview</TabsTrigger>
            <TabsTrigger value="trends" className="rounded-lg text-[11px] px-3 py-1.5">Trends</TabsTrigger>
            <TabsTrigger value="officers" className="rounded-lg text-[11px] px-3 py-1.5">Officers</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: "Total Violations", value: "1,247", change: "+11.3%", icon: Car, up: true },
                { label: "Resolution Rate", value: "84%", change: "+3.2%", icon: TrendingUp, up: true },
                { label: "Active Officers", value: "48", change: "+4", icon: Users, up: true },
                { label: "AI Detections", value: "892", change: "+22%", icon: Brain, up: true },
              ].map((k) => (
                <Card key={k.label} className="card-premium">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">{k.label}</p>
                        <p className="text-xl font-bold">{k.value}</p>
                        <p className="text-[10px] font-semibold text-emerald-600">{k.change}</p>
                      </div>
                      <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                        <k.icon className="w-4 h-4 text-primary" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            <Card className="card-premium mt-4">
              <CardContent className="p-10 text-center">
                <Activity className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
                <h3 className="font-semibold text-sm">Detailed Analytics</h3>
                <p className="text-xs text-muted-foreground mt-1 max-w-md mx-auto">
                  Charts, trend lines, and exportable analytics data will appear here as the system collects enforcement data.
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="trends">
            <Card className="card-premium">
              <CardContent className="p-10 text-center">
                <TrendingUp className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
                <h3 className="font-semibold text-sm">Trend Analysis</h3>
                <p className="text-xs text-muted-foreground">Trend data will populate as incidents are recorded.</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="officers">
            <Card className="card-premium">
              <CardContent className="p-10 text-center">
                <Users className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
                <h3 className="font-semibold text-sm">Officer Performance</h3>
                <p className="text-xs text-muted-foreground">Officer analytics and performance metrics will appear here.</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
