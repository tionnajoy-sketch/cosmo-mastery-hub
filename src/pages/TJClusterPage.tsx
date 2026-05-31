import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Sparkles, Network } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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

const CLUSTER_TITLES: Record<string, { title: string; intent: string }> = {
  "skin-structure-and-growth": {
    title: "Skin Structure & Growth",
    intent: "The foundation of every service you'll ever perform. Ten lessons, woven together, building the way you see skin forever.",
  },
};

function slugify(s: string) {
  return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export default function TJClusterPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [lessons, setLessons] = useState<ClusterLesson[]>([]);
  const [masteryBySlug, setMasteryBySlug] = useState<Record<string, "not_started" | "in_progress" | "mastered">>({});
  const [loading, setLoading] = useState(true);

  const meta = CLUSTER_TITLES[slug ?? ""] ?? { title: "Cluster", intent: "" };

  useEffect(() => {
    (async () => {
      const clusterName = meta.title;
      const { data, error } = await supabase
        .from("tj_lessons" as any)
        .select("id,slug,title,cluster,purpose,accent_color,related_concepts,prerequisites,display_order")
        .eq("cluster", clusterName)
        .order("display_order", { ascending: true });
      if (error) toast.error("Couldn't load cluster");
      const rows = (data as unknown as ClusterLesson[]) ?? [];
      setLessons(rows);

      // Pull lightweight mastery state from reflection responses (anything reflected on = in_progress)
      if (user && rows.length) {
        const slugs = rows.map((r) => r.slug);
        const { data: refl } = await supabase
          .from("tj_reflection_responses" as any)
          .select("lesson_slug")
          .eq("user_id", user.id)
          .in("lesson_slug", slugs);
        const m: Record<string, "not_started" | "in_progress" | "mastered"> = {};
        rows.forEach((r) => { m[r.slug] = "not_started"; });
        (refl as any[] | null)?.forEach((row) => { m[row.lesson_slug] = "in_progress"; });
        setMasteryBySlug(m);
      }

      setLoading(false);
    })();
  }, [meta.title, user]);

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

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-background text-muted-foreground">Loading cluster…</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/40">
      {/* Hero */}
      <header className="max-w-5xl mx-auto px-5 pt-12 pb-6 text-center">
        <div className="inline-flex items-center gap-2 mb-4 px-3 py-1 rounded-full bg-foreground text-background text-[11px] uppercase tracking-[0.2em] font-semibold">
          <Sparkles className="h-3 w-3" /> TJ Anderson Layer Method™ v2.0
        </div>
        <h1 className="font-display text-4xl sm:text-5xl font-bold text-foreground tracking-tight">{meta.title}</h1>
        <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">{meta.intent}</p>
      </header>

      {/* Knowledge Web as Learning Pathway */}
      <section className="max-w-5xl mx-auto px-5">
        <div className="flex items-center gap-2 mb-3 text-xs uppercase tracking-[0.2em] text-muted-foreground">
          <Network className="h-3.5 w-3.5" /> Knowledge Web™ — Learning Pathway
        </div>
        <PathwayGraph lessons={pathwayLessons} onSelect={(s) => navigate(`/lesson/${s}`)} />
        <p className="text-xs text-muted-foreground text-center mt-3">
          Foundation flows left → right. Solid arrows show the pathway. Dotted lines show related concepts. Hover any node to focus its connections.
        </p>
      </section>

      {/* Lesson grid */}
      <section className="max-w-5xl mx-auto px-5 mt-12 pb-16">
        <h2 className="font-display text-xl font-semibold text-foreground mb-5">All 10 lessons</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {lessons.map((l, idx) => {
            const color = l.accent_color || "hsl(var(--foreground))";
            return (
              <motion.div
                key={l.slug}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.04 }}
              >
                <Card
                  onClick={() => navigate(`/lesson/${l.slug}`)}
                  className="relative overflow-hidden cursor-pointer bg-card border-border/60 hover:shadow-xl transition-all group h-full"
                >
                  <div className="h-1.5 w-full" style={{ backgroundColor: color }} />
                  <div className="p-5">
                    <div className="text-[11px] uppercase tracking-[0.18em] mb-1" style={{ color }}>
                      Lesson {String(l.display_order ?? idx + 1).padStart(2, "0")}
                    </div>
                    <div className="font-display text-xl font-bold text-card-foreground mb-2">{l.title}</div>
                    <p className="text-sm text-muted-foreground line-clamp-3 leading-relaxed">{l.purpose}</p>
                    <div className="flex items-center gap-1.5 text-sm font-medium mt-4 group-hover:gap-2.5 transition-all" style={{ color }}>
                      Begin lesson <ArrowRight className="h-4 w-4" />
                    </div>
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </div>

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
