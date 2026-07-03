export interface User {
  id: string;
  auth_id: string;
  nome: string;
  telefone: string;
  provincia: string;
  data_nascimento: string;
  role: "user" | "police" | "command" | "supervisor";
  ativo: boolean;
}

export interface PoliceAgent {
  id: string;
  auth_id: string;
  nome: string;
  codigo: string;
  email: string;
  esquadra: string;
  provincia: string;
  telefone: string | null;
  patente: string;
  role: "police" | "command" | "supervisor";
  ativo: boolean;
  created_at: string;
}

export interface Occurrence {
  id: string;
  user_id: string;
  agent_id: string | null;
  tipo: string;
  status: "Pendente" | "Despachado" | "A caminho" | "No local" | "Finalizado";
  descricao: string | null;
  latitude: number | null;
  longitude: number | null;
  created_at: string;
  updated_at: string | null;
  users?: Pick<User, "nome" | "telefone">;
}

export interface AgentLocation {
  agent_id: string;
  latitude: number;
  longitude: number;
  updated_at: string;
}

export interface StolenVehicle {
  id: string;
  user_id: string;
  tipo: string;
  marca: string;
  modelo: string;
  matricula: string;
  cor: string;
  local_furto: string;
  latitude: number | null;
  longitude: number | null;
  status: "Procurado" | "Confirmado" | "Recuperado";
  created_at: string;
}

export interface Message {
  id: string;
  occurrence_id: string;
  sender_id: string;
  sender_role: "user" | "agent" | "command";
  content: string;
  created_at: string;
  read_at: string | null;
}

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  body: string;
  type: "info" | "status_update" | "alert" | "warning";
  data: Record<string, unknown> | null;
  read: boolean;
  created_at: string;
}

export interface DashboardStats {
  total_ocorrencias: number;
  pendentes: number;
  hoje: number;
  este_mes: number;
  finalizados_hoje: number;
  agentes_activos: number;
  agentes_total: number;
  veiculos_procurados: number;
  veiculos_recuperados: number;
  tempo_medio_resposta: number;
}

export interface ReportRow {
  id: string;
  tipo: string;
  status: string;
  latitude: number | null;
  longitude: number | null;
  created_at: string;
  updated_at: string | null;
  cidadao_nome: string | null;
  cidadao_telefone: string | null;
  agente_nome: string | null;
  agente_codigo: string | null;
  esquadra: string | null;
  provincia: string | null;
}

export interface PushToken {
  id: string;
  user_id: string;
  token: string;
  platform: "android" | "ios" | "web";
  role: "user" | "agent" | "command";
  created_at: string;
  updated_at: string;
}
