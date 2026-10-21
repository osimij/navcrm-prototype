import { useState } from 'react'
import { toast } from 'sonner'
import { I, Icon } from '@/components/icons'
import { Badge } from '@/components/ui/badge'
import { Button, IconButton } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/controls'
import { Modal } from '@/components/ui/dialog'
import { Field, Input } from '@/components/ui/input'
import { EmptyState } from '@/components/ui/misc'
import { Segmented, Tabs } from '@/components/ui/tabs'
import { TD, TH, THead, TR, Table } from '@/components/ui/table'
import { formatDate, formatRelative } from '@/lib/format'
import { NOW, TODAY, addDays, addMinutes } from '@/lib/time'
import { CopyField, copyText } from '../parts-b/shared'
import { SettingsPage, SettingsRow, SettingsSection } from '../ui'

type Key = { id: string; name: string; tail: string; access: 'read' | 'write'; created: Date; used: Date | null }
type Hook = { id: string; url: string; events: string[]; ok: boolean; last: Date }

const KEYS: Key[] = [
  { id: 'k1', name: 'Website booking widget', tail: '3f9a', access: 'write', created: addDays(TODAY, -142), used: addMinutes(NOW, -4) },
  { id: 'k2', name: 'Accountant export', tail: 'b71c', access: 'read', created: addDays(TODAY, -60), used: addDays(NOW, -2) },
]
const HOOKS: Hook[] = [{ id: 'h1', url: 'https://sitora.tj/api/navcrm', events: ['visit.created', 'visit.cancelled'], ok: true, last: addMinutes(NOW, -11) }]

const EVENTS = ['visit.created', 'visit.updated', 'visit.cancelled', 'client.created', 'receipt.paid', 'review.created']

function randomKey() {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789'
  return `nc_live_${Array.from({ length: 32 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')}`
}

function KeysTab() {
  const [keys, setKeys] = useState(KEYS)
  const [creating, setCreating] = useState(false)
  const [name, setName] = useState('')
  const [access, setAccess] = useState<'read' | 'write'>('read')
  const [secret, setSecret] = useState<string | null>(null)

  const close = () => {
    setCreating(false)
    setTimeout(() => {
      setSecret(null)
      setName('')
      setAccess('read')
    }, 200)
  }

  return (
    <>
      <SettingsSection
        title="API keys"
        description="Each key acts on behalf of your business. Give each tool its own key so you can revoke one without breaking the rest."
        action={
          <Button variant="primary" size="sm" icon={I.add} onClick={() => setCreating(true)}>
            New key
          </Button>
        }
      >
        {keys.length ? (
          <Card className="mt-4 overflow-hidden">
            <Table>
              <THead>
                <TH>Name</TH>
                <TH>Key</TH>
                <TH>Last used</TH>
                <TH />
              </THead>
              <tbody>
                {keys.map((k) => (
                  <TR key={k.id}>
                    <TD>
                      <span className="block">{k.name}</span>
                      <span className="block text-sm text-muted">
                        {k.access === 'write' ? 'Read & write' : 'Read only'} · created {formatDate(k.created)}
                      </span>
                    </TD>
                    <TD muted className="tabular">
                      nc_live_••••{k.tail}
                    </TD>
                    <TD muted>{k.used ? formatRelative(k.used) : 'Never'}</TD>
                    <TD align="right">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setKeys((l) => l.filter((x) => x.id !== k.id))
                          toast(`“${k.name}” revoked`, { description: 'Requests with this key stop working right away.' })
                        }}
                      >
                        Revoke
                      </Button>
                    </TD>
                  </TR>
                ))}
              </tbody>
            </Table>
          </Card>
        ) : (
          <EmptyState icon={I.key} title="No API keys" description="Create one to connect your website or another tool." />
        )}
      </SettingsSection>

      <Modal
        open={creating}
        onOpenChange={(o) => !o && close()}
        title={secret ? 'Copy your key' : 'New API key'}
        size="sm"
        footer={
          secret ? (
            <Button variant="primary" onClick={close}>
              Done
            </Button>
          ) : (
            <>
              <Button variant="ghost" onClick={close}>
                Cancel
              </Button>
              <Button
                variant="primary"
                disabled={!name.trim()}
                onClick={() => {
                  const s = randomKey()
                  setSecret(s)
                  setKeys((l) => [...l, { id: `k${Date.now()}`, name: name.trim(), tail: s.slice(-4), access, created: TODAY, used: null }])
                }}
              >
                Create key
              </Button>
            </>
          )
        }
      >
        {secret ? (
          <div className="flex flex-col gap-3">
            <p className="flex items-start gap-2 rounded-xl bg-warning-soft px-3.5 py-3 text-sm text-warning">
              <Icon icon={I.alert} size={16} className="mt-px" />
              This is the only time you’ll see the full key. Store it somewhere safe.
            </p>
            <CopyField value={secret} />
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <Field label="Name" hint="Where you’ll use it, so you recognise it later">
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Website" autoFocus />
            </Field>
            <Field label="Access">
              <Segmented
                fill
                value={access}
                onChange={setAccess}
                items={[
                  { value: 'read', label: 'Read only' },
                  { value: 'write', label: 'Read & write' },
                ]}
              />
            </Field>
          </div>
        )}
      </Modal>
    </>
  )
}

