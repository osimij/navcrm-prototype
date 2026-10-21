import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import { I, Icon } from '@/components/icons'
import { AvatarStack } from '@/components/ui/avatar'
import { LabelChip } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Checkbox, Chip, Switch } from '@/components/ui/controls'
import { Modal } from '@/components/ui/dialog'
import { Field, Input, SearchInput, Textarea } from '@/components/ui/input'
import { Money } from '@/components/ui/misc'
import { Select } from '@/components/ui/select'
import { Segmented, Tabs } from '@/components/ui/tabs'
import { Table, TD, TH, THead, TR } from '@/components/ui/table'
import type { LabelColor } from '@/data/business'
import { SERVICE_CATEGORIES, services as baseServices, type ServiceCategory } from '@/data/services'
import { bookableStaff, staffById } from '@/data/staff'
import { cn } from '@/lib/cn'
import { formatDuration } from '@/lib/format'
import { LabelSwatches, UploadTile } from '../parts-a/common'
import { RESOURCES } from '../parts-a/data'
import { SettingsPage } from '../ui'

type Svc = {
  id: string
  names: { tg: string; ru: string; en: string }
  description: string
  category: ServiceCategory
  group: boolean
  maxPeople: number
  duration: number
  color: LabelColor
  price: number
  priceFrom: boolean
  cost: number
  online: boolean
  bufferBefore: number
  bufferAfter: number
  maxPerDay: string
  staff: Record<string, { on: boolean; price: string }>
  resourceId: string
}

const CATEGORY_COLOR: Record<ServiceCategory, LabelColor> = {
  Hair: 'indigo',
  Nails: 'rose',
  'Brows & lashes': 'amber',
  Cosmetology: 'teal',
  Barber: 'sky',
  Massage: 'violet',
}

const COST: Record<string, number> = { v3: 95, v4: 140, v6: 22, v7: 18, v9: 30, v10: 60, v11: 45, v12: 70, v13: 420 }

function fromBase(): Svc[] {
  return baseServices.map((s) => ({
    id: s.id,
    names: { en: s.name, ru: '', tg: '' },
    description: '',
    category: s.category,
    group: false,
    maxPeople: 4,
    duration: s.duration,
    color: s.color,
    price: s.price,
    priceFrom: s.id === 'v4' || s.id === 'v3',
    cost: COST[s.id] ?? 0,
    online: s.onlineBooking,
    bufferBefore: 0,
    bufferAfter: s.category === 'Cosmetology' ? 15 : 0,
    maxPerDay: '',
    staff: Object.fromEntries(bookableStaff.map((m) => [m.id, { on: s.staffIds.includes(m.id), price: '' }])),
    resourceId: RESOURCES.find((r) => r.serviceIds.includes(s.id))?.id ?? '',
  }))
}

const PACKS: { id: string; title: string; items: [string, ServiceCategory, number, number][] }[] = [
  { id: 'kids', title: 'Kids', items: [['Kids’ haircut', 'Hair', 30, 40], ['Kids’ manicure', 'Nails', 30, 50], ['Festive hairstyle for girls', 'Hair', 45, 90]] },
  { id: 'bridal', title: 'Bridal', items: [['Bridal hairstyle', 'Hair', 120, 450], ['Trial hairstyle', 'Hair', 90, 250], ['Bridal brows & lashes', 'Brows & lashes', 60, 220]] },
  { id: 'men', title: 'Men’s grooming', items: [['Head shave', 'Barber', 30, 50], ['Father & son haircut', 'Barber', 75, 110], ['Men’s face mask', 'Barber', 30, 90]] },
  { id: 'spa', title: 'Spa', items: [['Hot stone massage', 'Massage', 90, 380], ['Foot massage', 'Massage', 30, 120], ['Body scrub', 'Massage', 45, 220]] },
]

const DURATIONS = Array.from({ length: 16 }, (_, i) => (i + 1) * 15).map((m) => ({ value: String(m), label: formatDuration(m) }))
const BUFFERS = [0, 5, 10, 15, 30].map((m) => ({ value: String(m), label: m ? `${m} min` : 'None' }))

function blank(): Svc {
  return {
    id: '',
    names: { en: '', ru: '', tg: '' },
    description: '',
    category: 'Hair',
    group: false,
    maxPeople: 4,
    duration: 60,
    color: 'indigo',
    price: 0,
    priceFrom: false,
    cost: 0,
    online: true,
    bufferBefore: 0,
    bufferAfter: 0,
    maxPerDay: '',
    staff: Object.fromEntries(bookableStaff.map((m) => [m.id, { on: false, price: '' }])),
    resourceId: '',
  }
}

