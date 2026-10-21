import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { I, Icon } from '@/components/icons'
import { Badge } from '@/components/ui/badge'
import { Button, IconButton } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Switch } from '@/components/ui/controls'
import { Modal } from '@/components/ui/dialog'
import { Field, Input } from '@/components/ui/input'
import { Menu, MenuItem, MenuSeparator } from '@/components/ui/menu'
import { KeyValue } from '@/components/ui/misc'
import { formatDate } from '@/lib/format'
import { partners as initialPartners, type Partner } from './data'

const STATUS: Record<Partner['status'], { label: string; tone: 'positive' | 'warning' | 'neutral' }> = {
  connected: { label: 'Connected via HTTP API', tone: 'positive' },
  test: { label: 'Test mode', tone: 'warning' },
  off: { label: 'Not connected', tone: 'neutral' },
}

function ConnectModal({ partner, onClose, onConnect }: { partner: Partner | null; onClose: () => void; onConnect: (test: boolean) => void }) {
  const [url, setUrl] = useState('')
  const [key, setKey] = useState('')
  const [test, setTest] = useState(true)
  useEffect(() => {
    if (!partner) return
    setUrl('')
    setKey('')
    setTest(partner.status !== 'connected')
  }, [partner])
  const valid = url.trim().length > 8 && key.trim().length > 6
  return (
    <Modal
      open={!!partner}
      onOpenChange={(o) => !o && onClose()}
      title={`Connect ${partner?.name ?? ''}`}
      description="Ask the partner for their API address and key. Nothing is sent to patients while in test mode."
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" disabled={!valid} onClick={() => onConnect(test)}>
            Connect
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <Field label="API address">
          <Input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://api.partner.tj/navcrm" autoFocus />
        </Field>
        <Field label="API key" hint="Stored encrypted. Only the owner can view it later.">
          <Input value={key} onChange={(e) => setKey(e.target.value)} type="password" autoComplete="off" />
        </Field>
        <Switch checked={test} onChange={setTest} label="Start in test mode" description="Send test orders until the partner confirms results come back correctly" />
      </div>
    </Modal>
  )
}

export function Partners() {
  const [list, setList] = useState(initialPartners)
  const [connecting, setConnecting] = useState<Partner | null>(null)
  const update = (id: string, patch: Partial<Partner>) => setList((l) => l.map((p) => (p.id === id ? { ...p, ...patch } : p)))
  const sendTest = (p: Partner) => toast.success(`Test order sent to ${p.name}`, { description: 'The partner confirmed receipt. Results will come back as a test.' })

  return (
    <>
      <p className="mb-5 max-w-2xl text-base text-muted">
        Orders go to a partner as soon as the sample is taken. Results come back into the order on their own, and the patient gets them in Telegram.
      </p>
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {list.map((p) => {
          const s = STATUS[p.status]
          return (
            <Card key={p.id} className="flex flex-col p-5">
              <div className="flex items-start gap-3">
                <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-fill text-muted">
                  <Icon icon={I.lab} size={20} />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-base font-medium text-fg">{p.name}</div>
                  <div className="truncate text-sm text-muted">{p.address}</div>
                </div>
                {p.status !== 'off' && (
                  <Menu align="end" trigger={<IconButton icon={I.more} label={`${p.name} options`} size="sm" />}>
                    <MenuItem icon={I.settings} onClick={() => setConnecting(p)}>
                      Connection settings
                    </MenuItem>
                    <MenuItem icon={I.invoice} onClick={() => toast(`${p.name} price list: ${p.priceList} tests`)}>
                      Price list
                    </MenuItem>
                    <MenuSeparator />
                    <MenuItem
                      danger
                      icon={I.cancelCircle}
                      onClick={() => {
                        update(p.id, { status: 'off' })
                        toast(`${p.name} disconnected`, { description: 'Orders already sent will still get results.' })
                      }}
                    >
                      Disconnect
                    </MenuItem>
                  </Menu>
                )}
              </div>
              <div className="mt-4">
                <Badge tone={s.tone}>
                  {s.label}
                </Badge>
              </div>
              {p.status === 'off' ? (
                <p className="mt-4 flex-1 text-base text-muted">Connect to send orders and receive results without phone calls or paper forms.</p>
              ) : (
                <div className="mt-5 grid flex-1 grid-cols-3 gap-3">
                  <KeyValue label="This month" value={p.ordersThisMonth} />
                  <KeyValue label="Turnaround" value={`${p.avgTurnaround} h`} />
                  <KeyValue label="Price list" value={p.priceList} />
                </div>
              )}
              <div className="mt-5 flex items-center gap-2 border-t border-border pt-4">
                {p.status === 'off' ? (
                  <Button size="sm" icon={I.plug} onClick={() => setConnecting(p)}>
                    Connect
                  </Button>
                ) : (
                  <Button size="sm" icon={I.send} onClick={() => sendTest(p)}>
                    Send test order
                  </Button>
                )}
                {p.status === 'test' && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      update(p.id, { status: 'connected' })
                      toast.success(`${p.name} is live`, { description: 'New orders can now be sent there.' })
                    }}
                  >
                    Go live
                  </Button>
                )}
                {p.connectedAt && p.status === 'connected' && <span className="ml-auto text-xs text-faint">Since {formatDate(p.connectedAt)}</span>}
              </div>
            </Card>
          )
        })}
      </div>
      <ConnectModal
        partner={connecting}
        onClose={() => setConnecting(null)}
        onConnect={(test) => {
          if (!connecting) return
          update(connecting.id, { status: test ? 'test' : 'connected', priceList: connecting.priceList || 96, avgTurnaround: connecting.avgTurnaround || 30 })
          toast.success(test ? `${connecting.name} connected in test mode` : `${connecting.name} connected`)
          setConnecting(null)
        }}
      />
    </>
  )
}
