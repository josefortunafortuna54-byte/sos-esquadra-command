import { useEffect, useRef, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import {
  AlertTriangle,
  Activity,
  MapPin,
  Phone,
  Clock,
  CheckCircle,
  Radio,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import DashboardSidebar from "@/components/DashboardSidebar";
import { fetchAlerts, attendAlert, type Alert } from "@/lib/alertsApi";
import { toast } from "@/components/ui/sonner";

const createAlertIcon = (status: string) => {
  const color = status === "pendente" ? "#ef4444" : "#22c55e";
  return L.divIcon({
    html: `<div style="width:14px;height:14px;border-radius:50%;background:${color};border:2px solid rgba(255,255,255,0.9);box-shadow:0 0 12px ${color}80;"></div>`,
    className: "",
    iconSize: [14, 14],
    iconAnchor: [7, 7],
  });
};

const playAlertSound = () => {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = "square";
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    osc.frequency.setValueAtTime(660, ctx.currentTime + 0.15);
    osc.frequency.setValueAtTime(880, ctx.currentTime + 0.3);
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.5);
  } catch {
    // audio not available
  }
};

const CentralOperacional = () => {
  const navigate = useNavigate();
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [attending, setAttending] = useState<string | null>(null);
  const prevCountRef = useRef(0);
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<L.Map | null>(null);
  const markersRef = useRef<L.LayerGroup | null>(null);

  useEffect(() => {
    if (!localStorage.getItem("sos-auth")) {
      navigate("/");
    }
  }, [navigate]);

  // Initialize map
  useEffect(() => {
    if (!mapRef.current || mapInstance.current) return;
    const map = L.map(mapRef.current, {
      center: [-8.839, 13.255],
      zoom: 13,
      zoomControl: false,
      attributionControl: false,
    });
    L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png").addTo(map);
    L.control.zoom({ position: "bottomright" }).addTo(map);
    markersRef.current = L.layerGroup().addTo(map);
    mapInstance.current = map;

    return () => {
      map.remove();
      mapInstance.current = null;
    };
  }, []);

  // Update markers
  const updateMarkers = useCallback((alertList: Alert[]) => {
    if (!markersRef.current || !mapInstance.current) return;
    markersRef.current.clearLayers();
    alertList.forEach((alert) => {
      const marker = L.marker([alert.latitude, alert.longitude], {
        icon: createAlertIcon(alert.status),
      });
      marker.bindPopup(
        `<div style="font-family:Inter;font-size:12px;color:#e2e8f0;background:#1e293b;padding:10px;border-radius:8px;border:1px solid #334155;min-width:160px;">
          <strong>${alert.name}</strong><br/>
          <span style="color:${alert.status === "pendente" ? "#ef4444" : "#22c55e"};font-size:11px;text-transform:uppercase;font-weight:600;">● ${alert.status}</span><br/>
          <span style="color:#94a3b8;font-size:10px;">ID: ${alert.id}</span>
        </div>`,
        { className: "custom-popup" }
      );
      markersRef.current!.addLayer(marker);
    });

    // Center on newest pending alert
    const pending = alertList.find((a) => a.status === "pendente");
    if (pending) {
      mapInstance.current.setView([pending.latitude, pending.longitude], 14, { animate: true });
    }
  }, []);

  // Fetch alerts loop
  useEffect(() => {
    let active = true;

    const load = async () => {
      try {
        const data = await fetchAlerts();
        if (!active) return;
        
        // Sound on new alerts
        if (prevCountRef.current > 0 && data.length > prevCountRef.current) {
          playAlertSound();
          toast("Nova ocorrência recebida!", {
            description: "Um novo alerta de emergência chegou.",
          });
        }
        prevCountRef.current = data.length;

        setAlerts(data);
        updateMarkers(data);
        setLoading(false);
      } catch {
        if (active) setLoading(false);
      }
    };

    load();
    const interval = setInterval(load, 5000);
    return () => { active = false; clearInterval(interval); };
  }, [updateMarkers]);

  const handleAttend = async (id: string) => {
    setAttending(id);
    try {
      await attendAlert(id);
      setAlerts((prev) =>
        prev.map((a) => (a.id === id ? { ...a, status: "em atendimento" } : a))
      );
      toast("Ocorrência em atendimento", {
        description: `Alerta ${id.slice(-6)} marcado como em atendimento.`,
      });
    } catch {
      toast("Erro ao atender", { description: "Tente novamente." });
    }
    setAttending(null);
  };

  const pendingCount = alerts.filter((a) => a.status === "pendente").length;
  const attendingCount = alerts.filter((a) => a.status === "em atendimento").length;

  return (
    <div className="min-h-screen bg-background">
      <DashboardSidebar />
      <main className="ml-64 p-6 flex flex-col h-screen">
        {/* Header */}
        <header className="mb-4 flex items-center justify-between flex-shrink-0">
          <div>
            <h1 className="text-lg font-bold text-foreground tracking-wide">
              SOS ESQUADRA — CENTRAL OPERACIONAL
            </h1>
            <p className="text-xs text-muted-foreground">
              Monitorização de ocorrências em tempo real — Luanda, Angola
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-xs font-mono">
              <span className="flex items-center gap-1.5 text-success">
                <Activity className="w-3 h-3 animate-pulse" />
                Sistema Online
              </span>
            </div>
            <div className="flex gap-3">
              <div className="glass-panel rounded-md px-3 py-1.5 flex items-center gap-2">
                <AlertTriangle className="w-3.5 h-3.5 text-destructive" />
                <span className="text-xs font-semibold text-destructive">{pendingCount}</span>
                <span className="text-[10px] text-muted-foreground">Pendentes</span>
              </div>
              <div className="glass-panel rounded-md px-3 py-1.5 flex items-center gap-2">
                <CheckCircle className="w-3.5 h-3.5 text-success" />
                <span className="text-xs font-semibold text-success">{attendingCount}</span>
                <span className="text-[10px] text-muted-foreground">Em atendimento</span>
              </div>
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 flex-1 min-h-0">
          {/* Alert List */}
          <div className="lg:col-span-2 glass-panel rounded-lg flex flex-col overflow-hidden">
            <div className="flex items-center gap-2 p-4 border-b border-border flex-shrink-0">
              <Radio className="w-4 h-4 text-destructive animate-pulse" />
              <h3 className="font-semibold text-foreground text-sm">Ocorrências</h3>
              <Badge variant="destructive" className="ml-auto text-[10px]">
                {alerts.length} total
              </Badge>
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {loading ? (
                <div className="flex items-center justify-center h-32 text-muted-foreground text-sm">
                  A carregar alertas...
                </div>
              ) : alerts.length === 0 ? (
                <div className="flex items-center justify-center h-32 text-muted-foreground text-sm">
                  Nenhuma ocorrência registada.
                </div>
              ) : (
                <AnimatePresence>
                  {alerts.map((alert, i) => (
                    <motion.div
                      key={alert.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      transition={{ delay: i * 0.03 }}
                      className={`rounded-lg border p-3 transition-colors ${
                        alert.status === "pendente"
                          ? "border-destructive/40 bg-destructive/5"
                          : "border-success/30 bg-success/5"
                      }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span
                              className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${
                                alert.status === "pendente"
                                  ? "bg-destructive/20 text-destructive"
                                  : "bg-success/20 text-success"
                              }`}
                            >
                              {alert.status}
                            </span>
                            <span className="text-[10px] text-muted-foreground font-mono">
                              #{alert.id.slice(-6)}
                            </span>
                          </div>
                          <p className="text-sm font-medium text-foreground truncate">
                            {alert.name}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 text-[10px] text-muted-foreground mb-2">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {alert.latitude.toFixed(4)}, {alert.longitude.toFixed(4)}
                        </span>
                        {alert.createdAt && (
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {new Date(alert.createdAt).toLocaleTimeString("pt-AO")}
                          </span>
                        )}
                      </div>
                      {alert.status === "pendente" && (
                        <Button
                          size="sm"
                          className="w-full h-7 text-xs font-bold bg-primary hover:bg-primary/90"
                          disabled={attending === alert.id}
                          onClick={() => handleAttend(alert.id)}
                        >
                          {attending === alert.id ? (
                            "A processar..."
                          ) : (
                            <>
                              <Phone className="w-3 h-3 mr-1" />
                              ATENDER
                            </>
                          )}
                        </Button>
                      )}
                    </motion.div>
                  ))}
                </AnimatePresence>
              )}
            </div>
          </div>

          {/* Map */}
          <div className="lg:col-span-3 glass-panel rounded-lg overflow-hidden flex flex-col">
            <div className="flex items-center gap-2 p-4 border-b border-border flex-shrink-0">
              <MapPin className="w-4 h-4 text-primary" />
              <h3 className="font-semibold text-foreground text-sm">
                Mapa em Tempo Real — Luanda
              </h3>
              <div className="ml-auto flex items-center gap-3 text-[10px]">
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-destructive" /> Pendente
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-success" /> Em atendimento
                </span>
              </div>
            </div>
            <div ref={mapRef} className="flex-1 min-h-[400px]" />
          </div>
        </div>
      </main>
    </div>
  );
};

export default CentralOperacional;
