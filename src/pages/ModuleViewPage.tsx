import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Loader2, Save, ChevronDown, ChevronUp, BookOpen, Eye, Sparkles, Heart, MessageSquare, Brain } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import AIMentorChat from "@/components/AIMentorChat";

interface Block {
  id: string;
  block_number: number;
  term_title: string;
  definition: string;
  visualization_desc: string;
  metaphor: string;
  affirmation: string;
  reflection_prompt: string;
  quiz_question: string;
  quiz_options: string[];
  quiz_answer: string;
  user_notes: string;
}

const ModuleViewPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [moduleTitle, setModuleTitle] = useState("");
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editingField, setEditingField] = useState<{ blockId: string; field: string } | null>(null);
  const [editValue, setEditValue] = useState("");

  useEffect(() => {
    if (!id) return;
    const fetchData = async () => {
      const [modRes, blocksRes] = await Promise.all([
        supabase.from("uploaded_modules").select("title").eq("id", id).single(),
        supabase.from("uploaded_module_blocks").select("*").eq("module_id", id).order("block_number").order("created_at"),
      ]);
      if (modRes.data) setModuleTitle(modRes.data.title);
      if (blocksRes.data) setBlocks(blocksRes.data.map((b: any) => ({ ...b, quiz_options: b.quiz_options || [] })));
      setLoading(false);
    };
    fetchData();
  }, [id]);

  const startEdit = (blockId: string, field: string, currentValue: string) => {
    setEditingField({ blockId, field });
    setEditValue(currentValue);
  };

  const saveEdit = async () => {
    if (!editingField) return;
    const { blockId, field } = editingField;
    await supabase.from("uploaded_module_blocks").update({ [field]: editValue }).eq("id", blockId);
    setBlocks((prev) => prev.map((b) => b.id === blockId ? { ...b, [field]: editValue } : b));
    setEditingField(null);
    toast({ title: "Saved" });
  };

  const saveNotes = async (blockId: string, notes: string) => {
    await supabase.from("uploaded_module_blocks").update({ user_notes: notes }).eq("id", blockId);
    setBlocks((prev) => prev.map((b) => b.id === blockId ? { ...b, user_notes: notes } : b));
  };

  const sectionIcons = [
    { key: "definition", label: "Definition", icon: BookOpen, color: "hsl(200 50% 45%)" },
    { key: "visualization_desc", label: "Visualize", icon: Eye, color: "hsl(270 40% 52%)" },
    { key: "metaphor", label: "Metaphor", icon: Sparkles, color: "hsl(325 45% 52%)" },
    { key: "affirmation", label: "Affirmation", icon: Heart, color: "hsl(346 45% 56%)" },
    { key: "reflection_prompt", label: "Reflection", icon: MessageSquare, color: "hsl(145 40% 42%)" },
    { key: "quiz_question", label: "Recall Quiz", icon: Brain, color: "hsl(42 55% 48%)" },
  ];

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;
  }

  // Group blocks by block_number
  const blockGroups: Record<number, Block[]> = {};
  blocks.forEach((b) => {
    if (!blockGroups[b.block_number]) blockGroups[b.block_number] = [];
    blockGroups[b.block_number].push(b);
  });

  return (
    <div className="min-h-screen" style={{ background: "linear-gradient(135deg, hsl(270 20% 97%), hsl(325 15% 96%))" }}>
      <div className="max-w-2xl mx-auto px-4 py-6">
        <Button variant="ghost" onClick={() => navigate("/my-modules")} className="mb-4 gap-2 text-muted-foreground">
          <ArrowLeft className="h-4 w-4" /> My Modules
        </Button>

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="font-display text-3xl font-bold mb-1 text-foreground">{moduleTitle}</h1>
          <p className="text-sm text-muted-foreground mb-6">{blocks.length} terms across {Object.keys(blockGroups).length} blocks</p>
        </motion.div>

        {Object.entries(blockGroups).sort(([a], [b]) => Number(a) - Number(b)).map(([blockNum, groupBlocks]) => (
          <motion.div key={blockNum} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
            <h2 className="font-display text-lg font-semibold mb-3 text-foreground">
              Block {blockNum}
              <span className="text-sm font-normal text-muted-foreground ml-2">
                — {groupBlocks.map((b) => b.term_title).join(", ")}
              </span>
            </h2>

            <div className="space-y-3">
              {groupBlocks.map((block) => {
                const isExpanded = expandedId === block.id;
                return (
                  <Card key={block.id} className="border-0 shadow-sm overflow-hidden" style={{ background: "hsl(0 0% 100%)" }}>
                    <CardContent className="p-0">
                      <button
                        onClick={() => setExpandedId(isExpanded ? null : block.id)}
                        className="w-full p-4 flex items-center justify-between text-left hover:bg-muted/30 transition-colors"
                      >
                        <span className="font-display text-base font-semibold text-foreground">{block.term_title}</span>
                        {isExpanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                      </button>

                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden"
                          >
                            <div className="px-4 pb-4 space-y-4">
                              {sectionIcons.map(({ key, label, icon: Icon, color }) => {
                                const value = (block as any)[key] || "";
                                const isEditing = editingField?.blockId === block.id && editingField.field === key;
                                return (
                                  <div key={key}>
                                    <div className="flex items-center gap-2 mb-1">
                                      <Icon className="h-4 w-4" style={{ color }} />
                                      <span className="text-xs font-semibold uppercase tracking-wide" style={{ color }}>{label}</span>
                                    </div>
                                    {isEditing ? (
                                      <div className="space-y-2">
                                        <Textarea value={editValue} onChange={(e) => setEditValue(e.target.value)} className="text-sm min-h-[60px]" />
                                        <div className="flex gap-2">
                                          <Button size="sm" onClick={saveEdit} style={{ background: color, color: "white" }}>
                                            <Save className="h-3 w-3 mr-1" /> Save
                                          </Button>
                                          <Button size="sm" variant="ghost" onClick={() => setEditingField(null)}>Cancel</Button>
                                        </div>
                                      </div>
                                    ) : (
                                      <p
                                        className="text-sm text-muted-foreground leading-relaxed cursor-pointer hover:bg-muted/30 p-2 rounded-lg transition-colors"
                                        onClick={() => startEdit(block.id, key, value)}
                                        title="Click to edit"
                                      >
                                        {value || <span className="italic opacity-50">Click to add...</span>}
                                      </p>
                                    )}
                                  </div>
                                );
                              })}

                              {/* Quiz Options */}
                              {block.quiz_options.length > 0 && (
                                <div className="p-3 rounded-lg" style={{ background: "hsl(42 40% 96%)" }}>
                                  <p className="text-xs font-semibold mb-2" style={{ color: "hsl(42 40% 35%)" }}>Answer Options:</p>
                                  {block.quiz_options.map((opt: string, i: number) => (
                                    <p key={i} className="text-sm text-muted-foreground">
                                      {String.fromCharCode(65 + i)}) {opt} {opt === block.quiz_answer && "✓"}
                                    </p>
                                  ))}
                                </div>
                              )}

                              {/* Notes */}
                              <div>
                                <p className="text-xs font-semibold uppercase tracking-wide mb-1 text-muted-foreground">My Notes</p>
                                <Textarea
                                  value={block.user_notes}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    setBlocks((prev) => prev.map((b) => b.id === block.id ? { ...b, user_notes: val } : b));
                                  }}
                                  onBlur={() => saveNotes(block.id, block.user_notes)}
                                  placeholder="Add your own notes here..."
                                  className="text-sm min-h-[60px]"
                                />
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </motion.div>
        ))}
      </div>

      <AIMentorChat sectionName={moduleTitle} sectionId={id!} />
    </div>
  );
};

export default ModuleViewPage;
