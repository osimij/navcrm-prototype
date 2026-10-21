import { useMemo, useState } from 'react'
import { Link } from 'react-router'
import { toast } from 'sonner'
import { I } from '@/components/icons'
import { Button } from '@/components/ui/button'
import { Card, CardHeader } from '@/components/ui/card'
import { Chip } from '@/components/ui/controls'
import { DatePicker } from '@/components/ui/date-picker'
import { Modal } from '@/components/ui/dialog'
import { Field, Input } from '@/components/ui/input'
import { EmptyState, Figure, Meter, Money } from '@/components/ui/misc'
import { Toolbar } from '@/components/ui/page'
import { Select } from '@/components/ui/select'
import { TD, TH, THead, TR, Table, TableFooter } from '@/components/ui/table'
import { Segmented } from '@/components/ui/tabs'
import { CURRENCY, formatDate, formatMoney, monthLong, plural } from '@/lib/format'
import { NOW, TODAY, addDays } from '@/lib/time'
import { EXPENSE_CATEGORIES, type ExpenseCategory } from './data'
import { useRegister } from './store'

type Period = 'month' | 'last' | '30'

function range(p: Period): [Date, Date] {
  const startOfMonth = new Date(TODAY.getFullYear(), TODAY.getMonth(), 1)
  if (p === 'month') return [startOfMonth, addDays(TODAY, 1)]
  if (p === 'last') return [new Date(TODAY.getFullYear(), TODAY.getMonth() - 1, 1), startOfMonth]
  return [addDays(TODAY, -29), addDays(TODAY, 1)]
}

function AddExpenseModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const addExpense = useRegister((s) => s.addExpense)
  const shiftOpen = useRegister((s) => s.shift.open)
  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState<ExpenseCategory>('Supplies')
  const [date, setDate] = useState(TODAY)
  const [source, setSource] = useState<'cash' | 'bank'>('cash')
  const [description, setDescription] = useState('')
  const valid = Number(amount) > 0 && description.trim()

  return (
    <Modal
      open={open}
      onOpenChange={(o) => !o && onClose()}
      title="Add expense"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            disabled={!valid}
            onClick={() => {
              addExpense({ id: `e${Date.now()}`, date, category, description: description.trim(), amount: Number(amount), source, by: 'Zarina Karimova' })
              onClose()
              toast.success(`${formatMoney(Number(amount))} added to ${category}`, {
                description: source === 'cash' ? 'Taken from the cash drawer.' : undefined,
              })
            }}
          >
            Add expense
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Amount">
            <Input value={amount} onChange={(e) => setAmount(e.target.value.replace(/\D/g, ''))} inputMode="numeric" suffix={CURRENCY} autoFocus />
          </Field>
          <Field label="Category">
            <Select value={category} onChange={setCategory} options={EXPENSE_CATEGORIES.map((c) => ({ value: c, label: c }))} />
          </Field>
        </div>
        <Field label="What for">
          <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="e.g. Towels from Dushanbe textile market" />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Date">
            <DatePicker value={date} onChange={setDate} />
          </Field>
          <Field label="Paid from" hint={source === 'cash' && !shiftOpen ? 'The shift is closed; cash won’t match the drawer.' : undefined}>
            <Segmented
              fill
              value={source}
              onChange={setSource}
              items={[
                { value: 'cash', label: 'Cash drawer' },
                { value: 'bank', label: 'Bank' },
              ]}
            />
          </Field>
        </div>
      </div>
    </Modal>
  )
}

