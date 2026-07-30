import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Truck, Search, Plus, Car } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function Vehicles() {
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearch = () => {
    if (searchQuery.trim()) {
      toast.info("Searching vehicles: " + searchQuery);
    } else {
      toast.error("Please enter a search term");
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-primary/25 to-primary/5 flex items-center justify-center shadow-sm border border-primary/10">
              <Truck className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Vehicles</h1>
              <p className="text-sm text-muted-foreground">Vehicle registration and search</p>
            </div>
          </div>
          <Button className="rounded-xl" onClick={() => toast.info("Add vehicle form coming soon")}><Plus className="w-4 h-4 mr-1.5" />Add Vehicle</Button>
        </div>

        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search by license plate, make, model, or owner..." className="pl-9" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSearch()} />
          </div>
          <Button variant="outline" className="rounded-xl" onClick={handleSearch}>Search</Button>
        </div>

        <Card className="card-premium">
          <CardHeader>
            <CardTitle className="text-sm font-semibold">Vehicle Records</CardTitle>
            <CardDescription className="text-[11px]">Registered vehicles in the system</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Car className="w-12 h-12 text-muted-foreground/30 mb-4" />
              <h3 className="font-semibold text-sm">No Vehicles Recorded</h3>
              <p className="text-xs text-muted-foreground mt-1 max-w-sm">
                Vehicle records are created automatically when incidents are filed. Search above or create a new record.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
