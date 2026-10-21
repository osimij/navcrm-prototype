import { useState } from 'react'
import { useNavigate } from 'react-router'
import { toast } from 'sonner'
import { ClientPicker } from '@/components/client-picker'
import { I, Icon } from '@/components/icons'
import { Badge } from '@/components/ui/badge'
import { Button, IconButton } from '@/components/ui/button'
import { Card, CardHeader } from '@/components/ui/card'
import { Chip, Switch } from '@/components/ui/controls'
import { Field, SearchInput, Textarea } from '@/components/ui/input'
import { Figure, Money } from '@/components/ui/misc'
import { Page, PageHeader } from '@/components/ui/page'
import { Select } from '@/components/ui/select'
import { cn } from '@/lib/cn'
import { CURRENCY, formatDate, formatTime } from '@/lib/format'
import { useData } from '@/lib/store'
import { NOW, addMinutes } from '@/lib/time'
import {
  BIOMATERIALS,
  DOCTORS,
  OWN_LAB,
  TEST_CATEGORIES,
  biomaterialsFor,
  partners,
  testById,
  turnaroundFor,
  type Biomaterial,
  type LabOrder,
} from './data'
import { useLab } from './store'

const fmtHours = (h: number) => (h < 24 ? `${h} h` : h % 24 ? `${h} h` : `${h / 24} ${h === 24 ? 'day' : 'days'}`)

