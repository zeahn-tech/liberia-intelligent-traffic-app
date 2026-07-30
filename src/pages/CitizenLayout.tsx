import { useAuth } from "@/hooks/use-auth";
import { useNetwork } from "@/hooks/use-network";
import {
// eslint-disable-next-line @typescript-eslint/no-unused-vars
  Bell,
// eslint-disable-next-line @typescript-eslint/no-unused-vars
  Car,
  FileText,
  Home,
  LayoutDashboard,
  LogOut,
  Menu,
  Megaphone,
  Plus,
  Shield,
  ShieldAlert,
// eslint-disable-next-line @typescript-eslint/no-unused-vars
  Wifi,
// eslint-disable-next-line @typescript-eslint/no-unused-vars
  WifiOff,
  X,
} from "lucide-react";
import { useState } from "react";
import { useNavigate, useLocation, Link } from "react-router";

interface NavItem {
  label: string;
  path: string;
  icon: React.ElementType;
}

const navItems: NavItem[] = [
  { label: "Home", path: "/citizen", icon: Home },
  { label: "Report Incident", path: "/citizen/report", icon: Plus },
  { label: "My Reports", path: "/citizen/reports", icon: FileText },
  { label: "Safety Notices", path: "/citizen/safety", icon: Megaphone },
];

export function CitizenLayout({ children }: { children: React.ReactNode }) {
  const { user, signOut } = useAuth();
  const { online } = useNetwork();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const isActive = (path: string) => {
    if (path === "/citizen") return location.pathname === "/citizen";
    return location.pathname.startsWith(path);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed top-0 left-0 z-50 h-full w-[260px] bg-card/95 backdrop-blur-xl border-r border-border/50
        transition-transform duration-300 ease-in-out
        ${mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
        flex flex-col
      `}>
        {/* Logo */}
        <div className="flex items-center justify-between h-16 px-4 border-b border-border/50">
          <Link to="/citizen" className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
              <Shield className="w-4 h-4 text-primary" />
            </div>
            <div>
              <p className="text-sm font-bold">TrafficWatch</p>
              <p className="text-[10px] text-muted-foreground">Citizen Portal</p>
            </div>
          </Link>
          <button
            className="lg:hidden p-1.5 rounded-lg hover:bg-secondary transition-colors"
            onClick={() => setMobileOpen(false)}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            return (
              <button
                key={item.path}
                onClick={() => {
                  navigate(item.path);
                  setMobileOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  active
                    ? "bg-primary text-primary-foreground shadow-md"
                    : "text-foreground hover:bg-secondary"
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span className="truncate flex-1 text-left">{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* User section */}
        <div className="border-t border-border/50 p-3 space-y-2">
          <div className="flex items-center gap-3 px-3 py-2 rounded-xl">
            <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <ShieldAlert className="w-4 h-4 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium truncate">
                {user?.profile?.full_name || "Citizen"}
              </p>
              <p className="text-[10px] text-muted-foreground truncate capitalize">
                {user?.profile?.role?.replace(/_/g, " ") || "Citizen"}
              </p>
            </div>
          </div>
          <button
            onClick={handleSignOut}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-destructive hover:bg-destructive/10 transition-colors"
          >
            <LogOut className="w-4 h-4 shrink-0" />
            <span className="truncate">Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="lg:ml-[260px] min-h-screen">
        {/* Top Bar */}
        <header className="sticky top-0 z-30 bg-card/80 backdrop-blur-xl border-b border-border/50">
          <div className="flex items-center justify-between h-16 px-4 sm:px-6">
            <div className="flex items-center gap-3">
              <button
                className="lg:hidden p-2 rounded-xl hover:bg-secondary transition-colors"
                onClick={() => setMobileOpen(true)}
              >
                <Menu className="w-5 h-5" />
              </button>
              <h2 className="text-lg font-semibold hidden sm:block">
                Citizen Portal
              </h2>
            </div>

            <div className="flex items-center gap-3">
              {/* Online/Offline */}
              <div className="flex items-center gap-1.5">
                <div className={`w-2 h-2 rounded-full ${online ? "bg-emerald-500" : "bg-destructive"}`} />
                <span className={`text-xs hidden sm:inline ${online ? "text-emerald-500" : "text-destructive"}`}>
                  {online ? "Online" : "Offline"}
                </span>
              </div>

              {/* Police Portal Link */}
              <button
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                onClick={() => navigate("/dashboard")}
              >
                <LayoutDashboard className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Police Portal</span>
              </button>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
