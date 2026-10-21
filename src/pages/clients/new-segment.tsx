import { useMemo, useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router'
import { toast } from 'sonner'
import { ClientRow } from '@/components/client-picker'
import { Avatar } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Chip, Switch } from '@/components/ui/controls'
import { DatePicker } from '@/components/ui/date-picker'
import { Field, Input } from '@/components/ui/input'
import { Figure } from '@/components/ui/misc'
import { Page, PageHeader } from '@/components/ui/page'
import { Select } from '@/components/ui/select'
import { Segmented } from '@/components/ui/tabs'
import { CATEGORY_LABEL, birthdaySoon, type Client, type ClientCategory } from '@/data/clients'
import { bookableStaff } from '@/data/staff'
import { cn } from '@/lib/cn'
import { formatDate, formatNumber, monthLong } from '@/lib/format'
import { useData } from '@/lib/store'
import { TODAY, addDays, daysBetween } from '@/lib/time'
import { useCustomSegments } from './segment-store'

type Conds = {
  notVisited: { on: boolean; days: string }
  visitedWithin: { on: boolean; days: string }
  visits: { on: boolean; from: string; to: string }
  spent: { on: boolean; from: string; to: string }
  masters: { on: boolean; ids: string[] }
  birthday: { on: boolean; days: string }
  birthMonth: { on: boolean; month: string }
  gender: { on: boolean; value: 'female' | 'male' }
  consent: { on: boolean }
  debt: { on: boolean }
  added: { on: boolean; from: Date; to: Date }
  categories: { on: boolean; values: ClientCategory[] }
}

const INITIAL: Conds = {
  notVisited: { on: true, days: '45' },
  visitedWithin: { on: false, days: '30' },
  visits: { on: true, from: '3', to: '' },
  spent: { on: false, from: '', to: '' },
  masters: { on: false, ids: [] },
  birthday: { on: false, days: '7' },
  birthMonth: { on: false, month: String(TODAY.getMonth()) },
  gender: { on: false, value: 'female' },
  consent: { on: false },
  debt: { on: false },
  added: { on: false, from: addDays(TODAY, -90), to: TODAY },
  categories: { on: false, values: [] },
}

const num = (s: string) => (s.trim() === '' ? null : Number(s))
const daysSince = (d: Date | null) => (d ? daysBetween(d, TODAY) : Infinity)

function buildMatch(c: Conds) {
  return (x: Client) => {
    if (c.notVisited.on && !(daysSince(x.lastVisit) >= (num(c.notVisited.days) ?? 0))) return false
    if (c.visitedWithin.on && !(daysSince(x.lastVisit) <= (num(c.visitedWithin.days) ?? 0))) return false
    if (c.visits.on) {
      const f = num(c.visits.from)
      const t = num(c.visits.to)
      if ((f != null && x.visits < f) || (t != null && x.visits > t)) return false
    }
    if (c.spent.on) {
      const f = num(c.spent.from)
      const t = num(c.spent.to)
      if ((f != null && x.totalSpent < f) || (t != null && x.totalSpent > t)) return false
    }
    if (c.masters.on && c.masters.ids.length && !c.masters.ids.includes(x.favoriteStaffId)) return false
    if (c.birthday.on && !birthdaySoon(x, num(c.birthday.days) ?? 7)) return false
    if (c.birthMonth.on && (!x.birthday || x.birthday.getMonth() !== Number(c.birthMonth.month))) return false
    if (c.gender.on && x.gender !== c.gender.value) return false
    if (c.consent.on && !x.consentMarketing) return false
    if (c.debt.on && x.debt <= 0) return false
    if (c.added.on && (x.createdAt < c.added.from || x.createdAt > c.added.to)) return false
    if (c.categories.on && c.categories.values.length && !c.categories.values.includes(x.category)) return false
    return true
  }
}

