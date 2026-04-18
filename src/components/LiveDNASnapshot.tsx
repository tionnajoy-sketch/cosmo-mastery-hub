import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Dna, Radio, ChevronRight } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useLearningMetrics } from "@/hooks/useLearningMetrics";

const charToPct = (char: string | null | undefined, base: "upper" | "lower"): number => {
  if (!char) return 50;
  const code = base === "upper" ? char.toUpperCase().charCodeAt(0) - 65 : char.toLowerCase().charCodeAt(0) - 97;
  return Math.max(0, Math.min(100, Math.round((code / 25) * 100)));
};

const DNA_COLORS = [
  "hsl(265 60% 55%)", // L
  "hsl(215 70% 50%)", // E
  "hsl(145 55% 45%)", // R
  "hsl(45 85% 50%)",  // C
];

/** Live DNA Snapshot strip. Shows code + Engagement/Retention/Confidence bars updating in real time. */
const LiveDNASnapshot = () => {
  const { profile } = useAuth();
  const { aggregate } = useLearningMetrics();
  const [pulse, setPulse] = useState(0);

  const code = profile?.tj_dna_code || "----";
  const engagement = ((profile?.dna_engagement ?? 5) / 9) * 100;
  const retention = charToPct(profile?.dna_retention, "upper");
  const confidence = charToPct(profile?.dna_confidence, "lower");

  // Flash bars when DNA fields change
  useEffect(() => {
    setPulse((p) => p + 1);
  }, [profile?.dna_engagement, profile?.dna_retention, profile?.dna_confidence, profile?.tj_dna_code, aggregate.totalXP]);

  const bars = [
    { label: "Engagement", value: engagement, color: "hsl(215 70% 55%)" },
    { label: "Retention", value: retention, color: "hsl(265 60% 60%)" },
    { label: "Confidence", value: confidence, color: "hsl(145 55% 50%)" },
  ];

  return (
    <Link
      to="/dna"
      className="block rounded-2xl p-4 mb-5 transition-all hover:scale-[1.005]"
      style={{
        background: "linear-gradient(135deg, hsl(265 30% 12% / 0.6), hsl(215 30% 12% / 0.6))",
        border: "1px solid hsl(265 40% 40% / 0.3)",
      }}
    >
      <div className="flex items-center justify-between gap-4 flex-wrap">
        {/* Left: DNA code + live indicator */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="p-2 rounded-lg" style={{ background: "hsl(265 60% 55% / 0.2)" }}>
            <Dna className="h-4 w-4" style={{ color: "hsl(265 70% 75%)" }} />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <span className="text-[9px] font-bold uppercase tracking-widest" style={{ color: "hsl(0 0% 100% / 0.5)" }}>
                Your Learning DNA
              </span>
              <span className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-widest" style={{ color: "hsl(145 70% 65%)" }}>
                <motion.span
                  animate={{ opacity: [1, 0.3, 1] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                  className="w-1.5 h-1.5 rounded-full"
                  style={{ background: "hsl(145 70% 55%)" }}
                />
                Live
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              {code.split("").slice(0, 4).map((ch, i) => (
                <span
                  key={i}
                  className="font-display text-base font-bold w-7 h-7 rounded-md flex items-center justify-center text-white"
                  style={{ background: DNA_COLORS[i] || DNA_COLORS[0] }}
                >
                  {ch}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Center: live bars */}
        <div className="flex-1 grid grid-cols-3 gap-3 min-w-[240px]">
          {bars.map((b) => (
            <div key={b.label}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[9px] font-semibold uppercase tracking-wider" style={{ color: "hsl(0 0% 100% / 0.55)" }}>
                  {b.label}
                </span>
                <span className="text-[10px] font-bold" style={{ color: b.color }}>
                  {Math.round(b.value)}
                </span>
              </div>
              <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "hsl(0 0% 100% / 0.08)" }}>
                <motion.div
                  key={`${b.label}-${pulse}`}
                  initial={{ width: 0 }}
                  animate={{ width: `${b.value}%` }}
                  transition={{ duration: 0.7, ease: "easeOut" }}
                  className="h-full rounded-full"
                  style={{ background: b.color, boxShadow: `0 0 10px ${b.color}` }}
                />
              </div>
            </div>
          ))}
        </div>

        {/* Right: CTA */}
        <div className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider" style={{ color: "hsl(0 0% 100% / 0.6)" }}>
          <Radio className="h-3 w-3" />
          <span>Updates as you learn</span>
          <ChevronRight className="h-3 w-3" />
        </div>
      </div>
    </Link>
  );
};

export default LiveDNASnapshot;
