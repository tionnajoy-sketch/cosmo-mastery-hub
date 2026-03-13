import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";
import { ArrowLeft, Plus, BookOpen, Loader2, FileText } from "lucide-react";

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
  const [modules, setModules] = useState<Module[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetch = async () => {
      const { data } = await supabase
        .from("uploaded_modules")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (data) {
        // Get block counts
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
    fetch();
  }, [user]);

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
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyModulesPage;
