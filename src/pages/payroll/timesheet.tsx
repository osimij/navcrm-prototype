import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Avatar } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { DatePicker } from '@/components/ui/date-picker'
import { Modal } from '@/components/ui/dialog'
import { Field, Input } from '@/components/ui/input'
import { Popover } from '@/components/ui/popover'
import { Select } from '@/components/ui/select'
import { staffById, type Staff } from '@/data/staff'
import { cn } from '@/lib/cn'
import { dayShort, formatDate, monthLong } from '@/lib/format'
import { TODAY } from '@/lib/time'
import { hoursBetween, payrollStaff, shiftFor, todayClockIn } from './data'
import { usePayroll } from './store'

const daysInMonth = new Date(TODAY.getFullYear(), TODAY.getMonth() + 1, 0).getDate()
const DAYS = Array.from({ length: daysInMonth }, (_, i) => i + 1)
const dateOf = (day: number) => new Date(TODAY.getFullYear(), TODAY.getMonth(), day)
const isWeekend = (day: number) => [0, 6].includes(dateOf(day).getDay())
/** 9.75 → "9¾": quarter hours stay readable in narrow day cells. */
const FRACTIONS: Record<number, string> = { 0.25: '¼', 0.5: '½', 0.75: '¾' }
const fmtHours = (h: number) => {
  const q = Math.round(h * 4) / 4
  const whole = Math.floor(q)
  const frac = FRACTIONS[q - whole] ?? ''
  return whole || !frac ? `${whole}${frac}` : frac
}
const validTime = (t: string) => /^([01]\d|2[0-3]):[0-5]\d$/.test(t)

function CorrectForm({
  s,
  day,
  initial,
  onDone,
}: {
  s: Staff
  day: number
  initial: { in: string; out: string; clocked?: string }
  onDone: () => void
}) {
  const correct = usePayroll((st) => st.correct)
  const [tin, setIn] = useState(initial.in)
  const [tout, setOut] = useState(initial.out)
  const [reason, setReason] = useState('')
  const ok = validTime(tin) && validTime(tout) && tin < tout && reason.trim().length > 0
  return (
    <form
      className="flex w-72 flex-col gap-3 p-4"
      onSubmit={(e) => {
        e.preventDefault()
        if (!ok) return
        correct(`${s.id}-${day}`, { in: tin, out: tout, hours: hoursBetween(tin, tout), reason: reason.trim() })
        toast.success(`Hours corrected for ${s.name.split(' ')[0]}`, { description: `${formatDate(dateOf(day), { weekday: true })}: ${tin}–${tout}` })
        onDone()
      }}
    >
      <div>
        <div className="text-base font-medium text-fg">{s.name}</div>
        <div className="text-sm text-muted">
          {formatDate(dateOf(day), { weekday: true })}
          {initial.clocked ? ` · clocked ${initial.clocked}` : ' · no clock-in'}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Field label="In">
          <Input value={tin} onChange={(e) => setIn(e.target.value)} placeholder="09:00" className="tabular" autoFocus />
        </Field>
        <Field label="Out">
          <Input value={tout} onChange={(e) => setOut(e.target.value)} placeholder="18:00" className="tabular" />
        </Field>
      </div>
      <Field label="Reason" hint="Saved in the activity log">
        <Input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. Forgot to clock out" />
      </Field>
      <div className="flex items-center justify-between gap-2 pt-1">
        <span className="text-sm text-muted tabular">{validTime(tin) && validTime(tout) && tin < tout ? `${fmtHours(hoursBetween(tin, tout))} h` : ''}</span>
        <div className="flex gap-2">
          <Button size="sm" variant="ghost" onClick={onDone}>
            Cancel
          </Button>
          <Button size="sm" variant="primary" type="submit" disabled={!ok}>
            Save
          </Button>
        </div>
      </div>
    </form>
  )
}

