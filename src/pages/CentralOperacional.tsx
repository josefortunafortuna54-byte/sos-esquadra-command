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
  Shield,
  Siren,
  User,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import DashboardSidebar from "@/components/DashboardSidebar";
import { fetchAlerts, updateAlertStatus, type Alert } from "@/lib/alertsApi";
import { toast } from "@/components/ui/sonner";

/* ── Helpers ────────────────────────────────── */

const createAlertIcon = (status: string) => {
  const color =
    status === "pendente" ? "#ef4444" : status === "em atendimento" ? "#f59e0b" : "#22c55e";
  const pulse = status === "pendente" ? "animation:pulse-dot 1.5s infinite;" : "";
  return L.divIcon({
    html: `<div style="width:16px;height:16px;border-radius:50%;background:${color};border:2px solid rgba(255,255,255,0.9);box-shadow:0 0 14px ${color}99;${pulse}"></div>`,
    className: "",
    iconSize: [16, 16],
    iconAnchor: [8, 8],
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
    osc.frequency.setValueAtTime(660, ctx.currentTime + 0.45);
    gain.gain.setValueAtTime(0.25, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.6);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.6);
  } catch {
    // audio not available
  }
};

const useLiveClock = () => {
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);
  return time;
};

/* ── Stat Card ──────────────────────────────── */

const StatCard = ({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: React.ElementType;
  label: string;
  value: number;
  color: string;
}) => (
  <div className="glass-panel rounded-lg px-4 py-3 flex items-center gap-3 min-w-[140px]">
    <div className={`p-2 rounded-md ${color}`}>
      <Icon className="w-4 h-4" />
    </div>
    <div>
      <p className="text-xl font-bold text-foreground leading-none">{value}</p>
      <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-0.5">{label}</p>
    </div>
  </div>
);

/* ── Main Component ─────────────────────────── */

