import { useMemo, useState } from 'react'
import { text as translate } from '@/i18n'
import { toast } from 'sonner'
import { I, Icon } from '@/components/icons'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Switch } from '@/components/ui/controls'
import { Sheet } from '@/components/ui/dialog'
import { Field, Input, Textarea } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { TD, TH, THead, TR, Table } from '@/components/ui/table'
import { Segmented, Tabs } from '@/components/ui/tabs'
import { cn } from '@/lib/cn'
import { formatDayTime, formatTime } from '@/lib/format'
import { seeded } from '@/lib/random'
import { useData } from '@/lib/store'
import { NOW, addMinutes } from '@/lib/time'
import { SCENARIOS, SCENARIO_GROUPS, VARIABLES, fillSample, type Scenario } from '../parts-b/scenarios'
import { CHANNELS, ChannelChain, useSettingsForm, type ChannelId } from '../parts-b/shared'
import { SaveBar, SettingsPage, SettingsRow, SettingsSection } from '../ui'

type Tab = 'scenarios' | 'templates' | 'channels' | 'log'
const LANG_LABEL = { tg: 'Тоҷикӣ', ru: 'Русский', en: 'English' } as const
type Lang = keyof typeof LANG_LABEL

function Bubble({ text }: { text: string }) {
  return (
    <div className="rounded-2xl bg-fill p-4">
      <div className="max-w-[88%] rounded-2xl rounded-bl-md bg-surface px-3.5 py-2.5 shadow-xs ring-1 ring-border">
        <div className="text-xs font-medium text-accent-fg">Sitora Beauty</div>
        <p className="mt-0.5 text-base whitespace-pre-wrap text-fg">{text}</p>
        <div className="mt-1 text-right text-2xs text-faint tabular">{formatTime(NOW)}</div>
      </div>
    </div>
  )
}

function ScenarioSheet({
  scenario,
  onClose,
  onSave,
}: {
  scenario: Scenario | null
  onClose: () => void
  onSave: (s: Scenario) => void
}) {
  const [draft, setDraft] = useState<Scenario | null>(null)
  const [prev, setPrev] = useState<Scenario | null>(null)
  if (scenario !== prev) {
    setPrev(scenario)
    if (scenario) setDraft({ ...scenario, text: translate(scenario.text) })
  }
  const d = draft
  const toggleChannel = (id: ChannelId, on: boolean) =>
    d && setDraft({ ...d, channels: on ? CHANNELS.map((c) => c.id).filter((c) => c === id || d.channels.includes(c)) : d.channels.filter((c) => c !== id) })

  return (
    <Sheet
      open={!!scenario}
      onOpenChange={(o) => !o && onClose()}
      eyebrow={d?.group}
      title={d ? (d.name === 'Reminder' ? `Reminder, ${d.timing}` : d.name) : ''}
      width="lg"
      footer={
        <>
          <Button variant="secondary" icon={I.send} onClick={() => toast.success('Test sent to your Telegram')}>
            Send me a test
          </Button>
          <Button variant="primary" className="ml-auto" onClick={() => d && onSave(d)}>
            Save
          </Button>
        </>
      }
    >
      {d && (
        <div className="flex flex-col gap-6 p-5">
          <Switch checked={d.on} onChange={(on) => setDraft({ ...d, on })} label="Send this message" description={d.timingOptions ? undefined : d.timing} />
          {d.timingOptions && (
            <Field label="When">
              <Select value={d.timing} onChange={(t) => setDraft({ ...d, timing: t })} options={d.timingOptions.map((t) => ({ value: t, label: t }))} />
            </Field>
          )}
          <div className="flex flex-col gap-2">
            <span className="text-sm font-medium text-muted">Message</span>
            <Textarea rows={4} value={d.text} onChange={(e) => setDraft({ ...d, text: e.target.value })} />
            <div className="flex flex-wrap gap-1.5">
              {VARIABLES.map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setDraft({ ...d, text: `${d.text} ${v}` })}
                  className="press h-7 rounded-full bg-fill px-2.5 text-xs font-medium text-muted hover:bg-fill-hover hover:text-fg"
                >
                  {v}
                </button>
              ))}
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-1.5 text-sm text-muted">
              Written in
              {(Object.keys(LANG_LABEL) as Lang[]).map((l) => (
                <Badge key={l} tone={d.langs.includes(l) ? 'neutral' : 'warning'}>
                  {LANG_LABEL[l]}
                </Badge>
              ))}
            </div>
            {d.langs.length < 3 && <p className="text-sm text-faint">Clients who chose a missing language get the English text.</p>}
          </div>
          <div className="flex flex-col gap-2">
            <span className="text-sm font-medium text-muted">Preview</span>
            <Bubble text={fillSample(d.text)} />
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-sm font-medium text-muted">Channels</span>
            <p className="mb-2 text-sm text-faint">Tried in this order. The first one the client can receive is used; the rest are skipped.</p>
            {CHANNELS.map((c, i) => (
              <div key={c.id} className="flex items-center gap-3 border-b border-border py-2.5 last:border-b-0">
                <span className="w-4 text-xs text-faint tabular">{i + 1}</span>
                <Icon icon={c.icon} size={18} className="text-muted" />
                <span className="flex-1 text-base text-fg">{c.label}</span>
                <span className="text-sm text-muted">{c.cost ? `${c.cost.toFixed(2)} TJS` : 'Free'}</span>
                <Switch checked={d.channels.includes(c.id)} onChange={(on) => toggleChannel(c.id, on)} />
              </div>
            ))}
          </div>
        </div>
      )}
    </Sheet>
  )
}

