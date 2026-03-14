import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
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
  Shield, Brain, Gamepad2, MessageCircle, Lightbulb, Settings,
} from "lucide-react";

const AppHeader = () => {
  const navigate = useNavigate();
  const { signOut } = useAuth();

  return (
    <header className="sticky top-0 z-50 border-b border-border/30 backdrop-blur-md bg-background/90">
      <div className="flex items-center justify-between px-4 py-3 max-w-2xl mx-auto">
        <div
          className="flex items-center gap-2 cursor-pointer"
          onClick={() => navigate("/")}
        >
          <BookOpen className="h-5 w-5 text-primary" />
          <span className="font-display text-lg font-bold text-foreground">CosmoPrep</span>
        </div>
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
            <DropdownMenuItem onClick={() => navigate("/")}>
              <Brain className="h-4 w-4 mr-2" /> Study Modules
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate("/strategy")}>
              <Gamepad2 className="h-4 w-4 mr-2" /> Practice Lab
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate("/progress")}>
              <BarChart3 className="h-4 w-4 mr-2" /> Progress Tracker
            </DropdownMenuItem>
            <DropdownMenuSeparator />
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
            <DropdownMenuItem onClick={() => navigate("/terms")}>
              <Shield className="h-4 w-4 mr-2" /> Terms of Use
            </DropdownMenuItem>
            <DropdownMenuItem onClick={signOut}>
              <LogOut className="h-4 w-4 mr-2" /> Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
};

export default AppHeader;
