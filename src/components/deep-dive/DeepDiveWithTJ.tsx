import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Loader2, Sparkles, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import SpeakButton from "@/components/SpeakButton";

export interface DeepDiveData {
  hook: string;
  expanded_breakdown: string;
  analogy: string;
  challenge: string;
  memory_cue: string;
  why_it_matters: string;
  mentor_check_in: string;
}

interface Props {
  termId?: string;
  termTitle: string;
  definition?: string;
  stepColor: string;
}

const SECTIONS: { key: keyof DeepDiveData; label: string; emoji: string }[] = [
  { key: "hook", label: "The Hook", emoji: "🎬" },
  { key: "expanded_breakdown", label: "Expanded Breakdown", emoji: "🔬" },
  { key: "analogy", label: "TJ's Analogy", emoji: "🌉" },
  { key: "challenge", label: "Logic Challenge", emoji: "🧩" },
  { key: "memory_cue", label: "Memory Cue", emoji: "📌" },
  { key: "why_it_matters", label: "Why This Matters", emoji: "💡" },
  { key: "mentor_check_in", label: "TJ Mentor Check-In", emoji: "🎙️" },
];

const DeepDiveWithTJ = ({ termId, termTitle, definition, stepColor }: Props) => {
  const [open, setOpen] = useState(false);
  const [deepDive, setDeepDive] = useState<DeepDiveData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [cached, setCached] = useState(false);

  const fetchDeepDive = async (force = false) => {
    setLoading(true);
    setError("");
    try {
      const { data, error: fnErr } = await supabase.functions.invoke(
        "generate-deep-dive-content",
        {
          body: { term_id: termId, term_title: termTitle, definition, force },
        },
      );
      if (fnErr) throw fnErr;
      if (data?.error) throw new Error(data.error);
      if (!data?.deep_dive) throw new Error("No deep dive returned");
      setDeepDive({
        hook: data.deep_dive.hook || "",
        expanded_breakdown: data.deep_dive.expanded_breakdown || "",
        analogy: data.deep_dive.analogy || "",
        challenge: data.deep_dive.challenge || "",
        memory_cue: data.deep_dive.memory_cue || "",
        why_it_matters: data.deep_dive.why_it_matters || "",
        mentor_check_in: data.deep_dive.mentor_check_in || "",
      });
      setCached(!!data.cached);
    } catch (e: any) {
      console.error("deep dive fetch failed", e);
      setError(e?.message || "Couldn't load the Deep Dive. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = () => {
    const next = !open;
    setOpen(next);
    if (next && !deepDive && !loading) {
      fetchDeepDive(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15 }}
      className="mt-8 rounded-2xl overflow-hidden"
      style={{
        background: `linear-gradient(135deg, ${stepColor}06, ${stepColor}12)`,
        border: `2px dashed ${stepColor}55`,
      }}
    >
      <button
        type="button"
        onClick={handleToggle}
        aria-expanded={open}
        className="w-full flex items-center gap-3 px-5 py-4 text-left transition-all hover:opacity-95"
        style={{
          background: open ? `${stepColor}10` : "transparent",
          borderBottom: open ? `1px solid ${stepColor}30` : "none",
        }}
      >
        <div
          className="flex-shrink-0 h-10 w-10 rounded-full flex items-center justify-center text-xl"
          style={{
            background: `${stepColor}20`,
            border: `1.5px solid ${stepColor}50`,
          }}
        >
          🌊
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h4
              className="font-display text-base font-bold m-0"
              style={{ color: stepColor }}
            >
              Deep Dive with TJ
            </h4>
            <span
              className="text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full"
              style={{
                background: `${stepColor}25`,
                color: stepColor,
              }}
            >
              Optional
            </span>
          </div>
          <p
            className="text-xs mt-0.5 m-0"
            style={{ color: "hsl(var(--muted-foreground))" }}
          >
            {open
              ? "Story, analogy, challenge, and a mentor moment from TJ."
              : "Want to go deeper? Tap to unlock TJ's extended teaching."}
          </p>
        </div>
        <motion.span
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.25 }}
          className="flex-shrink-0"
          style={{ color: stepColor }}
        >
          <ChevronDown className="h-5 w-5" />
        </motion.span>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.28 }}
            className="overflow-hidden"
          >
            <div className="px-4 sm:px-5 py-4 space-y-3">
              {loading && !deepDive && (
                <div className="flex items-center gap-3 py-8 justify-center">
                  <Loader2
                    className="h-5 w-5 animate-spin"
                    style={{ color: stepColor }}
                  />
                  <p
                    className="text-sm italic"
                    style={{ color: "hsl(var(--muted-foreground))" }}
                  >
                    TJ is pulling this one off the top shelf…
                  </p>
                </div>
              )}

              {error && !deepDive && (
                <div
                  className="rounded-xl p-3 text-sm flex items-center justify-between gap-3"
                  style={{
                    background: "hsl(0 60% 96%)",
                    border: "1px solid hsl(0 60% 85%)",
                    color: "hsl(0 60% 35%)",
                  }}
                >
                  <span>{error}</span>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => fetchDeepDive(false)}
                  >
                    Try again
                  </Button>
                </div>
              )}

              {deepDive && (
                <>
                  {SECTIONS.map((s, i) => {
                    const text = deepDive[s.key]?.trim();
                    if (!text) return null;
                    return (
                      <motion.div
                        key={s.key}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.05 * i }}
                        className="rounded-xl overflow-hidden"
                        style={{
                          background: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                        }}
                      >
                        <div
                          className="px-3 py-2 flex items-center justify-between gap-2"
                          style={{
                            background: `${stepColor}10`,
                            borderBottom: "1px solid hsl(var(--border))",
                          }}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="text-base">{s.emoji}</span>
                            <h5
                              className="font-display text-xs font-bold uppercase tracking-wide m-0 truncate"
                              style={{ color: stepColor }}
                            >
                              {s.label}
                            </h5>
                          </div>
                          <SpeakButton
                            text={text}
                            size="sm"
                            label={`Hear ${s.label}`}
                          />
                        </div>
                        <div
                          className="px-3 py-2.5 text-sm leading-relaxed whitespace-pre-wrap"
                          style={{ color: "hsl(var(--foreground))" }}
                        >
                          {text}
                        </div>
                      </motion.div>
                    );
                  })}

                  <div className="flex items-center justify-between gap-2 pt-1">
                    <div
                      className="flex items-center gap-2 text-[11px]"
                      style={{ color: "hsl(var(--muted-foreground))" }}
                    >
                      <Sparkles className="h-3 w-3" />
                      <span>
                        {cached
                          ? "Saved Deep Dive — same voice every time."
                          : "Freshly generated by TJ."}
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => fetchDeepDive(true)}
                      className="h-7 px-2 text-xs gap-1"
                      title="Regenerate"
                      disabled={loading}
                    >
                      <RefreshCw
                        className={`h-3 w-3 ${loading ? "animate-spin" : ""}`}
                      />
                      Refresh
                    </Button>
                  </div>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default DeepDiveWithTJ;
