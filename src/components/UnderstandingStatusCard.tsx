import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";
import { Brain } from "lucide-react";
import {
  UNDERSTANDING_COLOR,
  UNDERSTANDING_DESCRIPTION,
  UNDERSTANDING_LABEL,
  type UnderstandingStatus,
} from "@/lib/confidence/understanding";

interface UnderstandingCardProps {
  userId: string;
}

const ORDER: UnderstandingStatus[] = [
  "strong_understanding",
  "fragile_understanding",
  "strong_misconception",
  "recognized_uncertainty",
  "building_understanding",
  "developing_misconception",
];

export default function UnderstandingStatusCard({ userId }: UnderstandingCardProps) {
  const [counts, setCounts] = useState<Record<UnderstandingStatus, number>>({
    strong_understanding: 0,
    fragile_understanding: 0,
    strong_misconception: 0,
    recognized_uncertainty: 0,
    building_understanding: 0,
    developing_misconception: 0,
  });
  const [total, setTotal] = useState(0);

  useEffect(() => {
    if (!userId) return;
    const load = async () => {
      const { data } = await supabase
        .from("confidence_ratings")
        .select("understanding_status")
        .eq("user_id", userId);
      if (!data) return;
      const next = { ...counts };
      Object.keys(next).forEach((k) => (next[k as UnderstandingStatus] = 0));
      data.forEach((r) => {
        const k = r.understanding_status as UnderstandingStatus;
        if (k in next) next[k] += 1;
      });
      setCounts(next);
      setTotal(data.length);
    };
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  if (total === 0) {
    return (
      <Card className="border-0 shadow-md mb-4" style={{ background: "white" }}>
        <CardContent className="p-5">
          <div className="flex items-center gap-2 mb-2">
            <Brain className="h-5 w-5" style={{ color: "hsl(265 60% 55%)" }} />
            <h3 className="font-display text-lg font-semibold" style={{ color: "hsl(220 30% 22%)" }}>
              Understanding Insight
            </h3>
          </div>
          <p className="text-sm" style={{ color: "hsl(220 15% 50%)" }}>
            Answer some quiz or practice questions and rate your confidence to see how solid each
            answer feels.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
      <Card className="border-0 shadow-md mb-4" style={{ background: "white" }}>
        <CardContent className="p-5">
          <div className="flex items-center gap-2 mb-3">
            <Brain className="h-5 w-5" style={{ color: "hsl(265 60% 55%)" }} />
            <h3 className="font-display text-lg font-semibold" style={{ color: "hsl(220 30% 22%)" }}>
              Understanding Insight
            </h3>
          </div>
          <p className="text-xs mb-4" style={{ color: "hsl(220 15% 50%)" }}>
            Based on {total} answer{total === 1 ? "" : "s"} you rated for confidence.
          </p>
          <div className="space-y-2">
            {ORDER.filter((k) => counts[k] > 0).map((k) => {
              const palette = UNDERSTANDING_COLOR[k];
              const pct = Math.round((counts[k] / total) * 100);
              return (
                <div
                  key={k}
                  className="rounded-lg p-3"
                  style={{ background: palette.bg, border: `1px solid ${palette.border}` }}
                >
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span
                      className="text-xs font-bold uppercase tracking-wide"
                      style={{ color: palette.chip }}
                    >
                      {UNDERSTANDING_LABEL[k]}
                    </span>
                    <span
                      className="font-display text-sm font-bold"
                      style={{ color: palette.text }}
                    >
                      {counts[k]} · {pct}%
                    </span>
                  </div>
                  <p className="text-xs leading-snug" style={{ color: palette.text }}>
                    {UNDERSTANDING_DESCRIPTION[k]}
                  </p>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