const LANGS = [
  { value: 'tg', label: 'TJ' },
  { value: 'ru', label: 'RU' },
  { value: 'en', label: 'EN' },
] as const

export default function ServicesSettings() {
  const [list, setList] = useState<Svc[]>(fromBase)
  const [category, setCategory] = useState<ServiceCategory | 'all'>('all')
  const [q, setQ] = useState('')
  const [added, setAdded] = useState<string[]>([])
  const [editing, setEditing] = useState<Svc | null>(null)
  const [isNew, setIsNew] = useState(false)
  const [tab, setTab] = useState<'basic' | 'price' | 'booking' | 'masters' | 'rooms'>('basic')
  const [lang, setLang] = useState<'tg' | 'ru' | 'en'>('en')
  const [touched, setTouched] = useState(false)

  const shown = useMemo(
    () =>
      list.filter(
        (s) => (category === 'all' || s.category === category) && `${s.names.en} ${s.names.ru} ${s.names.tg}`.toLowerCase().includes(q.trim().toLowerCase()),
      ),
    [list, category, q],
  )

  function open(s: Svc | null) {
    setIsNew(!s)
    setEditing(s ? structuredClone(s) : blank())
    setTab('basic')
    setLang('en')
    setTouched(false)
  }

  const patch = (p: Partial<Svc>) => setEditing((e) => (e ? { ...e, ...p } : e))

  function save() {
    if (!editing) return
    setTouched(true)
    if (!editing.names.en.trim() || editing.price <= 0) {
      setTab('basic')
      if (editing.names.en.trim()) setTab('price')
      return
    }
    if (isNew) {
      setList((l) => [...l, { ...editing, id: `v${Date.now()}` }])
      toast.success(`${editing.names.en} added`)
    } else {
      setList((l) => l.map((s) => (s.id === editing.id ? editing : s)))
      toast.success('Service saved')
    }
    setEditing(null)
  }

  function addPack(id: string) {
    const pack = PACKS.find((p) => p.id === id)!
    const rows = pack.items.map(([name, cat, duration, price], i) => ({
      ...blank(),
      id: `${id}${i}`,
      names: { en: name, ru: '', tg: '' },
      category: cat,
      duration,
      price,
      color: CATEGORY_COLOR[cat],
    }))
    setList((l) => [...l, ...rows])
    setAdded((a) => [...a, id])
    toast.success(`${rows.length} services added with typical prices`, { description: 'Assign masters so clients can book them.' })
  }

  const masters = (s: Svc) => Object.entries(s.staff).filter(([, v]) => v.on).map(([id]) => staffById[id])
  const margin = editing && editing.price > 0 ? Math.round(((editing.price - editing.cost) / editing.price) * 100) : null

  return (
    <SettingsPage
      wide
      title="Services & prices"
      description="What clients can book, how long it takes and what it costs."
      actions={
        <Button variant="primary" icon={I.add} onClick={() => open(null)}>
          Add service
        </Button>
      }
    >
      <Card className="mb-6 p-5">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="text-base font-medium text-fg">Start from typical Dushanbe prices</h2>
          <span className="text-sm text-muted">Edit any price after adding</span>
        </div>
        <div className="mt-4 grid gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
          {PACKS.map((p) => {
            const done = added.includes(p.id)
            return (
              <div key={p.id} className="flex flex-col gap-3 rounded-xl bg-fill p-3.5">
                <div>
                  <div className="text-base text-fg">{p.title}</div>
                  <div className="mt-0.5 line-clamp-2 text-sm text-muted">{p.items.map((i) => i[0]).join(', ')}</div>
                </div>
                <Button size="sm" variant={done ? 'ghost' : 'outline'} icon={done ? I.check : I.add} disabled={done} onClick={() => addPack(p.id)} className="self-start">
                  {done ? 'Added' : `Add ${p.items.length}`}
                </Button>
              </div>
            )
          })}
        </div>
      </Card>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <SearchInput value={q} onChange={setQ} placeholder="Search services" className="w-full sm:w-64" />
        <div className="flex gap-1.5 overflow-x-auto [scrollbar-width:none]">
          <Chip active={category === 'all'} onClick={() => setCategory('all')} count={list.length}>
            All
          </Chip>
          {SERVICE_CATEGORIES.map((c) => (
            <Chip key={c} active={category === c} onClick={() => setCategory(c)} count={list.filter((s) => s.category === c).length}>
              {c}
            </Chip>
          ))}
        </div>
      </div>

      <Card>
        <Table>
          <THead>
            <TH>Service</TH>
            <TH>Category</TH>
            <TH>Duration</TH>
            <TH align="right">Price</TH>
            <TH>Masters</TH>
            <TH>Online</TH>
          </THead>
          <tbody>
            {shown.map((s) => {
              const m = masters(s)
              return (
                <TR key={s.id} onClick={() => open(s)}>
                  <TD>{s.names.en}</TD>
                  <TD>
                    <LabelChip color={CATEGORY_COLOR[s.category]}>{s.category}</LabelChip>
                  </TD>
                  <TD muted className="whitespace-nowrap">
                    {formatDuration(s.duration)}
                  </TD>
                  <TD align="right">
                    {s.priceFrom && <span className="text-sm text-faint">from </span>}
                    <Money value={s.price} />
                  </TD>
                  <TD>
                    {m.length ? (
                      <AvatarStack names={m.map((x) => ({ name: x.name, color: x.color }))} />
                    ) : (
                      <span className="inline-flex items-center gap-1.5 text-sm text-warning">
                        <Icon icon={I.alert} size={14} />
                        No masters yet
                      </span>
                    )}
                  </TD>
                  <TD>
                    <span onClick={(e) => e.stopPropagation()}>
                      <Switch
                        checked={s.online}
                        onChange={(online) => {
                          setList((l) => l.map((x) => (x.id === s.id ? { ...x, online } : x)))
                          toast(online ? `${s.names.en} is bookable online` : `${s.names.en} hidden from online booking`)
                        }}
                      />
                    </span>
                  </TD>
                </TR>
              )
            })}
          </tbody>
        </Table>
        {!shown.length && <p className="px-5 py-10 text-center text-base text-muted">No services match “{q}”.</p>}
      </Card>

      <Modal
        open={!!editing}
        onOpenChange={(o) => !o && setEditing(null)}
        title={isNew ? 'New service' : editing?.names.en || 'Service'}
        size="lg"
        footer={
          <>
            {!isNew && editing && (
              <Button
                variant="ghost"
                className="mr-auto text-negative"
                onClick={() => {
                  const s = editing
                  setList((l) => l.filter((x) => x.id !== s.id))
                  setEditing(null)
                  toast(`${s.names.en} deleted`, { description: 'Past visits keep it.', action: { label: 'Undo', onClick: () => setList((l) => [...l, s]) } })
                }}
              >
                Delete
              </Button>
            )}
            <Button variant="ghost" onClick={() => setEditing(null)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={save}>
              {isNew ? 'Add service' : 'Save'}
            </Button>
          </>
        }
      >
        {editing && (
          // Fixed minimum height so switching tabs doesn't make the dialog jump.
          <div className="flex min-h-[460px] flex-col gap-5">
            <Tabs
              value={tab}
              onChange={setTab}
              items={[
                { value: 'basic', label: 'Basics' },
                { value: 'price', label: 'Price' },
                { value: 'booking', label: 'Booking' },
                { value: 'masters', label: 'Masters', count: masters(editing).length },
                { value: 'rooms', label: 'Room' },
              ]}
            />

            {tab === 'basic' && (
              <div className="flex flex-col gap-4">
                <Field
                  label="Name"
                  error={touched && !editing.names.en.trim() ? 'English name is required' : undefined}
                  hint={lang !== 'en' && !editing.names[lang] ? 'Empty translations fall back to English.' : undefined}
                >
                  <div className="flex gap-2">
                    <Input
                      autoFocus
                      className="flex-1"
                      value={editing.names[lang]}
                      onChange={(e) => patch({ names: { ...editing.names, [lang]: e.target.value } })}
                      placeholder={lang === 'en' ? 'e.g. Women’s haircut' : editing.names.en}
                    />
                    <Segmented size="sm" value={lang} onChange={setLang} items={LANGS.map((l) => ({ value: l.value, label: l.label }))} />
                  </div>
                </Field>
                <Field label="Description" optional hint="Shown on the booking page.">
                  <Textarea value={editing.description} onChange={(e) => patch({ description: e.target.value })} placeholder="What’s included, how to prepare" />
                </Field>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Category">
                    <Select
                      value={editing.category}
                      onChange={(category) => patch({ category, color: CATEGORY_COLOR[category] })}
                      options={SERVICE_CATEGORIES.map((c) => ({ value: c, label: c }))}
                    />
                  </Field>
                  <Field label="Duration">
                    <Select value={String(editing.duration)} onChange={(d) => patch({ duration: Number(d) })} options={DURATIONS} />
                  </Field>
                </div>
                <Field label="Format">
                  <div className="flex flex-wrap items-center gap-3">
                    <Segmented
                      value={editing.group ? 'group' : 'one'}
                      onChange={(v) => patch({ group: v === 'group' })}
                      items={[
                        { value: 'one', label: 'One client' },
                        { value: 'group', label: 'Group' },
                      ]}
                    />
                    {editing.group && (
                      <span className="flex items-center gap-2 text-sm text-muted">
                        Up to
                        <Input className="w-16" inputMode="numeric" value={String(editing.maxPeople)} onChange={(e) => patch({ maxPeople: Number(e.target.value.replace(/\D/g, '')) || 0 })} />
                        people
                      </span>
                    )}
                  </div>
                </Field>
                <Field label="Calendar color">
                  <LabelSwatches value={editing.color} onChange={(color) => patch({ color })} />
                </Field>
                <UploadTile title="Add a photo" hint="Shown next to the service on your booking page" />
              </div>
            )}

            {tab === 'price' && (
              <div className="flex flex-col gap-4">
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Price" error={touched && editing.price <= 0 ? 'Set a price' : undefined}>
                    <Input
                      inputMode="numeric"
                      suffix="TJS"
                      value={editing.price ? String(editing.price) : ''}
                      onChange={(e) => patch({ price: Number(e.target.value.replace(/\D/g, '')) || 0 })}
                    />
                  </Field>
                  <Field label="Cost of materials" optional hint={margin != null ? `Margin ${margin}%` : 'Used for profit in reports'}>
                    <Input inputMode="numeric" suffix="TJS" value={editing.cost ? String(editing.cost) : ''} onChange={(e) => patch({ cost: Number(e.target.value.replace(/\D/g, '')) || 0 })} />
                  </Field>
                </div>
                <Switch
                  checked={editing.priceFrom}
                  onChange={(priceFrom) => patch({ priceFrom })}
                  label="Show as a starting price"
                  description="Clients see “from 450 TJS”. Use it when the final price depends on hair length or materials."
                />
                <p className="text-sm text-muted">Masters can have their own price for this service on the Masters tab.</p>
              </div>
            )}

            {tab === 'booking' && (
              <div className="flex flex-col gap-4">
                <Switch checked={editing.online} onChange={(online) => patch({ online })} label="Clients can book it online" description="On your booking page, in the Telegram bot and the NavCRM catalog." />
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Buffer before" hint="Preparation time, not shown to clients">
                    <Select value={String(editing.bufferBefore)} onChange={(v) => patch({ bufferBefore: Number(v) })} options={BUFFERS} />
                  </Field>
                  <Field label="Buffer after" hint="Cleanup or disinfection">
                    <Select value={String(editing.bufferAfter)} onChange={(v) => patch({ bufferAfter: Number(v) })} options={BUFFERS} />
                  </Field>
                </div>
                <Field label="Most per day" optional hint="Leave empty for no limit.">
                  <Input className="w-32" inputMode="numeric" value={editing.maxPerDay} onChange={(e) => patch({ maxPerDay: e.target.value.replace(/\D/g, '') })} placeholder="No limit" />
                </Field>
              </div>
            )}

            {tab === 'masters' && (
              <div>
                <p className="mb-3 text-sm text-muted">Who does this service. Leave a price empty to use the standard one.</p>
                <ul className="flex flex-col">
                  {bookableStaff.map((m) => {
                    const v = editing.staff[m.id]
                    return (
                      <li key={m.id} className="flex items-center gap-3 border-b border-border py-2.5 last:border-b-0">
                        <span className="flex-1">
                          <Checkbox
                            checked={v.on}
                            onChange={(on) => patch({ staff: { ...editing.staff, [m.id]: { ...v, on } } })}
                            label={
                              <span>
                                {m.name} <span className="text-muted">· {m.position}</span>
                              </span>
                            }
                          />
                        </span>
                        <Input
                          className={cn('w-32', !v.on && 'invisible')}
                          inputMode="numeric"
                          suffix="TJS"
                          value={v.price}
                          placeholder={String(editing.price || '')}
                          onChange={(e) => patch({ staff: { ...editing.staff, [m.id]: { ...v, price: e.target.value.replace(/\D/g, '') } } })}
                        />
                      </li>
                    )
                  })}
                </ul>
              </div>
            )}

            {tab === 'rooms' && (
              <div className="flex flex-col gap-4">
                <Field label="Needs a place or device" hint="NavCRM won’t book two visits into the same place at once.">
                  <Select
                    value={editing.resourceId || 'none'}
                    onChange={(v) => patch({ resourceId: v === 'none' ? '' : v })}
                    options={[{ value: 'none', label: 'Nothing specific' }, ...RESOURCES.map((r) => ({ value: r.id, label: r.name, hint: r.type }))]}
                  />
                </Field>
              </div>
            )}
          </div>
        )}
      </Modal>
    </SettingsPage>
  )
}
