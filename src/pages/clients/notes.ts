import { create } from 'zustand'
import { clientById } from '@/data/clients'
import { NOW, addDays, addMinutes } from '@/lib/time'

export type ClientNote = { id: string; text: string; author: string; at: Date }

/** Notes per client. Seeded from the client record so the demo has history. */
export const useNotes = create<{
  byClient: Record<string, ClientNote[]>
  add: (clientId: string, text: string) => void
}>()((set) => ({
  byClient: {
    c1: [
      { id: 'n1', text: clientById.c1.note ?? '', author: 'Madina Rahimova', at: addDays(NOW, -9) },
      { id: 'n2', text: 'Asked about a keratin treatment before New Year. Offer when she comes in.', author: 'Nigora Alieva', at: addMinutes(addDays(NOW, -2), -200) },
    ],
    c2: [{ id: 'n3', text: 'Paid part of the last visit, promised to bring the rest next time.', author: 'Nigora Alieva', at: addDays(NOW, -12) }],
  },
  add: (clientId, text) =>
    set((s) => ({
      byClient: {
        ...s.byClient,
        [clientId]: [{ id: `n${Date.now()}`, text, author: 'Zarina Karimova', at: NOW }, ...(s.byClient[clientId] ?? [])],
      },
    })),
}))

export function notesFor(byClient: Record<string, ClientNote[]>, clientId: string, fallback?: string) {
  const list = byClient[clientId]
  if (list) return list
  return fallback ? [{ id: `${clientId}-seed`, text: fallback, author: 'Nigora Alieva', at: addDays(NOW, -20) }] : []
}
