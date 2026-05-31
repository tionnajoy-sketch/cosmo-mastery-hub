import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ArrowRight, Sparkles, BookOpen, Eye, Hand, Layers, Search, Lightbulb, Info, Heart, PenLine, Target, Wand2, Flame } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import ActiveBeat from "@/components/tj-lesson/ActiveBeat";
import ReflectionWithTJ from "@/components/tj-lesson/ReflectionWithTJ";

interface TJLesson {
  id: string;
  slug: string;
  title: string;
  cluster: string | null;
  purpose: string | null;
  why_it_matters: string | null;
  definition: string | null;
  word_origin: string | null;
  related_concepts: string[] | null;
  visualize: string | null;
  apply: string | null;
  breakdown: string | null;
  recognize: string | null;
  metaphor: string | null;
  information: string | null;
  awareness: string | null;
  reflect_prompt: string | null;
  assess: { question?: string; type?: string; rubric?: string[] } | null;
  tj_insight: string | null;
  accent_color: string | null;
  layer_color_overrides: Record<string, string> | null;
}

interface LayerDef {
  key: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}

const LAYERS: LayerDef[] = [
  { key: "purpose",        label: "Purpose",            icon: Target,    color: "hsl(38 92% 58%)" },
  { key: "why_it_matters", label: "Why It Matters",     icon: Flame,     color: "hsl(345 75% 62%)" },
  { key: "definition",     label: "Definition",         icon: BookOpen,  color: "hsl(220 70% 60%)" },
  { key: "word_origin",    label: "Word Origin",        icon: Sparkles,  color: "hsl(280 60% 60%)" },
  { key: "knowledge_web",  label: "Knowledge Web",      icon: Layers,    color: "hsl(180 55% 50%)" },
  { key: "visualize",      label: "Visualize",          icon: Eye,       color: "hsl(200 80% 55%)" },
  { key: "apply",          label: "Apply",              icon: Hand,      color: "hsl(150 55% 48%)" },
  { key: "breakdown",      label: "Break It Down",      icon: Layers,    color: "hsl(25 85% 58%)" },
  { key: "recognize",      label: "Recognize",          icon: Search,    color: "hsl(340 70% 60%)" },
  { key: "metaphor",       label: "Metaphor",           icon: Lightbulb, color: "hsl(50 90% 58%)" },
  { key: "information",    label: "Information",        icon: Info,      color: "hsl(210 60% 50%)" },
  { key: "awareness",      label: "Awareness",          icon: Heart,     color: "hsl(0 65% 60%)" },
  { key: "reflect",        label: "Reflect",            icon: PenLine,   color: "hsl(265 65% 60%)" },
  { key: "assess_card",    label: "Show What You Know", icon: Wand2,     color: "hsl(160 70% 45%)" },
];

