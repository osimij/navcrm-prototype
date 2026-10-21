import { useMemo } from 'react'
import { Avatar } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Card, CardHeader } from '@/components/ui/card'
import { Delta, Meter, Money, pctChange } from '@/components/ui/misc'
import { Table, TD, TH, THead, TR } from '@/components/ui/table'
import { SOURCE_LABEL, type BookingSource } from '@/data/appointments'
import { business } from '@/data/business'
import { staffById } from '@/data/staff'
import { formatNumber, plural } from '@/lib/format'
import { useData } from '@/lib/store'
import { SALARIES, paidVisits, payrollRows, previous, rangeDays, revenueTotal, visitsIn, type Filters } from './data'
import { FilterBar, Kpi, KpiRow, ReportLayout, useReportFilters } from './layout'

function ShareCell({ value, max, total }: { value: number; max: number; total: number }) {
  return (
    <div className="flex items-center gap-3">
      <Meter value={value} max={max || 1} className="flex-1" />
      <span className="w-9 text-right text-sm text-muted tabular">{total ? Math.round((value / total) * 100) : 0}%</span>
    </div>
  )
}

/* ─────────────── Online booking ─────────────── */

export const ONLINE: BookingSource[] = ['online', 'instagram', 'telegram', 'assistant']

export function OnlineReport() {
  const f = useReportFilters('last-30')
  const entries = useData((s) => s.entries)
  const data = useMemo(() => {
    const calc = (fx: Filters) => {
      const all = visitsIn(entries, fx.range).filter((a) => fx.staffId === 'all' || a.staffId === fx.staffId)
      const online = all.filter((a) => ONLINE.includes(a.source))
      return { all, online }
    }
    const now = calc(f.filters)
    const prev = calc({ ...f.filters, range: previous(f.range) })
    const lost = now.online.filter((a) => a.status === 'cancelled' || a.status === 'no_show').length
    // Booking-page views come from link tracking; about 1 in 13 views books.
    const views = Math.round(now.online.filter((a) => a.source === 'online' || a.source === 'instagram').length * 12.8)
    const sources = (Object.keys(SOURCE_LABEL) as BookingSource[])
      .map((s) => {
        const list = now.all.filter((a) => a.source === s)
        return {
          s,
          count: list.length,
          noShow: list.filter((a) => a.status === 'no_show' || a.status === 'cancelled').length,
          revenue: list.filter((a) => a.paid).reduce((m, a) => m + a.price, 0),
        }
      })
      .sort((a, b) => b.count - a.count)
    return { now, prev, lost, views, sources }
  }, [entries, f.filters, f.range])

  const share = data.now.all.length ? Math.round((data.now.online.length / data.now.all.length) * 100) : 0
  const prevShare = data.prev.all.length ? (data.prev.online.length / data.prev.all.length) * 100 : 0
  const max = Math.max(...data.sources.map((s) => s.count), 1)

  return (
    <ReportLayout title="Online booking" subtitle="Bookings clients made themselves: booking page, Instagram, Telegram bot and the AI assistant" question="Which channel brings the most online bookings?">
      <FilterBar f={f} segment={false} />
      <KpiRow>
        <Kpi label="Booked online" value={data.now.online.length} sub={<Delta value={pctChange(data.now.online.length, data.prev.online.length)} />} />
        <Kpi label="Share of all bookings" value={share} suffix="%" sub={<Delta value={share - prevShare} suffix=" pts" />} />
        <Kpi label="Booking page conversion" value={data.views ? (data.now.online.length / data.views) * 100 : 0} decimals={1} suffix="%" sub={`${formatNumber(data.views)} page views`} />
        <Kpi label="Cancelled or no-show" value={data.now.online.length ? Math.round((data.lost / data.now.online.length) * 100) : 0} suffix="%" sub={`${formatNumber(data.lost)} of ${plural(data.now.online.length, 'online booking')}`} />
      </KpiRow>
      <Card>
        <CardHeader title="By source" description="All bookings, so you can compare online with phone and walk-ins" />
        <Table>
          <THead>
            <TH>Source</TH>
            <TH align="right">Bookings</TH>
            <TH className="w-[28%]">Share</TH>
            <TH align="right">Cancelled or no-show</TH>
            <TH align="right">Paid</TH>
          </THead>
          <tbody>
            {data.sources.map((s) => (
              <TR key={s.s}>
                <TD>
                  <span className="flex items-center gap-2">
                    {SOURCE_LABEL[s.s]}
                    {ONLINE.includes(s.s) && <Badge tone="accent">Online</Badge>}
                  </span>
                </TD>
                <TD align="right">{s.count}</TD>
                <TD>
                  <ShareCell value={s.count} max={max} total={data.now.all.length} />
                </TD>
                <TD align="right" muted>
                  {s.noShow}
                </TD>
                <TD align="right">
                  <Money value={s.revenue} />
                </TD>
              </TR>
            ))}
          </tbody>
        </Table>
      </Card>
    </ReportLayout>
  )
}

