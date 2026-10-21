import { initialEntries, isVisit, type Appointment } from '@/data/appointments'
import { business } from '@/data/business'
import { SERVICE_CATEGORIES } from '@/data/services'
import { staff, staffById, type Staff } from '@/data/staff'
import { formatMoney, monthLong, monthShort } from '@/lib/format'
import { seeded } from '@/lib/random'
import { NOW, TODAY, addDays, daysBetween } from '@/lib/time'

/* ─────────────── Periods ─────────────── */

export type PeriodType = 'Month' | 'Half-month' | 'Week' | 'Shift'
export type PeriodStatus = 'draft' | 'calculated' | 'approved'

export type Period = {
  id: string
  type: PeriodType
  start: Date
  end: Date
  branchId: string
  status: PeriodStatus
  approvedAt?: Date
  approvedBy?: string
}

export const monthStart = (offset: number) => new Date(TODAY.getFullYear(), TODAY.getMonth() + offset, 1)
export const monthEnd = (offset: number) => new Date(TODAY.getFullYear(), TODAY.getMonth() + offset + 1, 0)
const daysIn = (start: Date, end: Date) => daysBetween(start, end) + 1

/** Monday of the last full week. */
const lastWeekStart = (() => {
  const dow = (TODAY.getDay() + 6) % 7
  return addDays(TODAY, -dow - 7)
})()

export const initialPeriods: Period[] = [
  { id: 'p0', type: 'Month', start: monthStart(0), end: monthEnd(0), branchId: 'b1', status: 'draft' },
  { id: 'p1', type: 'Month', start: monthStart(-1), end: monthEnd(-1), branchId: 'b1', status: 'calculated' },
  { id: 'pw', type: 'Week', start: lastWeekStart, end: addDays(lastWeekStart, 6), branchId: 'b2', status: 'approved', approvedAt: addDays(lastWeekStart, 8), approvedBy: 'Zarina Karimova' },
  { id: 'p2', type: 'Month', start: monthStart(-2), end: monthEnd(-2), branchId: 'b1', status: 'approved', approvedAt: new Date(TODAY.getFullYear(), TODAY.getMonth() - 1, 3), approvedBy: 'Zarina Karimova' },
  { id: 'p3', type: 'Month', start: monthStart(-3), end: monthEnd(-3), branchId: 'b1', status: 'approved', approvedAt: new Date(TODAY.getFullYear(), TODAY.getMonth() - 2, 4), approvedBy: 'Zarina Karimova' },
]

export function periodTitle(p: Period) {
  if (p.type === 'Month') {
    const y = p.start.getFullYear() !== TODAY.getFullYear() ? ` ${p.start.getFullYear()}` : ''
    return `${monthLong(p.start.getMonth())}${y}`
  }
  if (p.type === 'Week') return `Week ${periodRange(p)}`
  if (p.type === 'Shift') return `Shift ${p.start.getDate()} ${monthShort(p.start.getMonth())}`
  return periodRange(p)
}

export function periodRange(p: Period) {
  const sameMonth = p.start.getMonth() === p.end.getMonth()
  return sameMonth
    ? `${p.start.getDate()}–${p.end.getDate()} ${monthShort(p.end.getMonth())}`
    : `${p.start.getDate()} ${monthShort(p.start.getMonth())} – ${p.end.getDate()} ${monthShort(p.end.getMonth())}`
}

export const branchName = (id: string) => business.branches.find((b) => b.id === id)?.name ?? 'All branches'

export const STATUS_LABEL: Record<PeriodStatus, string> = { draft: 'Draft', calculated: 'Calculated', approved: 'Approved' }

/** The period that contains a date, for the New period form. */
export function periodBounds(type: PeriodType, d: Date) {
  if (type === 'Month') return { start: new Date(d.getFullYear(), d.getMonth(), 1), end: new Date(d.getFullYear(), d.getMonth() + 1, 0) }
  if (type === 'Half-month') {
    const first = d.getDate() <= 15
    return first
      ? { start: new Date(d.getFullYear(), d.getMonth(), 1), end: new Date(d.getFullYear(), d.getMonth(), 15) }
      : { start: new Date(d.getFullYear(), d.getMonth(), 16), end: new Date(d.getFullYear(), d.getMonth() + 1, 0) }
  }
  if (type === 'Week') {
    const dow = (d.getDay() + 6) % 7
    const start = addDays(d, -dow)
    return { start, end: addDays(start, 6) }
  }
  return { start: d, end: d }
}

