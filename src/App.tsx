import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import ProtectedRoute from "@/components/ProtectedRoute";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Home from "./pages/Home";
import SectionPage from "./pages/SectionPage";
import StudyPage from "./pages/StudyPage";
import ActivityPage from "./pages/ActivityPage";
import QuizPage from "./pages/QuizPage";
import ResultsPage from "./pages/ResultsPage";
import PopQuizPage from "./pages/PopQuizPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/" element={<ProtectedRoute><Home /></ProtectedRoute>} />
            <Route path="/section/:id" element={<ProtectedRoute><SectionPage /></ProtectedRoute>} />
            <Route path="/section/:id/study/:block" element={<ProtectedRoute><StudyPage /></ProtectedRoute>} />
            <Route path="/section/:id/activity/:block" element={<ProtectedRoute><ActivityPage /></ProtectedRoute>} />
            <Route path="/section/:id/quiz/:block" element={<ProtectedRoute><QuizPage /></ProtectedRoute>} />
            <Route path="/section/:id/results/:block" element={<ProtectedRoute><ResultsPage /></ProtectedRoute>} />
            <Route path="/section/:id/pop-quiz" element={<ProtectedRoute><PopQuizPage /></ProtectedRoute>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
