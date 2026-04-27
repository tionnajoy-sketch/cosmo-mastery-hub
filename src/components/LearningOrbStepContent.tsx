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
import { LayerBlockSection, getBlockOpenState } from "@/components/LayerBlockSection";
import { useDNAAdaptation } from "@/hooks/useDNAAdaptation";
import type { UploadedBlock } from "@/components/UploadedTermCard";
import { shuffleOptions } from "@/lib/shuffleOptions";
import GuidedLessonPanel from "@/components/guided-lesson/GuidedLessonPanel";
import DeepDiveWithTJ from "@/components/deep-dive/DeepDiveWithTJ";

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

const EtymologyBreakdown = ({ block, stepColor }: { block: UploadedBlock; stepColor: string }) => {
  const [etymology, setEtymology] = useState<EtymologyPart[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { context: dnaContext } = useDNAAdaptation();
  const ksRoot = getBlockOpenState(dnaContext, "root-word");
  const ksDeeper = getBlockOpenState(dnaContext, "deeper");

  // STATIC-FIRST: if admin saved a Break-It-Down for this term, show it and skip AI.
  const staticBreakdown = block.static_break_it_down?.trim() || "";

  // STATIC-ONLY: never call AI from lesson steps. Render static content
  // when present; otherwise show a gentle "coming soon" message.
  const decode = async () => { /* no-op */ };

  // Short Key Concept summary built from the term + definition (1 line)
  const keyConcept = block.definition
    ? block.definition.split(/[.!?]/)[0].trim() + "."
    : `${block.term_title} — let's break this word into pieces to understand it.`;

  return (
    <div className="space-y-3">
      {/* Key Concept — always visible */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-xl overflow-hidden"
        style={{
          background: "hsl(var(--card))",
          border: "1.5px solid hsl(var(--border))",
        }}
      >
        <div
          className="px-4 py-3 flex items-center gap-2"
          style={{ background: `${stepColor}08`, borderBottom: "1px solid hsl(var(--border))" }}
        >
          <span className="text-base">💡</span>
          <h4 className="font-display text-sm font-bold m-0" style={{ color: stepColor }}>
            Key Concept
          </h4>
        </div>
        <div className="px-4 py-3">
          <p className="text-sm leading-relaxed" style={{ color: c.bodyText }}>
            <strong style={{ color: stepColor }}>{block.term_title}</strong> — {keyConcept}
          </p>
        </div>
      </motion.div>

      {/* Root Word — collapsible (default open if low retention) */}
      <LayerBlockSection
        title="Root Word"
        icon="🔤"
        accentColor={stepColor}
        defaultOpen={ksRoot.defaultOpen || !!etymology}
        emphasized={ksRoot.emphasized}
      >
        <div className="space-y-3">
          {block.pronunciation && (
            <div className="flex items-center gap-3">
              <SpeakButton text={block.term_title} size="sm" label="Hear pronunciation" />
              <span className="text-base font-medium italic" style={{ color: c.subtext }}>
                /{block.pronunciation}/
              </span>
            </div>
          )}

          {!etymology && !loading && !staticBreakdown && (
            <p className="text-sm italic" style={{ color: c.subtext }}>
              Word breakdown for this term hasn't been added yet.
            </p>
          )}

          {staticBreakdown && (
            <div
              className="rounded-xl p-4 text-sm leading-relaxed whitespace-pre-wrap"
              style={{
                background: "linear-gradient(135deg, hsl(30 50% 97%), hsl(30 40% 94%))",
                border: "1px solid hsl(30 40% 85%)",
                color: c.bodyText,
              }}
            >
              {staticBreakdown}
            </div>
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
        </div>
      </LayerBlockSection>

      {/* Go Deeper — pronunciation practice + brain note */}
      <LayerBlockSection
        title="Go Deeper"
        icon="🎤"
        accentColor={stepColor}
        defaultOpen={ksDeeper.defaultOpen}
        emphasized={ksDeeper.emphasized}
      >
        <div className="space-y-3">
          <p className="text-xs font-medium" style={{ color: c.subtext }}>
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
          <BrainNote text="Breaking words into roots activates analytical processing, making complex terms easier to decode and remember." />
        </div>
      </LayerBlockSection>
    </div>
  );
};

const StepContent = (props: StepContentProps) => {
  const { stepKey, block, stepColor } = props;
  const { context: dnaContext } = useDNAAdaptation();
  const ksApplyP = getBlockOpenState(dnaContext, "apply");
  const ksDeeperP = getBlockOpenState(dnaContext, "deeper");

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
      return (
        <div className="space-y-4">
          <EtymologyBreakdown block={block} stepColor={stepColor} />
          <GuidedLessonPanel
            termId={block.id}
            termTitle={block.term_title}
            definition={block.definition}
            stepColor={stepColor}
          />
        </div>
      );

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

    case "information": {
      // Build an editorial narrative for EVERY term. If the admin has authored
      // a structured `lesson_narrative`, use it; otherwise auto-derive one
      // from the term's existing fields so the magazine treatment is
      // consistent across the whole library.
      const authored = block.lesson_narrative;
      const derivedSections: { heading: string; body: string }[] = [];
      if (!authored) {
        if (block.static_information) {
          const raw = String(block.static_information);
          const parts = raw.split(/^##\s+/m).filter(Boolean);
          if (parts.length > 1) {
            parts.forEach((p) => {
              const lines = p.trim().split("\n");
              derivedSections.push({ heading: lines[0]?.trim() || "Section", body: lines.slice(1).join("\n").trim() });
            });
          } else {
            derivedSections.push({ heading: "The Full Story", body: raw.trim() });
          }
        } else if (block.definition) {
          derivedSections.push({ heading: "What it means", body: block.definition });
          if (block.metaphor) derivedSections.push({ heading: "A picture for it", body: block.metaphor });
        }
      }
      const narrative = authored ?? {
        key_point: block.affirmation || `Remember "${block.term_title}" — say it, picture it, connect it to something you know.`,
        sections: derivedSections,
        memory_cue: block.metaphor || undefined,
        mentor_check_in: undefined,
        purpose: undefined,
      };
      const hasNarrative = !!(narrative && (narrative.sections?.length || narrative.key_point || narrative.purpose));
      return (
        <div className="space-y-4">
          {hasNarrative ? (
            <>
              {narrative.key_point && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-xl px-4 py-3"
                  style={{
                    background: `${stepColor}10`,
                    border: `1.5px solid ${stepColor}40`,
                  }}
                >
                  <p className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: stepColor }}>
                    🔑 Key Point
                  </p>
                  <p className="text-sm leading-relaxed" style={{ color: c.bodyText }}>
                    {narrative.key_point}
                  </p>
                </motion.div>
              )}

              {narrative.sections?.map((sec, i) => (
                <motion.section
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.05 + i * 0.04 }}
                  className="rounded-xl overflow-hidden"
                  style={{
                    background: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                  }}
                >
                  <div
                    className="px-4 py-2"
                    style={{ background: `${stepColor}08`, borderBottom: "1px solid hsl(var(--border))" }}
                  >
                    <h4 className="font-display text-sm font-bold m-0" style={{ color: stepColor }}>
                      {sec.heading}
                    </h4>
                  </div>
                  <div className="px-4 py-3">
                    <p className="text-sm leading-relaxed whitespace-pre-line" style={{ color: c.bodyText }}>
                      {sec.body}
                    </p>
                  </div>
                </motion.section>
              ))}

              {narrative.memory_cue && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.97 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="rounded-xl px-4 py-4 text-center"
                  style={{
                    background: "linear-gradient(135deg, hsl(280 35% 96%), hsl(280 30% 92%))",
                    border: "1.5px solid hsl(280 35% 80%)",
                  }}
                >
                  <p className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: "hsl(280 45% 40%)" }}>
                    💜 Remember
                  </p>
                  <p className="text-base font-display font-bold leading-snug" style={{ color: "hsl(280 50% 30%)" }}>
                    {narrative.memory_cue}
                  </p>
                </motion.div>
              )}

              {narrative.mentor_check_in && narrative.mentor_check_in.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-xl px-4 py-3"
                  style={{
                    background: "hsl(var(--card))",
                    border: `1.5px dashed ${stepColor}60`,
                  }}
                >
                  <p className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: stepColor }}>
                    💬 TJ Mentor Check-In
                  </p>
                  <ul className="space-y-2">
                    {narrative.mentor_check_in.map((q, i) => (
                      <li key={i} className="text-sm leading-relaxed" style={{ color: c.bodyText }}>
                        • {q}
                      </li>
                    ))}
                  </ul>
                </motion.div>
              )}

              {narrative.purpose && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="rounded-xl px-4 py-3"
                  style={{
                    background: `${stepColor}06`,
                    borderLeft: `3px solid ${stepColor}`,
                  }}
                >
                  <p className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: stepColor }}>
                    Purpose
                  </p>
                  <p className="text-sm leading-relaxed italic" style={{ color: c.bodyText }}>
                    {narrative.purpose}
                  </p>
                </motion.div>
              )}

              <SpeakButton
                text={`${narrative.key_point || ""}. ${(narrative.sections || []).map(s => `${s.heading}. ${s.body}`).join(" ")}. ${narrative.memory_cue || ""}.`}
                size="sm"
                label="Listen to lesson"
                onComplete={props.handleAudioComplete}
              />
            </>
          ) : (
            <>
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
            </>
          )}
        </div>
      );
    }

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
          {/* Key Concept — the scenario itself, always visible */}
          <motion.p
            className="text-base leading-relaxed"
            style={{ color: c.bodyText }}
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: "spring", duration: 0.4 }}
          >
            {block.practice_scenario}
          </motion.p>

          {/* Apply It — write notes (auto-open, emphasized for applied learners) */}
          <LayerBlockSection
            title="Apply It"
            icon="🛠️"
            accentColor={stepColor}
            defaultOpen={ksApplyP.defaultOpen || true}
            emphasized={ksApplyP.emphasized}
          >
            <div className="relative mt-1">
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
            {props.journalSaving && <p className="text-xs mt-1" style={{ color: c.subtext }}>Saving…</p>}
            {!props.journalSaving && props.journalNote && <p className="text-xs mt-1" style={{ color: "hsl(145 40% 45%)" }}>✓ Saved</p>}
          </LayerBlockSection>

          {/* Go Deeper — brain note */}
          <LayerBlockSection
            title="Go Deeper"
            icon="🧠"
            accentColor={stepColor}
            defaultOpen={ksDeeperP.defaultOpen}
            emphasized={ksDeeperP.emphasized}
          >
            <BrainNote text="Applying concepts to real scenarios builds neural connections for the salon and state board exam." />
          </LayerBlockSection>
        </div>
      );

    case "quiz":
      // TJ Anderson Layer Method™ — term lesson flow uses OPEN RESPONSE only.
      // Multiple choice lives in the Quiz / Comprehension / Final Exam blocks.
      return <FinalThinkingCheck block={block} props={props} stepColor={stepColor} />;


    default:
      return null;
  }
};

