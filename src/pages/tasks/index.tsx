import { useEffect, useMemo, useRef, useState } from 'react'
import { toast } from 'sonner'
import { ClientRow } from '@/components/client-picker'
import { I, Icon } from '@/components/icons'
import { Avatar } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Checkbox, Chip } from '@/components/ui/controls'
import { DatePicker } from '@/components/ui/date-picker'
import { DetailRow, Sheet } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/input'
import { EmptyState } from '@/components/ui/misc'
import { Page, PageHeader, Toolbar } from '@/components/ui/page'
import { Select } from '@/components/ui/select'
import { Segmented } from '@/components/ui/tabs'
import { staff, staffById, staffName } from '@/data/staff'
import { cn } from '@/lib/cn'
import { formatDate, formatRelative, formatTime } from '@/lib/format'
import { useOverlays } from '@/lib/overlays'
import { useData } from '@/lib/store'
import { NOW, addDays, at, isSameDay, startOfDay } from '@/lib/time'
import { ME, SOURCE_LABEL, TYPE_META, isOverdue, timeOptions, useTasks, type Task } from './store'

type Status = 'open' | 'overdue' | 'done'

/** Rows sit under Today / Tomorrow headings, so those only need the time. */
function dueLabel(t: Task) {
  if (isSameDay(t.due, NOW) || isSameDay(t.due, addDays(NOW, 1))) return formatTime(t.due)
  if (isSameDay(t.due, addDays(NOW, -1))) return `Yesterday, ${formatTime(t.due)}`
  return formatDate(t.due, { weekday: true })
}

const assignees = staff.filter((s) => !s.invited && s.role !== 'Tenant')

function TaskRow({ task, leaving, onToggle, onOpen }: { task: Task; leaving: boolean; onToggle: () => void; onOpen: () => void }) {
  const clients = useData((s) => s.clients)
  const openClient = useOverlays((s) => s.openClient)
  const client = task.clientId ? clients.find((c) => c.id === task.clientId) : undefined
  const meta = TYPE_META[task.type]
  const assignee = staffById[task.assigneeId]
  const overdue = isOverdue(task)
  const struck = task.done || leaving

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={(e) => e.key === 'Enter' && onOpen()}
      className={cn(
        'flex cursor-pointer items-center gap-3.5 px-5 py-3.5 transition-[background-color,opacity] duration-200 hover:bg-fill/60',
        leaving && 'opacity-50',
      )}
    >
      <Checkbox round checked={struck} onChange={onToggle} />
      <span className="grid size-8 shrink-0 place-items-center rounded-full bg-fill text-muted">
        <Icon icon={meta.icon} size={16} />
      </span>
      <div className="min-w-0 flex-1">
        <div className={cn('truncate text-base', struck ? 'text-muted line-through decoration-faint' : 'text-fg')}>{task.title}</div>
        <div className="mt-0.5 flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted">
          {client && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                openClient(client.id)
              }}
              className="truncate text-fg hover:underline underline-offset-4"
            >
              {client.name}
            </button>
          )}
          {client && <span className="text-faint">·</span>}
          <span>{meta.label}</span>
          {task.source && <Badge className="h-5">{SOURCE_LABEL[task.source]}</Badge>}
        </div>
      </div>
      <span className={cn('hidden shrink-0 text-sm whitespace-nowrap tabular sm:block', overdue ? 'font-medium text-negative' : 'text-muted')}>
        {task.done && task.doneAt ? `Done ${formatRelative(task.doneAt)}` : dueLabel(task)}
      </span>
      <Avatar name={staffName(assignee)} color={assignee.color} size="sm" />
    </div>
  )
}