/* ─────────────── Schemes and rules ─────────────── */

export type RuleType = 'base' | 'services' | 'products' | 'perService' | 'tips' | 'kpi' | 'rental'

export type Rule = {
  id: string
  type: RuleType
  percent?: number
  amount?: number
  per?: 'month' | 'shift' | 'hour'
  base?: 'price' | 'after_discounts' | 'minus_consumables'
  whose?: 'own' | 'branch'
  clients?: 'all' | 'own' | 'online' | 'new' | 'regular'
  scope?: 'all' | 'categories'
  categories?: string[]
  productBase?: 'price' | 'margin'
  metric?: 'load' | 'avg_receipt' | 'new_clients' | 'rating'
  threshold?: number
}

export type Scheme = {
  id: string
  name: string
  description: string
  period: PeriodType
  active: boolean
  rules: Rule[]
}

export const RULE_META: Record<RuleType, { label: string; hint: string }> = {
  base: { label: 'Base salary', hint: 'A fixed amount per month, shift or hour' },
  services: { label: '% of services', hint: 'A share of what the person’s visits bring in' },
  products: { label: '% of product sales', hint: 'Commission on retail they sell at the register' },
  perService: { label: 'Fixed amount per service', hint: 'A set amount each time a service is done' },
  tips: { label: '% of tips', hint: 'How much of the tips left for them they keep' },
  kpi: { label: 'KPI bonus', hint: 'Paid when a target is reached in the period' },
  rental: { label: '% of rental revenue', hint: 'For dress and equipment rental' },
}

export const BASE_LABEL = { price: 'service price', after_discounts: 'revenue after discounts', minus_consumables: 'revenue minus consumables' }
export const CLIENTS_LABEL = { all: 'All clients', own: 'Their own clients', online: 'Booked online', new: 'New clients', regular: 'Regular clients' }
export const METRIC_LABEL = { load: 'Staff load above', avg_receipt: 'Average receipt above', new_clients: 'New clients at least', rating: 'Rating at least' }
export const PAY_CATEGORIES = [...SERVICE_CATEGORIES, 'Lab tests']

export const initialSchemes: Scheme[] = [
  {
    id: 'sc1',
    name: 'Master 40% of services',
    description: 'Standard scheme for stylists, nail and brow artists.',
    period: 'Month',
    active: true,
    rules: [
      { id: 'r1', type: 'services', percent: 40, base: 'after_discounts', whose: 'own', clients: 'all', scope: 'all' },
      { id: 'r2', type: 'products', percent: 10, productBase: 'price' },
      { id: 'r3', type: 'tips', percent: 100 },
    ],
  },
  {
    id: 'sc2',
    name: 'Administrator salary + 3% of revenue',
    description: 'Front desk: fixed pay plus a share of the branch’s service revenue.',
    period: 'Month',
    active: true,
    rules: [
      { id: 'r1', type: 'base', amount: 3000, per: 'month' },
      { id: 'r2', type: 'services', percent: 3, base: 'after_discounts', whose: 'branch', clients: 'all', scope: 'all' },
    ],
  },
  {
    id: 'sc3',
    name: 'Barber 50% + tips',
    description: 'Higher share, no product commission. Rustam’s personal scheme.',
    period: 'Month',
    active: true,
    rules: [
      { id: 'r1', type: 'services', percent: 50, base: 'price', whose: 'own', clients: 'all', scope: 'all' },
      { id: 'r2', type: 'tips', percent: 100 },
    ],
  },
  {
    id: 'sc5',
    name: 'Cosmetologist 35% after consumables',
    description: 'Expensive serums and peels come off the top before the share.',
    period: 'Month',
    active: true,
    rules: [
      { id: 'r1', type: 'services', percent: 35, base: 'minus_consumables', whose: 'own', clients: 'all', scope: 'all' },
      { id: 'r2', type: 'products', percent: 10, productBase: 'price' },
      { id: 'r3', type: 'kpi', amount: 500, metric: 'load', threshold: 80 },
    ],
  },
  {
    id: 'sc4',
    name: 'Lab technician: salary + per test',
    description: 'Fixed pay plus a set amount for every test processed.',
    period: 'Month',
    active: true,
    rules: [
      { id: 'r1', type: 'base', amount: 2800, per: 'month' },
      { id: 'r2', type: 'perService', amount: 10, scope: 'categories', categories: ['Lab tests'] },
    ],
  },
  {
    id: 'sc6',
    name: 'Trainee shift rate',
    description: 'For trainees in their first month. Not used right now.',
    period: 'Shift',
    active: false,
    rules: [{ id: 'r1', type: 'base', amount: 150, per: 'shift' }],
  },
]

