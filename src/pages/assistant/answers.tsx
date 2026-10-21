import type { IconSvgElement } from '@hugeicons/react'
import type { ReactNode } from 'react'
import { toast } from 'sonner'
import type { Bar } from '@/components/charts/bar-chart'
import { I } from '@/components/icons'
import { Money } from '@/components/ui/misc'
import { isVisit, type Appointment, type CalendarEntry } from '@/data/appointments'
import { business } from '@/data/business'
import type { Client } from '@/data/clients'
import { dailySeries, periodStats } from '@/data/metrics'
import { serviceById, services } from '@/data/services'
import { bookableStaff, staffById } from '@/data/staff'
import { dayShort, formatDate, formatDuration, formatMoney, formatTime, plural } from '@/lib/format'
import type { NewVisitPrefill } from '@/lib/overlays'
import { NOW, TODAY, addDays, addMinutes, at, isSameDay } from '@/lib/time'

export type Action = { label: string; icon?: IconSvgElement; primary?: boolean; run: () => void }

export type Block =
  | { type: 'text'; text: ReactNode }
  | { type: 'table'; columns: { label: string; align?: 'right' }[]; rows: ReactNode[][] }
  | { type: 'bars'; bars: Bar[]; caption: string; format?: (b: Bar) => ReactNode }
  | { type: 'post'; text: string }
  | { type: 'actions'; actions: Action[] }
  | { type: 'suggestions' }

export type Ctx = {
  entries: CalendarEntry[]
  clients: Client[]
  navigate: (to: string) => void
  openNewVisit: (p?: NewVisitPrefill) => void
  openClient: (id: string) => void
  ask: (q: string) => void
}

export const SUGGESTIONS = [
  'How did this week compare to last week?',
  'Which masters had free time today?',
  'Who hasn’t visited in 60 days?',
  'How much shampoo is left?',
  'Why did revenue change?',
  'Write an Instagram post about lash lamination',
]

const pct = (now: number, prev: number) => (prev ? Math.round(((now - prev) / prev) * 100) : 0)
const signed = (n: number) => (n > 0 ? `+${n}` : n < 0 ? `−${Math.abs(n)}` : '0')
const B = ({ children }: { children: ReactNode }) => <span className="font-medium text-fg">{children}</span>
const M = ({ v, sign }: { v: number; sign?: boolean }) => <Money value={v} sign={sign} className="font-medium text-fg" />

const salon = (a: Appointment) => !staffById[a.staffId]?.tenant

function completedBetween(entries: CalendarEntry[], fromDay: number, toDay: number) {
  const from = addDays(TODAY, fromDay)
  const to = addDays(TODAY, toDay + 1)
  return entries.filter((e): e is Appointment => isVisit(e) && e.status === 'completed' && salon(e) && e.start >= from && e.start < to)
}

/* ───────────────────────── Intents ───────────────────────── */

function compareWeek(ctx: Ctx): Block[] {
  const s = periodStats(ctx.entries, 'week')
  const days = dailySeries(ctx.entries, 7)
  const best = days.slice(0, -1).reduce((m, d) => (d.value > m.value ? d : m), days[0])
  const change = pct(s.revenue, s.revenuePrev)
  return [
    {
      type: 'text',
      text: (
        <>
          Over the last 7 days you made <M v={s.revenue} />, {change >= 0 ? 'up' : 'down'} <B>{Math.abs(change)}%</B> on the 7 days before. Visits went
          from <B>{s.visitsDonePrev}</B> to <B>{s.visitsDone}</B> and the average receipt from <M v={s.avgReceiptPrev} /> to <M v={s.avgReceipt} />. Your best day was{' '}
          <B>{formatDate(best.date, { weekday: true })}</B> with <M v={best.value} />.
        </>
      ),
    },
    {
      type: 'table',
      columns: [{ label: '' }, { label: 'Last 7 days', align: 'right' }, { label: 'Previous 7', align: 'right' }, { label: 'Change', align: 'right' }],
      rows: [
        ['Revenue', <Money key="a" value={s.revenue} />, <Money key="b" value={s.revenuePrev} />, `${signed(change)}%`],
        ['Completed visits', s.visitsDone, s.visitsDonePrev, signed(s.visitsDone - s.visitsDonePrev)],
        ['Average receipt', <Money key="c" value={s.avgReceipt} />, <Money key="d" value={s.avgReceiptPrev} />, `${signed(pct(s.avgReceipt, s.avgReceiptPrev))}%`],
      ],
    },
    {
      type: 'bars',
      caption: 'Revenue by day',
      bars: days.map((d, i) => ({ label: i === days.length - 1 ? 'Today' : dayShort(d.date.getDay()), value: d.value, muted: i === days.length - 1 })),
      format: (b) => formatMoney(b.value),
    },
    { type: 'actions', actions: [{ label: 'Open revenue report', icon: I.reports, run: () => ctx.navigate('/reports/revenue') }] },
  ]
}

