import { NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  MapPin,
  AlertTriangle,
  FileText,
  Car,
  Users,
  Bell,
  Settings,
  LogOut,
  Radio,
} from "lucide-react";
import sosLogo from "@/assets/sos-logo.png";

const links = [
  { to: "/dashboard", icon: LayoutDashboard, label: "Painel" },
  { to: "/dashboard/central", icon: Radio, label: "Central Operacional" },
  { to: "/dashboard/mapa", icon: MapPin, label: "Mapa ao Vivo" },
  { to: "/dashboard/alertas", icon: AlertTriangle, label: "Alertas" },
  { to: "/dashboard/crimes", icon: FileText, label: "Ocorrências" },
  { to: "/dashboard/veiculos", icon: Car, label: "Veículos" },
  { to: "/dashboard/agentes", icon: Users, label: "Agentes" },
  { to: "/dashboard/notificacoes", icon: Bell, label: "Notificações" },
  { to: "/dashboard/config", icon: Settings, label: "Configurações" },
];

const DashboardSidebar = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("sos-auth");
    navigate("/");
  };

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-sidebar border-r border-sidebar-border flex flex-col z-50">
      <div className="p-6 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <img src={sosLogo} alt="SOS Esquadra" className="w-14 h-14 object-contain" />
          <div>
            <h2 className="font-bold text-foreground text-sm tracking-wide">
              SOS ESQUADRA
            </h2>
            <p className="text-xs text-muted-foreground">Comando Central</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            end={link.to === "/dashboard"}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors ${
                isActive
                  ? "bg-primary/15 text-primary"
                  : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              }`
            }
          >
            <link.icon className="w-4 h-4" />
            {link.label}
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t border-sidebar-border">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium text-destructive hover:bg-destructive/10 w-full transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Terminar Sessão
        </button>
      </div>
    </aside>
  );
};

export default DashboardSidebar;
