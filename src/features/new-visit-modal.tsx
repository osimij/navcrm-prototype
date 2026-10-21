import { Command } from 'cmdk'
import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router'
import { toast } from 'sonner'
import { ClientPicker } from '@/components/client-picker'
import { I, Icon } from '@/components/icons'
import { Avatar } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/controls'
import { DatePicker } from '@/components/ui/date-picker'
import { Modal } from '@/components/ui/dialog'
import { Field, Input, Textarea, fieldBase } from '@/components/ui/input'
import { Money } from '@/components/ui/misc'
import { Popover } from '@/components/ui/popover'
import { Select } from '@/components/ui/select'
import { Segmented } from '@/components/ui/tabs'
import { BLOCK_LABEL, isVisit, type BlockType } from '@/data/appointments'
import { SERVICE_CATEGORIES, serviceById, services } from '@/data/services'
import { bookableStaff, staffById } from '@/data/staff'
import { cn } from '@/lib/cn'
import { formatDate, formatDuration, formatTime } from '@/lib/format'
import { useOverlays } from '@/lib/overlays'
import { useData } from '@/lib/store'
import { NOW, TODAY, addMinutes, at, isSameDay, startOfDay } from '@/lib/time'

const ANY = 'any'

function ServicePicker({ value, onChange, staffId }: { value: string[]; onChange: (ids: string[]) => void; staffId: string }) {
  const [open, setOpen] = useState(false)
  const [q, setQ] = useState('')
  const list = services.filter(
    (s) => (staffId === ANY || s.staffIds.includes(staffId)) && s.name.toLowerCase().includes(q.trim().toLowerCase()),
  )
  const toggle = (id: string) => onChange(value.includes(id) ? value.filter((v) => v !== id) : [...value, id])

  return (
    <Popover
      open={open}
      onOpenChange={(o) => {
        setOpen(o)
        if (!o) setQ('')
      }}
      className="w-[var(--anchor-width)] min-w-80 overflow-hidden p-0"
      trigger={
        <button
          type="button"
          className={cn(fieldBase, 'flex min-h-9 flex-wrap items-center gap-1.5 px-2 py-1.5 text-left data-[popup-open]:bg-surface data-[popup-open]:ring-accent')}
        >
          {value.length ? (
            value.map((id) => (
              <span key={id} className="inline-flex h-6 items-center gap-1 rounded-md bg-surface px-2 text-sm text-fg ring-1 ring-border">
                {serviceById[id].name}
              </span>
            ))
          ) : (
            <span className="px-1 text-faint">Choose services</span>
          )}
        </button>
      }
    >
      <Command shouldFilter={false} loop>
        <div className="flex items-center gap-2 border-b border-border px-3">
          <Icon icon={I.search} size={16} className="text-faint" />
          <Command.Input autoFocus value={q} onValueChange={setQ} placeholder="Search services" className="h-11 flex-1 bg-transparent text-base outline-none placeholder:text-faint" />
        </div>
        <Command.List className="max-h-80 overflow-y-auto p-1">
          {SERVICE_CATEGORIES.map((cat) => {
            const items = list.filter((s) => s.category === cat)
            if (!items.length) return null
            return (
              <Command.Group key={cat} heading={cat} className="[&_[cmdk-group-heading]]:px-2.5 [&_[cmdk-group-heading]]:pt-2 [&_[cmdk-group-heading]]:pb-1 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-faint">
                {items.map((s) => {
                  const on = value.includes(s.id)
                  return (
                    <Command.Item
                      key={s.id}
                      value={s.id}
                      onSelect={() => toggle(s.id)}
                      className="flex cursor-default items-center gap-3 rounded-lg px-2.5 py-2 outline-none data-[selected=true]:bg-fill"
                    >
                      <span className={cn('grid size-[18px] shrink-0 place-items-center rounded-[5px] ring-1 ring-inset', on ? 'bg-accent text-on-accent ring-accent' : 'ring-border-strong')}>
                        {on && <Icon icon={I.check} size={12} strokeWidth={2.4} />}
                      </span>
                      <span className="min-w-0 flex-1 truncate text-base text-fg">{s.name}</span>
                      <span className="text-sm text-faint">{formatDuration(s.duration)}</span>
                      <Money value={s.price} className="w-20 text-right text-sm" />
                    </Command.Item>
                  )
                })}
              </Command.Group>
            )
          })}
          {!list.length && <div className="px-3 py-3 text-base text-muted">No services match.</div>}
        </Command.List>
      </Command>
    </Popover>
  )
}

function timeOptions(from = 8, to = 21) {
  const out: { value: string; label: string }[] = []
  for (let m = from * 60; m <= to * 60; m += 15) {
    const t = `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`
    out.push({ value: t, label: t })
  }
  return out
}

