import { useEffect, useState } from "react";
import { Bell, Check, AlertTriangle, Info, Shield, Trash2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import DashboardSidebar from "@/components/DashboardSidebar";
import { supabase } from "@/lib/supabase";

interface Notificacao {
  id: string;
  title: string;
  body: string;
  type: string;
  data: any;
  read: boolean;
  created_at: string;
}

const tipoConfig: Record<string, { icon: any; style: string; bg: string }> = {
  urgente: { icon: AlertTriangle, style: "text-destructive", bg: "bg-destructive/10 border-destructive/20" },
  alerta:  { icon: Bell,          style: "text-warning",      bg: "bg-warning/10 border-warning/20" },
  info:    { icon: Info,          style: "text-primary",      bg: "bg-primary/10 border-primary/20" },
  sistema: { icon: Shield,        style: "text-muted-foreground", bg: "bg-muted border-border" },
};

function timeAgo(dateStr: string): string {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (diff < 60) return `${diff}s`;
  if (diff < 3600) return `${Math.floor(diff / 60)}min`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  return `${Math.floor(diff / 86400)}d`;
}

export default function NotificacoesPage() {
  const [notificacoes, setNotificacoes] = useState<Notificacao[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"todas" | "nao_lidas">("todas");

  const userId = supabase.auth.getUser().then(r => r.data.user?.id);

  const carregar = async () => {
    const user = await supabase.auth.getUser();
    if (!user.data.user) return;
    const { data } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", user.data.user.id)
      .order("created_at", { ascending: false })
      .limit(50);
    setNotificacoes((data ?? []) as Notificacao[]);
    setLoading(false);
  };

  useEffect(() => {
    carregar();
    const ch = supabase.channel("notificacoes-page")
      .on("postgres_changes", { event: "*", schema: "public", table: "notifications" }, carregar)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  const markRead = async (id: string) => {
    await supabase.from("notifications").update({ read: true }).eq("id", id);
    setNotificacoes(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const markAllRead = async () => {
    const user = await supabase.auth.getUser();
    if (!user.data.user) return;
    await supabase.from("notifications").update({ read: true }).eq("user_id", user.data.user.id).is("read", false);
    setNotificacoes(prev => prev.map(n => ({ ...n, read: true })));
  };

  const remove = async (id: string) => {
    await supabase.from("notifications").delete().eq("id", id);
    setNotificacoes(prev => prev.filter(n => n.id !== id));
  };

  const displayed = filter === "nao_lidas" ? notificacoes.filter(n => !n.read) : notificacoes;
  const unreadCount = notificacoes.filter(n => !n.read).length;

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
            <p className="text-sm text-muted-foreground">
              {loading ? "A carregar..." : `${notificacoes.length} notificações`}
            </p>
          </div>
          <div className="flex gap-2">
            {unreadCount > 0 && (
              <Button variant="outline" size="sm" onClick={markAllRead} className="border-border text-muted-foreground hover:text-foreground">
                <Check className="w-4 h-4 mr-2" />Marcar todas como lidas
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={carregar} className="gap-2">
              <RefreshCw className="w-3 h-3" />Actualizar
            </Button>
          </div>
        </header>

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
          {loading ? (
            <div className="space-y-2">
              {[1,2,3,4].map(i => <div key={i} className="h-20 glass-panel rounded-lg animate-pulse" />)}
            </div>
          ) : (
            <AnimatePresence>
              {displayed.map((n, i) => {
                const cfg = tipoConfig[n.type] ?? tipoConfig.info;
                const Icon = cfg.icon;
                return (
                  <motion.div
                    key={n.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -50 }}
                    transition={{ delay: i * 0.04 }}
                    className={`glass-panel rounded-lg p-4 flex gap-4 items-start border ${!n.read ? cfg.bg : "border-border/30 opacity-70"}`}
                  >
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${!n.read ? cfg.bg : "bg-muted"}`}>
                      <Icon className={`w-4 h-4 ${!n.read ? cfg.style : "text-muted-foreground"}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <p className={`text-sm font-semibold ${!n.read ? "text-foreground" : "text-muted-foreground"}`}>{n.title}</p>
                        {!n.read && <span className="w-2 h-2 rounded-full bg-primary animate-pulse-glow" />}
                      </div>
                      <p className="text-xs text-muted-foreground mb-1">{n.body}</p>
                      <p className="text-[10px] text-muted-foreground font-mono">{timeAgo(n.created_at)}</p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      {!n.read && (
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
          )}
          {!loading && displayed.length === 0 && (
            <div className="text-center py-12 text-muted-foreground text-sm">
              <Bell className="w-8 h-8 mx-auto mb-2 opacity-30" />
              Sem notificações para mostrar.
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
