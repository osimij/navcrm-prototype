import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import { BarChart } from '@/components/charts/bar-chart'
import { I, Icon } from '@/components/icons'
import { Button } from '@/components/ui/button'
import { Card, CardHeader } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/controls'
import { Modal } from '@/components/ui/dialog'
import { Field, Input } from '@/components/ui/input'
import { Menu, MenuItem } from '@/components/ui/menu'
import { EmptyState, Money } from '@/components/ui/misc'
import { Page, PageHeader } from '@/components/ui/page'
import { Select } from '@/components/ui/select'
import { Segmented } from '@/components/ui/tabs'
import { Table, TD, TH, THead, TR } from '@/components/ui/table'
import { SOURCE_LABEL, type Appointment } from '@/data/appointments'
import { PAYMENT_METHODS, business } from '@/data/business'
import { CATEGORY_LABEL, clientById } from '@/data/clients'
import { serviceById } from '@/data/services'
import { bookableStaff, staffById } from '@/data/staff'
import { formatDate, formatNumber, monthShort } from '@/lib/format'
import { useData } from '@/lib/store'
import { NOW, TODAY, addDays } from '@/lib/time'
import { COMMISSION, RANGE_OPTIONS, discountFor, hash, methodFor, methodName, rangeFor, rangeText, visitsIn, type RangeKey } from './data'

type SourceId = 'sales' | 'receipts' | 'visits' | 'clients' | 'payroll' | 'stock' | 'online'
type Dim = 'day' | 'week' | 'month' | 'branch' | 'master' | 'service' | 'category' | 'method' | 'source' | 'segment' | 'product'
type MetricId = 'revenue' | 'count' | 'avg' | 'discounts' | 'clients' | 'noShows' | 'accrual' | 'qty' | 'value'

const DIM_LABEL: Record<Dim, string> = {
  day: 'Day',
  week: 'Week',
  month: 'Month',
  branch: 'Branch',
  master: 'Master',
  service: 'Service',
  category: 'Category',
  method: 'Payment method',
  source: 'Booking source',
  segment: 'Client category',
  product: 'Product',
}

const METRICS: Record<MetricId, { label: string; money?: boolean }> = {
  revenue: { label: 'Revenue', money: true },
  count: { label: 'Count' },
  avg: { label: 'Average', money: true },
  discounts: { label: 'Discounts', money: true },
  clients: { label: 'Unique clients' },
  noShows: { label: 'No-shows' },
  accrual: { label: 'Accrued pay', money: true },
  qty: { label: 'Quantity' },
  value: { label: 'Value', money: true },
}

const SOURCES: Record<SourceId, { label: string; count: string; dims: Dim[]; metrics: MetricId[] }> = {
  sales: { label: 'Sales', count: 'Items sold', dims: ['day', 'week', 'month', 'branch', 'master', 'service', 'category', 'segment'], metrics: ['revenue', 'count', 'avg', 'discounts'] },
  receipts: { label: 'Receipts', count: 'Receipts', dims: ['day', 'week', 'month', 'branch', 'master', 'method', 'segment'], metrics: ['revenue', 'count', 'avg', 'discounts', 'clients'] },
  visits: { label: 'Visits', count: 'Visits', dims: ['day', 'week', 'month', 'branch', 'master', 'service', 'category', 'source', 'segment'], metrics: ['count', 'clients', 'noShows', 'revenue'] },
  clients: { label: 'Clients', count: 'Clients', dims: ['month', 'segment', 'source', 'master'], metrics: ['count', 'revenue', 'avg'] },
  payroll: { label: 'Payroll accruals', count: 'Visits', dims: ['day', 'week', 'month', 'master', 'service', 'category'], metrics: ['accrual', 'revenue', 'count'] },
  stock: { label: 'Stock movement', count: 'Movements', dims: ['day', 'week', 'month', 'product', 'category'], metrics: ['qty', 'value', 'count'] },
  online: { label: 'Online bookings', count: 'Bookings', dims: ['day', 'week', 'month', 'master', 'service', 'source', 'segment'], metrics: ['count', 'clients', 'noShows', 'revenue'] },
}

type Rec = { dims: Partial<Record<Dim, string>>; sort: Partial<Record<Dim, number>>; m: Partial<Record<MetricId, number>>; client?: string }

type Config = {
  source: SourceId
  range: Exclude<RangeKey, 'custom'>
  dims: Dim[]
  metrics: MetricId[]
  master: string
  method: string
  sort: 'desc' | 'asc' | 'name'
}

