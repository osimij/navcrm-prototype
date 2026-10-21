import { useRef, useState } from 'react'
import { useNavigate } from 'react-router'
import { toast } from 'sonner'
import { I } from '@/components/icons'
import { Avatar } from '@/components/ui/avatar'
import { Badge, type Tone } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Chip, Switch } from '@/components/ui/controls'
import { DetailRow, Modal, Sheet } from '@/components/ui/dialog'
import { Field, Input } from '@/components/ui/input'
import { EmptyState, Meter, Money } from '@/components/ui/misc'
import { Toolbar } from '@/components/ui/page'
import { TD, TH, THead, TR, Table } from '@/components/ui/table'
import { Segmented } from '@/components/ui/tabs'
import { SERVICE_CATEGORIES, services } from '@/data/services'
import { cn } from '@/lib/cn'
import { CURRENCY, formatDate } from '@/lib/format'
import { useOverlays } from '@/lib/overlays'
import { useData } from '@/lib/store'
import { addDays } from '@/lib/time'
import type { Membership, MembershipStatus } from './data'
import { membershipType, useRegister } from './store'

const STATUS: Record<MembershipStatus, { label: string; tone: Tone }> = {
  active: { label: 'Active', tone: 'positive' },
  frozen: { label: 'Frozen', tone: 'accent' },
  expired: { label: 'Expired', tone: 'neutral' },
  used: { label: 'Used up', tone: 'neutral' },
  closed: { label: 'Closed', tone: 'neutral' },
}

function MembershipSheet({ id, onClose }: { id: string | null; onClose: () => void }) {
  const m = useRegister((s) => s.memberships.find((x) => x.id === id))
  const updateMembership = useRegister((s) => s.updateMembership)
  const kept = useRef<Membership | undefined>(undefined)
  if (m) kept.current = m
  const last = m ?? kept.current
  const client = useData((s) => s.clients.find((c) => c.id === last?.clientId))
  const openClient = useOverlays((s) => s.openClient)
  if (!last) return null
  const type = membershipType(last.typeId)
  const left = type.visits - last.used

  return (
    <Sheet
      open={!!m}
      onOpenChange={(o) => !o && onClose()}
      eyebrow="Membership"
      title={type.name}
      width="md"
      footer={
        last.status === 'active' || last.status === 'frozen' ? (
          <>
            {type.freeze && (
              <Button
                onClick={() => {
                  const frozen = last.status === 'frozen'
                  updateMembership(last.id, { status: frozen ? 'active' : 'frozen', validUntil: frozen ? last.validUntil : addDays(last.validUntil, 14) })
                  toast.success(frozen ? 'Membership unfrozen' : 'Frozen for 14 days', { description: frozen ? undefined : 'The end date moved by 14 days.' })
                }}
              >
                {last.status === 'frozen' ? 'Unfreeze' : 'Freeze 14 days'}
              </Button>
            )}
            <Button
              onClick={() => {
                updateMembership(last.id, { validUntil: addDays(last.validUntil, 30) })
                toast.success('Extended by 30 days')
              }}
            >
              Extend
            </Button>
            <Button
              variant="ghost"
              className="ml-auto"
              onClick={() => {
                updateMembership(last.id, { status: 'closed' })
                toast('Membership closed', { action: { label: 'Undo', onClick: () => updateMembership(last.id, { status: last.status }) } })
              }}
            >
              Close
            </Button>
          </>
        ) : undefined
      }
    >
      <div className="px-5 pt-5 pb-3">
        <Badge tone={STATUS[last.status].tone} dot>
          {STATUS[last.status].label}
        </Badge>
        <div className="mt-4 flex items-baseline gap-2">
          <span className="text-4xl font-normal text-fg tabular">{left}</span>
          <span className="text-base text-muted">of {type.visits} visits left</span>
        </div>
        <Meter value={last.used} max={type.visits} tone="accent" className="mt-3" />
      </div>
      <div className="px-5 py-2">
        <DetailRow label="Client">
          {client ? (
            <button type="button" className="hover:underline underline-offset-4" onClick={() => openClient(client.id)}>
              {client.name}
            </button>
          ) : (
            '—'
          )}
        </DetailRow>
        <DetailRow label="Covers">{type.includes}</DetailRow>
        <DetailRow label="Sold">{formatDate(last.soldAt)}</DetailRow>
        <DetailRow label="Valid until">{formatDate(last.validUntil)}</DetailRow>
        <DetailRow label="Paid">
          <Money value={type.price} />
        </DetailRow>
      </div>
      <p className="px-5 pt-2 pb-5 text-sm text-muted">Visits are written off automatically when the client checks out with a covered service.</p>
    </Sheet>
  )
}

function NewTypeModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const addMembershipType = useRegister((s) => s.addMembershipType)
  const [name, setName] = useState('')
  const [picked, setPicked] = useState<string[]>([])
  const [visits, setVisits] = useState('5')
  const [days, setDays] = useState('60')
  const [price, setPrice] = useState('')
  const [freeze, setFreeze] = useState(true)
  const fullPrice = services.filter((s) => picked.includes(s.id)).reduce((m, s) => Math.max(m, s.price), 0) * (Number(visits) || 0)
  const valid = name.trim() && picked.length && Number(visits) > 0 && Number(days) > 0 && Number(price) > 0

  return (
    <Modal
      open={open}
      onOpenChange={(o) => !o && onClose()}
      title="New membership type"
      size="lg"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            disabled={!valid}
            onClick={() => {
              addMembershipType({
                id: `mt${Date.now()}`,
                name: name.trim(),
                includes: services.filter((s) => picked.includes(s.id)).map((s) => s.name).join(', '),
                visits: Number(visits),
                validDays: Number(days),
                price: Number(price),
                fullPrice: Math.max(fullPrice, Number(price)),
                freeze,
                serviceIds: picked,
              })
              onClose()
              toast.success(`“${name.trim()}” is ready to sell`)
            }}
          >
            Create type
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-5">
        <Field label="Name" hint="Clients see this on the receipt and in reminders.">
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Pedicure ×4" autoFocus />
        </Field>
        <Field label="Covered services">
          <div className="flex flex-col gap-3 rounded-xl bg-fill p-3">
            {SERVICE_CATEGORIES.map((cat) => (
              <div key={cat}>
                <div className="mb-1.5 text-xs font-medium text-faint">{cat}</div>
                <div className="flex flex-wrap gap-1.5">
                  {services
                    .filter((s) => s.category === cat)
                    .map((s) => (
                      <Chip key={s.id} active={picked.includes(s.id)} onClick={() => setPicked((p) => (p.includes(s.id) ? p.filter((x) => x !== s.id) : [...p, s.id]))}>
                        {s.name}
                      </Chip>
                    ))}
                </div>
              </div>
            ))}
          </div>
        </Field>
        <div className="grid grid-cols-3 gap-3">
          <Field label="Visits">
            <Input value={visits} onChange={(e) => setVisits(e.target.value.replace(/\D/g, ''))} inputMode="numeric" />
          </Field>
          <Field label="Valid for">
            <Input value={days} onChange={(e) => setDays(e.target.value.replace(/\D/g, ''))} inputMode="numeric" suffix="days" />
          </Field>
          <Field label="Price" hint={fullPrice ? `${fullPrice} ${CURRENCY} one by one` : undefined}>
            <Input value={price} onChange={(e) => setPrice(e.target.value.replace(/\D/g, ''))} inputMode="numeric" suffix={CURRENCY} />
          </Field>
        </div>
        <Switch checked={freeze} onChange={setFreeze} label="Can be frozen" description="Clients can pause it once for up to 14 days, e.g. when travelling." />
      </div>
    </Modal>
  )
}