function freeTime(ctx: Ctx): Block[] {
  const rows = bookableStaff
    .filter((s) => s.today)
    .map((s) => {
      const busy = ctx.entries
        .filter((e) => e.staffId === s.id && isSameDay(e.start, NOW) && !(isVisit(e) && (e.status === 'cancelled' || e.status === 'no_show')))
        .sort((a, b) => +a.start - +b.start)
      const start = at(TODAY, s.today!.start)
      const end = at(TODAY, s.today!.end)
      const scheduled = (+end - +start) / 60_000
      const booked = busy.filter(isVisit).reduce((m, a) => m + (+a.end - +a.start) / 60_000, 0)
      // Free minutes from now until closing, and the first gap of 30+ minutes.
      let free = 0
      let nextFree: Date | null = null
      let t = NOW > start ? NOW : start
      for (const b of busy) {
        if (b.end <= t) continue
        if (b.start > t) {
          const gap = (+b.start - +t) / 60_000
          free += gap
          if (!nextFree && gap >= 30) nextFree = t
        }
        if (b.end > t) t = b.end
      }
      if (t < end) {
        const gap = (+end - +t) / 60_000
        free += gap
        if (!nextFree && gap >= 30) nextFree = t
      }
      const round = (d: Date) => addMinutes(d, (15 - (d.getMinutes() % 15)) % 15)
      return { s, scheduled, booked, free: Math.round(free / 15) * 15, nextFree: nextFree ? round(nextFree) : null }
    })
    .sort((a, b) => b.free - a.free)

  const top = rows.filter((r) => r.free >= 30).slice(0, 2)
  const first = top[0]
  return [
    {
      type: 'text',
      text: top.length ? (
        <>
          The most free time left today is with{' '}
          {top.map((r, i) => (
            <span key={r.s.id}>
              {i > 0 && ' and '}
              <B>{r.s.name.split(' ')[0]}</B> ({formatDuration(r.free)})
            </span>
          ))}
          . Everyone else is close to full until closing.
        </>
      ) : (
        <>Every master is fully booked for the rest of today.</>
      ),
    },
    {
      type: 'table',
      columns: [{ label: 'Master' }, { label: 'Booked today', align: 'right' }, { label: 'Free from now', align: 'right' }, { label: 'Next free', align: 'right' }],
      rows: rows.map((r) => [
        `${r.s.name} · ${r.s.position}`,
        `${Math.round((r.booked / r.scheduled) * 100)}%`,
        r.free ? formatDuration(r.free) : '—',
        r.nextFree ? formatTime(r.nextFree) : '—',
      ]),
    },
    {
      type: 'actions',
      actions: [
        ...(first?.nextFree
          ? [{ label: `Book ${first.s.name.split(' ')[0]} at ${formatTime(first.nextFree)}`, icon: I.calendarAdd, primary: true, run: () => ctx.openNewVisit({ staffId: first.s.id, start: first.nextFree! }) }]
          : []),
        { label: 'Offer free slots to the waiting list', icon: I.send, run: () => toast.success('Free slots offered to 3 clients on the waiting list', { description: 'Sent in Telegram. The first to reply gets the slot.' }) },
      ],
    },
  ]
}

