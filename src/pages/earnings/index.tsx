import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { I, Icon } from '@/components/icons'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardHeader } from '@/components/ui/card'
import { Money } from '@/components/ui/misc'
import { Page, PageHeader } from '@/components/ui/page'
import { business, currentUser } from '@/data/business'
import { cn } from '@/lib/cn'
import { formatDate, formatMoney, monthLong } from '@/lib/format'
import { seeded } from '@/lib/random'
import { NOW, TODAY } from '@/lib/time'
import { Note, StatTile } from '../payroll/shared'

const FEE = 6000
const CONSULT_PRICE = 150
const daysInMonth = new Date(TODAY.getFullYear(), TODAY.getMonth() + 1, 0).getDate()
const elapsed = TODAY.getDate()

type Day = { date: Date; in: string; out: string; minutes: number; late: boolean }

const r = seeded(7070)
const pad = (n: number) => String(n).padStart(2, '0')
const hm = (min: number) => `${pad(Math.floor(min / 60))}:${pad(min % 60)}`

/** This month's clock log, Sundays off. */
const LOG: Day[] = Array.from({ length: elapsed - 1 }, (_, i) => new Date(TODAY.getFullYear(), TODAY.getMonth(), i + 1))
  .filter((d) => d.getDay() !== 0)
  .map((d) => {
    const late = r.chance(0.1)
    const start = 9 * 60 + (late ? r.int(10, 30) : -r.int(0, 12))
    const end = 18 * 60 + r.int(-10, 45)
    return { date: d, in: hm(start), out: hm(end), minutes: end - start - 30, late }
  })
  .reverse()

const consultsToday = 2
const consultsMonth = LOG.length * 1 + consultsToday + 9
const productSales = 3420

const ACCRUALS = [
  { label: 'Management fee', formula: `${formatMoney(FEE, { currency: false })} a month × ${elapsed} of ${daysInMonth} days`, amount: Math.round((FEE * elapsed) / daysInMonth) },
  { label: '50% of consultations', formula: `${consultsMonth} × ${CONSULT_PRICE} × 50%`, amount: Math.round(consultsMonth * CONSULT_PRICE * 0.5) },
  { label: '5% of product sales', formula: `${formatMoney(productSales, { currency: false })} × 5%`, amount: Math.round(productSales * 0.05) },
]
const monthTotal = ACCRUALS.reduce((m, a) => m + a.amount, 0)
const todayTotal = Math.round(FEE / daysInMonth + consultsToday * CONSULT_PRICE * 0.5)

const APPROVED = [1, 2, 3].map((o) => {
  const d = new Date(TODAY.getFullYear(), TODAY.getMonth() - o, 1)
  const days = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate()
  const total = FEE + Math.round((days - 4) * 1.15 * CONSULT_PRICE * 0.5) + 160 + o * 40
  return { title: monthLong(d.getMonth()), total, approvedOn: new Date(d.getFullYear(), d.getMonth() + 1, 3 + o) }
})

const PAYOUTS = APPROVED.flatMap((p, i) => {
  const adv = Math.round((p.total * 0.4) / 100) * 100
  const month = TODAY.getMonth() - i - 1
  return [
    { date: new Date(TODAY.getFullYear(), month + 1, 5), what: `Salary for ${p.title}`, amount: p.total - adv, method: 'Bank transfer' },
    { date: new Date(TODAY.getFullYear(), month, 20), what: `Advance for ${p.title}`, amount: adv, method: 'Bank transfer' },
  ]
}).filter((p) => p.date <= TODAY)

function useElapsed(since: number | null) {
  const [, tick] = useState(0)
  useEffect(() => {
    if (since == null) return
    const t = setInterval(() => tick((n) => n + 1), 1000)
    return () => clearInterval(t)
  }, [since])
  if (since == null) return ''
  const s = Math.floor((Date.now() - since) / 1000)
  return `${Math.floor(s / 3600)}:${pad(Math.floor((s % 3600) / 60))}:${pad(s % 60)}`
}

