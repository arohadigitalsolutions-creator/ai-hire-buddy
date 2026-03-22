import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import ProtectedRoute from "@/components/ProtectedRoute";
import LandingPage from "./pages/LandingPage";
import AuthPage from "./pages/AuthPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import DashboardLayout from "./components/DashboardLayout";
import DashboardOverview from "./pages/DashboardOverview";
import JobProfilesPage from "./pages/JobProfilesPage";
import CandidatesPage from "./pages/CandidatesPage";
import SmartMatchingPage from "./pages/SmartMatchingPage";
import InterviewsPage from "./pages/InterviewsPage";
import CommunicationPage from "./pages/CommunicationPage";
import AnalyticsPage from "./pages/AnalyticsPage";
import HRInsightsPage from "./pages/HRInsightsPage";
import UnsubscribePage from "./pages/UnsubscribePage";
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
            <Route path="/" element={<LandingPage />} />
            <Route path="/auth" element={<AuthPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <DashboardLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<DashboardOverview />} />
              <Route path="jobs" element={<JobProfilesPage />} />
              <Route path="candidates" element={<CandidatesPage />} />
              <Route path="matching" element={<SmartMatchingPage />} />
              <Route path="interviews" element={<InterviewsPage />} />
              <Route path="communication" element={<CommunicationPage />} />
              <Route path="analytics" element={<AnalyticsPage />} />
              <Route path="insights" element={<HRInsightsPage />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
