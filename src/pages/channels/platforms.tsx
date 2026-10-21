import { CopyCheckIcon } from '@hugeicons/core-free-icons'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router'
import { toast } from 'sonner'
import { I, Icon } from '@/components/icons'
import { Badge } from '@/components/ui/badge'
import { Button, IconButton } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Switch } from '@/components/ui/controls'
import { Modal } from '@/components/ui/dialog'
import { Field, Input } from '@/components/ui/input'
import { Popover } from '@/components/ui/popover'
import { business } from '@/data/business'
import { formatNumber } from '@/lib/format'
import { STATUS_LABEL, usePlatforms, type Platform } from './data'
import { useChannelStats } from './stats'

const CARD_TEXT = [
  `${business.name}: beauty salon and cosmetology`,
  `Phone: ${business.phone}`,
  'Open daily 09:00–21:00',
  business.branches[0].address,
  `Book online: ${business.bookingLink}`,
].join('\n')

function copy(text: string, done: string) {
  navigator.clipboard?.writeText(text).catch(() => {})
  toast.success(done)
}

function BusinessCard() {
  const [copied, setCopied] = useState(false)
  useEffect(() => {
    if (!copied) return
    const t = setTimeout(() => setCopied(false), 1800)
    return () => clearTimeout(t)
  }, [copied])

  return (
    <Card className="mb-6 grid gap-5 p-5 md:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)]">
      <div>
        <h3 className="text-base font-medium text-fg">Your business card</h3>
        <p className="mt-1 text-sm text-muted">
          Yandex Maps, 2GIS and Google have no API in Tajikistan. Paste this into each profile once; bookings are tracked through the short links below.
        </p>
        <Button
          className="mt-4"
          size="sm"
          icon={copied ? CopyCheckIcon : I.copy}
          onClick={() => {
            navigator.clipboard?.writeText(CARD_TEXT).catch(() => {})
            setCopied(true)
          }}
        >
          {copied ? 'Copied' : 'Copy all'}
        </Button>
      </div>
      <pre className="overflow-x-auto rounded-xl bg-fill px-4 py-3.5 font-sans text-base leading-6 whitespace-pre-wrap text-fg">{CARD_TEXT}</pre>
    </Card>
  )
}

function SetupModal({ platform, onClose }: { platform: Platform | null; onClose: () => void }) {
  const update = usePlatforms((s) => s.update)
  const [name, setName] = useState(business.name)
  const [url, setUrl] = useState('')
  useEffect(() => {
    if (platform) {
      setName(business.name)
      setUrl(platform.url ?? '')
    }
  }, [platform])

  return (
    <Modal
      open={!!platform}
      onOpenChange={(o) => !o && onClose()}
      title={platform?.url ? `Edit ${platform.name}` : `Set up ${platform?.name}`}
      description="Link the profile so clicks and bookings from it are counted."
      size="sm"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            disabled={!url.trim()}
            onClick={() => {
              if (!platform) return
              update(platform.id, { url: url.trim(), status: platform.status === 'connected' ? 'connected' : 'manual' })
              toast.success(`${platform.name} linked`, { description: `Now paste ${platform.shortLink} into the profile’s booking or website field.` })
              onClose()
            }}
          >
            Save
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <Field label="Name on the platform">
          <Input value={name} onChange={(e) => setName(e.target.value)} />
        </Field>
        <Field label="Profile link" hint="Copy it from the address bar when your profile is open.">
          <Input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="2gis.tj/dushanbe/firm/…" autoFocus />
        </Field>
      </div>
    </Modal>
  )
}

function HowTo({ platform }: { platform: Platform }) {
  return (
    <Popover
      align="end"
      className="w-72 p-4"
      trigger={
        <Button size="sm" variant="ghost">
          How to
        </Button>
      }
    >
      <div className="mb-2 text-base font-medium text-fg">{platform.name}</div>
      <ol className="flex flex-col gap-2">
        {platform.steps.map((s, i) => (
          <li key={i} className="flex gap-2.5 text-sm text-muted">
            <span className="grid size-5 shrink-0 place-items-center rounded-full bg-fill text-xs text-fg tabular">{i + 1}</span>
            {s}
          </li>
        ))}
      </ol>
    </Popover>
  )
}

export function Platforms() {
  const platforms = usePlatforms((s) => s.platforms)
  const stats = useChannelStats('30')
  const navigate = useNavigate()
  const [editing, setEditing] = useState<Platform | null>(null)
  const [invite, setInvite] = useState(true)

  return (
    <>
      <BusinessCard />
      <div className="grid gap-5 md:grid-cols-2">
        {platforms.map((p) => {
          const s = stats.platforms[p.id]
          const tone = p.status === 'connected' ? 'positive' : p.status === 'manual' ? 'neutral' : 'warning'
          return (
            <Card key={p.id} className="flex flex-col p-5">
              <div className="flex items-center gap-3">
                <span className="grid size-10 shrink-0 place-items-center rounded-full bg-fill text-muted">
                  <Icon icon={p.icon} size={20} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-base font-medium text-fg">{p.name}</span>
                  {p.rating && (
                    <span className="block text-sm text-muted">
                      ★ {p.rating.toFixed(1)} · {p.reviews} reviews
                    </span>
                  )}
                </span>
                <Badge tone={tone} dot>
                  {p.id === 'after_visit' ? 'On' : STATUS_LABEL[p.status]}
                </Badge>
              </div>

              {p.id === 'after_visit' ? (
                <div className="mt-5 flex flex-1 flex-col gap-4">
                  <p className="text-sm text-muted">Two hours after a visit, the client gets a Telegram message asking how it went. Unhappy answers reach you privately first.</p>
                  <Switch checked={invite} onChange={setInvite} label="Invite happy clients to post on maps" description="4–5★ answers get a link to Yandex Maps or 2GIS" />
                </div>
              ) : (
                <div className="mt-5 flex flex-1 flex-col gap-3">
                  <div className="flex items-center justify-between gap-3 text-sm">
                    <span className="text-muted">Profile</span>
                    {p.url ? <span className="truncate text-fg">{p.url}</span> : <span className="text-faint">Not linked</span>}
                  </div>
                  <div className="flex items-center justify-between gap-3 text-sm">
                    <span className="text-muted">Tracked link</span>
                    <span className="flex items-center gap-1">
                      <span className="font-mono text-[13px] text-fg">{p.shortLink}</span>
                      <IconButton icon={I.copy} label="Copy link" size="xs" onClick={() => copy(`https://${p.shortLink}`, 'Link copied')} />
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-3 text-sm">
                    <span className="text-muted">Last 30 days</span>
                    <span className="text-fg tabular">
                      {p.status === 'none' ? (
                        <span className="text-faint">No data yet</span>
                      ) : (
                        <>
                          {formatNumber(s.clicks)} clicks · {formatNumber(s.bookings)} bookings
                        </>
                      )}
                    </span>
                  </div>
                </div>
              )}

              <div className="mt-5 flex items-center justify-between gap-2 border-t border-border pt-4">
                {p.id === 'after_visit' ? (
                  <Button size="sm" onClick={() => navigate('/channels/reviews')}>
                    See reviews
                  </Button>
                ) : (
                  <Button size="sm" variant={p.status === 'none' ? 'primary' : 'secondary'} onClick={() => setEditing(p)}>
                    {p.url ? 'Edit profile link' : 'Set up'}
                  </Button>
                )}
                <HowTo platform={p} />
              </div>
            </Card>
          )
        })}
      </div>
      <SetupModal platform={editing} onClose={() => setEditing(null)} />
    </>
  )
}
