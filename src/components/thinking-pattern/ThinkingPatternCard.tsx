/* ThinkingPatternCard — subtle profile readout: most used / most successful / least effective. */

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Brain, TrendingUp, TrendingDown } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import {
  getThinkingProfile,
  recommendFromProfile,
  THINKING_LABELS,
  THINKING_PATHS,
  type ThinkingPath,
  type ThinkingProfile,
} from "@/lib/thinking-pattern";

const EMOJI: Record<ThinkingPath, string> = {
  visual: "🖼️",
  verbal: "💬",
  logical: "🧩",
  story: "📖",
  kinesthetic: "✋",
};

export default function ThinkingPatternCard() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<ThinkingProfile | null>(null);

  useEffect(() => {
    if (!user?.id) return;
    let alive = true;
    getThinkingProfile(user.id).then((p) => {
      if (alive) setProfile(p);
    });
    return () => {
      alive = false;
    };
  }, [user?.id]);

  if (!profile) return null;
  if (profile.totalSelections === 0) return null;

  const rec = recommendFromProfile(profile);
  const max = Math.max(1, ...THINKING_PATHS.map((p) => profile.counts[p] ?? 0));

  return (
    <motion.section
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-border/40 bg-card/60 p-4 backdrop-blur-sm"
    >
      <header className="mb-3 flex items-center gap-2">
        <div className="grid h-7 w-7 place-items-center rounded-full bg-primary/15 text-primary">
          <Brain className="h-3.5 w-3.5" />
        </div>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
            Your Thinking Profile
          </p>
          <p className="text-xs text-muted-foreground">
            {profile.totalSelections} selections so far
          </p>
        </div>
      </header>

      <div className="grid gap-2 sm:grid-cols-3">
        <Tile
          label="Most used"
          path={profile.mostUsed}
          tone="text-foreground"
        />
        <Tile
          label="Most successful"
          path={profile.mostSuccessful}
          icon={<TrendingUp className="h-3 w-3" />}
          tone="text-emerald-500"
        />
        <Tile
          label="Least effective"
          path={profile.leastEffective}
          icon={<TrendingDown className="h-3 w-3" />}
          tone="text-rose-500"
        />
      </div>

      <div className="mt-4 space-y-1.5">
        {THINKING_PATHS.map((p) => {
          const c = profile.counts[p] ?? 0;
          if (c === 0) return null;
          const correct = profile.correctCounts[p] ?? 0;
          const pct = Math.round((c / max) * 100);
          const rate = Math.round((correct / c) * 100);
          return (
            <div key={p} className="flex items-center gap-2 text-xs">
              <span className="w-20 shrink-0 text-muted-foreground">
                {EMOJI[p]} {THINKING_LABELS[p]}
              </span>
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted/50">
                <div
                  className="h-full rounded-full bg-primary/70"
                  style={{ width: `${pct}%` }}
                />
              </div>
              <span className="w-16 shrink-0 text-right tabular-nums text-muted-foreground">
                {c} · {rate}%
              </span>
            </div>
          );
        })}
      </div>

      <p className="mt-3 rounded-xl bg-primary/5 px-3 py-2 text-xs text-foreground/80">
        {rec.message}
      </p>
    </motion.section>
  );
}

function Tile({
  label,
  path,
  icon,
  tone,
}: {
  label: string;
  path: ThinkingPath | null;
  icon?: React.ReactNode;
  tone: string;
}) {
  return (
    <div className="rounded-xl border border-border/30 bg-background/40 px-3 py-2">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p className={`mt-1 flex items-center gap-1.5 text-sm font-semibold ${tone}`}>
        {icon}
        {path ? `${EMOJI[path]} ${THINKING_LABELS[path]}` : "—"}
      </p>
    </div>
  );
}