export function NewVisitModal() {
  const prefill = useOverlays((s) => s.newVisit)
  const close = useOverlays((s) => s.close)
  const entries = useData((s) => s.entries)
  const clients = useData((s) => s.clients)
  const addEntry = useData((s) => s.addEntry)
  const navigate = useNavigate()

  const [mode, setMode] = useState<'visit' | 'block'>('visit')
  const [clientId, setClientId] = useState<string | null>(null)
  const [serviceIds, setServiceIds] = useState<string[]>([])
  const [staffId, setStaffId] = useState<string>(ANY)
  const [date, setDate] = useState<Date>(TODAY)
  const [time, setTime] = useState<string | null>(null)
  const [more, setMore] = useState(false)
  const [comment, setComment] = useState('')
  const [repeat, setRepeat] = useState(false)
  const [blockType, setBlockType] = useState<BlockType>('break')
  const [blockFrom, setBlockFrom] = useState('13:00')
  const [blockTo, setBlockTo] = useState('14:00')
  const [note, setNote] = useState('')

  useEffect(() => {
    if (!prefill) return
    setMode(prefill.mode ?? 'visit')
    setClientId(prefill.clientId ?? null)
    setServiceIds(prefill.serviceIds ?? [])
    setStaffId(prefill.staffId ?? ANY)
    setDate(prefill.start ? startOfDay(prefill.start) : TODAY)
    setTime(prefill.start ? formatTime(prefill.start) : null)
    if (prefill.start) {
      setBlockFrom(formatTime(prefill.start))
      setBlockTo(formatTime(addMinutes(prefill.start, 60)))
    }
    setMore(false)
    setComment('')
    setRepeat(false)
    setNote('')
  }, [prefill])

  const duration = serviceIds.reduce((m, id) => m + serviceById[id].duration, 0) || 60
  const price = serviceIds.reduce((m, id) => m + serviceById[id].price, 0)

  // Masters who can do every selected service.
  const capable = useMemo(
    () => bookableStaff.filter((s) => serviceIds.every((id) => serviceById[id].staffIds.includes(s.id))),
    [serviceIds],
  )

  const freeAt = useMemo(() => {
    const busyFor = (sid: string) =>
      entries.filter((e) => e.staffId === sid && isSameDay(e.start, date) && !(isVisit(e) && e.status === 'cancelled'))
    const candidates = staffId === ANY ? capable : capable.filter((s) => s.id === staffId)
    const map = new Map<string, string>() // time → first free master
    for (const s of candidates) {
      if (!s.today) continue
      const busy = busyFor(s.id)
      const end = at(date, s.today.end)
      for (let t = at(date, s.today.start); addMinutes(t, duration) <= end; t = addMinutes(t, 15)) {
        if (isSameDay(date, NOW) && t < NOW) continue
        const tEnd = addMinutes(t, duration)
        if (busy.some((b) => t < b.end && tEnd > b.start)) continue
        const key = formatTime(t)
        if (!map.has(key)) map.set(key, s.id)
      }
    }
    return [...map.entries()].sort(([a], [b]) => a.localeCompare(b))
  }, [entries, capable, staffId, date, duration])

  // Keep a prefilled time selectable even if the slot grid changes.
  useEffect(() => {
    if (time && !freeAt.some(([t]) => t === time) && !prefill?.start) setTime(null)
  }, [freeAt, time, prefill])

  const client = clients.find((c) => c.id === clientId)
  const canBook = mode === 'visit' ? !!clientId && serviceIds.length > 0 && !!time : staffId !== ANY && blockFrom < blockTo

  function submit() {
    if (!canBook) return
    if (mode === 'visit' && time) {
      const start = at(date, time)
      const masterId = staffId === ANY ? (freeAt.find(([t]) => t === time)?.[1] ?? capable[0]?.id) : staffId
      if (!masterId) return
      addEntry({
        id: `n${Date.now()}`,
        kind: 'visit',
        clientId: clientId!,
        staffId: masterId,
        serviceIds,
        start,
        end: addMinutes(start, duration),
        status: 'booked',
        source: 'phone',
        price,
        paid: false,
        comment: comment || undefined,
        recurring: repeat,
      })
      close('newVisit')
      const master = staffById[masterId].name.split(' ')[0]
      toast.success(`Visit booked for ${client?.firstName}`, {
        description: `${formatDate(start, { weekday: true })}, ${time} with ${master}${client?.telegram ? '. Confirmation sent in Telegram.' : '. Confirmation sent by SMS.'}`,
        action: { label: 'View', onClick: () => navigate('/calendar') },
      })
    } else {
      addEntry({
        id: `n${Date.now()}`,
        kind: 'block',
        staffId,
        start: at(date, blockFrom),
        end: at(date, blockTo),
        type: blockType,
        note: note || undefined,
      })
      close('newVisit')
      toast.success(`${BLOCK_LABEL[blockType]} added for ${staffById[staffId].name.split(' ')[0]}`, {
        description: `${formatDate(date, { weekday: true })}, ${blockFrom}–${blockTo}`,
      })
    }
  }

  const masterOptions = [
    ...(mode === 'visit' ? [{ value: ANY, label: 'Any available master' }] : []),
    ...(mode === 'visit' ? capable : bookableStaff).map((s) => ({
      value: s.id,
      label: s.name,
      hint: s.position,
      icon: <Avatar name={s.name} color={s.color} size="sm" />,
    })),
  ]

  return (
    <Modal
      open={!!prefill}
      onOpenChange={(o) => !o && close('newVisit')}
      title={mode === 'visit' ? 'New visit' : 'Block time'}
      size="lg"
      footer={
        <>
          {mode === 'visit' && serviceIds.length > 0 && (
            <div className="mr-auto text-sm text-muted">
              {formatDuration(duration)} · <Money value={price} className="text-fg" />
            </div>
          )}
          <Button variant="ghost" onClick={() => close('newVisit')}>
            Cancel
          </Button>
          <Button variant="primary" onClick={submit} disabled={!canBook}>
            {mode === 'visit' ? 'Book visit' : 'Block time'}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-5">
        <Segmented
          value={mode}
          onChange={(m) => {
            setMode(m)
            if (m === 'block' && staffId === ANY) setStaffId(bookableStaff[0].id)
          }}
          items={[
            { value: 'visit', label: 'Client visit' },
            { value: 'block', label: 'Time off' },
          ]}
        />

        {mode === 'visit' ? (
          <>
            <Field label="Client">
              <ClientPicker value={clientId} onChange={setClientId} />
            </Field>
            {client && client.debt > 0 && (
              <div className="-mt-3 flex items-center gap-2 rounded-lg bg-negative-soft px-3 py-2 text-sm text-negative">
                <Icon icon={I.alert} size={16} />
                Owes <Money value={client.debt} className="font-medium" /> from a previous visit
              </div>
            )}
            <Field label="Services">
              <ServicePicker value={serviceIds} onChange={setServiceIds} staffId={staffId} />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Master">
                <Select value={staffId} onChange={setStaffId} options={masterOptions} />
              </Field>
              <Field label="Date">
                <DatePicker value={date} onChange={setDate} />
              </Field>
            </div>
            <Field label={serviceIds.length && freeAt.length ? `Free time · ${formatDuration(duration)}` : 'Time'}>
              {serviceIds.length === 0 ? (
                <p className="rounded-xl bg-fill px-3.5 py-3 text-base text-muted">Pick services to see free time.</p>
              ) : freeAt.length ? (
                <div className="grid grid-cols-6 gap-1.5 sm:grid-cols-8">
                  {freeAt.map(([t]) => (
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
                <p className="rounded-xl bg-fill px-3.5 py-3 text-base text-muted">
                  No free time on {formatDate(date, { weekday: true })}. Try another day{staffId !== ANY ? ' or any master' : ''}.
                </p>
              )}
            </Field>

            {more ? (
              <div className="flex flex-col gap-4 rounded-xl bg-fill p-4">
                <Field label="Comment" optional>
                  <Textarea value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Visible to the master" className="bg-surface" />
                </Field>
                <Switch checked={repeat} onChange={setRepeat} label="Repeat every week" description="Books the same time for the next 8 weeks" />
              </div>
            ) : (
              <button type="button" onClick={() => setMore(true)} className="-mt-1 self-start text-sm font-medium text-accent-fg hover:underline underline-offset-4">
                Add comment or repeat
              </button>
            )}
          </>
        ) : (
          <>
            <Field label="Reason">
              <div className="flex flex-wrap gap-1.5">
                {(Object.keys(BLOCK_LABEL) as BlockType[]).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setBlockType(t)}
                    className={cn(
                      'press h-8 rounded-full px-3.5 text-sm font-medium ring-1 ring-inset',
                      blockType === t ? 'bg-fg text-bg ring-fg' : 'bg-surface text-fg ring-border hover:bg-fill',
                    )}
                  >
                    {BLOCK_LABEL[t]}
                  </button>
                ))}
              </div>
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Master">
                <Select value={staffId} onChange={setStaffId} options={masterOptions} />
              </Field>
              <Field label="Date">
                <DatePicker value={date} onChange={setDate} />
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="From">
                <Select value={blockFrom} onChange={setBlockFrom} options={timeOptions()} />
              </Field>
              <Field label="To" error={blockFrom >= blockTo ? 'Must be after the start' : undefined}>
                <Select value={blockTo} onChange={setBlockTo} options={timeOptions()} />
              </Field>
            </div>
            <Field label="Note" optional>
              <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. Doctor’s appointment" />
            </Field>
          </>
        )}
      </div>
    </Modal>
  )
}
