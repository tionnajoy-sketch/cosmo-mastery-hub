import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ArrowLeft, Brain, TrendingUp, Sparkles, BookOpen, AlertTriangle } from "lucide-react";
import { motion } from "framer-motion";

interface StruggleRow {
  id: string;
  term_id: string;
  incorrect_attempts: number;
  correct_attempts: number;
  reinforcement_cycles: number;
  mastery_status: "weak" | "improving" | "mastered";
  last_attempted: string;
}

interface JournalRow {
  id: string;
  term_id: string | null;
  prompt_question: string;
  user_response: string;
  correctness: boolean | null;
  reflection_type: string;
  topic: string;
  created_at: string;
}

interface TermInfo {
  id: string;
  term: string;
  definition: string;
}

const StruggleTermsPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [struggles, setStruggles] = useState<StruggleRow[]>([]);
  const [journal, setJournal] = useState<JournalRow[]>([]);
  const [terms, setTerms] = useState<Record<string, TermInfo>>({});

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const [{ data: s }, { data: j }] = await Promise.all([
        (supabase as any)
          .from("term_struggle")
          .select("*")
          .eq("user_id", user.id)
          .order("last_attempted", { ascending: false }),
        (supabase as any)
          .from("journal_entries")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(100),
      ]);
      setStruggles((s as StruggleRow[]) || []);
      setJournal((j as JournalRow[]) || []);

      // Fetch term details
      const ids = new Set<string>();
      (s as StruggleRow[] | null)?.forEach((r) => r.term_id && ids.add(r.term_id));
      (j as JournalRow[] | null)?.forEach((r) => r.term_id && ids.add(r.term_id));
      if (ids.size) {
        const { data: t } = await supabase.from("terms").select("id, term, definition").in("id", [...ids]);
        const map: Record<string, TermInfo> = {};
        (t || []).forEach((row) => { map[row.id] = row as TermInfo; });
        setTerms(map);
      }
    };
    load();

    // Realtime updates
    const channel = supabase
      .channel(`struggle-${user.id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "term_struggle", filter: `user_id=eq.${user.id}` }, load)
      .on("postgres_changes", { event: "*", schema: "public", table: "journal_entries", filter: `user_id=eq.${user.id}` }, load)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user]);

  const weak = struggles.filter((s) => s.mastery_status === "weak");
  const improving = struggles.filter((s) => s.mastery_status === "improving");
  const mastered = struggles.filter((s) => s.mastery_status === "mastered");

  const renderStruggleList = (rows: StruggleRow[], emptyMsg: string) => {
    if (rows.length === 0) {
      return (
        <Card className="border-dashed border-2 border-border bg-muted/30">
          <CardContent className="p-8 text-center text-sm text-muted-foreground">
            {emptyMsg}
          </CardContent>
        </Card>
      );
    }
    return (
      <div className="space-y-3">
        {rows.map((r) => {
          const t = terms[r.term_id];
          return (
            <motion.div key={r.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}>
              <Card className="border border-border">
                <CardContent className="p-4">
                  <div className="mb-2 flex items-start justify-between gap-2">
                    <div>
                      <p className="font-display font-semibold text-foreground">
                        {t?.term ?? "Unknown term"}
                      </p>
                      {t?.definition && (
                        <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                          {t.definition}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <span className="font-semibold text-rose-600">✗ {r.incorrect_attempts}</span> missed
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="font-semibold text-green-600">✓ {r.correct_attempts}</span> correct
                    </span>
                    {r.reinforcement_cycles > 0 && (
                      <span>{r.reinforcement_cycles} reinforcement cycle{r.reinforcement_cycles > 1 ? "s" : ""}</span>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background px-4 py-6">
      <div className="max-w-3xl mx-auto">
        <Button variant="ghost" onClick={() => navigate("/learn")} className="mb-4 gap-2">
          <ArrowLeft className="h-4 w-4" /> Back to Learn
        </Button>

        <div className="mb-6">
          <h1 className="font-display text-3xl font-bold flex items-center gap-2">
            <BookOpen className="h-7 w-7 text-primary" />
            My Notes
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Track your weak, improving, and mastered concepts — with every reflection you've recorded.
          </p>
        </div>

        {/* Smart review prompt */}
        {weak.length >= 3 && (
          <Card className="mb-6 border-amber-300 bg-amber-50 dark:bg-amber-950/20">
            <CardContent className="p-4 flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-amber-900 dark:text-amber-200">TJ Recommends</p>
                <p className="text-sm text-amber-800 dark:text-amber-300">
                  Review your {weak.length} weak terms before moving to new content. Strong roots, strong growth. 🌱
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        <Tabs defaultValue="weak" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="weak" className="gap-1">
              <AlertTriangle className="h-3.5 w-3.5" />
              Struggle ({weak.length})
            </TabsTrigger>
            <TabsTrigger value="improving" className="gap-1">
              <TrendingUp className="h-3.5 w-3.5" />
              Improving ({improving.length})
            </TabsTrigger>
            <TabsTrigger value="mastered" className="gap-1">
              <Sparkles className="h-3.5 w-3.5" />
              Mastered ({mastered.length})
            </TabsTrigger>
            <TabsTrigger value="journal" className="gap-1">
              <Brain className="h-3.5 w-3.5" />
              Journal
            </TabsTrigger>
          </TabsList>

          <TabsContent value="weak" className="mt-4">
            {renderStruggleList(weak, "No struggle terms yet — keep up the great work!")}
          </TabsContent>
          <TabsContent value="improving" className="mt-4">
            {renderStruggleList(improving, "Once you re-master a missed term, it'll appear here.")}
          </TabsContent>
          <TabsContent value="mastered" className="mt-4">
            {renderStruggleList(mastered, "Mastered concepts will collect here as you grow.")}
          </TabsContent>
          <TabsContent value="journal" className="mt-4 space-y-3">
            {journal.length === 0 ? (
              <Card className="border-dashed border-2 border-border bg-muted/30">
                <CardContent className="p-8 text-center text-sm text-muted-foreground">
                  Your reflections, quiz responses, and notes will appear here.
                </CardContent>
              </Card>
            ) : (
              journal.map((j) => {
                const t = j.term_id ? terms[j.term_id] : null;
                return (
                  <Card key={j.id} className="border border-border">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs uppercase tracking-wider text-muted-foreground">
                          {j.reflection_type}
                          {t?.term && ` · ${t.term}`}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {new Date(j.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      {j.prompt_question && (
                        <p className="text-xs italic text-muted-foreground mb-1">{j.prompt_question}</p>
                      )}
                      <p className="text-sm text-foreground">{j.user_response}</p>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default StruggleTermsPage;
