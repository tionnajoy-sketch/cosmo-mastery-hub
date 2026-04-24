import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import AppHeader from "@/components/AppHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { Loader2, Save, Search, Lock } from "lucide-react";

interface SectionRow { id: string; name: string }
interface TermRow {
  id: string;
  term: string;
  section_id: string;
  block_number: number;
  definition: string;
  metaphor: string;
  affirmation: string;
  visualize_content: string;
  define_content: string;
  break_it_down_content: string;
  recognize_content: string;
  metaphor_content: string;
  information_content: string;
  reflect_content: string;
  apply_content: string;
  assess_question: string;
  assess_answer: string;
  assess_explanation: string;
}

const STATIC_FIELDS: { key: keyof TermRow; label: string; placeholder: string; rows?: number }[] = [
  { key: "visualize_content", label: "Visualize", placeholder: "Pre-written visualization guidance for this term…", rows: 4 },
  { key: "define_content", label: "Define", placeholder: "Clear, plain-language definition shown on the Define step…", rows: 4 },
  { key: "break_it_down_content", label: "Break It Down", placeholder: "Etymology / parts of the word / how it's built…", rows: 4 },
  { key: "recognize_content", label: "Recognize", placeholder: "Coaching shown above the recognition exercise…", rows: 3 },
  { key: "metaphor_content", label: "Metaphor", placeholder: "Real-life metaphor that anchors the concept…", rows: 4 },
  { key: "information_content", label: "Information", placeholder: "Deeper teaching content for the Information step…", rows: 6 },
  { key: "reflect_content", label: "Reflect", placeholder: "Reflection prompt shown to the learner…", rows: 3 },
  { key: "apply_content", label: "Apply", placeholder: "Real-world practice scenario…", rows: 4 },
];