const PRESETS: { id: string; name: string; config: Config }[] = [
  { id: 'p1', name: 'Revenue by master, this month', config: { source: 'receipts', range: 'this-month', dims: ['master'], metrics: ['revenue', 'count', 'avg'], master: 'all', method: 'all', sort: 'desc' } },
  { id: 'p2', name: 'Bookings by source, last 30 days', config: { source: 'visits', range: 'last-30', dims: ['source'], metrics: ['count', 'clients', 'noShows'], master: 'all', method: 'all', sort: 'desc' } },
  { id: 'p3', name: 'Payment methods by week', config: { source: 'receipts', range: 'last-30', dims: ['week', 'method'], metrics: ['revenue', 'count'], master: 'all', method: 'all', sort: 'name' } },
]

const STOCK_ITEMS = [
  { name: 'Gel polish base', category: 'Nails', cost: 85 },
  { name: 'Hair color 7.1', category: 'Hair', cost: 62 },
  { name: 'Oxidant 6%', category: 'Hair', cost: 48 },
  { name: 'Lash lift glue', category: 'Brows & lashes', cost: 120 },
  { name: 'Hyaluronic serum', category: 'Retail', cost: 95 },
  { name: 'Disposable collars', category: 'Consumables', cost: 35 },
]

function timeDims(d: Date) {
  const dayIdx = Math.round((+d - +TODAY) / 86_400_000)
  const monday = addDays(d, -((d.getDay() + 6) % 7))
  return {
    dims: { day: formatDate(d, { weekday: true }), week: `Week of ${formatDate(monday)}`, month: `${monthShort(d.getMonth())} ${d.getFullYear()}` },
    sort: { day: dayIdx, week: +monday, month: d.getFullYear() * 12 + d.getMonth() },
  }
}

function visitRec(a: Appointment, serviceId?: string): Rec {
  const t = timeDims(a.start)
  const svc = serviceById[serviceId ?? a.serviceIds[0]]
  const client = clientById[a.clientId]
  return {
    dims: {
      ...t.dims,
      branch: business.branches[0].name,
      master: staffById[a.staffId]?.name,
      service: svc?.name,
      category: svc?.category,
      method: methodName(methodFor(a.id)),
      source: SOURCE_LABEL[a.source],
      segment: client ? CATEGORY_LABEL[client.category] : 'Unknown',
    },
    sort: t.sort,
    m: {},
    client: a.clientId,
  }
}

function records(cfg: Config, entries: ReturnType<typeof useData.getState>['entries'], clients: ReturnType<typeof useData.getState>['clients']): Rec[] {
  const range = rangeFor(cfg.range)
  const inRange = visitsIn(entries, range).filter((a) => cfg.master === 'all' || a.staffId === cfg.master)
  const paid = inRange.filter((a) => a.paid && a.status === 'completed' && a.end <= NOW && !staffById[a.staffId]?.tenant)
  const byMethod = (a: Appointment) => cfg.method === 'all' || methodFor(a.id) === cfg.method
  switch (cfg.source) {
    case 'sales':
      return paid.filter(byMethod).flatMap((a) =>
        a.serviceIds.map((id) => {
          const r = visitRec(a, id)
          r.m = { revenue: serviceById[id].price, count: 1, discounts: Math.round(discountFor(a) / a.serviceIds.length) }
          return r
        }),
      )
    case 'receipts':
      return paid.filter(byMethod).map((a) => {
        const r = visitRec(a)
        r.m = { revenue: a.price, count: 1, discounts: discountFor(a) }
        return r
      })
    case 'visits':
    case 'online':
      return inRange
        .filter((a) => a.status !== 'cancelled' && (cfg.source === 'visits' || ['online', 'instagram', 'telegram', 'assistant'].includes(a.source)))
        .map((a) => {
          const r = visitRec(a)
          r.m = { count: 1, noShows: a.status === 'no_show' ? 1 : 0, revenue: a.paid ? a.price : 0 }
          return r
        })
    case 'payroll':
      return paid.flatMap((a) =>
        a.serviceIds.map((id) => {
          const r = visitRec(a, id)
          const price = serviceById[id].price
          r.m = { revenue: price, count: 1, accrual: Math.round(price * (COMMISSION[a.staffId] ?? 0.4)) }
          return r
        }),
      )
    case 'clients':
      return clients
        .filter((c) => !c.archived && (cfg.master === 'all' || c.favoriteStaffId === cfg.master))
        .map((c) => {
          const t = timeDims(c.createdAt)
          return {
            dims: { month: t.dims.month, segment: CATEGORY_LABEL[c.category], source: c.source, master: staffById[c.favoriteStaffId]?.name ?? '—' },
            sort: { month: t.sort.month },
            m: { count: 1, revenue: c.totalSpent },
            client: c.id,
          }
        })
    case 'stock': {
      const out: Rec[] = []
      for (let d = range.from; d <= range.to; d++) {
        for (const item of STOCK_ITEMS) {
          const x = hash(`mv-${item.name}-${d}`)
          if (x > 0.35) continue
          const qty = 1 + Math.floor(x * 6)
          const t = timeDims(addDays(TODAY, d))
          out.push({ dims: { ...t.dims, product: item.name, category: item.category }, sort: t.sort, m: { qty, value: qty * item.cost, count: 1 } })
        }
      }
      return out
    }
  }
}