function AddEntryModal() {
  const open = usePayroll((s) => s.modal === 'timesheet')
  const setModal = usePayroll((s) => s.setModal)
  const correct = usePayroll((s) => s.correct)
  const [staffId, setStaffId] = useState(payrollStaff[0].id)
  const [date, setDate] = useState(TODAY)
  const [tin, setIn] = useState('09:00')
  const [tout, setOut] = useState('18:00')
  const [reason, setReason] = useState('')

  useEffect(() => {
    if (open) {
      setDate(new Date(TODAY.getFullYear(), TODAY.getMonth(), Math.max(1, TODAY.getDate() - 1)))
      setReason('')
    }
  }, [open])

  const inMonth = date.getMonth() === TODAY.getMonth() && date <= TODAY
  const ok = inMonth && validTime(tin) && validTime(tout) && tin < tout && reason.trim().length > 0

  return (
    <Modal
      open={open}
      onOpenChange={(o) => !o && setModal(null)}
      title="Add timesheet entry"
      description="For a shift that wasn’t clocked, like a training day off-site."
      size="sm"
      footer={
        <>
          <Button variant="ghost" onClick={() => setModal(null)}>
            Cancel
          </Button>
          <Button
            variant="primary"
            disabled={!ok}
            onClick={() => {
              correct(`${staffId}-${date.getDate()}`, { in: tin, out: tout, hours: hoursBetween(tin, tout), reason: reason.trim() })
              setModal(null)
              toast.success('Entry added', { description: `${staffById[staffId].name}, ${formatDate(date, { weekday: true })}` })
            }}
          >
            Add entry
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
        <Field label="Date" error={!inMonth ? `Pick a day in ${monthLong(TODAY.getMonth())}, up to today` : undefined}>
          <DatePicker value={date} onChange={setDate} />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="In">
            <Input value={tin} onChange={(e) => setIn(e.target.value)} className="tabular" />
          </Field>
          <Field label="Out">
            <Input value={tout} onChange={(e) => setOut(e.target.value)} className="tabular" />
          </Field>
        </div>
        <Field label="Reason">
          <Input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. Product training at the supplier" />
        </Field>
      </div>
    </Modal>
  )
}

export function Timesheet() {
  const corrections = usePayroll((s) => s.corrections)
  const [editing, setEditing] = useState<string | null>(null)
  const today = TODAY.getDate()

  return (
    <>
      <div className="mb-4 flex flex-wrap items-baseline justify-between gap-3">
        <h2 className="text-lg font-medium text-fg">
          {monthLong(TODAY.getMonth())} {TODAY.getFullYear()}
        </h2>
        <p className="text-sm text-muted">Hours come from clock-in and clock-out in My earnings. Click a day to correct it.</p>
      </div>
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-separate border-spacing-0 text-sm">
            <thead>
              <tr>
                <th className="sticky left-0 z-10 h-12 min-w-56 border-b border-border bg-surface pl-5 text-left text-xs font-medium text-faint">Staff member</th>
                {DAYS.map((d) => (
                  <th
                    key={d}
                    className={cn(
                      'h-12 min-w-9 border-b border-border px-0.5 text-center text-xs font-medium',
                      isWeekend(d) ? 'bg-fill/60 text-faint' : 'text-muted',
                    )}
                  >
                    <span className={cn('mx-auto flex w-7 flex-col items-center rounded-lg py-1', d === today && 'bg-accent-soft text-accent-fg')}>
                      <span className="tabular">{d}</span>
                      <span className="text-[10px] font-normal">{dayShort(dateOf(d).getDay()).slice(0, 2)}</span>
                    </span>
                  </th>
                ))}
                <th className="sticky right-0 z-10 h-12 min-w-20 border-b border-l border-border bg-surface pr-5 text-right text-xs font-medium text-faint">Hours</th>
              </tr>
            </thead>
            <tbody>
              {payrollStaff.map((s) => {
                let total = 0
                return (
                  <tr key={s.id} className="group/row">
                    <td className="sticky left-0 z-10 h-14 border-b border-border bg-surface pl-5 group-last/row:border-b-0">
                      <span className="flex items-center gap-2.5">
                        <Avatar name={s.name} color={s.color} size="sm" />
                        <span className="min-w-0">
                          <span className="block w-36 truncate text-base text-fg">{s.name}</span>
                          <span className="block w-36 truncate text-xs text-muted">{s.position}</span>
                        </span>
                      </span>
                    </td>
                    {DAYS.map((d) => {
                      const key = `${s.id}-${d}`
                      const fix = corrections[key]
                      const shift = shiftFor(s, d)
                      const hours = fix ? fix.hours : typeof shift === 'object' ? shift.hours : 0
                      if (d < today || fix) total += hours
                      const editable = d <= today
                      const cellBase = cn(
                        'h-14 border-b border-border p-0 text-center group-last/row:border-b-0',
                        isWeekend(d) && 'bg-fill/60',
                        d === today && 'bg-accent-soft/50',
                      )
                      let content: React.ReactNode = null
                      if (fix) content = <span className="font-medium text-accent-fg underline decoration-dotted underline-offset-4 tabular">{fmtHours(fix.hours)}</span>
                      else if (shift === 'off') content = <span className="text-disabled">–</span>
                      else if (shift === 'today')
                        content = (
                          <span className="inline-flex items-center gap-1 text-xs text-positive">
                            <span className="size-1.5 rounded-full bg-positive" />
                            In
                          </span>
                        )
                      else if (typeof shift === 'object')
                        content = (
                          <span className="relative text-fg tabular">
                            {fmtHours(shift.hours)}
                            {shift.late && <span className="absolute -top-0.5 -right-2 size-1.5 rounded-full bg-warning" />}
                          </span>
                        )
                      const btn = (
                        <button
                          type="button"
                          disabled={!editable}
                          onClick={() => setEditing(key)}
                          aria-label={`${s.name}, ${formatDate(dateOf(d))}`}
                          className="grid h-full w-full place-items-center rounded-md hover:bg-fill-hover disabled:cursor-default disabled:hover:bg-transparent"
                        >
                          {content}
                        </button>
                      )
                      return (
                        <td key={d} className={cellBase}>
                          {editing === key ? (
                            <Popover open onOpenChange={(o) => !o && setEditing(null)} trigger={btn} align="center" className="p-0">
                              <CorrectForm
                                s={s}
                                day={d}
                                initial={
                                  fix
                                    ? { in: fix.in, out: fix.out }
                                    : typeof shift === 'object'
                                      ? { in: shift.in, out: shift.out, clocked: `${shift.in}–${shift.out}` }
                                      : shift === 'today'
                                        ? { in: todayClockIn(s), out: '', clocked: `in at ${todayClockIn(s)}` }
                                        : { in: s.today?.start ?? '09:00', out: s.today?.end ?? '18:00' }
                                }
                                onDone={() => setEditing(null)}
                              />
                            </Popover>
                          ) : (
                            btn
                          )}
                        </td>
                      )
                    })}
                    <td className="sticky right-0 z-10 h-14 border-b border-l border-border bg-surface pr-5 text-right text-base text-fg tabular group-last/row:border-b-0">
                      {Math.round(total)}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </Card>
      <div className="mt-4 flex flex-wrap items-center gap-5 text-sm text-muted">
        <span className="flex items-center gap-2">
          <span className="size-1.5 rounded-full bg-warning" /> Late arrival
        </span>
        <span className="flex items-center gap-2">
          <span className="font-medium text-accent-fg underline decoration-dotted underline-offset-4">9</span> Corrected by hand
        </span>
        <span className="flex items-center gap-2">
          <span className="text-disabled">–</span> Day off
        </span>
        <span className="flex items-center gap-2">
          <span className="size-1.5 rounded-full bg-positive" /> On shift now
        </span>
      </div>
      <AddEntryModal />
    </>
  )
}
