import { StatCard } from '@/components/ui/stat-card'
import { useMemo, useState } from 'react'
import { BarChart } from '@/components/charts/bar-chart'
import { Card, CardHeader } from '@/components/ui/card'
import { Delta, Figure, Meter, Money, pctChange } from '@/components/ui/misc'
import { Toolbar } from '@/components/ui/page'
import { Select } from '@/components/ui/select'
import { TD, TH, THead, TR, Table } from '@/components/ui/table'
import { CURRENCY, dayShort, formatDate } from '@/lib/format'
import { abnormalShare, history, medianTurnaround, testById } from './data'
import { useLab } from './store'

type Period = '7' | '30' | '90'

function Stat({
  label,
  value,
  suffix,
  money,
  sub,
  decimals = 0,
}: {
  label: string
  value: number
  suffix?: string
  money?: boolean
  sub: React.ReactNode
  decimals?: number
}) {
  return (
    <StatCard label={label} value={<Figure value={value} money={money} format={{ maximumFractionDigits: decimals }} />} suffix={suffix} sub={sub} />
  )
}

function summarize(days: typeof history) {
  const orders = days.reduce((m, d) => m + d.orders, 0)
  const revenue = days.reduce((m, d) => m + d.revenue, 0)
  const overdue = days.reduce((m, d) => m + d.overdue, 0)
  const abnormal = days.reduce((m, d) => m + d.abnormal, 0)
  return {
    orders,
    revenue,
    overduePct: orders ? (overdue / orders) * 100 : 0,
    abnormalPct: orders ? (abnormal / orders) * 100 : 0,
  }
}

export function LabReports() {
  const tests = useLab((s) => s.tests)
  const [period, setPeriod] = useState<Period>('30')
  const n = Number(period)
  const current = history.slice(-n)
  const previous = history.slice(-2 * n, -n)
  const now = summarize(current)
  const prev = summarize(previous)

  const byTest = useMemo(() => {
    const map = new Map<string, number>()
    for (const d of current) for (const [id, c] of Object.entries(d.byTest)) map.set(id, (map.get(id) ?? 0) + c)
    return [...map.entries()]
      .map(([id, count]) => {
        const t = testById(tests, id)!
        return { id, t, count, revenue: count * t.price, turnaround: medianTurnaround(t), abnormal: abnormalShare(t) }
      })
      .sort((a, b) => b.revenue - a.revenue)
  }, [current, tests])

  const median = Math.round(
    byTest.reduce((m, r) => m + r.turnaround * r.count, 0) / Math.max(1, byTest.reduce((m, r) => m + r.count, 0)),
  )
  const maxAbnormal = Math.max(...byTest.map((r) => r.abnormal), 1)

  const bars = current.map((d, i) => ({
    label: n === 7 ? dayShort(d.date.getDay()) : formatDate(d.date),
    value: d.orders,
    muted: i === current.length - 1,
  }))

  return (
    <>
      <Toolbar>
        <Select
          look="pill"
          value={period}
          onChange={setPeriod}
          options={[
            { value: '7', label: 'Last 7 days' },
            { value: '30', label: 'Last 30 days' },
            { value: '90', label: 'Last 90 days' },
          ]}
        />
        <span className="text-sm text-muted">Compared with the previous {n} days</span>
      </Toolbar>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        <Stat label="Orders" value={now.orders} sub={<Delta value={pctChange(now.orders, prev.orders)} />} />
        <Stat label="Paid" value={now.revenue} suffix={CURRENCY} money sub={<Delta value={pctChange(now.revenue, prev.revenue)} />} />
        <Stat label="Median turnaround" value={median} suffix="h" sub="From sample to result" />
        <Stat label="Overdue" value={now.overduePct} decimals={1} suffix="%" sub={`${prev.overduePct.toFixed(1)}% the period before`} />
        <Stat label="Abnormal results" value={now.abnormalPct} suffix="%" sub="Orders with a value out of range" />
      </div>

      <Card className="mt-5">
        <CardHeader title="Orders by day" description="Today is shown lighter until the day ends" />
        <div className="px-5 pt-2 pb-5">
          <BarChart
            bars={bars}
            height={180}
            labelEvery={n === 7 ? 1 : n === 30 ? 5 : 15}
            renderTooltip={(b, i) => `${b.value} orders · ${formatDate(current[i].date, { weekday: true })}`}
          />
        </div>
      </Card>

      <Card className="mt-5">
        <CardHeader title="By test" description="Packages count as one order" />
        <Table>
          <THead>
            <TH>Test</TH>
            <TH align="right">Orders</TH>
            <TH align="right">Revenue</TH>
            <TH align="right">Turnaround vs promised</TH>
            <TH>Abnormal</TH>
          </THead>
          <tbody>
            {byTest.map((r) => (
              <TR key={r.id}>
                <TD>
                  <span className="block">{r.t.name}</span>
                  <span className="block text-sm text-muted">{r.t.code}</span>
                </TD>
                <TD align="right">{r.count}</TD>
                <TD align="right">
                  <Money value={r.revenue} />
                </TD>
                <TD align="right" muted>
                  {r.turnaround} h <span className="text-faint">/ {r.t.turnaround} h</span>
                </TD>
                <TD className="w-48">
                  <span className="flex items-center gap-3">
                    <Meter value={r.abnormal} max={maxAbnormal} tone={r.abnormal > 30 ? 'warning' : 'fg'} className="w-24" />
                    <span className="text-sm text-muted tabular">{r.abnormal}%</span>
                  </span>
                </TD>
              </TR>
            ))}
          </tbody>
        </Table>
      </Card>
      <p className="mt-4 text-sm text-muted">
        Vitamin D and ferritin are most often low: worth offering a hair-loss panel to clients booking hair treatments.
      </p>
    </>
  )
}
