import { useEffect, useMemo, useState } from 'react'
import { ClientPicker } from '@/components/client-picker'
import { I, Icon } from '@/components/icons'
import { Avatar } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { DatePicker } from '@/components/ui/date-picker'
import { Modal } from '@/components/ui/dialog'
import { Field, Input, SearchInput } from '@/components/ui/input'
import { Money } from '@/components/ui/misc'
import { Select } from '@/components/ui/select'
import { Segmented } from '@/components/ui/tabs'
import { SERVICE_CATEGORIES, serviceById, services } from '@/data/services'
import { bookableStaff, staffById } from '@/data/staff'
import { cn } from '@/lib/cn'
import { formatDuration } from '@/lib/format'
import { TODAY, addDays } from '@/lib/time'
import { makeCertificateCode, products, type ReceiptLine } from './data'
import { useRegister } from './store'

export type ItemKind = 'service' | 'product' | 'membership' | 'certificate' | 'tip' | 'other' | 'scan'

let seq = 0
export const lineId = () => `l${Date.now()}_${seq++}`

/** Certificate details waiting for the sale to complete, keyed by code. */
export const pendingCertificates = new Map<
  string,
  { kind: 'amount' | 'service'; serviceId?: string; validUntil: Date; recipient?: string }
>()

type Props = {
  open: boolean
  onClose: () => void
  onAdd: (line: ReceiptLine) => void
}

const rowClass = (selected: boolean) =>
  cn(
    'press flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left',
    selected ? 'bg-accent-soft ring-1 ring-inset ring-accent' : 'hover:bg-fill',
  )

function ServiceModal({ open, onClose, onAdd, defaultStaffId }: Props & { defaultStaffId?: string }) {
  const [q, setQ] = useState('')
  const [sel, setSel] = useState<string | null>(null)
  const [staffId, setStaffId] = useState('')

  useEffect(() => {
    if (open) {
      setQ('')
      setSel(null)
    }
  }, [open])

  const list = services.filter((s) => s.name.toLowerCase().includes(q.trim().toLowerCase()))
  const capable = sel ? bookableStaff.filter((s) => serviceById[sel].staffIds.includes(s.id)) : []

  function choose(id: string) {
    setSel(id)
    const staffIds = serviceById[id].staffIds
    setStaffId(defaultStaffId && staffIds.includes(defaultStaffId) ? defaultStaffId : staffIds[0])
  }

  function add(id = sel) {
    if (!id) return
    const s = serviceById[id]
    const master = staffId && s.staffIds.includes(staffId) ? staffId : s.staffIds[0]
    onAdd({ id: lineId(), kind: 'service', name: s.name, price: s.price, qty: 1, staffId: master, ref: s.id })
    onClose()
  }

  return (
    <Modal
      open={open}
      onOpenChange={(o) => !o && onClose()}
      title="Add a service"
      size="lg"
      footer={
        <>
          {sel && (
            <div className="mr-auto w-56">
              <Select
                value={staffId}
                onChange={setStaffId}
                options={capable.map((s) => ({ value: s.id, label: s.name, icon: <Avatar name={s.name} color={s.color} size="sm" /> }))}
              />
            </div>
          )}
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" disabled={!sel} onClick={() => add()}>
            Add to receipt
          </Button>
        </>
      }
    >
      <SearchInput value={q} onChange={setQ} placeholder="Search services" autoFocus className="mb-3" />
      <div className="-mx-2 max-h-[52vh] overflow-y-auto">
        {SERVICE_CATEGORIES.map((cat) => {
          const items = list.filter((s) => s.category === cat)
          if (!items.length) return null
          return (
            <div key={cat} className="mb-2">
              <div className="px-3 pt-2 pb-1 text-xs font-medium text-faint">{cat}</div>
              {items.map((s) => (
                <button key={s.id} type="button" onClick={() => choose(s.id)} onDoubleClick={() => add(s.id)} className={rowClass(sel === s.id)}>
                  <span className="size-2 shrink-0 rounded-full" style={{ background: `var(--c-${s.color})` }} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-base text-fg">{s.name}</span>
                    <span className="block text-sm text-muted">
                      {formatDuration(s.duration)} · {s.staffIds.map((id) => staffById[id].name.split(' ')[0]).join(', ')}
                    </span>
                  </span>
                  <Money value={s.price} className="text-base" />
                </button>
              ))}
            </div>
          )
        })}
        {!list.length && <p className="px-3 py-6 text-center text-muted">No services match “{q}”.</p>}
      </div>
    </Modal>
  )
}

