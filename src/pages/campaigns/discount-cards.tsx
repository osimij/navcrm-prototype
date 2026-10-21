import { useState } from 'react'
import { Link } from 'react-router'
import { toast } from 'sonner'
import { ClientPicker, ClientRow } from '@/components/client-picker'
import { I, Icon } from '@/components/icons'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardHeader } from '@/components/ui/card'
import { Modal } from '@/components/ui/dialog'
import { Field, PhoneInput } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Segmented } from '@/components/ui/tabs'
import { TD, TH, THead, TR, Table } from '@/components/ui/table'
import type { Client } from '@/data/clients'
import { formatDate, formatNumber } from '@/lib/format'
import { useData } from '@/lib/store'
import { TODAY } from '@/lib/time'
import { SEGMENTS, segmentById, type SegmentId } from './data'
import { useCampaigns } from './store'

/** Which card applies to a client at the register: personal first, then the best group card. */
function cardFor(c: Client) {
  if (c.id === 'c1') return { name: 'Personal card', percent: 15 }
  if (c.category === 'vip') return { name: 'VIP card', percent: 10 }
  if (c.category === 'regular') return { name: 'Regular card', percent: 5 }
  return null
}

function CheckCard() {
  const clients = useData((s) => s.clients)
  const [phone, setPhone] = useState('')
  const client = phone.length === 9 ? clients.find((c) => c.phone.endsWith(phone)) : undefined
  const card = client ? cardFor(client) : null

  return (
    <Card className="mb-6 p-5">
      <div className="grid gap-5 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] sm:items-center">
        <div>
          <h3 className="text-base font-medium text-fg">Check a card</h3>
          <p className="mt-1 text-sm text-muted">
            Cards are tied to the phone number. The register applies the discount on its own when it finds the client, so there’s nothing to scan.
          </p>
        </div>
        <div className="flex flex-col gap-3">
          <PhoneInput value={phone} onChange={setPhone} />
          {phone.length === 9 &&
            (client ? (
              <div className="flex items-center justify-between gap-3 rounded-xl bg-fill px-3.5 py-2.5">
                <ClientRow client={client} />
                {card ? (
                  <Badge tone="positive">
                    {card.name} · −{card.percent}%
                  </Badge>
                ) : (
                  <Badge>No card</Badge>
                )}
              </div>
            ) : (
              <p className="px-1 text-sm text-muted">No client with this number.</p>
            ))}
        </div>
      </div>
    </Card>
  )
}

export function IssueCards({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const clients = useData((s) => s.clients)
  const addCard = useCampaigns((s) => s.addCard)
  const [mode, setMode] = useState<'segment' | 'all' | 'pick'>('segment')
  const [segmentId, setSegmentId] = useState<SegmentId>('vip')
  const [picked, setPicked] = useState<string[]>([])
  const [percent, setPercent] = useState('10')

  const holders =
    mode === 'all' ? clients.filter((c) => !c.archived).length : mode === 'segment' ? clients.filter(segmentById[segmentId].match).length : picked.length
  const target = mode === 'all' ? 'All clients' : mode === 'segment' ? segmentById[segmentId].name : `${picked.length} picked clients`

  function issue() {
    addCard({ id: `d${Date.now()}`, name: `${target} card`, target, holders, percent: Number(percent), issued: TODAY, uses: 0 })
    onOpenChange(false)
    toast.success(`${formatNumber(holders)} cards issued at −${percent}%`, { description: 'They work at the register from now on.' })
  }

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title="Issue discount cards"
      footer={
        <>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={issue} disabled={!holders}>
            Issue {formatNumber(holders)} cards
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-5">
        <Segmented
          value={mode}
          onChange={setMode}
          items={[
            { value: 'segment', label: 'Segment' },
            { value: 'all', label: 'All clients' },
            { value: 'pick', label: 'Pick clients' },
          ]}
        />
        {mode === 'segment' && (
          <Field label="Segment">
            <Select value={segmentId} onChange={setSegmentId} options={SEGMENTS.map((s) => ({ value: s.id, label: s.name, hint: s.description }))} />
          </Field>
        )}
        {mode === 'pick' && (
          <Field label="Clients" hint={`${picked.length} selected`}>
            <ClientPicker value={null} onChange={(id) => id && !picked.includes(id) && setPicked([...picked, id])} placeholder="Add a client by name or phone" />
            {picked.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {picked.map((id) => {
                  const c = clients.find((x) => x.id === id)
                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() => setPicked(picked.filter((p) => p !== id))}
                      className="press inline-flex h-7 items-center gap-1.5 rounded-full bg-fill pr-2 pl-3 text-sm text-fg hover:bg-fill-hover"
                    >
                      {c?.name}
                      <Icon icon={I.close} size={12} className="text-faint" />
                    </button>
                  )
                })}
              </div>
            )}
          </Field>
        )}
        <Field label="Discount">
          <Segmented fill value={percent} onChange={setPercent} items={['5', '10', '15', '20'].map((p) => ({ value: p, label: `${p}%` }))} />
        </Field>
        <p className="text-sm text-muted">If a client holds several cards, the register uses the biggest discount. Cards don’t stack with promo codes.</p>
      </div>
    </Modal>
  )
}

export function DiscountCards() {
  const cards = useCampaigns((s) => s.cards)
  return (
    <>
      <CheckCard />
      <Card className="overflow-hidden">
        <CardHeader title="Issued cards" description="Applied automatically at the register by phone number" />
        <Table>
          <THead>
            <TH>Card</TH>
            <TH align="right">Discount</TH>
            <TH align="right">Holders</TH>
            <TH>Issued</TH>
            <TH align="right">Used</TH>
          </THead>
          <tbody>
            {cards.map((c) => (
              <TR key={c.id}>
                <TD>
                  <div className="text-base text-fg">{c.name}</div>
                  <div className="text-sm text-muted">{c.target}</div>
                </TD>
                <TD align="right">−{c.percent}%</TD>
                <TD align="right">{formatNumber(c.holders)}</TD>
                <TD muted>{formatDate(c.issued)}</TD>
                <TD align="right" muted>
                  {c.uses ? `${formatNumber(c.uses)} times` : 'Not yet'}
                </TD>
              </TR>
            ))}
          </tbody>
        </Table>
      </Card>

      <Link
        to="/settings/loyalty"
        className="press mt-6 flex items-center gap-4 rounded-2xl bg-fill p-5 hover:bg-fill-hover"
      >
        <span className="grid size-10 shrink-0 place-items-center rounded-full bg-surface text-muted ring-1 ring-border">
          <Icon icon={I.gift} size={20} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-base font-medium text-fg">Bonuses and “bring a friend”</span>
          <span className="block text-sm text-muted">Cashback in bonuses, birthday and welcome bonuses, referral rewards. Set up in Settings.</span>
        </span>
        <Icon icon={I.chevronRight} size={18} className="text-faint" />
      </Link>
    </>
  )
}