function ScenariosTab({ list, onToggle, onOpen }: { list: Scenario[]; onToggle: (id: string, on: boolean) => void; onOpen: (s: Scenario) => void }) {
  return (
    <>
      {SCENARIO_GROUPS.map((g) => (
        <SettingsSection key={g} title={g}>
          <ul>
            {list
              .filter((s) => s.group === g)
              .map((s) => (
                <li key={s.id} className="border-b border-border last:border-b-0">
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={() => onOpen(s)}
                    onKeyDown={(e) => e.key === 'Enter' && onOpen(s)}
                    className="-mx-3 flex cursor-pointer items-center gap-4 rounded-xl px-3 py-3.5 hover:bg-fill/60"
                  >
                    <span onClick={(e) => e.stopPropagation()} className="inline-flex">
                      <Switch checked={s.on} onChange={(on) => onToggle(s.id, on)} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className={cn('block text-base', s.on ? 'text-fg' : 'text-muted')}>{s.name}</span>
                      <span className="block text-sm text-muted">{s.timing}</span>
                    </span>
                    <ChannelChain enabled={s.on ? s.channels : []} className="hidden md:inline-flex" />
                    <Icon icon={I.chevronRight} size={16} className="text-faint" />
                  </div>
                </li>
              ))}
          </ul>
        </SettingsSection>
      ))}
    </>
  )
}

function TemplatesTab({ list, onOpen }: { list: Scenario[]; onOpen: (s: Scenario) => void }) {
  const incomplete = list.filter((s) => s.on && s.langs.length < 3).length
  return (
    <>
      <p className="mb-4 text-base text-muted">
        {incomplete ? `${incomplete} active messages are missing a translation. Clients get the English text instead.` : 'Every active message has all three languages.'}
      </p>
      <Card className="overflow-hidden">
        <Table>
          <THead>
            <TH>Message</TH>
            <TH>Languages</TH>
            <TH>Edited</TH>
          </THead>
          <tbody>
            {list.map((s) => (
              <TR key={s.id} onClick={() => onOpen(s)}>
                <TD>
                  <span className="block">{s.name}</span>
                  <span className="block max-w-[340px] truncate text-sm text-muted">{s.text}</span>
                </TD>
                <TD>
                  <span className="flex gap-1">
                    {(['tg', 'ru', 'en'] as const).map((l) => (
                      <Badge key={l} tone={s.langs.includes(l) ? 'neutral' : 'warning'}>
                        {l.toUpperCase()}
                      </Badge>
                    ))}
                  </span>
                </TD>
                <TD muted>{s.edited}</TD>
              </TR>
            ))}
          </tbody>
        </Table>
      </Card>
    </>
  )
}

