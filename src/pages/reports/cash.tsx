import { useMemo } from 'react'
import { Badge } from '@/components/ui/badge'
import { Card, CardHeader } from '@/components/ui/card'
import { Delta, Meter, Money, pctChange } from '@/components/ui/misc'
import { Table, TD, TH, THead, TR } from '@/components/ui/table'
import { cn } from '@/lib/cn'
import { formatDate } from '@/lib/format'
import { useData } from '@/lib/store'
import { TODAY, addDays } from '@/lib/time'
import {
  EXPENSES_PER_MONTH,
  byMethod,
  hash,
  methodFor,
  methodName,
  offsets,
  paidVisits,
  pl,
  previous,
  rangeDays,
} from './data'
import { FilterBar, Kpi, KpiRow, ReportLayout, useReportFilters } from './layout'

function Line({
  label,
  amount,
  revenue,
  minus,
  muted,
  strong,
  tone,
}: {
  label: string
  amount: number
  revenue: number
  minus?: boolean
  muted?: boolean
  strong?: boolean
  tone?: boolean
}) {
  const pct = revenue ? (amount / revenue) * 100 : 0
  return (
    <div className={cn('grid grid-cols-[1fr_auto_56px] items-baseline gap-4 py-2.5', muted && 'pl-4')}>
      <span className={cn(muted ? 'text-sm text-muted' : 'text-base text-fg', strong && 'font-medium')}>
        {minus && <span className="mr-1.5 text-faint">−</span>}
        {label}
      </span>
      <Money
        value={amount}
        className={cn(
          'text-right',
          muted ? 'text-sm text-muted' : 'text-base',
          strong && 'text-lg font-medium',
          tone && (amount >= 0 ? 'text-positive' : 'text-negative'),
        )}
      />
      <span className="text-right text-sm text-faint tabular">{Math.round(pct)}%</span>
    </div>
  )
}