/* ─────────────── Assignments ─────────────── */

export type Assignment = {
  id: string
  target: { kind: 'staff'; staffId: string } | { kind: 'position'; position: string }
  schemeId: string
  from: Date
}

const yearStart = new Date(TODAY.getFullYear(), 0, 1)

export const initialAssignments: Assignment[] = [
  { id: 'as1', target: { kind: 'position', position: 'Hair stylist' }, schemeId: 'sc1', from: yearStart },
  { id: 'as2', target: { kind: 'position', position: 'Nail artist' }, schemeId: 'sc1', from: yearStart },
  { id: 'as3', target: { kind: 'position', position: 'Brow & lash artist' }, schemeId: 'sc1', from: yearStart },
  { id: 'as4', target: { kind: 'position', position: 'Barber' }, schemeId: 'sc1', from: yearStart },
  { id: 'as5', target: { kind: 'staff', staffId: 's5' }, schemeId: 'sc3', from: new Date(TODAY.getFullYear(), 2, 1) },
  { id: 'as6', target: { kind: 'position', position: 'Cosmetologist' }, schemeId: 'sc5', from: yearStart },
  { id: 'as7', target: { kind: 'position', position: 'Front desk' }, schemeId: 'sc2', from: yearStart },
  { id: 'as8', target: { kind: 'staff', staffId: 's8' }, schemeId: 'sc4', from: new Date(TODAY.getFullYear(), 4, 15) },
]

/** People who are paid through payroll: not the owner, tenants or pending invites. */
export const payrollStaff: Staff[] = staff.filter((s) => s.role !== 'Owner' && !s.tenant && !s.invited)
export const POSITIONS = [...new Set(payrollStaff.map((s) => s.position))]

export function resolveScheme(staffId: string, assignments: Assignment[]) {
  const s = staffById[staffId]
  const personal = assignments.find((a) => a.target.kind === 'staff' && a.target.staffId === staffId)
  if (personal) return { schemeId: personal.schemeId, via: 'personal' as const }
  const pos = assignments.find((a) => a.target.kind === 'position' && a.target.position === s.position)
  return pos ? { schemeId: pos.schemeId, via: 'position' as const } : null
}

/* ─────────────── Bonuses, fines, payouts ─────────────── */

export type Adjustment = { id: string; staffId: string; kind: 'bonus' | 'fine'; amount: number; reason: string; date: Date }

const clampDay = (offset: number, day: number) => {
  const d = new Date(TODAY.getFullYear(), TODAY.getMonth() + offset, day)
  return d > TODAY ? TODAY : d
}

export const initialAdjustments: Adjustment[] = [
  { id: 'ad1', staffId: 's1', kind: 'bonus', amount: 300, reason: 'Most 5★ reviews in the month', date: clampDay(-1, 28) },
  { id: 'ad2', staffId: 's2', kind: 'fine', amount: 100, reason: 'Late twice, per timesheet', date: clampDay(-1, 12) },
  { id: 'ad3', staffId: 's4', kind: 'fine', amount: 150, reason: 'Used lash glue without a tech card', date: clampDay(-2, 17) },
  { id: 'ad4', staffId: 's5', kind: 'bonus', amount: 200, reason: 'Covered Somoni 14 on a day off', date: clampDay(0, 8) },
  { id: 'ad5', staffId: 's7', kind: 'bonus', amount: 250, reason: 'No no-shows for a full week', date: clampDay(0, 6) },
  { id: 'ad6', staffId: 's3', kind: 'bonus', amount: 400, reason: 'Ran the peel training for the team', date: clampDay(-2, 22) },
]

