import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router'
import { toast } from 'sonner'
import { ClientRow } from '@/components/client-picker'
import { I } from '@/components/icons'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardHeader } from '@/components/ui/card'
import { StatCard } from '@/components/ui/stat-card'
import { EmptyState, Figure, Meter, Money } from '@/components/ui/misc'
import { Segmented } from '@/components/ui/tabs'
import { Table, TD, TH, THead, TR } from '@/components/ui/table'
import { cn } from '@/lib/cn'
import { formatDate, plural } from '@/lib/format'
import { useOverlays } from '@/lib/overlays'
import { useData } from '@/lib/store'
import { TODAY, daysBetween } from '@/lib/time'
import { debtSince, hash } from './data'
import { ReportLayout } from './layout'

const BUCKETS = [
  { id: 'fresh', label: '0–7 days', test: (d: number) => d <= 7, tone: 'fg' as const },
  { id: 'late', label: '8–30 days', test: (d: number) => d > 7 && d <= 30, tone: 'warning' as const },
  { id: 'old', label: 'Over 30 days', test: (d: number) => d > 30, tone: 'negative' as const },
]

export default function DebtorsReport() {
  const clients = useData((s) => s.clients)
  const openClient = useOverlays((s) => s.openClient)
  const navigate = useNavigate()
  const [view, setView] = useState<'all' | 'overdue'>('all')
  const [reminded, setReminded] = useState<Set<string>>(new Set())

  const debtors = useMemo(
    () =>
      clients
        .filter((c) => c.debt > 0 && !c.archived)
        .map((c) => {
          const since = debtSince(c.id)
          const age = daysBetween(since, TODAY)
          // Some clients were already reminded automatically a few days ago.
          const lastReminder = hash(`rem-${c.id}`) < 0.5 ? Math.max(1, Math.round(age / 3)) : null
          return { c, since, age, lastReminder }
        })
        .sort((a, b) => b.age - a.age),
    [clients],
  )
  const total = debtors.reduce((m, d) => m + d.c.debt, 0)
  const shown = view === 'overdue' ? debtors.filter((d) => d.age > 7) : debtors

  function remindAll() {
    const ids = debtors.map((d) => d.c.id)
    setReminded(new Set(ids))
    const noTelegram = debtors.filter((d) => !d.c.telegram).length
    toast.success(`Reminders sent to ${plural(ids.length, 'client')}`, {
      description: noTelegram ? `In Telegram; by SMS for ${noTelegram} without Telegram.` : 'In Telegram.',
    })
  }

  return (
    <ReportLayout
      title="Receivables"
      subtitle="Money clients owe from partly paid receipts. Clients pay within 7 days by default."
      question="Which debts should I chase first?"
      primary={
        <Button variant="primary" icon={I.send} onClick={remindAll} disabled={!debtors.length}>
          Remind all
        </Button>
      }
    >
      <div className="mb-5 grid gap-4 lg:grid-cols-4">
        <StatCard label="Owed to you" value={<Figure value={total} money />} suffix="TJS" sub={plural(debtors.length, 'client')} />
        {BUCKETS.map((b) => {
          const items = debtors.filter((d) => b.test(d.age))
          const sum = items.reduce((m, d) => m + d.c.debt, 0)
          return (
            <StatCard
              key={b.id}
              label={b.label}
              value={<Money value={sum} currency={false} />}
              valueClassName={cn(b.tone === 'negative' && sum ? 'text-negative' : 'text-fg')}
              sub={<>{plural(items.length, 'client')}<Meter value={sum} max={total || 1} tone={b.tone} className="mt-2 h-1" /></>}
            />
          )
        })}
      </div>

      <Card>
        <CardHeader
          title="Clients with debt"
          action={
            <Segmented
              size="sm"
              value={view}
              onChange={setView}
              items={[
                { value: 'all', label: 'All' },
                { value: 'overdue', label: 'Overdue only' },
              ]}
            />
          }
        />
        {shown.length ? (
          <Table>
            <THead>
              <TH>Client</TH>
              <TH align="right">Owes</TH>
              <TH>Since</TH>
              <TH>Age</TH>
              <TH>Last reminder</TH>
              <TH />
            </THead>
            <tbody>
              {shown.map(({ c, since, age, lastReminder }) => (
                <TR key={c.id} onClick={() => openClient(c.id)}>
                  <TD>
                    <ClientRow client={c} />
                  </TD>
                  <TD align="right" className="font-medium">
                    <Money value={c.debt} />
                  </TD>
                  <TD muted>{formatDate(since)}</TD>
                  <TD>
                    <Badge tone={age > 30 ? 'negative' : age > 7 ? 'warning' : 'neutral'}>{plural(age, 'day')}</Badge>
                  </TD>
                  <TD muted>
                    {reminded.has(c.id) ? 'Just now' : lastReminder ? `${c.telegram ? 'Telegram' : 'SMS'}, ${plural(lastReminder, 'day')} ago` : 'Not yet'}
                  </TD>
                  <TD align="right">
                    <Button
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        navigate(`/pos?client=${c.id}`)
                      }}
                    >
                      Collect
                    </Button>
                  </TD>
                </TR>
              ))}
            </tbody>
          </Table>
        ) : (
          <EmptyState icon={I.wallet} title="No overdue debts" description="Every client with a balance is still within 7 days." />
        )}
      </Card>
    </ReportLayout>
  )
}
