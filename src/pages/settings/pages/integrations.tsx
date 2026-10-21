import { useState } from 'react'
import { useNavigate } from 'react-router'
import { toast } from 'sonner'
import { I } from '@/components/icons'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { DetailRow, Modal } from '@/components/ui/dialog'
import { Field, Input } from '@/components/ui/input'
import { Tabs } from '@/components/ui/tabs'
import { ProviderMark } from '../parts-b/shared'
import { SettingsPage } from '../ui'

type Group = 'payments' | 'telephony' | 'calendars' | 'accounting'
type Kind = 'payment' | 'sms' | 'api' | 'oauth' | 'link' | 'builtin'
type Provider = {
  id: string
  group: Group
  name: string
  description: string
  kind: Kind
  connected?: boolean
  detail?: [string, string][]
}

const PROVIDERS: Provider[] = [
  { id: 'alif', group: 'payments', name: 'Alif', description: 'QR at the register and online prepayment', kind: 'payment', connected: true, detail: [['Merchant', 'Sitora Beauty LLC'], ['Connected', '14 Mar'], ['Payments this month', '214']] },
  { id: 'dc', group: 'payments', name: 'DC NEXT', description: 'DC Wallet QR and Dushanbe City cards', kind: 'payment', connected: true, detail: [['Merchant', 'Sitora Beauty LLC'], ['Connected', '2 Jun'], ['Payments this month', '96']] },
  { id: 'milli', group: 'payments', name: 'Korti Milli', description: 'National card payments at the register', kind: 'payment' },
  { id: 'eskhata', group: 'payments', name: 'Eskhata', description: 'QR payments through the Eskhata app', kind: 'payment' },
  { id: 'amonat', group: 'payments', name: 'Amonatbonk', description: 'QR payments through Amonatbonk', kind: 'payment' },
  { id: 'vasl', group: 'payments', name: 'Vasl', description: 'QR payments through the Vasl wallet', kind: 'payment' },
  { id: 'sms', group: 'payments', name: 'Own SMS gateway', description: 'Send SMS through your provider and sender name instead of NavCRM’s', kind: 'sms' },
  { id: 'tcell', group: 'telephony', name: 'Tcell Business', description: 'Incoming calls open the client’s card; missed calls become tasks', kind: 'api' },
  { id: 'megafon', group: 'telephony', name: 'MegaFon Tajikistan', description: 'Same for MegaFon business numbers', kind: 'api' },
  { id: 'sip', group: 'telephony', name: 'SIP PBX', description: 'Any office phone system that supports SIP, such as Asterisk', kind: 'api' },
  { id: 'google', group: 'calendars', name: 'Google Calendar', description: 'Two-way: your visits appear in Google, busy time blocks booking', kind: 'oauth', connected: true, detail: [['Account', 'zarina.karimova@gmail.com'], ['Calendar', 'Sitora visits'], ['Last sync', '2 min ago']] },
  { id: 'apple', group: 'calendars', name: 'Apple Calendar', description: 'One-way, through your personal calendar link', kind: 'link' },
  { id: 'outlook', group: 'calendars', name: 'Outlook', description: 'One-way, through your personal calendar link', kind: 'link' },
  { id: '1c', group: 'accounting', name: '1C:Accounting', description: 'Daily export of receipts, expenses and payroll', kind: 'api' },
  { id: 'excel', group: 'accounting', name: 'Excel', description: 'Download any report or the full ledger as a spreadsheet', kind: 'builtin' },
]

const TABS: { value: Group; label: string }[] = [
  { value: 'payments', label: 'Payments & SMS' },
  { value: 'telephony', label: 'Telephony' },
  { value: 'calendars', label: 'Calendars' },
  { value: 'accounting', label: 'Accounting' },
]

