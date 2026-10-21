import { create } from 'zustand'

export type NewVisitPrefill = {
  clientId?: string
  staffId?: string
  start?: Date
  serviceIds?: string[]
  mode?: 'visit' | 'block'
}

/**
 * App-wide overlays. Any screen can open a client, a visit, or a create form
 * without knowing where those components live; AppShell mounts them once.
 */
type Overlays = {
  clientId: string | null
  visitId: string | null
  newVisit: NewVisitPrefill | null
  newClient: { name?: string; phone?: string; onCreated?: (id: string) => void } | null
  newTask: { clientId?: string; title?: string } | null
  command: boolean
  notifications: boolean
  openClient: (id: string) => void
  openVisit: (id: string) => void
  openNewVisit: (prefill?: NewVisitPrefill) => void
  openNewClient: (opts?: Overlays['newClient']) => void
  openNewTask: (opts?: Overlays['newTask']) => void
  setCommand: (open: boolean) => void
  setNotifications: (open: boolean) => void
  close: (key: 'clientId' | 'visitId' | 'newVisit' | 'newClient' | 'newTask') => void
}

export const useOverlays = create<Overlays>()((set) => ({
  clientId: null,
  visitId: null,
  newVisit: null,
  newClient: null,
  newTask: null,
  command: false,
  notifications: false,
  openClient: (clientId) => set({ clientId }),
  openVisit: (visitId) => set({ visitId }),
  openNewVisit: (prefill = {}) => set({ newVisit: prefill }),
  openNewClient: (opts = {}) => set({ newClient: opts }),
  openNewTask: (opts = {}) => set({ newTask: opts }),
  setCommand: (command) => set({ command }),
  setNotifications: (notifications) => set({ notifications }),
  close: (key) => set({ [key]: null } as Partial<Overlays>),
}))