const HOURS = Array.from({ length: 24 }, (_, h) => `${String(h).padStart(2, '0')}:00`).map((t) => ({ value: t, label: t }))

function ChannelsTab() {
  const clients = useData((s) => s.clients)
  const tg = clients.filter((c) => c.telegram).length
  const form = useSettingsForm({
    telegram: true,
    push: true,
    sms: true,
    whatsapp: false,
    quiet: true,
    from: '21:00',
    to: '09:00',
    sender: 'SitoraBeauty',
  })
  const v = form.value
  const reach: Record<ChannelId, string> = {
    telegram: `${tg} of ${clients.length} clients connected`,
    push: 'Clients with the booking app',
    sms: 'Every client with a phone number',
    whatsapp: 'Clients who wrote to you first in the last 24 h',
  }
  return (
    <>
      <SettingsSection title="Channels" description="Free channels go first. Paid ones are only used when the client can’t get the free ones.">
        {CHANNELS.map((c) => (
          <SettingsRow
            key={c.id}
            label={
              <span className="flex items-center gap-2">
                <Icon icon={c.icon} size={18} className="text-muted" />
                {c.label}
              </span>
            }
            description={reach[c.id]}
          >
            <div className="flex items-center justify-between gap-4">
              <span className="text-sm text-muted">{c.cost ? `${c.cost.toFixed(2)} TJS per message, from your balance` : 'Free'}</span>
              <Switch checked={v[c.id]} onChange={(on) => form.set(c.id, on)} />
            </div>
          </SettingsRow>
        ))}
        <SettingsRow label="SMS sender name" description="Shown instead of a number. Latin letters, up to 11.">
          <Input className="max-w-56" value={v.sender} maxLength={11} onChange={(e) => form.set('sender', e.target.value.replace(/[^A-Za-z0-9]/g, ''))} />
        </SettingsRow>
      </SettingsSection>
      <SettingsSection title="Quiet hours" description="Messages scheduled for this time wait until the morning. Codes and staff alerts still go out.">
        <SettingsRow label="Don’t message clients at night">
          <Switch checked={v.quiet} onChange={(on) => form.set('quiet', on)} />
        </SettingsRow>
        <SettingsRow label="Quiet time">
          <div className={cn('flex max-w-xs items-center gap-2', !v.quiet && 'pointer-events-none opacity-45')}>
            <Select value={v.from} onChange={(t) => form.set('from', t)} options={HOURS} />
            <span className="text-muted">to</span>
            <Select value={v.to} onChange={(t) => form.set('to', t)} options={HOURS} />
          </div>
        </SettingsRow>
      </SettingsSection>
      <SaveBar dirty={form.dirty} onSave={form.save} onDiscard={form.discard} />
    </>
  )
}

type LogStatus = 'read' | 'delivered' | 'fallback' | 'failed'
const LOG_STATUS: Record<LogStatus, { label: string; tone: 'accent' | 'positive' | 'warning' | 'negative' }> = {
  read: { label: 'Read', tone: 'accent' },
  delivered: { label: 'Delivered', tone: 'positive' },
  fallback: { label: 'Sent by SMS instead', tone: 'warning' },
  failed: { label: 'Not delivered', tone: 'negative' },
}

