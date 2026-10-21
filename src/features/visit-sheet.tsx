import type { IconSvgElement } from '@hugeicons/react'
import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router'
import { toast } from 'sonner'
import { I, Icon } from '@/components/icons'
import { Avatar } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { StatCard } from '@/components/ui/stat-card'
import { Button, IconButton } from '@/components/ui/button'
import { DatePicker } from '@/components/ui/date-picker'
import { DetailRow, Modal, Sheet } from '@/components/ui/dialog'
import { Field, Textarea } from '@/components/ui/input'
import { Menu, MenuItem, MenuSeparator } from '@/components/ui/menu'
import { Money } from '@/components/ui/misc'
import { Select } from '@/components/ui/select'
import { Switch } from '@/components/ui/controls'
import { BLOCK_LABEL, SOURCE_LABEL, STATUS_META, isVisit, type Appointment, type BookingSource, type TimeBlock } from '@/data/appointments'
import type { Client } from '@/data/clients'
import { serviceById } from '@/data/services'
import { bookableStaff, staffById } from '@/data/staff'
import { cn } from '@/lib/cn'
import { formatDate, formatDay, formatDayTime, formatDuration, formatRelative, formatTime } from '@/lib/format'
import { useOverlays } from '@/lib/overlays'
import { seeded } from '@/lib/random'
import { useData } from '@/lib/store'
import { NOW, addDays, addMinutes, at, isSameDay, startOfDay } from '@/lib/time'
import { FLOW, STATUS_TOAST, nextStep } from '@/pages/calendar/visit-flow'

const SOURCE_ICON: Record<BookingSource, IconSvgElement> = {
  phone: I.phone,
  online: I.web,
  instagram: I.instagram,
  telegram: I.telegram,
  walk_in: I.store,
  assistant: I.assistant,
}

const BOOKED_TEXT: Record<BookingSource, string> = {
  phone: 'Booked by phone at the front desk',
  online: 'Booked on the online booking page',
  instagram: 'Booked from Instagram',
  telegram: 'Booked in the Telegram bot',
  walk_in: 'Walk-in, booked at the front desk',
  assistant: 'Booked by the AI assistant in Telegram',
}

type LogItem = { icon: IconSvgElement; text: string; at: Date }

/** A believable history for a visit, derived from its own data so it's stable. */
function historyFor(a: Appointment, client: Client | undefined, extra: LogItem[]): LogItem[] {
  let h = 0
  for (const ch of a.id) h = (h * 31 + ch.charCodeAt(0)) >>> 0
  const r = seeded(h)
  let created = addMinutes(startOfDay(addDays(a.start, -r.int(1, 9))), r.int(9 * 60, 21 * 60))
  if (created > NOW) created = addMinutes(NOW, -r.int(30, 60 * 40))
  const items: LogItem[] = [
    {
      icon: SOURCE_ICON[a.source],
      text: BOOKED_TEXT[a.source],
      at: created < a.start ? created : addMinutes(a.start, -90),
    },
  ]
  const order = ['booked', 'confirmed', 'arrived', 'in_progress', 'completed']
  const reached = order.indexOf(a.status)
  const reminderAt = addMinutes(a.start, -24 * 60)
  if (reminderAt < NOW && reminderAt > items[0].at) {
    items.push({ icon: client?.telegram ? I.telegram : I.mobile, text: `24-hour reminder sent ${client?.telegram ? 'in Telegram' : 'by SMS'}`, at: reminderAt })
  }
  if (reached >= 1) items.push({ icon: I.checkCircle, text: 'Confirmed by the client', at: addMinutes(reminderAt < NOW ? reminderAt : items[0].at, r.int(4, 90)) })
  if (reached >= 2) items.push({ icon: I.store, text: 'Arrived · marked by Nigora', at: addMinutes(a.start, -r.int(2, 12)) })
  if (reached >= 3) items.push({ icon: I.time, text: 'Visit started', at: a.start })
  if (a.status === 'completed') items.push({ icon: I.receipt, text: `Paid · receipt #${10000 + (h % 900)}`, at: a.end })
  if (a.status === 'no_show') items.push({ icon: I.cancelCircle, text: 'Marked as no-show', at: addMinutes(a.start, 20) })
  if (a.status === 'cancelled') items.push({ icon: I.cancelCircle, text: 'Cancelled by the client in Telegram', at: addMinutes(a.start, -r.int(60, 600)) })
  return [...items.filter((i) => i.at <= NOW), ...extra].sort((x, y) => +y.at - +x.at)
}