const CentralOperacional = () => {
  const navigate = useNavigate();
  const clock = useLiveClock();
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [flashIds, setFlashIds] = useState<Set<string>>(new Set());
  const prevCountRef = useRef(0);
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<L.Map | null>(null);
  const markersRef = useRef<L.LayerGroup | null>(null);

  useEffect(() => {
    if (!localStorage.getItem("sos-auth")) navigate("/");
  }, [navigate]);

  /* ── Map init ── */
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

  /* ── Update markers ── */
  const updateMarkers = useCallback((alertList: Alert[]) => {
    if (!markersRef.current || !mapInstance.current) return;
    markersRef.current.clearLayers();
    alertList.forEach((alert) => {
      const marker = L.marker([alert.latitude, alert.longitude], {
        icon: createAlertIcon(alert.status),
      });
      marker.bindPopup(
        `<div style="font-family:Inter;font-size:12px;color:#e2e8f0;background:#0f172a;padding:12px;border-radius:8px;border:1px solid #1e3a5f;min-width:180px;">
          <strong style="font-size:13px;">${alert.name}</strong><br/>
          <span style="color:${alert.status === "pendente" ? "#ef4444" : alert.status === "em atendimento" ? "#f59e0b" : "#22c55e"};font-size:11px;text-transform:uppercase;font-weight:700;letter-spacing:0.5px;">● ${alert.status}</span><br/>
          ${alert.phone ? `<span style="color:#94a3b8;font-size:10px;">📞 ${alert.phone}</span><br/>` : ""}
          ${alert.createdAt ? `<span style="color:#64748b;font-size:10px;">🕐 ${new Date(alert.createdAt).toLocaleTimeString("pt-AO")}</span>` : ""}
        </div>`,
        { className: "custom-popup" }
      );
      markersRef.current!.addLayer(marker);
    });

    const pending = alertList.find((a) => a.status === "pendente");
    if (pending) {
      mapInstance.current.setView([pending.latitude, pending.longitude], 14, { animate: true });
    }
  }, []);

  /* ── Polling ── */
  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const data = await fetchAlerts();
        if (!active) return;

        if (prevCountRef.current > 0 && data.length > prevCountRef.current) {
          playAlertSound();
          const newIds = data.slice(0, data.length - prevCountRef.current).map((a) => a.id);
          setFlashIds(new Set(newIds));
          setTimeout(() => setFlashIds(new Set()), 3000);
          toast("🚨 Nova ocorrência recebida!", {
            description: "Um novo alerta de emergência chegou ao sistema.",
          });
        }
        prevCountRef.current = data.length;
        setAlerts(data);
        setApiError(false);
        updateMarkers(data);
        setLoading(false);
      } catch {
        if (active) {
          setLoading(false);
          setApiError(true);
        }
      }
    };
    load();
    const interval = setInterval(load, 5000);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [updateMarkers]);

  /* ── Actions ── */
  const handleStatusUpdate = async (id: string, newStatus: string) => {
    setProcessingId(id);
    try {
      await updateAlertStatus(id, newStatus);
      setAlerts((prev) => prev.map((a) => (a.id === id ? { ...a, status: newStatus } : a)));
      updateMarkers(alerts.map((a) => (a.id === id ? { ...a, status: newStatus } : a)));
      toast(
        newStatus === "em atendimento" ? "Ocorrência em atendimento" : "Ocorrência concluída",
        { description: `Alerta #${id.slice(-6)} actualizado.` }
      );
    } catch {
      toast("Erro ao actualizar", { description: "Tente novamente." });
    }
    setProcessingId(null);
  };

  /* ── Stats ── */
  const pendingCount = alerts.filter((a) => a.status === "pendente").length;
  const attendingCount = alerts.filter((a) => a.status === "em atendimento").length;
  const concludedCount = alerts.filter((a) => a.status === "concluído" || a.status === "concluido").length;

  const statusColor = (s: string) =>
    s === "pendente"
      ? "text-destructive"
      : s === "em atendimento"
      ? "text-warning"
      : "text-success";

  const statusBg = (s: string) =>
    s === "pendente"
      ? "bg-destructive/20 text-destructive"
      : s === "em atendimento"
      ? "bg-warning/20 text-warning"
      : "bg-success/20 text-success";

  const cardBorder = (s: string) =>
    s === "pendente"
      ? "border-destructive/40 bg-destructive/5"
      : s === "em atendimento"
      ? "border-warning/30 bg-warning/5"
      : "border-success/30 bg-success/5";

  return (
    <div className="min-h-screen bg-background">
      <DashboardSidebar />
      <main className="ml-64 flex flex-col h-screen">
        {/* ── TOP HEADER ── */}
        <header className="px-6 py-4 border-b border-border flex items-center justify-between flex-shrink-0 bg-card/50 backdrop-blur-sm">
          <div className="flex items-center gap-4">
            <div className="p-2 rounded-lg bg-primary/10">
              <Shield className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-foreground tracking-wider flex items-center gap-2">
                SOS ESQUADRA
                <span className="text-muted-foreground font-normal">—</span>
                <span className="text-primary">CENTRAL OPERACIONAL</span>
              </h1>
              <p className="text-[11px] text-muted-foreground tracking-wide">
                Monitorização de ocorrências em tempo real — Luanda, Angola
              </p>
            </div>
          </div>

          <div className="flex items-center gap-5">
            {/* Clock */}
            <div className="glass-panel rounded-lg px-4 py-2 flex items-center gap-2">
              <Clock className="w-3.5 h-3.5 text-primary" />
              <span className="text-sm font-mono font-semibold text-foreground">
                {clock.toLocaleTimeString("pt-AO", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
              </span>
            </div>
            {/* Online indicator */}
            <div className="flex items-center gap-2 glass-panel rounded-lg px-4 py-2">
              <Activity className="w-3.5 h-3.5 text-success animate-pulse" />
              <span className="text-xs font-semibold text-success">Sistema Online</span>
            </div>
          </div>
        </header>

        {/* ── STATS BAR ── */}
        <div className="px-6 py-3 flex items-center gap-3 flex-shrink-0 border-b border-border/50">
          <StatCard icon={Siren} label="Total SOS" value={alerts.length} color="bg-primary/15 text-primary" />
          <StatCard icon={AlertTriangle} label="Pendentes" value={pendingCount} color="bg-destructive/15 text-destructive" />
          <StatCard icon={Radio} label="Em Atendimento" value={attendingCount} color="bg-warning/15 text-warning" />
          <StatCard icon={CheckCircle} label="Concluídas" value={concludedCount} color="bg-success/15 text-success" />
        </div>

        {/* ── CONTENT ── */}
        <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-12 gap-0">
          {/* Alert List - 35% */}
          <div className="lg:col-span-5 flex flex-col border-r border-border overflow-hidden">
            <div className="flex items-center gap-2 px-5 py-3 border-b border-border flex-shrink-0 bg-card/30">
              <Siren className="w-4 h-4 text-destructive animate-pulse" />
              <h3 className="font-bold text-foreground text-sm tracking-wide">OCORRÊNCIAS</h3>
              <Badge variant="destructive" className="ml-auto text-[10px] font-bold">
                {alerts.length} TOTAL
              </Badge>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {loading ? (
                <div className="flex flex-col items-center justify-center h-40 text-muted-foreground text-sm gap-2">
                  <Radio className="w-5 h-5 animate-spin" />
                  A carregar ocorrências...
                </div>
              ) : apiError ? (
                <div className="flex flex-col items-center justify-center h-40 text-muted-foreground text-sm gap-2">
                  <AlertTriangle className="w-8 h-8 text-warning opacity-60" />
                  <p>API indisponível. A tentar reconectar...</p>
                  <p className="text-[10px] text-muted-foreground/60">O servidor pode estar a iniciar (Render free tier).</p>
                </div>
              ) : alerts.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-40 text-muted-foreground text-sm gap-2">
                  <Shield className="w-8 h-8 opacity-30" />
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
                      transition={{ delay: i * 0.02 }}
                      className={`rounded-lg border p-4 transition-all ${cardBorder(alert.status)} ${
                        flashIds.has(alert.id) ? "animate-pulse ring-2 ring-destructive" : ""
                      }`}
                    >
                      {/* Status & ID */}
                      <div className="flex items-center justify-between mb-2">
                        <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-sm tracking-wider ${statusBg(alert.status)}`}>
                          {alert.status}
                        </span>
                        <span className="text-[10px] text-muted-foreground font-mono">
                          #{alert.id.slice(-6)}
                        </span>
                      </div>

                      {/* Name */}
                      <div className="flex items-center gap-2 mb-2">
                        <User className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                        <p className="text-sm font-semibold text-foreground truncate">
                          {alert.name}
                        </p>
                      </div>

                      {/* Details */}
                      <div className="space-y-1 mb-3">
                        {alert.phone && (
                          <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                            <Phone className="w-3 h-3" />
                            <span>{alert.phone}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                          <MapPin className="w-3 h-3" />
                          <span>{alert.latitude.toFixed(4)}, {alert.longitude.toFixed(4)}</span>
                        </div>
                        {alert.createdAt && (
                          <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                            <Clock className="w-3 h-3" />
                            <span>{new Date(alert.createdAt).toLocaleTimeString("pt-AO", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}</span>
                          </div>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2">
                        {alert.status === "pendente" && (
                          <Button
                            size="sm"
                            variant="destructive"
                            className="flex-1 h-8 text-xs font-bold tracking-wide"
                            disabled={processingId === alert.id}
                            onClick={() => handleStatusUpdate(alert.id, "em atendimento")}
                          >
                            {processingId === alert.id ? "A processar..." : (
                              <><Phone className="w-3 h-3 mr-1" />ATENDER</>
                            )}
                          </Button>
                        )}
                        {alert.status === "em atendimento" && (
                          <Button
                            size="sm"
                            className="flex-1 h-8 text-xs font-bold tracking-wide bg-success hover:bg-success/90 text-success-foreground"
                            disabled={processingId === alert.id}
                            onClick={() => handleStatusUpdate(alert.id, "concluído")}
                          >
                            {processingId === alert.id ? "A processar..." : (
                              <><CheckCircle className="w-3 h-3 mr-1" />CONCLUIR</>
                            )}
                          </Button>
                        )}
                        {alert.status === "concluído" && (
                          <div className="flex items-center gap-1.5 text-[11px] text-success font-semibold">
                            <CheckCircle className="w-3.5 h-3.5" />
                            Ocorrência concluída
                          </div>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              )}
            </div>
          </div>

          {/* Map - 65% */}
          <div className="lg:col-span-7 flex flex-col overflow-hidden">
            <div className="flex items-center gap-2 px-5 py-3 border-b border-border flex-shrink-0 bg-card/30">
              <MapPin className="w-4 h-4 text-primary" />
              <h3 className="font-bold text-foreground text-sm tracking-wide">
                MAPA EM TEMPO REAL — LUANDA
              </h3>
              <div className="ml-auto flex items-center gap-4 text-[10px]">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-destructive animate-pulse" /> Pendente
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-warning" /> Em atendimento
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-success" /> Concluída
                </span>
              </div>
            </div>
            <div ref={mapRef} className="flex-1 min-h-[400px]" />
          </div>
        </div>
      </main>

      {/* Pulse animation for markers */}
      <style>{`
        @keyframes pulse-dot {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.4); opacity: 0.7; }
        }
      `}</style>
    </div>
  );
};

export default CentralOperacional;
