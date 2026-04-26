import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Brain, Eye, SkipForward, AlertCircle, Gauge, Layers,
  Activity, Compass, Sparkles, RefreshCw,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { loadBehaviorSummary, type SummaryItem, type SummaryKey } from "@/lib/behavior-summary";

const ICONS: Record<SummaryKey, JSX.Element> = {
  thinking_path: <Compass className="h-3.5 w-3.5" />,
  skipped_layer: <SkipForward className="h-3.5 w-3.5" />,
  error_type: <AlertCircle className="h-3.5 w-3.5" />,
  confidence_trend: <Gauge className="h-3.5 w-3.5" />,
  preferred_mode: <Layers className="h-3.5 w-3.5" />,
  cognitive_load: <Activity className="h-3.5 w-3.5" />,
  breakdown_pattern: <Eye className="h-3.5 w-3.5" />,
  recovery_pattern: <RefreshCw className="h-3.5 w-3.5" />,
  next_layer: <Sparkles className="h-3.5 w-3.5" />,
};

export default function BehaviorSummaryPanel() {
  const { user } = useAuth();
  const [items, setItems] = useState<SummaryItem[] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) { setLoading(false); return; }
    let cancelled = false;
    setLoading(true);
    loadBehaviorSummary(user.id)
      .then((res) => { if (!cancelled) setItems(res); })
      .catch(() => { if (!cancelled) setItems([]); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [user?.id]);

  return (
    <motion.section
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.18 }}
      aria-label="How You're Learning Today"
    >
      <Card className="border-0 shadow-md bg-card overflow-hidden">
        <div className="flex">
          <div className="w-2 flex-shrink-0" style={{ background: "hsl(265 55% 55%)" }} />
          <CardContent className="p-5 flex-1">
            <div className="flex items-center gap-3 mb-4">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: "hsl(265 55% 55% / 0.12)" }}
              >
                <Brain className="h-5 w-5" style={{ color: "hsl(265 55% 55%)" }} />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">
                  Behavior Summary
                </p>
                <h3 className="font-display text-base font-semibold text-foreground">
                  How You're Learning Today
                </h3>
              </div>
            </div>

            {loading && (
              <p className="text-sm text-muted-foreground">Reading your learning signals…</p>
            )}

            {!loading && items && items.length === 0 && (
              <p className="text-sm text-muted-foreground">
                Open a few terms — your learning patterns will start showing up here.
              </p>
            )}

            {!loading && items && items.length > 0 && (
              <ul className="space-y-2.5">
                {items.map((it) => (
                  <li
                    key={it.key}
                    className="flex gap-3 p-3 rounded-lg"
                    style={{
                      background: it.empty ? "hsl(30 15% 96%)" : "hsl(265 55% 55% / 0.05)",
                      opacity: it.empty ? 0.7 : 1,
                    }}
                  >
                    <div
                      className="mt-0.5 h-6 w-6 rounded-md flex items-center justify-center flex-shrink-0"
                      style={{
                        background: it.accent ?? "hsl(265 55% 55%)",
                        color: "white",
                      }}
                    >
                      {ICONS[it.key]}
                    </div>
                    <div className="min-w-0">
                      <p
                        className="text-[10px] font-semibold uppercase tracking-[0.14em]"
                        style={{ color: it.accent ?? "hsl(265 55% 55%)" }}
                      >
                        {it.title}
                      </p>
                      <p className="text-sm leading-relaxed text-foreground mt-0.5">
                        {it.message}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </div>
      </Card>
    </motion.section>
  );
}
