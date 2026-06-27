import { useState, useEffect } from "react";
import { Users, Plus, Search, Phone, MapPin, BadgeCheck, Copy, Check, Key, Shield, Clock, Activity, AlertTriangle, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion, AnimatePresence } from "framer-motion";
import DashboardSidebar from "@/components/DashboardSidebar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/lib/supabase";

interface Agente {
  id: string;
  auth_id: string;
  nome: string;
  codigo: string;
  patente: string;
  esquadra: string;
  provincia: string;
  role: string;
  ativo: boolean;
  email?: string;
  telefone?: string;
  created_at: string;
}

interface NovoAgente {
  nome: string;
  patente: string;
  esquadra: string;
  provincia: string;
  telefone: string;
}

const roleStyles: Record<string, string> = {
  admin:  "bg-purple-500/20 text-purple-400 border-purple-500/30",
  police: "bg-blue-500/20 text-blue-400 border-blue-500/30",
};

const patentes = ["Agente", "Agente 1ª Classe", "Subchefe", "Chefe", "Administrador"];

const provincias = [
  "Luanda", "Benguela", "Huíla", "Huambo", "Cabinda",
  "Malanje", "Bié", "Moxico", "Cunene", "Namibe",
  "Uíge", "Zaire", "Lunda Norte", "Lunda Sul",
  "Kuanza Norte", "Kuanza Sul", "Bengo", "Cuando Cubango",
];

