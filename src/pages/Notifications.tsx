import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Bell, CheckCheck, AlertTriangle, Info, AlertCircle, BellOff } from "lucide-react";

export default function Notifications() {
  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-primary/25 to-primary/5 flex items-center justify-center shadow-sm border border-primary/10">
              <Bell className="w-5 h-5 text-primary" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Notifications</h1>
                <Badge className="bg-primary/10 text-primary border-primary/20 text-[10px]">0 unread</Badge>
              </div>
              <p className="text-sm text-muted-foreground">System alerts and updates</p>
            </div>
          </div>
          <Button variant="outline" size="sm" className="rounded-xl" disabled>
            <CheckCheck className="w-4 h-4 mr-1.5" />
            Mark All Read
          </Button>
        </div>

        <Card className="card-premium">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">All Notifications</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <BellOff className="w-12 h-12 text-muted-foreground/30 mb-4" />
              <h3 className="font-semibold text-sm">No Notifications</h3>
              <p className="text-xs text-muted-foreground mt-1 max-w-sm">
                You'll receive notifications here for serious violations, wanted vehicle alerts, incident assignments, and system alerts.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
