import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import LmsLayout, { LmsChip, LmsProgressBar } from "@/lms/LmsLayout";
import { useLearner } from "@/lms/useLearner";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Circle, Clock, PlayCircle, BookOpen, ClipboardCheck, Wand2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface Course {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  category: string;
  level: string;
  lesson_count: number;
}

interface Lesson {
  id: string;
  title: string;
  lesson_type: string;
  duration_minutes: number;
  objective: string;
  sort_order: number;
}
interface Module {
  id: string;
  title: string;
  description: string;
  sort_order: number;
  lms_lessons: Lesson[];
}

const lessonIcon = (t: string) => {
  if (t === "quiz") return <ClipboardCheck className="w-4 h-4" />;
  if (t === "video") return <PlayCircle className="w-4 h-4" />;
  if (t === "practice") return <Wand2 className="w-4 h-4" />;
  return <BookOpen className="w-4 h-4" />;
};

export default function LmsCourseDetailPage() {
  const { id } = useParams();
  const { learner } = useLearner();
  const [course, setCourse] = useState<Course | null>(null);
  const [modules, setModules] = useState<Module[]>([]);
  const [completedIds, setCompletedIds] = useState<Set<string>>(new Set());
  const [enrollment, setEnrollment] = useState<{ id: string; progress_pct: number } | null>(null);

  useEffect(() => {
    if (!id) return;
    (async () => {
      const [{ data: c }, { data: mods }] = await Promise.all([
        supabase.from("lms_courses").select("*").eq("id", id).single(),
        supabase
          .from("lms_modules")
          .select("id, title, description, sort_order, lms_lessons(id, title, lesson_type, duration_minutes, objective, sort_order)")
          .eq("course_id", id)
          .order("sort_order"),
      ]);
      setCourse(c as Course);
      const sorted = ((mods as Module[]) || []).map((m) => ({
        ...m,
        lms_lessons: [...(m.lms_lessons || [])].sort((a, b) => a.sort_order - b.sort_order),
      }));
      setModules(sorted);
    })();
  }, [id]);

  useEffect(() => {
    if (!learner || !id) return;
    (async () => {
      const { data: enr } = await supabase
        .from("lms_enrollments")
        .select("id, progress_pct")
        .eq("learner_id", learner.id)
        .eq("course_id", id)
        .maybeSingle();
      setEnrollment(enr as any);
      if (enr) {
        const { data: prog } = await supabase
          .from("lms_lesson_progress")
          .select("lesson_id, completed")
          .eq("learner_id", learner.id);
        setCompletedIds(new Set((prog || []).filter((p: any) => p.completed).map((p: any) => p.lesson_id)));
      }
    })();
  }, [learner, id]);

  async function enroll() {
    if (!learner || !id) return;
    const { data, error } = await supabase
      .from("lms_enrollments")
      .insert({ learner_id: learner.id, course_id: id })
      .select("id, progress_pct")
      .single();
    if (error) {
      toast({ title: "Could not enroll", description: error.message, variant: "destructive" });
      return;
    }
    setEnrollment(data as any);
    await supabase.from("lms_activities").insert({
      learner_id: learner.id,
      activity_type: "enroll",
      message: `Enrolled in ${course?.title}`,
      related_course_id: id,
    });
    toast({ title: "You're enrolled", description: "This course now appears on your dashboard." });
  }

  if (!course) {
    return (
      <LmsLayout>
        <div className="text-[hsl(var(--lms-muted))]">Loading course…</div>
      </LmsLayout>
    );
  }

  const allLessons = modules.flatMap((m) => m.lms_lessons);
  const firstUncompleted = allLessons.find((l) => !completedIds.has(l.id)) || allLessons[0];

  return (
    <LmsLayout>
      <div className="mb-2 text-sm">
        <Link to="/lms/courses" className="text-[hsl(var(--lms-teal))] font-semibold hover:underline">
          ← Course Library
        </Link>
      </div>

      <header className="lms-card p-6 sm:p-8 mb-6 bg-gradient-to-br from-[hsl(var(--lms-card))] to-[hsl(var(--lms-cream-soft))]">
        <div className="flex items-center gap-2 mb-3 flex-wrap">
          <LmsChip variant="teal">{course.category}</LmsChip>
          <LmsChip variant="gold">{course.level}</LmsChip>
        </div>
        <h1 className="lms-display text-3xl sm:text-4xl font-semibold mb-2">{course.title}</h1>
        <div className="text-[hsl(var(--lms-teal))] font-semibold mb-3">{course.subtitle}</div>
        <p className="text-[hsl(var(--lms-ink-soft))] max-w-3xl mb-5">{course.description}</p>

        {enrollment ? (
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex-1 min-w-[200px]"><LmsProgressBar value={enrollment.progress_pct} /></div>
            <div className="text-sm font-semibold text-[hsl(var(--lms-teal))]">{enrollment.progress_pct}% complete</div>
            {firstUncompleted && (
              <Link to={`/lms/lesson/${firstUncompleted.id}`}>
                <Button className="lms-btn-primary h-10">Resume</Button>
              </Link>
            )}
          </div>
        ) : (
          <Button onClick={enroll} className="lms-btn-primary h-11 px-5">
            Enroll in this course
          </Button>
        )}
      </header>

      <section className="space-y-5">
        {modules.map((m, i) => (
          <div key={m.id} className="lms-card overflow-hidden">
            <div className="px-5 sm:px-6 py-4 bg-[hsl(var(--lms-cream-soft))] border-b border-[hsl(var(--lms-border))]">
              <div className="text-xs uppercase tracking-widest text-[hsl(var(--lms-muted))]">Module {i + 1}</div>
              <div className="lms-display text-lg font-semibold">{m.title}</div>
              {m.description && <div className="text-sm text-[hsl(var(--lms-ink-soft))] mt-1">{m.description}</div>}
            </div>
            <ul className="divide-y divide-[hsl(var(--lms-border))]">
              {m.lms_lessons.map((l) => {
                const done = completedIds.has(l.id);
                return (
                  <li key={l.id}>
                    <Link
                      to={`/lms/lesson/${l.id}`}
                      className="flex items-center gap-3 sm:gap-4 px-5 sm:px-6 py-3 hover:bg-[hsl(var(--lms-cream-soft))]/50 transition"
                    >
                      {done ? (
                        <CheckCircle2 className="w-5 h-5 text-[hsl(var(--lms-teal))]" />
                      ) : (
                        <Circle className="w-5 h-5 text-[hsl(var(--lms-muted))]" />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-[hsl(var(--lms-ink))] truncate">{l.title}</div>
                        <div className="text-xs text-[hsl(var(--lms-muted))] flex items-center gap-3">
                          <span className="flex items-center gap-1">{lessonIcon(l.lesson_type)} {l.lesson_type}</span>
                          <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {l.duration_minutes} min</span>
                        </div>
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </section>
    </LmsLayout>
  );
}