function describe(c: Conds) {
  const out: string[] = []
  if (c.notVisited.on) out.push(`No visit for ${c.notVisited.days || 0}+ days`)
  if (c.visitedWithin.on) out.push(`Visited in the last ${c.visitedWithin.days || 0} days`)
  if (c.visits.on) out.push(`Visits ${c.visits.from || 0}${c.visits.to ? `–${c.visits.to}` : '+'}`)
  if (c.spent.on) out.push(`Spent ${c.spent.from || 0}${c.spent.to ? `–${c.spent.to}` : '+'} TJS`)
  if (c.masters.on && c.masters.ids.length) out.push(`Sees ${c.masters.ids.map((id) => bookableStaff.find((s) => s.id === id)?.name.split(' ')[0]).join(', ')}`)
  if (c.birthday.on) out.push(`Birthday within ${c.birthday.days} days`)
  if (c.birthMonth.on) out.push(`Born in ${monthLong(Number(c.birthMonth.month))}`)
  if (c.gender.on) out.push(c.gender.value === 'female' ? 'Women' : 'Men')
  if (c.consent.on) out.push('Agreed to promotions')
  if (c.debt.on) out.push('Has unpaid debt')
  if (c.added.on) out.push(`Added ${formatDate(c.added.from)}–${formatDate(c.added.to)}`)
  if (c.categories.on && c.categories.values.length) out.push(c.categories.values.map((v) => CATEGORY_LABEL[v]).join(' or '))
  return out
}

function Condition({ label, on, onToggle, children }: { label: string; on: boolean; onToggle: (v: boolean) => void; children?: ReactNode }) {
  return (
    <div className="border-b border-border py-4 last:border-b-0">
      <Switch checked={on} onChange={onToggle} label={label} />
      {on && children && <div className="mt-3 flex flex-wrap items-center gap-2 text-base text-muted">{children}</div>}
    </div>
  )
}

// Field controls stretch to their container, so size them with a wrapper.
const NumberBox = ({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder?: string }) => (
  <span className="w-20">
    <Input value={value} onChange={(e) => onChange(e.target.value.replace(/\D/g, ''))} inputMode="numeric" placeholder={placeholder} className="text-right tabular" />
  </span>
)

