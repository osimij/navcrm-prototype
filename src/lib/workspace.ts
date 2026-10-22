import { create } from 'zustand'
import { persist } from 'zustand/middleware'

type Workspace = {
  sidebarCollapsed: boolean
  /** Folded sections, shown parts of Home, visible list columns. */
  sections: Record<string, boolean>
  /** Small per-list choices that are not on/off, such as a list's ordering. */
  values: Record<string, string>
  toggleSidebar: () => void
  setSection: (id: string, open: boolean) => void
  setValue: (id: string, value: string) => void
}

/** Presentation preferences only; business data and drafts live in their own stores. */
export const useWorkspace = create<Workspace>()(persist((set) => ({
  sidebarCollapsed: false,
  sections: {},
  values: {},
  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
  setSection: (id, open) => set((s) => ({ sections: { ...s.sections, [id]: open } })),
  setValue: (id, value) => set((s) => ({ values: { ...s.values, [id]: value } })),
}), { name: 'navcrm-workspace' }))
