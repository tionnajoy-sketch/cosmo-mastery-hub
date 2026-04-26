import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Loader2, Sparkles, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { LayerBlockSection } from "@/components/LayerBlockSection";
import SpeakButton from "@/components/SpeakButton";
import { Button } from "@/components/ui/button";

export interface GuidedLessonData {
  opening_breakdown: string;
  origin_root_meaning: string;
  history_context: string;
  guided_understanding: string;
  why_it_matters: string;
}

interface Props {
  termId?: string;
  termTitle: string;
  definition?: string;
  stepColor: string;
  /** When true, automatically fetch on mount (default: true) */
  autoLoad?: boolean;
}

const SECTIONS: { key: keyof GuidedLessonData; label: string; emoji: string }[] = [
  { key: "opening_breakdown", label: "Let's break it down", emoji: "👋" },
  { key: "origin_root_meaning", label: "Where the word comes from", emoji: "🌱" },
  { key: "history_context", label: "Why it exists in practice", emoji: "📖" },
  { key: "guided_understanding", label: "How it actually works", emoji: "🧭" },
  { key: "why_it_matters", label: "Why this matters for you", emoji: "✨" },
];

const GuidedLessonPanel = ({
  termId,
  termTitle,
  definition,
  stepColor,
  autoLoad = true,
}: Props) => {
  const [lesson, setLesson] = useState<GuidedLessonData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [cached, setCached] = useState(false);
  const fetchedFor = useRef<string | null>(null);

  const fetchLesson = async (force = false) => {
    setLoading(true);
    setError("");
    try {
      const { data, error: fnErr } = await supabase.functions.invoke(
        "generate-guided-lesson",
        {
          body: {
            term_id: termId,
            term_title: termTitle,
            definition,
            force,
          },
        },
      );
      if (fnErr) throw fnErr;
      if (data?.error) throw new Error(data.error);
      if (!data?.lesson) throw new Error("No lesson returned");
      setLesson({
        opening_breakdown: data.lesson.opening_breakdown || "",
        origin_root_meaning: data.lesson.origin_root_meaning || "",
        history_context: data.lesson.history_context || "",
        guided_understanding: data.lesson.guided_understanding || "",
        why_it_matters: data.lesson.why_it_matters || "",
      });
      setCached(!!data.cached);
    } catch (e: any) {
      console.error("guided lesson fetch failed", e);
      setError(e?.message || "Couldn't load the guided lesson. Try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const key = termId || termTitle;
    if (!autoLoad || !key) return;
    if (fetchedFor.current === key) return;
    fetchedFor.current = key;
    fetchLesson(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [termId, termTitle, autoLoad]);

  return (
    <LayerBlockSection
      title="Guided Lesson — TJ's voice"
      icon="🎙️"
      accentColor={stepColor}
      defaultOpen
    >
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs italic" style={{ color: "hsl(var(--muted-foreground))" }}>
            A grounded walk-through in TJ's teaching voice — no textbook talk.
          </p>
          {lesson && !loading && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => fetchLesson(true)}
              className="h-7 px-2 text-xs gap-1"
              title="Regenerate"
            >
              <RefreshCw className="h-3 w-3" />
              Refresh
            </Button>
          )}
        </div>

        {loading && !lesson && (
          <div className="flex items-center gap-3 py-6">
            <Loader2 className="h-5 w-5 animate-spin" style={{ color: stepColor }} />
            <p className="text-sm" style={{ color: "hsl(var(--muted-foreground))" }}>
              TJ is putting this lesson together…
            </p>
          </div>
        )}

        {error && !lesson && (
          <div
            className="rounded-xl p-3 text-sm flex items-center justify-between gap-3"
            style={{
              background: "hsl(0 60% 96%)",
              border: "1px solid hsl(0 60% 85%)",
              color: "hsl(0 60% 35%)",
            }}
          >
            <span>{error}</span>
            <Button size="sm" variant="outline" onClick={() => fetchLesson(false)}>
              Try again
            </Button>
          </div>
        )}

        {lesson && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-2"
          >
            {SECTIONS.map((s, i) => {
              const text = lesson[s.key]?.trim();
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
                    <SpeakButton text={text} size="sm" label={`Hear ${s.label}`} />
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

            <div
              className="flex items-center gap-2 text-[11px] pt-1"
              style={{ color: "hsl(var(--muted-foreground))" }}
            >
              <Sparkles className="h-3 w-3" />
              <span>
                {cached
                  ? "Saved guided lesson — same voice every time."
                  : "Freshly generated in TJ's voice."}
              </span>
            </div>
          </motion.div>
        )}
      </div>
    </LayerBlockSection>
  );
};

export default GuidedLessonPanel;
