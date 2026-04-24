import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  Dna, X, TrendingUp, TrendingDown, Minus, ChevronRight, Sparkles,
  Trophy, Shield, Crown, Flame, Award, Download, Filter, Calendar,
  BookOpen, Lock,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { buildProgressNote, type DNAField } from "@/lib/dna/progressNotes";
import { getLessonContext, type LessonContext } from "@/lib/dna/currentLessonContext";
import { MILESTONES, evaluateMilestones, type ProgressEvent as MilestoneEvent } from "@/lib/dna/milestones";
import { exportDNAReport } from "@/lib/dna/exportReport";

/* ─── Helpers ─── */
const charToPct = (char: string | null | undefined, base: "upper" | "lower"): number => {
  if (!char) return 50;
  const code = base === "upper"
    ? char.toUpperCase().charCodeAt(0) - 65
    : char.toLowerCase().charCodeAt(0) - 97;
  return Math.max(0, Math.min(100, Math.round((code / 25) * 100)));
};

interface Snapshot {
  code: string;
  engagement: number;
  retention: number;
  retentionRaw: string;
  confidence: number;
  layer: string;
}

interface DBEvent {
  id: string;
  field: string;
  from_value: string;
  to_value: string;
  delta: number | null;
  lesson_context: LessonContext | null;
  note: string;
  created_at: string;
}

interface DBMilestone {
  milestone_key: string;
  unlocked_at: string;
}

const HIDDEN_ROUTES = ["/login", "/signup", "/onboarding", "/welcome"];
const DNA_COLORS = [
  "hsl(265 60% 55%)",
  "hsl(215 70% 50%)",
  "hsl(145 55% 45%)",
  "hsl(45 85% 50%)",
];

const FIELD_LABEL: Record<string, string> = {
  code: "DNA Code",
  layer: "Dominant Layer",
  engagement: "Engagement",
  retention: "Retention",
  confidence: "Confidence",
};

const MILESTONE_ICON: Record<string, any> = {
  spark: Sparkles, trophy: Trophy, trend: TrendingUp,
  shield: Shield, crown: Crown, flame: Flame,
};

