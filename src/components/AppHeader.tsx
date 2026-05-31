import { useNavigate } from "react-router-dom";
import { useCoins, useSoundsEnabled } from "@/hooks/useCoins";
import { BookOpen, Volume2, VolumeX } from "lucide-react";
import CoinDisplay from "@/components/CoinDisplay";
import AppMenuSheet from "@/components/AppMenuSheet";
import LearningRhythmBadge from "@/components/learning-rhythm/LearningRhythmBadge";
import LearningCycleBadge from "@/components/learning-cycle/LearningCycleBadge";

const AppHeader = () => {
  const navigate = useNavigate();
  const { stats, showCoinAnimation, lastAdded } = useCoins();
  const { soundsEnabled, toggleSounds } = useSoundsEnabled();

  return (
    <header className="sticky top-0 z-50 border-b border-border/30 backdrop-blur-md bg-background/90">
      <div className="flex items-center justify-between px-4 py-3 max-w-2xl mx-auto">
        <div
          className="flex items-center gap-2 cursor-pointer"
          onClick={() => navigate("/")}
        >
          <BookOpen className="h-5 w-5" style={{ color: "hsl(var(--plum))" }} />
          <div className="flex flex-col leading-none">
            <span className="font-display text-[15px] font-bold tracking-tight" style={{ color: "hsl(var(--plum))" }}>
              TJ Anderson Layer Method<span style={{ color: "hsl(var(--gold))" }}>™</span>
            </span>
            <span className="text-[9px] uppercase tracking-[0.18em] font-semibold text-muted-foreground mt-0.5">
              Built on Connections
            </span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <LearningCycleBadge />
          <LearningRhythmBadge />
          <CoinDisplay coins={stats.coins} showAnimation={showCoinAnimation} lastAdded={lastAdded} />
          <button
            onClick={toggleSounds}
            className="text-muted-foreground hover:text-foreground transition-colors"
            aria-label={soundsEnabled ? "Mute" : "Unmute"}
          >
            {soundsEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
          </button>
          <AppMenuSheet />
        </div>
      </div>
    </header>
  );
};

export default AppHeader;
