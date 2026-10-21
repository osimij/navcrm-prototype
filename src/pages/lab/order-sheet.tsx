import { useRef } from 'react'
import { useNavigate } from 'react-router'
import { toast } from 'sonner'
import { ClientRow } from '@/components/client-picker'
import { I, Icon } from '@/components/icons'
import { Badge } from '@/components/ui/badge'
import { Button, IconButton } from '@/components/ui/button'
import { DetailRow, Sheet } from '@/components/ui/dialog'
import { fieldBase } from '@/components/ui/input'
import { Menu, MenuItem, MenuSeparator } from '@/components/ui/menu'
import { Money } from '@/components/ui/misc'
import { Select } from '@/components/ui/select'
import type { Client } from '@/data/clients'
import { cn } from '@/lib/cn'
import { formatDayTime, plural } from '@/lib/format'
import { useOverlays } from '@/lib/overlays'
import { useData } from '@/lib/store'
import { NOW } from '@/lib/time'
import {
  OWN_LAB,
  ORDER_STATUS,
  doctorLabel,
  flagFor,
  formatRange,
  indicatorsFor,
  orderAmount,
  rangeFor,
  testById,
  whereLabel,
  type Flag,
  type Indicator,
  type LabOrder,
} from './data'
import { dueText, isOverdue } from './orders'
import { useLab } from './store'

function Timeline({ order }: { order: LabOrder }) {
  const partner = order.where !== OWN_LAB
  const order_ = ['awaiting', 'sample_taken', partner ? 'sent_partner' : 'in_progress', 'ready', 'sent']
  // Partner orders skip "sample taken": they leave for the partner as soon as the sample is drawn.
  const reached = order_.indexOf(order.status === 'sample_taken' && partner ? 'sample_taken' : order.status)
  const steps = [
    { label: 'Order created', at: order.createdAt },
    { label: 'Sample taken', at: order.sampleAt },
    { label: partner ? `At ${whereLabel(order.where)}` : 'Analysis in progress', at: undefined },
    { label: 'Results ready', at: order.readyAt, expected: order.due },
    { label: 'Sent to patient', at: order.sentAt },
  ]
  return (
    <ol className="relative">
      {steps.map((s, i) => {
        const done = i <= reached
        const current = i === reached + 1
        const last = i === steps.length - 1
        return (
          <li key={s.label} className="relative flex gap-3 pb-4 last:pb-0">
            {!last && (
              <span className={cn('absolute top-4 left-[7px] h-[calc(100%-12px)] w-px', i < reached ? 'bg-fg' : 'bg-border-strong')} />
            )}
            <span
              className={cn(
                'relative mt-0.5 size-[15px] shrink-0 rounded-full',
                done ? 'bg-fg' : current ? 'bg-surface ring-2 ring-inset ring-accent' : 'bg-surface ring-1 ring-inset ring-border-strong',
              )}
            />
            <span className="flex min-w-0 flex-1 items-baseline justify-between gap-3">
              <span className={cn('text-base', done ? 'text-fg' : 'text-muted')}>{s.label}</span>
              <span className="shrink-0 text-sm text-faint tabular">
                {done && s.at ? formatDayTime(s.at) : !done && s.expected ? `Expected ${dueText(s.expected, true)}` : ''}
              </span>
            </span>
          </li>
        )
      })}
    </ol>
  )
}

function FlagBadge({ flag, value }: { flag: Flag; value: string }) {
  if (!flag) return null
  if (flag === 'abnormal') return <Badge tone="negative">{value}</Badge>
  return <Badge tone={flag === 'high' ? 'negative' : 'warning'}>{flag === 'high' ? 'High' : 'Low'}</Badge>
}