export type PayMethod = 'cash' | 'card' | 'transfer'
export const PAY_METHOD_LABEL: Record<PayMethod, string> = { cash: 'Cash', card: 'Card', transfer: 'Bank transfer' }

export type Payout = {
  id: string
  staffId: string
  periodId: string
  date: Date
  amount: number
  method: PayMethod
  kind: 'advance' | 'salary'
  comment?: string
}

/* ─────────────── Accrual calculation ─────────────── */

const DATA_START = addDays(TODAY, -60)

function hash(s: string) {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619)
  return h >>> 0
}

const completed = initialEntries.filter((e): e is Appointment => isVisit(e) && e.status === 'completed')

/** Revenue and visit count in a date range, scaled up when the range predates the demo data. */
function work(staffIds: string[], start: Date, end: Date, draft: boolean) {
  const lo = start < DATA_START ? DATA_START : start
  const last = end > NOW ? NOW : end
  const hiExclusive = addDays(new Date(last.getFullYear(), last.getMonth(), last.getDate()), 1)
  const mine = completed.filter((a) => staffIds.includes(a.staffId) && a.start >= lo && a.start < hiExclusive)
  const revenue = mine.reduce((m, a) => m + a.price, 0)
  const covered = lo <= last ? daysIn(lo, last) : 0
  const wanted = draft ? daysIn(start, last) : daysIn(start, end)
  if (covered > 0) {
    const k = wanted / covered
    return { revenue: Math.round(revenue * k), visits: Math.round(mine.length * k) }
  }
  // Older than the demo data: use the average day from what we have.
  const all = completed.filter((a) => staffIds.includes(a.staffId))
  const perDay = all.reduce((m, a) => m + a.price, 0) / 60
  const r = seeded(hash(staffIds.join() + start.toISOString()))
  const f = 0.9 + r.next() * 0.2
  return { revenue: Math.round(perDay * wanted * f), visits: Math.round((all.length / 60) * wanted * f) }
}

export type Line = { label: string; formula?: string; amount: number }

export type Accrual = {
  staffId: string
  schemeId: string | null
  via: 'personal' | 'position' | null
  visits: number
  base: number
  services: number
  products: number
  tips: number
  perService: number
  kpi: number
  bonuses: number
  fines: number
  total: number
  paid: number
  toPay: number
  lines: Line[]
}

const pct = (n: number) => `${n}%`
const m = (n: number) => formatMoney(n, { currency: false })
const round10 = (n: number) => Math.round(n / 10) * 10

export function staffForPeriod(p: Period) {
  return p.branchId === 'all' ? payrollStaff : payrollStaff.filter((s) => s.branchIds.includes(p.branchId))
}

