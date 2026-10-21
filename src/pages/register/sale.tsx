import type { IconSvgElement } from '@hugeicons/react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useLocation, useNavigate, useSearchParams } from 'react-router'
import { toast } from 'sonner'
import { ClientPicker } from '@/components/client-picker'
import { I, Icon } from '@/components/icons'
import { Avatar } from '@/components/ui/avatar'
import { Button, IconButton } from '@/components/ui/button'
import { Card, CardHeader } from '@/components/ui/card'
import { Switch } from '@/components/ui/controls'
import { Input } from '@/components/ui/input'
import { Menu, MenuItem } from '@/components/ui/menu'
import { Figure, Money } from '@/components/ui/misc'
import { Popover } from '@/components/ui/popover'
import { Select } from '@/components/ui/select'
import { Segmented } from '@/components/ui/tabs'
import { isVisit } from '@/data/appointments'
import { PAYMENT_METHODS, type PaymentMethodId } from '@/data/business'
import { serviceById } from '@/data/services'
import { bookableStaff, staffById } from '@/data/staff'
import { cn } from '@/lib/cn'
import { CURRENCY, formatDate, formatDuration, formatMoney, formatNumber } from '@/lib/format'
import { useOverlays } from '@/lib/overlays'
import { useData, usePrefs } from '@/lib/store'
import { NOW, addDays } from '@/lib/time'
import { PROMO_CODES, productById, type LineKind, type Receipt, type ReceiptLine } from './data'
import { ItemModals, lineId, pendingCertificates, type ItemKind } from './item-modals'
import { membershipType, nextReceiptNo, useMembershipType, useRegister, type Discount } from './store'

const METHOD_ICON: Partial<Record<PaymentMethodId, IconSvgElement>> = { cash: I.cash, card: I.card, alif: I.qr, dc: I.qr, transfer: I.building }
const PRIMARY_METHODS: PaymentMethodId[] = ['cash', 'card', 'alif', 'dc']
const methodName = (id: PaymentMethodId) => PAYMENT_METHODS.find((m) => m.id === id)!.name

const TILES: { kind: ItemKind; label: string; icon: IconSvgElement }[] = [
  { kind: 'service', label: 'Service', icon: I.scissors },
  { kind: 'product', label: 'Product', icon: I.bag },
  { kind: 'membership', label: 'Membership', icon: I.award },
  { kind: 'certificate', label: 'Certificate', icon: I.gift },
  { kind: 'tip', label: 'Tip', icon: I.coins },
  { kind: 'other', label: 'Other', icon: I.note },
]

const LINE_ICON: Record<LineKind, IconSvgElement> = {
  service: I.scissors,
  product: I.bag,
  membership: I.award,
  certificate: I.gift,
  tip: I.coins,
  other: I.note,
  rental: I.note,
  deposit: I.wallet,
  debt: I.wallet,
}

const DISCOUNTABLE: LineKind[] = ['service', 'product', 'other', 'rental']

/** Totals for the current cart, shared by the total card and the charge action. */
function useTotals() {
  const cart = useRegister((s) => s.cart)
  const client = useData((s) => s.clients.find((c) => c.id === cart.clientId))
  return useMemo(() => {
    const subtotal = cart.lines.reduce((m, l) => m + l.price * l.qty, 0)
    const discountable = cart.lines.filter((l) => DISCOUNTABLE.includes(l.kind)).reduce((m, l) => m + l.price * l.qty, 0)
    const d = cart.discount
    const discount = d ? (d.kind === 'percent' ? Math.round((discountable * d.value) / 100) : Math.min(d.value, discountable)) : 0
    const maxBonuses = client ? Math.min(client.bonuses, Math.floor((discountable - discount) * 0.3)) : 0
    const bonusesUsed = cart.useBonuses ? maxBonuses : 0
    const total = Math.max(0, subtotal - discount - bonusesUsed)
    const splitAmount = cart.split ? Math.min(cart.split.amount, total) : 0
    const primaryAmount = total - splitAmount
    const cashPortion = (cart.method === 'cash' ? primaryAmount : 0) + (cart.split?.method === 'cash' ? splitAmount : 0)
    const received = Number(cart.received) || 0
    return { subtotal, discountable, discount, maxBonuses, bonusesUsed, total, splitAmount, primaryAmount, cashPortion, received, change: received - cashPortion }
  }, [cart, client])
}

