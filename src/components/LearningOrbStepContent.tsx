import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import {
  CheckCircle2, XCircle, Loader2,
} from "lucide-react";
import { pageColors } from "@/lib/colors";
import SpeakButton from "@/components/SpeakButton";
import SpeechToTextButton from "@/components/SpeechToTextButton";
import BrainNote from "@/components/BrainNote";
import VideoPlayer from "@/components/VideoPlayer";
import type { UploadedBlock } from "@/components/UploadedTermCard";

const c = pageColors.study;

interface EtymologyPart {
  part: string;
  origin: string;
  meaning: string;
}

interface StepContentProps {
  stepKey: string;
  block: UploadedBlock;
  mode: "uploaded" | "builtin";
  user: any;
  // Visualize
  imageUrl: string;
  imageLoading: boolean;
  generateImage: () => void;
  videoSuggestions: { label: string; url: string }[];
  videoLoading: boolean;
  fetchVideoSuggestions: () => void;
  // Recognize
  identityItems: any[];
  recognizeSelected: number | null;
  setRecognizeSelected: (v: number | null) => void;
  recognizeRevealed: boolean;
  setRecognizeRevealed: (v: boolean) => void;
  // Reflection
  reflectionText: string;
  setReflectionText: (v: string) => void;
  reflectionSubmitted: boolean;
  setReflectionSubmitted: (v: boolean) => void;
  onReflectionSave: () => void;
  // Practice / Journal
  journalNote: string;
  setJournalNote: (v: string) => void;
  journalSaving: boolean;
  // Quiz
  quizSelected: string | null;
  setQuizSelected: (v: string | null) => void;
  quizRevealed: boolean;
  setQuizRevealed: (v: boolean) => void;
  // Audio
  handleAudioComplete: () => void;
  stepColor: string;
}

