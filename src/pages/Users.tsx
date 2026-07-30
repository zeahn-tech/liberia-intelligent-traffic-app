import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { UserPlus, UsersIcon, Search } from "lucide-react";

export default function Users() {
  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-primary/25 to-primary/5 flex items-center justify-center shadow-sm border border-primary/10">
              <UsersIcon className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Users</h1>
              <p className="text-sm text-muted-foreground">Officer and personnel management</p>
            </div>
          </div>
          <Button className="rounded-xl"><UserPlus className="w-4 h-4 mr-1.5" />Add User</Button>
        </div>

        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search by name, badge number, email, or role..." className="pl-9" />
          </div>
          <Button variant="outline" className="rounded-xl">Search</Button>
        </div>

        <Card className="card-premium">
          <CardHeader>
            <CardTitle className="text-sm font-semibold">Personnel Directory</CardTitle>
            <CardDescription className="text-[11px]">Authorized system users by role</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <UsersIcon className="w-12 h-12 text-muted-foreground/30 mb-4" />
              <h3 className="font-semibold text-sm">User Management</h3>
              <p className="text-xs text-muted-foreground mt-1 max-w-sm">
                Add and manage officers, supervisors, investigators, and administrators. Role-based access control is enforced at the database level.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
