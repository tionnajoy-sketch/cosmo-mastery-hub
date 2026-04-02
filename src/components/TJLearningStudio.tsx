import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { motion, AnimatePresence } from "framer-motion";
import { BookOpen, RefreshCw, Loader2, Volume2, Presentation, ListChecks, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useDNAAdaptation } from "@/hooks/useDNAAdaptation";
import ReactMarkdown from "react-markdown";

interface TeachStep {
  step: number;
  title: string;
  content: string;
  activity?: string | null;
}

interface Slide {
  slide: number;
  heading: string;
  body: string;
  visualCue: string;
  speakerNote: string;
}

interface TJLearningStudioProps {
  termName: string;
  definition: string;
  metaphor?: string;
  additionalContent?: string;
  mode?: "inline" | "panel";
  onAudioScript?: (script: string) => void;
  onContentGenerated?: (text: string) => void;
}

type StudioMode = "summary" | "explanation" | "teach-flow" | "explain-again" | "slideshow" | "audio-script";

const TJLearningStudio = ({
  termName, definition, metaphor, additionalContent, mode = "inline", onAudioScript, onContentGenerated,
}: TJLearningStudioProps) => {
  const { profile } = useAuth();
  const { dna } = useDNAAdaptation();

  const [activeMode, setActiveMode] = useState<StudioMode | null>(null);
  const [content, setContent] = useState("");
  const [teachSteps, setTeachSteps] = useState<TeachStep[]>([]);
  const [slides, setSlides] = useState<Slide[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [currentTeachStep, setCurrentTeachStep] = useState(0);

  const generate = useCallback(async (type: StudioMode) => {
    setLoading(true);
    setActiveMode(type);
    setContent("");
    setTeachSteps([]);
    setSlides([]);
    setCurrentSlide(0);
    setCurrentTeachStep(0);

    try {
      const { data, error } = await supabase.functions.invoke("tj-learning-studio", {
        body: {
          type,
          termName,
          definition,
          metaphor: metaphor || "",
          content: additionalContent || "",
          dnaCode: profile?.tj_dna_code || "",
          program: profile?.selected_program || "cosmetology",
        },
      });

      if (error) throw error;

      const result = data?.content || "";

      if (type === "teach-flow") {
        try {
          const cleaned = result.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
          setTeachSteps(JSON.parse(cleaned));
        } catch { setContent(result); }
      } else if (type === "slideshow") {
        try {
          const cleaned = result.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
          setSlides(JSON.parse(cleaned));
        } catch { setContent(result); }
      } else {
        setContent(result);
        if (type === "audio-script" && onAudioScript) onAudioScript(result);
        if (onContentGenerated && result) onContentGenerated(result);
      }
    } catch (e) {
      console.error("Studio error:", e);
      setContent("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [termName, definition, metaphor, additionalContent, profile, onAudioScript]);

  const actions: { key: StudioMode; label: string; icon: React.ReactNode; desc: string }[] = [
    { key: "summary", label: "Quick Summary", icon: <Sparkles className="w-4 h-4" />, desc: "Key takeaways" },
    { key: "explanation", label: "Guided Explanation", icon: <BookOpen className="w-4 h-4" />, desc: "Step-by-step teaching" },
    { key: "teach-flow", label: "Teaching Flow", icon: <ListChecks className="w-4 h-4" />, desc: "Interactive steps" },
    { key: "slideshow", label: "Slideshow", icon: <Presentation className="w-4 h-4" />, desc: "Visual breakdown" },
    { key: "audio-script", label: "Audio Script", icon: <Volume2 className="w-4 h-4" />, desc: "Narration ready" },
    { key: "explain-again", label: "Explain Again", icon: <RefreshCw className="w-4 h-4" />, desc: "Fresh perspective" },
  ];

  return (
    <div className="space-y-3">
      {/* Action buttons */}
      <div className="grid grid-cols-3 gap-2">
        {actions.map(a => (
          <Button
            key={a.key}
            variant={activeMode === a.key ? "default" : "outline"}
            size="sm"
            onClick={() => generate(a.key)}
            disabled={loading}
            className="flex flex-col items-center gap-1 h-auto py-2 text-xs"
          >
            {a.icon}
            <span className="font-medium">{a.label}</span>
          </Button>
        ))}
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center gap-2 py-6 text-muted-foreground">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span className="text-sm">TJ is preparing your content…</span>
        </div>
      )}

      {/* Content display */}
      <AnimatePresence mode="wait">
        {!loading && content && activeMode !== "teach-flow" && activeMode !== "slideshow" && (
          <motion.div
            key="content"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
          >
            <Card className="border-primary/20">
              <CardContent className="p-4 prose prose-sm max-w-none dark:prose-invert">
                <ReactMarkdown>{content}</ReactMarkdown>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Teach Flow */}
        {!loading && teachSteps.length > 0 && (
          <motion.div key="teach" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <Card className="border-primary/20">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-muted-foreground">
                    Step {currentTeachStep + 1} of {teachSteps.length}
                  </span>
                  <div className="flex gap-1">
                    <Button size="sm" variant="ghost" disabled={currentTeachStep === 0} onClick={() => setCurrentTeachStep(p => p - 1)}>←</Button>
                    <Button size="sm" variant="ghost" disabled={currentTeachStep === teachSteps.length - 1} onClick={() => setCurrentTeachStep(p => p + 1)}>→</Button>
                  </div>
                </div>
                <AnimatePresence mode="wait">
                  <motion.div key={currentTeachStep} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                    <h4 className="font-bold text-sm">{teachSteps[currentTeachStep]?.title}</h4>
                    <p className="text-sm mt-1 text-muted-foreground">{teachSteps[currentTeachStep]?.content}</p>
                    {teachSteps[currentTeachStep]?.activity && (
                      <div className="mt-2 px-3 py-2 rounded-md bg-primary/10 text-xs">
                        <span className="font-semibold">Activity:</span> {teachSteps[currentTeachStep].activity}
                      </div>
                    )}
                  </motion.div>
                </AnimatePresence>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Slideshow */}
        {!loading && slides.length > 0 && (
          <motion.div key="slides" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <Card className="border-primary/20 overflow-hidden">
              <div className="bg-gradient-to-r from-primary/20 to-accent/20 p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-muted-foreground">
                    Slide {currentSlide + 1} / {slides.length}
                  </span>
                  <div className="flex gap-1">
                    <Button size="sm" variant="ghost" disabled={currentSlide === 0} onClick={() => setCurrentSlide(p => p - 1)}>←</Button>
                    <Button size="sm" variant="ghost" disabled={currentSlide === slides.length - 1} onClick={() => setCurrentSlide(p => p + 1)}>→</Button>
                  </div>
                </div>
                <AnimatePresence mode="wait">
                  <motion.div key={currentSlide} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}>
                    <h3 className="text-lg font-bold">{slides[currentSlide]?.heading}</h3>
                    <p className="text-sm mt-2">{slides[currentSlide]?.body}</p>
                    <div className="mt-3 p-2 rounded bg-background/60 text-xs text-muted-foreground italic">
                      🎨 {slides[currentSlide]?.visualCue}
                    </div>
                  </motion.div>
                </AnimatePresence>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default TJLearningStudio;
