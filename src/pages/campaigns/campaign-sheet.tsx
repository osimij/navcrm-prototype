import { useNavigate } from 'react-router'
import { toast } from 'sonner'
import { I, Icon } from '@/components/icons'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { DetailRow, Sheet } from '@/components/ui/dialog'
import { Meter, Money } from '@/components/ui/misc'
import { clients } from '@/data/clients'
import { formatDate, formatDayTime, formatNumber } from '@/lib/format'
import { channelById, fillMessage, STATUS_LABEL, STATUS_TONE, type Campaign, type ChannelId } from './data'
import { MessageBubble } from './preview'
import { useCampaigns } from './store'

export function ChannelIcons({ channels, size = 15 }: { channels: ChannelId[]; size?: number }) {
  return (
    <span className="flex items-center gap-1 text-muted" aria-label={channels.map((c) => channelById[c].name).join(', then ')}>
      {channels.map((c, i) => (
        <span key={c} className="flex items-center gap-1">
          {i > 0 && <span className="text-[10px] text-disabled">›</span>}
          <Icon icon={channelById[c].icon} size={size} />
        </span>
      ))}
    </span>
  )
}

const pct = (n: number, of: number) => (of ? Math.round((n / of) * 100) : 0)

export function CampaignSheet({ campaign, onClose }: { campaign: Campaign | null; onClose: () => void }) {
  const navigate = useNavigate()
  const setStatus = useCampaigns((s) => s.setStatus)
  const c = campaign
  const notSent = c && (c.status === 'draft' || c.status === 'scheduled' || c.status === 'failed' || c.status === 'sending')
  const sample = clients[0]
  const funnel = c
    ? [
        { label: 'Sent', value: c.recipients },
        { label: 'Delivered', value: c.delivered },
        { label: 'Booked a visit', value: c.booked },
        { label: 'Came back within 14 days', value: c.cameBack },
      ]
    : []

  return (
    <Sheet
      open={!!c}
      onOpenChange={(o) => !o && onClose()}
      eyebrow="Campaign"
      title={c?.name}
      width="lg"
      footer={
        c && (
          <>
            {c.status === 'draft' || c.status === 'failed' ? (
              <Button variant="primary" onClick={() => navigate(`/campaigns/new?draft=${c.id}`)}>
                {c.status === 'failed' ? 'Fix and resend' : 'Continue editing'}
              </Button>
            ) : (
              <Button variant="secondary" icon={I.copy} onClick={() => navigate(`/campaigns/new?from=${c.id}`)}>
                Duplicate
              </Button>
            )}
            {(c.status === 'sending' || c.status === 'scheduled') && (
              <Button
                variant="danger"
                className="ml-auto"
                onClick={() => {
                  setStatus(c.id, 'stopped')
                  toast(c.status === 'scheduled' ? 'Schedule cancelled' : 'Campaign stopped', {
                    description: 'Messages already delivered stay with clients.',
                    action: { label: 'Undo', onClick: () => setStatus(c.id, c.status) },
                  })
                }}
              >
                {c.status === 'scheduled' ? 'Cancel schedule' : 'Stop sending'}
              </Button>
            )}
          </>
        )
      }
    >
      {c && (
        <div className="flex flex-col gap-6 p-5">
          <div className="flex flex-wrap items-center gap-2 text-sm text-muted">
            <Badge tone={STATUS_TONE[c.status]} dot>
              {STATUS_LABEL[c.status]}
            </Badge>
            <span>{c.audienceLabel}</span>
            <span className="text-faint">·</span>
            <span>{formatNumber(c.recipients)} clients</span>
          </div>

          {c.note && (
            <div className="flex gap-2.5 rounded-xl bg-fill px-3.5 py-3 text-sm text-muted">
              <Icon icon={I.info} size={16} className="mt-px shrink-0" />
              {c.note}
            </div>
          )}

          {notSent ? (
            <div className="rounded-2xl bg-fill p-4">
              <div className="text-sm text-muted">{c.status === 'scheduled' ? 'Goes out' : c.status === 'sending' ? 'Going out now' : 'Not sent yet'}</div>
              <div className="mt-1 text-xl text-fg">
                {c.status === 'scheduled' && c.date ? formatDayTime(c.date) : c.status === 'sending' ? `${formatNumber(c.recipients)} clients` : `${formatNumber(c.recipients)} clients ready`}
              </div>
              {c.status === 'sending' && <div className="mt-1 text-sm text-muted">Results appear as clients book. We count returns for 14 days.</div>}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-2xl bg-fill p-4">
                  <div className="text-sm text-muted">Revenue from returning clients</div>
                  <div className="mt-1 text-2xl text-fg">
                    <Money value={c.revenue} />
                  </div>
                </div>
                <div className="rounded-2xl bg-fill p-4">
                  <div className="text-sm text-muted">Spent on messages</div>
                  <div className="mt-1 text-2xl text-fg">
                    <Money value={c.cost} decimals />
                  </div>
                </div>
              </div>

              <section>
                <h3 className="mb-3 text-base font-medium text-fg">What happened</h3>
                <ul className="flex flex-col gap-3.5">
                  {funnel.map((f, i) => (
                    <li key={f.label}>
                      <div className="mb-1.5 flex items-baseline justify-between text-base">
                        <span className="text-fg">{f.label}</span>
                        <span className="tabular text-fg">
                          {formatNumber(f.value)} <span className="text-sm text-faint">{i > 0 ? `${pct(f.value, c.recipients)}%` : ''}</span>
                        </span>
                      </div>
                      <Meter value={f.value} max={c.recipients} tone={i === funnel.length - 1 ? 'accent' : 'fg'} />
                    </li>
                  ))}
                </ul>
                <p className="mt-3 text-sm text-muted">A client counts as back if they had a visit within 14 days after the message.</p>
              </section>
            </>
          )}

          <section>
            <h3 className="mb-1 text-base font-medium text-fg">Delivery</h3>
            <div className="divide-y divide-border">
              {c.channels.map((ch) => {
                const n = c.byChannel[ch] ?? 0
                return (
                  <DetailRow
                    key={ch}
                    label={
                      <span className="flex items-center gap-2">
                        <Icon icon={channelById[ch].icon} size={16} />
                        {channelById[ch].name}
                      </span>
                    }
                  >
                    <span className="tabular">{formatNumber(n)} messages</span>
                    <span className="ml-3 inline-block w-20 text-right">
                      {channelById[ch].price ? <Money value={n * channelById[ch].price} decimals /> : <span className="text-sm text-faint">Free</span>}
                    </span>
                  </DetailRow>
                )
              })}
              {c.date && <DetailRow label={c.status === 'scheduled' ? 'Scheduled for' : 'Sent'}>{formatDate(c.date, { weekday: true })}</DetailRow>}
              {c.promo && (
                <DetailRow label="Promo code">
                  <span className="font-mono text-sm">{c.promo.code}</span> · −{c.promo.percent}% for {c.promo.days} days
                </DetailRow>
              )}
            </div>
          </section>

          <section>
            <h3 className="mb-3 text-base font-medium text-fg">Message</h3>
            <div className="rounded-2xl bg-fill p-3">
              <MessageBubble compact text={fillMessage(c.message, sample, c.promo && { code: c.promo.code, percent: c.promo.percent, until: new Date() })} code={c.promo?.code} />
            </div>
            <p className="mt-2 text-sm text-faint">Shown as {sample.firstName} sees it.</p>
          </section>
        </div>
      )}
    </Sheet>
  )
}