export default function CashReport() {
  const f = useReportFilters('this-month')
  const entries = useData((s) => s.entries)

  const data = useMemo(() => {
    const now = pl(entries, f.range)
    const prev = pl(entries, previous(f.range))
    const methods = byMethod(entries, f.range)
    const scale = rangeDays(f.range) / 30
    const expenses = EXPENSES_PER_MONTH.map((e) => ({ ...e, amount: Math.round(e.amount * scale) }))

    // One shift per day; the most recent first. Today's is still open.
    const shifts = offsets(f.range)
      .reverse()
      .slice(0, 10)
      .map((d) => {
        const date = addDays(TODAY, d)
        const visits = paidVisits(entries, { range: { from: d, to: d }, staffId: 'all', segment: 'all' })
        const cash = visits.filter((a) => methodFor(a.id) === 'cash').reduce((m, a) => m + a.price, 0)
        const spent = hash(`exp-${d}`) < 0.4 ? Math.round(50 + hash(`exp-a-${d}`) * 250) : 0
        const expected = 500 + cash - spent
        const r = hash(`shift-${d}`)
        const diff = d === 0 ? 0 : r < 0.12 ? -Math.round(10 + hash(`s2-${d}`) * 40) : r < 0.2 ? Math.round(5 + hash(`s3-${d}`) * 15) : 0
        return { d, date, by: d % 3 === 0 ? 'Zarina Karimova' : 'Nigora Alieva', cash, spent, expected, diff, open: d === 0 }
      })

    return { now, prev, methods, expenses, shifts }
  }, [entries, f.range])

  const { now, prev } = data
  const costs = now.revenue - now.profit
  const margin = now.revenue ? (now.profit / now.revenue) * 100 : 0
  const methodTotal = data.methods.reduce((m, x) => m + x.amount, 0)
  const expenseTotal = data.expenses.reduce((m, x) => m + x.amount, 0)
  const shortages = data.shifts.filter((s) => s.diff < 0)

  return (
    <ReportLayout
      title="Cash & profit"
      subtitle="What’s left after expenses, salaries and fees. Salaries use each master’s payroll scheme."
      question="Where does my profit go, and which costs grew this month?"
    >
      <FilterBar f={f} staff={false} segment={false} />

      <KpiRow>
        <Kpi label="Revenue" value={now.revenue} money suffix="TJS" sub={<Delta value={pctChange(now.revenue, prev.revenue)} />} />
        <Kpi label="Costs" value={costs} money suffix="TJS" sub={<Delta value={pctChange(costs, prev.revenue - prev.profit)} invert />} />
        <Kpi label="Profit" value={now.profit} money suffix="TJS" sub={<Delta value={pctChange(now.profit, prev.profit)} />} />
        <Kpi label="Margin" value={Math.round(margin)} suffix="%" sub="Profit as a share of revenue" />
      </KpiRow>

      <div className="mb-5 grid gap-5 lg:grid-cols-[minmax(0,1fr)_380px]">
        <Card>
          <CardHeader title="Profit and loss" description="Each line as a share of revenue" />
          <div className="px-5 pb-4">
            <Line label="Revenue" amount={now.revenue} revenue={now.revenue} strong />
            <Line label="Services" amount={now.services} revenue={now.revenue} muted />
            <Line label="Retail products" amount={now.retail} revenue={now.revenue} muted />
            <div className="my-1 h-px bg-border" />
            <Line label="Expenses" amount={now.expenses} revenue={now.revenue} minus />
            <Line label="Salary payouts" amount={now.salaries} revenue={now.revenue} minus />
            <Line label="Cost of goods sold" amount={now.cogs} revenue={now.revenue} minus />
            <Line label="Tech-card consumables" amount={now.consumables} revenue={now.revenue} minus />
            <Line label="Acquiring fees" amount={now.fees} revenue={now.revenue} minus />
            <Line label="Bonuses redeemed" amount={now.bonuses} revenue={now.revenue} minus />
            <div className="my-1 h-px bg-border-strong" />
            <Line label="Profit" amount={now.profit} revenue={now.revenue} strong tone />
          </div>
        </Card>

        <div className="flex flex-col gap-5">
          <Card>
            <CardHeader title="By payment method" description="Service receipts" />
            <ul className="px-5 pb-4">
              {data.methods.map((m) => (
                <li key={m.id} className="py-2">
                  <div className="flex items-baseline justify-between gap-3 text-base">
                    <span className="text-fg">{methodName(m.id)}</span>
                    <span className="flex items-baseline gap-2">
                      <Money value={m.amount} />
                      <span className="w-9 text-right text-sm text-faint tabular">{methodTotal ? Math.round((m.amount / methodTotal) * 100) : 0}%</span>
                    </span>
                  </div>
                  <Meter value={m.amount} max={data.methods[0]?.amount || 1} className="mt-1.5 h-1" />
                </li>
              ))}
            </ul>
          </Card>
          <Card>
            <CardHeader title="Expenses by category" action={<Money value={expenseTotal} className="text-base" />} />
            <ul className="px-5 pb-4">
              {data.expenses.map((e) => (
                <li key={e.category} className="flex items-center gap-3 py-2 text-base">
                  <span className="w-24 shrink-0 text-fg">{e.category}</span>
                  <Meter value={e.amount} max={data.expenses[0].amount} className="h-1 flex-1" />
                  <Money value={e.amount} className="w-24 text-right" />
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </div>

      <Card>
        <CardHeader
          title="Cash shifts"
          description={
            shortages.length
              ? `${shortages.length} shift${shortages.length > 1 ? 's' : ''} closed short in this period`
              : 'Every closed shift matched the count'
          }
        />
        <Table>
          <THead>
            <TH>Shift</TH>
            <TH>Opened by</TH>
            <TH align="right">Cash sales</TH>
            <TH align="right">Paid out</TH>
            <TH align="right">Expected</TH>
            <TH align="right">Difference</TH>
          </THead>
          <tbody>
            {data.shifts.map((s) => (
              <TR key={s.d}>
                <TD>{s.d === 0 ? 'Today' : formatDate(s.date, { weekday: true })}</TD>
                <TD muted>{s.by}</TD>
                <TD align="right">
                  <Money value={s.cash} />
                </TD>
                <TD align="right" muted>
                  {s.spent ? <Money value={s.spent} /> : '—'}
                </TD>
                <TD align="right">
                  <Money value={s.expected} />
                </TD>
                <TD align="right">
                  {s.open ? (
                    <Badge tone="accent">
                      Open
                    </Badge>
                  ) : s.diff === 0 ? (
                    <span className="text-muted">Matched</span>
                  ) : (
                    <Badge tone={s.diff < 0 ? 'negative' : 'warning'}>
                      {s.diff < 0 ? 'Short' : 'Over'} <Money value={Math.abs(s.diff)} currency={false} />
                    </Badge>
                  )}
                </TD>
              </TR>
            ))}
          </tbody>
        </Table>
      </Card>
    </ReportLayout>
  )
}
