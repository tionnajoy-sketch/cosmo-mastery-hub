import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import { Loader2, CheckCircle2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import SpeakButton from "@/components/SpeakButton";
import { pageColors } from "@/lib/colors";

const c = pageColors.study;

interface EtymologyPart {
  part: string;
  origin: string;
  meaning: string;
}

interface TermListItemProps {
  termTitle: string;
  pronunciation?: string;
  definition: string;
  index: number;
  isCompleted?: boolean;
  onContinue: () => void;
}

const TermListItem = ({ termTitle, pronunciation, definition, index, isCompleted, onContinue }: TermListItemProps) => {
  const [etymology, setEtymology] = useState<EtymologyPart[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);

  // Auto-load etymology on mount
  useState(() => {
    if (!loaded && !loading) {
      setLoaded(true);
      setLoading(true);
      supabase.functions.invoke("ai-mentor-chat", {
        body: {
          messages: [{
            role: "user",
            content: `Break down "${termTitle}" into etymological parts (prefix, root, suffix). For each part give: part, origin language, meaning. Definition: "${definition}". Respond ONLY with JSON array: [{"part":"...","origin":"...","meaning":"..."}]. No markdown.`,
          }],
          sectionName: "Etymology",
        },
      }).then(({ data }) => {
        const text = data?.response || data?.choices?.[0]?.message?.content || "";
        const match = text.match(/\[[\s\S]*\]/);
        if (match) {
          try { setEtymology(JSON.parse(match[0])); } catch {}
        }
        setLoading(false);
      }).catch(() => setLoading(false));
    }
  });

  return (
    <motion.div
      className="w-full text-left p-4 sm:p-5 rounded-2xl"
      style={{
        background: "hsl(0 0% 100% / 0.94)",
        backdropFilter: "blur(8px)",
        border: isCompleted ? "2px solid hsl(145 40% 70%)" : "2px solid hsl(0 0% 88%)",
        boxShadow: "0 2px 12px hsl(0 0% 0% / 0.06)",
      }}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.04 * index }}
    >
      {/* Term number + name + speaker */}
      <div className="flex items-center gap-3 mb-2">
        <div
          className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
          style={{
            background: isCompleted ? "hsl(145 40% 92%)" : "hsl(215 60% 95%)",
            color: isCompleted ? "hsl(145 40% 35%)" : "hsl(215 80% 42%)",
            border: isCompleted ? "1.5px solid hsl(145 40% 70%)" : "1.5px solid hsl(215 60% 80%)",
          }}
        >
          {isCompleted ? <CheckCircle2 className="h-4 w-4" /> : index + 1}
        </div>

        <h3 className="font-display text-xl sm:text-2xl font-bold flex-1" style={{ color: c.heading }}>
          {termTitle}
        </h3>

        <SpeakButton text={termTitle} size="icon" className="h-8 w-8 flex-shrink-0" />

        {isCompleted && (
          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full" style={{ background: "hsl(145 40% 92%)", color: "hsl(145 40% 35%)", border: "1px solid hsl(145 40% 75%)" }}>
            Mastered
          </span>
        )}
      </div>

      {/* Pronunciation */}
      {pronunciation && (
        <p className="text-sm italic ml-11 mb-2" style={{ color: c.subtext }}>
          /{pronunciation}/
        </p>
      )}

      {/* Etymology breakdown */}
      {loading && (
        <div className="flex items-center gap-2 ml-11 mt-1 mb-3">
          <Loader2 className="h-3.5 w-3.5 animate-spin" style={{ color: c.subtext }} />
          <span className="text-xs" style={{ color: c.subtext }}>Loading root breakdown…</span>
        </div>
      )}

      {etymology && (
        <div className="ml-11 mb-3 space-y-1.5">
          <p className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: "hsl(30 85% 45%)" }}>
            Root Breakdown
          </p>
          <div className="flex flex-wrap gap-1.5">
            {etymology.map((part, i) => (
              <div key={i} className="flex items-center gap-1">
                <div
                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs"
                  style={{
                    background: "hsl(30 45% 95%)",
                    border: "1px solid hsl(30 35% 85%)",
                  }}
                >
                  <span className="font-bold" style={{ color: "hsl(30 85% 40%)" }}>{part.part}</span>
                  <span style={{ color: c.subtext }}>= "{part.meaning}"</span>
                  <span className="text-[9px] uppercase tracking-wider px-1 py-0.5 rounded" style={{ background: "hsl(30 40% 88%)", color: "hsl(30 60% 35%)" }}>
                    {part.origin}
                  </span>
                  <SpeakButton
                    text={`${part.part}, meaning ${part.meaning}, from ${part.origin}`}
                    size="icon"
                    className="h-5 w-5"
                  />
                </div>
                {i < etymology.length - 1 && (
                  <span className="text-xs font-bold" style={{ color: "hsl(30 60% 55%)" }}>+</span>
                )}
              </div>
            ))}
          </div>

          {/* Combined meaning */}
          <p className="text-xs mt-1" style={{ color: c.bodyText }}>
            <strong style={{ color: "hsl(30 85% 40%)" }}>{termTitle}</strong> ={" "}
            {etymology.map((p) => `"${p.meaning}"`).join(" + ")}
          </p>
        </div>
      )}

      {/* Continue button */}
      <div className="ml-11 mt-3">
        <Button
          onClick={onContinue}
          className="gap-2 px-6 py-2.5 text-sm font-semibold shadow-md transition-all hover:shadow-lg"
          style={{
            background: "linear-gradient(135deg, hsl(215 80% 42%), hsl(200 85% 48%))",
            color: "hsl(0 0% 100%)",
          }}
        >
          Study This Term <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </motion.div>
  );
};

export default TermListItem;
