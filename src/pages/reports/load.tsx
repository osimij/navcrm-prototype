import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router'
import { I, Icon } from '@/components/icons'
import { Avatar } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardHeader } from '@/components/ui/card'
import { Meter, Money } from '@/components/ui/misc'
import { Table, TD, TH, THead, TR } from '@/components/ui/table'
import { isVisit } from '@/data/appointments'
import { bookableStaff } from '@/data/staff'
import { dayLong, formatNumber } from '@/lib/format'
import { useData } from '@/lib/store'
import { TODAY, addDays, at, isSameDay } from '@/lib/time'
import { offsets } from './data'
import { FilterBar, Kpi, KpiRow, ReportLayout, useReportFilters } from './layout'

const HOURS = Array.from({ length: 12 }, (_, i) => 9 + i)
const WEEK = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const hh = (h: number) => `${String(h).padStart(2, '0')}:00`

const overlap = (a0: Date, a1: Date, b0: Date, b1: Date) => Math.max(0, (Math.min(+a1, +b1) - Math.max(+a0, +b0)) / 60_000)

export default function LoadReport() {
  const f = useReportFilters('last-30')
  const entries = useData((s) => s.entries)
  const navigate = useNavigate()
  const [hover, setHover] = useState<{ w: number; h: number } | null>(null)

  const data = useMemo(() => {
    const masters = bookableStaff.filter((s) => f.staffId === 'all' || s.id === f.staffId)
    const booked = Array.from({ length: 7 }, () => HOURS.map(() => 0))
    const avail = Array.from({ length: 7 }, () => HOURS.map(() => 0))
    const perMaster = new Map<string, { avail: number; booked: number; visits: number; revenue: number }>()

    for (const d of offsets(f.range)) {
      const date = addDays(TODAY, d)
      const w = (date.getDay() + 6) % 7
      const day = entries.filter((e) => isSameDay(e.start, date) && !(isVisit(e) && e.status === 'cancelled'))
      for (const s of masters) {
        if (!s.today) continue
        const mine = day.filter((e) => e.staffId === s.id)
        // Treat a master as working on days they had anything in the calendar.
        if (!mine.length) continue
        const stats = perMaster.get(s.id) ?? { avail: 0, booked: 0, visits: 0, revenue: 0 }
        const start = at(date, s.today.start)
        const end = at(date, s.today.end)
        HOURS.forEach((h, i) => {
          const h0 = at(date, hh(h))
          const h1 = at(date, hh(h + 1))
          const work = overlap(h0, h1, start, end)
          if (!work) return
          const brk = mine.filter((e) => e.kind === 'block' && e.type === 'break').reduce((m, b) => m + overlap(h0, h1, b.start, b.end), 0)
          const busy = mine.filter(isVisit).reduce((m, a) => m + overlap(h0, h1, a.start, a.end), 0)
          avail[w][i] += work - brk
          booked[w][i] += Math.min(busy, work - brk)
          stats.avail += work - brk
          stats.booked += Math.min(busy, work - brk)
        })
        const visits = mine.filter(isVisit)
        stats.visits += visits.length
        stats.revenue += visits.filter((a) => a.paid).reduce((m, a) => m + a.price, 0)
        perMaster.set(s.id, stats)
      }
    }

    const load = booked.map((row, w) => row.map((b, i) => (avail[w][i] ? b / avail[w][i] : null)))
    const totalAvail = avail.flat().reduce((m, x) => m + x, 0)
    const totalBooked = booked.flat().reduce((m, x) => m + x, 0)

    let busiest = { w: 0, h: 0, v: -1 }
    let quietest = { w: 0, h: 0, v: 2 }
    load.forEach((row, w) =>
      row.forEach((v, i) => {
        if (v == null) return
        if (v > busiest.v) busiest = { w, h: HOURS[i], v }
        if (v < quietest.v) quietest = { w, h: HOURS[i], v }
      }),
    )

    // The quietest two-hour window of the week, worth a targeted offer.
    let idle = { w: 0, i: 0, v: 2 }
    load.forEach((row, w) => {
      for (let i = 0; i < row.length - 1; i++) {
        const a = row[i]
        const b = row[i + 1]
        if (a == null || b == null) continue
        const v = (a + b) / 2
        if (v < idle.v) idle = { w, i, v }
      }
    })

    // Hours nobody works (e.g. 20:00 when everyone has left) are dropped from the grid.
    const columns = HOURS.map((_, i) => i).filter((i) => load.some((row) => row[i] != null))
    const values = load.flat().filter((v): v is number => v != null)
    const lo = Math.min(...values)
    const hi = Math.max(...values)

    return { load, totalAvail, totalBooked, busiest, quietest, idle, perMaster, masters, columns, lo, hi }
  }, [entries, f.range, f.staffId])

  const avgLoad = data.totalAvail ? Math.round((data.totalBooked / data.totalAvail) * 100) : 0
  const hovered = hover ? data.load[hover.w][hover.h] : null
  const idleFrom = HOURS[data.idle.i]
  const partOfDay = idleFrom < 12 ? 'morning' : idleFrom < 17 ? 'afternoon' : 'evening'
  // Shade relative to this period's own range, so busy and quiet hours stand apart.
  const shade = (v: number) => Math.round(10 + ((v - data.lo) / (data.hi - data.lo || 1)) * 85)

  return (
    <ReportLayout
      title="Staff load"
      subtitle="Booked time as a share of working hours, breaks excluded"
      question="When are my chairs empty, and how can I fill them?"
    >
      <FilterBar f={f} segment={false} />

      <KpiRow>
        <Kpi label="Average load" value={avgLoad} suffix="%" sub="Across all working hours" />
        <Kpi label="Idle hours" value={Math.round((data.totalAvail - data.totalBooked) / 60)} suffix="h" sub="Paid working time with no bookings" />
        <Card className="p-5">
          <div className="text-base text-muted">Busiest time</div>
          <div className="mt-3 text-3xl font-normal text-fg tabular">
            {WEEK[data.busiest.w]} {hh(data.busiest.h)}
          </div>
          <div className="mt-1.5 text-sm text-muted">{Math.round(data.busiest.v * 100)}% booked</div>
        </Card>
        <Card className="p-5">
          <div className="text-base text-muted">Quietest time</div>
          <div className="mt-3 text-3xl font-normal text-fg tabular">
            {WEEK[data.quietest.w]} {hh(data.quietest.h)}
          </div>
          <div className="mt-1.5 text-sm text-muted">{Math.round(data.quietest.v * 100)}% booked</div>
        </Card>
      </KpiRow>

      {data.idle.v < avgLoad / 100 - 0.15 && (
        <div className="mb-5 flex flex-wrap items-center gap-3 rounded-2xl bg-accent-soft px-5 py-4">
          <span className="grid size-9 shrink-0 place-items-center rounded-full bg-surface text-accent-fg">
            <Icon icon={I.sparkles} size={18} />
          </span>
          <p className="min-w-0 flex-1 text-base text-fg">
            {dayLong((data.idle.w + 1) % 7)} {idleFrom}–{idleFrom + 2}: {Math.round((1 - data.idle.v) * 100)}% of chairs are empty.{' '}
            <span className="text-muted">{partOfDay[0].toUpperCase() + partOfDay.slice(1)} discounts for regular clients usually fill these hours.</span>
          </p>
          <Button size="sm" variant="primary" onClick={() => navigate('/campaigns/new')}>
            Create offer
          </Button>
        </div>
      )}

      <Card className="mb-5">
        <CardHeader
          title="When you’re busy"
          description="Darker means more of the working time was booked"
          action={
            <span className="text-sm text-muted tabular">
              {hover && hovered != null ? `${WEEK[hover.w]} ${hh(HOURS[hover.h])}–${hh(HOURS[hover.h] + 1)} · ${Math.round(hovered * 100)}% booked` : 'Hover a cell for details'}
            </span>
          }
        />
        <div className="overflow-x-auto px-5 pb-5">
          <div
            className="grid min-w-[600px] gap-1"
            style={{ gridTemplateColumns: `44px repeat(${data.columns.length}, minmax(0, 1fr))` }}
            onPointerLeave={() => setHover(null)}
          >
            <span />
            {data.columns.map((i) => (
              <span key={i} className="pb-1 text-center text-xs text-faint tabular">
                {String(HOURS[i]).padStart(2, '0')}
              </span>
            ))}
            {data.load.map((row, w) => (
              <div key={w} className="contents">
                <span className="flex items-center text-sm text-muted">{WEEK[w]}</span>
                {data.columns.map((i) => {
                  const v = row[i]
                  return (
                    <span
                      key={i}
                      onPointerEnter={() => setHover({ w, h: i })}
                      className={v == null ? 'hatch h-9 rounded-md bg-fill' : 'h-9 rounded-md ring-inset hover:ring-2 hover:ring-fg'}
                      style={v == null ? undefined : { background: `color-mix(in oklab, var(--accent) ${shade(v)}%, var(--fill))` }}
                      title={v == null ? 'Closed' : `${Math.round(v * 100)}% booked`}
                    />
                  )
                })}
              </div>
            ))}
          </div>
          <div className="mt-4 flex items-center gap-3 text-xs text-faint tabular">
            <span>{Math.round(data.lo * 100)}%</span>
            <span className="h-2 w-40 rounded-full" style={{ background: 'linear-gradient(to right, color-mix(in oklab, var(--accent) 10%, var(--fill)), color-mix(in oklab, var(--accent) 95%, var(--fill)))' }} />
            <span>{Math.round(data.hi * 100)}%</span>
            <span className="ml-4 flex items-center gap-1.5">
              <span className="hatch size-3 rounded-[3px] bg-fill" /> Closed
            </span>
          </div>
        </div>
      </Card>

      <Card>
        <CardHeader title="By master" />
        <Table>
          <THead>
            <TH>Master</TH>
            <TH align="right">Working</TH>
            <TH align="right">Booked</TH>
            <TH className="w-[26%]">Load</TH>
            <TH align="right">Visits</TH>
            <TH align="right">Revenue</TH>
          </THead>
          <tbody>
            {data.masters
              .filter((s) => data.perMaster.has(s.id))
              .map((s) => {
                const m = data.perMaster.get(s.id)!
                const pct = m.avail ? Math.round((m.booked / m.avail) * 100) : 0
                return (
                  <TR key={s.id}>
                    <TD>
                      <span className="flex items-center gap-2.5">
                        <Avatar name={s.name} color={s.color} size="sm" />
                        <span className="min-w-0">
                          <span className="block text-base text-fg">{s.name}</span>
                          <span className="block text-sm text-muted">{s.position}</span>
                        </span>
                        {s.tenant && <Badge>Tenant</Badge>}
                      </span>
                    </TD>
                    <TD align="right" muted>
                      {formatNumber(m.avail / 60)} h
                    </TD>
                    <TD align="right">{formatNumber(m.booked / 60)} h</TD>
                    <TD>
                      <div className="flex items-center gap-3">
                        <Meter value={pct} tone={pct >= 90 ? 'warning' : 'fg'} className="flex-1" />
                        <span className="w-10 text-right text-sm tabular">{pct}%</span>
                      </div>
                    </TD>
                    <TD align="right" muted>
                      {m.visits}
                    </TD>
                    <TD align="right">
                      <Money value={m.revenue} />
                    </TD>
                  </TR>
                )
              })}
          </tbody>
        </Table>
      </Card>
    </ReportLayout>
  )
}
