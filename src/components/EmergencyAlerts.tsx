import { AlertTriangle, Clock } from "lucide-react";
import { motion } from "framer-motion";

const alerts = [
  {
    id: 1,
    type: "URGENTE",
    message: "Assalto à mão armada — Rua da Missão, Ingombota",
    time: "há 3 min",
    severity: "high" as const,
  },
  {
    id: 2,
    type: "ALERTA",
    message: "Acidente de viação — Rotunda do Largo 1º de Maio",
    time: "há 12 min",
    severity: "medium" as const,
  },
  {
    id: 3,
    type: "URGENTE",
    message: "Furto de viatura — Toyota Hilux, Matrícula LD-42-91-AB",
    time: "há 18 min",
    severity: "high" as const,
  },
  {
    id: 4,
    type: "INFO",
    message: "Manifestação pacífica — Largo das Heroínas",
    time: "há 25 min",
    severity: "low" as const,
  },
  {
    id: 5,
    type: "ALERTA",
    message: "Distúrbio público — Mercado do Roque Santeiro",
    time: "há 34 min",
    severity: "medium" as const,
  },
];

const severityStyles = {
  high: "border-l-destructive bg-destructive/5",
  medium: "border-l-warning bg-warning/5",
  low: "border-l-primary bg-primary/5",
};

const badgeStyles = {
  high: "bg-destructive/20 text-destructive",
  medium: "bg-warning/20 text-warning",
  low: "bg-primary/20 text-primary",
};

const EmergencyAlerts = () => (
  <div className="glass-panel rounded-lg p-5">
    <div className="flex items-center gap-2 mb-4">
      <AlertTriangle className="w-4 h-4 text-destructive animate-pulse-glow" />
      <h3 className="font-semibold text-foreground text-sm">Alertas de Emergência</h3>
    </div>
    <div className="space-y-2 max-h-[360px] overflow-y-auto">
      {alerts.map((alert, i) => (
        <motion.div
          key={alert.id}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.08 }}
          className={`border-l-2 rounded-r-md p-3 ${severityStyles[alert.severity]}`}
        >
          <div className="flex items-center justify-between mb-1">
            <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${badgeStyles[alert.severity]}`}>
              {alert.type}
            </span>
            <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
              <Clock className="w-3 h-3" />
              {alert.time}
            </span>
          </div>
          <p className="text-xs text-foreground/90">{alert.message}</p>
        </motion.div>
      ))}
    </div>
  </div>
);

export default EmergencyAlerts;
