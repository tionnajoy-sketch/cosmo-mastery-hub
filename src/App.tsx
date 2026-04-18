import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import ScrollToTop from "@/components/ScrollToTop";
import { AuthProvider } from "@/hooks/useAuth";
import { CoinProvider } from "@/hooks/useCoins";
import { BackgroundUploadProvider } from "@/contexts/BackgroundUploadContext";
import BackgroundUploadBanner from "@/components/BackgroundUploadBanner";
import ProtectedRoute from "@/components/ProtectedRoute";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import OnboardingPage from "./pages/OnboardingPage";
import Home from "./pages/Home";
import WelcomePage from "./pages/WelcomePage";
import SectionRedirect from "./pages/SectionRedirect";
import ActivityPage from "./pages/ActivityPage";
import QuizPage from "./pages/QuizPage";
import ResultsPage from "./pages/ResultsPage";
import PopQuizPage from "./pages/PopQuizPage";
import StrategyPage from "./pages/StrategyPage";
import FinalExamPage from "./pages/FinalExamPage";
import ProgressPage from "./pages/ProgressPage";
import TermsPage from "./pages/TermsPage";
import PretestPage from "./pages/PretestPage";
import PretestResultsPage from "./pages/PretestResultsPage";
import PosttestPage from "./pages/PosttestPage";
import PosttestResultsPage from "./pages/PosttestResultsPage";
import AnatomyMapPage from "./pages/AnatomyMapPage";
import SkinMapPage from "./pages/SkinMapPage";
import UploadPage from "./pages/UploadPage";
import MyModulesPage from "./pages/MyModulesPage";
import ModuleViewPage from "./pages/ModuleViewPage";
import ModuleQuizPage from "./pages/ModuleQuizPage";
import ModuleResultsPage from "./pages/ModuleResultsPage";
import ModuleActivityPage from "./pages/ModuleActivityPage";
import ModuleQuizBankPage from "./pages/ModuleQuizBankPage";
import InsightsPage from "./pages/InsightsPage";
import StudyModulesPage from "./pages/StudyModulesPage";
import LeaderboardPage from "./pages/LeaderboardPage";
import ComprehensiveFinalExamPage from "./pages/ComprehensiveFinalExamPage";
import CosmoConnectionGridPage from "./pages/CosmoConnectionGridPage";
import AskTJFullScreen from "./components/AskTJFullScreen";
import GameGridPage from "./pages/GameGridPage";
import LearningDNAPage from "./pages/LearningDNAPage";
import PracticeLabPage from "./pages/PracticeLabPage";
import CommunityBoardPage from "./pages/CommunityBoardPage";
import TJCafe from "./components/TJCafe";
import { useStudyBreak } from "./hooks/useStudyBreak";
import VoiceCacheDashboard from "./pages/VoiceCacheDashboard";
import NotFound from "./pages/NotFound";
import GlobalMenuFab from "@/components/GlobalMenuFab";

const queryClient = new QueryClient();

