// ============================================================
// TrafficWatch AI — GlobalSearch Component
//
// Command-palette style search dialog accessible via:
// - Cmd+K / Ctrl+K keyboard shortcut
// - Search icon in AppLayout top bar
//
// Searches across incidents, evidence, ANPR scans,
// citizen reports, involved persons, and profiles.
// ============================================================

import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command";
import {
  Car,
  FileText,
  Camera,
  MessageSquare,
  User,
  Search,
  Clock,
  TrendingUp,
  AlertTriangle,
  Loader2,
  Hash,
  MapPin,
  ChevronRight,
  X,
  ArrowRight,
} from "lucide-react";
import { supabase } from "@/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";

// ─── Types ─────────────────────────────────────────────

export interface SearchResult {
  result_type: "incident" | "evidence" | "anpr" | "citizen_report" | "person";
  result_id: string;
  title: string;
  description: string;
  status: string | null;
  severity: string | null;
  plate: string | null;
  location: string | null;
  created_at: string;
  officer_name: string | null;
  person_name: string | null;
  ref_id: string | null;
  relevance: number;
}

export interface SearchResponse {
  results: SearchResult[];
  total: number;
}

interface RecentSearch {
  id: string;
  query: string;
  result_type: string | null;
  result_id: string | null;
  result_title: string | null;
  created_at: string;
}

// ─── Constants ─────────────────────────────────────────

const RESULT_ICONS: Record<string, React.ReactNode> = {
  incident: <Car className="w-4 h-4" />,
  evidence: <Camera className="w-4 h-4" />,
  anpr: <Hash className="w-4 h-4" />,
  citizen_report: <MessageSquare className="w-4 h-4" />,
  person: <User className="w-4 h-4" />,
};

const RESULT_LABELS: Record<string, string> = {
  incident: "Incident",
  evidence: "Evidence",
  anpr: "Plate Scan",
  citizen_report: "Citizen Report",
  person: "Person",
};

const RESULT_COLORS: Record<string, string> = {
  incident: "bg-blue-500/10 text-blue-500",
  evidence: "bg-purple-500/10 text-purple-500",
  anpr: "bg-cyan-500/10 text-cyan-500",
  citizen_report: "bg-amber-500/10 text-amber-500",
  person: "bg-green-500/10 text-green-500",
};

// ─── Search Type Suggestions ──────────────────────────

const SEARCH_SUGGESTIONS = [
  { label: "Search by plate number", query: "LBR-", icon: Hash },
  { label: "Search by case number", query: "INC-", icon: FileText },
  { label: "Search by location", query: "Monrovia", icon: MapPin },
  { label: "Search by officer name", query: "Sgt.", icon: User },
  { label: "Critical incidents", query: "severity:critical", icon: AlertTriangle },
];

// ─── Props ─────────────────────────────────────────────

interface GlobalSearchProps {
  /** Whether the search dialog is open */
  open: boolean;
  /** Callback when open state changes */
  onOpenChange: (open: boolean) => void;
  /** Optional initial query */
  initialQuery?: string;
}

// ─── Component ─────────────────────────────────────────

