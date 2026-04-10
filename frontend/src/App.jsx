import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/context/AuthContext";
import ProtectedRoute from "@/routes/ProtectedRoute";
import DashboardLayout from "@/layouts/DashboardLayout";
import LoginPage from "@/pages/LoginPage";
import SignupPage from "@/pages/SignupPage";
import DashboardPage from "@/pages/DashboardPage";
import GeneratePage from "@/pages/GeneratePage";
import SavedContentPage from "@/pages/SavedContentPage";
import ProfilePage from "@/pages/ProfilePage";
import QuizPage from "@/pages/QuizPage";
import RagPage from "@/pages/RagPage";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />
            <Route path="/dashboard" element={<ProtectedRoute allowedRoles={['teacher']}><DashboardLayout><DashboardPage /></DashboardLayout></ProtectedRoute>} />
            <Route path="/generate" element={<ProtectedRoute allowedRoles={['teacher']}><DashboardLayout><GeneratePage /></DashboardLayout></ProtectedRoute>} />
            <Route path="/saved" element={<ProtectedRoute><DashboardLayout><SavedContentPage /></DashboardLayout></ProtectedRoute>} />
            <Route path="/quizzes" element={<ProtectedRoute><DashboardLayout><QuizPage /></DashboardLayout></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute><DashboardLayout><ProfilePage /></DashboardLayout></ProtectedRoute>} />
            <Route path="/rag" element={<ProtectedRoute allowedRoles={['teacher']}><DashboardLayout><RagPage /></DashboardLayout></ProtectedRoute>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
