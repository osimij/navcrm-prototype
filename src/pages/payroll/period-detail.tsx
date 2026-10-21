import { useState } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router'
import { toast } from 'sonner'
import { I, Icon } from '@/components/icons'
import { Avatar } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Modal, Sheet } from '@/components/ui/dialog'
import { Menu, MenuItem } from '@/components/ui/menu'
import { Money } from '@/components/ui/misc'
import { Page, PageHeader } from '@/components/ui/page'
import { Table, TD, TH, THead, TR } from '@/components/ui/table'
import { staffById } from '@/data/staff'
import { cn } from '@/lib/cn'
import { formatDate, plural } from '@/lib/format'
import { PAY_METHOD_LABEL, branchName, periodRange, periodTitle, type Accrual, type Period } from './data'
import { PayoutModal } from './payout-modal'
import { Note, PeriodBadge, StaffCell, StatTile } from './shared'
import { usePayroll, usePeriodAccruals } from './store'

const COLS: { key: keyof Accrual; label: string }[] = [
  { key: 'base', label: 'Salary' },
  { key: 'services', label: 'Services' },
  { key: 'products', label: 'Products' },
  { key: 'tips', label: 'Tips' },
  { key: 'perService', label: 'Per service' },
  { key: 'kpi', label: 'KPI' },
]

function Cell({ v, negative }: { v: number; negative?: boolean }) {
  if (!v) return <span className="text-disabled">–</span>
  return <Money value={negative ? -v : v} currency={false} className={negative ? 'text-negative' : ''} />
}

