import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";
import {
  ArrowRight, BookOpen, Lock, Bell, Sparkles,
} from "lucide-react";
import { sectionAccentColors } from "@/lib/colors";
import AppHeader from "@/components/AppHeader";
import AppFooter from "@/components/AppFooter";
import { useToast } from "@/hooks/use-toast";

interface Section {
  id: string;
  name: string;
  description: string;
  order: number;
  color_theme: string;
}

const comingSoonModules = [
  { name: "Product Knowledge", color: "hsl(200 55% 48%)" },
  { name: "Chemical Services", color: "hsl(25 70% 55%)" },
  { name: "Haircutting & Styling", color: "hsl(270 50% 52%)" },
  { name: "Business & Professionalism", color: "hsl(145 50% 40%)" },
];

const StudyModulesPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [sections, setSections] = useState<Section[]>([]);
  const [uploadedModules, setUploadedModules] = useState<{ id: string; title: string; status: string; created_at: string }[]>([]);

  useEffect(() => {
    supabase.from("sections").select("*").order("order").then(({ data }) => {
      if (data) setSections(data);
    });
  }, []);

  useEffect(() => {
    if (!user) return;
    supabase.from("uploaded_modules").select("id, title, status, created_at").eq("user_id", user.id).order("created_at", { ascending: false }).then(({ data }) => {
      if (data) setUploadedModules(data);
    });
  }, [user]);

  const handleNotifyMe = (name: string) => {
    toast({ title: "You'll be notified!", description: `We'll let you know when ${name} is available.` });
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <AppHeader />

      <div className="flex-1 px-4 py-6 max-w-2xl mx-auto w-full space-y-8">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="font-display text-2xl sm:text-3xl font-bold mb-2 text-foreground">Study Modules</h1>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Choose a module to begin studying. Take your time — this is your calm space to learn and grow.
          </p>
        </motion.div>

        {/* Available Now */}
        <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}>
          <h2 className="font-display text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-primary" /> Available Now
          </h2>
          <div className="space-y-3">
            {sections.map((section, i) => {
              const accent = sectionAccentColors[i % sectionAccentColors.length];
              return (
                <motion.div key={section.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 + i * 0.06 }}>
                  <Card
                    className="border-0 shadow-md cursor-pointer hover:shadow-lg transition-shadow overflow-hidden bg-card"
                    onClick={() => navigate(`/section/${section.id}`)}
                  >
                    <div className="flex">
                      <div className="w-2 flex-shrink-0" style={{ background: accent.bg }} />
                      <CardContent className="p-5 flex-1">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <h3 className="font-display text-lg font-semibold mb-1" style={{ color: accent.text }}>{section.name}</h3>
                            <p className="text-sm text-muted-foreground leading-relaxed">{section.description}</p>
                          </div>
                          <ArrowRight className="h-5 w-5 ml-4 flex-shrink-0" style={{ color: accent.bg }} />
                        </div>
                      </CardContent>
                    </div>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </motion.section>

        {/* My Uploaded Modules */}
        {uploadedModules.length > 0 && (
          <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-lg font-semibold text-foreground flex items-center gap-2">
                <Sparkles className="h-5 w-5" style={{ color: "hsl(270 40% 52%)" }} /> My TJ Study Modules
              </h2>
              <Button variant="ghost" size="sm" onClick={() => navigate("/my-modules")} className="text-xs">View All</Button>
            </div>
            <div className="space-y-2">
              {uploadedModules.slice(0, 5).map((mod) => (
                <Card
                  key={mod.id}
                  className="border-0 shadow-sm cursor-pointer hover:shadow-md transition-shadow bg-card"
                  onClick={() => mod.status === "ready" ? navigate(`/module/${mod.id}`) : null}
                >
                  <CardContent className="p-3 flex items-center gap-3">
                    <div className="p-2 rounded-lg" style={{ background: "hsl(270 25% 94%)" }}>
                      <Sparkles className="h-4 w-4" style={{ color: "hsl(270 40% 52%)" }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{mod.title}</p>
                      <p className="text-xs text-muted-foreground">{new Date(mod.created_at).toLocaleDateString()}</p>
                    </div>
                    {mod.status === "ready" && <ArrowRight className="h-4 w-4 text-muted-foreground" />}
                  </CardContent>
                </Card>
              ))}
            </div>
          </motion.section>
        )}

        {/* Coming Soon */}
        <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}>
          <h2 className="font-display text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
            <Lock className="h-4 w-4 text-muted-foreground" /> Coming Soon
          </h2>
          <div className="space-y-3">
            {comingSoonModules.map((mod, i) => (
              <motion.div key={mod.name} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 + i * 0.06 }}>
                <Card className="border-0 shadow-sm bg-card opacity-75">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ background: mod.color }} />
                      <div>
                        <p className="text-sm font-medium text-foreground">{mod.name}</p>
                        <p className="text-xs text-muted-foreground">In development</p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs gap-1"
                      onClick={() => handleNotifyMe(mod.name)}
                    >
                      <Bell className="h-3 w-3" /> Notify Me
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.section>
      </div>

      <AppFooter />
    </div>
  );
};

export default StudyModulesPage;
