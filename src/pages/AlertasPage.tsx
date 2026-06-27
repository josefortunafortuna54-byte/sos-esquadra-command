import { useEffect, useState } from "react";
import { AlertTriangle, Clock, RefreshCw, CheckCircle, Filter, ArrowRight, MapPin, Phone, User } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { fetchOccurrences, updateStatus, subscribeToOccurrences, type Occurrence } from "@/lib/alertsApi";
import DashboardSidebar from "@/components/DashboardSidebar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

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

const nextStatus: Record<string, Occurrence["status"] | null> = {
  Pendente: "Despachado",
  Despachado: "A caminho",
  "A caminho": "No local",
  "No local": "Finalizado",
  Finalizado: null,
};

function timeAgo(dateStr?: string): string {
  if (!dateStr) return "";
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (diff < 60) return `${diff}s`;
  if (diff < 3600) return `${Math.floor(diff / 60)}min`;
  return `${Math.floor(diff / 3600)}h`;
}

const filtros = ["Todos", "Pendente", "Despachado", "A caminho", "No local", "Finalizado"] as const;

export default function AlertasPage() {
  const [occurrences, setOccurrences] = useState<Occurrence[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filtro, setFiltro] = useState<string>("Todos");
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

  const filtered = filtro === "Todos"
    ? occurrences
    : occurrences.filter(o => o.status === filtro);

  const counts = {
    Pendente: occurrences.filter(o => o.status === "Pendente").length,
    Despachado: occurrences.filter(o => o.status === "Despachado").length,
    "A caminho": occurrences.filter(o => o.status === "A caminho").length,
    "No local": occurrences.filter(o => o.status === "No local").length,
    Finalizado: occurrences.filter(o => o.status === "Finalizado").length,
  };

  return (
    <div className="min-h-screen bg-background">
      <DashboardSidebar />
      <main className="ml-64 p-6">
        <header className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-foreground flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-destructive" />
              Alertas de Emergência
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {occurrences.length} ocorrências · {counts.Pendente} pendentes
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={load} className="gap-2">
            <RefreshCw className="w-3 h-3" />Actualizar
          </Button>
        </header>

        {/* Stats */}
        <div className="grid grid-cols-5 gap-3 mb-6">
          {Object.entries(counts).map(([status, count]) => (
            <div
              key={status}
              className={`glass-panel rounded-lg p-3 text-center cursor-pointer transition-all ${filtro === status ? "ring-2 ring-primary" : ""}`}
              onClick={() => setFiltro(status === "Todos" ? "Todos" : status === "Todos" ? "Todos" : filtro === status ? "Todos" : status)}
            >
              <p className="text-2xl font-bold text-foreground">{count}</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{status}</p>
            </div>
          ))}
        </div>

        {/* Filtros */}
        <div className="flex gap-2 mb-4 flex-wrap">
          {filtros.map(f => (
            <button
              key={f}
              onClick={() => setFiltro(f)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                filtro === f
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-muted-foreground hover:text-foreground"
              }`}
            >
              {f}
              {f !== "Todos" && (
                <span className="ml-1.5 opacity-60">({counts[f as keyof typeof counts]})</span>
              )}
            </button>
          ))}
        </div>

        {/* Lista */}
        <div className="space-y-3">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {[1,2,3,4].map(i => <div key={i} className="h-28 glass-panel rounded-lg animate-pulse" />)}
            </div>
          ) : error ? (
            <div className="text-center py-20">
              <AlertTriangle className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-30" />
              <p className="text-sm text-muted-foreground">{error}</p>
              <button onClick={load} className="mt-2 text-xs text-primary hover:underline">Tentar novamente</button>
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-20">
              <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3 opacity-50" />
              <p className="text-sm text-muted-foreground">Nenhuma ocorrência {filtro !== "Todos" ? `com status "${filtro}"` : ""}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <AnimatePresence>
                {filtered.map((oc, i) => (
                  <motion.div
                    key={oc.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.03 }}
                    className={`rounded-lg p-4 border-l-4 ${statusStyles[oc.status] ?? ""} border border-border/50`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Badge className={badgeStyles[oc.status]}>{oc.status}</Badge>
                        <span className="text-[11px] text-muted-foreground font-mono">{oc.id.slice(0, 8)}</span>
                      </div>
                      <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                        <Clock className="w-3 h-3" />{timeAgo(oc.createdAt)}
                      </span>
                    </div>
                    <p className="font-semibold text-foreground text-sm mb-2">{oc.type}</p>
                    <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                      <span className="flex items-center gap-1"><User className="w-3 h-3" />{oc.name}</span>
                      {oc.phone && <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{oc.phone}</span>}
                      <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{oc.latitude.toFixed(4)}, {oc.longitude.toFixed(4)}</span>
                    </div>
                    {nextStatus[oc.status] && (
                      <div className="mt-3 flex justify-end">
                        <button
                          onClick={() => handleAdvance(oc.id, oc.status)}
                          disabled={updating === oc.id}
                          className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-md bg-secondary hover:bg-secondary/80 text-foreground transition-colors disabled:opacity-50"
                        >
                          {updating === oc.id ? "A actualizar..." : <>
                            <ArrowRight className="w-3 h-3" />{nextStatus[oc.status]}
                          </>}
                        </button>
                      </div>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