function HooksTab() {
  const [hooks, setHooks] = useState(HOOKS)
  const [adding, setAdding] = useState(false)
  const [url, setUrl] = useState('')
  const [events, setEvents] = useState<string[]>(['visit.created'])
  const valid = /^https:\/\/[^\s.]+\.[^\s]+/.test(url)

  return (
    <>
      <SettingsSection
        title="Webhooks"
        description="We send a POST request to your address when something happens. Failed deliveries retry for 24 hours."
        action={
          <Button variant="primary" size="sm" icon={I.add} onClick={() => setAdding(true)}>
            Add webhook
          </Button>
        }
      >
        <Card className="mt-4 overflow-hidden">
          <Table>
            <THead>
              <TH>Address</TH>
              <TH>Events</TH>
              <TH>Last delivery</TH>
              <TH />
            </THead>
            <tbody>
              {hooks.map((h) => (
                <TR key={h.id}>
                  <TD className="max-w-[260px] truncate">{h.url}</TD>
                  <TD>
                    <span className="flex flex-wrap gap-1">
                      {h.events.map((e) => (
                        <Badge key={e}>{e}</Badge>
                      ))}
                    </span>
                  </TD>
                  <TD>
                    <Badge tone={h.ok ? 'positive' : 'negative'} dot>
                      {h.ok ? formatRelative(h.last) : 'Failing'}
                    </Badge>
                  </TD>
                  <TD align="right">
                    <IconButton
                      icon={I.delete}
                      label="Delete webhook"
                      size="sm"
                      onClick={() => {
                        setHooks((l) => l.filter((x) => x.id !== h.id))
                        toast('Webhook deleted')
                      }}
                    />
                  </TD>
                </TR>
              ))}
            </tbody>
          </Table>
        </Card>
      </SettingsSection>
      <Modal
        open={adding}
        onOpenChange={(o) => !o && setAdding(false)}
        title="Add webhook"
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setAdding(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              disabled={!valid || !events.length}
              onClick={() => {
                setHooks((l) => [...l, { id: `h${Date.now()}`, url, events, ok: true, last: NOW }])
                setAdding(false)
                setUrl('')
                toast.success('Webhook added', { description: 'We sent a test event to check it.' })
              }}
            >
              Add
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          <Field label="Address" hint="Must start with https://">
            <Input value={url} onChange={(e) => setUrl(e.target.value.trim())} placeholder="https://example.tj/hooks/navcrm" autoFocus />
          </Field>
          <Field label="Send when">
            <div className="flex flex-col gap-2.5">
              {EVENTS.map((e) => (
                <Checkbox
                  key={e}
                  checked={events.includes(e)}
                  onChange={(on) => setEvents((l) => (on ? [...l, e] : l.filter((x) => x !== e)))}
                  label={<span className="tabular">{e}</span>}
                />
              ))}
            </div>
          </Field>
        </div>
      </Modal>
    </>
  )
}

const SAMPLE = `curl https://api.navcrm.tj/v1/visits?date=today \\
  -H "Authorization: Bearer nc_live_…"`

function DocsTab() {
  return (
    <>
      <SettingsSection title="Getting started">
        <SettingsRow label="Base address">
          <CopyField value="https://api.navcrm.tj/v1" />
        </SettingsRow>
        <SettingsRow label="Authentication" description="Send your key in the Authorization header.">
          <div className="relative">
            <pre className="overflow-x-auto rounded-xl bg-fill p-3.5 text-sm leading-6 text-fg">{SAMPLE}</pre>
            <IconButton icon={I.copy} label="Copy example" size="sm" className="absolute top-2 right-2" onClick={() => copyText(SAMPLE)} />
          </div>
        </SettingsRow>
        <SettingsRow label="Limits" description="Requests over the limit get a 429 response.">
          120 requests a minute per key
        </SettingsRow>
      </SettingsSection>
      <SettingsSection title="Reference">
        {[
          ['Clients', 'Search, create and update clients and their consents'],
          ['Visits', 'Free slots, booking, moving and cancelling'],
          ['Receipts', 'Paid receipts, refunds and payment methods'],
          ['Webhooks', 'Event types and payload examples'],
        ].map(([t, d]) => (
          <button
            key={t}
            type="button"
            onClick={() => toast(`Opens docs.navcrm.tj/api/${t.toLowerCase()}`)}
            className="-mx-3 flex w-[calc(100%+1.5rem)] items-center gap-3 rounded-xl px-3 py-3.5 text-left hover:bg-fill"
          >
            <span className="flex-1">
              <span className="block text-base text-fg">{t}</span>
              <span className="block text-sm text-muted">{d}</span>
            </span>
            <Icon icon={I.arrowUpRight} size={16} className="text-faint" />
          </button>
        ))}
      </SettingsSection>
    </>
  )
}

export default function ApiSettings() {
  const [tab, setTab] = useState<'keys' | 'hooks' | 'docs'>('keys')
  return (
    <SettingsPage title="API & webhooks" description="For your website or developer. Only owners can manage keys.">
      <Tabs
        value={tab}
        onChange={setTab}
        className="mb-8"
        items={[
          { value: 'keys', label: 'API keys' },
          { value: 'hooks', label: 'Webhooks' },
          { value: 'docs', label: 'Docs' },
        ]}
      />
      {tab === 'keys' && <KeysTab />}
      {tab === 'hooks' && <HooksTab />}
      {tab === 'docs' && <DocsTab />}
    </SettingsPage>
  )
}
