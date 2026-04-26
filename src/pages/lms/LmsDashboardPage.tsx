import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import LmsLayout, { LmsChip, LmsProgressBar } from "@/lms/LmsLayout";
import { useLearner } from "@/lms/useLearner";
import { Button } from "@/components/ui/button";
import { ArrowRight, BookOpen, CheckCircle2, GaugeCircle, Layers } from "lucide-react";

interface EnrollmentRow {
  id: string;
  course_id: string;
  progress_pct: number;
  status: string;
  lms_courses: { id: string; title: string; subtitle: string; category: string; level: string; lesson_count: number } | null;
}

interface ActivityRow {
  id: string;
  message: string;
  activity_type: string;
  created_at: string;
}

export default function LmsDashboardPage() {
  const { learner, loading } = useLearner();
  const [enrollments, setEnrollments] = useState<EnrollmentRow[]>([]);
  const [allCourses, setAllCourses] = useState<any[]>([]);
  const [activities, setActivities] = useState<ActivityRow[]>([]);
  const [completedCount, setCompletedCount] = useState(0);
  const [quizAvg, setQuizAvg] = useState<number | null>(null);
  const [continueLessonId, setContinueLessonId] = useState<string | null>(null);
  const [continueCourseTitle, setContinueCourseTitle] = useState<string>("");

  useEffect(() => {
    if (!learner) return;
    (async () => {
      const [
        { data: enr },
        { data: courses },
        { data: acts },
        { data: progress },
        { data: quizzes },
      ] = await Promise.all([
        supabase
          .from("lms_enrollments")
          .select("id, course_id, progress_pct, status, lms_courses(id, title, subtitle, category, level, lesson_count)")
          .eq("learner_id", learner.id)
          .order("updated_at", { ascending: false }),
        supabase.from("lms_courses").select("*").order("sort_order"),
        supabase
          .from("lms_activities")
          .select("*")
          .eq("learner_id", learner.id)
          .order("created_at", { ascending: false })
          .limit(8),
        supabase
          .from("lms_lesson_progress")
          .select("id, completed, lesson_id")
          .eq("learner_id", learner.id),
        supabase
          .from("lms_quiz_attempts")
          .select("score, total")
          .eq("learner_id", learner.id),
      ]);

      setEnrollments((enr as EnrollmentRow[]) || []);
      setAllCourses(courses || []);
      setActivities((acts as ActivityRow[]) || []);
      setCompletedCount((progress || []).filter((p: any) => p.completed).length);

      if (quizzes && quizzes.length) {
        const totals = quizzes.reduce(
          (acc: { s: number; t: number }, q: any) => ({ s: acc.s + (q.score || 0), t: acc.t + (q.total || 0) }),
          { s: 0, t: 0 }
        );
        setQuizAvg(totals.t > 0 ? Math.round((totals.s / totals.t) * 100) : null);
      }

      // Find next incomplete lesson in active enrollment
      const active = (enr as EnrollmentRow[] | null)?.find((e) => e.progress_pct < 100) || (enr as EnrollmentRow[] | null)?.[0];
      if (active?.lms_courses) {
        const { data: mods } = await supabase
          .from("lms_modules")
          .select("id, lms_lessons(id, sort_order)")
          .eq("course_id", active.course_id)
          .order("sort_order");
        const lessonIds: string[] = [];
        (mods || []).forEach((m: any) =>
          (m.lms_lessons || [])
            .sort((a: any, b: any) => a.sort_order - b.sort_order)
            .forEach((l: any) => lessonIds.push(l.id))
        );
        const completedSet = new Set((progress || []).filter((p: any) => p.completed).map((p: any) => p.lesson_id));
        const next = lessonIds.find((id) => !completedSet.has(id));
        setContinueLessonId(next || lessonIds[0] || null);
        setContinueCourseTitle(active.lms_courses.title);
      }
    })();
  }, [learner]);

  const avgProgress = useMemo(() => {
    if (!enrollments.length) return 0;
    return Math.round(enrollments.reduce((s, e) => s + (e.progress_pct || 0), 0) / enrollments.length);
  }, [enrollments]);

  const recommendedCourses = useMemo(() => {
    const enrolledIds = new Set(enrollments.map((e) => e.course_id));
    return allCourses.filter((c) => !enrolledIds.has(c.id)).slice(0, 3);
  }, [enrollments, allCourses]);

  if (loading || !learner) {
    return (
      <LmsLayout>
        <div className="text-[hsl(var(--lms-muted))]">Loading your Learning Center…</div>
      </LmsLayout>
    );
  }

  return (
    <LmsLayout>
      {/* Hero */}
      <section className="lms-card p-6 sm:p-8 mb-6 bg-gradient-to-br from-[hsl(var(--lms-card))] to-[hsl(var(--lms-cream-soft))]">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div>
            <div className="text-xs uppercase tracking-widest text-[hsl(var(--lms-muted))] mb-1">{learner.cohort}</div>
            <h1 className="lms-display text-3xl sm:text-4xl font-semibold mb-2">
              Welcome back, {learner.display_name.split(" ")[0]}
            </h1>
            <p className="text-[hsl(var(--lms-ink-soft))] max-w-2xl">{learner.learning_goal}</p>
          </div>
          {continueLessonId && (
            <Link to={`/lms/lesson/${continueLessonId}`}>
              <Button className="lms-btn-primary h-11 px-5">
                Continue Learning <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          )}
        </div>
        {continueCourseTitle && (
          <div className="mt-5 pt-5 border-t border-[hsl(var(--lms-border))] flex items-center gap-3 text-sm text-[hsl(var(--lms-ink-soft))]">
            <BookOpen className="w-4 h-4 text-[hsl(var(--lms-teal))]" />
            <span>Currently in:</span>
            <span className="font-semibold text-[hsl(var(--lms-ink))]">{continueCourseTitle}</span>
          </div>
        )}
      </section>

      {/* KPIs */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-8">
        <KpiCard icon={<GaugeCircle className="w-5 h-5" />} label="Average Progress" value={`${avgProgress}%`} />
        <KpiCard icon={<CheckCircle2 className="w-5 h-5" />} label="Completed Lessons" value={String(completedCount)} />
        <KpiCard icon={<Layers className="w-5 h-5" />} label="Quiz Readiness" value={quizAvg === null ? "—" : `${quizAvg}%`} />
        <KpiCard icon={<BookOpen className="w-5 h-5" />} label="Active Courses" value={String(enrollments.length)} />
      </section>

      {/* Learning paths */}
      <section className="mb-8">
        <div className="flex items-baseline justify-between mb-4">
          <h2 className="lms-display text-2xl font-semibold">Your Learning Paths</h2>
          <Link to="/lms/courses" className="text-sm font-semibold text-[hsl(var(--lms-teal))] hover:underline">
            View all courses
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {enrollments.length === 0 && (
            <div className="lms-card p-6 text-[hsl(var(--lms-muted))] md:col-span-2">
              You haven't enrolled in a course yet. Visit the Course Library to get started.
            </div>
          )}
          {enrollments.map((e) => (
            <PathCard key={e.id} enrollment={e} />
          ))}
          {recommendedCourses.length > 0 && enrollments.length < 3 && (
            <div className="md:col-span-2 mt-2">
              <div className="text-xs uppercase tracking-widest text-[hsl(var(--lms-muted))] mb-3">Recommended next</div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {recommendedCourses.map((c) => (
                  <Link key={c.id} to={`/lms/courses/${c.id}`} className="lms-card p-5 hover:shadow-md transition group">
                    <div className="flex items-center gap-2 mb-2">
                      <LmsChip variant="teal">{c.category}</LmsChip>
                      <LmsChip variant="gold">{c.level}</LmsChip>
                    </div>
                    <div className="lms-display text-lg font-semibold mb-1 group-hover:text-[hsl(var(--lms-teal))]">{c.title}</div>
                    <div className="text-sm text-[hsl(var(--lms-ink-soft))]">{c.subtitle}</div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Activity feed */}
      <section>
        <h2 className="lms-display text-2xl font-semibold mb-4">Recent Activity</h2>
        <div className="lms-card divide-y divide-[hsl(var(--lms-border))]">
          {activities.length === 0 && (
            <div className="p-5 text-[hsl(var(--lms-muted))]">Your recent learning activity will show up here.</div>
          )}
          {activities.map((a) => (
            <div key={a.id} className="p-4 flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-[hsl(var(--lms-terracotta))]" />
              <div className="flex-1">
                <div className="text-sm text-[hsl(var(--lms-ink))]">{a.message}</div>
                <div className="text-xs text-[hsl(var(--lms-muted))]">{new Date(a.created_at).toLocaleString()}</div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </LmsLayout>
  );
}

function KpiCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
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

function PathCard({ enrollment }: { enrollment: EnrollmentRow }) {
  const c = enrollment.lms_courses;
  if (!c) return null;
  return (
    <Link to={`/lms/courses/${c.id}`} className="lms-card p-5 hover:shadow-md transition group">
      <div className="flex items-center gap-2 mb-2">
        <LmsChip variant="teal">{c.category}</LmsChip>
        <LmsChip variant="gold">{c.level}</LmsChip>
        <span className="ml-auto text-xs text-[hsl(var(--lms-muted))]">{c.lesson_count} lessons</span>
      </div>
      <div className="lms-display text-xl font-semibold mb-1 group-hover:text-[hsl(var(--lms-teal))]">{c.title}</div>
      <div className="text-sm text-[hsl(var(--lms-ink-soft))] mb-4">{c.subtitle}</div>
      <div className="flex items-center gap-3">
        <div className="flex-1"><LmsProgressBar value={enrollment.progress_pct} /></div>
        <div className="text-sm font-semibold text-[hsl(var(--lms-teal))]">{enrollment.progress_pct}%</div>
      </div>
    </Link>
  );
}