const timeAgo = (iso: string): string => {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d ago`;
  return new Date(iso).toLocaleDateString();
};

/* ─── Main Component ─── */
const DNAProgressBubble = () => {
  const { profile, user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [open, setOpen] = useState(false);
  const [pulse, setPulse] = useState(false);
  const [events, setEvents] = useState<DBEvent[]>([]);
  const [milestones, setMilestones] = useState<DBMilestone[]>([]);
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState("overview");

  // Filters
  const [filterRange, setFilterRange] = useState<"today" | "week" | "month" | "all">("all");
  const [filterField, setFilterField] = useState<"all" | DNAField>("all");
  const [filterDirection, setFilterDirection] = useState<"all" | "up" | "down">("all");

  const lastSnapshot = useRef<Snapshot | null>(null);
  const initialLoadDone = useRef(false);

  const isHidden = HIDDEN_ROUTES.some((r) => location.pathname.startsWith(r));
  const onDnaPage = location.pathname.startsWith("/learning-dna");

  const snapshot = useMemo<Snapshot | null>(() => {
    if (!profile) return null;
    return {
      code: profile.tj_dna_code || "----",
      engagement: ((profile as any).dna_engagement ?? 5) / 9 * 100,
      retention: charToPct((profile as any).dna_retention, "upper"),
      retentionRaw: (profile as any).dna_retention || "M",
      confidence: charToPct((profile as any).dna_confidence, "lower"),
      layer: (profile as any).dna_layer_strength || "D",
    };
  }, [profile]);

  /* ── Load history once user is known ── */
  const loadHistory = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const [{ data: ev }, { data: ms }] = await Promise.all([
      supabase.from("dna_progress_events" as any)
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(500),
      supabase.from("dna_milestones" as any)
        .select("milestone_key, unlocked_at")
        .eq("user_id", user.id),
    ]);
    setEvents((ev as unknown as DBEvent[]) || []);
    setMilestones((ms as unknown as DBMilestone[]) || []);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    if (!user) return;
    loadHistory();
  }, [user, loadHistory]);

  /* ── Persist new milestones & toast ── */
  const persistNewMilestones = useCallback(async (newKeys: string[]) => {
    if (!user || newKeys.length === 0) return;
    const rows = newKeys.map((k) => ({ user_id: user.id, milestone_key: k }));
    const { error } = await (supabase.from("dna_milestones" as any) as any).insert(rows);
    if (!error) {
      newKeys.forEach((k) => {
        const def = MILESTONES.find((m) => m.key === k);
        if (def) toast({ title: `🏆 ${def.title}`, description: def.description });
      });
      loadHistory();
    }
  }, [user, toast, loadHistory]);

  /* ── Detect snapshot change → insert event ── */
  useEffect(() => {
    if (!snapshot || !user) return;
    const prev = lastSnapshot.current;
    if (!prev) {
      lastSnapshot.current = snapshot;
      return;
    }
    if (!initialLoadDone.current) {
      initialLoadDone.current = true;
      lastSnapshot.current = snapshot;
      return;
    }

    const lessonCtx = getLessonContext();
    const inserts: any[] = [];

    const push = (field: DNAField, from: string, to: string, delta: number | null) => {
      const note = buildProgressNote({
        field, delta: delta ?? 0,
        from, to, lesson: lessonCtx,
      });
      inserts.push({
        user_id: user.id,
        field,
        from_value: from,
        to_value: to,
        delta,
        lesson_context: lessonCtx,
        note,
      });
    };

    if (snapshot.code !== prev.code) push("code", prev.code, snapshot.code, null);
    if (snapshot.layer !== prev.layer) push("layer", prev.layer, snapshot.layer, null);
    const numeric: Array<{ k: "engagement" | "retention" | "confidence" }> = [
      { k: "engagement" }, { k: "retention" }, { k: "confidence" },
    ];
    numeric.forEach(({ k }) => {
      const before = Math.round(prev[k]);
      const after = Math.round(snapshot[k]);
      if (before !== after) push(k as DNAField, `${before}`, `${after}`, after - before);
    });

    if (inserts.length > 0) {
      setPulse(true);
      window.setTimeout(() => setPulse(false), 2400);
      (async () => {
        const { error } = await (supabase.from("dna_progress_events" as any) as any).insert(inserts);
        if (!error) {
          await loadHistory();
          // Re-evaluate milestones with fresh history
          const { data: fresh } = await supabase.from("dna_progress_events" as any)
            .select("field, delta, from_value, to_value, lesson_context, created_at")
            .eq("user_id", user.id)
            .order("created_at", { ascending: true });
          const unlocked = new Set(milestones.map((m) => m.milestone_key));
          const newly = evaluateMilestones((fresh as unknown as MilestoneEvent[]) || [], unlocked);
          if (newly.length > 0) persistNewMilestones(newly);
        }
      })();
    }
    lastSnapshot.current = snapshot;
  }, [snapshot, user, milestones, loadHistory, persistNewMilestones]);

  /* ── Filtered events ── */
  const filteredEvents = useMemo(() => {
    const now = Date.now();
    const cutoff =
      filterRange === "today" ? now - 86_400_000 :
      filterRange === "week" ? now - 7 * 86_400_000 :
      filterRange === "month" ? now - 30 * 86_400_000 :
      0;
    return events.filter((e) => {
      if (cutoff && new Date(e.created_at).getTime() < cutoff) return false;
      if (filterField !== "all" && e.field !== filterField) return false;
      if (filterDirection !== "all") {
        const d = e.delta ?? 0;
        if (filterDirection === "up" && d <= 0) return false;
        if (filterDirection === "down" && d >= 0) return false;
      }
      return true;
    });
  }, [events, filterRange, filterField, filterDirection]);

  /* ── Lessons grouped ── */
  const lessonGroups = useMemo(() => {
    const map = new Map<string, { title: string; events: DBEvent[] }>();
    filteredEvents.forEach((e) => {
      const tid = e.lesson_context?.term_id || "no-lesson";
      const title = e.lesson_context?.term_title || "Outside a lesson";
      if (!map.has(tid)) map.set(tid, { title, events: [] });
      map.get(tid)!.events.push(e);
    });
    return Array.from(map.values());
  }, [filteredEvents]);

  if (!user || !profile || isHidden || onDnaPage) return null;
  if (!snapshot) return null;

  const unlockedKeys = new Set(milestones.map((m) => m.milestone_key));

  const bars = [
    { label: "Engagement", value: snapshot.engagement, color: "hsl(215 70% 55%)" },
    { label: "Retention", value: snapshot.retention, color: "hsl(265 60% 60%)" },
    { label: "Confidence", value: snapshot.confidence, color: "hsl(145 55% 50%)" },
  ];

  const handleExport = () => {
    exportDNAReport({
      studentName: profile.name || "Student",
      dnaCode: snapshot.code,
      engagement: snapshot.engagement,
      retention: snapshot.retention,
      confidence: snapshot.confidence,
      events: filteredEvents.map((e) => ({
        created_at: e.created_at,
        field: e.field,
        from_value: e.from_value,
        to_value: e.to_value,
        delta: e.delta,
        note: e.note,
        lesson_context: e.lesson_context,
      })),
      unlockedMilestoneKeys: Array.from(unlockedKeys),
    });
    toast({ title: "Report ready", description: "Your DNA progress report has been downloaded." });
  };

  return (
    <>
      {/* Floating bubble */}
      <motion.button
        initial={{ opacity: 0, scale: 0.6 }}
        animate={{ opacity: 1, scale: 1 }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setOpen(true)}
        aria-label="Open DNA progress"
        className="fixed z-[60] rounded-full flex items-center justify-center"
        style={{
          bottom: "5.5rem", right: "1rem", width: 56, height: 56,
          background: "linear-gradient(135deg, hsl(265 60% 35%), hsl(215 70% 35%))",
          border: "1.5px solid hsl(265 60% 65% / 0.5)",
          boxShadow: pulse
            ? "0 0 0 6px hsl(145 70% 55% / 0.25), 0 8px 24px hsl(265 60% 30% / 0.5)"
            : "0 8px 24px hsl(265 60% 20% / 0.45)",
          transition: "box-shadow 0.4s ease",
        }}
      >
        <Dna className="h-6 w-6 text-white" />
        <motion.span
          animate={{ opacity: [1, 0.3, 1] }}
          transition={{ duration: 1.6, repeat: Infinity }}
          className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full"
          style={{ background: "hsl(145 70% 55%)", boxShadow: "0 0 8px hsl(145 70% 55%)" }}
        />
        <AnimatePresence>
          {pulse && (
            <motion.span
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              className="absolute -top-1 -left-1 px-1.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider flex items-center gap-0.5"
              style={{ background: "hsl(145 70% 50%)", color: "white" }}
            >
              <Sparkles className="h-2.5 w-2.5" /> DNA+
            </motion.span>
          )}
        </AnimatePresence>
      </motion.button>

      {/* Full Panel */}
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-[59] bg-black/60 backdrop-blur-sm"
              onClick={() => setOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 40 }}
              transition={{ duration: 0.25 }}
              className="fixed z-[60] flex flex-col overflow-hidden right-0 top-0 bottom-0 w-full sm:w-[440px]"
              style={{
                background: "linear-gradient(160deg, hsl(240 25% 9%), hsl(265 25% 11%))",
                borderLeft: "1px solid hsl(265 40% 40% / 0.4)",
                boxShadow: "-20px 0 60px hsl(0 0% 0% / 0.5)",
              }}
            >
              {/* Header */}
              <div className="p-4 flex items-center justify-between gap-2 border-b shrink-0"
                style={{ borderColor: "hsl(265 40% 40% / 0.25)" }}>
                <div className="flex items-center gap-3 min-w-0">
                  <div className="p-2 rounded-lg" style={{ background: "hsl(265 60% 55% / 0.25)" }}>
                    <Dna className="h-5 w-5" style={{ color: "hsl(265 70% 80%)" }} />
                  </div>
                  <div className="min-w-0">
                    <div className="text-[10px] font-bold uppercase tracking-widest text-white/50">
                      My Live DNA Progress
                    </div>
                    <div className="flex items-center gap-1 mt-1">
                      {snapshot.code.split("").slice(0, 4).map((ch, i) => (
                        <span
                          key={i}
                          className="font-bold text-xs w-6 h-6 rounded flex items-center justify-center text-white"
                          style={{ background: DNA_COLORS[i] || DNA_COLORS[0] }}
                        >{ch}</span>
                      ))}
                    </div>
                  </div>
                </div>
                <button onClick={() => setOpen(false)} className="p-2 rounded-md hover:bg-white/10" aria-label="Close">
                  <X className="h-4 w-4 text-white/70" />
                </button>
              </div>

              {/* Tabs */}
              <Tabs value={tab} onValueChange={setTab} className="flex-1 flex flex-col overflow-hidden">
                <TabsList className="grid grid-cols-5 mx-3 mt-3 bg-white/5 shrink-0">
                  <TabsTrigger value="overview" className="text-[10px]">Overview</TabsTrigger>
                  <TabsTrigger value="timeline" className="text-[10px]">Timeline</TabsTrigger>
                  <TabsTrigger value="lessons" className="text-[10px]">Lessons</TabsTrigger>
                  <TabsTrigger value="milestones" className="text-[10px]">Awards</TabsTrigger>
                  <TabsTrigger value="export" className="text-[10px]">Export</TabsTrigger>
                </TabsList>

                <div className="flex-1 overflow-y-auto p-4">
                  {/* OVERVIEW */}
                  <TabsContent value="overview" className="mt-0 space-y-4">
                    <div className="space-y-3">
                      {bars.map((b) => (
                        <div key={b.label}>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-[11px] font-semibold uppercase tracking-wider text-white/70">
                              {b.label}
                            </span>
                            <span className="text-xs font-bold" style={{ color: b.color }}>
                              {Math.round(b.value)} / 100
                            </span>
                          </div>
                          <div className="h-2.5 rounded-full overflow-hidden bg-white/10">
                            <motion.div
                              key={`${b.label}-${Math.round(b.value)}`}
                              initial={{ width: 0 }}
                              animate={{ width: `${b.value}%` }}
                              transition={{ duration: 0.7 }}
                              className="h-full rounded-full"
                              style={{ background: b.color, boxShadow: `0 0 8px ${b.color}` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="rounded-xl p-3 border border-white/10 bg-white/5">
                      <div className="text-[10px] font-bold uppercase tracking-widest text-white/50 mb-2">
                        What changed today
                      </div>
                      {(() => {
                        const today = events.filter((e) =>
                          Date.now() - new Date(e.created_at).getTime() < 86_400_000);
                        if (today.length === 0) {
                          return <div className="text-xs text-white/60">
                            No DNA changes yet today. Complete a lesson and your DNA will react in real time.
                          </div>;
                        }
                        return <ul className="space-y-2">
                          {today.slice(0, 4).map((e) => (
                            <li key={e.id} className="text-xs text-white/85 leading-relaxed">
                              {e.note}
                            </li>
                          ))}
                        </ul>;
                      })()}
                    </div>

                    <button
                      onClick={() => { setOpen(false); navigate("/learning-dna"); }}
                      className="w-full py-3 rounded-xl flex items-center justify-between px-4 text-[11px] font-bold uppercase tracking-wider text-white/85"
                      style={{ background: "hsl(265 60% 55% / 0.18)", border: "1px solid hsl(265 60% 55% / 0.3)" }}
                    >
                      <span>Open My Learning DNA Hub</span>
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </TabsContent>

                  {/* TIMELINE */}
                  <TabsContent value="timeline" className="mt-0">
                    <FilterBar
                      filterRange={filterRange} setFilterRange={setFilterRange}
                      filterField={filterField} setFilterField={setFilterField}
                      filterDirection={filterDirection} setFilterDirection={setFilterDirection}
                    />
                    {loading ? (
                      <div className="text-xs text-white/50 text-center py-6">Loading…</div>
                    ) : filteredEvents.length === 0 ? (
                      <EmptyState text="No events match these filters yet." />
                    ) : (
                      <ul className="space-y-2">
                        {filteredEvents.map((e) => <EventRow key={e.id} event={e} />)}
                      </ul>
                    )}
                  </TabsContent>

                  {/* LESSONS */}
                  <TabsContent value="lessons" className="mt-0">
                    <FilterBar
                      filterRange={filterRange} setFilterRange={setFilterRange}
                      filterField={filterField} setFilterField={setFilterField}
                      filterDirection={filterDirection} setFilterDirection={setFilterDirection}
                    />
                    {lessonGroups.length === 0 ? (
                      <EmptyState text="No lesson-tagged DNA changes yet. Start a lesson to see them here." />
                    ) : (
                      <div className="space-y-3">
                        {lessonGroups.map((g, i) => (
                          <div key={i} className="rounded-xl border border-white/10 overflow-hidden">
                            <div className="p-2.5 flex items-center gap-2"
                              style={{ background: "hsl(265 30% 18% / 0.55)" }}>
                              <BookOpen className="h-3.5 w-3.5 text-white/70" />
                              <span className="text-xs font-semibold text-white/90 truncate">{g.title}</span>
                              <span className="ml-auto text-[10px] text-white/50">{g.events.length} change{g.events.length === 1 ? "" : "s"}</span>
                            </div>
                            <ul className="divide-y divide-white/5">
                              {g.events.map((e) => <EventRow key={e.id} event={e} compact />)}
                            </ul>
                          </div>
                        ))}
                      </div>
                    )}
                  </TabsContent>

                  {/* MILESTONES */}
                  <TabsContent value="milestones" className="mt-0">
                    <div className="grid grid-cols-1 gap-2.5">
                      {MILESTONES.map((m) => {
                        const isUnlocked = unlockedKeys.has(m.key);
                        const Icon = MILESTONE_ICON[m.icon] || Award;
                        return (
                          <div
                            key={m.key}
                            className="rounded-xl p-3 flex items-center gap-3 border"
                            style={{
                              borderColor: isUnlocked ? `${m.color.replace(")", " / 0.5)")}` : "hsl(0 0% 100% / 0.08)",
                              background: isUnlocked
                                ? `linear-gradient(135deg, ${m.color.replace(")", " / 0.18)")}, hsl(265 25% 16% / 0.55))`
                                : "hsl(265 25% 14% / 0.4)",
                              opacity: isUnlocked ? 1 : 0.55,
                            }}
                          >
                            <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                              style={{ background: isUnlocked ? m.color : "hsl(0 0% 100% / 0.06)" }}>
                              {isUnlocked
                                ? <Icon className="h-5 w-5 text-white" />
                                : <Lock className="h-4 w-4 text-white/50" />}
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="text-[11px] font-bold text-white">{m.title}</div>
                              <div className="text-[10px] text-white/65 leading-snug mt-0.5">{m.description}</div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </TabsContent>

                  {/* EXPORT */}
                  <TabsContent value="export" className="mt-0 space-y-4">
                    <div className="rounded-xl p-4 border border-white/10 bg-white/5">
                      <div className="text-sm font-bold text-white mb-1">Download your progress</div>
                      <div className="text-xs text-white/65 leading-relaxed">
                        Export a polished PDF report of your DNA progress, every change tagged by lesson,
                        and milestones unlocked. Great for sharing with an instructor or keeping for yourself.
                        Filters from Timeline / Lessons apply.
                      </div>
                    </div>
                    <Button onClick={handleExport} className="w-full" size="lg">
                      <Download className="h-4 w-4 mr-2" /> Download DNA Report (PDF)
                    </Button>
                    <div className="text-[10px] text-white/45 text-center">
                      {filteredEvents.length} events • {unlockedKeys.size} milestones
                    </div>
                  </TabsContent>
                </div>
              </Tabs>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

/* ─── Sub-components ─── */
const FilterBar = ({
  filterRange, setFilterRange,
  filterField, setFilterField,
  filterDirection, setFilterDirection,
}: any) => (
  <div className="mb-3 space-y-2">
    <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-white/55">
      <Filter className="h-3 w-3" /> Filters
    </div>
    <div className="flex flex-wrap gap-1">
      {[
        { v: "today", l: "Today" }, { v: "week", l: "Week" },
        { v: "month", l: "Month" }, { v: "all", l: "All time" },
      ].map((o) => (
        <button key={o.v} onClick={() => setFilterRange(o.v)}
          className={`text-[10px] px-2 py-1 rounded-full border transition-colors ${
            filterRange === o.v ? "bg-white/15 border-white/30 text-white" : "border-white/10 text-white/60"
          }`}>{o.l}</button>
      ))}
    </div>
    <div className="flex flex-wrap gap-1">
      {[
        { v: "all", l: "All metrics" }, { v: "code", l: "Code" }, { v: "engagement", l: "Engage" },
        { v: "retention", l: "Retain" }, { v: "confidence", l: "Confid" }, { v: "layer", l: "Layer" },
      ].map((o) => (
        <button key={o.v} onClick={() => setFilterField(o.v as any)}
          className={`text-[10px] px-2 py-1 rounded-full border transition-colors ${
            filterField === o.v ? "bg-white/15 border-white/30 text-white" : "border-white/10 text-white/60"
          }`}>{o.l}</button>
      ))}
    </div>
    <div className="flex flex-wrap gap-1">
      {[
        { v: "all", l: "Any direction" }, { v: "up", l: "Improved ↑" }, { v: "down", l: "Declined ↓" },
      ].map((o) => (
        <button key={o.v} onClick={() => setFilterDirection(o.v as any)}
          className={`text-[10px] px-2 py-1 rounded-full border transition-colors ${
            filterDirection === o.v ? "bg-white/15 border-white/30 text-white" : "border-white/10 text-white/60"
          }`}>{o.l}</button>
      ))}
    </div>
  </div>
);

const EventRow = ({ event, compact = false }: { event: DBEvent; compact?: boolean }) => {
  const d = event.delta ?? 0;
  const Icon = d > 0 ? TrendingUp : d < 0 ? TrendingDown : Minus;
  const accent = d > 0 ? "hsl(145 70% 55%)" : d < 0 ? "hsl(15 75% 60%)" : "hsl(45 85% 60%)";
  const lessonLabel = [event.lesson_context?.term_title, event.lesson_context?.step_label]
    .filter(Boolean).join(" • ");
  return (
    <li
      className={`${compact ? "p-2.5" : "rounded-lg p-2.5"} flex gap-2.5 items-start`}
      style={compact ? {} : { background: "hsl(265 25% 16% / 0.55)", border: "1px solid hsl(0 0% 100% / 0.08)" }}
    >
      <span className="w-7 h-7 rounded-md flex items-center justify-center shrink-0 mt-0.5"
        style={{ background: `${accent.replace(")", " / 0.18)")}`, color: accent }}>
        <Icon className="h-3.5 w-3.5" />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="text-[10px] font-bold uppercase tracking-wider text-white/55">
            {FIELD_LABEL[event.field] || event.field}
          </span>
          <span className="text-[10px] text-white/40">{timeAgo(event.created_at)}</span>
        </div>
        <div className="text-[11px] font-semibold text-white/90">
          {event.from_value} → <span style={{ color: accent }}>{event.to_value}</span>
          {d !== 0 && <span className="ml-1 text-[10px] font-bold" style={{ color: accent }}>
            ({d > 0 ? "+" : ""}{d})
          </span>}
        </div>
        {event.note && (
          <div className="text-[11px] text-white/70 leading-snug mt-1">{event.note}</div>
        )}
        {lessonLabel && (
          <div className="text-[10px] text-white/45 mt-1 flex items-center gap-1">
            <BookOpen className="h-2.5 w-2.5" /> {lessonLabel}
          </div>
        )}
      </div>
    </li>
  );
};

const EmptyState = ({ text }: { text: string }) => (
  <div className="rounded-lg p-4 text-[11px] text-white/55 text-center"
    style={{ border: "1px dashed hsl(265 40% 45% / 0.3)", background: "hsl(265 30% 18% / 0.4)" }}>
    {text}
  </div>
);

export default DNAProgressBubble;
