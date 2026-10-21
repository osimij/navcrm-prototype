import { useEffect, useMemo, useState } from 'react'
import { Route, Routes, useSearchParams } from 'react-router'
import { I, Icon } from '@/components/icons'
import { Avatar } from '@/components/ui/avatar'
import { Badge, LabelChip } from '@/components/ui/badge'
import { Button, IconButton } from '@/components/ui/button'
import { Switch } from '@/components/ui/controls'
import { MiniCalendar } from '@/components/ui/date-picker'
import { Popover } from '@/components/ui/popover'
import { Select } from '@/components/ui/select'
import { Segmented } from '@/components/ui/tabs'
import { Tooltip } from '@/components/ui/tooltip'
import { SOURCE_LABEL, STATUS_META, isVisit, type BookingSource, type VisitStatus } from '@/data/appointments'
import { bookableStaff } from '@/data/staff'
import { cn } from '@/lib/cn'
import { formatDateLong, monthLong } from '@/lib/format'
import { useOverlays } from '@/lib/overlays'
import { useData } from '@/lib/store'
import { NOW, TODAY, addDays, isSameDay } from '@/lib/time'
import { SOURCE_COLOR, STATUS_COLOR, fromParam, toParam, useCalendarSettings, useWaitingList, weekStart, type ColorBy } from './data'
import { DayView, ListView, RoomsView, WeekView } from './views'
import { WaitingListSheet } from './waiting-list'

type View = 'day' | 'week' | 'list' | 'rooms'

function CalendarSettings() {
  const { colorBy, staffMode, showCancelled, allowOverlap, set } = useCalendarSettings()
  const legend =
    colorBy === 'status'
      ? (Object.keys(STATUS_COLOR) as VisitStatus[]).filter((s) => s !== 'cancelled').map((s) => ({ color: STATUS_COLOR[s], label: STATUS_META[s].label }))
      : colorBy === 'source'
        ? (Object.keys(SOURCE_COLOR) as BookingSource[]).map((s) => ({ color: SOURCE_COLOR[s], label: SOURCE_LABEL[s] }))
        : null

  return (
    <Popover
      align="end"
      className="w-[340px] p-4"
      trigger={<IconButton icon={I.filter} label="Calendar settings" variant="ghost" />}
    >
      <div className="flex flex-col gap-5">
        <div>
          <div className="mb-2 text-xs font-medium text-faint">Color visits by</div>
          <Segmented
            size="sm"
            fill
            value={colorBy}
            onChange={(v: ColorBy) => set({ colorBy: v })}
            items={[
              { value: 'master', label: 'Master' },
              { value: 'service', label: 'Service' },
              { value: 'status', label: 'Status' },
              { value: 'source', label: 'Source' },
            ]}
          />
          {legend && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {legend.map((l) => (
                <LabelChip key={l.label} color={l.color}>
                  {l.label}
                </LabelChip>
              ))}
            </div>
          )}
        </div>
        <div>
          <div className="mb-2 text-xs font-medium text-faint">Show masters</div>
          <Segmented
            size="sm"
            fill
            value={staffMode}
            onChange={(v: 'working' | 'all') => set({ staffMode: v })}
            items={[
              { value: 'working', label: 'Working that day' },
              { value: 'all', label: 'Everyone' },
            ]}
          />
        </div>
        <div className="flex flex-col gap-4 border-t border-border pt-4">
          <Switch checked={showCancelled} onChange={(v) => set({ showCancelled: v })} label="Show cancelled visits" />
          <Switch
            checked={allowOverlap}
            onChange={(v) => set({ allowOverlap: v })}
            label="Allow overlapping bookings"
            description="For masters who work with two clients at once"
          />
        </div>
      </div>
    </Popover>
  )
}

function DateControl({ date, view, onChange }: { date: Date; view: View; onChange: (d: Date) => void }) {
  const entries = useData((s) => s.entries)
  const [open, setOpen] = useState(false)
  const busyDays = useMemo(() => {
    const set = new Set<string>()
    for (const e of entries) if (isVisit(e) && e.status !== 'cancelled') set.add(toParam(e.start))
    return set
  }, [entries])

  const label =
    view === 'week'
      ? (() => {
          const s = weekStart(date)
          const e = addDays(s, 6)
          return s.getMonth() === e.getMonth()
            ? `${s.getDate()} – ${e.getDate()} ${monthLong(e.getMonth())}`
            : `${s.getDate()} ${monthLong(s.getMonth()).slice(0, 3)} – ${e.getDate()} ${monthLong(e.getMonth()).slice(0, 3)}`
        })()
      : formatDateLong(date)

  return (
    <Popover
      open={open}
      onOpenChange={setOpen}
      className="p-3"
      trigger={
        <button
          type="button"
          className="press flex min-w-0 items-center gap-1.5 rounded-xl px-2 py-1 text-left hover:bg-fill data-[popup-open]:bg-fill"
        >
          <span className="truncate text-2xl font-normal text-fg">{label}</span>
          <Icon icon={I.chevronDown} size={16} className="mt-1 text-faint" />
        </button>
      }
    >
      <MiniCalendar
        value={date}
        marked={(d) => busyDays.has(toParam(d))}
        onChange={(d) => {
          onChange(d)
          setOpen(false)
        }}
      />
    </Popover>
  )
}