type Row = { keys: string[]; sortKeys: number[]; values: Record<MetricId, number> }

function aggregate(recs: Rec[], cfg: Config): Row[] {
  const map = new Map<string, { keys: string[]; sortKeys: number[]; sum: Partial<Record<MetricId, number>>; clients: Set<string>; n: number }>()
  for (const r of recs) {
    const keys = cfg.dims.map((d) => r.dims[d] ?? '—')
    const id = keys.join('␟')
    const g = map.get(id) ?? { keys, sortKeys: cfg.dims.map((d) => r.sort[d] ?? 0), sum: {}, clients: new Set<string>(), n: 0 }
    for (const [k, v] of Object.entries(r.m) as [MetricId, number][]) g.sum[k] = (g.sum[k] ?? 0) + v
    if (r.client) g.clients.add(r.client)
    g.n++
    map.set(id, g)
  }
  const rows: Row[] = [...map.values()].map((g) => ({
    keys: g.keys,
    sortKeys: g.sortKeys,
    values: {
      revenue: g.sum.revenue ?? 0,
      count: g.sum.count ?? g.n,
      avg: g.n ? (cfg.source === 'clients' ? (g.sum.revenue ?? 0) / g.n : (g.sum.revenue ?? 0) / (g.sum.count || 1)) : 0,
      discounts: g.sum.discounts ?? 0,
      clients: g.clients.size,
      noShows: g.sum.noShows ?? 0,
      accrual: g.sum.accrual ?? 0,
      qty: g.sum.qty ?? 0,
      value: g.sum.value ?? 0,
    },
  }))
  const first = cfg.metrics[0] ?? 'count'
  if (cfg.sort === 'name') {
    rows.sort((a, b) => {
      for (let i = 0; i < a.keys.length; i++) {
        const t = cfg.dims[i]
        const isTime = t === 'day' || t === 'week' || t === 'month'
        const c = isTime ? a.sortKeys[i] - b.sortKeys[i] : a.keys[i].localeCompare(b.keys[i])
        if (c) return c
      }
      return 0
    })
  } else rows.sort((a, b) => (cfg.sort === 'desc' ? b.values[first] - a.values[first] : a.values[first] - b.values[first]))
  return rows
}

const DEFAULT: Config = PRESETS[0].config

