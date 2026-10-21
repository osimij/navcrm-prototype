import { create } from 'zustand'
import { initialOrders, initialTemplates, initialTests, type LabOrder, type LabTest, type OrderStatus, type ResultTemplate } from './data'

type Lab = {
  orders: LabOrder[]
  tests: LabTest[]
  templates: ResultTemplate[]
  /** Which order sheet is open. */
  orderId: string | null
  /** Test modal: null closed, 'new' to add, or a test id to edit. */
  testEditing: string | null
  /** Template sheet: null closed, 'new', or a template id. */
  templateEditing: string | null
  openOrder: (id: string | null) => void
  editTest: (id: string | null) => void
  editTemplate: (id: string | null) => void
  addOrder: (o: LabOrder) => void
  updateOrder: (id: string, patch: Partial<LabOrder>) => void
  setStatus: (id: string, status: OrderStatus, at?: Partial<Pick<LabOrder, 'sampleAt' | 'readyAt' | 'sentAt'>>) => void
  setResult: (id: string, indicatorId: string, value: string) => void
  saveTest: (t: LabTest) => void
  saveTemplate: (t: ResultTemplate) => void
}

export const useLab = create<Lab>()((set) => ({
  orders: initialOrders,
  tests: initialTests,
  templates: initialTemplates,
  orderId: null,
  testEditing: null,
  templateEditing: null,
  openOrder: (orderId) => set({ orderId }),
  editTest: (testEditing) => set({ testEditing }),
  editTemplate: (templateEditing) => set({ templateEditing }),
  addOrder: (o) => set((s) => ({ orders: [o, ...s.orders] })),
  updateOrder: (id, patch) => set((s) => ({ orders: s.orders.map((o) => (o.id === id ? { ...o, ...patch } : o)) })),
  setStatus: (id, status, at = {}) => set((s) => ({ orders: s.orders.map((o) => (o.id === id ? { ...o, status, ...at } : o)) })),
  setResult: (id, indicatorId, value) =>
    set((s) => ({ orders: s.orders.map((o) => (o.id === id ? { ...o, results: { ...o.results, [indicatorId]: value } } : o)) })),
  saveTest: (t) =>
    set((s) => ({ tests: s.tests.some((x) => x.id === t.id) ? s.tests.map((x) => (x.id === t.id ? t : x)) : [...s.tests, t] })),
  saveTemplate: (t) =>
    set((s) => ({
      templates: s.templates.some((x) => x.id === t.id) ? s.templates.map((x) => (x.id === t.id ? t : x)) : [...s.templates, t],
    })),
}))
