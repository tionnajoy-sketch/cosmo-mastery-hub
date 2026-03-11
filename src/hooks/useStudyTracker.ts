import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

const DEFAULT_QUESTION_GOAL = 10;
const GOAL_STORAGE_KEY = "study_daily_goal";

interface StudyStats {
  questionsToday: number;
  activitiesToday: number;
  goalMet: boolean;
  currentStreak: number;
  longestStreak: number;
  dailyGoal: number;
  loading: boolean;
}

export const useStudyTracker = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<StudyStats>({
    questionsToday: 0,
    activitiesToday: 0,
    goalMet: false,
    currentStreak: 0,
    longestStreak: 0,
    loading: true,
  });

  const fetchStats = useCallback(async () => {
    if (!user) return;
    const today = new Date().toISOString().split("T")[0];

    const [todayRes, allRes] = await Promise.all([
      supabase
        .from("study_activity")
        .select("*")
        .eq("user_id", user.id)
        .eq("activity_date", today)
        .maybeSingle(),
      supabase
        .from("study_activity")
        .select("activity_date, goal_met")
        .eq("user_id", user.id)
        .order("activity_date", { ascending: false }),
    ]);

    const todayData = todayRes.data;
    const allData = allRes.data || [];

    // Calculate streaks
    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 0;
    const todayDate = new Date(today);

    for (let i = 0; i < allData.length; i++) {
      const row = allData[i];
      if (!row.goal_met) {
        if (i === 0 && row.activity_date === today) continue; // today not met yet, skip
        break;
      }
      const rowDate = new Date(row.activity_date);
      const expectedDate = new Date(todayDate);
      expectedDate.setDate(expectedDate.getDate() - currentStreak);
      // Allow today or yesterday as start
      if (i === 0) {
        const diffDays = Math.floor((todayDate.getTime() - rowDate.getTime()) / 86400000);
        if (diffDays > 1) break;
        currentStreak = 1;
      } else {
        const prevDate = new Date(allData[i - 1].activity_date);
        const diff = Math.floor((prevDate.getTime() - rowDate.getTime()) / 86400000);
        if (diff === 1) currentStreak++;
        else break;
      }
    }

    // Longest streak
    tempStreak = 0;
    for (let i = 0; i < allData.length; i++) {
      if (allData[i].goal_met) {
        if (i === 0) { tempStreak = 1; }
        else {
          const prev = new Date(allData[i - 1].activity_date);
          const curr = new Date(allData[i].activity_date);
          const diff = Math.floor((prev.getTime() - curr.getTime()) / 86400000);
          if (diff === 1) tempStreak++;
          else tempStreak = 1;
        }
        longestStreak = Math.max(longestStreak, tempStreak);
      } else {
        tempStreak = 0;
      }
    }

    setStats({
      questionsToday: todayData?.questions_answered || 0,
      activitiesToday: todayData?.activities_completed || 0,
      goalMet: todayData?.goal_met || false,
      currentStreak,
      longestStreak,
      loading: false,
    });
  }, [user]);

  useEffect(() => { fetchStats(); }, [fetchStats]);

  const trackQuestions = useCallback(async (count: number) => {
    if (!user) return;
    const today = new Date().toISOString().split("T")[0];

    const { data: existing } = await supabase
      .from("study_activity")
      .select("*")
      .eq("user_id", user.id)
      .eq("activity_date", today)
      .maybeSingle();

    const newQuestions = (existing?.questions_answered || 0) + count;
    const newActivities = existing?.activities_completed || 0;
    const goalMet = newQuestions >= DAILY_QUESTION_GOAL || newActivities >= 1;

    if (existing) {
      await supabase
        .from("study_activity")
        .update({ questions_answered: newQuestions, goal_met: goalMet })
        .eq("id", existing.id);
    } else {
      await supabase
        .from("study_activity")
        .insert({ user_id: user.id, activity_date: today, questions_answered: newQuestions, goal_met: goalMet });
    }
    fetchStats();
  }, [user, fetchStats]);

  const trackActivity = useCallback(async () => {
    if (!user) return;
    const today = new Date().toISOString().split("T")[0];

    const { data: existing } = await supabase
      .from("study_activity")
      .select("*")
      .eq("user_id", user.id)
      .eq("activity_date", today)
      .maybeSingle();

    const newActivities = (existing?.activities_completed || 0) + 1;
    const newQuestions = existing?.questions_answered || 0;
    const goalMet = newQuestions >= DAILY_QUESTION_GOAL || newActivities >= 1;

    if (existing) {
      await supabase
        .from("study_activity")
        .update({ activities_completed: newActivities, goal_met: goalMet })
        .eq("id", existing.id);
    } else {
      await supabase
        .from("study_activity")
        .insert({ user_id: user.id, activity_date: today, activities_completed: newActivities, goal_met: goalMet });
    }
    fetchStats();
  }, [user, fetchStats]);

  return { ...stats, trackQuestions, trackActivity };
};
