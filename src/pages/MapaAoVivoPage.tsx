import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { MapPin, Users, Car, Maximize, Minimize, Activity } from "lucide-react";
import DashboardSidebar from "@/components/DashboardSidebar";
import { supabase } from "@/lib/supabase";
import { Badge } from "@/components/ui/badge";

interface AgentMarker {
  id: string;
  name: string;
  lat: number;
  lng: number;
  status: string;
  updatedAt: string;
}

interface OccMarker {
  id: string;
  tipo: string;
  status: string;
  lat: number;
  lng: number;
  nome: string;
}

const createAgentIcon = (status: string) => {
  const color = "#3b82f6";
  return L.divIcon({
    html: `<div style="width:14px;height:14px;border-radius:50%;background:${color};border:2px solid rgba(255,255,255,0.9);box-shadow:0 0 12px ${color}99;display:flex;align-items:center;justify-content:center;"><div style="width:6px;height:6px;border-radius:50%;background:white;"></div></div>`,
    className: "",
    iconSize: [14, 14],
    iconAnchor: [7, 7],
  });
};

const createOccIcon = (status: string) => {
  const color = status === "Pendente" ? "#ef4444" : status === "Finalizado" ? "#22c55e" : "#f59e0b";
  return L.divIcon({
    html: `<div style="width:18px;height:18px;border-radius:50%;background:${color};border:2px solid rgba(255,255,255,0.9);box-shadow:0 0 14px ${color}99;animation:${status === "Pendente" ? "pulse-map 1.5s infinite" : "none"}"></div>`,
    className: "",
    iconSize: [18, 18],
    iconAnchor: [9, 9],
  });
};

