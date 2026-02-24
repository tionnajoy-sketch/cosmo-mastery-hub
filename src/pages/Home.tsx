import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";
import { BookOpen, LogOut, ArrowRight } from "lucide-react";

interface Section {
  id: string;
  name: string;
  description: string;
  order: number;
  color_theme: string;
}

const Home = () => {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();
  const [sections, setSections] = useState<Section[]>([]);

  useEffect(() => {
    const fetchSections = async () => {
      const { data } = await supabase
        .from("sections")
        .select("*")
        .order("order");
      if (data) setSections(data);
    };
    fetchSections();
  }, []);

  const firstName = profile?.name?.split(" ")[0] || "Beautiful";

  return (
    <div className="min-h-screen" style={{ background: "linear-gradient(180deg, hsl(30 70% 92%), hsl(35 50% 96%))" }}>
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-4 max-w-2xl mx-auto">
        <div className="flex items-center gap-2">
          <BookOpen className="h-5 w-5" style={{ color: "hsl(25 60% 50%)" }} />
          <span className="font-display text-lg font-bold" style={{ color: "hsl(25 40% 25%)" }}>CosmoPrep</span>
        </div>
        <Button variant="ghost" size="sm" onClick={signOut} className="gap-1 text-muted-foreground">
          <LogOut className="h-4 w-4" /> Sign out
        </Button>
      </header>

      {/* Welcome */}
      <div className="px-4 pt-8 pb-6 max-w-2xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <h1 className="font-display text-3xl font-bold mb-2" style={{ color: "hsl(25 40% 20%)" }}>
            Welcome, {firstName} ✨
          </h1>
          <p className="text-base leading-relaxed" style={{ color: "hsl(25 20% 40%)" }}>
            Let's get you ready to pass your boards. Pick a section to start studying.
          </p>
        </motion.div>
      </div>

      {/* Sections */}
      <div className="px-4 pb-20 max-w-2xl mx-auto space-y-4">
        {sections.map((section, i) => (
          <motion.div
            key={section.id}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 + i * 0.1 }}
          >
            <Card
              className="border-0 shadow-lg cursor-pointer hover:shadow-xl transition-shadow"
              style={{ background: "white" }}
              onClick={() => navigate(`/section/${section.id}`)}
            >
              <CardContent className="p-6 flex items-center justify-between">
                <div className="flex-1">
                  <h3 className="font-display text-xl font-semibold mb-1" style={{ color: "hsl(25 40% 22%)" }}>
                    {section.name}
                  </h3>
                  <p className="text-sm leading-relaxed" style={{ color: "hsl(25 15% 45%)" }}>
                    {section.description}
                  </p>
                </div>
                <ArrowRight className="h-5 w-5 ml-4 flex-shrink-0" style={{ color: "hsl(25 60% 55%)" }} />
              </CardContent>
            </Card>
          </motion.div>
        ))}

        {sections.length === 0 && (
          <p className="text-center text-muted-foreground py-12">Loading sections...</p>
        )}
      </div>
    </div>
  );
};

export default Home;
