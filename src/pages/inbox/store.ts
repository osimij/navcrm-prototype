import { create } from 'zustand'
import { currentUser } from '@/data/business'
import { NOW } from '@/lib/time'
import { initialConversations, type Channel, type Conversation, type Message } from './data'

let seq = 0
const id = (p: string) => `${p}${Date.now().toString(36)}${++seq}`

/** Messages sent in the prototype get the current wall-clock minutes on top of the demo "now". */
const sentAt = () => new Date(NOW.getTime() + (Date.now() - started))
const started = Date.now()

type Inbox = {
  conversations: Conversation[]
  send: (convId: string, text: string, extra?: Partial<Message>) => void
  assign: (convId: string, staffId: string | null, staffName?: string) => void
  setStatus: (convId: string, status: 'open' | 'closed') => void
  markRead: (convId: string) => void
  start: (clientId: string, channel?: Channel) => string
}

const system = (text: string): Message => ({ id: id('s'), from: 'system', at: sentAt(), text, fresh: true })

export const useInbox = create<Inbox>()((set, get) => ({
  conversations: initialConversations,
  send: (convId, text, extra) =>
    set((s) => ({
      conversations: s.conversations.map((c) => {
        if (c.id !== convId) return c
        const msgs: Message[] = [...c.messages]
        // Replying takes over from the client-facing assistant.
        if (c.ai) msgs.push(system(`${currentUser.firstName} took over from the assistant`))
        msgs.push({ id: id('m'), from: 'staff', staffId: currentUser.id, at: sentAt(), text, fresh: true, ...extra })
        return { ...c, messages: msgs, ai: false, unread: 0, assigneeId: c.assigneeId ?? currentUser.id, status: 'open' }
      }),
    })),
  assign: (convId, staffId, staffName) =>
    set((s) => ({
      conversations: s.conversations.map((c) =>
        c.id === convId
          ? {
              ...c,
              assigneeId: staffId,
              messages: [...c.messages, system(staffId ? `${currentUser.firstName} assigned ${staffName} to this conversation` : `${currentUser.firstName} unassigned this conversation`)],
            }
          : c,
      ),
    })),
  setStatus: (convId, status) =>
    set((s) => ({
      conversations: s.conversations.map((c) =>
        c.id === convId
          ? {
              ...c,
              status,
              unread: 0,
              messages: [...c.messages, system(status === 'closed' ? `${currentUser.firstName} closed the conversation` : `${currentUser.firstName} reopened the conversation`)],
            }
          : c,
      ),
    })),
  markRead: (convId) =>
    set((s) => ({ conversations: s.conversations.map((c) => (c.id === convId && c.unread ? { ...c, unread: 0 } : c)) })),
  start: (clientId, channel = 'telegram') => {
    const existing = get().conversations.find((c) => c.clientId === clientId && c.status === 'open')
    if (existing) return existing.id
    const conv: Conversation = {
      id: id('cv'),
      clientId,
      channel,
      assigneeId: currentUser.id,
      status: 'open',
      ai: false,
      unread: 0,
      messages: [system('Chat started via the Telegram bot. Clients without Telegram get an SMS with a link.')],
    }
    set((s) => ({ conversations: [conv, ...s.conversations] }))
    return conv.id
  },
}))

export const lastMessage = (c: Conversation) => [...c.messages].reverse().find((m) => m.from !== 'system') ?? c.messages[c.messages.length - 1]