export default function MapaAoVivoPage() {
  const navigate = useNavigate();
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<L.Map | null>(null);
  const agentLayer = useRef<L.LayerGroup | null>(null);
  const occLayer = useRef<L.LayerGroup | null>(null);
  const [fullscreen, setFullscreen] = useState(false);
  const [agents, setAgents] = useState<AgentMarker[]>([]);
  const [occs, setOccs] = useState<OccMarker[]>([]);

  useEffect(() => {
    if (!localStorage.getItem("sos-auth")) navigate("/");
  }, [navigate]);

  useEffect(() => {
    if (!mapRef.current || mapInstance.current) return;

    const map = L.map(mapRef.current, {
      center: [-8.839, 13.255],
      zoom: 12,
      zoomControl: true,
      attributionControl: false,
    });

    L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png").addTo(map);
    agentLayer.current = L.layerGroup().addTo(map);
    occLayer.current = L.layerGroup().addTo(map);

    mapInstance.current = map;

    const handleResize = () => map.invalidateSize();
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      map.remove();
      mapInstance.current = null;
    };
  }, []);

  // Load agents
  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from("agent_locations")
        .select("*, police_agents(nome, codigo)")
        .gt("updated_at", new Date(Date.now() - 30 * 60000).toISOString());

      if (!data) return;
      const mapped = data.map((a: any) => ({
        id: a.agent_id,
        name: a.police_agents?.nome ?? a.police_agents?.codigo ?? "Agente",
        lat: a.latitude,
        lng: a.longitude,
        status: "patrulha",
        updatedAt: a.updated_at,
      }));
      setAgents(mapped);
    };
    load();
    const interval = setInterval(load, 10000);
    return () => clearInterval(interval);
  }, []);

  // Load occurrences
  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from("occurrences")
        .select("*, users(nome)")
        .neq("status", "Finalizado")
        .order("created_at", { ascending: false })
        .limit(50);

      if (!data) return;
      const mapped = data.map((o: any) => ({
        id: o.id,
        tipo: o.tipo ?? "Emergência",
        status: o.status ?? "Pendente",
        lat: o.latitude ?? -8.839,
        lng: o.longitude ?? 13.2894,
        nome: o.users?.nome ?? "Desconhecido",
      }));
      setOccs(mapped);
    };
    load();
    const interval = setInterval(load, 15000);
    return () => clearInterval(interval);
  }, []);

  // Update markers on map
  useEffect(() => {
    if (!mapInstance.current) return;
    agentLayer.current?.clearLayers();
    occLayer.current?.clearLayers();

    agents.forEach((a) => {
      const marker = L.marker([a.lat, a.lng], { icon: createAgentIcon(a.status) })
        .bindPopup(
          `<div style="font-family:Inter;font-size:12px;color:#e2e8f0;background:#0f172a;padding:8px;border-radius:6px;border:1px solid #334155;min-width:150px;">
            <strong style="color:#3b82f6;">🚓 ${a.name}</strong><br/>
            <span style="color:#94a3b8;">🕐 ${new Date(a.updatedAt).toLocaleTimeString("pt-AO")}</span>
          </div>`,
          { className: "custom-popup" }
        );
      agentLayer.current?.addLayer(marker);
    });

    occs.forEach((o) => {
      const marker = L.marker([o.lat, o.lng], { icon: createOccIcon(o.status) })
        .bindPopup(
          `<div style="font-family:Inter;font-size:12px;color:#e2e8f0;background:#0f172a;padding:8px;border-radius:6px;border:1px solid #334155;min-width:150px;">
            <strong>${o.tipo}</strong><br/>
            <span style="color:${o.status === "Pendente" ? "#ef4444" : o.status === "Finalizado" ? "#22c55e" : "#f59e0b"};font-weight:bold;">● ${o.status}</span><br/>
            <span style="color:#94a3b8;">👤 ${o.nome}</span>
          </div>`,
          { className: "custom-popup" }
        );
      occLayer.current?.addLayer(marker);
    });
  }, [agents, occs]);

  const toggleFullscreen = () => {
    setFullscreen(!fullscreen);
    setTimeout(() => mapInstance.current?.invalidateSize(), 200);
  };

  return (
    <div className={`min-h-screen bg-background ${fullscreen ? "fixed inset-0 z-50" : ""}`}>
      <DashboardSidebar />
      <main className={`${fullscreen ? "ml-0" : "ml-64"} h-screen flex flex-col`}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-3 border-b border-border bg-card/50 flex-shrink-0">
          <div className="flex items-center gap-4">
            <div className="p-2 rounded-lg bg-primary/10">
              <MapPin className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-foreground tracking-wide">Mapa ao Vivo</h1>
              <p className="text-[11px] text-muted-foreground">Luanda, Angola — {agents.length} agentes activos</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3 text-[10px]">
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-destructive" /> Pendente</span>
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-warning" /> Em curso</span>
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-blue-500" /> Agente</span>
            </div>
            <Badge variant="outline" className="gap-1 text-[10px]">
              <Activity className="w-3 h-3 text-success" />
              {agents.length} agentes · {occs.length} ocorrências
            </Badge>
            <button
              onClick={toggleFullscreen}
              className="p-2 rounded-md hover:bg-card transition-colors"
              title={fullscreen ? "Sair de tela cheia" : "Tela cheia"}
            >
              {fullscreen ? <Minimize className="w-4 h-4 text-muted-foreground" /> : <Maximize className="w-4 h-4 text-muted-foreground" />}
            </button>
          </div>
        </div>

        {/* Map - takes full remaining height */}
        <div ref={mapRef} className="flex-1 min-h-0 w-full" />

        {/* Legend overlay */}
        <div className="absolute bottom-6 left-72 bg-card/90 backdrop-blur-sm border border-border rounded-lg p-3 text-[11px] space-y-1.5">
          <p className="text-xs font-semibold text-foreground mb-1 flex items-center gap-2">
            <MapPin className="w-3 h-3 text-primary" /> Legenda
          </p>
          <p className="flex items-center gap-2 text-muted-foreground">
            <span className="w-3 h-3 rounded-full bg-destructive" /> Ocorrência pendente
          </p>
          <p className="flex items-center gap-2 text-muted-foreground">
            <span className="w-3 h-3 rounded-full bg-warning" /> Em atendimento
          </p>
          <p className="flex items-center gap-2 text-muted-foreground">
            <span className="w-3 h-3 rounded-full bg-blue-500" /> Agente em patrulha
          </p>
          <p className="flex items-center gap-2 text-muted-foreground">
            <span className="w-3 h-3 rounded-full bg-green-500" /> Concluída
          </p>
        </div>
      </main>
      <style>{`
        @keyframes pulse-map {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.5); opacity: 0.7; }
        }
      `}</style>
    </div>
  );
}
