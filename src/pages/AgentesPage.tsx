import { useState } from "react";
import { Users, Plus, Search, Phone, MapPin, BadgeCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion } from "framer-motion";
import DashboardSidebar from "@/components/DashboardSidebar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";

interface Agent {
  id: number;
  nome: string;
  patente: string;
  esquadra: string;
  telefone: string;
  estado: "Activo" | "Inactivo" | "Em missão";
  matricula: string;
}

const initialAgents: Agent[] = [
  { id: 1, nome: "João Silva", patente: "Subchefe", esquadra: "Maianga", telefone: "+244 923 456 789", estado: "Activo", matricula: "AG-0012" },
  { id: 2, nome: "Maria Mendes", patente: "Agente 1ª Classe", esquadra: "Sambizanga", telefone: "+244 912 345 678", estado: "Em missão", matricula: "AG-0034" },
  { id: 3, nome: "Pedro Costa", patente: "Chefe", esquadra: "Rangel", telefone: "+244 934 567 890", estado: "Activo", matricula: "AG-0056" },
  { id: 4, nome: "Ana Ferreira", patente: "Agente", esquadra: "Cazenga", telefone: "+244 945 678 901", estado: "Inactivo", matricula: "AG-0078" },
  { id: 5, nome: "Carlos Santos", patente: "Subchefe", esquadra: "Viana", telefone: "+244 956 789 012", estado: "Activo", matricula: "AG-0091" },
  { id: 6, nome: "Luísa Neto", patente: "Agente 1ª Classe", esquadra: "Ingombota", telefone: "+244 967 890 123", estado: "Em missão", matricula: "AG-0103" },
];

const estadoStyles: Record<string, string> = {
  Activo: "bg-success/20 text-success",
  Inactivo: "bg-muted text-muted-foreground",
  "Em missão": "bg-warning/20 text-warning",
};

const AgentesPage = () => {
  const [agents, setAgents] = useState<Agent[]>(initialAgents);
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ nome: "", patente: "", esquadra: "", telefone: "" });

  const filtered = agents.filter(
    (a) =>
      a.nome.toLowerCase().includes(search.toLowerCase()) ||
      a.esquadra.toLowerCase().includes(search.toLowerCase()) ||
      a.matricula.toLowerCase().includes(search.toLowerCase())
  );

  const handleAdd = () => {
    if (!form.nome || !form.patente || !form.esquadra || !form.telefone) {
      toast({ title: "Erro", description: "Preencha todos os campos.", variant: "destructive" });
      return;
    }
    const newAgent: Agent = {
      id: Date.now(),
      nome: form.nome.trim(),
      patente: form.patente,
      esquadra: form.esquadra.trim(),
      telefone: form.telefone.trim(),
      estado: "Activo",
      matricula: `AG-${String(agents.length + 1).padStart(4, "0")}`,
    };
    setAgents([newAgent, ...agents]);
    setForm({ nome: "", patente: "", esquadra: "", telefone: "" });
    setOpen(false);
    toast({ title: "Agente registado", description: `${newAgent.nome} foi adicionado com sucesso.` });
  };

  return (
    <div className="min-h-screen bg-background">
      <DashboardSidebar />
      <main className="ml-64 p-6">
        <header className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-foreground">Registo de Agentes</h1>
            <p className="text-sm text-muted-foreground">{agents.length} agentes no sistema</p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm"><Plus className="w-4 h-4 mr-2" />Novo Agente</Button>
            </DialogTrigger>
            <DialogContent className="bg-card border-border">
              <DialogHeader>
                <DialogTitle className="text-foreground">Registar Novo Agente</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-2">
                <div>
                  <Label className="text-muted-foreground text-xs">Nome Completo</Label>
                  <Input value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} className="bg-secondary border-border mt-1" placeholder="Nome do agente" />
                </div>
                <div>
                  <Label className="text-muted-foreground text-xs">Patente</Label>
                  <Select value={form.patente} onValueChange={(v) => setForm({ ...form, patente: v })}>
                    <SelectTrigger className="bg-secondary border-border mt-1"><SelectValue placeholder="Seleccionar patente" /></SelectTrigger>
                    <SelectContent className="bg-card border-border">
                      <SelectItem value="Agente">Agente</SelectItem>
                      <SelectItem value="Agente 1ª Classe">Agente 1ª Classe</SelectItem>
                      <SelectItem value="Subchefe">Subchefe</SelectItem>
                      <SelectItem value="Chefe">Chefe</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-muted-foreground text-xs">Esquadra</Label>
                  <Input value={form.esquadra} onChange={(e) => setForm({ ...form, esquadra: e.target.value })} className="bg-secondary border-border mt-1" placeholder="Ex: Maianga" />
                </div>
                <div>
                  <Label className="text-muted-foreground text-xs">Telefone</Label>
                  <Input value={form.telefone} onChange={(e) => setForm({ ...form, telefone: e.target.value })} className="bg-secondary border-border mt-1" placeholder="+244 9XX XXX XXX" />
                </div>
                <Button onClick={handleAdd} className="w-full">Registar Agente</Button>
              </div>
            </DialogContent>
          </Dialog>
        </header>

        <div className="relative mb-4 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Pesquisar agente..." className="pl-10 bg-secondary border-border" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((agent, i) => (
            <motion.div
              key={agent.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="glass-panel rounded-lg p-5"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/15 flex items-center justify-center">
                    <BadgeCheck className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground text-sm">{agent.nome}</p>
                    <p className="text-xs text-muted-foreground font-mono">{agent.matricula}</p>
                  </div>
                </div>
                <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${estadoStyles[agent.estado]}`}>
                  {agent.estado}
                </span>
              </div>
              <div className="space-y-1.5 text-xs text-muted-foreground">
                <p className="flex items-center gap-2"><Users className="w-3 h-3" />{agent.patente}</p>
                <p className="flex items-center gap-2"><MapPin className="w-3 h-3" />{agent.esquadra}</p>
                <p className="flex items-center gap-2"><Phone className="w-3 h-3" />{agent.telefone}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </main>
    </div>
  );
};

export default AgentesPage;
