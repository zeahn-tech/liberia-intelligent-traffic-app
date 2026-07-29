import { useAuth } from "@/hooks/use-auth";
import { useNetwork } from "@/hooks/use-network";
import { useRealtimeContext } from "@/lib/realtime-context";
import { usePermission } from "@/lib/permissions";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { NotificationPanel } from "@/components/NotificationPanel";
import { GlobalSearch } from "@/components/GlobalSearch";
import { PwaInstallPrompt } from "@/components/PwaInstallPrompt";
import {
  getAccessibleNavGroups,
  getAccessibleMobileItems,
  getAccessibleQuickActions,
} from "@/lib/navigation";
import {
  Bell,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Menu,
  Plus,
  Shield,
  Search,
  Command,
  X,
  Activity,
  Wifi,
  WifiOff,
  ChevronDown,
} from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { useNavigate, useLocation } from "react-router";
import { motion, AnimatePresence } from "framer-motion";

export function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, signOut } = useAuth();
  const { online } = useNetwork();
  const { notificationCount } = useRealtimeContext();
  const { role, can: hasPermission, hasRole } = usePermission();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});

  // Compute accessible nav items based on user role
  const accessibleGroups = useMemo(
    () => getAccessibleNavGroups(role, hasPermission, hasRole),
    [role, hasPermission, hasRole]
  );

  const accessibleMobileItems = useMemo(
    () => getAccessibleMobileItems(role, hasPermission, hasRole),
    [role, hasPermission, hasRole]
  );

  const accessibleQuickActions = useMemo(
    () => getAccessibleQuickActions(role, hasPermission, hasRole),
    [role, hasPermission, hasRole]
  );

  // Responsive: close sidebar on mobile by default
  useEffect(() => {
    if (window.innerWidth < 768) {
      setSidebarOpen(false);
    }
  }, []);

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

  const isActiveGroup = (items: { path: string }[]) =>
    items.some((item) => isActive(item.path));

  const badgeColors: Record<string, string> = {
    default: "bg-primary/10 text-primary border-primary/20",
    destructive: "bg-destructive/10 text-destructive border-destructive/20",
    warning: "bg-warning/10 text-warning border-warning/20",
    success: "bg-success/10 text-success border-success/20",
    info: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  };

  return (
    <div className="min-h-screen bg-background">
      {/* PWA Install Prompt — elegant, non-intrusive, respects dismissals */}
      <PwaInstallPrompt />
      {/* Skip-to-content link for keyboard users */}
      <a
        href="#main-content"
        className="skip-to-content focus:top-4 focus:left-4"
      >
        Skip to main content
      </a>

      {/* ===== Mobile bottom navigation bar ===== */}
      {accessibleMobileItems.length > 0 && (
        <nav
          className="fixed bottom-0 left-0 right-0 z-40 bg-card border-t border-border/50 safe-area-bottom mobile-only lg:hidden mobile-bottom-nav"
          aria-label="Mobile navigation"
          role="navigation"
        >
          <div className="flex items-center justify-around px-2 py-1">
            {accessibleMobileItems.slice(0, 5).map((item) => {
              const Icon = item.icon;
              const active = isActive(item.path);
              return (
                <button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  className={`flex flex-col items-center gap-0.5 py-1.5 px-3 rounded-xl transition-all touch-target ${
                    active
                      ? "text-primary"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                  aria-label={`${item.label}${active ? " (current page)" : ""}`}
                  aria-current={active ? "page" : undefined}
                >
                  <div className="relative">
                    <Icon className="w-5 h-5" aria-hidden="true" />
                    {(notificationCount > 0 && item.label === "Notifications") && (
                      <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-[14px] h-3.5 px-1 rounded-full bg-destructive text-[8px] font-bold text-destructive-foreground" aria-label={`${notificationCount} unread notifications`}>
                        {notificationCount > 99 ? "99+" : notificationCount}
                      </span>
                    )}
                  </div>
                  <span className={`text-[9px] font-medium ${active ? "font-semibold" : ""}`}>
                    {item.label}
                  </span>
                </button>
              );
            })}
          </div>
        </nav>
      )}

      {/* ===== Mobile overlay ===== */}
      {mobileSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      {/* ===== Sidebar ===== */}
      <aside
        className={`
          fixed top-0 left-0 z-50 h-full bg-sidebar text-sidebar-foreground border-r border-sidebar-border
          transition-all duration-300 ease-in-out
          ${sidebarOpen || mobileSidebarOpen ? "w-[260px]" : "w-0 lg:w-[72px]"}
          ${mobileSidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
          overflow-hidden
        `}
        aria-label="Main navigation"
        role="navigation"
      >
        <div className="flex flex-col h-full">
          {/* ===== Logo / Header ===== */}
          <div className="flex items-center justify-between h-16 px-4 border-b border-sidebar-border" role="banner">
            <div
              className="flex items-center gap-3 cursor-pointer min-w-0"
              onClick={() => navigate("/dashboard")}
              role="button"
              tabIndex={0}
              aria-label="Go to dashboard"
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); navigate("/dashboard"); } }}
            >
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shrink-0 shadow-sm" aria-hidden="true">
                <Shield className="w-4 h-4 text-primary-foreground" />
              </div>
              {(sidebarOpen || mobileSidebarOpen) && (
                <div className="truncate">
                  <p className="text-sm font-bold truncate text-sidebar-foreground">TrafficWatch</p>
                  <p className="text-[10px] text-sidebar-foreground/60 truncate">AI Platform</p>
                </div>
              )}
            </div>
            <button
              className="hidden lg:flex p-1.5 rounded-lg hover:bg-sidebar-accent transition-colors text-sidebar-foreground/60 hover:text-sidebar-foreground"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              aria-label={sidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
            >
              {sidebarOpen ? <ChevronLeft className="w-4 h-4" aria-hidden="true" /> : <ChevronRight className="w-4 h-4" aria-hidden="true" />}
            </button>
            <button
              className="lg:hidden p-1.5 rounded-lg hover:bg-sidebar-accent transition-colors text-sidebar-foreground/60"
              onClick={() => setMobileSidebarOpen(false)}
              aria-label="Close navigation menu"
            >
              <X className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>

          {/* ===== Navigation (scrollable) ===== */}
          <div className="flex-1 overflow-y-auto overflow-x-hidden scrollbar-hide py-3" role="menubar" aria-label="Navigation groups">
            {accessibleGroups.map((group) => {
              const groupActive = isActiveGroup(group.items);
              const isExpanded = expandedGroups[group.label] ?? groupActive;

              return (
                <div key={group.label} className="px-3 mb-2">
                  {/* Group header (only show when sidebar is expanded) */}
                  {(sidebarOpen || mobileSidebarOpen) && (
                    <button
                      onClick={() =>
                        setExpandedGroups((prev) => ({
                          ...prev,
                          [group.label]: !prev[group.label],
                        }))
                      }
                      className="flex items-center justify-between w-full px-2 py-1.5 mb-0.5 text-[10px] font-semibold uppercase tracking-widest text-sidebar-foreground/40 hover:text-sidebar-foreground/60 transition-colors"
                    >
                      <span>{group.label}</span>
                      <ChevronDown
                        className={`w-3 h-3 transition-transform ${
                          isExpanded ? "rotate-0" : "-rotate-90"
                        }`}
                      />
                    </button>
                  )}

                  {/* Collapsible group items */}
                  <AnimatePresence initial={false}>
                    {(isExpanded || !(sidebarOpen || mobileSidebarOpen)) && (
                      <motion.div
                        initial={false}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="space-y-0.5 overflow-hidden"
                      >
                        {group.items.map((item) => {
                          const Icon = item.icon;
                          const active = isActive(item.path);
                          return (
                            <button
                              key={item.path}
                              onClick={() => {
                                navigate(item.path);
                                setMobileSidebarOpen(false);
                              }}
                              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                                active
                                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                                  : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50"
                              } ${!sidebarOpen && !mobileSidebarOpen ? "justify-center px-2" : ""}`}
                              title={!sidebarOpen && !mobileSidebarOpen ? item.label : undefined}
                              aria-label={item.label}
                              aria-current={active ? "page" : undefined}
                              role="menuitem"
                            >
                              <Icon className="w-4 h-4 shrink-0" aria-hidden="true" />
                              {(sidebarOpen || mobileSidebarOpen) && (
                                <span className="truncate flex-1 text-left">{item.label}</span>
                              )}
                              {(sidebarOpen || mobileSidebarOpen) && item.badge && (
                                <Badge
                                  className={`badge-pill text-[9px] px-1.5 py-0 h-4 ${
                                    badgeColors[item.badgeVariant || "default"]
                                  }`}
                                >
                                  {item.badge}
                                </Badge>
                              )}
                            </button>
                          );
                        })}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>

          {/* ===== User Section ===== */}
          <div className="border-t border-sidebar-border p-3 space-y-2">
            {/* Quick Actions */}
            {accessibleQuickActions.length > 0 && (sidebarOpen || mobileSidebarOpen) && (
              <div className="mb-2 space-y-1">
                {accessibleQuickActions.map((action) => {
                  const Icon = action.icon;
                  return (
                    <button
                      key={action.path}
                      onClick={() => navigate(action.path)}
                      className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50 transition-all"
                    >
                      <Icon className="w-4 h-4 shrink-0" />
                      <span className="truncate flex-1 text-left">{action.label}</span>
                      {action.badge && (
                        <span className="w-4 h-4 rounded-full bg-primary flex items-center justify-center text-[9px] font-bold text-primary-foreground">
                          {action.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}

            {/* User Info */}
            <div className={`flex items-center gap-3 px-3 py-2 rounded-lg ${
              sidebarOpen || mobileSidebarOpen ? "" : "justify-center"
            }`}>
              <div className="w-8 h-8 rounded-lg bg-sidebar-accent flex items-center justify-center shrink-0">
                <Shield className="w-4 h-4 text-sidebar-accent-foreground" />
              </div>
              {(sidebarOpen || mobileSidebarOpen) && (
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium truncate text-sidebar-foreground">
                    {user?.profile?.full_name || "Officer"}
                  </p>
                  <p className="text-[10px] text-sidebar-foreground/50 truncate">
                    {user?.profile?.badge_number || ""}
                    {user?.profile?.station ? ` · ${user.profile.station}` : ""}
                  </p>
                </div>
              )}
            </div>

            {/* Sign Out */}
            <button
              onClick={handleSignOut}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-sidebar-foreground/50 hover:text-destructive hover:bg-destructive/10 transition-all"
              aria-label="Sign out of TrafficWatch AI"
            >
              <LogOut className="w-4 h-4 shrink-0" aria-hidden="true" />
              {(sidebarOpen || mobileSidebarOpen) && (
                <span className="truncate">Sign Out</span>
              )}
            </button>
          </div>
        </div>
      </aside>        {/* ===== Main Content ===== */}
      <div
        className={`transition-all duration-300 ${sidebarOpen ? "lg:ml-[260px]" : "lg:ml-[72px]"}`}
        id="main-content"
        role="main"
      >
        {/* ===== Top Bar ===== */}
        <header className="sticky top-0 z-30 border-b border-border/50 bg-background/80 backdrop-blur-xl" role="banner">
          <div className="flex items-center justify-between h-16 px-4 sm:px-6">
            <div className="flex items-center gap-3">
              <button
                className="lg:hidden p-2 rounded-xl hover:bg-secondary transition-colors text-muted-foreground"
                onClick={() => setMobileSidebarOpen(true)}
                aria-label="Open navigation menu"
                aria-expanded={mobileSidebarOpen}
              >
                <Menu className="w-5 h-5" aria-hidden="true" />
              </button>
              <h2 className="text-base font-semibold hidden sm:block text-foreground">
                Traffic Operations
              </h2>
              <div className="hidden sm:flex items-center gap-1.5 ml-2">
                <div className={`status-dot ${online ? "active" : "error"}`} />
                <span className={`text-[10px] font-medium ${online ? "text-success" : "text-destructive"}`}>
                  {online ? "Online" : "Offline"}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Search */}
              <Button
                variant="ghost"
                size="sm"
                className="rounded-lg text-muted-foreground hover:text-foreground hidden sm:flex items-center gap-2"
                onClick={() => setSearchOpen(true)}
                aria-label="Search incidents, plates, evidence (Cmd+K)"
              >
                <Search className="w-3.5 h-3.5" aria-hidden="true" />
                <span className="text-xs">Search</span>
                <kbd className="px-1 py-0.5 rounded bg-secondary text-[9px] font-mono text-muted-foreground hidden md:inline-flex items-center gap-0.5" aria-hidden="true">
                  <Command className="w-2.5 h-2.5" />K
                </kbd>
              </Button>

              <Button
                variant="ghost"
                size="icon"
                className="rounded-lg sm:hidden"
                onClick={() => setSearchOpen(true)}
                aria-label="Open search"
              >
                <Search className="w-4 h-4" aria-hidden="true" />
              </Button>

              {/* Notifications */}
              <NotificationPanel />

              {/* New Incident (desktop) */}
              <Button
                className="rounded-lg hidden sm:flex shadow-sm"
                size="sm"
                onClick={() => navigate("/incidents/new")}
                aria-label="Create new incident report"
              >
                <Plus className="w-4 h-4 mr-1" aria-hidden="true" />
                New Incident
              </Button>
            </div>
          </div>
        </header>

        {/* ===== Page Content ===== */}
        <main className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto pb-20 lg:pb-8">
          {children}
        </main>
      </div>

      {/* Global Search Dialog */}
      <GlobalSearch open={searchOpen} onOpenChange={setSearchOpen} />
    </div>
  );
}
