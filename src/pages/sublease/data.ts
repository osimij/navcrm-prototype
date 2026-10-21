import { create } from 'zustand'
import { initialEntries, isVisit, type Appointment } from '@/data/appointments'
import type { LabelColor } from '@/data/business'
import { seeded } from '@/lib/random'
import { NOW, TODAY, addDays } from '@/lib/time'

export type RentBasis = 'day' | 'month' | 'visit_day' | 'hour'

export const BASIS_LABEL: Record<RentBasis, string> = {
  day: 'per working day',
  month: 'per month',
  visit_day: 'per day with visits',
  hour: 'per scheduled hour',
}

export const PLACES = ['Chair 1', 'Chair 2', 'Chair 3', 'Chair 4', 'Nail desk 1', 'Nail desk 2', 'Massage room', 'Cosmetology room']

export type Tenant = {
  id: string
  staffId?: string
  name: string
  specialty: string
  phone: string
  color: LabelColor
  place: string | null
  rent: number
  basis: RentBasis
  start: Date
  end?: Date
  comment?: string
}

export type LedgerKind = 'rent' | 'payment' | 'collected' | 'handover'
export type LedgerEntry = { id: string; tenantId: string; date: Date; kind: LedgerKind; amount: number; note: string }

export const LEDGER_LABEL: Record<LedgerKind, string> = {
  rent: 'Rent charged',
  payment: 'Rent paid',
  collected: 'Taken at your register',
  handover: 'Handed over',
}

const monthStart = (offset: number) => new Date(TODAY.getFullYear(), TODAY.getMonth() + offset, 1)
const monthEnd = (offset: number) => new Date(TODAY.getFullYear(), TODAY.getMonth() + offset + 1, 0)
const clamp = (offset: number, day: number) => {
  const d = new Date(TODAY.getFullYear(), TODAY.getMonth() + offset, day)
  return d > TODAY ? TODAY : d
}

export const initialTenants: Tenant[] = [
  {
    id: 't1',
    staffId: 's6',
    name: 'Parvina Kurbonova',
    specialty: 'Massage therapist',
    phone: '+992557003344',
    color: 'violet',
    place: 'Massage room',
    rent: 1800,
    basis: 'month',
    start: new Date(TODAY.getFullYear(), 1, 1),
    comment: 'Brings her own oils and towels.',
  },
  {
    id: 't2',
    name: 'Sabina Rahmonova',
    specialty: 'Brow artist',
    phone: '+992934448812',
    color: 'green',
    place: 'Chair 4',
    rent: 90,
    basis: 'day',
    start: new Date(TODAY.getFullYear(), 4, 12),
  },
  {
    id: 't3',
    name: 'Gulnoza Sharipova',
    specialty: 'Nail artist',
    phone: '+992501230987',
    color: 'orange',
    place: 'Nail desk 2',
    rent: 120,
    basis: 'visit_day',
    start: monthStart(-1),
    end: monthEnd(1),
    comment: 'Trial lease until the end of next month.',
  },
]

/** Days in a month (up to today for the running month) a tenant worked, deterministic. */
function workedDays(tenantId: string, offset: number) {
  const r = seeded(tenantId.charCodeAt(1) * 97 + offset + 400)
  const last = offset === 0 ? TODAY.getDate() : monthEnd(offset).getDate()
  let n = 0
  for (let d = 1; d <= last; d++) if (r.chance(0.8)) n++
  return n
}

const parvinaVisits = (offset: number) =>
  initialEntries.filter(
    (e): e is Appointment =>
      isVisit(e) && e.staffId === 's6' && e.status === 'completed' && e.start >= monthStart(offset) && e.start <= (offset === 0 ? NOW : addDays(monthEnd(offset), 1)),
  )

/** Visit turnover for a tenant in a month. */
export function turnover(t: Tenant, offset: number) {
  if (t.staffId === 's6') return parvinaVisits(offset).reduce((m, a) => m + a.price, 0)
  const r = seeded(t.id.charCodeAt(1) * 31 + offset + 900)
  const perDay = t.specialty === 'Brow artist' ? 260 : 340
  return Math.round((workedDays(t.id, offset) * perDay * (0.85 + r.next() * 0.3)) / 10) * 10
}

