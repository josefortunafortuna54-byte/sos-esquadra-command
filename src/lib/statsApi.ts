import { supabase } from './supabase'

export interface DashboardStats {
  total_ocorrencias: number
  pendentes: number
  hoje: number
  este_mes: number
  finalizados_hoje: number
  agentes_activos: number
  agentes_total: number
  veiculos_procurados: number
  veiculos_recuperados: number
  tempo_medio_resposta: number
}

export async function fetchDashboardStats(): Promise<DashboardStats> {
  const { data, error } = await supabase.rpc('get_dashboard_stats')
  if (error) throw new Error(error.message)
  return data as DashboardStats
}

export interface ReportRow {
  id: string
  tipo: string
  status: string
  latitude: number | null
  longitude: number | null
  created_at: string
  updated_at: string | null
  cidadao_nome: string | null
  cidadao_telefone: string | null
  agente_nome: string | null
  agente_codigo: string | null
  esquadra: string | null
  provincia: string | null
}

export async function fetchReportOcorrencias(): Promise<ReportRow[]> {
  const { data } = await supabase
    .from('report_ocorrencias')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(200)
  return data ?? []
}

export interface MonthlyStat {
  mes: string
  total: number
  finalizados: number
}

export async function fetchMonthlyStats(): Promise<MonthlyStat[]> {
  const { data } = await supabase
    .from('occurrences')
    .select('status, created_at')

  if (!data) return []

  const monthly: Record<string, { total: number; finalizados: number }> = {}

  data.forEach((o: any) => {
    const mes = (o.created_at as string).substring(0, 7)
    if (!monthly[mes]) monthly[mes] = { total: 0, finalizados: 0 }
    monthly[mes].total++
    if (o.status === 'Finalizado') monthly[mes].finalizados++
  })

  return Object.entries(monthly)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([mes, vals]) => ({ mes, ...vals }))
}
