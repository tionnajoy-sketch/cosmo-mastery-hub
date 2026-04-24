/* ───────────────────────────────────────────────────────────────────
 * Recall Reconstruction (Layer 3 — "From You, Not Me")
 *
 * Forces the brain to PRODUCE, not recognize. Two modes:
 *   A) Fill-in-the-blank — derived from the term's definition
 *   B) Write it fully    — open response
 *
 * Score 0–100 from keyword overlap with the canonical definition.
 * Updates brain strengths via useBrainStrengths.recordRecallReconstruction.
 * If score < 60% → fires onTriggerReinforcement so the orb dialog can
 * gate progress with the "Strengthen This Layer" loop.
 * ─────────────────────────────────────────────────────────────────── */

import { useCallback, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { CheckCircle2, AlertTriangle, RefreshCw, ArrowRight, PenLine, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useBrainStrengths } from "@/hooks/useBrainStrengths";

const STOP_WORDS = new Set([
  "the","a","an","and","or","of","to","for","in","on","at","by","with","is","are","be",
  "this","that","these","those","it","its","as","from","so","but","can","will","you","your",
  "we","our","i","me","my","not","no","yes","do","does","done","has","have","had","was","were",
]);

function tokenize(s: string): string[] {
  return (s || "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length >= 3 && !STOP_WORDS.has(w));
}

function uniqueKeywords(s: string, max = 8): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const w of tokenize(s)) {
    if (seen.has(w)) continue;
    seen.add(w);
    out.push(w);
    if (out.length >= max) break;
  }
  return out;
}

/** Keyword overlap → 0-100 score. */
function scoreResponse(response: string, definition: string): number {
  const target = uniqueKeywords(definition, 10);
  if (target.length === 0) return response.trim().length > 20 ? 60 : 30;
  const got = new Set(tokenize(response));
  let hits = 0;
  for (const k of target) if (got.has(k)) hits++;
  return Math.round((hits / target.length) * 100);
}

/** Build a fill-in-the-blank prompt by hiding the top keywords. */
function buildBlanks(definition: string): { masked: string; answers: string[] } {
  const keys = uniqueKeywords(definition, 3);
  let masked = definition;
  for (const k of keys) {
    masked = masked.replace(
      new RegExp(`\\b${k}\\b`, "i"),
      "______",
    );
  }
  return { masked, answers: keys };
}

interface Props {
  termId: string;
  termTitle: string;
  definition: string;
  /** Step accent color from the orb dialog so we blend in. */
  accentColor: string;
  onTriggerReinforcement: () => void;
  onComplete: () => void;
}