export function computeAccrual(
  p: Period,
  s: Staff,
  ctx: { schemes: Scheme[]; assignments: Assignment[]; adjustments: Adjustment[]; payouts: Payout[] },
): Accrual {
  const resolved = resolveScheme(s.id, ctx.assignments)
  const scheme = resolved ? ctx.schemes.find((x) => x.id === resolved.schemeId) : undefined
  const draft = p.status === 'draft'
  const totalDays = daysIn(p.start, p.end)
  const elapsed = draft ? daysIn(p.start, TODAY > p.end ? p.end : TODAY) : totalDays
  // Branch periods only see the share of a two-branch master's work done there.
  const branchShare = s.branchIds.length > 1 && p.branchId === 'b2' ? 0.3 : 1
  const own = work([s.id], p.start, p.end, draft)
  own.revenue = Math.round(own.revenue * branchShare)
  own.visits = Math.round(own.visits * branchShare)
  const r = seeded(hash(s.id + p.id))
  const lines: Line[] = []
  const acc = { base: 0, services: 0, products: 0, tips: 0, perService: 0, kpi: 0 }

  for (const rule of scheme?.rules ?? []) {
    if (rule.type === 'base') {
      const amount = rule.amount ?? 0
      if (rule.per === 'month') {
        const v = Math.round((amount * elapsed) / (p.type === 'Month' ? totalDays : 30))
        acc.base += v
        lines.push({
          label: 'Base salary',
          formula: elapsed < totalDays || p.type !== 'Month' ? `${m(amount)} a month × ${elapsed} of ${p.type === 'Month' ? totalDays : 30} days` : `${m(amount)} a month`,
          amount: v,
        })
      } else {
        const shifts = Math.round(elapsed * 0.85)
        const v = amount * shifts
        acc.base += v
        lines.push({ label: 'Shift rate', formula: `${shifts} shifts × ${m(amount)}`, amount: v })
      }
    }
    if (rule.type === 'services') {
      const percent = rule.percent ?? 0
      let base = own.revenue
      let baseLabel = 'services'
      if (rule.whose === 'branch') {
        const others = payrollStaff.filter((x) => x.bookable).map((x) => x.id)
        base = work(others, p.start, p.end, draft).revenue
        baseLabel = 'branch services'
      }
      if (rule.base === 'after_discounts') base = round10(base * 0.96)
      if (rule.base === 'minus_consumables') base = round10(base * 0.96 * 0.86)
      const v = Math.round((base * percent) / 100)
      acc.services += v
      const how = rule.base === 'price' ? '' : rule.base === 'after_discounts' ? ' after discounts' : ' after discounts and consumables'
      lines.push({ label: `${pct(percent)} of ${baseLabel}${how}`, formula: `${m(base)} × ${pct(percent)}`, amount: v })
    }
    if (rule.type === 'products') {
      const sold = r.int(6, 34) * 45 * (draft ? elapsed / totalDays : 1)
      const salesBase = Math.round(sold)
      const v = Math.round((salesBase * (rule.percent ?? 0)) / 100)
      acc.products += v
      lines.push({ label: `${pct(rule.percent ?? 0)} of product sales`, formula: `${m(salesBase)} × ${pct(rule.percent ?? 0)}`, amount: v })
    }
    if (rule.type === 'tips') {
      const tips = Math.round((r.int(6, 22) * 50 * (draft ? elapsed / totalDays : 1)) / 10) * 10
      const v = Math.round((tips * (rule.percent ?? 100)) / 100)
      acc.tips += v
      lines.push({ label: 'Tips', formula: `${m(tips)} × ${pct(rule.percent ?? 100)}`, amount: v })
    }
    if (rule.type === 'perService') {
      const count = Math.round(elapsed * (4 + r.next() * 1.5))
      const v = count * (rule.amount ?? 0)
      acc.perService += v
      const what = rule.categories?.join(', ').toLowerCase() || 'services'
      lines.push({ label: `Per ${what.replace(/s$/, '')}`, formula: `${count} × ${m(rule.amount ?? 0)}`, amount: v })
    }
    if (rule.type === 'kpi') {
      const met = !draft
      if (met) {
        acc.kpi += rule.amount ?? 0
        lines.push({ label: `KPI bonus: ${METRIC_LABEL[rule.metric ?? 'load'].toLowerCase()} ${rule.threshold}${rule.metric === 'load' ? '%' : ''}`, formula: 'Target reached: 84%', amount: rule.amount ?? 0 })
      } else {
        lines.push({ label: `KPI bonus: ${METRIC_LABEL[rule.metric ?? 'load'].toLowerCase()} ${rule.threshold}${rule.metric === 'load' ? '%' : ''}`, formula: 'Checked when the period closes', amount: 0 })
      }
    }
  }

  const inPeriod = (d: Date) => d >= p.start && d <= addDays(p.end, 1)
  const adj = ctx.adjustments.filter((a) => a.staffId === s.id && inPeriod(a.date))
  const bonuses = adj.filter((a) => a.kind === 'bonus').reduce((sum, a) => sum + a.amount, 0)
  const fines = adj.filter((a) => a.kind === 'fine').reduce((sum, a) => sum + a.amount, 0)
  for (const a of adj) lines.push({ label: a.kind === 'bonus' ? `Bonus: ${a.reason}` : `Fine: ${a.reason}`, amount: a.kind === 'bonus' ? a.amount : -a.amount })

  const total = acc.base + acc.services + acc.products + acc.tips + acc.perService + acc.kpi + bonuses - fines
  const paid = ctx.payouts.filter((x) => x.staffId === s.id && x.periodId === p.id).reduce((sum, x) => sum + x.amount, 0)

  return {
    staffId: s.id,
    schemeId: scheme?.id ?? null,
    via: resolved?.via ?? null,
    visits: own.visits,
    ...acc,
    bonuses,
    fines,
    total,
    paid,
    toPay: Math.max(0, total - paid),
    lines,
  }
}

