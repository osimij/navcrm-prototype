import { getLanguage, text as translate } from '@/i18n'
import { useEffect, useMemo, useRef, useState } from 'react'
import { toast } from 'sonner'
import { ClientPicker } from '@/components/client-picker'
import { I, Icon } from '@/components/icons'
import { Badge } from '@/components/ui/badge'
import { Button, IconButton } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Checkbox, ChoiceCard, Switch } from '@/components/ui/controls'
import { Modal } from '@/components/ui/dialog'
import { Field, Input, Textarea } from '@/components/ui/input'
import { Meter } from '@/components/ui/misc'
import { TD, TH, THead, TR, Table } from '@/components/ui/table'
import { Segmented, Tabs } from '@/components/ui/tabs'
import { cn } from '@/lib/cn'
import { formatDayTime, formatTime } from '@/lib/format'
import { seeded } from '@/lib/random'
import { useData } from '@/lib/store'
import { NOW, addMinutes } from '@/lib/time'
import { MiniStat, useSettingsForm } from '../parts-b/shared'
import { SaveBar, SettingsPage, SettingsRow, SettingsSection } from '../ui'

type Tab = 'general' | 'knowledge' | 'test' | 'log' | 'usage'
type Lang = 'tg' | 'ru' | 'en'

const GREETINGS: Record<Lang, string> = {
  tg: 'Салом! Ман ёрдамчии Sitora Beauty ҳастам. Метавонам шуморо сабт кунам, вақти ташрифро иваз кунам ё ба саволҳо дар бораи хизматрасониҳо ва нархҳо ҷавоб диҳам.',
  ru: 'Здравствуйте! Я помощник Sitora Beauty. Помогу записаться, перенести визит или отвечу на вопросы об услугах и ценах.',
  en: 'Hello! I’m the Sitora Beauty assistant. I can book you in, move a visit or answer questions about services and prices.',
}

const PREPAY = 'Coloring and lash extensions need a 30% prepayment. You can pay with Alif or DC QR right after booking.'
const LATE = 'If you’re more than 15 minutes late, we may need to shorten the service or move your visit.'