function ProductModal({ open, onClose, onAdd }: Props) {
  const [q, setQ] = useState('')
  useEffect(() => {
    if (open) setQ('')
  }, [open])
  const query = q.trim().toLowerCase()
  const list = products.filter((p) => `${p.name} ${p.brand} ${p.barcode}`.toLowerCase().includes(query))

  return (
    <Modal open={open} onOpenChange={(o) => !o && onClose()} title="Add a product" description="Only products marked “Sold at the register” appear here." size="lg">
      <SearchInput value={q} onChange={setQ} placeholder="Name, brand or barcode" autoFocus className="mb-3" />
      <div className="-mx-2 max-h-[52vh] overflow-y-auto">
        {list.map((p) => {
          const out = p.stock === 0
          return (
            <button
              key={p.id}
              type="button"
              disabled={out}
              onClick={() => {
                onAdd({ id: lineId(), kind: 'product', name: p.name, price: p.price, qty: 1, ref: p.id })
                onClose()
              }}
              className={cn(rowClass(false), out && 'cursor-default opacity-50 hover:bg-transparent')}
            >
              <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-fill text-muted">
                <Icon icon={I.bag} size={18} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-base text-fg">{p.name}</span>
                <span className="block truncate text-sm text-muted">{p.brand}</span>
              </span>
              <span className={cn('w-24 text-right text-sm', out ? 'text-negative' : p.stock <= 3 ? 'text-warning' : 'text-faint')}>
                {out ? 'Out of stock' : `${p.stock} in stock`}
              </span>
              <Money value={p.price} className="w-24 text-right text-base" />
            </button>
          )
        })}
        {!list.length && <p className="px-3 py-6 text-center text-muted">No products match “{q}”.</p>}
      </div>
    </Modal>
  )
}

function MembershipModal({
  open,
  onClose,
  onAdd,
  clientId,
  onClient,
}: Props & { clientId: string | null; onClient: (id: string | null) => void }) {
  const membershipTypes = useRegister((s) => s.membershipTypes)
  const [sel, setSel] = useState<string | null>(null)
  useEffect(() => {
    if (open) setSel(null)
  }, [open])
  const type = membershipTypes.find((m) => m.id === sel)

  return (
    <Modal
      open={open}
      onOpenChange={(o) => !o && onClose()}
      title="Sell a membership"
      size="lg"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            disabled={!type || !clientId}
            onClick={() => {
              if (!type) return
              onAdd({ id: lineId(), kind: 'membership', name: `Membership: ${type.name}`, price: type.price, qty: 1, ref: type.id })
              onClose()
            }}
          >
            Add to receipt
          </Button>
        </>
      }
    >
      <Field label="Client" hint="A membership belongs to one client and is used by their phone number." className="mb-5">
        <ClientPicker value={clientId} onChange={onClient} />
      </Field>
      <div className="grid gap-2 sm:grid-cols-2">
        {membershipTypes.map((m) => (
          <button key={m.id} type="button" onClick={() => setSel(m.id)} className={cn(rowClass(sel === m.id), 'items-start ring-1 ring-inset', sel !== m.id && 'ring-border')}>
            <span className="min-w-0 flex-1">
              <span className="block text-base font-medium text-fg">{m.name}</span>
              <span className="mt-0.5 block text-sm text-muted">{m.includes}</span>
              <span className="mt-2 block text-sm text-faint">
                {m.visits} visits · valid {m.validDays} days
              </span>
            </span>
            <span className="text-right">
              <Money value={m.price} className="block text-base text-fg" />
              <span className="mt-0.5 block text-xs text-positive">
                saves <Money value={m.fullPrice - m.price} currency={false} />
              </span>
            </span>
          </button>
        ))}
      </div>
    </Modal>
  )
}

