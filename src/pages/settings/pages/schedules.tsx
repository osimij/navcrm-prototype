import { useState } from 'react'
import { toast } from 'sonner'
import { I } from '@/components/icons'
import { Avatar } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button, IconButton } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Checkbox, Switch } from '@/components/ui/controls'
import { DatePicker } from '@/components/ui/date-picker'
import { Modal } from '@/components/ui/dialog'
import { Field, Input } from '@/components/ui/input'
import { Popover } from '@/components/ui/popover'
import { Select } from '@/components/ui/select'
import { Segmented } from '@/components/ui/tabs'
import { business } from '@/data/business'
import { staff, staffById } from '@/data/staff'
import { cn } from '@/lib/cn'
import { dayLong, dayShort, formatDate } from '@/lib/format'
import { TODAY, addDays, isSameDay } from '@/lib/time'
import { WEEKDAYS, timeOptions, useDraft } from '../parts-a/common'
import { SaveBar, SettingsPage, SettingsSection } from '../ui'

type DayHours = { open: boolean; from: string; to: string }
type Shift = { working: boolean; from: string; to: string }

const branchHours = (from: string, to: string, sunday: DayHours): DayHours[] => [
  ...Array.from({ length: 6 }, () => ({ open: true, from, to })),
  sunday,
]

/** Each master's regular day off (0 = Sunday). */
const OFF: Record<string, number[]> = { s1: [1], s2: [2], s3: [0], s4: [3], s5: [0], s6: [1], s7: [5], s8: [0, 6] }
const PEOPLE = staff.filter((s) => s.today && !s.invited && s.role !== 'Owner')

type TimeOff = { id: string; staffId: string; type: 'Vacation' | 'Sick leave' | 'Other'; from: Date; to: Date; note?: string }

