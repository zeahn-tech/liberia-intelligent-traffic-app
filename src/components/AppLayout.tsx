import { useAuth } from "@/hooks/use-auth";
import { useNetwork } from "@/hooks/use-network";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { NotificationPanel } from "@/components/NotificationPanel";
import { GlobalSearch } from "@/components/GlobalSearch";
import {
  Bell,
  Brain,
  Car,
  ChevronLeft,
  ChevronRight,
  LayoutDashboard,
  LogOut,
  MapPin,
  Menu,
  MessageSquare,
  Plus,
  Settings,
  Shield,
  Upload,
  Users,
  Wifi,
  WifiOff,
  X,
  Search,
  Command,
  ScrollText,
} from "lucide-react";
import { usePermission } from "@/lib/permissions";
import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router";

interface NavItem {
  label: string;
  path: string;
  icon: React.ElementType;
  badge?: string;
}

const navItems: NavItem[] = [
  { label: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
  { label: "Incidents", path: "/incidents", icon: Car, badge: "38" },
  { label: "New Report", path: "/incidents/new", icon: Plus },
  { label: "Incident Map", path: "/incidents?view=map", icon: MapPin },
  { label: "Evidence", path: "/evidence", icon: Upload },
  { label: "Citizen Reports", path: "/review/citizen-reports", icon: MessageSquare },
  { label: "Audit Log", path: "/audit", icon: ScrollText },
  { label: "Security", path: "/security", icon: Shield },
  { label: "Settings", path: "/settings", icon: Settings },
];

export function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, signOut } = useAuth();
  const { online } = useNetwork();
  const { role, can } = usePermission();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  // Keyboard shortcut: Cmd+K / Ctrl+K for global search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const isActive = (path: string) => {
    const basePath = path.split("?")[0];
    return location.pathname === basePath || location.pathname.startsWith(basePath + "/");
  };

  return (
    <div className="min-h-screen bg-background">
      {/* ===== Mobile overlay ===== */}
      {mobileSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      {/* ===== Sidebar ===== */}
      <aside className={`
        fixed top-0 left-0 z-50 h-full bg-card border-r border-border/50
        transition-all duration-300 ease-in-out
        ${sidebarOpen || mobileSidebarOpen ? "w-[260px]" : "w-0 lg:w-[72px]"}
        ${mobileSidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
        overflow-hidden
      `}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between h-16 px-4 border-b border-border/50">
            <div
              className="flex items-center gap-3 cursor-pointer min-w-0"
              onClick={() => navigate("/dashboard")}
            >
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shrink-0">
                <Shield className="w-4 h-4 text-primary-foreground" />
              </div>
              {(sidebarOpen || mobileSidebarOpen) && (
                <div className="truncate">
                  <p className="text-sm font-bold truncate">TrafficWatch</p>
                  <p className="text-[10px] text-muted-foreground truncate">AI Platform</p>
                </div>
              )}
            </div>
            <button
              className="hidden lg:flex p-1.5 rounded-lg hover:bg-secondary transition-colors"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              {sidebarOpen ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </button>
            <button
              className="lg:hidden p-1.5 rounded-lg hover:bg-secondary transition-colors"
              onClick={() => setMobileSidebarOpen(false)}
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
                    setMobileSidebarOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    active
                      ? "bg-primary text-primary-foreground shadow-md"
                      : "text-foreground hover:bg-secondary"
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  {(sidebarOpen || mobileSidebarOpen) && (
                    <span className="truncate flex-1 text-left">{item.label}</span>
                  )}
                  {(sidebarOpen || mobileSidebarOpen) && item.badge && (
                    <Badge className={`clay-pill text-[10px] px-1.5 py-0 h-4 ${
                      active ? "bg-primary-foreground/20 text-primary-foreground" : ""
                    }`}>
                      {item.badge}
                    </Badge>
                  )}
                </button>
              );
            })}
          </nav>

          {/* User section */}
          <div className="border-t border-border/50 p-3 space-y-2">
            <div className={`flex items-center gap-3 px-3 py-2 rounded-xl ${sidebarOpen || mobileSidebarOpen ? "" : "justify-center"}`}>
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <Shield className="w-4 h-4 text-primary" />
              </div>
              {(sidebarOpen || mobileSidebarOpen) && (
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium truncate">
                    {user?.profile?.full_name || "Officer"}
                  </p>
                  <p className="text-[10px] text-muted-foreground truncate">
                    {user?.profile?.badge_number || "N/A"}
                  </p>
                </div>
              )}
            </div>
            <button
              onClick={handleSignOut}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-destructive hover:bg-destructive/10 transition-colors"
            >
              <LogOut className="w-4 h-4 shrink-0" />
              {(sidebarOpen || mobileSidebarOpen) && <span className="truncate">Sign Out</span>}
            </button>
          </div>
        </div>
      </aside>

      {/* ===== Main Content ===== */}
      <div className={`transition-all duration-300 ${sidebarOpen ? "lg:ml-[260px]" : "lg:ml-[72px]"}`}>
        {/* ===== Top Bar ===== */}
        <header className="sticky top-0 z-30 bg-card/80 backdrop-blur-xl border-b border-border/50">
          <div className="flex items-center justify-between h-16 px-4 sm:px-6">
            <div className="flex items-center gap-3">
              <button
                className="lg:hidden p-2 rounded-xl hover:bg-secondary transition-colors"
                onClick={() => setMobileSidebarOpen(true)}
              >
                <Menu className="w-5 h-5" />
              </button>
              <h2 className="text-lg font-semibold hidden sm:block">
                Traffic Operations
              </h2>
            </div>

            <div className="flex items-center gap-2">
              {/* Offline indicator */}
              <div className="flex items-center gap-1.5">
                <div className={`w-2 h-2 rounded-full ${online ? "bg-success" : "bg-destructive"}`} />
                <span className={`text-xs hidden sm:inline ${online ? "text-success" : "text-destructive"}`}>
                  {online ? "Online" : "Offline"}
                </span>
                {!online && (
                  <Badge variant="outline" className="clay-pill text-[10px] px-1.5 py-0 h-4 bg-destructive/10 text-destructive border-destructive/20">
                    Queued
                  </Badge>
                )}
              </div>

              {/* Search */}
              <Button
                variant="ghost"
                size="sm"
                className="rounded-xl text-muted-foreground hover:text-foreground hidden sm:flex items-center gap-2"
                onClick={() => setSearchOpen(true)}
              >
                <Search className="w-3.5 h-3.5" />
                <span className="text-xs">Search</span>
                <kbd className="px-1 py-0.5 rounded bg-secondary text-[9px] font-mono text-muted-foreground hidden md:inline-flex items-center gap-0.5">
                  <Command className="w-2.5 h-2.5" />K
                </kbd>
              </Button>

              {/* Mobile search icon */}
              <Button
                variant="ghost"
                size="icon"
                className="rounded-xl sm:hidden"
                onClick={() => setSearchOpen(true)}
              >
                <Search className="w-4 h-4" />
              </Button>

              {/* Notifications */}
              <NotificationPanel />

              <Button
                className="clay-btn rounded-xl hidden sm:flex"
                size="sm"
                onClick={() => navigate("/incidents/new")}
              >
                <Plus className="w-4 h-4 mr-1" />
                New Incident
              </Button>
            </div>
          </div>
        </header>

        {/* ===== Page Content ===== */}
        <main className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
          {children}
        </main>
      </div>

      {/* Global Search Dialog */}
      <GlobalSearch open={searchOpen} onOpenChange={setSearchOpen} />
    </div>
  );
}
