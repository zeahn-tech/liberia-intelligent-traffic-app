import { useState, useEffect } from "react";
import { CitizenLayout } from "@/pages/CitizenLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Search,
  Megaphone,
  ArrowLeft,
  Loader2,
  Filter,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/supabase/client";

interface SafetyNotice {
  id: string;
  title: string;
  content: string;
  notice_type: string;
  severity: string;
  county_code: string | null;
  published_at: string | null;
}

const SEVERITY_COLORS: Record<string, string> = {
  critical: "bg-red-500/10 text-red-500 border-red-500/20",
  warning: "bg-amber-500/10 text-amber-500 border-amber-500/20",
  caution: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
  info: "bg-blue-500/10 text-blue-500 border-blue-500/20",
};

const NOTICE_TYPE_BG: Record<string, string> = {
  general: "from-blue-400/10 to-blue-600/5",
  warning: "from-amber-400/10 to-amber-600/5",
  road_closure: "from-red-400/10 to-red-600/5",
  construction: "from-yellow-400/10 to-yellow-600/5",
  weather: "from-cyan-400/10 to-cyan-600/5",
  accident: "from-rose-400/10 to-rose-600/5",
  police_operation: "from-purple-400/10 to-purple-600/5",
  public_awareness: "from-emerald-400/10 to-emerald-600/5",
};

export default function CitizenSafetyNotices() {
  const navigate = useNavigate();
  const [notices, setNotices] = useState<SafetyNotice[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await supabase
          .from("road_safety_notices")
          .select("*")
          .eq("is_published", true)
          .order("published_at", { ascending: false });
        if (data) setNotices(data as SafetyNotice[]);
      } catch (err) {
        console.debug("Load notices error:", err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const filtered = notices.filter((n) => {
    if (searchQuery && !n.title.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !n.content.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    if (typeFilter !== "all" && n.notice_type !== typeFilter) return false;
    return true;
  });

  return (
    <CitizenLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="rounded-xl" onClick={() => navigate("/citizen")}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-xl font-bold">Road Safety Notices</h1>
              <p className="text-sm text-muted-foreground">Stay informed about road conditions and safety alerts</p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <Card className="clay-card border-border/50 !rounded-2xl">
          <CardContent className="p-4">
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search notices..." className="pl-9 clay-inset" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
              </div>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-[170px] clay-inset">
                  <Filter className="w-3.5 h-3.5 mr-1" />
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="general">General</SelectItem>
                  <SelectItem value="warning">Warning</SelectItem>
                  <SelectItem value="road_closure">Road Closure</SelectItem>
                  <SelectItem value="construction">Construction</SelectItem>
                  <SelectItem value="weather">Weather</SelectItem>
                  <SelectItem value="accident">Accident</SelectItem>
                  <SelectItem value="police_operation">Police Operation</SelectItem>
                  <SelectItem value="public_awareness">Public Awareness</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Notices */}
        {loading ? (
          <Card className="clay-card !rounded-2xl border-border/50">
            <CardContent className="p-12 text-center">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground mx-auto" />
            </CardContent>
          </Card>
        ) : filtered.length === 0 ? (
          <Card className="clay-card !rounded-2xl border-border/50">
            <CardContent className="p-12 text-center">
              <Megaphone className="w-10 h-10 text-muted-foreground mx-auto" />
              <h3 className="font-semibold mt-4">No Notices</h3>
              <p className="text-sm text-muted-foreground mt-2">No safety notices match your criteria.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filtered.map((notice) => (
              <Card key={notice.id} className="clay-card !rounded-2xl border-border/50 overflow-hidden">
                <div className={`h-1.5 ${
                  notice.severity === "critical" ? "bg-red-500" :
                  notice.severity === "warning" ? "bg-amber-500" :
                  notice.severity === "caution" ? "bg-yellow-500" : "bg-blue-500"
                }`} />
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge
                          variant="outline"
                          className={`text-[10px] px-2 py-0 h-5 ${SEVERITY_COLORS[notice.severity] || SEVERITY_COLORS.info}`}
                        >
                          {notice.severity.toUpperCase()}
                        </Badge>
                        <span className="text-[10px] text-muted-foreground">
                          {notice.notice_type.replace(/_/g, " ")}
                        </span>
                      </div>
                      <h3 className="text-base font-semibold mt-2">{notice.title}</h3>
                      <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{notice.content}</p>
                      {notice.published_at && (
                        <p className="text-xs text-muted-foreground mt-3">
                          Published: {new Date(notice.published_at).toLocaleDateString("en-US", {
                            year: "numeric", month: "long", day: "numeric"
                          })}
                        </p>
                      )}
                    </div>
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${NOTICE_TYPE_BG[notice.notice_type] || "from-secondary/50 to-secondary/20"} flex items-center justify-center shrink-0`}>
                      <Megaphone className="w-5 h-5" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </CitizenLayout>
  );
}
