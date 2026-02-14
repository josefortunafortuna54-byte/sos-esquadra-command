import { useState } from "react";
import { Car, Search, AlertTriangle, MapPin, Clock, CheckCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { motion } from "framer-motion";
import DashboardSidebar from "@/components/DashboardSidebar";

interface Vehicle {
  id: number;
  marca: string;
  modelo: string;
  matricula: string;
  cor: string;
  local: string;
  data: string;
  estado: "Procurado" | "Recuperado" | "Confirmado";
  proprietario: string;
}

const vehicles: Vehicle[] = [
  { id: 1, marca: "Toyota", modelo: "Hilux", matricula: "LD-42-91-AB", cor: "Branco", local: "Maianga", data: "10/02/2026 08:15", estado: "Procurado", proprietario: "Manuel Domingos" },
  { id: 2, marca: "Hyundai", modelo: "Tucson", matricula: "LD-18-73-CD", cor: "Preto", local: "Talatona", data: "09/02/2026 22:40", estado: "Procurado", proprietario: "Carla Sousa" },
  { id: 3, marca: "Toyota", modelo: "Land Cruiser", matricula: "LD-55-02-EF", cor: "Cinza", local: "Viana", data: "09/02/2026 14:20", estado: "Recuperado", proprietario: "José Baptista" },
  { id: 4, marca: "Kia", modelo: "Sportage", matricula: "LD-33-67-GH", cor: "Azul", local: "Rangel", data: "08/02/2026 19:05", estado: "Confirmado", proprietario: "Ana Fernandes" },
  { id: 5, marca: "Nissan", modelo: "Navara", matricula: "LD-71-48-IJ", cor: "Vermelho", local: "Sambizanga", data: "08/02/2026 06:30", estado: "Procurado", proprietario: "Pedro Lourenço" },
  { id: 6, marca: "Toyota", modelo: "Corolla", matricula: "LD-29-84-KL", cor: "Prata", local: "Cazenga", data: "07/02/2026 11:50", estado: "Recuperado", proprietario: "Maria Gomes" },
];

const estadoConfig: Record<string, { style: string; icon: typeof AlertTriangle }> = {
  Procurado: { style: "bg-destructive/20 text-destructive", icon: AlertTriangle },
  Recuperado: { style: "bg-success/20 text-success", icon: CheckCircle },
  Confirmado: { style: "bg-warning/20 text-warning", icon: Clock },
};

const VeiculosPage = () => {
  const [search, setSearch] = useState("");

  const filtered = vehicles.filter(
    (v) =>
      v.matricula.toLowerCase().includes(search.toLowerCase()) ||
      v.marca.toLowerCase().includes(search.toLowerCase()) ||
      v.modelo.toLowerCase().includes(search.toLowerCase()) ||
      v.proprietario.toLowerCase().includes(search.toLowerCase())
  );

  const stats = {
    total: vehicles.length,
    procurados: vehicles.filter((v) => v.estado === "Procurado").length,
    recuperados: vehicles.filter((v) => v.estado === "Recuperado").length,
  };

  return (
    <div className="min-h-screen bg-background">
      <DashboardSidebar />
      <main className="ml-64 p-6">
        <header className="mb-6">
          <h1 className="text-xl font-bold text-foreground">Veículos Furtados</h1>
          <p className="text-sm text-muted-foreground">Registo e rastreamento de viaturas</p>
        </header>

        {/* Mini stats */}
        <div className="grid grid-cols-3 gap-4 mb-6 max-w-lg">
          <div className="glass-panel rounded-lg p-4 text-center">
            <p className="text-2xl font-bold font-mono text-foreground">{stats.total}</p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Total</p>
          </div>
          <div className="glass-panel rounded-lg p-4 text-center border-destructive/20">
            <p className="text-2xl font-bold font-mono text-destructive">{stats.procurados}</p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Procurados</p>
          </div>
          <div className="glass-panel rounded-lg p-4 text-center border-success/20">
            <p className="text-2xl font-bold font-mono text-success">{stats.recuperados}</p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Recuperados</p>
          </div>
        </div>

        <div className="relative mb-4 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Pesquisar matrícula, marca..." className="pl-10 bg-secondary border-border" />
        </div>

        <div className="glass-panel rounded-lg overflow-hidden">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border bg-secondary/50">
                <th className="text-left py-3 px-4 text-muted-foreground font-medium">Viatura</th>
                <th className="text-left py-3 px-4 text-muted-foreground font-medium">Matrícula</th>
                <th className="text-left py-3 px-4 text-muted-foreground font-medium">Cor</th>
                <th className="text-left py-3 px-4 text-muted-foreground font-medium">Local</th>
                <th className="text-left py-3 px-4 text-muted-foreground font-medium">Proprietário</th>
                <th className="text-left py-3 px-4 text-muted-foreground font-medium">Data</th>
                <th className="text-left py-3 px-4 text-muted-foreground font-medium">Estado</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((v, i) => {
                const cfg = estadoConfig[v.estado];
                return (
                  <motion.tr
                    key={v.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.05 }}
                    className="border-b border-border/50 hover:bg-secondary/30 transition-colors"
                  >
                    <td className="py-3 px-4 text-foreground font-medium">
                      <div className="flex items-center gap-2">
                        <Car className="w-4 h-4 text-muted-foreground" />
                        {v.marca} {v.modelo}
                      </div>
                    </td>
                    <td className="py-3 px-4 font-mono text-primary">{v.matricula}</td>
                    <td className="py-3 px-4 text-foreground">{v.cor}</td>
                    <td className="py-3 px-4 text-foreground">
                      <span className="flex items-center gap-1"><MapPin className="w-3 h-3 text-muted-foreground" />{v.local}</span>
                    </td>
                    <td className="py-3 px-4 text-foreground">{v.proprietario}</td>
                    <td className="py-3 px-4 text-muted-foreground font-mono">{v.data}</td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${cfg.style}`}>
                        <cfg.icon className="w-3 h-3" />
                        {v.estado}
                      </span>
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
};

export default VeiculosPage;
