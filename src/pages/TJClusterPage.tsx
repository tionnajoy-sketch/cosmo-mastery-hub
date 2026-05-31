import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Sparkles, Network } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface ClusterLesson {
  id: string;
  slug: string;
  title: string;
  cluster: string | null;
  purpose: string | null;
  accent_color: string | null;
  related_concepts: string[] | null;
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
  const [lessons, setLessons] = useState<ClusterLesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [hovered, setHovered] = useState<string | null>(null);

  const meta = CLUSTER_TITLES[slug ?? ""] ?? { title: "Cluster", intent: "" };

  useEffect(() => {
    (async () => {
      const clusterName = meta.title;
      const { data, error } = await supabase
        .from("tj_lessons" as any)
        .select("id,slug,title,cluster,purpose,accent_color,related_concepts,display_order")
        .eq("cluster", clusterName)
        .order("display_order", { ascending: true });
      if (error) toast.error("Couldn't load cluster");
      setLessons((data as unknown as ClusterLesson[]) ?? []);
      setLoading(false);
    })();
  }, [meta.title]);

  // Build slug map for matching related_concepts -> lessons (titles or slugs).
  const slugByLabel = useMemo(() => {
    const map: Record<string, string> = {};
    lessons.forEach((l) => {
      map[l.slug] = l.slug;
      map[l.title.toLowerCase()] = l.slug;
      map[slugify(l.title)] = l.slug;
    });
    return map;
  }, [lessons]);

  // Radial layout for the knowledge web
  const SIZE = 560;
  const R = 220;
  const center = SIZE / 2;
  const positions = useMemo(() => {
    return lessons.map((_, i) => {
      const angle = (i / lessons.length) * Math.PI * 2 - Math.PI / 2;
      return { x: center + Math.cos(angle) * R, y: center + Math.sin(angle) * R };
    });
  }, [lessons]);

  const edges = useMemo(() => {
    const out: { from: number; to: number; color: string }[] = [];
    lessons.forEach((l, i) => {
      (l.related_concepts ?? []).forEach((rc) => {
        const targetSlug = slugByLabel[rc] || slugByLabel[rc.toLowerCase()] || slugByLabel[slugify(rc)];
        const j = lessons.findIndex((x) => x.slug === targetSlug);
        if (j > -1 && j !== i) out.push({ from: i, to: j, color: l.accent_color || "hsl(var(--muted-foreground))" });
      });
    });
    return out;
  }, [lessons, slugByLabel]);

  const isConnected = (slug: string) => {
    if (!hovered) return true;
    if (hovered === slug) return true;
    const a = lessons.find((l) => l.slug === hovered);
    const b = lessons.find((l) => l.slug === slug);
    return Boolean(
      a?.related_concepts?.some((rc) => slugByLabel[slugify(rc)] === slug || slugByLabel[rc.toLowerCase()] === slug) ||
      b?.related_concepts?.some((rc) => slugByLabel[slugify(rc)] === hovered || slugByLabel[rc.toLowerCase()] === hovered)
    );
  };

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

      {/* Knowledge Web */}
      <section className="max-w-5xl mx-auto px-5">
        <div className="flex items-center gap-2 mb-3 text-xs uppercase tracking-[0.2em] text-muted-foreground">
          <Network className="h-3.5 w-3.5" /> Knowledge Web Learning™
        </div>
        <Card className="relative bg-card border-border/60 overflow-hidden">
          <div className="aspect-square sm:aspect-auto sm:h-[560px] w-full">
            <svg viewBox={`0 0 ${SIZE} ${SIZE}`} className="w-full h-full">
              {/* Edges */}
              {edges.map((e, k) => {
                const a = positions[e.from], b = positions[e.to];
                const fromSlug = lessons[e.from].slug, toSlug = lessons[e.to].slug;
                const dim = hovered && !(hovered === fromSlug || hovered === toSlug);
                return (
                  <line
                    key={k}
                    x1={a.x} y1={a.y} x2={b.x} y2={b.y}
                    stroke={e.color}
                    strokeWidth={hovered && (hovered === fromSlug || hovered === toSlug) ? 1.8 : 0.9}
                    opacity={dim ? 0.08 : 0.45}
                  />
                );
              })}
              {/* Nodes */}
              {lessons.map((l, i) => {
                const p = positions[i];
                const connected = isConnected(l.slug);
                const color = l.accent_color || "hsl(var(--foreground))";
                return (
                  <g
                    key={l.slug}
                    transform={`translate(${p.x}, ${p.y})`}
                    style={{ cursor: "pointer", transition: "opacity 0.2s" }}
                    opacity={connected ? 1 : 0.25}
                    onMouseEnter={() => setHovered(l.slug)}
                    onMouseLeave={() => setHovered(null)}
                    onClick={() => navigate(`/lesson/${l.slug}`)}
                  >
                    <circle r={hovered === l.slug ? 38 : 32} fill={color} opacity={0.15} />
                    <circle r={hovered === l.slug ? 26 : 22} fill={color} />
                    <text
                      y={50}
                      textAnchor="middle"
                      className="fill-foreground"
                      style={{ fontSize: 13, fontWeight: 600, fontFamily: "inherit" }}
                    >
                      {l.title}
                    </text>
                  </g>
                );
              })}
              {/* Center label */}
              <g transform={`translate(${center}, ${center})`}>
                <circle r={50} fill="hsl(var(--background))" stroke="hsl(var(--border))" />
                <text textAnchor="middle" y={-3} className="fill-muted-foreground" style={{ fontSize: 10, letterSpacing: 2 }}>
                  CLUSTER
                </text>
                <text textAnchor="middle" y={14} className="fill-foreground" style={{ fontSize: 13, fontWeight: 700 }}>
                  Skin
                </text>
              </g>
            </svg>
          </div>
        </Card>
        <p className="text-xs text-muted-foreground text-center mt-3">Hover a node to highlight its connections. Click any concept to open the lesson.</p>
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