function LogTab() {
  const clients = useData((s) => s.clients)
  const [filter, setFilter] = useState<'all' | 'problems'>('all')
  const rows = useMemo(() => {
    const r = seeded(321)
    const picks = SCENARIOS.filter((s) => s.on && s.group !== 'For staff' && s.id !== 'code')
    return Array.from({ length: 22 }, (_, i) => {
      const c = clients[r.int(0, clients.length - 1)]
      const s = r.pick(picks)
      const roll = r.next()
      const status: LogStatus = i === 3 ? 'failed' : roll < 0.1 ? 'fallback' : roll < 0.55 ? 'read' : 'delivered'
      const channel: ChannelId = status === 'fallback' ? 'sms' : c.telegram ? 'telegram' : roll < 0.7 ? 'push' : 'sms'
      return { id: i, at: addMinutes(NOW, -(i * 17 + r.int(1, 12))), client: c.name, scenario: s.name, channel, status }
    })
  }, [clients])
  const shown = filter === 'all' ? rows : rows.filter((x) => x.status === 'fallback' || x.status === 'failed')

  return (
    <>
      <div className="mb-4 flex items-center justify-between gap-3">
        <Segmented
          value={filter}
          onChange={setFilter}
          items={[
            { value: 'all', label: 'All' },
            { value: 'problems', label: 'Problems' },
          ]}
        />
        <span className="text-sm text-muted">Last 24 hours</span>
      </div>
      <Card className="overflow-hidden">
        <Table>
          <THead>
            <TH>Time</TH>
            <TH>Client</TH>
            <TH>Message</TH>
            <TH>Channel</TH>
            <TH>Status</TH>
          </THead>
          <tbody>
            {shown.map((x) => {
              const ch = CHANNELS.find((c) => c.id === x.channel)!
              return (
                <TR key={x.id}>
                  <TD muted className="whitespace-nowrap">
                    {formatDayTime(x.at)}
                  </TD>
                  <TD>{x.client}</TD>
                  <TD muted>{x.scenario}</TD>
                  <TD>
                    <span className="inline-flex items-center gap-1.5 text-sm text-muted">
                      <Icon icon={ch.icon} size={14} />
                      {ch.label}
                    </span>
                  </TD>
                  <TD>
                    <Badge tone={LOG_STATUS[x.status].tone}>
                      {LOG_STATUS[x.status].label}
                    </Badge>
                  </TD>
                </TR>
              )
            })}
          </tbody>
        </Table>
      </Card>
    </>
  )
}

export default function NotificationsSettings() {
  const [tab, setTab] = useState<Tab>('scenarios')
  const [list, setList] = useState(SCENARIOS)
  const [open, setOpen] = useState<Scenario | null>(null)
  const active = list.filter((s) => s.on).length

  return (
    <SettingsPage
      title="Client notifications"
      description={`${active} automatic messages are on. Each goes out through Telegram first, then push, SMS and WhatsApp.`}
      wide={tab === 'log'}
    >
      <Tabs
        value={tab}
        onChange={setTab}
        className="mb-8"
        items={[
          { value: 'scenarios', label: 'Messages' },
          { value: 'templates', label: 'Texts & languages' },
          { value: 'channels', label: 'Channels & quiet hours' },
          { value: 'log', label: 'Send log' },
        ]}
      />
      {tab === 'scenarios' && (
        <ScenariosTab
          list={list}
          onOpen={setOpen}
          onToggle={(id, on) => {
            setList((l) => l.map((s) => (s.id === id ? { ...s, on } : s)))
            const s = list.find((x) => x.id === id)
            if (s) toast.success(`${s.name === 'Reminder' ? `Reminder ${s.timing}` : s.name} turned ${on ? 'on' : 'off'}`)
          }}
        />
      )}
      {tab === 'templates' && <TemplatesTab list={list} onOpen={setOpen} />}
      {tab === 'channels' && <ChannelsTab />}
      {tab === 'log' && <LogTab />}

      <ScenarioSheet
        scenario={open}
        onClose={() => setOpen(null)}
        onSave={(s) => {
          setList((l) => l.map((x) => (x.id === s.id ? s : x)))
          setOpen(null)
          toast.success(`“${s.name}” saved`)
        }}
      />
    </SettingsPage>
  )
}