const EtymologyBreakdown = ({ block }: { block: UploadedBlock }) => {
  const [etymology, setEtymology] = useState<EtymologyPart[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const decode = async () => {
    setLoading(true);
    setError("");
    try {
      const { data } = await supabase.functions.invoke("ai-mentor-chat", {
        body: {
          messages: [
            {
              role: "user",
              content: `Break down the word "${block.term_title}" into its etymological parts (prefix, root, suffix). For each part give: the part itself, its language of origin (Latin, Greek, etc.), and its meaning. Definition for context: "${block.definition}". Respond ONLY with a JSON array like: [{"part":"Epi","origin":"Greek","meaning":"upon, above"},{"part":"dermis","origin":"Greek","meaning":"skin"}]. No markdown, no explanation, just the JSON array.`,
            },
          ],
          sectionName: "Etymology",
        },
      });
      const text = data?.response || data?.choices?.[0]?.message?.content || "";
      const match = text.match(/\[[\s\S]*\]/);
      if (match) {
        setEtymology(JSON.parse(match[0]));
      } else {
        setError("Could not parse etymology. Try again.");
      }
    } catch {
      setError("Failed to load etymology.");
    }
    setLoading(false);
  };

  return (
    <div className="space-y-3">
      {block.pronunciation && (
        <motion.div
          className="flex items-center gap-3"
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <SpeakButton text={block.term_title} size="sm" label="Hear pronunciation" />
          <span className="text-base font-medium italic" style={{ color: c.subtext }}>
            /{block.pronunciation}/
          </span>
        </motion.div>
      )}

      {!etymology && !loading && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
          <p className="text-sm leading-relaxed" style={{ color: c.bodyText }}>
            Understanding where a word comes from helps you remember what it means.
          </p>
          <Button
            size="sm"
            variant="outline"
            onClick={decode}
            className="gap-2"
            style={{ borderColor: "hsl(30 85% 45%)", color: "hsl(30 85% 45%)" }}
          >
            🔍 Decode This Word
          </Button>
        </motion.div>
      )}

      {loading && (
        <div className="flex items-center gap-3 py-4">
          <Loader2 className="h-5 w-5 animate-spin" style={{ color: "hsl(30 85% 45%)" }} />
          <p className="text-sm" style={{ color: c.subtext }}>Tracing word origins…</p>
        </div>
      )}

      {error && <p className="text-sm" style={{ color: "hsl(0 60% 50%)" }}>{error}</p>}

      {etymology && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-3"
        >
          <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: "hsl(30 85% 45%)" }}>
            Word Origins
          </p>
          <p className="text-sm italic" style={{ color: c.subtext }}>
            This word comes from…
          </p>
          <div className="space-y-2">
            {etymology.map((part, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 + i * 0.12 }}
                className="flex items-center gap-3 p-3 rounded-xl"
                style={{
                  background: "linear-gradient(135deg, hsl(30 50% 97%), hsl(30 40% 94%))",
                  border: "1px solid hsl(30 40% 85%)",
                }}
              >
                <SpeakButton
                  text={`${part.part}, meaning ${part.meaning}, from ${part.origin}`}
                  size="sm"
                  label={`Hear "${part.part}"`}
                />
                <span
                  className="font-display text-xl font-bold flex-shrink-0"
                  style={{ color: "hsl(30 85% 40%)" }}
                >
                  {part.part}
                </span>
                <div className="min-w-0 flex-1">
                  <span
                    className="text-[10px] font-semibold uppercase tracking-widest px-1.5 py-0.5 rounded"
                    style={{ background: "hsl(30 40% 88%)", color: "hsl(30 60% 35%)" }}
                  >
                    {part.origin}
                  </span>
                  <p className="text-sm mt-1" style={{ color: c.bodyText }}>
                    {part.meaning}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
          <div
            className="p-3 rounded-xl text-sm"
            style={{
              background: "hsl(30 45% 95%)",
              border: "1px solid hsl(30 35% 85%)",
              color: c.bodyText,
            }}
          >
            <strong style={{ color: "hsl(30 85% 40%)" }}>{block.term_title}</strong> ={" "}
            {etymology.map((p) => `"${p.meaning}"`).join(" + ")}
          </div>
        </motion.div>
      )}

      {/* Speech-to-text for verbal practice */}
      <div className="mt-3">
        <p className="text-xs font-medium mb-2" style={{ color: c.subtext }}>
          🎤 Practice saying the breakdown out loud:
        </p>
        <div className="flex items-center gap-2">
          <SpeechToTextButton
            onTranscript={(text) => {
              // Just visual feedback — user practices pronunciation
            }}
            className="flex-shrink-0"
          />
          <span className="text-xs italic" style={{ color: c.subtext }}>
            Tap the mic and say each word part aloud
          </span>
        </div>
      </div>

      <BrainNote text="Breaking words into roots activates analytical processing, making complex terms easier to decode and remember." />
    </div>
  );
};

