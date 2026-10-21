import { useState } from 'react'
import { toast } from 'sonner'
import { I } from '@/components/icons'
import { Badge } from '@/components/ui/badge'
import { Button, IconButton } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Checkbox, Switch } from '@/components/ui/controls'
import { DatePicker } from '@/components/ui/date-picker'
import { Modal } from '@/components/ui/dialog'
import { Field, Input } from '@/components/ui/input'
import { Menu, MenuItem } from '@/components/ui/menu'
import { Money } from '@/components/ui/misc'
import { Select } from '@/components/ui/select'
import { TD, TH, THead, TR, Table } from '@/components/ui/table'
import { Segmented } from '@/components/ui/tabs'
import { formatDate } from '@/lib/format'
import { useData } from '@/lib/store'
import { TODAY, addDays } from '@/lib/time'
import { cn } from '@/lib/cn'
import { useSettingsForm } from '../parts-b/shared'
import { SaveBar, SettingsPage, SettingsRow, SettingsSection } from '../ui'

type Promo = {
  code: string
  kind: 'percent' | 'amount'
  value: number
  used: number
  limit: number | null
  until: Date
  scope: 'all' | 'services' | 'products'
  paused?: boolean
}

const PROMOS: Promo[] = [
  { code: 'NAVRUZ15', kind: 'percent', value: 15, used: 48, limit: 100, until: addDays(TODAY, -180), scope: 'services' },
  { code: 'COMEBACK20', kind: 'percent', value: 20, used: 7, limit: 40, until: addDays(TODAY, 12), scope: 'services' },
  { code: 'BRIDE2026', kind: 'amount', value: 200, used: 3, limit: null, until: addDays(TODAY, 70), scope: 'all' },
  { code: 'FIRSTVISIT', kind: 'percent', value: 10, used: 31, limit: null, until: addDays(TODAY, 120), scope: 'all' },
  { code: 'INSTA50', kind: 'amount', value: 50, used: 19, limit: 50, until: addDays(TODAY, 5), scope: 'services' },
]

const TIERS = [
  { name: 'Silver', from: 3000, rate: 5 },
  { name: 'Gold', from: 10000, rate: 7 },
  { name: 'Platinum', from: 25000, rate: 10 },
]

function randomCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  return Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
}

function PromoModal({ open, onClose, onCreate }: { open: boolean; onClose: () => void; onCreate: (p: Promo) => void }) {
  const [code, setCode] = useState('')
  const [kind, setKind] = useState<'percent' | 'amount'>('percent')
  const [value, setValue] = useState('10')
  const [until, setUntil] = useState(addDays(TODAY, 30))
  const [limit, setLimit] = useState('')
  const [scope, setScope] = useState<Promo['scope']>('services')
  const [wasOpen, setWasOpen] = useState(open)
  if (open !== wasOpen) {
    setWasOpen(open)
    if (open) {
      setCode('')
      setKind('percent')
      setValue('10')
      setUntil(addDays(TODAY, 30))
      setLimit('')
      setScope('services')
    }
  }
  const valid = code.trim().length >= 4 && Number(value) > 0

  return (
    <Modal
      open={open}
      onOpenChange={(o) => !o && onClose()}
      title="New promo code"
      description="Clients enter it at the register or on the booking page."
      size="md"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            disabled={!valid}
            onClick={() =>
              onCreate({ code: code.trim().toUpperCase(), kind, value: Number(value), used: 0, limit: limit ? Number(limit) : null, until, scope })
            }
          >
            Create code
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <Field label="Code">
          <div className="flex gap-2">
            <Input value={code} onChange={(e) => setCode(e.target.value.toUpperCase().replace(/\s/g, ''))} placeholder="AUTUMN10" autoFocus className="flex-1" />
            <Button variant="secondary" onClick={() => setCode(randomCode())}>
              Generate
            </Button>
          </div>
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Discount">
            <div className="flex gap-2">
              <Segmented
                value={kind}
                onChange={setKind}
                items={[
                  { value: 'percent', label: '%' },
                  { value: 'amount', label: 'TJS' },
                ]}
              />
              <Input inputMode="numeric" value={value} onChange={(e) => setValue(e.target.value.replace(/\D/g, ''))} className="flex-1" />
            </div>
          </Field>
          <Field label="Valid until">
            <DatePicker value={until} onChange={setUntil} />
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Applies to">
            <Select
              value={scope}
              onChange={setScope}
              options={[
                { value: 'all', label: 'Everything' },
                { value: 'services', label: 'Services only' },
                { value: 'products', label: 'Products only' },
              ]}
            />
          </Field>
          <Field label="Uses" optional hint="Leave empty for no limit">
            <Input inputMode="numeric" value={limit} onChange={(e) => setLimit(e.target.value.replace(/\D/g, ''))} placeholder="No limit" />
          </Field>
        </div>
      </div>
    </Modal>
  )
}

