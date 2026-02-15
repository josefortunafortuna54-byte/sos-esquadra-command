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
    mockAlerts = mockAlerts.map((a) => (a.id === id ? { ...a, status } : a));
  }
}

/* ── Viaturas / Agentes ── */

export interface Agent {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  status?: string;
  updatedAt?: string;
}

const MOCK_AGENTS: Agent[] = [
  { id: "v-001", name: "Viatura Alpha-1", latitude: -8.8320, longitude: 13.2420, status: "patrulha", updatedAt: new Date(Date.now() - 30000).toISOString() },
  { id: "v-002", name: "Viatura Bravo-2", latitude: -8.8450, longitude: 13.2580, status: "patrulha", updatedAt: new Date(Date.now() - 15000).toISOString() },
  { id: "v-003", name: "Viatura Charlie-3", latitude: -8.8180, longitude: 13.2350, status: "ocorrência", updatedAt: new Date(Date.now() - 45000).toISOString() },
  { id: "v-004", name: "Viatura Delta-4", latitude: -8.8550, longitude: 13.2200, status: "patrulha", updatedAt: new Date(Date.now() - 10000).toISOString() },
  { id: "v-005", name: "Viatura Echo-5", latitude: -8.8090, longitude: 13.2750, status: "base", updatedAt: new Date(Date.now() - 60000).toISOString() },
];

export async function fetchAgents(): Promise<Agent[]> {
  try {
    const res = await fetch(`${API_BASE}/api/agents`, { signal: AbortSignal.timeout(5000) });
    if (!res.ok) throw new Error("Erro ao buscar agentes");
    const data = await res.json();
    if (!Array.isArray(data) || data.length === 0) throw new Error("Sem dados");
    return data.map((a: any) => ({
      id: a._id || a.id,
      name: a.name || a.nome || "Viatura",
      latitude: a.latitude ?? a.lat ?? -8.839,
      longitude: a.longitude ?? a.lng ?? 13.255,
      status: a.status || "patrulha",
      updatedAt: a.updatedAt || a.createdAt,
    }));
  } catch {
    return [...MOCK_AGENTS];
  }
}

/* ── Despacho automático ── */

export interface DispatchResult {
  agent: Agent;
  distance: number;
}

export async function findClosestAgent(lat: number, lng: number): Promise<DispatchResult | null> {
  try {
    const res = await fetch(`${API_BASE}/api/agents/closest`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lat, lng }),
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) throw new Error("Erro ao buscar viatura mais próxima");
    const data = await res.json();
    return {
      agent: {
        id: data._id || data.id || "v-closest",
        name: data.name || data.nome || "Viatura",
        latitude: data.latitude ?? data.lat ?? lat,
        longitude: data.longitude ?? data.lng ?? lng,
        status: data.status || "patrulha",
        updatedAt: data.updatedAt,
      },
      distance: data.distance ?? 0,
    };
  } catch {
    // Fallback: find closest from mock agents using haversine approximation
    const toRad = (d: number) => (d * Math.PI) / 180;
    let closest: Agent | null = null;
    let minDist = Infinity;
    for (const a of MOCK_AGENTS) {
      const dLat = toRad(a.latitude - lat);
      const dLng = toRad(a.longitude - lng);
      const dist = Math.sqrt(dLat * dLat + dLng * dLng) * 111000; // rough meters
      if (dist < minDist) {
        minDist = dist;
        closest = a;
      }
    }
    if (!closest) return null;
    return { agent: closest, distance: Math.round(minDist) };
  }
}
