import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import EventPage from "./pages/Event";
import EventDetailPage from "./pages/EventDetail";
import GeneralPage from "./pages/General";
import RescuePage from "./pages/Rescue";
import SosMonitoringPage from "./pages/SosMonitoring";
import SosDashboard from "./pages/SosDashboard";
import Reports from "./pages/Reports";
import Users from "./pages/Users";
import Notifications from "./pages/Notifications";
import Logs from "./pages/Logs";
import Login from "./pages/Login";
import Register from "./pages/Register";
import AdminRegister from "./pages/AdminRegister";
import PendingApproval from "./pages/PendingApproval";
import AdminRequests from "./pages/AdminRequests";
import ForgotPassword from "./pages/ForgotPassword";
import NotFound from "./pages/NotFound";
import Reactions from "./pages/Reactions";
import Categories from "./pages/Categories";
import EventPosts from "./pages/EventPosts";
import AppUsers from "./pages/AppUsers";
import BlockedUsers from "./pages/BlockedUsers";
import { AuthProvider, ProtectedRoute } from "./hooks/use-auth";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 0,
      refetchOnMount: true,
      refetchOnWindowFocus: true,
    },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ErrorBoundary>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <AuthProvider>
          <BrowserRouter>
            <Routes>
              <Route element={<ProtectedRoute roles={["ADMIN", "OWNER"]} />}>
                <Route path="/" element={<EventPage />} />
                <Route path="/event/:postType/:id" element={<EventDetailPage />} />
                <Route path="/general" element={<GeneralPage />} />
                <Route path="/rescue" element={<RescuePage />} />
                <Route path="/sos" element={<SosDashboard />} />
                <Route path="/reports" element={<Reports />} />
                <Route path="/users" element={<Users />} />
                <Route path="/app-users" element={<AppUsers />} />
                <Route path="/blocked-users" element={<BlockedUsers />} />
                <Route path="/notifications" element={<Notifications />} />
                <Route path="/logs" element={<Logs />} />
                <Route path="/reactions" element={<Reactions />} />
                <Route path="/categories" element={<Categories />} />
                <Route path="/event-posts" element={<EventPosts />} />
              </Route>
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/pending-approval" element={<PendingApproval />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />

              <Route element={<ProtectedRoute roles={["OWNER"]} />}>
                <Route path="/admin-requests" element={<AdminRequests />} />
              </Route>

              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </TooltipProvider>
    </ErrorBoundary>
  </QueryClientProvider>
);

export default App;
