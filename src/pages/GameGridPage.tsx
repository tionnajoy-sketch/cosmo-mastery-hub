import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useCoins } from "@/hooks/useCoins";
import { useStudyTracker } from "@/hooks/useStudyTracker";
import { useLearningMetrics } from "@/hooks/useLearningMetrics";
import { motion, AnimatePresence } from "framer-motion";
import { Lock, Sparkles, Flame, Trophy, Brain, Target, TrendingUp, Zap } from "lucide-react";
import AppHeader from "@/components/AppHeader";
import LearningOrbDialog from "@/components/LearningOrbDialog";
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

// Group terms by section
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

const GameGridPage = () => {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const { stats: coinStats } = useCoins();
  const studyTracker = useStudyTracker();
  const { aggregate, getTermStatus, metrics } = useLearningMetrics();

  const [terms, setTerms] = useState<Term[]>([]);
  const [sections, setSections] = useState<Map<string, string>>(new Map());
  const [selectedBlock, setSelectedBlock] = useState<UploadedBlock | null>(null);
  const [identityMsg, setIdentityMsg] = useState(IDENTITY_MESSAGES[0]);

  useEffect(() => {
    const fetchAll = async () => {
      const [termsRes, sectionsRes] = await Promise.all([
        supabase.from("terms").select("*").order("section_id").order("block_number").order("order"),
        supabase.from("sections").select("id, name").order("order"),
      ]);
      if (termsRes.data) setTerms(termsRes.data);
      if (sectionsRes.data) {
        const map = new Map<string, string>();
        sectionsRes.data.forEach((s: any) => map.set(s.id, s.name));
        setSections(map);
      }
    };
    fetchAll();
  }, []);

  // Rotate identity messages
  useEffect(() => {
    const interval = setInterval(() => {
      setIdentityMsg(IDENTITY_MESSAGES[Math.floor(Math.random() * IDENTITY_MESSAGES.length)]);
    }, 8000);
    return () => clearInterval(interval);
  }, []);

  const handleNotesChange = useCallback(() => {}, []);

  return (
    <div className="min-h-screen" style={{ background: "linear-gradient(180deg, hsl(240 15% 8%) 0%, hsl(260 20% 12%) 50%, hsl(240 15% 10%) 100%)" }}>
      <AppHeader />

      {/* ─── Top Dashboard ─── */}
      <div className="max-w-7xl mx-auto px-4 pt-5 pb-3">
        {/* Welcome + Identity */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4"
        >
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-white">
            Welcome back, {profile?.name || "Student"} ✨
          </h1>
          <motion.p
            key={identityMsg}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-sm mt-1 italic"
            style={{ color: "hsl(45 80% 70%)" }}
          >
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
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="rounded-xl p-2.5 text-center"
              style={{
                background: "hsl(0 0% 100% / 0.06)",
                border: "1px solid hsl(0 0% 100% / 0.08)",
              }}
            >
              <stat.icon className="h-4 w-4 mx-auto mb-1" style={{ color: stat.color }} />
              <p className="text-lg font-bold text-white leading-tight">{stat.value}</p>
              <p className="text-[9px] uppercase tracking-wider" style={{ color: "hsl(0 0% 100% / 0.5)" }}>{stat.label}</p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* ─── Game Grid grouped by section ─── */}
      <div className="max-w-7xl mx-auto px-4 pb-12 space-y-8">
        {(() => {
          const { sectionOrder, grouped } = groupTermsBySection(terms);
          let globalIndex = 0;

          return sectionOrder.map((sectionId) => {
            const sectionTerms = grouped.get(sectionId) || [];
            const sectionName = sections.get(sectionId) || "Uncategorized";

            return (
              <div key={sectionId}>
                {/* Section divider */}
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-px flex-1" style={{ background: "linear-gradient(90deg, transparent, hsl(0 0% 100% / 0.2), transparent)" }} />
                  <h2 className="font-display text-sm sm:text-base font-semibold uppercase tracking-widest px-3 py-1 rounded-full"
                    style={{ color: "hsl(45 80% 70%)", background: "hsl(0 0% 100% / 0.06)", border: "1px solid hsl(0 0% 100% / 0.1)" }}>
                    {sectionName}
                  </h2>
                  <div className="h-px flex-1" style={{ background: "linear-gradient(90deg, transparent, hsl(0 0% 100% / 0.2), transparent)" }} />
                </div>

                {/* Terms grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                  {sectionTerms.map((term) => {
                    const i = globalIndex++;
                    const status = getTermStatus(term.id);
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
                              : status === "locked"
                                ? "hsl(0 0% 100% / 0.04)"
                                : `linear-gradient(135deg, ${tileColor.bg}, ${tileColor.bg})`,
                          border: status === "mastery"
                            ? "2px solid hsl(45 85% 60%)"
                            : status === "completed"
                              ? "2px solid hsl(145 45% 50%)"
                              : "1px solid hsl(0 0% 100% / 0.1)",
                          boxShadow: status === "active" || status === "in_progress"
                            ? `0 4px 20px ${tileColor.glow}`
                            : status === "mastery"
                              ? "0 4px 24px hsl(45 85% 48% / 0.4)"
                              : "none",
                          opacity: status === "locked" ? 0.4 : 1,
                          minHeight: "120px",
                        }}
                      >
                        <div className="absolute top-2.5 right-2.5">
                          {status === "locked" && <Lock className="h-4 w-4 text-white/30" />}
                          {status === "mastery" && (
                            <motion.div animate={{ rotate: [0, 10, -10, 0] }} transition={{ repeat: Infinity, duration: 3 }}>
                              <Trophy className="h-5 w-5 text-yellow-100" />
                            </motion.div>
                          )}
                          {status === "completed" && <Sparkles className="h-4 w-4 text-white/80" />}
                        </div>

                        <h3 className="font-display font-bold text-sm sm:text-base text-white leading-tight pr-6">
                          {term.term}
                        </h3>

                        {status === "in_progress" && (
                          <div className="mt-3">
                            <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "hsl(0 0% 100% / 0.15)" }}>
                              <motion.div
                                className="h-full rounded-full"
                                style={{ background: "hsl(0 0% 100% / 0.7)" }}
                                initial={{ width: 0 }}
                                animate={{ width: `${progress}%` }}
                              />
                            </div>
                            <p className="text-[8px] mt-1 text-white/40">{layersComplete}/8 layers</p>
                          </div>
                        )}

                        {(status === "active" || status === "in_progress") && (
                          <div
                            className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
                            style={{ boxShadow: `inset 0 0 30px ${tileColor.glow}` }}
                          />
                        )}
                      </motion.button>
                    );
                  })}
                </div>
              </div>
            );
          });
        })()}
      </div>

      {/* Learning Dialog */}
      <LearningOrbDialog
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