function TimeClock() {
  const [state, setState] = useState<'out' | 'checking' | 'in'>('out')
  const [since, setSince] = useState<number | null>(null)
  const [log, setLog] = useState<Day[]>(LOG)
  const [all, setAll] = useState(false)
  const elapsedText = useElapsed(state === 'in' ? since : null)
  const branch = business.branches[0]

  function clockIn() {
    setState('checking')
    setTimeout(() => {
      setState('in')
      setSince(Date.now())
      toast.success('Clocked in at 14:20', { description: `Location confirmed: ${branch.name}.` })
    }, 1200)
  }
  function clockOut() {
    const minutes = Math.max(1, Math.round((Date.now() - (since ?? Date.now())) / 60000))
    setState('out')
    setSince(null)
    setLog((l) => [{ date: TODAY, in: '14:20', out: hm(14 * 60 + 20 + minutes), minutes, late: false }, ...l])
    toast.success('Clocked out', { description: `Today’s shift: ${minutes} min. It’s in your timesheet.` })
  }

  const shown = all ? log : log.slice(0, 5)

  return (
    <Card className="mb-5">
      <div className="flex flex-col gap-5 p-6 sm:flex-row sm:items-center">
        <div className="flex min-w-0 flex-1 items-center gap-4">
          <span className={cn('grid size-12 place-items-center rounded-full', state === 'in' ? 'bg-positive-soft text-positive' : 'bg-fill text-muted')}>
            <Icon icon={I.clock} size={22} />
          </span>
          <div className="min-w-0">
            <div className="text-lg text-fg">{state === 'in' ? 'On shift since 14:20' : 'You’re not clocked in'}</div>
            <div className="text-sm text-muted">
              {state === 'in' ? (
                <span className="tabular">{elapsedText} on shift</span>
              ) : state === 'checking' ? (
                `Checking you’re at ${branch.name}…`
              ) : (
                `We check you’re at ${branch.name} when you clock in, nothing else.`
              )}
            </div>
          </div>
        </div>
        {state === 'in' ? (
          <Button size="lg" onClick={clockOut} className="px-6">
            Clock out
          </Button>
        ) : (
          <Button size="lg" variant="primary" icon={I.location} onClick={clockIn} loading={state === 'checking'} className="px-6">
            {state === 'checking' ? 'Checking location' : 'Clock in'}
          </Button>
        )}
      </div>
      <div className="border-t border-border px-6 pt-4 pb-2">
        <div className="mb-1 text-xs font-medium text-faint">{monthLong(TODAY.getMonth())} log</div>
        <ul>
          {shown.map((d) => (
            <li key={d.date.toISOString() + d.in} className="flex items-center gap-4 border-b border-border py-2.5 text-base last:border-b-0">
              <span className="w-28 text-fg">{formatDate(d.date, { weekday: true })}</span>
              <span className="flex-1 text-muted tabular">
                {d.in} – {d.out}
                {d.late && <Badge tone="warning" className="ml-2">Late</Badge>}
              </span>
              <span className="text-fg tabular">
                {Math.floor(d.minutes / 60)} h {pad(d.minutes % 60)} min
              </span>
            </li>
          ))}
        </ul>
        {log.length > 5 && (
          <button type="button" onClick={() => setAll(!all)} className="py-3 text-sm font-medium text-muted hover:text-fg">
            {all ? 'Show less' : `Show all ${log.length} days`}
          </button>
        )}
      </div>
    </Card>
  )
}

export default function Earnings() {
  const month = monthLong(TODAY.getMonth())
  const paidThisMonth = useMemo(() => PAYOUTS.filter((p) => p.date.getMonth() === TODAY.getMonth()).reduce((m, p) => m + p.amount, 0), [])

  return (
    <Page width="narrow">
      <PageHeader title="My earnings" subtitle={`${currentUser.name} · ${currentUser.role}, consultations · ${business.branches[0].name}`} />

      <TimeClock />

      <div className="mb-5 grid grid-cols-2 gap-5">
        <StatTile label="Today" value={todayTotal} money sub={`${consultsToday} consultations so far`} />
        <StatTile label={`${month} so far`} value={monthTotal} money sub="Preliminary, from your receipts and attendance" />
      </div>

      <Card className="mb-5">
        <CardHeader title={`Accruals in ${month}`} description={`Until ${formatDate(NOW)}. Final once the period is approved.`} />
        <ul className="px-5 pb-2">
          {ACCRUALS.map((a) => (
            <li key={a.label} className="flex items-start justify-between gap-6 border-b border-border py-3">
              <div>
                <div className="text-base text-fg">{a.label}</div>
                <div className="mt-0.5 text-sm text-muted tabular">{a.formula}</div>
              </div>
              <Money value={a.amount} className="pt-px text-base" />
            </li>
          ))}
          <li className="flex items-center justify-between gap-6 py-3">
            <span className="text-base font-medium text-fg">Total so far</span>
            <Money value={monthTotal} className="text-lg font-medium" />
          </li>
        </ul>
      </Card>

      <Card className="mb-5">
        <CardHeader title="Approved periods" description="Locked after approval, with a payslip for each." />
        <ul className="px-2 pb-2">
          {APPROVED.map((p) => (
            <li key={p.title} className="flex items-center gap-3 rounded-xl px-3 py-2.5">
              <Icon icon={I.lock} size={16} className="text-faint" />
              <span className="min-w-0 flex-1">
                <span className="block text-base text-fg">{p.title}</span>
                <span className="block text-sm text-muted">Approved {formatDate(p.approvedOn)} · paid in full</span>
              </span>
              <Money value={p.total} className="text-base" />
              <Button size="sm" variant="ghost" icon={I.download} onClick={() => toast(`Payslip for ${p.title} downloaded`)}>
                Payslip
              </Button>
            </li>
          ))}
        </ul>
      </Card>

      <Card>
        <CardHeader title="Payouts" description={paidThisMonth ? `${formatMoney(paidThisMonth)} paid to you in ${month}` : undefined} />
        <ul className="px-5 pb-2">
          {PAYOUTS.map((p) => (
            <li key={p.what} className="flex items-center justify-between gap-6 border-b border-border py-3 last:border-b-0">
              <div>
                <div className="text-base text-fg">{p.what}</div>
                <div className="text-sm text-muted">
                  {formatDate(p.date)} · {p.method}
                </div>
              </div>
              <Money value={p.amount} className="text-base" />
            </li>
          ))}
        </ul>
      </Card>

      <Note className="mt-5">Numbers update as you complete visits and sell products. The owner approves each period; after that it’s locked.</Note>
    </Page>
  )
}
