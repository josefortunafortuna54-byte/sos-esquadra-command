import { useEffect, useState } from "react";
import { AlertTriangle, Clock, RefreshCw, CheckCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { fetchOccurrences, updateStatus, subscribeToOccurrences, type Occurrence } from "@/lib/alertsApi";

const statusStyles: Record<string, string> = {
  Pendente: "border-l-red-500 bg-red-500/5",
  Despachado: "border-l-blue-500 bg-blue-500/5",
  "A caminho": "border-l-orange-500 bg-orange-500/5",
  "No local": "border-l-purple-500 bg-purple-500/5",
  Finalizado: "border-l-green-500 bg-green-500/5",
};

const badgeStyles: Record<string, string> = {
  Pendente: "bg-red-500/20 text-red-400",
  Despachado: "bg-blue-500/20 text-blue-400",
  "A caminho": "bg-orange-500/20 text-orange-400",
  "No local": "bg-purple-500/20 text-purple-400",
  Finalizado: "bg-green-500/20 text-green-400",
};

function timeAgo(dateStr?: string): string {
  if (!dateStr) return "";
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (diff < 60) return `há ${diff}s`;
  if (diff < 3600) return `há ${Math.floor(diff / 60)}min`;
  return `há ${Math.floor(diff / 3600)}h`;
}

const nextStatus: Record<string, Occurrence["status"] | null> = {
  Pendente: "Despachado",
  Despachado: "A caminho",
  "A caminho": "No local",
  "No local": "Finalizado",
  Finalizado: null,
};

const EmergencyAlerts = () => {
  const [occurrences, setOccurrences] = useState<Occurrence[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState<string | null>(null);

  const load = async () => {
    try {
      const data = await fetchOccurrences();
      setOccurrences(data);
      setError(null);
    } catch {
      setError("Sem ligação ao Supabase");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // Realtime — receber actualizações instantâneas
    const unsubscribe = subscribeToOccurrences(setOccurrences);
    return unsubscribe;
  }, []);

  const handleAdvance = async (id: string, status: Occurrence["status"]) => {
    const next = nextStatus[status];
    if (!next) return;
    setUpdating(id);
    try {
      await updateStatus(id, next);
    } finally {
      setUpdating(null);
    }
  };

  return (
    <div className="glass-panel rounded-lg p-5 h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-destructive animate-pulse" />
          <h3 className="font-semibold text-foreground text-sm">Alertas de Emergência</h3>
          {occurrences.filter((o) => o.status === "Pendente").length > 0 && (
            <span className="bg-destructive text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
              {occurrences.filter((o) => o.status === "Pendente").length}
            </span>
          )}
        </div>
        <button onClick={load} className="text-muted-foreground hover:text-foreground transition-colors">
          <RefreshCw className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto space-y-2 min-h-0 max-h-[360px]">
        {loading ? (
          <div className="flex flex-col gap-2">
            {[1, 2, 3].map((i) => <div key={i} className="h-16 bg-white/5 rounded animate-pulse" />)}
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center h-32 text-center">
            <AlertTriangle className="w-8 h-8 text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">{error}</p>
            <button onClick={load} className="mt-2 text-xs text-primary hover:underline">Tentar novamente</button>
          </div>
        ) : occurrences.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-center">
            <CheckCircle className="w-8 h-8 text-green-500 mb-2" />
            <p className="text-sm text-muted-foreground">Sem ocorrências activas</p>
          </div>
        ) : (
          <AnimatePresence>
            {occurrences.map((oc, i) => (
              <motion.div
                key={oc.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ delay: i * 0.05 }}
                className={`border-l-2 rounded-r-md p-3 ${statusStyles[oc.status] ?? "border-l-gray-500 bg-gray-500/5"}`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${badgeStyles[oc.status] ?? ""}`}>
                    {oc.status}
                  </span>
                  <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                    <Clock className="w-3 h-3" />{timeAgo(oc.createdAt)}
                  </span>
                </div>
                <p className="text-xs text-foreground/90 font-medium">{oc.type}</p>
                <p className="text-[10px] text-muted-foreground">{oc.userName}</p>
                {nextStatus[oc.status] && (
                  <button
                    onClick={() => handleAdvance(oc.id, oc.status)}
                    disabled={updating === oc.id}
                    className="mt-2 text-[10px] px-2 py-0.5 rounded bg-white/10 hover:bg-white/20 text-foreground/70 hover:text-foreground transition-colors disabled:opacity-50"
                  >
                    {updating === oc.id ? "A actualizar..." : `→ ${nextStatus[oc.status]}`}
                  </button>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>

      <p className="text-[10px] text-muted-foreground text-center mt-3 pt-3 border-t border-border/30">
        ⚡ Tempo real via Supabase
      </p>
    </div>
  );
};

export default EmergencyAlerts;