export function NewSegment() {
  const navigate = useNavigate()
  const clients = useData((s) => s.clients)
  const add = useCustomSegments((s) => s.add)
  const [c, setC] = useState<Conds>(INITIAL)
  const [name, setName] = useState('')

  const set = <K extends keyof Conds>(key: K, patch: Partial<Conds[K]>) => setC((prev) => ({ ...prev, [key]: { ...prev[key], ...patch } }))

  const active = useMemo(() => clients.filter((x) => !x.archived), [clients])
  const matches = useMemo(() => active.filter(buildMatch(c)), [active, c])
  const noConsent = matches.filter((x) => !x.consentMarketing).length
  const conditions = describe(c)
  const canSave = name.trim().length > 0 && conditions.length > 0

  function save() {
    if (!canSave) return
    add({ id: `custom-${Date.now()}`, name: name.trim(), conditions, builtIn: false, match: buildMatch(c) })
    toast.success(`Segment “${name.trim()}” saved`, { description: `${formatNumber(matches.length)} clients match today` })
    navigate('/clients/segments')
  }

  return (
    <Page>
      <PageHeader back="/clients/segments" title="New segment" subtitle="Turn on the conditions you need. Clients must match all of them." />
      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="flex flex-col gap-5">
          <Card className="px-5 pt-4 pb-1">
            <h2 className="text-base font-medium text-fg">Visits and purchases</h2>
            <Condition label="Hasn’t visited for" on={c.notVisited.on} onToggle={(on) => set('notVisited', { on })}>
              at least <NumberBox value={c.notVisited.days} onChange={(days) => set('notVisited', { days })} /> days
            </Condition>
            <Condition label="Visited recently" on={c.visitedWithin.on} onToggle={(on) => set('visitedWithin', { on })}>
              within the last <NumberBox value={c.visitedWithin.days} onChange={(days) => set('visitedWithin', { days })} /> days
            </Condition>
            <Condition label="Number of visits" on={c.visits.on} onToggle={(on) => set('visits', { on })}>
              from <NumberBox value={c.visits.from} onChange={(from) => set('visits', { from })} placeholder="0" /> to
              <NumberBox value={c.visits.to} onChange={(to) => set('visits', { to })} placeholder="any" />
            </Condition>
            <Condition label="Total spent" on={c.spent.on} onToggle={(on) => set('spent', { on })}>
              from <NumberBox value={c.spent.from} onChange={(from) => set('spent', { from })} placeholder="0" /> to
              <NumberBox value={c.spent.to} onChange={(to) => set('spent', { to })} placeholder="any" /> TJS
            </Condition>
            <Condition label="Usually sees" on={c.masters.on} onToggle={(on) => set('masters', { on })}>
              {bookableStaff.map((s) => {
                const sel = c.masters.ids.includes(s.id)
                return (
                  <button
                    key={s.id}
                    type="button"
                    aria-pressed={sel}
                    onClick={() => set('masters', { ids: sel ? c.masters.ids.filter((i) => i !== s.id) : [...c.masters.ids, s.id] })}
                    className={cn(
                      'press inline-flex h-8 items-center gap-1.5 rounded-full pr-3 pl-1 text-sm font-medium ring-1 ring-inset',
                      sel ? 'bg-fg text-bg ring-fg' : 'bg-surface text-fg ring-border hover:bg-fill',
                    )}
                  >
                    <Avatar name={s.name} color={s.color} size="sm" />
                    {s.name.split(' ')[0]}
                  </button>
                )
              })}
            </Condition>
          </Card>

          <Card className="px-5 pt-4 pb-1">
            <h2 className="text-base font-medium text-fg">About the client</h2>
            <Condition label="Birthday coming up" on={c.birthday.on} onToggle={(on) => set('birthday', { on })}>
              within the next <NumberBox value={c.birthday.days} onChange={(days) => set('birthday', { days })} /> days
            </Condition>
            <Condition label="Birth month" on={c.birthMonth.on} onToggle={(on) => set('birthMonth', { on })}>
              <span className="w-44">
                <Select
                  value={c.birthMonth.month}
                  onChange={(month) => set('birthMonth', { month })}
                  options={Array.from({ length: 12 }, (_, i) => ({ value: String(i), label: monthLong(i) }))}
                />
              </span>
            </Condition>
            <Condition label="Gender" on={c.gender.on} onToggle={(on) => set('gender', { on })}>
              <Segmented
                value={c.gender.value}
                onChange={(value) => set('gender', { value })}
                items={[
                  { value: 'female', label: 'Women' },
                  { value: 'male', label: 'Men' },
                ]}
              />
            </Condition>
            <Condition label="Agreed to offers and promotions" on={c.consent.on} onToggle={(on) => set('consent', { on })} />
            <Condition label="Has unpaid debt" on={c.debt.on} onToggle={(on) => set('debt', { on })} />
            <Condition label="Added to the base" on={c.added.on} onToggle={(on) => set('added', { on })}>
              between
              <span className="w-40">
                <DatePicker value={c.added.from} onChange={(from) => set('added', { from })} />
              </span>
              and
              <span className="w-40">
                <DatePicker value={c.added.to} onChange={(to) => set('added', { to })} />
              </span>
            </Condition>
            <Condition label="Category" on={c.categories.on} onToggle={(on) => set('categories', { on })}>
              {(Object.keys(CATEGORY_LABEL) as ClientCategory[]).map((k) => (
                <Chip
                  key={k}
                  active={c.categories.values.includes(k)}
                  onClick={() => set('categories', { values: c.categories.values.includes(k) ? c.categories.values.filter((v) => v !== k) : [...c.categories.values, k] })}
                >
                  {CATEGORY_LABEL[k]}
                </Chip>
              ))}
            </Condition>
          </Card>
        </div>

        <Card className="sticky top-6 p-5">
          <div className="text-base text-muted">Matching clients</div>
          <div className="mt-1 flex items-baseline gap-2">
            <Figure value={matches.length} className="text-5xl font-normal text-fg" />
            <span className="text-sm text-faint">of {formatNumber(active.length)}</span>
          </div>
          {noConsent > 0 && <p className="mt-2 text-sm text-muted">{formatNumber(noConsent)} haven’t agreed to promotions; campaigns will skip them.</p>}

          <div className="mt-4 min-h-[188px] border-t border-border pt-3">
            {matches.length ? (
              <>
                {matches.slice(0, 5).map((x) => (
                  <div key={x.id} className="py-1.5">
                    <ClientRow client={x} />
                  </div>
                ))}
                {matches.length > 5 && <p className="mt-1 text-sm text-faint">and {formatNumber(matches.length - 5)} more</p>}
              </>
            ) : (
              <p className="py-6 text-center text-base text-muted">No clients match all of these conditions.</p>
            )}
          </div>

          <div className="mt-4 flex flex-col gap-3 border-t border-border pt-4">
            <Field label="Segment name">
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Coloring, due for a touch-up" />
            </Field>
            <Button variant="primary" className="w-full" disabled={!canSave} onClick={save}>
              Save segment
            </Button>
          </div>
        </Card>
      </div>
    </Page>
  )
}
