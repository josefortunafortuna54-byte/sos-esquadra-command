import { useState, useEffect } from "react";
import { Users, Plus, Search, Phone, MapPin, BadgeCheck, Copy, Check, Key } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion, AnimatePresence } from "framer-motion";
import DashboardSidebar from "@/components/DashboardSidebar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/lib/supabase";

interface Agente {
  id: string;
  auth_id: string;
  nome: string;
  codigo: string;
  esquadra: string;
  provincia: string;
  role: string;
  ativo: boolean;
  email?: string;
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
  admin:  "bg-purple-500/20 text-purple-400",
  police: "bg-blue-500/20 text-blue-400",
};

const provincias = [
  "Luanda", "Benguela", "Huíla", "Huambo", "Cabinda",
  "Malanje", "Bié", "Moxico", "Cunene", "Namibe",
  "Uíge", "Zaire", "Lunda Norte", "Lunda Sul",
  "Kuanza Norte", "Kuanza Sul", "Bengo", "Cuando Cubango",
];

const patentes = ["Agente", "Agente 1ª Classe", "Subchefe", "Chefe", "Administrador"];

// Gerar password aleatória segura
function gerarPassword(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
  return Array.from({ length: 10 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}

// Gerar código de agente
function gerarCodigo(index: number): string {
  return `AG-${String(index).padStart(4, "0")}`;
}

export default function AgentesPage() {
  const [agentes, setAgentes] = useState<Agente[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [criando, setCriando] = useState(false);
  const [credenciais, setCredenciais] = useState<{ email: string; password: string; codigo: string } | null>(null);
  const [copiado, setCopiado] = useState(false);
  const [erro, setErro] = useState("");

  const [form, setForm] = useState<NovoAgente>({
    nome: "", patente: "Agente", esquadra: "", provincia: "Luanda", telefone: ""
  });

  // Carregar agentes do Supabase
  const carregar = async () => {
    const { data } = await supabase
      .from("police_agents")
      .select("*")
      .order("created_at", { ascending: false });
    setAgentes((data ?? []) as Agente[]);
    setLoading(false);
  };

  useEffect(() => {
    carregar();
    const ch = supabase.channel("agentes")
      .on("postgres_changes", { event: "*", schema: "public", table: "police_agents" }, carregar)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  const handleAdd = async () => {
    if (!form.nome || !form.esquadra || !form.telefone) {
      setErro("Preencha todos os campos.");
      return;
    }
    setCriando(true);
    setErro("");

    try {
      const password = gerarPassword();
      const codigo = gerarCodigo(agentes.length + 1);
      const email = `${codigo.toLowerCase().replace("-", "")}@sos.ao`;

      // 1. Criar conta no Supabase Auth
      // usar função RPC
        ? await (supabase as any).auth.admin.createUser({
            email,
            password,
            email_confirm: true,
          })
        : { data: null, error: new Error("sem permissão admin") };

      // Fallback: usar signUp normal
      let authId = authData?.user?.id;
      if (!authId) {
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
        });
        if (signUpError) throw signUpError;
        authId = signUpData.user?.id;
      }

      if (!authId) throw new Error("Não foi possível criar a conta.");

      // 2. Criar perfil na tabela police_agents
      const { error: dbError } = await supabase.from("police_agents").insert({
        auth_id:   authId,
        nome:      form.nome.trim(),
        email:     email,
        codigo:    codigo,
        esquadra:  form.esquadra.trim(),
        provincia: form.provincia,
        role:      form.patente === "Administrador" ? "admin" : "police",
        ativo:     true,
      });

      if (dbError) throw dbError;

      // 3. Mostrar credenciais
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
    const texto = `🚨 SOS ESQUADRA — Credenciais de Acesso\n\nCódigo: ${credenciais.codigo}\nEmail: ${credenciais.email}\nPassword: ${credenciais.password}\n\nInstale o app SOS Police e entre com estas credenciais.`;
    navigator.clipboard.writeText(texto);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  };

  const filtered = agentes.filter(a =>
    `${a.nome} ${a.codigo} ${a.esquadra}`.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background">
      <DashboardSidebar />
      <main className="ml-64 p-6">
        <header className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-foreground">Registo de Agentes</h1>
            <p className="text-sm text-muted-foreground">{agentes.length} agentes no sistema</p>
          </div>

          <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) { setCredenciais(null); setErro(""); } }}>
            <DialogTrigger asChild>
              <Button size="sm"><Plus className="w-4 h-4 mr-2" />Novo Agente</Button>
            </DialogTrigger>
            <DialogContent className="bg-card border-border max-w-md">
              <DialogHeader>
                <DialogTitle className="text-foreground">
                  {credenciais ? "✅ Agente Criado" : "Registar Novo Agente"}
                </DialogTitle>
              </DialogHeader>

              {credenciais ? (
                /* ── Mostrar credenciais ── */
                <div className="space-y-4 mt-2">
                  <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4 space-y-3">
                    <p className="text-sm text-green-400 font-semibold flex items-center gap-2">
                      <Key className="w-4 h-4" /> Credenciais de acesso ao app
                    </p>
                    <div className="space-y-2 font-mono text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Código:</span>
                        <span className="text-foreground font-bold">{credenciais.codigo}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Email:</span>
                        <span className="text-foreground">{credenciais.email}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Password:</span>
                        <span className="text-foreground font-bold text-yellow-400">{credenciais.password}</span>
                      </div>
                    </div>
                  </div>

                  <p className="text-xs text-muted-foreground">
                    ⚠️ Guarde esta password — não será mostrada novamente. O agente deve usá-la para entrar no app <strong>SOS Police</strong>.
                  </p>

                  <div className="flex gap-2">
                    <Button onClick={copiarCredenciais} variant="outline" className="flex-1">
                      {copiado ? <><Check className="w-4 h-4 mr-2 text-green-400" />Copiado!</> : <><Copy className="w-4 h-4 mr-2" />Copiar Credenciais</>}
                    </Button>
                    <Button onClick={() => { setCredenciais(null); setOpen(false); }} className="flex-1">
                      Fechar
                    </Button>
                  </div>
                </div>
              ) : (
                /* ── Formulário ── */
                <div className="space-y-4 mt-2">
                  <div>
                    <Label className="text-muted-foreground text-xs">Nome Completo *</Label>
                    <Input value={form.nome} onChange={e => setForm({ ...form, nome: e.target.value })}
                      className="bg-secondary border-border mt-1" placeholder="Nome completo do agente" />
                  </div>
                  <div>
                    <Label className="text-muted-foreground text-xs">Patente *</Label>
                    <Select value={form.patente} onValueChange={v => setForm({ ...form, patente: v })}>
                      <SelectTrigger className="bg-secondary border-border mt-1">
                        <SelectValue placeholder="Seleccionar patente" />
                      </SelectTrigger>
                      <SelectContent className="bg-card border-border">
                        {patentes.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-muted-foreground text-xs">Esquadra *</Label>
                    <Input value={form.esquadra} onChange={e => setForm({ ...form, esquadra: e.target.value })}
                      className="bg-secondary border-border mt-1" placeholder="Ex: Esquadra Central" />
                  </div>
                  <div>
                    <Label className="text-muted-foreground text-xs">Província *</Label>
                    <Select value={form.provincia} onValueChange={v => setForm({ ...form, provincia: v })}>
                      <SelectTrigger className="bg-secondary border-border mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-card border-border">
                        {provincias.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-muted-foreground text-xs">Telefone *</Label>
                    <Input value={form.telefone} onChange={e => setForm({ ...form, telefone: e.target.value })}
                      className="bg-secondary border-border mt-1" placeholder="+244 9XX XXX XXX" />
                  </div>

                  {erro && (
                    <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded p-2">{erro}</p>
                  )}

                  <Button onClick={handleAdd} disabled={criando} className="w-full">
                    {criando ? "A criar conta..." : "Criar Agente e Gerar Acesso"}
                  </Button>
                </div>
              )}
            </DialogContent>
          </Dialog>
        </header>

        {/* Pesquisa */}
        <div className="relative mb-4 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Pesquisar agente..." className="pl-10 bg-secondary border-border" />
        </div>

        {/* Lista */}
        {loading ? (
          <div className="grid grid-cols-3 gap-4">
            {[1,2,3,4,5,6].map(i => <div key={i} className="h-36 glass-panel rounded-lg animate-pulse" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">
            <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>Nenhum agente encontrado</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <AnimatePresence>
              {filtered.map((agente, i) => (
                <motion.div
                  key={agente.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className="glass-panel rounded-lg p-5"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/15 flex items-center justify-center">
                        <BadgeCheck className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-semibold text-foreground text-sm">{agente.nome}</p>
                        <p className="text-xs text-muted-foreground font-mono">{agente.codigo}</p>
                      </div>
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${agente.ativo ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"}`}>
                      {agente.ativo ? "Activo" : "Inactivo"}
                    </span>
                  </div>
                  <div className="space-y-1.5 text-xs text-muted-foreground">
                    <p className="flex items-center gap-2">
                      <BadgeCheck className="w-3 h-3" />
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${roleStyles[agente.role] ?? "bg-gray-500/20 text-gray-400"}`}>
                        {agente.role?.toUpperCase()}
                      </span>
                    </p>
                    <p className="flex items-center gap-2"><MapPin className="w-3 h-3" />{agente.esquadra} · {agente.provincia}</p>
                    {agente.email && (
                      <p className="flex items-center gap-2 font-mono text-[10px]">
                        <Key className="w-3 h-3" />{agente.email}
                      </p>
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </main>
    </div>
  );
}