function CalendarPage() {
  const [params, setParams] = useSearchParams()
  const date = fromParam(params.get('date'))
  const view = (params.get('view') as View) || 'day'
  const masterId = params.get('master') || bookableStaff[0].id
  const openNewVisit = useOverlays((s) => s.openNewVisit)
  const waiting = useWaitingList((s) => s.list.length)
  const setWaitingOpen = useWaitingList((s) => s.setOpen)
  const entries = useData((s) => s.entries)

  const update = (patch: Record<string, string>) => {
    const next = new URLSearchParams(params)
    for (const [k, v] of Object.entries(patch)) next.set(k, v)
    setParams(next, { replace: true })
  }
  const setDate = (d: Date) => update({ date: toParam(d) })
  const step = view === 'week' ? 7 : 1
  const isToday = view === 'week' ? isSameDay(weekStart(date), weekStart(TODAY)) : isSameDay(date, NOW)

  // ← / → move between days, T jumps to today. No animation: these fire many times a day.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return
      const t = e.target as HTMLElement
      if (t.closest('input, textarea, select, [role="dialog"], [contenteditable="true"]')) return
      if (document.querySelector('[role="dialog"]')) return
      if (e.key === 'ArrowLeft') setDate(addDays(date, -step))
      else if (e.key === 'ArrowRight') setDate(addDays(date, step))
      else if (e.key.toLowerCase() === 't') setDate(TODAY)
      else return
      e.preventDefault()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  const dayVisits = entries.filter((e) => isVisit(e) && isSameDay(e.start, date) && e.status !== 'cancelled').length
  const grid = view === 'day' || view === 'week' || view === 'rooms'

  return (
    <div className="flex h-full flex-col">
      <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3 px-5 pt-5 pb-4 sm:px-8 lg:px-10">
        <div className="flex min-w-0 items-center gap-1.5">
          <Button size="sm" variant="outline" onClick={() => setDate(TODAY)} disabled={isToday} className="mr-1">
            Today
          </Button>
          <Tooltip content={view === 'week' ? 'Previous week  ←' : 'Previous day  ←'}>
            <IconButton icon={I.chevronLeft} label="Previous" size="sm" tooltip={false} onClick={() => setDate(addDays(date, -step))} />
          </Tooltip>
          <Tooltip content={view === 'week' ? 'Next week  →' : 'Next day  →'}>
            <IconButton icon={I.chevronRight} label="Next" size="sm" tooltip={false} onClick={() => setDate(addDays(date, step))} />
          </Tooltip>
          <DateControl date={date} view={view} onChange={setDate} />
          {view !== 'week' && isSameDay(date, NOW) && <Badge tone="accent">Today</Badge>}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Segmented
            value={view}
            onChange={(v: View) => update({ view: v })}
            items={[
              { value: 'day', label: 'Day' },
              { value: 'week', label: 'Week' },
              { value: 'list', label: 'List' },
              { value: 'rooms', label: 'Rooms' },
            ]}
          />
          {view === 'week' && (
            <Select
              look="pill"
              value={masterId}
              onChange={(v) => update({ master: v })}
              options={bookableStaff.map((s) => ({ value: s.id, label: s.name, hint: s.position, icon: <Avatar name={s.name} color={s.color} size="sm" /> }))}
            />
          )}
          <div className="mx-1 hidden h-6 w-px bg-border sm:block" />
          <Button variant="secondary" icon={I.hourglass} onClick={() => setWaitingOpen(true)}>
            Waiting list
            {waiting > 0 && <span className="rounded-full bg-surface px-1.5 text-xs leading-5 text-muted tabular">{waiting}</span>}
          </Button>
          <CalendarSettings />
          <Button variant="primary" icon={I.calendarAdd} onClick={() => openNewVisit({ start: isSameDay(date, NOW) ? undefined : date })}>
            New visit
          </Button>
        </div>
      </div>

      {view === 'day' && dayVisits === 0 && (
        <p className="-mt-1 px-5 pb-3 text-sm text-muted sm:px-8 lg:px-10">No visits yet. Click any free time to book a client.</p>
      )}

      {grid ? (
        <div className="flex min-h-0 flex-1 flex-col px-5 pb-5 sm:px-8 lg:px-10">
          <div className={cn('flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl bg-surface ring-1 ring-border')}>
            {view === 'day' && <DayView date={date} />}
            {view === 'week' && <WeekView date={date} staffId={masterId} />}
            {view === 'rooms' && <RoomsView date={date} />}
          </div>
        </div>
      ) : (
        <div className="min-h-0 flex-1 overflow-y-auto px-5 sm:px-8 lg:px-10">
          <ListView date={date} />
        </div>
      )}

      <WaitingListSheet />
    </div>
  )
}

export default function Calendar() {
  return (
    <Routes>
      <Route path="*" element={<CalendarPage />} />
    </Routes>
  )
}
