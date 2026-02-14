import { FileText } from "lucide-react";
import { motion } from "framer-motion";

const reports = [
  { id: "OC-2024-1847", type: "Roubo", location: "Maianga", status: "Em investigação", date: "10/02/2026" },
  { id: "OC-2024-1846", type: "Agressão", location: "Sambizanga", status: "Resolvido", date: "10/02/2026" },
  { id: "OC-2024-1845", type: "Furto", location: "Rangel", status: "Pendente", date: "09/02/2026" },
  { id: "OC-2024-1844", type: "Vandalismo", location: "Cazenga", status: "Em investigação", date: "09/02/2026" },
  { id: "OC-2024-1843", type: "Fraude", location: "Viana", status: "Pendente", date: "08/02/2026" },
];

const statusStyles: Record<string, string> = {
  "Em investigação": "bg-warning/20 text-warning",
  Resolvido: "bg-success/20 text-success",
  Pendente: "bg-muted text-muted-foreground",
};

const CrimeReports = () => (
  <div className="glass-panel rounded-lg p-5">
    <div className="flex items-center gap-2 mb-4">
      <FileText className="w-4 h-4 text-primary" />
      <h3 className="font-semibold text-foreground text-sm">Ocorrências Recentes</h3>
    </div>
    <div className="overflow-x-auto">
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b border-border">
            <th className="text-left py-2 text-muted-foreground font-medium">Ref.</th>
            <th className="text-left py-2 text-muted-foreground font-medium">Tipo</th>
            <th className="text-left py-2 text-muted-foreground font-medium">Local</th>
            <th className="text-left py-2 text-muted-foreground font-medium">Estado</th>
            <th className="text-left py-2 text-muted-foreground font-medium">Data</th>
          </tr>
        </thead>
        <tbody>
          {reports.map((r, i) => (
            <motion.tr
              key={r.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: i * 0.06 }}
              className="border-b border-border/50 hover:bg-secondary/50 transition-colors"
            >
              <td className="py-2.5 font-mono text-primary">{r.id}</td>
              <td className="py-2.5 text-foreground">{r.type}</td>
              <td className="py-2.5 text-foreground">{r.location}</td>
              <td className="py-2.5">
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${statusStyles[r.status]}`}>
                  {r.status}
                </span>
              </td>
              <td className="py-2.5 text-muted-foreground">{r.date}</td>
            </motion.tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

export default CrimeReports;
