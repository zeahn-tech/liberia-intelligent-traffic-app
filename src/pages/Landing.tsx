import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/use-auth";
import {
  Shield,
  Car,
  Camera,
  MapPin,
  BarChart3,
  WifiOff,
  Brain,
  CheckCircle2,
  ArrowRight,
  ChevronDown,
  Menu,
  X,
} from "lucide-react";
import { useNavigate } from "react-router";
import { useState } from "react";

export default function Landing() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleGetStarted = () => {
    navigate(isAuthenticated ? "/dashboard" : "/auth");
  };

  const features = [
    {
      icon: Brain,
      title: "AI-Powered Detection",
      description:
        "Advanced computer vision detects traffic violations from photos and videos with configurable confidence thresholds.",
      color: "from-blue-400/30 to-blue-600/30",
    },
    {
      icon: WifiOff,
      title: "Offline-First Operation",
      description:
        "Full functionality without internet. Queue reports, capture evidence, and auto-sync when connectivity returns.",
      color: "from-amber-400/30 to-amber-600/30",
    },
    {
      icon: MapPin,
      title: "Incident Mapping",
      description:
        "Interactive map views of all incidents with filters by severity, type, date range, and officer assignment.",
      color: "from-emerald-400/30 to-emerald-600/30",
    },
    {
      icon: Camera,
      title: "Multi-Source Evidence",
      description:
        "Capture and manage photographs, videos, officer notes, and dashcam footage as evidentiary records.",
      color: "from-purple-400/30 to-purple-600/30",
    },
    {
      icon: BarChart3,
      title: "Real-Time Analytics",
      description:
        "Dashboard with live statistics, trend analysis, hot spot mapping, and automated report generation.",
      color: "from-rose-400/30 to-rose-600/30",
    },
    {
      icon: Shield,
      title: "Role-Based Access",
      description:
        "Secure hierarchical access for officers, supervisors, investigators, and administrators with full audit trails.",
      color: "from-cyan-400/30 to-cyan-600/30",
    },
  ];

  const stats = [
    { label: "Active Officers", value: "500+" },
    { label: "Incidents Processed", value: "12,000+" },
    { label: "AI Accuracy Rate", value: "94.7%" },
    { label: "Counties Covered", value: "15" },
  ];

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      {/* ===== NAVBAR ===== */}
      <nav className="sticky top-0 z-50 clay-card bg-card/80 backdrop-blur-xl border-b border-border/50 mx-0 rounded-none">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-20">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center clay-shadow-sm">
                <Shield className="w-5 h-5 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-foreground">TrafficWatch AI</h1>
                <p className="text-xs text-muted-foreground -mt-0.5">Liberia Intelligent Traffic</p>
              </div>
            </div>

            {/* Desktop nav */}
            <div className="hidden md:flex items-center gap-2">
              <Button variant="ghost" size="sm" className="rounded-xl" onClick={() => navigate("/")}>
                Home
              </Button>
              <Button variant="ghost" size="sm" className="rounded-xl" onClick={() => navigate("/incidents")}>
                Incidents
              </Button>
              {isAuthenticated && (
                <Button variant="ghost" size="sm" className="rounded-xl" onClick={() => navigate("/dashboard")}>
                  Dashboard
                </Button>
              )}
              <div className="w-px h-6 bg-border mx-2" />
              {isAuthenticated ? (
                <Button className="clay-btn rounded-xl" onClick={() => navigate(isAuthenticated ? "/dashboard" : "/auth")}>
                  Dashboard
                  <ArrowRight className="w-4 h-4" />
                </Button>
              ) : (
                <Button className="clay-btn rounded-xl" onClick={() => navigate("/auth")}>
                  Sign In
                  <ArrowRight className="w-4 h-4" />
                </Button>
              )}
            </div>

            {/* Mobile menu button */}
            <button
              className="md:hidden p-2 rounded-xl hover:bg-secondary transition-colors"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

          {/* Mobile menu */}
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="md:hidden pb-4 pt-2 border-t border-border/50"
            >
              <div className="flex flex-col gap-2">
                <Button variant="ghost" className="w-full justify-start rounded-xl" onClick={() => navigate("/")}>
                  Home
                </Button>
                <Button variant="ghost" className="w-full justify-start rounded-xl" onClick={() => navigate("/incidents")}>
                  Incidents
                </Button>
                {isAuthenticated && (
                  <Button variant="ghost" className="w-full justify-start rounded-xl" onClick={() => navigate("/dashboard")}>
                    Dashboard
                  </Button>
                )}
                <div className="h-px bg-border my-2" />
                <Button className="clay-btn rounded-xl w-full" onClick={() => navigate(isAuthenticated ? "/dashboard" : "/auth")}>
                  {isAuthenticated ? "Dashboard" : "Sign In"}
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </motion.div>
          )}
        </div>
      </nav>

      {/* ===== HERO SECTION ===== */}
      <section className="relative overflow-hidden">
        {/* Background decorative elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full bg-primary/5 blur-3xl" />
          <div className="absolute -bottom-40 -left-40 w-80 h-80 rounded-full bg-accent/5 blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-primary/3 blur-3xl" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-24 sm:pt-24 sm:pb-32 relative">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left column */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              className="space-y-8"
            >
              {/* Badge */}
              <Badge variant="outline" className="clay-pill px-4 py-1.5 text-xs font-medium bg-card/80 border-border/50">
                <Shield className="w-3 h-3 mr-1.5 text-primary" />
                National Police Traffic System
              </Badge>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight tracking-tight">
                AI-Powered{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">
                  Traffic Enforcement
                </span>
                {" "}for Modern Liberia
              </h1>

              <p className="text-lg text-muted-foreground max-w-lg leading-relaxed">
                Centralized intelligent traffic monitoring, incident reporting, evidence management, and analytics platform designed for national police operations across all 15 counties.
              </p>

              {/* CTA Buttons */}
              <div className="flex flex-wrap gap-4">
                <Button
                  size="lg"
                  className="clay-btn rounded-xl text-base px-8 h-12"
                  onClick={handleGetStarted}
                >
                  {isAuthenticated ? "Go to Dashboard" : "Get Started"}
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="rounded-xl text-base px-8 h-12 border-2"
                  onClick={() => navigate("/incidents")}
                >
                  <MapPin className="w-5 h-5 mr-2" />
                  View Incidents
                </Button>
              </div>

              {/* Trust indicators */}
              <div className="flex flex-wrap gap-6 pt-4">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-success" />
                  <span className="text-sm text-muted-foreground">Offline-capable</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-success" />
                  <span className="text-sm text-muted-foreground">End-to-end encrypted</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-success" />
                  <span className="text-sm text-muted-foreground">PWA installable</span>
                </div>
              </div>
            </motion.div>

            {/* Right column - Hero visual */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="relative"
            >
              <div className="relative clay-card p-0 overflow-hidden rounded-2xl bg-gradient-to-br from-primary/5 to-accent/5 border border-border/50">
                <div className="p-8 sm:p-10">
                  {/* Mock dashboard preview */}
                  <div className="space-y-4">
                    {/* Top stats row */}
                    <div className="grid grid-cols-3 gap-3">
                      {[
                        { label: "Today", value: "47", color: "text-destructive" },
                        { label: "Pending", value: "23", color: "text-warning" },
                        { label: "Resolved", value: "156", color: "text-success" },
                      ].map((stat) => (
                        <div key={stat.label} className="clay-card bg-card/80 p-3 rounded-xl text-center">
                          <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
                          <p className="text-xs text-muted-foreground">{stat.label}</p>
                        </div>
                      ))}
                    </div>

                    {/* Mock incident list */}
                    <div className="space-y-2">
                      {[
                        { type: "Speeding", plate: "LBR-4521", severity: "Moderate" },
                        { type: "Red Light", plate: "LBR-7890", severity: "Serious" },
                        { type: "Illegal Parking", plate: "LBR-1123", severity: "Minor" },
                      ].map((item, i) => (
                        <div key={i} className="flex items-center gap-3 clay-card bg-card/60 p-3 rounded-xl">
                          <div className={`w-2 h-2 rounded-full ${
                            item.severity === "Serious" ? "bg-destructive" :
                            item.severity === "Moderate" ? "bg-warning" : "bg-success"
                          }`} />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{item.type}</p>
                            <p className="text-xs text-muted-foreground">{item.plate}</p>
                          </div>
                          <Badge variant="outline" className="clay-pill text-[10px] px-2 py-0">
                            {item.severity}
                          </Badge>
                        </div>
                      ))}
                    </div>

                    {/* Bottom bar */}
                    <div className="flex items-center justify-between clay-card bg-card/60 p-3 rounded-xl">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
                        <span className="text-xs text-muted-foreground">AI Analysis Active</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Camera className="w-3 h-3 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">3 streams</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="flex justify-center pb-8"
        >
          <ChevronDown className="w-6 h-6 text-muted-foreground animate-bounce" />
        </motion.div>
      </section>

      {/* ===== STATS SECTION ===== */}
      <section className="bg-secondary/50 border-y border-border/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="text-center"
              >
                <p className="text-3xl sm:text-4xl font-bold text-foreground">{stat.value}</p>
                <p className="text-sm text-muted-foreground mt-1">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== FEATURES SECTION ===== */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-28">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <Badge variant="outline" className="clay-pill px-4 py-1.5 mb-4 text-xs bg-card/80">
            Platform Features
          </Badge>
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            Everything You Need for{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">
              Traffic Enforcement
            </span>
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
            A comprehensive suite of tools designed for police officers to monitor, report, analyze, and manage traffic violations efficiently.
          </p>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.05 }}
              className="clay-card bg-card p-6 rounded-2xl group cursor-default"
            >
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-4`}>
                <feature.icon className="w-6 h-6 text-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ===== CTA SECTION ===== */}
      <section className="bg-gradient-to-br from-primary/5 via-background to-accent/5 border-y border-border/50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="clay-card bg-card/80 p-10 sm:p-16 rounded-3xl"
          >
            <Shield className="w-12 h-12 text-primary mx-auto mb-6" />
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Ready to Modernize Traffic Enforcement?
            </h2>
            <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
              Join hundreds of officers across Liberia using AI-powered tools to make roads safer for everyone.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Button
                size="lg"
                className="clay-btn rounded-xl text-base px-10 h-13"
                onClick={handleGetStarted}
              >
                {isAuthenticated ? "Go to Dashboard" : "Get Started Free"}
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="rounded-xl text-base px-10 h-13 border-2"
                onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
              >
                Learn More
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ===== FOOTER ===== */}
      <footer className="border-t border-border/50 bg-card/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                <Shield className="w-4 h-4 text-primary-foreground" />
              </div>
              <div>
                <p className="text-sm font-semibold">TrafficWatch AI</p>
                <p className="text-xs text-muted-foreground">Liberia Intelligent Traffic App</p>
              </div>
            </div>
            <p className="text-xs text-muted-foreground text-center">
              &copy; {new Date().getFullYear()} TrafficWatch AI. All rights reserved. Not for operational use without authorization.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
