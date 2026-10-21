import type { Tone } from '@/components/ui/badge'
import { isVisit, type Appointment, type CalendarEntry } from '@/data/appointments'
import { PAYMENT_METHODS } from '@/data/business'
import { birthdaySoon, type Client, type ClientCategory } from '@/data/clients'
import { serviceById } from '@/data/services'
import { formatDate, formatDay, formatTime } from '@/lib/format'
import { seeded } from '@/lib/random'
import { NOW, TODAY, addDays, daysBetween } from '@/lib/time'

export const TAGS = ['Prefers mornings', 'Sensitive skin', 'Allergic to latex', 'Pays with Alif', 'Bride 2026', 'Brings a friend', 'Corporate', 'Quiet visit']

export const CATEGORY_TONE: Record<ClientCategory, Tone> = {
  new: 'positive',
  regular: 'neutral',
  vip: 'accent',
  lost: 'warning',
}

/** Earliest upcoming visit per client. */
export function nextVisitMap(entries: CalendarEntry[]) {
  const map = new Map<string, Appointment>()
  for (const e of entries) {
    if (!isVisit(e) || e.start <= NOW) continue
    if (e.status === 'cancelled' || e.status === 'no_show' || e.status === 'completed') continue
    const cur = map.get(e.clientId)
    if (!cur || e.start < cur.start) map.set(e.clientId, e)
  }
  return map
}

export function clientVisits(entries: CalendarEntry[], clientId: string) {
  return entries.filter((e): e is Appointment => isVisit(e) && e.clientId === clientId)
}

/** Last visit is a day, not a moment: "Today", "Yesterday", "12 days ago". */
export function daysAgo(d: Date) {
  const n = daysBetween(d, TODAY)
  if (n <= 0) return 'Today'
  if (n === 1) return 'Yesterday'
  if (n < 60) return `${n} days ago`
  return formatDate(d)
}

/** "Today, 16:00" / "Tomorrow, 10:00" / "Sat, 24 Oct, 12:00" */
export function formatWhen(d: Date) {
  return `${formatDay(d)}, ${formatTime(d)}`
}

export type Payment = {
  id: string
  number: number
  date: Date
  items: string
  method: string
  amount: number
  kind: 'visit' | 'product'
}

const PRODUCTS = [
  { name: 'Olaplex No.3 Hair Perfector', price: 280 },
  { name: 'Cuticle oil, 15 ml', price: 45 },
  { name: 'SPF 50 face cream', price: 190 },
  { name: 'Keratin shampoo, 250 ml', price: 135 },
]

/** Receipts for a client: one per completed visit, plus the odd retail purchase. */
export function clientPayments(entries: CalendarEntry[], client: Client): Payment[] {
  const r = seeded(client.id.split('').reduce((m, ch) => m * 31 + ch.charCodeAt(0), 7) >>> 0)
  const visits = clientVisits(entries, client.id).filter((a) => a.status === 'completed')
  const out: Payment[] = visits.map((a, i) => ({
    id: a.id,
    number: 1000 + ((a.start.getDate() * 37 + a.start.getMonth() * 11 + i * 7) % 900),
    date: a.end,
    items: a.serviceIds.map((id) => serviceById[id].name).join(', '),
    method: r.pick(['cash', 'card', 'alif', 'alif', 'dc', 'milli'].map((m) => PAYMENT_METHODS.find((p) => p.id === m)!.name)),
    amount: a.price,
    kind: 'visit',
  }))
  if (visits.length && r.chance(0.6)) {
    const p = r.pick(PRODUCTS)
    const base = visits[r.int(0, visits.length - 1)]
    out.push({
      id: `${base.id}-p`,
      number: 1000 + r.int(100, 899),
      date: base.end,
      items: p.name,
      method: PAYMENT_METHODS[0].name,
      amount: p.price,
      kind: 'product',
    })
  }
  return out.sort((a, b) => +b.date - +a.date)
}

/* ─────────────── Segments ─────────────── */

export type Segment = {
  id: string
  name: string
  conditions: string[]
  builtIn: boolean
  match: (c: Client) => boolean
}

const unusedMembership = new Set(
  (() => {
    const r = seeded(77)
    return Array.from({ length: 7 }, () => `c${r.int(30, 130)}`)
  })(),
)

const daysSince = (d: Date | null) => (d ? daysBetween(d, TODAY) : Infinity)

export const SEGMENTS: Segment[] = [
  {
    id: 'not-60',
    name: 'Haven’t visited in 60 days',
    conditions: ['Last visit more than 60 days ago', 'Has at least 2 visits'],
    builtIn: true,
    match: (c) => daysSince(c.lastVisit) > 60 && c.visits >= 2,
  },
  {
    id: 'birthday',
    name: 'Birthday this week',
    conditions: ['Birthday within the next 7 days'],
    builtIn: true,
    match: (c) => birthdaySoon(c),
  },
  {
    id: 'unused-membership',
    name: 'Bought a membership, never used it',
    conditions: ['Has an active membership', 'No visits charged to it yet'],
    builtIn: true,
    match: (c) => unusedMembership.has(c.id),
  },
  {
    id: 'vip',
    name: 'VIP clients',
    conditions: ['Category is VIP (spent 8,000 TJS or more)'],
    builtIn: true,
    match: (c) => c.category === 'vip',
  },
  {
    id: 'lost',
    name: 'Lost clients',
    conditions: ['Category is Lost (no visit for 60+ days)'],
    builtIn: true,
    match: (c) => c.category === 'lost',
  },
  {
    id: 'coloring-45',
    name: 'Coloring clients due for a touch-up',
    conditions: ['Usually sees Madina Rahimova', 'Last visit 35 to 90 days ago'],
    builtIn: false,
    match: (c) => c.favoriteStaffId === 's1' && daysSince(c.lastVisit) >= 35 && daysSince(c.lastVisit) <= 90,
  },
  {
    id: 'nails-telegram',
    name: 'Nail clients on Telegram',
    conditions: ['Usually sees Firuza Saidova', 'Connected to the Telegram bot'],
    builtIn: false,
    match: (c) => c.favoriteStaffId === 's2' && !!c.telegram,
  },
]

export const COUNTED_AT = '09:00'

/** Upcoming birthday label: "in 2 days", "today". */
export function birthdayIn(c: Client) {
  if (!c.birthday) return null
  for (let d = 0; d <= 7; d++) {
    const day = addDays(TODAY, d)
    if (day.getMonth() === c.birthday.getMonth() && day.getDate() === c.birthday.getDate()) {
      return d === 0 ? 'today' : d === 1 ? 'tomorrow' : `in ${d} days`
    }
  }
  return null
}

export function ageOf(c: Client) {
  if (!c.birthday) return null
  let age = TODAY.getFullYear() - c.birthday.getFullYear()
  const had = TODAY.getMonth() > c.birthday.getMonth() || (TODAY.getMonth() === c.birthday.getMonth() && TODAY.getDate() >= c.birthday.getDate())
  if (!had) age--
  return age
}

/**
 * When the client first came. Imported or long-time clients can predate their
 * NavCRM record, so infer it from visit count when the record is too recent.
 */
export function clientSince(c: Client) {
  if (c.visits > 1 && c.lastVisit) {
    const inferred = addDays(c.lastVisit, -(c.visits - 1) * 18)
    if (inferred < c.createdAt) return inferred
  }
  return c.createdAt
}
