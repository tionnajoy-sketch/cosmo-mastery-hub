/* DeepDiveCacheReset — Admin-only "Regenerate Deep Dives" panel.
 *
 * Clears cached `deep_dive_content` on terms so the next learner view
 * regenerates the section with the latest TJ Deep Dive logic. No need to
 * rebuild the whole lesson.
 */

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, CheckCircle2, AlertCircle, RefreshCw, Waves } from "lucide-react";
import { toast } from "@/hooks/use-toast";

type Mode = "all" | "stale";

export default function DeepDiveCacheReset() {
  const [cachedCount, setCachedCount] = useState<number | null>(null);
  const [totalCount, setTotalCount] = useState<number | null>(null);
  const [running, setRunning] = useState(false);
  const [lastMessage, setLastMessage] = useState("");
  const [lastCleared, setLastCleared] = useState<number | null>(null);

  const refresh = async () => {
    const [{ count: total }, { count: cached }] = await Promise.all([
      supabase.from("terms").select("id", { count: "exact", head: true }),
      supabase
        .from("terms")
        .select("id", { count: "exact", head: true })
        .not("deep_dive_content", "is", null),
    ]);
    setTotalCount(total ?? 0);
    setCachedCount(cached ?? 0);
  };

  useEffect(() => {
    void refresh();
  }, []);

  const run = async (mode: Mode) => {
    setRunning(true);
    setLastMessage(
      mode === "all"
        ? "Clearing every cached Deep Dive…"
        : "Clearing Deep Dives from older TJ versions…",
    );
    try {
      const { data, error } = await supabase.functions.invoke(
        "reset-deep-dive-cache",
        { body: { mode } },
      );
      if (error) throw error;
      const cleared = (data as any)?.cleared ?? 0;
      setLastCleared(cleared);
      setLastMessage(
        cleared === 0
          ? "Nothing to clear — every Deep Dive is already on the latest version."
          : `Cleared ${cleared} cached Deep Dive${cleared === 1 ? "" : "s"}. Next view will regenerate with the latest TJ logic.`,
      );
      toast({
        title: "Deep Dives reset",
        description: `${cleared} term${cleared === 1 ? "" : "s"} will regenerate on next view.`,
      });
      await refresh();
    } catch (e: any) {
      console.error("reset deep dive failed", e);
      setLastMessage(`Error: ${e?.message || "Unknown error"}`);
      toast({
        title: "Reset failed",
        description: e?.message || "Unknown error",
        variant: "destructive",
      });
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="rounded-2xl border bg-card p-5 space-y-4">
      <div className="flex items-start gap-3">
        <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary/15 text-primary">
          <Waves className="h-5 w-5" />
        </div>
        <div className="flex-1">
          <h3 className="text-base font-semibold">Regenerate Deep Dives</h3>
          <p className="text-sm text-muted-foreground">
            Clears cached <code className="text-xs">deep_dive_content</code> so the
            "Deep Dive with TJ" section regenerates with the latest TJ logic on the next learner view.
            The main lesson (Break Down · Information · Apply · Assess) is untouched.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 text-center">
        <Stat label="Total terms" value={totalCount} />
        <Stat
          label="Cached Deep Dives"
          value={cachedCount}
          tone={cachedCount && cachedCount > 0 ? "warn" : "ok"}
        />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button onClick={() => run("all")} disabled={running || cachedCount === 0}>
          {running ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Working…
            </>
          ) : (
            <>
              <RefreshCw className="mr-2 h-4 w-4" /> Regenerate all Deep Dives
            </>
          )}
        </Button>
        <Button variant="outline" onClick={() => run("stale")} disabled={running}>
          Only update old TJ versions
        </Button>
        <Button variant="ghost" onClick={refresh} disabled={running}>
          Refresh
        </Button>
      </div>

      {lastMessage && (
        <div className="rounded-lg bg-muted/40 px-3 py-2 text-xs text-muted-foreground flex items-center gap-2">
          {lastCleared !== null && lastCleared > 0 ? (
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
          ) : (
            <AlertCircle className="h-3.5 w-3.5 text-amber-500" />
          )}
          <span>{lastMessage}</span>
        </div>
      )}

      <p className="text-[11px] text-muted-foreground italic">
        Note: Deep Dives regenerate on-demand (only when a learner taps to expand the section), so this is free until someone opens it.
      </p>
    </div>
  );
}

function Stat({
  label,
  value,
  tone = "neutral",
}: {
  label: string;
  value: number | null;
  tone?: "neutral" | "ok" | "warn";
}) {
  const color =
    tone === "warn"
      ? "text-amber-500"
      : tone === "ok"
        ? "text-emerald-500"
        : "text-foreground";
  return (
    <div className="rounded-xl border border-border/40 bg-background/40 px-3 py-2">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className={`text-xl font-bold tabular-nums ${color}`}>{value ?? "—"}</p>
    </div>
  );
}
