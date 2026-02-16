import { useEffect, useRef, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet.heat";
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
  Car,
  Navigation,
  Zap,
  Timer,
  Building2,
  Flame,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import DashboardSidebar from "@/components/DashboardSidebar";
import { fetchAlerts, updateAlertStatus, fetchUnits, findClosestAgent, type Alert, type Agent, type DispatchResult } from "@/lib/alertsApi";
import { toast } from "@/components/ui/sonner";

/* ── Police Bases ── */
const POLICE_BASES = [
  { id: "base-1", name: "Comando Provincial de Luanda", lat: -8.8383, lng: 13.2344 },
  { id: "base-2", name: "Esquadra da Maianga", lat: -8.8260, lng: 13.2450 },
  { id: "base-3", name: "Esquadra do Cazenga", lat: -8.8090, lng: 13.2750 },
  { id: "base-4", name: "Esquadra de Viana", lat: -8.8700, lng: 13.3700 },
  { id: "base-5", name: "Esquadra do Rangel", lat: -8.8310, lng: 13.2180 },
];

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

const createVehicleIcon = () => {
  return L.divIcon({
    html: `<div style="width:14px;height:14px;border-radius:50%;background:#3b82f6;border:2px solid rgba(255,255,255,0.9);box-shadow:0 0 12px #3b82f699;"></div>`,
    className: "",
    iconSize: [14, 14],
    iconAnchor: [7, 7],
  });
};

const createBaseIcon = () => {
  return L.divIcon({
    html: `<div style="width:18px;height:18px;border-radius:3px;background:#eab308;border:2px solid rgba(255,255,255,0.9);box-shadow:0 0 10px #eab30866;display:flex;align-items:center;justify-content:center;">
      <div style="width:6px;height:6px;background:white;border-radius:1px;"></div>
    </div>`,
    className: "",
    iconSize: [18, 18],
    iconAnchor: [9, 9],
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
  suffix,
}: {
  icon: React.ElementType;
  label: string;
  value: number | string;
  color: string;
  suffix?: string;
}) => (
  <div className="glass-panel rounded-lg px-4 py-3 flex items-center gap-3 min-w-[140px]">
    <div className={`p-2 rounded-md ${color}`}>
      <Icon className="w-4 h-4" />
    </div>
    <div>
      <p className="text-xl font-bold text-foreground leading-none">
        {value}{suffix && <span className="text-xs font-normal text-muted-foreground ml-0.5">{suffix}</span>}
      </p>
      <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-0.5">{label}</p>
    </div>
  </div>
);

/* ── Main Component ─────────────────────────── */

const CentralOperacional = () => {
  const navigate = useNavigate();
  const clock = useLiveClock();
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [flashIds, setFlashIds] = useState<Set<string>>(new Set());
  const [dispatch, setDispatch] = useState<{ alertId: string; alert: Alert; result: DispatchResult } | null>(null);
  const [dispatchConfirming, setDispatchConfirming] = useState(false);
  const [showHeatmap, setShowHeatmap] = useState(true);
  const prevCountRef = useRef(0);
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<L.Map | null>(null);
  const markersRef = useRef<L.LayerGroup | null>(null);
  const vehicleMarkersRef = useRef<L.LayerGroup | null>(null);
  const vehicleMarkerCache = useRef<Map<string, L.Marker>>(new Map());
  const routeLineRef = useRef<L.Polyline | null>(null);
  const blinkIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const heatLayerRef = useRef<L.Layer | null>(null);

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
    vehicleMarkersRef.current = L.layerGroup().addTo(map);

    // Add police bases
    POLICE_BASES.forEach((base) => {
      L.marker([base.lat, base.lng], { icon: createBaseIcon() })
        .addTo(map)
        .bindPopup(
          `<div style="font-family:Inter;font-size:12px;color:#e2e8f0;background:#0f172a;padding:12px;border-radius:8px;border:1px solid #eab30844;min-width:180px;">
            <strong style="font-size:13px;">🏛️ ${base.name}</strong><br/>
            <span style="color:#eab308;font-size:11px;text-transform:uppercase;font-weight:700;letter-spacing:0.5px;">● BASE POLICIAL</span>
          </div>`,
          { className: "custom-popup" }
        );
    });

    mapInstance.current = map;
    return () => {
      map.remove();
      mapInstance.current = null;
    };
  }, []);

  /* ── Heatmap layer ── */
  const updateHeatmap = useCallback((alertList: Alert[]) => {
    if (!mapInstance.current) return;
    if (heatLayerRef.current) {
      mapInstance.current.removeLayer(heatLayerRef.current);
      heatLayerRef.current = null;
    }
    if (!showHeatmap || alertList.length === 0) return;
    const points: [number, number, number][] = alertList.map((a) => [
      a.latitude,
      a.longitude,
      a.status === "pendente" ? 1.0 : a.status === "em atendimento" ? 0.7 : 0.3,
    ]);
    heatLayerRef.current = (L as any).heatLayer(points, {
      radius: 35,
      blur: 25,
      maxZoom: 17,
      minOpacity: 0.4,
      gradient: { 0.2: "#22c55e", 0.5: "#eab308", 0.8: "#f97316", 1.0: "#ef4444" },
    }).addTo(mapInstance.current);
  }, [showHeatmap]);

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

    updateHeatmap(alertList);

    const pending = alertList.find((a) => a.status === "pendente");
    if (pending) {
      mapInstance.current.setView([pending.latitude, pending.longitude], 14, { animate: true });
    }
  }, [updateHeatmap]);

  /* ── Update vehicle markers (smooth movement) ── */
  const updateVehicleMarkers = useCallback((agentList: Agent[]) => {
    if (!vehicleMarkersRef.current || !mapInstance.current) return;
    const cache = vehicleMarkerCache.current;
    const activeIds = new Set(agentList.map((a) => a.id));

    cache.forEach((marker, id) => {
      if (!activeIds.has(id)) {
        vehicleMarkersRef.current!.removeLayer(marker);
        cache.delete(id);
      }
    });

    agentList.forEach((agent) => {
      const existing = cache.get(agent.id);
      const popupHtml = `<div style="font-family:Inter;font-size:12px;color:#e2e8f0;background:#0f172a;padding:12px;border-radius:8px;border:1px solid #1e3a5f;min-width:180px;">
          <strong style="font-size:13px;">🚓 ${agent.name}</strong><br/>
          <span style="color:#3b82f6;font-size:11px;text-transform:uppercase;font-weight:700;letter-spacing:0.5px;">● ${agent.status || "patrulha"}</span><br/>
          ${agent.updatedAt ? `<span style="color:#64748b;font-size:10px;">🕐 ${new Date(agent.updatedAt).toLocaleTimeString("pt-AO")}</span>` : ""}
        </div>`;

      if (existing) {
        existing.setLatLng([agent.latitude, agent.longitude]);
        existing.setPopupContent(popupHtml);
      } else {
        const marker = L.marker([agent.latitude, agent.longitude], {
          icon: createVehicleIcon(),
        });
        marker.bindPopup(popupHtml, { className: "custom-popup" });
        vehicleMarkersRef.current!.addLayer(marker);
        cache.set(agent.id, marker);
      }
    });
  }, []);

  /* ── Auto-dispatch helper ── */
  const triggerAutoDispatch = useCallback(async (alert: Alert) => {
    const result = await findClosestAgent(alert.latitude, alert.longitude);
    if (!result) return;
    setDispatch({ alertId: alert.id, alert, result });

    if (mapInstance.current) {
      if (routeLineRef.current) {
        mapInstance.current.removeLayer(routeLineRef.current);
      }
      routeLineRef.current = L.polyline(
        [[alert.latitude, alert.longitude], [result.agent.latitude, result.agent.longitude]],
        { color: "#3b82f6", weight: 3, opacity: 0.8, dashArray: "8, 8" }
      ).addTo(mapInstance.current);

      mapInstance.current.fitBounds(
        [[alert.latitude, alert.longitude], [result.agent.latitude, result.agent.longitude]],
        { padding: [60, 60], animate: true }
      );
    }

    if (blinkIntervalRef.current) clearInterval(blinkIntervalRef.current);
    const marker = vehicleMarkerCache.current.get(result.agent.id);
    if (marker) {
      let visible = true;
      blinkIntervalRef.current = setInterval(() => {
        visible = !visible;
        marker.setOpacity(visible ? 1 : 0.2);
      }, 400);
    }

    toast("🚔 Despacho Automático IA", {
      description: `Viatura ${result.agent.name} recomendada — ${result.distance}m`,
    });
  }, []);

  const confirmDispatch = useCallback(async () => {
    if (!dispatch) return;
    setDispatchConfirming(true);
    await handleStatusUpdate(dispatch.alertId, "em atendimento");
    if (routeLineRef.current && mapInstance.current) {
      mapInstance.current.removeLayer(routeLineRef.current);
      routeLineRef.current = null;
    }
    if (blinkIntervalRef.current) {
      clearInterval(blinkIntervalRef.current);
      blinkIntervalRef.current = null;
      const marker = vehicleMarkerCache.current.get(dispatch.result.agent.id);
      if (marker) marker.setOpacity(1);
    }
    toast("✅ Despacho confirmado!", {
      description: `${dispatch.result.agent.name} enviada para ocorrência.`,
    });
    setDispatch(null);
    setDispatchConfirming(false);
  }, [dispatch]);

  const cancelDispatch = useCallback(() => {
    if (routeLineRef.current && mapInstance.current) {
      mapInstance.current.removeLayer(routeLineRef.current);
      routeLineRef.current = null;
    }
    if (blinkIntervalRef.current) {
      clearInterval(blinkIntervalRef.current);
      blinkIntervalRef.current = null;
      if (dispatch) {
        const marker = vehicleMarkerCache.current.get(dispatch.result.agent.id);
        if (marker) marker.setOpacity(1);
      }
    }
    setDispatch(null);
  }, [dispatch]);

  /* ── Polling: Alerts ── */
  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const data = await fetchAlerts();
        if (!active) return;

        if (prevCountRef.current > 0 && data.length > prevCountRef.current) {
          playAlertSound();
          const newAlerts = data.slice(0, data.length - prevCountRef.current);
          const newIds = newAlerts.map((a) => a.id);
          setFlashIds(new Set(newIds));
          setTimeout(() => setFlashIds(new Set()), 3000);
          toast("🚨 Nova ocorrência recebida!", {
            description: "Um novo alerta de emergência chegou ao sistema.",
          });
          const firstPending = newAlerts.find((a) => a.status === "pendente");
          if (firstPending) {
            triggerAutoDispatch(firstPending);
          }
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
  }, [updateMarkers, triggerAutoDispatch]);

  /* ── Polling: Vehicles (2s via /units) ── */
  useEffect(() => {
    let active = true;
    const loadUnits = async () => {
      try {
        const data = await fetchUnits();
        if (!active) return;
        setAgents(data);
        updateVehicleMarkers(data);
      } catch {
        // silently fail
      }
    };
    loadUnits();
    const interval = setInterval(loadUnits, 2000);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [updateVehicleMarkers]);

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
  const activeVehicles = agents.filter((a) => a.status !== "base").length;

  // Average response time (simulated based on timestamps)
  const avgResponseTime = (() => {
    const attending = alerts.filter((a) => a.status === "em atendimento" && a.createdAt);
    if (attending.length === 0) return "—";
    const totalMin = attending.reduce((sum, a) => {
      const elapsed = (Date.now() - new Date(a.createdAt!).getTime()) / 60000;
      return sum + elapsed;
    }, 0);
    const avg = Math.round(totalMin / attending.length);
    return `${avg}`;
  })();

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
                <span className="text-primary">COMANDO NACIONAL</span>
              </h1>
              <p className="text-[11px] text-muted-foreground tracking-wide">
                Centro de Comando e Controlo — Luanda, Angola
              </p>
            </div>
          </div>

          <div className="flex items-center gap-5">
            <div className="glass-panel rounded-lg px-4 py-2 flex items-center gap-2">
              <Clock className="w-3.5 h-3.5 text-primary" />
              <span className="text-sm font-mono font-semibold text-foreground">
                {clock.toLocaleTimeString("pt-AO", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
              </span>
            </div>
            <div className="flex items-center gap-2 glass-panel rounded-lg px-4 py-2">
              <Activity className="w-3.5 h-3.5 text-success animate-pulse" />
              <span className="text-xs font-semibold text-success">Sistema Online</span>
            </div>
          </div>
        </header>

        {/* ── STATS BAR ── */}
        <div className="px-6 py-3 flex items-center gap-3 flex-shrink-0 border-b border-border/50 flex-wrap">
          <StatCard icon={Siren} label="Total SOS" value={alerts.length} color="bg-primary/15 text-primary" />
          <StatCard icon={AlertTriangle} label="Pendentes" value={pendingCount} color="bg-destructive/15 text-destructive" />
          <StatCard icon={Radio} label="Em Atendimento" value={attendingCount} color="bg-warning/15 text-warning" />
          <StatCard icon={CheckCircle} label="Concluídas" value={concludedCount} color="bg-success/15 text-success" />
          <StatCard icon={Car} label="Viaturas Activas" value={activeVehicles} color="bg-blue-500/15 text-blue-400" suffix={`/${agents.length}`} />
          <StatCard icon={Timer} label="Tempo Médio" value={avgResponseTime} color="bg-accent/15 text-accent" suffix="min" />
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

            {/* ── DISPATCH CARD ── */}
            <AnimatePresence>
              {dispatch && (
                <motion.div
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="mx-4 mt-3 rounded-lg border-2 border-blue-500/60 bg-blue-500/10 p-4"
                >
                  <div className="flex items-center gap-2 mb-3">
                    <Zap className="w-4 h-4 text-blue-400" />
                    <span className="text-xs font-bold text-blue-400 uppercase tracking-wider">
                      🚔 Despacho Automático IA
                    </span>
                  </div>
                  <div className="space-y-2 mb-3">
                    <div className="flex items-center gap-2 text-sm text-foreground">
                      <Car className="w-3.5 h-3.5 text-blue-400" />
                      <span className="font-semibold">{dispatch.result.agent.name}</span>
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                      <Navigation className="w-3 h-3" />
                      <span>Distância: <strong className="text-foreground">{dispatch.result.distance}m</strong></span>
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                      <User className="w-3 h-3" />
                      <span>Ocorrência: <strong className="text-foreground">{dispatch.alert.name}</strong></span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      className="flex-1 h-8 text-xs font-bold tracking-wide bg-blue-600 hover:bg-blue-700 text-white"
                      disabled={dispatchConfirming}
                      onClick={confirmDispatch}
                    >
                      {dispatchConfirming ? "A enviar..." : (
                        <><CheckCircle className="w-3 h-3 mr-1" />CONFIRMAR DESPACHO</>
                      )}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 text-xs"
                      onClick={cancelDispatch}
                    >
                      Cancelar
                    </Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
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
                      <div className="flex items-center justify-between mb-2">
                        <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-sm tracking-wider ${statusBg(alert.status)}`}>
                          {alert.status}
                        </span>
                        <span className="text-[10px] text-muted-foreground font-mono">
                          #{alert.id.slice(-6)}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 mb-2">
                        <User className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                        <p className="text-sm font-semibold text-foreground truncate">
                          {alert.name}
                        </p>
                      </div>

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

                      <div className="flex gap-2">
                        {alert.status === "pendente" && (
                          <>
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
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-8 text-xs border-blue-500/40 text-blue-400 hover:bg-blue-500/10"
                              onClick={() => triggerAutoDispatch(alert)}
                            >
                              <Zap className="w-3 h-3 mr-1" />IA
                            </Button>
                          </>
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
                MAPA COMANDO NACIONAL — LUANDA
              </h3>
              <div className="ml-auto flex items-center gap-4 text-[10px]">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-destructive animate-pulse" /> SOS
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-warning" /> Atendimento
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-success" /> Concluída
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-500" /> 🚓 Viatura
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-sm bg-warning" /> 🏛️ Base
                </span>
                <button
                  onClick={() => setShowHeatmap(!showHeatmap)}
                  className={`flex items-center gap-1.5 px-2 py-0.5 rounded transition-colors ${showHeatmap ? "bg-orange-500/20 text-orange-400" : "text-muted-foreground hover:text-foreground"}`}
                >
                  <Flame className="w-3 h-3" /> Heatmap
                </button>
              </div>
            </div>
            <div ref={mapRef} className="flex-1 min-h-[400px]" />
          </div>
        </div>
      </main>

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
