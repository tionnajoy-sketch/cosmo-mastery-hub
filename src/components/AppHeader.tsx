import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { openTJChat } from "@/components/AIMentorChat";
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
  Shield, Brain, Gamepad2, Lightbulb, Settings, Library,
  Volume2, VolumeX, Trophy, GraduationCap, MessageCircle, Play,
} from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import tutorialAsset from "@/assets/app-tutorial.mp4.asset.json";
import CoinDisplay from "@/components/CoinDisplay";

const AppHeader = () => {
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const { stats, showCoinAnimation, lastAdded } = useCoins();
  const { soundsEnabled, toggleSounds } = useSoundsEnabled();
  const [showTutorial, setShowTutorial] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-border/30 backdrop-blur-md bg-background/90">
        <div className="flex items-center justify-between px-4 py-3 max-w-2xl mx-auto">
          <div
            className="flex items-center gap-2 cursor-pointer"
            onClick={() => navigate("/")}
          >
            <BookOpen className="h-5 w-5 text-primary" />
            <span className="font-display text-lg font-bold text-foreground">CosmoPrep</span>
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
                <DropdownMenuItem onClick={() => navigate("/study-modules")}>
                  <Library className="h-4 w-4 mr-2" /> Study Modules
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/strategy")}>
                  <Gamepad2 className="h-4 w-4 mr-2" /> Practice Lab
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/progress")}>
                  <BarChart3 className="h-4 w-4 mr-2" /> Progress Tracker
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/leaderboard")}>
                  <Trophy className="h-4 w-4 mr-2" /> Leaderboard
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/comprehensive-exam")}>
                  <GraduationCap className="h-4 w-4 mr-2" /> State Board Final Exam
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => openTJChat(false)}>
                  <MessageCircle className="h-4 w-4 mr-2" /> Ask TJ
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/upload")}>
                  <Upload className="h-4 w-4 mr-2" /> Create Study Blocks
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/my-modules")}>
                  <Sparkles className="h-4 w-4 mr-2" /> My Study Modules
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/insights")}>
                  <Lightbulb className="h-4 w-4 mr-2" /> My TJ Insights
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => openTJChat(true)}>
                  <Play className="h-4 w-4 mr-2" /> App Tutorial
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/terms")}>
                  <Shield className="h-4 w-4 mr-2" /> Terms of Use
                </DropdownMenuItem>
                <DropdownMenuItem onClick={signOut}>
                  <LogOut className="h-4 w-4 mr-2" /> Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>
      <Dialog open={showTutorial} onOpenChange={setShowTutorial}>
        <DialogContent className="max-w-sm p-2 bg-black border-0 rounded-2xl">
          <DialogTitle className="sr-only">App Navigation Tutorial</DialogTitle>
          <div className="relative aspect-[9/16] rounded-xl overflow-hidden">
            <video
              src={tutorialAsset.url}
              controls
              autoPlay
              playsInline
              className="w-full h-full object-contain"
            />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default AppHeader;
