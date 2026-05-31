import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";

export interface PathwayLesson {
  slug: string;
  title: string;
  accent_color?: string | null;
  prerequisites?: string[] | null;
  related_concepts?: string[] | null;
  display_order?: number | null;
  /** Mastery state for this lesson, drives node size + fill */
  mastery?: "not_started" | "in_progress" | "mastered";
  /** Optional one-line purpose for the tooltip */
  purpose?: string | null;
}

interface PathwayGraphProps {
  lessons: PathwayLesson[];
  onSelect?: (slug: string) => void;
}

function slugify(s: string) {
  return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

/**
 * Knowledge Web™ as a learning pathway: left→right progression chain via
 * prerequisites, with thin dotted "related concept" edges layered on top.
 *
 * Nodes are sized by mastery (mastered = larger, filled), grouped into
 * columns by prerequisite depth.
 */
export default function PathwayGraph({ lessons, onSelect }: PathwayGraphProps) {
  const [hovered, setHovered] = useState<string | null>(null);

  // slug lookup by title or slug
  const slugByLabel = useMemo(() => {
    const map: Record<string, string> = {};
    lessons.forEach((l) => {
      map[l.slug] = l.slug;
      map[l.title.toLowerCase()] = l.slug;
      map[slugify(l.title)] = l.slug;
    });
    return map;
  }, [lessons]);

  const resolve = (label: string) =>
    slugByLabel[label] || slugByLabel[label.toLowerCase()] || slugByLabel[slugify(label)];

  // Compute depth (longest prereq path) per lesson
  const depthBySlug = useMemo(() => {
    const out: Record<string, number> = {};
    const lessonBySlug = new Map(lessons.map((l) => [l.slug, l]));
    const compute = (slug: string, seen: Set<string>): number => {
      if (out[slug] !== undefined) return out[slug];
      if (seen.has(slug)) return 0;
      seen.add(slug);
      const l = lessonBySlug.get(slug);
      const prereqs = (l?.prerequisites ?? [])
        .map((p) => resolve(p))
        .filter(Boolean) as string[];
      const d = prereqs.length === 0 ? 0 : Math.max(...prereqs.map((p) => compute(p, seen))) + 1;
      out[slug] = d;
      return d;
    };
    lessons.forEach((l) => compute(l.slug, new Set()));
    return out;
  }, [lessons, slugByLabel]);

  // Group into columns
  const columns = useMemo(() => {
    const cols: Record<number, PathwayLesson[]> = {};
    lessons.forEach((l) => {
      const d = depthBySlug[l.slug] ?? 0;
      (cols[d] ??= []).push(l);
    });
    Object.values(cols).forEach((c) =>
      c.sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0))
    );
    return cols;
  }, [lessons, depthBySlug]);

  const maxDepth = Math.max(0, ...Object.keys(columns).map(Number));
  const colCount = maxDepth + 1;

  const WIDTH = 880;
  const HEIGHT = 480;
  const COL_W = WIDTH / Math.max(colCount, 1);

  // Position each lesson
  const positions = useMemo(() => {
    const out: Record<string, { x: number; y: number }> = {};
    for (let d = 0; d <= maxDepth; d++) {
      const list = columns[d] ?? [];
      const colX = COL_W * (d + 0.5);
      list.forEach((l, i) => {
        const y = HEIGHT * ((i + 1) / (list.length + 1));
        out[l.slug] = { x: colX, y };
      });
    }
    return out;
  }, [columns, maxDepth, COL_W]);

  // Build edges
  const prereqEdges = useMemo(() => {
    const out: { from: string; to: string; color: string }[] = [];
    lessons.forEach((l) => {
      (l.prerequisites ?? []).forEach((p) => {
        const fromSlug = resolve(p);
        if (fromSlug && fromSlug !== l.slug) {
          out.push({ from: fromSlug, to: l.slug, color: l.accent_color || "hsl(var(--foreground))" });
        }
      });
    });
    return out;
  }, [lessons]);

  const relatedEdges = useMemo(() => {
    const seen = new Set<string>();
    const out: { from: string; to: string }[] = [];
    lessons.forEach((l) => {
      (l.related_concepts ?? []).forEach((rc) => {
        const toSlug = resolve(rc);
        if (!toSlug || toSlug === l.slug) return;
        const key = [l.slug, toSlug].sort().join("→");
        if (seen.has(key)) return;
        // Skip if already a prereq edge
        if (prereqEdges.some((e) =>
          (e.from === l.slug && e.to === toSlug) || (e.from === toSlug && e.to === l.slug)
        )) return;
        seen.add(key);
        out.push({ from: l.slug, to: toSlug });
      });
    });
    return out;
  }, [lessons, prereqEdges]);

  const nodeRadius = (l: PathwayLesson) => {
    if (l.mastery === "mastered") return hovered === l.slug ? 26 : 22;
    if (l.mastery === "in_progress") return hovered === l.slug ? 22 : 18;
    return hovered === l.slug ? 20 : 16;
  };

  const nodeFillOpacity = (l: PathwayLesson) =>
    l.mastery === "mastered" ? 1 : l.mastery === "in_progress" ? 0.55 : 0.18;

  const isHighlighted = (slug: string) => {
    if (!hovered) return true;
    if (hovered === slug) return true;
    return prereqEdges.some(
      (e) => (e.from === hovered && e.to === slug) || (e.to === hovered && e.from === slug)
    ) || relatedEdges.some(
      (e) => (e.from === hovered && e.to === slug) || (e.to === hovered && e.from === slug)
    );
  };

  return (
    <Card className="relative bg-card border-border/60 overflow-hidden">
      <div className="w-full" style={{ aspectRatio: `${WIDTH} / ${HEIGHT + 60}` }}>
        <svg viewBox={`0 0 ${WIDTH} ${HEIGHT + 60}`} className="w-full h-full">
          {/* Column labels */}
          {Array.from({ length: colCount }).map((_, d) => (
            <text
              key={d}
              x={COL_W * (d + 0.5)}
              y={20}
              textAnchor="middle"
              className="fill-muted-foreground"
              style={{ fontSize: 10, letterSpacing: 1.5, textTransform: "uppercase" }}
            >
              {d === 0 ? "Foundation" : d === maxDepth ? "Advanced" : `Layer ${d}`}
            </text>
          ))}

          {/* Related concept edges (dotted, faint) */}
          {relatedEdges.map((e, k) => {
            const a = positions[e.from], b = positions[e.to];
            if (!a || !b) return null;
            const dim = hovered && !(hovered === e.from || hovered === e.to);
            return (
              <line
                key={`r-${k}`}
                x1={a.x} y1={a.y + 40} x2={b.x} y2={b.y + 40}
                stroke="hsl(var(--muted-foreground))"
                strokeWidth={1}
                strokeDasharray="3 4"
                opacity={dim ? 0.08 : 0.35}
              />
            );
          })}

          {/* Prerequisite edges (curved arrows) */}
          {prereqEdges.map((e, k) => {
            const a = positions[e.from], b = positions[e.to];
            if (!a || !b) return null;
            const highlight = hovered && (hovered === e.from || hovered === e.to);
            const dim = hovered && !highlight;
            const ax = a.x, ay = a.y + 40;
            const bx = b.x, by = b.y + 40;
            const mx = (ax + bx) / 2;
            return (
              <g key={`p-${k}`} opacity={dim ? 0.15 : highlight ? 1 : 0.55}>
                <path
                  d={`M ${ax} ${ay} C ${mx} ${ay}, ${mx} ${by}, ${bx} ${by}`}
                  stroke={e.color}
                  strokeWidth={highlight ? 2.2 : 1.4}
                  fill="none"
                  markerEnd={`url(#arrow-${k})`}
                />
                <defs>
                  <marker
                    id={`arrow-${k}`}
                    viewBox="0 0 10 10"
                    refX="9"
                    refY="5"
                    markerWidth="6"
                    markerHeight="6"
                    orient="auto"
                  >
                    <path d="M 0 0 L 10 5 L 0 10 z" fill={e.color} />
                  </marker>
                </defs>
              </g>
            );
          })}

          {/* Nodes */}
          {lessons.map((l) => {
            const p = positions[l.slug];
            if (!p) return null;
            const color = l.accent_color || "hsl(var(--foreground))";
            const r = nodeRadius(l);
            const opacity = isHighlighted(l.slug) ? 1 : 0.25;
            const depth = depthBySlug[l.slug] ?? 0;
            const layerLabel = depth === 0 ? "Foundation" : depth === maxDepth ? "Advanced" : `Layer ${depth}`;
            const connectionsIn = prereqEdges.filter((e) => e.to === l.slug).length;
            const connectionsOut = prereqEdges.filter((e) => e.from === l.slug).length;
            const relatedCount = relatedEdges.filter((e) => e.from === l.slug || e.to === l.slug).length;
            const masteryLabel =
              l.mastery === "mastered" ? "Mastered" :
              l.mastery === "in_progress" ? "In progress" : "Not started";
            const masteryColor =
              l.mastery === "mastered" ? "hsl(145 55% 42%)" :
              l.mastery === "in_progress" ? "hsl(42 80% 52%)" : "hsl(270 60% 50%)";
            const relatedNames = (l.related_concepts ?? []).slice(0, 4);
            const isHover = hovered === l.slug;
            return (
              <g
                key={l.slug}
                transform={`translate(${p.x}, ${p.y + 40})`}
                style={{ cursor: "pointer", transition: "opacity 0.2s" }}
                opacity={opacity}
                onMouseEnter={() => setHovered(l.slug)}
                onMouseLeave={() => setHovered(null)}
                onClick={() => onSelect?.(l.slug)}
              >
                <circle r={r + 8} fill={color} opacity={isHover ? 0.22 : 0.12} />
                <circle
                  r={r}
                  fill={color}
                  fillOpacity={nodeFillOpacity(l)}
                  stroke={color}
                  strokeWidth={isHover ? 3 : 2}
                />
                {l.mastery === "mastered" && (
                  <path
                    d="M -5 0 L -1.5 3.5 L 5 -3"
                    stroke="white"
                    strokeWidth={2.2}
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                )}
                <text
                  y={r + 16}
                  textAnchor="middle"
                  className="fill-foreground"
                  style={{ fontSize: 12, fontWeight: 600 }}
                >
                  {l.title}
                </text>
                {isHover && (
                  <foreignObject x={-120} y={r + 22} width={240} height={160}>
                    <div className="text-left bg-popover/98 backdrop-blur rounded-lg px-3 py-2 border border-border shadow-xl">
                      <div className="text-[9px] uppercase tracking-[0.18em] font-bold mb-1" style={{ color }}>
                        {layerLabel}
                      </div>
                      <div className="text-[12px] font-semibold text-foreground leading-tight mb-1.5">
                        {l.title}
                      </div>
                      {l.purpose && (
                        <div className="text-[10px] text-muted-foreground leading-snug mb-2 line-clamp-2">
                          {l.purpose}
                        </div>
                      )}
                      <div className="flex items-center gap-1.5 mb-1.5">
                        <span
                          className="inline-block h-2 w-2 rounded-full"
                          style={{ background: masteryColor, boxShadow: `0 0 6px ${masteryColor}` }}
                        />
                        <span className="text-[10px] font-semibold" style={{ color: masteryColor }}>
                          {masteryLabel}
                        </span>
                      </div>
                      <div className="text-[10px] text-muted-foreground mb-1">
                        <span className="font-semibold text-foreground">{connectionsIn}</span> in ·{" "}
                        <span className="font-semibold text-foreground">{connectionsOut}</span> out ·{" "}
                        <span className="font-semibold text-foreground">{relatedCount}</span> related
                      </div>
                      {relatedNames.length > 0 && (
                        <div className="text-[10px] text-muted-foreground leading-snug">
                          <span className="uppercase tracking-[0.14em] font-bold text-[9px] text-foreground/70">Connects to:</span>{" "}
                          {relatedNames.join(" · ")}
                        </div>
                      )}
                    </div>
                  </foreignObject>
                )}
              </g>
            );
          })}
        </svg>
      </div>

      {/* Legend */}
      <div className="px-5 py-3 border-t border-border bg-muted/30 flex flex-wrap items-center gap-x-6 gap-y-2 text-[11px] text-muted-foreground">
        <span className="font-semibold uppercase tracking-[0.15em] text-foreground">Legend</span>
        <LegendDot label="Mastered" filled />
        <LegendDot label="In progress" partial />
        <LegendDot label="Not started" />
        <span className="inline-flex items-center gap-1.5">
          <svg width="22" height="8"><path d="M 0 4 C 6 4, 16 4, 22 4" stroke="currentColor" strokeWidth="1.6" fill="none" /></svg>
          Pathway
        </span>
        <span className="inline-flex items-center gap-1.5">
          <svg width="22" height="8"><line x1="0" y1="4" x2="22" y2="4" stroke="currentColor" strokeWidth="1" strokeDasharray="3 3" /></svg>
          Related
        </span>
      </div>
    </Card>
  );
}

function LegendDot({ label, filled, partial }: { label: string; filled?: boolean; partial?: boolean }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span
        className="inline-block h-3 w-3 rounded-full border-2 border-foreground"
        style={{ background: filled ? "hsl(var(--foreground))" : partial ? "hsl(var(--foreground) / 0.5)" : "transparent" }}
      />
      {label}
    </span>
  );
}
