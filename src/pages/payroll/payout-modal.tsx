import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { Avatar } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Modal } from '@/components/ui/dialog'
import { Field, Input } from '@/components/ui/input'
import { Money } from '@/components/ui/misc'
import { Select } from '@/components/ui/select'
import { Segmented } from '@/components/ui/tabs'
import { staffById } from '@/data/staff'
import { formatMoney } from '@/lib/format'
import { TODAY } from '@/lib/time'
import { PAY_METHOD_LABEL, computeAccrual, payrollStaff, periodTitle, type PayMethod } from './data'
import { MoneyInput } from './shared'
import { usePayroll } from './store'

/** Record money handed to a person. Opened from Payouts or from an accrual. */
export function PayoutModal({
  open,
  onOpenChange,
  staffId: initialStaff,
  periodId: initialPeriod,
}: {
  open: boolean
  onOpenChange: (o: boolean) => void
  staffId?: string
  periodId?: string
}) {
  const { periods, schemes, assignments, adjustments, payouts, addPayout } = usePayroll()
  const unlocked = periods.filter((p) => p.type === 'Month' || p.status !== 'approved')
  const defaultPeriod = periods.find((p) => p.status === 'calculated')?.id ?? periods[0].id
  const [staffId, setStaffId] = useState(initialStaff ?? payrollStaff[0].id)
  const [periodId, setPeriodId] = useState(initialPeriod ?? defaultPeriod)
  const [amount, setAmount] = useState<number | null>(null)
  const [method, setMethod] = useState<PayMethod>('cash')
  const [comment, setComment] = useState('')
  const [touched, setTouched] = useState(false)

  useEffect(() => {
    if (!open) return
    setStaffId(initialStaff ?? payrollStaff[0].id)
    setPeriodId(initialPeriod ?? defaultPeriod)
    setAmount(null)
    setComment('')
    setTouched(false)
  }, [open, initialStaff, initialPeriod, defaultPeriod])

  const period = periods.find((p) => p.id === periodId)
  const remaining = useMemo(() => {
    if (!period) return 0
    return computeAccrual(period, staffById[staffId], { schemes, assignments, adjustments, payouts }).toPay
  }, [period, staffId, schemes, assignments, adjustments, payouts])

  useEffect(() => {
    if (open) setMethod(staffById[staffId].role === 'Administrator' || staffById[staffId].role === 'Lab technician' ? 'transfer' : 'cash')
  }, [open, staffId])

  const kind = period?.status === 'draft' || (amount ?? 0) < remaining ? 'advance' : 'salary'
  const valid = !!amount && amount > 0

  function save() {
    setTouched(true)
    if (!valid || !period) return
    addPayout({ id: `po${Date.now()}`, staffId, periodId, date: TODAY, amount: amount!, method, kind, comment: comment || undefined })
    onOpenChange(false)
    const name = staffById[staffId].name.split(' ')[0]
    toast.success(`Paid ${formatMoney(amount!)} to ${name}`, {
      description: method === 'cash' ? 'Recorded as a cash expense in today’s shift.' : `${PAY_METHOD_LABEL[method]} · ${periodTitle(period)}`,
    })
  }

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title="Pay out"
      size="sm"
      footer={
        <>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={save}>
            {amount ? `Pay ${formatMoney(amount)}` : 'Pay out'}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <Field label="Who">
          <Select
            value={staffId}
            onChange={setStaffId}
            options={payrollStaff.map((s) => ({ value: s.id, label: s.name, hint: s.position, icon: <Avatar name={s.name} color={s.color} size="sm" /> }))}
          />
        </Field>
        <Field label="For">
          <Select
            value={periodId}
            onChange={setPeriodId}
            options={unlocked.map((p) => ({ value: p.id, label: periodTitle(p), hint: p.status === 'draft' ? 'Running now: pays an advance' : undefined }))}
          />
        </Field>
        <Field
          label="Amount"
          error={touched && !valid ? 'Enter an amount' : undefined}
          hint={
            remaining > 0 ? (
              <span>
                Left to pay for {period ? periodTitle(period) : ''}: <Money value={remaining} className="text-fg" />{' '}
                <button type="button" className="font-medium text-accent-fg hover:underline underline-offset-4" onClick={() => setAmount(remaining)}>
                  Fill in
                </button>
              </span>
            ) : (
              'Nothing left to pay for this period.'
            )
          }
        >
          <MoneyInput value={amount} onChange={setAmount} autoFocus invalid={touched && !valid} />
        </Field>
        <Field label="Method">
          <Segmented fill value={method} onChange={setMethod} items={(Object.keys(PAY_METHOD_LABEL) as PayMethod[]).map((m) => ({ value: m, label: PAY_METHOD_LABEL[m] }))} />
        </Field>
        <Field label="Comment" optional>
          <Input value={comment} onChange={(e) => setComment(e.target.value)} placeholder={kind === 'advance' ? 'e.g. Advance on request' : ''} />
        </Field>
      </div>
    </Modal>
  )
}
