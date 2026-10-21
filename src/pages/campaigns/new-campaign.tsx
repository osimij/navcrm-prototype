import { ImageAdd01Icon } from '@hugeicons/core-free-icons'
import { useMemo, useRef, useState } from 'react'
import { text as translate } from '@/i18n'
import { Link, useNavigate, useSearchParams } from 'react-router'
import { toast } from 'sonner'
import { ClientPicker } from '@/components/client-picker'
import { I, Icon } from '@/components/icons'
import { Button, IconButton } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { StatCard } from '@/components/ui/stat-card'
import { Switch } from '@/components/ui/controls'
import { DatePicker } from '@/components/ui/date-picker'
import { DetailRow } from '@/components/ui/dialog'
import { Field, Input, Textarea } from '@/components/ui/input'
import { Money } from '@/components/ui/misc'
import { Page, PageHeader } from '@/components/ui/page'
import { Select } from '@/components/ui/select'
import { Segmented } from '@/components/ui/tabs'
import { cn } from '@/lib/cn'
import { formatDate, formatDayTime, formatNumber, plural } from '@/lib/format'
import { useData } from '@/lib/store'
import { NOW, TODAY, addDays, at } from '@/lib/time'
import {
  CHANNELS,
  SEGMENTS,
  TEMPLATES,
  VARIABLES,
  fillMessage,
  resolveAudience,
  routeMessages,
  segmentById,
  smsParts,
  type Audience,
  type ChannelId,
  type SegmentId,
} from './data'
import { MessageBubble, PhonePreview } from './preview'
import { useCampaigns } from './store'

const STEPS = ['Audience', 'Message', 'Channels & time', 'Review']
const SEGMENT_IDS = SEGMENTS.map((s) => s.id) as string[]
const PREFIX: Record<SegmentId, string> = { lost60: 'BACK', birthday: 'BDAY', vip: 'VIP', regular: 'THANKS', new: 'SECOND', lost: 'MISSYOU' }

function sendTimes() {
  const out: { value: string; label: string }[] = []
  for (let m = 9 * 60; m <= 20 * 60 + 45; m += 15) {
    const t = `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`
    out.push({ value: t, label: t })
  }
  return out
}

type Init = {
  id: string | null
  name: string
  audience: Audience
  message: string
  promo: { on: boolean; percent: string; days: string }
  channels: Record<ChannelId, boolean>
  step: number
}

function useInitial(): Init {
  const [params] = useSearchParams()
  return useState<Init>(() => {
    const campaigns = useCampaigns.getState().campaigns
    const source = campaigns.find((c) => c.id === (params.get('draft') ?? params.get('from')))
    const seg = params.get('segment')
    const segmentId = (source?.segmentId ?? (seg && SEGMENT_IDS.includes(seg) ? seg : 'lost60')) as SegmentId
    const channels = { telegram: true, push: true, sms: true, whatsapp: false }
    if (source) {
      for (const k of Object.keys(channels) as ChannelId[]) channels[k] = source.channels.includes(k)
      return {
        id: params.get('draft') ? source.id : null,
        name: params.get('from') ? `${source.name} (copy)` : source.name,
        audience: { mode: source.segmentId ? 'segment' : 'all', segmentId, picked: [] },
        message: source.message,
        promo: { on: !!source.promo, percent: String(source.promo?.percent ?? 15), days: String(source.promo?.days ?? 14) },
        channels,
        step: params.get('draft') ? 1 : 0,
      }
    }
    return {
      id: null,
      name: segmentById[segmentId].name,
      audience: { mode: 'segment', segmentId, picked: [] },
      message: TEMPLATES[segmentId],
      promo: { on: false, percent: '15', days: '14' },
      channels,
      step: 0,
    }
  })[0]
}

