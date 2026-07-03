import { useEffect, useState } from "react";
import { Settings, User, Shield, Database, Activity, Bell, MapPin, RefreshCw, Save, Check } from "lucide-react";
import DashboardSidebar from "@/components/DashboardSidebar";
import { supabase } from "@/lib/supabase";

export default function ConfigPage() {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [nome, setNome] = useState("");
  const [dbStatus, setDbStatus] = useState<"checking" | "ok" | "error">("checking");

  useEffect(() => {
    carregar();
    testarConexao();
  }, []);

  const carregar = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data: agente } = await supabase
      .from("police_agents")
      .select("*")
      .eq("auth_id", user.id)
      .single();
    if (agente) {
      setProfile(agente);
      setNome(agente.nome ?? "");
    }
    setLoading(false);
  };

  const testarConexao = async () => {
    setDbStatus("checking");
    try {
      const { error } = await supabase.from("occurrences").select("id", { count: "exact", head: true });
      setDbStatus(error ? "error" : "ok");
    } catch {
      setDbStatus("error");
    }
  };

  const salvar = async () => {
    if (!profile) return;
    setSaving(true);
    const { error } = await supabase.from("police_agents").update({ nome }).eq("id", profile.id);
    if (!error) {
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
    setSaving(false);
  };

  const handleLogoutAll = async () => {
    await supabase.auth.signOut();
    window.location.href = "/";
  };

  return (
    <div className="min-h-screen bg-background">
      <DashboardSidebar />
      <main className="ml-64 p-6">
        <header className="mb-6">
          <h1 className="text-xl font-bold text-foreground flex items-center gap-3">
            <Settings className="w-5 h-5 text-primary" />
            Configurações
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">Gestão do perfil e sistema</p>
        </header>

        {loading ? (
          <div className="space-y-4 max-w-2xl">
            {[1,2,3].map(i => <div key={i} className="h-24 glass-panel rounded-lg animate-pulse" />)}
          </div>
        ) : (
          <div className="space-y-6 max-w-2xl">
            {/* Perfil */}
            <div className="glass-panel rounded-lg border border-border/50 p-5">
              <h2 className="text-sm font-bold text-foreground flex items-center gap-2 mb-4">
                <User className="w-4 h-4 text-primary" />
                Perfil do Comandante
              </h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[11px] text-muted-foreground block mb-1">Nome</label>
                  <input
                    value={nome}
                    onChange={e => setNome(e.target.value)}
                    className="w-full bg-secondary border border-border rounded-md px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-muted-foreground block mb-1">Email</label>
                  <p className="text-sm text-foreground bg-secondary border border-border rounded-md px-3 py-2">{profile?.email ?? "—"}</p>
                </div>
                <div>
                  <label className="text-[11px] text-muted-foreground block mb-1">Código</label>
                  <p className="text-sm text-foreground font-mono bg-secondary border border-border rounded-md px-3 py-2">{profile?.codigo ?? "—"}</p>
                </div>
                <div>
                  <label className="text-[11px] text-muted-foreground block mb-1">Função</label>
                  <p className="text-sm text-foreground bg-secondary border border-border rounded-md px-3 py-2">{profile?.role ?? "—"}</p>
                </div>
                <div>
                  <label className="text-[11px] text-muted-foreground block mb-1">Esquadra</label>
                  <p className="text-sm text-foreground bg-secondary border border-border rounded-md px-3 py-2">{profile?.esquadra ?? "—"}</p>
                </div>
                <div>
                  <label className="text-[11px] text-muted-foreground block mb-1">Província</label>
                  <p className="text-sm text-foreground bg-secondary border border-border rounded-md px-3 py-2">{profile?.provincia ?? "—"}</p>
                </div>
              </div>
              <div className="mt-4 flex items-center gap-3">
                <button
                  onClick={salvar}
                  disabled={saving}
                  className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
                >
                  {saving ? <><RefreshCw className="w-3 h-3 animate-spin" />A salvar...</> : saved ? <><Check className="w-3 h-3 text-green-400" />Salvo</> : <><Save className="w-3 h-3" />Salvar</>}
                </button>
              </div>
            </div>

            {/* Estado do Sistema */}
            <div className="glass-panel rounded-lg border border-border/50 p-5">
              <h2 className="text-sm font-bold text-foreground flex items-center gap-2 mb-4">
                <Activity className="w-4 h-4 text-primary" />
                Estado do Sistema
              </h2>
              <div className="space-y-3">
                <div className="flex items-center justify-between py-2 border-b border-border/20">
                  <div className="flex items-center gap-2">
                    <Database className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm text-foreground">Supabase</span>
                  </div>
                  <span className={`text-xs font-medium flex items-center gap-1 ${
                    dbStatus === "ok" ? "text-green-400" : dbStatus === "error" ? "text-red-400" : "text-yellow-400"
                  }`}>
                    <span className={`w-2 h-2 rounded-full ${
                      dbStatus === "ok" ? "bg-green-400" : dbStatus === "error" ? "bg-red-400" : "bg-yellow-400"
                    }`} />
                    {dbStatus === "ok" ? "Operacional" : dbStatus === "error" ? "Falha" : "A verificar..."}
                  </span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-border/20">
                  <div className="flex items-center gap-2">
                    <Bell className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm text-foreground">Realtime</span>
                  </div>
                  <span className="text-xs text-green-400 flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-green-400" />Activo
                  </span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm text-foreground">Rastreio GPS</span>
                  </div>
                  <span className="text-xs text-green-400 flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-green-400" />Activo
                  </span>
                </div>
              </div>
              <button onClick={testarConexao} className="mt-3 text-xs text-primary hover:underline flex items-center gap-1">
                <RefreshCw className="w-3 h-3" />Testar ligação
              </button>
            </div>

            {/* Segurança */}
            <div className="glass-panel rounded-lg border border-border/50 p-5">
              <h2 className="text-sm font-bold text-foreground flex items-center gap-2 mb-4">
                <Shield className="w-4 h-4 text-primary" />
                Segurança
              </h2>
              <p className="text-xs text-muted-foreground mb-4">
                Gerir sessões activas e segurança da conta.
              </p>
              <button
                onClick={handleLogoutAll}
                className="inline-flex items-center gap-2 bg-destructive/10 text-destructive border border-destructive/30 px-4 py-2 rounded-md text-sm font-medium hover:bg-destructive/20 transition-colors"
              >
                Terminar todas as sessões
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
