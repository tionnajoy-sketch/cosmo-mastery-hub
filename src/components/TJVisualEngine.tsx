import { useState, useCallback, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { motion, AnimatePresence } from "framer-motion";
import { ImageIcon, Loader2, RefreshCw, Eye } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useDNAAdaptation } from "@/hooks/useDNAAdaptation";

interface DiagramLabel {
  text: string;
  x: string; // CSS percentage
  y: string;
  color?: string;
}

interface TJVisualEngineProps {
  termId?: string;
  termName: string;
  definition: string;
  metaphor?: string;
  existingImageUrl?: string;
  labels?: DiagramLabel[];
  onImageGenerated?: (url: string) => void;
  compact?: boolean;
}

const TJVisualEngine = ({
  termId, termName, definition, metaphor,
  existingImageUrl, labels = [], onImageGenerated, compact = false,
}: TJVisualEngineProps) => {
  const { dna } = useDNAAdaptation();
  const [imageUrl, setImageUrl] = useState(existingImageUrl || "");
  const [loading, setLoading] = useState(false);
  const [showLabels, setShowLabels] = useState(true);
  const [error, setError] = useState("");

  const generateImage = useCallback(async () => {
    if (!termId) return;
    setLoading(true);
    setError("");

    try {
      const { data, error: fnError } = await supabase.functions.invoke("generate-term-image", {
        body: { termId, term: termName, definition, metaphor: metaphor || "" },
      });

      if (fnError) throw fnError;
      const url = data?.image_url;
      if (url) {
        setImageUrl(url);
        onImageGenerated?.(url);
      } else {
        setError("No image was generated. Try again.");
      }
    } catch (e) {
      console.error("Visual engine error:", e);
      setError("Failed to generate visual. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [termId, termName, definition, metaphor, onImageGenerated]);

  // AUTO-GENERATE on mount if no image yet — picture should appear
  // immediately when entering the Visualize step, no manual click required.
  const autoTriedRef = useRef(false);
  useEffect(() => {
    if (autoTriedRef.current) return;
    if (!termId) return;
    if (imageUrl) return;
    autoTriedRef.current = true;
    generateImage();
  }, [termId, imageUrl, generateImage]);

  // Auto-generated labels based on definition keywords
  const autoLabels: DiagramLabel[] = labels.length > 0 ? labels : [];

  const isVisualLearner = dna?.layerStrength === "V";

  return (
    <div className="space-y-2">
      {/* Visual priority badge for visual learners */}
      {isVisualLearner && (
        <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-primary/10 text-xs text-primary">
          <Eye className="w-3.5 h-3.5" />
          <span>Visual learning prioritized for your DNA profile</span>
        </div>
      )}

      {/* Image display area */}
      <Card className="border-primary/20 overflow-hidden">
        <CardContent className="p-0 relative">
          {imageUrl ? (
            <div className="relative">
              <motion.img
                src={imageUrl}
                alt={`Visual diagram of ${termName}`}
                className="w-full object-contain max-h-[400px] bg-muted/30"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
              />

              {/* HTML/CSS overlay labels — always spelled correctly */}
              {showLabels && autoLabels.length > 0 && (
                <div className="absolute inset-0 pointer-events-none">
                  {autoLabels.map((label, i) => (
                    <motion.div
                      key={i}
                      className="absolute px-2 py-0.5 rounded text-xs font-bold shadow-md pointer-events-auto"
                      style={{
                        left: label.x,
                        top: label.y,
                        backgroundColor: label.color || "hsl(var(--primary))",
                        color: "white",
                        transform: "translate(-50%, -50%)",
                      }}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: i * 0.1 }}
                    >
                      {label.text}
                    </motion.div>
                  ))}
                </div>
              )}

              {/* Label toggle */}
              {autoLabels.length > 0 && (
                <Button
                  size="sm"
                  variant="secondary"
                  className="absolute bottom-2 right-2 text-xs h-7 opacity-80 hover:opacity-100"
                  onClick={() => setShowLabels(!showLabels)}
                >
                  {showLabels ? "Hide Labels" : "Show Labels"}
                </Button>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-10 px-4 text-center bg-muted/20 min-h-[200px]">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-3">
                <ImageIcon className="w-8 h-8 text-primary/60" />
              </div>
              <p className="text-sm font-medium text-muted-foreground mb-1">Visual slot for "{termName}"</p>
              <p className="text-xs text-muted-foreground/70 mb-3">
                Generate an AI-powered educational diagram
              </p>
            </div>
          )}

          {/* Loading overlay */}
          {loading && (
            <div className="absolute inset-0 bg-background/80 flex flex-col items-center justify-center gap-2">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <span className="text-sm text-muted-foreground">Creating visual…</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Controls */}
      <div className="flex gap-2">
        {termId && (
          <Button
            size="sm"
            variant={imageUrl ? "outline" : "default"}
            onClick={generateImage}
            disabled={loading}
            className="flex-1 text-xs"
          >
            {loading ? (
              <><Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> Generating…</>
            ) : imageUrl ? (
              <><RefreshCw className="w-3.5 h-3.5 mr-1" /> Regenerate Visual</>
            ) : (
              <><ImageIcon className="w-3.5 h-3.5 mr-1" /> Generate Visual</>
            )}
          </Button>
        )}
      </div>

      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
};

export default TJVisualEngine;