const AdminContentPage = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [sections, setSections] = useState<SectionRow[]>([]);
  const [terms, setTerms] = useState<TermRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sectionFilter, setSectionFilter] = useState<string>("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Partial<TermRow>>({});
  const [saving, setSaving] = useState(false);

  // Role check
  useEffect(() => {
    if (authLoading) return;
    if (!user) { navigate("/login"); return; }
    supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .maybeSingle()
      .then(({ data }) => setIsAdmin(!!data));
  }, [user, authLoading, navigate]);

  // Load data
  useEffect(() => {
    if (!isAdmin) return;
    (async () => {
      setLoading(true);
      const [sRes, tRes] = await Promise.all([
        supabase.from("sections").select("id, name").order("order"),
        supabase.from("terms").select("*").order("section_id").order("block_number").order("order"),
      ]);
      if (sRes.data) setSections(sRes.data as any);
      if (tRes.data) setTerms(tRes.data as any);
      setLoading(false);
    })();
  }, [isAdmin]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return terms.filter((t) => {
      if (sectionFilter !== "all" && t.section_id !== sectionFilter) return false;
      if (!q) return true;
      return t.term.toLowerCase().includes(q);
    });
  }, [terms, search, sectionFilter]);

  const selected = useMemo(() => terms.find((t) => t.id === selectedId) || null, [terms, selectedId]);

  useEffect(() => {
    if (selected) {
      const init: Partial<TermRow> = {};
      STATIC_FIELDS.forEach((f) => { (init as any)[f.key] = (selected as any)[f.key] || ""; });
      init.assess_question = selected.assess_question || "";
      init.assess_answer = selected.assess_answer || "";
      init.assess_explanation = selected.assess_explanation || "";
      setDraft(init);
    } else {
      setDraft({});
    }
  }, [selected?.id]);

  const sectionName = (id: string) => sections.find((s) => s.id === id)?.name || "—";

  const save = async () => {
    if (!selected) return;
    setSaving(true);
    const { error } = await supabase.from("terms").update(draft as any).eq("id", selected.id);
    setSaving(false);
    if (error) {
      toast({ title: "Save failed", description: error.message, variant: "destructive" });
      return;
    }
    setTerms((prev) => prev.map((t) => (t.id === selected.id ? { ...t, ...(draft as any) } : t)));
    toast({ title: "Saved", description: `Updated content for "${selected.term}".` });
  };

  if (authLoading || isAdmin === null) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen">
        <AppHeader />
        <div className="max-w-md mx-auto px-4 py-20 text-center">
          <Lock className="h-10 w-10 mx-auto mb-4 text-muted-foreground" />
          <h1 className="font-display text-2xl font-bold mb-2">Admin only</h1>
          <p className="text-sm text-muted-foreground">
            You need an admin role to edit term content. Ask the platform owner to grant access.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <AppHeader />
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="font-display text-3xl font-bold">Content Admin</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Edit pre-written content for each term. Saved content is shown to all learners on the matching TJ Layer Method step.
          </p>
        </div>

        <div className="grid lg:grid-cols-[320px,1fr] gap-6">
          {/* Term list */}
          <div className="space-y-3">
            <div className="relative">
              <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search terms…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <select
              value={sectionFilter}
              onChange={(e) => setSectionFilter(e.target.value)}
              className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="all">All sections</option>
              {sections.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>

            <Card>
              <CardContent className="p-0 max-h-[70vh] overflow-y-auto">
                {loading ? (
                  <div className="p-8 text-center text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin mx-auto" />
                  </div>
                ) : filtered.length === 0 ? (
                  <div className="p-8 text-center text-sm text-muted-foreground">No terms match.</div>
                ) : (
                  <ul className="divide-y">
                    {filtered.map((t) => {
                      const filledCount = STATIC_FIELDS.filter((f) => ((t as any)[f.key] || "").trim().length > 0).length
                        + (t.assess_question ? 1 : 0);
                      const total = STATIC_FIELDS.length + 1;
                      const isSel = selectedId === t.id;
                      return (
                        <li key={t.id}>
                          <button
                            onClick={() => setSelectedId(t.id)}
                            className={`w-full text-left px-3 py-2.5 text-sm hover:bg-muted transition-colors ${isSel ? "bg-muted" : ""}`}
                          >
                            <div className="font-medium truncate">{t.term}</div>
                            <div className="text-[11px] text-muted-foreground flex items-center justify-between">
                              <span className="truncate">{sectionName(t.section_id)} · Block {t.block_number}</span>
                              <span className={filledCount === total ? "text-emerald-600" : ""}>{filledCount}/{total}</span>
                            </div>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Editor */}
          <div>
            {!selected ? (
              <Card>
                <CardContent className="p-12 text-center text-sm text-muted-foreground">
                  Select a term on the left to edit its static content.
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="p-6 space-y-5">
                  <div>
                    <h2 className="font-display text-2xl font-bold">{selected.term}</h2>
                    <p className="text-xs text-muted-foreground">
                      {sectionName(selected.section_id)} · Block {selected.block_number}
                    </p>
                  </div>

                  {STATIC_FIELDS.map((f) => (
                    <div key={String(f.key)} className="space-y-1.5">
                      <Label htmlFor={String(f.key)}>{f.label}</Label>
                      <Textarea
                        id={String(f.key)}
                        placeholder={f.placeholder}
                        rows={f.rows || 3}
                        value={(draft as any)[f.key] || ""}
                        onChange={(e) => setDraft((d) => ({ ...d, [f.key]: e.target.value }))}
                      />
                    </div>
                  ))}

                  {/* Assess block */}
                  <div className="pt-2 border-t space-y-3">
                    <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Assess (Quiz)</p>
                    <div className="space-y-1.5">
                      <Label htmlFor="assess_question">Question</Label>
                      <Textarea
                        id="assess_question"
                        rows={3}
                        placeholder="What's the assessment question for this term?"
                        value={draft.assess_question || ""}
                        onChange={(e) => setDraft((d) => ({ ...d, assess_question: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="assess_answer">Answer (full text of correct answer)</Label>
                      <Input
                        id="assess_answer"
                        placeholder="The correct answer text"
                        value={draft.assess_answer || ""}
                        onChange={(e) => setDraft((d) => ({ ...d, assess_answer: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="assess_explanation">Explanation</Label>
                      <Textarea
                        id="assess_explanation"
                        rows={3}
                        placeholder="Why this is the correct answer (shown after they answer)"
                        value={draft.assess_explanation || ""}
                        onChange={(e) => setDraft((d) => ({ ...d, assess_explanation: e.target.value }))}
                      />
                    </div>
                  </div>

                  <div className="flex justify-end pt-2">
                    <Button onClick={save} disabled={saving} className="gap-2">
                      {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                      Save changes
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminContentPage;