function AccrualSheet({ period, accrual, open, onClose }: { period: Period; accrual: Accrual | null; open: boolean; onClose: () => void }) {
  const schemes = usePayroll((s) => s.schemes)
  const payouts = usePayroll((s) => s.payouts)
  const navigate = useNavigate()
  const [paying, setPaying] = useState(false)
  if (!accrual) return <Sheet open={false} onOpenChange={onClose}>{null}</Sheet>
  const s = staffById[accrual.staffId]
  const scheme = schemes.find((x) => x.id === accrual.schemeId)
  const paid = payouts.filter((p) => p.staffId === s.id && p.periodId === period.id)

  return (
    <>
      <Sheet
        open={open && !paying}
        onOpenChange={(o) => !o && onClose()}
        eyebrow={`Accrual · ${periodTitle(period)}`}
        title={s.name}
        footer={
          accrual.toPay > 0 ? (
            <Button variant="primary" className="ml-auto" icon={I.cash} onClick={() => setPaying(true)}>
              Pay out <Money value={accrual.toPay} currency={false} />
            </Button>
          ) : (
            <span className="text-sm text-muted">Fully paid for this period.</span>
          )
        }
      >
        <div className="flex items-center gap-3 px-5 pt-5">
          <Avatar name={s.name} color={s.color} size="lg" />
          <div className="min-w-0">
            <div className="text-base text-fg">{s.position}</div>
            <div className="text-sm text-muted">
              {scheme ? (
                <>
                  <button type="button" className="text-fg hover:underline underline-offset-4" onClick={() => navigate(`/payroll/schemes/${scheme.id}`)}>
                    {scheme.name}
                  </button>
                  {accrual.via === 'personal' ? ' · personal scheme' : ` · through position “${s.position}”`}
                </>
              ) : (
                'No scheme assigned'
              )}
            </div>
          </div>
        </div>

        {s.bookable && (
          <p className="px-5 pt-3 text-sm text-muted">
            Based on {plural(accrual.visits, 'completed visit')}
            {period.status === 'draft' ? ' so far' : ''}.
          </p>
        )}

        <div className="px-5 pt-4">
          <div className="text-xs font-medium text-faint">How it adds up</div>
          <ul className="mt-1">
            {accrual.lines.map((l, i) => (
              <li key={i} className="flex items-start justify-between gap-6 border-b border-border py-3">
                <div className="min-w-0">
                  <div className="text-base text-fg">{l.label}</div>
                  {l.formula && <div className="mt-0.5 text-sm text-muted tabular">{l.formula}</div>}
                </div>
                <Money value={l.amount} sign={l.amount < 0} className={cn('pt-px text-base', l.amount < 0 && 'text-negative', l.amount === 0 && 'text-faint')} />
              </li>
            ))}
            <li className="flex items-center justify-between gap-6 py-3">
              <span className="text-base font-medium text-fg">Total accrued</span>
              <Money value={accrual.total} className="text-lg font-medium" />
            </li>
          </ul>
        </div>

        <div className="px-5 pt-4 pb-6">
          <div className="text-xs font-medium text-faint">Paid</div>
          {paid.length ? (
            <ul className="mt-1">
              {paid.map((p) => (
                <li key={p.id} className="flex items-center justify-between gap-6 border-b border-border py-3 last:border-b-0">
                  <div>
                    <div className="text-base text-fg">{p.kind === 'advance' ? 'Advance' : 'Salary'}</div>
                    <div className="text-sm text-muted">
                      {formatDate(p.date)} · {PAY_METHOD_LABEL[p.method]}
                    </div>
                  </div>
                  <Money value={-p.amount} className="text-base" />
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-base text-muted">Nothing paid yet.</p>
          )}
          <div className="mt-2 flex items-center justify-between rounded-xl bg-fill px-4 py-3">
            <span className="text-base text-fg">Left to pay</span>
            <Money value={accrual.toPay} className="text-lg font-medium" />
          </div>
        </div>
      </Sheet>
      <PayoutModal open={paying} onOpenChange={(o) => (setPaying(o), !o && onClose())} staffId={s.id} periodId={period.id} />
    </>
  )
}

export function PeriodDetail() {
  const { id } = useParams()
  const period = usePayroll((s) => s.periods.find((p) => p.id === id))
  const setStatus = usePayroll((s) => s.setPeriodStatus)
  const accruals = usePeriodAccruals(period)
  // Keep the last selection while the sheet animates out.
  const [selected, setSelected] = useState<string | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [confirm, setConfirm] = useState(false)

  if (!period) return <Navigate to="/payroll" replace />

  const total = accruals.reduce((m, a) => m + a.total, 0)
  const paid = accruals.reduce((m, a) => m + a.paid, 0)
  const toPay = accruals.reduce((m, a) => m + a.toPay, 0)
  const sum = (k: keyof Accrual) => accruals.reduce((m, a) => m + (a[k] as number), 0)
  const shown = COLS.filter((c) => sum(c.key) !== 0)
  const locked = period.status === 'approved'

  const primary =
    period.status === 'draft' ? (
      <Button
        variant="primary"
        onClick={() => {
          setStatus(period.id, 'calculated')
          toast.success(`${periodTitle(period)} calculated`, { description: 'From receipts, completed visits and the timesheet.' })
        }}
      >
        Calculate
      </Button>
    ) : period.status === 'calculated' ? (
      <Button variant="primary" icon={I.lock} onClick={() => setConfirm(true)}>
        Approve period
      </Button>
    ) : null

  return (
    <Page width="wide">
      <PageHeader
        back="/payroll"
        title={periodTitle(period)}
        meta={<PeriodBadge status={period.status} />}
        subtitle={`${periodRange(period)} · ${branchName(period.branchId)} · ${period.type}`}
        actions={
          <>
            {!locked && (
              <Button icon={I.refresh} onClick={() => toast.success('Recalculated', { description: 'Nothing changed since the last calculation.' })}>
                Recalculate
              </Button>
            )}
            <Menu trigger={<Button icon={I.download}>Export</Button>} align="end">
              <MenuItem onClick={() => toast('Excel file prepared')}>Excel (.xlsx)</MenuItem>
              <MenuItem onClick={() => toast('Payslips prepared')}>Payslips (PDF)</MenuItem>
            </Menu>
            {primary}
          </>
        }
      />

      {locked && (
        <Note icon={I.lock} className="mb-5">
          Approved by {period.approvedBy} on {formatDate(period.approvedAt ?? period.end)}. Accruals are locked; you can still record payouts.
        </Note>
      )}
      {period.status === 'draft' && (
        <Note className="mb-5">This period is still running. Numbers grow as visits are completed; calculate it once the period ends.</Note>
      )}

      <div className="mb-5 grid grid-cols-2 gap-5 lg:grid-cols-4">
        <StatTile label="Accrued" value={total} money sub={period.status === 'draft' ? 'So far' : 'For the whole period'} />
        <StatTile label="Paid" value={paid} money sub="Advances and salaries" />
        <StatTile label="Left to pay" value={toPay} money sub={toPay ? `${accruals.filter((a) => a.toPay > 0).length} people` : 'Everyone is paid'} />
        <StatTile label="People" value={accruals.length} sub="Tenants are not on payroll" />
      </div>

      <Card>
        <Table>
          <THead>
            <TH>Staff member</TH>
            {shown.map((c) => (
              <TH key={c.key} align="right">
                {c.label}
              </TH>
            ))}
            <TH align="right">Bonuses</TH>
            <TH align="right">Fines</TH>
            <TH align="right">Total</TH>
            <TH align="right">Paid</TH>
            <TH align="right">To pay</TH>
          </THead>
          <tbody>
            {accruals.map((a) => (
              <TR
                key={a.staffId}
                onClick={() => {
                  setSelected(a.staffId)
                  setSheetOpen(true)
                }}
                selected={sheetOpen && selected === a.staffId}
              >
                <TD>
                  <StaffCell staffId={a.staffId} />
                </TD>
                {shown.map((c) => (
                  <TD key={c.key} align="right">
                    <Cell v={a[c.key] as number} />
                  </TD>
                ))}
                <TD align="right">
                  <Cell v={a.bonuses} />
                </TD>
                <TD align="right">
                  <Cell v={a.fines} negative />
                </TD>
                <TD align="right" className="font-medium">
                  <Money value={a.total} currency={false} />
                </TD>
                <TD align="right" muted>
                  <Cell v={a.paid} />
                </TD>
                <TD align="right">{a.toPay ? <Money value={a.toPay} currency={false} /> : <Icon icon={I.checkCircle} size={16} className="ml-auto text-positive" />}</TD>
              </TR>
            ))}
          </tbody>
          <tfoot>
            <tr className="bg-fill/50">
              <td className="h-12 pl-5 text-base font-medium text-fg">Total, TJS</td>
              {shown.map((c) => (
                <td key={c.key} className="px-3 text-right text-base text-fg tabular">
                  <Money value={sum(c.key)} currency={false} />
                </td>
              ))}
              <td className="px-3 text-right tabular">
                <Money value={sum('bonuses')} currency={false} />
              </td>
              <td className="px-3 text-right tabular text-negative">
                <Money value={-sum('fines')} currency={false} />
              </td>
              <td className="px-3 text-right font-medium tabular">
                <Money value={total} currency={false} />
              </td>
              <td className="px-3 text-right tabular text-muted">
                <Money value={paid} currency={false} />
              </td>
              <td className="pr-5 pl-3 text-right font-medium tabular">
                <Money value={toPay} currency={false} />
              </td>
            </tr>
          </tfoot>
        </Table>
      </Card>

      <p className="mt-4 text-sm text-muted">
        Parvina Kurbonova rents the massage room, so her visits and earnings are settled in{' '}
        <Link to="/sublease" className="text-fg underline underline-offset-4">
          Sublease
        </Link>
        , not here. Click a row to see how each amount adds up.
      </p>

      <AccrualSheet
        period={period}
        open={sheetOpen}
        accrual={accruals.find((a) => a.staffId === selected) ?? null}
        onClose={() => setSheetOpen(false)}
      />

      <Modal
        open={confirm}
        onOpenChange={setConfirm}
        size="sm"
        title={`Approve ${periodTitle(period)}?`}
        description="Accruals lock and can’t be recalculated. Everyone sees their final numbers in My earnings. Payouts can still be recorded."
        footer={
          <>
            <Button variant="ghost" onClick={() => setConfirm(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              icon={I.lock}
              onClick={() => {
                setStatus(period.id, 'approved')
                setConfirm(false)
                toast.success(`${periodTitle(period)} approved`, { description: 'Payslips were sent to staff in Telegram.' })
              }}
            >
              Approve and lock
            </Button>
          </>
        }
      >
        <div className="flex items-center justify-between rounded-xl bg-fill px-4 py-3 text-base">
          <span className="text-muted">Total accrued</span>
          <Money value={total} className="font-medium" />
        </div>
      </Modal>
    </Page>
  )
}
