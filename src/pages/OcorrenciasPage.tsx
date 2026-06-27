import { useEffect, useState } from "react";
import { FileText, Search, AlertTriangle, Clock, MapPin, User, Phone, RefreshCw, Filter } from "lucide-react";
import DashboardSidebar from "@/components/DashboardSidebar";
import { supabase } from "@/lib/supabase";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";

interface Ocorrencia {
  id: string;
  tipo: string;
  descricao: string;
  status: string;
  latitude: number;
  longitude: number;
  created_at: string;
  users: { nome: string; telefone: string } | null;
}

const badgeStyles: Record<string, string> = {
  Pendente: "bg-red-500/20 text-red-400 border-red-500/30",
  Despachado: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  "A caminho": "bg-orange-500/20 text-orange-400 border-orange-500/30",
  "No local": "bg-purple-500/20 text-purple-400 border-purple-500/30",
  Finalizado: "bg-green-500/20 text-green-400 border-green-500/30",
};

const statusCores: Record<string, string> = {
  Pendente: "text-red-400",
  Despachado: "text-blue-400",
  "A caminho": "text-orange-400",
  "No local": "text-purple-400",
  Finalizado: "text-green-400",
};

function timeAgo(dateStr?: string): string {
  if (!dateStr) return "";
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (diff < 60) return `${diff}s`;
  if (diff < 3600) return `${Math.floor(diff / 60)}min`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  return `${Math.floor(diff / 86400)}d`;
}

