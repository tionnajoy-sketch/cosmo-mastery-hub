import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { Brain, X, CheckCircle2, XCircle } from "lucide-react";

interface ReviewTerm {
  id: string;
  term: string;
  definition: string;
  section_id: string;
  block_number: number;
}

const SESSION_KEY = "popup_review_shown";

const PopUpReview = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [term, setTerm] = useState<ReviewTerm | null>(null);
  const [visible, setVisible] = useState(false);
  const [answer, setAnswer] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);

  useEffect(() => {
    if (!user) return;
    if (sessionStorage.getItem(SESSION_KEY)) return;

    const fetchStillLearning = async () => {
      const { data: statuses } = await supabase
        .from("term_learning_status")
        .select("term_id")
        .eq("user_id", user.id)
        .eq("status", "still_learning")
        .limit(10);

      if (!statuses || statuses.length === 0) return;

      const randomId = statuses[Math.floor(Math.random() * statuses.length)].term_id;
      const { data: termData } = await supabase
        .from("terms")
        .select("id, term, definition, section_id, block_number")
        .eq("id", randomId)
        .single();

      if (termData) {
        setTerm(termData);
        setVisible(true);
        sessionStorage.setItem(SESSION_KEY, "true");
      }
    };
    fetchStillLearning();
  }, [user]);

  const handleCheck = () => {
    if (!term || !answer.trim()) return;
    setIsCorrect(answer.trim().toLowerCase() === term.term.toLowerCase());
    setSubmitted(true);
  };

  const handleDismiss = () => setVisible(false);

  if (!visible || !term) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 60 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 60 }}
        className="fixed bottom-4 left-4 right-4 z-50 max-w-md mx-auto"
      >
        <Card className="border-0 shadow-2xl" style={{ background: "white" }}>
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Brain className="h-5 w-5" style={{ color: "hsl(220 50% 55%)" }} />
                <h4 className="font-display text-sm font-semibold" style={{ color: "hsl(220 30% 25%)" }}>Quick Review</h4>
              </div>
              <button onClick={handleDismiss} className="p-1 rounded-full hover:bg-gray-100">
                <X className="h-4 w-4 text-gray-400" />
              </button>
            </div>

            {!submitted ? (
              <>
                <p className="text-sm leading-relaxed mb-3" style={{ color: "hsl(220 15% 35%)" }}>
                  Here's one term you said you're still learning. What term matches this definition?
                </p>
                <p className="text-sm font-medium leading-relaxed mb-3 p-3 rounded-lg" style={{ background: "hsl(220 30% 96%)", color: "hsl(220 20% 30%)" }}>
                  {term.definition}
                </p>
                <input
                  type="text"
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleCheck()}
                  placeholder="Type the term..."
                  className="w-full px-3 py-2 text-sm border rounded-lg mb-3 focus:outline-none focus:ring-2 focus:ring-blue-200"
                />
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" onClick={handleDismiss} className="flex-1 text-xs">
                    Skip for now
                  </Button>
                  <Button size="sm" onClick={handleCheck} disabled={!answer.trim()} className="flex-1 text-xs" style={{ background: "hsl(220 50% 55%)", color: "white" }}>
                    Check Answer
                  </Button>
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center gap-2 mb-2">
                  {isCorrect ? (
                    <><CheckCircle2 className="h-5 w-5" style={{ color: "hsl(145 50% 40%)" }} /><span className="text-sm font-medium" style={{ color: "hsl(145 40% 30%)" }}>Nice work. Your brain loves these tiny check-ins.</span></>
                  ) : (
                    <><XCircle className="h-5 w-5" style={{ color: "hsl(25 60% 50%)" }} /><span className="text-sm font-medium" style={{ color: "hsl(25 40% 30%)" }}>All good. Seeing this again is exactly how you'll remember it next time.</span></>
                  )}
                </div>
                {!isCorrect && (
                  <p className="text-xs mb-3" style={{ color: "hsl(220 15% 45%)" }}>The answer was: <strong>{term.term}</strong></p>
                )}
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" onClick={handleDismiss} className="flex-1 text-xs">
                    Close
                  </Button>
                  <Button size="sm" onClick={() => {
                    handleDismiss();
                    navigate(`/section/${term.section_id}/activity/${term.block_number}`);
                  }} className="flex-1 text-xs" style={{ background: "hsl(220 50% 55%)", color: "white" }}>
                    Review more terms
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </AnimatePresence>
  );
};

export default PopUpReview;
