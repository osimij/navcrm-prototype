import { useMemo } from 'react'
import { useNavigate } from 'react-router'
import { toast } from 'sonner'
import { I, Icon } from '@/components/icons'
import { Avatar } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { EmptyState, Money } from '@/components/ui/misc'
import { Table, TD, TH, THead, TR } from '@/components/ui/table'
import { STATUS_META, isVisit, serviceNames, type Appointment, type CalendarEntry } from '@/data/appointments'
import { staffById, type Staff } from '@/data/staff'
import { cn } from '@/lib/cn'
import { dayShort, formatTime } from '@/lib/format'
import { useOverlays } from '@/lib/overlays'
import { useData } from '@/lib/store'
import { NOW, addDays, isSameDay } from '@/lib/time'
import { ROOMS, hoursOn, useCalendarSettings, weekStart, workingStaff } from './data'
import { TimeGrid, type GridColumn } from './time-grid'
import { STATUS_TOAST, nextStep } from './visit-flow'

function useVisible(entries: CalendarEntry[]) {
  const showCancelled = useCalendarSettings((s) => s.showCancelled)
  return useMemo(() => entries.filter((e) => showCancelled || !(isVisit(e) && e.status === 'cancelled')), [entries, showCancelled])
}

/** Booked share of a master's working time on a date. */
function loadFor(s: Staff, date: Date, entries: CalendarEntry[]) {
  const h = hoursOn(s, date)
  if (!h) return null
  const booked = entries
    .filter((e) => e.staffId === s.id && isVisit(e) && e.status !== 'cancelled' && isSameDay(e.start, date))
    .reduce((m, e) => m + (e.end.getTime() - e.start.getTime()) / 60_000, 0)
  return Math.round((booked / (h.end - h.start)) * 100)
}

function StaffHeader({ s, date, entries }: { s: Staff; date: Date; entries: CalendarEntry[] }) {
  const load = loadFor(s, date, entries)
  return (
    <div className="flex min-w-0 items-center gap-2.5">
      <Avatar name={s.name} color={s.color} size="md" />
      <div className="min-w-0">
        <div className="truncate text-sm font-medium text-fg">{s.name}</div>
        <div className="truncate text-xs text-muted">
          {s.position}
          {load == null ? ' · Day off' : <> · <span className={cn('tabular', load >= 85 && 'text-fg')}>{load}%</span></>}
        </div>
      </div>
    </div>
  )
}

export function DayView({ date }: { date: Date }) {
  const entries = useData((s) => s.entries)
  const staffMode = useCalendarSettings((s) => s.staffMode)
  const visible = useVisible(entries)
  const columns: GridColumn[] = useMemo(
    () =>
      workingStaff(date, staffMode).map((s) => ({
        key: s.id,
        date,
        staffId: s.id,
        hours: hoursOn(s, date),
        header: <StaffHeader s={s} date={date} entries={entries} />,
        entries: visible.filter((e) => e.staffId === s.id && isSameDay(e.start, date)),
      })),
    [date, staffMode, visible, entries],
  )
  if (!columns.length) {
    return <EmptyState icon={I.calendar} title="Nobody works on this day" description="Show everyone in calendar settings, or pick another day." />
  }
  return <TimeGrid columns={columns} />
}

export function WeekView({ date, staffId }: { date: Date; staffId: string }) {
  const entries = useData((s) => s.entries)
  const visible = useVisible(entries)
  const s = staffById[staffId]
  const start = weekStart(date)
  const columns: GridColumn[] = useMemo(
    () =>
      Array.from({ length: 7 }, (_, i) => {
        const d = addDays(start, i)
        const today = isSameDay(d, NOW)
        const hours = hoursOn(s, d)
        const count = visible.filter((e) => e.staffId === staffId && isVisit(e) && isSameDay(e.start, d)).length
        return {
          key: `${staffId}-${i}`,
          date: d,
          staffId,
          hours,
          header: (
            <div className="flex items-baseline gap-2">
              <span className={cn('text-sm', today ? 'font-medium text-accent-fg' : 'text-muted')}>{dayShort(d.getDay())}</span>
              <span className={cn('text-xl font-normal tabular', today ? 'text-accent-fg' : 'text-fg')}>{d.getDate()}</span>
              <span className="ml-auto text-xs text-faint">{hours ? (count ? `${count} visits` : 'Free') : 'Day off'}</span>
            </div>
          ),
          entries: visible.filter((e) => e.staffId === staffId && isSameDay(e.start, d)),
        }
      }),
    [start.getTime(), staffId, visible, s],
  )
  return <TimeGrid columns={columns} minColWidth={140} />
}

