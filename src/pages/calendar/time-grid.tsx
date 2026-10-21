import { useEffect, useLayoutEffect, useMemo, useRef, useState, type PointerEvent, type ReactNode } from 'react'
import { toast } from 'sonner'
import { I, Icon } from '@/components/icons'
import { BLOCK_LABEL, isVisit, serviceNames, type Appointment, type CalendarEntry } from '@/data/appointments'
import type { LabelColor } from '@/data/business'
import { serviceById } from '@/data/services'
import { staffById } from '@/data/staff'
import { cn } from '@/lib/cn'
import { formatDate, formatTime } from '@/lib/format'
import { useOverlays } from '@/lib/overlays'
import { useData } from '@/lib/store'
import { NOW, addMinutes, isSameDay, minutesOfDay, startOfDay } from '@/lib/time'
import {
  DAY_END,
  DAY_START,
  GRID_HEIGHT,
  HOUR_PX,
  SLOT_MIN,
  SLOT_PX,
  SOURCE_COLOR,
  STATUS_COLOR,
  minToPx,
  useCalendarSettings,
  type ColorBy,
} from './data'
import { isMovable } from './visit-flow'

export type GridColumn = {
  key: string
  date: Date
  staffId: string | null
  hours: { start: number; end: number } | null
  header: ReactNode
  entries: CalendarEntry[]
}

const GUTTER = 64
const at = (date: Date, min: number) => addMinutes(startOfDay(date), min)
const durationOf = (e: CalendarEntry) => (e.end.getTime() - e.start.getTime()) / 60_000

function colorFor(a: Appointment, by: ColorBy): LabelColor {
  if (by === 'service') return serviceById[a.serviceIds[0]]?.color ?? 'slate'
  if (by === 'status') return STATUS_COLOR[a.status]
  if (by === 'source') return SOURCE_COLOR[a.source]
  return staffById[a.staffId]?.color ?? 'slate'
}

/** Side-by-side lanes for entries that overlap in time (allowed overlaps, conflicts). */
function layout(entries: CalendarEntry[]) {
  const sorted = [...entries].sort((a, b) => +a.start - +b.start || +b.end - +a.end)
  const result = new Map<string, { lane: number; lanes: number }>()
  let cluster: CalendarEntry[] = []
  let laneEnds: number[] = []
  let clusterEnd = 0
  const flush = () => {
    for (const e of cluster) result.get(e.id)!.lanes = laneEnds.length
    cluster = []
    laneEnds = []
  }
  for (const e of sorted) {
    if (cluster.length && +e.start >= clusterEnd) flush()
    let lane = laneEnds.findIndex((end) => end <= +e.start)
    if (lane === -1) {
      lane = laneEnds.length
      laneEnds.push(+e.end)
    } else laneEnds[lane] = +e.end
    result.set(e.id, { lane, lanes: 1 })
    cluster.push(e)
    clusterEnd = Math.max(clusterEnd, +e.end)
  }
  flush()
  return result
}

type DragState = { id: string; dx: number; dy: number; colKey: string; startMin: number; valid: boolean; reason?: string }

