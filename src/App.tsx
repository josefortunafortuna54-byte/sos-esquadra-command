import { useEffect } from "react";
import { ThemeProvider } from "next-themes";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useNavigate } from "react-router-dom";
import Index from "./pages/Index";
import { supabase } from "@/lib/supabase";
import Dashboard from "./pages/Dashboard";
import AgentesPage from "./pages/AgentesPage";
import VeiculosPage from "./pages/VeiculosPage";
import NotificacoesPage from "./pages/NotificacoesPage";
import CentralOperacional from "./pages/CentralOperacional";
import RelatoriosPage from "./pages/RelatoriosPage";
import ChatPage from "./pages/ChatPage";
import MapaAoVivoPage from "./pages/MapaAoVivoPage";
import AlertasPage from "./pages/AlertasPage";
import OcorrenciasPage from "./pages/OcorrenciasPage";
import ConfigPage from "./pages/ConfigPage";
import NotFound from "./pages/NotFound";
import { ErrorBoundary } from "@/components/ErrorBoundary";

const queryClient = new QueryClient();

const AuthListener = () => {
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT' || (!session && window.location.pathname !== '/')) {
        window.location.href = '/';
      }
    });
    return () => subscription?.unsubscribe();
  }, []);
  return null;
};

const App = () => (
  <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthListener />
          <ErrorBoundary>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/dashboard/mapa" element={<MapaAoVivoPage />} />
            <Route path="/dashboard/alertas" element={<AlertasPage />} />
            <Route path="/dashboard/crimes" element={<OcorrenciasPage />} />
            <Route path="/dashboard/config" element={<ConfigPage />} />
            <Route path="/dashboard/agentes" element={<AgentesPage />} />
            <Route path="/dashboard/veiculos" element={<VeiculosPage />} />
            <Route path="/dashboard/notificacoes" element={<NotificacoesPage />} />
            <Route path="/dashboard/central" element={<CentralOperacional />} />
            <Route path="/dashboard/relatorios" element={<RelatoriosPage />} />
            <Route path="/dashboard/chat" element={<ChatPage />} />
            <Route path="/dashboard/*" element={<Dashboard />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
          </ErrorBoundary>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ThemeProvider>
);

export default App;
