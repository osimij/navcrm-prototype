import { useMemo, useState } from 'react'
import { Avatar } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { EmptyState, Money } from '@/components/ui/misc'
import { Toolbar } from '@/components/ui/page'
import { Select } from '@/components/ui/select'
import { Table, TD, TH, THead, TR, TableFooter } from '@/components/ui/table'
import { I } from '@/components/icons'
import { staffById } from '@/data/staff'
import { formatDate, monthLong, plural } from '@/lib/format'
import { TODAY } from '@/lib/time'
import { PAY_METHOD_LABEL, payrollStaff, periodTitle } from './data'
import { PayoutModal } from './payout-modal'
import { StaffCell, StatTile } from './shared'
import { useAllTotals, usePayroll } from './store'

export function Payouts() {
  const payouts = usePayroll((s) => s.payouts)
  const periods = usePayroll((s) => s.periods)
  const modal = usePayroll((s) => s.modal)
  const setModal = usePayroll((s) => s.setModal)
  const totals = useAllTotals()
  const [who, setWho] = useState('all')

  const list = useMemo(() => payouts.filter((p) => who === 'all' || p.staffId === who).sort((a, b) => +b.date - +a.date), [payouts, who])
  const thisMonth = list.filter((p) => p.date.getMonth() === TODAY.getMonth() && p.date.getFullYear() === TODAY.getFullYear())
  const paidThisMonth = thisMonth.reduce((m, p) => m + p.amount, 0)
  const advances = thisMonth.filter((p) => p.kind === 'advance').reduce((m, p) => m + p.amount, 0)
  const calculated = periods.find((p) => p.status === 'calculated')
  const draft = periods.find((p) => p.status === 'draft')

  // Per-person figures need the accruals; for "everyone" the period totals do.
  const owed = calculated ? (who === 'all' ? totals[calculated.id].total - totals[calculated.id].paid : undefined) : 0
  const accrued = draft ? (who === 'all' ? totals[draft.id].total : undefined) : 0
  const month = monthLong(TODAY.getMonth())

  return (
    <>
      <Toolbar>
        <Select
          look="pill"
          value={who}
          onChange={setWho}
          options={[
            { value: 'all', label: 'All staff' },
            ...payrollStaff.map((s) => ({ value: s.id, label: s.name, icon: <Avatar name={s.name} color={s.color} size="xs" /> })),
          ]}
        />
      </Toolbar>

      <div className="mb-5 grid grid-cols-2 gap-5 lg:grid-cols-4">
        <StatTile label={`Paid in ${month}`} value={paidThisMonth} money sub={plural(thisMonth.length, 'payout')} />
        <StatTile label="Advances" value={advances} money sub={`Paid in ${month}`} />
        {who === 'all' ? (
          <>
            <StatTile label={calculated ? `Owed for ${periodTitle(calculated)}` : 'Owed'} value={owed ?? 0} money tone="negative" sub="Calculated, not paid yet" />
            <StatTile label={draft ? `Accrued in ${periodTitle(draft)}` : 'Accrued'} value={accrued ?? 0} money sub="So far, preliminary" />
          </>
        ) : (
          <>
            <StatTile label="Last payout" value={list[0]?.amount ?? 0} money sub={list[0] ? formatDate(list[0].date) : 'None yet'} />
            <StatTile label="Paid this year" value={list.filter((p) => p.date.getFullYear() === TODAY.getFullYear()).reduce((m, p) => m + p.amount, 0)} money sub={staffById[who].position} />
          </>
        )}
      </div>

      <Card>
        {list.length ? (
          <>
            <Table>
              <THead>
                <TH>Date</TH>
                <TH>Staff member</TH>
                <TH>For</TH>
                <TH>Method</TH>
                <TH>Comment</TH>
                <TH align="right">Amount</TH>
              </THead>
              <tbody>
                {list.map((p) => {
                  const period = periods.find((x) => x.id === p.periodId)
                  return (
                    <TR key={p.id}>
                      <TD muted className="whitespace-nowrap">
                        {formatDate(p.date)}
                      </TD>
                      <TD>
                        <StaffCell staffId={p.staffId} />
                      </TD>
                      <TD>
                        <span className="flex items-center gap-2">
                          {period ? periodTitle(period) : '—'}
                          {p.kind === 'advance' && <Badge>Advance</Badge>}
                        </span>
                      </TD>
                      <TD muted>{PAY_METHOD_LABEL[p.method]}</TD>
                      <TD muted className="max-w-56 truncate">
                        {p.comment ?? ''}
                      </TD>
                      <TD align="right">
                        <Money value={p.amount} />
                      </TD>
                    </TR>
                  )
                })}
              </tbody>
            </Table>
            <TableFooter>
              <span>{plural(list.length, 'payout')}</span>
              <span>Cash payouts also appear as expenses in the register shift.</span>
            </TableFooter>
          </>
        ) : (
          <EmptyState icon={I.cash} title="No payouts yet" description="Advances and salaries you hand out show up here." />
        )}
      </Card>

      <PayoutModal open={modal === 'payout'} onOpenChange={(o) => setModal(o ? 'payout' : null)} staffId={who === 'all' ? undefined : who} />
    </>
  )
}