const dayKey = (d: Date) => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`

export default function SchedulesSettings() {
  const hours = useDraft({
    b1: branchHours('09:00', '21:00', { open: true, from: '10:00', to: '18:00' }),
    b2: branchHours('10:00', '20:00', { open: false, from: '10:00', to: '18:00' }),
  })
  const [branch, setBranch] = useState<'b1' | 'b2'>('b1')
  const [week, setWeek] = useState(0)
  const [overrides, setOverrides] = useState<Record<string, Shift>>({})
  const [editing, setEditing] = useState<string | null>(null)
  const [cell, setCell] = useState<Shift & { repeat: boolean }>({ working: true, from: '09:00', to: '18:00', repeat: false })
  const [timeOff, setTimeOff] = useState<TimeOff[]>([
    { id: 't1', staffId: 's4', type: 'Vacation', from: addDays(TODAY, 12), to: addDays(TODAY, 23) },
    { id: 't2', staffId: 's3', type: 'Other', from: addDays(TODAY, 36), to: addDays(TODAY, 37), note: 'Training in Almaty' },
    { id: 't3', staffId: 's5', type: 'Sick leave', from: addDays(TODAY, -4), to: addDays(TODAY, -3) },
  ])
  const [offOpen, setOffOpen] = useState(false)
  const [off, setOff] = useState<Omit<TimeOff, 'id'>>({ staffId: 's1', type: 'Vacation', from: TODAY, to: addDays(TODAY, 6) })

  const monday = addDays(TODAY, -((TODAY.getDay() + 6) % 7) + week * 7)
  const days = Array.from({ length: 7 }, (_, i) => addDays(monday, i))

  function shiftFor(staffId: string, d: Date): Shift & { away?: TimeOff } {
    const away = timeOff.find((t) => t.staffId === staffId && d >= t.from && d < addDays(t.to, 1))
    const o = overrides[`${staffId}-${dayKey(d)}`] ?? overrides[`${staffId}-w${d.getDay()}`]
    const s = staffById[staffId]
    const base: Shift = { working: !OFF[staffId]?.includes(d.getDay()), from: s.today!.start, to: s.today!.end }
    return { ...(o ?? base), away }
  }

  function openCell(staffId: string, d: Date) {
    const s = shiftFor(staffId, d)
    setCell({ working: s.working, from: s.from, to: s.to, repeat: false })
    setEditing(`${staffId}-${dayKey(d)}`)
  }

  function saveCell(staffId: string, d: Date) {
    const key = cell.repeat ? `${staffId}-w${d.getDay()}` : `${staffId}-${dayKey(d)}`
    setOverrides((o) => {
      const next = { ...o, [key]: { working: cell.working, from: cell.from, to: cell.to } }
      if (cell.repeat) delete next[`${staffId}-${dayKey(d)}`]
      return next
    })
    setEditing(null)
    const who = staffById[staffId].name.split(' ')[0]
    toast.success(cell.repeat ? `${who}: every ${dayLong(d.getDay())} updated` : `${who}: ${formatDate(d, { weekday: true })} updated`)
  }

  const setDay = (i: number, p: Partial<DayHours>) =>
    hours.setDraft((h) => ({ ...h, [branch]: h[branch].map((d, j) => (j === i ? { ...d, ...p } : d)) }))

  return (
    <SettingsPage wide title="Working hours" description="Free booking slots come from these schedules, so keep them current.">
      <SettingsSection
        title="Branch hours"
        description="When the doors are open. Staff can’t be booked outside these hours."
        action={
          <Segmented
            size="sm"
            value={branch}
            onChange={setBranch}
            items={business.branches.map((b) => ({ value: b.id as 'b1' | 'b2', label: b.name }))}
          />
        }
      >
        <ul className="max-w-[640px]">
          {hours.draft[branch].map((d, i) => (
            <li key={i} className="flex flex-wrap items-center gap-x-5 gap-y-2 border-b border-border py-3 last:border-b-0">
              <span className="w-28 text-base text-fg">{WEEKDAYS[i]}</span>
              <Switch aria-label={`${WEEKDAYS[i]} opening hours`} checked={d.open} onChange={(open) => setDay(i, { open })} />
              {d.open ? (
                <span className="flex items-center gap-2">
                  <Select value={d.from} onChange={(from) => setDay(i, { from })} options={timeOptions(6, 14)} className="w-28" />
                  <span className="text-faint">–</span>
                  <Select value={d.to} onChange={(to) => setDay(i, { to })} options={timeOptions(12, 23)} className="w-28" />
                </span>
              ) : (
                <span className="text-base text-muted">Closed</span>
              )}
            </li>
          ))}
        </ul>
      </SettingsSection>

      <SettingsSection
        title="Staff schedule"
        description="Click a day to change it, once or every week."
        action={
          <div className="flex items-center gap-1">
            <IconButton icon={I.chevronLeft} label="Previous week" size="sm" onClick={() => setWeek(week - 1)} />
            <span className="min-w-36 text-center text-sm text-muted tabular">
              {formatDate(days[0])} – {formatDate(days[6])}
            </span>
            <IconButton icon={I.chevronRight} label="Next week" size="sm" onClick={() => setWeek(week + 1)} />
            {week !== 0 && (
              <Button size="sm" variant="ghost" onClick={() => setWeek(0)}>
                This week
              </Button>
            )}
          </div>
        }
      >
        <Card className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[760px] border-separate border-spacing-0 text-base">
            <thead>
              <tr>
                <th className="border-b border-border px-4 text-left text-xs font-medium text-faint">Staff</th>
                {days.map((d) => (
                  <th
                    key={d.toISOString()}
                    className={cn('border-b border-border px-1 text-center text-xs font-medium', isSameDay(d, TODAY) ? 'text-accent-fg' : 'text-faint')}
                  >
                    {dayShort(d.getDay())} {d.getDate()}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {PEOPLE.map((p) => (
                <tr key={p.id}>
                  <td className="border-b border-border px-4 py-2">
                    <span className="flex items-center gap-2.5">
                      <Avatar name={p.name} color={p.color} size="sm" />
                      <span className="min-w-0">
                        <span className="block truncate text-base text-fg">{p.name.split(' ')[0]}</span>
                        <span className="block truncate text-xs text-muted">{p.position}</span>
                      </span>
                    </span>
                  </td>
                  {days.map((d) => {
                    const s = shiftFor(p.id, d)
                    const key = `${p.id}-${dayKey(d)}`
                    return (
                      <td key={key} className="border-b border-border p-1">
                        {s.away ? (
                          <div className="flex h-11 items-center justify-center rounded-lg bg-warning-soft text-xs font-medium text-warning">{s.away.type}</div>
                        ) : (
                          <Popover
                            open={editing === key}
                            onOpenChange={(o) => (o ? openCell(p.id, d) : setEditing(null))}
                            className="w-64 p-4"
                            trigger={
                              <button
                                type="button"
                                className={cn(
                                  'press flex h-11 w-full flex-col items-center justify-center rounded-lg text-xs tabular',
                                  s.working ? 'bg-fill text-fg hover:bg-fill-hover' : 'text-faint hover:bg-fill',
                                  isSameDay(d, TODAY) && 'ring-1 ring-inset ring-accent/40',
                                )}
                              >
                                {s.working ? (
                                  <>
                                    <span>{s.from}</span>
                                    <span className="text-muted">{s.to}</span>
                                  </>
                                ) : (
                                  'Day off'
                                )}
                              </button>
                            }
                          >
                            <div className="mb-3 text-base font-medium text-fg">
                              {p.name.split(' ')[0]} · {formatDate(d, { weekday: true })}
                            </div>
                            <div className="flex flex-col gap-3">
                              <Switch checked={cell.working} onChange={(working) => setCell({ ...cell, working })} label="Working" />
                              {cell.working && (
                                <div className="flex items-center gap-2">
                                  <Select value={cell.from} onChange={(from) => setCell({ ...cell, from })} options={timeOptions(7, 14)} />
                                  <span className="text-faint">–</span>
                                  <Select value={cell.to} onChange={(to) => setCell({ ...cell, to })} options={timeOptions(12, 22)} />
                                </div>
                              )}
                              <Checkbox checked={cell.repeat} onChange={(repeat) => setCell({ ...cell, repeat })} label={`Every ${dayLong(d.getDay())}`} />
                              <div className="flex justify-end gap-2 pt-1">
                                <Button size="sm" variant="ghost" onClick={() => setEditing(null)}>
                                  Cancel
                                </Button>
                                <Button size="sm" variant="primary" onClick={() => saveCell(p.id, d)}>
                                  Save
                                </Button>
                              </div>
                            </div>
                          </Popover>
                        )}
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </SettingsSection>

      <SettingsSection
        title="Time off and sick leave"
        description="Visits that fall in this time show up as conflicts in the calendar."
        action={
          <Button size="sm" variant="secondary" icon={I.add} onClick={() => setOffOpen(true)}>
            Add time off
          </Button>
        }
      >
        <ul>
          {[...timeOff]
            .sort((a, b) => +a.from - +b.from)
            .map((t) => {
              const s = staffById[t.staffId]
              const past = t.to < TODAY
              return (
                <li key={t.id} className="flex items-center gap-3 border-b border-border py-3.5 last:border-b-0">
                  <Avatar name={s.name} color={s.color} />
                  <span className="min-w-0 flex-1">
                    <span className={cn('block text-base', past ? 'text-muted' : 'text-fg')}>{s.name}</span>
                    <span className="block text-sm text-muted">
                      {formatDate(t.from)} – {formatDate(t.to)}
                      {t.note && ` · ${t.note}`}
                    </span>
                  </span>
                  <Badge tone={past ? 'neutral' : t.type === 'Sick leave' ? 'negative' : 'warning'}>{past ? 'Ended' : t.type}</Badge>
                  <IconButton
                    icon={I.delete}
                    label="Remove"
                    size="sm"
                    onClick={() => {
                      setTimeOff((l) => l.filter((x) => x.id !== t.id))
                      toast('Time off removed', { action: { label: 'Undo', onClick: () => setTimeOff((l) => [...l, t]) } })
                    }}
                  />
                </li>
              )
            })}
        </ul>
      </SettingsSection>

      <SaveBar dirty={hours.dirty} onSave={() => hours.save('Branch hours saved')} onDiscard={hours.discard} />

      <Modal
        open={offOpen}
        onOpenChange={setOffOpen}
        title="Add time off"
        footer={
          <>
            <Button variant="ghost" onClick={() => setOffOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              disabled={off.to < off.from}
              onClick={() => {
                setTimeOff((l) => [...l, { ...off, id: `t${Date.now()}` }])
                setOffOpen(false)
                toast.success(`${off.type} added for ${staffById[off.staffId].name.split(' ')[0]}`, {
                  description: 'They show as away in the calendar.',
                })
              }}
            >
              Add
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          <Field label="Staff member">
            <Select value={off.staffId} onChange={(staffId) => setOff({ ...off, staffId })} options={PEOPLE.map((p) => ({ value: p.id, label: p.name, hint: p.position }))} />
          </Field>
          <Field label="Reason">
            <Segmented
              fill
              value={off.type}
              onChange={(type) => setOff({ ...off, type })}
              items={[
                { value: 'Vacation', label: 'Vacation' },
                { value: 'Sick leave', label: 'Sick leave' },
                { value: 'Other', label: 'Other' },
              ]}
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="From">
              <DatePicker value={off.from} onChange={(from) => setOff({ ...off, from, to: from > off.to ? from : off.to })} />
            </Field>
            <Field label="To" error={off.to < off.from ? 'Must be after the start' : undefined}>
              <DatePicker value={off.to} onChange={(to) => setOff({ ...off, to })} />
            </Field>
          </div>
          <Field label="Note" optional>
            <Input value={off.note ?? ''} onChange={(e) => setOff({ ...off, note: e.target.value })} placeholder="Visible to admins only" />
          </Field>
        </div>
      </Modal>
    </SettingsPage>
  )
}
