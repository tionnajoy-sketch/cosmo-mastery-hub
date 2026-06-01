import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Sparkles, Network, Layers, Lock, CheckCircle2, Circle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import PathwayGraph, { type PathwayLesson } from "@/components/knowledge-web/PathwayGraph";

interface ClusterLesson {
  id: string;
  slug: string;
  title: string;
  cluster: string | null;
  purpose: string | null;
  accent_color: string | null;
  related_concepts: string[] | null;
  prerequisites: string[] | null;
  display_order: number | null;
}

const CLUSTER_NAME = "Skin Structure & Growth";
const CLUSTER_INTENT =
  "The foundation of every service you'll ever perform. Ten lessons, woven together, building the way you see skin forever.";

type Mastery = "not_started" | "in_progress" | "mastered";

export default function SkinStructureClusterPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [lessons, setLessons] = useState<ClusterLesson[]>([]);
  const [masteryBySlug, setMasteryBySlug] = useState<Record<string, Mastery>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from("tj_lessons" as any)
        .select("id,slug,title,cluster,purpose,accent_color,related_concepts,prerequisites,display_order")
        .eq("cluster", CLUSTER_NAME)
        .order("display_order", { ascending: true });
      if (error) toast.error("Couldn't load cluster");
      const rows = (data as unknown as ClusterLesson[]) ?? [];
      setLessons(rows);

      if (user && rows.length) {
        const slugs = rows.map((r) => r.slug);
        const { data: refl } = await supabase
          .from("tj_reflection_responses" as any)
          .select("lesson_slug")
          .eq("user_id", user.id)
          .in("lesson_slug", slugs);
        const m: Record<string, Mastery> = {};
        rows.forEach((r) => { m[r.slug] = "not_started"; });
        (refl as any[] | null)?.forEach((row) => { m[row.lesson_slug] = "in_progress"; });
        setMasteryBySlug(m);
      }
      setLoading(false);
    })();
  }, [user]);

  const titleBySlug = Object.fromEntries(lessons.map((l) => [l.slug, l.title]));

  const pathwayLessons: PathwayLesson[] = lessons.map((l) => ({
    slug: l.slug,
    title: l.title,
    accent_color: l.accent_color,
    prerequisites: l.prerequisites,
    related_concepts: l.related_concepts,
    display_order: l.display_order,
    mastery: masteryBySlug[l.slug] ?? "not_started",
    purpose: l.purpose,
  }));

  const isUnlocked = (l: ClusterLesson) => {
    const prereqs = l.prerequisites ?? [];
    if (prereqs.length === 0) return true;
    return prereqs.every((p) => masteryBySlug[p] && masteryBySlug[p] !== "not_started");
  };

  const masteredCount = Object.values(masteryBySlug).filter((m) => m === "mastered").length;
  const startedCount = Object.values(masteryBySlug).filter((m) => m !== "not_started").length;

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-background text-muted-foreground">Loading cluster…</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/40">
      {/* Hero */}
      <header className="max-w-5xl mx-auto px-5 pt-12 pb-6 text-center">
        <div className="inline-flex items-center gap-2 mb-4 px-3 py-1 rounded-full bg-foreground text-background text-[11px] uppercase tracking-[0.2em] font-semibold">
          <Sparkles className="h-3 w-3" /> TJ Anderson Layer Method™ · Deep Learning™
        </div>
        <h1 className="font-display text-4xl sm:text-5xl font-bold text-foreground tracking-tight">{CLUSTER_NAME}</h1>
        <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">{CLUSTER_INTENT}</p>

        <div className="mt-6 inline-flex items-center gap-6 text-xs uppercase tracking-[0.18em] text-muted-foreground">
          <span className="inline-flex items-center gap-1.5"><Layers className="h-3.5 w-3.5" /> 10 layered lessons</span>
          <span className="inline-flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /> {masteredCount} mastered</span>
          <span className="inline-flex items-center gap-1.5"><Circle className="h-3.5 w-3.5" /> {startedCount}/10 started</span>
        </div>
      </header>

      {/* Knowledge Web */}
      <section className="max-w-5xl mx-auto px-5">
        <div className="flex items-center gap-2 mb-3 text-xs uppercase tracking-[0.2em] text-muted-foreground">
          <Network className="h-3.5 w-3.5" /> Knowledge Web™ — Learning Pathway
        </div>
        <PathwayGraph lessons={pathwayLessons} onSelect={(s) => navigate(`/lesson/${s}`)} />
        <p className="text-xs text-muted-foreground text-center mt-3">
          Foundation flows left → right. Solid arrows show prerequisites. Dotted lines show related concepts.
        </p>
      </section>

      {/* 10-layer lesson list with prerequisites */}
      <section className="max-w-5xl mx-auto px-5 mt-12 pb-16">
        <div className="flex items-end justify-between mb-5">
          <div>
            <h2 className="font-display text-2xl font-semibold text-foreground">The 10 Layers</h2>
            <p className="text-sm text-muted-foreground mt-1">Each layer builds on the one before it. Tap any unlocked lesson to begin.</p>
          </div>
        </div>

        <ol className="space-y-3">
          {lessons.map((l, idx) => {
            const color = l.accent_color || "hsl(var(--foreground))";
            const unlocked = isUnlocked(l);
            const mastery = masteryBySlug[l.slug] ?? "not_started";
            const prereqs = l.prerequisites ?? [];

            return (
              <motion.li
                key={l.slug}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.03 }}
              >
                <Card
                  onClick={() => unlocked && navigate(`/lesson/${l.slug}`)}
                  className={`relative overflow-hidden border-border/60 transition-all group ${
                    unlocked ? "cursor-pointer hover:shadow-xl hover:border-border" : "opacity-60"
                  }`}
                >
                  <div className="flex">
                    <div
                      className="w-1.5 flex-shrink-0"
                      style={{ backgroundColor: color }}
                    />
                    <div className="p-5 flex-1 flex items-start gap-4">
                      {/* Layer number badge */}
                      <div
                        className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 font-display text-lg font-bold"
                        style={{ background: `${color}15`, color }}
                      >
                        {String(l.display_order ?? idx + 1).padStart(2, "0")}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <h3 className="font-display text-lg font-bold text-card-foreground">{l.title}</h3>
                          {mastery === "mastered" && (
                            <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-0 text-[10px]">
                              <CheckCircle2 className="h-3 w-3 mr-1" /> Mastered
                            </Badge>
                          )}
                          {mastery === "in_progress" && (
                            <Badge variant="outline" className="text-[10px]">In progress</Badge>
                          )}
                          {!unlocked && (
                            <Badge variant="outline" className="text-[10px] gap-1">
                              <Lock className="h-3 w-3" /> Locked
                            </Badge>
                          )}
                        </div>

                        <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2">{l.purpose}</p>

                        {/* Prerequisites */}
                        <div className="mt-3 flex items-center gap-2 flex-wrap text-[11px]">
                          <span className="uppercase tracking-wider text-muted-foreground/70 font-semibold">Builds on:</span>
                          {prereqs.length === 0 ? (
                            <span className="text-muted-foreground italic">Starting point — no prerequisites</span>
                          ) : (
                            prereqs.map((p) => (
                              <button
                                key={p}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (titleBySlug[p]) navigate(`/lesson/${p}`);
                                }}
                                className="px-2 py-0.5 rounded-md bg-muted hover:bg-muted/70 text-foreground font-medium transition-colors"
                              >
                                {titleBySlug[p] ?? p}
                              </button>
                            ))
                          )}
                        </div>
                      </div>

                      <ArrowRight
                        className={`h-5 w-5 flex-shrink-0 mt-2 transition-transform ${
                          unlocked ? "group-hover:translate-x-1" : ""
                        }`}
                        style={{ color }}
                      />
                    </div>
                  </div>
                </Card>
              </motion.li>
            );
          })}
        </ol>

        <div className="mt-10 text-center">
          <Button variant="ghost" onClick={() => navigate("/")}>Back to home</Button>
        </div>
      </section>

      <footer className="pb-10 text-center text-[11px] text-muted-foreground">
        © Tionna Anderson · TJ Anderson Layer Method™ · Knowledge Web Learning™
      </footer>
    </div>
  );
}
