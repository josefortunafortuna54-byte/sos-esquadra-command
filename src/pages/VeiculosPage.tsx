import { useEffect, useState } from "react";
import { Car, Search, AlertTriangle, CheckCircle, Clock } from "lucide-react";
import DashboardSidebar from "@/components/DashboardSidebar";
import { supabase } from "@/lib/supabase";

interface Veiculo {
  id: string;
  marca: string;
  modelo: string;
  matricula: string;
  cor: string;
  local_furto: string;
  status: "Procurado" | "Confirmado" | "Recuperado";
  created_at: string;
}

const statusStyle: Record<string, string> = {
  Procurado:   "bg-red-500/20 text-red-400 border border-red-500/30",
  Confirmado:  "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30",
  Recuperado:  "bg-green-500/20 text-green-400 border border-green-500/30",
};

const statusIcon: Record<string, JSX.Element> = {
  Procurado:   <AlertTriangle className="w-3 h-3" />,
  Confirmado:  <Clock className="w-3 h-3" />,
  Recuperado:  <CheckCircle className="w-3 h-3" />,
};

export default function VeiculosPage() {
  const [veiculos, setVeiculos] = useState<Veiculo[]>([]);
  const [loading, setLoading] = useState(true);
  const [pesquisa, setPesquisa] = useState("");

  const carregar = async () => {
    const { data } = await supabase
      .from("stolen_vehicles")
      .select("*")
      .order("created_at", { ascending: false });
    setVeiculos((data ?? []) as Veiculo[]);
    setLoading(false);
  };

  const actualizarStatus = async (id: string, status: Veiculo["status"]) => {
    await supabase.from("stolen_vehicles").update({ status }).eq("id", id);
    setVeiculos(prev => prev.map(v => v.id === id ? { ...v, status } : v));
  };

  useEffect(() => {
    carregar();
    const ch = supabase.channel("veiculos")
      .on("postgres_changes", { event: "*", schema: "public", table: "stolen_vehicles" }, carregar)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  const filtrados = veiculos.filter(v =>
    `${v.marca} ${v.modelo} ${v.matricula} ${v.local_furto}`.toLowerCase()
      .includes(pesquisa.toLowerCase())
  );

  const total      = veiculos.length;
  const procurados = veiculos.filter(v => v.status === "Procurado").length;
  const recuperados = veiculos.filter(v => v.status === "Recuperado").length;

  return (
    <div className="min-h-screen bg-background">
      <DashboardSidebar />
      <main className="ml-64 p-6">
        <h1 className="text-xl font-bold text-foreground mb-1">Veículos Furtados</h1>
        <p className="text-sm text-muted-foreground mb-6">Registo e rastreamento de viaturas</p>

        {/* Contadores */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          {[
            { label: "TOTAL", value: total, color: "text-foreground" },
            { label: "PROCURADOS", value: procurados, color: "text-red-400" },
            { label: "RECUPERADOS", value: recuperados, color: "text-green-400" },
          ].map(s => (
            <div key={s.label} className="glass-panel rounded-lg p-4 text-center">
              <p className={`text-3xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Pesquisa */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            className="w-full max-w-md pl-9 pr-4 py-2 rounded-lg bg-secondary border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
            placeholder="Pesquisar matrícula, marca..."
            value={pesquisa}
            onChange={e => setPesquisa(e.target.value)}
          />
        </div>

        {/* Tabela */}
        <div className="glass-panel rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/50">
                {["Viatura", "Matrícula", "Cor", "Local", "Data", "Estado", "Acção"].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs text-muted-foreground font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="text-center py-8 text-muted-foreground">A carregar...</td></tr>
              ) : filtrados.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-8 text-muted-foreground">Sem veículos registados</td></tr>
              ) : filtrados.map(v => (
                <tr key={v.id} className="border-b border-border/30 hover:bg-white/5 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Car className="w-4 h-4 text-muted-foreground" />
                      <span className="text-foreground">{v.marca} {v.modelo}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-primary font-mono text-xs">{v.matricula}</td>
                  <td className="px-4 py-3 text-muted-foreground">{v.cor}</td>
                  <td className="px-4 py-3 text-muted-foreground">{v.local_furto}</td>
                  <td className="px-4 py-3 text-muted-foreground text-xs">
                    {new Date(v.created_at).toLocaleDateString('pt-PT', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full ${statusStyle[v.status]}`}>
                      {statusIcon[v.status]} {v.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={v.status}
                      onChange={e => actualizarStatus(v.id, e.target.value as Veiculo["status"])}
                      className="text-xs bg-secondary border border-border rounded px-2 py-1 text-foreground"
                    >
                      <option value="Procurado">Procurado</option>
                      <option value="Confirmado">Confirmado</option>
                      <option value="Recuperado">Recuperado</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