export function NewOrder() {
  const tests = useLab((s) => s.tests)
  const orders = useLab((s) => s.orders)
  const addOrder = useLab((s) => s.addOrder)
  const clients = useData((s) => s.clients)
  const navigate = useNavigate()

  const [clientId, setClientId] = useState<string | null>(null)
  const [selected, setSelected] = useState<string[]>([])
  const [query, setQuery] = useState('')
  const [doctor, setDoctor] = useState('s3')
  const [where, setWhere] = useState(OWN_LAB)
  const [bio, setBio] = useState<Biomaterial[]>([])
  const [comment, setComment] = useState('')
  const [paid, setPaid] = useState(true)

  const active = tests.filter((t) => t.active)
  const inPackage = new Set(
    selected.flatMap((id) => {
      const t = testById(tests, id)
      return t?.kind === 'package' ? (t.includes ?? []) : []
    }),
  )

  function toggle(id: string) {
    const next = selected.includes(id) ? selected.filter((x) => x !== id) : [...selected, id]
    // A package replaces the single tests it already contains.
    const t = testById(tests, id)
    const cleaned = t?.kind === 'package' && !selected.includes(id) ? next.filter((x) => !(t.includes ?? []).includes(x)) : next
    setSelected(cleaned)
    setBio(biomaterialsFor(tests, cleaned))
  }

  const q = query.trim().toLowerCase()
  const visible = active.filter((t) => !q || t.name.toLowerCase().includes(q) || t.code.toLowerCase().includes(q))
  const hours = turnaroundFor(tests, selected) + (where === OWN_LAB ? 0 : 6)
  const readyBy = addMinutes(NOW, hours * 60)
  const total = selected.reduce((m, id) => m + (testById(tests, id)?.price ?? 0), 0)
  const prep = [...new Set(selected.map((id) => testById(tests, id)?.prep).filter(Boolean))] as string[]
  const client = clients.find((c) => c.id === clientId)
  const canCreate = !!clientId && selected.length > 0

  function create() {
    if (!canCreate) return
    const no = Math.max(...orders.map((o) => o.no)) + 1
    const order: LabOrder = {
      id: `lo${no}`,
      no,
      clientId: clientId!,
      testIds: selected,
      doctor,
      where,
      biomaterials: bio,
      status: 'awaiting',
      createdAt: NOW,
      due: readyBy,
      paid,
      comment: comment.trim() || undefined,
      results: {},
    }
    addOrder(order)
    toast.success(`Order ${no} created for ${client?.firstName}`, {
      description: `Results expected ${formatDate(readyBy, { weekday: true })}, ${formatTime(readyBy)}`,
    })
    navigate(`/lab?order=${order.id}`)
  }

  return (
    <Page>
      <PageHeader title="New lab order" subtitle="Pick the patient and tests. Preparation and timing update as you go." back="/lab" />
      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="flex min-w-0 flex-col gap-5">
          <Card className="p-5">
            <Field label="Patient" hint="An order can also start from a visit: open it in the calendar and add a lab order.">
              <ClientPicker value={clientId} onChange={setClientId} />
            </Field>
          </Card>

          <Card>
            <CardHeader title="Tests" description={selected.length ? `${selected.length} selected` : 'Packages bundle common tests at a lower price'} />
            <div className="px-5 pb-2">
              <SearchInput value={query} onChange={setQuery} placeholder="Search by name or code" />
            </div>
            <div className="max-h-[560px] overflow-y-auto px-2 pb-3">
              {TEST_CATEGORIES.map((cat) => {
                const items = visible.filter((t) => t.category === cat)
                if (!items.length) return null
                return (
                  <div key={cat} className="pt-3">
                    <div className="px-3 pb-1 text-xs font-medium text-faint">{cat}</div>
                    {items.map((t) => {
                      const on = selected.includes(t.id)
                      const covered = !on && inPackage.has(t.id)
                      return (
                        <button
                          key={t.id}
                          type="button"
                          disabled={covered}
                          onClick={() => toggle(t.id)}
                          className={cn(
                            'flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left',
                            covered ? 'cursor-default opacity-50' : 'hover:bg-fill',
                          )}
                        >
                          <span
                            className={cn(
                              'grid size-[18px] shrink-0 place-items-center rounded-[5px] ring-1 ring-inset transition-colors duration-150',
                              on || covered ? 'bg-accent text-on-accent ring-accent' : 'ring-border-strong',
                            )}
                          >
                            {(on || covered) && <Icon icon={I.check} size={12} strokeWidth={2.4} />}
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-base text-fg">{t.name}</span>
                            <span className="block truncate text-sm text-muted">
                              {t.kind === 'package'
                                ? (t.includes ?? []).map((x) => testById(tests, x)?.name).join(', ')
                                : covered
                                  ? 'Included in the selected package'
                                  : `${t.code} · ${t.biomaterial}`}
                            </span>
                          </span>
                          <span className="hidden w-16 shrink-0 text-right text-sm text-faint sm:block">{fmtHours(t.turnaround)}</span>
                          <Money value={t.price} className="w-24 shrink-0 text-right" />
                        </button>
                      )
                    })}
                  </div>
                )
              })}
              {!visible.length && <p className="px-3 py-6 text-center text-base text-muted">No tests match “{query}”.</p>}
            </div>
          </Card>

          <Card className="flex flex-col gap-4 p-5">
            <h3 className="text-base font-medium text-fg">Details</h3>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Ordered by">
                <Select value={doctor} onChange={setDoctor} options={DOCTORS} />
              </Field>
              <Field label="Performed by">
                <Select
                  value={where}
                  onChange={setWhere}
                  options={[
                    { value: OWN_LAB, label: 'Own lab', hint: 'Rudaki 72' },
                    ...partners
                      .filter((p) => p.status !== 'off')
                      .map((p) => ({ value: p.id, label: p.name, hint: p.status === 'test' ? 'Test mode' : `Partner · about ${p.avgTurnaround} h` })),
                  ]}
                />
              </Field>
            </div>
            <Field label="Biomaterial" hint={selected.length ? 'Suggested from the selected tests' : undefined}>
              <div className="flex flex-wrap gap-2">
                {BIOMATERIALS.map((b) => (
                  <Chip key={b} active={bio.includes(b)} onClick={() => setBio((cur) => (cur.includes(b) ? cur.filter((x) => x !== b) : [...cur, b]))}>
                    {b}
                  </Chip>
                ))}
              </div>
            </Field>
            <Field label="Comment" optional>
              <Textarea value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Symptoms, medication, anything the lab should know" />
            </Field>
          </Card>
        </div>

        <Card className="sticky top-6 flex flex-col p-5">
          <h3 className="text-base font-medium text-fg">Summary</h3>
          {selected.length ? (
            <ul className="mt-2">
              {selected.map((id) => {
                const t = testById(tests, id)!
                return (
                  <li key={id} className="flex items-center gap-2 border-b border-border py-2">
                    <span className="min-w-0 flex-1 truncate text-base text-fg">{t.name}</span>
                    <Money value={t.price} className="text-sm" />
                    <IconButton icon={I.close} label={`Remove ${t.name}`} size="xs" tooltip={false} onClick={() => toggle(id)} />
                  </li>
                )
              })}
            </ul>
          ) : (
            <p className="mt-2 text-base text-muted">Selected tests appear here.</p>
          )}

          {selected.length > 0 && (
            <div className="mt-4 flex flex-col gap-3 text-base">
              <div className="flex items-start justify-between gap-4">
                <span className="text-muted">Results by</span>
                <span className="text-right text-fg">
                  {formatDate(readyBy, { weekday: true })}, {formatTime(readyBy)}
                  {where !== OWN_LAB && <span className="block text-xs text-faint">incl. transport to the partner</span>}
                </span>
              </div>
              {prep.length > 0 && (
                <div className="rounded-xl bg-fill px-3.5 py-3">
                  <div className="mb-1 text-sm font-medium text-fg">Tell the patient</div>
                  <ul className="flex flex-col gap-1 text-sm text-muted">
                    {prep.map((p) => (
                      <li key={p} className="flex gap-2">
                        <span className="mt-[7px] size-1 shrink-0 rounded-full bg-faint" />
                        {p}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          <div className="mt-5 flex items-baseline justify-between border-t border-border pt-4">
            <span className="text-base text-muted">Total</span>
            <span className="flex items-baseline gap-1.5">
              <Figure value={total} money className="text-3xl font-normal text-fg" />
              <span className="text-sm text-faint">{CURRENCY}</span>
            </span>
          </div>
          <Switch className="mt-4" checked={paid} onChange={setPaid} label="Paid at the register" description={paid ? undefined : 'The order will show as unpaid'} />
          <Button variant="primary" size="lg" className="mt-5 w-full" disabled={!canCreate} onClick={create}>
            Create order
          </Button>
          {!canCreate && (
            <p className="mt-2 text-center text-sm text-faint">
              {!clientId ? 'Choose a patient' : 'Add at least one test'}
              {!clientId && !selected.length ? ' and tests' : ''}
            </p>
          )}
          {client && client.debt > 0 && (
            <div className="mt-3">
              <Badge tone="negative">
                Owes <Money value={client.debt} /> from a previous visit
              </Badge>
            </div>
          )}
        </Card>
      </div>
    </Page>
  )
}
