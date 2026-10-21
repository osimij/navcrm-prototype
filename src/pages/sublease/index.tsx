import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { I } from '@/components/icons'
import { Avatar } from '@/components/ui/avatar'
import { StatCard } from '@/components/ui/stat-card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Switch } from '@/components/ui/controls'
import { DatePicker } from '@/components/ui/date-picker'
import { DetailRow, Modal, Sheet } from '@/components/ui/dialog'
import { Field, Textarea } from '@/components/ui/input'
import { Menu, MenuItem } from '@/components/ui/menu'
import { EmptyState, Money } from '@/components/ui/misc'
import { Page, PageHeader, Toolbar } from '@/components/ui/page'
import { Select } from '@/components/ui/select'
import { Table, TD, TH, THead, TR } from '@/components/ui/table'
import { Segmented } from '@/components/ui/tabs'
import { staff, staffName } from '@/data/staff'
import { cn } from '@/lib/cn'
import { formatDate, formatMoney, formatPhone, monthLong } from '@/lib/format'
import { TODAY, addDays } from '@/lib/time'
import { MoneyInput, Note, StatTile } from '../payroll/shared'
import {
  BASIS_LABEL,
  LEDGER_LABEL,
  PLACES,
  balances,
  chargeableNow,
  inMonth,
  monthStart,
  turnover,
  useSublease,
  visitCount,
  type RentBasis,
  type Tenant,
} from './data'

const MONTHS = [0, -1, -2]
const monthLabel = (offset: number) => {
  const d = monthStart(offset)
  return `${monthLong(d.getMonth())}${d.getFullYear() !== TODAY.getFullYear() ? ` ${d.getFullYear()}` : ''}`
}

function BalanceCell({ owes }: { owes: number }) {
  if (owes > 0)
    return (
      <span className="text-negative">
        Owes <Money value={owes} />
      </span>
    )
  if (owes < 0)
    return (
      <span className="text-positive">
        Credit <Money value={-owes} />
      </span>
    )
  return <span className="text-muted">Settled</span>
}

