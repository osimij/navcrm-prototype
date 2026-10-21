import { useState } from 'react'
import { toast } from 'sonner'
import { I, Icon } from '@/components/icons'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Switch } from '@/components/ui/controls'
import { DetailRow, Modal, Sheet } from '@/components/ui/dialog'
import { Field, Input, Textarea } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Segmented, Tabs } from '@/components/ui/tabs'
import { Table, TD, TH, THead, TR } from '@/components/ui/table'
import { formatDate } from '@/lib/format'
import { TODAY, addDays } from '@/lib/time'
import { SettingsPage } from '../ui'

type Consent = {
  id: string
  name: string
  version: number
  reviewed: boolean
  signed: number
  updated: Date
  appliesTo: string
  text: string
  history: { version: number; date: Date; note: string }[]
}

const CONSENTS: Consent[] = [
  {
    id: 'k1',
    name: 'Processing of personal data',
    version: 3,
    reviewed: true,
    signed: 1284,
    updated: addDays(TODAY, -94),
    appliesTo: 'Every client',
    text: 'I agree that Sitora Beauty stores my name, phone number and visit history to book visits, send reminders and keep records required by law. I can ask to see or delete my data at any time.',
    history: [
      { version: 3, date: addDays(TODAY, -94), note: 'Added data deletion request' },
      { version: 2, date: addDays(TODAY, -290), note: 'Updated retention period' },
    ],
  },
  {
    id: 'k2',
    name: 'Offers and promotions',
    version: 2,
    reviewed: true,
    signed: 1096,
    updated: addDays(TODAY, -180),
    appliesTo: 'Every client',
    text: 'I agree to receive news, offers and birthday greetings from Sitora Beauty in Telegram, SMS or WhatsApp. I can unsubscribe with one tap.',
    history: [{ version: 2, date: addDays(TODAY, -180), note: 'Added WhatsApp' }],
  },
  {
    id: 'k3',
    name: 'Cosmetology procedure',
    version: 4,
    reviewed: true,
    signed: 318,
    updated: addDays(TODAY, -41),
    appliesTo: 'Facial cleansing, Chemical peel',
    text: 'I was told how the procedure works, its possible side effects such as redness for 1–2 days, and how to care for my skin after it. I have no contraindications I haven’t mentioned.',
    history: [{ version: 4, date: addDays(TODAY, -41), note: 'Added aftercare section' }],
  },
  {
    id: 'k4',
    name: 'Injection procedure',
    version: 1,
    reviewed: false,
    signed: 22,
    updated: addDays(TODAY, -12),
    appliesTo: 'Biorevitalization',
    text: 'I confirm I am not pregnant or breastfeeding, have no active skin infections, and understand the procedure may cause swelling and small bruises for up to a week.',
    history: [{ version: 1, date: addDays(TODAY, -12), note: 'First version' }],
  },
  {
    id: 'k5',
    name: 'Publishing before & after photos',
    version: 1,
    reviewed: true,
    signed: 147,
    updated: addDays(TODAY, -210),
    appliesTo: 'Asked after the visit',
    text: 'I allow Sitora Beauty to publish photos of the result on Instagram and in the NavCRM catalog. My face can be hidden on request.',
    history: [{ version: 1, date: addDays(TODAY, -210), note: 'First version' }],
  },
  {
    id: 'k6',
    name: 'Laboratory tests',
    version: 2,
    reviewed: false,
    signed: 203,
    updated: addDays(TODAY, -8),
    appliesTo: 'Every lab order',
    text: 'I agree to give a sample for the tests ordered and for my results to be shared with my doctor and sent to me in Telegram.',
    history: [{ version: 2, date: addDays(TODAY, -8), note: 'Results now sent in Telegram' }],
  },
]

