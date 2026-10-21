import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { initialEntries, type Appointment, type CalendarEntry, type VisitStatus } from '@/data/appointments'
import { clients as initialClients, type Client } from '@/data/clients'

export type ThemePref = 'light' | 'dark' | 'system'

type Prefs = {
  signedIn: boolean
  theme: ThemePref
  hideAmounts: boolean
  branchId: string
  /** Set right after sign-up: the app shows the setup checklist and demo-data banner. */
  onboarding: { active: boolean; done: string[] } | null
  signIn: () => void
  signOut: () => void
  setTheme: (t: ThemePref) => void
  toggleAmounts: () => void
  setBranch: (id: string) => void
  startOnboarding: () => void
  completeStep: (id: string) => void
  finishOnboarding: () => void
}

export const usePrefs = create<Prefs>()(
  persist(
    (set) => ({
      signedIn: false,
      theme: 'system',
      hideAmounts: false,
      branchId: 'b1',
      onboarding: null,
      signIn: () => set({ signedIn: true }),
      signOut: () => set({ signedIn: false, onboarding: null }),
      setTheme: (theme) => {
        set({ theme })
        applyTheme(theme)
      },
      toggleAmounts: () => set((s) => ({ hideAmounts: !s.hideAmounts })),
      setBranch: (branchId) => set({ branchId }),
      startOnboarding: () => set({ signedIn: true, onboarding: { active: true, done: ['account', 'business'] } }),
      completeStep: (id) =>
        set((s) => (s.onboarding ? { onboarding: { ...s.onboarding, done: [...new Set([...s.onboarding.done, id])] } } : s)),
      finishOnboarding: () => set({ onboarding: null }),
    }),
    {
      name: 'navcrm-prefs',
      partialize: (s) => ({ signedIn: s.signedIn, theme: s.theme, hideAmounts: s.hideAmounts, branchId: s.branchId, onboarding: s.onboarding }),
    },
  ),
)

export function applyTheme(t: ThemePref) {
  try {
    localStorage.setItem('navcrm-theme', t)
  } catch {
    /* storage may be unavailable */
  }
  const dark = t === 'dark' || (t === 'system' && matchMedia('(prefers-color-scheme: dark)').matches)
  const root = document.documentElement
  // Switching themes must not animate every color on the page at once.
  root.classList.add('theme-switching')
  root.dataset.theme = dark ? 'dark' : 'light'
  requestAnimationFrame(() => requestAnimationFrame(() => root.classList.remove('theme-switching')))
}

if (typeof window !== 'undefined') {
  matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
    if (usePrefs.getState().theme === 'system') applyTheme('system')
  })
}

/* ─────────────── Business data that the prototype lets you change ─────────────── */

type Data = {
  entries: CalendarEntry[]
  clients: Client[]
  addEntry: (e: CalendarEntry) => void
  updateEntry: (id: string, patch: Partial<Appointment>) => void
  removeEntry: (id: string) => void
  setStatus: (id: string, status: VisitStatus) => void
  addClient: (c: Client) => void
  updateClient: (id: string, patch: Partial<Client>) => void
}

export const useData = create<Data>()((set) => ({
  entries: initialEntries,
  clients: initialClients,
  addEntry: (e) => set((s) => ({ entries: [...s.entries, e] })),
  updateEntry: (id, patch) =>
    set((s) => ({ entries: s.entries.map((e) => (e.id === id && e.kind === 'visit' ? { ...e, ...patch } : e)) })),
  removeEntry: (id) => set((s) => ({ entries: s.entries.filter((e) => e.id !== id) })),
  setStatus: (id, status) =>
    set((s) => ({
      entries: s.entries.map((e) =>
        e.id === id && e.kind === 'visit' ? { ...e, status, paid: status === 'completed' ? true : e.paid } : e,
      ),
    })),
  addClient: (c) => set((s) => ({ clients: [c, ...s.clients] })),
  updateClient: (id, patch) => set((s) => ({ clients: s.clients.map((c) => (c.id === id ? { ...c, ...patch } : c)) })),
}))

export const useClient = (id: string | null | undefined) => useData((s) => (id ? s.clients.find((c) => c.id === id) : undefined))