function lost(ctx: Ctx): Block[] {
  // "Lost" is the auto-category for clients absent 60+ days, so this matches the Clients page.
  const away = ctx.clients.filter((c) => !c.archived && c.category === 'lost')
  const regulars = away.filter((c) => c.visits >= 8)
  const value = regulars.reduce((m, c) => m + c.totalSpent, 0)
  const top = [...regulars].sort((a, b) => b.totalSpent - a.totalSpent).slice(0, 5)
  return [
    {
      type: 'text',
      text: (
        <>
          <B>{plural(away.length, 'client')}</B> haven’t been back in 60 days or more. <B>{regulars.length}</B> of them used to come often (8+ visits) and have spent{' '}
          <M v={value} /> with you in total. They’re the ones worth a personal offer.
        </>
      ),
    },
    {
      type: 'table',
      columns: [{ label: 'Client' }, { label: 'Last visit', align: 'right' }, { label: 'Visits', align: 'right' }, { label: 'Spent', align: 'right' }],
      rows: top.map((c) => [
        <button key={c.id} type="button" onClick={() => ctx.openClient(c.id)} className="text-left hover:underline underline-offset-4">
          {c.name}
        </button>,
        c.lastVisit ? formatDate(c.lastVisit) : '—',
        c.visits,
        <Money key="m" value={c.totalSpent} />,
      ]),
    },
    {
      type: 'actions',
      actions: [
        { label: `Win back ${plural(regulars.length, 'client')}`, icon: I.campaigns, primary: true, run: () => ctx.navigate('/campaigns/new?segment=lost60') },
        { label: 'See the segment', icon: I.clients, run: () => ctx.navigate('/clients/segments') },
      ],
    },
  ]
}

function shampoo(ctx: Ctx): Block[] {
  return [
    {
      type: 'text',
      text: (
        <>
          You have <B>2.4 L</B> of professional shampoo left in 3 bottles. Tech cards use about <B>0.3 L a day</B>, so it lasts roughly <B>8 days</B>, below your 3 L
          minimum. Retail stock is fine: 7 bottles of color-safe shampoo for sale.
        </>
      ),
    },
    {
      type: 'table',
      columns: [{ label: 'Product' }, { label: 'In stock', align: 'right' }, { label: 'Minimum', align: 'right' }, { label: 'Lasts about', align: 'right' }],
      rows: [
        ['Keratin shampoo, 1 L (salon use)', '1.6 L', '2 L', '5 days'],
        ['Color-safe shampoo, 1 L (salon use)', '0.8 L', '1 L', '4 days'],
        ['Color-safe shampoo, 250 ml (retail)', '7 pcs', '4 pcs', '3 weeks'],
      ],
    },
    {
      type: 'actions',
      actions: [
        { label: 'Order 6 bottles', icon: I.inventory, primary: true, run: () => ctx.navigate('/inventory/orders') },
        { label: 'Open inventory', run: () => ctx.navigate('/inventory') },
      ],
    },
  ]
}