export function NewCampaign() {
  const init = useInitial()
  const navigate = useNavigate()
  const clients = useData((s) => s.clients)
  const upsert = useCampaigns((s) => s.upsert)
  const textRef = useRef<HTMLTextAreaElement>(null)

  const [step, setStep] = useState(init.step)
  const [reached, setReached] = useState(init.step)
  const [name, setName] = useState(() => translate(init.name))
  const [audience, setAudience] = useState<Audience>(init.audience)
  const [message, setMessage] = useState(() => translate(init.message))
  const [promo, setPromo] = useState(init.promo)
  const [image, setImage] = useState(false)
  const [channels, setChannels] = useState(init.channels)
  const [timing, setTiming] = useState<'now' | 'schedule'>('now')
  const [date, setDate] = useState(addDays(TODAY, 1))
  const [time, setTime] = useState('10:00')
  const [sample, setSample] = useState(0)

  const { matched, noConsent, recent, recipients } = useMemo(() => resolveAudience(clients, audience), [clients, audience])
  const code = `${audience.mode === 'segment' ? PREFIX[audience.segmentId] : 'HELLO'}${promo.percent}`
  const until = addDays(TODAY, Number(promo.days))
  const fullMessage = promo.on && !message.includes('{promo_code}') ? `${message}\nYour code {promo_code}: −${promo.percent}% until ${formatDate(until)}.` : message
  const previewClients = recipients.length ? recipients.slice(0, 5) : clients.slice(0, 1)
  const previewClient = previewClients[sample % previewClients.length]
  const previewText = fillMessage(fullMessage, previewClient, promo.on ? { code, percent: Number(promo.percent), until } : undefined)
  const parts = smsParts(previewText)
  const route = routeMessages(recipients, channels, parts)
  const scheduledAt = at(date, time)
  const audienceLabel =
    audience.mode === 'all' ? 'All clients' : audience.mode === 'segment' ? segmentById[audience.segmentId].name : `${audience.picked.length} picked clients`

  const valid = [name.trim().length > 0 && recipients.length > 0, message.trim().length > 0, Object.values(channels).some(Boolean), true]

  function go(i: number) {
    setStep(i)
    setReached((r) => Math.max(r, i))
  }

  function insert(token: string) {
    const el = textRef.current
    const start = el?.selectionStart ?? message.length
    const end = el?.selectionEnd ?? message.length
    const next = message.slice(0, start) + token + message.slice(end)
    setMessage(next)
    requestAnimationFrame(() => {
      el?.focus()
      el?.setSelectionRange(start + token.length, start + token.length)
    })
  }

  function save(status: 'draft' | 'sending' | 'scheduled') {
    upsert({
      id: init.id ?? `k${Date.now()}`,
      name: name.trim() || audienceLabel,
      status,
      audienceLabel,
      segmentId: audience.mode === 'segment' ? audience.segmentId : undefined,
      recipients: recipients.length,
      channels: CHANNELS.filter((c) => channels[c.id]).map((c) => c.id),
      byChannel: status === 'draft' ? {} : route.counts,
      date: status === 'draft' ? null : status === 'scheduled' ? scheduledAt : NOW,
      delivered: 0,
      booked: 0,
      cameBack: 0,
      revenue: 0,
      cost: status === 'draft' ? 0 : route.cost,
      message: fullMessage,
      promo: promo.on ? { code, percent: Number(promo.percent), days: Number(promo.days) } : undefined,
    })
    if (status === 'draft') toast('Draft saved')
    else if (status === 'scheduled') toast.success(`Scheduled for ${formatDayTime(scheduledAt)}`, { description: `${plural(recipients.length, 'client')} will get it.` })
    else toast.success(`Sending to ${plural(recipients.length, 'client')}`, { description: 'Telegram first. We’ll count who comes back over the next 14 days.' })
    navigate('/campaigns')
  }

  return (
    <Page width="wide">
      <PageHeader
        back="/campaigns"
        title={init.id ? 'Edit campaign' : 'New campaign'}
        subtitle="Nothing is sent until the last step."
        actions={
          <Button variant="ghost" onClick={() => save('draft')}>
            Save draft
          </Button>
        }
      />

      <div className="grid items-start gap-8 lg:grid-cols-[200px_minmax(0,1fr)] xl:grid-cols-[200px_minmax(0,1fr)_300px]">
        {/* Step list */}
        <ol className="flex gap-1 overflow-x-auto lg:sticky lg:top-6 lg:flex-col">
          {STEPS.map((label, i) => {
            const locked = i > reached
            const done = i < step || (i <= reached && i !== step && valid[i])
            const summary = [
              `${formatNumber(recipients.length)} clients`,
              promo.on ? `With code ${code}` : 'Text only',
              timing === 'now' ? `Now · ${route.cost ? `${route.cost.toFixed(2)} TJS` : 'free'}` : formatDayTime(scheduledAt),
              '',
            ][i]
            return (
              <li key={label} className="shrink-0">
                <button
                  type="button"
                  disabled={locked}
                  onClick={() => go(i)}
                  className={cn(
                    'press flex w-full items-start gap-3 rounded-xl px-3 py-2.5 text-left',
                    i === step ? 'bg-fill-active' : 'hover:bg-fill',
                    locked && 'opacity-45',
                  )}
                >
                  <span
                    className={cn(
                      'mt-px grid size-6 shrink-0 place-items-center rounded-full text-xs font-medium',
                      i === step ? 'bg-fg text-bg' : done ? 'bg-positive text-white' : 'bg-surface text-muted ring-1 ring-border',
                    )}
                  >
                    {done && i !== step ? <Icon icon={I.check} size={13} strokeWidth={2.4} /> : i + 1}
                  </span>
                  <span className="min-w-0">
                    <span className={cn('block text-base', i === step ? 'font-medium text-fg' : 'text-fg')}>{label}</span>
                    {i <= reached && summary && <span className="hidden truncate text-sm text-muted lg:block">{summary}</span>}
                  </span>
                </button>
              </li>
            )
          })}
        </ol>

        {/* Step content */}
        <Card key={step} className="animate-[step-in_240ms_var(--ease-out)_both] p-6 motion-reduce:animate-none">
          {step === 0 && (
            <div className="flex flex-col gap-5">
              <Field label="Campaign name" hint="Only your team sees this.">
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Win back: 60 days away" autoFocus />
              </Field>
              <Field label="Who gets it">
                <Segmented
                  value={audience.mode}
                  onChange={(mode) => setAudience({ ...audience, mode })}
                  items={[
                    { value: 'segment', label: 'Segment' },
                    { value: 'all', label: 'All clients' },
                    { value: 'pick', label: 'Pick clients' },
                  ]}
                />
              </Field>
              {audience.mode === 'segment' && (
                <Field label="Segment">
                  <Select
                    value={audience.segmentId}
                    onChange={(segmentId) => {
                      setAudience({ ...audience, segmentId })
                      // Follow the segment until the owner writes their own name or text.
                      if (message === translate(TEMPLATES[audience.segmentId])) setMessage(translate(TEMPLATES[segmentId]))
                      if (name === translate(segmentById[audience.segmentId].name)) setName(translate(segmentById[segmentId].name))
                    }}
                    options={SEGMENTS.map((s) => ({
                      value: s.id,
                      label: s.name,
                      hint: `${s.description} · ${clients.filter((c) => !c.archived && s.match(c)).length} clients`,
                    }))}
                  />
                </Field>
              )}
              {audience.mode === 'pick' && (
                <Field label="Clients">
                  <ClientPicker
                    value={null}
                    onChange={(id) => id && !audience.picked.includes(id) && setAudience({ ...audience, picked: [...audience.picked, id] })}
                    placeholder="Add a client by name or phone"
                  />
                  {audience.picked.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {audience.picked.map((id) => (
                        <button
                          key={id}
                          type="button"
                          onClick={() => setAudience({ ...audience, picked: audience.picked.filter((p) => p !== id) })}
                          className="press inline-flex h-7 items-center gap-1.5 rounded-full bg-fill pr-2 pl-3 text-sm text-fg hover:bg-fill-hover"
                        >
                          {clients.find((c) => c.id === id)?.name}
                          <Icon icon={I.close} size={12} className="text-faint" />
                        </button>
                      ))}
                    </div>
                  )}
                </Field>
              )}

              <StatCard size="sm" className="rounded-xl bg-fill ring-0" valueClassName="text-3xl" label="Will receive the message" value={formatNumber(recipients.length)} sub={
                <ul className="flex flex-col gap-1">
                  <li>{plural(matched.length, 'client')} match</li>
                  {noConsent.length > 0 && <li className="tabular">−{noConsent.length} without marketing consent</li>}
                  {recent.length > 0 && <li className="tabular">−{recent.length} messaged in the last 7 days. We never message anyone twice a week.</li>}
                </ul>
              } />
              <Link to="/clients/segments/new" className="-mt-1 self-start text-sm font-medium text-accent-fg hover:underline underline-offset-4">
                Create a new segment
              </Link>
            </div>
          )}

          {step === 1 && (
            <div className="flex flex-col gap-5">
              <Field label="Message">
                <Textarea ref={textRef} rows={5} value={message} onChange={(e) => setMessage(e.target.value)} className="min-h-32" autoFocus />
              </Field>
              <div className="-mt-2 flex flex-wrap items-center gap-1.5">
                <span className="mr-1 text-sm text-muted">Insert</span>
                {VARIABLES.map((v) => (
                  <button
                    key={v.key}
                    type="button"
                    onClick={() => insert(v.key)}
                    className="press h-7 rounded-full bg-fill px-2.5 text-sm text-fg hover:bg-fill-hover"
                  >
                    {v.label}
                  </button>
                ))}
                <span className="ml-auto text-sm text-faint tabular">
                  {previewText.length} characters · {parts === 1 ? '1 SMS' : `${parts} SMS`} without Telegram
                </span>
              </div>

              <div className="rounded-xl ring-1 ring-border">
                <div className="p-4">
                  <Switch
                    checked={promo.on}
                    onChange={(on) => setPromo({ ...promo, on })}
                    label="Add a promo code"
                    description="A one-time code per client, checked automatically at the register."
                  />
                </div>
                {promo.on && (
                  <div className="grid gap-3 border-t border-border p-4 sm:grid-cols-[1fr_140px_auto] sm:items-end">
                    <Field label="Discount">
                      <Segmented fill value={promo.percent} onChange={(percent) => setPromo({ ...promo, percent })} items={['10', '15', '20', '25'].map((p) => ({ value: p, label: `${p}%` }))} />
                    </Field>
                    <Field label="Valid for">
                      <Select
                        value={promo.days}
                        onChange={(days) => setPromo({ ...promo, days })}
                        options={[
                          { value: '7', label: '7 days' },
                          { value: '14', label: '14 days' },
                          { value: '30', label: '30 days' },
                        ]}
                      />
                    </Field>
                    <div className="flex h-9 items-center rounded-[10px] bg-fill px-3 font-mono text-sm text-fg">{code}</div>
                  </div>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-3">
                {image ? (
                  <span className="inline-flex h-8 items-center gap-2 rounded-full bg-fill pr-1.5 pl-3 text-sm text-fg">
                    <Icon icon={I.image} size={15} className="text-muted" />
                    autumn-offer.jpg
                    <IconButton icon={I.close} label="Remove image" size="xs" tooltip={false} onClick={() => setImage(false)} />
                  </span>
                ) : (
                  <Button size="sm" icon={ImageAdd01Icon} onClick={() => setImage(true)}>
                    Add image
                  </Button>
                )}
                <span className="text-sm text-muted">Images go out in Telegram and WhatsApp. SMS gets the text only.</span>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="flex flex-col gap-6">
              <div>
                <h3 className="text-base font-medium text-fg">Channels</h3>
                <p className="mt-0.5 text-sm text-muted">Each client gets one message, through the first channel that reaches them. Free channels go first.</p>
                <ol className="mt-4 flex flex-col">
                  {CHANNELS.map((ch, i) => (
                    <li key={ch.id}>
                      {i > 0 && (
                        <div className="flex h-5 items-center pl-[19px]">
                          <span className="h-full w-px bg-border-strong" />
                          <span className="ml-4 text-xs text-faint">if not reachable</span>
                        </div>
                      )}
                      <div className={cn('flex items-center gap-3 rounded-xl px-3 py-3 ring-1 ring-inset', channels[ch.id] ? 'ring-border' : 'opacity-60 ring-border')}>
                        <span className="grid size-8 shrink-0 place-items-center rounded-full bg-fill text-muted">
                          <Icon icon={ch.icon} size={16} />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block text-base text-fg">{ch.name}</span>
                          <span className="block text-sm text-muted">{ch.note}</span>
                        </span>
                        <span className="text-sm text-muted tabular">{channels[ch.id] ? plural(route.counts[ch.id], 'client') : 'Off'}</span>
                        <Switch checked={channels[ch.id]} onChange={(v) => setChannels({ ...channels, [ch.id]: v })} />
                      </div>
                    </li>
                  ))}
                </ol>
                <div className="mt-4 flex flex-wrap items-baseline justify-between gap-2 rounded-xl bg-fill px-4 py-3">
                  <span className="text-sm text-muted">
                    {route.counts.sms > 0 && (
                      <>
                        {route.counts.sms} SMS × {parts} part{parts > 1 ? 's' : ''}
                        {route.counts.whatsapp > 0 ? ' · ' : ''}
                      </>
                    )}
                    {route.counts.whatsapp > 0 && <>{route.counts.whatsapp} WhatsApp</>}
                    {route.unreached > 0 && <span className="text-warning"> · {route.unreached} can’t be reached with these channels</span>}
                    {!route.counts.sms && !route.counts.whatsapp && !route.unreached && 'Everyone is reachable for free'}
                  </span>
                  <span className="text-base text-fg">
                    Estimated cost <Money value={route.cost} decimals className="font-medium" />
                  </span>
                </div>
              </div>

              <div>
                <h3 className="mb-3 text-base font-medium text-fg">When</h3>
                <Segmented
                  value={timing}
                  onChange={setTiming}
                  items={[
                    { value: 'now', label: 'Send now' },
                    { value: 'schedule', label: 'Schedule' },
                  ]}
                />
                {timing === 'schedule' && (
                  <div className="mt-4 grid max-w-sm grid-cols-[1fr_120px] gap-3">
                    <DatePicker value={date} onChange={setDate} />
                    <Select value={time} onChange={setTime} options={sendTimes()} />
                  </div>
                )}
                <p className="mt-3 flex items-center gap-2 text-sm text-muted">
                  <Icon icon={I.clock} size={16} />
                  Quiet hours 21:00–09:00. Anything that lands then waits until morning.
                </p>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="flex flex-col gap-5">
              <div className="divide-y divide-border">
                <DetailRow label="Name">{name || audienceLabel}</DetailRow>
                <DetailRow label="Audience">
                  {audienceLabel} · {plural(recipients.length, 'client')}
                </DetailRow>
                <DetailRow label="Promo code">{promo.on ? `${code}, −${promo.percent}% until ${formatDate(until)}` : 'None'}</DetailRow>
                <DetailRow label="Channels">
                  {CHANNELS.filter((c) => channels[c.id])
                    .map((c) => `${c.name} ${route.counts[c.id]}`)
                    .join(' → ')}
                </DetailRow>
                <DetailRow label="When">{timing === 'now' ? 'Right away' : formatDayTime(scheduledAt)}</DetailRow>
                <DetailRow label="Cost">
                  <Money value={route.cost} decimals />
                </DetailRow>
              </div>
              <div className="rounded-xl bg-fill p-3 xl:hidden">
                <MessageBubble compact text={previewText} image={image} code={promo.on ? code : undefined} />
              </div>
            </div>
          )}

          <div className="mt-8 flex items-center justify-between gap-3 border-t border-border pt-5">
            {step > 0 ? (
              <Button variant="ghost" icon={I.chevronLeft} onClick={() => go(step - 1)}>
                Back
              </Button>
            ) : (
              <span />
            )}
            {step < 3 ? (
              <Button variant="primary" iconRight={I.chevronRight} disabled={!valid[step]} onClick={() => go(step + 1)}>
                Continue
              </Button>
            ) : (
              <Button variant="primary" icon={I.send} disabled={!recipients.length} onClick={() => save(timing === 'now' ? 'sending' : 'scheduled')}>
                {timing === 'now' ? `Send to ${plural(recipients.length, 'client')}` : `Schedule for ${formatDayTime(scheduledAt)}`}
              </Button>
            )}
          </div>
        </Card>

        {/* Live preview */}
        <div className="hidden xl:sticky xl:top-6 xl:block">
          <PhonePreview
            caption={
              <span className="flex items-center justify-center gap-1">
                <IconButton icon={I.chevronLeft} label="Previous client" size="xs" tooltip={false} onClick={() => setSample((s) => (s + previewClients.length - 1) % previewClients.length)} />
                <span className="tabular">Preview for {previewClient?.firstName ?? 'a client'}</span>
                <IconButton icon={I.chevronRight} label="Next client" size="xs" tooltip={false} onClick={() => setSample((s) => s + 1)} />
              </span>
            }
          >
            <MessageBubble text={previewText} image={image} code={promo.on ? code : undefined} />
          </PhonePreview>
        </div>
      </div>
    </Page>
  )
}