export default function ReportBuilder() {
  const entries = useData((s) => s.entries)
  const clients = useData((s) => s.clients)
  const [draft, setDraft] = useState<Config>(DEFAULT)
  const [applied, setApplied] = useState<Config>(DEFAULT)
  const [view, setView] = useState<'table' | 'chart'>('table')
  const [saved, setSaved] = useState(PRESETS)
  const [savedId, setSavedId] = useState<string>(PRESETS[0].id)
  const [saving, setSaving] = useState(false)
  const [name, setName] = useState('')

  const source = SOURCES[draft.source]
  const dirty = JSON.stringify(draft) !== JSON.stringify(applied)
  const rows = useMemo(() => aggregate(records(applied, entries, clients), applied), [applied, entries, clients])
  const totals = useMemo(() => {
    const t = {} as Record<MetricId, number>
    for (const m of Object.keys(METRICS) as MetricId[]) t[m] = rows.reduce((s, r) => s + r.values[m], 0)
    t.avg = t.count ? t.revenue / t.count : 0
    return t
  }, [rows])

  const update = (p: Partial<Config>) => setDraft((d) => ({ ...d, ...p }))
  function setSource(s: SourceId) {
    const cfg = SOURCES[s]
    update({
      source: s,
      dims: draft.dims.filter((d) => cfg.dims.includes(d)).slice(0, 3).length ? draft.dims.filter((d) => cfg.dims.includes(d)).slice(0, 3) : [cfg.dims[0]],
      metrics: draft.metrics.filter((m) => cfg.metrics.includes(m)).length ? draft.metrics.filter((m) => cfg.metrics.includes(m)) : cfg.metrics.slice(0, 2),
    })
  }
  function load(id: string) {
    const p = saved.find((x) => x.id === id)
    if (!p) return
    setSavedId(id)
    setDraft(p.config)
    setApplied(p.config)
  }
  const fmt = (m: MetricId, v: number) => (METRICS[m].money ? <Money value={v} /> : formatNumber(v))
  const exported = (kind: string) => toast.success('Report exported', { description: `report.${kind} saved to Downloads` })

  const metricLabel = (m: MetricId, src: SourceId) => (m === 'count' ? SOURCES[src].count : METRICS[m].label)
  const title = `${applied.metrics.map((m, i) => (i ? metricLabel(m, applied.source).toLowerCase() : metricLabel(m, applied.source))).join(', ')} by ${applied.dims
    .map((d) => DIM_LABEL[d].toLowerCase())
    .join(', ')}`

  return (
    <Page width="wide">
      <PageHeader
        back="/reports"
        title="Report builder"
        subtitle="Pick a data source, group it by up to three fields and choose what to count."
        actions={
          <>
            <Select
              look="pill"
              value={savedId || null}
              placeholder="Saved reports"
              onChange={load}
              options={saved.map((p) => ({ value: p.id, label: p.name }))}
              prefix={<Icon icon={I.chart} size={15} />}
              align="end"
            />
            <Button icon={I.add} onClick={() => (setName(''), setSaving(true))}>
              Save
            </Button>
            <Menu align="end" trigger={<Button icon={I.download} iconRight={I.chevronDown}>Export</Button>}>
              <MenuItem icon={I.download} onClick={() => exported('xlsx')}>
                Excel (.xlsx)
              </MenuItem>
              <MenuItem icon={I.note} onClick={() => exported('csv')}>
                CSV
              </MenuItem>
            </Menu>
          </>
        }
      />

      <div className="grid items-start gap-5 lg:grid-cols-[320px_minmax(0,1fr)]">
        <Card className="flex flex-col gap-5 p-5 lg:sticky lg:top-4">
          <Field label="Data source">
            <Select value={draft.source} onChange={setSource} options={(Object.keys(SOURCES) as SourceId[]).map((s) => ({ value: s, label: SOURCES[s].label }))} />
          </Field>
          <Field label="Period">
            <Select
              value={draft.range}
              onChange={(v) => update({ range: v })}
              options={RANGE_OPTIONS.filter((o) => o.value !== 'custom') as { value: Config['range']; label: string }[]}
            />
          </Field>
          <Field label="Group by" hint="Up to three, in order">
            <div className="flex flex-wrap gap-1.5">
              {draft.dims.map((d, i) => (
                <span key={d} className="inline-flex h-8 items-center gap-1 rounded-full bg-fill pr-1 pl-3 text-sm font-medium text-fg">
                  <span className="text-faint tabular">{i + 1}</span>
                  {DIM_LABEL[d]}
                  <button
                    type="button"
                    aria-label={`Remove ${DIM_LABEL[d]}`}
                    disabled={draft.dims.length === 1}
                    onClick={() => update({ dims: draft.dims.filter((x) => x !== d) })}
                    className="grid size-6 place-items-center rounded-full text-faint hover:bg-fill-hover hover:text-fg disabled:opacity-30"
                  >
                    <Icon icon={I.close} size={13} />
                  </button>
                </span>
              ))}
              {draft.dims.length < 3 && (
                <Menu
                  trigger={
                    <button type="button" className="press inline-flex h-8 items-center gap-1 rounded-full px-3 text-sm font-medium text-accent-fg ring-1 ring-border ring-inset hover:bg-fill">
                      <Icon icon={I.add} size={14} />
                      Add
                    </button>
                  }
                >
                  {source.dims
                    .filter((d) => !draft.dims.includes(d))
                    .map((d) => (
                      <MenuItem key={d} onClick={() => update({ dims: [...draft.dims, d] })}>
                        {DIM_LABEL[d]}
                      </MenuItem>
                    ))}
                </Menu>
              )}
            </div>
          </Field>
          <Field label="Show">
            <div className="flex flex-col gap-2">
              {source.metrics.map((m) => (
                <Checkbox
                  key={m}
                  checked={draft.metrics.includes(m)}
                  onChange={(on) => {
                    const next = on ? [...draft.metrics, m] : draft.metrics.filter((x) => x !== m)
                    if (next.length) update({ metrics: source.metrics.filter((x) => next.includes(x)) })
                  }}
                  label={metricLabel(m, draft.source)}
                />
              ))}
            </div>
          </Field>
          <Field label="Filters">
            <div className="flex flex-col gap-2">
              <Select
                value={draft.master}
                onChange={(v) => update({ master: v })}
                options={[{ value: 'all', label: 'All masters' }, ...bookableStaff.map((s) => ({ value: s.id, label: s.name }))]}
              />
              {(draft.source === 'receipts' || draft.source === 'sales') && (
                <Select
                  value={draft.method}
                  onChange={(v) => update({ method: v })}
                  options={[{ value: 'all', label: 'All payment methods' }, ...PAYMENT_METHODS.map((m) => ({ value: m.id, label: m.name }))]}
                />
              )}
            </div>
          </Field>
          <Field label="Sort">
            <Select
              value={draft.sort}
              onChange={(v) => update({ sort: v })}
              options={[
                { value: 'desc', label: `${METRICS[draft.metrics[0]]?.label ?? 'Value'}, high to low` },
                { value: 'asc', label: `${METRICS[draft.metrics[0]]?.label ?? 'Value'}, low to high` },
                { value: 'name', label: 'By group' },
              ]}
            />
          </Field>
          <div>
            <Button
              variant="primary"
              className="w-full"
              disabled={!dirty}
              onClick={() => {
                setApplied(draft)
                // An edited report is no longer the saved one it started from.
                if (JSON.stringify(saved.find((x) => x.id === savedId)?.config) !== JSON.stringify(draft)) setSavedId('')
              }}
            >
              Show report
            </Button>
            <p className="mt-2 h-4 text-center text-xs text-faint">{dirty ? 'You have changes that aren’t shown yet' : ''}</p>
          </div>
        </Card>

        <Card className="min-w-0">
          <CardHeader
            title={title}
            description={`${SOURCES[applied.source].label} · ${rangeText(rangeFor(applied.range))} · ${formatNumber(rows.length)} rows`}
            action={
              <Segmented
                size="sm"
                value={view}
                onChange={setView}
                items={[
                  { value: 'table', label: 'Table' },
                  { value: 'chart', label: 'Chart' },
                ]}
              />
            }
          />
          {!rows.length ? (
            <EmptyState icon={I.chart} title="Nothing in this period" description="Try a longer period or remove a filter." />
          ) : view === 'chart' ? (
            <div className="px-5 pt-2 pb-5">
              <BarChart
                height={260}
                bars={rows.slice(0, 24).map((r) => ({ label: r.keys[0].replace(/^Week of /, ''), value: r.values[applied.metrics[0]] }))}
                labelEvery={rows.length > 12 ? 3 : 1}
                renderTooltip={(b, i) => (
                  <>
                    {rows[i].keys.join(' · ')} · {fmt(applied.metrics[0], b.value)}
                  </>
                )}
              />
              {rows.length > 24 && <p className="mt-3 text-sm text-faint">Showing the first 24 of {rows.length} rows.</p>}
            </div>
          ) : (
            <div className="max-h-[640px] overflow-y-auto">
              <Table>
                <THead>
                  {applied.dims.map((d) => (
                    <TH key={d}>{DIM_LABEL[d]}</TH>
                  ))}
                  {applied.metrics.map((m) => (
                    <TH key={m} align="right">
                      {metricLabel(m, applied.source)}
                    </TH>
                  ))}
                </THead>
                <tbody>
                  {rows.map((r) => (
                    <TR key={r.keys.join('|')}>
                      {r.keys.map((k, i) => (
                        <TD key={i} muted={i > 0}>
                          {k}
                        </TD>
                      ))}
                      {applied.metrics.map((m) => (
                        <TD key={m} align="right">
                          {fmt(m, r.values[m])}
                        </TD>
                      ))}
                    </TR>
                  ))}
                  <TR>
                    <TD className="font-medium">Total</TD>
                    {applied.dims.slice(1).map((d) => (
                      <TD key={d} />
                    ))}
                    {applied.metrics.map((m) => (
                      <TD key={m} align="right" className="font-medium">
                        {m === 'clients' ? '—' : fmt(m, totals[m])}
                      </TD>
                    ))}
                  </TR>
                </tbody>
              </Table>
            </div>
          )}
        </Card>
      </div>

      <Modal
        open={saving}
        onOpenChange={setSaving}
        title="Save report"
        description="Saved reports appear in the list at the top for everyone with access to reports."
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setSaving(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              disabled={!name.trim()}
              onClick={() => {
                const id = `s${Date.now()}`
                setSaved((s) => [...s, { id, name: name.trim(), config: draft }])
                setSavedId(id)
                setApplied(draft)
                setSaving(false)
                toast.success('Report saved')
              }}
            >
              Save
            </Button>
          </>
        }
      >
        <Field label="Name">
          <Input autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Revenue by master, weekly" />
        </Field>
      </Modal>
    </Page>
  )
}