function Progress({ status }: { status: Appointment['status'] }) {
  const idx = FLOW.findIndex((f) => f.status === status)
  return (
    <div className="flex items-center gap-1">
      {FLOW.map((f, i) => (
        <div key={f.status} className="flex flex-1 flex-col gap-1.5">
          <div className={cn('h-1 rounded-full transition-colors duration-200', i <= idx ? 'bg-accent' : 'bg-fill-active')} />
          <span className={cn('text-xs', i === idx ? 'font-medium text-fg' : i < idx ? 'text-muted' : 'text-faint')}>{f.label}</span>
        </div>
      ))}
    </div>
  )
}

function RescheduleModal({ visit, open, onOpenChange }: { visit: Appointment; open: boolean; onOpenChange: (o: boolean) => void }) {
  const entries = useData((s) => s.entries)
  const clients = useData((s) => s.clients)
  const updateEntry = useData((s) => s.updateEntry)
  const [date, setDate] = useState(startOfDay(visit.start))
  const [staffId, setStaffId] = useState(visit.staffId)
  const [time, setTime] = useState<string | null>(null)
  const duration = (visit.end.getTime() - visit.start.getTime()) / 60_000
  const capable = bookableStaff.filter((s) => visit.serviceIds.every((id) => serviceById[id].staffIds.includes(s.id)))

  useEffect(() => {
    if (open) {
      setDate(startOfDay(visit.start))
      setStaffId(visit.staffId)
      setTime(null)
    }
  }, [open, visit])

  const slots = useMemo(() => {
    const s = staffById[staffId]
    if (!s.today) return []
    const busy = entries.filter((e) => e.id !== visit.id && e.staffId === staffId && isSameDay(e.start, date) && !(isVisit(e) && e.status === 'cancelled'))
    const out: string[] = []
    const end = at(date, s.today.end)
    for (let t = at(date, s.today.start); addMinutes(t, duration) <= end; t = addMinutes(t, 15)) {
      if (t < NOW) continue
      const tEnd = addMinutes(t, duration)
      if (busy.some((b) => t < b.end && tEnd > b.start)) continue
      out.push(formatTime(t))
    }
    return out
  }, [entries, staffId, date, duration, visit.id])

  function save() {
    if (!time) return
    const prev = { start: visit.start, end: visit.end, staffId: visit.staffId }
    const start = at(date, time)
    updateEntry(visit.id, { start, end: addMinutes(start, duration), staffId })
    onOpenChange(false)
    const c = clients.find((x) => x.id === visit.clientId)
    toast.success(`Moved to ${formatDay(start).toLowerCase() === 'today' ? 'today' : formatDate(start, { weekday: true })}, ${time}`, {
      description: `${c?.firstName} was notified ${c?.telegram ? 'in Telegram' : 'by SMS'}.`,
      action: { label: 'Undo', onClick: () => updateEntry(visit.id, prev) },
    })
  }

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title="Reschedule visit"
      description={`${visit.serviceIds.map((id) => serviceById[id].name).join(' + ')} · ${formatDuration(duration)}`}
      footer={
        <>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button variant="primary" disabled={!time} onClick={save}>
            Move visit
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Master">
            <Select
              value={staffId}
              onChange={(v) => {
                setStaffId(v)
                setTime(null)
              }}
              options={capable.map((s) => ({ value: s.id, label: s.name, icon: <Avatar name={s.name} color={s.color} size="sm" /> }))}
            />
          </Field>
          <Field label="Date">
            <DatePicker
              value={date}
              onChange={(d) => {
                setDate(d)
                setTime(null)
              }}
            />
          </Field>
        </div>
        <Field label="Free time">
          {slots.length ? (
            <div className="grid grid-cols-6 gap-1.5">
              {slots.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTime(t)}
                  className={cn(
                    'press h-8 rounded-lg text-sm tabular ring-1 ring-inset',
                    time === t ? 'bg-fg font-medium text-bg ring-fg' : 'bg-surface text-fg ring-border hover:bg-fill',
                  )}
                >
                  {t}
                </button>
              ))}
            </div>
          ) : (
            <p className="rounded-xl bg-fill px-3.5 py-3 text-base text-muted">No free time that day. Try another day or master.</p>
          )}
        </Field>
      </div>
    </Modal>
  )
}

