import { useEffect, useState, useCallback, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useCoins } from "@/hooks/useCoins";
import { useStudyTracker } from "@/hooks/useStudyTracker";
import { useLearningMetrics } from "@/hooks/useLearningMetrics";
import { motion, AnimatePresence } from "framer-motion";
import { Lock, Sparkles, Flame, Trophy, Brain, Target, TrendingUp, Zap, ChevronRight, BookOpen, GraduationCap, Gamepad2, AlertTriangle, CheckCircle2, Circle, Dna, Radio } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import AppHeader from "@/components/AppHeader";
import LearningOrchestrator from "@/components/LearningOrchestrator";
import type { UploadedBlock } from "@/components/UploadedTermCard";

interface Term {
  id: string;
  term: string;
  definition: string;
  metaphor: string;
  affirmation: string;
  section_id: string;
  block_number: number;
  concept_identity?: any;
}

const TILE_COLORS = [
  { bg: "hsl(346 55% 50%)", glow: "hsl(346 55% 50% / 0.4)" },
  { bg: "hsl(265 60% 52%)", glow: "hsl(265 60% 52% / 0.4)" },
  { bg: "hsl(215 70% 48%)", glow: "hsl(215 70% 48% / 0.4)" },
  { bg: "hsl(145 55% 38%)", glow: "hsl(145 55% 38% / 0.4)" },
  { bg: "hsl(25 65% 50%)", glow: "hsl(25 65% 50% / 0.4)" },
  { bg: "hsl(185 50% 42%)", glow: "hsl(185 50% 42% / 0.4)" },
  { bg: "hsl(320 50% 48%)", glow: "hsl(320 50% 48% / 0.4)" },
  { bg: "hsl(45 80% 45%)", glow: "hsl(45 80% 45% / 0.4)" },
];

const IDENTITY_MESSAGES = [
  "You are understanding this.",
  "You are building retention.",
  "You are becoming confident.",
  "You are preparing for your license.",
  "You are stronger than you think.",
  "Every layer brings you closer.",
];

const termToBlock = (t: Term): UploadedBlock => ({
  id: t.id,
  block_number: t.block_number,
  term_title: t.term,
  pronunciation: "",
  definition: t.definition,
  visualization_desc: "",
  metaphor: t.metaphor,
  affirmation: t.affirmation,
  reflection_prompt: `In your own words, explain what ${t.term} means and why it matters.`,
  practice_scenario: "",
  quiz_question: "",
  quiz_options: [],
  quiz_answer: "",
  quiz_question_2: "", quiz_options_2: [], quiz_answer_2: "",
  quiz_question_3: "", quiz_options_3: [], quiz_answer_3: "",
  user_notes: "",
  concept_identity: Array.isArray(t.concept_identity) ? t.concept_identity : [],
});

const groupTermsBySection = (terms: Term[]) => {
  const sectionOrder: string[] = [];
  const grouped = new Map<string, Term[]>();
  terms.forEach((t) => {
    if (!grouped.has(t.section_id)) {
      sectionOrder.push(t.section_id);
      grouped.set(t.section_id, []);
    }
    grouped.get(t.section_id)!.push(t);
  });
  return { sectionOrder, grouped };
};

/* Status badge component */
const StatusBadge = ({ status, progress }: { status: string; progress: number }) => {
  if (status === "mastery") return (
    <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full" style={{ background: "hsl(45 85% 48% / 0.2)", color: "hsl(45 85% 90%)" }}>Mastered</span>
  );
  if (status === "completed") return (
    <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full" style={{ background: "hsl(145 45% 38% / 0.25)", color: "hsl(145 50% 80%)" }}>Complete</span>
  );
  if (status === "needs_review") return (
    <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full" style={{ background: "hsl(25 80% 50% / 0.25)", color: "hsl(25 80% 80%)" }}>Review</span>
  );
  if (status === "in_progress") return (
    <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full" style={{ background: "hsl(215 70% 48% / 0.25)", color: "hsl(215 70% 80%)" }}>In Progress</span>
  );
  return (
    <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full" style={{ background: "hsl(0 0% 100% / 0.08)", color: "hsl(0 0% 100% / 0.4)" }}>New</span>
  );
};

const GameGridPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const focusSectionId = searchParams.get("section");
  const { user, profile } = useAuth();
  const { stats: coinStats } = useCoins();
  const studyTracker = useStudyTracker();
  const { aggregate, getTermStatus, metrics } = useLearningMetrics();

  const [terms, setTerms] = useState<Term[]>([]);
  const [sections, setSections] = useState<Map<string, string>>(new Map());
  const [selectedBlock, setSelectedBlock] = useState<UploadedBlock | null>(null);
  const [identityMsg, setIdentityMsg] = useState(IDENTITY_MESSAGES[0]);
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(new Set());
  const [weakTerms, setWeakTerms] = useState<Set<string>>(new Set());
  const [termImages, setTermImages] = useState<Map<string, string>>(new Map());
  const sectionRefs = useRef<Map<string, HTMLDivElement | null>>(new Map());
  const requestedImageIds = useRef<Set<string>>(new Set());

  useEffect(() => {
    const fetchAll = async () => {
      const [termsRes, sectionsRes, imagesRes] = await Promise.all([
        supabase.from("terms").select("*").order("section_id").order("block_number").order("order"),
        supabase.from("sections").select("id, name").order("order"),
        supabase.from("term_images").select("term_id, image_url"),
      ]);
      if (termsRes.data) setTerms(termsRes.data);
      if (sectionsRes.data) {
        const map = new Map<string, string>();
        sectionsRes.data.forEach((s: any) => map.set(s.id, s.name));
        setSections(map);
      }
      if (imagesRes.data) {
        const imgMap = new Map<string, string>();
        imagesRes.data.forEach((row: any) => { if (row.image_url) imgMap.set(row.term_id, row.image_url); });
        setTermImages(imgMap);
      }
    };
    fetchAll();
  }, []);

  // Detect weak terms from quiz results
  useEffect(() => {
    if (!user) return;
    const checkWeak = async () => {
      const { data } = await supabase.from("wrong_answers").select("question_id, section_id").eq("user_id", user.id);
      if (data && data.length > 0) {
        // Get related term IDs from wrong answers
        const questionIds = data.map(d => d.question_id);
        const { data: questions } = await supabase.from("questions").select("related_term_id").in("id", questionIds);
        if (questions) {
          const weak = new Set<string>();
          questions.forEach(q => { if (q.related_term_id) weak.add(q.related_term_id); });
          setWeakTerms(weak);
        }
      }
    };
    checkWeak();
  }, [user]);

  useEffect(() => {
    const interval = setInterval(() => {
      setIdentityMsg(IDENTITY_MESSAGES[Math.floor(Math.random() * IDENTITY_MESSAGES.length)]);
    }, 8000);
    return () => clearInterval(interval);
  }, []);

  // Auto-expand and scroll to the section when arriving via ?section=<id>
  useEffect(() => {
    if (!focusSectionId || terms.length === 0) return;
    setCollapsedSections(prev => {
      const next = new Set(prev);
      next.delete(focusSectionId);
      return next;
    });
    // Defer scroll until after expand animation paints
    const t = setTimeout(() => {
      const el = sectionRefs.current.get(focusSectionId);
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 200);
    return () => clearTimeout(t);
  }, [focusSectionId, terms.length]);

  // Lazy on-demand image generation: any term without an image quietly triggers
  // generate-term-image so it appears next time. Throttled (max 3 in flight).
  useEffect(() => {
    if (terms.length === 0) return;
    const missing = terms.filter(t => !termImages.has(t.id) && !requestedImageIds.current.has(t.id));
    if (missing.length === 0) return;

    let cancelled = false;
    const queue = missing.slice(0, 3); // small batch per render cycle
    queue.forEach(t => requestedImageIds.current.add(t.id));

    (async () => {
      for (const t of queue) {
        if (cancelled) return;
        try {
          const { data, error } = await supabase.functions.invoke("generate-term-image", {
            body: { termId: t.id, term: t.term, definition: t.definition, metaphor: t.metaphor },
          });
          if (!error && data?.image_url && !cancelled) {
            setTermImages(prev => {
              const next = new Map(prev);
              next.set(t.id, data.image_url);
              return next;
            });
          }
        } catch { /* silent — visual is enhancement only */ }
        // gentle pacing so we never hammer the gateway
        await new Promise(r => setTimeout(r, 800));
      }
    })();

    return () => { cancelled = true; };
  }, [terms, termImages]);

  const handleNotesChange = useCallback(() => {}, []);
  const toggleSection = useCallback((sectionId: string) => {
    setCollapsedSections(prev => {
      const next = new Set(prev);
      if (next.has(sectionId)) next.delete(sectionId);
      else next.add(sectionId);
      return next;
    });
  }, []);

  const getEnhancedStatus = (termId: string) => {
    const base = getTermStatus(termId);
    // Check if term needs review (wrong answers exist)
    if (weakTerms.has(termId) && base !== "mastery") return "needs_review";
    return base;
  };

  return (
    <div className="min-h-screen" style={{ background: "linear-gradient(180deg, hsl(240 15% 8%) 0%, hsl(260 20% 12%) 50%, hsl(240 15% 10%) 100%)" }}>
      <AppHeader />

      {/* ─── Top Dashboard ─── */}
      <div className="max-w-7xl mx-auto px-4 pt-5 pb-3">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-4">
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-white">
            Welcome back, {profile?.name || "Student"} ✨
          </h1>
          <motion.p key={identityMsg} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-sm mt-1 italic" style={{ color: "hsl(45 80% 70%)" }}>
            {identityMsg}
          </motion.p>
        </motion.div>

        {/* Stats Row */}
        <div className="grid grid-cols-4 sm:grid-cols-7 gap-2 mb-5">
          {[
            { icon: Flame, label: "Streak", value: studyTracker.currentStreak, color: "hsl(25 80% 55%)" },
            { icon: Zap, label: "XP", value: aggregate.totalXP, color: "hsl(45 90% 50%)" },
            { icon: Sparkles, label: "Coins", value: coinStats.coins, color: "hsl(45 80% 55%)" },
            { icon: Target, label: "Confidence", value: `${aggregate.avgConfidence}%`, color: "hsl(145 55% 50%)" },
            { icon: Brain, label: "Retention", value: `${aggregate.avgRetention}%`, color: "hsl(265 55% 60%)" },
            { icon: TrendingUp, label: "Understanding", value: `${aggregate.avgUnderstanding}%`, color: "hsl(215 65% 55%)" },
            { icon: Trophy, label: "Mastered", value: aggregate.masteredCount, color: "hsl(45 90% 50%)" },
          ].map((stat, i) => (
            <motion.div key={stat.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              className="rounded-xl p-2.5 text-center" style={{ background: "hsl(0 0% 100% / 0.06)", border: "1px solid hsl(0 0% 100% / 0.08)" }}>
              <stat.icon className="h-4 w-4 mx-auto mb-1" style={{ color: stat.color }} />
              <p className="text-lg font-bold text-white leading-tight">{stat.value}</p>
              <p className="text-[9px] uppercase tracking-wider" style={{ color: "hsl(0 0% 100% / 0.5)" }}>{stat.label}</p>
            </motion.div>
          ))}
        </div>

        {/* ─── Live DNA Snapshot — mirrors what's on the DNA Hub ─── */}
        <LiveDNASnapshot />
      </div>

      {/* ─── Game Grid grouped by section ─── */}
      <div className="max-w-7xl mx-auto px-4 pb-12 space-y-8">
        {(() => {
          const { sectionOrder, grouped } = groupTermsBySection(terms);
          let globalIndex = 0;

          return sectionOrder.map((sectionId) => {
            const sectionTerms = grouped.get(sectionId) || [];
            const sectionName = sections.get(sectionId) || "Uncategorized";
            // Section progress
            const sectionCompleted = sectionTerms.filter(t => {
              const s = getEnhancedStatus(t.id);
              return s === "completed" || s === "mastery";
            }).length;
            const sectionPercent = sectionTerms.length > 0 ? Math.round((sectionCompleted / sectionTerms.length) * 100) : 0;

            // Group terms within section by block_number for clearer block awareness
            const blockGroups = new Map<number, Term[]>();
            sectionTerms.forEach(t => {
              if (!blockGroups.has(t.block_number)) blockGroups.set(t.block_number, []);
              blockGroups.get(t.block_number)!.push(t);
            });
            const orderedBlockNums = Array.from(blockGroups.keys()).sort((a, b) => a - b);

            return (
              <div key={sectionId} ref={(el) => { sectionRefs.current.set(sectionId, el); }} style={{ scrollMarginTop: 80 }}>
                {/* Section divider */}
                <button onClick={() => toggleSection(sectionId)} className="flex items-center gap-3 mb-4 w-full group cursor-pointer">
                  <div className="h-px flex-1" style={{ background: "linear-gradient(90deg, transparent, hsl(0 0% 100% / 0.2), transparent)" }} />
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-full transition-colors"
                    style={{ color: "hsl(45 80% 70%)", background: "hsl(0 0% 100% / 0.06)", border: "1px solid hsl(0 0% 100% / 0.1)" }}>
                    <motion.div animate={{ rotate: collapsedSections.has(sectionId) ? 0 : 90 }} transition={{ duration: 0.2 }}>
                      <ChevronRight className="h-3.5 w-3.5" />
                    </motion.div>
                    <h2 className="font-display text-sm sm:text-base font-semibold uppercase tracking-widest">
                      {sectionName}
                    </h2>
                    <span className="text-[10px] opacity-60">{sectionCompleted}/{sectionTerms.length}</span>
                  </div>
                  <div className="h-px flex-1" style={{ background: "linear-gradient(90deg, transparent, hsl(0 0% 100% / 0.2), transparent)" }} />
                </button>

                {/* Section progress bar */}
                {!collapsedSections.has(sectionId) && (
                  <div className="mb-3 px-1">
                    <div className="h-1 rounded-full overflow-hidden" style={{ background: "hsl(0 0% 100% / 0.08)" }}>
                      <div className="h-full rounded-full transition-all" style={{ width: `${sectionPercent}%`, background: "linear-gradient(90deg, hsl(145 55% 45%), hsl(45 80% 50%))" }} />
                    </div>
                  </div>
                )}

                <AnimatePresence initial={false}>
                  {!collapsedSections.has(sectionId) && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: "easeInOut" }} className="overflow-hidden">
                      {orderedBlockNums.map((bn) => {
                        const blockTerms = blockGroups.get(bn) || [];
                        return (
                          <div key={bn} className="mb-5">
                            <div className="flex items-center gap-2 mb-2 px-1">
                              <span className="text-[10px] font-bold uppercase tracking-[0.2em] px-2 py-0.5 rounded-full"
                                style={{ background: "hsl(45 80% 50% / 0.15)", color: "hsl(45 80% 75%)", border: "1px solid hsl(45 80% 50% / 0.25)" }}>
                                Block {bn}
                              </span>
                              <span className="text-[10px] text-white/40">{blockTerms.length} terms</span>
                              <div className="h-px flex-1 ml-1" style={{ background: "hsl(0 0% 100% / 0.06)" }} />
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                              {blockTerms.map((term) => {
                          const i = globalIndex++;
                          const status = getEnhancedStatus(term.id);
                          const termMetrics = metrics.get(term.id);
                          const tileColor = TILE_COLORS[i % TILE_COLORS.length];
                          const layersComplete = termMetrics?.layers_completed.length || 0;
                          const progress = Math.round((layersComplete / 8) * 100);

                          return (
                            <motion.button
                              key={term.id}
                              initial={{ opacity: 0, scale: 0.9 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{ delay: i * 0.02 }}
                              whileHover={{ scale: 1.04, y: -2 }}
                              whileTap={{ scale: 0.97 }}
                              onClick={() => setSelectedBlock(termToBlock(term))}
                              className="relative rounded-2xl p-4 text-left transition-all overflow-hidden group"
                              style={{
                                background: status === "mastery"
                                  ? "linear-gradient(135deg, hsl(45 85% 48%), hsl(38 90% 42%))"
                                  : status === "completed"
                                    ? "linear-gradient(135deg, hsl(145 45% 38%), hsl(155 50% 32%))"
                                    : status === "needs_review"
                                      ? "linear-gradient(135deg, hsl(25 70% 40%), hsl(15 65% 35%))"
                                      : status === "locked"
                                        ? "hsl(0 0% 100% / 0.04)"
                                        : `linear-gradient(135deg, ${tileColor.bg}, ${tileColor.bg})`,
                                border: status === "mastery"
                                  ? "2px solid hsl(45 85% 60%)"
                                  : status === "completed"
                                    ? "2px solid hsl(145 45% 50%)"
                                    : status === "needs_review"
                                      ? "2px solid hsl(25 70% 55%)"
                                      : "1px solid hsl(0 0% 100% / 0.1)",
                                boxShadow: status === "needs_review"
                                  ? "0 4px 20px hsl(25 70% 40% / 0.4)"
                                  : status === "active" || status === "in_progress"
                                    ? `0 4px 20px ${tileColor.glow}`
                                    : status === "mastery"
                                      ? "0 4px 24px hsl(45 85% 48% / 0.4)"
                                      : "none",
                                opacity: status === "locked" ? 0.4 : 1,
                                minHeight: "120px",
                              }}
                            >
                              {/* Term image (visualization) */}
                              {termImages.has(term.id) && status !== "locked" && (
                                <div
                                  className="absolute inset-0 rounded-2xl overflow-hidden pointer-events-none"
                                  aria-hidden="true"
                                >
                                  <img
                                    src={termImages.get(term.id)}
                                    alt=""
                                    className="w-full h-full object-cover opacity-25 group-hover:opacity-40 transition-opacity"
                                    loading="lazy"
                                  />
                                  <div className="absolute inset-0" style={{ background: "linear-gradient(180deg, transparent 0%, hsl(240 15% 8% / 0.55) 100%)" }} />
                                </div>
                              )}

                              <div className="absolute top-2.5 right-2.5 z-10">
                                {status === "locked" && <Lock className="h-4 w-4 text-white/30" />}
                                {status === "mastery" && (
                                  <motion.div animate={{ rotate: [0, 10, -10, 0] }} transition={{ repeat: Infinity, duration: 3 }}>
                                    <Trophy className="h-5 w-5 text-yellow-100" />
                                  </motion.div>
                                )}
                                {status === "completed" && <CheckCircle2 className="h-4 w-4 text-white/80" />}
                                {status === "needs_review" && <AlertTriangle className="h-4 w-4 text-white/90" />}
                              </div>

                              <h3 className="font-display font-bold text-sm sm:text-base text-white leading-tight pr-6 relative z-10">
                                {term.term}
                              </h3>

                              <div className="mt-2 relative z-10">
                                <StatusBadge status={status} progress={progress} />
                              </div>

                              {(status === "in_progress" || status === "needs_review") && (
                                <div className="mt-2">
                                  <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "hsl(0 0% 100% / 0.15)" }}>
                                    <motion.div className="h-full rounded-full" style={{ background: status === "needs_review" ? "hsl(25 80% 60%)" : "hsl(0 0% 100% / 0.7)" }}
                                      initial={{ width: 0 }} animate={{ width: `${progress}%` }} />
                                  </div>
                                  <p className="text-[8px] mt-1 text-white/40">{layersComplete}/8 layers</p>
                                </div>
                              )}

                              {(status === "active" || status === "in_progress") && (
                                <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
                                  style={{ boxShadow: `inset 0 0 30px ${tileColor.glow}` }} />
                              )}
                            </motion.button>
                          );
                              })}
                            </div>

                            {/* Inline per-block Activities + Quiz access */}
                            <div className="mt-3 flex items-center gap-2 flex-wrap px-1">
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-8 text-xs gap-1.5 flex-1 min-w-[140px] bg-white/5 border-white/15 text-white hover:bg-white/10 hover:text-white"
                                onClick={() => navigate(`/section/${sectionId}/activity/${bn}`)}
                              >
                                <Gamepad2 className="h-3 w-3" /> Block {bn} Activities
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-8 text-xs gap-1.5 flex-1 min-w-[140px] bg-white/5 border-white/15 text-white hover:bg-white/10 hover:text-white"
                                onClick={() => navigate(`/section/${sectionId}/quiz/${bn}`)}
                              >
                                <Brain className="h-3 w-3" /> Block {bn} Quiz
                              </Button>
                            </div>
                          </div>
                        );
                      })}

                      {/* Section Final Exam */}
                      <div className="mt-4">
                        <Button
                          size="sm"
                          className="w-full h-9 gap-1.5 text-xs"
                          style={{ background: "linear-gradient(135deg, hsl(45 85% 48%), hsl(38 90% 42%))", color: "hsl(240 15% 8%)" }}
                          onClick={() => navigate(`/section/${sectionId}/final-exam`)}
                        >
                          <GraduationCap className="h-3.5 w-3.5" /> Section Final Exam
                        </Button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          });
        })()}
      </div>

      {/* Learning Dialog — routes through Orchestrator (Learning Path) first */}
      <LearningOrchestrator
        open={!!selectedBlock}
        onOpenChange={(open) => { if (!open) setSelectedBlock(null); }}
        block={selectedBlock}
        onNotesChange={handleNotesChange}
        mode="builtin"
        blockIndex={0}
      />
    </div>
  );
};

export default GameGridPage;
