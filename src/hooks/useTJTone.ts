import { useMemo, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import {
  type TJToneMode,
  TJ_TONES,
  getTonePhrase,
  applyToneToCaption,
  mapProfileTone,
} from "@/lib/tjTone";

export const useTJTone = () => {
  const { profile } = useAuth();

  const tone: TJToneMode = useMemo(
    () => mapProfileTone(profile?.tone_preference),
    [profile?.tone_preference]
  );

  const toneProfile = useMemo(() => TJ_TONES[tone], [tone]);

  const getGreeting = useCallback(
    () => getTonePhrase(tone, "greetings"),
    [tone]
  );

  const getTransition = useCallback(
    () => getTonePhrase(tone, "transitionPhrases"),
    [tone]
  );

  const getEncouragement = useCallback(
    () => getTonePhrase(tone, "encouragements"),
    [tone]
  );

  const getClosing = useCallback(
    () => getTonePhrase(tone, "closings"),
    [tone]
  );

  const adaptCaption = useCallback(
    (stepKey: string, original: string) => applyToneToCaption(tone, stepKey, original),
    [tone]
  );

  return {
    tone,
    toneProfile,
    getGreeting,
    getTransition,
    getEncouragement,
    getClosing,
    adaptCaption,
  };
};