function GeneralTab() {
  const clients = useData((s) => s.clients)
  const form = useSettingsForm({
    enabled: true,
    telegram: true,
    whatsapp: false,
    instagram: true,
    bookingPage: true,
    canBook: true,
    canAnswer: true,
    canReviews: true,
    canInsights: true,
    excluded: ['c10', 'c34'] as string[],
    tone: 'friendly' as 'friendly' | 'formal',
    greetTg: GREETINGS.tg,
    greetRu: GREETINGS.ru,
    greetEn: GREETINGS.en,
    rules: translate('Offer the earliest free time first. For coloring, suggest a free consultation if the client hasn’t visited in 6 months.'),
    forbidden: translate('Medical diagnoses. Other salons’ prices. Discounts that aren’t in Promo codes.'),
    prepay: translate(PREPAY),
    late: translate(LATE),
    limit: 'charge' as 'charge' | 'pause',
  })
  const [lang, setLang] = useState<Lang>(getLanguage)
  const v = form.value
  const greetKey = lang === 'tg' ? 'greetTg' : lang === 'ru' ? 'greetRu' : 'greetEn'
  const off = !v.enabled

  return (
    <>
      <SettingsSection title="Assistant">
        <SettingsRow label="Answer clients automatically" description="It replies in the Inbox. Staff see every message and can take over any time.">
          <Switch aria-label="Answer clients automatically" checked={v.enabled} onChange={(x) => form.set('enabled', x)} />
        </SettingsRow>
      </SettingsSection>
      <div className={cn('transition-opacity duration-200', off && 'pointer-events-none opacity-45')}>
        <SettingsSection title="Where and what">
          <SettingsRow label="Channels">
            <div className="flex flex-col gap-2.5">
              <Checkbox checked={v.telegram} onChange={(x) => form.set('telegram', x)} label="Telegram" />
              <Checkbox checked={v.whatsapp} onChange={(x) => form.set('whatsapp', x)} label="WhatsApp" />
              <Checkbox checked={v.instagram} onChange={(x) => form.set('instagram', x)} label="Instagram Direct" />
              <Checkbox checked={v.bookingPage} onChange={(x) => form.set('bookingPage', x)} label="Chat on the booking page" />
            </div>
          </SettingsRow>
          <SettingsRow label="It can">
            <div className="flex flex-col gap-2.5">
              <Checkbox checked={v.canBook} onChange={(x) => form.set('canBook', x)} label="Book, move and cancel visits" />
              <Checkbox checked={v.canAnswer} onChange={(x) => form.set('canAnswer', x)} label="Answer questions about services, prices and hours" />
              <Checkbox checked={v.canReviews} onChange={(x) => form.set('canReviews', x)} label="Ask for reviews after visits" />
              <Checkbox checked={v.canInsights} onChange={(x) => form.set('canInsights', x)} label="Add what clients asked about to your daily summary" />
            </div>
          </SettingsRow>
          <SettingsRow label="Never answers" description="Messages from these clients always go to a person.">
            <div className="flex flex-col gap-2">
              {v.excluded.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {v.excluded.map((id) => {
                    const c = clients.find((x) => x.id === id)
                    return (
                      <span key={id} className="inline-flex h-7 items-center gap-1 rounded-full bg-fill pr-1 pl-3 text-sm text-fg">
                        {c?.name}
                        <button
                          type="button"
                          aria-label={`Remove ${c?.name}`}
                          onClick={() => form.set('excluded', v.excluded.filter((x) => x !== id))}
                          className="grid size-5 place-items-center rounded-full text-faint hover:bg-fill-hover hover:text-fg"
                        >
                          <Icon icon={I.close} size={12} />
                        </button>
                      </span>
                    )
                  })}
                </div>
              )}
              <ClientPicker value={null} onChange={(id) => id && !v.excluded.includes(id) && form.set('excluded', [...v.excluded, id])} placeholder="Add a client" />
            </div>
          </SettingsRow>
        </SettingsSection>

        <SettingsSection title="How it talks">
          <SettingsRow label="Tone">
            <Segmented
              value={v.tone}
              onChange={(t) => form.set('tone', t)}
              items={[
                { value: 'friendly', label: 'Friendly' },
                { value: 'formal', label: 'Formal' },
              ]}
            />
          </SettingsRow>
          <SettingsRow label="Greeting" description="It answers in the client’s language.">
            <Segmented
              size="sm"
              value={lang}
              onChange={setLang}
              className="mb-2"
              items={[
                { value: 'tg', label: 'Тоҷикӣ' },
                { value: 'ru', label: 'Русский' },
                { value: 'en', label: 'English' },
              ]}
            />
            <Textarea rows={3} value={v[greetKey]} onChange={(e) => form.set(greetKey, e.target.value)} />
          </SettingsRow>
          <SettingsRow label="Rules" description="Instructions in plain words.">
            <Textarea rows={3} value={v.rules} onChange={(e) => form.set('rules', e.target.value)} />
          </SettingsRow>
          <SettingsRow label="Topics to avoid" description="It hands these to a person.">
            <Textarea rows={2} value={v.forbidden} onChange={(e) => form.set('forbidden', e.target.value)} />
          </SettingsRow>
          <SettingsRow label="About prepayment">
            <Textarea rows={2} value={v.prepay} onChange={(e) => form.set('prepay', e.target.value)} />
          </SettingsRow>
          <SettingsRow label="About being late">
            <Textarea rows={2} value={v.late} onChange={(e) => form.set('late', e.target.value)} />
          </SettingsRow>
        </SettingsSection>

        <SettingsSection title="Limit">
          <SettingsRow label="When the monthly dialogs run out">
            <div className="grid gap-2 sm:grid-cols-2">
              <ChoiceCard selected={v.limit === 'charge'} onClick={() => form.set('limit', 'charge')} title="Keep answering" description="0.50 TJS per extra dialog from your balance" />
              <ChoiceCard selected={v.limit === 'pause'} onClick={() => form.set('limit', 'pause')} title="Pause until next month" description="Messages go to staff in the Inbox" />
            </div>
          </SettingsRow>
          <SettingsRow label="Model" description="We choose the model for quality and cost. Nothing to set up.">
            <span className="text-muted">Chosen by NavCRM</span>
          </SettingsRow>
        </SettingsSection>
      </div>
      <SaveBar dirty={form.dirty} onSave={form.save} onDiscard={form.discard} />
    </>
  )
}

