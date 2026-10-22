import { create } from 'zustand'
import { persist } from 'zustand/middleware'

type Workspace = {
  sidebarCollapsed: boolean
  sections: Record<string, boolean>
  toggleSidebar: () => void
  setSection: (id: string, open: boolean) => void
}

/** Presentation preferences only; business data and drafts live in their own stores. */
export const useWorkspace = create<Workspace>()(persist((set) => ({
  sidebarCollapsed: false,
  sections: {},
  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
  setSection: (id, open) => set((s) => ({ sections: { ...s.sections, [id]: open } })),
}), { name: 'navcrm-workspace' }))