function whyRevenue(ctx: Ctx): Block[] {
  const now = completedBetween(ctx.entries, -6, 0)
  const prev = completedBetween(ctx.entries, -13, -7)
  const sum = (l: Appointment[]) => l.reduce((m, a) => m + a.price, 0)
  const rNow = sum(now)
  const rPrev = sum(prev)
  const avgNow = now.length ? rNow / now.length : 0
  const avgPrev = prev.length ? rPrev / prev.length : 0
  const volume = Math.round((now.length - prev.length) * avgPrev)
  const price = Math.round(rNow - rPrev - volume)
  const byStaff = bookableStaff
    .filter((s) => !s.tenant)
    .map((s) => {
      const a = sum(now.filter((x) => x.staffId === s.id))
      const b = sum(prev.filter((x) => x.staffId === s.id))
      return { s, a, b, d: a - b }
    })
    .sort((x, y) => Math.abs(y.d) - Math.abs(x.d))
  const lead = byStaff[0]
  const change = pct(rNow, rPrev)
  return [
    {
      type: 'text',
      text: (
        <>
          Service revenue is {change >= 0 ? 'up' : 'down'} <B>{Math.abs(change)}%</B> (<M v={rNow - rPrev} sign />) compared with the week before. About <M v={volume} sign /> comes
          from {now.length >= prev.length ? 'more' : 'fewer'} visits ({prev.length} → {now.length}) and <M v={price} sign /> from the average receipt ({formatMoney(avgPrev)} →{' '}
          {formatMoney(avgNow)}). The biggest single change is <B>{lead.s.name.split(' ')[0]}</B>: <M v={lead.d} sign />.
        </>
      ),
    },
    {
      type: 'table',
      columns: [{ label: 'Master' }, { label: 'Last 7 days', align: 'right' }, { label: 'Previous 7', align: 'right' }, { label: 'Change', align: 'right' }],
      rows: byStaff.map((r) => [
        r.s.name,
        <Money key="a" value={r.a} />,
        <Money key="b" value={r.b} />,
        <Money key="c" value={r.d} sign tone />,
      ]),
    },
    { type: 'actions', actions: [{ label: 'Open revenue report', icon: I.reports, run: () => ctx.navigate('/reports/revenue') }] },
  ]
}

