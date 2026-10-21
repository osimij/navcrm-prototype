import { useState } from 'react'
import { useNavigate } from 'react-router'
import { toast } from 'sonner'
import { I, Icon } from '@/components/icons'
import { Avatar } from '@/components/ui/avatar'
import { Button, IconButton } from '@/components/ui/button'
import { Kbd } from '@/components/ui/misc'
import { Popover } from '@/components/ui/popover'
import { Segmented } from '@/components/ui/tabs'
import { Tooltip } from '@/components/ui/tooltip'
import { business, currentUser } from '@/data/business'
import { cn } from '@/lib/cn'
import { useOverlays } from '@/lib/overlays'
import { usePrefs, type ThemePref } from '@/lib/store'
import { unreadCount } from './notifications'

/**
 * NavCRM works offline and syncs later, so people need to trust that their data
 * is saved. A quiet icon when all is well; details on click.
 */
function SyncStatus() {
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
      align="end"
      className="w-80 p-4"
      trigger={
        <button
          type="button"
          aria-label="Sync status"
          className="press flex h-8 items-center gap-1.5 rounded-full pr-3 pl-2.5 text-sm text-muted hover:bg-fill hover:text-fg data-[popup-open]:bg-fill"
        >
          <Icon icon={syncing ? I.syncing : I.synced} size={18} className={syncing ? 'animate-pulse text-accent-fg' : 'text-positive'} />
          <span className="hidden xl:inline">{syncing ? 'Syncing…' : 'Synced'}</span>
        </button>
      }
    >
      <div className="flex items-start gap-3">
        <span className="grid size-9 place-items-center rounded-full bg-positive-soft text-positive">
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

const LANGS = [
  { value: 'tg', label: 'Тоҷикӣ' },
  { value: 'ru', label: 'Русский' },
  { value: 'en', label: 'English' },
] as const

function ProfileMenu() {
  const theme = usePrefs((s) => s.theme)
  const setTheme = usePrefs((s) => s.setTheme)
  const signOut = usePrefs((s) => s.signOut)
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [lang, setLang] = useState<'tg' | 'ru' | 'en'>('en')

  const go = (to: string) => {
    setOpen(false)
    navigate(to)
  }
  const row = 'flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-base text-fg hover:bg-fill'

  return (
    <Popover
      open={open}
      onOpenChange={setOpen}
      align="end"
      className="w-72 p-1.5"
      trigger={
        <button type="button" aria-label="Profile" className="press ml-1 rounded-full">
          <Avatar name={currentUser.name} color="slate" size="md" />
        </button>
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
        <div className="flex flex-col gap-1.5">
          <span className="text-xs font-medium text-faint">Theme</span>
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
          <span className="text-xs font-medium text-faint">Language</span>
          <Segmented
            size="sm"
            value={lang}
            fill
            onChange={(l) => {
              setLang(l)
              if (l !== 'en') toast('Translations aren’t part of this prototype yet', { description: 'The product ships in Tajik, Russian and English.' })
            }}
            items={LANGS.map((l) => ({ value: l.value, label: l.label }))}
          />
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
          className={cn(row, 'text-fg')}
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

export function Topbar({ onMenu }: { onMenu: () => void }) {
  const setCommand = useOverlays((s) => s.setCommand)
  const setNotifications = useOverlays((s) => s.setNotifications)
  const hide = usePrefs((s) => s.hideAmounts)
  const toggleAmounts = usePrefs((s) => s.toggleAmounts)

  return (
    <div className="flex h-14 shrink-0 items-center gap-2 border-b border-border bg-bg px-3 sm:px-5 lg:border-b-0 lg:px-8">
      <IconButton icon={I.menu} label="Menu" className="lg:hidden" onClick={onMenu} />
      <button
        type="button"
        onClick={() => setCommand(true)}
        aria-label="Search"
        className="flex h-9 w-9 shrink-0 items-center justify-center gap-2.5 rounded-full bg-fill text-base text-faint ring-1 ring-inset ring-transparent transition-[box-shadow,background-color] duration-150 hover:ring-border-strong sm:w-full sm:max-w-[440px] sm:shrink sm:justify-start sm:px-3.5"
      >
        <Icon icon={I.search} size={17} />
        <span className="hidden flex-1 truncate text-left sm:block">Search clients, visits, pages</span>
        <span className="hidden gap-1 sm:flex">
          <Kbd>⌘</Kbd>
          <Kbd>K</Kbd>
        </span>
      </button>
      <div className="ml-auto flex items-center gap-1">
        <SyncStatus />
        <Tooltip content={hide ? 'Show amounts' : 'Hide amounts'}>
          <button
            type="button"
            aria-label={hide ? 'Show amounts' : 'Hide amounts'}
            aria-pressed={hide}
            onClick={toggleAmounts}
            className={cn('press grid size-9 place-items-center rounded-full hover:bg-fill', hide ? 'text-fg' : 'text-muted hover:text-fg')}
          >
            <Icon icon={hide ? I.viewOff : I.view} size={20} />
          </button>
        </Tooltip>
        <IconButton icon={I.bell} label="Notifications" badge={unreadCount > 0} onClick={() => setNotifications(true)} />
        <ProfileMenu />
      </div>
    </div>
  )
}