export function TimeGrid({ columns, minColWidth = 168 }: { columns: GridColumn[]; minColWidth?: number }) {
  const clients = useData((s) => s.clients)
  const updateEntry = useData((s) => s.updateEntry)
  const openVisit = useOverlays((s) => s.openVisit)
  const openNewVisit = useOverlays((s) => s.openNewVisit)
  const colorBy = useCalendarSettings((s) => s.colorBy)
  const allowOverlap = useCalendarSettings((s) => s.allowOverlap)

  const scroller = useRef<HTMLDivElement>(null)
  const colEls = useRef(new Map<string, HTMLDivElement>())
  const drag = useRef<{ id: string; pointerId: number; x0: number; y0: number; colKey: string; startMin: number; moved: boolean } | null>(null)
  const suppressClick = useRef(false)
  const [hover, setHover] = useState<{ colKey: string; min: number; len: number } | null>(null)
  const [dragView, setDragView] = useState<DragState | null>(null)

  const template = `${GUTTER}px repeat(${columns.length}, minmax(${minColWidth}px, 1fr))`
  const hasToday = columns.some((c) => isSameDay(c.date, NOW))
  const nowTop = minToPx(minutesOfDay(NOW))
  const scrollKey = columns.map((c) => `${c.key}@${c.date.getTime()}`).join('|')

  // Land on "now" for today, otherwise on the first booking of the day.
  useLayoutEffect(() => {
    const el = scroller.current
    if (!el) return
    if (hasToday) {
      el.scrollTop = Math.max(0, nowTop - 160)
      return
    }
    const first = columns
      .flatMap((c) => c.entries)
      .reduce<number | null>((m, e) => {
        const v = minutesOfDay(e.start)
        return m == null || v < m ? v : m
      }, null)
    el.scrollTop = Math.max(0, minToPx(first ?? 9 * 60) - 24)
    // Only when the set of columns changes, not on every data update.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scrollKey])

  const lanes = useMemo(() => new Map(columns.map((c) => [c.key, layout(c.entries)])), [columns])
  const byKey = useMemo(() => new Map(columns.map((c) => [c.key, c])), [columns])

  function occupiedAt(col: GridColumn, min: number, len: number, ignoreId?: string) {
    const s = at(col.date, min)
    const e = at(col.date, min + len)
    return col.entries.some((x) => x.id !== ignoreId && !(isVisit(x) && x.status === 'cancelled') && s < x.end && e > x.start)
  }

  function freeRun(col: GridColumn, min: number) {
    const s = at(col.date, min)
    const limit = col.hours ? col.hours.end : DAY_END
    const next = col.entries
      .filter((x) => x.start >= s && !(isVisit(x) && x.status === 'cancelled'))
      .reduce((m, x) => Math.min(m, minutesOfDay(x.start)), limit)
    return Math.min(60, next - min)
  }

  function onColumnMove(e: PointerEvent<HTMLDivElement>, col: GridColumn) {
    if (drag.current?.moved || !col.staffId || !col.hours) return setHover(null)
    const rect = e.currentTarget.getBoundingClientRect()
    const min = DAY_START + Math.floor((e.clientY - rect.top) / SLOT_PX) * SLOT_MIN
    const inHours = min >= col.hours.start && min + SLOT_MIN <= col.hours.end
    const past = at(col.date, min + SLOT_MIN) <= NOW
    if (!inHours || past || occupiedAt(col, min, SLOT_MIN)) return setHover(null)
    if (hover?.colKey === col.key && hover.min === min) return
    setHover({ colKey: col.key, min, len: freeRun(col, min) })
  }

  function onColumnClick(col: GridColumn) {
    if (!hover || hover.colKey !== col.key || !col.staffId) return
    openNewVisit({ staffId: col.staffId, start: at(col.date, hover.min) })
  }

  /* ─────────── Drag a visit to another time or master ─────────── */

  function validate(a: Appointment, col: GridColumn, startMin: number): { ok: boolean; reason?: string } {
    if (!col.staffId) return { ok: false, reason: 'No master in this room' }
    const master = staffById[col.staffId]
    const missing = a.serviceIds.find((id) => !serviceById[id].staffIds.includes(col.staffId!))
    if (missing) return { ok: false, reason: `${master.name.split(' ')[0]} doesn’t do ${serviceById[missing].name.toLowerCase()}` }
    const len = durationOf(a)
    if (at(col.date, startMin) < NOW) return { ok: false, reason: 'That time has passed' }
    if (!col.hours || startMin < col.hours.start || startMin + len > col.hours.end) return { ok: false, reason: 'Outside working hours' }
    if (!allowOverlap && occupiedAt(col, startMin, len, a.id)) return { ok: false, reason: 'Overlaps another booking' }
    return { ok: true }
  }

  function onBlockPointerDown(e: PointerEvent<HTMLButtonElement>, a: CalendarEntry, colKey: string) {
    // Mouse and pen only: on a tablet a swipe that starts on a visit should scroll the day.
    if (e.button !== 0 || e.pointerType === 'touch' || !isVisit(a) || !isMovable(a)) return
    e.currentTarget.setPointerCapture(e.pointerId)
    drag.current = { id: a.id, pointerId: e.pointerId, x0: e.clientX, y0: e.clientY, colKey, startMin: minutesOfDay(a.start), moved: false }
  }

  function onBlockPointerMove(e: PointerEvent<HTMLButtonElement>, a: CalendarEntry) {
    const d = drag.current
    if (!d || d.pointerId !== e.pointerId || !isVisit(a)) return
    const dx = e.clientX - d.x0
    const dy = e.clientY - d.y0
    if (!d.moved && Math.hypot(dx, dy) < 5) return
    if (!d.moved) setHover(null)
    d.moved = true
    let colKey = d.colKey
    for (const [key, el] of colEls.current) {
      const r = el.getBoundingClientRect()
      if (e.clientX >= r.left && e.clientX < r.right) colKey = key
    }
    const len = durationOf(a)
    const raw = d.startMin + dy / (HOUR_PX / 60)
    const startMin = Math.min(DAY_END - len, Math.max(DAY_START, Math.round(raw / SLOT_MIN) * SLOT_MIN))
    const col = byKey.get(colKey)!
    const unchanged = colKey === d.colKey && startMin === d.startMin
    const v = unchanged ? { ok: true } : validate(a, col, startMin)
    setDragView({ id: a.id, dx, dy, colKey, startMin, valid: v.ok, reason: v.reason })
  }

  function onBlockPointerUp(a: CalendarEntry) {
    const d = drag.current
    drag.current = null
    const view = dragView
    setDragView(null)
    if (!d?.moved || !view || !isVisit(a)) return
    suppressClick.current = true
    const col = byKey.get(view.colKey)!
    if (!view.valid) {
      if (view.reason) toast.error(view.reason)
      return
    }
    if (view.colKey === d.colKey && view.startMin === d.startMin) return
    const prev = { start: a.start, end: a.end, staffId: a.staffId }
    const start = at(col.date, view.startMin)
    const end = addMinutes(start, durationOf(a))
    updateEntry(a.id, { start, end, staffId: col.staffId! })
    const client = clients.find((c) => c.id === a.clientId)
    toast.success(`Moved to ${isSameDay(start, NOW) ? 'today' : formatDate(start, { weekday: true })}, ${formatTime(start)} with ${staffById[col.staffId!].name.split(' ')[0]}`, {
      description: client?.telegram ? `${client.firstName} was notified in Telegram.` : `${client?.firstName} was notified by SMS.`,
      action: { label: 'Undo', onClick: () => updateEntry(a.id, prev) },
    })
  }

  useEffect(() => {
    if (!dragView) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        drag.current = null
        suppressClick.current = true
        setDragView(null)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [dragView])

  const hours = Array.from({ length: (DAY_END - DAY_START) / 60 }, (_, i) => DAY_START / 60 + i)

  return (
    <div ref={scroller} className="relative min-h-0 flex-1 overflow-auto overscroll-contain">
      <div className="relative" style={{ minWidth: GUTTER + columns.length * minColWidth }}>
        {/* Column headers */}
        <div className="sticky top-0 z-30 grid border-b border-border bg-surface" style={{ gridTemplateColumns: template }}>
          <div className="sticky left-0 z-10 bg-surface" />
          {columns.map((c) => (
            <div key={c.key} className="min-w-0 border-l border-border px-3 py-2.5">
              {c.header}
            </div>
          ))}
        </div>

        {/* Body */}
        <div className="relative grid" style={{ gridTemplateColumns: template, height: GRID_HEIGHT + 12 }}>
          <div className="sticky left-0 z-20 bg-surface">
            {hours.map((h) => (
              <span
                key={h}
                className="absolute right-2.5 -translate-y-1/2 text-xs text-faint tabular"
                style={{ top: minToPx(h * 60) }}
              >
                {h === DAY_START / 60 ? '' : `${String(h).padStart(2, '0')}:00`}
              </span>
            ))}
            {hasToday && (
              <span
                className="absolute right-1 z-10 -translate-y-1/2 rounded-full bg-accent px-1.5 py-px text-[11px] font-medium text-on-accent tabular"
                style={{ top: nowTop }}
              >
                {formatTime(NOW)}
              </span>
            )}
          </div>

          {columns.map((col) => {
            const colLanes = lanes.get(col.key)!
            const isToday = isSameDay(col.date, NOW)
            const preview = dragView && dragView.colKey === col.key ? dragView : null
            const dragged = preview ? col.entries.find((x) => x.id === preview.id) ?? findEntry(columns, preview.id) : null
            return (
              <div
                key={col.key}
                ref={(el) => {
                  if (el) colEls.current.set(col.key, el)
                  else colEls.current.delete(col.key)
                }}
                className={cn('relative border-l border-border', hover?.colKey === col.key && 'cursor-pointer')}
                style={{
                  height: GRID_HEIGHT,
                  backgroundImage: `repeating-linear-gradient(to bottom, var(--border) 0 1px, transparent 1px ${HOUR_PX / 2}px, color-mix(in oklab, var(--border) 45%, transparent) ${HOUR_PX / 2}px ${HOUR_PX / 2 + 1}px, transparent ${HOUR_PX / 2 + 1}px ${HOUR_PX}px)`,
                }}
                onPointerMove={(e) => onColumnMove(e, col)}
                onPointerLeave={() => setHover(null)}
                onClick={() => onColumnClick(col)}
              >
                {/* Outside working hours */}
                {col.hours ? (
                  <>
                    <div className="pointer-events-none absolute inset-x-0 top-0 bg-[color-mix(in_oklab,var(--fill)_70%,transparent)]" style={{ height: minToPx(col.hours.start) }} />
                    <div
                      className="pointer-events-none absolute inset-x-0 bottom-0 bg-[color-mix(in_oklab,var(--fill)_70%,transparent)]"
                      style={{ top: minToPx(col.hours.end) }}
                    />
                  </>
                ) : (
                  <div className="pointer-events-none absolute inset-0 bg-[color-mix(in_oklab,var(--fill)_70%,transparent)]" />
                )}

                {hover?.colKey === col.key && (
                  <div
                    className="pointer-events-none absolute inset-x-1 flex items-start rounded-[9px] bg-fill px-2.5 py-1 text-xs font-medium text-muted ring-1 ring-inset ring-border-strong"
                    style={{ top: minToPx(hover.min) + 1, height: (hover.len / 60) * HOUR_PX - 2 }}
                  >
                    + {formatTime(at(col.date, hover.min))}
                  </div>
                )}

                {col.entries.map((e) => {
                  const pos = colLanes.get(e.id)!
                  const top = minToPx(minutesOfDay(e.start))
                  const height = (durationOf(e) / 60) * HOUR_PX
                  const width = 100 / pos.lanes
                  const isDragged = dragView?.id === e.id
                  return (
                    <EntryBlock
                      key={e.id}
                      entry={e}
                      colorBy={colorBy}
                      clientName={isVisit(e) ? clients.find((c) => c.id === e.clientId)?.name ?? 'Client' : ''}
                      style={{
                        top: top + 1,
                        height: height - 2,
                        left: `calc(${pos.lane * width}% + 4px)`,
                        width: `calc(${width}% - 8px)`,
                        transform: isDragged ? `translate(${dragView!.dx}px, ${dragView!.dy}px)` : undefined,
                        zIndex: isDragged ? 40 : undefined,
                      }}
                      dragging={isDragged}
                      onPointerDown={(ev) => onBlockPointerDown(ev, e, col.key)}
                      onPointerMove={(ev) => onBlockPointerMove(ev, e)}
                      onPointerUp={() => onBlockPointerUp(e)}
                      onPointerCancel={() => {
                        drag.current = null
                        setDragView(null)
                      }}
                      onClick={(ev) => {
                        ev.stopPropagation()
                        if (suppressClick.current) {
                          suppressClick.current = false
                          return
                        }
                        openVisit(e.id)
                      }}
                    />
                  )
                })}

                {preview && dragged && (
                  <div
                    className={cn(
                      'pointer-events-none absolute inset-x-1 z-30 flex items-start rounded-[9px] border-2 border-dashed px-2.5 py-1 text-xs font-medium',
                      preview.valid ? 'border-accent bg-accent-soft text-accent-fg' : 'border-negative bg-negative-soft text-negative',
                    )}
                    style={{ top: minToPx(preview.startMin) + 1, height: (durationOf(dragged) / 60) * HOUR_PX - 2 }}
                  >
                    {preview.valid
                      ? `${formatTime(at(col.date, preview.startMin))}–${formatTime(at(col.date, preview.startMin + durationOf(dragged)))}`
                      : preview.reason}
                  </div>
                )}

                {isToday && (
                  <div className="pointer-events-none absolute inset-x-0 z-20 h-0.5 -translate-y-1/2 bg-accent" style={{ top: nowTop }} />
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function findEntry(columns: GridColumn[], id: string) {
  for (const c of columns) {
    const e = c.entries.find((x) => x.id === id)
    if (e) return e
  }
  return null
}

function EntryBlock({
  entry,
  colorBy,
  clientName,
  style,
  dragging,
  ...handlers
}: {
  entry: CalendarEntry
  colorBy: ColorBy
  clientName: string
  style: React.CSSProperties
  dragging: boolean
  onPointerDown: (e: PointerEvent<HTMLButtonElement>) => void
  onPointerMove: (e: PointerEvent<HTMLButtonElement>) => void
  onPointerUp: () => void
  onPointerCancel: () => void
  onClick: (e: React.MouseEvent) => void
}) {
  const h = typeof style.height === 'number' ? style.height : 40

  if (!isVisit(entry)) {
    return (
      <button
        type="button"
        style={style}
        onClick={handlers.onClick}
        className="hatch absolute flex flex-col items-start overflow-hidden rounded-[9px] bg-[color-mix(in_oklab,var(--fill)_80%,transparent)] px-2.5 py-1.5 text-left ring-1 ring-inset ring-border"
      >
        <span className="text-xs font-medium text-muted">{BLOCK_LABEL[entry.type]}</span>
        {h > 44 && entry.note && <span className="mt-0.5 line-clamp-2 text-xs text-faint">{entry.note}</span>}
      </button>
    )
  }

  const a = entry
  const color = colorFor(a, colorBy)
  const range = `${formatTime(a.start)}–${formatTime(a.end)}`
  const services = serviceNames(a)
  const done = a.status === 'completed'
  const off = a.status === 'no_show' || a.status === 'cancelled'
  const compact = h < 34

  return (
    <button
      type="button"
      style={{ ...style, ['--label' as string]: `var(--c-${color})` }}
      {...handlers}
      className={cn(
        'group/visit absolute overflow-hidden rounded-[9px] py-1 pr-2 pl-3 text-left outline-none select-none focus-visible:ring-2 focus-visible:ring-accent',
        'transition-[box-shadow,opacity] duration-150',
        a.status === 'booked' && 'border border-dashed border-[color-mix(in_oklab,var(--label)_65%,transparent)] bg-surface',
        (a.status === 'confirmed' || a.status === 'arrived') && 'label-soft',
        a.status === 'in_progress' && 'label-soft ring-[1.5px] ring-inset ring-[color-mix(in_oklab,var(--label)_80%,transparent)]',
        (done || off) && 'bg-fill',
        a.status === 'cancelled' && 'border border-dashed border-border-strong bg-transparent opacity-70',
        isMovable(a) ? 'cursor-grab hover:shadow-sm' : 'cursor-pointer',
        dragging && 'cursor-grabbing opacity-90 shadow-popover',
      )}
    >
      <span
        className={cn('absolute top-1.5 bottom-1.5 left-1 w-[3px] rounded-full bg-[var(--label)]', (done || off) && 'opacity-40')}
      />
      <span className="flex items-center gap-1.5">
        <span className={cn('min-w-0 flex-1 truncate text-sm font-medium', done || off ? 'text-muted' : 'text-fg', off && 'line-through decoration-faint')}>
          {clientName}
          {compact && <span className="ml-1.5 font-normal text-muted tabular">{formatTime(a.start)}</span>}
        </span>
        {a.status === 'arrived' && (
          <span className="shrink-0 rounded-full bg-warning-soft px-1.5 text-[11px] leading-[18px] font-medium text-warning">Arrived</span>
        )}
        {a.status === 'no_show' && (
          <span className="shrink-0 rounded-full bg-negative-soft px-1.5 text-[11px] leading-[18px] font-medium text-negative">No-show</span>
        )}
        {a.status === 'in_progress' && <span className="size-1.5 shrink-0 rounded-full bg-[var(--label)]" />}
        {done && <Icon icon={I.check} size={14} strokeWidth={2.2} className="shrink-0 text-positive" />}
        {a.recurring && !compact && <Icon icon={I.repeat} size={12} className="shrink-0 text-faint" />}
      </span>
      {!compact && (
        <span className="block truncate text-xs text-muted tabular">
          {range}
          {h < 56 && <> · {services}</>}
        </span>
      )}
      {h >= 56 && <span className="block truncate text-xs text-muted">{services}</span>}
    </button>
  )
}
