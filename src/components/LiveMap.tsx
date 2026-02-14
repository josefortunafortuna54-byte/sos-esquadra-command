import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { MapPin } from "lucide-react";

const agents = [
  { id: 1, name: "Agente Silva", lat: -8.839, lng: 13.289, status: "Patrulha" },
  { id: 2, name: "Agente Mendes", lat: -8.844, lng: 13.234, status: "Ocorrência" },
  { id: 3, name: "Agente Costa", lat: -8.832, lng: 13.245, status: "Patrulha" },
  { id: 4, name: "Agente Ferreira", lat: -8.851, lng: 13.261, status: "Base" },
  { id: 5, name: "Agente Santos", lat: -8.836, lng: 13.272, status: "Patrulha" },
  { id: 6, name: "Agente Neto", lat: -8.848, lng: 13.253, status: "Ocorrência" },
];

const createAgentIcon = (status: string) => {
  const color = status === "Ocorrência" ? "#ef4444" : status === "Base" ? "#eab308" : "#0080ff";
  return L.divIcon({
    html: `<div style="width:12px;height:12px;border-radius:50%;background:${color};border:2px solid rgba(255,255,255,0.8);box-shadow:0 0 8px ${color}80;"></div>`,
    className: "",
    iconSize: [12, 12],
    iconAnchor: [6, 6],
  });
};

const LiveMap = () => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!mapRef.current || mapInstance.current) return;

    const map = L.map(mapRef.current, {
      center: [-8.839, 13.255],
      zoom: 13,
      zoomControl: false,
      attributionControl: false,
    });

    L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png").addTo(map);

    agents.forEach((agent) => {
      L.marker([agent.lat, agent.lng], { icon: createAgentIcon(agent.status) })
        .addTo(map)
        .bindPopup(
          `<div style="font-family:Inter;font-size:12px;color:#e2e8f0;background:#1e293b;padding:8px;border-radius:6px;border:1px solid #334155;">
            <strong>${agent.name}</strong><br/>
            <span style="color:#94a3b8;">Estado: ${agent.status}</span>
          </div>`,
          { className: "custom-popup" }
        );
    });

    L.control.zoom({ position: "bottomright" }).addTo(map);
    mapInstance.current = map;

    return () => {
      map.remove();
      mapInstance.current = null;
    };
  }, []);

  return (
    <div className="glass-panel rounded-lg overflow-hidden">
      <div className="flex items-center gap-2 p-4 border-b border-border">
        <MapPin className="w-4 h-4 text-primary" />
        <h3 className="font-semibold text-foreground text-sm">Mapa ao Vivo — Luanda</h3>
        <div className="ml-auto flex items-center gap-3 text-[10px]">
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-primary" /> Patrulha</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-destructive" /> Ocorrência</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-warning" /> Base</span>
        </div>
      </div>
      <div ref={mapRef} className="h-[350px] w-full" />
    </div>
  );
};

export default LiveMap;
