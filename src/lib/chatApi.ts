import { supabase } from './supabase'

export interface Message {
  id: string
  occurrence_id: string
  sender_id: string
  sender_role: 'user' | 'agent' | 'command'
  content: string
  created_at: string
  read_at: string | null
}

export function subscribeToMessages(
  occurrenceId: string,
  callback: (messages: Message[]) => void
) {
  const channel = supabase
    .channel(`messages-${occurrenceId}`)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'messages', filter: `occurrence_id=eq.${occurrenceId}` },
      async () => {
        const { data } = await supabase
          .from('messages')
          .select('*')
          .eq('occurrence_id', occurrenceId)
          .order('created_at', { ascending: true })
        callback(data ?? [])
      }
    )
    .subscribe()

  // Initial fetch
  supabase
    .from('messages')
    .select('*')
    .eq('occurrence_id', occurrenceId)
    .order('created_at', { ascending: true })
    .then(({ data }) => {
      if (data) callback(data)
    })

  return () => supabase.removeChannel(channel)
}

export async function sendMessage(
  occurrenceId: string,
  content: string
): Promise<void> {
  const user = await supabase.auth.getUser()
  if (!user.data.user) throw new Error('Não autenticado')

  const { error } = await supabase.from('messages').insert({
    occurrence_id: occurrenceId,
    sender_id: user.data.user.id,
    sender_role: 'command',
    content,
  })

  if (error) throw new Error(error.message)
}

export async function markMessagesAsRead(occurrenceId: string): Promise<void> {
  const user = await supabase.auth.getUser()
  if (!user.data.user) return

  await supabase
    .from('messages')
    .update({ read_at: new Date().toISOString() })
    .eq('occurrence_id', occurrenceId)
    .neq('sender_id', user.data.user.id)
    .is('read_at', null)
}

export async function fetchOccurrenceMedia(occurrenceId: string) {
  const { data } = await supabase
    .from('occurrence_media')
    .select('*')
    .eq('occurrence_id', occurrenceId)
    .order('created_at', { ascending: false })
  return data ?? []
}