export function Memberships() {
  const memberships = useRegister((s) => s.memberships)
  const types = useRegister((s) => s.membershipTypes)
  const clients = useData((s) => s.clients)
  const navigate = useNavigate()
  const [view, setView] = useState<'sold' | 'types'>('sold')
  const [status, setStatus] = useState<MembershipStatus | 'all'>('active')
  const [openId, setOpenId] = useState<string | null>(null)
  const [newType, setNewType] = useState(false)
  const [formKey, setFormKey] = useState(0)

  const list = memberships.filter((m) => status === 'all' || m.status === status)
  const count = (s: MembershipStatus) => memberships.filter((m) => m.status === s).length

  return (
    <>
      <Toolbar>
        <Segmented
          value={view}
          onChange={setView}
          items={[
            { value: 'sold', label: 'Sold' },
            { value: 'types', label: 'Types' },
          ]}
        />
        <div className="ml-auto">
          {view === 'sold' ? (
            <Button variant="primary" icon={I.add} onClick={() => navigate('/pos?add=membership')}>
              Sell membership
            </Button>
          ) : (
            <Button variant="primary" icon={I.add} onClick={() => {
              setFormKey((k) => k + 1)
              setNewType(true)
            }}>
              New type
            </Button>
          )}
        </div>
      </Toolbar>

      {view === 'sold' ? (
        <>
          <div className="mb-4 flex flex-wrap gap-2">
            <Chip active={status === 'all'} onClick={() => setStatus('all')} count={memberships.length}>
              All
            </Chip>
            {(Object.keys(STATUS) as MembershipStatus[]).map((s) => (
              <Chip key={s} active={status === s} onClick={() => setStatus(s)} count={count(s)}>
                {STATUS[s].label}
              </Chip>
            ))}
          </div>
          <Card>
            {list.length ? (
              <Table>
                <THead>
                  <TH>Client</TH>
                  <TH>Membership</TH>
                  <TH>Used</TH>
                  <TH>Sold</TH>
                  <TH>Valid until</TH>
                  <TH>Status</TH>
                </THead>
                <tbody>
                  {list.map((m) => {
                    const type = types.find((t) => t.id === m.typeId)!
                    const client = clients.find((c) => c.id === m.clientId)
                    return (
                      <TR key={m.id} onClick={() => setOpenId(m.id)} selected={openId === m.id}>
                        <TD>
                          <span className="flex items-center gap-2.5">
                            <Avatar name={client?.name ?? '?'} size="sm" />
                            {client?.name}
                          </span>
                        </TD>
                        <TD>{type.name}</TD>
                        <TD>
                          <span className="flex items-center gap-3">
                            <Meter value={m.used} max={type.visits} tone={m.status === 'active' ? 'accent' : 'fg'} className="w-24" />
                            <span className="text-sm text-muted tabular">
                              {m.used} of {type.visits}
                            </span>
                          </span>
                        </TD>
                        <TD muted>{formatDate(m.soldAt)}</TD>
                        <TD muted>{formatDate(m.validUntil)}</TD>
                        <TD>
                          <Badge tone={STATUS[m.status].tone}>{STATUS[m.status].label}</Badge>
                        </TD>
                      </TR>
                    )
                  })}
                </tbody>
              </Table>
            ) : (
              <EmptyState icon={I.award} title="No memberships with this status" />
            )}
          </Card>
        </>
      ) : (
        <Card>
          <Table>
            <THead>
              <TH>Name</TH>
              <TH>Covers</TH>
              <TH align="right">Visits</TH>
              <TH align="right">Valid</TH>
              <TH align="right">Price</TH>
              <TH align="right">Client saves</TH>
              <TH align="right">Active</TH>
            </THead>
            <tbody>
              {types.map((t) => (
                <TR key={t.id}>
                  <TD className="font-medium">{t.name}</TD>
                  <TD muted className="max-w-[260px] truncate">
                    {t.includes}
                  </TD>
                  <TD align="right">{t.visits}</TD>
                  <TD align="right" muted>
                    {t.validDays} days
                  </TD>
                  <TD align="right">
                    <Money value={t.price} />
                  </TD>
                  <TD align="right">
                    <Money value={t.fullPrice - t.price} className={cn(t.fullPrice > t.price && 'text-positive')} />
                  </TD>
                  <TD align="right" muted>
                    {memberships.filter((m) => m.typeId === t.id && m.status === 'active').length}
                  </TD>
                </TR>
              ))}
            </tbody>
          </Table>
        </Card>
      )}
      <MembershipSheet id={openId} onClose={() => setOpenId(null)} />
      <NewTypeModal key={formKey} open={newType} onClose={() => setNewType(false)} />
    </>
  )
}