/** Payouts that already happened, derived from the periods so every number agrees. */
export function initialPayouts(periods: Period[], schemes: Scheme[], assignments: Assignment[], adjustments: Adjustment[]): Payout[] {
  const out: Payout[] = []
  const ctx = { schemes, assignments, adjustments, payouts: [] as Payout[] }
  for (const p of periods) {
    for (const s of staffForPeriod(p)) {
      const a = computeAccrual(p, s, ctx)
      if (!a.total) continue
      const method: PayMethod = s.role === 'Administrator' || s.role === 'Lab technician' ? 'transfer' : s.id === 's2' || s.id === 's4' ? 'card' : 'cash'
      if (p.type === 'Week') {
        if (p.status === 'approved') out.push({ id: `po-${p.id}-${s.id}`, staffId: s.id, periodId: p.id, date: addDays(p.end, 2), amount: a.total, method, kind: 'salary' })
        continue
      }
      const advDate = new Date(p.start.getFullYear(), p.start.getMonth(), 20)
      const advance = Math.round((a.total * 0.4) / 100) * 100
      if (advDate <= TODAY && p.status !== 'draft') {
        out.push({ id: `pa-${p.id}-${s.id}`, staffId: s.id, periodId: p.id, date: advDate, amount: advance, method, kind: 'advance' })
      }
      if (p.status === 'approved') {
        out.push({
          id: `ps-${p.id}-${s.id}`,
          staffId: s.id,
          periodId: p.id,
          date: new Date(p.end.getFullYear(), p.end.getMonth() + 1, 5),
          amount: a.total - (advDate <= TODAY ? advance : 0),
          method,
          kind: 'salary',
        })
      }
    }
  }
  // Mid-month advances in the running month for masters who asked.
  if (TODAY.getDate() >= 12) {
    const draft = periods.find((p) => p.status === 'draft')
    if (draft) {
      for (const sid of ['s1', 's3', 's7']) {
        out.push({ id: `pd-${sid}`, staffId: sid, periodId: draft.id, date: new Date(TODAY.getFullYear(), TODAY.getMonth(), 10), amount: 1500, method: sid === 's7' ? 'transfer' : 'cash', kind: 'advance', comment: 'Asked for an advance' })
      }
    }
  }
  return out.sort((a, b) => +b.date - +a.date)
}

/* ─────────────── Timesheet ─────────────── */

const OFF: Record<string, number[]> = { s1: [1], s2: [2], s3: [0], s4: [3], s5: [0], s7: [0], s8: [0, 6] }

export type Shift = { in: string; out: string; hours: number; late: boolean } | 'off' | 'future' | 'today'

const toHM = (min: number) => `${String(Math.floor(min / 60)).padStart(2, '0')}:${String(min % 60).padStart(2, '0')}`
const toMin = (hm: string) => {
  const [h, mm] = hm.split(':').map(Number)
  return h * 60 + mm
}

export function hoursBetween(a: string, b: string) {
  return Math.max(0, Math.round(((toMin(b) - toMin(a)) / 60) * 4) / 4)
}

/** Clock-in/out for a person on a day of the current month. */
export function shiftFor(s: Staff, day: number): Shift {
  const date = new Date(TODAY.getFullYear(), TODAY.getMonth(), day)
  if (date > TODAY) return 'future'
  if ((OFF[s.id] ?? []).includes(date.getDay())) return 'off'
  if (day === TODAY.getDate()) return 'today'
  const hours = s.today ?? { start: '09:00', end: '18:00' }
  const r = seeded(hash(`${s.id}-${date.toDateString()}`))
  const late = r.chance(0.12)
  const start = toMin(hours.start) + (late ? r.int(8, 25) : -r.int(0, 10))
  const end = toMin(hours.end) + r.int(-5, 20)
  const brk = hours.break ? toMin(hours.break.end) - toMin(hours.break.start) : 0
  const h = Math.round(((end - start - brk) / 60) * 4) / 4
  return { in: toHM(start), out: toHM(end), hours: h, late }
}

export function todayClockIn(s: Staff) {
  return s.today?.start ?? '09:00'
}
