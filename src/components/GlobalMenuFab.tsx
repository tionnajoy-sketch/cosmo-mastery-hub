import { useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import AppMenuSheet from "@/components/AppMenuSheet";

/**
 * Floating menu button rendered globally on every authenticated page.
 * Ensures students can navigate out of any screen — even ones without an AppHeader.
 * Hidden on auth pages and on pages that already render AppHeader (which has its own menu).
 */
const HEADER_ROUTES = new Set<string>([
  "/", "/welcome", "/progress", "/insights", "/learning-dna",
  "/upload", "/my-modules", "/learn", "/practice-lab",
  "/leaderboard", "/study-modules", "/voice-cache",
]);

const HIDDEN_ROUTES = new Set<string>(["/login", "/signup", "/onboarding"]);

const GlobalMenuFab = () => {
  const { user } = useAuth();
  const { pathname } = useLocation();

  if (!user) return null;
  if (HIDDEN_ROUTES.has(pathname)) return null;
  // Avoid double-button on pages that have AppHeader's menu already
  if (HEADER_ROUTES.has(pathname)) return null;

  return (
    <div className="fixed top-3 right-3 z-[60]">
      <div className="rounded-full bg-background/95 backdrop-blur-md shadow-lg border border-border/50 p-1">
        <AppMenuSheet />
      </div>
    </div>
  );
};

export default GlobalMenuFab;
