import { useState, useRef, useEffect } from 'react'
import { Bot, Send, X, Loader2, Sparkles, AlertTriangle, Shield, Navigation } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { supabase } from '@/lib/supabase'

interface AIAssistantProps {
  occurrenceId?: string | null
  onClose: () => void
}

export function AIAssistant({ occurrenceId, onClose }: AIAssistantProps) {
  const [messages, setMessages] = useState<{ role: 'user' | 'assistant'; content: string }[]>([
    {
      role: 'assistant',
      content: 'Olá! Sou o assistente IA do SOS Esquadra. Posso ajudar com:\n\n• Análise de ocorrências\n• Sugestão de despacho\n• Estatísticas rápidas\n• Previsão de recursos\n\nO que deseja saber?',
    },
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const listRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight
    }
  }, [messages])

  const handleSend = async () => {
    const text = input.trim()
    if (!text || loading) return
    setInput('')
    setMessages((prev) => [...prev, { role: 'user', content: text }])
    setLoading(true)

    try {
      let response = ''

      if (text.toLowerCase().includes('ocorrência') && occurrenceId) {
        const { data: occ } = await supabase
          .from('occurrences')
          .select('*, users(nome, telefone)')
          .eq('id', occurrenceId)
          .single()

        if (occ) {
          // Use a local AI analysis based on the data
          const statusFlow = (s: string) => {
            switch (s) {
              case 'Pendente': return '🔴 Aguarda despacho'
              case 'Despachado': return '🔵 Agente a caminho'
              case 'A caminho': return '🟠 Agente em deslocação'
              case 'No local': return '🟣 Agente no local'
              case 'Finalizado': return '🟢 Concluído'
              default: return s
            }
          }

          response = `📋 **Análise da Ocorrência**\n\n`
          response += `**Tipo:** ${occ.tipo}\n`
          response += `**Status:** ${statusFlow(occ.status)}\n`
          response += `**Cidadão:** ${occ.users?.nome ?? 'Desconhecido'}\n`
          response += `**Contacto:** ${occ.users?.telefone ?? 'N/A'}\n`
          response += `**Localização:** ${occ.latitude?.toFixed(4)}, ${occ.longitude?.toFixed(4)}\n`
          if (occ.descricao) response += `**Descrição:** ${occ.descricao}\n`
          response += `**Criada em:** ${new Date(occ.created_at).toLocaleString('pt-AO')}\n\n`

          if (occ.status === 'Pendente') {
            const { data: agents } = await supabase
              .from('agent_locations')
              .select('*, police_agents(nome)')
              .gt('updated_at', new Date(Date.now() - 30 * 60000).toISOString())
              .limit(5)

            if (agents && agents.length > 0) {
              response += `🚔 **Agentes disponíveis:** ${agents.length}\n`
              response += `💡 **Sugestão:** Despachar agente mais próximo automaticamente.`
            }
          }
        } else {
          response = '❌ Ocorrência não encontrada.'
        }
      } else if (text.toLowerCase().includes('estatística') || text.toLowerCase().includes('stats') || text.toLowerCase().includes('resumo')) {
        const { data: stats } = await supabase.rpc('get_dashboard_stats')
        if (stats) {
          response = `📊 **Resumo Operacional**\n\n`
          response += `• Total de ocorrências: **${stats.total_ocorrencias}**\n`
          response += `• Pendentes: **${stats.pendentes}**\n`
          response += `• Hoje: **${stats.hoje}**\n`
          response += `• Este mês: **${stats.este_mes}**\n`
          response += `• Finalizados hoje: **${stats.finalizados_hoje}**\n`
          response += `• Agentes activos: **${stats.agentes_activos}**\n`
          response += `• Tempo médio resposta: **${stats.tempo_medio_resposta}min**\n`
          response += `• Veículos procurados: **${stats.veiculos_procurados}**\n`
          response += `• Veículos recuperados: **${stats.veiculos_recuperados}**\n\n`
          response += stats.pendentes > 5
            ? '⚠️ **Alerta:** Número elevado de ocorrências pendentes. Considere mobilizar mais recursos.'
            : '✅ **Situação operacional dentro da normalidade.**'
        } else {
          response = '❌ Não foi possível obter estatísticas.'
        }
      } else if (text.toLowerCase().includes('agente') && text.toLowerCase().includes('próximo')) {
        const { data: agents } = await supabase
          .from('agent_locations')
          .select('*, police_agents(nome, codigo)')
          .gt('updated_at', new Date(Date.now() - 30 * 60000).toISOString())

        if (agents && agents.length > 0) {
          response = `🚔 **Agentes em serviço (${agents.length}):**\n\n`
          agents.slice(0, 5).forEach((a: any, i: number) => {
            response += `${i + 1}. **${a.police_agents?.nome ?? 'Agente'}** (${a.police_agents?.codigo ?? '---'})\n`
            response += `   📍 ${a.latitude?.toFixed(4)}, ${a.longitude?.toFixed(4)}\n`
            response += `   🕐 ${new Date(a.updated_at).toLocaleTimeString('pt-AO')}\n\n`
          })
        } else {
          response = '❌ Nenhum agente ativo encontrado nos últimos 30 minutos.'
        }
      } else {
        response = `Compreendo a sua questão sobre "${text.substring(0, 50)}".\n\nComo assistente IA do SOS Esquadra, posso:\n• Analisar ocorrências específicas\n• Mostrar estatísticas operacionais\n• Sugerir despacho de agentes\n• Identificar padrões de ocorrências\n• Gerar relatórios rápidos\n\nComo posso ajudar mais especificamente?`
      }

      setMessages((prev) => [...prev, { role: 'assistant', content: response }])
    } catch (e) {
      setMessages((prev) => [...prev, { role: 'assistant', content: '❌ Erro ao processar o pedido. Tente novamente.' }])
    }
    setLoading(false)
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-card/50">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-yellow-400" />
          <span className="text-sm font-semibold text-foreground">Assistente IA</span>
        </div>
        <Button variant="ghost" size="sm" onClick={onClose} className="h-7 text-xs">
          <X className="w-3 h-3" />
        </Button>
      </div>

      <div ref={listRef} className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-[85%] rounded-xl px-3 py-2 ${
                msg.role === 'user'
                  ? 'bg-primary/20 rounded-br-sm'
                  : 'bg-card rounded-bl-sm border border-border/50'
              }`}
            >
              {msg.role === 'assistant' && (
                <div className="flex items-center gap-1 mb-1">
                  <Bot className="w-3 h-3 text-yellow-400" />
                  <span className="text-[10px] text-yellow-400 font-semibold">IA</span>
                </div>
              )}
              <p className="text-sm text-foreground whitespace-pre-wrap">{msg.content}</p>
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="max-w-[85%] rounded-xl px-3 py-2 bg-card border border-border/50">
              <div className="flex items-center gap-2">
                <Loader2 className="w-3 h-3 animate-spin text-yellow-400" />
                <span className="text-xs text-muted-foreground">A analisar...</span>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="p-3 border-t border-border bg-card/50">
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Faça uma pergunta sobre operações..."
            className="h-9 text-sm"
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          />
          <Button size="sm" className="h-9 px-3" onClick={handleSend} disabled={loading || !input.trim()}>
            <Send className="w-4 h-4" />
          </Button>
        </div>
        <div className="flex gap-2 mt-2">
          <button
            className="text-[10px] text-muted-foreground hover:text-foreground px-2 py-1 rounded bg-card border border-border/50"
            onClick={() => { setInput('Mostrar resumo operacional'); }}
          >
            📊 Resumo
          </button>
          <button
            className="text-[10px] text-muted-foreground hover:text-foreground px-2 py-1 rounded bg-card border border-border/50"
            onClick={() => { setInput('Quais agentes estão próximos?'); }}
          >
            🚔 Agentes
          </button>
        </div>
      </div>
    </div>
  )
}
