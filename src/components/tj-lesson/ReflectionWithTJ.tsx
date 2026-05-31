import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Loader2, Heart, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface ReflectionWithTJProps {
  lessonSlug: string;
  lessonTitle: string;
  prompt: string;
  accentColor?: string;
}

interface TJResponse {
  mirror: string;
  affirm: string;
  next_nudge: string;
}

/**
 * Reflection layer that turns the journal entry into a guided conversation.
 * On submit, TJ replies with a 3-part contextual response (mirror / affirm / nudge).
 */
export default function ReflectionWithTJ({
  lessonSlug,
  lessonTitle,
  prompt,
  accentColor,
}: ReflectionWithTJProps) {
  const { user } = useAuth();
  const [reflection, setReflection] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [tjResponse, setTjResponse] = useState<TJResponse | null>(null);
  const [cachedReflection, setCachedReflection] = useState<string>("");

  const accent = accentColor || "hsl(265 65% 60%)";

  // Load any prior reflection for this lesson
  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from("tj_reflection_responses" as any)
        .select("reflection_text, tj_response")
        .eq("user_id", user.id)
        .eq("lesson_slug", lessonSlug)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (data) {
        const row = data as any;
        setCachedReflection(row.reflection_text || "");
        if (row.tj_response && typeof row.tj_response === "object") {
          setTjResponse(row.tj_response as TJResponse);
        }
      }
    })();
  }, [user, lessonSlug]);

  const submit = async () => {
    if (!user || !reflection.trim()) return;
    setSubmitting(true);
    try {
      const { data, error } = await supabase.functions.invoke("tj-reflection-response", {
        body: {
          lesson_slug: lessonSlug,
          lesson_title: lessonTitle,
          prompt,
          reflection: reflection.trim(),
        },
      });
      if (error) throw error;
      const resp = (data as any)?.response as TJResponse;
      if (resp) {
        setTjResponse(resp);
        setCachedReflection(reflection.trim());

        // Persist
        await supabase.from("tj_reflection_responses" as any).insert({
          user_id: user.id,
          lesson_slug: lessonSlug,
          reflection_text: reflection.trim(),
          tj_response: resp as any,
        } as any);
        toast.success("TJ responded — saved to your journal");
      }
    } catch (e) {
      console.error(e);
      toast.error("Couldn't reach TJ right now. Your reflection is still saved locally.");
    } finally {
      setSubmitting(false);
    }
  };

  const startOver = () => {
    setTjResponse(null);
    setReflection("");
    setCachedReflection("");
  };

  return (
    <div>
      <p className="text-card-foreground font-display text-lg leading-relaxed mb-4">
        {prompt}
      </p>

      {!tjResponse ? (
        <>
          <Textarea
            value={reflection}
            onChange={(e) => setReflection(e.target.value)}
            placeholder="TJ is listening. Two sentences is enough."
            className="min-h-[140px] resize-none"
          />
          <div className="flex items-center justify-between mt-3">
            <span className="text-xs text-muted-foreground">
              Your words shape TJ's reply.
            </span>
            <Button
              onClick={submit}
              disabled={!reflection.trim() || submitting}
              style={{ backgroundColor: accent, color: "white" }}
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-1 animate-spin" /> TJ is thinking…
                </>
              ) : (
                <>
                  Send to TJ <ArrowRight className="h-4 w-4 ml-1" />
                </>
              )}
            </Button>
          </div>
        </>
      ) : (
        <AnimatePresence mode="wait">
          <motion.div
            key="response"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            {cachedReflection && (
              <div className="rounded-xl border border-border bg-muted/40 p-4">
                <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground mb-1">
                  Your reflection
                </div>
                <p className="text-sm text-foreground whitespace-pre-line">{cachedReflection}</p>
              </div>
            )}

            <div
              className="rounded-2xl p-5 border"
              style={{
                borderColor: `${accent.replace("hsl(", "hsla(").replace(")", " / 0.4)")}`,
                background: `linear-gradient(135deg, ${accent.replace("hsl(", "hsla(").replace(")", " / 0.10)")}, hsl(var(--card)))`,
              }}
            >
              <div className="flex items-center gap-2 mb-4">
                <div
                  className="h-7 w-7 rounded-full flex items-center justify-center"
                  style={{ background: accent }}
                >
                  <Sparkles className="h-3.5 w-3.5 text-white" />
                </div>
                <span className="text-[11px] uppercase tracking-[0.2em] font-semibold" style={{ color: accent }}>
                  TJ's response
                </span>
              </div>

              <div className="space-y-4 text-card-foreground">
                <ResponseBlock label="What I'm hearing" text={tjResponse.mirror} accent={accent} />
                <ResponseBlock
                  label="What I want you to hold onto"
                  text={tjResponse.affirm}
                  accent={accent}
                  icon={<Heart className="h-3 w-3" />}
                />
                <ResponseBlock label="Next nudge" text={tjResponse.next_nudge} accent={accent} />
              </div>
            </div>

            <div className="flex justify-end">
              <Button variant="ghost" size="sm" onClick={startOver}>
                Reflect again
              </Button>
            </div>
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  );
}

function ResponseBlock({
  label,
  text,
  accent,
  icon,
}: {
  label: string;
  text: string;
  accent: string;
  icon?: React.ReactNode;
}) {
  return (
    <div>
      <div
        className="text-[10px] uppercase tracking-[0.18em] font-semibold mb-1 flex items-center gap-1.5"
        style={{ color: accent }}
      >
        {icon}
        {label}
      </div>
      <p className="text-[15px] leading-relaxed">{text}</p>
    </div>
  );
}