type Faq = { q: string; a: string }
const FAQ: Faq[] = [
  { q: 'Is there parking?', a: 'Yes, free parking behind the building, entrance from Bokhtar street.' },
  { q: 'Do you work on holidays?', a: 'We’re closed on Navruz (21–24 March) and Independence Day. Other days 09:00–21:00.' },
  { q: 'Can I bring my child?', a: 'Yes, there’s a kids’ corner by reception. Kids’ haircuts are 50 TJS.' },
  { q: 'Which hair color brands do you use?', a: 'Wella and L’Oréal Professionnel. Ask Madina for an ammonia-free option.' },
  { q: 'Do you sell gift certificates?', a: 'Yes, from 100 TJS, for any amount or a specific service. Valid for 6 months.' },
]

function KnowledgeTab() {
  const [faq, setFaq] = useState(FAQ)
  const [editing, setEditing] = useState<number | 'new' | null>(null)
  const [q, setQ] = useState('')
  const [a, setA] = useState('')
  const open = (i: number | 'new') => {
    setEditing(i)
    setQ(i === 'new' ? '' : faq[i].q)
    setA(i === 'new' ? '' : faq[i].a)
  }

  return (
    <>
      <SettingsSection title="Updated automatically" description="The assistant reads these from NavCRM, so answers match what’s in the calendar and register.">
        {[
          ['Services and prices', '18 services in 6 categories', I.briefcase],
          ['Hours and addresses', '2 branches, holidays included', I.clock],
          ['Staff', '6 masters and their free time', I.users],
          ['Promo codes and bonuses', 'Active offers only', I.discount],
        ].map(([title, sub, icon]) => (
          <div key={title as string} className="flex items-center gap-3 border-b border-border py-3.5 last:border-b-0">
            <span className="grid size-9 place-items-center rounded-full bg-fill text-muted">
              <Icon icon={icon as typeof I.clock} size={18} />
            </span>
            <span className="flex-1">
              <span className="block text-base text-fg">{title as string}</span>
              <span className="block text-sm text-muted">{sub as string}</span>
            </span>
            <Badge tone="positive">
              Synced
            </Badge>
          </div>
        ))}
      </SettingsSection>
      <SettingsSection
        title="Your answers"
        description="Questions clients ask that NavCRM can’t know on its own."
        action={
          <Button size="sm" icon={I.add} onClick={() => open('new')}>
            Add answer
          </Button>
        }
      >
        <ul>
          {faq.map((f, i) => (
            <li key={i} className="group flex items-start gap-3 border-b border-border py-4 last:border-b-0">
              <span className="min-w-0 flex-1">
                <span className="block text-base text-fg">{f.q}</span>
                <span className="mt-0.5 block text-sm text-muted">{f.a}</span>
              </span>
              <IconButton icon={I.edit} label="Edit answer" size="sm" onClick={() => open(i)} />
            </li>
          ))}
        </ul>
      </SettingsSection>
      <Modal
        open={editing != null}
        onOpenChange={(o) => !o && setEditing(null)}
        title={editing === 'new' ? 'Add answer' : 'Edit answer'}
        footer={
          <>
            {editing !== 'new' && editing != null && (
              <Button
                variant="ghost"
                className="mr-auto text-negative"
                onClick={() => {
                  setFaq((l) => l.filter((_, j) => j !== editing))
                  setEditing(null)
                  toast('Answer removed')
                }}
              >
                Delete
              </Button>
            )}
            <Button variant="ghost" onClick={() => setEditing(null)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              disabled={!q.trim() || !a.trim()}
              onClick={() => {
                setFaq((l) => (editing === 'new' ? [...l, { q, a }] : l.map((x, j) => (j === editing ? { q, a } : x))))
                setEditing(null)
                toast.success('The assistant will use this answer')
              }}
            >
              Save
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          <Field label="Question">
            <Input value={q} onChange={(e) => setQ(e.target.value)} autoFocus placeholder="e.g. Do you have Wi-Fi?" />
          </Field>
          <Field label="Answer">
            <Textarea rows={3} value={a} onChange={(e) => setA(e.target.value)} />
          </Field>
        </div>
      </Modal>
    </>
  )
}

type Msg = { from: 'client' | 'bot'; text: string; at: Date }

function reply(text: string) {
  const t = text.toLowerCase()
  if (/price|cost|how much|сколько|нарх/.test(t)) return 'A women’s haircut is 150 TJS, coloring starts at 450 TJS. Shall I find you a time?'
  if (/\d{1,2}[:.]\d{2}|^yes|^да/.test(t)) return 'Done! You’re booked for tomorrow at 13:30 with Madina. I’ll remind you the day before.'
  if (/book|appointment|free|time|tomorrow|запис/.test(t)) return 'Madina has free time tomorrow at 10:00, 13:30 and 16:00. Which suits you?'
  if (/where|address|parking|где/.test(t)) return 'We’re at Rudaki Ave 72, Dushanbe. Free parking behind the building. Open 09:00–21:00.'
  if (/late|опозда/.test(t)) return LATE
  if (/prepay|deposit|предоплат/.test(t)) return PREPAY
  return 'Let me pass this to an administrator. They usually reply within 10 minutes.'
}

function TestTab() {
  const [msgs, setMsgs] = useState<Msg[]>([{ from: 'bot', text: GREETINGS.en, at: NOW }])
  const [text, setText] = useState('')
  const [typing, setTyping] = useState(false)
  const end = useRef<HTMLDivElement>(null)
  // scrollIntoView returns a promise in newer browsers, so don't return it from the effect.
  useEffect(() => {
    end.current?.scrollIntoView({ block: 'nearest' })
  }, [msgs, typing])

  function send(value = text) {
    const v = value.trim()
    if (!v || typing) return
    setMsgs((m) => [...m, { from: 'client', text: v, at: addMinutes(NOW, m.length) }])
    setText('')
    setTyping(true)
    setTimeout(() => {
      setTyping(false)
      setMsgs((m) => [...m, { from: 'bot', text: reply(v), at: addMinutes(NOW, m.length) }])
    }, 700)
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="flex items-center gap-2 text-sm text-muted">
        <Icon icon={I.info} size={16} />
        Test chats don’t reach clients, don’t book real visits and don’t count toward your limit.
      </p>
      <Card className="flex h-[460px] flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto bg-fill/50 p-4">
          <div className="flex flex-col gap-2">
            {msgs.map((m, i) => (
              <div key={i} className={cn('flex', m.from === 'client' ? 'justify-end' : 'justify-start')}>
                <div
                  className={cn(
                    'rise max-w-[78%] rounded-2xl px-3.5 py-2.5 text-base',
                    m.from === 'client' ? 'rounded-br-md bg-accent text-on-accent' : 'rounded-bl-md bg-surface text-fg ring-1 ring-border',
                  )}
                >
                  {m.text}
                  <div className={cn('mt-1 text-right text-2xs tabular', m.from === 'client' ? 'text-on-accent/70' : 'text-faint')}>{formatTime(m.at)}</div>
                </div>
              </div>
            ))}
            {typing && (
              <div className="flex">
                <div className="flex gap-1 rounded-2xl rounded-bl-md bg-surface px-3.5 py-3 ring-1 ring-border">
                  {[0, 1, 2].map((d) => (
                    <span key={d} className="size-1.5 animate-pulse rounded-full bg-faint" style={{ animationDelay: `${d * 150}ms` }} />
                  ))}
                </div>
              </div>
            )}
            <div ref={end} />
          </div>
        </div>
        <div className="flex flex-wrap gap-1.5 border-t border-border px-3 pt-3">
          {['How much is coloring?', 'Book me for tomorrow', '13:30 please', 'Where are you?'].map((s) => (
            <button key={s} type="button" onClick={() => send(s)} className="press h-7 rounded-full bg-fill px-3 text-sm text-fg hover:bg-fill-hover">
              {s}
            </button>
          ))}
        </div>
        <form
          className="flex items-center gap-2 p-3"
          onSubmit={(e) => {
            e.preventDefault()
            send()
          }}
        >
          <Input value={text} onChange={(e) => setText(e.target.value)} placeholder="Write as a client would" className="flex-1" />
          <IconButton icon={I.send} label="Send" variant="primary" type="submit" tooltip={false} disabled={!text.trim()} />
        </form>
      </Card>
      <Button variant="ghost" size="sm" className="self-start" icon={I.refresh} onClick={() => setMsgs([{ from: 'bot', text: GREETINGS.en, at: NOW }])}>
        Start over
      </Button>
    </div>
  )
}

type Outcome = 'booked' | 'answered' | 'handed'
const OUTCOME: Record<Outcome, { label: string; tone: 'positive' | 'neutral' | 'warning' }> = {
  booked: { label: 'Booked a visit', tone: 'positive' },
  answered: { label: 'Answered', tone: 'neutral' },
  handed: { label: 'Handed to staff', tone: 'warning' },
}
const TOPICS: Record<Outcome, string[]> = {
  booked: ['Gel polish manicure tomorrow at 11:00', 'Lash lamination on Saturday', 'Men’s haircut today at 18:30', 'Moved coloring to Friday 16:00'],
  answered: ['Asked about coloring prices', 'Asked for the address and parking', 'Asked if Shahlo works on Sunday', 'Asked about gift certificates'],
  handed: ['Complaint about a previous visit', 'Asked for a discount not in promo codes', 'Asked about a skin reaction'],
}

function LogTab() {
  const clients = useData((s) => s.clients)
  const rows = useMemo(() => {
    const r = seeded(808)
    return Array.from({ length: 16 }, (_, i) => {
      const roll = r.next()
      const outcome: Outcome = roll < 0.38 ? 'booked' : roll < 0.84 ? 'answered' : 'handed'
      return {
        id: i,
        at: addMinutes(NOW, -(i * 41 + r.int(3, 30))),
        client: clients[r.int(0, clients.length - 1)].name,
        channel: r.pick(['Telegram', 'Telegram', 'Instagram', 'Booking page']),
        summary: r.pick(TOPICS[outcome]),
        outcome,
      }
    })
  }, [clients])
  return (
    <Card className="overflow-hidden">
      <Table>
        <THead>
          <TH>Time</TH>
          <TH>Client</TH>
          <TH>What happened</TH>
          <TH>Result</TH>
        </THead>
        <tbody>
          {rows.map((x) => (
            <TR key={x.id}>
              <TD muted className="whitespace-nowrap">
                {formatDayTime(x.at)}
              </TD>
              <TD>
                <span className="block">{x.client}</span>
                <span className="block text-sm text-muted">{x.channel}</span>
              </TD>
              <TD muted>{x.summary}</TD>
              <TD>
                <Badge tone={OUTCOME[x.outcome].tone}>
                  {OUTCOME[x.outcome].label}
                </Badge>
              </TD>
            </TR>
          ))}
        </tbody>
      </Table>
    </Card>
  )
}

function UsageTab() {
  const used = 186
  const limit = 300
  const day = NOW.getDate()
  const days = new Date(NOW.getFullYear(), NOW.getMonth() + 1, 0).getDate()
  const forecast = Math.round((used / day) * days)
  return (
    <>
      <SettingsSection title="Dialogs this month" description="A dialog is one conversation with a client within 24 hours.">
        <div className="mt-4 flex items-baseline justify-between">
          <span className="text-3xl font-normal text-fg tabular">
            {used} <span className="text-lg text-muted">of {limit}</span>
          </span>
          <span className="text-sm text-muted">Expected by month end: {forecast}</span>
        </div>
        <Meter value={used} max={limit} tone={forecast > limit ? 'warning' : 'accent'} className="mt-3 h-2" />
        {forecast > limit && (
          <p className="mt-3 text-sm text-muted">
            At this pace about {forecast - limit} dialogs go over the plan, around {((forecast - limit) * 0.5).toFixed(0)} TJS from your balance.
          </p>
        )}
      </SettingsSection>
      <SettingsSection title="What it did">
        <div className="mt-4 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
          <MiniStat label="Visits booked" value="41" hint="without an admin" />
          <MiniStat label="Questions answered" value="118" />
          <MiniStat label="Handed to staff" value="27" hint="15% of dialogs" />
          <MiniStat label="Avg. reply time" value="6 s" />
        </div>
      </SettingsSection>
    </>
  )
}

export default function AiSettings() {
  const [tab, setTab] = useState<Tab>('general')
  return (
    <SettingsPage title="AI assistant for clients" description="Answers clients in Telegram, Instagram and on your booking page, and books visits for them.">
      <Tabs
        value={tab}
        onChange={setTab}
        className="mb-8"
        items={[
          { value: 'general', label: 'General' },
          { value: 'knowledge', label: 'Knowledge' },
          { value: 'test', label: 'Test chat' },
          { value: 'log', label: 'Log' },
          { value: 'usage', label: 'Usage' },
        ]}
      />
      {tab === 'general' && <GeneralTab />}
      {tab === 'knowledge' && <KnowledgeTab />}
      {tab === 'test' && <TestTab />}
      {tab === 'log' && <LogTab />}
      {tab === 'usage' && <UsageTab />}
    </SettingsPage>
  )
}
