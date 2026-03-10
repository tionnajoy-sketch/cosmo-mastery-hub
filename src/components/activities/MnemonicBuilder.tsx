import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { motion } from "framer-motion";
import { Lightbulb, CheckCircle2, ArrowRight, Sparkles } from "lucide-react";
import BrainNote from "@/components/BrainNote";

interface Term { id: string; term: string; definition: string; }

const MnemonicBuilder = ({ terms, colors: c }: { terms: Term[]; colors: any }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [mnemonic, setMnemonic] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [allMnemonics, setAllMnemonics] = useState<Map<number, string>>(new Map());
  const done = currentIndex >= terms.length;
  const current = terms[currentIndex];

  const handleSubmit = () => {
    if (!mnemonic.trim()) return;
    setAllMnemonics((prev) => new Map(prev).set(currentIndex, mnemonic));
    setSubmitted(true);
  };

  const handleNext = () => {
    setCurrentIndex((i) => i + 1);
    setMnemonic("");
    setSubmitted(false);
  };

  if (done || terms.length === 0) {
    return (
      <Card className="border-0 shadow-md" style={{ background: c.successBg }}>
        <CardContent className="p-6 text-center">
          <Sparkles className="h-10 w-10 mx-auto mb-3" style={{ color: c.successColor }} />
          <h3 className="font-display text-xl font-bold mb-3" style={{ color: c.successHeading }}>Your Mnemonics 🧠</h3>
          <div className="space-y-2 text-left">
            {terms.map((t, i) => (
              <div key={t.id} className="p-3 rounded-lg" style={{ background: "white" }}>
                <p className="text-xs font-semibold" style={{ color: c.accent }}>{t.term}</p>
                <p className="text-sm italic" style={{ color: c.heading }}>{allMnemonics.get(i) || "—"}</p>
              </div>
            ))}
          </div>
          <BrainNote text="You just created personal memory anchors for each term. Mnemonics you create yourself are far more effective than ones someone gives you." />
          <Button className="mt-4" onClick={() => { setCurrentIndex(0); setMnemonic(""); setSubmitted(false); setAllMnemonics(new Map()); }}>
            <Lightbulb className="h-4 w-4 mr-2" /> Create New Ones
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <h2 className="font-display text-2xl font-bold mb-2" style={{ color: c.heading }}>Build Your Mnemonic</h2>
      <p className="text-sm mb-4" style={{ color: c.subtext }}>
        {currentIndex + 1}/{terms.length} — Create a phrase, image, or acronym to remember this term
      </p>

      <Card className="border-0 shadow-lg mb-4" style={{ background: "white" }}>
        <CardContent className="p-6">
          <h3 className="font-display text-lg font-semibold mb-2" style={{ color: c.heading }}>{current.term}</h3>
          <p className="text-sm leading-relaxed mb-4 p-3 rounded-lg" style={{ background: c.iconBg, color: c.heading }}>
            {current.definition}
          </p>

          <div className="p-3 rounded-lg mb-4" style={{ background: "hsl(42 50% 97%)" }}>
            <p className="text-xs leading-relaxed" style={{ color: "hsl(42 30% 35%)" }}>
              <Lightbulb className="h-3 w-3 inline mr-1" />
              Try: a silly sentence, a rhyme, an acronym, or a mental image. The weirder the better — your brain remembers unusual things.
            </p>
          </div>

          <Textarea
            placeholder="My mnemonic for this term..."
            value={mnemonic}
            onChange={(e) => setMnemonic(e.target.value)}
            disabled={submitted}
            className="min-h-[80px] text-sm"
          />
        </CardContent>
      </Card>

      {submitted ? (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="border-0 shadow-sm mb-4" style={{ background: c.successBg }}>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5" style={{ color: c.successColor }} />
                <span className="font-medium" style={{ color: c.successHeading }}>Saved! That's a great memory anchor.</span>
              </div>
            </CardContent>
          </Card>
          <Button className="w-full py-5" onClick={handleNext} style={{ background: c.button, color: "white" }}>
            Next Term <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </motion.div>
      ) : (
        <Button className="w-full py-5" onClick={handleSubmit} disabled={!mnemonic.trim()} style={{ background: c.button, color: "white" }}>
          Save My Mnemonic
        </Button>
      )}
    </motion.div>
  );
};

export default MnemonicBuilder;
