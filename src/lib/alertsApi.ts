import { supabase } from './supabase'

export interface Occurrence {
  id: string
  name: string
  type: string
  descricao?: string
  status: 'Pendente' | 'Despachado' | 'A caminho' | 'No local' | 'Finalizado'
  latitude: number
  longitude: number
  phone?: string
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

export async function fetchOccurrences(): Promise<Occurrence[]> {
  const { data, error } = await supabase
    .from('occurrences')
    .select('*, users(nome, telefone)')
    .neq('status', 'Finalizado')
    .order('created_at', { ascending: false })
    .limit(20)

  if (error) throw new Error(error.message)

  return (data ?? []).map((o: any) => ({
    id: o.id,
    name: o.users?.nome ?? 'Desconhecido',
    type: o.tipo ?? 'Emergência',
    descricao: o.descricao ?? '',
    status: o.status ?? 'Pendente',
    latitude: o.latitude ?? -8.839,
    longitude: o.longitude ?? 13.2894,
    phone: o.users?.telefone,
    agent: null,
    createdAt: o.created_at,
  }))
}

export async function fetchAllOccurrences(limit = 100): Promise<Occurrence[]> {
  const { data, error } = await supabase
    .from('occurrences')
    .select('*, users(nome, telefone)')
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) throw new Error(error.message)

  return (data ?? []).map((o: any) => ({
    id: o.id,
    name: o.users?.nome ?? 'Desconhecido',
    type: o.tipo ?? 'Emergência',
    descricao: o.descricao ?? '',
    status: o.status ?? 'Pendente',
    latitude: o.latitude ?? -8.839,
    longitude: o.longitude ?? 13.2894,
    phone: o.users?.telefone,
    agent: null,
    createdAt: o.created_at,
  }))
}

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

export { fetchOccurrences as fetchAlerts }

export type Alert = Occurrence
export type DispatchResult = { agent: Agent; distance: number }

export async function updateAlertStatus(id: string, status: Occurrence['status']): Promise<void> {
  const { error } = await supabase
    .from('occurrences')
    .update({ status })
    .eq('id', id)

  if (error) throw new Error(error.message)
}

export async function fetchUnits(): Promise<Agent[]> {
  return fetchAgents()
}

export function subscribeToUnits(
  callback: (agents: Agent[]) => void
) {
  const channel = supabase
    .channel('agent-locations-changes')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'agent_locations' },
      async () => {
        const data = await fetchAgents()
        callback(data)
      }
    )
    .subscribe()

  return () => supabase.removeChannel(channel)
}

export async function findClosestAgent(lat: number, lng: number): Promise<DispatchResult | null> {
  const agents = await fetchAgents()
  if (agents.length === 0) return null
  const toRad = (d: number) => (d * Math.PI) / 180
  let closest: Agent | null = null
  let minDist = Infinity
  for (const a of agents) {
    const dLat = toRad(a.latitude - lat)
    const dLng = toRad(a.longitude - lng)
    const dist = Math.sqrt(dLat * dLat + dLng * dLng) * 111000
    if (dist < minDist) { minDist = dist; closest = a }
  }
  if (!closest) return null
  return { agent: closest, distance: Math.round(minDist) }
}
