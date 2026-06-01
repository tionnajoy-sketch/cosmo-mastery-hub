import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { openTJChat } from "@/components/AskTJFullScreen";
import { openTJCafe } from "@/hooks/useStudyBreak";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  BookOpen, Menu, LogOut, BarChart3, Upload,
  GraduationCap, MessageCircle, Library, Grid3X3,
  Coffee, NotebookPen, Hexagon, Trophy, Users,
  Volume2, VolumeX, Sparkles, Zap, ChevronDown, Lock,
} from "lucide-react";
import { isVoiceGloballyPaused, setVoiceGloballyPaused } from "@/hooks/useAutoNarrate";

const DEEP_LEARNING_CLUSTERS: { label: string; slug: string | null; note?: string }[] = [
  { label: "Skin Structure & Growth", slug: "skin-structure-and-growth" },
  { label: "General Anatomy & Physiology", slug: "general-anatomy-and-physiology" },
  { label: "Infectious Disease", slug: null, note: "Coming soon" },
];

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
    { label: "Dashboard",            icon: BookOpen,      onClick: go("/"),                                color: "285 45% 32%" },
    { label: "Rapid Mastery™",       icon: Zap,           onClick: go("/practice"),                        color: "42 75% 50%", highlight: true },
    { label: "Learning Geometry™",   icon: Hexagon,       onClick: go("/learning-geometry"),               color: "270 60% 45%", highlight: true },
    { label: "Progress",             icon: BarChart3,     onClick: go("/progress"),                        color: "270 50% 40%" },
    { label: "Final Exam",           icon: GraduationCap, onClick: go("/comprehensive-exam"),              color: "285 45% 32%" },
    { label: "Intelligence",         icon: Sparkles,      onClick: go("/intelligence"),                    color: "42 75% 50%" },
    { label: "Sections",             icon: Library,       onClick: go("/learn"),                           color: "270 30% 45%" },
  ];

  const resources: MenuItem[] = [
    { label: "Ask TJ™",        icon: MessageCircle, onClick: () => { close(); openTJChat(false); }, color: "270 60% 45%" },
    { label: "TJ Café™",       icon: Coffee,        onClick: () => { close(); openTJCafe(); },     color: "25 65% 45%" },
    { label: "My Journal",     icon: NotebookPen,   onClick: go("/insights"),                       color: "285 45% 32%" },
    { label: "Leaderboard",    icon: Trophy,        onClick: go("/leaderboard"),                    color: "42 75% 50%" },
    { label: "Community",      icon: Users,         onClick: go("/community"),                      color: "270 50% 45%" },
    { label: "Foreword",       icon: Library,       onClick: go("/welcome"),                        color: "25 70% 50%" },
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

          {/* Deep Learning™ — collapsible cluster picker */}
          <Collapsible defaultOpen>
            <div className="space-y-2">
              <CollapsibleTrigger className="flex items-center justify-between w-full px-1 group">
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Deep Learning™</p>
                <ChevronDown className="h-3.5 w-3.5 text-muted-foreground transition-transform group-data-[state=closed]:-rotate-90" />
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-2">
                {DEEP_LEARNING_CLUSTERS.map((c) => {
                  const disabled = !c.slug;
                  return (
                    <button
                      key={c.label}
                      disabled={disabled}
                      onClick={() => { if (c.slug) { close(); navigate(`/cluster/${c.slug}`); } }}
                      className="w-full flex items-center gap-3 p-3 rounded-xl border bg-card hover:bg-accent transition-all text-left disabled:opacity-50 disabled:cursor-not-allowed"
                      style={!disabled ? {
                        background: `linear-gradient(135deg, hsl(285 45% 32%/0.12), hsl(285 45% 32%/0.04))`,
                        borderColor: `hsl(285 45% 32%/0.3)`,
                      } : undefined}
                    >
                      <div
                        className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                        style={{ background: `hsl(285 45% 32%/0.15)` }}
                      >
                        {disabled
                          ? <Lock className="h-4 w-4" style={{ color: `hsl(285 45% 32%)` }} />
                          : <Sparkles className="h-4 w-4" style={{ color: `hsl(285 45% 32%)` }} />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold text-foreground leading-tight">{c.label}</div>
                        {c.note && <div className="text-[10px] text-muted-foreground mt-0.5">{c.note}</div>}
                      </div>
                    </button>
                  );
                })}
              </CollapsibleContent>
            </div>
          </Collapsible>

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