function ConnectModal({ provider, onClose, onConnected }: { provider: Provider | null; onClose: () => void; onConnected: (id: string) => void }) {
  const [a, setA] = useState('')
  const [b, setB] = useState('')
  const [busy, setBusy] = useState(false)
  const [prev, setPrev] = useState<Provider | null>(null)
  const [shown, setShown] = useState<Provider | null>(null)
  if (provider !== prev) {
    setPrev(provider)
    if (provider) {
      setShown(provider)
      setA('')
      setB('')
    }
  }
  const p = shown
  const needs = p?.kind === 'oauth' ? 0 : p?.kind === 'payment' || p?.kind === 'sms' ? 2 : 1
  const ready = (needs < 1 || a.trim()) && (needs < 2 || b.trim())

  function connect() {
    if (!p) return
    setBusy(true)
    setTimeout(() => {
      setBusy(false)
      onConnected(p.id)
      toast.success(`${p.name} connected`)
    }, 900)
  }

  if (p?.connected) {
    return (
      <Modal
        open={!!provider}
        onOpenChange={(o) => !o && onClose()}
        title={p.name}
        description={p.description}
        size="sm"
        footer={
          <>
            <Button
              variant="danger"
              className="mr-auto"
              onClick={() => {
                onConnected(p.id)
                toast(`${p.name} disconnected`)
              }}
            >
              Disconnect
            </Button>
            <Button variant="primary" onClick={onClose}>
              Done
            </Button>
          </>
        }
      >
        <div className="divide-y divide-border">
          {p.detail?.map(([k, v]) => (
            <DetailRow key={k} label={k}>
              {v}
            </DetailRow>
          ))}
        </div>
      </Modal>
    )
  }

  return (
    <Modal
      open={!!provider}
      onOpenChange={(o) => !o && onClose()}
      title={`Connect ${p?.name ?? ''}`}
      description={p?.description}
      size="sm"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" loading={busy} disabled={!ready} onClick={connect} icon={p?.kind === 'oauth' ? I.arrowUpRight : undefined}>
            {p?.kind === 'oauth' ? 'Continue with Google' : 'Connect'}
          </Button>
        </>
      }
    >
      {p?.kind === 'oauth' ? (
        <p className="text-base text-muted">You’ll sign in with Google and pick which calendar to sync. NavCRM only sees free and busy time in other calendars.</p>
      ) : (
        <div className="flex flex-col gap-4">
          {p?.kind === 'payment' && (
            <>
              <Field label="Merchant ID" hint={`From your ${p.name} business account`}>
                <Input value={a} onChange={(e) => setA(e.target.value)} autoFocus />
              </Field>
              <Field label="Secret key">
                <Input type="password" value={b} onChange={(e) => setB(e.target.value)} />
              </Field>
            </>
          )}
          {p?.kind === 'sms' && (
            <>
              <Field label="Provider’s API address">
                <Input value={a} onChange={(e) => setA(e.target.value)} placeholder="https://" autoFocus />
              </Field>
              <Field label="API key">
                <Input type="password" value={b} onChange={(e) => setB(e.target.value)} />
              </Field>
            </>
          )}
          {p?.kind === 'api' && (
            <Field label="API key" hint="Your provider’s support can issue one for NavCRM">
              <Input value={a} onChange={(e) => setA(e.target.value)} autoFocus />
            </Field>
          )}
        </div>
      )}
    </Modal>
  )
}

export default function IntegrationsSettings() {
  const navigate = useNavigate()
  const [tab, setTab] = useState<Group>('payments')
  const [providers, setProviders] = useState(PROVIDERS)
  const [open, setOpen] = useState<Provider | null>(null)
  const list = providers.filter((p) => p.group === tab)

  return (
    <SettingsPage title="Integrations" description="Banks, phones, calendars and accounting connected to NavCRM.">
      <Tabs
        value={tab}
        onChange={setTab}
        className="mb-6"
        items={TABS.map((t) => ({ ...t, count: providers.filter((p) => p.group === t.value && p.connected).length || undefined }))}
      />
      <div className="grid gap-3 sm:grid-cols-2">
        {list.map((p) => (
          <div key={p.id} className="flex flex-col rounded-2xl bg-surface p-5 ring-1 ring-border">
            <div className="flex items-start gap-3">
              <ProviderMark name={p.name} tone={p.connected ? 'accent' : 'neutral'} />
              <div className="min-w-0 flex-1">
                <div className="text-base font-medium text-fg">{p.name}</div>
                <p className="mt-0.5 text-sm text-muted">{p.description}</p>
              </div>
            </div>
            <div className="mt-5 flex items-center justify-between">
              {p.connected ? (
                <Badge tone="positive" dot>
                  Connected
                </Badge>
              ) : p.kind === 'builtin' ? (
                <Badge>Built in</Badge>
              ) : (
                <span className="text-sm text-faint">Not connected</span>
              )}
              {p.kind === 'builtin' ? (
                <Button size="sm" variant="ghost" onClick={() => navigate('/reports')}>
                  Open reports
                </Button>
              ) : p.kind === 'link' ? (
                <Button size="sm" variant="secondary" onClick={() => navigate('/settings/calendar-sync')}>
                  Get link
                </Button>
              ) : (
                <Button size="sm" variant={p.connected ? 'ghost' : 'secondary'} onClick={() => setOpen(p)}>
                  {p.connected ? 'Manage' : 'Connect'}
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>
      <ConnectModal
        provider={open}
        onClose={() => setOpen(null)}
        onConnected={(id) => {
          setProviders((l) => l.map((x) => (x.id === id ? { ...x, connected: !x.connected, detail: x.detail ?? [['Connected', 'Today'], ['Status', 'Working']] } : x)))
          setOpen(null)
        }}
      />
    </SettingsPage>
  )
}
