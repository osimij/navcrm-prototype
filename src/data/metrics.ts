import { seeded } from '@/lib/random'
import { NOW, TODAY, addDays, isSameDay, at } from '@/lib/time'
import { isVisit, type Appointment, type CalendarEntry } from './appointments'
import { bookableStaff, staffById } from './staff'
import { serviceById } from './services'

/** Salon revenue excludes visits by sublease tenants: that money belongs to them. */
const countsForSalon = (a: Appointment) => !staffById[a.staffId]?.tenant

const productRand = seeded(99)
const PRODUCT_SALES: number[] = Array.from({ length: 400 }, () => (productRand.chance(0.7) ? productRand.int(1, 9) * 45 : 0))
/** Retail sales (shampoo, serums…) on top of services, deterministic per day. */
const productSales = (dayOffset: number) => PRODUCT_SALES[dayOffset + 200] ?? 0

export function visitsOn(entries: CalendarEntry[], day: Date) {
  return entries.filter((e): e is Appointment => isVisit(e) && isSameDay(e.start, day))
}

export function revenueOn(entries: CalendarEntry[], dayOffset: number, until?: Date) {
  const day = addDays(TODAY, dayOffset)
  const paid = visitsOn(entries, day).filter((a) => a.paid && countsForSalon(a) && (!until || a.end <= until))
  const products = until ? Math.round(productSales(dayOffset) * Math.min(1, (until.getHours() - 9) / 12)) : productSales(dayOffset)
  return paid.reduce((m, a) => m + a.price, 0) + Math.max(0, products)
}

export type SeriesPoint = { date: Date; value: number; projected?: boolean; label: string }

/** Cumulative revenue through today, hour by hour, with the rest of the day projected from bookings. */
export function todaySeries(entries: CalendarEntry[]): SeriesPoint[] {
  const today = visitsOn(entries, TODAY).filter(countsForSalon)
  const points: SeriesPoint[] = []
  for (let h = 9; h <= 21; h++) {
    const t = at(TODAY, `${String(h).padStart(2, '0')}:00`)
    const projected = t > NOW
    const value = projected
      ? today
          .filter((a) => a.end <= t && a.status !== 'cancelled' && a.status !== 'no_show')
          .reduce((m, a) => m + a.price, 0) + productSales(0)
      : revenueOn(entries, 0, t)
    points.push({ date: t, value, projected, label: `${String(h).padStart(2, '0')}:00` })
  }
  // Insert "now" so the solid line ends exactly at the current moment.
  const nowValue = revenueOn(entries, 0, NOW)
  const idx = points.findIndex((p) => p.projected)
  points.splice(idx, 0, { date: NOW, value: nowValue, label: 'Now' })
  return points
}

export function dailySeries(entries: CalendarEntry[], days: number): SeriesPoint[] {
  const out: SeriesPoint[] = []
  for (let d = -(days - 1); d <= 0; d++) {
    const date = addDays(TODAY, d)
    out.push({ date, value: d === 0 ? revenueOn(entries, 0, NOW) : revenueOn(entries, d), label: '' })
  }
  return out
}

export type Period = 'today' | 'week' | 'month'
export const PERIOD_DAYS: Record<Period, number> = { today: 1, week: 7, month: 30 }

function visitsInRange(entries: CalendarEntry[], from: number, to: number) {
  const start = addDays(TODAY, from)
  const end = addDays(TODAY, to + 1)
  return entries.filter((e): e is Appointment => isVisit(e) && e.start >= start && e.start < end)
}

export function periodStats(entries: CalendarEntry[], period: Period) {
  const days = PERIOD_DAYS[period]
  const range = visitsInRange(entries, -(days - 1), 0)
  const prev = visitsInRange(entries, -(2 * days - 1), -days)
  const isDone = (a: Appointment) => a.status === 'completed'
  const doneNow = range.filter((a) => isDone(a) && countsForSalon(a))
  const donePrev = prev.filter((a) => isDone(a) && countsForSalon(a))

  let revenue = 0
  let revenuePrev = 0
  for (let d = -(days - 1); d <= 0; d++) revenue += d === 0 ? revenueOn(entries, 0, NOW) : revenueOn(entries, d)
  for (let d = -(2 * days - 1); d <= -days; d++) {
    // Compare today with the same time on the previous period's last day.
    revenuePrev += d === -days ? revenueOn(entries, d, addDays(NOW, -days)) : revenueOn(entries, d)
  }

  const todays = visitsOn(entries, TODAY).filter((a) => a.status !== 'cancelled')
  const remaining = todays.filter((a) => !a.paid && a.status !== 'no_show' && countsForSalon(a))
  const forecast = revenueOn(entries, 0, NOW) + remaining.reduce((m, a) => m + a.price, 0) + Math.round(productSales(0) * 0.4)

  const avg = doneNow.length ? Math.round(doneNow.reduce((m, a) => m + a.price, 0) / doneNow.length) : 0
  const avgPrev = donePrev.length ? Math.round(donePrev.reduce((m, a) => m + a.price, 0) / donePrev.length) : 0

  // Staff load: booked minutes over scheduled minutes, today or across the period.
  let booked = 0
  let available = 0
  for (const s of bookableStaff) {
    if (!s.today) continue
    const [sh, sm] = s.today.start.split(':').map(Number)
    const [eh, em] = s.today.end.split(':').map(Number)
    const perDay = eh * 60 + em - (sh * 60 + sm)
    const mine = range.filter((a) => a.staffId === s.id && a.status !== 'cancelled')
    booked += mine.reduce((m, a) => m + (a.end.getTime() - a.start.getTime()) / 60_000, 0)
    available += perDay * days * (period === 'today' ? 1 : 6 / 7)
  }

  const services = new Map<string, { count: number; revenue: number }>()
  const staff = new Map<string, { count: number; revenue: number }>()
  for (const a of doneNow) {
    for (const id of a.serviceIds) {
      const s = services.get(id) ?? { count: 0, revenue: 0 }
      s.count++
      s.revenue += serviceById[id].price
      services.set(id, s)
    }
    const st = staff.get(a.staffId) ?? { count: 0, revenue: 0 }
    st.count++
    st.revenue += a.price
    staff.set(a.staffId, st)
  }

  return {
    revenue,
    revenuePrev,
    forecast,
    remainingCount: remaining.length,
    visitsDone: range.filter(isDone).length,
    visitsBooked: range.filter((a) => a.status !== 'cancelled').length,
    visitsDonePrev: prev.filter(isDone).length,
    noShows: range.filter((a) => a.status === 'no_show').length,
    avgReceipt: avg,
    avgReceiptPrev: avgPrev,
    load: available ? Math.round((booked / available) * 100) : 0,
    topServices: [...services.entries()].map(([id, v]) => ({ id, ...v })).sort((a, b) => b.revenue - a.revenue).slice(0, 5),
    topStaff: [...staff.entries()].map(([id, v]) => ({ id, ...v })).sort((a, b) => b.revenue - a.revenue).slice(0, 5),
  }
}
