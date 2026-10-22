import { SectionCard } from '@/components/ui/disclosure'
import { StatStrip } from '@/components/ui/stat-card'
import type { IconSvgElement } from '@hugeicons/react'
import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { toast } from 'sonner'
import { LineChart } from '@/components/charts/line-chart'
import { I, Icon } from '@/components/icons'
import { Avatar } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Delta, EmptyState, Figure, Meter, Money, pctChange } from '@/components/ui/misc'
import { Switch } from '@/components/ui/controls'
import { Popover } from '@/components/ui/popover'
import { Page } from '@/components/ui/page'
import { Segmented } from '@/components/ui/tabs'
import { STATUS_META, isVisit, serviceNames, type Appointment } from '@/data/appointments'
import { business, currentUser } from '@/data/business'
import { PERIOD_DAYS, dailySeries, periodStats, todaySeries, type Period } from '@/data/metrics'
import { serviceById } from '@/data/services'
import { staffById } from '@/data/staff'
import { cn } from '@/lib/cn'
import { CURRENCY, dayShort, formatDate, formatDateLong, formatMoney, formatTime, plural } from '@/lib/format'
import { useOverlays } from '@/lib/overlays'
import { useData, usePrefs } from '@/lib/store'
import { useWorkspace } from '@/lib/workspace'
import { NOW, TODAY, addDays, isSameDay } from '@/lib/time'
import { drawerSummary, useRegister } from '../register/store'
import { SetupCard } from './setup-card'

const PERIOD_LABEL: Record<Period, string> = { today: 'Today so far', week: 'Last 7 days', month: 'Last 30 days' }
const COMPARE_LABEL: Record<Period, string> = { today: 'vs yesterday at this time', week: 'vs previous 7 days', month: 'vs previous 30 days' }

function greeting() {
  const h = NOW.getHours()
  return h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening'
}

function RevenueCard({ period, onPeriod }: { period: Period; onPeriod: (p: Period) => void }) {
  const entries = useData((s) => s.entries)
  const stats = useMemo(() => periodStats(entries, period), [entries, period])
  const series = useMemo(
    () => (period === 'today' ? todaySeries(entries) : dailySeries(entries, PERIOD_DAYS[period])),
    [entries, period],
  )
  const [scrub, setScrub] = useState<number | null>(null)
  const point = scrub != null ? series[scrub] : null
  const shift = useRegister((s) => s.shift)
  const receipts = useRegister((s) => s.receipts)
  const expenses = useRegister((s) => s.expenses)
  const drawer = useMemo(() => drawerSummary(receipts, expenses, shift), [receipts, expenses, shift])

  const ticks = useMemo(() => {
    if (period === 'today') {
      return ['09:00', '12:00', '15:00', '18:00', '21:00']
        .map((l) => ({ index: series.findIndex((p) => p.label === l), label: l }))
        .filter((t) => t.index >= 0)
    }
    if (period === 'week') return series.map((p, i) => ({ index: i, label: i === series.length - 1 ? 'Today' : dayShort(p.date.getDay()) }))
    return [0, 7, 14, 21, 29].map((i) => ({ index: i, label: i === 29 ? 'Today' : formatDate(series[i].date) }))
  }, [series, period])

  let caption = PERIOD_LABEL[period]
  if (point) {
    if (period === 'today') caption = point.projected ? `Expected by ${point.label}` : point.label === 'Now' ? 'Now' : `By ${point.label}`
    else caption = isSameDay(point.date, NOW) ? 'Today so far' : formatDate(point.date, { weekday: true })
  }
  const change = pctChange(stats.revenue, stats.revenuePrev)

  return (
    <Card className="flex flex-col p-6">
      <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-base text-muted">
            Revenue
            <span className="text-faint">·</span>
            <span className="tabular">{caption}</span>
          </div>
          <div className="mt-2 flex items-baseline gap-2.5">
            <Figure value={point ? point.value : stats.revenue} money className="text-4xl font-normal text-fg sm:text-5xl" />
            <span className="text-base text-faint">{CURRENCY}</span>
          </div>
          <div className="mt-2 h-5">
            {point ? (
              point.projected ? (
                <span className="text-sm text-muted">Based on visits booked for the rest of the day</span>
              ) : period !== 'today' ? (
                <span className="text-sm text-muted">
                  of <Money value={stats.revenue} /> in this period
                </span>
              ) : null
            ) : (
              <span className="flex items-center gap-2">
                <Delta value={change} />
                <span className="text-sm text-muted">{COMPARE_LABEL[period]}</span>
              </span>
            )}
          </div>
        </div>
        {/* The period sits on the card it changes, not above the whole page. */}
        <Segmented size="sm" value={period} onChange={onPeriod} items={[
          { value: 'today', label: 'Today' }, { value: 'week', label: '7 days' }, { value: 'month', label: '30 days' },
        ]} />
      </div>

      <LineChart
        className="mt-6"
        points={series}
        height={140}
        area
        zero={period === 'today'}
        onScrub={setScrub}
        ticks={ticks}
        dataKey={period}
      />

      {period === 'today' && <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-sm">
        <span className="text-muted">Expected by close</span><Money value={stats.forecast} className="text-fg" />
      </div>}
      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4 text-sm">
        {shift.open ? (
          <span className="flex items-center gap-2 text-muted">
            <span className="size-2 rounded-full bg-positive" />
            Shift open since {shift.openedAt} · <Money value={drawer.expected} className="text-fg" /> in the cash drawer
          </span>
        ) : (
          <span className="flex items-center gap-2 text-muted">
            <span className="size-2 rounded-full bg-faint" />
            Shift closed
          </span>
        )}
        <Link to="/pos/shift" className="font-medium text-fg hover:underline underline-offset-4">
          Register
        </Link>
      </div>
    </Card>
  )
}

