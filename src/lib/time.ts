// The prototype runs on a fixed "now": today at 14:20, so the calendar and
// dashboard always show a business day in progress, whenever the demo runs.
const real = new Date()
export const NOW = new Date(real.getFullYear(), real.getMonth(), real.getDate(), 14, 20, 0, 0)
export const TODAY = startOfDay(NOW)

export function startOfDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate())
}

export function addDays(d: Date, n: number) {
  const x = new Date(d)
  x.setDate(x.getDate() + n)
  return x
}

export function addMinutes(d: Date, n: number) {
  return new Date(d.getTime() + n * 60_000)
}

export function at(day: Date, hhmm: string) {
  const [h, m] = hhmm.split(':').map(Number)
  return new Date(day.getFullYear(), day.getMonth(), day.getDate(), h, m)
}

export function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}

export function daysBetween(a: Date, b: Date) {
  return Math.round((startOfDay(b).getTime() - startOfDay(a).getTime()) / 86_400_000)
}

export function minutesOfDay(d: Date) {
  return d.getHours() * 60 + d.getMinutes()
}
