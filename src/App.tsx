import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { useEffect } from "react";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import LandingPage from "./components/LandingPage";
import AppLayout from "./components/AppLayout";
import Chat from "./pages/Chat";
import Library from "./pages/Library";
import Auth from "./pages/Auth";
import Connections from "./pages/Connections";
import Schedule from "./pages/Schedule";
import Settings from "./pages/Settings";
import SocialSettings from "./pages/SocialSettings";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import { AuthProvider } from "./contexts/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { logger } from "./utils/logger";

const queryClient = new QueryClient();

// Navigation logger component
const NavigationLogger = () => {
  const location = useLocation();
  
  useEffect(() => {
    const pathname = location.pathname;
    const search = location.search;
    const hash = location.hash;
    
    logger.info(`Navigation: ${sessionStorage.getItem('lastPath') || 'initial'} -> ${pathname}`);
    
    sessionStorage.setItem('lastPath', pathname);
  }, [location]);
  
  return null;
};

const App = () => {
  useEffect(() => {
    logger.info('Application started');

    // Track page visibility changes
    const handleVisibilityChange = () => {
      logger.info(`Page ${document.hidden ? 'hidden' : 'visible'}`);
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      logger.info('Application unmounted');
    };
  }, []);

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <NavigationLogger />
              <Routes>
                <Route path="/" element={<LandingPage />} />
                <Route 
                  path="/auth" 
                  element={
                    <ProtectedRoute requireAuth={false}>
                      <Auth />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/app" 
                  element={
                    <ProtectedRoute>
                      <AppLayout />
                    </ProtectedRoute>
                  }
                >
                  <Route index element={<Chat />} />
                  <Route path="chat" element={<Chat />} />
                  <Route path="library" element={<Library />} />
                  <Route path="connections" element={<Connections />} />
                  <Route path="schedule" element={<Schedule />} />
                  <Route path="analytics" element={<Index />} />
                  <Route path="settings" element={<Settings />} />
                  <Route path="social-settings" element={<SocialSettings />} />
                </Route>
                <Route path="/privacy-policy" element={<PrivacyPolicy />} />
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </TooltipProvider>
        </AuthProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
};

export default App;
