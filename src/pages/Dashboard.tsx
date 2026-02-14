import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Shield, AlertTriangle, Users, Car, FileText, Activity } from "lucide-react";
import DashboardSidebar from "@/components/DashboardSidebar";
import StatsCard from "@/components/StatsCard";
import LiveMap from "@/components/LiveMap";
import EmergencyAlerts from "@/components/EmergencyAlerts";
import CrimeReports from "@/components/CrimeReports";

const Dashboard = () => {
  const navigate = useNavigate();

  useEffect(() => {
    if (!localStorage.getItem("sos-auth")) {
      navigate("/");
    }
  }, [navigate]);

  return (
    <div className="min-h-screen bg-background">
      <DashboardSidebar />
      <main className="ml-64 p-6">
        <header className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-foreground">
              Painel de Comando
            </h1>
            <p className="text-sm text-muted-foreground">
              Visão geral do sistema — Luanda, Angola
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground font-mono">
            <Activity className="w-3 h-3 text-success animate-pulse-glow" />
            SISTEMA OPERACIONAL
          </div>
        </header>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <StatsCard
            title="Agentes Activos"
            value={42}
            icon={Users}
            change="+3 desde ontem"
            variant="default"
          />
          <StatsCard
            title="Alertas Hoje"
            value={17}
            icon={AlertTriangle}
            change="5 urgentes"
            variant="danger"
          />
          <StatsCard
            title="Ocorrências"
            value={128}
            icon={FileText}
            change="Este mês"
            variant="warning"
          />
          <StatsCard
            title="Veículos Furtados"
            value={8}
            icon={Car}
            change="3 recuperados"
            variant="success"
          />
        </div>

        {/* Map + Alerts */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
          <div className="lg:col-span-2">
            <LiveMap />
          </div>
          <div>
            <EmergencyAlerts />
          </div>
        </div>

        {/* Crime Reports */}
        <CrimeReports />
      </main>
    </div>
  );
};

export default Dashboard;
