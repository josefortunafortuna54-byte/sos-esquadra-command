import { useState } from "react";
import { Bell, Check, AlertTriangle, Info, Shield, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import DashboardSidebar from "@/components/DashboardSidebar";

interface Notification {
  id: number;
  titulo: string;
  mensagem: string;
  tipo: "urgente" | "alerta" | "info" | "sistema";
  tempo: string;
  lida: boolean;
}

const initialNotifications: Notification[] = [
  { id: 1, titulo: "Alerta de Segurança Máxima", mensagem: "Nível de ameaça elevado na zona do Rangel. Todas as unidades devem reforçar patrulhas.", tipo: "urgente", tempo: "há 5 min", lida: false },
  { id: 2, titulo: "Viatura Recuperada", mensagem: "Toyota Land Cruiser LD-55-02-EF recuperada em Viana. Proprietário notificado.", tipo: "info", tempo: "há 20 min", lida: false },
  { id: 3, titulo: "Novo Agente Registado", mensagem: "Agente Luísa Neto foi adicionada ao sistema e destacada para a esquadra da Ingombota.", tipo: "sistema", tempo: "há 1h", lida: false },
  { id: 4, titulo: "Ocorrência Grave", mensagem: "Assalto à mão armada reportado na Rua da Missão. Unidades despachadas.", tipo: "urgente", tempo: "há 2h", lida: true },
  { id: 5, titulo: "Actualização do Sistema", mensagem: "Manutenção programada para as 03:00. O sistema pode ficar indisponível por 15 minutos.", tipo: "sistema", tempo: "há 3h", lida: true },
  { id: 6, titulo: "Manifestação Autorizada", mensagem: "Manifestação pacífica autorizada no Largo das Heroínas entre 10:00 e 14:00.", tipo: "alerta", tempo: "há 4h", lida: true },
  { id: 7, titulo: "Reforço Solicitado", mensagem: "Esquadra do Cazenga solicita reforço de 4 agentes para operação nocturna.", tipo: "alerta", tempo: "há 5h", lida: true },
];

const tipoConfig = {
  urgente: { icon: AlertTriangle, style: "text-destructive", bg: "bg-destructive/10 border-destructive/20" },
  alerta: { icon: Bell, style: "text-warning", bg: "bg-warning/10 border-warning/20" },
  info: { icon: Info, style: "text-primary", bg: "bg-primary/10 border-primary/20" },
  sistema: { icon: Shield, style: "text-muted-foreground", bg: "bg-muted border-border" },
};

const NotificacoesPage = () => {
  const [notifications, setNotifications] = useState(initialNotifications);
  const [filter, setFilter] = useState<"todas" | "nao_lidas">("todas");

  const displayed = filter === "nao_lidas" ? notifications.filter((n) => !n.lida) : notifications;
  const unreadCount = notifications.filter((n) => !n.lida).length;

  const markAllRead = () => setNotifications(notifications.map((n) => ({ ...n, lida: true })));
  const markRead = (id: number) => setNotifications(notifications.map((n) => (n.id === id ? { ...n, lida: true } : n)));
  const remove = (id: number) => setNotifications(notifications.filter((n) => n.id !== id));

  return (
    <div className="min-h-screen bg-background">
      <DashboardSidebar />
      <main className="ml-64 p-6">
        <header className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
              Centro de Notificações
              {unreadCount > 0 && (
                <span className="text-xs bg-destructive/20 text-destructive px-2 py-0.5 rounded-full font-mono">
                  {unreadCount}
                </span>
              )}
            </h1>
            <p className="text-sm text-muted-foreground">Alertas e comunicações do sistema</p>
          </div>
          {unreadCount > 0 && (
            <Button variant="outline" size="sm" onClick={markAllRead} className="border-border text-muted-foreground hover:text-foreground">
              <Check className="w-4 h-4 mr-2" />Marcar todas como lidas
            </Button>
          )}
        </header>

        {/* Filter tabs */}
        <div className="flex gap-2 mb-6">
          {(["todas", "nao_lidas"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                filter === f ? "bg-primary/15 text-primary" : "text-muted-foreground hover:bg-secondary"
              }`}
            >
              {f === "todas" ? "Todas" : `Não lidas (${unreadCount})`}
            </button>
          ))}
        </div>

        <div className="space-y-2 max-w-3xl">
          <AnimatePresence>
            {displayed.map((n, i) => {
              const cfg = tipoConfig[n.tipo];
              const Icon = cfg.icon;
              return (
                <motion.div
                  key={n.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -50 }}
                  transition={{ delay: i * 0.04 }}
                  className={`glass-panel rounded-lg p-4 flex gap-4 items-start border ${!n.lida ? cfg.bg : "border-border/30 opacity-70"}`}
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${!n.lida ? cfg.bg : "bg-muted"}`}>
                    <Icon className={`w-4 h-4 ${!n.lida ? cfg.style : "text-muted-foreground"}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className={`text-sm font-semibold ${!n.lida ? "text-foreground" : "text-muted-foreground"}`}>{n.titulo}</p>
                      {!n.lida && <span className="w-2 h-2 rounded-full bg-primary animate-pulse-glow" />}
                    </div>
                    <p className="text-xs text-muted-foreground mb-1">{n.mensagem}</p>
                    <p className="text-[10px] text-muted-foreground font-mono">{n.tempo}</p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {!n.lida && (
                      <button onClick={() => markRead(n.id)} className="p-1.5 rounded-md hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors" title="Marcar como lida">
                        <Check className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <button onClick={() => remove(n.id)} className="p-1.5 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors" title="Remover">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
          {displayed.length === 0 && (
            <div className="text-center py-12 text-muted-foreground text-sm">
              <Bell className="w-8 h-8 mx-auto mb-2 opacity-30" />
              Sem notificações para mostrar.
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default NotificacoesPage;
