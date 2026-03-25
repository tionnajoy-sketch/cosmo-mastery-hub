import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { type CrosswordWord } from "@/lib/crosswordGenerator";
import { Eye, BookOpen, Lightbulb, Brain, Heart, Wrench, ClipboardCheck, ChevronRight, ChevronLeft } from "lucide-react";

const LAYERS = [
  { key: "definition", label: "Definition", icon: BookOpen, color: "hsl(45 80% 50%)" },
  { key: "visualization", label: "Visualization", icon: Eye, color: "hsl(200 70% 50%)" },
  { key: "metaphor", label: "Metaphor", icon: Heart, color: "hsl(280 60% 55%)" },
  { key: "information", label: "Why It Matters", icon: Lightbulb, color: "hsl(160 60% 45%)" },
  { key: "reflection", label: "Reflect", icon: Brain, color: "hsl(220 40% 40%)" },
  { key: "apply", label: "Apply", icon: Wrench, color: "hsl(120 50% 40%)" },
  { key: "assess", label: "Assessment", icon: ClipboardCheck, color: "hsl(0 65% 50%)" },
];

interface Props {
  word: CrosswordWord;
  onClose: () => void;
}

const LayerReveal = ({ word, onClose }: Props) => {
  const [currentLayer, setCurrentLayer] = useState(0);
  const layer = LAYERS[currentLayer];

  const getLayerContent = (key: string): string => {
    switch (key) {
      case "definition":
        return word.clue;
      case "visualization":
        return `Visualize "${word.word}" in the context of ${word.category}. Picture how this concept looks in a real salon environment.`;
      case "metaphor":
        return `Think of "${word.word}" like a key tool in your professional toolkit — every time you understand it deeper, you unlock more confidence on exam day and in the salon chair.`;
      case "information":
        return `"${word.word}" falls under ${word.category}. Understanding this concept is critical for state board preparation because it connects to safety, client care, and professional standards.`;
      case "reflection":
        return `How would you explain "${word.word}" to a client or fellow student? Think about a time in clinic where this concept mattered.`;
      case "apply":
        return `Imagine you're in the salon and a client asks about "${word.word}". How would you use this knowledge to provide excellent service and ensure safety?`;
      case "assess":
        return `You've reviewed "${word.word}". On your state board exam, this could appear as a definition question, a scenario, or a safety protocol. Are you ready?`;
      default:
        return "";
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-lg bg-slate-900 border-white/10 text-white">
        <div className="text-center mb-4">
          <p className="text-xs text-white/40 uppercase tracking-wider mb-1">TJ Anderson Layer Method™</p>
          <h3 className="text-2xl font-display font-bold" style={{ color: layer.color }}>{word.word}</h3>
          <p className="text-xs text-white/50 mt-1">{word.category}</p>
        </div>

        {/* Layer Dots */}
        <div className="flex justify-center gap-2 mb-4">
          {LAYERS.map((l, i) => (
            <button
              key={l.key}
              onClick={() => setCurrentLayer(i)}
              className="w-3 h-3 rounded-full transition-all"
              style={{
                background: i === currentLayer ? l.color : "rgba(255,255,255,0.15)",
                transform: i === currentLayer ? "scale(1.3)" : "scale(1)",
              }}
            />
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={layer.key}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            <div className="rounded-xl p-5 mb-4" style={{ background: `${layer.color}15`, border: `1px solid ${layer.color}30` }}>
              <div className="flex items-center gap-2 mb-3">
                <layer.icon className="h-5 w-5" style={{ color: layer.color }} />
                <span className="text-sm font-bold" style={{ color: layer.color }}>
                  Layer {currentLayer + 1}: {layer.label}
                </span>
              </div>
              <p className="text-sm text-white/80 leading-relaxed">
                {getLayerContent(layer.key)}
              </p>
            </div>
          </motion.div>
        </AnimatePresence>

        <div className="flex justify-between">
          <Button
            variant="outline"
            size="sm"
            className="border-white/20 text-white/60"
            disabled={currentLayer === 0}
            onClick={() => setCurrentLayer((p) => p - 1)}
          >
            <ChevronLeft className="h-4 w-4 mr-1" /> Previous
          </Button>
          {currentLayer < LAYERS.length - 1 ? (
            <Button
              size="sm"
              className="bg-gradient-to-r from-amber-500 to-orange-600 text-white border-0"
              onClick={() => setCurrentLayer((p) => p + 1)}
            >
              Next Layer <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          ) : (
            <Button
              size="sm"
              className="bg-emerald-600 text-white border-0"
              onClick={onClose}
            >
              Complete ✓
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default LayerReveal;
