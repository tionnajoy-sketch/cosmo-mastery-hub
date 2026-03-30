import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { motion } from "framer-motion";
import { ArrowLeft, ArrowRight, Plus, BookOpen, Loader2, FileText, MoreVertical, Eye, Pencil, Copy, Trash2, Sparkles, Lock, Bell } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { sectionAccentColors } from "@/lib/colors";
import AppHeader from "@/components/AppHeader";
import AppFooter from "@/components/AppFooter";

interface Module {
  id: string;
  title: string;
  status: string;
  source_filename: string;
  created_at: string;
  block_count?: number;
}

const MyModulesPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [modules, setModules] = useState<Module[]>([]);
  const [loading, setLoading] = useState(true);
  const [renameModule, setRenameModule] = useState<Module | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [deleteModule, setDeleteModule] = useState<Module | null>(null);
  const [duplicating, setDuplicating] = useState<string | null>(null);

  const fetchModules = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("uploaded_modules")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (data) {
      const ids = data.map((m) => m.id);
      const { data: blocks } = await supabase
        .from("uploaded_module_blocks")
        .select("module_id")
        .in("module_id", ids);

      const countMap: Record<string, number> = {};
      blocks?.forEach((b) => { countMap[b.module_id] = (countMap[b.module_id] || 0) + 1; });

      setModules(data.map((m) => ({ ...m, block_count: countMap[m.id] || 0 })));
    }
    setLoading(false);
  };

  useEffect(() => {
    if (!user) return;
    fetchModules();
  }, [user]);

  const handleRename = async () => {
    if (!renameModule || !renameValue.trim()) return;
    await supabase.from("uploaded_modules").update({ title: renameValue.trim() }).eq("id", renameModule.id);
    setModules((prev) => prev.map((m) => m.id === renameModule.id ? { ...m, title: renameValue.trim() } : m));
    setRenameModule(null);
    toast({ title: "Module renamed" });
  };

  const handleDuplicate = async (mod: Module) => {
    if (!user) return;
    setDuplicating(mod.id);
    const { data: newMod } = await supabase
      .from("uploaded_modules")
      .insert({ user_id: user.id, title: `${mod.title} (Copy)`, source_filename: mod.source_filename, status: mod.status })
      .select()
      .single();

    if (newMod) {
      const { data: blocks } = await supabase
        .from("uploaded_module_blocks")
        .select("*")
        .eq("module_id", mod.id);

      if (blocks && blocks.length > 0) {
        const newBlocks = blocks.map(({ id, module_id, created_at, ...rest }) => ({
          ...rest,
          module_id: newMod.id,
        }));
        await supabase.from("uploaded_module_blocks").insert(newBlocks);
      }
    }

    setDuplicating(null);
    toast({ title: "Module duplicated" });
    fetchModules();
  };

  const handleDelete = async () => {
    if (!deleteModule) return;
    await supabase.from("uploaded_modules").delete().eq("id", deleteModule.id);
    setModules((prev) => prev.filter((m) => m.id !== deleteModule.id));
    setDeleteModule(null);
    toast({ title: "Module deleted" });
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <AppHeader />
      <div className="flex-1 px-4 py-6 max-w-2xl mx-auto w-full space-y-8">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center justify-between mb-1">
            <h1 className="font-display text-2xl font-bold text-foreground">My TJ Study Modules</h1>
            <Button onClick={() => navigate("/upload")} size="sm" className="gap-1">
              <Plus className="h-4 w-4" /> New
            </Button>
          </div>
          <p className="text-sm text-muted-foreground mb-6">
            Your uploaded and converted study blocks, ready to learn.
          </p>
        </motion.div>

        {/* Module Cards — matching StudyModulesPage grid */}
        <section className="space-y-4">
          <h2 className="font-display text-lg font-semibold text-foreground flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-primary" /> Your Modules
          </h2>

          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : modules.length === 0 ? (
            <Card className="border-2 border-dashed border-muted">
              <CardContent className="p-8 text-center">
                <FileText className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
                <p className="text-sm font-semibold text-foreground mb-1">No modules yet</p>
                <p className="text-xs text-muted-foreground mb-4">Upload your study materials to create TJ Blocks</p>
                <Button onClick={() => navigate("/upload")} size="sm">
                  Upload Materials
                </Button>
              </CardContent>
            </Card>
          ) : (
            modules.map((mod, i) => {
              const accent = sectionAccentColors[i % sectionAccentColors.length];
              const isReady = mod.status === "ready";
              return (
                <motion.div key={mod.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
                  <Card
                    className="border-0 shadow-lg cursor-pointer hover:shadow-xl transition-shadow overflow-hidden bg-card"
                    onClick={() => isReady ? navigate(`/module/${mod.id}`) : null}
                  >
                    <div className="flex">
                      <div className="w-2 flex-shrink-0" style={{ background: accent.bg }} />
                      <CardContent className="p-5 flex-1">
                        <div className="flex items-center justify-between">
                          <div className="flex-1 min-w-0">
                            <h3 className="font-display text-lg font-semibold mb-1 truncate" style={{ color: accent.bg === "hsl(38 35% 60%)" || accent.bg === "hsl(38 25% 50%)" ? "hsl(38 30% 35%)" : accent.bg }}>
                              {mod.title}
                            </h3>
                            <p className="text-sm text-muted-foreground mb-2">
                              {mod.block_count} blocks · {new Date(mod.created_at).toLocaleDateString()}
                            </p>
                            {mod.status === "processing" && (
                              <div className="flex items-center gap-2">
                                <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
                                <span className="text-xs text-muted-foreground">Processing…</span>
                              </div>
                            )}
                            {isReady && mod.block_count && mod.block_count > 0 && (
                              <div>
                                <div className="flex items-center justify-between mb-1">
                                  <span className="text-xs text-muted-foreground">{mod.block_count} blocks ready</span>
                                  <span className="text-xs font-medium px-2 py-0.5 rounded-full" style={{ background: "hsl(145 40% 92%)", color: "hsl(145 50% 32%)" }}>
                                    Ready
                                  </span>
                                </div>
                                <Progress value={100} className="h-1.5" />
                              </div>
                            )}
                          </div>
                          <div className="flex items-center gap-2 ml-4">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                                <DropdownMenuItem onClick={() => navigate(`/module/${mod.id}`)} disabled={!isReady}>
                                  <Eye className="h-4 w-4 mr-2" /> View
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => { setRenameModule(mod); setRenameValue(mod.title); }}>
                                  <Pencil className="h-4 w-4 mr-2" /> Rename
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleDuplicate(mod)} disabled={duplicating === mod.id}>
                                  <Copy className="h-4 w-4 mr-2" /> {duplicating === mod.id ? "Duplicating..." : "Duplicate"}
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setDeleteModule(mod)} className="text-destructive">
                                  <Trash2 className="h-4 w-4 mr-2" /> Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                            <ArrowRight className="h-5 w-5 flex-shrink-0" style={{ color: accent.bg }} />
                          </div>
                        </div>
                      </CardContent>
                    </div>
                  </Card>
                </motion.div>
              );
            })
          )}
        </section>
      </div>
      <AppFooter />

      {/* Rename Dialog */}
      <Dialog open={!!renameModule} onOpenChange={() => setRenameModule(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename Module</DialogTitle>
          </DialogHeader>
          <Input value={renameValue} onChange={(e) => setRenameValue(e.target.value)} placeholder="Module title" onKeyDown={(e) => e.key === "Enter" && handleRename()} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRenameModule(null)}>Cancel</Button>
            <Button onClick={handleRename}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteModule} onOpenChange={() => setDeleteModule(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete "{deleteModule?.title}"?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove all generated TJ Blocks, journal notes, reflections, and quiz progress associated with this module. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete Module
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default MyModulesPage;