function slugify(s: string) {
  return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export default function TJLessonPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [lesson, setLesson] = useState<TJLesson | null>(null);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState(0);
  const [reflection, setReflection] = useState("");
  const [assessAnswer, setAssessAnswer] = useState("");
  const [showInsight, setShowInsight] = useState(false);

  useEffect(() => {
    if (!slug) return;
    (async () => {
      const { data, error } = await supabase
        .from("tj_lessons" as any)
        .select("*")
        .eq("slug", slug)
        .maybeSingle();
      if (error) toast.error("Couldn't load lesson");
      setLesson((data as unknown as TJLesson) ?? null);
      setLoading(false);
    })();
  }, [slug]);

  const activeLayers = useMemo(() => {
    if (!lesson) return [];
    return LAYERS.filter((l) => {
      if (l.key === "knowledge_web") return (lesson.related_concepts?.length ?? 0) > 0;
      if (l.key === "reflect") return !!lesson.reflect_prompt;
      if (l.key === "assess_card") return !!lesson.assess?.question;
      const v = (lesson as any)[l.key];
      return typeof v === "string" && v.trim().length > 0;
    });
  }, [lesson]);

  const current = activeLayers[step];
  const isLast = step === activeLayers.length - 1;

  const saveReflection = async () => {
    if (!user || !lesson || !reflection.trim()) return;
    const { error } = await supabase
      .from("tj_lesson_reflections" as any)
      .insert({ user_id: user.id, lesson_slug: lesson.slug, reflection: reflection.trim() } as any);
    if (error) toast.error("Couldn't save reflection");
    else {
      toast.success("Saved to your journal");
      setReflection("");
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-background text-muted-foreground">Loading lesson…</div>;
  }
  if (!lesson || !current) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-3">
        <p className="text-muted-foreground">Lesson not found.</p>
        <Link to="/" className="underline text-foreground">Back home</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/30">
      <header className="sticky top-0 z-20 backdrop-blur bg-background/80 border-b border-border">
        <div className="max-w-3xl mx-auto px-5 py-3 flex items-center justify-between">
          <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition">
            <ArrowLeft className="h-4 w-4" /> Back
          </button>
          <div className="text-center">
            <div className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">{lesson.cluster ?? "TJ Lesson"}</div>
            <div className="font-display text-base font-semibold text-foreground">{lesson.title}</div>
          </div>
          <div className="text-xs text-muted-foreground tabular-nums">{step + 1} / {activeLayers.length}</div>
        </div>
        <div className="max-w-3xl mx-auto px-5 pb-3 flex gap-1">
          {activeLayers.map((l, i) => (
            <div
              key={l.label}
              className="h-1 flex-1 rounded-full transition-all"
              style={{ backgroundColor: i <= step ? (lesson.accent_color || l.color) : "hsl(var(--muted))" }}
            />
          ))}
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-5 py-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
          >
            <Card
              className="relative overflow-hidden border-border/60 shadow-xl bg-card"
              style={{ boxShadow: `0 24px 70px -28px ${lesson.accent_color || current.color}, 0 14px 40px -30px ${current.color}` }}
            >
              <div className="h-1.5 w-full" style={{ background: `linear-gradient(90deg, ${current.color}, ${lesson.accent_color || current.color})` }} />
              <div className="p-7 sm:p-10">
                <div className="flex items-center gap-3 mb-5">
                  <div
                    className="h-10 w-10 rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: `${current.color.replace("hsl(", "hsla(").replace(")", " / 0.15)")}`, color: current.color }}
                  >
                    <current.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-[11px] uppercase tracking-[0.2em]" style={{ color: current.color }}>
                      Layer {step + 1}
                    </div>
                    <h2 className="font-display text-2xl font-bold text-card-foreground">{current.label}</h2>
                  </div>
                </div>

                <LayerBody
                  lesson={lesson}
                  layer={current}
                  reflection={reflection}
                  setReflection={setReflection}
                  onSaveReflection={saveReflection}
                  assessAnswer={assessAnswer}
                  setAssessAnswer={setAssessAnswer}
                  onNavigateSlug={(s) => navigate(`/lesson/${s}`)}
                />
              </div>
            </Card>
          </motion.div>
        </AnimatePresence>

        <div className="flex items-center justify-between mt-6">
          <Button variant="ghost" onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={step === 0}>
            <ArrowLeft className="h-4 w-4 mr-1" /> Previous
          </Button>
          {!isLast ? (
            <Button onClick={() => setStep((s) => s + 1)} style={{ backgroundColor: lesson.accent_color || current.color, color: "white" }}>
              Next layer <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          ) : (
            <Button onClick={() => setShowInsight(true)} className="bg-foreground text-background hover:opacity-90">
              <Sparkles className="h-4 w-4 mr-1" /> Reveal TJ Insight
            </Button>
          )}
        </div>

        <AnimatePresence>
          {showInsight && lesson.tj_insight && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mt-8"
            >
              <Card className="relative overflow-hidden bg-gradient-to-br from-foreground to-foreground/90 text-background p-8 border-0">
                <div className="absolute inset-0 opacity-10" style={{ background: "radial-gradient(circle at 20% 20%, white, transparent 50%)" }} />
                <div className="relative">
                  <div className="flex items-center gap-2 mb-3 text-amber-200">
                    <Sparkles className="h-4 w-4" />
                    <span className="text-[11px] uppercase tracking-[0.2em] font-semibold">TJ Insight™</span>
                  </div>
                  <p className="font-display text-xl leading-relaxed">{lesson.tj_insight}</p>
                  <div className="mt-6 pt-6 border-t border-background/20 flex gap-3">
                    <Button variant="secondary" onClick={() => navigate("/learn")}>Back to lessons</Button>
                    <Button variant="ghost" className="text-background hover:bg-background/10" onClick={() => { setShowInsight(false); setStep(0); }}>
                      Review lesson
                    </Button>
                  </div>
                </div>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        <footer className="mt-12 text-center text-[11px] text-muted-foreground">
          © Tionna Anderson · TJ Anderson Layer Method™
        </footer>
      </main>
    </div>
  );
}

function LayerBody({
  lesson, layer, reflection, setReflection, onSaveReflection, assessAnswer, setAssessAnswer, onNavigateSlug,
}: {
  lesson: TJLesson;
  layer: LayerDef;
  reflection: string;
  setReflection: (v: string) => void;
  onSaveReflection: () => void;
  assessAnswer: string;
  setAssessAnswer: (v: string) => void;
  onNavigateSlug: (slug: string) => void;
}) {
  if (layer.key === "knowledge_web") {
    return (
      <div>
        <p className="text-muted-foreground mb-5">This lesson connects to other concepts in your Knowledge Web™. Tap to jump.</p>
        <div className="flex flex-wrap gap-2">
          {(lesson.related_concepts ?? []).map((c) => (
            <button
              key={c}
              onClick={() => onNavigateSlug(slugify(c))}
              className="px-4 py-2 rounded-full text-sm font-medium border border-border bg-muted/40 text-foreground hover:border-foreground hover:bg-muted transition"
              style={{ borderColor: lesson.accent_color || undefined }}
            >
              {c}
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (layer.key === "reflect") {
    return (
      <ReflectionWithTJ
        lessonSlug={lesson.slug}
        lessonTitle={lesson.title}
        prompt={lesson.reflect_prompt || ""}
        accentColor={lesson.accent_color || layer.color}
      />
    );
  }

  if (layer.key === "visualize") {
    const content = (lesson as any)[layer.key] as string;
    return (
      <div>
        <p className="text-card-foreground text-lg leading-relaxed font-light whitespace-pre-line">{content}</p>
        <ActiveBeat
          prompt="What's the first thing you notice when you picture this?"
          accentColor={lesson.accent_color || layer.color}
          acknowledgement="That noticing is your visual anchor — hold onto it."
        />
      </div>
    );
  }

  if (layer.key === "apply") {
    const content = (lesson as any)[layer.key] as string;
    return (
      <div>
        <p className="text-card-foreground text-lg leading-relaxed font-light whitespace-pre-line">{content}</p>
        <ActiveBeat
          prompt="In your own work, where would this show up first?"
          options={["On the client's skin", "In my consultation", "In product choice", "I'm not sure yet"]}
          accentColor={lesson.accent_color || layer.color}
        />
      </div>
    );
  }

  if (layer.key === "awareness") {
    const content = (lesson as any)[layer.key] as string;
    return (
      <div>
        <p className="text-card-foreground text-lg leading-relaxed font-light whitespace-pre-line">{content}</p>
        <ActiveBeat
          prompt="Right now, how solid does this feel?"
          options={["Clicked — I see it", "Half-there", "Still fuzzy"]}
          accentColor={lesson.accent_color || layer.color}
          acknowledgement="Naming where you are is half the work."
        />
      </div>
    );
  }

  if (layer.key === "assess_card") {
    return (
      <div>
        <p className="text-card-foreground font-display text-lg leading-relaxed mb-4">
          {lesson.assess?.question}
        </p>
        <Textarea
          value={assessAnswer}
          onChange={(e) => setAssessAnswer(e.target.value)}
          placeholder="Answer in your own words — no multiple choice here, just your thinking."
          className="min-h-[140px] resize-none"
        />
        <p className="text-xs text-muted-foreground mt-3">
          This is your understanding check. Multiple-choice testing happens in the Quiz & Final Exam blocks.
        </p>
      </div>
    );
  }

  const content = (lesson as any)[layer.key] as string;
  return (
    <p className="text-card-foreground text-lg leading-relaxed font-light whitespace-pre-line">
      {content}
    </p>
  );
}
