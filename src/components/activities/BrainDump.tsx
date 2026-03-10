import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { motion } from "framer-motion";
import { Brain, Eye, CheckCircle2 } from "lucide-react";
import BrainNote from "@/components/BrainNote";

interface Term { id: string; term: string; definition: string; }

const BrainDump = ({ terms, colors: c }: { terms: Term[]; colors: any }) => {
  const [phase, setPhase] = useState<"dump" | "compare">("dump");
  const [text, setText] = useState("");

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <h2 className="font-display text-2xl font-bold mb-2" style={{ color: c.heading }}>Brain Dump</h2>

      {phase === "dump" ? (
        <>
          <p className="text-sm mb-4" style={{ color: c.subtext }}>
            Without looking at your notes, write down everything you remember about the terms in this block. Don't worry about being perfect.
          </p>

          <Card className="border-0 shadow-lg mb-4" style={{ background: "white" }}>
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-3">
                <Brain className="h-5 w-5" style={{ color: c.accent }} />
                <span className="font-display text-sm font-semibold" style={{ color: c.heading }}>
                  List everything you remember about these {terms.length} terms:
                </span>
              </div>
              <div className="flex flex-wrap gap-2 mb-4">
                {terms.map((t) => (
                  <span key={t.id} className="px-2 py-1 rounded-md text-xs font-medium" style={{ background: c.iconBg, color: c.accent }}>
                    {t.term}
                  </span>
                ))}
              </div>
              <Textarea
                placeholder="Write what you remember... definitions, functions, connections, anything..."
                value={text}
                onChange={(e) => setText(e.target.value)}
                className="min-h-[150px] text-sm"
              />
            </CardContent>
          </Card>

          <Button className="w-full py-5" onClick={() => setPhase("compare")} disabled={!text.trim()} style={{ background: c.button, color: "white" }}>
            <Eye className="h-4 w-4 mr-2" /> Compare With Definitions
          </Button>
        </>
      ) : (
        <>
          <p className="text-sm mb-4" style={{ color: c.subtext }}>
            Compare what you wrote with the actual definitions. What did you remember? What did you miss?
          </p>

          <Card className="border-0 shadow-sm mb-4" style={{ background: c.iconBg }}>
            <CardContent className="p-4">
              <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: c.accent }}>What you wrote</p>
              <p className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: c.heading }}>{text}</p>
            </CardContent>
          </Card>

          <div className="space-y-3 mb-4">
            {terms.map((term) => (
              <Card key={term.id} className="border-0 shadow-sm" style={{ background: "white" }}>
                <CardContent className="p-4">
                  <h4 className="font-display text-sm font-semibold mb-1" style={{ color: c.heading }}>{term.term}</h4>
                  <p className="text-xs leading-relaxed" style={{ color: c.subtext }}>{term.definition}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card className="border-0 shadow-sm mb-4" style={{ background: c.successBg }}>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <CheckCircle2 className="h-5 w-5" style={{ color: c.successColor }} />
                <span className="font-medium text-sm" style={{ color: c.successHeading }}>Nice work retrieving from memory!</span>
              </div>
              <BrainNote text="Brain-dump style retrieval improves long-term retention more than extra re-reading. The effort of remembering is what makes it stick." />
            </CardContent>
          </Card>

          <Button className="w-full py-5" onClick={() => { setPhase("dump"); setText(""); }} style={{ background: c.button, color: "white" }}>
            <Brain className="h-4 w-4 mr-2" /> Try Again
          </Button>
        </>
      )}
    </motion.div>
  );
};

export default BrainDump;
