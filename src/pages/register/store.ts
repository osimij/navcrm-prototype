import { create } from 'zustand'
import type { PaymentMethodId } from '@/data/business'
import { NOW, isSameDay } from '@/lib/time'
import {
  initialCertificates,
  initialExpenses,
  initialMemberships,
  initialReceipts,
  initialShifts,
  membershipTypes as initialTypes,
  type Certificate,
  type MembershipType,
  type Expense,
  type Membership,
  type Receipt,
  type ReceiptLine,
  type ShiftRecord,
} from './data'

export type Discount = { kind: 'percent' | 'amount'; value: number; code?: string }

export type Cart = {
  clientId: string | null
  lines: ReceiptLine[]
  discount: Discount | null
  useBonuses: boolean
  method: PaymentMethodId
  split: { method: PaymentMethodId; amount: number } | null
  received: string
  visitId: string | null
  /** Set once charged: the receipt is locked until "New sale". */
  paid: { receiptId: string; earned: number } | null
}

const emptyCart: Cart = {
  clientId: null,
  lines: [],
  discount: null,
  useBonuses: false,
  method: 'cash',
  split: null,
  received: '',
  visitId: null,
  paid: null,
}

export type Shift = { open: boolean; openedAt: string; openedBy: string; float: number; handedOver: number }

/** The drawer amount shown on Home; the owner's midday cash pickup balances to it. */
const HOME_DRAWER = 2340

function cashToday(receipts: Receipt[]) {
  return receipts
    .filter((r) => isSameDay(r.at, NOW) && r.status !== 'voided')
    .reduce((m, r) => m + r.payments.filter((p) => p.method === 'cash').reduce((s, p) => s + p.amount, 0), 0)
}

function cashExpensesToday(expenses: Expense[]) {
  return expenses.filter((e) => isSameDay(e.date, NOW) && e.source === 'cash').reduce((m, e) => m + e.amount, 0)
}

const handed = 500 + cashToday(initialReceipts) - cashExpensesToday(initialExpenses) - HOME_DRAWER

type RegisterState = {
  cart: Cart
  shift: Shift
  receipts: Receipt[]
  memberships: Membership[]
  membershipTypes: MembershipType[]
  certificates: Certificate[]
  expenses: Expense[]
  shifts: ShiftRecord[]
  setCart: (patch: Partial<Cart>) => void
  addLine: (line: ReceiptLine) => void
  updateLine: (id: string, patch: Partial<ReceiptLine>) => void
  removeLine: (id: string) => void
  resetCart: () => void
  addReceipt: (r: Receipt) => void
  updateReceipt: (id: string, patch: Partial<Receipt>) => void
  addMembership: (m: Membership) => void
  updateMembership: (id: string, patch: Partial<Membership>) => void
  addMembershipType: (t: MembershipType) => void
  addCertificate: (c: Certificate) => void
  addExpense: (e: Expense) => void
  openShift: (float: number) => void
  closeShift: (record: ShiftRecord) => void
}

export const useRegister = create<RegisterState>()((set) => ({
  cart: emptyCart,
  shift: { open: true, openedAt: '09:02', openedBy: 'Nigora Alieva', float: 500, handedOver: Math.max(0, handed) },
  receipts: initialReceipts,
  memberships: initialMemberships,
  membershipTypes: initialTypes,
  certificates: initialCertificates,
  expenses: initialExpenses,
  shifts: initialShifts,
  setCart: (patch) => set((s) => ({ cart: { ...s.cart, ...patch } })),
  addLine: (line) =>
    set((s) => {
      const same = line.kind === 'product' && s.cart.lines.find((l) => l.kind === 'product' && l.ref === line.ref)
      const lines = same
        ? s.cart.lines.map((l) => (l === same ? { ...l, qty: l.qty + line.qty } : l))
        : [...s.cart.lines, line]
      return { cart: { ...s.cart, lines } }
    }),
  updateLine: (id, patch) =>
    set((s) => ({ cart: { ...s.cart, lines: s.cart.lines.map((l) => (l.id === id ? { ...l, ...patch } : l)) } })),
  removeLine: (id) => set((s) => ({ cart: { ...s.cart, lines: s.cart.lines.filter((l) => l.id !== id) } })),
  resetCart: () => set({ cart: emptyCart }),
  addReceipt: (r) => set((s) => ({ receipts: [r, ...s.receipts] })),
  updateReceipt: (id, patch) => set((s) => ({ receipts: s.receipts.map((r) => (r.id === id ? { ...r, ...patch } : r)) })),
  addMembership: (m) => set((s) => ({ memberships: [m, ...s.memberships] })),
  updateMembership: (id, patch) => set((s) => ({ memberships: s.memberships.map((m) => (m.id === id ? { ...m, ...patch } : m)) })),
  addMembershipType: (t) => set((s) => ({ membershipTypes: [...s.membershipTypes, t] })),
  addCertificate: (c) => set((s) => ({ certificates: [c, ...s.certificates] })),
  addExpense: (e) => set((s) => ({ expenses: [e, ...s.expenses] })),
  openShift: (float) =>
    set({
      shift: {
        open: true,
        openedAt: `${String(NOW.getHours()).padStart(2, '0')}:${String(NOW.getMinutes()).padStart(2, '0')}`,
        openedBy: 'Zarina Karimova',
        float,
        handedOver: 0,
      },
    }),
  closeShift: (record) => set((s) => ({ shift: { ...s.shift, open: false }, shifts: [record, ...s.shifts] })),
}))

export function nextReceiptNo(receipts: Receipt[]) {
  return Math.max(...receipts.map((r) => r.no)) + 1
}

/** Cash that should be in the drawer right now. */
export function drawerSummary(receipts: Receipt[], expenses: Expense[], shift: Shift) {
  const today = receipts.filter((r) => isSameDay(r.at, NOW) && r.status !== 'voided')
  const cashSales = cashToday(receipts)
  const otherSales = today.reduce((m, r) => m + r.payments.filter((p) => p.method !== 'cash').reduce((s, p) => s + p.amount, 0), 0)
  const cashRefunds = today
    .filter((r) => r.refunded > 0 && r.payments.some((p) => p.method === 'cash'))
    .reduce((m, r) => m + r.refunded, 0)
  const cashExpenses = cashExpensesToday(expenses)
  const expected = shift.float + cashSales - cashRefunds - cashExpenses - shift.handedOver
  return { cashSales, otherSales, cashRefunds, cashExpenses, expected, receiptsCount: today.length }
}

/** Membership type by id, including types created in this session. */
export const useMembershipType = (id: string | undefined) => useRegister((s) => s.membershipTypes.find((t) => t.id === id))
export const membershipType = (id: string) => useRegister.getState().membershipTypes.find((t) => t.id === id)!
