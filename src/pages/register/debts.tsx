import { useState } from 'react'
import { useNavigate } from 'react-router'
import { toast } from 'sonner'
import { I } from '@/components/icons'
import { Avatar } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Switch } from '@/components/ui/controls'
import { EmptyState, Money } from '@/components/ui/misc'
import { StatCard } from '@/components/ui/stat-card'
import { Toolbar } from '@/components/ui/page'
import { TD, TH, THead, TR, Table } from '@/components/ui/table'
import { formatDate, formatPhone, plural } from '@/lib/format'
import { useOverlays } from '@/lib/overlays'
import { useData } from '@/lib/store'
import { TODAY, addDays, daysBetween } from '@/lib/time'
import { useRegister } from './store'

/** Debts are due a week after the visit unless agreed otherwise. */
const DUE_DAYS = 7

export function Debts() {
  const clients = useData((s) => s.clients)
  const receipts = useRegister((s) => s.receipts)
  const openClient = useOverlays((s) => s.openClient)
  const navigate = useNavigate()
  const [overdueOnly, setOverdueOnly] = useState(false)

  const rows = clients
    .filter((c) => c.debt > 0)
    .map((c) => {
      const receipt = receipts.find((r) => r.clientId === c.id && r.status === 'debt')
      const due = addDays(receipt?.at ?? TODAY, DUE_DAYS)
      return { client: c, receipt, due, overdue: daysBetween(due, TODAY) }
    })
    .sort((a, b) => b.overdue - a.overdue)
  const list = rows.filter((r) => !overdueOnly || r.overdue > 0)
  const total = rows.reduce((m, r) => m + r.client.debt, 0)
  const overdue = rows.filter((r) => r.overdue > 0).reduce((m, r) => m + r.client.debt, 0)

  return (
    <>
      <Card className="mb-5 grid grid-cols-3 divide-x divide-border">
        <StatCard size="sm" className="rounded-none bg-transparent ring-0" label="Clients owe" value={<Money value={total} />} />
        <StatCard size="sm" className="rounded-none bg-transparent ring-0" label="Overdue" value={<Money value={overdue} className={overdue ? 'text-negative' : ''} />} />
        <StatCard size="sm" className="rounded-none bg-transparent ring-0" label="Clients with debt" value={rows.length} />
      </Card>

      <Toolbar>
        <Switch checked={overdueOnly} onChange={setOverdueOnly} label="Overdue only" className="gap-3" />
      </Toolbar>

      <Card>
        {list.length ? (
          <Table>
            <THead>
              <TH>Client</TH>
              <TH>Receipt</TH>
              <TH align="right">Owes</TH>
              <TH>Due</TH>
              <TH />
            </THead>
            <tbody>
              {list.map(({ client, receipt, due, overdue: days }) => (
                <TR key={client.id} onClick={() => openClient(client.id)}>
                  <TD>
                    <span className="flex items-center gap-2.5">
                      <Avatar name={client.name} size="md" />
                      <span>
                        <span className="block text-base text-fg">{client.name}</span>
                        <span className="block text-sm text-muted tabular">{formatPhone(client.phone)}</span>
                      </span>
                    </span>
                  </TD>
                  <TD muted className="tabular">
                    {receipt ? `#${receipt.no} · ${formatDate(receipt.at)}` : '—'}
                  </TD>
                  <TD align="right">
                    <Money value={client.debt} className="text-negative" />
                  </TD>
                  <TD>
                    <span className="flex items-center gap-2 whitespace-nowrap">
                      <span className="text-muted">{formatDate(due)}</span>
                      {days > 0 ? (
                        <Badge tone="negative">{plural(days, 'day')} overdue</Badge>
                      ) : days === 0 ? (
                        <Badge tone="warning">Due today</Badge>
                      ) : (
                        <Badge>In {plural(-days, 'day')}</Badge>
                      )}
                    </span>
                  </TD>
                  <TD align="right">
                    <span className="flex justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                      <Button
                        size="sm"
                        variant="ghost"
                        icon={client.telegram ? I.telegram : I.message}
                        onClick={() => toast.success(`Reminder sent to ${client.firstName}`, { description: client.telegram ? 'In Telegram' : 'By SMS' })}
                      >
                        Remind
                      </Button>
                      <Button size="sm" variant="secondary" onClick={() => navigate(`/pos?client=${client.id}&debt=1`)}>
                        Collect
                      </Button>
                    </span>
                  </TD>
                </TR>
              ))}
            </tbody>
          </Table>
        ) : (
          <EmptyState
            icon={I.wallet}
            title={rows.length ? 'Nothing overdue' : 'No one owes you'}
            description="When a client pays part of a receipt, the rest shows here until it’s collected."
          />
        )}
      </Card>
    </>
  )
}
