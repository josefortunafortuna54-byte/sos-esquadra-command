import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FileText, Download, Calendar, BarChart3, TrendingUp, Users, Car, Shield } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import DashboardSidebar from '@/components/DashboardSidebar'
import { fetchDashboardStats, fetchReportOcorrencias, fetchMonthlyStats, type DashboardStats, type ReportRow, type MonthlyStat } from '@/lib/statsApi'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts'

const statusCores: Record<string, string> = {
  Pendente: '#ef4444',
  Despachado: '#3b82f6',
  'A caminho': '#f59e0b',
  'No local': '#8b5cf6',
  Finalizado: '#22c55e',
}

const statusBg = (s: string) =>
  s === 'Pendente' ? 'bg-red-500/20 text-red-400' :
  s === 'Despachado' ? 'bg-blue-500/20 text-blue-400' :
  s === 'A caminho' ? 'bg-orange-500/20 text-orange-400' :
  s === 'No local' ? 'bg-purple-500/20 text-purple-400' :
  'bg-green-500/20 text-green-400'

export default function RelatoriosPage() {
  const navigate = useNavigate()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [reports, setReports] = useState<ReportRow[]>([])
  const [monthly, setMonthly] = useState<MonthlyStat[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!localStorage.getItem('sos-auth')) navigate('/')
  }, [navigate])

  useEffect(() => {
    Promise.all([
      fetchDashboardStats().then(setStats).catch(() => {}),
      fetchReportOcorrencias().then(setReports).catch(() => {}),
      fetchMonthlyStats().then(setMonthly).catch(() => {}),
    ]).finally(() => setLoading(false))
  }, [])

  const statusDist = reports.reduce<Record<string, number>>((acc, r) => {
    acc[r.status] = (acc[r.status] || 0) + 1
    return acc
  }, {})

  const pieData = Object.entries(statusDist).map(([name, value]) => ({ name, value }))

  const exportCSV = () => {
    const headers = ['ID', 'Tipo', 'Status', 'Data', 'Cidadão', 'Telefone', 'Agente', 'Esquadra', 'Província']
    const rows = reports.map(r => [
      r.id, r.tipo, r.status, r.created_at, r.cidadao_nome, r.cidadao_telefone, r.agente_nome, r.esquadra, r.provincia
    ].join(','))
    const csv = [headers.join(','), ...rows].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `relatorio_ocorrencias_${new Date().toISOString().substring(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex">
        <DashboardSidebar />
        <main className="ml-64 flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3 text-muted-foreground">
            <BarChart3 className="w-8 h-8 animate-pulse" />
            <p className="text-sm">A carregar relatórios...</p>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardSidebar />
      <main className="ml-64 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-3">
              <FileText className="w-6 h-6 text-primary" />
              Relatórios e Estatísticas
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Centro de comando — dados operacionais em tempo real
            </p>
          </div>
          <Button onClick={exportCSV} className="gap-2">
            <Download className="w-4 h-4" />
            Exportar CSV
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10"><BarChart3 className="w-5 h-5 text-primary" /></div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{stats?.total_ocorrencias ?? 0}</p>
                  <p className="text-[11px] text-muted-foreground uppercase tracking-wider">Total Ocorrências</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-red-500/10"><TrendingUp className="w-5 h-5 text-red-400" /></div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{stats?.pendentes ?? 0}</p>
                  <p className="text-[11px] text-muted-foreground uppercase tracking-wider">Pendentes</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-green-500/10"><Users className="w-5 h-5 text-green-400" /></div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{stats?.agentes_activos ?? 0}/{stats?.agentes_total ?? 0}</p>
                  <p className="text-[11px] text-muted-foreground uppercase tracking-wider">Agentes Activos</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-orange-500/10"><Car className="w-5 h-5 text-orange-400" /></div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{stats?.veiculos_procurados ?? 0}</p>
                  <p className="text-[11px] text-muted-foreground uppercase tracking-wider">Veículos Procurados</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="graficos" className="space-y-4">
          <TabsList>
            <TabsTrigger value="graficos">Gráficos</TabsTrigger>
            <TabsTrigger value="tabela">Tabela de Ocorrências</TabsTrigger>
          </TabsList>

          <TabsContent value="graficos">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Monthly Chart */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-primary" />
                    Ocorrências por Mês
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={monthly}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1e3a5f" />
                        <XAxis dataKey="mes" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                        <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} />
                        <Tooltip
                          contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e3a5f', borderRadius: 8 }}
                          labelStyle={{ color: '#e2e8f0' }}
                        />
                        <Bar dataKey="total" name="Total" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="finalizados" name="Finalizados" fill="#22c55e" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Status Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Shield className="w-4 h-4 text-primary" />
                    Distribuição por Status
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={pieData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={90}
                          paddingAngle={3}
                          dataKey="value"
                          label={({ name, value }) => `${name}: ${value}`}
                        >
                          {pieData.map((entry) => (
                            <Cell key={entry.name} fill={statusCores[entry.name] ?? '#64748b'} />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="tabela">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <FileText className="w-4 h-4 text-primary" />
                  Todas as Ocorrências
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-[11px]">ID</TableHead>
                        <TableHead className="text-[11px]">Tipo</TableHead>
                        <TableHead className="text-[11px]">Status</TableHead>
                        <TableHead className="text-[11px]">Data</TableHead>
                        <TableHead className="text-[11px]">Cidadão</TableHead>
                        <TableHead className="text-[11px]">Telefone</TableHead>
                        <TableHead className="text-[11px]">Agente</TableHead>
                        <TableHead className="text-[11px]">Esquadra</TableHead>
                        <TableHead className="text-[11px]">Província</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {reports.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={9} className="text-center text-muted-foreground text-sm py-8">
                            Nenhuma ocorrência encontrada.
                          </TableCell>
                        </TableRow>
                      ) : (
                        reports.map((r) => (
                          <TableRow key={r.id}>
                            <TableCell className="text-[11px] font-mono">{r.id.substring(0, 8)}</TableCell>
                            <TableCell className="text-[11px]">{r.tipo}</TableCell>
                            <TableCell>
                              <Badge className={`text-[10px] ${statusBg(r.status)}`}>{r.status}</Badge>
                            </TableCell>
                            <TableCell className="text-[11px]">
                              {r.created_at ? new Date(r.created_at).toLocaleDateString('pt-AO') : '-'}
                            </TableCell>
                            <TableCell className="text-[11px]">{r.cidadao_nome ?? '-'}</TableCell>
                            <TableCell className="text-[11px]">{r.cidadao_telefone ?? '-'}</TableCell>
                            <TableCell className="text-[11px]">{r.agente_nome ?? '-'}</TableCell>
                            <TableCell className="text-[11px]">{r.esquadra ?? '-'}</TableCell>
                            <TableCell className="text-[11px]">{r.provincia ?? '-'}</TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
