import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";
import { CheckCircle2, XCircle, RotateCcw, Image } from "lucide-react";
import BrainNote from "@/components/BrainNote";

interface Term { id: string; term: string; definition: string; }

const PictureMatch = ({ terms, colors: c }: { terms: Term[]; colors: any }) => {
  const [termImages, setTermImages] = useState<Map<string, string>>(new Map());
  const [termsWithImages, setTermsWithImages] = useState<Term[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [options, setOptions] = useState<Term[]>([]);
  const [score, setScore] = useState(0);

  useEffect(() => {
    const fetchImages = async () => {
      const { data } = await supabase
        .from("term_images")
        .select("term_id, image_url")
        .in("term_id", terms.map((t) => t.id));
      if (data) {
        const map = new Map<string, string>();
        data.forEach((d) => map.set(d.term_id, d.image_url));
        setTermImages(map);
        const withImages = terms.filter((t) => map.has(t.id));
        setTermsWithImages(withImages.sort(() => Math.random() - 0.5));
        if (withImages.length > 0) generateOptions(withImages, 0);
      }
    };
    if (terms.length > 0) fetchImages();
  }, [terms]);

  const generateOptions = (pool: Term[], idx: number) => {
    const correct = pool[idx];
    const others = terms.filter((t) => t.id !== correct.id).sort(() => Math.random() - 0.5).slice(0, 3);
    setOptions([correct, ...others].sort(() => Math.random() - 0.5));
  };

  const current = termsWithImages[currentIndex];
  const done = currentIndex >= termsWithImages.length;

  const handleSelect = (termId: string) => {
    if (selected) return;
    setSelected(termId);
    if (termId === current.id) setScore((s) => s + 1);
  };

  const handleNext = () => {
    const next = currentIndex + 1;
    setCurrentIndex(next);
    setSelected(null);
    if (next < termsWithImages.length) generateOptions(termsWithImages, next);
  };

  if (termsWithImages.length === 0) {
    return (
      <Card className="border-0 shadow-md" style={{ background: c.iconBg }}>
        <CardContent className="p-6 text-center">
          <Image className="h-10 w-10 mx-auto mb-3" style={{ color: c.accent }} />
          <h3 className="font-display text-lg font-bold mb-2" style={{ color: c.heading }}>No Images Yet</h3>
          <p className="text-sm" style={{ color: c.subtext }}>Visit the Study page first to generate images for these terms.</p>
        </CardContent>
      </Card>
    );
  }

  if (done) {
    return (
      <Card className="border-0 shadow-md" style={{ background: c.successBg }}>
        <CardContent className="p-6 text-center">
          <CheckCircle2 className="h-10 w-10 mx-auto mb-3" style={{ color: c.successColor }} />
          <h3 className="font-display text-xl font-bold mb-2" style={{ color: c.successHeading }}>
            {score}/{termsWithImages.length} Matched! 🎨
          </h3>
          <BrainNote text="Connecting images to terms activates visual memory pathways. This makes recall stronger and more vivid on exam day." />
          <Button className="mt-4" onClick={() => { setCurrentIndex(0); setScore(0); setSelected(null); setTermsWithImages((t) => [...t].sort(() => Math.random() - 0.5)); }}>
            <RotateCcw className="h-4 w-4 mr-2" /> Play Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  const imageUrl = termImages.get(current.id);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <h2 className="font-display text-2xl font-bold mb-2" style={{ color: c.heading }}>Picture Match</h2>
      <p className="text-sm mb-4" style={{ color: c.subtext }}>{currentIndex + 1}/{termsWithImages.length} — Which term matches this image?</p>

      <Card className="border-0 shadow-lg mb-4 overflow-hidden" style={{ background: "white" }}>
        <div className="aspect-video bg-muted flex items-center justify-center">
          {imageUrl ? (
            <img src={imageUrl} alt="Term visual" className="w-full h-full object-cover" />
          ) : (
            <Image className="h-12 w-12 text-muted-foreground" />
          )}
        </div>
      </Card>

      <div className="grid grid-cols-2 gap-3 mb-4">
        {options.map((opt) => {
          const isSelected = selected === opt.id;
          const isCorrect = opt.id === current.id;
          let bg = "white";
          let border = c.termBorder;
          if (selected) {
            if (isCorrect) { bg = c.successBg; border = "hsl(145 50% 55%)"; }
            else if (isSelected) { bg = c.wrongBg; border = c.wrongBorder; }
          }
          return (
            <button
              key={opt.id}
              onClick={() => handleSelect(opt.id)}
              disabled={!!selected}
              className="p-3 rounded-xl text-sm font-medium transition-all border-2 text-left"
              style={{ background: bg, borderColor: border, color: c.heading }}
            >
              {opt.term}
            </button>
          );
        })}
      </div>

      {selected && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="border-0 shadow-sm mb-4" style={{ background: selected === current.id ? c.successBg : c.wrongBg }}>
            <CardContent className="p-4">
              {selected === current.id ? (
                <div className="flex items-center gap-2"><CheckCircle2 className="h-5 w-5" style={{ color: c.successColor }} /><span className="font-medium" style={{ color: c.successHeading }}>Correct! ✨</span></div>
              ) : (
                <div className="flex items-center gap-2"><XCircle className="h-5 w-5" style={{ color: c.wrongBorder }} /><span className="text-sm" style={{ color: c.heading }}>That's <strong>{current.term}</strong></span></div>
              )}
            </CardContent>
          </Card>
          <Button className="w-full py-5" onClick={handleNext} style={{ background: c.button, color: "white" }}>Next</Button>
        </motion.div>
      )}
    </motion.div>
  );
};

export default PictureMatch;
