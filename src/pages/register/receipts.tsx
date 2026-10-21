import { useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router'
import { toast } from 'sonner'
import { I, Icon } from '@/components/icons'
import { Avatar } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button, IconButton } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Checkbox, Chip } from '@/components/ui/controls'
import { DetailRow, Modal, Sheet } from '@/components/ui/dialog'
import { Field } from '@/components/ui/input'
import { Menu, MenuItem } from '@/components/ui/menu'
import { EmptyState, Money } from '@/components/ui/misc'
import { Toolbar } from '@/components/ui/page'
import { Select } from '@/components/ui/select'
import { TD, TH, THead, TR, Table, TableFooter } from '@/components/ui/table'
import { Segmented } from '@/components/ui/tabs'
import { PAYMENT_METHODS } from '@/data/business'
import { staffById } from '@/data/staff'
import { CURRENCY, formatDayTime, formatMoney, formatTime, plural } from '@/lib/format'
import { useOverlays } from '@/lib/overlays'
import { useData, usePrefs } from '@/lib/store'
import { NOW, TODAY, addDays, isSameDay } from '@/lib/time'
import { RECEIPT_STATUS, type Receipt, type ReceiptStatus } from './data'
import { useRegister } from './store'

const methodName = (id: string) => PAYMENT_METHODS.find((m) => m.id === id)?.name ?? id
export const methodsLabel = (r: Receipt) => r.payments.map((p) => methodName(p.method)).join(' + ')

type Period = 'today' | 'yesterday' | 'week'
const PERIODS: { value: Period; label: string }[] = [
  { value: 'today', label: 'Today' },
  { value: 'yesterday', label: 'Yesterday' },
  { value: 'week', label: 'Last 7 days' },
]

function inPeriod(r: Receipt, p: Period) {
  if (p === 'today') return isSameDay(r.at, NOW)
  if (p === 'yesterday') return isSameDay(r.at, addDays(NOW, -1))
  return r.at >= addDays(TODAY, -6)
}

function summary(r: Receipt) {
  const first = r.lines[0]?.name ?? '—'
  return r.lines.length > 1 ? `${first} + ${r.lines.length - 1} more` : first
}

function RefundModal({ receipt, open, onClose }: { receipt: Receipt; open: boolean; onClose: () => void }) {
  const updateReceipt = useRegister((s) => s.updateReceipt)
  const hidden = usePrefs((s) => s.hideAmounts)
  const [mode, setMode] = useState<'full' | 'partial'>('full')
  const [picked, setPicked] = useState<string[]>([])
  const [reason, setReason] = useState('unhappy')
  const amount = mode === 'full' ? receipt.total - receipt.refunded : receipt.lines.filter((l) => picked.includes(l.id)).reduce((m, l) => m + l.price * l.qty, 0)

  return (
    <Modal
      open={open}
      onOpenChange={(o) => !o && onClose()}
      title={`Refund receipt #${receipt.no}`}
      description={`Money goes back the way it was paid: ${methodsLabel(receipt)}.`}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="danger"
            disabled={amount <= 0}
            onClick={() => {
              const refunded = receipt.refunded + amount
              updateReceipt(receipt.id, { refunded, status: refunded >= receipt.total ? 'refund' : 'partial_refund' })
              onClose()
              toast.success(`Refunded ${formatMoney(amount)}`, { description: `Receipt #${receipt.no}. A refund receipt was sent to the tax service.` })
            }}
          >
            {hidden ? 'Refund' : `Refund ${formatMoney(amount)}`}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <Segmented
          fill
          value={mode}
          onChange={setMode}
          items={[
            { value: 'full', label: 'Full refund' },
            { value: 'partial', label: 'Some items' },
          ]}
        />
        {mode === 'partial' && (
          <div className="flex flex-col gap-1 rounded-xl bg-fill p-2">
            {receipt.lines.map((l) => (
              <label key={l.id} className="flex cursor-pointer items-center gap-3 rounded-lg px-2 py-2 hover:bg-fill-hover">
                <Checkbox checked={picked.includes(l.id)} onChange={(v) => setPicked((p) => (v ? [...p, l.id] : p.filter((x) => x !== l.id)))} />
                <span className="flex-1 text-base text-fg">{l.name}</span>
                <Money value={l.price * l.qty} />
              </label>
            ))}
          </div>
        )}
        <Field label="Reason">
          <Select
            value={reason}
            onChange={setReason}
            options={[
              { value: 'unhappy', label: 'Client is unhappy with the result' },
              { value: 'wrong', label: 'Wrong item or price' },
              { value: 'duplicate', label: 'Charged twice' },
              { value: 'product', label: 'Product returned' },
              { value: 'other', label: 'Other' },
            ]}
          />
        </Field>
      </div>
    </Modal>
  )
}

