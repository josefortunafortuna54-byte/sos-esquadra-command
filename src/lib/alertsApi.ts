import { supabase } from './supabase'

export interface Occurrence {
  id: string
  userName: string
  type: string
  status: 'Pendente' | 'Despachado' | 'A caminho' | 'No local' | 'Finalizado'
  latitude?: number
  longitude?: number
  agent?: { name: string } | null
  createdAt?: string
}

export interface Agent {
  id: string
  name: string
  latitude: number
  longitude: number
  status?: string
  updatedAt?: string
}

// ── Listar ocorrências ──────────────────────────────────────────
export async function fetchOccurrences(): Promise<Occurrence[]> {
  const { data, error } = await supabase
    .from('occurrences')
    .select('*, users(nome)')
    .neq('status', 'Finalizado')
    .order('created_at', { ascending: false })
    .limit(20)

  if (error) throw new Error(error.message)

  return (data ?? []).map((o: any) => ({
    id: o.id,
    userName: o.users?.nome ?? 'Desconhecido',
    type: o.tipo ?? 'Emergência',
    status: o.status ?? 'Pendente',
    latitude: o.latitude,
    longitude: o.longitude,
    agent: null,
    createdAt: o.created_at,
  }))
}

// ── Actualizar status ───────────────────────────────────────────
export async function updateStatus(
  id: string,
  status: Occurrence['status']
): Promise<void> {
  const { error } = await supabase
    .from('occurrences')
    .update({ status })
    .eq('id', id)

  if (error) throw new Error(error.message)
}

// ── Localização dos agentes (GPS) ──────────────────────────────
export async function fetchAgents(): Promise<Agent[]> {
  const { data, error } = await supabase
    .from('agent_locations')
    .select('*, police_agents(nome, codigo)')
    .order('updated_at', { ascending: false })

  if (error) return []

  return (data ?? []).map((a: any) => ({
    id: a.agent_id,
    name: a.police_agents?.nome ?? a.police_agents?.codigo ?? 'Agente',
    latitude: a.latitude,
    longitude: a.longitude,
    status: 'patrulha',
    updatedAt: a.updated_at,
  }))
}

// ── Subscrever alertas em tempo real ───────────────────────────
export function subscribeToOccurrences(
  callback: (occurrences: Occurrence[]) => void
) {
  const channel = supabase
    .channel('occurrences-changes')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'occurrences' },
      async () => {
        const data = await fetchOccurrences()
        callback(data)
      }
    )
    .subscribe()

  return () => supabase.removeChannel(channel)
}

// Alias compatibilidade
export { fetchOccurrences as fetchAlerts }
