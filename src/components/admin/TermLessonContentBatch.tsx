/* TermLessonContentBatch — Admin-only one-shot generator panel.
 *
 * Calls the `generate-term-lesson-content` edge function in batches of 5
 * until every term has Break Down + Information + Assess content stored
 * in the `terms` table. After this completes, the app reads cached fields
 * with no live AI calls.
 */

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, CheckCircle2, AlertCircle, Sparkles } from "lucide-react";
import { toast } from "@/hooks/use-toast";

const BATCH_SIZE = 5;

export default function TermLessonContentBatch() {
  const [missing, setMissing] = useState<number | null>(null);
  const [total, setTotal] = useState<number | null>(null);
  const [running, setRunning] = useState(false);
  const [processed, setProcessed] = useState(0);
  const [okCount, setOkCount] = useState(0);
  const [errCount, setErrCount] = useState(0);
  const [lastMessage, setLastMessage] = useState<string>("");

  const refresh = async () => {
    const [{ count: totalCount }, { count: missingCount }] = await Promise.all([
      supabase.from("terms").select("id", { count: "exact", head: true }),
      supabase
        .from("terms")
        .select("id", { count: "exact", head: true })
        .or(
          "break_it_down_content.is.null,break_it_down_content.eq.,information_content.is.null,information_content.eq.,assess_question.is.null,assess_question.eq.",
        ),
    ]);
    setTotal(totalCount ?? 0);
    setMissing(missingCount ?? 0);
  };

  useEffect(() => {
    void refresh();
  }, []);

  const runBatch = async () => {
    setRunning(true);
    setProcessed(0);
    setOkCount(0);
    setErrCount(0);
    setLastMessage("Starting…");

    try {
      // Loop until no more missing or we hit a hard stop
      // We re-check `missing` each pass via the function's own filter.
      let safety = 0;
      while (safety < 100) {
        safety++;
        setLastMessage(`Generating batch ${safety}…`);
        const { data, error } = await supabase.functions.invoke(
          "generate-term-lesson-content",
          { body: { batch: true, limit: BATCH_SIZE } },
        );
        if (error) {
          setErrCount((c) => c + 1);
          setLastMessage(`Edge function error: ${error.message}`);
          toast({
            title: "Generation paused",
            description: error.message,
            variant: "destructive",
          });
          break;
        }
        const payload = data as {
          processed: number;
          ok: number;
          results?: Array<{ status: string; error?: string; term: string }>;
        };
        if (!payload || payload.processed === 0) {
          setLastMessage("All terms already have content. Done.");
          break;
        }
        setProcessed((p) => p + payload.processed);
        setOkCount((c) => c + payload.ok);
        setErrCount((c) => c + (payload.processed - payload.ok));

        const creditsExhausted = payload.results?.some((r) => r.error === "credits_exhausted");
        if (creditsExhausted) {
          setLastMessage("AI credits exhausted. Add credits and resume.");
          toast({
            title: "AI credits exhausted",
            description: "Top up credits in Settings → Workspace → Usage, then resume.",
            variant: "destructive",
          });
          break;
        }

        const rateLimited = payload.results?.every((r) => r.error === "rate_limited");
        if (rateLimited) {
          setLastMessage("Rate limited — pausing 5s…");
          await new Promise((r) => setTimeout(r, 5000));
        }
      }

      await refresh();
      toast({ title: "Generation complete", description: `${okCount} terms updated.` });
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="rounded-2xl border bg-card p-5 space-y-4">
      <div className="flex items-start gap-3">
        <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary/15 text-primary">
          <Sparkles className="h-5 w-5" />
        </div>
        <div className="flex-1">
          <h3 className="text-base font-semibold">Generate Term Lesson Content</h3>
          <p className="text-sm text-muted-foreground">
            One-shot generator. For every term, writes Break Down (root + origin + plain-language
            breakdown), Information (TJ-voice teaching paragraph), and Assess (state-board MCQ + answer + explanation)
            directly into the <code className="text-xs">terms</code> table. Skips terms that already have all three.
            After this runs, the app reads cached content — no live AI calls.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 text-center">
        <Stat label="Total terms" value={total} />
        <Stat label="Missing content" value={missing} tone={missing && missing > 0 ? "warn" : "ok"} />
        <Stat label="Processed this run" value={processed} />
      </div>

      <div className="flex items-center gap-2">
        <Button onClick={runBatch} disabled={running || missing === 0}>
          {running ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Generating…
            </>
          ) : missing === 0 ? (
            <>
              <CheckCircle2 className="mr-2 h-4 w-4" /> All terms have content
            </>
          ) : (
            <>Generate for {missing ?? "—"} missing terms</>
          )}
        </Button>
        <Button variant="ghost" onClick={refresh} disabled={running}>
          Refresh
        </Button>
      </div>

      {(running || lastMessage) && (
        <div className="rounded-lg bg-muted/40 px-3 py-2 text-xs text-muted-foreground flex items-center gap-2">
          {errCount > 0 ? (
            <AlertCircle className="h-3.5 w-3.5 text-amber-500" />
          ) : (
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
          )}
          <span>
            {lastMessage} · {okCount} ok · {errCount} errors
          </span>
        </div>
      )}
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
