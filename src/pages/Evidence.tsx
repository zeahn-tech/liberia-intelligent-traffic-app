import { useState, useCallback } from "react";
import { useNavigate } from "react-router";
import { AppLayout } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Search,
  Image,
  Video,
  File,
  Download,
  Trash2,
  Camera,
  Upload,
  ChevronRight,
  Filter,
  Grid3X3,
  List,
  ExternalLink,
  Brain,
  RefreshCw,
  Shield,
} from "lucide-react";
import { submitForAnalysis } from "@/ai/pipeline";
import { providerRegistry } from "@/ai/registry";
import { VlyAIProvider } from "@/ai/providers/vly-provider";
import { toast } from "sonner";
import type { AIAnalysisResult } from "@/ai/types";

export default function Evidence() {
  const navigate = useNavigate();
  const [view, setView] = useState<"grid" | "list">("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");

  const [aiLoading, setAiLoading] = useState<string | null>(null);
  const [aiInitialized, setAiInitialized] = useState(false);

  const evidenceItems = [
    { id: "EV-001", name: "Front view of vehicle", type: "photo", incident: "INC-2024-0891", size: "2.4 MB", date: "2024-07-26", officer: "Sgt. Kollie" },
    { id: "EV-002", name: "License plate close-up", type: "photo", incident: "INC-2024-0891", size: "1.8 MB", date: "2024-07-26", officer: "Sgt. Kollie" },
    { id: "EV-003", name: "Speed radar footage", type: "video", incident: "INC-2024-0891", size: "15.2 MB", date: "2024-07-26", officer: "Sgt. Kollie" },
    { id: "EV-004", name: "Officer signed notes", type: "document", incident: "INC-2024-0891", size: "0.3 MB", date: "2024-07-26", officer: "Sgt. Kollie" },
    { id: "EV-005", name: "Intersection camera view", type: "photo", incident: "INC-2024-0890", size: "3.1 MB", date: "2024-07-26", officer: "Ofc. Tarplah" },
    { id: "EV-006", name: "Traffic light timing log", type: "document", incident: "INC-2024-0890", size: "0.1 MB", date: "2024-07-26", officer: "Ofc. Tarplah" },
    { id: "EV-007", name: "Dashcam rear view", type: "video", incident: "INC-2024-0888", size: "22.5 MB", date: "2024-07-26", officer: "Ofc. Flomo" },
    { id: "EV-008", name: "Vehicle parked illegally", type: "photo", incident: "INC-2024-0889", size: "2.0 MB", date: "2024-07-26", officer: "Sgt. Kollie" },
  ];

  const initAI = useCallback(async () => {
    if (aiInitialized) return;
    try {
      const existing = providerRegistry.getProvider("vly");
      if (!existing) {
        await providerRegistry.initialize({
          id: "vly",
          name: "TrafficWatch AI Engine",
          version: "1.0",
          capabilities: ["image_analysis", "license_plate_detection", "object_detection", "violation_classification", "ocr"],
        });
      }
      setAiInitialized(true);
    } catch (err) {
      console.error("Failed to init AI:", err);
    }
  }, [aiInitialized]);

  const handleAnalyzeEvidence = useCallback(async (ev: typeof evidenceItems[0]) => {
    setAiLoading(ev.id);
    await initAI();
    try {
      const result = await submitForAnalysis(
        ev.incident,
        [{
          type: ev.type === "video" ? "video" as const : "photo" as const,
          url: `evidence/${ev.id}`,
          mimeType: ev.type === "video" ? "video/mp4" : "image/jpeg",
          fileName: ev.name,
        }],
        [ev.id]
      );
      toast.success(`AI analysis completed for ${ev.name}`);
    } catch (err) {
      toast.error("Analysis failed: " + (err instanceof Error ? err.message : "Unknown error"));
    } finally {
      setAiLoading(null);
    }
  }, [initAI]);

  const filteredEvidence = evidenceItems.filter((ev) => {
    if (searchQuery && !ev.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !ev.incident.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    if (typeFilter !== "all" && ev.type !== typeFilter) return false;
    return true;
  });

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "photo": return <Image className="w-5 h-5 text-blue-500" />;
      case "video": return <Video className="w-5 h-5 text-purple-500" />;
      case "document": return <File className="w-5 h-5 text-amber-500" />;
      default: return <File className="w-5 h-5" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "photo": return "bg-blue-500/10";
      case "video": return "bg-purple-500/10";
      case "document": return "bg-amber-500/10";
      default: return "bg-secondary";
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Evidence Library</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Browse and manage all evidence files
            </p>
          </div>
          <div className="flex gap-2">
            <div className="flex bg-secondary rounded-xl p-1">
              <button
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  view === "grid" ? "bg-card clay-card shadow-sm text-foreground" : "text-muted-foreground"
                }`}
                onClick={() => setView("grid")}
              >
                <Grid3X3 className="w-3.5 h-3.5" />
              </button>
              <button
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  view === "list" ? "bg-card clay-card shadow-sm text-foreground" : "text-muted-foreground"
                }`}
                onClick={() => setView("list")}
              >
                <List className="w-3.5 h-3.5" />
              </button>
            </div>
            <Button className="clay-btn rounded-xl">
              <Upload className="w-4 h-4 mr-1" />
              Upload
            </Button>
          </div>
        </div>

        {/* Filters */}
        <Card className="clay-card border-border/50 !rounded-2xl">
          <CardContent className="p-4">
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search evidence..."
                  className="pl-9 clay-inset"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-[140px] clay-inset">
                  <Filter className="w-3.5 h-3.5 mr-1" />
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="photo">Photos</SelectItem>
                  <SelectItem value="video">Videos</SelectItem>
                  <SelectItem value="document">Documents</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Summary */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Total Files", count: filteredEvidence.length, color: "text-foreground" },
            { label: "Photos", count: filteredEvidence.filter(e => e.type === "photo").length, color: "text-blue-500" },
            { label: "Videos", count: filteredEvidence.filter(e => e.type === "video").length, color: "text-purple-500" },
          ].map((stat) => (
            <div key={stat.label} className="clay-card bg-card p-4 rounded-xl text-center">
              <p className={`text-xl font-bold ${stat.color}`}>{stat.count}</p>
              <p className="text-xs text-muted-foreground">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Grid View */}
        {view === "grid" && (
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {filteredEvidence.map((ev) => (
              <div key={ev.id} className="clay-card bg-card rounded-2xl overflow-hidden group relative">
                <div className={`h-32 ${getTypeColor(ev.type)} flex items-center justify-center`}>
                  {ev.type === "photo" ? (
                    <div className="w-full h-full bg-gradient-to-br from-blue-400/20 to-blue-600/20 flex items-center justify-center">
                      <Image className="w-8 h-8 text-blue-500/50" />
                    </div>
                  ) : ev.type === "video" ? (
                    <div className="w-full h-full bg-gradient-to-br from-purple-400/20 to-purple-600/20 flex items-center justify-center">
                      <Video className="w-8 h-8 text-purple-500/50" />
                    </div>
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-amber-400/20 to-amber-600/20 flex items-center justify-center">
                      <File className="w-8 h-8 text-amber-500/50" />
                    </div>
                  )}
                  {/* AI Analysis button overlay */}
                  {(ev.type === "photo" || ev.type === "video") && (
                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        size="icon"
                        variant="secondary"
                        className="w-7 h-7 rounded-lg bg-card/80 backdrop-blur-sm"
                        onClick={() => handleAnalyzeEvidence(ev)}
                        disabled={aiLoading === ev.id}
                        title="Run AI analysis on this evidence"
                      >
                        {aiLoading === ev.id ? (
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Brain className="w-3.5 h-3.5" />
                        )}
                      </Button>
                    </div>
                  )}
                </div>
                <div className="p-3 space-y-2">
                  <p className="text-sm font-medium truncate">{ev.name}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-muted-foreground">{ev.size}</span>
                    <Badge variant="outline" className="clay-pill text-[10px] px-1.5 py-0 h-4">
                      {ev.type}
                    </Badge>
                  </div>
                  <p className="text-[10px] text-muted-foreground">{ev.incident} · {ev.officer}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* List View */}
        {view === "list" && (
          <Card className="clay-card border-border/50 !rounded-2xl overflow-hidden">
            <div className="divide-y divide-border/50">
              <div className="hidden sm:grid grid-cols-7 gap-4 px-6 py-3 text-xs font-medium text-muted-foreground bg-secondary/30">
                <span className="col-span-2">Name</span>
                <span>Incident</span>
                <span>Type</span>
                <span>AI Analysis</span>
                <span>Date</span>
                <span className="text-right">Actions</span>
              </div>
              {filteredEvidence.map((ev) => (
                <div key={ev.id} className="grid sm:grid-cols-7 gap-3 sm:gap-4 px-4 sm:px-6 py-4 hover:bg-secondary/30 transition-colors items-center">
                  <div className="col-span-2 flex items-center gap-3 min-w-0">
                    <div className={`w-8 h-8 rounded-xl ${getTypeColor(ev.type)} flex items-center justify-center shrink-0`}>
                      {getTypeIcon(ev.type)}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{ev.name}</p>
                      <p className="text-xs text-muted-foreground">{ev.size}</p>
                    </div>
                  </div>
                  <p className="text-sm truncate hidden sm:block">{ev.incident}</p>
                  <Badge variant="outline" className="clay-pill text-[10px] px-2 py-0 h-5 w-fit">
                    {ev.type}
                  </Badge>
                  <div>
                    {(ev.type === "photo" || ev.type === "video") && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="rounded-lg text-xs"
                        onClick={() => handleAnalyzeEvidence(ev)}
                        disabled={aiLoading === ev.id}
                      >
                        {aiLoading === ev.id ? (
                          <RefreshCw className="w-3 h-3 mr-1 animate-spin" />
                        ) : (
                          <Brain className="w-3 h-3 mr-1" />
                        )}
                        {aiLoading === ev.id ? "Analyzing..." : "Analyze"}
                      </Button>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground hidden sm:block">{ev.date}</p>
                  <div className="flex justify-end gap-1">
                    <Button variant="ghost" size="icon" className="rounded-xl">
                      <Download className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="rounded-xl text-destructive">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}
