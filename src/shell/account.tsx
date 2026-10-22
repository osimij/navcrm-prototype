import { useState } from 'react'
import { useNavigate } from 'react-router'
import { toast } from 'sonner'
import { I, Icon } from '@/components/icons'
import { Avatar } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/controls'
import { Popover } from '@/components/ui/popover'
import { Segmented } from '@/components/ui/tabs'
import { Tooltip } from '@/components/ui/tooltip'
import { business, currentUser } from '@/data/business'
import { cn } from '@/lib/cn'
import { useOverlays } from '@/lib/overlays'
import { usePrefs, type ThemePref } from '@/lib/store'
import { setLanguage, useLanguage, type Language } from '@/i18n/language'
import { unreadCount } from './notifications'

/**
 * NavCRM works offline and syncs later, so people need to trust that their data
 * is saved. A quiet icon when all is well; details on click.
 */
export function SyncStatus({ side = 'top' }: { side?: 'top' | 'bottom' | 'right' }) {
  const [syncing, setSyncing] = useState(false)
  const [last, setLast] = useState('14:18')
  function syncNow() {
    setSyncing(true)
    setTimeout(() => {
      setSyncing(false)
      setLast('14:20')
      toast.success('Everything is up to date')
    }, 900)
  }
  return (
    <Popover
      align="start"
      side={side}
      className="w-80 p-4"
      trigger={
        <button
          type="button"
          aria-label="Sync status"
          className="press grid size-8 shrink-0 place-items-center rounded-full text-muted hover:bg-fill hover:text-fg data-[popup-open]:bg-fill"
        >
          <Icon icon={syncing ? I.syncing : I.synced} size={17} className={syncing ? 'animate-pulse text-accent-fg' : 'text-positive'} />
          <span className="sr-only">{syncing ? 'Syncing…' : 'Synced'}</span>
        </button>
      }
    >
      <div className="flex items-start gap-3">
        <span className="grid size-9 shrink-0 place-items-center rounded-full bg-positive-soft text-positive">
          <Icon icon={I.synced} size={18} />
        </span>
        <div>
          <div className="text-base font-medium text-fg">All changes are saved</div>
          <div className="text-sm text-muted">Last sync today at {last}. Works offline; changes sync when you’re back online.</div>
        </div>
      </div>
      <div className="mt-4 grid grid-cols-3 gap-2 text-center">
        {[
          ['Waiting', 0],
          ['Rejected', 0],
          ['Conflicts', 0],
        ].map(([l, n]) => (
          <div key={l} className="rounded-xl bg-fill py-2.5">
            <div className="text-lg text-fg tabular">{n}</div>
            <div className="text-xs text-muted">{l}</div>
          </div>
        ))}
      </div>
      <div className="mt-4 text-xs text-muted">This device stores 38 MB of 2 GB, protected from browser cleanup.</div>
      <div className="mt-4 flex gap-2">
        <Button size="sm" variant="secondary" icon={I.refresh} onClick={syncNow} loading={syncing}>
          Sync now
        </Button>
      </div>
    </Popover>
  )
}

/** Front-desk screens face clients, so hiding amounts is one click away. */
export function HideAmountsButton() {
  const hide = usePrefs((s) => s.hideAmounts)
  const toggleAmounts = usePrefs((s) => s.toggleAmounts)
  return (
    <Tooltip content={hide ? 'Show amounts' : 'Hide amounts'} side="top">
      <button
        type="button"
        aria-label={hide ? 'Show amounts' : 'Hide amounts'}
        aria-pressed={hide}
        onClick={toggleAmounts}
        className={cn('press grid size-8 shrink-0 place-items-center rounded-full hover:bg-fill', hide ? 'bg-fill text-fg' : 'text-muted hover:text-fg')}
      >
        <Icon icon={hide ? I.viewOff : I.view} size={18} />
      </button>
    </Tooltip>
  )
}

export function NotificationsButton({ side = 'bottom' }: { side?: 'bottom' | 'right' }) {
  const setNotifications = useOverlays((s) => s.setNotifications)
  return (
    <Tooltip content="Notifications" side={side}>
      <button
        type="button"
        aria-label="Notifications"
        onClick={() => setNotifications(true)}
        className="press relative grid size-8 shrink-0 place-items-center rounded-full text-muted hover:bg-fill hover:text-fg"
      >
        <Icon icon={I.bell} size={18} />
        {unreadCount > 0 && <span className="absolute top-1.5 right-1.5 size-2 rounded-full bg-negative ring-2 ring-[var(--bg-sidebar)]" />}
      </button>
    </Tooltip>
  )
}

