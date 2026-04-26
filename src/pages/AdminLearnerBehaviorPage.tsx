import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import AppHeader from "@/components/AppHeader";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Lock, Search, Download, Users } from "lucide-react";

type Row = {
  user_id: string;
  user_name: string;
  term_id: string;
  term_name: string;
  section_id: string | null;
  section_name: string | null;
  block_number: number | null;
  chapter_label: string | null;
  confidence_rating: number | null;
  understanding_status: string | null;
  preferred_thinking_path: string | null;
  error_type: string | null;
  second_chance_behavior: string | null;
  recovery_pattern: string | null;
  most_skipped_layer: string | null;
  breakdown_point: string | null;
  cognitive_load: string | null;
  preferred_mode: string | null;
  mastery_status: string | null;
  last_reviewed_at: string | null;
  review_due_at: string | null;
  incorrect_attempts: number | null;
  reflection_skips: number | null;
  memory_anchor_skips: number | null;
  quiz_avoidance_count: number | null;
};

const FILTERS = [
  { key: "needs_support", label: "Needs support" },
  { key: "high_cognitive_load", label: "High cognitive load" },
  { key: "strong_misconception", label: "Strong misconception" },
  { key: "fragile_understanding", label: "Fragile understanding" },
  { key: "skipped_reflection", label: "Skipped reflection" },
  { key: "skipped_memory_anchor", label: "Skipped memory anchor" },
  { key: "quiz_avoidance", label: "Quiz avoidance" },
  { key: "mastered", label: "Mastered" },
  { key: "needs_review", label: "Needs review" },
] as const;

type FilterKey = typeof FILTERS[number]["key"];

const matchesFilter = (r: Row, key: FilterKey): boolean => {
  switch (key) {
    case "needs_support":
      return (r.incorrect_attempts ?? 0) >= 2 || r.cognitive_load === "high" || r.understanding_status === "still_confused";
    case "high_cognitive_load":
      return r.cognitive_load === "high";
    case "strong_misconception":
      return r.error_type === "misconception" || r.error_type === "wrong_concept" || (r.incorrect_attempts ?? 0) >= 3;
    case "fragile_understanding":
      return (r.confidence_rating ?? 5) <= 2 && r.understanding_status !== "still_confused";
    case "skipped_reflection":
      return (r.reflection_skips ?? 0) >= 1;
    case "skipped_memory_anchor":
      return (r.memory_anchor_skips ?? 0) >= 1;
    case "quiz_avoidance":
      return (r.quiz_avoidance_count ?? 0) >= 1;
    case "mastered":
      return (r.mastery_status ?? "").toLowerCase().startsWith("master");
    case "needs_review":
      return !!r.review_due_at && new Date(r.review_due_at) <= new Date();
  }
};

const cell = (v: string | number | null | undefined, fallback = "—") => {
  if (v === null || v === undefined || v === "") return <span className="text-muted-foreground/60">{fallback}</span>;
  return <span>{v}</span>;
};

const masteryColor = (status: string | null) => {
  const s = (status ?? "").toLowerCase();
  if (s.startsWith("master")) return "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30";
  if (s.includes("strong")) return "bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-500/30";
  if (s.includes("weak") || s.includes("confus")) return "bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30";
  return "bg-muted text-muted-foreground border-border";
};

const loadColor = (load: string | null) => {
  if (load === "high") return "bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30";
  if (load === "moderate") return "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30";
  if (load === "low") return "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30";
  return "bg-muted text-muted-foreground border-border";
};

const fmtDate = (iso: string | null) => {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
};

