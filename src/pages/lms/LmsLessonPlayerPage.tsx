import { useEffect, useMemo, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import LmsLayout, { LmsChip } from "@/lms/LmsLayout";
import { useLearner } from "@/lms/useLearner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { CheckCircle2, ChevronLeft, ChevronRight, Clock, Target } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface Lesson {
  id: string;
  title: string;
  lesson_type: string;
  duration_minutes: number;
  objective: string;
  content: string;
  module_id: string;
  sort_order: number;
}

export default function LmsLessonPlayerPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { learner } = useLearner();
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [courseId, setCourseId] = useState<string | null>(null);
  const [courseTitle, setCourseTitle] = useState("");
  const [siblings, setSiblings] = useState<Lesson[]>([]);
  const [allCourseLessons, setAllCourseLessons] = useState<string[]>([]);
  const [progressId, setProgressId] = useState<string | null>(null);
  const [completed, setCompleted] = useState(false);
  const [notes, setNotes] = useState("");
  const [savingNotes, setSavingNotes] = useState(false);
  const [quizScore, setQuizScore] = useState("");
  const [quizTotal, setQuizTotal] = useState("");

  useEffect(() => {
    if (!id) return;
    (async () => {
      const { data: l } = await supabase.from("lms_lessons").select("*").eq("id", id).single();
      if (!l) return;
      setLesson(l as Lesson);
      const { data: mod } = await supabase
        .from("lms_modules")
        .select("course_id, lms_courses(title)")
        .eq("id", (l as Lesson).module_id)
        .single();
      const cId = (mod as any)?.course_id;
      setCourseId(cId);
      setCourseTitle((mod as any)?.lms_courses?.title || "");

      const { data: mods } = await supabase
        .from("lms_modules")
        .select("id, sort_order, lms_lessons(id, sort_order, title, lesson_type, duration_minutes, objective, content, module_id)")
        .eq("course_id", cId)
        .order("sort_order");
      const ordered: Lesson[] = [];
      (mods || []).forEach((m: any) =>
        (m.lms_lessons || [])
          .sort((a: any, b: any) => a.sort_order - b.sort_order)
          .forEach((x: any) => ordered.push(x))
      );
      setAllCourseLessons(ordered.map((x) => x.id));
      setSiblings(ordered);
    })();
  }, [id]);

  useEffect(() => {
    if (!learner || !id) return;
    (async () => {
      const { data } = await supabase
        .from("lms_lesson_progress")
        .select("*")
        .eq("learner_id", learner.id)
        .eq("lesson_id", id)
        .maybeSingle();
      if (data) {
        setProgressId(data.id);
        setCompleted(!!data.completed);
        setNotes(data.notes || "");
      } else {
        setProgressId(null);
        setCompleted(false);
        setNotes("");
      }
    })();
  }, [learner, id]);

  const idx = useMemo(() => allCourseLessons.indexOf(id || ""), [allCourseLessons, id]);
  const prevId = idx > 0 ? allCourseLessons[idx - 1] : null;
  const nextId = idx >= 0 && idx < allCourseLessons.length - 1 ? allCourseLessons[idx + 1] : null;

  async function ensureProgressRow() {
    if (!learner || !id) return null;
    if (progressId) return progressId;
    const { data, error } = await supabase
      .from("lms_lesson_progress")
      .insert({ learner_id: learner.id, lesson_id: id })
      .select()
      .single();
    if (error || !data) return null;
    setProgressId(data.id);
    return data.id as string;
  }

  async function saveNotes() {
    if (!learner) return;
    setSavingNotes(true);
    const pid = await ensureProgressRow();
    if (!pid) {
      setSavingNotes(false);
      return;
    }
    await supabase.from("lms_lesson_progress").update({ notes }).eq("id", pid);
    setSavingNotes(false);
    toast({ title: "Notes saved" });
  }

  async function recalcEnrollmentProgress() {
    if (!learner || !courseId) return;
    const { data: enr } = await supabase
      .from("lms_enrollments")
      .select("id")
      .eq("learner_id", learner.id)
      .eq("course_id", courseId)
      .maybeSingle();
    let enrollmentId = enr?.id;
    if (!enrollmentId) {
      const { data: created } = await supabase
        .from("lms_enrollments")
        .insert({ learner_id: learner.id, course_id: courseId })
        .select("id")
        .single();
      enrollmentId = created?.id;
    }
    const { data: progressRows } = await supabase
      .from("lms_lesson_progress")
      .select("lesson_id, completed")
      .eq("learner_id", learner.id);
    const doneSet = new Set((progressRows || []).filter((p: any) => p.completed).map((p: any) => p.lesson_id));
    const total = allCourseLessons.length || 1;
    const done = allCourseLessons.filter((lid) => doneSet.has(lid)).length;
    const pct = Math.round((done / total) * 100);
    if (enrollmentId) {
      await supabase.from("lms_enrollments").update({ progress_pct: pct }).eq("id", enrollmentId);
    }
  }

  async function markComplete() {
    if (!learner || !id || !lesson) return;
    const pid = await ensureProgressRow();
    if (!pid) return;
    await supabase
      .from("lms_lesson_progress")
      .update({ completed: true, completed_at: new Date().toISOString(), notes })
      .eq("id", pid);
    setCompleted(true);
    await supabase.from("lms_activities").insert({
      learner_id: learner.id,
      activity_type: "lesson_complete",
      message: `Completed lesson: ${lesson.title}`,
      related_lesson_id: id,
      related_course_id: courseId,
    });
    await recalcEnrollmentProgress();
    toast({ title: "Lesson marked complete", description: "Nice work — your progress is updated." });
  }

  async function recordQuiz() {
    if (!learner || !id || !lesson) return;
    const s = Number(quizScore);
    const t = Number(quizTotal);
    if (!Number.isFinite(s) || !Number.isFinite(t) || t <= 0) {
      toast({ title: "Enter a valid score", variant: "destructive" });
      return;
    }
    await supabase.from("lms_quiz_attempts").insert({
      learner_id: learner.id,
      lesson_id: id,
      score: s,
      total: t,
    });
    await supabase.from("lms_activities").insert({
      learner_id: learner.id,
      activity_type: "quiz_attempt",
      message: `Quiz attempt on "${lesson.title}": ${s}/${t}`,
      related_lesson_id: id,
      related_course_id: courseId,
    });
    setQuizScore("");
    setQuizTotal("");
    toast({ title: "Quiz attempt recorded" });
  }

  if (!lesson) {
    return (
      <LmsLayout>
        <div className="text-[hsl(var(--lms-muted))]">Loading lesson…</div>
      </LmsLayout>
    );
  }

  return (
    <LmsLayout>
      <div className="mb-2 text-sm">
        {courseId && (
          <Link to={`/lms/courses/${courseId}`} className="text-[hsl(var(--lms-teal))] font-semibold hover:underline">
            ← {courseTitle}
          </Link>
        )}
      </div>

      <header className="lms-card p-6 sm:p-8 mb-6">
        <div className="flex items-center gap-2 mb-3 flex-wrap">
          <LmsChip variant="teal">{lesson.lesson_type}</LmsChip>
          <LmsChip variant="gold"><Clock className="w-3 h-3 mr-1 inline" /> {lesson.duration_minutes} min</LmsChip>
          {completed && <LmsChip variant="status">Completed</LmsChip>}
        </div>
        <h1 className="lms-display text-3xl font-semibold mb-3">{lesson.title}</h1>
        {lesson.objective && (
          <div className="flex items-start gap-2 text-[hsl(var(--lms-ink-soft))]">
            <Target className="w-4 h-4 mt-1 text-[hsl(var(--lms-terracotta))]" />
            <div>
              <div className="text-xs uppercase tracking-widest text-[hsl(var(--lms-muted))] mb-0.5">Objective</div>
              <div className="text-sm">{lesson.objective}</div>
            </div>
          </div>
        )}
      </header>

      <Tabs defaultValue="learn" className="mb-6">
        <TabsList className="bg-[hsl(var(--lms-cream-soft))]">
          <TabsTrigger value="learn">Learn</TabsTrigger>
          <TabsTrigger value="practice">Practice</TabsTrigger>
          <TabsTrigger value="reflect">Reflect</TabsTrigger>
        </TabsList>

        <TabsContent value="learn" className="mt-4">
          <div className="lms-card p-6 prose prose-sm max-w-none">
            <p className="text-[hsl(var(--lms-ink))] whitespace-pre-line leading-relaxed">{lesson.content}</p>
          </div>
        </TabsContent>

        <TabsContent value="practice" className="mt-4">
          <div className="lms-card p-6">
            <div className="lms-display text-lg font-semibold mb-2">Practice prompt</div>
            <p className="text-[hsl(var(--lms-ink-soft))] mb-4">
              Apply this lesson to a real moment in your salon work. Walk through the steps out loud as if you were
              explaining it to a client at the chair.
            </p>
            {lesson.lesson_type === "quiz" && (
              <div className="border-t border-[hsl(var(--lms-border))] pt-4 mt-4">
                <div className="lms-display text-base font-semibold mb-3">Record Quiz Attempt</div>
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div>
                    <label className="text-xs uppercase tracking-widest text-[hsl(var(--lms-muted))]">Your score</label>
                    <Input value={quizScore} onChange={(e) => setQuizScore(e.target.value)} type="number" min={0} placeholder="8" />
                  </div>
                  <div>
                    <label className="text-xs uppercase tracking-widest text-[hsl(var(--lms-muted))]">Out of</label>
                    <Input value={quizTotal} onChange={(e) => setQuizTotal(e.target.value)} type="number" min={1} placeholder="10" />
                  </div>
                </div>
                <Button onClick={recordQuiz} className="lms-btn-secondary h-10">Record Quiz Attempt</Button>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="reflect" className="mt-4">
          <div className="lms-card p-6">
            <div className="lms-display text-lg font-semibold mb-2">Notes</div>
            <p className="text-sm text-[hsl(var(--lms-ink-soft))] mb-3">
              Capture what stood out and how you'll use it on your next client.
            </p>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={6}
              placeholder="Write your reflection…"
              className="bg-[hsl(var(--lms-cream))]"
            />
            <div className="mt-3">
              <Button onClick={saveNotes} disabled={savingNotes} className="lms-btn-secondary h-10">
                {savingNotes ? "Saving…" : "Save Notes"}
              </Button>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      <div className="flex items-center gap-3 flex-wrap">
        {prevId ? (
          <Link to={`/lms/lesson/${prevId}`}>
            <Button variant="outline" className="h-11"><ChevronLeft className="w-4 h-4 mr-1" /> Previous</Button>
          </Link>
        ) : <span />}
        <div className="flex-1" />
        <Button onClick={markComplete} className="lms-btn-primary h-11 px-5" disabled={completed}>
          <CheckCircle2 className="w-4 h-4 mr-2" /> {completed ? "Completed" : "Mark Complete"}
        </Button>
        {nextId && (
          <Button
            onClick={() => navigate(`/lms/lesson/${nextId}`)}
            className="lms-btn-secondary h-11"
          >
            Next Lesson <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        )}
      </div>
    </LmsLayout>
  );
}
