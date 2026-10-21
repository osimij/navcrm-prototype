import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router'
import { toast } from 'sonner'
import { ClientPicker } from '@/components/client-picker'
import { Icon } from '@/components/icons'
import { Avatar } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { DatePicker } from '@/components/ui/date-picker'
import { Modal } from '@/components/ui/dialog'
import { Field, Input, Textarea } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { staff, staffById, staffName } from '@/data/staff'
import { cn } from '@/lib/cn'
import { formatDay } from '@/lib/format'
import { useOverlays } from '@/lib/overlays'
import { NOW, TODAY, at } from '@/lib/time'
import { ME, TYPE_META, timeOptions, useTasks, type TaskType } from '@/pages/tasks/store'

const assignees = staff.filter((s) => !s.invited && s.role !== 'Tenant')

/** The next half hour after now, so a fresh task isn't overdue the moment it's made. */
function nextSlot() {
  const m = NOW.getHours() * 60 + NOW.getMinutes()
  const n = Math.min(21 * 60, Math.ceil((m + 30) / 30) * 30)
  return `${String(Math.floor(n / 60)).padStart(2, '0')}:${String(n % 60).padStart(2, '0')}`
}

export function NewTaskModal() {
  const state = useOverlays((s) => s.newTask)
  const close = useOverlays((s) => s.close)
  const add = useTasks((s) => s.add)
  const navigate = useNavigate()

  const [title, setTitle] = useState('')
  const [type, setType] = useState<TaskType>('call')
  const [date, setDate] = useState(TODAY)
  const [time, setTime] = useState(nextSlot())
  const [assigneeId, setAssigneeId] = useState(ME)
  const [clientId, setClientId] = useState<string | null>(null)
  const [details, setDetails] = useState('')
  const [touched, setTouched] = useState(false)

  useEffect(() => {
    if (!state) return
    setTitle(state.title ?? '')
    setType('call')
    setDate(TODAY)
    setTime(nextSlot())
    setAssigneeId(ME)
    setClientId(state.clientId ?? null)
    setDetails('')
    setTouched(false)
  }, [state])

  function submit() {
    setTouched(true)
    if (!title.trim()) return
    const due = at(date, time)
    add({ title: title.trim(), type, due, assigneeId, clientId: clientId ?? undefined, details: details.trim() || undefined })
    close('newTask')
    toast.success('Task added', {
      description: `${formatDay(due)}, ${time} · ${staffName(staffById[assigneeId]).split(' ')[0]}`,
      action: { label: 'View', onClick: () => navigate('/tasks') },
    })
  }

  return (
    <Modal
      open={!!state}
      onOpenChange={(o) => !o && close('newTask')}
      title="New task"
      footer={
        <>
          <Button variant="ghost" onClick={() => close('newTask')}>
            Cancel
          </Button>
          <Button variant="primary" onClick={submit} disabled={touched && !title.trim()}>
            Add task
          </Button>
        </>
      }
    >
      <form
        className="flex flex-col gap-4"
        onSubmit={(e) => {
          e.preventDefault()
          submit()
        }}
      >
        <Field label="What to do" error={touched && !title.trim() ? 'Describe the task' : undefined}>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Call back about the bridal package"
            autoFocus
            aria-invalid={touched && !title.trim()}
          />
        </Field>
        <Field label="Type">
          <div className="flex flex-wrap gap-1.5">
            {(Object.keys(TYPE_META) as TaskType[]).map((t) => (
              <button
                key={t}
                type="button"
                aria-pressed={type === t}
                onClick={() => setType(t)}
                className={cn(
                  'press inline-flex h-8 items-center gap-1.5 rounded-full px-3 text-sm font-medium ring-1 ring-inset',
                  type === t ? 'bg-fg text-bg ring-fg' : 'bg-surface text-fg ring-border hover:bg-fill',
                )}
              >
                <Icon icon={TYPE_META[t].icon} size={15} className={type === t ? '' : 'text-muted'} />
                {TYPE_META[t].label}
              </button>
            ))}
          </div>
        </Field>
        <div className="grid grid-cols-[1fr_120px] gap-3 sm:grid-cols-[1fr_120px_1.2fr]">
          <Field label="Due">
            <DatePicker value={date} onChange={setDate} />
          </Field>
          <Field label="Time">
            <Select value={time} onChange={setTime} options={timeOptions()} />
          </Field>
          <Field label="Assigned to" className="col-span-2 sm:col-span-1">
            <Select
              value={assigneeId}
              onChange={setAssigneeId}
              options={assignees.map((s) => ({
                value: s.id,
                label: s.id === ME ? `${staffName(s)} (you)` : staffName(s),
                hint: s.position,
                icon: <Avatar name={s.name} color={s.color} size="sm" />,
              }))}
            />
          </Field>
        </div>
        <Field label="Client" optional>
          <ClientPicker value={clientId} onChange={setClientId} />
        </Field>
        <Field label="Details" optional>
          <Textarea value={details} onChange={(e) => setDetails(e.target.value)} placeholder="Anything the person doing it should know" />
        </Field>
        <button type="submit" hidden />
      </form>
    </Modal>
  )
}