const FORMS = [
  {
    id: 'q1',
    name: 'Before a cosmetology procedure',
    questions: ['Are you pregnant or breastfeeding?', 'Do you have allergies to medicines or cosmetics?', 'Have you had a peel or laser in the last month?', 'Do you take isotretinoin?', 'Any skin conditions right now?'],
    usedBy: 'Facial cleansing, Chemical peel, Biorevitalization',
    sent: '24 hours before, in Telegram',
  },
  {
    id: 'q2',
    name: 'Lash extensions: allergies',
    questions: ['Have you reacted to lash glue before?', 'Do you wear contact lenses?', 'Any eye infections right now?'],
    usedBy: 'Lash extensions, Lash lamination',
    sent: '24 hours before, in Telegram',
  },
  {
    id: 'q3',
    name: 'New client',
    questions: ['How did you hear about us?', 'What’s your hair type?', 'Do you prefer a quiet visit?', 'Your birthday (for a gift)'],
    usedBy: 'First visit of every client',
    sent: 'With the booking confirmation',
  },
]

export default function ConsentsSettings() {
  const [tab, setTab] = useState<'consents' | 'forms'>('consents')
  const [list, setList] = useState(CONSENTS)
  const [open, setOpen] = useState<string | null>(null)
  const [form, setForm] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)
  const [draft, setDraft] = useState({ name: '', applies: 'all', lang: 'tg' as 'tg' | 'ru' | 'en', text: '', how: 'tablet', everyVisit: false })
  const [forms, setForms] = useState(FORMS)
  const [newForm, setNewForm] = useState(false)
  const [fDraft, setFDraft] = useState({ name: '', when: '24 hours before, in Telegram', questions: [] as string[], q: '' })

  const current = list.find((c) => c.id === open)
  const currentForm = forms.find((f) => f.id === form)

  function addQuestion() {
    const q = fDraft.q.trim()
    if (q) setFDraft({ ...fDraft, questions: [...fDraft.questions, q], q: '' })
  }

  return (
    <SettingsPage
      wide
      title="Consents & forms"
      description="What clients sign and fill in before a visit. Signed copies are stored with the client’s record."
      actions={
        tab === 'consents' ? (
          <Button variant="primary" icon={I.add} onClick={() => setCreating(true)}>
            New consent
          </Button>
        ) : (
          <Button
            variant="primary"
            icon={I.add}
            onClick={() => {
              setFDraft({ name: '', when: '24 hours before, in Telegram', questions: [], q: '' })
              setNewForm(true)
            }}
          >
            New questionnaire
          </Button>
        )
      }
    >
      <Tabs
        value={tab}
        onChange={setTab}
        className="mb-5"
        items={[
          { value: 'consents', label: 'Consents', count: list.length },
          { value: 'forms', label: 'Questionnaires', count: forms.length },
        ]}
      />

      {tab === 'consents' ? (
        <Card>
          <Table>
            <THead>
              <TH>Consent</TH>
              <TH>Version</TH>
              <TH>Legal review</TH>
              <TH align="right">Signed</TH>
              <TH>Updated</TH>
            </THead>
            <tbody>
              {list.map((c) => (
                <TR key={c.id} onClick={() => setOpen(c.id)}>
                  <TD>
                    <div>{c.name}</div>
                    <div className="text-sm text-muted">{c.appliesTo}</div>
                  </TD>
                  <TD muted>v{c.version}</TD>
                  <TD>
                    {c.reviewed ? (
                      <Badge tone="positive">
                        Reviewed by a lawyer
                      </Badge>
                    ) : (
                      <Badge tone="warning">
                        Not reviewed yet
                      </Badge>
                    )}
                  </TD>
                  <TD align="right">{c.signed.toLocaleString('en-US')}</TD>
                  <TD muted>{formatDate(c.updated)}</TD>
                </TR>
              ))}
            </tbody>
          </Table>
        </Card>
      ) : (
        <Card>
          <Table>
            <THead>
              <TH>Questionnaire</TH>
              <TH align="right">Questions</TH>
              <TH>Sent for</TH>
              <TH>When</TH>
            </THead>
            <tbody>
              {forms.map((f) => (
                <TR key={f.id} onClick={() => setForm(f.id)}>
                  <TD>{f.name}</TD>
                  <TD align="right">{f.questions.length}</TD>
                  <TD muted>{f.usedBy}</TD>
                  <TD muted>{f.sent}</TD>
                </TR>
              ))}
            </tbody>
          </Table>
        </Card>
      )}

      <Sheet
        open={!!current}
        onOpenChange={(o) => !o && setOpen(null)}
        eyebrow="Consent"
        title={current?.name}
        footer={
          current && (
            <>
              <Button variant="secondary" icon={I.edit} onClick={() => toast.success(`Version ${current.version + 1} draft created`, { description: 'Clients sign the new version on their next visit.' })}>
                New version
              </Button>
              {!current.reviewed && (
                <Button
                  variant="ghost"
                  onClick={() => {
                    setList((l) => l.map((c) => (c.id === current.id ? { ...c, reviewed: true } : c)))
                    toast.success('Marked as reviewed by a lawyer')
                  }}
                >
                  Mark as reviewed
                </Button>
              )}
            </>
          )
        }
      >
        {current && (
          <div className="p-5">
            {!current.reviewed && (
              <div className="mb-4 flex items-start gap-2 rounded-xl bg-warning-soft px-3.5 py-3 text-sm text-warning">
                <Icon icon={I.alert} size={16} className="mt-px" />
                Have a lawyer check this text before clients sign it. Medical consents carry legal weight.
              </div>
            )}
            <div className="divide-y divide-border">
              <DetailRow label="Applies to">{current.appliesTo}</DetailRow>
              <DetailRow label="Version">v{current.version}</DetailRow>
              <DetailRow label="Signed">{current.signed.toLocaleString('en-US')} clients</DetailRow>
            </div>
            <div className="mt-5 rounded-xl bg-fill p-4 text-base leading-6 text-fg">{current.text}</div>
            <div className="mt-6 text-sm font-medium text-muted">History</div>
            <ul className="mt-2">
              {current.history.map((h) => (
                <li key={h.version} className="flex items-baseline gap-3 py-1.5 text-sm">
                  <span className="w-8 text-faint">v{h.version}</span>
                  <span className="flex-1 text-fg">{h.note}</span>
                  <span className="text-muted">{formatDate(h.date, { year: true })}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </Sheet>

      <Sheet open={!!currentForm} onOpenChange={(o) => !o && setForm(null)} eyebrow="Questionnaire" title={currentForm?.name}>
        {currentForm && (
          <div className="p-5">
            <div className="divide-y divide-border">
              <DetailRow label="Sent for">{currentForm.usedBy}</DetailRow>
              <DetailRow label="When">{currentForm.sent}</DetailRow>
            </div>
            <ol className="mt-5 flex flex-col gap-2">
              {currentForm.questions.map((q, i) => (
                <li key={q} className="flex gap-3 rounded-xl bg-fill px-4 py-3 text-base text-fg">
                  <span className="text-faint tabular">{i + 1}</span>
                  {q}
                </li>
              ))}
            </ol>
            <p className="mt-4 text-sm text-muted">Answers appear on the visit and in the client’s profile. Risky answers alert the master.</p>
          </div>
        )}
      </Sheet>

      <Modal
        open={creating}
        onOpenChange={setCreating}
        title="New consent"
        size="lg"
        footer={
          <>
            <Button variant="ghost" onClick={() => setCreating(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              disabled={!draft.name.trim() || !draft.text.trim()}
              onClick={() => {
                setList((l) => [
                  ...l,
                  {
                    id: `k${Date.now()}`,
                    name: draft.name.trim(),
                    version: 1,
                    reviewed: false,
                    signed: 0,
                    updated: TODAY,
                    appliesTo: draft.applies === 'all' ? 'Every client' : 'Selected services',
                    text: draft.text.trim(),
                    history: [{ version: 1, date: TODAY, note: 'First version' }],
                  },
                ])
                setCreating(false)
                setDraft({ name: '', applies: 'all', lang: 'tg', text: '', how: 'tablet', everyVisit: false })
                toast.success('Consent created', { description: 'Send it to a lawyer before clients sign it.' })
              }}
            >
              Create consent
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          <Field label="Name">
            <Input autoFocus value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} placeholder="e.g. Laser hair removal" />
          </Field>
          <Field label="Who signs it">
            <Select
              value={draft.applies}
              onChange={(applies) => setDraft({ ...draft, applies })}
              options={[
                { value: 'all', label: 'Every client' },
                { value: 'services', label: 'Clients booking specific services' },
              ]}
            />
          </Field>
          <Field label="Text" hint="Write all three languages; clients see their own.">
            <div className="flex flex-col gap-2">
              <Segmented
                size="sm"
                value={draft.lang}
                onChange={(lang) => setDraft({ ...draft, lang })}
                items={[
                  { value: 'tg', label: 'Тоҷикӣ' },
                  { value: 'ru', label: 'Русский' },
                  { value: 'en', label: 'English' },
                ]}
              />
              <Textarea className="min-h-32" value={draft.text} onChange={(e) => setDraft({ ...draft, text: e.target.value })} placeholder="I was told how the procedure works…" />
            </div>
          </Field>
          <Field label="How clients sign">
            <Segmented
              fill
              value={draft.how}
              onChange={(how) => setDraft({ ...draft, how })}
              items={[
                { value: 'tablet', label: 'On a tablet at reception' },
                { value: 'telegram', label: 'Link in Telegram' },
              ]}
            />
          </Field>
          <Switch checked={draft.everyVisit} onChange={(everyVisit) => setDraft({ ...draft, everyVisit })} label="Ask again at every visit" description="For procedures where health can change between visits." />
        </div>
      </Modal>
      <Modal
        open={newForm}
        onOpenChange={setNewForm}
        title="New questionnaire"
        description="Clients fill it in before the visit, so the master knows what to expect."
        footer={
          <>
            <Button variant="ghost" onClick={() => setNewForm(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              disabled={!fDraft.name.trim() || !fDraft.questions.length}
              onClick={() => {
                setForms((l) => [...l, { id: `q${Date.now()}`, name: fDraft.name.trim(), questions: fDraft.questions, usedBy: 'Not linked to services yet', sent: fDraft.when }])
                setNewForm(false)
                toast.success('Questionnaire created', { description: 'Link it to services to start sending it.' })
              }}
            >
              Create
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          <Field label="Name">
            <Input autoFocus value={fDraft.name} onChange={(e) => setFDraft({ ...fDraft, name: e.target.value })} placeholder="e.g. Before laser hair removal" />
          </Field>
          <Field label="When to send">
            <Select
              value={fDraft.when}
              onChange={(when) => setFDraft({ ...fDraft, when })}
              options={['With the booking confirmation', '24 hours before, in Telegram', 'On arrival, on a tablet'].map((v) => ({ value: v, label: v }))}
            />
          </Field>
          <Field label="Questions" hint="Press Enter to add each question.">
            <div className="flex flex-col gap-2">
              {fDraft.questions.map((q, i) => (
                <div key={i} className="flex items-center gap-3 rounded-lg bg-fill px-3 py-2 text-base text-fg">
                  <span className="text-faint tabular">{i + 1}</span>
                  <span className="flex-1">{q}</span>
                  <button
                    type="button"
                    aria-label="Remove question"
                    onClick={() => setFDraft({ ...fDraft, questions: fDraft.questions.filter((_, j) => j !== i) })}
                    className="grid size-6 place-items-center rounded-full text-faint hover:bg-fill-hover hover:text-fg"
                  >
                    <Icon icon={I.close} size={13} />
                  </button>
                </div>
              ))}
              <Input
                value={fDraft.q}
                onChange={(e) => setFDraft({ ...fDraft, q: e.target.value })}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    addQuestion()
                  }
                }}
                placeholder="e.g. Are you taking any medication?"
              />
            </div>
          </Field>
        </div>
      </Modal>
    </SettingsPage>
  )
}
