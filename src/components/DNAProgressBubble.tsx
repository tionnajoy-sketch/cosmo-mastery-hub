import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Dna, X, TrendingUp, TrendingDown, Minus, ChevronRight, Sparkles } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

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
  confidence: number;
  layer: string;
}

interface ChangeEvent {
  id: number;
  field: "Code" | "Engagement" | "Retention" | "Confidence" | "Layer";
  delta: number; // for numeric fields
  from: string;
  to: string;
  timestamp: number;
}

const HIDDEN_ROUTES = ["/login", "/signup", "/onboarding", "/welcome"];
const DNA_COLORS = [
  "hsl(265 60% 55%)",
  "hsl(215 70% 50%)",
  "hsl(145 55% 45%)",
  "hsl(45 85% 50%)",
];

/**
 * Floating DNA Progress Bubble.
 * Lives globally — listens to profile DNA fields and surfaces every change
 * as a timeline so students SEE their DNA evolving in real time.
 */
const DNAProgressBubble = () => {
  const { profile, user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const [open, setOpen] = useState(false);
  const [pulse, setPulse] = useState(false);
  const [history, setHistory] = useState<ChangeEvent[]>([]);
  const lastSnapshot = useRef<Snapshot | null>(null);
  const eventIdRef = useRef(0);

  const isHidden = HIDDEN_ROUTES.some((r) => location.pathname.startsWith(r));
  const onDnaPage = location.pathname.startsWith("/learning-dna");

  const snapshot = useMemo<Snapshot | null>(() => {
    if (!profile) return null;
    return {
      code: profile.tj_dna_code || "----",
      engagement: ((profile as any).dna_engagement ?? 5) / 9 * 100,
      retention: charToPct((profile as any).dna_retention, "upper"),
      confidence: charToPct((profile as any).dna_confidence, "lower"),
      layer: (profile as any).dna_layer_strength || "D",
    };
  }, [profile]);

  // Detect changes → push to history + flash bubble
  useEffect(() => {
    if (!snapshot) return;
    const prev = lastSnapshot.current;
    if (!prev) {
      lastSnapshot.current = snapshot;
      return;
    }

    const newEvents: ChangeEvent[] = [];
    const now = Date.now();

    if (snapshot.code !== prev.code) {
      newEvents.push({
        id: ++eventIdRef.current,
        field: "Code",
        delta: 0,
        from: prev.code,
        to: snapshot.code,
        timestamp: now,
      });
    }
    if (snapshot.layer !== prev.layer) {
      newEvents.push({
        id: ++eventIdRef.current,
        field: "Layer",
        delta: 0,
        from: prev.layer,
        to: snapshot.layer,
        timestamp: now,
      });
    }
    const numericFields: Array<{ key: "engagement" | "retention" | "confidence"; label: ChangeEvent["field"] }> = [
      { key: "engagement", label: "Engagement" },
      { key: "retention", label: "Retention" },
      { key: "confidence", label: "Confidence" },
    ];
    numericFields.forEach(({ key, label }) => {
      const before = Math.round(prev[key]);
      const after = Math.round(snapshot[key]);
      if (before !== after) {
        newEvents.push({
          id: ++eventIdRef.current,
          field: label,
          delta: after - before,
          from: `${before}`,
          to: `${after}`,
          timestamp: now,
        });
      }
    });

    if (newEvents.length) {
      setHistory((h) => [...newEvents, ...h].slice(0, 25));
      setPulse(true);
      const t = window.setTimeout(() => setPulse(false), 2400);
      lastSnapshot.current = snapshot;
      return () => window.clearTimeout(t);
    }
    lastSnapshot.current = snapshot;
  }, [snapshot]);

  if (!user || !profile || isHidden || onDnaPage) return null;
  if (!snapshot) return null;

  const bars = [
    { label: "Engagement", value: snapshot.engagement, color: "hsl(215 70% 55%)" },
    { label: "Retention", value: snapshot.retention, color: "hsl(265 60% 60%)" },
    { label: "Confidence", value: snapshot.confidence, color: "hsl(145 55% 50%)" },
  ];

  return (
    <>
      {/* Floating bubble trigger */}
      <motion.button
        initial={{ opacity: 0, scale: 0.6 }}
        animate={{ opacity: 1, scale: 1 }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setOpen((v) => !v)}
        aria-label="Open DNA progress"
        className="fixed z-[60] rounded-full flex items-center justify-center"
        style={{
          bottom: "5.5rem",
          right: "1rem",
          width: 56,
          height: 56,
          background: "linear-gradient(135deg, hsl(265 60% 35%), hsl(215 70% 35%))",
          border: "1.5px solid hsl(265 60% 65% / 0.5)",
          boxShadow: pulse
            ? "0 0 0 6px hsl(145 70% 55% / 0.25), 0 8px 24px hsl(265 60% 30% / 0.5)"
            : "0 8px 24px hsl(265 60% 20% / 0.45)",
          transition: "box-shadow 0.4s ease",
        }}
      >
        <Dna className="h-6 w-6 text-white" />
        {/* Live indicator */}
        <motion.span
          animate={{ opacity: [1, 0.3, 1] }}
          transition={{ duration: 1.6, repeat: Infinity }}
          className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full"
          style={{ background: "hsl(145 70% 55%)", boxShadow: "0 0 8px hsl(145 70% 55%)" }}
        />
        {/* Change badge */}
        <AnimatePresence>
          {pulse && (
            <motion.span
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              className="absolute -top-1 -left-1 px-1.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider flex items-center gap-0.5"
              style={{
                background: "hsl(145 70% 50%)",
                color: "hsl(0 0% 100%)",
                boxShadow: "0 2px 6px hsl(145 70% 30% / 0.5)",
              }}
            >
              <Sparkles className="h-2.5 w-2.5" />
              DNA+
            </motion.span>
          )}
        </AnimatePresence>
      </motion.button>

      {/* Expanded panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.96 }}
            transition={{ duration: 0.22 }}
            className="fixed z-[60] rounded-2xl overflow-hidden flex flex-col"
            style={{
              bottom: "9rem",
              right: "1rem",
              width: "min(360px, calc(100vw - 2rem))",
              maxHeight: "70vh",
              background: "linear-gradient(160deg, hsl(240 25% 10% / 0.97), hsl(265 25% 12% / 0.97))",
              border: "1px solid hsl(265 40% 40% / 0.4)",
              backdropFilter: "blur(16px)",
              boxShadow: "0 20px 50px hsl(0 0% 0% / 0.5)",
            }}
          >
            {/* Header */}
            <div className="p-4 flex items-center justify-between gap-2 border-b" style={{ borderColor: "hsl(265 40% 40% / 0.25)" }}>
              <div className="flex items-center gap-2 min-w-0">
                <div className="p-1.5 rounded-lg" style={{ background: "hsl(265 60% 55% / 0.25)" }}>
                  <Dna className="h-4 w-4" style={{ color: "hsl(265 70% 80%)" }} />
                </div>
                <div className="min-w-0">
                  <div className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "hsl(0 0% 100% / 0.5)" }}>
                    Live DNA Progress
                  </div>
                  <div className="flex items-center gap-1 mt-0.5">
                    {snapshot.code.split("").slice(0, 4).map((ch, i) => (
                      <span
                        key={i}
                        className="font-display text-xs font-bold w-5 h-5 rounded flex items-center justify-center text-white"
                        style={{ background: DNA_COLORS[i] || DNA_COLORS[0] }}
                      >
                        {ch}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="p-1.5 rounded-md transition-colors hover:bg-white/10"
                aria-label="Close"
              >
                <X className="h-4 w-4 text-white/70" />
              </button>
            </div>

            {/* Bars */}
            <div className="px-4 pt-3 pb-2 space-y-2.5">
              {bars.map((b) => (
                <div key={b.label}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: "hsl(0 0% 100% / 0.6)" }}>
                      {b.label}
                    </span>
                    <span className="text-[11px] font-bold" style={{ color: b.color }}>
                      {Math.round(b.value)}
                    </span>
                  </div>
                  <div className="h-2 rounded-full overflow-hidden" style={{ background: "hsl(0 0% 100% / 0.08)" }}>
                    <motion.div
                      key={`${b.label}-${Math.round(b.value)}`}
                      initial={{ width: 0 }}
                      animate={{ width: `${b.value}%` }}
                      transition={{ duration: 0.7, ease: "easeOut" }}
                      className="h-full rounded-full"
                      style={{ background: b.color, boxShadow: `0 0 8px ${b.color}` }}
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Timeline */}
            <div className="px-4 pt-2 pb-3 flex-1 overflow-y-auto">
              <div className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: "hsl(0 0% 100% / 0.45)" }}>
                Recent Evolution
              </div>
              {history.length === 0 ? (
                <div
                  className="rounded-lg p-3 text-[11px] leading-relaxed"
                  style={{
                    background: "hsl(265 30% 18% / 0.5)",
                    color: "hsl(0 0% 100% / 0.6)",
                    border: "1px dashed hsl(265 40% 45% / 0.3)",
                  }}
                >
                  Keep going — your DNA updates the moment you reflect, answer, or master a layer.
                </div>
              ) : (
                <ul className="space-y-1.5">
                  <AnimatePresence initial={false}>
                    {history.map((evt) => {
                      const positive = evt.delta > 0 || evt.field === "Code" || evt.field === "Layer";
                      const Icon = evt.delta > 0 ? TrendingUp : evt.delta < 0 ? TrendingDown : Minus;
                      const accent = evt.delta > 0
                        ? "hsl(145 70% 55%)"
                        : evt.delta < 0
                          ? "hsl(15 75% 60%)"
                          : "hsl(45 85% 60%)";
                      return (
                        <motion.li
                          key={evt.id}
                          initial={{ opacity: 0, x: 8 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0 }}
                          className="rounded-lg p-2 flex items-center gap-2"
                          style={{
                            background: "hsl(265 25% 16% / 0.55)",
                            border: `1px solid ${accent} / 0.25`,
                          }}
                        >
                          <span
                            className="w-6 h-6 rounded-md flex items-center justify-center shrink-0"
                            style={{ background: `${accent.replace(")", " / 0.18)")}`, color: accent }}
                          >
                            <Icon className="h-3 w-3" />
                          </span>
                          <div className="min-w-0 flex-1">
                            <div className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "hsl(0 0% 100% / 0.55)" }}>
                              {evt.field}
                            </div>
                            <div className="text-[11px] font-semibold truncate" style={{ color: "hsl(0 0% 100% / 0.9)" }}>
                              {evt.from} → <span style={{ color: accent }}>{evt.to}</span>
                              {evt.delta !== 0 && (
                                <span className="ml-1 text-[10px] font-bold" style={{ color: accent }}>
                                  ({evt.delta > 0 ? "+" : ""}{evt.delta})
                                </span>
                              )}
                            </div>
                          </div>
                        </motion.li>
                      );
                    })}
                  </AnimatePresence>
                </ul>
              )}
            </div>

            {/* Footer CTA */}
            <button
              onClick={() => {
                setOpen(false);
                navigate("/learning-dna");
              }}
              className="w-full px-4 py-3 flex items-center justify-between text-[11px] font-bold uppercase tracking-wider transition-colors"
              style={{
                borderTop: "1px solid hsl(265 40% 40% / 0.25)",
                background: "hsl(265 60% 55% / 0.12)",
                color: "hsl(0 0% 100% / 0.85)",
              }}
            >
              <span>Open My Learning DNA Hub</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default DNAProgressBubble;