const LANGS = [
  { value: 'ru', label: 'Русский' },
  { value: 'en', label: 'English' },
] as const

/**
 * Who you are and how the app looks for you. Lives at the bottom of the
 * sidebar, where people expect their account, and opens upward.
 */
export function ProfileMenu({ compact = false }: { compact?: boolean }) {
  const theme = usePrefs((s) => s.theme)
  const setTheme = usePrefs((s) => s.setTheme)
  const signOut = usePrefs((s) => s.signOut)
  const hide = usePrefs((s) => s.hideAmounts)
  const toggleAmounts = usePrefs((s) => s.toggleAmounts)
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const lang = useLanguage()

  const go = (to: string) => {
    setOpen(false)
    navigate(to)
  }
  const row = 'flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-base text-fg hover:bg-fill'

  return (
    <Popover
      open={open}
      onOpenChange={setOpen}
      side={compact ? 'right' : 'top'}
      align={compact ? 'end' : 'start'}
      className="w-72 p-1.5"
      trigger={
        compact ? (
          <button type="button" aria-label="Profile" className="press mx-auto grid size-10 place-items-center rounded-xl hover:bg-fill data-[popup-open]:bg-fill">
            <Avatar name={currentUser.name} color="slate" size="md" />
          </button>
        ) : (
          <button
            type="button"
            aria-label="Profile"
            className="press flex min-w-0 flex-1 items-center gap-2.5 rounded-xl px-2 py-1.5 text-left hover:bg-fill data-[popup-open]:bg-fill"
          >
            <Avatar name={currentUser.name} color="slate" size="md" />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-medium text-fg">{currentUser.name}</span>
              <span className="block truncate text-xs text-muted">{currentUser.role}</span>
            </span>
          </button>
        )
      }
    >
      <div className="flex items-center gap-3 px-2.5 pt-2 pb-3">
        <Avatar name={currentUser.name} color="slate" size="lg" />
        <div className="min-w-0">
          <div className="truncate text-base font-medium text-fg">{currentUser.name}</div>
          <div className="truncate text-sm text-muted">
            {currentUser.role} · {business.name}
          </div>
        </div>
      </div>
      <div className="h-px bg-border" />
      <div className="py-1">
        <button type="button" className={row} onClick={() => go('/me')}>
          <Icon icon={I.earnings} size={18} className="text-muted" />
          My earnings & time clock
        </button>
        <button type="button" className={row} onClick={() => go('/settings/profile')}>
          <Icon icon={I.user} size={18} className="text-muted" />
          My profile
        </button>
        <button type="button" className={row} onClick={() => go('/settings/sessions')}>
          <Icon icon={I.computer} size={18} className="text-muted" />
          Devices & sessions
        </button>
      </div>
      <div className="h-px bg-border" />
      <div className="flex flex-col gap-3 px-2.5 py-3">
        <Switch checked={hide} onChange={toggleAmounts} label="Hide amounts" description="For screens clients can see" />
        <div className="flex flex-col gap-1.5">
          <span className="text-xs font-medium text-muted">Theme</span>
          <Segmented
            size="sm"
            value={theme}
            onChange={(t: ThemePref) => setTheme(t)}
            fill
            items={[
              { value: 'light', label: 'Light' },
              { value: 'dark', label: 'Dark' },
              { value: 'system', label: 'System' },
            ]}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <span className="text-xs font-medium text-muted">Language</span>
          <Segmented size="sm" value={lang} fill onChange={(l: Language) => setLanguage(l)} items={LANGS.map((l) => ({ value: l.value, label: l.label }))} />
        </div>
      </div>
      <div className="h-px bg-border" />
      <div className="py-1">
        <button type="button" className={row} onClick={() => go('/signup')}>
          <Icon icon={I.add} size={18} className="text-muted" />
          Create another business
        </button>
        <button
          type="button"
          className={row}
          onClick={() => {
            setOpen(false)
            signOut()
            navigate('/signin')
          }}
        >
          <Icon icon={I.logout} size={18} className="text-muted" />
          Sign out
        </button>
      </div>
    </Popover>
  )
}