export function ReceiptSheet({ receiptId, onClose }: { receiptId: string | null; onClose: () => void }) {
  const receipt = useRegister((s) => s.receipts.find((r) => r.id === receiptId))
  const updateReceipt = useRegister((s) => s.updateReceipt)
  const client = useData((s) => s.clients.find((c) => c.id === receipt?.clientId))
  const openClient = useOverlays((s) => s.openClient)
  const [refund, setRefund] = useState(false)
  const [refundKey, setRefundKey] = useState(0)
  const startRefund = () => {
    setRefundKey((k) => k + 1)
    setRefund(true)
  }
  const [voiding, setVoiding] = useState(false)
  // Keep showing the last receipt while the sheet slides out.
  const kept = useRef<Receipt | undefined>(undefined)
  if (receipt) kept.current = receipt
  const last = receipt ?? kept.current
  if (!last) return null
  const masters = [...new Set(last.lines.map((l) => l.staffId).filter(Boolean))] as string[]
  const meta = RECEIPT_STATUS[last.status]
  const canRefund = last.status === 'paid' || last.status === 'partial_refund'
  const canVoid = last.status === 'paid' && isSameDay(last.at, NOW)

  return (
    <>
      <Sheet
        open={!!receipt}
        onOpenChange={(o) => !o && onClose()}
        eyebrow="Receipt"
        title={`#${last.no}`}
        actions={
          canVoid && (
            <Menu align="end" trigger={<IconButton icon={I.more} label="More actions" size="sm" tooltip={false} />}>
              <MenuItem icon={I.cancelCircle} danger onClick={() => setVoiding(true)}>
                Void receipt
              </MenuItem>
            </Menu>
          )
        }
        footer={
          <>
            <Button icon={I.print} onClick={() => toast(`Printing receipt #${last.no}`)}>
              Print
            </Button>
            <Button
              icon={client?.telegram ? I.telegram : I.message}
              onClick={() => toast.success(client ? `Sent to ${client.firstName}${client.telegram ? ' in Telegram' : ' by SMS'}` : 'Receipt link copied')}
            >
              {client ? 'Send to client' : 'Copy link'}
            </Button>
            {canRefund && (
              <Button variant="ghost" className="ml-auto" onClick={startRefund}>
                Refund
              </Button>
            )}
          </>
        }
      >
        <div className="px-5 pt-5 pb-4">
          <div className="flex items-center gap-2">
            <Badge tone={meta.tone}>
              {meta.label}
            </Badge>
            <span className="text-sm text-muted">{formatDayTime(last.at)}</span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <Money value={last.total} currency={false} className="text-4xl font-normal text-fg" />
            <span className="text-base text-faint">{CURRENCY}</span>
          </div>
          {last.refunded > 0 && (
            <div className="mt-1 text-sm text-muted">
              <Money value={last.refunded} /> refunded
            </div>
          )}
          {last.owed > 0 && (
            <div className="mt-1 text-sm text-negative">
              <Money value={last.owed} /> still owed by the client
            </div>
          )}
        </div>

        <div className="mx-5 rounded-2xl ring-1 ring-border">
          {last.lines.map((l) => (
            <div key={l.id} className="flex items-center gap-3 border-b border-border px-4 py-3 last:border-b-0">
              <div className="min-w-0 flex-1">
                <div className="truncate text-base text-fg">
                  {l.name}
                  {l.qty > 1 && <span className="text-muted"> × {l.qty}</span>}
                </div>
                {l.staffId && <div className="text-sm text-muted">{staffById[l.staffId].name}</div>}
              </div>
              <Money value={l.price * l.qty} />
            </div>
          ))}
          {(last.discount > 0 || last.bonusesUsed > 0) && (
            <div className="flex flex-col gap-1 border-t border-border px-4 py-3 text-sm">
              {last.discount > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted">Discount</span>
                  <Money value={-last.discount} />
                </div>
              )}
              {last.bonusesUsed > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted">Paid with bonuses</span>
                  <Money value={-last.bonusesUsed} />
                </div>
              )}
            </div>
          )}
        </div>

        <div className="px-5 py-3">
          <DetailRow label="Client">
            {client ? (
              <button type="button" onClick={() => openClient(client.id)} className="text-fg hover:underline underline-offset-4">
                {client.name}
              </button>
            ) : (
              <span className="text-muted">Walk-in</span>
            )}
          </DetailRow>
          {masters.length > 0 && (
            <DetailRow label={masters.length > 1 ? 'Masters' : 'Master'}>
              <span className="inline-flex items-center gap-2">
                {masters.map((id) => (
                  <span key={id} className="inline-flex items-center gap-1.5">
                    <Avatar name={staffById[id].name} color={staffById[id].color} size="xs" />
                    {staffById[id].name.split(' ')[0]}
                  </span>
                ))}
              </span>
            </DetailRow>
          )}
          <DetailRow label="Paid with">
            <span className="flex flex-col items-end">
              {last.payments.map((p, i) => (
                <span key={i}>
                  {methodName(p.method)} · <Money value={p.amount} />
                </span>
              ))}
            </span>
          </DetailRow>
          <DetailRow label="Cashier">{last.cashier}</DetailRow>
          <DetailRow label="Fiscal receipt">
            {last.fiscal ? (
              <span className="inline-flex items-center gap-1.5">
                <Icon icon={I.checkCircle} size={14} className="text-positive" />
                <span className="tabular">{last.fiscal}</span>
              </span>
            ) : (
              <span className="text-muted">Not required</span>
            )}
          </DetailRow>
        </div>
      </Sheet>
      {receipt && <RefundModal key={`${receipt.id}_${refundKey}`} receipt={receipt} open={refund} onClose={() => setRefund(false)} />}
      <Modal
        open={voiding}
        onOpenChange={setVoiding}
        title={`Void receipt #${last.no}?`}
        description="Use this for a receipt rung up by mistake today. It stays in the history, marked as voided, and isn’t counted in revenue."
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setVoiding(false)}>
              Keep receipt
            </Button>
            <Button
              variant="danger"
              onClick={() => {
                updateReceipt(last.id, { status: 'voided' })
                setVoiding(false)
                toast(`Receipt #${last.no} voided`, { action: { label: 'Undo', onClick: () => updateReceipt(last.id, { status: 'paid' }) } })
              }}
            >
              Void receipt
            </Button>
          </>
        }
      />
    </>
  )
}

