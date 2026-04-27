/* Admin-only DNA Debug View
 *
 * Inspects the Adaptive DNA Engine state for any learner:
 *   - Current DNA profile (brain_strengths)
 *   - Last 10 actions (dna_action_log)
 *   - Per-lesson accuracy
 *   - Reinforcement triggers
 *
 * Powered by the admin_dna_debug(_user_id) RPC. Admin role required.
 * Read-only — does not modify DNA or trigger any learner-facing flow.
 */

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import AppHeader from "@/components/AppHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Lock, RefreshCw, Search } from "lucide-react";

type Learner = { user_id: string; display_name: string };

type ActionRow = {
  id: string;
  term_id: string | null;
  lesson_label: string;
  layer: string;
  action: string;
  correct: boolean | null;
  reattempt: boolean;
  reinforcement_triggered: boolean;
  accuracy_score: number;
  dna_before: Record<string, number>;
  dna_after: Record<string, number>;
  delta: Record<string, number>;
  reasons: string[];
  created_at: string;
};

type LessonAccuracy = {
  lesson_label: string;
  attempts: number;
  correct_count: number;
  accuracy_pct: number | null;
};

type ReinforcementTrigger = {
  lesson_label: string;
  layer: string;
  created_at: string;
  accuracy_score: number;
};

type DebugPayload = {
  user_id: string;
  current_dna: Record<string, number>;
  recent_actions: ActionRow[];
  lesson_accuracy: LessonAccuracy[];
  reinforcement_triggers: ReinforcementTrigger[];
  generated_at: string;
};

const SIGNAL_KEYS = ["engagement", "retention", "confidence", "accuracy"] as const;

