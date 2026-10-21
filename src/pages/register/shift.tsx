import { useState } from 'react'
import { Link } from 'react-router'
import { toast } from 'sonner'
import { I, Icon } from '@/components/icons'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, SectionTitle } from '@/components/ui/card'
import { Modal } from '@/components/ui/dialog'
import { Field, Input, Textarea } from '@/components/ui/input'
import { Figure, Money } from '@/components/ui/misc'
import { TD, TH, THead, TR, Table } from '@/components/ui/table'
import { Segmented } from '@/components/ui/tabs'
import { PAYMENT_METHODS } from '@/data/business'
import { CURRENCY, formatDate, formatMoney, formatNumber, formatTime } from '@/lib/format'
import { usePrefs } from '@/lib/store'
import { NOW, TODAY, isSameDay } from '@/lib/time'
import { drawerSummary, useRegister } from './store'

const NOTES = [500, 200, 100, 50, 20, 10, 5, 3, 1]

function Row({ label, children, sub }: { label: React.ReactNode; children: React.ReactNode; sub?: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-6 py-3">
      <div>
        <div className="text-base text-muted">{label}</div>
        {sub && <div className="mt-0.5 text-sm text-faint">{sub}</div>}
      </div>
      <div className="text-right text-base text-fg tabular">{children}</div>
    </div>
  )
}

function Difference({ value }: { value: number }) {
  if (value === 0) return <Badge tone="positive">Matches</Badge>
  return (
    <Badge tone={value < 0 ? 'negative' : 'warning'}>
      {value < 0 ? 'Short' : 'Over'} <Money value={Math.abs(value)} currency={false} />
    </Badge>
  )
}

function CloseShiftModal({ open, onClose, expected }: { open: boolean; onClose: () => void; expected: number }) {
  const closeShift = useRegister((s) => s.closeShift)
  const shift = useRegister((s) => s.shift)
  const hidden = usePrefs((s) => s.hideAmounts)
  const [mode, setMode] = useState<'total' | 'notes'>('notes')
  const [total, setTotal] = useState('')
  const [counts, setCounts] = useState<Record<number, string>>({})
  const [comment, setComment] = useState('')

  const counted = mode === 'total' ? Number(total) || 0 : NOTES.reduce((m, n) => m + n * (Number(counts[n]) || 0), 0)
  const entered = mode === 'total' ? total !== '' : Object.values(counts).some((v) => v !== '')
  const diff = counted - expected

  return (
    <Modal
      open={open}
      onOpenChange={(o) => !o && onClose()}
      title="Close shift"
      description="Count the cash in the drawer. Card and QR payments are already reconciled by the bank."
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            disabled={!entered}
            onClick={() => {
              closeShift({
                id: `sh_${Date.now()}`,
                date: TODAY,
                openedAt: shift.openedAt,
                closedAt: formatTime(NOW),
                by: 'Zarina Karimova',
                expected,
                counted,
                comment: comment || undefined,
              })
              onClose()
              toast.success('Shift closed', { description: 'The shift report was sent to your Telegram.' })
            }}
          >
            Close shift
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
            { value: 'notes', label: 'Count by notes' },
            { value: 'total', label: 'Enter the total' },
          ]}
        />
        {mode === 'notes' ? (
          <div className="grid grid-cols-3 gap-2">
            {NOTES.map((n) => (
              <label key={n} className="flex items-center gap-2 rounded-xl bg-fill py-1.5 pr-1.5 pl-3">
                <span className="w-9 text-sm text-muted tabular">{n}</span>
                <span className="text-xs text-faint">×</span>
                <input
                  value={counts[n] ?? ''}
                  onChange={(e) => setCounts((c) => ({ ...c, [n]: e.target.value.replace(/\D/g, '') }))}
                  inputMode="numeric"
                  placeholder="0"
                  aria-label={`${n} somoni notes`}
                  className="h-8 w-full min-w-0 rounded-lg bg-surface px-2 text-right text-base text-fg tabular ring-1 ring-inset ring-border outline-none focus:ring-accent"
                />
              </label>
            ))}
          </div>
        ) : (
          <Field label="Cash in the drawer">
            <Input value={total} onChange={(e) => setTotal(e.target.value.replace(/\D/g, ''))} inputMode="numeric" suffix={CURRENCY} size="lg" autoFocus />
          </Field>
        )}
        <div className="rounded-xl ring-1 ring-border">
          <div className="flex items-center justify-between border-b border-border px-4 py-3 text-base">
            <span className="text-muted">Expected</span>
            <Money value={expected} />
          </div>
          <div className="flex items-center justify-between border-b border-border px-4 py-3 text-base">
            <span className="text-muted">Counted</span>
            <span className="tabular">{hidden ? '••••' : formatMoney(counted)}</span>
          </div>
          <div className="flex items-center justify-between px-4 py-3 text-base">
            <span className="font-medium text-fg">Difference</span>
            {entered ? <Difference value={diff} /> : <span className="text-faint">—</span>}
          </div>
        </div>
        {entered && diff !== 0 && (
          <Field label="What happened?" optional hint="Shows in the cash report next to this shift.">
            <Textarea value={comment} onChange={(e) => setComment(e.target.value)} placeholder="e.g. Gave change twice to one client" />
          </Field>
        )}
      </div>
    </Modal>
  )
}

