import { useMemo } from 'react'
import { Link } from 'react-router'
import { BarChart } from '@/components/charts/bar-chart'
import { Card, CardHeader } from '@/components/ui/card'
import { Delta, Meter, Money, pctChange } from '@/components/ui/misc'
import { Table, TD, TH, THead, TR } from '@/components/ui/table'
import { CATEGORY_LABEL, type ClientCategory, type ClientSource } from '@/data/clients'
import { formatDate, formatNumber } from '@/lib/format'
import { useData } from '@/lib/store'
import { TODAY, addDays } from '@/lib/time'
import { offsets, paidVisits, previous, rangeDays, type Filters, type Range } from './data'
import { FilterBar, Kpi, KpiRow, LegendItem, ReportLayout, useReportFilters } from './layout'

const CATEGORY_TONE: Record<ClientCategory, string> = {
  new: 'bg-accent',
  regular: 'bg-fg',
  vip: 'bg-[var(--c-violet)]',
  lost: 'bg-fill-active',
}

export default function ClientsReport() {
  const f = useReportFilters('last-30')
  const entries = useData((s) => s.entries)
  const clients = useData((s) => s.clients)

  const data = useMemo(() => {
    // A new client is one added to the base in the period: the same definition Home uses.
    const isNew = (createdAt: Date, r: Range) => createdAt >= addDays(TODAY, r.from) && createdAt < addDays(TODAY, r.to + 1)
    const stats = (fx: Filters) => {
      const visits = paidVisits(entries, fx)
      const unique = new Set(visits.map((a) => a.clientId)).size
      const firsts = clients.filter((c) => isNew(c.createdAt, fx.range) && (fx.segment === 'all' || c.category === fx.segment)).length
      return { visits, unique, firsts }
    }
    const now = stats(f.filters)
    const prev = stats({ ...f.filters, range: previous(f.range) })

    // Calendar weeks (Monday to Sunday) for longer periods, days for short ones.
    const days = offsets(f.range)
    const weekly = rangeDays(f.range) > 14
    const buckets: { label: string; from: number; to: number }[] = []
    if (weekly) {
      for (const d of days) {
        const date = addDays(TODAY, d)
        if (date.getDay() !== 1 && d !== f.range.from) continue
        const to = Math.min(f.range.to, d + ((7 - ((date.getDay() + 6) % 7)) % 7 || 7) - 1)
        buckets.push({ label: formatDate(date), from: d, to })
      }
    } else {
      for (const d of days) buckets.push({ label: String(addDays(TODAY, d).getDate()), from: d, to: d })
    }
    // Unique clients per bucket, split into those new to the salon and those returning.
    const bars = buckets.map((b) => {
      const ids = new Set(paidVisits(entries, { ...f.filters, range: { from: b.from, to: b.to } }).map((a) => a.clientId))
      const first = clients.filter((c) => isNew(c.createdAt, b)).length
      return { label: b.label, value: Math.max(0, ids.size - first), secondary: first, muted: weekly && b.to - b.from < 6 }
    })

    const active = clients.filter((c) => !c.archived)
    const withVisits = active.filter((c) => c.visits > 0)
    const ltv = withVisits.length ? withVisits.reduce((m, c) => m + c.totalSpent, 0) / withVisits.length : 0
    // Retention: of clients past their first visits, the share still coming back (regular and VIP vs lost).
    const staying = active.filter((c) => c.category === 'regular' || c.category === 'vip').length
    const gone = active.filter((c) => c.category === 'lost').length
    const retention = staying + gone ? Math.round((staying / (staying + gone)) * 100) : 0

    const sources = new Map<ClientSource, { count: number; spent: number }>()
    for (const c of active) {
      const s = sources.get(c.source) ?? { count: 0, spent: 0 }
      s.count++
      s.spent += c.totalSpent
      sources.set(c.source, s)
    }
    const categories = (['regular', 'vip', 'new', 'lost'] as ClientCategory[]).map((k) => ({
      k,
      count: active.filter((c) => c.category === k).length,
    }))

    return {
      now,
      prev,
      bars,
      weekly,
      ltv,
      retention,
      activeCount: active.length,
      sources: [...sources.entries()].map(([source, v]) => ({ source, ...v })).sort((a, b) => b.count - a.count),
      categories,
    }
  }, [entries, clients, f.filters, f.range])

  const maxSource = Math.max(...data.sources.map((s) => s.count), 1)

  return (
    <ReportLayout
      title="Clients & retention"
      subtitle="Who comes, who comes back, and where they found you"
      question="Which clients stopped coming, and how do I bring them back?"
    >
      <FilterBar f={f} />

      <KpiRow>
        <Kpi label="Clients served" value={data.now.unique} sub={<Delta value={pctChange(data.now.unique, data.prev.unique)} />} />
        <Kpi label="New clients" value={data.now.firsts} sub={<Delta value={pctChange(data.now.firsts, data.prev.firsts)} />} />
        <Kpi label="Retention" value={data.retention} suffix="%" sub="Still visiting, of regular, VIP and lost" />
        <Kpi label="Average lifetime value" value={data.ltv} money suffix="TJS" sub="Total spent per client" />
      </KpiRow>

      <Card className="mb-5">
        <CardHeader
          title={`Clients served, by ${data.weekly ? 'week' : 'day'}`}
          description={data.weekly ? 'Lighter bars are part of a week' : undefined}
          action={
            <span className="flex gap-4">
              <LegendItem swatch="bg-fg">Returning</LegendItem>
              <LegendItem swatch="bg-[color-mix(in_oklab,var(--accent)_35%,var(--fill))]">New clients</LegendItem>
            </span>
          }
        />
        <div className="px-5 pt-2 pb-5">
          <BarChart
            bars={data.bars}
            height={190}
            labelEvery={data.bars.length > 14 ? 3 : 1}
            renderTooltip={(b) => (
              <>
                {formatNumber(b.value)} returning · {formatNumber(b.secondary ?? 0)} new
              </>
            )}
          />
        </div>
      </Card>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
        <Card>
          <CardHeader title="Where clients came from" description="All clients in the base, by first source" />
          <Table>
            <THead>
              <TH>Source</TH>
              <TH align="right">Clients</TH>
              <TH className="w-[28%]">Share</TH>
              <TH align="right">Spent in total</TH>
            </THead>
            <tbody>
              {data.sources.map((s) => (
                <TR key={s.source}>
                  <TD>{s.source}</TD>
                  <TD align="right">{s.count}</TD>
                  <TD>
                    <div className="flex items-center gap-3">
                      <Meter value={s.count} max={maxSource} className="flex-1" />
                      <span className="w-9 text-right text-sm text-muted tabular">{Math.round((s.count / data.activeCount) * 100)}%</span>
                    </div>
                  </TD>
                  <TD align="right">
                    <Money value={s.spent} />
                  </TD>
                </TR>
              ))}
            </tbody>
          </Table>
        </Card>

        <Card>
          <CardHeader title="Client categories" description="Set automatically from visits and spend" />
          <div className="px-5 pb-5">
            <div className="flex h-2.5 overflow-hidden rounded-full">
              {data.categories.map((c) => (
                <span key={c.k} className={CATEGORY_TONE[c.k]} style={{ width: `${(c.count / data.activeCount) * 100}%` }} />
              ))}
            </div>
            <ul className="mt-4">
              {data.categories.map((c) => (
                <li key={c.k}>
                  <Link to="/clients" className="-mx-2 flex items-center gap-3 rounded-lg px-2 py-2.5 hover:bg-fill">
                    <span className={`size-2.5 rounded-[3px] ${CATEGORY_TONE[c.k]}`} />
                    <span className="flex-1 text-base text-fg">{CATEGORY_LABEL[c.k]}</span>
                    <span className="text-base tabular">{c.count}</span>
                    <span className="w-10 text-right text-sm text-faint tabular">{Math.round((c.count / data.activeCount) * 100)}%</span>
                  </Link>
                </li>
              ))}
            </ul>
            <p className="mt-3 text-sm text-muted">Regular from 3 visits, VIP from 8,000 TJS spent, lost after 60 days away.</p>
          </div>
        </Card>
      </div>
    </ReportLayout>
  )
}