/* ─────────────── Payroll ─────────────── */

export function PayrollReport() {
  const f = useReportFilters('this-month')
  const entries = useData((s) => s.entries)
  const data = useMemo(() => {
    const rows = payrollRows(entries, f.range)
    const accrued = rows.reduce((m, r) => m + r.total, 0)
    const paid = Math.round(accrued * 0.42)
    const revenue = revenueTotal(entries, { ...f.filters, staffId: 'all', segment: 'all' })
    return { rows, accrued, paid, revenue }
  }, [entries, f.filters, f.range])

  return (
    <ReportLayout title="Payroll" subtitle="Preliminary accruals from receipts and schemes. Final numbers come from approved periods." question="How much will I pay in salaries this month?">
      <FilterBar f={f} staff={false} segment={false} />
      <KpiRow>
        <Kpi label="Accrued" value={data.accrued} money suffix="TJS" />
        <Kpi label="Paid out" value={data.paid} money suffix="TJS" sub="Advances so far" />
        <Kpi label="Left to pay" value={data.accrued - data.paid} money suffix="TJS" />
        <Kpi label="Share of revenue" value={data.revenue ? Math.round((data.accrued / data.revenue) * 100) : 0} suffix="%" sub="Payroll as a share of revenue" />
      </KpiRow>
      <Card>
        <CardHeader title="By employee" />
        <Table>
          <THead>
            <TH>Employee</TH>
            <TH>Scheme</TH>
            <TH align="right">Base</TH>
            <TH align="right">Tips</TH>
            <TH align="right">Bonuses</TH>
            <TH align="right">Fines</TH>
            <TH align="right">Total</TH>
          </THead>
          <tbody>
            {data.rows.map((r) => {
              const s = staffById[r.id]
              return (
                <TR key={r.id}>
                  <TD>
                    <span className="flex items-center gap-2.5">
                      <Avatar name={s.name} color={s.color} size="sm" />
                      {s.name}
                    </span>
                  </TD>
                  <TD muted>{r.rate ? `${Math.round(r.rate * 100)}% of services` : `Salary, ${formatNumber(SALARIES[r.id])} TJS a month`}</TD>
                  <TD align="right">
                    <Money value={r.base} />
                  </TD>
                  <TD align="right" muted>
                    {r.tips ? <Money value={r.tips} /> : '—'}
                  </TD>
                  <TD align="right" muted>
                    {r.bonus ? <Money value={r.bonus} /> : '—'}
                  </TD>
                  <TD align="right" className={r.fine ? 'text-negative' : 'text-muted'}>
                    {r.fine ? <Money value={-r.fine} /> : '—'}
                  </TD>
                  <TD align="right" className="font-medium">
                    <Money value={r.total} />
                  </TD>
                </TR>
              )
            })}
          </tbody>
        </Table>
      </Card>
    </ReportLayout>
  )
}

/* ─────────────── Inventory ─────────────── */

export const PRODUCTS = [
  { name: 'Gel polish base', category: 'Nails', unit: 'pcs', qty: 3, min: 5, cost: 85, perVisit: 0.08 },
  { name: 'Gel polish top coat', category: 'Nails', unit: 'pcs', qty: 6, min: 5, cost: 85, perVisit: 0.08 },
  { name: 'Hair color 7.1 Ash blonde', category: 'Hair', unit: 'pcs', qty: 4, min: 6, cost: 62, perVisit: 0.3 },
  { name: 'Oxidant 6%, 1 L', category: 'Hair', unit: 'pcs', qty: 5, min: 3, cost: 48, perVisit: 0.12 },
  { name: 'Professional shampoo, 1 L', category: 'Hair', unit: 'pcs', qty: 9, min: 4, cost: 140, perVisit: 0.02 },
  { name: 'Lash lift glue', category: 'Brows & lashes', unit: 'pcs', qty: 2, min: 2, cost: 120, perVisit: 0.05 },
  { name: 'Hyaluronic serum (retail)', category: 'Retail', unit: 'pcs', qty: 14, min: 6, cost: 95, perVisit: 0.03 },
  { name: 'Disposable collars', category: 'Consumables', unit: 'pack', qty: 11, min: 4, cost: 35, perVisit: 0.01 },
  { name: 'Sterile pouches', category: 'Sterile', unit: 'pack', qty: 7, min: 5, cost: 60, perVisit: 0.02 },
  { name: 'Massage oil, 500 ml', category: 'Massage', unit: 'pcs', qty: 8, min: 3, cost: 75, perVisit: 0.04 },
]