function gerarPassword(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
  return Array.from({ length: 10 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}

function gerarCodigo(index: number): string {
  return `AG-${String(index).padStart(4, "0")}`;
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return "agora";
  if (min < 60) return `${min}min atrás`;
  if (min < 1440) return `${Math.floor(min / 60)}h atrás`;
  return `${Math.floor(min / 1440)}d atrás`;
}

export default function AgentesPage() {
  const [agentes, setAgentes] = useState<Agente[]>([]);
  const [gpsTimes, setGpsTimes] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [criando, setCriando] = useState(false);
  const [credenciais, setCredenciais] = useState<{ email: string; password: string; codigo: string } | null>(null);
  const [copiado, setCopiado] = useState(false);
  const [erro, setErro] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [selectedAgente, setSelectedAgente] = useState<Agente | null>(null);

  const [form, setForm] = useState<NovoAgente>({
    nome: "", patente: "Agente", esquadra: "", provincia: "Luanda", telefone: ""
  });

  const carregar = async () => {
    const { data } = await supabase
      .from("police_agents")
      .select("*")
      .order("created_at", { ascending: false });
    setAgentes((data ?? []) as Agente[]);
    setLoading(false);

    // Load GPS times for all agents
    if (data) {
      const ids = data.map((a: any) => a.id);
      const { data: locs } = await supabase
        .from("agent_locations")
        .select("agent_id, updated_at")
        .in("agent_id", ids);

      if (locs) {
        const times: Record<string, string> = {};
        locs.forEach((l: any) => { times[l.agent_id] = l.updated_at; });
        setGpsTimes(times);
      }
    }
  };

  useEffect(() => {
    carregar();
    const ch = supabase.channel("agentes")
      .on("postgres_changes", { event: "*", schema: "public", table: "police_agents" }, carregar)
      .on("postgres_changes", { event: "*", schema: "public", table: "agent_locations" }, carregar)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  const handleAdd = async () => {
    if (!form.nome || !form.esquadra || !form.telefone) {
      setErro("Preencha todos os campos obrigatórios.");
      return;
    }
    setCriando(true);
    setErro("");

    try {
      const password = gerarPassword();
      const codigo = gerarCodigo(agentes.length + 1);
      const email = `${codigo.toLowerCase().replace("-", "")}@sos.ao`;

      const { data: rpcData, error: rpcError } = await supabase.rpc("criar_agente", {
        p_email:     email,
        p_password:  password,
        p_nome:      form.nome.trim(),
        p_codigo:    codigo,
        p_esquadra:  form.esquadra.trim(),
        p_provincia: form.provincia,
        p_role:      form.patente === "Administrador" ? "admin" : "police",
      });

      if (rpcError) throw rpcError;
      if (!rpcData) throw new Error("Não foi possível criar a conta.");

      // Update telefone and patente if the RPC doesn't handle it
      const newAgentId = rpcData as string;
      await supabase.from("police_agents").update({
        telefone: form.telefone.trim(),
        patente: form.patente,
      }).eq("id", newAgentId);

      setCredenciais({ email, password, codigo });
      setForm({ nome: "", patente: "Agente", esquadra: "", provincia: "Luanda", telefone: "" });
      await carregar();

    } catch (e: any) {
      setErro(e.message ?? "Erro ao criar agente.");
    } finally {
      setCriando(false);
    }
  };

  const copiarCredenciais = () => {
    if (!credenciais) return;
    const texto = `🚨 SOS ESQUADRA — Credenciais de Acesso\n\nCódigo: ${credenciais.codigo}\nEmail: ${credenciais.email}\nPassword: ${credenciais.password}\n\nApp: SOS Police\nURL: https://sos-esquadra.vercel.app`;
    navigator.clipboard.writeText(texto);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  };

  const filtered = agentes.filter(a =>
    `${a.nome} ${a.codigo} ${a.esquadra} ${a.provincia}`.toLowerCase().includes(search.toLowerCase())
  );

  const isOnline = (agente: Agente) => {
    const t = gpsTimes[agente.id];
    if (!t) return false;
    return Date.now() - new Date(t).getTime() < 30 * 60000;
  };

  return (
    <div className="min-h-screen bg-background">
      <DashboardSidebar />
      <main className="ml-64 p-6">
        <header className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-foreground flex items-center gap-3">
              <Users className="w-5 h-5 text-primary" />
              Agentes Operacionais
            </h1>
            <p className="text-sm text-muted-foreground flex items-center gap-2 mt-0.5">
              {agentes.length} agentes registados
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-green-500/20 text-green-400">
                {Object.values(gpsTimes).filter(t => Date.now() - new Date(t).getTime() < 30 * 60000).length} online
              </span>
            </p>
          </div>

          <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) { setCredenciais(null); setErro(""); setShowPassword(false); } }}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-2">
                <Plus className="w-4 h-4" />Novo Agente
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-card border-border max-w-md">
              <DialogHeader>
                <DialogTitle className="text-foreground">
                  {credenciais ? (
                    <span className="flex items-center gap-2 text-green-400">
                      <BadgeCheck className="w-5 h-5" /> Agente Criado com Sucesso
                    </span>
                  ) : "Registar Novo Agente"}
                </DialogTitle>
              </DialogHeader>

              {credenciais ? (
                <div className="space-y-4 mt-2">
                  <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4 space-y-3">
                    <p className="text-sm text-green-400 font-semibold flex items-center gap-2">
                      <Key className="w-4 h-4" /> Credenciais do Novo Agente
                    </p>
                    <div className="space-y-2 font-mono text-sm bg-black/20 rounded p-3">
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground text-[11px]">Código:</span>
                        <span className="text-foreground font-bold">{credenciais.codigo}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground text-[11px]">Email:</span>
                        <span className="text-foreground text-[12px]">{credenciais.email}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground text-[11px]">Password:</span>
                        <div className="flex items-center gap-2">
                          <span className={`text-foreground font-bold ${showPassword ? "" : "tracking-widest"}`}>
                            {showPassword ? credenciais.password : "••••••••••"}
                          </span>
                          <button onClick={() => setShowPassword(!showPassword)} className="text-muted-foreground hover:text-foreground">
                            {showPassword ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                          </button>
                        </div>
                      </div>
                    </div>
                    <p className="text-[10px] text-muted-foreground">
                      Diga ao agente para instalar o <strong>SOS Police</strong> e entrar com estas credenciais.
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={copiarCredenciais} variant="outline" className="flex-1 gap-2 text-xs">
                      {copiado ? <><Check className="w-3 h-3 text-green-400" />Copiado!</> : <><Copy className="w-3 h-3" />Copiar</>}
                    </Button>
                    <Button onClick={() => { setCredenciais(null); setShowPassword(false); setOpen(false); }} className="flex-1 text-xs">
                      Fechar
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4 mt-2">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="col-span-2">
                      <Label className="text-muted-foreground text-xs">Nome Completo *</Label>
                      <Input value={form.nome} onChange={e => setForm({ ...form, nome: e.target.value })}
                        className="bg-secondary border-border mt-1 h-9 text-sm" placeholder="Nome do agente" />
                    </div>
                    <div>
                      <Label className="text-muted-foreground text-xs">Patente</Label>
                      <Select value={form.patente} onValueChange={v => setForm({ ...form, patente: v })}>
                        <SelectTrigger className="bg-secondary border-border mt-1 h-9">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-card border-border">
                          {patentes.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-muted-foreground text-xs">Província *</Label>
                      <Select value={form.provincia} onValueChange={v => setForm({ ...form, provincia: v })}>
                        <SelectTrigger className="bg-secondary border-border mt-1 h-9">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-card border-border">
                          {provincias.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="col-span-2">
                      <Label className="text-muted-foreground text-xs">Esquadra *</Label>
                      <Input value={form.esquadra} onChange={e => setForm({ ...form, esquadra: e.target.value })}
                        className="bg-secondary border-border mt-1 h-9 text-sm" placeholder="Ex: Esquadra Central" />
                    </div>
                    <div className="col-span-2">
                      <Label className="text-muted-foreground text-xs">Telefone *</Label>
                      <Input value={form.telefone} onChange={e => setForm({ ...form, telefone: e.target.value })}
                        className="bg-secondary border-border mt-1 h-9 text-sm" placeholder="+244 9XX XXX XXX" />
                    </div>
                  </div>

                  {erro && (
                    <div className="flex items-center gap-2 text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                      <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                      {erro}
                    </div>
                  )}

                  <Button onClick={handleAdd} disabled={criando} className="w-full h-9 text-xs gap-2">
                    {criando ? (
                      <><Activity className="w-3 h-3 animate-spin" />A criar conta...</>
                    ) : (
                      <><Plus className="w-3 h-3" />Criar Agente e Gerar Acesso</>
                    )}
                  </Button>
                </div>
              )}
            </DialogContent>
          </Dialog>
        </header>

        {/* Stats bar */}
        <div className="grid grid-cols-4 gap-3 mb-6">
          <div className="glass-panel rounded-lg p-3 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-500/10"><Users className="w-4 h-4 text-blue-400" /></div>
            <div>
              <p className="text-lg font-bold text-foreground">{agentes.length}</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Total</p>
            </div>
          </div>
          <div className="glass-panel rounded-lg p-3 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-green-500/10"><Activity className="w-4 h-4 text-green-400" /></div>
            <div>
              <p className="text-lg font-bold text-foreground">{Object.values(gpsTimes).filter(t => Date.now() - new Date(t).getTime() < 30 * 60000).length}</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Online</p>
            </div>
          </div>
          <div className="glass-panel rounded-lg p-3 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-yellow-500/10"><Clock className="w-4 h-4 text-yellow-400" /></div>
            <div>
              <p className="text-lg font-bold text-foreground">{Object.values(gpsTimes).filter(t => {
                const diff = Date.now() - new Date(t).getTime();
                return diff >= 30 * 60000 && diff < 120 * 60000;
              }).length}</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Ausentes</p>
            </div>
          </div>
          <div className="glass-panel rounded-lg p-3 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-red-500/10"><AlertTriangle className="w-4 h-4 text-red-400" /></div>
            <div>
              <p className="text-lg font-bold text-foreground">{agentes.filter(a => !a.ativo).length}</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Inactivos</p>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="relative mb-4 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Pesquisar por nome, código, esquadra..." className="pl-10 bg-secondary border-border h-9 text-sm" />
        </div>

        {/* Agent cards */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1,2,3,4,5,6].map(i => <div key={i} className="h-44 glass-panel rounded-lg animate-pulse" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">
            <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="text-sm">Nenhum agente encontrado</p>
            <p className="text-xs mt-1">Tente ajustar a pesquisa ou crie um novo agente.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <AnimatePresence>
              {filtered.map((agente, i) => {
                const online = isOnline(agente);
                const lastGps = gpsTimes[agente.id];

                return (
                  <motion.div
                    key={agente.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.03 }}
                    className="glass-panel rounded-lg p-5 border border-border/50 hover:border-primary/30 transition-colors cursor-pointer"
                    onClick={() => setSelectedAgente(selectedAgente?.id === agente.id ? null : agente)}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${online ? "bg-green-500/15" : "bg-card"}`}>
                          <BadgeCheck className={`w-5 h-5 ${online ? "text-green-400" : "text-muted-foreground"}`} />
                        </div>
                        <div>
                          <p className="font-semibold text-foreground text-sm">{agente.nome}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[11px] text-muted-foreground font-mono">{agente.codigo}</span>
                            {agente.patente && agente.patente !== "Agente" && (
                              <span className="text-[10px] text-muted-foreground">· {agente.patente}</span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        {online ? (
                          <Badge className="bg-green-500/20 text-green-400 border-green-500/30 text-[10px]">Online</Badge>
                        ) : (
                          <Badge variant="outline" className="text-[10px] text-muted-foreground">Offline</Badge>
                        )}
                      </div>
                    </div>

                    <div className="space-y-1.5 text-xs text-muted-foreground">
                      <p className="flex items-center gap-2">
                        <Shield className="w-3 h-3" />
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold border ${roleStyles[agente.role] ?? "bg-gray-500/20 text-gray-400 border-gray-500/30"}`}>
                          {agente.role?.toUpperCase()}
                        </span>
                      </p>
                      <p className="flex items-center gap-2">
                        <MapPin className="w-3 h-3" />
                        {agente.esquadra} · {agente.provincia}
                      </p>
                      {agente.telefone && (
                        <p className="flex items-center gap-2">
                          <Phone className="w-3 h-3" />
                          {agente.telefone}
                        </p>
                      )}
                      {agente.email && (
                        <p className="flex items-center gap-2 font-mono text-[10px] opacity-60">
                          <Key className="w-3 h-3" />{agente.email}
                        </p>
                      )}
                      {lastGps ? (
                        <p className={`flex items-center gap-2 text-[10px] ${online ? "text-green-500/60" : "text-muted-foreground/60"}`}>
                          <Activity className="w-3 h-3" />
                          Último GPS: {timeAgo(lastGps)}
                        </p>
                      ) : (
                        <p className="flex items-center gap-2 text-[10px] text-muted-foreground/40">
                          <Activity className="w-3 h-3" />
                          Sem dados GPS
                        </p>
                      )}
                    </div>

                    {/* Expanded detail */}
                    {selectedAgente?.id === agente.id && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        className="mt-3 pt-3 border-t border-border/50"
                      >
                        <div className="grid grid-cols-2 gap-2 text-[11px]">
                          <div>
                            <span className="text-muted-foreground">Criado em:</span>
                            <p className="text-foreground">{new Date(agente.created_at).toLocaleDateString("pt-AO")}</p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Estado:</span>
                            <p className={`font-semibold ${agente.ativo ? "text-green-400" : "text-red-400"}`}>
                              {agente.ativo ? "Activo" : "Inactivo"}
                            </p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Último GPS:</span>
                            <p className="text-foreground">{lastGps ? new Date(lastGps).toLocaleString("pt-AO") : "N/A"}</p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Patente:</span>
                            <p className="text-foreground">{agente.patente ?? "Agente"}</p>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </main>
    </div>
  );
}