function ClientCard() {
  const cart = useRegister((s) => s.cart)
  const setCart = useRegister((s) => s.setCart)
  const addLine = useRegister((s) => s.addLine)
  const memberships = useRegister((s) => s.memberships)
  const receipts = useRegister((s) => s.receipts)
  const client = useData((s) => s.clients.find((c) => c.id === cart.clientId))
  const locked = !!cart.paid
  const membership = client ? memberships.find((m) => m.clientId === client.id && m.status === 'active') : undefined
  const mType = useMembershipType(membership?.typeId)
  const debtReceipt = client ? receipts.find((r) => r.clientId === client.id && r.status === 'debt') : undefined
  const hasDebtLine = cart.lines.some((l) => l.kind === 'debt')

  return (
    <Card>
      <CardHeader
        title="Client"
        description={client ? undefined : 'Optional for a quick product sale'}
        descriptionInline
        action={
          client && !locked ? (
            <Button size="sm" variant="ghost" onClick={() => setCart({ clientId: null, useBonuses: false })}>
              Remove
            </Button>
          ) : undefined
        }
      />
      <div className="px-5 pb-5">
        {locked && client ? (
          <div className="rounded-[10px] bg-fill px-3 py-2.5 text-base text-fg">{client.name}</div>
        ) : (
          <ClientPicker value={cart.clientId} onChange={(id) => setCart({ clientId: id, useBonuses: false })} />
        )}
        {client && (
          <div className="mt-3 flex flex-col gap-2">
            {client.bonuses > 0 && (
              <div className="flex items-center gap-3 rounded-xl bg-fill px-3.5 py-2.5 text-sm">
                <Icon icon={I.coins} size={16} className="text-muted" />
                <span className="flex-1 text-muted">
                  <span className="text-fg tabular">{formatNumber(client.bonuses)}</span> bonus points, 1 point = 1 {CURRENCY}
                </span>
              </div>
            )}
            {client.debt > 0 && (
              <div className="flex items-center gap-3 rounded-xl bg-negative-soft px-3.5 py-2.5 text-sm text-negative">
                <Icon icon={I.alert} size={16} />
                <span className="flex-1">
                  Owes <Money value={client.debt} className="font-medium" />
                  {debtReceipt && <> from {formatDate(debtReceipt.at)}</>}
                </span>
                {!hasDebtLine && !locked && (
                  <Button
                    size="sm"
                    variant="secondary"
                    className="bg-surface"
                    onClick={() =>
                      addLine({ id: lineId(), kind: 'debt', name: 'Debt repayment', price: client.debt, qty: 1, ref: debtReceipt ? String(debtReceipt.no) : undefined })
                    }
                  >
                    Add to receipt
                  </Button>
                )}
              </div>
            )}
            {membership && mType && (
              <div className="flex items-center gap-3 rounded-xl bg-accent-soft px-3.5 py-2.5 text-sm">
                <Icon icon={I.award} size={16} className="text-accent-fg" />
                <span className="flex-1 text-fg">
                  {mType.name} · {mType.visits - membership.used} of {mType.visits} visits left
                  <span className="text-muted"> · until {formatDate(membership.validUntil)}</span>
                </span>
                {!locked && !cart.lines.some((l) => l.id.startsWith(`mu:${membership.id}`)) && (
                  <Button
                    size="sm"
                    variant="secondary"
                    className="bg-surface"
                    onClick={() => {
                      const svc = serviceById[mType.serviceIds[0]]
                      addLine({ id: `mu:${membership.id}:${lineId()}`, kind: 'service', name: `${svc.name} · membership`, price: 0, qty: 1, staffId: svc.staffIds[0], ref: svc.id })
                    }}
                  >
                    Use a visit
                  </Button>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </Card>
  )
}

function LineRow({ line, locked }: { line: ReceiptLine; locked: boolean }) {
  const updateLine = useRegister((s) => s.updateLine)
  const removeLine = useRegister((s) => s.removeLine)
  const master = line.staffId ? staffById[line.staffId] : undefined
  const svc = line.kind === 'service' && line.ref ? serviceById[line.ref] : undefined
  const product = line.kind === 'product' && line.ref ? productById[line.ref] : undefined

  let sub: React.ReactNode = null
  if (svc && master) {
    const options = bookableStaff.filter((s) => svc.staffIds.includes(s.id))
    sub = (
      <>
        {locked || options.length < 2 ? (
          <span>with {master.name.split(' ')[0]}</span>
        ) : (
          <Menu
            trigger={
              <button type="button" className="inline-flex items-center gap-0.5 hover:text-fg">
                with {master.name.split(' ')[0]}
                <Icon icon={I.chevronDown} size={12} />
              </button>
            }
          >
            {options.map((s) => (
              <MenuItem key={s.id} onClick={() => updateLine(line.id, { staffId: s.id })}>
                {s.name}
              </MenuItem>
            ))}
          </Menu>
        )}
        <span> · {formatDuration(svc.duration)}</span>
      </>
    )
  } else if (product) sub = product.brand
  else if (line.kind === 'tip') sub = 'Goes to the master in full'
  else if (line.kind === 'debt') sub = line.ref ? `From receipt #${line.ref}` : 'Earlier visit'
  else if (line.kind === 'certificate') sub = `Code ${line.ref}`
  else if (line.kind === 'membership') sub = 'Starts today'
  else if (line.kind === 'deposit') sub = 'Returned later, not revenue'
  else if (line.kind === 'rental') sub = 'Rental'

  return (
    <li className="group flex items-center gap-3 border-b border-border px-5 py-3 last:border-b-0">
      {master && line.kind === 'service' ? (
        <Avatar name={master.name} color={master.color} size="md" />
      ) : (
        <span className="grid size-8 shrink-0 place-items-center rounded-full bg-fill text-muted">
          <Icon icon={LINE_ICON[line.kind]} size={16} />
        </span>
      )}
      <div className="min-w-0 flex-1">
        <div className="truncate text-base text-fg">{line.name}</div>
        {sub && <div className="truncate text-sm text-muted">{sub}</div>}
      </div>
      {line.kind === 'product' && (
        <div className="flex items-center gap-1 rounded-full bg-fill p-0.5">
          <IconButton
            icon={I.chevronLeft}
            label="One less"
            size="xs"
            tooltip={false}
            disabled={locked || line.qty <= 1}
            onClick={() => updateLine(line.id, { qty: line.qty - 1 })}
            className="disabled:opacity-30"
          />
          <span className="w-5 text-center text-sm tabular">{line.qty}</span>
          <IconButton
            icon={I.chevronRight}
            label="One more"
            size="xs"
            tooltip={false}
            disabled={locked || (!!product && line.qty >= product.stock)}
            onClick={() => updateLine(line.id, { qty: line.qty + 1 })}
            className="disabled:opacity-30"
          />
        </div>
      )}
      <div className="w-28 text-right">
        {line.price === 0 ? <span className="text-sm text-accent-fg">Included</span> : <Money value={line.price * line.qty} className="text-base" />}
      </div>
      {!locked && (
        <IconButton
          icon={I.close}
          label={`Remove ${line.name}`}
          size="xs"
          tooltip={false}
          onClick={() => removeLine(line.id)}
          className="-mr-2 opacity-50 group-hover:opacity-100"
        />
      )}
    </li>
  )
}

function ReceiptCard({ onAdd }: { onAdd: (k: ItemKind) => void }) {
  const cart = useRegister((s) => s.cart)
  const setCart = useRegister((s) => s.setCart)
  const locked = !!cart.paid
  const count = cart.lines.reduce((m, l) => m + l.qty, 0)

  return (
    <>
      <Card className="pb-5">
        <CardHeader
          title="Receipt"
          description={count ? `${count} item${count === 1 ? '' : 's'}` : undefined}
          action={
            !locked && (
              <>
                <IconButton icon={I.scan} label="Scan a barcode" size="sm" onClick={() => onAdd('scan')} />
                {cart.lines.length > 0 && (
                  <IconButton
                    icon={I.delete}
                    label="Clear receipt"
                    size="sm"
                    onClick={() => setCart({ lines: [], discount: null, useBonuses: false, split: null, received: '', visitId: null })}
                  />
                )}
              </>
            )
          }
        />
        {cart.lines.length ? (
          <ul>
            {cart.lines.map((l) => (
              <LineRow key={l.id} line={l} locked={locked} />
            ))}
          </ul>
        ) : (
          <div className="mx-5 flex items-center gap-3 rounded-xl border border-dashed border-border-strong px-4 py-5 text-base text-muted">
            <Icon icon={I.receipt} size={20} className="text-faint" />
            Add a service or product below, or scan a barcode.
          </div>
        )}
      </Card>

      <div className={cn('mt-4 grid grid-cols-3 gap-2.5 min-[1400px]:grid-cols-6', locked && 'pointer-events-none opacity-40')}>
        {TILES.map((t) => (
          <button
            key={t.kind}
            type="button"
            disabled={locked}
            onClick={() => onAdd(t.kind)}
            className="press flex h-[88px] flex-col justify-between rounded-xl bg-fill p-3.5 text-left hover:bg-fill-hover"
          >
            <Icon icon={t.icon} size={20} className="text-fg" />
            <span className="text-base text-fg">{t.label}</span>
          </button>
        ))}
      </div>
    </>
  )
}

function DiscountPopover() {
  const setCart = useRegister((s) => s.setCart)
  const [open, setOpen] = useState(false)
  const [mode, setMode] = useState<'percent' | 'amount' | 'code'>('percent')
  const [value, setValue] = useState('')
  const [error, setError] = useState<string | null>(null)

  function apply() {
    let d: Discount | null = null
    if (mode === 'code') {
      const code = value.trim().toUpperCase()
      const promo = PROMO_CODES[code]
      if (!promo) return setError('Code not found or expired')
      d = { kind: 'percent', value: promo.percent, code }
    } else {
      const n = Number(value)
      if (!n || n <= 0) return setError('Enter a number')
      if (mode === 'percent' && n > 100) return setError('At most 100%')
      d = { kind: mode, value: n }
    }
    setCart({ discount: d })
    setOpen(false)
    setValue('')
    setError(null)
  }

  return (
    <Popover
      open={open}
      onOpenChange={setOpen}
      align="start"
      className="w-80 p-4"
      trigger={
        <button type="button" className="inline-flex items-center gap-1.5 text-sm font-medium text-accent-fg hover:underline underline-offset-4">
          <Icon icon={I.discount} size={16} />
          Add discount or promo code
        </button>
      }
    >
      <Segmented
        fill
        size="sm"
        value={mode}
        onChange={(m) => {
          setMode(m)
          setError(null)
          setValue('')
        }}
        items={[
          { value: 'percent', label: 'Percent' },
          { value: 'amount', label: 'Amount' },
          { value: 'code', label: 'Promo code' },
        ]}
      />
      <form
        className="mt-3 flex gap-2"
        onSubmit={(e) => {
          e.preventDefault()
          apply()
        }}
      >
        <Input
          autoFocus
          value={value}
          onChange={(e) => {
            setValue(mode === 'code' ? e.target.value.toUpperCase() : e.target.value.replace(/\D/g, ''))
            setError(null)
          }}
          placeholder={mode === 'code' ? 'e.g. AUTUMN15' : mode === 'percent' ? '10' : '50'}
          suffix={mode === 'percent' ? '%' : mode === 'amount' ? CURRENCY : undefined}
          inputMode={mode === 'code' ? 'text' : 'numeric'}
          aria-invalid={!!error}
          className="flex-1"
        />
        <Button type="submit" variant="secondary">
          Apply
        </Button>
      </form>
      {error ? (
        <p className="mt-2 text-xs text-negative">{error}</p>
      ) : (
        <p className="mt-2 text-xs text-faint">Applies to services and products, not tips or certificates.</p>
      )}
    </Popover>
  )
}

function MethodChip({ id, selected, onClick }: { id: PaymentMethodId; selected: boolean; onClick: () => void }) {
  const m = PAYMENT_METHODS.find((x) => x.id === id)!
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={cn(
        'press flex h-10 items-center gap-2 rounded-xl px-3 text-sm font-medium ring-1 ring-inset',
        selected ? 'bg-fg text-bg ring-fg' : 'bg-surface text-fg ring-border hover:bg-fill',
      )}
    >
      <Icon icon={METHOD_ICON[id] ?? I.wallet} size={16} className={selected ? '' : 'text-muted'} />
      <span className="truncate">{m.name}</span>
    </button>
  )
}

function SuccessCard() {
  const cart = useRegister((s) => s.cart)
  const resetCart = useRegister((s) => s.resetCart)
  const receipt = useRegister((s) => s.receipts.find((r) => r.id === cart.paid?.receiptId))
  const client = useData((s) => s.clients.find((c) => c.id === cart.clientId))
  const openNewVisit = useOverlays((s) => s.openNewVisit)
  if (!receipt || !cart.paid) return null
  const services = cart.lines.filter((l) => l.kind === 'service' && l.ref).map((l) => l.ref!)
  const methods = receipt.payments.map((p) => methodName(p.method)).join(' + ')

  return (
    <Card className="flex flex-col items-center p-6 text-center">
      <div className="mt-2 grid size-14 place-items-center rounded-full bg-positive-soft text-positive">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden>
          <path
            d="M5 12.5l4.5 4.5L19 7.5"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="[stroke-dasharray:24] [stroke-dashoffset:24] animate-[draw_420ms_var(--ease-out)_120ms_forwards] motion-reduce:animate-none motion-reduce:[stroke-dashoffset:0]"
          />
        </svg>
      </div>
      <div className="mt-4 text-base text-muted">Paid</div>
      <div className="mt-1 flex items-baseline gap-2">
        <Money value={receipt.total} currency={false} className="text-5xl font-normal text-fg" />
        <span className="text-base text-faint">{CURRENCY}</span>
      </div>
      <div className="mt-2 text-sm text-muted">
        Receipt #{receipt.no} · {methods}
      </div>
      {client && cart.paid.earned > 0 && (
        <div className="mt-3 rounded-full bg-fill px-3 py-1 text-sm text-muted">
          +{cart.paid.earned} bonus points to {client.firstName}
        </div>
      )}
      <div className="mt-6 grid w-full grid-cols-2 gap-2">
        <Button
          icon={client?.telegram ? I.telegram : I.message}
          onClick={() => toast.success(client?.telegram ? `Receipt sent to ${client.firstName} in Telegram` : client ? `Receipt sent to ${client.firstName} by SMS` : 'Receipt link copied')}
        >
          {client?.telegram ? 'Send in Telegram' : client ? 'Send by SMS' : 'Copy link'}
        </Button>
        <Button icon={I.print} onClick={() => toast('Printing receipt #' + receipt.no, { description: 'Xprinter XP-58 · 58 mm' })}>
          Print
        </Button>
      </div>
      {client && services.length > 0 && (
        <Button
          variant="ghost"
          icon={I.calendarAdd}
          className="mt-2 w-full"
          onClick={() => openNewVisit({ clientId: client.id, serviceIds: [services[0]], start: undefined })}
        >
          Book the next visit
        </Button>
      )}
      <Button variant="primary" size="lg" className="mt-4 w-full" onClick={resetCart}>
        New sale
      </Button>
    </Card>
  )
}

function TotalCard() {
  const cart = useRegister((s) => s.cart)
  const setCart = useRegister((s) => s.setCart)
  const shift = useRegister((s) => s.shift)
  const receipts = useRegister((s) => s.receipts)
  const { addReceipt, updateReceipt, addMembership, addCertificate, updateMembership, memberships } = useRegister()
  const client = useData((s) => s.clients.find((c) => c.id === cart.clientId))
  const { setStatus, updateClient } = useData()
  const hidden = usePrefs((s) => s.hideAmounts)
  const navigate = useNavigate()
  const t = useTotals()
  const [charging, setCharging] = useState(false)

  if (cart.paid) return <SuccessCard />

  const moreMethods = PAYMENT_METHODS.filter((m) => !PRIMARY_METHODS.includes(m.id))
  const shownMethods: PaymentMethodId[] = PRIMARY_METHODS.includes(cart.method) ? PRIMARY_METHODS : [...PRIMARY_METHODS.slice(0, 3), cart.method]
  const cashBlocked = t.cashPortion > 0 && !shift.open
  const short = t.cashPortion > 0 && cart.received !== '' && t.received < t.cashPortion
  const canCharge = cart.lines.length > 0 && !cashBlocked && !short && !charging

  function charge() {
    if (!canCharge) return
    setCharging(true)
    setTimeout(() => {
      const no = nextReceiptNo(receipts)
      const payments = cart.split
        ? [
            { method: cart.method, amount: t.primaryAmount },
            { method: cart.split.method, amount: t.splitAmount },
          ].filter((p) => p.amount > 0)
        : [{ method: cart.method, amount: t.total }]
      const receipt: Receipt = {
        id: `r_new_${no}`,
        no,
        at: new Date(NOW.getTime() + (no - 1042) * 60_000),
        clientId: cart.clientId,
        lines: cart.lines,
        payments,
        discount: t.discount,
        bonusesUsed: t.bonusesUsed,
        total: t.total,
        owed: 0,
        refunded: 0,
        status: 'paid',
        cashier: 'Zarina Karimova',
        fiscal: `FP 7310 ${String(no).padStart(4, '0')} 2286`,
        visitId: cart.visitId ?? undefined,
      }
      addReceipt(receipt)

      if (cart.visitId) setStatus(cart.visitId, 'completed')
      for (const l of cart.lines) {
        if (l.kind === 'membership' && l.ref && cart.clientId) {
          const type = membershipType(l.ref)
          addMembership({ id: `ms_${l.id}`, typeId: l.ref, clientId: cart.clientId, used: 0, soldAt: NOW, validUntil: addDays(NOW, type.validDays), status: 'active' })
        }
        if (l.kind === 'certificate' && l.ref) {
          const p = pendingCertificates.get(l.ref)
          addCertificate({
            code: l.ref,
            kind: p?.kind ?? 'amount',
            nominal: l.price,
            balance: l.price,
            serviceId: p?.serviceId,
            buyerId: cart.clientId ?? '',
            recipient: p?.recipient,
            soldAt: NOW,
            validUntil: p?.validUntil ?? addDays(NOW, 180),
            status: 'active',
          })
        }
        if (l.kind === 'debt' && l.ref) {
          const old = receipts.find((r) => String(r.no) === l.ref)
          if (old) updateReceipt(old.id, { status: 'paid', owed: 0 })
        }
        if (l.id.startsWith('mu:')) {
          const ms = memberships.find((m) => m.id === l.id.split(':')[1])
          if (ms) {
            const type = membershipType(ms.typeId)
            updateMembership(ms.id, { used: ms.used + 1, status: ms.used + 1 >= type.visits ? 'used' : ms.status })
          }
        }
      }

      const earned = client ? Math.round((t.discountable - t.discount - t.bonusesUsed) * 0.05) : 0
      if (client) {
        const debtPaid = cart.lines.filter((l) => l.kind === 'debt').reduce((m, l) => m + l.price, 0)
        updateClient(client.id, {
          bonuses: client.bonuses - t.bonusesUsed + earned,
          debt: Math.max(0, client.debt - debtPaid),
          visits: client.visits + (cart.lines.some((l) => l.kind === 'service') && !cart.visitId ? 1 : 0),
          totalSpent: client.totalSpent + t.total,
          lastVisit: NOW,
        })
      }
      setCart({ paid: { receiptId: receipt.id, earned } })
      setCharging(false)
    }, 650)
  }

  return (
    <Card className="p-5">
      <div className="flex flex-col gap-2.5 text-base">
        <div className="flex items-center justify-between">
          <span className="text-muted">Subtotal</span>
          <Money value={t.subtotal} />
        </div>
        {cart.discount ? (
          <div className="flex items-center justify-between gap-3">
            <span className="flex min-w-0 items-center gap-1.5 text-muted">
              Discount {cart.discount.kind === 'percent' ? `${cart.discount.value}%` : ''}
              {cart.discount.code && <span className="truncate rounded-md bg-fill px-1.5 text-xs leading-5 font-medium text-fg">{cart.discount.code}</span>}
              <IconButton icon={I.close} label="Remove discount" size="xs" tooltip={false} onClick={() => setCart({ discount: null })} iconSize={14} />
            </span>
            <Money value={-t.discount} className="text-positive" />
          </div>
        ) : (
          <div>
            <DiscountPopover />
          </div>
        )}
        {client && client.bonuses > 0 && (
          <div className="mt-1 flex items-center justify-between gap-3">
            <Switch
              checked={cart.useBonuses}
              onChange={(v) => setCart({ useBonuses: v })}
              label="Pay with bonuses"
              description={`Up to ${formatNumber(t.maxBonuses)} of ${formatNumber(client.bonuses)} points`}
              className="w-full"
            />
          </div>
        )}
        {cart.useBonuses && t.bonusesUsed > 0 && (
          <div className="flex items-center justify-between">
            <span className="text-muted">Bonuses</span>
            <Money value={-t.bonusesUsed} className="text-positive" />
          </div>
        )}
      </div>

      <div className="my-5 h-px bg-border" />

      <div className="text-base text-muted">Total</div>
      <div className="mt-1 flex items-baseline gap-2">
        <Figure value={t.total} money className="text-5xl font-normal text-fg" />
        <span className="text-base text-faint">{CURRENCY}</span>
      </div>

      <div className="mt-6 mb-2 flex items-center justify-between">
        <span className="text-sm font-medium text-muted">Payment</span>
        {!cart.split && t.total > 0 && (
          <button
            type="button"
            onClick={() => setCart({ split: { method: cart.method === 'cash' ? 'card' : 'cash', amount: Math.round(t.total / 2) } })}
            className="text-sm text-muted hover:text-fg hover:underline underline-offset-4"
          >
            Split payment
          </button>
        )}
      </div>
      <div className="grid grid-cols-2 gap-2.5">
        {shownMethods.map((id) => (
          <MethodChip key={id} id={id} selected={cart.method === id} onClick={() => setCart({ method: id, received: '' })} />
        ))}
      </div>
      <Menu
        align="start"
        trigger={
          <button type="button" className="mt-2 inline-flex items-center gap-1 text-sm text-muted hover:text-fg">
            More methods
            <Icon icon={I.chevronDown} size={14} />
          </button>
        }
      >
        {moreMethods.map((m) => (
          <MenuItem key={m.id} icon={METHOD_ICON[m.id] ?? I.wallet} onClick={() => setCart({ method: m.id, received: '' })}>
            {m.name}
          </MenuItem>
        ))}
      </Menu>

      {cart.split && (
        <div className="mt-3 rounded-xl bg-fill p-3">
          <div className="mb-2 flex items-center justify-between text-sm">
            <span className="text-muted">
              {methodName(cart.method)} <Money value={t.primaryAmount} className="text-fg" />
            </span>
            <button type="button" onClick={() => setCart({ split: null })} className="text-muted hover:text-fg">
              Remove split
            </button>
          </div>
          <div className="grid grid-cols-[1fr_120px] gap-2">
            <Select
              value={cart.split.method}
              onChange={(m) => setCart({ split: { ...cart.split!, method: m } })}
              options={PAYMENT_METHODS.filter((m) => m.id !== cart.method).map((m) => ({ value: m.id, label: m.name }))}
              className="bg-surface"
            />
            <Input
              value={String(cart.split.amount)}
              onChange={(e) => setCart({ split: { ...cart.split!, amount: Math.min(t.total, Number(e.target.value.replace(/\D/g, '')) || 0) } })}
              inputMode="numeric"
              suffix={CURRENCY}
              className="[&_input]:bg-surface"
            />
          </div>
        </div>
      )}

      {t.cashPortion > 0 && !cashBlocked && (
        <div className="mt-4">
          <div className="mb-1.5 text-sm font-medium text-muted">Cash received</div>
          <div className="flex gap-2">
            <Input
              value={cart.received}
              onChange={(e) => setCart({ received: e.target.value.replace(/\D/g, '') })}
              placeholder={hidden ? '' : formatNumber(t.cashPortion)}
              inputMode="numeric"
              suffix={CURRENCY}
              aria-invalid={short}
              className="flex-1"
            />
            {[500, 1000].filter((v) => v > t.cashPortion).slice(0, 2).map((v) => (
              <Button key={v} variant="secondary" onClick={() => setCart({ received: String(v) })}>
                {formatNumber(v)}
              </Button>
            ))}
          </div>
          {cart.received !== '' && (
            <div className={cn('mt-2 flex items-center justify-between text-sm', short ? 'text-negative' : 'text-muted')}>
              <span>{short ? 'Not enough cash' : 'Change'}</span>
              {!short && <Money value={t.change} className="text-base text-fg" />}
            </div>
          )}
        </div>
      )}

      {cashBlocked && (
        <div className="mt-4 flex items-start gap-3 rounded-xl bg-warning-soft px-3.5 py-3 text-sm text-warning">
          <Icon icon={I.lock} size={16} className="mt-0.5" />
          <span className="flex-1">Cash is accepted only during an open shift.</span>
          <Button size="sm" variant="secondary" className="bg-surface" onClick={() => navigate('/pos/shift')}>
            Open shift
          </Button>
        </div>
      )}

      <Button variant="primary" size="lg" className="mt-5 w-full" disabled={!canCharge} loading={charging} onClick={charge}>
        {cart.lines.length === 0 ? 'Charge' : hidden ? 'Charge' : `Charge ${formatMoney(t.total)}`}
      </Button>
      {cart.visitId && <p className="mt-2.5 text-center text-xs text-faint">The visit will be marked as completed.</p>}
    </Card>
  )
}

export function Sale() {
  const [params, setParams] = useSearchParams()
  const { search } = useLocation()
  const handled = useRef<string | null>(null)
  const cart = useRegister((s) => s.cart)
  const { setCart, addLine, resetCart } = useRegister()
  const entries = useData((s) => s.entries)
  const clients = useData((s) => s.clients)
  const receipts = useRegister((s) => s.receipts)
  const [modal, setModal] = useState<ItemKind | null>(null)

  // Arriving from a visit ("Check out"), a debt ("Collect") or another section.
  useEffect(() => {
    if (!search || handled.current === search) return
    handled.current = search
    const visitId = params.get('visit')
    const clientId = params.get('client')
    const add = params.get('add') as ItemKind | null

    if (visitId) {
      const v = entries.find((e) => e.id === visitId)
      if (v && isVisit(v)) {
        if (v.paid) toast('This visit is already paid', { description: 'Find it in Receipts.' })
        else {
          resetCart()
          setCart({
            clientId: v.clientId,
            visitId: v.id,
            lines: v.serviceIds.map((id) => ({ id: lineId(), kind: 'service' as const, name: serviceById[id].name, price: serviceById[id].price, qty: 1, staffId: v.staffId, ref: id })),
          })
        }
      }
    } else if (clientId) {
      if (cart.paid) resetCart()
      setCart({ clientId, useBonuses: false })
      const c = clients.find((x) => x.id === clientId)
      if (params.get('debt') && c && c.debt > 0 && !useRegister.getState().cart.lines.some((l) => l.kind === 'debt')) {
        const debtReceipt = receipts.find((r) => r.clientId === c.id && r.status === 'debt')
        addLine({ id: lineId(), kind: 'debt', name: 'Debt repayment', price: c.debt, qty: 1, ref: debtReceipt ? String(debtReceipt.no) : undefined })
      }
    }
    if (add && ['service', 'product', 'membership', 'certificate', 'tip', 'other'].includes(add)) {
      if (cart.paid) resetCart()
      setModal(add)
    }
    setParams({}, { replace: true })
  }, [search]) // eslint-disable-line react-hooks/exhaustive-deps

  const lastMaster = [...cart.lines].reverse().find((l) => l.staffId)?.staffId

  return (
    <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_340px] xl:grid-cols-[minmax(0,1fr)_380px]">
      <div className="flex min-w-0 flex-col gap-5">
        <ClientCard />
        <div>
          <ReceiptCard onAdd={setModal} />
        </div>
      </div>
      <div className="lg:sticky lg:top-6">
        <TotalCard />
      </div>
      <ItemModals
        open={modal}
        onClose={() => setModal(null)}
        onAdd={addLine}
        clientId={cart.clientId}
        onClient={(id) => setCart({ clientId: id, useBonuses: false })}
        defaultStaffId={lastMaster}
      />
    </div>
  )
}
