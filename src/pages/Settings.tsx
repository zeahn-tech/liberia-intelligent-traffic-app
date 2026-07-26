import { useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/use-auth";
import {
  User,
  Shield,
  Bell,
  Wifi,
  Database,
  ShieldCheck,
  Save,
  LogOut,
  Palette,
  Moon,
  Sun,
  MapPin,
  Smartphone,
  Download,
  Trash2,
} from "lucide-react";
import { useNavigate } from "react-router";

export default function Settings() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold">Settings</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage your account, preferences, and app configuration
          </p>
        </div>

        <Tabs defaultValue="profile">
          <TabsList className="grid grid-cols-4 rounded-xl p-1 bg-secondary">
            <TabsTrigger value="profile" className="rounded-lg text-xs">
              <User className="w-3.5 h-3.5 mr-1" />
              Profile
            </TabsTrigger>
            <TabsTrigger value="preferences" className="rounded-lg text-xs">
              <Palette className="w-3.5 h-3.5 mr-1" />
              Preferences
            </TabsTrigger>
            <TabsTrigger value="offline" className="rounded-lg text-xs">
              <Wifi className="w-3.5 h-3.5 mr-1" />
              Offline
            </TabsTrigger>
            <TabsTrigger value="security" className="rounded-lg text-xs">
              <Shield className="w-3.5 h-3.5 mr-1" />
              Security
            </TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile" className="space-y-4 mt-4">
            <Card className="clay-card border-border/50 !rounded-2xl">
              <CardHeader>
                <CardTitle className="text-base">Personal Information</CardTitle>
                <CardDescription>Your account details as registered with the system</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center text-2xl font-bold text-primary-foreground">
                    {user?.profile?.full_name?.charAt(0) || "O"}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">{user?.profile?.full_name || "Officer"}</h3>
                    <p className="text-sm text-muted-foreground">#{user?.profile?.badge_number || "N/A"}</p>
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Full Name</Label>
                    <Input className="clay-inset" defaultValue={user?.profile?.full_name || ""} />
                  </div>
                  <div className="space-y-2">
                    <Label>Email</Label>
                    <Input className="clay-inset" defaultValue={user?.email || ""} />
                  </div>
                  <div className="space-y-2">
                    <Label>Badge Number</Label>
                    <Input className="clay-inset" defaultValue={user?.profile?.badge_number || ""} />
                  </div>
                  <div className="space-y-2">
                    <Label>Phone</Label>
                    <Input className="clay-inset" defaultValue={user?.profile?.phone || ""} type="tel" />
                  </div>
                  <div className="space-y-2">
                    <Label>Station</Label>
                    <Input className="clay-inset" defaultValue={user?.profile?.station || ""} />
                  </div>
                  <div className="space-y-2">
                    <Label>Role</Label>
                    <Input className="clay-inset" defaultValue={user?.profile?.role || ""} disabled />
                  </div>
                </div>

                <Button className="clay-btn rounded-xl" onClick={handleSave}>
                  <Save className="w-4 h-4 mr-2" />
                  {saved ? "Saved!" : "Save Changes"}
                </Button>
              </CardContent>
            </Card>

            <Card className="clay-card border-border/50 !rounded-2xl">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <LogOut className="w-5 h-5 text-destructive" />
                    <div>
                      <p className="text-sm font-medium">Sign Out</p>
                      <p className="text-xs text-muted-foreground">End your current session</p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    className="rounded-xl border-destructive/30 text-destructive hover:bg-destructive/10"
                    onClick={handleSignOut}
                  >
                    Sign Out
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Preferences Tab */}
          <TabsContent value="preferences" className="space-y-4 mt-4">
            <Card className="clay-card border-border/50 !rounded-2xl">
              <CardHeader>
                <CardTitle className="text-base">Appearance & Notifications</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-3 rounded-xl bg-secondary/30">
                  <div className="flex items-center gap-3">
                    <Moon className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Dark Mode</p>
                      <p className="text-xs text-muted-foreground">Use dark color theme</p>
                    </div>
                  </div>
                  <Switch />
                </div>
                <div className="flex items-center justify-between p-3 rounded-xl bg-secondary/30">
                  <div className="flex items-center gap-3">
                    <Bell className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Push Notifications</p>
                      <p className="text-xs text-muted-foreground">Receive alerts for new incidents</p>
                    </div>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between p-3 rounded-xl bg-secondary/30">
                  <div className="flex items-center gap-3">
                    <Smartphone className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Install App</p>
                      <p className="text-xs text-muted-foreground">Add TrafficWatch to your home screen</p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" className="rounded-xl">
                    Install
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Offline Tab */}
          <TabsContent value="offline" className="space-y-4 mt-4">
            <Card className="clay-card border-border/50 !rounded-2xl">
              <CardHeader>
                <CardTitle className="text-base">Offline Data Management</CardTitle>
                <CardDescription>
                  Manage cached data for offline access
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-3 rounded-xl bg-secondary/30">
                  <div className="flex items-center gap-3">
                    <Database className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Cached Incidents</p>
                      <p className="text-xs text-muted-foreground">247 incidents available offline</p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" className="rounded-xl">
                    <Download className="w-4 h-4 mr-1" />
                    Sync All
                  </Button>
                </div>
                <div className="flex items-center justify-between p-3 rounded-xl bg-secondary/30">
                  <div className="flex items-center gap-3">
                    <Wifi className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Auto-Sync</p>
                      <p className="text-xs text-muted-foreground">Automatically sync when online</p>
                    </div>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between p-3 rounded-xl bg-secondary/30">
                  <div className="flex items-center gap-3">
                    <MapPin className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Offline Map Tiles</p>
                      <p className="text-xs text-muted-foreground">Download map area for offline use</p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" className="rounded-xl">
                    Download
                  </Button>
                </div>
                <div className="border-t border-border/50 pt-4">
                  <Button variant="outline" size="sm" className="rounded-xl text-destructive border-destructive/30">
                    <Trash2 className="w-4 h-4 mr-1" />
                    Clear All Cached Data
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Security Tab */}
          <TabsContent value="security" className="space-y-4 mt-4">
            <Card className="clay-card border-border/50 !rounded-2xl">
              <CardHeader>
                <CardTitle className="text-base">Security & Access</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-3 rounded-xl bg-secondary/30">
                  <div className="flex items-center gap-3">
                    <ShieldCheck className="w-4 h-4 text-success" />
                    <div>
                      <p className="text-sm font-medium">Session Status</p>
                      <p className="text-xs text-muted-foreground">Currently active and verified</p>
                    </div>
                  </div>
                  <Badge variant="outline" className="clay-pill text-xs text-success bg-success/10">
                    Active
                  </Badge>
                </div>
                <div className="flex items-center justify-between p-3 rounded-xl bg-secondary/30">
                  <div className="flex items-center gap-3">
                    <User className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Your Role</p>
                      <p className="text-xs text-muted-foreground">
                        {user?.profile?.role || "Officer"} access level
                      </p>
                    </div>
                  </div>
                  <Badge variant="outline" className="clay-pill text-xs capitalize">
                    {user?.profile?.role || "officer"}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
