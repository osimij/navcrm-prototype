import { create } from 'zustand'
import type { Block } from './answers'
import { HISTORY } from './answers'

export type ChatMessage = { id: string; role: 'user' | 'assistant'; text?: string; blocks?: Block[]; pending?: boolean }
export type Chat = { id: string; title: string; titleIsUserText?: boolean; group: 'Today' | 'This week'; messages: ChatMessage[] }

let seq = 0
export const uid = (p: string) => `${p}${++seq}`

type Assistant = {
  chats: Chat[]
  drafts: Record<string, string>
  setDraft: (id: string | null, text: string) => void
  activeId: string | null
  setActive: (id: string | null) => void
  newChat: () => void
  addMessage: (chatId: string, m: ChatMessage) => void
  resolve: (chatId: string, msgId: string, blocks: Block[]) => void
  ensureChat: (title: string) => string
}

/** Kept in memory so leaving the page and coming back keeps the conversation. */
export const useAssistant = create<Assistant>()((set, get) => ({
  chats: HISTORY.map((h, i) => ({ id: `h${i}`, title: h.title, group: h.group as Chat['group'], messages: [] })),
  activeId: null,
  drafts: {},
  setDraft: (id, text) => set((s) => ({ drafts: { ...s.drafts, [id ?? 'new']: text } })),
  setActive: (activeId) => set({ activeId }),
  newChat: () => set({ activeId: null }),
  addMessage: (chatId, m) => set((s) => ({ chats: s.chats.map((c) => (c.id === chatId ? { ...c, messages: [...c.messages, m] } : c)) })),
  resolve: (chatId, msgId, blocks) =>
    set((s) => ({
      chats: s.chats.map((c) =>
        c.id === chatId ? { ...c, messages: c.messages.map((m) => (m.id === msgId ? { ...m, pending: false, blocks } : m)) } : c,
      ),
    })),
  ensureChat: (title) => {
    const { activeId, chats } = get()
    if (activeId && chats.some((c) => c.id === activeId)) return activeId
    // A question can contain paragraphs or a long reference. Keep navigation
    // scannable; the complete, unchanged question belongs in the conversation.
    const firstLine = title.trim().split(/\r?\n/)[0].trim()
    const chars = Array.from(firstLine)
    const shortTitle = chars.length > 72 ? chars.slice(0, 71).join('').trimEnd() + '…' : firstLine
    const chat: Chat = { id: uid('chat'), title: shortTitle, titleIsUserText: true, group: 'Today', messages: [] }
    set({ chats: [chat, ...chats], activeId: chat.id })
    return chat.id
  },
}))