function UpNext() {
  const entries = useData((s) => s.entries)
  const clients = useData((s) => s.clients)
  const openVisit = useOverlays((s) => s.openVisit)
  const today = entries.filter((e): e is Appointment => isVisit(e) && isSameDay(e.start, NOW))
  // The front desk cares about who walks in next; visits already in the chair are summarized below.
  const upcoming = today
    .filter((a) => a.status === 'arrived' || a.status === 'booked' || a.status === 'confirmed')
    .sort((a, b) => (a.status === 'arrived' ? -1 : 0) - (b.status === 'arrived' ? -1 : 0) || +a.start - +b.start)
  const inChair = today.filter((a) => a.status === 'in_progress').length
  const shown = upcoming.slice(0, 4)
  const rest = upcoming.length - shown.length

  return (
    <SectionCard
      id="home:upnext"
      title="Coming up today"
      count={upcoming.length}
      action={
        <Link to="/calendar" className="rounded-full px-2 py-1 text-sm font-medium text-muted hover:text-fg">
          Calendar
        </Link>
      }
      fill
    >
      <ul className="flex-1 px-2 pb-2">
        {shown.map((a) => {
          const c = clients.find((x) => x.id === a.clientId)
          const s = staffById[a.staffId]
          const meta = STATUS_META[a.status]
          const live = a.status === 'arrived'
          return (
            <li key={a.id}>
              <button
                type="button"
                onClick={() => openVisit(a.id)}
                className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left hover:bg-fill"
              >
                <span className={cn('w-11 shrink-0 text-sm tabular', live ? 'font-medium text-fg' : 'text-muted')}>{formatTime(a.start)}</span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-base text-fg">{c?.name}</span>
                  <span className="block truncate text-sm text-muted">
                    {serviceNames(a)} · {s.name.split(' ')[0]}
                  </span>
                </span>
                {live ? <Badge tone={meta.tone}>{meta.label}</Badge> : <Avatar name={s.name} color={s.color} size="sm" />}
              </button>
            </li>
          )
        })}
      </ul>
      <Link to="/calendar" className="flex items-center gap-2 border-t border-border px-5 py-3 text-sm text-muted hover:text-fg">
        <span className="size-1.5 rounded-full bg-accent" />
        {inChair} in progress now
        {rest > 0 && <span className="text-faint">· {plural(rest, 'more visit')} later</span>}
      </Link>
    </SectionCard>
  )
}

