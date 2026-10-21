import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { I } from '@/components/icons'
import { Avatar } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button, IconButton } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { DatePicker } from '@/components/ui/date-picker'
import { Modal } from '@/components/ui/dialog'
import { Field, Input } from '@/components/ui/input'
import { Menu, MenuItem } from '@/components/ui/menu'
import { EmptyState, Money } from '@/components/ui/misc'
import { Toolbar } from '@/components/ui/page'
import { Select } from '@/components/ui/select'
import { Table, TD, TH, THead, TR } from '@/components/ui/table'
import { Segmented } from '@/components/ui/tabs'
import { staffById } from '@/data/staff'
import { formatDate, formatMoney } from '@/lib/format'
import { TODAY } from '@/lib/time'
import { payrollStaff, periodTitle, type Adjustment } from './data'
import { MoneyInput, StaffCell } from './shared'
import { usePayroll } from './store'

function AdjustmentModal() {
  const open = usePayroll((s) => s.modal === 'adjustment')
  const setModal = usePayroll((s) => s.setModal)
  const addAdjustment = usePayroll((s) => s.addAdjustment)
  const periods = usePayroll((s) => s.periods)
  const [staffId, setStaffId] = useState(payrollStaff[0].id)
  const [kind, setKind] = useState<'bonus' | 'fine'>('bonus')
  const [amount, setAmount] = useState<number | null>(null)
  const [reason, setReason] = useState('')
  const [date, setDate] = useState(TODAY)
  const [touched, setTouched] = useState(false)

  useEffect(() => {
    if (!open) return
    setKind('bonus')
    setAmount(null)
    setReason('')
    setDate(TODAY)
    setTouched(false)
  }, [open])

  const period = periods.find((p) => p.type === 'Month' && date >= p.start && date <= p.end)
  const locked = period?.status === 'approved'
  const valid = !!amount && reason.trim().length > 0 && !locked

  return (
    <Modal
      open={open}
      onOpenChange={(o) => !o && setModal(null)}
      title={kind === 'bonus' ? 'Add a bonus' : 'Add a fine'}
      size="sm"
      footer={
        <>
          <Button variant="ghost" onClick={() => setModal(null)}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={() => {
              setTouched(true)
              if (!valid) return
              addAdjustment({ id: `ad${Date.now()}`, staffId, kind, amount: amount!, reason: reason.trim(), date })
              setModal(null)
              toast.success(`${kind === 'bonus' ? 'Bonus' : 'Fine'} of ${formatMoney(amount!)} added for ${staffById[staffId].name.split(' ')[0]}`, {
                description: period ? `Counts in ${periodTitle(period)}.` : undefined,
              })
            }}
          >
            Add {kind}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <Segmented fill value={kind} onChange={setKind} items={[{ value: 'bonus', label: 'Bonus' }, { value: 'fine', label: 'Fine' }]} />
        <Field label="Who">
          <Select
            value={staffId}
            onChange={setStaffId}
            options={payrollStaff.map((s) => ({ value: s.id, label: s.name, hint: s.position, icon: <Avatar name={s.name} color={s.color} size="sm" /> }))}
          />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Amount" error={touched && !amount ? 'Required' : undefined}>
            <MoneyInput value={amount} onChange={setAmount} invalid={touched && !amount} />
          </Field>
          <Field label="Date" error={locked ? 'That period is approved' : undefined}>
            <DatePicker value={date} onChange={setDate} />
          </Field>
        </div>
        <Field label="Reason" hint="The person sees this in My earnings." error={touched && !reason.trim() ? 'Say why' : undefined}>
          <Input value={reason} onChange={(e) => setReason(e.target.value)} placeholder={kind === 'bonus' ? 'e.g. Best reviews this month' : 'e.g. Late three times'} />
        </Field>
      </div>
    </Modal>
  )
}

export function Adjustments() {
  const adjustments = usePayroll((s) => s.adjustments)
  const periods = usePayroll((s) => s.periods)
  const remove = usePayroll((s) => s.removeAdjustment)
  const add = usePayroll((s) => s.addAdjustment)
  const [who, setWho] = useState('all')
  const [kind, setKind] = useState<'all' | 'bonus' | 'fine'>('all')

  const periodOf = (a: Adjustment) => periods.find((p) => p.type === 'Month' && a.date >= p.start && a.date <= p.end)
  const list = adjustments
    .filter((a) => (who === 'all' || a.staffId === who) && (kind === 'all' || a.kind === kind))
    .sort((a, b) => +b.date - +a.date)

  return (
    <>
      <Toolbar>
        <Select
          look="pill"
          value={who}
          onChange={setWho}
          options={[{ value: 'all', label: 'All staff' }, ...payrollStaff.map((s) => ({ value: s.id, label: s.name, icon: <Avatar name={s.name} color={s.color} size="xs" /> }))]}
        />
        <Segmented
          size="sm"
          value={kind}
          onChange={setKind}
          items={[
            { value: 'all', label: 'All' },
            { value: 'bonus', label: 'Bonuses' },
            { value: 'fine', label: 'Fines' },
          ]}
        />
      </Toolbar>
      <Card>
        {list.length ? (
          <Table>
            <THead>
              <TH>Date</TH>
              <TH>Staff member</TH>
              <TH>Type</TH>
              <TH>Reason</TH>
              <TH>Period</TH>
              <TH align="right">Amount</TH>
              <TH className="w-12" />
            </THead>
            <tbody>
              {list.map((a) => {
                const period = periodOf(a)
                const locked = period?.status === 'approved'
                return (
                  <TR key={a.id}>
                    <TD muted className="whitespace-nowrap">
                      {formatDate(a.date)}
                    </TD>
                    <TD>
                      <StaffCell staffId={a.staffId} />
                    </TD>
                    <TD>
                      <Badge tone={a.kind === 'bonus' ? 'positive' : 'negative'}>{a.kind === 'bonus' ? 'Bonus' : 'Fine'}</Badge>
                    </TD>
                    <TD>{a.reason}</TD>
                    <TD muted>{period ? periodTitle(period) : '—'}</TD>
                    <TD align="right">
                      <Money value={a.kind === 'bonus' ? a.amount : -a.amount} sign tone />
                    </TD>
                    <TD align="right">
                      <Menu trigger={<IconButton icon={I.more} label="Actions" size="sm" />} align="end">
                        <MenuItem
                          icon={I.delete}
                          danger
                          disabled={locked}
                          hint={locked ? 'Period approved' : undefined}
                          onClick={() => {
                            remove(a.id)
                            toast(`${a.kind === 'bonus' ? 'Bonus' : 'Fine'} removed`, { action: { label: 'Undo', onClick: () => add(a) } })
                          }}
                        >
                          Remove
                        </MenuItem>
                      </Menu>
                    </TD>
                  </TR>
                )
              })}
            </tbody>
          </Table>
        ) : (
          <EmptyState icon={I.award} title="Nothing here" description="Bonuses and fines are added on top of the scheme in the period that contains their date." />
        )}
      </Card>
      <AdjustmentModal />
    </>
  )
}
