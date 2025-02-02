import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "@/components/theme-provider";
import Index from "./pages/Index";
import Explore from "./pages/Explore";
import Profile from "./pages/Profile";
import Auth from "./pages/Auth";
import BottomNav from "./components/BottomNav";
import { useEffect, useState } from "react";
import { supabase } from "./integrations/supabase/client";
import { useToast } from "./hooks/use-toast";

const queryClient = new QueryClient();

const App = () => {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    // Initialize session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    // Set up auth state listener
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (_event === 'SIGNED_OUT') {
        // Clear any cached data when user signs out
        queryClient.clear();
      }
      
      if (_event === 'TOKEN_REFRESHED') {
        toast({
          title: "Session Refreshed",
          description: "Your session has been updated.",
        });
      }

      if (_event === 'USER_UPDATED') {
        toast({
          title: "Profile Updated",
          description: "Your profile has been updated successfully.",
        });
      }

      setSession(session);
    });

    // Cleanup subscription
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Handle loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="light" storageKey="vite-ui-theme">
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route
                path="/auth"
                element={session ? <Navigate to="/" /> : <Auth />}
              />
              <Route
                path="/"
                element={session ? <Index /> : <Navigate to="/auth" />}
              />
              <Route
                path="/explore"
                element={session ? <Explore /> : <Navigate to="/auth" />}
              />
              <Route
                path="/portfolio"
                element={
                  session ? <Index showPortfolio={true} /> : <Navigate to="/auth" />
                }
              />
              <Route
                path="/profile"
                element={session ? <Profile /> : <Navigate to="/auth" />}
              />
            </Routes>
            {session && <BottomNav />}
          </BrowserRouter>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
};

export default App;