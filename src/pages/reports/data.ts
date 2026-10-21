import { isVisit, type Appointment, type CalendarEntry } from '@/data/appointments'
import { PAYMENT_METHODS, type PaymentMethodId } from '@/data/business'
import { clientById, type ClientCategory } from '@/data/clients'
import { revenueOn } from '@/data/metrics'
import { staffById } from '@/data/staff'
import { formatDate } from '@/lib/format'
import { NOW, TODAY, addDays, daysBetween } from '@/lib/time'

/* ─────────────── Periods ─────────────── */

export type RangeKey = 'today' | 'yesterday' | 'this-week' | 'last-week' | 'this-month' | 'last-month' | 'last-30' | 'custom'

export const RANGE_OPTIONS: { value: RangeKey; label: string }[] = [
  { value: 'today', label: 'Today' },
  { value: 'yesterday', label: 'Yesterday' },
  { value: 'this-week', label: 'This week' },
  { value: 'last-week', label: 'Last week' },
  { value: 'this-month', label: 'This month' },
  { value: 'last-month', label: 'Last month' },
  { value: 'last-30', label: 'Last 30 days' },
  { value: 'custom', label: 'Custom…' },
]

/** Day offsets from today, both ends inclusive. */
export type Range = { from: number; to: number }

/** The prototype keeps 60 days of history. */
export const EARLIEST = -60

export function rangeFor(key: RangeKey, custom?: { from: Date; to: Date }): Range {
  const monday = -((TODAY.getDay() + 6) % 7)
  switch (key) {
    case 'today':
      return { from: 0, to: 0 }
    case 'yesterday':
      return { from: -1, to: -1 }
    case 'this-week':
      return { from: monday, to: 0 }
    case 'last-week':
      return { from: monday - 7, to: monday - 1 }
    case 'this-month':
      return { from: -(TODAY.getDate() - 1), to: 0 }
    case 'last-month': {
      const first = new Date(TODAY.getFullYear(), TODAY.getMonth() - 1, 1)
      const last = new Date(TODAY.getFullYear(), TODAY.getMonth(), 0)
      return { from: Math.max(EARLIEST, daysBetween(TODAY, first)), to: daysBetween(TODAY, last) }
    }
    case 'custom': {
      if (!custom) return { from: -29, to: 0 }
      const a = Math.max(EARLIEST, Math.min(0, daysBetween(TODAY, custom.from)))
      const b = Math.max(EARLIEST, Math.min(0, daysBetween(TODAY, custom.to)))
      return { from: Math.min(a, b), to: Math.max(a, b) }
    }
    default:
      return { from: -29, to: 0 }
  }
}

export function offsets(r: Range) {
  const out: number[] = []
  for (let d = r.from; d <= r.to; d++) out.push(d)
  return out
}

export const rangeDays = (r: Range) => r.to - r.from + 1

/** The same-length period right before. */
export function previous(r: Range): Range {
  const n = rangeDays(r)
  return { from: Math.max(EARLIEST, r.from - n), to: Math.max(EARLIEST, r.from - 1) }
}

export function rangeText(r: Range) {
  const a = addDays(TODAY, r.from)
  const b = addDays(TODAY, r.to)
  return r.from === r.to ? formatDate(a, { weekday: true }) : `${formatDate(a)} – ${formatDate(b)}`
}

/* ─────────────── Deterministic attributes per visit ─────────────── */

/** Stable 0..1 value for a string key. The finalizer spreads near-identical keys apart. */
export function hash(s: string) {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619)
  h ^= h >>> 16
  h = Math.imul(h, 0x85ebca6b)
  h ^= h >>> 13
  h = Math.imul(h, 0xc2b2ae35)
  h ^= h >>> 16
  return (h >>> 0) / 4294967296
}

const METHOD_WEIGHTS: [PaymentMethodId, number][] = [
  ['cash', 0.36],
  ['card', 0.22],
  ['alif', 0.18],
  ['dc', 0.09],
  ['milli', 0.07],
  ['eskhata', 0.04],
  ['amonat', 0.02],
  ['vasl', 0.02],
]

/** Which payment method paid for a visit: fixed per visit so every report agrees. */
export function methodFor(id: string): PaymentMethodId {
  let x = hash(`pm-${id}`)
  for (const [m, w] of METHOD_WEIGHTS) {
    if (x < w) return m
    x -= w
  }
  return 'cash'
}

export const methodName = (id: PaymentMethodId) => PAYMENT_METHODS.find((m) => m.id === id)?.name ?? id

/** About 7% of visits used a 10% promo code or discount card. */
export function discountFor(a: Appointment) {
  return hash(`disc-${a.id}`) < 0.07 ? Math.round(a.price * 0.1) : 0
}

/* ─────────────── Filtering visits ─────────────── */

export type Segment = 'all' | ClientCategory

export type Filters = { range: Range; staffId: string; segment: Segment }

export const dayOf = (d: Date) => daysBetween(TODAY, d)

export const isTenant = (a: Appointment) => !!staffById[a.staffId]?.tenant

export function visitsIn(entries: CalendarEntry[], r: Range) {
  const start = addDays(TODAY, r.from)
  const end = addDays(TODAY, r.to + 1)
  return entries.filter((e): e is Appointment => isVisit(e) && e.start >= start && e.start < end)
}

