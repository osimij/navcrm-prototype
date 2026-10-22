import { create } from 'zustand'
import { text as translate } from '@/i18n'
import { useOverlays } from '@/lib/overlays'
import { useData } from '@/lib/store'
import type { Block } from './answers'
import { HISTORY, answer, trace } from './answers'

export type ChatMessage = {
  id: string
  role: 'user' | 'assistant'
  text?: string
  blocks?: Block[]
  pending?: boolean
  /** The person stopped the answer before it arrived. */
  stopped?: boolean
  /** What the assistant looked at, shown as "Worked for …" like Linear's agent. */
  steps?: string[]
  startedAt?: number
  duration?: number
  /** When the answer arrived; only a fresh answer animates in. */
  resolvedAt?: number
  feedback?: 'up' | 'down'
}
export type Chat = { id: string; title: string; titleIsUserText?: boolean; at: number; messages: ChatMessage[] }

let seq = 0
export const uid = (p: string) => `${p}${++seq}`

/**
 * Router-bound actions answers can take ("Open revenue report"). The dock binds
 * them once, inside the router, so any component can ask without knowing how.
 */
type Navigate = (to: string) => void
let navigateTo: Navigate = () => {}
const currentPath = () => window.location.pathname
export function bindAssistant(navigate: Navigate) {
  navigateTo = navigate
}

const timers = new Map<string, ReturnType<typeof setTimeout>>()
const HOUR = 3_600_000

type Assistant = {
  chats: Chat[]
  activeId: string | null
  drafts: Record<string, string>
  /** The floating panel. It keeps the conversation while you move between pages. */
  dock: boolean
  setDraft: (id: string | null, text: string) => void
  setActive: (id: string | null) => void
  newChat: () => void
  /** The active conversation, or a new one titled from the question. */
  ensureChat: (title: string) => string
  addMessage: (chatId: string, m: ChatMessage) => void
  /** Fill a pending answer in the conversation it was asked in, wherever you are now. */
  resolve: (chatId: string, messageId: string, blocks: Block[], duration?: number) => void
  deleteChat: (id: string) => void
  openDock: () => void
  closeDock: () => void
  toggleDock: () => void
  /** Ask in the current conversation, or start one. */
  ask: (question: string) => void
  /** Ask from anywhere (⌘K, a report): opens the panel on a fresh conversation. */
  askInDock: (question: string) => void
  stop: (chatId: string) => void
  setFeedback: (chatId: string, messageId: string, value: 'up' | 'down' | undefined) => void
}

function patchMessage(chats: Chat[], chatId: string, messageId: string, patch: Partial<ChatMessage>) {
  return chats.map((c) => (c.id === chatId ? { ...c, messages: c.messages.map((m) => (m.id === messageId ? { ...m, ...patch } : m)) } : c))
}

/** Kept in memory so moving around the app keeps the conversation. */
export const useAssistant = create<Assistant>()((set, get) => ({
  chats: HISTORY.map((h, i) => ({ id: `h${i}`, title: h.title, at: Date.now() - h.hoursAgo * HOUR, messages: [] })),
  activeId: null,
  drafts: {},
  dock: false,
  setDraft: (id, text) => set((s) => ({ drafts: { ...s.drafts, [id ?? 'new']: text } })),
  setActive: (activeId) => set({ activeId }),
  newChat: () => set({ activeId: null }),
  ensureChat: (title) => {
    const { activeId, chats } = get()
    if (activeId && chats.some((c) => c.id === activeId)) return activeId
    // A question can contain paragraphs or a long reference. Keep history
    // scannable; the complete, unchanged question stays in the conversation.
    const firstLine = title.trim().split(/\r?\n/)[0].trim()
    const chars = Array.from(firstLine)
    const shortTitle = chars.length > 72 ? chars.slice(0, 71).join('').trimEnd() + '…' : firstLine
    const chat: Chat = { id: uid('chat'), title: shortTitle, titleIsUserText: true, at: Date.now(), messages: [] }
    set({ chats: [chat, ...chats], activeId: chat.id })
    return chat.id
  },
  addMessage: (chatId, m) =>
    set((s) => ({ chats: s.chats.map((c) => (c.id === chatId ? { ...c, at: Date.now(), messages: [...c.messages, m] } : c)) })),
  resolve: (chatId, messageId, blocks, duration) =>
    set((s) => ({ chats: patchMessage(s.chats, chatId, messageId, { pending: false, blocks, duration, resolvedAt: Date.now() }) })),
  deleteChat: (id) => set((s) => ({ chats: s.chats.filter((c) => c.id !== id), activeId: s.activeId === id ? null : s.activeId })),
  openDock: () => set({ dock: true }),
  closeDock: () => set({ dock: false }),
  toggleDock: () => set((s) => ({ dock: !s.dock })),

  ask: (raw) => {
    const q = raw.trim()
    if (!q) return
    const { ensureChat, addMessage, resolve } = get()
    const chatId = ensureChat(q)
    const pendingId = uid('a')
    const steps = trace(q)
    addMessage(chatId, { id: uid('u'), role: 'user', text: q })
    addMessage(chatId, { id: pendingId, role: 'assistant', pending: true, steps, startedAt: Date.now() })
    // A short beat while numbers are gathered; the answer then appears whole, not typed out.
    const delay = 700 + Math.min(q.length * 4, 250) + steps.length * 120
    timers.set(
      pendingId,
      setTimeout(() => {
        timers.delete(pendingId)
        const { entries, clients } = useData.getState()
        const { openNewVisit, openClient } = useOverlays.getState()
        const blocks = answer(q, {
          entries,
          clients,
          // Leaving the full-page chat for a report keeps the conversation beside you.
          navigate: (to) => {
            if (currentPath().startsWith('/assistant')) set({ dock: true })
            navigateTo(to)
          },
          openNewVisit,
          openClient,
          ask: (x) => get().ask(translate(x)),
        })
        resolve(chatId, pendingId, blocks, delay)
      }, delay),
    )
  },

  askInDock: (question) => {
    set({ activeId: null, dock: true })
    get().ask(question)
  },

  stop: (chatId) => {
    const chat = get().chats.find((c) => c.id === chatId)
    const pending = chat?.messages.find((m) => m.pending)
    if (!pending) return
    clearTimeout(timers.get(pending.id))
    timers.delete(pending.id)
    set((s) => ({
      chats: patchMessage(s.chats, chatId, pending.id, { pending: false, stopped: true, duration: Date.now() - (pending.startedAt ?? Date.now()) }),
    }))
  },

  setFeedback: (chatId, messageId, feedback) => set((s) => ({ chats: patchMessage(s.chats, chatId, messageId, { feedback }) })),
}))
