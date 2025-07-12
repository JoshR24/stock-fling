
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
import type { Session } from "@supabase/supabase-js";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: (failureCount, error) => {
        if (error?.message?.includes('JWT expired')) return false;
        return failureCount < 2;
      },
    },
  },
});

const App = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    let mounted = true;

    // Set up auth state listener first
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;

      console.log('Auth state changed:', event, session?.user?.email);
      
      if (event === 'SIGNED_OUT') {
        // Clear any cached data when user signs out
        queryClient.clear();
      }
      
      if (event === 'TOKEN_REFRESHED') {
        toast({
          title: "Session Refreshed",
          description: "Your session has been updated.",
        });
      }

      if (event === 'USER_UPDATED') {
        toast({
          title: "Profile Updated",
          description: "Your profile has been updated successfully.",
        });
      }

      setSession(session);
      if (loading) setLoading(false);
    });

    // Then check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (mounted) {
        setSession(session);
        setLoading(false);
      }
    });

    // Cleanup function
    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [toast, loading]);

  // Handle loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
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
                element={session ? <Navigate to="/" replace /> : <Auth />}
              />
              <Route
                path="/"
                element={session ? <Index /> : <Navigate to="/auth" replace />}
              />
              <Route
                path="/explore"
                element={session ? <Explore /> : <Navigate to="/auth" replace />}
              />
              <Route
                path="/portfolio"
                element={
                  session ? <Index showPortfolio={true} /> : <Navigate to="/auth" replace />
                }
              />
              <Route
                path="/profile"
                element={session ? <Profile /> : <Navigate to="/auth" replace />}
              />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
            {session && <BottomNav />}
          </BrowserRouter>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
};

export default App;
