import { useState } from 'react'
import { useNavigate } from 'react-router'
import { toast } from 'sonner'
import { I, Icon } from '@/components/icons'
import { Button } from '@/components/ui/button'
import { Modal } from '@/components/ui/dialog'
import { Field } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Segmented } from '@/components/ui/tabs'
import { formatDate, formatNumber } from '@/lib/format'
import { useData } from '@/lib/store'
import { TODAY, addDays } from '@/lib/time'
import { SEGMENTS, TEMPLATES, resolveAudience, segmentById, type SegmentId } from './data'
import { useCampaigns } from './store'

const PREFIX: Record<SegmentId, string> = { lost60: 'BACK', birthday: 'BDAY', vip: 'VIP', regular: 'THANKS', new: 'SECOND', lost: 'MISSYOU' }

/**
 * The shortcut for the most common campaign: pick who, how much, how long.
 * It creates a promo code and a campaign draft, then opens the draft.
 */
export function DiscountOffer({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const clients = useData((s) => s.clients)
  const upsert = useCampaigns((s) => s.upsert)
  const navigate = useNavigate()
  const [segmentId, setSegmentId] = useState<SegmentId>('lost60')
  const [percent, setPercent] = useState('15')
  const [days, setDays] = useState('14')

  const { recipients, noConsent, recent } = resolveAudience(clients, { mode: 'segment', segmentId, picked: [] })
  const code = `${PREFIX[segmentId]}${percent}`
  const until = addDays(TODAY, Number(days))

  function create() {
    const id = `k${Date.now()}`
    upsert({
      id,
      name: `${segmentById[segmentId].name}: −${percent}%`,
      status: 'draft',
      audienceLabel: segmentById[segmentId].name,
      segmentId,
      recipients: recipients.length,
      channels: ['telegram', 'push', 'sms'],
      byChannel: {},
      date: null,
      delivered: 0,
      booked: 0,
      cameBack: 0,
      revenue: 0,
      cost: 0,
      message: `${TEMPLATES[segmentId]} Your code {promo_code} gives −${percent}% until ${formatDate(until)}.`,
      promo: { code, percent: Number(percent), days: Number(days) },
    })
    onOpenChange(false)
    toast.success(`Promo code ${code} created`, { description: 'The campaign draft is ready to review.' })
    navigate(`/campaigns/new?draft=${id}`)
  }

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title="Discount offer"
      description="A quick way to invite a group back with a discount."
      footer={
        <>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={create} disabled={!recipients.length}>
            Create offer
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-5">
        <Field label="Who gets it">
          <Select
            value={segmentId}
            onChange={setSegmentId}
            options={SEGMENTS.map((s) => ({ value: s.id, label: s.name, hint: s.description }))}
          />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Discount">
            <Segmented
              fill
              value={percent}
              onChange={setPercent}
              items={['10', '15', '20', '25'].map((p) => ({ value: p, label: `${p}%` }))}
            />
          </Field>
          <Field label="Valid for">
            <Select
              value={days}
              onChange={setDays}
              options={[
                { value: '7', label: '7 days' },
                { value: '14', label: '14 days' },
                { value: '30', label: '30 days' },
              ]}
            />
          </Field>
        </div>

        <div className="rounded-xl bg-fill p-4">
          <div className="flex items-baseline justify-between gap-3">
            <span className="text-base text-fg">
              Goes to <span className="font-medium tabular">{formatNumber(recipients.length)}</span> clients
            </span>
            <span className="font-mono text-sm text-muted">{code}</span>
          </div>
          <ul className="mt-3 flex flex-col gap-1.5 text-sm text-muted">
            <li className="flex gap-2">
              <Icon icon={I.discount} size={16} className="mt-px shrink-0" />
              Creates promo code {code}: −{percent}% until {formatDate(until)}, once per client.
            </li>
            <li className="flex gap-2">
              <Icon icon={I.campaigns} size={16} className="mt-px shrink-0" />
              Saves a campaign draft you can review before anything is sent.
            </li>
            <li className="flex gap-2">
              <Icon icon={I.shield} size={16} className="mt-px shrink-0" />
              Skips {noConsent.length} without marketing consent and {recent.length} messaged in the last 7 days.
            </li>
          </ul>
        </div>
      </div>
    </Modal>
  )
}
