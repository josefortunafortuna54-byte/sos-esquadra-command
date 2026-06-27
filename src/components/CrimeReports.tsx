import { useEffect, useState } from "react";
import { FileText, Clock } from "lucide-react";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabase";

interface ReportRow {
  id: string;
  tipo: string;
  status: string;
  latitude: number;
  longitude: number;
  created_at: string;
  users: { nome: string } | null;
}

const statusStyles: Record<string, string> = {
  Pendente: "bg-red-500/20 text-red-400",
  Despachado: "bg-blue-500/20 text-blue-400",
  "A caminho": "bg-orange-500/20 text-orange-400",
  "No local": "bg-purple-500/20 text-purple-400",
  Finalizado: "bg-green-500/20 text-green-400",
};

function timeAgo(dateStr: string): string {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (diff < 60) return `${diff}s`;
  if (diff < 3600) return `${Math.floor(diff / 60)}min`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  return `${Math.floor(diff / 86400)}d`;
}

const CrimeReports = () => {
  const [reports, setReports] = useState<ReportRow[]>([]);
  const [loading, setLoading] = useState(true);

  const carregar = async () => {
    const { data } = await supabase
      .from("occurrences")
      .select("id, tipo, status, latitude, longitude, created_at, users(nome)")
      .order("created_at", { ascending: false })
      .limit(10);
    setReports((data ?? []) as ReportRow[]);
    setLoading(false);
  };

  useEffect(() => {
    carregar();
    const ch = supabase.channel("crime-reports")
      .on("postgres_changes", { event: "*", schema: "public", table: "occurrences" }, carregar)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  return (
    <div className="glass-panel rounded-lg p-5">
      <div className="flex items-center gap-2 mb-4">
        <FileText className="w-4 h-4 text-primary" />
        <h3 className="font-semibold text-foreground text-sm">Ocorrências Recentes</h3>
        {loading && <span className="text-[10px] text-muted-foreground">A carregar...</span>}
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left py-2 text-muted-foreground font-medium">Tipo</th>
              <th className="text-left py-2 text-muted-foreground font-medium">Cidadão</th>
              <th className="text-left py-2 text-muted-foreground font-medium">Estado</th>
              <th className="text-left py-2 text-muted-foreground font-medium">Data</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={4} className="py-8 text-center text-muted-foreground">A carregar...</td></tr>
            ) : reports.length === 0 ? (
              <tr><td colSpan={4} className="py-8 text-center text-muted-foreground">Nenhuma ocorrência registada</td></tr>
            ) : (
              reports.map((r, i) => (
                <motion.tr
                  key={r.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.06 }}
                  className="border-b border-border/50 hover:bg-secondary/50 transition-colors"
                >
                  <td className="py-2.5 font-medium text-foreground">{r.tipo}</td>
                  <td className="py-2.5 text-muted-foreground">{r.users?.nome ?? "Desconhecido"}</td>
                  <td className="py-2.5">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${statusStyles[r.status] ?? ""}`}>
                      {r.status}
                    </span>
                  </td>
                  <td className="py-2.5 text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />{timeAgo(r.created_at)}
                    </span>
                  </td>
                </motion.tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {reports.length > 0 && (
        <p className="text-[10px] text-muted-foreground text-center mt-3 pt-3 border-t border-border/30">
          ⚡ {reports.length} ocorrências mais recentes · tempo real via Supabase
        </p>
      )}
    </div>
  );
};

export default CrimeReports;