const AdminLearnerBehaviorPage = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [userFilter, setUserFilter] = useState<string>("all");
  const [chapterFilter, setChapterFilter] = useState<string>("all");
  const [activeFilters, setActiveFilters] = useState<Set<FilterKey>>(new Set());

  // Role check
  useEffect(() => {
    if (authLoading) return;
    if (!user) { navigate("/login"); return; }
    supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .maybeSingle()
      .then(({ data }) => setIsAdmin(!!data));
  }, [user, authLoading, navigate]);

  // Load aggregated data via RPC (admin-gated SECURITY DEFINER function)
  useEffect(() => {
    if (!isAdmin) return;
    (async () => {
      setLoading(true);
      setError(null);
      const { data, error } = await (supabase as any).rpc("admin_learner_behavior");
      if (error) setError(error.message);
      else setRows((data ?? []) as Row[]);
      setLoading(false);
    })();
  }, [isAdmin]);

  const users = useMemo(() => {
    const m = new Map<string, string>();
    rows.forEach((r) => m.set(r.user_id, r.user_name));
    return Array.from(m.entries()).map(([id, name]) => ({ id, name })).sort((a, b) => a.name.localeCompare(b.name));
  }, [rows]);

  const chapters = useMemo(() => {
    const s = new Set<string>();
    rows.forEach((r) => r.chapter_label && s.add(r.chapter_label));
    return Array.from(s).sort();
  }, [rows]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((r) => {
      if (userFilter !== "all" && r.user_id !== userFilter) return false;
      if (chapterFilter !== "all" && r.chapter_label !== chapterFilter) return false;
      if (q) {
        const blob = `${r.user_name} ${r.term_name} ${r.chapter_label ?? ""}`.toLowerCase();
        if (!blob.includes(q)) return false;
      }
      for (const f of activeFilters) {
        if (!matchesFilter(r, f)) return false;
      }
      return true;
    });
  }, [rows, search, userFilter, chapterFilter, activeFilters]);

  const toggleFilter = (key: FilterKey) => {
    setActiveFilters((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  };

  const exportCsv = () => {
    const header = [
      "User", "Term", "Chapter", "Confidence", "Understanding", "Thinking path",
      "Error type", "Second chance", "Recovery pattern", "Most skipped layer",
      "Breakdown point", "Cognitive load", "Preferred mode", "Mastery", "Review due",
    ];
    const csv = [header.join(",")].concat(
      filtered.map((r) => [
        r.user_name, r.term_name, r.chapter_label ?? "",
        r.confidence_rating ?? "", r.understanding_status ?? "", r.preferred_thinking_path ?? "",
        r.error_type ?? "", r.second_chance_behavior ?? "", r.recovery_pattern ?? "",
        r.most_skipped_layer ?? "", r.breakdown_point ?? "", r.cognitive_load ?? "",
        r.preferred_mode ?? "", r.mastery_status ?? "", fmtDate(r.review_due_at),
      ].map((v) => `"${String(v).replace(/"/g, '""')}"`).join(","))
    ).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `learner-behavior-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (authLoading || isAdmin === null) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen">
        <AppHeader />
        <div className="max-w-md mx-auto px-4 py-20 text-center">
          <Lock className="h-10 w-10 mx-auto mb-4 text-muted-foreground" />
          <h1 className="font-display text-2xl font-bold mb-2">Admin only</h1>
          <p className="text-sm text-muted-foreground">
            You need an admin role to view learner behavior. Ask the platform owner to grant access.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <AppHeader />
      <div className="max-w-[1400px] mx-auto px-4 py-6">
        <header className="mb-6">
          <h1 className="font-display text-3xl font-bold flex items-center gap-2">
            <Users className="h-7 w-7 text-primary" />
            Learner Behavior
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            One row per learner × term. Use this to see how learners are behaving before the full DNA Code engine is connected.
          </p>
        </header>

        {/* Top controls */}
        <Card className="mb-4">
          <CardContent className="p-4 space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative flex-1 min-w-[220px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search learner, term, or chapter…"
                  className="pl-9"
                />
              </div>
              <Select value={userFilter} onValueChange={setUserFilter}>
                <SelectTrigger className="w-[200px]"><SelectValue placeholder="User" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All users</SelectItem>
                  {users.map((u) => <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={chapterFilter} onValueChange={setChapterFilter}>
                <SelectTrigger className="w-[260px]"><SelectValue placeholder="Chapter" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All chapters</SelectItem>
                  {chapters.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
              <Button variant="outline" size="sm" onClick={exportCsv}>
                <Download className="h-4 w-4 mr-2" />Export CSV
              </Button>
            </div>

            <div className="flex flex-wrap gap-2 pt-1">
              {FILTERS.map((f) => {
                const active = activeFilters.has(f.key);
                return (
                  <button
                    key={f.key}
                    type="button"
                    onClick={() => toggleFilter(f.key)}
                    className={`text-xs px-3 py-1.5 rounded-full border transition ${
                      active
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-background text-foreground border-border hover:bg-muted"
                    }`}
                  >
                    {f.label}
                  </button>
                );
              })}
              {activeFilters.size > 0 && (
                <button
                  type="button"
                  onClick={() => setActiveFilters(new Set())}
                  className="text-xs px-3 py-1.5 rounded-full text-muted-foreground hover:text-foreground"
                >
                  Clear filters
                </button>
              )}
            </div>

            <div className="text-xs text-muted-foreground">
              Showing <strong>{filtered.length}</strong> of {rows.length} learner-term records
            </div>
          </CardContent>
        </Card>

        {error && (
          <Card className="mb-4 border-destructive/40">
            <CardContent className="p-4 text-sm text-destructive">{error}</CardContent>
          </Card>
        )}

        {/* Table */}
        <Card>
          <CardContent className="p-0">
            {loading ? (
              <div className="p-12 flex justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : filtered.length === 0 ? (
              <div className="p-12 text-center text-sm text-muted-foreground">
                No learner-term records match these filters yet.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50 text-xs uppercase tracking-wide text-muted-foreground sticky top-0">
                    <tr>
                      <th className="text-left px-3 py-2 font-medium">User</th>
                      <th className="text-left px-3 py-2 font-medium">Term</th>
                      <th className="text-left px-3 py-2 font-medium">Chapter</th>
                      <th className="text-left px-3 py-2 font-medium">Confidence</th>
                      <th className="text-left px-3 py-2 font-medium">Understanding</th>
                      <th className="text-left px-3 py-2 font-medium">Thinking path</th>
                      <th className="text-left px-3 py-2 font-medium">Error type</th>
                      <th className="text-left px-3 py-2 font-medium">2nd chance</th>
                      <th className="text-left px-3 py-2 font-medium">Recovery</th>
                      <th className="text-left px-3 py-2 font-medium">Most skipped</th>
                      <th className="text-left px-3 py-2 font-medium">Breakdown</th>
                      <th className="text-left px-3 py-2 font-medium">Cog. load</th>
                      <th className="text-left px-3 py-2 font-medium">Mode</th>
                      <th className="text-left px-3 py-2 font-medium">Mastery</th>
                      <th className="text-left px-3 py-2 font-medium">Review due</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((r, i) => (
                      <tr key={`${r.user_id}-${r.term_id}`} className={i % 2 === 0 ? "bg-background" : "bg-muted/20"}>
                        <td className="px-3 py-2 whitespace-nowrap font-medium">{r.user_name}</td>
                        <td className="px-3 py-2 whitespace-nowrap">{r.term_name}</td>
                        <td className="px-3 py-2 whitespace-nowrap text-muted-foreground">{r.chapter_label ?? "—"}</td>
                        <td className="px-3 py-2">{cell(r.confidence_rating)}</td>
                        <td className="px-3 py-2">{cell(r.understanding_status)}</td>
                        <td className="px-3 py-2">{cell(r.preferred_thinking_path)}</td>
                        <td className="px-3 py-2">{cell(r.error_type)}</td>
                        <td className="px-3 py-2">{cell(r.second_chance_behavior)}</td>
                        <td className="px-3 py-2">{cell(r.recovery_pattern)}</td>
                        <td className="px-3 py-2">{cell(r.most_skipped_layer)}</td>
                        <td className="px-3 py-2">{cell(r.breakdown_point)}</td>
                        <td className="px-3 py-2">
                          {r.cognitive_load
                            ? <Badge variant="outline" className={loadColor(r.cognitive_load)}>{r.cognitive_load}</Badge>
                            : <span className="text-muted-foreground/60">—</span>}
                        </td>
                        <td className="px-3 py-2">{cell(r.preferred_mode)}</td>
                        <td className="px-3 py-2">
                          <Badge variant="outline" className={masteryColor(r.mastery_status)}>{r.mastery_status ?? "New"}</Badge>
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap">{fmtDate(r.review_due_at)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminLearnerBehaviorPage;
