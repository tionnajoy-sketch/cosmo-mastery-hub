import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";
import { ArrowLeft, BookOpen, Brain } from "lucide-react";

interface Section {
  id: string;
  name: string;
  description: string;
}

interface BlockInfo {
  block_number: number;
  term_count: number;
}

const SectionPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [section, setSection] = useState<Section | null>(null);
  const [blocks, setBlocks] = useState<BlockInfo[]>([]);

  useEffect(() => {
    if (!id) return;
    const fetchData = async () => {
      const [sectionRes, termsRes] = await Promise.all([
        supabase.from("sections").select("*").eq("id", id).single(),
        supabase.from("terms").select("block_number").eq("section_id", id),
      ]);
      if (sectionRes.data) setSection(sectionRes.data);
      if (termsRes.data) {
        const blockMap = new Map<number, number>();
        termsRes.data.forEach((t) => {
          blockMap.set(t.block_number, (blockMap.get(t.block_number) || 0) + 1);
        });
        setBlocks(
          Array.from(blockMap.entries())
            .map(([block_number, term_count]) => ({ block_number, term_count }))
            .sort((a, b) => a.block_number - b.block_number)
        );
      }
    };
    fetchData();
  }, [id]);

  if (!section) {
    return <div className="flex min-h-screen items-center justify-center"><p className="text-muted-foreground">Loading...</p></div>;
  }

  return (
    <div className="min-h-screen" style={{ background: "linear-gradient(180deg, hsl(12 65% 92%), hsl(15 40% 96%))" }}>
      <div className="max-w-2xl mx-auto px-4 py-6">
        <Button variant="ghost" onClick={() => navigate("/")} className="mb-4 gap-2 text-muted-foreground">
          <ArrowLeft className="h-4 w-4" /> Home
        </Button>

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="font-display text-3xl font-bold mb-2" style={{ color: "hsl(12 50% 25%)" }}>
            {section.name}
          </h1>
          <p className="text-base mb-8 leading-relaxed" style={{ color: "hsl(12 20% 40%)" }}>
            {section.description}
          </p>
        </motion.div>

        <div className="space-y-4">
          {blocks.map((block, i) => (
            <motion.div
              key={block.block_number}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + i * 0.08 }}
            >
              <Card className="border-0 shadow-md" style={{ background: "white" }}>
                <CardContent className="p-5">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-display text-lg font-semibold" style={{ color: "hsl(12 50% 25%)" }}>
                      Block {block.block_number}
                    </h3>
                    <span className="text-sm" style={{ color: "hsl(12 20% 50%)" }}>
                      {block.term_count} terms
                    </span>
                  </div>
                  <div className="flex gap-3">
                    <Button
                      className="flex-1 gap-2 py-5 text-sm"
                      style={{ background: "hsl(12 55% 50%)", color: "white" }}
                      onClick={() => navigate(`/section/${id}/study/${block.block_number}`)}
                    >
                      <BookOpen className="h-4 w-4" /> Study Block
                    </Button>
                    <Button
                      variant="outline"
                      className="flex-1 gap-2 py-5 text-sm"
                      style={{ borderColor: "hsl(12 55% 50%)", color: "hsl(12 55% 40%)" }}
                      onClick={() => navigate(`/section/${id}/quiz/${block.block_number}`)}
                    >
                      <Brain className="h-4 w-4" /> Quiz Block
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SectionPage;
