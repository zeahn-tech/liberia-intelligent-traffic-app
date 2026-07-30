import { Toaster } from "@/components/ui/sonner";
import { RequireAuth } from "@/components/RequireAuth";
import { AuthProvider } from "@/hooks/use-auth";
import { RealtimeProvider } from "@/lib/realtime-context";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { OfflineBanner } from "@/components/ErrorDisplay";
import { useNetwork } from "@/hooks/use-network";
import { useSessionExpiry } from "@/hooks/use-error-handler";
import React, { StrictMode, useEffect, lazy, Suspense } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Route, Routes, useLocation } from "react-router";
import { initAutoSync } from "@/lib/sync";
import { isSupabaseConfigured } from "@/supabase/client";
import "./index.css";

// Initialize auto-sync for offline support
initAutoSync();

// Lazy load route components for better code splitting
const Landing = lazy(() => import("./pages/Landing.tsx"));
const AuthPage = lazy(() => import("./pages/Auth.tsx"));
const Dashboard = lazy(() => import("./pages/Dashboard.tsx"));
const Incidents = lazy(() => import("./pages/Incidents.tsx"));
const IncidentDetail = lazy(() => import("./pages/IncidentDetail.tsx"));
const ReportIncident = lazy(() => import("./pages/ReportIncident.tsx"));
const Evidence = lazy(() => import("./pages/Evidence.tsx"));
const Settings = lazy(() => import("./pages/Settings.tsx"));
const CitizenDashboard = lazy(() => import("./pages/CitizenDashboard.tsx"));
const CitizenReportIncident = lazy(() => import("./pages/CitizenReportIncident.tsx"));
const CitizenReportsList = lazy(() => import("./pages/CitizenReportsList.tsx"));
const CitizenReportDetail = lazy(() => import("./pages/CitizenReportDetail.tsx"));
const CitizenSafetyNotices = lazy(() => import("./pages/CitizenSafetyNotices.tsx"));
const ReviewCitizenReports = lazy(() => import("./pages/ReviewCitizenReports.tsx"));
const CommandCenter = lazy(() => import("./pages/CommandCenter.tsx"));
const SearchResults = lazy(() => import("./pages/SearchResults.tsx"));
const AIDetection = lazy(() => import("./pages/AIDetection.tsx"));
const Vehicles = lazy(() => import("./pages/Vehicles.tsx"));
const LicensePlates = lazy(() => import("./pages/LicensePlates.tsx"));
const Reports = lazy(() => import("./pages/Reports.tsx"));
const Analytics = lazy(() => import("./pages/Analytics.tsx"));
const Notifications = lazy(() => import("./pages/Notifications.tsx"));
const Users = lazy(() => import("./pages/Users.tsx"));
const EvidenceUploadPage = lazy(() => import("./pages/EvidenceUploadPage.tsx"));
const AuditDashboard = lazy(() => import("./pages/AuditDashboard.tsx"));
const SecurityDashboard = lazy(() => import("./pages/SecurityDashboard.tsx"));
const NotFound = lazy(() => import("./pages/NotFound.tsx"));

// Eager import for OfficerDashboard (Vite HMR cache issue workaround)
import OfficerDashboard from "./pages/OfficerDashboard.tsx";

// PWA registration handled by vite-plugin-pwa
// Simple loading fallback for route transitions
// eslint-disable-next-line react-refresh/only-export-components
function RouteLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
        <p className="text-sm text-muted-foreground animate-pulse">Loading...</p>
      </div>
    </div>
  );
}

