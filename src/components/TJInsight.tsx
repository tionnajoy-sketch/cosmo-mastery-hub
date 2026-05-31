import { Sparkles } from "lucide-react";
import { motion } from "framer-motion";

interface TJInsightProps {
  text: string;
  attribution?: string;
}

/**
 * TJ Insight™ — the transformational closing moment of every lesson.
 * Use at the end of any lesson, layer, or deep-dive to leave the learner
 * with a memorable, emotionally meaningful shift.
 */
const TJInsight = ({ text, attribution = "TJ Insight™" }: TJInsightProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="relative overflow-hidden rounded-2xl shadow-xl"
      style={{
        background: "linear-gradient(135deg, hsl(var(--plum)), hsl(var(--violet)))",
        color: "hsl(var(--cream))",
      }}
    >
      {/* Gold corner accent */}
      <div
        className="absolute -top-12 -right-12 w-32 h-32 rounded-full blur-2xl opacity-40"
        style={{ background: "hsl(var(--gold))" }}
      />
      <div className="relative p-6">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="h-4 w-4" style={{ color: "hsl(var(--gold))" }} />
          <span
            className="text-[10px] uppercase tracking-[0.24em] font-bold"
            style={{ color: "hsl(var(--gold))" }}
          >
            {attribution}
          </span>
        </div>
        <p
          className="font-display text-base md:text-lg leading-relaxed italic"
          style={{ color: "hsl(var(--cream))" }}
        >
          &ldquo;{text}&rdquo;
        </p>
      </div>
    </motion.div>
  );
};

export default TJInsight;
