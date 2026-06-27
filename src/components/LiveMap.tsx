import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { MapPin } from "lucide-react";
import { supabase } from "@/lib/supabase";

interface RealAgent {
  agent_id: string;
  nome: string;
  codigo: string;
  latitude: number;
  longitude: number;
  updated_at: string;
}

const createAgentIcon = () => {
  return L.divIcon({
    html: `<div style="width:12px;height:12px;border-radius:50%;background:#0080ff;border:2px solid rgba(255,255,255,0.8);box-shadow:0 0 8px #0080ff80;"></div>`,
    className: "",
    iconSize: [12, 12],
    iconAnchor: [6, 6],
  });
};

const createOccurrenceIcon = (status: string) => {
  const color =
    status === "Pendente" ? "#ef4444" :
    status === "Despachado" ? "#3b82f6" :
    status === "A caminho" ? "#f97316" :
    status === "No local" ? "#a855f7" :
    "#22c55e";
  const size = status === "Pendente" ? 16 : 12;
  return L.divIcon({
    html: `<div style="width:${size}px;height:${size}px;border-radius:50%;background:${color};border:2px solid rgba(255,255,255,0.8);box-shadow:0 0 10px ${color}99;animation:pulse 2s infinite;"></div>`,
    className: "",
    iconSize: [size, size],
    iconAnchor: [size/2, size/2],
  });
};

const LiveMap = () => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<L.Map | null>(null);
  const agentMarkers = useRef<Map<string, L.Marker>>(new Map());
  const occMarkers = useRef<Map<string, L.Marker>>(new Map());
  const [totalAgents, setTotalAgents] = useState(0);
  const [totalOccurrences, setTotalOccurrences] = useState(0);

  useEffect(() => {
    if (!mapRef.current || mapInstance.current) return;

    const map = L.map(mapRef.current, {
      center: [-8.839, 13.255],
      zoom: 12,
      zoomControl: false,
      attributionControl: false,
    });

    L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png").addTo(map);
    L.control.zoom({ position: "bottomright" }).addTo(map);
    mapInstance.current = map;

    const carregarAgentes = async () => {
      const { data } = await supabase
        .from("agent_locations")
        .select("*, police_agents(nome, codigo)")
        .gte("updated_at", new Date(Date.now() - 30 * 60000).toISOString());

      const agents = (data ?? []) as any[];
      setTotalAgents(agents.length);

      const mantidos = new Set<string>();
      agents.forEach((a: any) => {
        mantidos.add(a.agent_id);
        const lat = a.latitude;
        const lng = a.longitude;
        const nome = a.police_agents?.nome ?? a.police_agents?.codigo ?? "Agente";

        if (agentMarkers.current.has(a.agent_id)) {
          agentMarkers.current.get(a.agent_id)!.setLatLng([lat, lng]);
        } else {
          const marker = L.marker([lat, lng], { icon: createAgentIcon() })
            .addTo(map)
            .bindPopup(
              `<div style="font-family:Inter;font-size:12px;color:#e2e8f0;background:#1e293b;padding:8px;border-radius:6px;border:1px solid #334155;">
                <strong>${nome}</strong><br/>
                <span style="color:#94a3b8;">Em patrulha</span>
              </div>`
            );
          agentMarkers.current.set(a.agent_id, marker);
        }
      });

      agentMarkers.current.forEach((marker, id) => {
        if (!mantidos.has(id)) {
          map.removeLayer(marker);
          agentMarkers.current.delete(id);
        }
      });
    };

    const carregarOcorrencias = async () => {
      const { data } = await supabase
        .from("occurrences")
        .select("id, tipo, status, latitude, longitude")
        .neq("status", "Finalizado");

      const ocorrencias = (data ?? []) as any[];
      setTotalOccurrences(ocorrencias.length);

      const mantidos = new Set<string>();
      ocorrencias.forEach((o: any) => {
        mantidos.add(o.id);
        const lat = o.latitude ?? -8.839;
        const lng = o.longitude ?? 13.2894;

        if (occMarkers.current.has(o.id)) {
          occMarkers.current.get(o.id)!.setLatLng([lat, lng]);
        } else {
          const marker = L.marker([lat, lng], { icon: createOccurrenceIcon(o.status) })
            .addTo(map)
            .bindPopup(
              `<div style="font-family:Inter;font-size:12px;color:#e2e8f0;background:#1e293b;padding:8px;border-radius:6px;border:1px solid #334155;">
                <strong>${o.tipo}</strong><br/>
                <span style="color:#94a3b8;">Status: ${o.status}</span>
              </div>`
            );
          occMarkers.current.set(o.id, marker);
        }
      });

      occMarkers.current.forEach((marker, id) => {
        if (!mantidos.has(id)) {
          map.removeLayer(marker);
          occMarkers.current.delete(id);
        }
      });
    };

    carregarAgentes();
    carregarOcorrencias();

    const intAgentes = setInterval(carregarAgentes, 10000);
    const intOcc = setInterval(carregarOcorrencias, 15000);

    const chAgent = supabase.channel("livemap-agents")
      .on("postgres_changes", { event: "*", schema: "public", table: "agent_locations" }, carregarAgentes)
      .subscribe();

    const chOcc = supabase.channel("livemap-occurrences")
      .on("postgres_changes", { event: "*", schema: "public", table: "occurrences" }, carregarOcorrencias)
      .subscribe();

    return () => {
      map.remove();
      mapInstance.current = null;
      clearInterval(intAgentes);
      clearInterval(intOcc);
      supabase.removeChannel(chAgent);
      supabase.removeChannel(chOcc);
    };
  }, []);

  return (
    <div className="glass-panel rounded-lg overflow-hidden">
      <div className="flex items-center gap-2 p-4 border-b border-border">
        <MapPin className="w-4 h-4 text-primary" />
        <h3 className="font-semibold text-foreground text-sm">Mapa ao Vivo — Luanda</h3>
        <div className="ml-auto flex items-center gap-3 text-[10px]">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-blue-500" /> {totalAgents} Agentes
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" /> {totalOccurrences} Activas
          </span>
        </div>
      </div>
      <div ref={mapRef} className="h-[350px] w-full" />
    </div>
  );
};

export default LiveMap;
