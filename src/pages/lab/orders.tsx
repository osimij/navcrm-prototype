import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router'
import { I } from '@/components/icons'
import { Avatar } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Chip } from '@/components/ui/controls'
import { SearchInput } from '@/components/ui/input'
import { EmptyState, Money } from '@/components/ui/misc'
import { Toolbar } from '@/components/ui/page'
import { TD, TH, THead, TR, Table, TableFooter } from '@/components/ui/table'
import { cn } from '@/lib/cn'
import { formatDay, formatPhone, formatTime, plural } from '@/lib/format'
import { useData } from '@/lib/store'
import { NOW } from '@/lib/time'
import { ORDER_STATUS, orderAmount, testById, whereLabel, type LabOrder, type OrderStatus } from './data'
import { useLab } from './store'

/** "Today, 18:30" / "Tomorrow, 09:00" / "Fri, 24 Oct, 12:00" */
export const dueText = (d: Date, inline = false) => {
  const day = formatDay(d)
  // Mid-sentence, "today" reads better lowercase; dates keep their capitals.
  const rel = ['Today', 'Tomorrow', 'Yesterday'].includes(day)
  return `${inline && rel ? day.toLowerCase() : day}, ${formatTime(d)}`
}

export const isOverdue = (o: LabOrder) => o.status !== 'ready' && o.status !== 'sent' && o.due < NOW

/** "Overdue 4 h" / "Today, 18:30" */
export function DueCell({ order }: { order: LabOrder }) {
  if (order.status === 'sent') return <span className="text-faint">Sent {order.sentAt ? dueText(order.sentAt, true) : ''}</span>
  if (order.status === 'ready') return <span className="text-muted">Ready</span>
  if (isOverdue(order)) {
    const h = Math.max(1, Math.round((NOW.getTime() - order.due.getTime()) / 3_600_000))
    return <span className="font-medium text-negative">Overdue {h} h</span>
  }
  return <span className="text-fg">{dueText(order.due)}</span>
}

const FILTERS: OrderStatus[] = ['awaiting', 'sample_taken', 'in_progress', 'sent_partner', 'ready', 'sent']

export function Orders() {
  const orders = useLab((s) => s.orders)
  const tests = useLab((s) => s.tests)
  const openOrder = useLab((s) => s.openOrder)
  const clients = useData((s) => s.clients)
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState<OrderStatus | 'overdue' | null>(null)
  const [params, setParams] = useSearchParams()

  // A freshly created order opens straight away.
  useEffect(() => {
    const id = params.get('order')
    if (id) {
      openOrder(id)
      setParams({}, { replace: true })
    }
  }, [params, openOrder, setParams])

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase()
    const digits = q.replace(/\D/g, '')
    return [...orders]
      .sort((a, b) => +b.createdAt - +a.createdAt)
      .filter((o) => (status === 'overdue' ? isOverdue(o) : !status || o.status === status))
      .filter((o) => {
        if (!q) return true
        const c = clients.find((x) => x.id === o.clientId)
        if (digits && String(o.no).includes(digits)) return true
        if (digits.length >= 3 && c?.phone.replace(/\D/g, '').includes(digits)) return true
        return !!c && q.split(/\s+/).every((w) => c.name.toLowerCase().includes(w))
      })
  }, [orders, clients, query, status])

  const count = (s: OrderStatus) => orders.filter((o) => o.status === s).length
  const overdue = orders.filter(isOverdue).length
  const toggle = (s: OrderStatus | 'overdue') => setStatus((cur) => (cur === s ? null : s))

  return (
    <>
      <Toolbar>
        <SearchInput value={query} onChange={setQuery} placeholder="Order no., patient or phone" className="w-full sm:w-72" />
        <div className="flex flex-wrap gap-2">
          {FILTERS.map((s) => (
            <Chip key={s} active={status === s} onClick={() => toggle(s)} count={count(s)}>
              {ORDER_STATUS[s].label}
            </Chip>
          ))}
          {overdue > 0 && (
            <Chip active={status === 'overdue'} onClick={() => toggle('overdue')} count={overdue} icon={I.alert}>
              Overdue
            </Chip>
          )}
        </div>
      </Toolbar>

      <Card>
        {rows.length ? (
          <>
            <Table>
              <THead>
                <TH>No.</TH>
                <TH>Patient</TH>
                <TH>Tests</TH>
                <TH>Performed by</TH>
                <TH>Status</TH>
                <TH>Due</TH>
                <TH align="right">Amount</TH>
              </THead>
              <tbody>
                {rows.map((o) => {
                  const c = clients.find((x) => x.id === o.clientId)
                  const first = testById(tests, o.testIds[0])
                  const meta = ORDER_STATUS[o.status]
                  return (
                    <TR key={o.id} onClick={() => openOrder(o.id)}>
                      <TD muted className="tabular">
                        {o.no}
                      </TD>
                      <TD>
                        <span className="flex items-center gap-2.5">
                          <Avatar name={c?.name ?? '?'} size="sm" />
                          <span className="min-w-0">
                            <span className="block truncate">{c?.name}</span>
                            <span className="block text-sm text-muted tabular">{c ? formatPhone(c.phone) : ''}</span>
                          </span>
                        </span>
                      </TD>
                      <TD>
                        <span className="flex items-center gap-1.5 whitespace-nowrap">
                          <span className="max-w-56 truncate">{first?.name}</span>
                          {o.testIds.length > 1 && <span className="text-sm text-faint">+{o.testIds.length - 1}</span>}
                        </span>
                        <span className="block max-w-64 truncate text-sm text-muted">{o.biomaterials.join(', ')}</span>
                      </TD>
                      <TD muted className="whitespace-nowrap">
                        {whereLabel(o.where)}
                      </TD>
                      <TD>
                        <Badge tone={meta.tone} dot>
                          {meta.label}
                        </Badge>
                      </TD>
                      <TD className="text-sm whitespace-nowrap">
                        <DueCell order={o} />
                      </TD>
                      <TD align="right">
                        <span className="flex flex-col items-end">
                          <Money value={orderAmount(tests, o)} />
                          {!o.paid && <span className={cn('text-xs text-negative')}>Unpaid</span>}
                        </span>
                      </TD>
                    </TR>
                  )
                })}
              </tbody>
            </Table>
            <TableFooter>
              <span>{plural(rows.length, 'order')}</span>
            </TableFooter>
          </>
        ) : (
          <EmptyState icon={I.lab} title="No orders match" description="Try another status or search by order number, name or the last digits of a phone.">
            <Button
              variant="secondary"
              onClick={() => {
                setQuery('')
                setStatus(null)
              }}
            >
              Clear filters
            </Button>
          </EmptyState>
        )}
      </Card>
    </>
  )
}
