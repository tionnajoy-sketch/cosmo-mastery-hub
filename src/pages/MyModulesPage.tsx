import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useStudyTracker } from "@/hooks/useStudyTracker";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Plus,
  BookOpen,
  Loader2,
  FileText,
  MoreVertical,
  Eye,
  Pencil,
  Copy,
  Trash2,
  Flame,
  Layers3,
  CheckCircle2,
  Clock3,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
  const { currentStreak } = useStudyTracker();

  const [modules, setModules] = useState<Module[]>([]);
  const [loading, setLoading] = useState(true);
  const [renameModule, setRenameModule] = useState<Module | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [deleteModule, setDeleteModule] = useState<Module | null>(null);
  const [duplicating, setDuplicating] = useState<string | null>(null);

  const fetchModules = async () => {
    if (!user) return;
    setLoading(true);

    const { data } = await supabase
      .from("uploaded_modules")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (!data || data.length === 0) {
      setModules([]);
      setLoading(false);
      return;
    }

    const ids = data.map((m) => m.id);
    const { data: blocks } = await supabase
      .from("uploaded_module_blocks")
      .select("module_id")
      .in("module_id", ids);

    const countMap: Record<string, number> = {};
    blocks?.forEach((b) => {
      countMap[b.module_id] = (countMap[b.module_id] || 0) + 1;
    });

    setModules(data.map((m) => ({ ...m, block_count: countMap[m.id] || 0 })));
    setLoading(false);
  };

  useEffect(() => {
    if (!user) return;
    fetchModules();
  }, [user]);

  const stats = useMemo(() => {
    const totalBlocks = modules.reduce((sum, m) => sum + (m.block_count || 0), 0);
    const readyModules = modules.filter((m) => m.status === "ready").length;
    const processingModules = modules.filter((m) => m.status === "processing").length;

    return {
      totalModules: modules.length,
      totalBlocks,
      readyModules,
      processingModules,
    };
  }, [modules]);

  const handleRename = async () => {
    if (!renameModule || !renameValue.trim()) return;
    await supabase
      .from("uploaded_modules")
      .update({ title: renameValue.trim() })
      .eq("id", renameModule.id);

    setModules((prev) =>
      prev.map((m) =>
        m.id === renameModule.id ? { ...m, title: renameValue.trim() } : m,
      ),
    );
    setRenameModule(null);
    toast({ title: "Module renamed" });
  };

  const handleDuplicate = async (mod: Module) => {
    if (!user) return;
    setDuplicating(mod.id);

    const { data: newMod } = await supabase
      .from("uploaded_modules")
      .insert({
        user_id: user.id,
        title: `${mod.title} (Copy)`,
        source_filename: mod.source_filename,
        status: mod.status,
      })
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
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-primary via-primary to-primary/95">
      <AppHeader />

      <div className="flex-1 px-4 py-6 max-w-6xl mx-auto w-full space-y-6">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center justify-between mb-2 gap-3">
            <h1 className="font-display text-2xl font-bold text-primary-foreground">
              My TJ Study Modules
            </h1>
            <Button onClick={() => navigate("/upload")} size="sm" className="gap-1 bg-background text-foreground hover:bg-background/90">
              <Plus className="h-4 w-4" /> Create With TJ™
            </Button>
          </div>
          <p className="text-sm text-primary-foreground/75">
            Your colorful learning grid for everything you created with TJ.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-2"
        >
          <Card className="border-primary-foreground/20 bg-primary-foreground/10">
            <CardContent className="p-3 text-primary-foreground">
              <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-primary-foreground/70">
                <Flame className="h-3.5 w-3.5" /> Streak
              </div>
              <p className="text-xl font-bold mt-1">{currentStreak}</p>
            </CardContent>
          </Card>

          <Card className="border-primary-foreground/20 bg-primary-foreground/10">
            <CardContent className="p-3 text-primary-foreground">
              <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-primary-foreground/70">
                <Layers3 className="h-3.5 w-3.5" /> Modules
              </div>
              <p className="text-xl font-bold mt-1">{stats.totalModules}</p>
            </CardContent>
          </Card>

          <Card className="border-primary-foreground/20 bg-primary-foreground/10">
            <CardContent className="p-3 text-primary-foreground">
              <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-primary-foreground/70">
                <CheckCircle2 className="h-3.5 w-3.5" /> Ready
              </div>
              <p className="text-xl font-bold mt-1">{stats.readyModules}</p>
            </CardContent>
          </Card>

          <Card className="border-primary-foreground/20 bg-primary-foreground/10">
            <CardContent className="p-3 text-primary-foreground">
              <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-primary-foreground/70">
                <Clock3 className="h-3.5 w-3.5" /> Blocks
              </div>
              <p className="text-xl font-bold mt-1">{stats.totalBlocks}</p>
            </CardContent>
          </Card>
        </motion.div>

        <section className="space-y-4">
          <h2 className="font-display text-lg font-semibold text-primary-foreground flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-primary-foreground/80" /> Your Modules Grid
          </h2>

          {loading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="h-7 w-7 animate-spin text-primary-foreground/70" />
            </div>
          ) : modules.length === 0 ? (
            <Card className="border-primary-foreground/25 bg-primary-foreground/5">
              <CardContent className="p-10 text-center">
                <FileText className="h-10 w-10 mx-auto mb-3 text-primary-foreground/65" />
                <p className="text-sm font-semibold text-primary-foreground mb-1">No modules yet</p>
                <p className="text-xs text-primary-foreground/70 mb-4">
                  Upload notes, PDFs, or slides and TJ will convert them into study blocks.
                </p>
                <Button onClick={() => navigate("/upload")} size="sm" className="bg-background text-foreground hover:bg-background/90">
                  Create With TJ™
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {modules.map((mod, i) => {
                const accent = sectionAccentColors[i % sectionAccentColors.length];
                const isReady = mod.status === "ready";
                const progress = isReady ? 100 : mod.status === "processing" ? 60 : 20;

                return (
                  <motion.button
                    key={mod.id}
                    initial={{ opacity: 0, scale: 0.96 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.03 }}
                    whileHover={{ scale: 1.03, y: -2 }}
                    onClick={() => isReady && navigate(`/module/${mod.id}`)}
                    className="relative rounded-2xl p-4 text-left overflow-hidden border border-primary-foreground/10 shadow-lg"
                    style={{
                      background: isReady
                        ? `linear-gradient(135deg, ${accent.bg}, ${accent.light})`
                        : "linear-gradient(135deg, hsl(var(--muted)), hsl(var(--secondary)))",
                    }}
                  >
                    <div className="absolute top-2 right-2">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 bg-background/70 hover:bg-background/85">
                            <MoreVertical className="h-4 w-4 text-foreground" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                          <DropdownMenuItem onClick={() => navigate(`/module/${mod.id}`)} disabled={!isReady}>
                            <Eye className="h-4 w-4 mr-2" /> View
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => {
                              setRenameModule(mod);
                              setRenameValue(mod.title);
                            }}
                          >
                            <Pencil className="h-4 w-4 mr-2" /> Rename
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDuplicate(mod)} disabled={duplicating === mod.id}>
                            <Copy className="h-4 w-4 mr-2" />
                            {duplicating === mod.id ? "Duplicating..." : "Duplicate"}
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setDeleteModule(mod)} className="text-destructive">
                            <Trash2 className="h-4 w-4 mr-2" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    <h3 className="font-display font-bold text-sm sm:text-base text-card-foreground pr-9 leading-tight truncate">
                      {mod.title}
                    </h3>

                    <p className="text-[11px] text-card-foreground/80 mt-1">
                      {mod.block_count || 0} blocks · {new Date(mod.created_at).toLocaleDateString()}
                    </p>

                    <div className="mt-2 inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide bg-background/70 text-foreground">
                      {isReady ? "Mastery Path Ready" : mod.status === "processing" ? "Building" : "Pending"}
                    </div>

                    <div className="mt-2">
                      <Progress value={progress} className="h-1.5 bg-background/60" />
                    </div>

                    <ArrowRight className="h-4 w-4 mt-2 text-card-foreground/80" />
                  </motion.button>
                );
              })}
            </div>
          )}
        </section>
      </div>

      <AppFooter />

      <Dialog open={!!renameModule} onOpenChange={() => setRenameModule(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename Module</DialogTitle>
          </DialogHeader>
          <Input
            value={renameValue}
            onChange={(e) => setRenameValue(e.target.value)}
            placeholder="Module title"
            onKeyDown={(e) => e.key === "Enter" && handleRename()}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRenameModule(null)}>
              Cancel
            </Button>
            <Button onClick={handleRename}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteModule} onOpenChange={() => setDeleteModule(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete "{deleteModule?.title}"?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove all generated TJ Blocks, journal notes,
              reflections, and quiz progress associated with this module.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete Module
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default MyModulesPage;