export function ShiftTab() {
  const { shift, receipts, expenses, shifts, openShift } = useRegister()
  const s = drawerSummary(receipts, expenses, shift)
  const [closing, setClosing] = useState(false)
  const [formKey, setFormKey] = useState(0)
  const [float, setFloat] = useState('500')

  const today = receipts.filter((r) => isSameDay(r.at, NOW) && r.status !== 'voided')
  const byMethod = PAYMENT_METHODS.filter((m) => m.id !== 'cash')
    .map((m) => ({ ...m, amount: today.reduce((sum, r) => sum + r.payments.filter((p) => p.method === m.id).reduce((x, p) => x + p.amount, 0), 0) }))
    .filter((m) => m.amount > 0)
    .sort((a, b) => b.amount - a.amount)

  return (
    <>
      {shift.open ? (
        <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
          <Card>
            <CardHeader
              title="Current shift"
              description={`Opened today at ${shift.openedAt} by ${shift.openedBy}`}
              action={
                <Button
                  variant="primary"
                  onClick={() => {
                    setFormKey((k) => k + 1)
                    setClosing(true)
                  }}
                >
                  Close shift
                </Button>
              }
            />
            <div className="px-5 pb-5">
              <div className="mt-2 mb-4 flex items-baseline gap-2">
                <Figure value={s.expected} money className="text-5xl font-normal text-fg" />
                <span className="text-base text-faint">{CURRENCY} expected in the drawer</span>
              </div>
              <div className="divide-y divide-border border-t border-border">
                <Row label="Opening cash">
                  <Money value={shift.float} />
                </Row>
                <Row label="Cash sales" sub={`${s.receiptsCount} receipts today`}>
                  <Money value={s.cashSales} sign />
                </Row>
                {s.cashRefunds > 0 && (
                  <Row label="Cash refunds">
                    <Money value={-s.cashRefunds} />
                  </Row>
                )}
                <Row
                  label="Cash expenses"
                  sub={
                    <Link to="/pos/expenses" className="hover:text-fg hover:underline underline-offset-4">
                      See expenses
                    </Link>
                  }
                >
                  <Money value={-s.cashExpenses} />
                </Row>
                {shift.handedOver > 0 && (
                  <Row label="Handed to the owner" sub="Today at 13:10, Zarina Karimova">
                    <Money value={-shift.handedOver} />
                  </Row>
                )}
              </div>
            </div>
          </Card>

          <Card>
            <CardHeader title="Not in the drawer" description="Card and QR payments go straight to the bank" />
            <div className="px-5 pb-5">
              <div className="mb-3 flex items-baseline gap-2">
                <Money value={s.otherSales} currency={false} className="text-3xl font-normal text-fg" />
                <span className="text-sm text-faint">{CURRENCY}</span>
              </div>
              <ul className="divide-y divide-border border-t border-border">
                {byMethod.map((m) => (
                  <li key={m.id} className="flex items-center justify-between py-2.5 text-base">
                    <span className="text-muted">{m.name}</span>
                    <Money value={m.amount} />
                  </li>
                ))}
              </ul>
            </div>
          </Card>
        </div>
      ) : (
        <Card className="max-w-[560px] p-6">
          <div className="mb-5 flex items-start gap-3">
            <span className="grid size-10 place-items-center rounded-full bg-fill text-muted">
              <Icon icon={I.lock} size={18} />
            </span>
            <div>
              <h3 className="text-lg font-medium text-fg">The shift is closed</h3>
              <p className="mt-0.5 text-base text-muted">Open it to accept cash. Card and QR payments work either way.</p>
            </div>
          </div>
          <form
            className="flex flex-col gap-4"
            onSubmit={(e) => {
              e.preventDefault()
              openShift(Number(float) || 0)
              toast.success('Shift opened', { description: `Opening cash ${formatNumber(Number(float) || 0)} ${CURRENCY}` })
            }}
          >
            <Field label="Cash in the drawer now" hint="Usually the change fund left from yesterday.">
              <Input value={float} onChange={(e) => setFloat(e.target.value.replace(/\D/g, ''))} inputMode="numeric" suffix={CURRENCY} size="lg" />
            </Field>
            <Button type="submit" variant="primary" size="lg" className="self-start px-7">
              Open shift
            </Button>
          </form>
        </Card>
      )}

      <SectionTitle className="mt-10">Previous shifts</SectionTitle>
      <Card>
        <Table>
          <THead>
            <TH>Date</TH>
            <TH>Hours</TH>
            <TH>Closed by</TH>
            <TH align="right">Expected</TH>
            <TH align="right">Counted</TH>
            <TH>Result</TH>
          </THead>
          <tbody>
            {shifts.map((sh) => (
              <TR key={sh.id}>
                <TD className="whitespace-nowrap">{isSameDay(sh.date, NOW) ? 'Today' : formatDate(sh.date, { weekday: true })}</TD>
                <TD muted className="tabular">
                  {sh.openedAt}–{sh.closedAt}
                </TD>
                <TD muted>{sh.by}</TD>
                <TD align="right">
                  <Money value={sh.expected} />
                </TD>
                <TD align="right">
                  <Money value={sh.counted} />
                </TD>
                <TD>
                  <div className="flex items-center gap-2">
                    <Difference value={sh.counted - sh.expected} />
                    {sh.comment && <span className="truncate text-sm text-muted">{sh.comment}</span>}
                  </div>
                </TD>
              </TR>
            ))}
          </tbody>
        </Table>
      </Card>

      <CloseShiftModal key={formKey} open={closing} onClose={() => setClosing(false)} expected={s.expected} />
    </>
  )
}