function CertificateModal({ open, onClose, onAdd }: Props) {
  const [kind, setKind] = useState<'amount' | 'service'>('amount')
  const [amount, setAmount] = useState(500)
  const [custom, setCustom] = useState('')
  const [serviceId, setServiceId] = useState('v3')
  const [validUntil, setValidUntil] = useState(addDays(TODAY, 180))
  const [recipient, setRecipient] = useState('')
  const code = useMemo(() => makeCertificateCode(), [open]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (open) {
      setKind('amount')
      setAmount(500)
      setCustom('')
      setRecipient('')
      setValidUntil(addDays(TODAY, 180))
    }
  }, [open])

  const nominal = kind === 'amount' ? (custom ? Number(custom) || 0 : amount) : serviceById[serviceId].price

  return (
    <Modal
      open={open}
      onOpenChange={(o) => !o && onClose()}
      title="Gift certificate"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            disabled={nominal <= 0}
            onClick={() => {
              pendingCertificates.set(code, { kind, serviceId: kind === 'service' ? serviceId : undefined, validUntil, recipient: recipient || undefined })
              onAdd({
                id: lineId(),
                kind: 'certificate',
                name: kind === 'amount' ? `Gift certificate ${nominal} TJS` : `Gift certificate: ${serviceById[serviceId].name}`,
                price: nominal,
                qty: 1,
                ref: code,
              })
              onClose()
            }}
          >
            Add to receipt
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <Segmented
          fill
          value={kind}
          onChange={setKind}
          items={[
            { value: 'amount', label: 'For an amount' },
            { value: 'service', label: 'For a service' },
          ]}
        />
        {kind === 'amount' ? (
          <Field label="Amount">
            <div className="flex flex-wrap gap-1.5">
              {[300, 500, 1000, 2000].map((a) => (
                <button
                  key={a}
                  type="button"
                  onClick={() => {
                    setAmount(a)
                    setCustom('')
                  }}
                  className={cn(
                    'press h-9 rounded-full px-4 text-sm font-medium tabular ring-1 ring-inset',
                    !custom && amount === a ? 'bg-fg text-bg ring-fg' : 'bg-surface text-fg ring-border hover:bg-fill',
                  )}
                >
                  {a}
                </button>
              ))}
              <Input value={custom} onChange={(e) => setCustom(e.target.value.replace(/\D/g, ''))} placeholder="Other" inputMode="numeric" suffix="TJS" className="w-32" />
            </div>
          </Field>
        ) : (
          <Field label="Service">
            <Select value={serviceId} onChange={setServiceId} options={services.map((s) => ({ value: s.id, label: s.name, hint: `${s.price} TJS` }))} />
          </Field>
        )}
        <div className="grid grid-cols-2 gap-3">
          <Field label="Valid until">
            <DatePicker value={validUntil} onChange={setValidUntil} />
          </Field>
          <Field label="For whom" optional>
            <Input value={recipient} onChange={(e) => setRecipient(e.target.value)} placeholder="e.g. Mother" />
          </Field>
        </div>
        <div className="flex items-center gap-3 rounded-xl bg-fill px-4 py-3">
          <Icon icon={I.gift} size={20} className="text-muted" />
          <div className="min-w-0 flex-1">
            <div className="text-base text-fg tabular">{code}</div>
            <div className="text-sm text-muted">Unique code, printed on the receipt. The client pays with it by code.</div>
          </div>
        </div>
      </div>
    </Modal>
  )
}

function TipModal({ open, onClose, onAdd, defaultStaffId }: Props & { defaultStaffId?: string }) {
  const [amount, setAmount] = useState(50)
  const [custom, setCustom] = useState('')
  const [staffId, setStaffId] = useState(defaultStaffId ?? bookableStaff[0].id)
  useEffect(() => {
    if (open) {
      setAmount(50)
      setCustom('')
      setStaffId(defaultStaffId ?? bookableStaff[0].id)
    }
  }, [open, defaultStaffId])
  const value = custom ? Number(custom) || 0 : amount

  return (
    <Modal
      open={open}
      onOpenChange={(o) => !o && onClose()}
      title="Add a tip"
      description="Tips go to the master in full and show in their earnings."
      size="sm"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            disabled={value <= 0}
            onClick={() => {
              onAdd({ id: lineId(), kind: 'tip', name: `Tip for ${staffById[staffId].name.split(' ')[0]}`, price: value, qty: 1, staffId })
              onClose()
            }}
          >
            Add tip
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <Field label="Amount">
          <div className="flex flex-wrap gap-1.5">
            {[20, 50, 100].map((a) => (
              <button
                key={a}
                type="button"
                onClick={() => {
                  setAmount(a)
                  setCustom('')
                }}
                className={cn(
                  'press h-9 rounded-full px-4 text-sm font-medium tabular ring-1 ring-inset',
                  !custom && amount === a ? 'bg-fg text-bg ring-fg' : 'bg-surface text-fg ring-border hover:bg-fill',
                )}
              >
                {a}
              </button>
            ))}
            <Input value={custom} onChange={(e) => setCustom(e.target.value.replace(/\D/g, ''))} placeholder="Other" inputMode="numeric" className="w-24" />
          </div>
        </Field>
        <Field label="For">
          <Select
            value={staffId}
            onChange={setStaffId}
            options={bookableStaff.map((s) => ({ value: s.id, label: s.name, hint: s.position, icon: <Avatar name={s.name} color={s.color} size="sm" /> }))}
          />
        </Field>
      </div>
    </Modal>
  )
}

const OTHER_PLACEHOLDER = { other: 'e.g. Hair clip', rental: 'e.g. Evening dress, 1 day', deposit: 'e.g. Deposit for a dress' }

