import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { MessageSquare, Users } from 'lucide-react'
import DashboardSidebar from '@/components/DashboardSidebar'
import { ChatPanel } from '@/components/ChatPanel'
import { supabase } from '@/lib/supabase'

interface OccurrenceChat {
  id: string
  tipo: string
  status: string
}

export default function ChatPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const selectedId = searchParams.get('id')
  const [occurrences, setOccurrences] = useState<OccurrenceChat[]>([])
  const [selectedOcc, setSelectedOcc] = useState<OccurrenceChat | null>(null)

  useEffect(() => {
    if (!localStorage.getItem('sos-auth')) navigate('/')
  }, [navigate])

  useEffect(() => {
    supabase
      .from('occurrences')
      .select('id, tipo, status')
      .order('created_at', { ascending: false })
      .limit(50)
      .then(({ data }) => {
        if (data) setOccurrences(data)
      })

    const channel = supabase
      .channel('chat-occ-list')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'occurrences' }, async () => {
        const { data } = await supabase
          .from('occurrences')
          .select('id, tipo, status')
          .order('created_at', { ascending: false })
          .limit(50)
        if (data) setOccurrences(data)
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [])

  useEffect(() => {
    if (selectedId && !selectedOcc) {
      const occ = occurrences.find(o => o.id === selectedId)
      if (occ) setSelectedOcc(occ)
    }
  }, [selectedId, occurrences, selectedOcc])

  const statusColor = (s: string) =>
    s === 'Pendente' ? 'text-red-400' :
    s === 'Finalizado' ? 'text-green-400' :
    'text-orange-400'

  return (
    <div className="min-h-screen bg-background">
      <DashboardSidebar />
      <main className="ml-64 flex h-screen">
        {/* Occurrence list */}
        <div className="w-72 border-r border-border flex flex-col flex-shrink-0">
          <div className="px-4 py-3 border-b border-border bg-card/30">
            <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-primary" />
              Conversas
            </h2>
            <p className="text-[10px] text-muted-foreground mt-0.5">{occurrences.length} ocorrências</p>
          </div>
          <div className="flex-1 overflow-y-auto">
            {occurrences.map((occ) => (
              <button
                key={occ.id}
                onClick={() => setSelectedOcc(occ)}
                className={`w-full text-left px-4 py-3 border-b border-border/50 hover:bg-card/50 transition-colors ${
                  selectedOcc?.id === occ.id ? 'bg-card border-l-2 border-l-primary' : ''
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-foreground truncate max-w-[160px]">
                    {occ.tipo}
                  </span>
                  <span className={`text-[10px] font-semibold ${statusColor(occ.status)}`}>
                    {occ.status}
                  </span>
                </div>
                <p className="text-[10px] font-mono text-muted-foreground mt-0.5">
                  #{occ.id.substring(0, 8)}
                </p>
              </button>
            ))}
            {occurrences.length === 0 && (
              <div className="flex flex-col items-center justify-center h-40 text-muted-foreground text-xs gap-2">
                <Users className="w-6 h-6 opacity-30" />
                <p>Nenhuma ocorrência</p>
              </div>
            )}
          </div>
        </div>

        {/* Chat panel */}
        <div className="flex-1">
          {selectedOcc ? (
            <ChatPanel
              occurrenceId={selectedOcc.id}
              occurrenceTitle={selectedOcc.tipo}
              onClose={() => setSelectedOcc(null)}
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
              <MessageSquare className="w-12 h-12 opacity-20 mb-3" />
              <p className="text-sm">Seleccione uma ocorrência para iniciar o chat</p>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