type Attention = { id: string; icon: IconSvgElement; tone: string; text: React.ReactNode; action: string; run: () => void }

function NeedsAttention() {
  const navigate = useNavigate()
  const clients = useData((s) => s.clients)
  const entries = useData((s) => s.entries)
  const [done, setDone] = useState<string[]>([])
  const [expanded, setExpanded] = useState(false)
  const debtors = clients.filter((c) => c.debt > 0)
  const debt = debtors.reduce((m, c) => m + c.debt, 0)
  const tomorrow = addDays(NOW, 1)
  const unconfirmed = entries.filter((e) => isVisit(e) && isSameDay(e.start, tomorrow) && e.status === 'booked').length
  // Same definition as the assistant: used to come often (8+ visits), now gone 60+ days.
  const lostRegulars = clients.filter((c) => !c.archived && c.category === 'lost' && c.visits >= 8).length

  const items: Attention[] = [
    {
      id: 'confirm',
      icon: I.calendar,
      tone: 'bg-accent-soft text-accent-fg',
      text: <>{plural(unconfirmed, 'visit')} tomorrow not confirmed yet</>,
      action: 'Ask to confirm',
      run: () => {
        setDone((d) => [...d, 'confirm'])
        toast.success(`Confirmation requests sent to ${unconfirmed} clients`, { description: 'Telegram first, SMS for clients without it.' })
      },
    },
    {
      id: 'debt',
      icon: I.wallet,
      tone: 'bg-negative-soft text-negative',
      text: (
        <>
          {plural(debtors.length, 'client')} owe <Money value={debt} />
        </>
      ),
      action: 'Review',
      run: () => navigate('/pos/debts'),
    },
    {
      id: 'review',
      icon: I.star,
      tone: 'bg-warning-soft text-warning',
      text: <>A 2★ review on 2GIS has no reply</>,
      action: 'Reply',
      run: () => navigate('/channels/reviews'),
    },
    {
      id: 'stock',
      icon: I.inventory,
      tone: 'bg-warning-soft text-warning',
      text: <>Gel polish base is below minimum: 3 of 5 left</>,
      action: 'Order',
      run: () => navigate('/inventory/orders'),
    },
    {
      id: 'lost',
      icon: I.users,
      tone: 'bg-fill text-muted',
      text: <>{plural(lostRegulars, 'regular client')} haven’t been back in 60 days</>,
      action: 'Win back',
      run: () => navigate('/campaigns/new?segment=lost60'),
    },
  ]
  const open = items.filter((i) => !done.includes(i.id))

  return (
    <SectionCard id="home:attention" title="Needs attention" count={open.length}>
      {open.length ? (
        <ul className="px-2 pb-2">
          {(expanded ? open : open.slice(0, 3)).map((it) => (
            <li key={it.id} className="flex items-center gap-3 rounded-xl px-3 py-2.5">
              <span className={cn('grid size-8 shrink-0 place-items-center rounded-full', it.tone)}>
                <Icon icon={it.icon} size={16} />
              </span>
              <span className="min-w-0 flex-1 text-base text-fg">{it.text}</span>
              <Button size="sm" variant="secondary" onClick={it.run}>
                {it.action}
              </Button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="px-5 pb-6 text-base text-muted">Nothing unusual. Everything is on track.</p>
      )}
      {open.length > 3 && <div className="px-3 pb-3"><Button size="sm" variant="ghost" onClick={() => setExpanded(!expanded)} aria-expanded={expanded}>
        {expanded ? 'Show less' : `Show ${open.length - 3} more`}<Icon icon={I.chevronDown} size={14} className={cn('transition-transform duration-150 ease-[var(--ease-out)] motion-reduce:transition-none', expanded && 'rotate-180')} />
      </Button></div>}
    </SectionCard>
  )
}

function TopList({ period }: { period: Period }) {
  const entries = useData((s) => s.entries)
  const stats = useMemo(() => periodStats(entries, period), [entries, period])
  const [view, setView] = useState<'services' | 'staff'>('services')
  const rows =
    view === 'services'
      ? stats.topServices.map((s) => ({ id: s.id, name: serviceById[s.id].name, sub: plural(s.count, 'visit'), revenue: s.revenue, color: serviceById[s.id].color }))
      : stats.topStaff.map((s) => ({ id: s.id, name: staffById[s.id].name, sub: plural(s.count, 'visit'), revenue: s.revenue, color: staffById[s.id].color }))
  const max = Math.max(...rows.map((r) => r.revenue), 1)

  return (
    <div className="border-t border-border">
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 pt-4 pb-1">
        <h3 className="text-sm font-medium text-muted">Top performers</h3>
        <Segmented
          size="sm"
          value={view}
          onChange={setView}
          items={[
            { value: 'services', label: 'Services' },
            { value: 'staff', label: 'Staff' },
          ]}
        />
      </div>
      <ul className="px-5 pt-1 pb-4">
        {rows.map((r) => (
          <li key={r.id} className="py-2.5">
            <div className="flex items-center gap-3">
              {view === 'staff' ? (
                <Avatar name={r.name} color={r.color} size="sm" />
              ) : (
                <span className="size-2 rounded-full" style={{ background: `var(--c-${r.color})` }} />
              )}
              <span className="min-w-0 flex-1 truncate text-base text-fg">{r.name}</span>
              <span className="text-sm text-faint">{r.sub}</span>
              <Money value={r.revenue} className="w-28 text-right text-base" />
            </div>
            <Meter value={r.revenue} max={max} className="mt-2 h-1" />
          </li>
        ))}
        {!rows.length && <li className="py-6 text-center text-muted">No completed visits yet.</li>}
      </ul>
    </div>
  )
}

const SECTIONS = [
  { id: 'revenue', label: 'Revenue' },
  { id: 'upnext', label: 'Coming up today' },
  { id: 'attention', label: 'Needs attention' },
  { id: 'performance', label: 'Business performance' },
] as const
type SectionId = (typeof SECTIONS)[number]['id']

/** Mercury's "Customize": everyone keeps the parts of Home they use and hides the rest. */
function useHomeSections() {
  const sections = useWorkspace((s) => s.sections)
  const setSection = useWorkspace((s) => s.setSection)
  const shown = (id: SectionId) => sections[`home:show:${id}`] ?? true
  return { shown, set: (id: SectionId, value: boolean) => setSection(`home:show:${id}`, value) }
}

function Customize() {
  const { shown, set } = useHomeSections()
  return (
    <Popover
      align="end"
      className="w-72 p-4"
      trigger={
        <Button size="sm" variant="ghost" icon={I.sliders}>
          Customize
        </Button>
      }
    >
      <p className="text-sm font-medium text-fg">Show on Home</p>
      <p className="mt-0.5 mb-3 text-xs text-muted">Hidden parts stay one click away in this menu.</p>
      <div className="flex flex-col gap-3">
        {SECTIONS.map((section) => (
          <Switch key={section.id} checked={shown(section.id)} onChange={(v) => set(section.id, v)} label={section.label} />
        ))}
      </div>
    </Popover>
  )
}

function Performance({ period }: { period: Period }) {
  const entries = useData((s) => s.entries)
  const clients = useData((s) => s.clients)
  const stats = useMemo(() => periodStats(entries, period), [entries, period])
  const newList = clients.filter((c) => c.createdAt >= addDays(TODAY, -(PERIOD_DAYS[period] - 1)))
  const bySource = new Map<string, number>()
  for (const c of newList) bySource.set(c.source, (bySource.get(c.source) ?? 0) + 1)
  const newSources = [...bySource.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 2)
    .map(([src, n]) => `${n} from ${src}`)
    .join(', ')
  return (
    <SectionCard id="home:performance" title="Business performance" count={PERIOD_LABEL[period]} defaultOpen={false}>
      <div className="px-5 pt-1 pb-5">
        <StatStrip
          items={[
            {
              label: 'Visits',
              value: <>{stats.visitsDone}{period === 'today' && <span className="text-sm font-normal text-faint"> of {stats.visitsBooked}</span>}</>,
              sub: period === 'today' ? `${stats.noShows} no-show${stats.noShows === 1 ? '' : 's'} so far` : <Delta value={pctChange(stats.visitsDone, stats.visitsDonePrev)} />,
              to: '/calendar',
            },
            { label: 'Average receipt', value: <Money value={stats.avgReceipt} />, sub: <Delta value={pctChange(stats.avgReceipt, stats.avgReceiptPrev)} />, to: '/reports/revenue' },
            { label: 'New clients', value: newList.length, sub: newSources || 'No new clients yet', to: '/clients' },
            { label: 'Staff load', value: `${stats.load}%`, sub: stats.load > 85 ? 'Close to full' : 'Booked vs working hours', to: '/reports/load' },
          ]}
        />
      </div>
      <TopList period={period} />
    </SectionCard>
  )
}

export default function Home() {
  const [period, setPeriod] = useState<Period>('today')
  const entries = useData((s) => s.entries)
  const onboarding = usePrefs((s) => s.onboarding)
  const branchId = usePrefs((s) => s.branchId)
  const { openNewVisit, openNewClient, openNewTask } = useOverlays()
  const navigate = useNavigate()
  const { shown } = useHomeSections()
  const stats = useMemo(() => periodStats(entries, period), [entries, period])
  const branch = branchId === 'all' ? 'All branches' : business.branches.find((b) => b.id === branchId)?.name
  const top = [shown('revenue'), shown('upnext')]
  const nothing = SECTIONS.every((section) => !shown(section.id))

  return (
    <Page>
      {onboarding && <SetupCard />}

      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-[-0.02em] text-fg">
            {greeting()}, {currentUser.firstName}
          </h1>
          <p className="mt-1 text-sm text-muted">
            {formatDateLong(NOW)} · {branch}
          </p>
        </div>
        <Customize />
      </div>

      {/* Revolut's action pills: the four things the front desk starts most often. */}
      <div className="mb-6 flex flex-wrap gap-2">
        <Button variant="primary" icon={I.calendarAdd} onClick={() => openNewVisit()}>New visit</Button>
        <Button variant="soft" icon={I.register} onClick={() => navigate('/pos')}>New sale</Button>
        <Button variant="soft" icon={I.userAdd} onClick={() => openNewClient()}>New client</Button>
        <Button variant="soft" icon={I.tasks} onClick={() => openNewTask()}>New task</Button>
      </div>

      {(top[0] || top[1]) && (
        <div className={cn('grid items-stretch gap-4', top[0] && top[1] && 'lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]')}>
          {top[0] && <RevenueCard period={period} onPeriod={setPeriod} />}
          {top[1] && <UpNext />}
        </div>
      )}

      {shown('attention') && <div className="mt-4"><NeedsAttention /></div>}
      {shown('performance') && <div className="mt-4"><Performance period={period} /></div>}

      {nothing && (
        <EmptyState icon={I.home} title="Home is empty" description="You’ve hidden every part of Home. Turn some back on in Customize." />
      )}

      <p className="mt-8 text-center text-xs text-faint">
        Sublease tenants’ visits aren’t counted in salon revenue. Amounts in {CURRENCY}, updated {formatTime(NOW)}.{' '}
        <span className="sr-only">{formatMoney(stats.revenue)}</span>
      </p>
    </Page>
  )
}