function ResultRow({
  i,
  value,
  client,
  editable,
  onChange,
}: {
  i: Indicator & { testName: string }
  value: string
  client?: Client
  editable: boolean
  onChange: (v: string) => void
}) {
  const flag = flagFor(i, value, client)
  return (
    <tr className="border-b border-border last:border-b-0">
      <td className="py-2.5 pr-3 align-middle">
        <span className="block text-base text-fg">{i.name}</span>
        {i.testName !== i.name && <span className="block text-xs text-faint">{i.testName}</span>}
      </td>
      <td className="py-2.5 pr-3 align-middle">
        {editable ? (
          i.qualitative ? (
            <Select value={value || null} onChange={onChange} placeholder="Result" options={i.qualitative.options.map((o) => ({ value: o, label: o }))} className="h-8 w-36" />
          ) : (
            <input
              value={value}
              onChange={(e) => onChange(e.target.value.replace(/[^\d.,]/g, ''))}
              inputMode="decimal"
              placeholder="—"
              aria-label={`${i.name} value`}
              className={cn(fieldBase, 'h-8 w-24 px-2.5 text-right tabular', flag && 'text-negative')}
            />
          )
        ) : (
          <span className={cn('tabular', flag ? 'font-medium text-negative' : 'text-fg')}>{value || '—'}</span>
        )}
      </td>
      <td className="py-2.5 pr-3 align-middle text-sm text-muted">{i.unit}</td>
      <td className="py-2.5 pr-3 align-middle text-sm text-muted tabular">{formatRange(i, rangeFor(i, client))}</td>
      <td className="w-20 py-2.5 text-right align-middle">
        <FlagBadge flag={flag} value={value} />
      </td>
    </tr>
  )
}

