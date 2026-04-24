// Voice removed — SpeakButton renders nothing.
interface SpeakButtonProps {
  text?: string;
  label?: string;
  size?: "sm" | "icon" | "default";
  className?: string;
  onComplete?: () => void;
  usageType?: "greeting" | "lesson" | "affirmation" | "onboarding" | "faq" | "dynamic";
}

const SpeakButton = (_props: SpeakButtonProps) => null;

export default SpeakButton;
