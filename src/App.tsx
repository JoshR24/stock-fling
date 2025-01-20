import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { createBrowserSupabaseClient } from "@supabase/auth-helpers-shared";
import { SessionContextProvider } from "@supabase/auth-helpers-react";
import { useState } from "react";
import Index from "./pages/Index";
import Auth from "./pages/Auth";

const queryClient = new QueryClient();

const App = () => {
  const [supabaseClient] = useState(() => createBrowserSupabaseClient());

  return (
    <SessionContextProvider supabaseClient={supabaseClient}>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/auth" element={<Auth />} />
              <Route path="/" element={<Index />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </QueryClientProvider>
    </SessionContextProvider>
  );
};

export default App;