export function StockReport() {
  const f = useReportFilters('last-30')
  const entries = useData((s) => s.entries)
  const data = useMemo(() => {
    const visits = paidVisits(entries, { ...f.filters, staffId: 'all', segment: 'all' }).length
    const perDay = visits / rangeDays(f.range)
    const rows = PRODUCTS.map((p) => {
      const used = Math.max(1, Math.round(visits * p.perVisit))
      const daysLeft = Math.round(p.qty / Math.max(0.05, perDay * p.perVisit))
      return { ...p, used, value: p.qty * p.cost, daysLeft, low: p.qty < p.min }
    }).sort((a, b) => a.daysLeft - b.daysLeft)
    return {
      rows,
      value: rows.reduce((m, r) => m + r.value, 0),
      low: rows.filter((r) => r.low).length,
      usedValue: rows.reduce((m, r) => m + r.used * r.cost, 0),
      turnover: Math.round(rows.reduce((m, r) => m + r.daysLeft, 0) / rows.length),
    }
  }, [entries, f.filters, f.range])

  return (
    <ReportLayout title="Inventory" subtitle="Stock on hand, what visits used up, and how long it will last" question="What should I reorder this week?">
      <FilterBar f={f} staff={false} segment={false} />
      <KpiRow>
        <Kpi label="Stock value" value={data.value} money suffix="TJS" sub="At purchase price" />
        <Kpi label="Below minimum" value={data.low} sub={data.low ? 'Ready to reorder' : 'All above minimum'} />
        <Kpi label="Used in the period" value={data.usedValue} money suffix="TJS" sub="Tech cards and retail" />
        <Kpi label="Days of stock" value={data.turnover} suffix="days" sub="Average at the current pace" />
      </KpiRow>
      <Card>
        <CardHeader title="Running out first" />
        <Table>
          <THead>
            <TH>Product</TH>
            <TH>Category</TH>
            <TH align="right">In stock</TH>
            <TH align="right">Minimum</TH>
            <TH align="right">Used</TH>
            <TH align="right">Lasts</TH>
            <TH align="right">Value</TH>
          </THead>
          <tbody>
            {data.rows.map((r) => (
              <TR key={r.name}>
                <TD>
                  <span className="flex items-center gap-2">
                    {r.name}
                    {r.low && <Badge tone="warning">Low</Badge>}
                  </span>
                </TD>
                <TD muted>{r.category}</TD>
                <TD align="right" className={r.low ? 'text-warning' : ''}>
                  {r.qty} {r.unit}
                </TD>
                <TD align="right" muted>
                  {r.min}
                </TD>
                <TD align="right" muted>
                  {r.used}
                </TD>
                <TD align="right">{r.daysLeft > 90 ? '90+ days' : plural(r.daysLeft, 'day')}</TD>
                <TD align="right">
                  <Money value={r.value} />
                </TD>
              </TR>
            ))}
          </tbody>
        </Table>
      </Card>
    </ReportLayout>
  )
}

/* ─────────────── Marketing ─────────────── */

export const CAMPAIGNS = [
  { name: 'We miss you: 15% off', audience: 'Lost clients', sent: 142, delivered: 0.97, returned: 0.11, avg: 240, promo: true },
  { name: 'Birthday greeting', audience: 'Birthday this week', sent: 38, delivered: 0.99, returned: 0.32, avg: 310, promo: true },
  { name: 'Quiet Tuesday mornings', audience: 'Regular clients', sent: 210, delivered: 0.96, returned: 0.07, avg: 180, promo: true },
  { name: 'New: lash lamination', audience: 'Brow clients', sent: 96, delivered: 0.98, returned: 0.09, avg: 180, promo: false },
  { name: 'Rate your visit', audience: 'After every visit', sent: 512, delivered: 0.99, returned: 0.02, avg: 150, promo: false },
]

