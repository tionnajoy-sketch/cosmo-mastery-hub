import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import LmsLayout, { LmsChip, LmsProgressBar } from "@/lms/LmsLayout";
import { useLearner } from "@/lms/useLearner";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

interface Course {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  category: string;
  level: string;
  status: string;
  lesson_count: number;
}

export default function LmsCourseLibraryPage() {
  const { learner } = useLearner();
  const [courses, setCourses] = useState<Course[]>([]);
  const [progressByCourse, setProgressByCourse] = useState<Record<string, number>>({});

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("lms_courses").select("*").order("sort_order");
      setCourses((data as Course[]) || []);
    })();
  }, []);

  useEffect(() => {
    if (!learner) return;
    (async () => {
      const { data } = await supabase
        .from("lms_enrollments")
        .select("course_id, progress_pct")
        .eq("learner_id", learner.id);
      const map: Record<string, number> = {};
      (data || []).forEach((e: any) => (map[e.course_id] = e.progress_pct));
      setProgressByCourse(map);
    })();
  }, [learner]);

  return (
    <LmsLayout>
      <div className="mb-8">
        <h1 className="lms-display text-3xl sm:text-4xl font-semibold mb-2">Course Library</h1>
        <p className="text-[hsl(var(--lms-ink-soft))] max-w-2xl">
          Pick a learning path. Every course uses the TJ Anderson Layer Method to take you from concept to confident
          salon application.
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {courses.map((c) => {
          const enrolled = c.id in progressByCourse;
          const pct = progressByCourse[c.id] ?? 0;
          return (
            <article key={c.id} className="lms-card p-5 sm:p-6 flex flex-col">
              <div className="flex items-center gap-2 mb-3 flex-wrap">
                <LmsChip variant="teal">{c.category}</LmsChip>
                <LmsChip variant="gold">{c.level}</LmsChip>
                <LmsChip variant="status">{c.status}</LmsChip>
                <span className="ml-auto text-xs text-[hsl(var(--lms-muted))]">{c.lesson_count} lessons</span>
              </div>
              <h2 className="lms-display text-xl sm:text-2xl font-semibold mb-1">{c.title}</h2>
              <div className="text-sm text-[hsl(var(--lms-teal))] font-semibold mb-2">{c.subtitle}</div>
              <p className="text-sm text-[hsl(var(--lms-ink-soft))] flex-1 mb-4">{c.description}</p>
              {enrolled && (
                <div className="mb-4 flex items-center gap-3">
                  <div className="flex-1"><LmsProgressBar value={pct} /></div>
                  <div className="text-sm font-semibold text-[hsl(var(--lms-teal))]">{pct}%</div>
                </div>
              )}
              <Link to={`/lms/courses/${c.id}`}>
                <Button className="lms-btn-primary w-full h-11">
                  {enrolled ? "Open Course" : "Open Course"} <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </article>
          );
        })}
      </div>
    </LmsLayout>
  );
}
