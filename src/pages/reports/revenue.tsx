import { useMemo, useState, type ReactNode } from 'react'
import { BarChart } from '@/components/charts/bar-chart'
import { Avatar } from '@/components/ui/avatar'
import { Card, CardHeader } from '@/components/ui/card'
import { Delta, Meter, Money, pctChange } from '@/components/ui/misc'
import { Segmented } from '@/components/ui/tabs'
import { Table, TD, TH, THead, TR } from '@/components/ui/table'
import { serviceById } from '@/data/services'
import { staffById } from '@/data/staff'
import { dayShort, formatDate, formatNumber, plural } from '@/lib/format'
import { useData } from '@/lib/store'
import { TODAY, addDays } from '@/lib/time'
import {
  discountFor,
  filtered,
  methodFor,
  methodName,
  offsets,
  paidVisits,
  previous,
  rangeDays,
  revenueForDay,
  revenueTotal,
  type Filters,
} from './data'
import { FilterBar, Kpi, KpiRow, ReportLayout, useReportFilters } from './layout'

type Mode = 'salon' | 'tenants'
type Group = 'day' | 'service' | 'master' | 'method'

type Row = { key: string; name: ReactNode; count: number; amount: number }

export function GroupTable({ rows, countLabel, total, totalCount }: { rows: Row[]; countLabel: string; total: number; totalCount: number }) {
  return (
    <Table>
      <THead>
        <TH>Name</TH>
        <TH align="right">{countLabel}</TH>
        <TH align="right">Revenue</TH>
        <TH align="right">Average</TH>
        <TH className="w-[22%]">Share</TH>
      </THead>
      <tbody>
        {rows.map((r) => (
          <TR key={r.key}>
            <TD>{r.name}</TD>
            <TD align="right" muted>
              {formatNumber(r.count)}
            </TD>
            <TD align="right">
              <Money value={r.amount} />
            </TD>
            <TD align="right" muted>
              {r.count ? <Money value={r.amount / r.count} /> : '—'}
            </TD>
            <TD>
              <div className="flex items-center gap-3">
                <Meter value={r.amount} max={total || 1} className="flex-1" />
                <span className="w-10 text-right text-sm text-muted tabular">{total ? Math.round((r.amount / total) * 100) : 0}%</span>
              </div>
            </TD>
          </TR>
        ))}
        <TR>
          <TD className="font-medium">Total</TD>
          <TD align="right" className="font-medium">
            {formatNumber(totalCount)}
          </TD>
          <TD align="right" className="font-medium">
            <Money value={total} />
          </TD>
          <TD align="right" muted>
            {totalCount ? <Money value={total / totalCount} /> : '—'}
          </TD>
          <TD />
        </TR>
      </tbody>
    </Table>
  )
}