const StepContent = (props: StepContentProps) => {
  const { stepKey, block, stepColor } = props;

  switch (stepKey) {
    case "visualize":
      return (
        <div className="space-y-3">
          {props.imageUrl ? (
            <div className="relative w-full">
              <motion.img
                src={props.imageUrl}
                alt={`Visual for ${block.term_title}`}
                className="w-full rounded-lg"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4, delay: 0.15 }}
              />
              {/* Programmatic text overlay — always spelled correctly */}
              <div className="absolute bottom-0 left-0 right-0 rounded-b-lg px-4 py-3"
                style={{ background: "linear-gradient(to top, hsl(0 0% 0% / 0.75), hsl(0 0% 0% / 0))" }}>
                <p className="font-display text-base sm:text-lg font-bold text-white leading-tight drop-shadow-md">
                  {block.term_title}
                </p>
                {block.definition && (
                  <p className="text-[11px] sm:text-xs text-white/80 leading-snug mt-0.5 line-clamp-2 drop-shadow">
                    {block.definition}
                  </p>
                )}
              </div>
            </div>
          ) : props.imageLoading ? (
            <div className="flex flex-col items-center gap-3 py-6">
              <Loader2 className="h-8 w-8 animate-spin" style={{ color: stepColor }} />
              <p className="text-sm" style={{ color: c.subtext }}>Generating illustration…</p>
            </div>
          ) : (
            <div className="flex justify-center py-4">
              <Button size="sm" variant="outline" onClick={props.generateImage} className="gap-2">
                Generate Visual Diagram
              </Button>
            </div>
          )}
          <motion.p
            className="text-sm leading-relaxed"
            style={{ color: c.bodyText }}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            {block.visualization_desc}
          </motion.p>
          {block.video_url && <VideoPlayer url={block.video_url} />}
          {props.videoSuggestions.length > 0 && (
            <div className="space-y-2 pt-2">
              <p className="text-xs font-medium" style={{ color: c.subtext }}>📹 Suggested Videos:</p>
              {props.videoSuggestions.map((v, i) => (
                <a key={i} href={v.url} target="_blank" rel="noopener noreferrer" className="block text-sm underline" style={{ color: stepColor }}>
                  {v.label}
                </a>
              ))}
            </div>
          )}
          {!props.videoSuggestions.length && !props.videoLoading && (
            <Button size="sm" variant="ghost" onClick={props.fetchVideoSuggestions} className="gap-1 text-xs" style={{ color: c.subtext }}>
              🎬 Find Related Videos
            </Button>
          )}
          {props.videoLoading && <p className="text-xs" style={{ color: c.subtext }}>Finding videos…</p>}
          <BrainNote text="Visualizing a concept creates a mental picture that strengthens recall." />
        </div>
      );

    case "definition":
      return (
        <div className="space-y-3">
          <motion.p
            className="text-base leading-relaxed"
            style={{ color: c.bodyText }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3, delay: 0.1 }}
          >
            {block.definition}
          </motion.p>
          <SpeakButton text={`${block.term_title}. ${block.definition}`} size="sm" label="Listen to definition" onComplete={props.handleAudioComplete} />
          {block.video_url && <VideoPlayer url={block.video_url} />}
        </div>
      );

    case "scripture":
      return (
        <div className="space-y-4">
          {block.page_reference && (
            <motion.div
              className="flex items-center gap-2"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <span className="text-base font-semibold" style={{ color: stepColor }}>{block.page_reference}</span>
            </motion.div>
          )}
          {block.source_text && (
            <motion.blockquote
              className="p-5 rounded-xl border-l-4 text-base leading-loose"
              style={{ borderColor: stepColor, background: c.tabInactive, color: c.bodyText }}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              "{block.source_text}"
            </motion.blockquote>
          )}
          <SpeakButton
            text={`${block.page_reference || ""}. ${block.source_text || block.definition}`}
            size="sm"
            label="Listen to passage"
            onComplete={props.handleAudioComplete}
          />
          <BrainNote text="Reading the original passage helps you connect the concept to its source context." />
        </div>
      );

    case "breakdown":
      return <EtymologyBreakdown block={block} />;

    case "recognize":
      return (
        <div className="space-y-3">
          <motion.p className="text-sm font-medium" style={{ color: c.termHeading }} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            Which of these best describes <strong>{block.term_title}</strong>?
          </motion.p>
          <div className="grid grid-cols-2 gap-2">
            {props.identityItems.map((item, i) => {
              const isCorrect = i === 0;
              const isSelected = props.recognizeSelected === i;
              let bg = "hsl(var(--card))";
              let border = "hsl(var(--border))";
              if (props.recognizeRevealed && isSelected && isCorrect) { bg = "hsl(145 40% 92%)"; border = "hsl(145 40% 45%)"; }
              else if (props.recognizeRevealed && isSelected) { bg = "hsl(0 60% 94%)"; border = "hsl(0 60% 50%)"; }
              else if (props.recognizeRevealed && isCorrect) { bg = "hsl(145 40% 92%)"; border = "hsl(145 40% 45%)"; }
              return (
                <motion.button
                  key={i}
                  onClick={() => { if (!props.recognizeRevealed) { props.setRecognizeSelected(i); props.setRecognizeRevealed(true); } }}
                  className="p-3 rounded-xl text-sm font-medium text-center transition-all"
                  style={{ background: bg, border: `2px solid ${border}`, color: c.termHeading }}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 + i * 0.05 }}
                  whileHover={{ scale: props.recognizeRevealed ? 1 : 1.03 }}
                  disabled={props.recognizeRevealed}
                >
                  {String(item)}
                  {props.recognizeRevealed && isCorrect && <CheckCircle2 className="inline h-3.5 w-3.5 ml-1.5" style={{ color: "hsl(145 40% 45%)" }} />}
                  {props.recognizeRevealed && isSelected && !isCorrect && <XCircle className="inline h-3.5 w-3.5 ml-1.5" style={{ color: "hsl(0 60% 50%)" }} />}
                </motion.button>
              );
            })}
          </div>
          {props.recognizeRevealed && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
              <BrainNote text="These identity words capture the essence of this concept. Use them as mental anchors when you see this term on the exam." />
            </motion.div>
          )}
        </div>
      );

    case "metaphor":
      return (
        <div className="space-y-3">
          <motion.p
            className="text-base leading-relaxed italic"
            style={{ color: c.bodyText }}
            initial={{ opacity: 0, rotate: -1 }}
            animate={{ opacity: 1, rotate: 0 }}
            transition={{ duration: 0.4 }}
          >
            {block.metaphor}
          </motion.p>
          <SpeakButton text={`${block.term_title}. ${block.metaphor}`} size="sm" label="Listen" onComplete={props.handleAudioComplete} />
        </div>
      );

    case "information":
      return (
        <div className="space-y-3">
          <motion.p
            className="text-base leading-relaxed"
            style={{ color: c.bodyText }}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
          >
            {block.affirmation}
          </motion.p>
          <SpeakButton text={block.affirmation} size="sm" label="Hear affirmation" onComplete={props.handleAudioComplete} />
          <BrainNote text="Affirmations activate your limbic system and build emotional confidence around what you're learning." />
        </div>
      );

    case "reflection":
      return (
        <div className="space-y-3">
          <motion.p className="text-sm font-medium leading-relaxed" style={{ color: c.termHeading }} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            {block.reflection_prompt}
          </motion.p>
          <div className="relative">
            <Textarea
              placeholder="Pause and reflect… Write 1–2 sentences."
              value={props.reflectionText}
              onChange={(e) => { props.setReflectionText(e.target.value); props.setReflectionSubmitted(false); }}
              disabled={props.reflectionSubmitted}
              className="min-h-[90px] text-sm resize-none pr-10"
              style={{ color: c.bodyText }}
            />
            {!props.reflectionSubmitted && (
              <div className="absolute right-1 bottom-1">
                <SpeechToTextButton onTranscript={(text) => props.setReflectionText(props.reflectionText ? `${props.reflectionText} ${text}` : text)} />
              </div>
            )}
          </div>
          {!props.reflectionSubmitted ? (
            <Button
              size="sm"
              onClick={props.onReflectionSave}
              disabled={!props.reflectionText.trim()}
              className="w-full"
              style={{ background: stepColor, color: "hsl(0 0% 100%)" }}
            >
              Save My Reflection
            </Button>
          ) : (
            <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="space-y-2">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4" style={{ color: "hsl(145 40% 45%)" }} />
                <span className="text-sm font-medium" style={{ color: "hsl(145 40% 45%)" }}>Reflection saved</span>
              </div>
              <BrainNote text="Pausing to reflect helps move information from short-term to long-term memory." />
              <button onClick={() => props.setReflectionSubmitted(false)} className="text-xs underline" style={{ color: c.subtext }}>Edit</button>
            </motion.div>
          )}
        </div>
      );

    case "practice":
      return (
        <div className="space-y-3">
          <motion.p
            className="text-base leading-relaxed"
            style={{ color: c.bodyText }}
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: "spring", duration: 0.4 }}
          >
            {block.practice_scenario}
          </motion.p>
          <div className="relative mt-2">
            <Textarea
              placeholder="Write your notes here…"
              value={props.journalNote}
              onChange={(e) => props.setJournalNote(e.target.value)}
              className="min-h-[80px] text-sm resize-none pr-10"
              style={{ color: c.bodyText }}
            />
            <div className="absolute right-1 bottom-1">
              <SpeechToTextButton onTranscript={(text) => props.setJournalNote(props.journalNote ? `${props.journalNote} ${text}` : text)} />
            </div>
          </div>
          {props.journalSaving && <p className="text-xs" style={{ color: c.subtext }}>Saving…</p>}
          {!props.journalSaving && props.journalNote && <p className="text-xs" style={{ color: "hsl(145 40% 45%)" }}>✓ Saved</p>}
          <BrainNote text="Applying concepts to real scenarios builds neural connections for the salon and state board exam." />
        </div>
      );

    case "quiz":
      return <StateboardQuiz block={block} quizSelected={props.quizSelected} setQuizSelected={props.setQuizSelected} quizRevealed={props.quizRevealed} setQuizRevealed={props.setQuizRevealed} stepColor={stepColor} />;

    default:
      return null;
  }
};