// TJ Anderson Layer Method™ — Final Thinking Check (open response, no MCQ)
// Replaces the old StateboardQuiz inside the term lesson flow.
// Multiple-choice State Board questions remain ONLY in the Quiz block,
// Comprehension block, and Final Exam block.
const FinalThinkingCheck = ({ block, props, stepColor }: {
  block: UploadedBlock;
  props: StepContentProps;
  stepColor: string;
}) => {
  const [response, setResponse] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [grading, setGrading] = useState(false);
  const [verdict, setVerdict] = useState<"correct" | "partial" | "incorrect" | null>(null);
  const [feedback, setFeedback] = useState("");
  const [error, setError] = useState("");

  const prompt = `Before moving forward, explain what ${block.term_title} does, why it matters, and how it connects to real cosmetology practice.`;

  const handleSubmit = async () => {
    if (!response.trim()) return;
    setGrading(true);
    setError("");
    try {
      const { data, error: invokeErr } = await supabase.functions.invoke(
        "evaluate-diversified-answer",
        {
          body: {
            term_id: block.id,
            question_index: 0,
            answer: response.trim(),
          },
        }
      );
      if (invokeErr) throw invokeErr;
      if (data?.error) {
        // Soft fallback so the learner isn't blocked when the rubric is missing.
        setVerdict("partial");
        setFeedback("Got your thinking. We'll grade this once the rubric is wired up for this term.");
      } else {
        setVerdict(data?.verdict ?? "partial");
        setFeedback(data?.feedback ?? "");
      }
      setSubmitted(true);
    } catch (e) {
      console.error("FinalThinkingCheck grading failed", e);
      setError("Couldn't reach the grader. Your answer was saved — keep going.");
      setSubmitted(true);
    } finally {
      setGrading(false);
    }
  };

  const verdictBg =
    verdict === "correct" ? "hsl(145 40% 92%)" :
    verdict === "partial" ? "hsl(40 80% 94%)" :
    verdict === "incorrect" ? "hsl(0 60% 94%)" :
    "hsl(var(--card))";
  const verdictBorder =
    verdict === "correct" ? "hsl(145 40% 45%)" :
    verdict === "partial" ? "hsl(40 80% 50%)" :
    verdict === "incorrect" ? "hsl(0 60% 50%)" :
    "hsl(var(--border))";
  const verdictLabel =
    verdict === "correct" ? "You've got it" :
    verdict === "partial" ? "Almost there" :
    verdict === "incorrect" ? "Let's revisit this" : "";

  return (
    <div className="space-y-4">
      <motion.div
        className="p-4 rounded-xl mb-2"
        style={{
          background: "linear-gradient(135deg, hsl(260 50% 97%), hsl(260 40% 94%))",
          border: "1.5px solid hsl(260 40% 85%)",
          boxShadow: "0 2px 8px hsl(260 40% 50% / 0.08)",
        }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <p className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: "hsl(260 60% 45%)" }}>
          🧠 Final Thinking Check
        </p>
        <p className="text-xs" style={{ color: c.subtext }}>
          No multiple choice here. Just your thinking. Show me you understand <strong>{block.term_title}</strong> in your own words.
        </p>
      </motion.div>

      <motion.p
        className="text-sm font-medium leading-relaxed"
        style={{ color: c.termHeading }}
        initial={{ opacity: 0, x: 6 }}
        animate={{ opacity: 1, x: 0 }}
      >
        {prompt}
      </motion.p>

      <div className="relative">
        <Textarea
          placeholder="Explain what it does, why it matters, and how it shows up in the salon…"
          value={response}
          onChange={(e) => setResponse(e.target.value)}
          disabled={submitted || grading}
          className="min-h-[120px] text-sm resize-none pr-10"
          style={{ color: c.bodyText }}
        />
        {!submitted && (
          <div className="absolute right-1 bottom-1">
            <SpeechToTextButton onTranscript={(text) => setResponse(response ? `${response} ${text}` : text)} />
          </div>
        )}
      </div>

      {!submitted && (
        <Button
          size="sm"
          onClick={handleSubmit}
          disabled={grading || !response.trim()}
          style={{ background: stepColor, color: "white" }}
        >
          {grading ? (<><Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" />Grading…</>) : "Submit My Thinking"}
        </Button>
      )}

      {submitted && (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-3 rounded-lg space-y-1"
          style={{ background: verdictBg, border: `2px solid ${verdictBorder}` }}
        >
          {verdict && (
            <div className="flex items-center gap-2">
              {verdict === "correct" && <CheckCircle2 className="h-4 w-4" style={{ color: "hsl(145 40% 45%)" }} />}
              {verdict === "incorrect" && <XCircle className="h-4 w-4" style={{ color: "hsl(0 60% 50%)" }} />}
              <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: verdictBorder }}>
                {verdictLabel}
              </span>
            </div>
          )}
          {feedback && (
            <p className="text-sm leading-relaxed" style={{ color: c.bodyText }}>
              {feedback}
            </p>
          )}
          {error && (
            <p className="text-xs" style={{ color: "hsl(0 60% 50%)" }}>{error}</p>
          )}
          {(verdict === "partial" || verdict === "incorrect") && (
            <button
              onClick={() => { setSubmitted(false); setVerdict(null); setFeedback(""); setError(""); }}
              className="text-xs underline mt-1"
              style={{ color: c.subtext }}
            >
              Try again
            </button>
          )}
        </motion.div>
      )}

      {/* Optional Deep Dive — clean separation, collapsed by default */}
      <DeepDiveWithTJ
        termId={block.id}
        termTitle={block.term_title}
        definition={block.definition}
        stepColor={stepColor}
      />
    </div>
  );
};

export default StepContent;
