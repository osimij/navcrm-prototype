import { seeded } from '@/lib/random'
import { NOW, TODAY, addDays, addMinutes, at } from '@/lib/time'
import type { LabelColor } from './business'
import { bookableStaff, type Staff } from './staff'
import { servicesFor, serviceById } from './services'
import { clients } from './clients'

export type VisitStatus = 'booked' | 'confirmed' | 'arrived' | 'in_progress' | 'completed' | 'no_show' | 'cancelled'
export type BookingSource = 'phone' | 'online' | 'instagram' | 'telegram' | 'walk_in' | 'assistant'
export type BlockType = 'break' | 'training' | 'personal' | 'busy'

export type Appointment = {
  id: string
  kind: 'visit'
  clientId: string
  staffId: string
  serviceIds: string[]
  start: Date
  end: Date
  status: VisitStatus
  source: BookingSource
  price: number
  paid: boolean
  comment?: string
  label?: LabelColor
  recurring?: boolean
}

export type TimeBlock = {
  id: string
  kind: 'block'
  staffId: string
  start: Date
  end: Date
  type: BlockType
  note?: string
}

export type CalendarEntry = Appointment | TimeBlock

export const STATUS_META: Record<VisitStatus, { label: string; tone: 'neutral' | 'accent' | 'positive' | 'warning' | 'negative' }> = {
  booked: { label: 'Booked', tone: 'neutral' },
  confirmed: { label: 'Confirmed', tone: 'accent' },
  arrived: { label: 'Arrived', tone: 'warning' },
  in_progress: { label: 'In progress', tone: 'accent' },
  completed: { label: 'Completed', tone: 'positive' },
  no_show: { label: 'No-show', tone: 'negative' },
  cancelled: { label: 'Cancelled', tone: 'neutral' },
}

export const SOURCE_LABEL: Record<BookingSource, string> = {
  phone: 'Phone call',
  online: 'Booking page',
  instagram: 'Instagram',
  telegram: 'Telegram bot',
  walk_in: 'Walk-in',
  assistant: 'AI assistant',
}

export const BLOCK_LABEL: Record<BlockType, string> = {
  break: 'Break',
  training: 'Training',
  personal: 'Personal',
  busy: 'Busy',
}

const OFF_DAY: Record<string, number> = { s1: 1, s2: 2, s3: 0, s4: 3, s5: 0, s6: 1 }

type Pin = { day: number; staffId: string; start: string; serviceIds: string[]; clientId: string; status?: VisitStatus; source: BookingSource; comment?: string }

// Hand-placed visits that the demo story leans on.
const PINS: Pin[] = [
  { day: 0, staffId: 's1', start: '16:00', serviceIds: ['v3'], clientId: 'c1', status: 'confirmed', source: 'telegram', comment: 'Same shade as last time, 7.1. Coffee without sugar.' },
  { day: 0, staffId: 's2', start: '17:30', serviceIds: ['v6'], clientId: 'c2', status: 'confirmed', source: 'phone' },
  { day: 0, staffId: 's4', start: '15:30', serviceIds: ['v9'], clientId: 'c17', status: 'booked', source: 'instagram', comment: 'First visit, found us on Instagram.' },
  { day: 0, staffId: 's3', start: '11:00', serviceIds: ['v11'], clientId: 'c24', status: 'completed', source: 'assistant' },
  { day: 0, staffId: 's2', start: '12:30', serviceIds: ['v6'], clientId: 'c13', status: 'completed', source: 'online' },
  { day: 0, staffId: 's5', start: '10:00', serviceIds: ['v14'], clientId: 'c7', status: 'no_show', source: 'phone' },
  { day: 1, staffId: 's1', start: '10:00', serviceIds: ['v1', 'v2'], clientId: 'c3', status: 'confirmed', source: 'online' },
]

const r = seeded(4242)
const activeClients = clients.filter((c) => !c.archived && c.category !== 'lost')
// New clients only appear from today on; past visits belong to returning clients.
const pools = {
  past: {
    female: activeClients.filter((c) => c.gender === 'female' && c.category !== 'new'),
    male: activeClients.filter((c) => c.gender === 'male' && c.category !== 'new'),
  },
  now: {
    female: activeClients.filter((c) => c.gender === 'female'),
    male: activeClients.filter((c) => c.gender === 'male'),
  },
}

function density(day: number) {
  if (day <= 0) return 0.86
  if (day === 1) return 0.74
  if (day === 2) return 0.58
  if (day < 7) return 0.42
  return 0.22
}

function statusFor(day: number, start: Date, end: Date, s: Staff): VisitStatus {
  if (day < 0) {
    const roll = r.next()
    return roll < 0.04 ? 'no_show' : roll < 0.08 ? 'cancelled' : 'completed'
  }
  if (day > 0) return r.chance(0.7) ? 'confirmed' : 'booked'
  if (end <= NOW) return 'completed'
  if (start <= NOW) return 'in_progress'
  if (start.getTime() - NOW.getTime() <= 15 * 60_000 && s.id !== 's6') return 'arrived'
  return r.chance(0.72) ? 'confirmed' : 'booked'
}

function pickSource(): BookingSource {
  const x = r.next()
  return x < 0.3 ? 'phone' : x < 0.55 ? 'online' : x < 0.7 ? 'instagram' : x < 0.85 ? 'telegram' : x < 0.95 ? 'walk_in' : 'assistant'
}

