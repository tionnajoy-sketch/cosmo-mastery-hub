import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { openTJChat } from "@/components/AskTJFullScreen";
import { openTJCafe } from "@/hooks/useStudyBreak";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import {
  BookOpen, Menu, LogOut, BarChart3, Upload,
  GraduationCap, MessageCircle, Library, Grid3X3,
  Coffee, NotebookPen, Brain, Trophy, Users,
  Volume2, VolumeX,
} from "lucide-react";
import { isVoiceGloballyPaused, setVoiceGloballyPaused } from "@/hooks/useAutoNarrate";

interface MenuItem {
  label: string;
  icon: any;
  onClick: () => void;
  color: string; // hsl color for the icon tile
  highlight?: boolean;
}

const AppMenuSheet = () => {
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const [open, setOpen] = useState(false);

  const close = () => setOpen(false);
  const go = (path: string) => () => { close(); navigate(path); };

  const core: MenuItem[] = [
    { label: "Dashboard",        icon: BookOpen,       onClick: go("/"),                  color: "265 60% 50%" },
    { label: "Learn & Practice", icon: Grid3X3,        onClick: go("/learn"),             color: "215 70% 50%" },
    { label: "Progress",         icon: BarChart3,      onClick: go("/progress"),          color: "42 70% 50%" },
    { label: "Final Exam",       icon: GraduationCap,  onClick: go("/comprehensive-exam"),color: "320 55% 48%" },
    { label: "Foreword",         icon: Library,        onClick: go("/welcome"),           color: "25 70% 50%" },
  ];

  const resources: MenuItem[] = [
    { label: "Ask TJ",         icon: MessageCircle, onClick: () => { close(); openTJChat(false); }, color: "275 60% 55%" },
    { label: "TJ Café",        icon: Coffee,        onClick: () => { close(); openTJCafe(); },     color: "25 65% 45%" },
    { label: "My Journal",     icon: NotebookPen,   onClick: go("/insights"),                       color: "200 60% 45%" },
    { label: "Learning DNA",   icon: Brain,         onClick: go("/learning-dna"),                   color: "265 60% 50%" },
    { label: "Leaderboard",    icon: Trophy,        onClick: go("/leaderboard"),                    color: "42 80% 50%" },
    { label: "Community",      icon: Users,         onClick: go("/community"),                      color: "200 65% 50%" },
  ];

  const premium: MenuItem[] = [
    { label: "Create With TJ™", icon: Upload,   onClick: go("/upload"),     color: "42 80% 50%", highlight: true },
    { label: "My Modules",      icon: BookOpen, onClick: go("/my-modules"), color: "215 70% 50%" },
  ];

  const Tile = ({ item }: { item: MenuItem }) => {
    const Icon = item.icon;
    return (
      <button
        onClick={item.onClick}
        className="group flex flex-col items-center justify-center gap-2 p-4 rounded-2xl border bg-card hover:bg-accent transition-all hover:scale-[1.02] active:scale-[0.98] shadow-sm hover:shadow-md text-center min-h-[96px]"
        style={item.highlight ? {
          background: `linear-gradient(135deg, hsl(${item.color}/0.15), hsl(${item.color}/0.05))`,
          borderColor: `hsl(${item.color}/0.4)`,
        } : undefined}
      >
        <div
          className="w-11 h-11 rounded-xl flex items-center justify-center"
          style={{ background: `hsl(${item.color}/0.15)` }}
        >
          <Icon className="h-5 w-5" style={{ color: `hsl(${item.color})` }} />
        </div>
        <span className="text-xs font-semibold text-foreground leading-tight">{item.label}</span>
      </button>
    );
  };

  const SectionGrid = ({ title, items }: { title: string; items: MenuItem[] }) => (
    <div className="space-y-2">
      <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground px-1">{title}</p>
      <div className="grid grid-cols-2 gap-2.5">
        {items.map((it) => <Tile key={it.label} item={it} />)}
      </div>
    </div>
  );

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="sm" aria-label="Open menu">
          <Menu className="h-4 w-4" />
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-[88vw] sm:max-w-md overflow-y-auto p-5">
        <SheetHeader className="mb-4">
          <SheetTitle className="font-display text-xl">Navigate</SheetTitle>
        </SheetHeader>

        <div className="space-y-5">
          <SectionGrid title="Core" items={core} />
          <SectionGrid title="Resources" items={resources} />
          <SectionGrid title="Premium Tools" items={premium} />

          <div className="pt-2 border-t space-y-2">
            <Button
              variant="outline"
              className="w-full justify-center gap-2"
              onClick={() => {
                const nowPaused = !isVoiceGloballyPaused();
                setVoiceGloballyPaused(nowPaused);
                // Force re-render of the sheet by closing & reopening would be heavy; just close
                close();
              }}
            >
              {isVoiceGloballyPaused() ? (
                <><VolumeX className="h-4 w-4" /> TJ Voice: Paused (tap to enable)</>
              ) : (
                <><Volume2 className="h-4 w-4" /> TJ Voice: On (tap to pause)</>
              )}
            </Button>
            <Button
              variant="outline"
              className="w-full justify-center gap-2"
              onClick={() => { close(); signOut(); }}
            >
              <LogOut className="h-4 w-4" /> Sign Out
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default AppMenuSheet;
