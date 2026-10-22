import { useState } from 'react'
import { toast } from 'sonner'
import { I, Icon } from '@/components/icons'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Switch } from '@/components/ui/controls'
import { DatePicker } from '@/components/ui/date-picker'
import { Modal } from '@/components/ui/dialog'
import { Field, Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { business } from '@/data/business'
import { cn } from '@/lib/cn'
import { dayShort, formatDate } from '@/lib/format'
import { TODAY, addDays } from '@/lib/time'
import { SettingsPage } from '../ui'

type Holiday = { id: string; name: string; date: Date; days: number; closed: boolean; noOnline: boolean; branch: string; official: boolean }

/** Eid dates follow the lunar calendar and are announced each year. */
const EID: Record<number, { fitr: [number, number]; adha: [number, number] }> = {
  2025: { fitr: [2, 30], adha: [5, 6] },
  2026: { fitr: [2, 20], adha: [4, 27] },
  2027: { fitr: [2, 10], adha: [4, 17] },
}

function official(year: number): Holiday[] {
  const e = EID[year] ?? EID[2026]
  const d = (m: number, day: number) => new Date(year, m, day)
  const rows: [string, Date, number, boolean][] = [
    ['New Year', d(0, 1), 1, true],
    ['Mother’s Day', d(2, 8), 1, false],
    ['Idi Ramazon', d(...e.fitr), 1, true],
    ['Navruz', d(2, 21), 4, true],
    ['Labour Day', d(4, 1), 1, false],
    ['Victory Day', d(4, 9), 1, false],
    ['Idi Qurbon', d(...e.adha), 2, true],
    ['National Unity Day', d(5, 27), 1, false],
    ['Independence Day', d(8, 9), 1, true],
    ['Constitution Day', d(10, 6), 1, false],
  ]
  return rows
    .map(([name, date, days, closed], i) => ({ id: `h${year}-${i}`, name, date, days, closed, noOnline: closed, branch: 'all', official: true }))
    .sort((a, b) => +a.date - +b.date)
}

export default function HolidaysSettings() {
  const year = TODAY.getFullYear()
  const [list, setList] = useState<Holiday[]>(() => [...official(year), ...official(year + 1)])
  const [open, setOpen] = useState(false)
  const [showPast, setShowPast] = useState(false)
  const [draft, setDraft] = useState({ name: '', date: addDays(TODAY, 7), days: '1', closed: true, branch: 'all' })

  // The next six months, across the new year, is what owners plan staff and stock around.
  const horizon = addDays(TODAY, 183)
  const upcoming = list.filter((h) => addDays(h.date, h.days) > TODAY && h.date <= horizon)
  const past = list.filter((h) => addDays(h.date, h.days) <= TODAY && h.date.getFullYear() === year)

  const update = (id: string, p: Partial<Holiday>) => setList((l) => l.map((h) => (h.id === id ? { ...h, ...p } : h)))

  function row(h: Holiday, muted?: boolean) {
    const end = addDays(h.date, h.days - 1)
    return (
      <li key={h.id} className="flex flex-wrap items-center gap-x-6 gap-y-3 border-b border-border px-5 py-4 last:border-b-0">
        <div className="w-32 shrink-0">
          <div className={cn('text-base tabular', muted ? 'text-muted' : 'text-fg')}>
            {h.days > 1 ? `${h.date.getDate()}–${formatDate(end)}` : formatDate(h.date)}
          </div>
          <div className="text-xs text-faint">{dayShort(h.date.getDay())}</div>
        </div>
        <div className="min-w-0 flex-1 basis-40">
          <div className={cn('text-base', muted ? 'text-muted' : 'text-fg')}>{h.name}</div>
          <div className="text-sm text-muted">
            {h.official ? 'Public holiday' : 'Added by you'}
            {h.days > 1 && ` · ${h.days} days`}
            {h.branch !== 'all' && ` · ${business.branches.find((b) => b.id === h.branch)?.name}`}
          </div>
        </div>
        {!muted && (
          <div className="flex items-center gap-6">
            <label className="flex items-center gap-2.5 text-sm text-muted">
              <Switch
                checked={h.closed}
                onChange={(closed) => {
                  update(h.id, { closed, noOnline: closed ? true : h.noOnline })
                  toast(closed ? `Closed on ${h.name}` : `Open on ${h.name}`)
                }}
              />
              Closed
            </label>
            <label className={cn('flex items-center gap-2.5 text-sm text-muted', h.closed && 'opacity-50')}>
              <Switch checked={h.closed || h.noOnline} onChange={(noOnline) => !h.closed && update(h.id, { noOnline })} />
              No online booking
            </label>
          </div>
        )}
      </li>
    )
  }

  return (
    <SettingsPage
      title="Holidays"
      description="Public holidays are added for you. Closed days stop online booking."
      actions={
        <Button variant="primary" icon={I.add} onClick={() => setOpen(true)}>
          Add holiday
        </Button>
      }
    >
      <h2 className="mb-3 text-lg font-medium text-fg">Coming up</h2>
      <Card className="mb-8">
        <ul>{upcoming.map((h) => row(h))}</ul>
        {!upcoming.length && <p className="px-5 py-6 text-base text-muted">No more holidays this year.</p>}
      </Card>
      {past.length > 0 && (
        <>
          <button
            type="button"
            onClick={() => setShowPast(!showPast)}
            className="mb-3 flex items-center gap-1.5 text-base text-muted hover:text-fg"
            aria-expanded={showPast}
          >
            <Icon icon={I.chevronRight} size={16} className={cn('transition-transform duration-200 ease-[var(--ease-out)] motion-reduce:transition-none', showPast && 'rotate-90')} />
            Earlier in {year} · {past.length} holidays
          </button>
          {showPast && (
            <Card className="rise">
              <ul>{past.map((h) => row(h, true))}</ul>
            </Card>
          )}
        </>
      )}
      <p className="mt-4 text-sm text-muted">Idi Ramazon and Idi Qurbon move with the lunar calendar. We update them when the dates are announced.</p>

      <Modal
        open={open}
        onOpenChange={setOpen}
        title="Add holiday"
        description="A day off for the whole business or one branch."
        footer={
          <>
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              disabled={!draft.name.trim()}
              onClick={() => {
                setList((l) =>
                  [
                    ...l,
                    {
                      id: `c${Date.now()}`,
                      name: draft.name.trim(),
                      date: draft.date,
                      days: Number(draft.days),
                      closed: draft.closed,
                      noOnline: true,
                      branch: draft.branch,
                      official: false,
                    },
                  ].sort((a, b) => +a.date - +b.date),
                )
                setOpen(false)
                toast.success(`${draft.name.trim()} added`, { description: 'Clients already booked for that day will get a message.' })
              }}
            >
              Add
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          <Field label="Name">
            <Input autoFocus value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} placeholder="e.g. Staff day off" />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="First day">
              <DatePicker value={draft.date} onChange={(date) => setDraft({ ...draft, date })} />
            </Field>
            <Field label="Days">
              <Select value={draft.days} onChange={(days) => setDraft({ ...draft, days })} options={['1', '2', '3', '4', '5', '7'].map((d) => ({ value: d, label: d === '1' ? '1 day' : `${d} days` }))} />
            </Field>
          </div>
          <Field label="Where">
            <Select
              value={draft.branch}
              onChange={(branch) => setDraft({ ...draft, branch })}
              options={[{ value: 'all', label: 'All branches' }, ...business.branches.map((b) => ({ value: b.id, label: b.name }))]}
            />
          </Field>
          <Switch checked={draft.closed} onChange={(closed) => setDraft({ ...draft, closed })} label="Closed that day" description="Online booking turns off either way." />
        </div>
      </Modal>
    </SettingsPage>
  )
}