export function RoomsView({ date }: { date: Date }) {
  const entries = useData((s) => s.entries)
  const visible = useVisible(entries)
  const columns: GridColumn[] = useMemo(
    () =>
      ROOMS.map((r) => {
        const s = r.staffId ? staffById[r.staffId] : null
        const hours = s ? hoursOn(s, date) : null
        return {
          key: r.id,
          date,
          staffId: r.staffId,
          hours,
          header: (
            <div className="flex min-w-0 items-center gap-2.5">
              <span className="grid size-8 shrink-0 place-items-center rounded-full bg-fill text-muted">
                <Icon icon={r.icon} size={16} />
              </span>
              <div className="min-w-0">
                <div className="truncate text-sm font-medium text-fg">{r.name}</div>
                <div className="truncate text-xs text-muted">{s ? (hours ? s.name : `${s.name.split(' ')[0]} · day off`) : 'Not in use today'}</div>
              </div>
            </div>
          ),
          entries: r.staffId ? visible.filter((e) => e.staffId === r.staffId && isSameDay(e.start, date)) : [],
        }
      }),
    [date, visible],
  )
  return <TimeGrid columns={columns} />
}

export function ListView({ date }: { date: Date }) {
  const entries = useData((s) => s.entries)
  const clients = useData((s) => s.clients)
  const setStatus = useData((s) => s.setStatus)
  const openVisit = useOverlays((s) => s.openVisit)
  const openNewVisit = useOverlays((s) => s.openNewVisit)
  const navigate = useNavigate()
  const visible = useVisible(entries)
  const visits = visible.filter((e): e is Appointment => isVisit(e) && isSameDay(e.start, date)).sort((a, b) => +a.start - +b.start || a.staffId.localeCompare(b.staffId))

  const groups = new Map<number, Appointment[]>()
  for (const v of visits) groups.set(v.start.getHours(), [...(groups.get(v.start.getHours()) ?? []), v])

  if (!visits.length) {
    return (
      <Card className="mb-6">
        <EmptyState icon={I.calendar} title="No visits on this day" description="Bookings from the phone, Instagram, Telegram and your booking page all show up here.">
          <Button variant="primary" icon={I.calendarAdd} onClick={() => openNewVisit({ start: date })}>
            New visit
          </Button>
        </EmptyState>
      </Card>
    )
  }

  return (
    <Card className="mb-6 overflow-hidden">
      <Table>
        <THead>
          <TH className="w-20">Time</TH>
          <TH>Client</TH>
          <TH>Services</TH>
          <TH>Master</TH>
          <TH>Status</TH>
          <TH align="right">Amount</TH>
          <TH className="w-36" />
        </THead>
        <tbody>
          {[...groups.entries()].map(([hour, list]) => (
            <GroupRows key={hour} hour={hour}>
              {list.map((a) => {
                const c = clients.find((x) => x.id === a.clientId)
                const s = staffById[a.staffId]
                const meta = STATUS_META[a.status]
                const step = nextStep(a)
                return (
                  <TR key={a.id} onClick={() => openVisit(a.id)}>
                    <TD className="tabular">
                      {formatTime(a.start)}
                      <span className="block text-xs text-faint">{formatTime(a.end)}</span>
                    </TD>
                    <TD>
                      <span className={cn(a.status === 'cancelled' || a.status === 'no_show' ? 'text-muted line-through decoration-faint' : '')}>{c?.name}</span>
                    </TD>
                    <TD muted className="max-w-64 truncate">
                      {serviceNames(a)}
                    </TD>
                    <TD>
                      <span className="flex items-center gap-2">
                        <Avatar name={s.name} color={s.color} size="sm" />
                        {s.name.split(' ')[0]}
                      </span>
                    </TD>
                    <TD>
                      <Badge tone={meta.tone} dot>
                        {meta.label}
                      </Badge>
                    </TD>
                    <TD align="right">
                      <Money value={a.price} />
                    </TD>
                    <TD align="right">
                      {step && (
                        <Button
                          size="sm"
                          variant={step.checkout ? 'primary' : 'secondary'}
                          onClick={(e) => {
                            e.stopPropagation()
                            if (step.checkout) navigate(`/pos?visit=${a.id}`)
                            else if (step.status) {
                              const prev = a.status
                              setStatus(a.id, step.status)
                              toast.success(STATUS_TOAST[step.status] ?? 'Updated', {
                                description: `${c?.name} · ${formatTime(a.start)}`,
                                action: { label: 'Undo', onClick: () => setStatus(a.id, prev) },
                              })
                            }
                          }}
                        >
                          {step.label}
                        </Button>
                      )}
                    </TD>
                  </TR>
                )
              })}
            </GroupRows>
          ))}
        </tbody>
      </Table>
    </Card>
  )
}

function GroupRows({ hour, children }: { hour: number; children: React.ReactNode }) {
  return (
    <>
      <tr>
        <td colSpan={7} className="border-b border-border bg-fill/50 px-5 py-1.5 text-xs font-medium text-faint tabular">
          {String(hour).padStart(2, '0')}:00
        </td>
      </tr>
      {children}
    </>
  )
}
