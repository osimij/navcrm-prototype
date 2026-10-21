import { StatCard } from '@/components/ui/stat-card'
import { useMemo, useState, type ReactNode } from 'react'
import { Link } from 'react-router'
import { toast } from 'sonner'
import { Sparkline } from '@/components/charts/bar-chart'
import { I, Icon } from '@/components/icons'
import { Card, CardHeader, SectionTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/controls'
import { Delta, Meter, Money, pctChange } from '@/components/ui/misc'
import { Page, PageHeader } from '@/components/ui/page'
import { isVisit } from '@/data/appointments'
import { business } from '@/data/business'
import { bookableStaff } from '@/data/staff'
import { dailySeries, periodStats } from '@/data/metrics'
import { cn } from '@/lib/cn'
import { formatNumber, plural } from '@/lib/format'
import { useData } from '@/lib/store'
import { TODAY, addDays, isSameDay } from '@/lib/time'
import { CAMPAIGNS, ONLINE, PRODUCTS } from './compact'
import { debtSince, paidVisits, payrollRows, pl, rangeFor, revenueTotal, visitsIn } from './data'

function ReportCard({
  to,
  title,
  value,
  caption,
  spark,
}: {
  to: string
  title: string
  value: ReactNode
  caption?: ReactNode
  spark?: number[]
}) {
  return (
    <StatCard label={title} value={value} sub={caption} to={to} valueClassName="text-2xl" aside={spark && spark.length > 1 ? <Sparkline values={spark} className="mb-1 shrink-0 text-faint group-hover:text-muted" /> : undefined} />
  )
}

function TelegramDigest({ today, debt, debtors }: { today: number; debt: number; debtors: number }) {
  const [on, setOn] = useState(true)
  return (
    <Card className="flex flex-col">
      <CardHeader
        title="Daily summary in Telegram"
        description="The few things worth knowing, every evening"
        action={
          <Switch
            aria-label="Daily summary in Telegram"
            checked={on}
            onChange={(v) => {
              setOn(v)
              toast.success(v ? 'Daily summary is on' : 'Daily summary is off', { description: v ? 'Every day at 21:00 in your Telegram.' : undefined })
            }}
          />
        }
      />
      <div className={cn('px-5 pb-5 transition-opacity duration-200', !on && 'opacity-45')}>
        <div className="max-w-md rounded-2xl rounded-bl-md bg-fill px-4 py-3">
          <div className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-accent-fg">
            <Icon icon={I.telegram} size={14} />
            NavCRM
          </div>
          <ul className="flex flex-col gap-1.5 text-sm text-fg">
            <li>
              Today you’re on track for <Money value={today} />, about 12% above a usual weekday.
            </li>
            <li>Madina is 95% booked tomorrow; Shahlo still has 4 free hours.</li>
            <li>
              {plural(debtors, 'client')} owe <Money value={debt} />. Reminders went out at 18:00.
            </li>
          </ul>
          <div className="mt-1 text-right text-xs text-faint">21:00</div>
        </div>
      </div>
    </Card>
  )
}

export default function ReportsHub() {
  const entries = useData((s) => s.entries)
  const clients = useData((s) => s.clients)

  const d = useMemo(() => {
    const month = periodStats(entries, 'month')
    const last30 = rangeFor('last-30')
    const thisMonth = rangeFor('this-month')
    const all = { staffId: 'all', segment: 'all' as const }

    const profit = pl(entries, thisMonth)
    const debtors = clients.filter((c) => c.debt > 0 && !c.archived)
    const overdue = debtors.filter((c) => (+TODAY - +debtSince(c.id)) / 86_400_000 > 7).length

    const paid = paidVisits(entries, { range: last30, ...all })
    const unique = new Set(paid.map((a) => a.clientId)).size

    const days = Array.from({ length: 30 }, (_, i) => addDays(TODAY, i - 29))
    // Daily load: booked minutes over the working minutes of masters who worked that day.
    const loadPerDay = days.map((day) => {
      const list = entries.filter((e) => isSameDay(e.start, day))
      let booked = 0
      let avail = 0
      for (const s of bookableStaff) {
        const mine = list.filter((e) => e.staffId === s.id)
        if (!mine.length || !s.today) continue
        const [sh, sm] = s.today.start.split(':').map(Number)
        const [eh, em] = s.today.end.split(':').map(Number)
        avail += eh * 60 + em - (sh * 60 + sm)
        booked += mine.filter((e) => isVisit(e) && e.status !== 'cancelled').reduce((m, e) => m + (+e.end - +e.start) / 60_000, 0)
      }
      return avail ? booked / avail : 0
    })
    const bookings = visitsIn(entries, last30).filter((a) => a.status !== 'cancelled')
    const online = bookings.filter((a) => ONLINE.includes(a.source))
    const onlinePerDay = days.map((day) => online.filter((a) => isSameDay(a.start, day)).length)

    const accrued = payrollRows(entries, thisMonth).reduce((m, r) => m + r.total, 0)

    const low = PRODUCTS.filter((p) => p.qty < p.min)
    const returns = CAMPAIGNS.reduce((m, c) => m + Math.round(c.sent * c.returned) * c.avg, 0)

    const rudaki = revenueTotal(entries, { range: last30, ...all })

    return {
      month,
      revenueSpark: dailySeries(entries, 30).map((p) => p.value),
      profit,
      debt: debtors.reduce((m, c) => m + c.debt, 0),
      debtors: debtors.length,
      overdue,
      unique,
      base: clients.filter((c) => !c.archived).length,
      loadPerDay,
      onlineShare: bookings.length ? Math.round((online.length / bookings.length) * 100) : 0,
      onlinePerDay,
      accrued,
      low,
      returns,
      branches: [
        { ...business.branches[0], revenue: rudaki },
        { ...business.branches[1], revenue: Math.round(rudaki * 0.47) },
      ],
    }
  }, [entries, clients])

  const margin = d.profit.revenue ? Math.round((d.profit.profit / d.profit.revenue) * 100) : 0
  const maxBranch = Math.max(...d.branches.map((b) => b.revenue), 1)

  return (
    <Page>
      <PageHeader title="Reports" subtitle="From the register and the calendar, updated within a minute" />

      <div className="mb-10 grid gap-5 lg:grid-cols-2">
        <TelegramDigest today={d.month.forecast} debt={d.debt} debtors={d.debtors} />
        <Link to="builder" className="press group flex flex-col rounded-2xl bg-surface p-5 ring-1 ring-border hover:bg-fill/50">
          <div className="flex items-start justify-between gap-4">
            <span className="grid size-10 place-items-center rounded-xl bg-accent-soft text-accent-fg">
              <Icon icon={I.chart} size={20} />
            </span>
            <Icon icon={I.arrowUpRight} size={16} className="text-faint transition-colors group-hover:text-fg" />
          </div>
          <h3 className="mt-4 text-base font-medium text-fg">Report builder</h3>
          <p className="mt-1 max-w-sm text-base text-muted">
            When the ready-made reports don’t answer it: pick a data source, group it by up to three fields, save it for next time.
          </p>
          <div className="mt-auto flex flex-wrap gap-1.5 pt-5">
            {['Revenue by master', 'Bookings by source', 'Payment methods by week'].map((s) => (
              <Badge key={s}>
                {s}
              </Badge>
            ))}
          </div>
        </Link>
      </div>

      <SectionTitle>Money</SectionTitle>
      <div className="mb-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <ReportCard
          to="revenue"
          title="Revenue"
          value={<Money value={d.month.revenue} />}
          caption={
            <span className="flex items-center gap-2">
              <Delta value={pctChange(d.month.revenue, d.month.revenuePrev)} /> last 30 days
            </span>
          }
          spark={d.revenueSpark}
        />
        <ReportCard to="cash" title="Cash & profit" value={<Money value={d.profit.profit} />} caption={`Profit this month · ${margin}% margin`} />
        <ReportCard
          to="debtors"
          title="Receivables"
          value={<Money value={d.debt} />}
          caption={`${plural(d.debtors, 'client')} owe${d.debtors === 1 ? 's' : ''}${d.overdue ? `, ${d.overdue} overdue` : ''}`}
        />
      </div>

      <SectionTitle>Clients & bookings</SectionTitle>
      <div className="mb-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <ReportCard
          to="clients"
          title="Clients & retention"
          value={`${formatNumber(d.unique)} clients`}
          caption={`Served in 30 days, of ${formatNumber(d.base)} in your base`}
        />
        <ReportCard to="load" title="Staff load" value={`${d.month.load}%`} caption="Booked time vs working hours" spark={d.loadPerDay} />
        <ReportCard to="online" title="Online booking" value={`${d.onlineShare}%`} caption="Of bookings made by clients themselves" spark={d.onlinePerDay} />
      </div>

      <SectionTitle>Team, stock & marketing</SectionTitle>
      <div className="mb-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <ReportCard to="payroll" title="Payroll" value={<Money value={d.accrued} />} caption="Accrued this month, preliminary" />
        <ReportCard
          to="stock"
          title="Inventory"
          value={d.low.length ? `${d.low.length} below minimum` : 'All stocked'}
          caption={d.low.length ? `${d.low[0].name} runs out first` : 'Nothing to reorder'}
        />
        <ReportCard to="marketing" title="Marketing" value={<Money value={d.returns} />} caption="From clients who came back after a campaign" />
      </div>

      <SectionTitle>Branches</SectionTitle>
      <Link to="network" className="press group block rounded-2xl bg-surface p-5 ring-1 ring-border hover:bg-fill/50">
        <div className="mb-4 flex items-center justify-between">
          <span className="text-base text-muted">Revenue by branch, last 30 days</span>
          <Icon icon={I.arrowUpRight} size={16} className="text-faint transition-colors group-hover:text-fg" />
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          {d.branches.map((b) => (
            <div key={b.id}>
              <div className="flex items-baseline justify-between gap-3">
                <span className="text-base text-fg">{b.name}</span>
                <Money value={b.revenue} className="text-lg" />
              </div>
              <Meter value={b.revenue} max={maxBranch} className="mt-2" />
              <div className="mt-1.5 text-sm text-muted">{b.address}</div>
            </div>
          ))}
        </div>
      </Link>
    </Page>
  )
}
