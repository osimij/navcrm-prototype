import { useState } from 'react'
import { toast } from 'sonner'
import { I, Icon } from '@/components/icons'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/controls'
import { Input } from '@/components/ui/input'
import { Meter } from '@/components/ui/misc'
import { useData } from '@/lib/store'
import { CopyField, QrPreview, Steps, useSettingsForm } from '../parts-b/shared'
import { SaveBar, SettingsPage, SettingsRow, SettingsSection } from '../ui'

const OWNER_EVENTS = [
  { key: 'booking', label: 'New online bookings' },
  { key: 'cancel', label: 'Cancellations' },
  { key: 'conflict', label: 'Booking conflicts' },
  { key: 'review', label: 'Reviews of 3★ and below' },
  { key: 'stock', label: 'Low stock' },
  { key: 'summary', label: 'Daily summary at 21:00' },
] as const

type EventKey = (typeof OWNER_EVENTS)[number]['key']

export default function TelegramSettings() {
  const clients = useData((s) => s.clients)
  const connected = clients.filter((c) => c.telegram).length
  const [token, setToken] = useState('')
  const [ownBot, setOwnBot] = useState<string | null>(null)
  const [connecting, setConnecting] = useState(false)
  const [linked, setLinked] = useState(true)
  const form = useSettingsForm<Record<EventKey, boolean>>({ booking: true, cancel: true, conflict: true, review: true, stock: false, summary: true })
  const link = ownBot ? `t.me/${ownBot}` : 't.me/NavCRM_Bot?start=sitora'
  const tokenOk = /^\d{8,10}:[A-Za-z0-9_-]{30,}$/.test(token.trim())

  return (
    <SettingsPage title="Telegram bot" description="Clients book, get reminders and receipts in Telegram for free. You get alerts there too.">
      <SettingsSection title="Bot for clients">
        <SettingsRow label="Link" description="Put it in your Instagram bio, on 2GIS and on the reception desk.">
          <CopyField value={`https://${link}`} display={link} />
        </SettingsRow>
        <SettingsRow label="QR code" description="Clients scan it at the desk and connect in two taps.">
          <div className="flex items-end gap-4">
            <QrPreview seed={ownBot ? 99 : 42} size={112} />
            <Button size="sm" icon={I.download} onClick={() => toast.success('QR code saved', { description: 'sitora-telegram-qr.png' })}>
              Download for print
            </Button>
          </div>
        </SettingsRow>
        <SettingsRow label="Clients connected" description="They get every reminder for free instead of SMS.">
          <div className="flex items-baseline justify-between">
            <span className="text-xl text-fg tabular">
              {connected} <span className="text-base text-muted">of {clients.length}</span>
            </span>
            <span className="text-sm text-muted tabular">{Math.round((connected / clients.length) * 100)}%</span>
          </div>
          <Meter value={connected} max={clients.length} tone="accent" className="mt-2" />
        </SettingsRow>
      </SettingsSection>

      <SettingsSection title="Your own bot" description="Optional. Clients see your name and logo instead of NavCRM.">
        {ownBot ? (
          <SettingsRow label="Connected bot">
            <div className="flex items-center gap-3">
              <span className="grid size-9 place-items-center rounded-full bg-[#2AABEE] text-white">
                <Icon icon={I.telegram} size={18} />
              </span>
              <span className="flex-1">
                <span className="block text-base text-fg">@{ownBot}</span>
                <span className="block text-sm text-muted">Clients of the shared bot are moved over automatically</span>
              </span>
              <Button size="sm" variant="ghost" onClick={() => (setOwnBot(null), toast('Switched back to @NavCRM_Bot'))}>
                Disconnect
              </Button>
            </div>
          </SettingsRow>
        ) : (
          <>
            <SettingsRow label="How to create one">
              <Steps
                items={[
                  <>Open @BotFather in Telegram and send /newbot.</>,
                  <>Name it, for example “Sitora Beauty”.</>,
                  <>Copy the token BotFather sends and paste it here.</>,
                ]}
              />
            </SettingsRow>
            <SettingsRow label="Bot token">
              <div className="flex gap-2">
                <Input
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  placeholder="7012345678:AAH…"
                  className="flex-1"
                  aria-invalid={token.length > 0 && !tokenOk}
                />
                <Button
                  disabled={!tokenOk}
                  loading={connecting}
                  onClick={() => {
                    setConnecting(true)
                    setTimeout(() => {
                      setConnecting(false)
                      setOwnBot('SitoraBeautyBot')
                      setToken('')
                      toast.success('@SitoraBeautyBot connected')
                    }, 900)
                  }}
                >
                  Connect
                </Button>
              </div>
              {token.length > 0 && !tokenOk && <p className="mt-1.5 text-xs text-faint">A token looks like 7012345678:AAH… with 35 characters after the colon.</p>}
            </SettingsRow>
          </>
        )}
      </SettingsSection>

      <SettingsSection title="Alerts for you">
        <SettingsRow label="Your Telegram" description="Business alerts go here, separate from client chats.">
          {linked ? (
            <div className="flex items-center justify-between gap-3">
              <span className="flex items-center gap-2">
                <span className="text-base text-fg">@zarina_k</span>
                <Badge tone="positive">
                  Connected
                </Badge>
              </span>
              <Button size="sm" variant="ghost" onClick={() => (setLinked(false), toast('Telegram alerts turned off'))}>
                Unlink
              </Button>
            </div>
          ) : (
            <Button size="sm" icon={I.telegram} onClick={() => (setLinked(true), toast.success('Telegram linked as @zarina_k'))}>
              Link Telegram
            </Button>
          )}
        </SettingsRow>
        <SettingsRow label="Send me">
          <div className={linked ? 'flex flex-col gap-3' : 'pointer-events-none flex flex-col gap-3 opacity-45'}>
            {OWNER_EVENTS.map((e) => (
              <Switch key={e.key} checked={form.value[e.key]} onChange={(on) => form.set(e.key, on)} label={e.label} />
            ))}
          </div>
        </SettingsRow>
      </SettingsSection>

      <SaveBar dirty={form.dirty} onSave={form.save} onDiscard={form.discard} />
    </SettingsPage>
  )
}