function generateDay(day: number): CalendarEntry[] {
  const date = addDays(TODAY, day)
  const out: CalendarEntry[] = []
  for (const s of bookableStaff) {
    if (day !== 0 && OFF_DAY[s.id] === date.getDay()) continue
    const hours = s.today
    if (!hours) continue
    const busy: { start: Date; end: Date }[] = []
    let n = 0

    for (const p of PINS.filter((p) => p.day === day && p.staffId === s.id)) {
      const start = at(date, p.start)
      const dur = p.serviceIds.reduce((m, id) => m + serviceById[id].duration, 0)
      const end = addMinutes(start, dur)
      busy.push({ start, end })
      out.push({
        id: `a${day}_${s.id}_p${n++}`,
        kind: 'visit',
        clientId: p.clientId,
        staffId: s.id,
        serviceIds: p.serviceIds,
        start,
        end,
        status: p.status ?? statusFor(day, start, end, s),
        source: p.source,
        price: p.serviceIds.reduce((m, id) => m + serviceById[id].price, 0),
        paid: p.status === 'completed',
        comment: p.comment,
      })
    }

    if (hours.break) {
      const start = at(date, hours.break.start)
      const end = at(date, hours.break.end)
      busy.push({ start, end })
      out.push({ id: `b${day}_${s.id}`, kind: 'block', staffId: s.id, start, end, type: 'break' })
    }
    if (day === 0 && s.id === 's4') {
      const start = at(date, '18:30')
      const end = at(date, '19:30')
      busy.push({ start, end })
      out.push({ id: `b${day}_${s.id}_t`, kind: 'block', staffId: s.id, start, end, type: 'training', note: 'Lash lift product training' })
    }

    const dayEnd = at(date, hours.end)
    let t = at(date, hours.start)
    const options = servicesFor(s.id)
    while (t < dayEnd) {
      const inside = busy.find((b) => t >= b.start && t < b.end)
      if (inside) {
        t = inside.end
        continue
      }
      if (!r.chance(density(day))) {
        t = addMinutes(t, r.pick([15, 30, 30, 45, 60]))
        continue
      }
      const nextBusy = busy.filter((b) => b.start > t).sort((a, b) => +a.start - +b.start)[0]
      const limit = nextBusy ? nextBusy.start : dayEnd
      const fits = options.filter((o) => +addMinutes(t, o.duration) <= +limit)
      if (!fits.length) {
        t = nextBusy ? nextBusy.end : dayEnd
        continue
      }
      const svc = fits[Math.floor(Math.pow(r.next(), 1.4) * fits.length)]
      const serviceIds = [svc.id]
      const extra = fits.find((o) => o.id !== svc.id && +addMinutes(t, svc.duration + o.duration) <= +limit)
      if (extra && r.chance(0.12)) serviceIds.push(extra.id)
      const dur = serviceIds.reduce((m, id) => m + serviceById[id].duration, 0)
      const start = t
      const end = addMinutes(start, dur)
      const p = day < 0 ? pools.past : pools.now
      const pool = s.id === 's5' ? p.male : p.female
      const client = r.pick(pool)
      out.push({
        id: `a${day}_${s.id}_${n++}`,
        kind: 'visit',
        clientId: client.id,
        staffId: s.id,
        serviceIds,
        start,
        end,
        status: statusFor(day, start, end, s),
        source: pickSource(),
        price: serviceIds.reduce((m, id) => m + serviceById[id].price, 0),
        paid: false,
      })
      t = end
    }
  }
  for (const e of out) if (e.kind === 'visit' && e.status === 'completed') e.paid = true
  return out
}

/** From 60 days ago to 13 days ahead. Mutable: the store replaces it as visits change. */
export const initialEntries: CalendarEntry[] = []
for (let d = -60; d <= 13; d++) initialEntries.push(...generateDay(d))

// A cancellation today, hidden unless "Show cancelled" is on.
const cancelledToday = initialEntries.find(
  (e): e is Appointment => e.kind === 'visit' && e.staffId === 's3' && e.start > NOW && e.status !== 'arrived',
)
if (cancelledToday) cancelledToday.status = 'cancelled'

// Keep client records consistent with the calendar: last visit and visit count
// can't be older or smaller than what the visit history shows.
{
  const seen = new Map<string, { first: Date; last: Date; count: number; spent: number }>()
  for (const e of initialEntries) {
    if (e.kind !== 'visit' || e.status !== 'completed') continue
    const s = seen.get(e.clientId) ?? { first: e.start, last: e.start, count: 0, spent: 0 }
    s.count++
    s.spent += e.price
    if (e.start > s.last) s.last = e.start
    if (e.start < s.first) s.first = e.start
    seen.set(e.clientId, s)
  }
  const dayOf = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate())
  for (const c of clients) {
    const s = seen.get(c.id)
    if (!s) continue
    if (!c.lastVisit || c.lastVisit < dayOf(s.last)) c.lastVisit = s.last
    if (c.visits < s.count) c.visits = s.count
    // Spending covers the visits we can see plus earlier ones at the same average.
    const earlier = Math.max(0, c.visits - s.count) * Math.round(s.spent / s.count)
    c.totalSpent = Math.max(c.totalSpent, Math.round((s.spent + earlier) / 10) * 10)
    if (c.createdAt > dayOf(s.first)) c.createdAt = dayOf(s.first)
  }
}

export const isVisit = (e: CalendarEntry): e is Appointment => e.kind === 'visit'

export function serviceNames(a: Appointment) {
  return a.serviceIds.map((id) => serviceById[id].name).join(' + ')
}
