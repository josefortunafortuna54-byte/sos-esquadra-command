import { useState, useEffect, useRef } from 'react'
import { Send, MessageSquare, User, Shield } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { subscribeToMessages, sendMessage, markMessagesAsRead, type Message } from '@/lib/chatApi'

interface ChatPanelProps {
  occurrenceId: string
  occurrenceTitle: string
  onClose: () => void
}

export function ChatPanel({ occurrenceId, occurrenceTitle, onClose }: ChatPanelProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const listRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const unsub = subscribeToMessages(occurrenceId, (msgs) => {
      setMessages(msgs)
    })
    markMessagesAsRead(occurrenceId)
    return () => { unsub() }
  }, [occurrenceId])

  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight
    }
  }, [messages])

  const handleSend = async () => {
    const content = text.trim()
    if (!content) return
    setSending(true)
    setText('')
    try {
      await sendMessage(occurrenceId, content)
    } catch (e) {
      console.error(e)
    }
    setSending(false)
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-card/50">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-primary" />
          <span className="text-sm font-semibold text-foreground truncate max-w-[200px]">
            {occurrenceTitle}
          </span>
        </div>
        <Button variant="ghost" size="sm" onClick={onClose} className="h-7 text-xs">Fechar</Button>
      </div>

      <div ref={listRef} className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground text-xs gap-2">
            <MessageSquare className="w-8 h-8 opacity-30" />
            <p>Sem mensagens. Envie uma mensagem para o cidadão.</p>
          </div>
        )}
        {messages.map((msg) => {
          const isCommand = msg.sender_role === 'command'
          const isAgent = msg.sender_role === 'agent'
          const isMine = isCommand
          const time = msg.created_at?.substring(11, 16) ?? ''

          return (
            <div key={msg.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[80%] rounded-xl px-3 py-2 ${
                  isMine
                    ? 'bg-primary/20 rounded-br-sm'
                    : isAgent
                    ? 'bg-blue-500/20 rounded-bl-sm'
                    : 'bg-card rounded-bl-sm'
                }`}
              >
                <div className="flex items-center gap-1 mb-1">
                  {isMine ? (
                    <Shield className="w-3 h-3 text-primary" />
                  ) : isAgent ? (
                    <User className="w-3 h-3 text-blue-400" />
                  ) : (
                    <User className="w-3 h-3 text-foreground" />
                  )}
                  <span className="text-[10px] text-muted-foreground">
                    {isMine ? 'Comando' : isAgent ? 'Agente' : 'Cidadão'}
                  </span>
                </div>
                <p className="text-sm text-foreground">{msg.content}</p>
                <div className="flex items-center gap-1 mt-1">
                  <span className="text-[10px] text-muted-foreground">{time}</span>
                  {msg.read_at && <span className="text-[10px] text-blue-400">✓✓</span>}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <div className="p-3 border-t border-border bg-card/50">
        <div className="flex gap-2">
          <Input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Escrever mensagem para o cidadão..."
            className="h-9 text-sm"
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          />
          <Button size="sm" className="h-9 px-3" onClick={handleSend} disabled={sending || !text.trim()}>
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
