import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import AppHeader from "@/components/AppHeader";
import AppFooter from "@/components/AppFooter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Hexagon, TrendingUp, Sparkles, X } from "lucide-react";

type DimKey = "personal" | "visual" | "real" | "reflect" | "practice" | "assess";

interface Dimension {
  key: DimKey;
  label: string;
  color: string; // brand hsl triplet
  score: number;
  measures: string[];
  insight: string;
  strength: string;
  growth: string;
  action: string;
}

// Mastery -> glow color
// Green = Strength (>=80), Gold = Developing (60-79), Purple = Growth (<60)
const glowFor = (score: number) => {
  if (score >= 80) return { color: "hsl(145 55% 42%)", label: "Strength", tone: "green" };
  if (score >= 60) return { color: "hsl(42 80% 52%)", label: "Developing", tone: "gold" };
  return { color: "hsl(270 60% 50%)", label: "Growth Opportunity", tone: "violet" };
};

const DIMENSIONS: Dimension[] = [
  {
    key: "personal",
    label: "Personal Connection",
    color: "285 55% 38%",
    score: 92,
    measures: ["Identity prompts", "Story anchors", "Self-relevance ratings", "Why-it-matters answers"],
    insight: "Meaning is the strongest glue memory has.",
    strength: "You consistently connect concepts to personal experience.",
    growth: "Apply more real-world examples.",
    action: "Complete two additional application activities.",
  },
  {
    key: "visual",
    label: "Visual Mapping",
    color: "270 60% 45%",
    score: 84,
    measures: ["Knowledge Web™ usage", "Diagram interaction", "Visual exercises completed", "Concept mapping activities"],
    insight: "You retain information best when you can see relationships between concepts.",
    strength: "You navigate ideas spatially with confidence.",
    growth: "Build one map per new cluster you enter.",
    action: "Open the Knowledge Web™ before each new lesson.",
  },
  {
    key: "real",
    label: "Real World Application",
    color: "42 75% 50%",
    score: 71,
    measures: ["Case studies", "Scenario exercises", "Professional application questions", "Practical examples"],
    insight: "Learning becomes permanent when it becomes useful.",
    strength: "You can describe how a concept appears on the floor.",
    growth: "Practice translating theory into client moments.",
    action: "Complete one scenario card per lesson this week.",
  },
  {
    key: "reflect",
    label: "Reflection",
    color: "320 55% 48%",
    score: 92,
    measures: ["Journal entries", "Reflection prompts", "Awareness activities", "Why-It-Matters responses"],
    insight: "Reflection converts information into understanding.",
    strength: "You pause and process — that's how meaning lands.",
    growth: "Tie reflections back to a specific client outcome.",
    action: "Add one outcome line to your next three journal entries.",
  },
  {
    key: "practice",
    label: "Practice & Recall",
    color: "200 65% 42%",
    score: 61,
    measures: ["Flashcards", "Quiz completion", "Spaced repetition", "Recall exercises"],
    insight: "Repetition strengthens retrieval pathways.",
    strength: "You show up — your sessions are consistent.",
    growth: "Pull answers from memory before peeking.",
    action: "Run a 5-minute Rapid Mastery™ sprint daily for 7 days.",
  },
  {
    key: "assess",
    label: "Assessment & Transfer",
    color: "145 50% 38%",
    score: 78,
    measures: ["Mastery checks", "Open responses", "Teaching-back exercises", "Final assessments"],
    insight: "Knowledge becomes mastery when you can explain it.",
    strength: "You can hold your own under assessment pressure.",
    growth: "Teach a concept aloud before quizzing on it.",
    action: "Record yourself explaining one term this week.",
  },
];

const RADIUS = 118;
const CX = 180;
const CY = 180;