/** Paid visits in range. `tenants`: only tenants' visits; otherwise tenants are excluded. */
export function paidVisits(entries: CalendarEntry[], f: Filters, tenants = false) {
  return visitsIn(entries, f.range).filter(
    (a) =>
      a.paid &&
      a.status === 'completed' &&
      a.end <= NOW &&
      isTenant(a) === tenants &&
      (f.staffId === 'all' || a.staffId === f.staffId) &&
      (f.segment === 'all' || clientById[a.clientId]?.category === f.segment),
  )
}

export const filtered = (f: Filters) => f.staffId !== 'all' || f.segment !== 'all'

/**
 * Salon revenue for the period. Without staff or segment filters it is the exact
 * figure Home shows (services + retail); with filters it's services only, since
 * retail sales aren't tied to a master.
 */
export function revenueTotal(entries: CalendarEntry[], f: Filters) {
  if (!filtered(f)) return offsets(f.range).reduce((m, d) => m + revenueOn(entries, d, d === 0 ? NOW : undefined), 0)
  return paidVisits(entries, f).reduce((m, a) => m + a.price, 0)
}

export function revenueForDay(entries: CalendarEntry[], f: Filters, d: number) {
  if (!filtered(f)) return revenueOn(entries, d, d === 0 ? NOW : undefined)
  return paidVisits(entries, { ...f, range: { from: d, to: d } }).reduce((m, a) => m + a.price, 0)
}

/* ─────────────── Money outside the calendar ─────────────── */

/** Monthly fixed costs; scaled to the period length in reports. */
export const EXPENSES_PER_MONTH: { category: string; amount: number }[] = [
  { category: 'Rent', amount: 14000 },
  { category: 'Supplies', amount: 6200 },
  { category: 'Advertising', amount: 3500 },
  { category: 'Utilities', amount: 2100 },
  { category: 'Taxes', amount: 4800 },
  { category: 'Other', amount: 1300 },
]

/** Acquiring commission by method; cash is free. */
export const FEES: Partial<Record<PaymentMethodId, number>> = { card: 0.018, alif: 0.012, dc: 0.012, milli: 0.015, eskhata: 0.015, amonat: 0.015, vasl: 0.012 }

/** Masters' share of service revenue in the salon's payroll schemes. */
export const COMMISSION: Record<string, number> = { s1: 0.4, s2: 0.4, s3: 0.35, s4: 0.4, s5: 0.45 }
/** Fixed monthly salaries for staff who don't earn commission. */
export const SALARIES: Record<string, number> = { s7: 3800, s8: 3400 }

/** Preliminary payroll per employee: commission or salary, plus tips and bonuses, minus fines. */
export function payrollRows(entries: CalendarEntry[], range: Range) {
  const visits = paidVisits(entries, { range, staffId: 'all', segment: 'all' })
  const scale = rangeDays(range) / 30
  return ['s1', 's2', 's3', 's4', 's5', 's7', 's8'].map((id) => {
    const mine = visits.filter((a) => a.staffId === id)
    const revenue = mine.reduce((m, a) => m + a.price, 0)
    const rate = COMMISSION[id]
    const base = rate ? revenue * rate : (SALARIES[id] ?? 0) * scale
    const tips = rate ? Math.round(mine.length * 6 * hash(`tip-${id}`)) : 0
    const bonus = hash(`bonus-${id}`) < 0.3 ? 300 : 0
    const fine = hash(`fine-${id}`) < 0.15 ? 100 : 0
    return { id, revenue, rate, base: Math.round(base), tips, bonus, fine, total: Math.round(base + tips + bonus - fine) }
  })
}

export function pl(entries: CalendarEntry[], range: Range) {
  const f: Filters = { range, staffId: 'all', segment: 'all' }
  const visits = paidVisits(entries, f)
  const revenue = revenueTotal(entries, f)
  const services = visits.reduce((m, a) => m + a.price, 0)
  const retail = Math.max(0, revenue - services)
  const scale = rangeDays(range) / 30
  const expenses = Math.round(EXPENSES_PER_MONTH.reduce((m, e) => m + e.amount, 0) * scale)
  const salaries = Math.round(
    visits.reduce((m, a) => m + a.price * (COMMISSION[a.staffId] ?? 0.4), 0) + (SALARIES.s7 + SALARIES.s8) * scale,
  )
  const cogs = Math.round(retail * 0.55)
  const consumables = Math.round(services * 0.045)
  const fees = Math.round(visits.reduce((m, a) => m + a.price * (FEES[methodFor(a.id)] ?? 0), 0))
  const bonuses = Math.round(services * 0.012)
  const profit = revenue - expenses - salaries - cogs - consumables - fees - bonuses
  return { revenue, services, retail, expenses, salaries, cogs, consumables, fees, bonuses, profit }
}

export function byMethod(entries: CalendarEntry[], range: Range) {
  const visits = paidVisits(entries, { range, staffId: 'all', segment: 'all' })
  const map = new Map<PaymentMethodId, number>()
  for (const a of visits) {
    const m = methodFor(a.id)
    map.set(m, (map.get(m) ?? 0) + a.price)
  }
  return [...map.entries()].map(([id, amount]) => ({ id, amount })).sort((a, b) => b.amount - a.amount)
}

/** Debt start dates, fixed per client. */
export function debtSince(clientId: string) {
  return addDays(TODAY, -Math.round(2 + hash(`debt-${clientId}`) * 44))
}
