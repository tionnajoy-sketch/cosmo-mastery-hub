import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { motion } from "framer-motion";
import { CheckCircle2, ArrowRight, PenLine } from "lucide-react";
import BrainNote from "@/components/BrainNote";

interface Term { id: string; term: string; definition: string; }

const OwnWords = ({ terms, colors: c }: { terms: Term[]; colors: any }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [text, setText] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const done = currentIndex >= terms.length;
  const current = terms[currentIndex];

  const handleSubmit = () => { if (text.trim()) setSubmitted(true); };
  const handleNext = () => { setCurrentIndex((i) => i + 1); setText(""); setSubmitted(false); };

  if (done || terms.length === 0) {
    return (
      <Card className="border-0 shadow-md" style={{ background: c.successBg }}>
        <CardContent className="p-6 text-center">
          <CheckCircle2 className="h-10 w-10 mx-auto mb-3" style={{ color: c.successColor }} />
          <h3 className="font-display text-xl font-bold mb-2" style={{ color: c.successHeading }}>All Done! 🌟</h3>
          <p className="text-sm mb-4" style={{ color: c.subtext }}>You've put every term into your own words. That's powerful learning.</p>
          <Button onClick={() => { setCurrentIndex(0); setText(""); setSubmitted(false); }}>
            <PenLine className="h-4 w-4 mr-2" /> Do It Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <h2 className="font-display text-2xl font-bold mb-2" style={{ color: c.heading }}>Write It In Your Own Words</h2>
      <p className="text-sm mb-4" style={{ color: c.subtext }}>{currentIndex + 1}/{terms.length} — Read the definition, then explain it yourself</p>

      <Card className="border-0 shadow-lg mb-4" style={{ background: "white" }}>
        <CardContent className="p-6">
          <h3 className="font-display text-lg font-semibold mb-2" style={{ color: c.heading }}>{current.term}</h3>
          <p className="text-sm leading-relaxed mb-4 p-3 rounded-lg" style={{ background: c.iconBg, color: c.heading }}>
            {current.definition}
          </p>
          <Textarea
            placeholder="Explain this term in your own words in 1–2 sentences..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            disabled={submitted}
            className="min-h-[100px] text-sm"
          />
        </CardContent>
      </Card>

      {submitted ? (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="border-0 shadow-sm mb-4" style={{ background: c.successBg }}>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <CheckCircle2 className="h-5 w-5" style={{ color: c.successColor }} />
                <span className="font-medium" style={{ color: c.successHeading }}>Great work!</span>
              </div>
              <BrainNote text="Turning a definition into your own language is a form of retrieval practice that strengthens memory. If you can explain it, you understand it." />
            </CardContent>
          </Card>
          <Button className="w-full py-5" onClick={handleNext} style={{ background: c.button, color: "white" }}>
            Next Term <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </motion.div>
      ) : (
        <Button className="w-full py-5" onClick={handleSubmit} disabled={!text.trim()} style={{ background: c.button, color: "white" }}>
          I've Written My Explanation
        </Button>
      )}
    </motion.div>
  );
};

export default OwnWords;
