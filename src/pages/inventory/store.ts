import { create } from 'zustand'
import {
  initialOrders,
  initialProducts,
  initialTechCards,
  makeDocs,
  suppliers as initialSuppliers,
  type Product,
  type StockDoc,
  type Supplier,
  type SupplierOrder,
  type TechLine,
} from './data'

type Inventory = {
  products: Product[]
  suppliers: Supplier[]
  docs: StockDoc[]
  orders: SupplierOrder[]
  techCards: Record<string, TechLine[]>
  /** Which create forms / sheets are open; the header and the tabs share them. */
  addProduct: boolean
  addSupplier: boolean
  productId: string | null
  setAddProduct: (open: boolean) => void
  setAddSupplier: (open: boolean) => void
  openProduct: (id: string | null) => void
  addProductItem: (p: Product) => void
  updateProduct: (id: string, patch: Partial<Product>) => void
  addSupplierItem: (s: Supplier) => void
  addDoc: (d: StockDoc) => void
  setDocStatus: (id: string, status: StockDoc['status']) => void
  addOrders: (o: SupplierOrder[]) => void
  receiveOrder: (id: string) => void
  setTechCard: (serviceId: string, lines: TechLine[]) => void
}

export const useInventory = create<Inventory>()((set) => ({
  products: initialProducts,
  suppliers: initialSuppliers,
  docs: makeDocs(initialProducts),
  orders: initialOrders,
  techCards: initialTechCards,
  addProduct: false,
  addSupplier: false,
  productId: null,
  setAddProduct: (addProduct) => set({ addProduct }),
  setAddSupplier: (addSupplier) => set({ addSupplier }),
  openProduct: (productId) => set({ productId }),
  addProductItem: (p) => set((s) => ({ products: [...s.products, p] })),
  updateProduct: (id, patch) => set((s) => ({ products: s.products.map((p) => (p.id === id ? { ...p, ...patch } : p)) })),
  addSupplierItem: (sp) => set((s) => ({ suppliers: [...s.suppliers, sp] })),
  addDoc: (d) => set((s) => ({ docs: [d, ...s.docs] })),
  setDocStatus: (id, status) => set((s) => ({ docs: s.docs.map((d) => (d.id === id ? { ...d, status } : d)) })),
  addOrders: (o) => set((s) => ({ orders: [...o, ...s.orders] })),
  receiveOrder: (id) =>
    set((s) => {
      const order = s.orders.find((o) => o.id === id)
      if (!order) return s
      return {
        orders: s.orders.map((o) => (o.id === id ? { ...o, status: 'received' } : o)),
        products: s.products.map((p) => {
          const line = order.lines.find((l) => l.productId === p.id)
          return line ? { ...p, stock: p.stock + line.qty } : p
        }),
      }
    }),
  setTechCard: (serviceId, lines) => set((s) => ({ techCards: { ...s.techCards, [serviceId]: lines } })),
}))

export const stockValue = (products: Product[]) =>
  products.filter((p) => !p.archived).reduce((m, p) => m + p.stock * p.purchase, 0)
