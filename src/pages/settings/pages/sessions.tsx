import { useState } from 'react'
import { toast } from 'sonner'
import { I, Icon } from '@/components/icons'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { formatRelative } from '@/lib/format'
import { NOW, addDays, addMinutes } from '@/lib/time'
import { SettingsPage, SettingsSection } from '../ui'

type Session = { id: string; device: string; place: string; ip: string; active: Date; icon: typeof I.computer; current?: boolean }

const SESSIONS: Session[] = [
  { id: 'this', device: 'Chrome on macOS', place: 'Dushanbe', ip: '85.9.40.17', active: NOW, icon: I.computer, current: true },
  { id: 'ipad', device: 'Safari on iPad', place: 'Front desk, Rudaki 72', ip: '85.9.40.17', active: addMinutes(NOW, -12), icon: I.mobile },
  { id: 'android', device: 'NavCRM app on Android', place: 'Dushanbe', ip: '95.142.88.4', active: addMinutes(NOW, -180), icon: I.mobile },
  { id: 'win', device: 'Chrome on Windows', place: 'Somoni 14', ip: '217.11.176.30', active: addDays(NOW, -6), icon: I.computer },
]

export default function SessionsSettings() {
  const [list, setList] = useState(SESSIONS)
  const others = list.filter((s) => !s.current)

  return (
    <SettingsPage
      title="Devices & sessions"
      description="Where you’re signed in. Sign out of anything you don’t recognise and change your password."
      actions={
        others.length > 0 && (
          <Button
            variant="danger"
            onClick={() => {
              setList((l) => l.filter((s) => s.current))
              toast.success(`Signed out of ${others.length} other device${others.length > 1 ? 's' : ''}`)
            }}
          >
            Sign out of other devices
          </Button>
        )
      }
    >
      <SettingsSection>
        <ul>
          {list.map((s) => (
            <li key={s.id} className="flex items-center gap-4 border-b border-border py-4 last:border-b-0">
              <span className="grid size-10 shrink-0 place-items-center rounded-full bg-fill text-muted">
                <Icon icon={s.icon} size={20} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-2">
                  <span className="text-base text-fg">{s.device}</span>
                  {s.current && <Badge tone="positive">This device</Badge>}
                </span>
                <span className="block text-sm text-muted">
                  {s.place} · {s.ip} · {s.current ? 'active now' : `active ${formatRelative(s.active)}`}
                </span>
              </span>
              {!s.current && (
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => {
                    setList((l) => l.filter((x) => x.id !== s.id))
                    toast.success(`Signed out of ${s.device}`)
                  }}
                >
                  Sign out
                </Button>
              )}
            </li>
          ))}
        </ul>
        {others.length === 0 && <p className="mt-4 text-sm text-muted">You’re only signed in on this device.</p>}
      </SettingsSection>
    </SettingsPage>
  )
}