export const RecallReconstruction = ({
  termId,
  termTitle,
  definition,
  accentColor,
  onTriggerReinforcement,
  onComplete,
}: Props) => {
  const { user } = useAuth();
  const { recordRecallReconstruction } = useBrainStrengths();
  const [mode, setMode] = useState<"fill_blank" | "write_fully">("fill_blank");
  const [response, setResponse] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [scorePct, setScorePct] = useState(0);

  const fill = useMemo(() => buildBlanks(definition), [definition]);

  const handleSubmit = useCallback(async () => {
    const text = response.trim();
    if (!text) return;
    const target = mode === "fill_blank" ? fill.answers.join(" ") : definition;
    const pct = scoreResponse(text, target);
    setScorePct(pct);
    setSubmitted(true);

    // Update brain strengths immediately so the floating bubble lights up.
    await recordRecallReconstruction(pct);

    // Persist the attempt so we have a per-term recall history.
    if (user) {
      await (supabase.from("recall_attempts") as any).insert({
        user_id: user.id,
        term_id: termId,
        mode,
        score_pct: pct,
        response: text,
        triggered_reinforcement: pct < 60,
      });
    }

    if (pct < 60) {
      // Hand control to the reinforcement loop. It will mark the layer done.
      setTimeout(onTriggerReinforcement, 600);
    }
  }, [response, mode, fill.answers, definition, recordRecallReconstruction, user, termId, onTriggerReinforcement]);

  const handleRetry = () => {
    setSubmitted(false);
    setResponse("");
    setScorePct(0);
  };

  const tier =
    scorePct >= 80 ? "strong" : scorePct >= 50 ? "fair" : "weak";

  const tierLabel =
    tier === "strong" ? "Strong recall" :
    tier === "fair"   ? "Building recall" : "Recall needs reinforcement";

  const tierColor =
    tier === "strong" ? "hsl(145 55% 38%)" :
    tier === "fair"   ? "hsl(35 80% 45%)"  : "hsl(355 70% 48%)";

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}>
      <div className="space-y-4">
        {/* Mode toggle */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => { setMode("fill_blank"); handleRetry(); }}
            className="flex-1 px-3 py-2 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5"
            style={{
              background: mode === "fill_blank" ? accentColor : "hsl(var(--muted))",
              color: mode === "fill_blank" ? "white" : "hsl(var(--muted-foreground))",
            }}
          >
            <BookOpen className="h-3.5 w-3.5" /> Fill the Blanks
          </button>
          <button
            onClick={() => { setMode("write_fully"); handleRetry(); }}
            className="flex-1 px-3 py-2 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5"
            style={{
              background: mode === "write_fully" ? accentColor : "hsl(var(--muted))",
              color: mode === "write_fully" ? "white" : "hsl(var(--muted-foreground))",
            }}
          >
            <PenLine className="h-3.5 w-3.5" /> Write It Fully
          </button>
        </div>

        {/* Prompt */}
        <article className="editorial-card">
          <div className="editorial-card-header">
            <span className="num">03</span>
            <span className="label">From You, Not Me</span>
            <span className="title">{termTitle}</span>
          </div>
          <div className="editorial-card-body">
            {mode === "fill_blank" ? (
              <p className="text-base leading-relaxed" style={{ color: "hsl(220 20% 22%)" }}>
                {fill.masked || `Write what ${termTitle} is and what it does, in your own words.`}
              </p>
            ) : (
              <p className="text-base leading-relaxed" style={{ color: "hsl(220 20% 22%)" }}>
                Write the definition of <strong>{termTitle}</strong> in your own words — what it is, what it does, why it matters.
              </p>
            )}
          </div>
        </article>

        {/* Response */}
        <Textarea
          placeholder={mode === "fill_blank"
            ? "Type the missing words…"
            : "In your own words…"}
          value={response}
          onChange={(e) => setResponse(e.target.value)}
          disabled={submitted}
          className="min-h-[120px] text-sm"
          style={{ background: "hsl(40 30% 99%)" }}
        />

        {!submitted && (
          <Button
            className="w-full py-5 gap-2"
            onClick={handleSubmit}
            disabled={!response.trim()}
            style={{ background: accentColor, color: "white" }}
          >
            Submit Recall <ArrowRight className="h-4 w-4" />
          </Button>
        )}

        {submitted && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl overflow-hidden"
            style={{
              background: tier === "weak" ? "hsl(0 70% 97%)" : tier === "fair" ? "hsl(35 80% 96%)" : "hsl(145 50% 96%)",
              border: `2px solid ${tierColor}`,
            }}
          >
            <header className="px-4 py-3 flex items-center gap-3" style={{ borderBottom: `1px solid ${tierColor}40` }}>
              {tier === "weak" ? (
                <AlertTriangle className="h-5 w-5 flex-shrink-0" style={{ color: tierColor }} />
              ) : (
                <CheckCircle2 className="h-5 w-5 flex-shrink-0" style={{ color: tierColor }} />
              )}
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em]" style={{ color: tierColor }}>
                  Recall Score · {scorePct}%
                </p>
                <p className="font-display text-base font-bold leading-tight" style={{ color: "hsl(220 25% 18%)" }}>
                  {tierLabel}
                </p>
              </div>
            </header>
            <div className="px-4 py-3 space-y-3 bg-white/60">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: "hsl(220 15% 45%)" }}>
                  Canonical answer
                </p>
                <p className="text-sm leading-relaxed mt-1" style={{ color: "hsl(220 20% 22%)" }}>
                  {definition}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {tier !== "weak" && (
                  <Button size="sm" onClick={onComplete} style={{ background: tierColor, color: "white" }}>
                    Continue Lesson <ArrowRight className="h-3.5 w-3.5 ml-1" />
                  </Button>
                )}
                {tier === "weak" && (
                  <Button size="sm" onClick={onTriggerReinforcement} style={{ background: tierColor, color: "white" }}>
                    Strengthen This Layer
                  </Button>
                )}
                <Button size="sm" variant="outline" onClick={handleRetry}>
                  <RefreshCw className="h-3.5 w-3.5 mr-1" /> Try Again
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};

export default RecallReconstruction;