function OtherModal({ open, onClose, onAdd }: Props) {
  const [kind, setKind] = useState<'other' | 'rental' | 'deposit'>('other')
  const [name, setName] = useState('')
  const [price, setPrice] = useState('')
  const [qty, setQty] = useState('1')
  useEffect(() => {
    if (open) {
      setKind('other')
      setName('')
      setPrice('')
      setQty('1')
    }
  }, [open])
  const valid = name.trim() && Number(price) > 0 && Number(qty) > 0

  return (
    <Modal
      open={open}
      onOpenChange={(o) => !o && onClose()}
      title="Add another item"
      size="sm"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            disabled={!valid}
            onClick={() => {
              onAdd({ id: lineId(), kind, name: name.trim(), price: Number(price), qty: Number(qty) })
              onClose()
            }}
          >
            Add to receipt
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <Segmented
          fill
          value={kind}
          onChange={setKind}
          items={[
            { value: 'other', label: 'Other' },
            { value: 'rental', label: 'Rental' },
            { value: 'deposit', label: 'Deposit' },
          ]}
        />
        <Field label="Name">
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder={OTHER_PLACEHOLDER[kind]} autoFocus />
        </Field>
        <div className="grid grid-cols-[1fr_96px] gap-3">
          <Field label="Price">
            <Input value={price} onChange={(e) => setPrice(e.target.value.replace(/\D/g, ''))} inputMode="numeric" suffix="TJS" />
          </Field>
          <Field label="Qty">
            <Input value={qty} onChange={(e) => setQty(e.target.value.replace(/\D/g, ''))} inputMode="numeric" />
          </Field>
        </div>
        {kind === 'deposit' && <p className="text-sm text-muted">A deposit is returned to the client later and isn’t counted as revenue.</p>}
      </div>
    </Modal>
  )
}

function ScanModal({ open, onClose, onAdd }: Props) {
  const [code, setCode] = useState('')
  const [error, setError] = useState(false)
  useEffect(() => {
    if (open) {
      setCode('')
      setError(false)
    }
  }, [open])

  function submit() {
    const p = products.find((x) => x.barcode === code.trim())
    if (!p) return setError(true)
    onAdd({ id: lineId(), kind: 'product', name: p.name, price: p.price, qty: 1, ref: p.id })
    onClose()
  }

  return (
    <Modal open={open} onOpenChange={(o) => !o && onClose()} title="Scan a barcode" size="sm">
      <div className="relative mb-4 grid aspect-[4/3] place-items-center overflow-hidden rounded-2xl bg-fg">
        <div className="absolute inset-x-10 top-1/2 h-px bg-negative/80" />
        {(['top-6 left-6 border-t-2 border-l-2', 'top-6 right-6 border-t-2 border-r-2', 'bottom-6 left-6 border-b-2 border-l-2', 'bottom-6 right-6 border-b-2 border-r-2'] as const).map((c) => (
          <span key={c} className={cn('absolute size-7 rounded-[6px] border-bg/70', c)} />
        ))}
        <span className="text-sm text-bg/70">Point the camera at the barcode</span>
      </div>
      <form
        onSubmit={(e) => {
          e.preventDefault()
          submit()
        }}
      >
        <Field label="Or type the barcode" error={error ? 'No product with this barcode' : undefined} hint="Try 3474636382606">
          <Input
            value={code}
            onChange={(e) => {
              setCode(e.target.value.replace(/\D/g, ''))
              setError(false)
            }}
            inputMode="numeric"
            className="tabular"
            aria-invalid={error}
            autoFocus
          />
        </Field>
      </form>
    </Modal>
  )
}

export function ItemModals({
  open,
  onClose,
  onAdd,
  clientId,
  onClient,
  defaultStaffId,
}: {
  open: ItemKind | null
  onClose: () => void
  onAdd: (line: ReceiptLine) => void
  clientId: string | null
  onClient: (id: string | null) => void
  defaultStaffId?: string
}) {
  return (
    <>
      <ServiceModal open={open === 'service'} onClose={onClose} onAdd={onAdd} defaultStaffId={defaultStaffId} />
      <ProductModal open={open === 'product'} onClose={onClose} onAdd={onAdd} />
      <MembershipModal open={open === 'membership'} onClose={onClose} onAdd={onAdd} clientId={clientId} onClient={onClient} />
      <CertificateModal open={open === 'certificate'} onClose={onClose} onAdd={onAdd} />
      <TipModal open={open === 'tip'} onClose={onClose} onAdd={onAdd} defaultStaffId={defaultStaffId} />
      <OtherModal open={open === 'other'} onClose={onClose} onAdd={onAdd} />
      <ScanModal open={open === 'scan'} onClose={onClose} onAdd={onAdd} />
    </>
  )
}