export default function LoyaltySettings() {
  const clients = useData((s) => s.clients)
  const form = useSettingsForm({
    enabled: true,
    rate: '5',
    maxShare: '30',
    expiry: '365',
    services: true,
    products: true,
    memberships: false,
    welcome: '50',
    birthday: '100',
    referFriend: '50',
    referrer: '100',
  })
  const [promos, setPromos] = useState(PROMOS)
  const [creating, setCreating] = useState(false)
  const v = form.value
  const off = !v.enabled
  const tierCount = (from: number, next?: number) => clients.filter((c) => c.totalSpent >= from && (!next || c.totalSpent < next)).length

  return (
    <SettingsPage
      title="Bonuses & loyalty"
      description="Bonus points, referrals and promo codes. Applied automatically at the register by phone number."
      actions={
        <Button variant="primary" icon={I.add} onClick={() => setCreating(true)}>
          New promo code
        </Button>
      }
    >
      <SettingsSection title="Bonus program">
        <SettingsRow label="Bonus points" description="Clients earn points on paid receipts and spend them like money. 1 point = 1 TJS.">
          <Switch aria-label="Bonus points" checked={v.enabled} onChange={(x) => form.set('enabled', x)} />
        </SettingsRow>
        <div className={cn('transition-opacity duration-200', off && 'pointer-events-none opacity-45')}>
          <SettingsRow label="Earn rate" description="Share of the paid amount returned as points.">
            <Input className="max-w-40" inputMode="numeric" value={v.rate} onChange={(e) => form.set('rate', e.target.value.replace(/\D/g, ''))} suffix="%" />
          </SettingsRow>
          <SettingsRow label="Pay with points" description="Most of a receipt that points can cover.">
            <Input className="max-w-40" inputMode="numeric" value={v.maxShare} onChange={(e) => form.set('maxShare', e.target.value.replace(/\D/g, ''))} suffix="%" />
          </SettingsRow>
          <SettingsRow label="Points expire" description="Counted from the day they were earned.">
            <Select
              value={v.expiry}
              onChange={(x) => form.set('expiry', x)}
              className="max-w-56"
              options={[
                { value: '90', label: 'After 3 months' },
                { value: '180', label: 'After 6 months' },
                { value: '365', label: 'After 1 year' },
                { value: 'never', label: 'Never' },
              ]}
            />
          </SettingsRow>
          <SettingsRow label="Earn points for">
            <div className="flex flex-col gap-2.5">
              <Checkbox checked={v.services} onChange={(x) => form.set('services', x)} label="Services" />
              <Checkbox checked={v.products} onChange={(x) => form.set('products', x)} label="Products" />
              <Checkbox checked={v.memberships} onChange={(x) => form.set('memberships', x)} label="Memberships and certificates" />
            </div>
          </SettingsRow>
          <SettingsRow label="Welcome points" description="Added after the first paid visit.">
            <Input className="max-w-40" inputMode="numeric" value={v.welcome} onChange={(e) => form.set('welcome', e.target.value.replace(/\D/g, ''))} suffix="TJS" />
          </SettingsRow>
          <SettingsRow label="Birthday points" description="Sent with the birthday greeting, valid for 7 days.">
            <Input className="max-w-40" inputMode="numeric" value={v.birthday} onChange={(e) => form.set('birthday', e.target.value.replace(/\D/g, ''))} suffix="TJS" />
          </SettingsRow>
        </div>
      </SettingsSection>

      <SettingsSection title="Refer a friend" description="Each client gets a personal link in Telegram to share.">
        <SettingsRow label="Friend gets" description="On their first paid visit.">
          <Input className="max-w-40" inputMode="numeric" value={v.referFriend} onChange={(e) => form.set('referFriend', e.target.value.replace(/\D/g, ''))} suffix="TJS" />
        </SettingsRow>
        <SettingsRow label="Your client gets" description="After the friend’s visit is paid.">
          <Input className="max-w-40" inputMode="numeric" value={v.referrer} onChange={(e) => form.set('referrer', e.target.value.replace(/\D/g, ''))} suffix="TJS" />
        </SettingsRow>
      </SettingsSection>

      <SettingsSection title="Client tiers" description="Higher earn rate for clients who spend more in total. Tiers update overnight.">
        <Card className="mt-4 overflow-hidden">
          <Table>
            <THead>
              <TH>Tier</TH>
              <TH align="right">From total spent</TH>
              <TH align="right">Earn rate</TH>
              <TH align="right">Clients</TH>
            </THead>
            <tbody>
              {TIERS.map((t, i) => (
                <TR key={t.name}>
                  <TD>{t.name}</TD>
                  <TD align="right">
                    <Money value={t.from} />
                  </TD>
                  <TD align="right">{t.rate}%</TD>
                  <TD align="right" muted>
                    {tierCount(t.from, TIERS[i + 1]?.from)}
                  </TD>
                </TR>
              ))}
            </tbody>
          </Table>
        </Card>
      </SettingsSection>

      <SettingsSection title="Promo codes" description="One code per offer. Discount offers from Campaigns appear here too.">
        <Card className="mt-4 overflow-hidden">
          <Table>
            <THead>
              <TH>Code</TH>
              <TH>Discount</TH>
              <TH align="right">Used</TH>
              <TH>Valid until</TH>
              <TH>Status</TH>
              <TH />
            </THead>
            <tbody>
              {promos.map((p) => {
                const expired = p.until < TODAY
                const exhausted = p.limit != null && p.used >= p.limit
                const status = p.paused ? { l: 'Paused', t: 'neutral' as const } : expired ? { l: 'Expired', t: 'neutral' as const } : exhausted ? { l: 'Used up', t: 'neutral' as const } : { l: 'Active', t: 'positive' as const }
                return (
                  <TR key={p.code}>
                    <TD className="font-medium tabular">{p.code}</TD>
                    <TD>
                      {p.kind === 'percent' ? `${p.value}%` : <Money value={p.value} />}
                      <span className="text-muted"> · {p.scope === 'all' ? 'everything' : p.scope}</span>
                    </TD>
                    <TD align="right" muted>
                      {p.used}
                      {p.limit != null && ` of ${p.limit}`}
                    </TD>
                    <TD muted>{formatDate(p.until)}</TD>
                    <TD>
                      <Badge tone={status.t}>
                        {status.l}
                      </Badge>
                    </TD>
                    <TD align="right">
                      <Menu align="end" trigger={<IconButton icon={I.more} label="Code actions" size="sm" tooltip={false} />}>
                        <MenuItem icon={I.copy} onClick={() => toast.success(`${p.code} copied`)}>
                          Copy code
                        </MenuItem>
                        <MenuItem
                          icon={p.paused ? I.refresh : I.clock}
                          onClick={() => setPromos((list) => list.map((x) => (x.code === p.code ? { ...x, paused: !x.paused } : x)))}
                        >
                          {p.paused ? 'Resume' : 'Pause'}
                        </MenuItem>
                        <MenuItem
                          icon={I.delete}
                          danger
                          onClick={() => {
                            setPromos((list) => list.filter((x) => x.code !== p.code))
                            toast(`${p.code} deleted`, { action: { label: 'Undo', onClick: () => setPromos((list) => [...list, p]) } })
                          }}
                        >
                          Delete
                        </MenuItem>
                      </Menu>
                    </TD>
                  </TR>
                )
              })}
            </tbody>
          </Table>
        </Card>
      </SettingsSection>

      <SaveBar dirty={form.dirty} onSave={form.save} onDiscard={form.discard} />

      <PromoModal
        open={creating}
        onClose={() => setCreating(false)}
        onCreate={(p) => {
          setPromos((list) => [p, ...list])
          setCreating(false)
          toast.success(`${p.code} is live`, { description: 'Works at the register and on the booking page.' })
        }}
      />
    </SettingsPage>
  )
}
