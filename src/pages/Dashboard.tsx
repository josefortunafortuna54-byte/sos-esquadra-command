import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Shield, AlertTriangle, Users, Car, FileText, Activity } from "lucide-react";
import DashboardSidebar from "@/components/DashboardSidebar";
import StatsCard from "@/components/StatsCard";
import LiveMap from "@/components/LiveMap";
import EmergencyAlerts from "@/components/EmergencyAlerts";
import CrimeReports from "@/components/CrimeReports";
import { supabase } from "@/lib/supabase";

interface Stats {
  agentesActivos: number;
  alertasHoje: number;
  ocorrenciasMes: number;
  pendentes: number;
}

const Dashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<Stats>({
    agentesActivos: 0,
    alertasHoje: 0,
    ocorrenciasMes: 0,
    pendentes: 0,
  });

  useEffect(() => {
    if (!localStorage.getItem("sos-auth")) {
      navigate("/");
    }
  }, [navigate]);

  useEffect(() => {
    carregarStats();

    // Actualizar stats em tempo real
    const channel = supabase
      .channel("dashboard-stats")
      .on("postgres_changes", { event: "*", schema: "public", table: "occurrences" }, carregarStats)
      .on("postgres_changes", { event: "*", schema: "public", table: "agent_locations" }, carregarStats)
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const carregarStats = async () => {
    try {
      // Agentes com GPS activo (actualizado nos últimos 30 min)
      const trintaMinAtras = new Date(Date.now() - 30 * 60 * 1000).toISOString();
      const { count: agentes } = await supabase
        .from("agent_locations")
        .select("*", { count: "exact", head: true })
        .gte("updated_at", trintaMinAtras);

      // Alertas de hoje
      const hoje = new Date();
      hoje.setHours(0, 0, 0, 0);
      const { count: alertasHoje } = await supabase
        .from("occurrences")
        .select("*", { count: "exact", head: true })
        .gte("created_at", hoje.toISOString());

      // Ocorrências deste mês
      const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1).toISOString();
      const { count: ocorrenciasMes } = await supabase
        .from("occurrences")
        .select("*", { count: "exact", head: true })
        .gte("created_at", inicioMes);

      // Pendentes
      const { count: pendentes } = await supabase
        .from("occurrences")
        .select("*", { count: "exact", head: true })
        .eq("status", "Pendente");

      setStats({
        agentesActivos: agentes ?? 0,
        alertasHoje: alertasHoje ?? 0,
        ocorrenciasMes: ocorrenciasMes ?? 0,
        pendentes: pendentes ?? 0,
      });
    } catch (e) {
      console.error("Erro ao carregar stats:", e);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <DashboardSidebar />
      <main className="ml-64 p-6">
        <header className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-foreground">Painel de Comando</h1>
            <p className="text-sm text-muted-foreground">Visão geral do sistema — Luanda, Angola</p>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground font-mono">
            <Activity className="w-3 h-3 text-success animate-pulse-glow" />
            SISTEMA OPERACIONAL
          </div>
        </header>

        {/* Stats reais do Supabase */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <StatsCard
            title="Agentes Activos"
            value={stats.agentesActivos}
            icon={Users}
            change="Com GPS activo (30min)"
            variant="default"
          />
          <StatsCard
            title="Alertas Hoje"
            value={stats.alertasHoje}
            icon={AlertTriangle}
            change={`${stats.pendentes} pendentes`}
            variant="danger"
          />
          <StatsCard
            title="Ocorrências"
            value={stats.ocorrenciasMes}
            icon={FileText}
            change="Este mês"
            variant="warning"
          />
          <StatsCard
            title="Pendentes"
            value={stats.pendentes}
            icon={Shield}
            change="Aguardam despacho"
            variant={stats.pendentes > 0 ? "danger" : "success"}
          />
        </div>

        {/* Mapa + Alertas */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
          <div className="lg:col-span-2">
            <LiveMap />
          </div>
          <div>
            <EmergencyAlerts />
          </div>
        </div>

        {/* Relatórios */}
        <CrimeReports />
      </main>
    </div>
  );
};

export default Dashboard;
