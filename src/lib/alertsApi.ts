export interface Alert {
  id: string;
  _id?: string;
  name: string;
  phone?: string;
  status: string;
  latitude: number;
  longitude: number;
  createdAt?: string;
}

const API_BASE = "https://sos-server.onrender.com";

/* ── Dados de demonstração (fallback quando API offline) ── */
const MOCK_ALERTS: Alert[] = [
  {
    id: "sos-001",
    name: "João Manuel da Silva",
    phone: "+244 923 456 789",
    status: "pendente",
    latitude: -8.8383,
    longitude: 13.2344,
    createdAt: new Date(Date.now() - 2 * 60000).toISOString(),
  },
  {
    id: "sos-002",
    name: "Maria Fernanda Costa",
    phone: "+244 912 345 678",
    status: "pendente",
    latitude: -8.8147,
    longitude: 13.2302,
    createdAt: new Date(Date.now() - 5 * 60000).toISOString(),
  },
  {
    id: "sos-003",
    name: "Carlos Alberto Neto",
    phone: "+244 934 567 890",
    status: "em atendimento",
    latitude: -8.8500,
    longitude: 13.2700,
    createdAt: new Date(Date.now() - 12 * 60000).toISOString(),
  },
  {
    id: "sos-004",
    name: "Ana Beatriz Domingos",
    phone: "+244 945 678 901",
    status: "em atendimento",
    latitude: -8.8260,
    longitude: 13.2450,
    createdAt: new Date(Date.now() - 18 * 60000).toISOString(),
  },
  {
    id: "sos-005",
    name: "Pedro Francisco Lopes",
    phone: "+244 956 789 012",
    status: "concluído",
    latitude: -8.8600,
    longitude: 13.2150,
    createdAt: new Date(Date.now() - 45 * 60000).toISOString(),
  },
  {
    id: "sos-006",
    name: "Teresa Madalena Santos",
    phone: "+244 967 890 123",
    status: "pendente",
    latitude: -8.8050,
    longitude: 13.2890,
    createdAt: new Date(Date.now() - 1 * 60000).toISOString(),
  },
  {
    id: "sos-007",
    name: "Roberto Augusto Vieira",
    phone: "+244 978 901 234",
    status: "concluído",
    latitude: -8.8420,
    longitude: 13.2560,
    createdAt: new Date(Date.now() - 60 * 60000).toISOString(),
  },
  {
    id: "sos-008",
    name: "Luciana Patrícia Gonçalves",
    phone: "+244 989 012 345",
    status: "pendente",
    latitude: -8.8310,
    longitude: 13.2180,
    createdAt: new Date(Date.now() - 3 * 60000).toISOString(),
  },
];

let mockAlerts = [...MOCK_ALERTS];

export async function fetchAlerts(): Promise<Alert[]> {
  try {
    const res = await fetch(`${API_BASE}/alerts`, { signal: AbortSignal.timeout(5000) });
    if (!res.ok) throw new Error("Erro ao buscar alertas");
    const data = await res.json();
    if (!Array.isArray(data) || data.length === 0) throw new Error("Sem dados");
    return data.map((a: any) => ({
      id: a._id || a.id,
      name: a.name || "Desconhecido",
      phone: a.phone || a.telefone || "",
      status: a.status || "pendente",
      latitude: a.latitude ?? a.lat ?? -8.839,
      longitude: a.longitude ?? a.lng ?? 13.255,
      createdAt: a.createdAt,
    }));
  } catch {
    // API offline — retornar dados de demonstração
    return [...mockAlerts];
  }
}

export async function updateAlertStatus(id: string, status: string): Promise<void> {
  try {
    const res = await fetch(`${API_BASE}/alerts/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) throw new Error("Erro ao atualizar alerta");
  } catch {
    // API offline — atualizar dados locais de demonstração
    mockAlerts = mockAlerts.map((a) => (a.id === id ? { ...a, status } : a));
  }
}
