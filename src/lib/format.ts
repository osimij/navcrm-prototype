import { NOW, isSameDay, addDays, daysBetween } from './time'

const num0 = new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 })
const num2 = new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

export const CURRENCY = 'TJS'

/** 12480 → "12,480" */
export function formatNumber(n: number, decimals = 0) {
  return decimals ? num2.format(n) : num0.format(Math.round(n))
}

/** 12480 → "12,480 TJS" */
export function formatMoney(n: number, opts: { decimals?: boolean; sign?: boolean; currency?: boolean } = {}) {
  const { decimals = false, sign = false, currency = true } = opts
  const abs = Math.abs(n)
  const body = decimals ? num2.format(abs) : num0.format(Math.round(abs))
  const s = n < 0 ? '−' : sign && n > 0 ? '+' : ''
  return `${s}${body}${currency ? ` ${CURRENCY}` : ''}`
}

export function formatPercent(n: number, decimals = 0) {
  return `${n.toFixed(decimals)}%`
}

/** "+992931234567" → "+992 93 123 45 67" */
export function formatPhone(raw: string) {
  const d = raw.replace(/\D/g, '').replace(/^992/, '')
  if (d.length < 9) return raw
  return `+992 ${d.slice(0, 2)} ${d.slice(2, 5)} ${d.slice(5, 7)} ${d.slice(7, 9)}`
}

export function lastDigits(phone: string, n = 4) {
  return phone.replace(/\D/g, '').slice(-n)
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const MONTHS_LONG = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const DAYS_LONG = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

export const monthShort = (m: number) => MONTHS[m]
export const monthLong = (m: number) => MONTHS_LONG[m]
export const dayShort = (d: number) => DAYS[d]
export const dayLong = (d: number) => DAYS_LONG[d]

/** "14:30" */
export function formatTime(d: Date) {
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

/** "22 Oct" or "22 Oct 2025" when not this year */
export function formatDate(d: Date, opts: { year?: boolean; weekday?: boolean } = {}) {
  const showYear = opts.year ?? d.getFullYear() !== NOW.getFullYear()
  const base = `${d.getDate()} ${MONTHS[d.getMonth()]}${showYear ? ` ${d.getFullYear()}` : ''}`
  return opts.weekday ? `${DAYS[d.getDay()]}, ${base}` : base
}

/** "Thursday, 22 October" */
export function formatDateLong(d: Date) {
  return `${DAYS_LONG[d.getDay()]}, ${d.getDate()} ${MONTHS_LONG[d.getMonth()]}`
}

/** "Today", "Yesterday", "Tomorrow", or "Mon, 19 Oct" */
export function formatDay(d: Date) {
  if (isSameDay(d, NOW)) return 'Today'
  if (isSameDay(d, addDays(NOW, -1))) return 'Yesterday'
  if (isSameDay(d, addDays(NOW, 1))) return 'Tomorrow'
  return formatDate(d, { weekday: true })
}

/** "Today, 14:30" / "Yesterday, 09:10" / "19 Oct, 12:00" */
export function formatDayTime(d: Date) {
  const day = isSameDay(d, NOW) ? 'Today' : isSameDay(d, addDays(NOW, -1)) ? 'Yesterday' : formatDate(d)
  return `${day}, ${formatTime(d)}`
}

/** "now", "5 min ago", "3 h ago", "2 days ago" */
export function formatRelative(d: Date) {
  const diff = (NOW.getTime() - d.getTime()) / 60_000
  if (diff < 1) return 'now'
  if (diff < 60) return `${Math.round(diff)} min ago`
  if (diff < 60 * 24 && isSameDay(d, NOW)) return `${Math.round(diff / 60)} h ago`
  const days = daysBetween(d, NOW)
  if (days === 1) return 'yesterday'
  if (days < 30) return `${days} days ago`
  return formatDate(d)
}

/** Short time-ago for inbox lists: "14:02", "Yesterday", "Mon", "19 Oct" */
export function formatListTime(d: Date) {
  if (isSameDay(d, NOW)) return formatTime(d)
  const days = daysBetween(d, NOW)
  if (days === 1) return 'Yesterday'
  if (days < 7) return DAYS[d.getDay()]
  return formatDate(d)
}

export function formatDuration(min: number) {
  if (min < 60) return `${min} min`
  const h = Math.floor(min / 60)
  const m = min % 60
  return m ? `${h} h ${m} min` : `${h} h`
}

export function initials(name: string) {
  const parts = name.trim().split(/\s+/)
  return ((parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '')).toUpperCase()
}

export function plural(n: number, one: string, many = `${one}s`) {
  return `${formatNumber(n)} ${n === 1 ? one : many}`
}