const LearningGeometryPage = () => {
  const navigate = useNavigate();
  const [active, setActive] = useState<DimKey | null>(null);

  const sorted = useMemo(() => [...DIMENSIONS].sort((a, b) => b.score - a.score), []);
  const strongest = sorted[0];
  const growth = sorted[sorted.length - 1];

  const activeDim = DIMENSIONS.find((d) => d.key === active);

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: "linear-gradient(180deg, hsl(var(--cream)), hsl(var(--plum-soft)))" }}
    >
      <AppHeader />

      <div className="flex-1 px-4 pt-6 pb-12 max-w-2xl mx-auto w-full">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/")}
          className="mb-4 -ml-2 gap-1"
        >
          <ArrowLeft className="h-4 w-4" /> Dashboard
        </Button>

        {/* Header */}
        <div className="text-center mb-6">
          <div
            className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[10px] uppercase tracking-[0.22em] font-bold mb-3"
            style={{ background: "hsl(var(--violet) / 0.12)", color: "hsl(var(--violet))" }}
          >
            <Hexagon className="h-3 w-3" /> TJ Anderson Layer Method™
          </div>
          <h1 className="font-display text-3xl font-bold mb-2" style={{ color: "hsl(var(--plum))" }}>
            Learning Geometry<span style={{ color: "hsl(var(--gold))" }}>™</span>
          </h1>
          <p className="text-sm italic leading-relaxed" style={{ color: "hsl(var(--plum) / 0.75)" }}>
            Built on Connections.<br />
            Layered for Retention. Designed for Transformation.
          </p>
        </div>

        {/* Hero geometry */}
        <Card
          className="border-0 shadow-lg overflow-hidden"
          style={{
            background:
              "radial-gradient(ellipse at top, hsl(var(--violet) / 0.10), hsl(var(--cream-soft)) 65%)",
          }}
        >
          <CardContent className="p-4">
            <svg viewBox="0 0 360 360" className="w-full h-auto">
              <defs>
                <radialGradient id="coreGlow" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="hsl(var(--gold))" stopOpacity="0.45" />
                  <stop offset="100%" stopColor="hsl(var(--gold))" stopOpacity="0" />
                </radialGradient>
                {DIMENSIONS.map((d) => {
                  const g = glowFor(d.score);
                  return (
                    <radialGradient
                      key={d.key + "-g"}
                      id={`glow-${d.key}`}
                      cx="50%"
                      cy="50%"
                      r="50%"
                    >
                      <stop offset="0%" stopColor={g.color} stopOpacity="0.65" />
                      <stop offset="100%" stopColor={g.color} stopOpacity="0" />
                    </radialGradient>
                  );
                })}
              </defs>

              {/* Connecting lines */}
              {DIMENSIONS.map((d, i) => {
                const angle = (Math.PI * 2 * i) / DIMENSIONS.length - Math.PI / 2;
                const x = CX + RADIUS * Math.cos(angle);
                const y = CY + RADIUS * Math.sin(angle);
                const isActive = active === d.key;
                return (
                  <line
                    key={d.key + "-l"}
                    x1={CX}
                    y1={CY}
                    x2={x}
                    y2={y}
                    stroke={`hsl(${d.color} / ${isActive ? 0.9 : 0.32})`}
                    strokeWidth={isActive ? 2.5 : 1.4}
                  />
                );
              })}

              {/* Outer hexagon */}
              <polygon
                points={DIMENSIONS.map((_, i) => {
                  const a = (Math.PI * 2 * i) / DIMENSIONS.length - Math.PI / 2;
                  return `${CX + RADIUS * Math.cos(a)},${CY + RADIUS * Math.sin(a)}`;
                }).join(" ")}
                fill="none"
                stroke="hsl(var(--violet) / 0.25)"
                strokeWidth={1}
                strokeDasharray="3 5"
              />

              {/* Core */}
              <circle cx={CX} cy={CY} r={74} fill="url(#coreGlow)" />
              <circle
                cx={CX}
                cy={CY}
                r={50}
                fill="hsl(var(--plum))"
                stroke="hsl(var(--gold))"
                strokeWidth={2}
              />
              <text
                x={CX}
                y={CY - 14}
                textAnchor="middle"
                fontFamily="DM Sans, sans-serif"
                fontSize="8"
                fontWeight="700"
                fill="hsl(var(--gold))"
                letterSpacing="3"
              >
                CORE
              </text>
              <text
                x={CX}
                y={CY + 3}
                textAnchor="middle"
                fontFamily="Playfair Display, serif"
                fontSize="13"
                fontWeight="700"
                fill="hsl(var(--cream))"
              >
                TERM
              </text>
              <text
                x={CX}
                y={CY + 19}
                textAnchor="middle"
                fontFamily="Playfair Display, serif"
                fontSize="13"
                fontWeight="700"
                fill="hsl(var(--cream))"
              >
                MASTERY
              </text>

              {/* Dimension nodes */}
              {DIMENSIONS.map((d, i) => {
                const angle = (Math.PI * 2 * i) / DIMENSIONS.length - Math.PI / 2;
                const x = CX + RADIUS * Math.cos(angle);
                const y = CY + RADIUS * Math.sin(angle);
                const isActive = active === d.key;
                const g = glowFor(d.score);
                const labelDist = 50;
                const lx = CX + (RADIUS + labelDist) * Math.cos(angle);
                const ly = CY + (RADIUS + labelDist) * Math.sin(angle);
                return (
                  <g
                    key={d.key}
                    style={{ cursor: "pointer" }}
                    onClick={() => setActive(d.key)}
                  >
                    {/* glow ring */}
                    <circle cx={x} cy={y} r={isActive ? 34 : 28} fill={`url(#glow-${d.key})`} />
                    {/* node */}
                    <circle
                      cx={x}
                      cy={y}
                      r={isActive ? 20 : 16}
                      fill={g.color}
                      stroke="hsl(var(--cream-soft))"
                      strokeWidth={3}
                    />
                    <text
                      x={x}
                      y={y + 4}
                      textAnchor="middle"
                      fontFamily="DM Sans, sans-serif"
                      fontSize="10"
                      fontWeight="700"
                      fill="hsl(var(--cream))"
                    >
                      {d.score}
                    </text>
                    <text
                      x={lx}
                      y={ly}
                      textAnchor="middle"
                      fontFamily="DM Sans, sans-serif"
                      fontSize="10"
                      fontWeight={isActive ? 700 : 600}
                      fill={`hsl(${d.color})`}
                    >
                      {d.label.split(" ").map((w, j) => (
                        <tspan key={j} x={lx} dy={j === 0 ? 0 : 12}>
                          {w}
                        </tspan>
                      ))}
                    </text>
                  </g>
                );
              })}
            </svg>

            {/* Legend */}
            <div className="flex items-center justify-center gap-3 mt-1 flex-wrap">
              {[
                { c: "hsl(145 55% 42%)", l: "Strength" },
                { c: "hsl(42 80% 52%)", l: "Developing" },
                { c: "hsl(270 60% 50%)", l: "Growth" },
              ].map((x) => (
                <div key={x.l} className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.16em] font-bold text-muted-foreground">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ background: x.c, boxShadow: `0 0 8px ${x.c}` }} />
                  {x.l}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Summary Panel — YOUR TJ DNA™ */}
        <Card
          className="mt-6 border-0 shadow-lg overflow-hidden"
          style={{
            background: "linear-gradient(135deg, hsl(var(--plum)), hsl(var(--violet)))",
            color: "hsl(var(--cream))",
          }}
        >
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="h-4 w-4" style={{ color: "hsl(var(--gold))" }} />
              <span className="text-[10px] uppercase tracking-[0.22em] font-bold" style={{ color: "hsl(var(--gold))" }}>
                Your TJ DNA™
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="p-3 rounded-xl" style={{ background: "hsl(var(--cream) / 0.10)" }}>
                <div className="text-[9px] uppercase tracking-[0.18em] font-bold opacity-70 mb-1">Strongest Dimension</div>
                <div className="font-display font-bold text-base leading-tight">{strongest.label}</div>
                <div className="text-xs opacity-80 mt-0.5">{strongest.score}%</div>
              </div>
              <div className="p-3 rounded-xl" style={{ background: "hsl(var(--cream) / 0.10)" }}>
                <div className="text-[9px] uppercase tracking-[0.18em] font-bold opacity-70 mb-1">Growth Dimension</div>
                <div className="font-display font-bold text-base leading-tight">{growth.label}</div>
                <div className="text-xs opacity-80 mt-0.5">{growth.score}%</div>
              </div>
            </div>

            <div className="mb-3">
              <div className="text-[9px] uppercase tracking-[0.18em] font-bold opacity-70 mb-1">Learning Style Summary</div>
              <p className="text-sm leading-relaxed italic font-display">
                You build understanding through meaning, connection, and reflection before memorization.
              </p>
            </div>

            <div className="p-3 rounded-xl border" style={{ borderColor: "hsl(var(--gold) / 0.45)", background: "hsl(var(--gold) / 0.12)" }}>
              <div className="text-[9px] uppercase tracking-[0.18em] font-bold mb-1" style={{ color: "hsl(var(--gold))" }}>
                TJ Recommendation™
              </div>
              <p className="text-sm leading-relaxed">
                Strengthen long-term retention through active recall and retrieval practice.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Dimension Cards */}
        <div className="mt-6">
          <div className="text-[10px] uppercase tracking-[0.22em] font-bold mb-3" style={{ color: "hsl(var(--plum))" }}>
            Six Dimensions
          </div>
          <div className="grid grid-cols-1 gap-3">
            {DIMENSIONS.map((d) => {
              const g = glowFor(d.score);
              return (
                <button
                  key={d.key}
                  onClick={() => setActive(d.key)}
                  className="text-left p-4 rounded-2xl border bg-card hover:shadow-md transition-all"
                  style={{ borderColor: `hsl(${d.color} / 0.30)` }}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ background: `hsl(${d.color} / 0.14)`, boxShadow: `0 0 14px ${g.color}55` }}
                    >
                      <span className="font-display font-bold text-sm" style={{ color: `hsl(${d.color})` }}>
                        {d.score}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-display font-bold text-sm" style={{ color: "hsl(var(--plum))" }}>
                          {d.label}
                        </h3>
                        <span
                          className="text-[9px] uppercase tracking-[0.16em] font-bold px-2 py-0.5 rounded-full"
                          style={{ background: `${g.color}22`, color: g.color }}
                        >
                          {g.label}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground italic mt-0.5 line-clamp-2">{d.insight}</p>
                    </div>
                  </div>
                  {/* mastery bar */}
                  <div className="mt-3 h-1.5 rounded-full overflow-hidden" style={{ background: "hsl(var(--muted))" }}>
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${d.score}%`,
                        background: `linear-gradient(90deg, hsl(${d.color}), ${g.color})`,
                      }}
                    />
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Learning Geometry Timeline™ */}
        <Card className="mt-6 border-0 shadow-md" style={{ background: "hsl(var(--cream-soft))" }}>
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="h-4 w-4" style={{ color: "hsl(var(--violet))" }} />
              <span className="text-[10px] uppercase tracking-[0.22em] font-bold" style={{ color: "hsl(var(--violet))" }}>
                Learning Geometry Timeline™
              </span>
            </div>
            <p className="text-xs text-muted-foreground mb-4">
              Track growth across all dimensions over time.
            </p>
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: "Weekly Growth", value: "+6%", color: "hsl(145 55% 42%)" },
                { label: "Monthly Growth", value: "+18%", color: "hsl(42 80% 52%)" },
                { label: "Lifetime Growth", value: "+74%", color: "hsl(270 60% 50%)" },
              ].map((t) => (
                <div
                  key={t.label}
                  className="p-3 rounded-xl text-center border"
                  style={{ borderColor: `${t.color}40`, background: `${t.color}10` }}
                >
                  <div className="font-display text-xl font-bold" style={{ color: t.color }}>
                    {t.value}
                  </div>
                  <div className="text-[9px] uppercase tracking-[0.16em] font-bold text-muted-foreground mt-1">
                    {t.label}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* TJ Insight footer */}
        <div
          className="mt-8 p-5 rounded-2xl text-center"
          style={{
            background: "linear-gradient(135deg, hsl(var(--soft-black)), hsl(var(--plum)))",
            color: "hsl(var(--cream))",
          }}
        >
          <div
            className="text-[10px] uppercase tracking-[0.22em] font-bold mb-2"
            style={{ color: "hsl(var(--gold))" }}
          >
            TJ Insight™
          </div>
          <p className="font-display italic text-base leading-relaxed">
            "You don't memorize knowledge — you build geometry around it. Every dimension you add makes
            the core impossible to forget."
          </p>
        </div>
      </div>

      <AppFooter />

      {/* Dimension detail modal */}
      <AnimatePresence>
        {activeDim && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-3"
            style={{ background: "hsl(var(--soft-black) / 0.55)" }}
            onClick={() => setActive(null)}
          >
            <motion.div
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 20, opacity: 0 }}
              transition={{ type: "spring", damping: 22 }}
              className="w-full max-w-md rounded-2xl shadow-2xl overflow-hidden"
              style={{ background: "hsl(var(--cream-soft))" }}
              onClick={(e) => e.stopPropagation()}
            >
              <div
                className="p-5 relative"
                style={{
                  background: `linear-gradient(135deg, hsl(${activeDim.color}), hsl(var(--plum)))`,
                  color: "hsl(var(--cream))",
                }}
              >
                <button
                  onClick={() => setActive(null)}
                  className="absolute top-3 right-3 p-1 rounded-full hover:bg-white/10"
                  aria-label="Close"
                >
                  <X className="h-4 w-4" />
                </button>
                <div
                  className="text-[10px] uppercase tracking-[0.22em] font-bold mb-1"
                  style={{ color: "hsl(var(--gold))" }}
                >
                  Dimension
                </div>
                <h2 className="font-display text-2xl font-bold">{activeDim.label}</h2>
                <div className="mt-3 flex items-baseline gap-2">
                  <span className="font-display text-4xl font-bold" style={{ color: "hsl(var(--gold))" }}>
                    {activeDim.score}%
                  </span>
                  <span className="text-xs uppercase tracking-[0.18em] font-bold opacity-80">
                    Current Score
                  </span>
                </div>
              </div>

              <div className="p-5 space-y-4 max-h-[60vh] overflow-y-auto scrollbar-visible">
                <div>
                  <div className="text-[10px] uppercase tracking-[0.18em] font-bold mb-1" style={{ color: "hsl(var(--violet))" }}>
                    Measures
                  </div>
                  <ul className="space-y-1">
                    {activeDim.measures.map((m) => (
                      <li key={m} className="text-sm flex items-start gap-2" style={{ color: "hsl(var(--plum))" }}>
                        <span className="w-1.5 h-1.5 rounded-full mt-2 flex-shrink-0" style={{ background: `hsl(${activeDim.color})` }} />
                        {m}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="p-3 rounded-xl" style={{ background: `hsl(${activeDim.color} / 0.08)`, borderLeft: `3px solid hsl(${activeDim.color})` }}>
                  <div className="text-[10px] uppercase tracking-[0.18em] font-bold mb-1" style={{ color: `hsl(${activeDim.color})` }}>
                    Strength
                  </div>
                  <p className="text-sm" style={{ color: "hsl(var(--plum))" }}>{activeDim.strength}</p>
                </div>

                <div className="p-3 rounded-xl" style={{ background: "hsl(var(--violet) / 0.08)", borderLeft: "3px solid hsl(var(--violet))" }}>
                  <div className="text-[10px] uppercase tracking-[0.18em] font-bold mb-1" style={{ color: "hsl(var(--violet))" }}>
                    Growth Opportunity
                  </div>
                  <p className="text-sm" style={{ color: "hsl(var(--plum))" }}>{activeDim.growth}</p>
                </div>

                <div className="p-3 rounded-xl" style={{ background: "hsl(var(--gold) / 0.12)", border: "1px solid hsl(var(--gold) / 0.4)" }}>
                  <div className="text-[10px] uppercase tracking-[0.18em] font-bold mb-1" style={{ color: "hsl(var(--gold))" }}>
                    Recommended Action
                  </div>
                  <p className="text-sm" style={{ color: "hsl(var(--plum))" }}>{activeDim.action}</p>
                </div>

                <div className="p-3 rounded-xl text-center" style={{ background: "hsl(var(--plum))", color: "hsl(var(--cream))" }}>
                  <div className="text-[10px] uppercase tracking-[0.22em] font-bold mb-1" style={{ color: "hsl(var(--gold))" }}>
                    TJ Insight™
                  </div>
                  <p className="text-sm font-display italic">{activeDim.insight}</p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default LearningGeometryPage;