function post(q: string, ctx: Ctx): Block[] {
  const lower = q.toLowerCase()
  const svc =
    services.find((s) => s.name.toLowerCase().split(/[\s&+’']+/).some((w) => w.length > 3 && lower.includes(w))) ??
    (lower.includes('peel') ? serviceById.v12 : serviceById.v9)
  const master = staffById[svc.staffIds[0]].name.split(' ')[0]
  const hook: Record<string, string> = {
    v9: 'Natural curl and shine for 6–8 weeks. No extensions, no daily curling.',
    v12: 'Smoother, brighter skin after one session. Autumn is the best season for peels.',
    v6: 'Gel polish that stays perfect for three weeks.',
    v3: 'Rich, even color that lasts. We match your shade exactly.',
  }
  const line = hook[svc.id] ?? `Our ${svc.name.toLowerCase()} takes ${formatDuration(svc.duration)} and you’ll leave glowing.`
  const short = /short/.test(lower)
  const text = short
    ? `${svc.name} with ${master}, ${formatMoney(svc.price)} ✨ ${line.split('.')[0]}.\nBook: ${business.bookingLink}`
    : `${svc.name} at ${business.name} ✨\n\n${line}\n\n${formatMoney(svc.price)} · with ${master}\nRudaki Ave 72, Dushanbe\n\nBook in two taps: ${business.bookingLink}`
  return [
    {
      type: 'text',
      text: short ? <>A shorter version, good for a story or a reply:</> : <>Here’s a post. It uses your real price and the booking link, so people can book straight from it.</>,
    },
    { type: 'post', text },
    {
      type: 'actions',
      actions: [
        {
          label: 'Copy post',
          icon: I.copy,
          primary: true,
          run: () => {
            navigator.clipboard?.writeText(text).catch(() => {})
            toast.success('Post copied')
          },
        },
        { label: 'Write another version', icon: I.refresh, run: () => ctx.ask(`Write a shorter Instagram post about ${svc.name.toLowerCase()}`) },
      ],
    },
  ]
}

function today(ctx: Ctx): Block[] {
  const s = periodStats(ctx.entries, 'today')
  return [
    {
      type: 'text',
      text: (
        <>
          So far today you’ve made <M v={s.revenue} /> from <B>{s.visitsDone}</B> completed visits. With the <B>{s.remainingCount}</B> visits still booked, expect about{' '}
          <M v={s.forecast} /> by closing. Staff load is <B>{s.load}%</B>
          {s.noShows ? (
            <>
              , with <B>{plural(s.noShows, 'no-show')}</B>
            </>
          ) : null}
          .
        </>
      ),
    },
    { type: 'actions', actions: [{ label: 'Open calendar', icon: I.calendar, run: () => ctx.navigate('/calendar') }] },
  ]
}

function topClients(ctx: Ctx): Block[] {
  const top = ctx.clients.filter((c) => !c.archived).sort((a, b) => b.totalSpent - a.totalSpent).slice(0, 10)
  const total = top.reduce((m, c) => m + c.totalSpent, 0)
  return [
    {
      type: 'text',
      text: (
        <>
          Your top 10 clients have spent <M v={total} /> in total. <B>{top.filter((c) => c.category === 'vip').length}</B> of them are already VIP.
        </>
      ),
    },
    {
      type: 'table',
      columns: [{ label: 'Client' }, { label: 'Visits', align: 'right' }, { label: 'Last visit', align: 'right' }, { label: 'Spent', align: 'right' }],
      rows: top.map((c) => [
        <button key={c.id} type="button" onClick={() => ctx.openClient(c.id)} className="text-left hover:underline underline-offset-4">
          {c.name}
        </button>,
        c.visits,
        c.lastVisit ? formatDate(c.lastVisit) : '—',
        <Money key="m" value={c.totalSpent} />,
      ]),
    },
  ]
}

function popularServices(q: string, ctx: Ctx): Block[] {
  const saturday = /saturday/i.test(q)
  const list = completedBetween(ctx.entries, -59, 0).filter((a) => !saturday || a.start.getDay() === 6)
  const map = new Map<string, { n: number; r: number }>()
  for (const a of list)
    for (const id of a.serviceIds) {
      const v = map.get(id) ?? { n: 0, r: 0 }
      v.n++
      v.r += serviceById[id].price
      map.set(id, v)
    }
  const rows = [...map.entries()].sort((a, b) => b[1].r - a[1].r).slice(0, 6)
  const [first] = rows
  return [
    {
      type: 'text',
      text: first ? (
        <>
          {saturday ? 'On Saturdays over the last 2 months' : 'Over the last 2 months'}, <B>{serviceById[first[0]].name}</B> brought in the most: <M v={first[1].r} /> from{' '}
          {plural(first[1].n, 'visit')}.
        </>
      ) : (
        <>No completed visits in that period yet.</>
      ),
    },
    {
      type: 'bars',
      caption: 'Revenue by service',
      bars: rows.map(([id, v]) => ({ label: serviceById[id].name.split(' ')[0], value: v.r })),
      format: (b) => formatMoney(b.value),
    },
  ]
}

/** Keyword routing for free text. Order matters: the most specific intents first. */
export function answer(question: string, ctx: Ctx): Block[] {
  const q = question.toLowerCase()
  if (/post|instagram|caption|write/.test(q)) return post(question, ctx)
  if (/shampoo|stock|left in|inventory|product|run out/.test(q)) return shampoo(ctx)
  if (/60|hasn|haven|lost|come back|returned|visited/.test(q)) return lost(ctx)
  if (/free|idle|empty slot|gap|load|who.*busy/.test(q)) return freeTime(ctx)
  if (/why|change|drop|fell|grew|reason/.test(q)) return whyRevenue(ctx)
  if (/week|compare/.test(q)) return compareWeek(ctx)
  if (/top|best client|vip|loyal|spend the most/.test(q)) return topClients(ctx)
  if (/service|sell|popular|saturday/.test(q)) return popularServices(question, ctx)
  if (/today|revenue|earn|money|made|forecast/.test(q)) return today(ctx)
  return [
    {
      type: 'text',
      text: <>I can answer questions about revenue, visits, clients, staff load and stock, using the numbers from your register and calendar. Try one of these:</>,
    },
    { type: 'suggestions' },
  ]
}

/** Past questions shown in the sidebar on first load. */
export const HISTORY = [
  { title: 'Which services sell best on Saturdays?', group: 'Today' },
  { title: 'Who hasn’t visited in 60 days?', group: 'Today' },
  { title: 'Who are my top 10 clients?', group: 'This week' },
  { title: 'Write a post about our chemical peel', group: 'This week' },
  { title: 'How did this week compare to last week?', group: 'This week' },
]