const CANCEL_REASONS = ['Client cancelled', 'Client is ill', 'Master is unavailable', 'Moved by phone', 'Other']

function CancelModal({ visit, open, onOpenChange, onDone }: { visit: Appointment; open: boolean; onOpenChange: (o: boolean) => void; onDone: (reason: string) => void }) {
  const setStatus = useData((s) => s.setStatus)
  const [reason, setReason] = useState(CANCEL_REASONS[0])
  const [note, setNote] = useState('')
  const [offer, setOffer] = useState(true)
  const future = visit.start > NOW

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title="Cancel this visit?"
      size="sm"
      footer={
        <>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Keep visit
          </Button>
          <Button
            variant="danger"
            onClick={() => {
              const prev = visit.status
              setStatus(visit.id, 'cancelled')
              onDone(reason)
              onOpenChange(false)
              toast('Visit cancelled', {
                description: future && offer ? 'The free time was offered to 2 clients on the waiting list.' : reason,
                action: { label: 'Undo', onClick: () => setStatus(visit.id, prev) },
              })
            }}
          >
            Cancel visit
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <Field label="Reason">
          <div className="flex flex-wrap gap-1.5">
            {CANCEL_REASONS.map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setReason(r)}
                className={cn(
                  'press h-8 rounded-full px-3 text-sm font-medium ring-1 ring-inset',
                  reason === r ? 'bg-fg text-bg ring-fg' : 'bg-surface text-fg ring-border hover:bg-fill',
                )}
              >
                {r}
              </button>
            ))}
          </div>
        </Field>
        {reason === 'Other' && <Textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="What happened?" autoFocus />}
        {future && <Switch checked={offer} onChange={setOffer} label="Offer the time to the waiting list" description="Matching clients get a message in Telegram" />}
      </div>
    </Modal>
  )
}

function BlockSheetBody({ block, onClose }: { block: TimeBlock; onClose: () => void }) {
  const removeEntry = useData((s) => s.removeEntry)
  const addEntry = useData((s) => s.addEntry)
  const s = staffById[block.staffId]
  return (
    <div className="px-5 py-5">
      <div className="hatch mb-5 rounded-xl bg-fill px-4 py-4 ring-1 ring-inset ring-border">
        <div className="text-2xl font-normal text-fg tabular">
          {formatTime(block.start)}–{formatTime(block.end)}
        </div>
        <div className="mt-1 text-base text-muted">{formatDay(block.start)} · not bookable online or by phone</div>
      </div>
      <DetailRow label="Master">
        <span className="inline-flex items-center gap-2">
          <Avatar name={s.name} color={s.color} size="sm" />
          {s.name}
        </span>
      </DetailRow>
      <DetailRow label="Reason">{BLOCK_LABEL[block.type]}</DetailRow>
      {block.note && <DetailRow label="Note">{block.note}</DetailRow>}
      <Button
        variant="danger"
        icon={I.delete}
        className="mt-5"
        onClick={() => {
          removeEntry(block.id)
          onClose()
          toast(`${BLOCK_LABEL[block.type]} removed`, { description: 'That time is bookable again.', action: { label: 'Undo', onClick: () => addEntry(block) } })
        }}
      >
        Remove {BLOCK_LABEL[block.type].toLowerCase()}
      </Button>
    </div>
  )
}