function formatTime(iso: string): string {
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

function actionBadgeVariant(action: string): "default" | "secondary" | "destructive" | "outline" {
  if (action === "correct" || action === "retry") return "default";
  if (action === "incorrect") return "destructive";
  if (action === "skip") return "outline";
  return "secondary";
}

function deltaSummary(delta: Record<string, number>): string {
  const entries = Object.entries(delta).filter(([, v]) => typeof v === "number" && v !== 0);
  if (!entries.length) return "—";
  return entries.map(([k, v]) => `${k} ${v > 0 ? "+" : ""}${v}`).join(", ");
}

export default function AdminDnaDebugPage() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [learners, setLearners] = useState<Learner[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [debug, setDebug] = useState<DebugPayload | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  // Admin role check.
  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      navigate("/login");
      return;
    }
    (async () => {
      const { data, error } = await supabase.rpc("has_role", {
        _user_id: user.id,
        _role: "admin" as any,
      });
      if (error) {
        setIsAdmin(false);
      } else {
        setIsAdmin(!!data);
      }
    })();
  }, [authLoading, user, navigate]);

  // Load learners.
  useEffect(() => {
    if (!isAdmin) return;
    (async () => {
      const { data, error } = await supabase
        .from("learners")
        .select("user_id, display_name")
        .order("display_name", { ascending: true })
        .limit(500);
      if (error) {
        setError(error.message);
        return;
      }
      const rows = (data ?? []) as Learner[];
      setLearners(rows);
      if (rows.length > 0 && !selectedUserId) {
        setSelectedUserId(rows[0].user_id);
      }
    })();
  }, [isAdmin]);

  const loadDebug = async (uid: string) => {
    if (!uid) return;
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase.rpc("admin_dna_debug", { _user_id: uid });
      if (error) throw error;
      setDebug(data as unknown as DebugPayload);
    } catch (e: any) {
      setError(e.message ?? "Failed to load DNA debug");
      setDebug(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedUserId) loadDebug(selectedUserId);
  }, [selectedUserId]);

  const filteredLearners = learners.filter((l) =>
    !search ? true : l.display_name.toLowerCase().includes(search.toLowerCase()),
  );

  if (authLoading || isAdmin === null) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader />
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader />
        <div className="max-w-md mx-auto mt-24 p-8 text-center">
          <Lock className="h-10 w-10 mx-auto mb-4 text-muted-foreground" />
          <h1 className="text-2xl font-semibold mb-2">Admin only</h1>
          <p className="text-muted-foreground">You need an admin role to view DNA debug.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold">DNA Engine — Debug</h1>
            <p className="text-muted-foreground mt-1">
              Inspect adaptive DNA state, recent actions, accuracy, and reinforcement triggers per learner.
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => loadDebug(selectedUserId)}
            disabled={!selectedUserId || loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>

        {/* Learner picker */}
        <Card>
          <CardContent className="pt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative">
              <Search className="h-4 w-4 absolute left-3 top-3 text-muted-foreground" />
              <Input
                placeholder="Search learners by name…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={selectedUserId} onValueChange={setSelectedUserId}>
              <SelectTrigger>
                <SelectValue placeholder="Select a learner" />
              </SelectTrigger>
              <SelectContent className="max-h-72">
                {filteredLearners.map((l) => (
                  <SelectItem key={l.user_id} value={l.user_id}>
                    {l.display_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {error && (
          <div className="rounded-md border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm text-destructive">
            {error}
          </div>
        )}

        {loading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        )}

        {debug && !loading && (
          <>
            {/* Current DNA */}
            <Card>
              <CardHeader>
                <CardTitle>Current DNA Profile</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {SIGNAL_KEYS.map((k) => {
                    const v = Number(debug.current_dna?.[k] ?? 0);
                    return (
                      <div key={k} className="rounded-lg border p-4">
                        <div className="text-xs uppercase text-muted-foreground tracking-wide">
                          {k}
                        </div>
                        <div className="text-2xl font-semibold mt-1">{v}</div>
                        <div className="mt-2 h-2 bg-muted rounded">
                          <div
                            className="h-2 bg-primary rounded"
                            style={{ width: `${Math.max(0, Math.min(100, v))}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="text-xs text-muted-foreground mt-4">
                  Snapshot at {formatTime(debug.generated_at)}
                </div>
              </CardContent>
            </Card>

            {/* Lesson accuracy */}
            <Card>
              <CardHeader>
                <CardTitle>Accuracy per Lesson</CardTitle>
              </CardHeader>
              <CardContent>
                {debug.lesson_accuracy.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No graded attempts yet.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="text-left text-muted-foreground border-b">
                        <tr>
                          <th className="py-2 pr-4">Lesson</th>
                          <th className="py-2 pr-4">Attempts</th>
                          <th className="py-2 pr-4">Correct</th>
                          <th className="py-2 pr-4">Accuracy</th>
                          <th className="py-2 pr-4">Gate (≥70%)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {debug.lesson_accuracy.map((row) => {
                          const acc = row.accuracy_pct ?? 0;
                          const passes = acc >= 70;
                          return (
                            <tr key={row.lesson_label} className="border-b last:border-0">
                              <td className="py-2 pr-4 font-medium">{row.lesson_label}</td>
                              <td className="py-2 pr-4">{row.attempts}</td>
                              <td className="py-2 pr-4">{row.correct_count}</td>
                              <td className="py-2 pr-4">
                                {row.accuracy_pct === null ? "—" : `${row.accuracy_pct}%`}
                              </td>
                              <td className="py-2 pr-4">
                                <Badge variant={passes ? "default" : "outline"}>
                                  {passes ? "pass" : "below"}
                                </Badge>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Reinforcement triggers */}
            <Card>
              <CardHeader>
                <CardTitle>Reinforcement Triggers</CardTitle>
              </CardHeader>
              <CardContent>
                {debug.reinforcement_triggers.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No reinforcement triggers fired yet.</p>
                ) : (
                  <div className="space-y-2">
                    {debug.reinforcement_triggers.map((t, i) => (
                      <div
                        key={i}
                        className="flex flex-wrap items-center gap-3 rounded-md border px-3 py-2 text-sm"
                      >
                        <Badge variant="destructive">reinforcement</Badge>
                        <span className="font-medium">{t.lesson_label || "—"}</span>
                        <span className="text-muted-foreground">layer: {t.layer}</span>
                        <span className="text-muted-foreground">acc: {t.accuracy_score}</span>
                        <span className="ml-auto text-xs text-muted-foreground">
                          {formatTime(t.created_at)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Last 10 actions */}
            <Card>
              <CardHeader>
                <CardTitle>Last 10 Actions</CardTitle>
              </CardHeader>
              <CardContent>
                {debug.recent_actions.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No DNA actions logged yet.</p>
                ) : (
                  <div className="space-y-3">
                    {debug.recent_actions.map((a) => (
                      <div key={a.id} className="rounded-lg border p-3">
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          <Badge variant={actionBadgeVariant(a.action)}>{a.action}</Badge>
                          <span className="text-sm font-medium">{a.lesson_label || "—"}</span>
                          <span className="text-xs text-muted-foreground">layer: {a.layer}</span>
                          {a.reattempt && <Badge variant="secondary">reattempt</Badge>}
                          {a.reinforcement_triggered && (
                            <Badge variant="destructive">reinforcement</Badge>
                          )}
                          <span className="ml-auto text-xs text-muted-foreground">
                            {formatTime(a.created_at)}
                          </span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                          <div>
                            <div className="text-muted-foreground mb-1">Before</div>
                            <div className="font-mono">
                              {SIGNAL_KEYS.map((k) => (
                                <div key={k}>
                                  {k}: {Number(a.dna_before?.[k] ?? 0)}
                                </div>
                              ))}
                            </div>
                          </div>
                          <div>
                            <div className="text-muted-foreground mb-1">After</div>
                            <div className="font-mono">
                              {SIGNAL_KEYS.map((k) => (
                                <div key={k}>
                                  {k}: {Number(a.dna_after?.[k] ?? 0)}
                                </div>
                              ))}
                            </div>
                          </div>
                          <div>
                            <div className="text-muted-foreground mb-1">Delta / Reasons</div>
                            <div className="font-mono">{deltaSummary(a.delta || {})}</div>
                            {a.reasons?.length > 0 && (
                              <div className="mt-1 text-muted-foreground">
                                {a.reasons.join(", ")}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}
