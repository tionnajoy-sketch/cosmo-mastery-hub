import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import { ChevronRight, Loader2 } from "lucide-react";
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
  onClick: () => void;
}

const TermListItem = ({ termTitle, pronunciation, definition, index, isCompleted, onClick }: TermListItemProps) => {
  const [etymology, setEtymology] = useState<EtymologyPart[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);

  // Auto-load etymology on first render
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
    <motion.button
      onClick={onClick}
      className="w-full text-left p-4 sm:p-5 rounded-2xl transition-all group"
      style={{
        background: "hsl(0 0% 100% / 0.92)",
        backdropFilter: "blur(8px)",
        border: isCompleted ? "2px solid hsl(145 40% 70%)" : "2px solid hsl(0 0% 90%)",
        boxShadow: "0 2px 12px hsl(0 0% 0% / 0.06)",
      }}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.04 * index }}
      whileHover={{ scale: 1.01, boxShadow: "0 4px 20px hsl(0 0% 0% / 0.1)" }}
      whileTap={{ scale: 0.99 }}
    >
      <div className="flex items-start gap-3">
        {/* Number badge */}
        <div
          className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
          style={{
            background: isCompleted ? "hsl(145 40% 92%)" : "hsl(215 60% 95%)",
            color: isCompleted ? "hsl(145 40% 35%)" : "hsl(215 80% 42%)",
            border: isCompleted ? "1.5px solid hsl(145 40% 70%)" : "1.5px solid hsl(215 60% 80%)",
          }}
        >
          {index + 1}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Term + pronunciation + speaker */}
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-display text-lg sm:text-xl font-bold truncate" style={{ color: c.heading }}>
              {termTitle}
            </h3>
            <SpeakButton text={termTitle} size="icon" className="h-7 w-7" />
          </div>

          {pronunciation && (
            <p className="text-xs italic mb-2" style={{ color: c.subtext }}>
              /{pronunciation}/
            </p>
          )}

          {/* Etymology breakdown */}
          {loading && (
            <div className="flex items-center gap-2 mt-1">
              <Loader2 className="h-3 w-3 animate-spin" style={{ color: c.subtext }} />
              <span className="text-[11px]" style={{ color: c.subtext }}>Loading roots…</span>
            </div>
          )}

          {etymology && (
            <div className="flex flex-wrap gap-1.5 mt-1">
              {etymology.map((part, i) => (
                <div key={i} className="flex items-center gap-1">
                  <div
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px]"
                    style={{
                      background: "hsl(30 45% 95%)",
                      border: "1px solid hsl(30 35% 85%)",
                    }}
                  >
                    <span className="font-bold" style={{ color: "hsl(30 85% 40%)" }}>{part.part}</span>
                    <span style={{ color: c.subtext }}>= "{part.meaning}"</span>
                    <SpeakButton
                      text={`${part.part}, meaning ${part.meaning}, from ${part.origin}`}
                      size="icon"
                      className="h-5 w-5 ml-0.5"
                    />
                  </div>
                  {i < etymology.length - 1 && (
                    <span className="text-[10px] font-bold" style={{ color: "hsl(30 60% 55%)" }}>+</span>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Definition preview */}
          <div className="flex items-center gap-2 mt-2">
            <p className="text-xs line-clamp-1" style={{ color: c.subtext }}>
              {definition}
            </p>
            <SpeakButton text={`${termTitle}. ${definition}`} size="icon" className="h-5 w-5 flex-shrink-0" />
          </div>
        </div>

        {/* Arrow */}
        <ChevronRight
          className="flex-shrink-0 h-5 w-5 mt-2 transition-transform group-hover:translate-x-1"
          style={{ color: c.subtext }}
        />
      </div>
    </motion.button>
  );
};

export default TermListItem;