function AddTenantModal({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const addTenant = useSublease((s) => s.addTenant)
  const tenants = useSublease((s) => s.tenants)
  const candidates = staff.filter((s) => (s.role === 'Master' || s.invited) && !tenants.some((t) => t.staffId === s.id))
  const [master, setMaster] = useState<string | null>(null)
  const [place, setPlace] = useState('none')
  const [rent, setRent] = useState<number | null>(null)
  const [basis, setBasis] = useState<RentBasis>('day')
  const [start, setStart] = useState(TODAY)
  const [hasEnd, setHasEnd] = useState(false)
  const [end, setEnd] = useState(addDays(TODAY, 90))
  const [comment, setComment] = useState('')
  const [touched, setTouched] = useState(false)

  useEffect(() => {
    if (!open) return
    setMaster(null)
    setPlace('none')
    setRent(null)
    setBasis('day')
    setStart(TODAY)
    setHasEnd(false)
    setComment('')
    setTouched(false)
  }, [open])

  const taken = tenants.map((t) => t.place)
  const valid = !!master && !!rent && (!hasEnd || end > start)

  function save() {
    setTouched(true)
    if (!valid) return
    const s = staff.find((x) => x.id === master)!
    addTenant({
      id: `t${Date.now()}`,
      staffId: s.id,
      name: staffName(s),
      specialty: s.position,
      phone: s.phone,
      color: s.color,
      place: place === 'none' ? null : place,
      rent: rent!,
      basis,
      start,
      end: hasEnd ? end : undefined,
      comment: comment || undefined,
    })
    onOpenChange(false)
    toast.success(`${staffName(s)} is now a tenant`, { description: 'From now on their visits go to Sublease, not salon revenue or payroll.' })
  }

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title="Add tenant"
      description="A master who rents a chair or room and keeps their own revenue."
      footer={
        <>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={save}>
            Add tenant
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <Field label="Master" error={touched && !master ? 'Choose a master' : undefined} hint="Not on the list? Add them in Settings, Staff first.">
          <Select
            value={master}
            onChange={setMaster}
            placeholder="Choose a master"
            options={candidates.map((s) => ({
              value: s.id,
              label: s.name || formatPhone(s.phone),
              hint: s.invited ? `${s.position} · invited` : `${s.position} · now a salon employee`,
              icon: <Avatar name={s.name} color={s.color} size="sm" />,
            }))}
          />
        </Field>
        <Field label="Place" optional>
          <Select
            value={place}
            onChange={setPlace}
            options={[
              { value: 'none', label: 'No fixed place' },
              ...PLACES.map((p) => ({ value: p, label: p, hint: taken.includes(p) ? 'Already rented' : undefined })),
            ]}
          />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Rent" error={touched && !rent ? 'Required' : undefined}>
            <MoneyInput value={rent} onChange={setRent} invalid={touched && !rent} />
          </Field>
          <Field label="Charged">
            <Select value={basis} onChange={setBasis} options={(Object.keys(BASIS_LABEL) as RentBasis[]).map((b) => ({ value: b, label: BASIS_LABEL[b][0].toUpperCase() + BASIS_LABEL[b].slice(1) }))} />
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Starts">
            <DatePicker value={start} onChange={setStart} />
          </Field>
          <Field label="Ends" error={hasEnd && end <= start ? 'Must be after the start' : undefined}>
            {hasEnd ? (
              <DatePicker value={end} onChange={setEnd} />
            ) : (
              <div className="flex h-9 items-center rounded-[10px] bg-fill px-3 text-base text-muted">Open-ended</div>
            )}
          </Field>
        </div>
        <Switch checked={hasEnd} onChange={setHasEnd} label="Set an end date" description="Leave off for an open-ended lease." />
        <Field label="Comment" optional>
          <Textarea value={comment} onChange={(e) => setComment(e.target.value)} className="min-h-16" />
        </Field>
      </div>
    </Modal>
  )
}

function MoneyActionModal({
  tenant,
  kind,
  onClose,
}: {
  tenant: Tenant | null
  kind: 'payment' | 'handover' | null
  onClose: () => void
}) {
  const ledger = useSublease((s) => s.ledger)
  const addEntry = useSublease((s) => s.addEntry)
  const b = tenant ? balances(ledger, tenant.id) : { owes: 0, held: 0 }
  const suggested = kind === 'payment' ? Math.max(0, b.owes) : Math.max(0, b.held)
  const [amount, setAmount] = useState<number | null>(null)
  const [method, setMethod] = useState<'cash' | 'alif' | 'card'>('cash')

  useEffect(() => {
    if (kind) setAmount(suggested || null)
  }, [kind, suggested])

  return (
    <Modal
      open={!!kind}
      onOpenChange={(o) => !o && onClose()}
      size="sm"
      title={kind === 'payment' ? 'Record rent payment' : 'Hand over cash'}
      description={
        kind === 'payment'
          ? `${tenant?.name} owes ${formatMoney(Math.max(0, b.owes))} in rent.`
          : `You’re holding ${formatMoney(Math.max(0, b.held))} that ${tenant?.name.split(' ')[0]}’s clients paid at your register.`
      }
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            disabled={!amount}
            onClick={() => {
              if (!tenant || !amount) return
              addEntry({
                id: `l${Date.now()}`,
                tenantId: tenant.id,
                date: TODAY,
                kind: kind!,
                amount,
                note: kind === 'payment' ? `Paid with ${method === 'alif' ? 'Alif' : method === 'card' ? 'card' : 'cash'}` : `Handed over in ${method === 'cash' ? 'cash' : method === 'alif' ? 'Alif transfer' : 'card transfer'}`,
              })
              onClose()
              toast.success(kind === 'payment' ? `Payment of ${formatMoney(amount)} recorded` : `Handed over ${formatMoney(amount)} to ${tenant.name.split(' ')[0]}`)
            }}
          >
            {kind === 'payment' ? 'Record payment' : 'Hand over'}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <Field label="Amount">
          <MoneyInput value={amount} onChange={setAmount} autoFocus />
        </Field>
        <Field label="How">
          <Segmented
            fill
            value={method}
            onChange={setMethod}
            items={[
              { value: 'cash', label: 'Cash' },
              { value: 'alif', label: 'Alif' },
              { value: 'card', label: 'Card' },
            ]}
          />
        </Field>
      </div>
    </Modal>
  )
}

function TenantSheet({ tenant, open, onClose, offset }: { tenant: Tenant | null; open: boolean; onClose: () => void; offset: number }) {
  const ledger = useSublease((s) => s.ledger)
  const updateTenant = useSublease((s) => s.updateTenant)
  const [action, setAction] = useState<'payment' | 'handover' | null>(null)
  const [ending, setEnding] = useState(false)
  const [endDate, setEndDate] = useState(addDays(TODAY, 30))
  if (!tenant) return null
  const b = balances(ledger, tenant.id)
  const mine = ledger.filter((l) => l.tenantId === tenant.id)

  return (
    <>
      <Sheet
        open={open && !action && !ending}
        onOpenChange={(o) => !o && onClose()}
        eyebrow="Tenant"
        title={tenant.name}
        actions={
          <Menu trigger={<Button size="sm" variant="ghost" icon={I.more}>More</Button>} align="end">
            <MenuItem icon={I.calendarBlock} danger onClick={() => setEnding(true)}>
              End lease
            </MenuItem>
          </Menu>
        }
        footer={
          <>
            <Button icon={I.cash} onClick={() => setAction('handover')} disabled={b.held <= 0}>
              Hand over cash
            </Button>
            <Button variant="primary" className="ml-auto" onClick={() => setAction('payment')}>
              Record payment
            </Button>
          </>
        }
      >
        <div className="flex items-center gap-3 px-5 pt-5">
          <Avatar name={tenant.name} color={tenant.color} size="lg" />
          <div>
            <div className="text-base text-fg">{tenant.specialty}</div>
            <div className="text-sm text-muted tabular">{formatPhone(tenant.phone)}</div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 px-5 pt-5">
          <StatCard size="sm" label="Rent balance" value={<BalanceCell owes={b.owes} />} className={cn('rounded-xl ring-0', b.owes > 0 ? 'bg-negative-soft' : 'bg-fill')} />
          <StatCard size="sm" label="Holding for them" value={<Money value={Math.max(0, b.held)} />} className="rounded-xl bg-fill ring-0" />
        </div>
        <div className="px-5 pt-4">
          <DetailRow label="Place">{tenant.place ?? 'No fixed place'}</DetailRow>
          <DetailRow label="Rent">
            <Money value={tenant.rent} /> {BASIS_LABEL[tenant.basis]}
          </DetailRow>
          <DetailRow label="Lease">
            {formatDate(tenant.start)} – {tenant.end ? formatDate(tenant.end) : 'open-ended'}
          </DetailRow>
          <DetailRow label={`Turnover in ${monthLabel(offset)}`}>
            <Money value={turnover(tenant, offset)} /> · {visitCount(tenant, offset)} visits
          </DetailRow>
          {tenant.comment && <DetailRow label="Note">{tenant.comment}</DetailRow>}
        </div>
        <div className="px-5 pt-5 pb-6">
          <div className="mb-1 text-xs font-medium text-faint">Ledger</div>
          <ul>
            {mine.map((l) => {
              return (
                <li key={l.id} className="flex items-start justify-between gap-6 border-b border-border py-3 last:border-b-0">
                  <div className="min-w-0">
                    <div className="text-base text-fg">{LEDGER_LABEL[l.kind]}</div>
                    <div className="text-sm text-muted">
                      {formatDate(l.date)} · {l.note}
                    </div>
                  </div>
                  <Money value={l.amount} className={cn('pt-px text-base', l.kind === 'payment' && 'text-positive')} />
                </li>
              )
            })}
          </ul>
        </div>
      </Sheet>
      <MoneyActionModal tenant={tenant} kind={action} onClose={() => setAction(null)} />
      <Modal
        open={ending}
        onOpenChange={setEnding}
        size="sm"
        title={`End ${tenant.name.split(' ')[0]}’s lease?`}
        description="Rent stops after the last day. Settle the balance and hand over held cash before then."
        footer={
          <>
            <Button variant="ghost" onClick={() => setEnding(false)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={() => {
                updateTenant(tenant.id, { end: endDate })
                setEnding(false)
                toast.success(`Lease ends ${formatDate(endDate)}`)
              }}
            >
              End lease
            </Button>
          </>
        }
      >
        <Field label="Last day">
          <DatePicker value={endDate} onChange={setEndDate} />
        </Field>
      </Modal>
    </>
  )
}

export default function Sublease() {
  const tenants = useSublease((s) => s.tenants)
  const ledger = useSublease((s) => s.ledger)
  const addEntry = useSublease((s) => s.addEntry)
  const [offset, setOffset] = useState(0)
  const [adding, setAdding] = useState(false)
  const [selected, setSelected] = useState<string | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)

  const stats = useMemo(() => {
    const month = ledger.filter((l) => inMonth(l.date, offset))
    const sum = (k: string) => month.filter((l) => l.kind === k).reduce((m, l) => m + l.amount, 0)
    const owe = tenants.reduce((m, t) => m + Math.max(0, balances(ledger, t.id).owes), 0)
    const held = tenants.reduce((m, t) => m + Math.max(0, balances(ledger, t.id).held), 0)
    return {
      owe,
      held,
      charged: sum('rent'),
      paid: sum('payment'),
      turnover: tenants.filter((t) => t.start <= monthStart(offset + 1)).reduce((m, t) => m + turnover(t, offset), 0),
    }
  }, [ledger, tenants, offset])

  const daily = tenants.filter((t) => t.basis !== 'month' && (!t.end || t.end >= TODAY))
  function chargeNow() {
    const total = daily.reduce((m, t) => m + chargeableNow(t), 0)
    for (const t of daily) addEntry({ id: `l${Date.now()}${t.id}`, tenantId: t.id, date: TODAY, kind: 'rent', amount: chargeableNow(t), note: 'Charged today' })
    toast.success(`Rent charged: ${formatMoney(total)}`, { description: `Today’s rent for ${daily.length} tenants on daily rates. Monthly rent is charged on the 1st.` })
  }

  return (
    <Page>
      <PageHeader
        title="Sublease"
        subtitle="Masters renting a chair or room. Their visits aren’t counted in salon revenue or payroll."
        actions={
          <Button variant="primary" icon={I.add} onClick={() => setAdding(true)}>
            Add tenant
          </Button>
        }
      />

      <Toolbar>
        <Select look="pill" value={String(offset)} onChange={(v) => setOffset(Number(v))} options={MONTHS.map((o) => ({ value: String(o), label: monthLabel(o) }))} />
        <div className="ml-auto flex gap-2">
          {offset === 0 && daily.length > 0 && (
            <Button size="sm" icon={I.receipt} onClick={chargeNow}>
              Charge rent now
            </Button>
          )}
          <Menu trigger={<Button size="sm" variant="ghost" icon={I.download}>Export</Button>} align="end">
            <MenuItem onClick={() => toast('Excel file prepared')}>Excel (.xlsx)</MenuItem>
            <MenuItem onClick={() => toast('Statements prepared for each tenant')}>Tenant statements (PDF)</MenuItem>
          </Menu>
        </div>
      </Toolbar>

      <div className="mb-5 grid grid-cols-2 gap-5 lg:grid-cols-5">
        <StatTile label="Tenants owe" value={stats.owe} money tone="negative" sub="Unpaid rent, all time" />
        <StatTile label="Charged" value={stats.charged} money sub={`Rent in ${monthLabel(offset)}`} />
        <StatTile label="Paid" value={stats.paid} money sub={`Rent in ${monthLabel(offset)}`} />
        <StatTile label="Tenants’ turnover" value={stats.turnover} money sub="Their visits, not yours" />
        <StatTile label="Held in your register" value={stats.held} money sub="Owed to tenants" className="col-span-2 lg:col-span-1" />
      </div>

      <Card>
        {tenants.length ? (
          <Table>
            <THead>
              <TH>Tenant</TH>
              <TH>Place</TH>
              <TH>Rent</TH>
              <TH align="right">Turnover</TH>
              <TH align="right">Holding for them</TH>
              <TH align="right">Rent balance</TH>
            </THead>
            <tbody>
              {tenants.map((t) => {
                const b = balances(ledger, t.id)
                const ending = t.end && t.end >= TODAY && +t.end - +TODAY < 45 * 86_400_000
                return (
                  <TR
                    key={t.id}
                    onClick={() => {
                      setSelected(t.id)
                      setSheetOpen(true)
                    }}
                    selected={sheetOpen && selected === t.id}
                  >
                    <TD>
                      <span className="flex items-center gap-2.5">
                        <Avatar name={t.name} color={t.color} size="md" />
                        <span className="min-w-0">
                          <span className="flex items-center gap-2 text-base text-fg">
                            {t.name}
                            {ending && <Badge tone="warning">Ends {formatDate(t.end!)}</Badge>}
                          </span>
                          <span className="block text-sm text-muted">{t.specialty}</span>
                        </span>
                      </span>
                    </TD>
                    <TD muted>{t.place ?? 'No fixed place'}</TD>
                    <TD>
                      <Money value={t.rent} /> <span className="text-sm text-muted">{BASIS_LABEL[t.basis]}</span>
                    </TD>
                    <TD align="right">
                      <Money value={turnover(t, offset)} />
                    </TD>
                    <TD align="right" muted>
                      <Money value={Math.max(0, b.held)} />
                    </TD>
                    <TD align="right">
                      <BalanceCell owes={b.owes} />
                    </TD>
                  </TR>
                )
              })}
            </tbody>
          </Table>
        ) : (
          <EmptyState icon={I.chair} title="No tenants yet" description="Rent out a chair or room to a master who works for themselves." />
        )}
      </Card>

      <Note className="mt-5">
        When a tenant’s client pays at your register, the money is held for the tenant and shown under “Holding for them”. Hand it over or offset it
        against rent.
      </Note>

      <TenantSheet tenant={tenants.find((t) => t.id === selected) ?? null} open={sheetOpen} onClose={() => setSheetOpen(false)} offset={offset} />
      <AddTenantModal open={adding} onOpenChange={setAdding} />
    </Page>
  )
}