export function GlobalSearch({ open, onOpenChange, initialQuery = "" }: GlobalSearchProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [recentSearches, setRecentSearches] = useState<RecentSearch[]>([]);
  const [searched, setSearched] = useState(false);
  const debounceRef = useRef<number | null>(null);

  // Load recent searches when dialog opens
  useEffect(() => {
    if (open && user?.id && !query) {
      loadRecentSearches();
      setQuery(initialQuery);
    }
  }, [open, user?.id, initialQuery, query]);

  // Debounced search
  useEffect(() => {
    if (!query || query.length < 2) {
      setResults([]);
      setTotal(0);
      setSearched(false);
      return;
    }

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = window.setTimeout(() => {
      performSearch(query);
    }, 300);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  const performSearch = async (searchQuery: string) => {
    if (!searchQuery || searchQuery.length < 2) return;

    setLoading(true);
    setSearched(true);

    try {
      const { data, error } = await supabase.rpc("global_search", {
        p_query: searchQuery,
        p_limit: 10,
        p_offset: 0,
      });

      if (error) throw error;

      const response = data as SearchResponse;
      setResults(response?.results || []);
      setTotal(response?.total || 0);
    } catch (err) {
      console.debug("[GlobalSearch] Search error:", err);
      // Fallback: show empty results
      setResults([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  const loadRecentSearches = async () => {
    try {
      const { data } = await supabase.rpc("get_recent_searches", {
        p_user_id: user!.id,
        p_limit: 5,
      });
      if (data) {
        setRecentSearches(data as RecentSearch[]);
      }
    } catch {
      // Silent
    }
  };

  const handleSelect = async (result: SearchResult) => {
    // Save to search history
    try {
      await supabase.rpc("save_search_history", {
        p_user_id: user!.id,
        p_query: query,
        p_result_type: result.result_type,
        p_result_id: result.result_id,
        p_result_title: result.title,
      });
    } catch { /* silent */ }

    onOpenChange(false);

    // Navigate based on result type
    switch (result.result_type) {
      case "incident":
        navigate(`/incidents/${result.result_id}`);
        break;
      case "evidence":
        navigate(`/evidence?highlight=${result.result_id}`);
        break;
      case "anpr":
        navigate(`/incidents/${result.ref_id || ""}?anpr=${result.result_id}`);
        break;
      case "citizen_report":
        navigate(`/review/citizen-reports?id=${result.result_id}`);
        break;
      case "person":
        navigate(`/incidents/${result.ref_id || ""}?person=${result.result_id}`);
        break;
    }
  };

  const handleSearchClick = () => {
    if (!query || query.length < 2) return;
    onOpenChange(false);
    navigate(`/search?q=${encodeURIComponent(query)}`);
  };

  const handleSuggestionClick = (suggestion: string) => {
    setQuery(suggestion);
    performSearch(suggestion);
  };

  const formatTimeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return new Date(dateStr).toLocaleDateString();
  };

  // Keyboard shortcut: Cmd+K / Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        onOpenChange(!open);
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, onOpenChange]);

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput
        placeholder="Search incidents, plates, people, evidence..."
        value={query}
        onValueChange={setQuery}
        autoFocus
      />

      <CommandList className="max-h-[400px]">
        {/* Empty state */}
        {searched && !loading && results.length === 0 && (
          <CommandEmpty>
            <div className="flex flex-col items-center py-6 text-center">
              <Search className="w-8 h-8 text-muted-foreground mb-2" />
              <p className="text-sm font-medium">No results found</p>
              <p className="text-xs text-muted-foreground mt-1">
                Try a different search term or adjust your filters
              </p>
            </div>
          </CommandEmpty>
        )}

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-6">
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          </div>
        )}

        {/* Results */}
        {results.length > 0 && (
          <CommandGroup heading={
            <div className="flex items-center justify-between">
              <span>Results ({total})</span>
              <button
                className="text-xs text-primary hover:underline flex items-center gap-1"
                onClick={handleSearchClick}
              >
                View all <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          }>
            {results.slice(0, 8).map((result) => (
              <CommandItem
                key={`${result.result_type}-${result.result_id}`}
                onSelect={() => handleSelect(result)}
                className="flex items-center gap-3 py-2.5"
              >
                <div className={`w-7 h-7 rounded-lg ${RESULT_COLORS[result.result_type] || "bg-secondary"} flex items-center justify-center shrink-0`}>
                  {RESULT_ICONS[result.result_type] || <FileText className="w-3.5 h-3.5" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium truncate">
                      {result.title || result.plate || "Untitled"}
                    </span>
                    <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-3.5 shrink-0">
                      {RESULT_LABELS[result.result_type] || result.result_type}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-muted-foreground mt-0.5">
                    {result.plate && <span className="font-mono">{result.plate}</span>}
                    {result.severity && (
                      <span className={`capitalize ${
                        result.severity === "critical" ? "text-red-500" :
                        result.severity === "serious" ? "text-amber-500" :
                        "text-muted-foreground"
                      }`}>
                        {result.severity}
                      </span>
                    )}
                    <span>{formatTimeAgo(result.created_at)}</span>
                  </div>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/40 shrink-0" />
              </CommandItem>
            ))}

            {total > 8 && (
              <CommandItem
                onSelect={handleSearchClick}
                className="text-center text-xs text-primary justify-center gap-2 py-3"
              >
                <Search className="w-3.5 h-3.5" />
                View all {total} results
              </CommandItem>
            )}
          </CommandGroup>
        )}

        {/* Suggestions (when no query) */}
        {!query && recentSearches.length === 0 && !searched && (
          <CommandGroup heading="Suggestions">
            {SEARCH_SUGGESTIONS.map((suggestion) => {
              const Icon = suggestion.icon;
              return (
                <CommandItem
                  key={suggestion.label}
                  onSelect={() => handleSuggestionClick(suggestion.query)}
                  className="flex items-center gap-3 py-2"
                >
                  <div className="w-7 h-7 rounded-lg bg-secondary flex items-center justify-center">
                    <Icon className="w-3.5 h-3.5 text-muted-foreground" />
                  </div>
                  <span className="text-sm">{suggestion.label}</span>
                </CommandItem>
              );
            })}
          </CommandGroup>
        )}

        {/* Recent searches */}
        {!query && recentSearches.length > 0 && (
          <>
            <CommandGroup heading="Recent Searches">
              {recentSearches.map((search) => (
                <CommandItem
                  key={search.id}
                  onSelect={() => {
                    setQuery(search.query);
                    performSearch(search.query);
                  }}
                  className="flex items-center gap-3 py-2"
                >
                  <div className="w-7 h-7 rounded-lg bg-secondary flex items-center justify-center">
                    <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-sm truncate block">{search.query}</span>
                    {search.result_title && (
                      <span className="text-[10px] text-muted-foreground truncate block">
                        {search.result_title}
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] text-muted-foreground shrink-0">
                    {formatTimeAgo(search.created_at)}
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>

            <CommandSeparator />

            <CommandGroup heading="Suggestions">
              {SEARCH_SUGGESTIONS.slice(0, 3).map((suggestion) => {
                const Icon = suggestion.icon;
                return (
                  <CommandItem
                    key={suggestion.label}
                    onSelect={() => handleSuggestionClick(suggestion.query)}
                    className="flex items-center gap-3 py-2"
                  >
                    <Icon className="w-3.5 h-3.5 text-muted-foreground" />
                    <span className="text-sm">{suggestion.label}</span>
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </>
        )}

        {/* Footer hint */}
        <div className="border-t border-border/50 px-3 py-2 text-[10px] text-muted-foreground flex items-center justify-between">
          <span>Search across incidents, plates, evidence & more</span>
          <span className="flex items-center gap-1">
            <kbd className="px-1 py-0.5 rounded bg-secondary text-[9px] font-mono">ESC</kbd>
            <span>close</span>
            <kbd className="px-1 py-0.5 rounded bg-secondary text-[9px] font-mono ml-2">↑↓</kbd>
            <span>navigate</span>
          </span>
        </div>
      </CommandList>
    </CommandDialog>
  );
}

// ─── Hook: useGlobalSearch ─────────────────────────────

/**
 * Hook to open the global search dialog.
 * Returns functions to open and close the search.
 *
 * Usage:
 * ```tsx
 * const search = useGlobalSearch();
 * return <button onClick={search.open}>Search</button>;
 * ```
 */
export function useGlobalSearch() {
  const [open, setOpen] = useState(false);

  return {
    open: open,
    setOpen,
    dialogProps: {
      open,
      onOpenChange: setOpen,
    } as GlobalSearchProps,
  };
}