export default function OcorrenciasPage() {
  const [ocorrencias, setOcorrencias] = useState<Ocorrencia[]>([]);
  const [loading, setLoading] = useState(true);
  const [pesquisa, setPesquisa] = useState("");
  const [filtroStatus, setFiltroStatus] = useState("Todos");
  const [expandido, setExpandido] = useState<string | null>(null);

  const carregar = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("occurrences")
      .select("*, users(nome, telefone)")
      .order("created_at", { ascending: false })
      .limit(100);
    setOcorrencias((data ?? []) as Ocorrencia[]);
    setLoading(false);
  };

  useEffect(() => {
    carregar();
    const ch = supabase.channel("ocorrencias-page")
      .on("postgres_changes", { event: "*", schema: "public", table: "occurrences" }, carregar)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  const counts = {
    Todas: ocorrencias.length,
    Pendente: ocorrencias.filter(o => o.status === "Pendente").length,
    Despachado: ocorrencias.filter(o => o.status === "Despachado").length,
    "A caminho": ocorrencias.filter(o => o.status === "A caminho").length,
    "No local": ocorrencias.filter(o => o.status === "No local").length,
    Finalizado: ocorrencias.filter(o => o.status === "Finalizado").length,
  };

  const filtered = ocorrencias.filter(o => {
    const matchStatus = filtroStatus === "Todos" || o.status === filtroStatus;
    const searchLower = pesquisa.toLowerCase();
    const matchSearch = !pesquisa
      || o.tipo.toLowerCase().includes(searchLower)
      || o.descricao.toLowerCase().includes(searchLower)
      || o.users?.nome?.toLowerCase().includes(searchLower)
      || o.id.toLowerCase().includes(searchLower);
    return matchStatus && matchSearch;
  });

  return (
    <div className="min-h-screen bg-background">
      <DashboardSidebar />
      <main className="ml-64 p-6">
        <header className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-foreground flex items-center gap-3">
              <FileText className="w-5 h-5 text-primary" />
              Ocorrências
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {ocorrencias.length} registos · {counts.Pendente} pendentes
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={carregar} className="gap-2">
            <RefreshCw className="w-3 h-3" />Actualizar
          </Button>
        </header>

        {/* Stats bar */}
        <div className="grid grid-cols-6 gap-2 mb-6">
          {Object.entries(counts).map(([status, count]) => (
            <button
              key={status}
              onClick={() => setFiltroStatus(status)}
              className={`glass-panel rounded-lg p-2.5 text-center transition-all cursor-pointer ${
                filtroStatus === status ? "ring-2 ring-primary" : ""
              }`}
            >
              <p className="text-xl font-bold text-foreground">{count}</p>
              <p className="text-[9px] text-muted-foreground uppercase tracking-wider">{status}</p>
            </button>
          ))}
        </div>

        {/* Search + Filter */}
        <div className="flex items-center gap-3 mb-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={pesquisa}
              onChange={e => setPesquisa(e.target.value)}
              placeholder="Pesquisar por tipo, descrição, cidadão, ID..."
              className="pl-10 bg-secondary border-border h-9 text-sm"
            />
          </div>
          <div className="flex gap-1.5">
            {["Todos", "Pendente", "Finalizado"].map(f => (
              <button
                key={f}
                onClick={() => setFiltroStatus(f)}
                className={`px-2.5 py-1.5 rounded-md text-[11px] font-medium transition-all ${
                  filtroStatus === f
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-muted-foreground hover:text-foreground"
                }`}
              >
                <Filter className="w-3 h-3 inline mr-1" />
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="glass-panel rounded-lg border border-border/50 overflow-hidden">
          {loading ? (
            <div className="p-8 space-y-3">
              {[1,2,3,4,5].map(i => <div key={i} className="h-10 bg-white/5 rounded animate-pulse" />)}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16">
              <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-30" />
              <p className="text-sm text-muted-foreground">Nenhuma ocorrência encontrada</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border bg-secondary/50">
                    <th className="text-left py-3 px-4 text-muted-foreground font-medium">ID</th>
                    <th className="text-left py-3 px-4 text-muted-foreground font-medium">Tipo</th>
                    <th className="text-left py-3 px-4 text-muted-foreground font-medium">Cidadão</th>
                    <th className="text-left py-3 px-4 text-muted-foreground font-medium">Status</th>
                    <th className="text-left py-3 px-4 text-muted-foreground font-medium">Localização</th>
                    <th className="text-left py-3 px-4 text-muted-foreground font-medium">Data</th>
                  </tr>
                </thead>
                <tbody>
                  <AnimatePresence>
                    {filtered.map((oc, i) => (
                      <motion.tr
                        key={oc.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: i * 0.02 }}
                        className={`border-b border-border/30 hover:bg-secondary/30 transition-colors cursor-pointer ${
                          expandido === oc.id ? "bg-secondary/40" : ""
                        }`}
                        onClick={() => setExpandido(expandido === oc.id ? null : oc.id)}
                      >
                        <td className="py-3 px-4 font-mono text-primary text-[10px]">{oc.id.slice(0, 8)}</td>
                        <td className="py-3 px-4 font-medium text-foreground">{oc.tipo}</td>
                        <td className="py-3 px-4 text-muted-foreground">
                          <div className="flex items-center gap-1.5">
                            <User className="w-3 h-3" />
                            {oc.users?.nome ?? "Desconhecido"}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <Badge className={badgeStyles[oc.status] ?? ""}>
                            {oc.status}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 text-muted-foreground font-mono text-[10px]">
                          {oc.latitude?.toFixed(4)}, {oc.longitude?.toFixed(4)}
                        </td>
                        <td className="py-3 px-4 text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {timeAgo(oc.created_at)}
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Expanded detail */}
        <AnimatePresence>
          {expandido && (() => {
            const oc = ocorrencias.find(o => o.id === expandido);
            if (!oc) return null;
            return (
              <motion.div
                key={expandido}
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="glass-panel rounded-lg border border-border/50 p-4 mt-3"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="text-sm font-bold text-foreground">{oc.tipo}</h3>
                    <p className="text-[11px] font-mono text-muted-foreground mt-0.5">{oc.id}</p>
                  </div>
                  <Badge className={badgeStyles[oc.status]}>{oc.status}</Badge>
                </div>
                <div className="grid grid-cols-3 gap-4 text-xs">
                  <div>
                    <p className="text-muted-foreground mb-1">Cidadão</p>
                    <p className="text-foreground flex items-center gap-1">
                      <User className="w-3 h-3" /> {oc.users?.nome ?? "N/A"}
                    </p>
                    {oc.users?.telefone && (
                      <p className="text-foreground flex items-center gap-1 mt-0.5">
                        <Phone className="w-3 h-3" /> {oc.users.telefone}
                      </p>
                    )}
                  </div>
                  <div>
                    <p className="text-muted-foreground mb-1">Localização</p>
                    <p className="text-foreground flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {oc.latitude?.toFixed(5)}, {oc.longitude?.toFixed(5)}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground mb-1">Data</p>
                    <p className="text-foreground flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(oc.created_at).toLocaleString("pt-AO")}
                    </p>
                  </div>
                </div>
                {oc.descricao && (
                  <div className="mt-3 pt-3 border-t border-border/30">
                    <p className="text-muted-foreground text-xs mb-1">Descrição</p>
                    <p className="text-foreground text-sm">{oc.descricao}</p>
                  </div>
                )}
              </motion.div>
            );
          })()}
        </AnimatePresence>
      </main>
    </div>
  );
}


