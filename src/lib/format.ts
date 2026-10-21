import { getLanguage, getLocale, text } from '@/i18n'
import { NOW, isSameDay, addDays, daysBetween } from './time'

const numberFormats = {
  en: [new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }), new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })],
  ru: [new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 0 }), new Intl.NumberFormat('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })],
}
const numberFormat = (decimals: boolean) => numberFormats[getLanguage()][decimals ? 1 : 0]

export const CURRENCY = 'TJS'

/** 12480 → "12,480" */
export function formatNumber(n: number, decimals = 0) {
  return numberFormat(!!decimals).format(decimals ? n : Math.round(n))
}

/** 12480 → "12,480 TJS" */
export function formatMoney(n: number, opts: { decimals?: boolean; sign?: boolean; currency?: boolean } = {}) {
  const { decimals = false, sign = false, currency = true } = opts
  const abs = Math.abs(n)
  const body = numberFormat(decimals).format(decimals ? abs : Math.round(abs))
  const s = n < 0 ? '−' : sign && n > 0 ? '+' : ''
  return `${s}${body}${currency ? ` ${CURRENCY}` : ''}`
}

export function formatPercent(n: number, decimals = 0) {
  return `${new Intl.NumberFormat(getLocale(), { minimumFractionDigits: decimals, maximumFractionDigits: decimals }).format(n)}%`
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

export const monthShort = (m: number) => getLanguage() === 'ru' ? new Intl.DateTimeFormat('ru-RU', { month: 'short' }).format(new Date(2026, m, 1)) : MONTHS[m]
export const monthLong = (m: number) => getLanguage() === 'ru' ? new Intl.DateTimeFormat('ru-RU', { month: 'long' }).format(new Date(2026, m, 1)) : MONTHS_LONG[m]
export const dayShort = (d: number) => getLanguage() === 'ru' ? ['вс', 'пн', 'вт', 'ср', 'чт', 'пт', 'сб'][d] : DAYS[d]
export const dayLong = (d: number) => getLanguage() === 'ru' ? ['воскресенье', 'понедельник', 'вторник', 'среда', 'четверг', 'пятница', 'суббота'][d] : DAYS_LONG[d]

/** "14:30" */
export function formatTime(d: Date) {
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

/** "22 Oct" or "22 Oct 2025" when not this year */
export function formatDate(d: Date, opts: { year?: boolean; weekday?: boolean } = {}) {
  const showYear = opts.year ?? d.getFullYear() !== NOW.getFullYear()
  if (getLanguage() === 'ru') return new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'short', ...(showYear ? { year: 'numeric' as const } : {}), ...(opts.weekday ? { weekday: 'short' as const } : {}) }).format(d)
  const base = `${d.getDate()} ${MONTHS[d.getMonth()]}${showYear ? ` ${d.getFullYear()}` : ''}`
  return opts.weekday ? `${DAYS[d.getDay()]}, ${base}` : base
}

/** "Thursday, 22 October" */
export function formatDateLong(d: Date) {
  if (getLanguage() === 'ru') return new Intl.DateTimeFormat('ru-RU', { weekday: 'long', day: 'numeric', month: 'long' }).format(d)
  return `${DAYS_LONG[d.getDay()]}, ${d.getDate()} ${MONTHS_LONG[d.getMonth()]}`
}

/** "Today", "Yesterday", "Tomorrow", or "Mon, 19 Oct" */
export function formatDay(d: Date) {
  if (isSameDay(d, NOW)) return text('Today')
  if (isSameDay(d, addDays(NOW, -1))) return text('Yesterday')
  if (isSameDay(d, addDays(NOW, 1))) return text('Tomorrow')
  return formatDate(d, { weekday: true })
}

/** "Today, 14:30" / "Yesterday, 09:10" / "19 Oct, 12:00" */
export function formatDayTime(d: Date) {
  const day = isSameDay(d, NOW) ? text('Today') : isSameDay(d, addDays(NOW, -1)) ? text('Yesterday') : formatDate(d)
  return `${day}, ${formatTime(d)}`
}

/** "now", "5 min ago", "3 h ago", "2 days ago" */
export function formatRelative(d: Date) {
  const diff = (NOW.getTime() - d.getTime()) / 60_000
  if (getLanguage() === 'ru') {
    if (diff < 1) return 'сейчас'
    const relative = new Intl.RelativeTimeFormat('ru-RU', { numeric: 'auto' })
    if (diff < 60) return relative.format(-Math.round(diff), 'minute')
    if (diff < 60 * 24 && isSameDay(d, NOW)) return relative.format(-Math.round(diff / 60), 'hour')
    const days = daysBetween(d, NOW)
    return days < 30 ? relative.format(-days, 'day') : formatDate(d)
  }
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
  if (days === 1) return text('Yesterday')
  if (days < 7) return dayShort(d.getDay())
  return formatDate(d)
}

export function formatDuration(min: number) {
  const minute = getLanguage() === 'ru' ? 'мин' : 'min'
  const hour = getLanguage() === 'ru' ? 'ч' : 'h'
  if (min < 60) return `${min} ${minute}`
  const h = Math.floor(min / 60)
  const m = min % 60
  return m ? `${h} ${hour} ${m} ${minute}` : `${h} ${hour}`
}

export function initials(name: string) {
  const parts = name.trim().split(/\s+/)
  return ((parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '')).toUpperCase()
}

export function plural(n: number, one: string, many = `${one}s`) {
  if (getLanguage() === 'ru') {
    const forms = RU_PLURALS[one]
    if (forms) {
      const category = new Intl.PluralRules('ru-RU').select(n)
      return `${formatNumber(n)} ${forms[category === 'one' ? 0 : category === 'few' ? 1 : 2]}`
    }
  }
  return `${formatNumber(n)} ${n === 1 ? one : many}`
}

const RU_PLURALS: Record<string, [string, string, string]> = {
  client: ['клиент', 'клиента', 'клиентов'], 'regular client': ['постоянный клиент', 'постоянных клиента', 'постоянных клиентов'],
  visit: ['визит', 'визита', 'визитов'], 'completed visit': ['завершённый визит', 'завершённых визита', 'завершённых визитов'],
  'more visit': ['дополнительный визит', 'дополнительных визита', 'дополнительных визитов'], 'earlier visit': ['более ранний визит', 'более ранних визита', 'более ранних визитов'],
  day: ['день', 'дня', 'дней'], receipt: ['чек', 'чека', 'чеков'], person: ['сотрудник', 'сотрудника', 'сотрудников'],
  payout: ['выплата', 'выплаты', 'выплат'], product: ['товар', 'товара', 'товаров'], supplier: ['поставщик', 'поставщика', 'поставщиков'],
  order: ['заказ', 'заказа', 'заказов'], document: ['документ', 'документа', 'документов'], service: ['услуга', 'услуги', 'услуг'],
  expense: ['расход', 'расхода', 'расходов'], test: ['анализ', 'анализа', 'анализов'], 'active test': ['активный анализ', 'активных анализа', 'активных анализов'],
  package: ['комплекс', 'комплекса', 'комплексов'], value: ['показатель', 'показателя', 'показателей'], item: ['позиция', 'позиции', 'позиций'],
  'low product': ['товар с низким остатком', 'товара с низким остатком', 'товаров с низким остатком'],
  'online booking': ['онлайн-запись', 'онлайн-записи', 'онлайн-записей'], 'no-show': ['неявка', 'неявки', 'неявок'],
}