/** Hard guard so runtime errors never leave the preview as a blank page. */
class RootErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; message: string; stack: string }
> {
  state = { hasError: false, message: "", stack: "" };
  static getDerivedStateFromError(error: Error) {
    return {
      hasError: true,
      message: error.message || "Unknown runtime error",
      stack: error.stack || "",
    };
  }
  componentDidCatch(err: Error) {
    console.error("[Preview] Root crash:", err);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background text-foreground p-6">
          <div className="max-w-lg text-center">
            <p className="text-sm font-semibold">Preview runtime error</p>
            <p className="mt-2 text-xs text-muted-foreground break-words">
              {this.state.message}
            </p>
            {this.state.stack && (
              <pre className="mt-3 text-left text-[10px] leading-4 text-muted-foreground/80 max-h-40 overflow-auto rounded border border-border/60 p-2">
                {this.state.stack}
              </pre>
            )}
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

// eslint-disable-next-line react-refresh/only-export-components
function RouteSyncer() {
  const location = useLocation();
  useEffect(() => {
    window.parent.postMessage(
      { type: "iframe-route-change", path: location.pathname },
      "*",
    );
  }, [location.pathname]);

  useEffect(() => {
    function handleMessage(event: MessageEvent) {
      if (event.data?.type === "navigate") {
        if (event.data.direction === "back") window.history.back();
        if (event.data.direction === "forward") window.history.forward();
      }
    }
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  return null;
}

/**
 * Watches for session expiry and shows a global offline/online indicator.
 * Must be rendered inside the BrowserRouter + AuthProvider tree.
 */
// eslint-disable-next-line react-refresh/only-export-components
function SessionWatcher() {
  useSessionExpiry();
  const { online } = useNetwork();
  return <OfflineBanner isOnline={online} className="fixed top-0 left-0 right-0 z-[100] rounded-none border-x-0 border-t-0" />;
}

/** Helper to wrap a route with error boundary */
// eslint-disable-next-line react-refresh/only-export-components
function RouteErrorBoundary({ children, name }: { children: React.ReactNode; name?: string }) {
  return <ErrorBoundary componentName={name}>{children}</ErrorBoundary>;
}

// Check Supabase configuration
if (!isSupabaseConfigured()) {
  console.warn(
    "Supabase is not configured. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY environment variables."
  );
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <RootErrorBoundary>
      <AuthProvider>
        <BrowserRouter>
          <RouteSyncer />
          <SessionWatcher />
          <RealtimeProvider>
          <Suspense fallback={<RouteLoading />}>
            <Routes>
              <Route path="/" element={<RouteErrorBoundary name="Landing"><Landing /></RouteErrorBoundary>} />
              <Route
                path="/auth"
                element={<RouteErrorBoundary name="Auth"><AuthPage redirectAfterAuth="/officer" /></RouteErrorBoundary>}
              />
              <Route
                path="/dashboard"
                element={
                  <RequireAuth>
                    <RouteErrorBoundary name="Dashboard">
                      <Dashboard />
                    </RouteErrorBoundary>
                  </RequireAuth>
                }
              />
              <Route
                path="/officer"
                element={
                  <RequireAuth>
                    <RouteErrorBoundary name="Officer">
                      <OfficerDashboard />
                    </RouteErrorBoundary>
                  </RequireAuth>
                }
              />
              <Route
                path="/incidents"
                element={
                  <RequireAuth>
                    <RouteErrorBoundary name="Incidents">
                      <Incidents />
                    </RouteErrorBoundary>
                  </RequireAuth>
                }
              />
              <Route
                path="/incidents/new"
                element={
                  <RequireAuth>
                    <RouteErrorBoundary name="ReportIncident">
                      <ReportIncident />
                    </RouteErrorBoundary>
                  </RequireAuth>
                }
              />
              <Route
                path="/incidents/:id"
                element={
                  <RequireAuth>
                    <RouteErrorBoundary name="IncidentDetail">
                      <IncidentDetail />
                    </RouteErrorBoundary>
                  </RequireAuth>
                }
              />
              <Route
                path="/evidence"
                element={
                  <RequireAuth>
                    <RouteErrorBoundary name="Evidence">
                      <Evidence />
                    </RouteErrorBoundary>
                  </RequireAuth>
                }
              />
              <Route
                path="/settings"
                element={
                  <RequireAuth>
                    <RouteErrorBoundary name="Settings">
                      <Settings />
                    </RouteErrorBoundary>
                  </RequireAuth>
                }
              />

              {/* Citizen Portal Routes */}
              <Route
                path="/citizen"
                element={
                  <RequireAuth requireRole="citizen" fallbackPath="/citizen" showForbidden>
                    <RouteErrorBoundary name="CitizenDashboard">
                      <CitizenDashboard />
                    </RouteErrorBoundary>
                  </RequireAuth>
                }
              />
              <Route
                path="/citizen/report"
                element={
                  <RequireAuth requireRole="citizen" fallbackPath="/citizen" showForbidden>
                    <RouteErrorBoundary name="CitizenReportIncident">
                      <CitizenReportIncident />
                    </RouteErrorBoundary>
                  </RequireAuth>
                }
              />
              <Route
                path="/citizen/reports"
                element={
                  <RequireAuth requireRole="citizen" fallbackPath="/citizen" showForbidden>
                    <RouteErrorBoundary name="CitizenReportsList">
                      <CitizenReportsList />
                    </RouteErrorBoundary>
                  </RequireAuth>
                }
              />
              <Route
                path="/citizen/reports/:id"
                element={
                  <RequireAuth requireRole="citizen" fallbackPath="/citizen" showForbidden>
                    <RouteErrorBoundary name="CitizenReportDetail">
                      <CitizenReportDetail />
                    </RouteErrorBoundary>
                  </RequireAuth>
                }
              />
              <Route
                path="/citizen/safety"
                element={
                  <RequireAuth requireRole="citizen" fallbackPath="/citizen" showForbidden>
                    <RouteErrorBoundary name="CitizenSafetyNotices">
                      <CitizenSafetyNotices />
                    </RouteErrorBoundary>
                  </RequireAuth>
                }
              />

              {/* Command Center (senior leadership) */}
              <Route
                path="/command-center"
                element={
                  <RequireAuth requireRole="regional_commander" fallbackPath="/dashboard" showForbidden>
                    <RouteErrorBoundary name="CommandCenter">
                      <CommandCenter />
                    </RouteErrorBoundary>
                  </RequireAuth>
                }
              />

              {/* Search Results */}
              <Route
                path="/search"
                element={
                  <RequireAuth>
                    <RouteErrorBoundary name="SearchResults">
                      <SearchResults />
                    </RouteErrorBoundary>
                  </RequireAuth>
                }
              />

              {/* Police Review Routes */}
              <Route
                path="/review/citizen-reports"
                element={
                  <RequireAuth requirePermission="review_ai_analysis" fallbackPath="/dashboard" showForbidden>
                    <RouteErrorBoundary name="ReviewCitizenReports">
                      <ReviewCitizenReports />
                    </RouteErrorBoundary>
                  </RequireAuth>
                }
              />
              {/* Audit Dashboard */}
              <Route
                path="/audit"
                element={
                  <RequireAuth requirePermission="view_audit_logs" fallbackPath="/dashboard" showForbidden>
                    <RouteErrorBoundary name="AuditDashboard">
                      <AuditDashboard />
                    </RouteErrorBoundary>
                  </RequireAuth>
                }
              />
              {/* Security Dashboard */}
              <Route
                path="/security"
                element={
                  <RequireAuth requirePermission="configure_system" fallbackPath="/dashboard" showForbidden>
                    <RouteErrorBoundary name="SecurityDashboard">
                      <SecurityDashboard />
                    </RouteErrorBoundary>
                  </RequireAuth>
                }
              />

              {/* AI Detection */}
              <Route
                path="/ai-detection"
                element={
                  <RequireAuth requirePermission="run_ai_analysis" fallbackPath="/dashboard" showForbidden>
                    <RouteErrorBoundary name="AIDetection">
                      <AIDetection />
                    </RouteErrorBoundary>
                  </RequireAuth>
                }
              />

              {/* Vehicles */}
              <Route
                path="/vehicles"
                element={
                  <RequireAuth requirePermission="view_all_incidents" fallbackPath="/dashboard" showForbidden>
                    <RouteErrorBoundary name="Vehicles">
                      <Vehicles />
                    </RouteErrorBoundary>
                  </RequireAuth>
                }
              />

              {/* License Plates */}
              <Route
                path="/license-plates"
                element={
                  <RequireAuth requirePermission="run_ai_analysis" fallbackPath="/dashboard" showForbidden>
                    <RouteErrorBoundary name="LicensePlates">
                      <LicensePlates />
                    </RouteErrorBoundary>
                  </RequireAuth>
                }
              />

              {/* Reports */}
              <Route
                path="/reports"
                element={
                  <RequireAuth requirePermission="view_reports" fallbackPath="/dashboard" showForbidden>
                    <RouteErrorBoundary name="Reports">
                      <Reports />
                    </RouteErrorBoundary>
                  </RequireAuth>
                }
              />

              {/* Analytics */}
              <Route
                path="/analytics"
                element={
                  <RequireAuth requirePermission="view_analytics" fallbackPath="/dashboard" showForbidden>
                    <RouteErrorBoundary name="Analytics">
                      <Analytics />
                    </RouteErrorBoundary>
                  </RequireAuth>
                }
              />

              {/* Notifications */}
              <Route
                path="/notifications"
                element={
                  <RequireAuth>
                    <RouteErrorBoundary name="Notifications">
                      <Notifications />
                    </RouteErrorBoundary>
                  </RequireAuth>
                }
              />

              {/* Users */}
              <Route
                path="/users"
                element={
                  <RequireAuth requirePermission="view_users" fallbackPath="/dashboard" showForbidden>
                    <RouteErrorBoundary name="Users">
                      <Users />
                    </RouteErrorBoundary>
                  </RequireAuth>
                }
              />

              {/* Evidence Upload */}
              <Route
                path="/evidence/upload"
                element={
                  <RequireAuth requirePermission="access_evidence" fallbackPath="/dashboard" showForbidden>
                    <RouteErrorBoundary name="EvidenceUpload">
                      <EvidenceUploadPage />
                    </RouteErrorBoundary>
                  </RequireAuth>
                }
              />

              <Route path="*" element={<RouteErrorBoundary name="NotFound"><NotFound /></RouteErrorBoundary>} />
            </Routes>
          </Suspense>
          </RealtimeProvider>
          <Toaster />
        </BrowserRouter>
      </AuthProvider>
    </RootErrorBoundary>
  </StrictMode>,
);
