import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { motion } from "framer-motion";
import { Search, BookOpen, MessageSquare, PenLine, FileText } from "lucide-react";
import AppHeader from "@/components/AppHeader";
import AppFooter from "@/components/AppFooter";

interface InsightCard {
  id: string;
  type: "reflection" | "journal";
  text: string;
  termName: string;
  sectionName: string;
  sectionId: string;
  blockNumber: number;
  date: string;
}

type FilterType = "all" | "reflection" | "journal";

const InsightsPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [insights, setInsights] = useState<InsightCard[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterType>("all");

  useEffect(() => {
    if (!user) return;
    const fetchInsights = async () => {
      const [reflRes, journalRes] = await Promise.all([
        supabase
          .from("reflections")
          .select("id, response, updated_at, term_id, terms(term, block_number, section_id, sections(name))")
          .eq("user_id", user.id)
          .neq("response", "")
          .order("updated_at", { ascending: false }),
        supabase
          .from("journal_notes")
          .select("id, note, updated_at, term_id, terms(term, block_number, section_id, sections(name))")
          .eq("user_id", user.id)
          .neq("note", "")
          .order("updated_at", { ascending: false }),
      ]);

      const cards: InsightCard[] = [];

      if (reflRes.data) {
        reflRes.data.forEach((r: any) => {
          if (r.terms) {
            cards.push({
              id: r.id, type: "reflection", text: r.response, termName: r.terms.term,
              sectionName: r.terms.sections?.name || "General",
              sectionId: r.terms.section_id, blockNumber: r.terms.block_number, date: r.updated_at,
            });
          }
        });
      }

      if (journalRes.data) {
        journalRes.data.forEach((j: any) => {
          if (j.terms) {
            cards.push({
              id: j.id, type: "journal", text: j.note, termName: j.terms.term,
              sectionName: j.terms.sections?.name || "General",
              sectionId: j.terms.section_id, blockNumber: j.terms.block_number, date: j.updated_at,
            });
          }
        });
      }

      cards.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setInsights(cards);
      setLoading(false);
    };
    fetchInsights();
  }, [user]);

  const filtered = useMemo(() => {
    let result = insights;
    if (filter !== "all") result = result.filter((i) => i.type === filter);
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (i) => i.text.toLowerCase().includes(q) || i.termName.toLowerCase().includes(q) || i.sectionName.toLowerCase().includes(q)
      );
    }
    return result;
  }, [insights, filter, search]);

  const grouped = useMemo(() => {
    const map: Record<string, InsightCard[]> = {};
    filtered.forEach((i) => {
      const key = i.sectionName || "General";
      if (!map[key]) map[key] = [];
      map[key].push(i);
    });
    return Object.entries(map).sort(([a], [b]) => a.localeCompare(b));
  }, [filtered]);

  const filters: { label: string; value: FilterType; icon: any }[] = [
    { label: "All", value: "all", icon: BookOpen },
    { label: "Reflections", value: "reflection", icon: PenLine },
    { label: "Journal Notes", value: "journal", icon: FileText },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <AppHeader />
      <div className="flex-1 max-w-2xl mx-auto w-full px-4 py-6">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="font-display text-3xl font-bold text-foreground mb-1">My Journal</h1>
          <p className="text-sm text-muted-foreground mb-4">
            All of your reflections and journal entries organized by topic.
          </p>
        </motion.div>

        {/* Filter tabs */}
        <div className="flex gap-2 mb-4">
          {filters.map((f) => (
            <Button
              key={f.value}
              variant={filter === f.value ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter(f.value)}
              className="text-xs gap-1.5"
            >
              <f.icon className="h-3 w-3" /> {f.label}
            </Button>
          ))}
        </div>

        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search your notes..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
        </div>

        {loading ? (
          <p className="text-center text-muted-foreground py-12">Loading your journal...</p>
        ) : grouped.length === 0 ? (
          <div className="text-center py-16">
            <BookOpen className="h-10 w-10 mx-auto mb-3 text-muted-foreground/50" />
            <p className="text-muted-foreground text-sm">
              {search || filter !== "all" ? "No notes match your search." : "No reflections or journal entries yet. Start studying to build your journal!"}
            </p>
          </div>
        ) : (
          <Accordion type="multiple" defaultValue={grouped.map(([name]) => name)} className="space-y-2">
            {grouped.map(([sectionName, entries]) => (
              <AccordionItem key={sectionName} value={sectionName} className="border rounded-xl overflow-hidden">
                <AccordionTrigger className="px-4 py-3 hover:no-underline">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-foreground">{sectionName}</span>
                    <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">{entries.length}</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-2 pb-2">
                  <div className="space-y-2">
                    {entries.map((insight, i) => (
                      <InsightCardItem key={`${insight.type}-${insight.id}`} insight={insight} index={i} navigate={navigate} />
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        )}
      </div>
      <AppFooter />
    </div>
  );
};

const InsightCardItem = ({ insight, index, navigate }: { insight: InsightCard; index: number; navigate: any }) => (
  <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.02 }}>
    <Card
      className="border-0 shadow-sm cursor-pointer hover:shadow-md transition-shadow"
      onClick={() => navigate(`/learn?section=${insight.sectionId}`)}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div
            className="p-1.5 rounded-lg flex-shrink-0 mt-0.5"
            style={{
              background: insight.type === "reflection" ? "hsl(270 25% 94%)" : "hsl(195 30% 94%)",
            }}
          >
            <MessageSquare
              className="h-4 w-4"
              style={{
                color: insight.type === "reflection" ? "hsl(270 40% 52%)" : "hsl(195 45% 42%)",
              }}
            />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm font-semibold text-foreground">{insight.termName}</span>
              <span
                className="text-[10px] px-1.5 py-0.5 rounded-full font-medium"
                style={{
                  background: insight.type === "reflection" ? "hsl(270 20% 93%)" : "hsl(195 25% 93%)",
                  color: insight.type === "reflection" ? "hsl(270 30% 45%)" : "hsl(195 35% 38%)",
                }}
              >
                {insight.type === "reflection" ? "Reflection" : "Journal"}
              </span>
            </div>
            <p className="text-sm text-foreground/80 leading-relaxed line-clamp-3">{insight.text}</p>
            <p className="text-xs text-muted-foreground mt-2">{new Date(insight.date).toLocaleDateString()}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  </motion.div>
);

export default InsightsPage;
