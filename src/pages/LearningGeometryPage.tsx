import { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import AppHeader from "@/components/AppHeader";
import AppFooter from "@/components/AppFooter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Hexagon } from "lucide-react";

const DIMENSIONS = [
  { key: "personal", label: "Personal Connection", color: "285 55% 38%", desc: "Tie new information to your own life, identity, and memories — the strongest anchor for retention." },
  { key: "visual",   label: "Visual Mapping",      color: "270 60% 45%", desc: "Convert ideas into shapes, color zones, and spatial relationships your mind can navigate." },
  { key: "real",     label: "Real World Application", color: "42 75% 50%", desc: "Translate concepts into the moment you'd actually use them — at a station, on a client, in life." },
  { key: "reflect",  label: "Reflection",          color: "320 55% 48%", desc: "Pause and name what just shifted. Reflection turns experience into understanding." },
  { key: "practice", label: "Practice & Recall",   color: "200 65% 42%", desc: "Bring the idea back under your own power. Retrieval is what builds true memory." },
  { key: "assess",   label: "Assessment & Transfer", color: "145 50% 38%", desc: "Prove it in a new context. Mastery is the ability to use it where you've never used it before." },
];

const RADIUS = 120;
const CX = 180;
const CY = 180;

const LearningGeometryPage = () => {
  const navigate = useNavigate();
  const [active, setActive] = useState<string | null>(null);

  const activeDim = DIMENSIONS.find((d) => d.key === active);

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "linear-gradient(180deg, hsl(var(--cream)), hsl(var(--plum-soft)))" }}>
      <AppHeader />

      <div className="flex-1 px-4 pt-6 pb-10 max-w-2xl mx-auto w-full">
        <Button variant="ghost" size="sm" onClick={() => navigate("/")} className="mb-4 -ml-2 gap-1">
          <ArrowLeft className="h-4 w-4" /> Dashboard
        </Button>

        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[10px] uppercase tracking-[0.22em] font-bold mb-3"
            style={{ background: "hsl(var(--violet) / 0.12)", color: "hsl(var(--violet))" }}>
            <Hexagon className="h-3 w-3" /> TJ Anderson Layer Method™
          </div>
          <h1 className="font-display text-3xl font-bold mb-2" style={{ color: "hsl(var(--plum))" }}>
            Learning Geometry<span style={{ color: "hsl(var(--gold))" }}>™</span>
          </h1>
          <p className="text-sm italic" style={{ color: "hsl(var(--plum) / 0.75)" }}>
            Built on Connections. Layered for Retention. Designed for Transformation.
          </p>
        </div>

        {/* Geometry SVG */}
        <Card className="border-0 shadow-lg overflow-hidden" style={{ background: "hsl(var(--cream-soft))" }}>
          <CardContent className="p-4">
            <svg viewBox="0 0 360 360" className="w-full h-auto">
              <defs>
                <radialGradient id="coreGlow" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="hsl(var(--gold))" stopOpacity="0.35" />
                  <stop offset="100%" stopColor="hsl(var(--gold))" stopOpacity="0" />
                </radialGradient>
              </defs>

              {/* connecting lines */}
              {DIMENSIONS.map((d, i) => {
                const angle = (Math.PI * 2 * i) / DIMENSIONS.length - Math.PI / 2;
                const x = CX + RADIUS * Math.cos(angle);
                const y = CY + RADIUS * Math.sin(angle);
                const isActive = active === d.key;
                return (
                  <line key={d.key + "-l"} x1={CX} y1={CY} x2={x} y2={y}
                    stroke={`hsl(${d.color} / ${isActive ? 0.9 : 0.35})`}
                    strokeWidth={isActive ? 2.5 : 1.5} />
                );
              })}

              {/* hexagonal outline */}
              <polygon
                points={DIMENSIONS.map((_, i) => {
                  const a = (Math.PI * 2 * i) / DIMENSIONS.length - Math.PI / 2;
                  return `${CX + RADIUS * Math.cos(a)},${CY + RADIUS * Math.sin(a)}`;
                }).join(" ")}
                fill="none"
                stroke="hsl(var(--violet) / 0.25)"
                strokeWidth={1}
                strokeDasharray="4 4"
              />

              {/* core glow */}
              <circle cx={CX} cy={CY} r={62} fill="url(#coreGlow)" />
              {/* core circle */}
              <circle cx={CX} cy={CY} r={42}
                fill="hsl(var(--plum))"
                stroke="hsl(var(--gold))" strokeWidth={2} />
              <text x={CX} y={CY - 4} textAnchor="middle"
                fontFamily="Playfair Display, serif" fontSize="11"
                fill="hsl(var(--gold))" letterSpacing="2">CORE</text>
              <text x={CX} y={CY + 12} textAnchor="middle"
                fontFamily="Playfair Display, serif" fontSize="14" fontWeight="700"
                fill="hsl(var(--cream))">TERM</text>

              {/* dimension nodes */}
              {DIMENSIONS.map((d, i) => {
                const angle = (Math.PI * 2 * i) / DIMENSIONS.length - Math.PI / 2;
                const x = CX + RADIUS * Math.cos(angle);
                const y = CY + RADIUS * Math.sin(angle);
                const isActive = active === d.key;
                const labelDist = 50;
                const lx = CX + (RADIUS + labelDist) * Math.cos(angle);
                const ly = CY + (RADIUS + labelDist) * Math.sin(angle);
                return (
                  <g key={d.key} style={{ cursor: "pointer" }} onClick={() => setActive(d.key)}>
                    <circle cx={x} cy={y} r={isActive ? 22 : 18}
                      fill={`hsl(${d.color})`}
                      stroke="hsl(var(--cream-soft))" strokeWidth={3} />
                    <text x={lx} y={ly} textAnchor="middle"
                      fontFamily="DM Sans, sans-serif" fontSize="10" fontWeight={isActive ? 700 : 600}
                      fill={`hsl(${d.color})`}>
                      {d.label.split(" ").map((w, j) => (
                        <tspan key={j} x={lx} dy={j === 0 ? 0 : 12}>{w}</tspan>
                      ))}
                    </text>
                  </g>
                );
              })}
            </svg>

            {/* legend / detail */}
            <motion.div
              key={active ?? "empty"}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-2 p-4 rounded-xl"
              style={{
                background: activeDim ? `hsl(${activeDim.color} / 0.08)` : "hsl(var(--muted))",
                borderLeft: activeDim ? `4px solid hsl(${activeDim.color})` : "4px solid hsl(var(--border))",
              }}
            >
              {activeDim ? (
                <>
                  <div className="text-[10px] uppercase tracking-[0.18em] font-bold mb-1" style={{ color: `hsl(${activeDim.color})` }}>
                    Dimension
                  </div>
                  <h3 className="font-display text-lg font-bold mb-1" style={{ color: "hsl(var(--plum))" }}>{activeDim.label}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{activeDim.desc}</p>
                </>
              ) : (
                <p className="text-sm text-muted-foreground text-center italic">
                  Tap any dimension to explore how it shapes the way you learn.
                </p>
              )}
            </motion.div>
          </CardContent>
        </Card>

        {/* Six dimensions list */}
        <div className="mt-6 grid grid-cols-1 gap-2">
          {DIMENSIONS.map((d) => (
            <button
              key={d.key}
              onClick={() => setActive(d.key)}
              className="text-left p-4 rounded-xl border transition-all hover:shadow-md flex items-center gap-3"
              style={{
                borderColor: active === d.key ? `hsl(${d.color})` : "hsl(var(--border))",
                background: active === d.key ? `hsl(${d.color} / 0.06)` : "hsl(var(--card))",
              }}
            >
              <div className="w-9 h-9 rounded-lg flex-shrink-0" style={{ background: `hsl(${d.color})` }} />
              <div className="flex-1 min-w-0">
                <div className="font-display font-semibold text-sm" style={{ color: "hsl(var(--plum))" }}>{d.label}</div>
                <div className="text-xs text-muted-foreground line-clamp-1">{d.desc}</div>
              </div>
            </button>
          ))}
        </div>

        <div className="mt-8 p-5 rounded-2xl text-center" style={{
          background: "linear-gradient(135deg, hsl(var(--plum)), hsl(var(--violet)))",
          color: "hsl(var(--cream))",
        }}>
          <div className="text-[10px] uppercase tracking-[0.22em] font-bold mb-1" style={{ color: "hsl(var(--gold))" }}>
            TJ Insight™
          </div>
          <p className="font-display italic text-base leading-relaxed">
            "You don't memorize knowledge — you build geometry around it. Every dimension you add makes the
            core impossible to forget."
          </p>
        </div>
      </div>

      <AppFooter />
    </div>
  );
};

export default LearningGeometryPage;