// Self-contained State Board quiz with AI fallback
const StateboardQuiz = ({ block, quizSelected, setQuizSelected, quizRevealed, setQuizRevealed, stepColor }: {
  block: UploadedBlock;
  quizSelected: string | null;
  setQuizSelected: (v: string | null) => void;
  quizRevealed: boolean;
  setQuizRevealed: (v: boolean) => void;
  stepColor: string;
}) => {
  const [aiQuestion, setAiQuestion] = useState<{ question: string; options: string[]; answer: string } | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState("");

  const hasBuiltinQuiz = block.quiz_question && block.quiz_options.length > 0;

  const generateQuestion = async () => {
    setAiLoading(true);
    setAiError("");
    try {
      const { data } = await supabase.functions.invoke("ai-mentor-chat", {
        body: {
          messages: [{
            role: "user",
            content: `Create a State Board Cosmetology exam-style multiple choice question about "${block.term_title}". Definition: "${block.definition}". Respond ONLY with JSON: {"question":"...","options":["A)...","B)...","C)...","D)..."],"answer":"the full text of the correct option"}. No markdown.`,
          }],
          sectionName: "State Board Quiz",
        },
      });
      const text = data?.response || data?.choices?.[0]?.message?.content || "";
      const match = text.match(/\{[\s\S]*\}/);
      if (match) {
        const parsed = JSON.parse(match[0]);
        setAiQuestion(parsed);
      } else {
        setAiError("Could not generate question. Try again.");
      }
    } catch {
      setAiError("Failed to generate question.");
    }
    setAiLoading(false);
  };

  // Auto-generate if no built-in quiz
  useState(() => {
    if (!hasBuiltinQuiz && !aiQuestion && !aiLoading) {
      generateQuestion();
    }
  });

  const question = hasBuiltinQuiz ? block.quiz_question : aiQuestion?.question;
  const options = hasBuiltinQuiz ? block.quiz_options.map(String) : (aiQuestion?.options || []);
  const answer = hasBuiltinQuiz ? block.quiz_answer : (aiQuestion?.answer || "");

  return (
    <div className="space-y-4">
      <motion.div
        className="p-4 rounded-xl mb-2"
        style={{
          background: "linear-gradient(135deg, hsl(0 50% 97%), hsl(0 40% 94%))",
          border: "1.5px solid hsl(0 40% 85%)",
          boxShadow: "0 2px 8px hsl(0 40% 50% / 0.08)",
        }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <p className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: "hsl(0 75% 45%)" }}>
          🎓 State Board Cosmetology Practice Question
        </p>
        <p className="text-xs" style={{ color: c.subtext }}>
          This question mirrors what you'll see on the actual State Board exam. Use what you just learned about <strong>{block.term_title}</strong>.
        </p>
      </motion.div>

      {aiLoading && (
        <div className="flex items-center gap-3 py-6 justify-center">
          <Loader2 className="h-5 w-5 animate-spin" style={{ color: stepColor }} />
          <p className="text-sm" style={{ color: c.subtext }}>Generating State Board question…</p>
        </div>
      )}

      {aiError && (
        <div className="text-center space-y-2 py-4">
          <p className="text-sm" style={{ color: "hsl(0 60% 50%)" }}>{aiError}</p>
          <Button size="sm" variant="outline" onClick={generateQuestion}>Try Again</Button>
        </div>
      )}

      {question && options.length > 0 && (
        <div className="space-y-3">
          <motion.p
            className="text-sm font-medium leading-relaxed"
            style={{ color: c.termHeading }}
            initial={{ opacity: 0, x: 6 }}
            animate={{ opacity: 1, x: 0 }}
          >
            {question}
          </motion.p>
          <div className="space-y-2">
            {options.map((opt, i) => {
              const letter = String.fromCharCode(65 + i);
              const optText = String(opt).replace(/^[A-D]\)\s*/, "");
              const isSelected = quizSelected === letter;
              const isCorrect = String(opt) === answer || optText === answer;
              let bg = "hsl(var(--card))";
              let border = "hsl(var(--border))";
              if (quizRevealed && isSelected && isCorrect) { bg = "hsl(145 40% 92%)"; border = "hsl(145 40% 45%)"; }
              else if (quizRevealed && isSelected && !isCorrect) { bg = "hsl(0 60% 94%)"; border = "hsl(0 60% 50%)"; }
              else if (quizRevealed && isCorrect) { bg = "hsl(145 40% 92%)"; border = "hsl(145 40% 45%)"; }
              return (
                <motion.button
                  key={i}
                  onClick={() => { if (!quizRevealed) { setQuizSelected(letter); setQuizRevealed(true); } }}
                  className="w-full text-left p-3 rounded-lg text-sm transition-all"
                  style={{ background: bg, border: `2px solid ${border}`, color: c.bodyText }}
                  disabled={quizRevealed}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.05 + i * 0.05 }}
                >
                  <span className="font-semibold mr-2">{letter})</span> {optText}
                  {quizRevealed && isCorrect && <CheckCircle2 className="inline h-4 w-4 ml-2" style={{ color: "hsl(145 40% 45%)" }} />}
                  {quizRevealed && isSelected && !isCorrect && <XCircle className="inline h-4 w-4 ml-2" style={{ color: "hsl(0 60% 50%)" }} />}
                </motion.button>
              );
            })}
          </div>
          {quizRevealed && (
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => { setQuizSelected(null); setQuizRevealed(false); }}>
                Try Again
              </Button>
              {!hasBuiltinQuiz && (
                <Button size="sm" variant="outline" onClick={() => { setAiQuestion(null); setQuizSelected(null); setQuizRevealed(false); generateQuestion(); }} style={{ borderColor: stepColor, color: stepColor }}>
                  New Question
                </Button>
              )}
            </div>
          )}
        </div>
      )}

      {!hasBuiltinQuiz && !aiQuestion && !aiLoading && !aiError && (
        <div className="text-center py-4">
          <Button size="sm" onClick={generateQuestion} className="gap-2" style={{ background: stepColor, color: "white" }}>
            🎓 Generate State Board Question
          </Button>
        </div>
      )}
    </div>
  );
};

export default StepContent;