const AppContent = () => {
  const { showCafe, dismissCafe, isManual } = useStudyBreak();
  return (
    <>
      <ScrollToTop />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/onboarding" element={<ProtectedRoute><OnboardingPage /></ProtectedRoute>} />
        <Route path="/" element={<ProtectedRoute><Home /></ProtectedRoute>} />
        <Route path="/welcome" element={<ProtectedRoute><WelcomePage /></ProtectedRoute>} />
        {/* Section + Study routes consolidated into the Game Grid (/learn) */}
        <Route path="/section/:id" element={<ProtectedRoute><SectionRedirect /></ProtectedRoute>} />
        <Route path="/section/:id/study/:block" element={<ProtectedRoute><SectionRedirect /></ProtectedRoute>} />
        <Route path="/section/:id/activity/:block" element={<ProtectedRoute><ActivityPage /></ProtectedRoute>} />
        <Route path="/section/:id/quiz/:block" element={<ProtectedRoute><QuizPage /></ProtectedRoute>} />
        <Route path="/section/:id/results/:block" element={<ProtectedRoute><ResultsPage /></ProtectedRoute>} />
        <Route path="/section/:id/pop-quiz" element={<ProtectedRoute><PopQuizPage /></ProtectedRoute>} />
        <Route path="/section/:id/final-exam" element={<ProtectedRoute><FinalExamPage /></ProtectedRoute>} />
        <Route path="/strategy" element={<ProtectedRoute><StrategyPage /></ProtectedRoute>} />
        <Route path="/progress" element={<ProtectedRoute><ProgressPage /></ProtectedRoute>} />
        <Route path="/terms" element={<TermsPage />} />
        <Route path="/pretest" element={<ProtectedRoute><PretestPage /></ProtectedRoute>} />
        <Route path="/pretest-results" element={<ProtectedRoute><PretestResultsPage /></ProtectedRoute>} />
        <Route path="/post-test" element={<ProtectedRoute><PosttestPage /></ProtectedRoute>} />
        <Route path="/post-test-results" element={<ProtectedRoute><PosttestResultsPage /></ProtectedRoute>} />
        <Route path="/anatomy-map" element={<ProtectedRoute><AnatomyMapPage /></ProtectedRoute>} />
        <Route path="/skin-map" element={<ProtectedRoute><SkinMapPage /></ProtectedRoute>} />
        <Route path="/upload" element={<ProtectedRoute><UploadPage /></ProtectedRoute>} />
        <Route path="/my-modules" element={<ProtectedRoute><MyModulesPage /></ProtectedRoute>} />
        <Route path="/module/:id" element={<ProtectedRoute><ModuleViewPage /></ProtectedRoute>} />
        <Route path="/module/:id/quiz/:block" element={<ProtectedRoute><ModuleQuizPage /></ProtectedRoute>} />
        <Route path="/module/:id/results/:block" element={<ProtectedRoute><ModuleResultsPage /></ProtectedRoute>} />
        <Route path="/module/:id/activity/:block" element={<ProtectedRoute><ModuleActivityPage /></ProtectedRoute>} />
        <Route path="/module/:id/quiz-bank" element={<ProtectedRoute><ModuleQuizBankPage /></ProtectedRoute>} />
        <Route path="/insights" element={<ProtectedRoute><InsightsPage /></ProtectedRoute>} />
        <Route path="/learn" element={<ProtectedRoute><GameGridPage /></ProtectedRoute>} />
        <Route path="/study-modules" element={<ProtectedRoute><GameGridPage /></ProtectedRoute>} />
        {/* Practice Lab merged into /learn — keep route alive but render merged Learn page */}
        <Route path="/practice-lab" element={<ProtectedRoute><GameGridPage /></ProtectedRoute>} />
        <Route path="/community" element={<ProtectedRoute><CommunityBoardPage /></ProtectedRoute>} />
        <Route path="/strategy" element={<ProtectedRoute><StrategyPage /></ProtectedRoute>} />
        <Route path="/leaderboard" element={<ProtectedRoute><LeaderboardPage /></ProtectedRoute>} />
        <Route path="/comprehensive-exam" element={<ProtectedRoute><ComprehensiveFinalExamPage /></ProtectedRoute>} />
        <Route path="/cosmo-grid" element={<ProtectedRoute><CosmoConnectionGridPage /></ProtectedRoute>} />
        <Route path="/learning-dna" element={<ProtectedRoute><LearningDNAPage /></ProtectedRoute>} />
        <Route path="/game-grid" element={<ProtectedRoute><GameGridPage /></ProtectedRoute>} />
        <Route path="/voice-cache" element={<ProtectedRoute><VoiceCacheDashboard /></ProtectedRoute>} />
        <Route path="*" element={<NotFound />} />
      </Routes>
      <AskTJFullScreen />
      <TJCafe open={showCafe} onDismiss={dismissCafe} requiredMode={!isManual} />
      <GlobalMenuFab />
    </>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <CoinProvider>
            <BackgroundUploadProvider>
              <AppContent />
              <BackgroundUploadBanner />
            </BackgroundUploadProvider>
          </CoinProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