export function OrderSheet() {
  const orderId = useLab((s) => s.orderId)
  const openOrder = useLab((s) => s.openOrder)
  const current = useLab((s) => s.orders.find((o) => o.id === orderId))
  // Keep showing the last order while the sheet animates closed.
  const last = useRef(current)
  if (current) last.current = current
  const order = current ?? last.current
  const tests = useLab((s) => s.tests)
  const templates = useLab((s) => s.templates)
  const setStatus = useLab((s) => s.setStatus)
  const setResult = useLab((s) => s.setResult)
  const client = useData((s) => s.clients.find((c) => c.id === order?.clientId))
  const openClient = useOverlays((s) => s.openClient)
  const navigate = useNavigate()

  const close = () => openOrder(null)
  if (!order) return null

  const partner = order.where !== OWN_LAB
  const indicators = indicatorsFor(tests, templates, order.testIds)
  const filled = indicators.filter((i) => order.results[i.id]?.trim()).length
  const abnormal = indicators.filter((i) => flagFor(i, order.results[i.id] ?? '', client)).length
  const showResults = order.status === 'in_progress' || order.status === 'ready' || order.status === 'sent'
  const editable = order.status === 'in_progress' || order.status === 'ready'
  const prep = [...new Set(order.testIds.map((id) => testById(tests, id)?.prep).filter(Boolean))] as string[]
  const channel = client?.telegram ? 'Telegram' : 'SMS'

  let footer: React.ReactNode
  if (order.status === 'awaiting') {
    footer = (
      <>
        <Button variant="ghost" icon={I.print} onClick={() => toast.success('Tube labels sent to the printer')}>
          Print labels
        </Button>
        <Button
          variant="primary"
          className="ml-auto"
          onClick={() => {
            if (partner) {
              setStatus(order.id, 'sent_partner', { sampleAt: NOW })
              toast.success(`Order sent to ${whereLabel(order.where)}`, { description: 'Results will come back into this order automatically.' })
            } else {
              setStatus(order.id, 'sample_taken', { sampleAt: NOW })
              toast.success('Sample taken')
            }
          }}
        >
          Mark sample taken
        </Button>
      </>
    )
  } else if (order.status === 'sample_taken') {
    footer = (
      <Button variant="primary" className="ml-auto" onClick={() => setStatus(order.id, 'in_progress')}>
        Start analysis
      </Button>
    )
  } else if (order.status === 'in_progress') {
    footer = (
      <>
        <span className="mr-auto text-sm text-muted tabular">
          {filled} of {indicators.length} values entered
        </span>
        <Button
          variant="primary"
          disabled={filled < indicators.length}
          onClick={() => {
            setStatus(order.id, 'ready', { readyAt: NOW })
            toast.success('Results are ready', { description: abnormal ? `${plural(abnormal, 'value')} outside the reference range` : 'All values within range' })
          }}
        >
          Mark results ready
        </Button>
      </>
    )
  } else if (order.status === 'sent_partner') {
    footer = (
      <span className="text-sm text-muted">
        Waiting for {whereLabel(order.where)}. Results arrive here automatically and the patient is notified.
      </span>
    )
  } else if (order.status === 'ready') {
    footer = (
      <>
        <Button variant="ghost" icon={I.print} onClick={() => toast.success('Results sent to the printer')}>
          Print
        </Button>
        <Button
          variant="primary"
          icon={client?.telegram ? I.telegram : I.message}
          className="ml-auto"
          onClick={() => {
            setStatus(order.id, 'sent', { sentAt: NOW })
            toast.success(`Results sent to ${client?.firstName} in ${channel}`, { description: 'A PDF with the doctor’s contact is attached.' })
          }}
        >
          Send to patient in {channel}
        </Button>
      </>
    )
  } else {
    footer = (
      <>
        <span className="mr-auto text-sm text-muted">Sent {order.sentAt ? dueText(order.sentAt, true) : ''} in {channel}</span>
        <Button variant="ghost" icon={I.print} onClick={() => toast.success('Results sent to the printer')}>
          Print
        </Button>
        <Button onClick={() => toast.success(`Results sent again to ${client?.firstName}`)}>Resend</Button>
      </>
    )
  }

  return (
    <Sheet
      open={!!current}
      onOpenChange={(o) => !o && close()}
      eyebrow={`Lab order ${order.no}`}
      title={client?.name}
      width="xl"
      actions={
        <Menu
          align="end"
          trigger={<IconButton icon={I.more} label="More actions" size="sm" tooltip={false} />}
        >
          <MenuItem icon={I.print} onClick={() => toast.success('Referral sent to the printer')}>
            Print referral
          </MenuItem>
          <MenuItem icon={I.link} onClick={() => toast.success('Results link copied')}>
            Copy results link
          </MenuItem>
          <MenuSeparator />
          <MenuItem
            icon={I.user}
            onClick={() => {
              close()
              if (client) openClient(client.id)
            }}
          >
            Open patient profile
          </MenuItem>
        </Menu>
      }
      footer={footer}
    >
      <div className="flex flex-col gap-6 px-5 py-5">
        <div className="flex items-center justify-between gap-3">
          {client && <ClientRow client={client} />}
          <div className="flex items-center gap-2">
            {isOverdue(order) && <Badge tone="negative">Overdue</Badge>}
            <Badge tone={ORDER_STATUS[order.status].tone} dot>
              {ORDER_STATUS[order.status].label}
            </Badge>
          </div>
        </div>

        <Timeline order={order} />

        {showResults && (
          <section>
            <div className="mb-2 flex items-center justify-between gap-3">
              <h3 className="text-base font-medium text-fg">Results</h3>
              {abnormal > 0 ? (
                <span className="flex items-center gap-1.5 text-sm text-negative">
                  <Icon icon={I.alert} size={15} />
                  {plural(abnormal, 'value')} outside the reference range
                </span>
              ) : filled === indicators.length ? (
                <span className="text-sm text-positive">All values within range</span>
              ) : null}
            </div>
            <div className="rounded-xl ring-1 ring-border">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-border text-xs text-faint">
                    <th className="py-2 pr-3 pl-4 font-medium">Indicator</th>
                    <th className="py-2 pr-3 font-medium">Value</th>
                    <th className="py-2 pr-3 font-medium">Unit</th>
                    <th className="py-2 pr-3 font-medium">Reference</th>
                    <th className="py-2 pr-4" />
                  </tr>
                </thead>
                <tbody className="[&_td:first-child]:pl-4 [&_td:last-child]:pr-4">
                  {indicators.map((i) => (
                    <ResultRow
                      key={i.id}
                      i={i}
                      value={order.results[i.id] ?? ''}
                      client={client}
                      editable={editable}
                      onChange={(v) => setResult(order.id, i.id, v)}
                    />
                  ))}
                </tbody>
              </table>
            </div>
            {client && <p className="mt-2 text-xs text-faint">Reference ranges for {client.gender === 'male' ? 'men' : 'women'}, adults.</p>}
          </section>
        )}

        {order.status === 'sent_partner' && (
          <div className="flex items-start gap-3 rounded-xl bg-fill px-4 py-3">
            <Icon icon={I.hourglass} size={18} className="mt-0.5 text-muted" />
            <p className="text-base text-muted">
              Sample is at <span className="text-fg">{whereLabel(order.where)}</span>. Results are expected{' '}
              <span className="text-fg">{dueText(order.due, true)}</span>.
            </p>
          </div>
        )}

        {order.status === 'awaiting' && prep.length > 0 && (
          <section className="rounded-xl bg-fill px-4 py-3">
            <h3 className="mb-1 text-sm font-medium text-fg">Check with the patient before the sample</h3>
            <ul className="flex flex-col gap-1 text-base text-muted">
              {prep.map((p) => (
                <li key={p} className="flex gap-2">
                  <Icon icon={I.info} size={16} className="mt-0.5 shrink-0 text-faint" />
                  {p}
                </li>
              ))}
            </ul>
          </section>
        )}

        <section>
          <h3 className="mb-1 text-base font-medium text-fg">Tests</h3>
          <ul>
            {order.testIds.map((id) => {
              const t = testById(tests, id)
              if (!t) return null
              return (
                <li key={id} className="flex items-start justify-between gap-4 border-b border-border py-2.5">
                  <span className="min-w-0">
                    <span className="block text-base text-fg">{t.name}</span>
                    <span className="block text-sm text-muted">
                      {t.kind === 'package'
                        ? (t.includes ?? []).map((x) => testById(tests, x)?.name).join(', ')
                        : `${t.code} · ${t.biomaterial}`}
                    </span>
                  </span>
                  <Money value={t.price} className="shrink-0" />
                </li>
              )
            })}
          </ul>
          <div className="flex items-center justify-between pt-3 text-base">
            <span className="flex items-center gap-2 text-muted">
              Total
              {order.paid ? <Badge tone="positive">Paid</Badge> : <Badge tone="negative">Unpaid</Badge>}
            </span>
            <Money value={orderAmount(tests, order)} className="text-lg" />
          </div>
        </section>

        <section>
          <h3 className="mb-1 text-base font-medium text-fg">Details</h3>
          <div className="divide-y divide-border">
            <DetailRow label="Ordered by">{doctorLabel(order.doctor)}</DetailRow>
            <DetailRow label="Performed by">{whereLabel(order.where)}</DetailRow>
            <DetailRow label="Biomaterial">{order.biomaterials.join(', ')}</DetailRow>
            <DetailRow label="Created">
              {formatDayTime(order.createdAt)}
              {order.fromVisit && <span className="text-muted"> · from a visit</span>}
            </DetailRow>
            {order.comment && <DetailRow label="Comment">{order.comment}</DetailRow>}
            {!order.paid && (
              <DetailRow label="Payment">
                <button
                  type="button"
                  onClick={() => navigate(`/pos?client=${order.clientId}`)}
                  className="text-sm font-medium text-accent-fg hover:underline underline-offset-4"
                >
                  Take payment at the register
                </button>
              </DetailRow>
            )}
          </div>
        </section>
      </div>
    </Sheet>
  )
}
