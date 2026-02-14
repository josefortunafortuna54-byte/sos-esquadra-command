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

export async function fetchAlerts(): Promise<Alert[]> {
  const res = await fetch(`${API_BASE}/alerts`);
  if (!res.ok) throw new Error("Erro ao buscar alertas");
  const data = await res.json();
  return data.map((a: any) => ({
    id: a._id || a.id,
    name: a.name || "Desconhecido",
    phone: a.phone || a.telefone || "",
    status: a.status || "pendente",
    latitude: a.latitude ?? a.lat ?? -8.839,
    longitude: a.longitude ?? a.lng ?? 13.255,
    createdAt: a.createdAt,
  }));
}

export async function updateAlertStatus(id: string, status: string): Promise<void> {
  const res = await fetch(`${API_BASE}/alerts/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  });
  if (!res.ok) throw new Error("Erro ao atualizar alerta");
}
