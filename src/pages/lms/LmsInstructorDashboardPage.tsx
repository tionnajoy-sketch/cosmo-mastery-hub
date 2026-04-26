import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import LmsLayout, { LmsChip, LmsProgressBar } from "@/lms/LmsLayout";
import { AlertTriangle, CheckCircle2, GaugeCircle, Users } from "lucide-react";

interface LearnerRow {
  id: string;
  display_name: string;
  cohort: string;
}
interface CourseRow { id: string; title: string; lesson_count: number }
interface EnrollmentRow { learner_id: string; course_id: string; progress_pct: number }
interface QuizRow { learner_id: string; lesson_id: string; score: number; total: number }
interface ProgressRow { learner_id: string; lesson_id: string; completed: boolean; completed_at: string | null }

export default function LmsInstructorDashboardPage() {
  const [learners, setLearners] = useState<LearnerRow[]>([]);
  const [courses, setCourses] = useState<CourseRow[]>([]);
  const [enrollments, setEnrollments] = useState<EnrollmentRow[]>([]);
  const [quizzes, setQuizzes] = useState<QuizRow[]>([]);
  const [progress, setProgress] = useState<ProgressRow[]>([]);
  const [lessonTitleById, setLessonTitleById] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const [
        { data: l, error: le },
        { data: c },
        { data: e },
        { data: q },
        { data: p },
        { data: lessons },
      ] = await Promise.all([
        supabase.from("learners").select("id, display_name, cohort"),
        supabase.from("lms_courses").select("id, title, lesson_count").order("sort_order"),
        supabase.from("lms_enrollments").select("learner_id, course_id, progress_pct"),
        supabase.from("lms_quiz_attempts").select("learner_id, lesson_id, score, total"),
        supabase.from("lms_lesson_progress").select("learner_id, lesson_id, completed, completed_at"),
        supabase.from("lms_lessons").select("id, title"),
      ]);
      if (le) setError("Instructor view requires admin access. Ask an admin to grant your account the admin role.");
      setLearners((l as LearnerRow[]) || []);
      setCourses((c as CourseRow[]) || []);
      setEnrollments((e as EnrollmentRow[]) || []);
      setQuizzes((q as QuizRow[]) || []);
      setProgress((p as ProgressRow[]) || []);
      const map: Record<string, string> = {};
      (lessons || []).forEach((x: any) => (map[x.id] = x.title));
      setLessonTitleById(map);
    })();
  }, []);

  const quizAvgByLearner: Record<string, number> = {};
  const quizCountsByLearner: Record<string, { s: number; t: number }> = {};
  quizzes.forEach((q) => {
    const cur = quizCountsByLearner[q.learner_id] || { s: 0, t: 0 };
    cur.s += q.score || 0;
    cur.t += q.total || 0;
    quizCountsByLearner[q.learner_id] = cur;
  });
  Object.entries(quizCountsByLearner).forEach(([k, v]) => {
    quizAvgByLearner[k] = v.t > 0 ? Math.round((v.s / v.t) * 100) : 0;
  });

  const interventions = learners
    .map((ln) => {
      const enrCount = enrollments.filter((e) => e.learner_id === ln.id).length;
      const avg =
        enrCount > 0
          ? Math.round(
              enrollments.filter((e) => e.learner_id === ln.id).reduce((s, e) => s + e.progress_pct, 0) / enrCount
            )
          : 0;
      const qa = quizAvgByLearner[ln.id] ?? null;
      let reason = "";
      if (enrCount === 0) reason = "Not enrolled in any course yet";
      else if (avg < 25) reason = `Stalled — only ${avg}% average progress`;
      else if (qa !== null && qa < 70) reason = `Quiz readiness low (${qa}%)`;
      return { learner: ln, reason };
    })
    .filter((x) => x.reason);

  const recentEvidence = [...progress]
    .filter((p) => p.completed)
    .sort((a, b) => (b.completed_at || "").localeCompare(a.completed_at || ""))
    .slice(0, 8);

  return (
    <LmsLayout>
      <div className="mb-8">
        <div className="text-xs uppercase tracking-widest text-[hsl(var(--lms-muted))] mb-1">Instructor view</div>
        <h1 className="lms-display text-3xl sm:text-4xl font-semibold mb-2">Cohort Overview</h1>
        <p className="text-[hsl(var(--lms-ink-soft))] max-w-2xl">
          Track learner progress, quiz readiness, and where to step in next.
        </p>
      </div>

      {error && (
        <div className="lms-card p-5 mb-6 border-l-4 border-[hsl(var(--lms-terracotta))]">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-[hsl(var(--lms-terracotta))] mt-0.5" />
            <div className="text-sm text-[hsl(var(--lms-ink-soft))]">{error}</div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-8">
        <Kpi icon={<Users className="w-5 h-5" />} label="Learners" value={String(learners.length)} />
        <Kpi icon={<GaugeCircle className="w-5 h-5" />} label="Active Enrollments" value={String(enrollments.length)} />
        <Kpi icon={<CheckCircle2 className="w-5 h-5" />} label="Quizzes Taken" value={String(quizzes.length)} />
        <Kpi icon={<AlertTriangle className="w-5 h-5" />} label="Suggested Interventions" value={String(interventions.length)} />
      </div>

      {/* Progress matrix */}
      <section className="mb-8">
        <h2 className="lms-display text-2xl font-semibold mb-4">Progress Matrix</h2>
        <div className="lms-card overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-[hsl(var(--lms-cream-soft))]">
              <tr>
                <th className="text-left px-4 py-3 font-semibold text-[hsl(var(--lms-ink))]">Learner</th>
                {courses.map((c) => (
                  <th key={c.id} className="text-left px-4 py-3 font-semibold text-[hsl(var(--lms-ink))] min-w-[180px]">
                    {c.title}
                  </th>
                ))}
                <th className="text-left px-4 py-3 font-semibold text-[hsl(var(--lms-ink))]">Quiz Readiness</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[hsl(var(--lms-border))]">
              {learners.map((ln) => (
                <tr key={ln.id}>
                  <td className="px-4 py-3">
                    <div className="font-medium">{ln.display_name}</div>
                    <div className="text-xs text-[hsl(var(--lms-muted))]">{ln.cohort}</div>
                  </td>
                  {courses.map((c) => {
                    const e = enrollments.find((x) => x.learner_id === ln.id && x.course_id === c.id);
                    return (
                      <td key={c.id} className="px-4 py-3 align-middle">
                        {e ? (
                          <div className="flex items-center gap-2">
                            <div className="w-24"><LmsProgressBar value={e.progress_pct} /></div>
                            <div className="text-xs font-semibold text-[hsl(var(--lms-teal))]">{e.progress_pct}%</div>
                          </div>
                        ) : (
                          <span className="text-xs text-[hsl(var(--lms-muted))]">Not enrolled</span>
                        )}
                      </td>
                    );
                  })}
                  <td className="px-4 py-3">
                    {quizAvgByLearner[ln.id] !== undefined ? (
                      <LmsChip variant={quizAvgByLearner[ln.id] >= 75 ? "teal" : "status"}>
                        {quizAvgByLearner[ln.id]}%
                      </LmsChip>
                    ) : (
                      <span className="text-xs text-[hsl(var(--lms-muted))]">No data</span>
                    )}
                  </td>
                </tr>
              ))}
              {learners.length === 0 && (
                <tr><td colSpan={courses.length + 2} className="px-4 py-6 text-center text-[hsl(var(--lms-muted))]">No learner data visible. Sign in as an admin to see all learners.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Evidence */}
        <section>
          <h2 className="lms-display text-2xl font-semibold mb-4">Completed Lesson Evidence</h2>
          <div className="lms-card divide-y divide-[hsl(var(--lms-border))]">
            {recentEvidence.length === 0 && (
              <div className="p-5 text-[hsl(var(--lms-muted))]">No completed lessons yet.</div>
            )}
            {recentEvidence.map((p, i) => {
              const ln = learners.find((l) => l.id === p.learner_id);
              return (
                <div key={i} className="p-4">
                  <div className="text-sm font-medium">{ln?.display_name || "Learner"}</div>
                  <div className="text-xs text-[hsl(var(--lms-ink-soft))]">{lessonTitleById[p.lesson_id] || "Lesson"}</div>
                  <div className="text-xs text-[hsl(var(--lms-muted))]">
                    {p.completed_at ? new Date(p.completed_at).toLocaleString() : ""}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Interventions */}
        <section>
          <h2 className="lms-display text-2xl font-semibold mb-4">Suggested Interventions</h2>
          <div className="lms-card divide-y divide-[hsl(var(--lms-border))]">
            {interventions.length === 0 && (
              <div className="p-5 text-[hsl(var(--lms-muted))]">No interventions suggested. Cohort is on pace.</div>
            )}
            {interventions.map((iv) => (
              <div key={iv.learner.id} className="p-4 flex items-start gap-3">
                <AlertTriangle className="w-4 h-4 mt-0.5 text-[hsl(var(--lms-terracotta))]" />
                <div>
                  <div className="text-sm font-medium">{iv.learner.display_name}</div>
                  <div className="text-xs text-[hsl(var(--lms-ink-soft))]">{iv.reason}</div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </LmsLayout>
  );
}

function Kpi({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="lms-card p-4 sm:p-5">
      <div className="flex items-center justify-between mb-2 text-[hsl(var(--lms-teal))]">
        {icon}
        <span className="text-[10px] font-semibold uppercase tracking-widest text-[hsl(var(--lms-muted))]">{label}</span>
      </div>
      <div className="lms-display text-2xl sm:text-3xl font-semibold">{value}</div>
    </div>
  );
}