export function Expenses() {
  const expenses = useRegister((s) => s.expenses)
  const [period, setPeriod] = useState<Period>('month')
  const [category, setCategory] = useState<ExpenseCategory | 'all'>('all')
  const [adding, setAdding] = useState(false)
  const [formKey, setFormKey] = useState(0)

  const [from, to] = range(period)
  const inRange = useMemo(() => expenses.filter((e) => e.date >= from && e.date < to).sort((a, b) => +b.date - +a.date), [expenses, from, to])
  const list = inRange.filter((e) => category === 'all' || e.category === category)
  const total = inRange.reduce((m, e) => m + e.amount, 0)
  const byCategory = EXPENSE_CATEGORIES.map((c) => ({ c, amount: inRange.filter((e) => e.category === c).reduce((m, e) => m + e.amount, 0) }))
    .filter((x) => x.amount > 0)
    .sort((a, b) => b.amount - a.amount)
  const max = Math.max(...byCategory.map((x) => x.amount), 1)
  const periodLabel = period === 'month' ? monthLong(NOW.getMonth()) : period === 'last' ? monthLong((NOW.getMonth() + 11) % 12) : 'Last 30 days'

  return (
    <>
      <Toolbar>
        <Select
          look="pill"
          value={period}
          onChange={setPeriod}
          options={[
            { value: 'month', label: 'This month' },
            { value: 'last', label: 'Last month' },
            { value: '30', label: 'Last 30 days' },
          ]}
        />
        <span className="mx-1 h-5 w-px bg-border" />
        <Chip active={category === 'all'} onClick={() => setCategory('all')}>
          All
        </Chip>
        {EXPENSE_CATEGORIES.map((c) => (
          <Chip key={c} active={category === c} onClick={() => setCategory(c)}>
            {c}
          </Chip>
        ))}
        <Button
          variant="primary"
          icon={I.add}
          className="ml-auto"
          onClick={() => {
            setFormKey((k) => k + 1)
            setAdding(true)
          }}
        >
          Add expense
        </Button>
      </Toolbar>

      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
        <Card>
          {list.length ? (
            <>
              <Table>
                <THead>
                  <TH>Date</TH>
                  <TH>Category</TH>
                  <TH>What for</TH>
                  <TH>Paid from</TH>
                  <TH align="right">Amount</TH>
                </THead>
                <tbody>
                  {list.map((e) => (
                    <TR key={e.id}>
                      <TD muted className="whitespace-nowrap">
                        {formatDate(e.date)}
                      </TD>
                      <TD>{e.category}</TD>
                      <TD>
                        <span className="block max-w-[320px] truncate">{e.description}</span>
                        <span className="block text-sm text-faint">{e.by}</span>
                      </TD>
                      <TD muted>{e.source === 'cash' ? 'Cash drawer' : 'Bank'}</TD>
                      <TD align="right">
                        <Money value={e.amount} />
                      </TD>
                    </TR>
                  ))}
                </tbody>
              </Table>
              <TableFooter>
                <span>{plural(list.length, 'expense')}</span>
                <Money value={list.reduce((m, e) => m + e.amount, 0)} className="text-fg" />
              </TableFooter>
            </>
          ) : (
            <EmptyState icon={I.wallet} title="No expenses here" description="Rent, supplies and other costs you add here are taken off revenue in the profit report." />
          )}
        </Card>

        <Card className="lg:sticky lg:top-6">
          <CardHeader title={`Spent in ${periodLabel}`} />
          <div className="px-5 pb-5">
            <div className="flex items-baseline gap-2">
              <Figure value={total} money className="text-4xl font-normal text-fg" />
              <span className="text-base text-faint">{CURRENCY}</span>
            </div>
            <ul className="mt-5 flex flex-col gap-3.5">
              {byCategory.map(({ c, amount }) => (
                <li key={c}>
                  <div className="mb-1.5 flex items-center justify-between text-sm">
                    <span className="text-fg">{c}</span>
                    <Money value={amount} className="text-muted" />
                  </div>
                  <Meter value={amount} max={max} className="h-1" />
                </li>
              ))}
            </ul>
            <p className="mt-5 border-t border-border pt-4 text-sm text-muted">
              Profit in{' '}
              <Link to="/reports/cash" className="text-fg hover:underline underline-offset-4">
                Reports
              </Link>{' '}
              is calculated after these expenses.
            </p>
          </div>
        </Card>
      </div>
      <AddExpenseModal key={formKey} open={adding} onClose={() => setAdding(false)} />
    </>
  )
}