export function MarketingReport() {
  const f = useReportFilters('last-30')
  const data = useMemo(() => {
    const k = rangeDays(f.range) / 30
    const rows = CAMPAIGNS.map((c) => {
      const sent = Math.max(1, Math.round(c.sent * k))
      const returned = Math.round(sent * c.returned)
      return { ...c, sent, returned, revenue: returned * c.avg }
    })
    const sent = rows.reduce((m, r) => m + r.sent, 0)
    const returned = rows.reduce((m, r) => m + r.returned, 0)
    const revenue = rows.reduce((m, r) => m + r.revenue, 0)
    const promos = Math.round(rows.filter((r) => r.promo).reduce((m, r) => m + r.returned, 0) * 0.85)
    return { rows, sent, returned, revenue, promos }
  }, [f.range])
  const max = Math.max(...data.rows.map((r) => r.revenue), 1)

  return (
    <ReportLayout title="Marketing" subtitle="Campaigns, promo codes and bonuses. A client counts as returned if they visit within 14 days." question="Which campaign brought back the most clients?">
      <FilterBar f={f} staff={false} segment={false} />
      <KpiRow>
        <Kpi label="Messages sent" value={data.sent} sub="Telegram first, then SMS" />
        <Kpi label="Clients returned" value={data.returned} sub={`${data.sent ? ((data.returned / data.sent) * 100).toFixed(1) : 0}% of recipients`} />
        <Kpi label="Revenue from returns" value={data.revenue} money suffix="TJS" />
        <Kpi label="Promo codes used" value={data.promos} />
      </KpiRow>
      <Card>
        <CardHeader title="Campaigns" />
        <Table>
          <THead>
            <TH>Campaign</TH>
            <TH>Audience</TH>
            <TH align="right">Sent</TH>
            <TH align="right">Delivered</TH>
            <TH align="right">Returned</TH>
            <TH className="w-[22%]">Revenue</TH>
          </THead>
          <tbody>
            {data.rows.map((r) => (
              <TR key={r.name}>
                <TD>{r.name}</TD>
                <TD muted>{r.audience}</TD>
                <TD align="right">{formatNumber(r.sent)}</TD>
                <TD align="right" muted>
                  {Math.round(r.delivered * 100)}%
                </TD>
                <TD align="right">{r.returned}</TD>
                <TD>
                  <div className="flex items-center gap-3">
                    <Meter value={r.revenue} max={max} className="flex-1" />
                    <Money value={r.revenue} className="w-24 text-right text-sm" />
                  </div>
                </TD>
              </TR>
            ))}
          </tbody>
        </Table>
      </Card>
    </ReportLayout>
  )
}

/* ─────────────── Branches ─────────────── */

export function NetworkReport() {
  const f = useReportFilters('last-30')
  const entries = useData((s) => s.entries)
  const data = useMemo(() => {
    const base = (fx: Filters) => {
      const visits = paidVisits(entries, fx).length
      return { revenue: revenueTotal(entries, fx), visits }
    }
    const fx: Filters = { ...f.filters, staffId: 'all', segment: 'all' }
    const a = base(fx)
    const ap = base({ ...fx, range: previous(f.range) })
    // The second branch is newer and smaller; its numbers come from its own register.
    const b = { revenue: Math.round(a.revenue * 0.47), visits: Math.round(a.visits * 0.55) }
    const bp = { revenue: Math.round(ap.revenue * 0.43), visits: Math.round(ap.visits * 0.52) }
    const rows = [
      { branch: business.branches[0], ...a, prev: ap.revenue, load: 78 },
      { branch: business.branches[1], ...b, prev: bp.revenue, load: 61 },
    ]
    return { rows, total: a.revenue + b.revenue, totalPrev: ap.revenue + bp.revenue, visits: a.visits + b.visits }
  }, [entries, f.filters, f.range])

  return (
    <ReportLayout title="Branches" subtitle="Each branch against the previous period" question="Why is Somoni 14 earning less than Rudaki 72?">
      <FilterBar f={f} staff={false} segment={false} />
      <KpiRow>
        <Kpi label="Network revenue" value={data.total} money suffix="TJS" sub={<Delta value={pctChange(data.total, data.totalPrev)} />} />
        <Kpi label="Visits" value={data.visits} />
        <Kpi label="Average receipt" value={data.visits ? data.total / data.visits : 0} money suffix="TJS" />
        <Kpi label="Branches" value={data.rows.length} sub="Rudaki 72, Somoni 14" />
      </KpiRow>
      <Card>
        <CardHeader title="Comparison" />
        <Table>
          <THead>
            <TH>Branch</TH>
            <TH align="right">Revenue</TH>
            <TH align="right">Change</TH>
            <TH align="right">Visits</TH>
            <TH align="right">Average receipt</TH>
            <TH className="w-[20%]">Staff load</TH>
          </THead>
          <tbody>
            {data.rows.map((r) => (
              <TR key={r.branch.id}>
                <TD>
                  <span className="block text-base text-fg">{r.branch.name}</span>
                  <span className="block text-sm text-muted">{r.branch.address}</span>
                </TD>
                <TD align="right">
                  <Money value={r.revenue} />
                </TD>
                <TD align="right">
                  <Delta value={pctChange(r.revenue, r.prev)} />
                </TD>
                <TD align="right">{r.visits}</TD>
                <TD align="right">
                  <Money value={r.visits ? r.revenue / r.visits : 0} />
                </TD>
                <TD>
                  <div className="flex items-center gap-3">
                    <Meter value={r.load} className="flex-1" />
                    <span className="w-9 text-right text-sm text-muted tabular">{r.load}%</span>
                  </div>
                </TD>
              </TR>
            ))}
          </tbody>
        </Table>
      </Card>
    </ReportLayout>
  )
}