export function VisitSheet() {
  const id = useOverlays((s) => s.visitId)
  const close = useOverlays((s) => s.close)
  const openClient = useOverlays((s) => s.openClient)
  const openNewVisit = useOverlays((s) => s.openNewVisit)
  const entry = useData((s) => s.entries.find((e) => e.id === id))
  const clients = useData((s) => s.clients)
  const setStatus = useData((s) => s.setStatus)
  const navigate = useNavigate()
  const [reschedule, setReschedule] = useState(false)
  const [cancel, setCancel] = useState(false)
  const [extraLog, setExtraLog] = useState<Record<string, LogItem[]>>({})
  // Keep the last entry so the sheet can finish its exit animation after closing.
  const [shown, setShown] = useState(entry)
  useEffect(() => {
    if (entry) setShown(entry)
  }, [entry])

  const onClose = () => close('visitId')
  const log = (vid: string, item: LogItem) => setExtraLog((m) => ({ ...m, [vid]: [...(m[vid] ?? []), item] }))

  const e = entry ?? shown
  const visit = e && isVisit(e) ? e : null
  const client = visit ? clients.find((c) => c.id === visit.clientId) : undefined
  const master = visit ? staffById[visit.staffId] : null

  if (e && !isVisit(e)) {
    return (
      <Sheet open={!!entry} onOpenChange={(o) => !o && onClose()} eyebrow="Time off" title={BLOCK_LABEL[e.type]} width="md">
        <BlockSheetBody block={e} onClose={onClose} />
      </Sheet>
    )
  }

  const step = visit ? nextStep(visit) : null
  const meta = visit ? STATUS_META[visit.status] : null
  const total = visit?.price ?? 0
  const sendReminder = () => {
    if (!visit) return
    log(visit.id, { icon: client?.telegram ? I.telegram : I.mobile, text: `Reminder sent ${client?.telegram ? 'in Telegram' : 'by SMS'}`, at: NOW })
    toast.success(`Reminder sent ${client?.telegram ? 'in Telegram' : 'by SMS'}`, { description: `${client?.name} · ${formatDayTime(visit.start)}` })
  }

  function runStep() {
    if (!visit || !step) return
    if (step.checkout) {
      onClose()
      navigate(`/pos?visit=${visit.id}`)
      return
    }
    if (step.status) {
      const prev = visit.status
      setStatus(visit.id, step.status)
      toast.success(STATUS_TOAST[step.status] ?? 'Updated', {
        description: `${client?.name} · ${formatTime(visit.start)}`,
        action: { label: 'Undo', onClick: () => setStatus(visit.id, prev) },
      })
    }
  }

  const repeat = () => {
    if (!visit) return
    onClose()
    openNewVisit({ clientId: visit.clientId, serviceIds: visit.serviceIds, staffId: visit.staffId })
  }

  return (
    <Sheet
      open={!!entry && !!visit}
      onOpenChange={(o) => !o && onClose()}
      eyebrow="Visit"
      title={client?.name ?? 'Visit'}
      actions={
        visit && (
          <Menu align="end" trigger={<IconButton icon={I.more} label="More actions" size="sm" />}>
            {visit.status !== 'completed' && visit.status !== 'cancelled' && visit.status !== 'no_show' && (
              <>
                <MenuItem icon={I.calendar} onClick={() => setReschedule(true)}>
                  Reschedule
                </MenuItem>
                {visit.start > NOW && (
                  <MenuItem icon={I.bell} onClick={sendReminder}>
                    Send reminder
                  </MenuItem>
                )}
              </>
            )}
            <MenuItem icon={I.repeat} onClick={repeat}>
              Book again
            </MenuItem>
            <MenuItem icon={I.user} onClick={() => client && openClient(client.id)}>
              Open client profile
            </MenuItem>
            {(visit.status === 'booked' || visit.status === 'confirmed' || visit.status === 'arrived') && (
              <>
                <MenuSeparator />
                {visit.start <= addMinutes(NOW, 30) && (
                  <MenuItem
                    icon={I.cancelCircle}
                    onClick={() => {
                      const prev = visit.status
                      setStatus(visit.id, 'no_show')
                      toast('Marked as no-show', {
                        description: 'Counts toward prepayment rules for this client.',
                        action: { label: 'Undo', onClick: () => setStatus(visit.id, prev) },
                      })
                    }}
                  >
                    Mark no-show
                  </MenuItem>
                )}
                <MenuItem icon={I.close} danger onClick={() => setCancel(true)}>
                  Cancel visit
                </MenuItem>
              </>
            )}
            {(visit.status === 'cancelled' || visit.status === 'no_show') && visit.start > NOW && (
              <MenuItem
                icon={I.refresh}
                onClick={() => {
                  setStatus(visit.id, 'booked')
                  toast.success('Visit restored')
                }}
              >
                Restore visit
              </MenuItem>
            )}
          </Menu>
        )
      }
    >
      {visit && client && master && meta && (
        <div className="flex flex-col">
          <section className="px-5 pt-5 pb-5">
            <div className="flex items-center gap-2">
              <Badge tone={meta.tone}>
                {meta.label}
              </Badge>
              {visit.recurring && (
                <Badge>
                  <Icon icon={I.repeat} size={12} />
                  Weekly
                </Badge>
              )}
            </div>
            <div className="mt-3 text-3xl font-normal text-fg tabular">
              {formatTime(visit.start)}–{formatTime(visit.end)}
            </div>
            <div className="mt-1 text-base text-muted">
              {formatDay(visit.start)}
              {!isSameDay(visit.start, NOW) && visit.start > NOW && ` · in ${Math.max(1, Math.round((startOfDay(visit.start).getTime() - startOfDay(NOW).getTime()) / 86_400_000))} days`} · with{' '}
              {master.name.split(' ')[0]}
            </div>

            {visit.status !== 'no_show' && visit.status !== 'cancelled' ? (
              <div className="mt-5">
                <Progress status={visit.status} />
              </div>
            ) : (
              <div className="mt-5 flex items-center gap-2.5 rounded-xl bg-negative-soft px-3.5 py-3 text-sm text-negative">
                <Icon icon={I.cancelCircle} size={16} />
                {visit.status === 'no_show' ? 'The client didn’t come. Their next booking may ask for prepayment.' : 'This visit was cancelled and its time is free again.'}
              </div>
            )}

            <div className="mt-5 flex gap-2">
              {step ? (
                <Button variant="primary" className="flex-1" icon={step.checkout ? I.register : undefined} onClick={runStep}>
                  {step.checkout ? (
                    <>
                      Check out · <Money value={total} />
                    </>
                  ) : (
                    step.label
                  )}
                </Button>
              ) : visit.status === 'confirmed' ? (
                <Button variant="secondary" className="flex-1" icon={I.bell} onClick={sendReminder}>
                  Send reminder
                </Button>
              ) : (
                <Button variant="secondary" className="flex-1" icon={I.repeat} onClick={repeat}>
                  Book again
                </Button>
              )}
              {step && !step.checkout && visit.status !== 'booked' && (
                <Button variant="secondary" onClick={() => setReschedule(true)}>
                  Reschedule
                </Button>
              )}
              {visit.status === 'booked' && (
                <Button variant="secondary" icon={I.bell} onClick={sendReminder}>
                  Remind
                </Button>
              )}
            </div>
          </section>

          <section className="border-t border-border px-5 py-4">
            <button
              type="button"
              onClick={() => openClient(client.id)}
              className="press -mx-2 flex w-[calc(100%+1rem)] items-center gap-3 rounded-xl px-2 py-2 text-left hover:bg-fill"
            >
              <Avatar name={client.name} size="lg" />
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-2">
                  <span className="truncate text-base font-medium text-fg">{client.name}</span>
                  {client.category === 'vip' && <Badge tone="accent">VIP</Badge>}
                  {client.category === 'new' && <Badge tone="positive">New</Badge>}
                </span>
                <span className="block text-sm text-muted">
                  {client.visits} visits · last {client.lastVisit ? formatRelative(client.lastVisit) : 'never'}
                </span>
              </span>
              <Icon icon={I.chevronRight} size={16} className="text-faint" />
            </button>
            <div className="mt-3 grid grid-cols-3 gap-2">
              <StatCard size="sm" className="rounded-xl bg-fill px-3 py-2.5 ring-0" valueClassName="text-base" label="Spent" value={<Money value={client.totalSpent} />} />
              <StatCard size="sm" className="rounded-xl bg-fill px-3 py-2.5 ring-0" valueClassName="text-base" label="Bonuses" value={<Money value={client.bonuses} currency={false} />} />
              <StatCard size="sm" className={cn('rounded-xl px-3 py-2.5 ring-0', client.debt > 0 ? 'bg-negative-soft' : 'bg-fill')} valueClassName={cn('text-base', client.debt > 0 && 'text-negative')} label="Debt" value={<Money value={client.debt} />} />
            </div>
            {client.note && (
              <p className="mt-3 flex gap-2 rounded-xl bg-warning-soft px-3 py-2.5 text-sm text-fg">
                <Icon icon={I.note} size={16} className="mt-px shrink-0 text-warning" />
                {client.note}
              </p>
            )}
          </section>

          <section className="border-t border-border px-5 py-3">
            <DetailRow label="Master">
              <span className="inline-flex items-center gap-2">
                <Avatar name={master.name} color={master.color} size="sm" />
                {master.name}
              </span>
            </DetailRow>
            {visit.serviceIds.map((sid) => (
              <DetailRow key={sid} label={serviceById[sid].name}>
                <span className="text-muted">{formatDuration(serviceById[sid].duration)} · </span>
                <Money value={serviceById[sid].price} />
              </DetailRow>
            ))}
            <DetailRow label="Total" className="font-medium">
              <Money value={total} />
            </DetailRow>
            <DetailRow label="Booked via">
              <span className="inline-flex items-center gap-1.5">
                <Icon icon={SOURCE_ICON[visit.source]} size={15} className="text-muted" />
                {SOURCE_LABEL[visit.source]}
              </span>
            </DetailRow>
            {visit.comment && <DetailRow label="Comment">{visit.comment}</DetailRow>}
          </section>

          <section className="border-t border-border px-5 pt-4 pb-6">
            <h3 className="mb-3 text-sm font-medium text-muted">Activity</h3>
            <ol className="relative flex flex-col gap-3.5 before:absolute before:top-2 before:bottom-2 before:left-[13px] before:w-px before:bg-border">
              {historyFor(visit, client, extraLog[visit.id] ?? []).map((item, i) => (
                <li key={i} className="relative flex items-start gap-3">
                  <span className="z-[1] grid size-7 shrink-0 place-items-center rounded-full bg-raised text-muted ring-1 ring-border">
                    <Icon icon={item.icon} size={14} />
                  </span>
                  <span className="pt-1 text-sm">
                    <span className="text-fg">{item.text}</span>
                    <span className="text-faint"> · {formatDayTime(item.at)}</span>
                  </span>
                </li>
              ))}
            </ol>
          </section>

          <RescheduleModal visit={visit} open={reschedule} onOpenChange={setReschedule} />
          <CancelModal
            visit={visit}
            open={cancel}
            onOpenChange={setCancel}
            onDone={(reason) => log(visit.id, { icon: I.cancelCircle, text: `Cancelled · ${reason.toLowerCase()}`, at: NOW })}
          />
        </div>
      )}
    </Sheet>
  )
}