function TaskSheet({ id, onClose }: { id: string | null; onClose: () => void }) {
  const task = useTasks((s) => s.tasks.find((t) => t.id === id))
  const update = useTasks((s) => s.update)
  const setDone = useTasks((s) => s.setDone)
  const comment = useTasks((s) => s.comment)
  const clients = useData((s) => s.clients)
  const openClient = useOverlays((s) => s.openClient)
  const [draft, setDraft] = useState('')

  const last = useRef<Task | undefined>(task)
  if (task) last.current = task
  const t = task ?? last.current

  useEffect(() => setDraft(''), [id])
  if (!t) return null

  const client = t.clientId ? clients.find((c) => c.id === t.clientId) : undefined
  const meta = TYPE_META[t.type]
  const setDue = (date: Date, time: string) => update(t.id, { due: at(date, time) })

  return (
    <Sheet
      open={!!task}
      onOpenChange={(o) => !o && onClose()}
      title="Task"
      width="lg"
      footer={
        t.done ? (
          <Button className="w-full" icon={I.reload} onClick={() => setDone(t.id, false)}>
            Reopen task
          </Button>
        ) : (
          <Button
            variant="primary"
            className="w-full"
            icon={I.check}
            onClick={() => {
              setDone(t.id, true)
              onClose()
              toast.success('Task completed', { action: { label: 'Undo', onClick: () => setDone(t.id, false) } })
            }}
          >
            Mark as done
          </Button>
        )
      }
    >
      <div className="flex flex-col gap-6 p-5">
        <div>
          <div className="flex items-center gap-2 text-sm text-muted">
            <Icon icon={meta.icon} size={16} />
            {meta.label}
            {t.source && <Badge>{SOURCE_LABEL[t.source]}</Badge>}
            {t.done && <Badge tone="positive">Done</Badge>}
            {isOverdue(t) && <Badge tone="negative">Overdue</Badge>}
          </div>
          <h2 className={cn('mt-2 text-xl font-normal', t.done ? 'text-muted line-through decoration-faint' : 'text-fg')}>{t.title}</h2>
          {t.details && <p className="mt-2 text-base text-muted">{t.details}</p>}
        </div>

        <div className="divide-y divide-border border-y border-border">
          <div className="flex items-center justify-between gap-4 py-2.5">
            <span className="text-base text-muted">Due</span>
            <div className="flex items-center gap-2">
              <span className="w-40">
                <DatePicker value={startOfDay(t.due)} onChange={(d) => setDue(d, formatTime(t.due))} />
              </span>
              <span className="w-24">
                <Select value={formatTime(t.due)} onChange={(v) => setDue(startOfDay(t.due), v)} options={timeOptions()} />
              </span>
            </div>
          </div>
          <div className="flex items-center justify-between gap-4 py-2.5">
            <span className="text-base text-muted">Assigned to</span>
            <span className="w-56">
              <Select
                value={t.assigneeId}
                onChange={(v) => {
                  update(t.id, { assigneeId: v })
                  toast.success(`Reassigned to ${staffName(staffById[v]).split(' ')[0]}`)
                }}
                options={assignees.map((s) => ({ value: s.id, label: staffName(s), icon: <Avatar name={s.name} color={s.color} size="xs" /> }))}
                align="end"
              />
            </span>
          </div>
          {client && (
            <DetailRow label="Client">
              <button type="button" onClick={() => openClient(client.id)} className="rounded-lg px-1 py-0.5 hover:bg-fill">
                <ClientRow client={client} compact />
              </button>
            </DetailRow>
          )}
          <DetailRow label="Created">
            {t.createdBy === 'NavCRM' ? 'Automatically' : t.createdBy}, {formatRelative(t.createdAt)}
          </DetailRow>
        </div>

        <div>
          <div className="mb-3 text-sm font-medium text-muted">Comments</div>
          {t.comments.length > 0 && (
            <ul className="mb-4 flex flex-col gap-4">
              {t.comments.map((c) => (
                <li key={c.id} className="flex gap-3">
                  <Avatar name={c.author} size="sm" className="mt-0.5" />
                  <div>
                    <div className="text-sm text-muted">
                      <span className="font-medium text-fg">{c.author}</span> · {formatRelative(c.at)}
                    </div>
                    <p className="mt-0.5 text-base text-fg">{c.text}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
          <form
            onSubmit={(e) => {
              e.preventDefault()
              if (!draft.trim()) return
              comment(t.id, draft.trim())
              setDraft('')
            }}
          >
            <Textarea value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Add a comment for the team" className="min-h-16" />
            <div className="mt-2 flex justify-end">
              <Button type="submit" size="sm" disabled={!draft.trim()}>
                Comment
              </Button>
            </div>
          </form>
        </div>
      </div>
    </Sheet>
  )
}

export default function Tasks() {
  const tasks = useTasks((s) => s.tasks)
  const setDone = useTasks((s) => s.setDone)
  const openNewTask = useOverlays((s) => s.openNewTask)
  const [who, setWho] = useState<'all' | 'mine'>('all')
  const [status, setStatus] = useState<Status>('open')
  const [openId, setOpenId] = useState<string | null>(null)
  // Just-completed tasks stay in place briefly, struck through, so the change reads.
  const [leaving, setLeaving] = useState<Set<string>>(new Set())

  const scoped = useMemo(() => tasks.filter((t) => who === 'all' || t.assigneeId === ME), [tasks, who])
  const counts = {
    open: scoped.filter((t) => !t.done).length,
    overdue: scoped.filter(isOverdue).length,
    done: scoped.filter((t) => t.done).length,
  }

  function toggle(t: Task) {
    if (t.done) {
      setDone(t.id, false)
      return
    }
    setDone(t.id, true)
    setLeaving((s) => new Set(s).add(t.id))
    setTimeout(() => setLeaving((s) => {
      const n = new Set(s)
      n.delete(t.id)
      return n
    }), 900)
    toast.success('Task completed', { description: t.title, action: { label: 'Undo', onClick: () => setDone(t.id, false) } })
  }

  const visible = scoped.filter((t) =>
    status === 'done' ? t.done : status === 'overdue' ? isOverdue(t) || leaving.has(t.id) : !t.done || leaving.has(t.id),
  )

  const groups: { title: string; items: Task[] }[] =
    status === 'done'
      ? [{ title: 'Completed', items: [...visible].sort((a, b) => (b.doneAt?.getTime() ?? 0) - (a.doneAt?.getTime() ?? 0)) }]
      : (() => {
          const sorted = [...visible].sort((a, b) => +a.due - +b.due)
          const tomorrow = addDays(NOW, 1)
          const overdue = sorted.filter((t) => t.due < NOW)
          const today = sorted.filter((t) => t.due >= NOW && isSameDay(t.due, NOW))
          const tmr = sorted.filter((t) => isSameDay(t.due, tomorrow))
          const later = sorted.filter((t) => t.due > NOW && !isSameDay(t.due, NOW) && !isSameDay(t.due, tomorrow))
          return [
            { title: 'Overdue', items: overdue },
            { title: 'Today', items: today },
            { title: 'Tomorrow', items: tmr },
            { title: 'Later', items: later },
          ]
        })()

  const nonEmpty = groups.filter((g) => g.items.length)

  return (
    <Page>
      <PageHeader
        title="Tasks"
        subtitle="Call back, remind, resolve a client’s question"
        actions={
          <Button variant="primary" icon={I.add} onClick={() => openNewTask()}>
            New task
          </Button>
        }
      />

      <Toolbar>
        <Segmented
          value={who}
          onChange={setWho}
          items={[
            { value: 'all', label: 'All' },
            { value: 'mine', label: 'Mine' },
          ]}
        />
        <span className="mx-1 h-5 w-px bg-border" />
        <Chip active={status === 'open'} count={counts.open} onClick={() => setStatus('open')}>
          Open
        </Chip>
        <Chip active={status === 'overdue'} count={counts.overdue} onClick={() => setStatus('overdue')}>
          Overdue
        </Chip>
        <Chip active={status === 'done'} count={counts.done} onClick={() => setStatus('done')}>
          Done
        </Chip>
      </Toolbar>

      {nonEmpty.length ? (
        <div className="flex flex-col gap-6">
          {nonEmpty.map((g) => (
            <section key={g.title}>
              <h2 className={cn('mb-2 flex items-center gap-2 text-sm font-medium', g.title === 'Overdue' ? 'text-negative' : 'text-muted')}>
                {g.title}
                <span className="font-normal text-faint tabular">{g.items.length}</span>
              </h2>
              <Card className="divide-y divide-border overflow-hidden">
                {g.items.map((t) => (
                  <TaskRow key={t.id} task={t} leaving={leaving.has(t.id)} onToggle={() => toggle(t)} onOpen={() => setOpenId(t.id)} />
                ))}
              </Card>
            </section>
          ))}
        </div>
      ) : (
        <Card>
          <EmptyState
            icon={I.checkCircle}
            title={status === 'done' ? 'Nothing completed yet' : status === 'overdue' ? 'Nothing overdue' : 'All clear'}
            description={
              status === 'open'
                ? 'Tasks also appear on their own: after a bad review, a booking conflict, or a question the chat assistant can’t answer.'
                : undefined
            }
          />
        </Card>
      )}

      {status !== 'done' && counts.done > 0 && (
        <p className="mt-6 text-center text-sm text-faint">
          {counts.done} completed ·{' '}
          <button type="button" className="text-muted hover:text-fg hover:underline underline-offset-4" onClick={() => setStatus('done')}>
            show
          </button>
        </p>
      )}

      <TaskSheet id={openId} onClose={() => setOpenId(null)} />
    </Page>
  )
}