export function Receipts() {
  const receipts = useRegister((s) => s.receipts)
  const clients = useData((s) => s.clients)
  const navigate = useNavigate()
  const [status, setStatus] = useState<ReceiptStatus | 'all'>('all')
  const [period, setPeriod] = useState<Period>('today')
  const [openId, setOpenId] = useState<string | null>(null)
  const [limit, setLimit] = useState(40)

  const inRange = useMemo(() => receipts.filter((r) => inPeriod(r, period)), [receipts, period])
  const list = inRange.filter((r) => status === 'all' || r.status === status)
  const count = (s: ReceiptStatus) => inRange.filter((r) => r.status === s).length
  const total = list.filter((r) => r.status !== 'voided').reduce((m, r) => m + r.total - r.refunded, 0)
  const clientName = (id: string | null) => (id ? clients.find((c) => c.id === id)?.name : null)

  return (
    <>
      <Toolbar>
        <Chip active={status === 'all'} onClick={() => setStatus('all')} count={inRange.length}>
          All
        </Chip>
        {(Object.keys(RECEIPT_STATUS) as ReceiptStatus[]).map((s) => (
          <Chip key={s} active={status === s} onClick={() => setStatus(s)} count={count(s)}>
            {RECEIPT_STATUS[s].label}
          </Chip>
        ))}
        <div className="ml-auto">
          <Select look="pill" value={period} onChange={setPeriod} options={PERIODS} align="end" />
        </div>
      </Toolbar>

      <Card>
        {list.length ? (
          <>
            <Table>
              <THead>
                <TH>No.</TH>
                <TH>Time</TH>
                <TH>Client</TH>
                <TH>Items</TH>
                <TH>Paid with</TH>
                <TH>Status</TH>
                <TH align="right">Amount</TH>
              </THead>
              <tbody>
                {list.slice(0, limit).map((r) => {
                  const meta = RECEIPT_STATUS[r.status]
                  return (
                    <TR key={r.id} onClick={() => setOpenId(r.id)} selected={openId === r.id}>
                      <TD className="tabular text-muted">#{r.no}</TD>
                      <TD className="whitespace-nowrap tabular" muted>
                        {period === 'today' ? formatTime(r.at) : formatDayTime(r.at)}
                      </TD>
                      <TD>{clientName(r.clientId) ?? <span className="text-muted">Walk-in</span>}</TD>
                      <TD muted className="max-w-[280px] truncate">
                        {summary(r)}
                      </TD>
                      <TD muted className="whitespace-nowrap">
                        {methodsLabel(r)}
                      </TD>
                      <TD>
                        <Badge tone={meta.tone}>{meta.label}</Badge>
                      </TD>
                      <TD align="right">
                        <Money value={r.total} className={r.status === 'voided' || r.status === 'refund' ? 'text-faint line-through' : ''} />
                      </TD>
                    </TR>
                  )
                })}
              </tbody>
            </Table>
            <TableFooter>
              <span>
                {plural(list.length, 'receipt')} · <Money value={total} className="text-fg" /> net
              </span>
              {list.length > limit && (
                <Button size="sm" variant="ghost" onClick={() => setLimit((l) => l + 40)}>
                  Show more
                </Button>
              )}
            </TableFooter>
          </>
        ) : (
          <EmptyState icon={I.receipt} title="No receipts here" description="Receipts appear as soon as you charge a client.">
            <Button variant="secondary" onClick={() => navigate('/pos')}>
              Go to sale
            </Button>
          </EmptyState>
        )}
      </Card>
      <ReceiptSheet receiptId={openId} onClose={() => setOpenId(null)} />
    </>
  )
}
