import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { motion } from "framer-motion";
import { ArrowLeft, Plus, BookOpen, Loader2, FileText, MoreVertical, Eye, Pencil, Copy, Trash2 } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import AppHeader from "@/components/AppHeader";

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
    // Create new module
    const { data: newMod } = await supabase
      .from("uploaded_modules")
      .insert({ user_id: user.id, title: `${mod.title} (Copy)`, source_filename: mod.source_filename, status: mod.status })
      .select()
      .single();

    if (newMod) {
      // Copy blocks
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
    <div className="min-h-screen" style={{ background: "linear-gradient(135deg, hsl(270 20% 97%), hsl(325 15% 96%))" }}>
      <div className="max-w-2xl mx-auto px-4 py-6">
        <Button variant="ghost" onClick={() => navigate("/")} className="mb-4 gap-2 text-muted-foreground">
          <ArrowLeft className="h-4 w-4" /> Dashboard
        </Button>

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="font-display text-3xl font-bold text-foreground">My TJ Study Modules</h1>
              <p className="text-sm text-muted-foreground mt-1">Your converted learning blocks</p>
            </div>
            <Button onClick={() => navigate("/upload")} size="sm" style={{ background: "hsl(270 40% 52%)", color: "white" }}>
              <Plus className="h-4 w-4 mr-1" /> New
            </Button>
          </div>
        </motion.div>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : modules.length === 0 ? (
          <Card className="border-2 border-dashed" style={{ borderColor: "hsl(270 20% 80%)" }}>
            <CardContent className="p-8 text-center">
              <FileText className="h-10 w-10 mx-auto mb-3" style={{ color: "hsl(270 20% 65%)" }} />
              <p className="text-sm font-semibold text-foreground mb-1">No modules yet</p>
              <p className="text-xs text-muted-foreground mb-4">Upload your study materials to create TJ Blocks</p>
              <Button onClick={() => navigate("/upload")} size="sm" style={{ background: "hsl(270 40% 52%)", color: "white" }}>
                Upload Materials
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {modules.map((mod, i) => (
              <motion.div key={mod.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                <Card
                  className="border-0 shadow-sm cursor-pointer hover:shadow-md transition-shadow"
                  style={{ background: "hsl(0 0% 100%)" }}
                  onClick={() => mod.status === "ready" ? navigate(`/module/${mod.id}`) : null}
                >
                  <CardContent className="p-4 flex items-center gap-4">
                    <div className="p-2.5 rounded-xl flex-shrink-0" style={{ background: "hsl(270 25% 94%)" }}>
                      <BookOpen className="h-5 w-5" style={{ color: "hsl(270 40% 52%)" }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">{mod.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {mod.block_count} blocks · {new Date(mod.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    {mod.status === "processing" && (
                      <Loader2 className="h-4 w-4 animate-spin" style={{ color: "hsl(270 40% 52%)" }} />
                    )}
                    {mod.status === "ready" && (
                      <span className="text-xs font-medium px-2 py-0.5 rounded-full" style={{ background: "hsl(145 40% 92%)", color: "hsl(145 50% 32%)" }}>
                        Ready
                      </span>
                    )}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                        <DropdownMenuItem onClick={() => navigate(`/module/${mod.id}`)} disabled={mod.status !== "ready"}>
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
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Rename Dialog */}
      <Dialog open={!!renameModule} onOpenChange={() => setRenameModule(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename Module</DialogTitle>
          </DialogHeader>
          <Input value={renameValue} onChange={(e) => setRenameValue(e.target.value)} placeholder="Module title" onKeyDown={(e) => e.key === "Enter" && handleRename()} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRenameModule(null)}>Cancel</Button>
            <Button onClick={handleRename} style={{ background: "hsl(270 40% 52%)", color: "white" }}>Save</Button>
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
