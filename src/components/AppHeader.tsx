import { useNavigate } from "react-router-dom";
import { openTJChat } from "@/components/AskTJFullScreen";
import { openTJCafe } from "@/hooks/useStudyBreak";
import { useAuth } from "@/hooks/useAuth";
import { useCoins, useSoundsEnabled } from "@/hooks/useCoins";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  BookOpen, Menu, LogOut, BarChart3, Upload, Sparkles,
  Shield, Gamepad2,
  Volume2, VolumeX, GraduationCap, MessageCircle, Play, Library, Lightbulb, Grid3X3,
  Coffee,
} from "lucide-react";
import CoinDisplay from "@/components/CoinDisplay";

const AppHeader = () => {
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const { stats, showCoinAnimation, lastAdded } = useCoins();
  const { soundsEnabled, toggleSounds } = useSoundsEnabled();

  return (
    <header className="sticky top-0 z-50 border-b border-border/30 backdrop-blur-md bg-background/90">
      <div className="flex items-center justify-between px-4 py-3 max-w-2xl mx-auto">
        <div
          className="flex items-center gap-2 cursor-pointer"
          onClick={() => navigate("/")}
        >
          <BookOpen className="h-5 w-5 text-foreground" />
          <span className="font-display text-lg font-bold text-foreground tracking-tight">TJ Test Prep</span>
        </div>
        <div className="flex items-center gap-3">
          <CoinDisplay coins={stats.coins} showAnimation={showCoinAnimation} lastAdded={lastAdded} />
          <button onClick={toggleSounds} className="text-muted-foreground hover:text-foreground transition-colors">
            {soundsEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
          </button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                <Menu className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem onClick={() => navigate("/")}>
                <BookOpen className="h-4 w-4 mr-2" /> Dashboard
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate("/learn")}>
                <Grid3X3 className="h-4 w-4 mr-2" /> Learn
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate("/practice-lab")}>
                <Gamepad2 className="h-4 w-4 mr-2" /> Practice Lab
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate("/progress")}>
                <BarChart3 className="h-4 w-4 mr-2" /> Progress Tracker
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate("/comprehensive-exam")}>
                <GraduationCap className="h-4 w-4 mr-2" /> Final Exam
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate("/welcome")}>
                <Library className="h-4 w-4 mr-2" /> Foreword
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => openTJChat(false)}>
                <MessageCircle className="h-4 w-4 mr-2" /> Ask TJ
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate("/upload")} className="text-primary">
                <Upload className="h-4 w-4 mr-2" /> Create With TJ™
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate("/my-modules")}>
                <BookOpen className="h-4 w-4 mr-2" /> My Study Modules
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={signOut}>
                <LogOut className="h-4 w-4 mr-2" /> Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
};

export default AppHeader;