export default function RevenueReport() {
  const f = useReportFilters('last-30')
  const entries = useData((s) => s.entries)
  const [mode, setMode] = useState<Mode>('salon')
  const [group, setGroup] = useState<Group>('day')
  const tenants = mode === 'tenants'

  const data = useMemo(() => {
    // Tenants' turnover ignores the master filter: there's one tenant master in the demo.
    const fx: Filters = tenants ? { ...f.filters, staffId: 'all' } : f.filters
    const prevF: Filters = { ...fx, range: previous(fx.range) }
    const visits = paidVisits(entries, fx, tenants)
    const prevVisits = paidVisits(entries, prevF, tenants)
    const sum = (v: typeof visits) => v.reduce((m, a) => m + a.price, 0)
    const revenue = tenants ? sum(visits) : revenueTotal(entries, fx)
    const revenuePrev = tenants ? sum(prevVisits) : revenueTotal(entries, prevF)
    const avg = visits.length ? sum(visits) / visits.length : 0
    const avgPrev = prevVisits.length ? sum(prevVisits) / prevVisits.length : 0
    const discounts = visits.map(discountFor).filter(Boolean)

    const single = rangeDays(fx.range) === 1
    const bars = single
      ? Array.from({ length: 12 }, (_, i) => {
          const h = 9 + i
          // A visit's money lands in the hour it was paid, i.e. when it ended.
          const value = visits.filter((a) => a.end.getHours() === h).reduce((m, a) => m + a.price, 0)
          return { label: String(h).padStart(2, '0'), value, title: `${String(h).padStart(2, '0')}:00–${String(h + 1).padStart(2, '0')}:00` }
        })
      : offsets(fx.range).map((d) => {
          const date = addDays(TODAY, d)
          const value = tenants ? sum(visits.filter((a) => +a.start >= +date && +a.start < +addDays(date, 1))) : revenueForDay(entries, fx, d)
          return {
            label: rangeDays(fx.range) <= 7 ? (d === 0 ? 'Today' : dayShort(date.getDay())) : String(date.getDate()),
            value,
            title: formatDate(date, { weekday: true }),
          }
        })

    return { fx, visits, revenue, revenuePrev, avg, avgPrev, prevCount: prevVisits.length, discounts, bars, single }
  }, [entries, f.filters, tenants])

  const rows: Row[] = useMemo(() => {
    const v = data.visits
    if (group === 'day') {
      return offsets(data.fx.range)
        .reverse()
        .map((d) => {
          const date = addDays(TODAY, d)
          const mine = v.filter((a) => +a.start >= +date && +a.start < +addDays(date, 1))
          const amount = tenants ? mine.reduce((m, a) => m + a.price, 0) : revenueForDay(entries, data.fx, d)
          return { key: String(d), name: d === 0 ? 'Today' : formatDate(date, { weekday: true }), count: mine.length, amount }
        })
    }
    const map = new Map<string, { count: number; amount: number }>()
    const add = (k: string, amount: number) => {
      const r = map.get(k) ?? { count: 0, amount: 0 }
      r.count++
      r.amount += amount
      map.set(k, r)
    }
    for (const a of v) {
      if (group === 'service') a.serviceIds.forEach((id) => add(id, serviceById[id].price))
      else if (group === 'master') add(a.staffId, a.price)
      else add(methodFor(a.id), a.price)
    }
    const out: Row[] = [...map.entries()]
      .map(([k, r]) => ({
        key: k,
        count: r.count,
        amount: r.amount,
        name:
          group === 'service' ? (
            <span className="flex items-center gap-2.5">
              <span className="size-2 rounded-full" style={{ background: `var(--c-${serviceById[k].color})` }} />
              {serviceById[k].name}
            </span>
          ) : group === 'master' ? (
            <span className="flex items-center gap-2.5">
              <Avatar name={staffById[k].name} color={staffById[k].color} size="sm" />
              {staffById[k].name}
            </span>
          ) : (
            methodName(k as never)
          ),
      }))
      .sort((a, b) => b.amount - a.amount)
    // Retail isn't tied to a master or service; show it so the table adds up to the total.
    const services = v.reduce((m, a) => m + a.price, 0)
    if (!tenants && !filtered(data.fx) && group !== 'master' && data.revenue > services) {
      out.push({ key: 'retail', name: <span className="text-muted">Retail products</span>, count: 0, amount: data.revenue - services })
    }
    return out
  }, [data, group, entries, tenants])

  return (
    <ReportLayout
      title="Revenue"
      subtitle="Paid receipts from the register. Sublease tenants are counted separately."
      question={tenants ? 'How did tenants’ turnover change this month?' : 'Why did revenue change compared to the previous period?'}
    >
      <FilterBar f={f} staff={!tenants}>
        <Segmented
          size="sm"
          value={mode}
          onChange={setMode}
          items={[
            { value: 'salon', label: 'Salon revenue' },
            { value: 'tenants', label: 'Tenants’ turnover' },
          ]}
        />
      </FilterBar>

      <KpiRow>
        <Kpi label={tenants ? 'Tenants’ turnover' : 'Revenue'} value={data.revenue} money suffix="TJS" sub={<Delta value={pctChange(data.revenue, data.revenuePrev)} />} />
        <Kpi label="Receipts" value={data.visits.length} sub={<Delta value={pctChange(data.visits.length, data.prevCount)} />} />
        <Kpi label="Average receipt" value={data.avg} money suffix="TJS" sub={<Delta value={pctChange(data.avg, data.avgPrev)} />} />
        <Kpi
          label="Discounts given"
          value={data.discounts.reduce((m, x) => m + x, 0)}
          money
          suffix="TJS"
          sub={`On ${plural(data.discounts.length, 'receipt')}`}
        />
      </KpiRow>

      <Card className="mb-5">
        <CardHeader
          title={data.single ? 'By hour' : 'By day'}
          description={filtered(data.fx) && !tenants ? 'Services only: retail isn’t tied to a master or client group' : undefined}
          action={<Money value={data.revenue} className="text-base" />}
        />
        <div className="px-5 pt-2 pb-5">
          <BarChart
            bars={data.bars}
            height={200}
            labelEvery={data.bars.length > 14 ? 3 : 1}
            renderTooltip={(b, i) => (
              <>
                {data.bars[i].title} · <Money value={b.value} className="text-bg" />
              </>
            )}
          />
        </div>
      </Card>

      <Card>
        <CardHeader
          title="Breakdown"
          action={
            <Segmented
              size="sm"
              value={group}
              onChange={setGroup}
              items={[
                { value: 'day', label: 'By day' },
                { value: 'service', label: 'By service' },
                { value: 'master', label: 'By master' },
                { value: 'method', label: 'By payment' },
              ]}
            />
          }
        />
        <GroupTable
          rows={rows}
          countLabel={group === 'service' ? 'Services' : 'Receipts'}
          total={rows.reduce((m, r) => m + r.amount, 0)}
          totalCount={group === 'service' ? rows.reduce((m, r) => m + r.count, 0) : data.visits.length}
        />
      </Card>
    </ReportLayout>
  )
}
