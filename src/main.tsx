import { Toaster } from "@/components/ui/sonner";
import { RequireAuth } from "@/components/RequireAuth";
import { AuthProvider } from "@/hooks/use-auth";
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
const NotFound = lazy(() => import("./pages/NotFound.tsx"));

// Eager import for OfficerDashboard (Vite HMR cache issue workaround)
import OfficerDashboard from "./pages/OfficerDashboard.tsx";

// PWA registration handled by vite-plugin-pwa
// Simple loading fallback for route transitions
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
          <Suspense fallback={<RouteLoading />}>
            <Routes>
              <Route path="/" element={<Landing />} />
              <Route
                path="/auth"
                element={<AuthPage redirectAfterAuth="/officer" />}
              />
              <Route
                path="/dashboard"
                element={
                  <RequireAuth>
                    <Dashboard />
                  </RequireAuth>
                }
              />
              <Route
                path="/officer"
                element={
                  <RequireAuth>
                    <OfficerDashboard />
                  </RequireAuth>
                }
              />
              <Route
                path="/incidents"
                element={
                  <RequireAuth>
                    <Incidents />
                  </RequireAuth>
                }
              />
              <Route
                path="/incidents/new"
                element={
                  <RequireAuth>
                    <ReportIncident />
                  </RequireAuth>
                }
              />
              <Route
                path="/incidents/:id"
                element={
                  <RequireAuth>
                    <IncidentDetail />
                  </RequireAuth>
                }
              />
              <Route
                path="/evidence"
                element={
                  <RequireAuth>
                    <Evidence />
                  </RequireAuth>
                }
              />
              <Route
                path="/settings"
                element={
                  <RequireAuth>
                    <Settings />
                  </RequireAuth>
                }
              />

              {/* Citizen Portal Routes */}
              <Route
                path="/citizen"
                element={
                  <RequireAuth requireRole="citizen" fallbackPath="/citizen" showForbidden>
                    <CitizenDashboard />
                  </RequireAuth>
                }
              />
              <Route
                path="/citizen/report"
                element={
                  <RequireAuth requireRole="citizen" fallbackPath="/citizen" showForbidden>
                    <CitizenReportIncident />
                  </RequireAuth>
                }
              />
              <Route
                path="/citizen/reports"
                element={
                  <RequireAuth requireRole="citizen" fallbackPath="/citizen" showForbidden>
                    <CitizenReportsList />
                  </RequireAuth>
                }
              />
              <Route
                path="/citizen/reports/:id"
                element={
                  <RequireAuth requireRole="citizen" fallbackPath="/citizen" showForbidden>
                    <CitizenReportDetail />
                  </RequireAuth>
                }
              />
              <Route
                path="/citizen/safety"
                element={
                  <RequireAuth requireRole="citizen" fallbackPath="/citizen" showForbidden>
                    <CitizenSafetyNotices />
                  </RequireAuth>
                }
              />

              {/* Command Center (senior leadership) */}
              <Route
                path="/command-center"
                element={
                  <RequireAuth requireRole="regional_commander" fallbackPath="/dashboard" showForbidden>
                    <CommandCenter />
                  </RequireAuth>
                }
              />

              {/* Police Review Routes */}
              <Route
                path="/review/citizen-reports"
                element={
                  <RequireAuth requirePermission="review_ai_analysis" fallbackPath="/dashboard" showForbidden>
                    <ReviewCitizenReports />
                  </RequireAuth>
                }
              />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
          <Toaster />
        </BrowserRouter>
      </AuthProvider>
    </RootErrorBoundary>
  </StrictMode>,
);
