import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { DatePicker } from '@/components/ui/date-picker'
import { Modal } from '@/components/ui/dialog'
import { Field } from '@/components/ui/input'
import { Money } from '@/components/ui/misc'
import { Select } from '@/components/ui/select'
import { Table, TD, TH, THead, TR } from '@/components/ui/table'
import { Segmented } from '@/components/ui/tabs'
import { business } from '@/data/business'
import { formatDate, plural } from '@/lib/format'
import { TODAY, isSameDay } from '@/lib/time'
import { branchName, periodBounds, periodRange, periodTitle, staffForPeriod, type Period, type PeriodType } from './data'
import { PeriodBadge } from './shared'
import { useAllTotals, usePayroll } from './store'

const TYPES: PeriodType[] = ['Month', 'Half-month', 'Week', 'Shift']

function NewPeriodModal() {
  const open = usePayroll((s) => s.modal === 'period')
  const setModal = usePayroll((s) => s.setModal)
  const periods = usePayroll((s) => s.periods)
  const addPeriod = usePayroll((s) => s.addPeriod)
  const navigate = useNavigate()
  const [type, setType] = useState<PeriodType>('Half-month')
  const [date, setDate] = useState(TODAY)
  const [branchId, setBranchId] = useState('b1')

  useEffect(() => {
    if (open) {
      setType('Half-month')
      setDate(TODAY)
      setBranchId('b1')
    }
  }, [open])

  const { start, end } = periodBounds(type, date)
  const existing = periods.find((p) => p.type === type && p.branchId === branchId && isSameDay(p.start, start))
  const preview: Period = { id: 'preview', type, start, end, branchId, status: 'draft' }
  const people = staffForPeriod(preview).length

  function create() {
    if (existing) return
    const id = `p${Date.now()}`
    addPeriod({ ...preview, id, status: end < TODAY ? 'calculated' : 'draft' })
    setModal(null)
    toast.success(`${periodTitle(preview)} created`, { description: end < TODAY ? 'Calculated from receipts and the timesheet.' : 'It keeps accruing until the period ends.' })
    navigate(`/payroll/periods/${id}`)
  }

  return (
    <Modal
      open={open}
      onOpenChange={(o) => !o && setModal(null)}
      title="New period"
      description="Pick any date inside it. We work out the start and end."
      size="sm"
      footer={
        <>
          <Button variant="ghost" onClick={() => setModal(null)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={create} disabled={!!existing}>
            Create period
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <Field label="Type">
          <Segmented fill value={type} onChange={setType} items={TYPES.map((t) => ({ value: t, label: t }))} />
        </Field>
        <Field label="Any date inside the period">
          <DatePicker value={date} onChange={setDate} />
        </Field>
        <Field label="Branch">
          <Select
            value={branchId}
            onChange={setBranchId}
            options={[...business.branches.map((b) => ({ value: b.id, label: b.name, hint: b.address })), { value: 'all', label: 'All branches' }]}
          />
        </Field>
        <div className="rounded-xl bg-fill px-3.5 py-3 text-sm">
          {existing ? (
            <span className="text-negative">
              {periodTitle(existing)} already exists for {branchName(branchId)}.{' '}
              <button type="button" className="font-medium underline underline-offset-2" onClick={() => (setModal(null), navigate(`/payroll/periods/${existing.id}`))}>
                Open it
              </button>
            </span>
          ) : (
            <span className="text-muted">
              Covers <span className="text-fg">{type === 'Shift' ? formatDate(start, { weekday: true }) : periodRange(preview)}</span> for{' '}
              {plural(people, 'person', 'people')}
            </span>
          )}
        </div>
      </div>
    </Modal>
  )
}

export function Periods() {
  const periods = usePayroll((s) => s.periods)
  const totals = useAllTotals()
  const navigate = useNavigate()
  const sorted = [...periods].sort((a, b) => +b.end - +a.end || +b.start - +a.start)

  return (
    <>
      <Card>
        <Table>
          <THead>
            <TH>Period</TH>
            <TH>Type</TH>
            <TH>Branch</TH>
            <TH align="right">People</TH>
            <TH align="right">Accrued</TH>
            <TH align="right">Paid</TH>
            <TH>Status</TH>
          </THead>
          <tbody>
            {sorted.map((p) => {
              const t = totals[p.id]
              return (
                <TR key={p.id} onClick={() => navigate(`/payroll/periods/${p.id}`)}>
                  <TD>
                    <div className="text-base text-fg">{periodTitle(p)}</div>
                    {p.type === 'Month' && (
                      <div className="text-sm text-muted">{p.status === 'draft' ? `${periodRange(p)} · accruing until it ends` : periodRange(p)}</div>
                    )}
                  </TD>
                  <TD muted>{p.type}</TD>
                  <TD muted>{branchName(p.branchId)}</TD>
                  <TD align="right" muted>
                    {t?.people}
                  </TD>
                  <TD align="right">
                    <Money value={t?.total ?? 0} />
                  </TD>
                  <TD align="right" muted>
                    <Money value={t?.paid ?? 0} />
                  </TD>
                  <TD>
                    <PeriodBadge status={p.status} />
                  </TD>
                </TR>
              )
            })}
          </tbody>
        </Table>
      </Card>
      <p className="mt-4 text-sm text-muted">
        Accruals come from completed visits, register sales and the timesheet. Sublease tenants aren’t on payroll.
      </p>
      <NewPeriodModal />
    </>
  )
}