export function visitCount(t: Tenant, offset: number) {
  if (t.staffId === 's6') return parvinaVisits(offset).length
  return Math.round(turnover(t, offset) / (t.specialty === 'Brow artist' ? 85 : 140))
}

function rentFor(t: Tenant, offset: number) {
  if (t.basis === 'month') return t.rent
  const days = workedDays(t.id, offset)
  if (t.basis === 'hour') return t.rent * days * 9
  return t.rent * days
}

function buildLedger(): LedgerEntry[] {
  const out: LedgerEntry[] = []
  let n = 0
  const push = (tenantId: string, date: Date, kind: LedgerKind, amount: number, note: string) =>
    out.push({ id: `l${n++}`, tenantId, date, kind, amount, note })

  for (const t of initialTenants) {
    for (const offset of [-1, 0]) {
      if (monthEnd(offset) < t.start) continue
      const days = workedDays(t.id, offset)
      const rent = rentFor(t, offset)
      const label = offset === 0 ? `1–${TODAY.getDate()}` : `1–${monthEnd(offset).getDate()}`
      if (t.basis === 'month') push(t.id, monthStart(offset), 'rent', rent, 'Monthly rent')
      else push(t.id, offset === 0 ? TODAY : monthEnd(offset), 'rent', rent, `${label}: ${days} days × ${t.rent}`)

      const turn = turnover(t, offset)
      const atRegister = Math.round((turn * (t.staffId === 's6' ? 0.7 : 0.45)) / 10) * 10
      push(t.id, offset === 0 ? TODAY : monthEnd(offset), 'collected', atRegister, `${visitCount(t, offset)} visits, clients paid at your register`)

      if (offset === -1) {
        push(t.id, addDays(monthEnd(-1), -1), 'payment', rent, 'Paid in cash')
        push(t.id, monthEnd(-1), 'handover', atRegister, 'Handed over in cash')
      }
    }
  }
  // This month: Parvina paid part of her rent, Sabina paid ahead, Gulnoza hasn't paid yet.
  push('t1', clamp(0, 5), 'payment', 1200, 'Paid with Alif')
  push('t2', clamp(0, 4), 'payment', rentFor(initialTenants[1], 0) + 180, 'Paid two days ahead')
  push('t1', clamp(0, 8), 'handover', 5000, 'Handed over in cash')
  push('t1', clamp(0, 15), 'handover', 6000, 'Handed over with Alif')
  push('t3', clamp(0, 12), 'handover', 1200, 'Handed over in cash')
  return out.sort((a, b) => +b.date - +a.date)
}

type Sublease = {
  tenants: Tenant[]
  ledger: LedgerEntry[]
  addTenant: (t: Tenant) => void
  updateTenant: (id: string, patch: Partial<Tenant>) => void
  addEntry: (e: LedgerEntry) => void
}

export const useSublease = create<Sublease>()((set) => ({
  tenants: initialTenants,
  ledger: buildLedger(),
  addTenant: (t) => set((s) => ({ tenants: [...s.tenants, t] })),
  updateTenant: (id, patch) => set((s) => ({ tenants: s.tenants.map((t) => (t.id === id ? { ...t, ...patch } : t)) })),
  addEntry: (e) => set((s) => ({ ledger: [e, ...s.ledger] })),
}))

export function inMonth(d: Date, offset: number) {
  return d >= monthStart(offset) && d <= monthEnd(offset)
}

/** Balance is all-time: rent charged minus rent paid. Positive means they owe. */
export function balances(ledger: LedgerEntry[], tenantId: string) {
  const mine = ledger.filter((l) => l.tenantId === tenantId)
  const sum = (k: LedgerKind) => mine.filter((l) => l.kind === k).reduce((m, l) => m + l.amount, 0)
  return { owes: sum('rent') - sum('payment'), held: sum('collected') - sum('handover') }
}

export function chargeableNow(t: Tenant) {
  // Daily rent accrues as they work; "Charge now" bills today's day for daily tenants.
  return t.basis === 'month' ? 0 : t.basis === 'hour' ? t.rent * 9 : t.rent
}

export { monthStart, monthEnd }
