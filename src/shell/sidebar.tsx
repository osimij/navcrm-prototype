import { Collapsible } from '@base-ui/react/collapsible'
import type { ReactNode } from 'react'
import { useEffect, useState } from 'react'
import { NavLink, useLocation, useNavigate } from 'react-router'
import { I, Icon } from '@/components/icons'
import { IconButton } from '@/components/ui/button'
import { SearchInput } from '@/components/ui/input'
import { Kbd } from '@/components/ui/misc'
import { Popover } from '@/components/ui/popover'
import { Tooltip } from '@/components/ui/tooltip'
import { business } from '@/data/business'
import { text } from '@/i18n'
import { cn } from '@/lib/cn'
import { useOverlays } from '@/lib/overlays'
import { usePrefs } from '@/lib/store'
import { useWorkspace } from '@/lib/workspace'
import { useAssistant } from '@/pages/assistant/store'
import { useInbox } from '@/pages/inbox/store'
import { isOverdue, useTasks } from '@/pages/tasks/store'
import { HideAmountsButton, NotificationsButton, ProfileMenu, SyncStatus } from './account'
import { NAV, SETTINGS_NAV, type NavGroup, type NavItem } from './nav'

/** Live counts: unread conversations and overdue tasks. */
function useBadges(): Record<string, number> {
  const inbox = useInbox((s) => s.conversations.filter((c) => c.unread > 0 && c.status !== 'closed').length)
  const tasks = useTasks((s) => s.tasks.filter(isOverdue).length)
  return { '/inbox': inbox, '/tasks': tasks }
}

export function NavCRMMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden>
      <rect width="32" height="32" rx="9" fill="var(--accent)" />
      <path
        d="M10 22V10.6c0-.5.6-.8 1-.4l9.9 11.5c.4.5 1.1.2 1.1-.4V10"
        stroke="#fff"
        strokeWidth="2.6"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

/** One row style for every sidebar entry, so links and actions line up. */
const rowClass = (active = false) =>
  cn(
    'group flex h-8 w-full items-center gap-2.5 rounded-[10px] px-2.5 text-sm select-none',
    active ? 'bg-nav-active font-medium text-fg shadow-[var(--nav-active-shadow)]' : 'text-muted hover:bg-fill hover:text-fg',
  )
const railClass = (active = false) =>
  cn(
    'relative mx-auto grid size-9 place-items-center rounded-[10px]',
    active ? 'bg-nav-active text-fg shadow-[var(--nav-active-shadow)]' : 'text-muted hover:bg-fill hover:text-fg',
  )

function isActive(pathname: string, to: string) {
  return to === '/' ? pathname === '/' : pathname === to || pathname.startsWith(to + '/')
}

function Item({ item, badge, onNavigate, compact = false }: { item: NavItem; badge?: number; onNavigate?: () => void; compact?: boolean }) {
  const { pathname } = useLocation()
  const active = isActive(pathname, item.to)
  if (compact)
    return (
      <Tooltip content={item.label} side="right">
        <NavLink to={item.to} end={item.to === '/'} onClick={onNavigate} aria-label={item.label} aria-current={active ? 'page' : undefined} className={railClass(active)}>
          <Icon icon={item.icon} size={18} />
          {!!badge && <span className="absolute top-1.5 right-1.5 size-1.5 rounded-full bg-accent" />}
        </NavLink>
      </Tooltip>
    )
  return (
    <NavLink to={item.to} end={item.to === '/'} onClick={onNavigate} className={rowClass(active)}>
      <Icon icon={item.icon} size={17} className={cn('shrink-0', active ? 'text-fg' : 'text-muted group-hover:text-fg')} />
      <span className="min-w-0 flex-1 truncate">{item.label}</span>
      {!!badge && <span className="min-w-5 text-center text-xs text-muted tabular">{badge}</span>}
    </NavLink>
  )
}

/** Search and the assistant are actions, not places: same row shape, no "current" state. */
function ActionRow({ icon, label, keys, onClick, compact }: { icon: typeof I.search; label: string; keys: ReactNode; onClick: () => void; compact: boolean }) {
  if (compact)
    return (
      <Tooltip content={label} side="right">
        <button type="button" aria-label={label} onClick={onClick} className={railClass()}>
          <Icon icon={icon} size={18} />
        </button>
      </Tooltip>
    )
  return (
    <button type="button" onClick={onClick} className={rowClass()}>
      <Icon icon={icon} size={17} className="shrink-0 text-muted group-hover:text-fg" />
      <span className="min-w-0 flex-1 truncate text-left">{label}</span>
      <span aria-hidden className="flex gap-0.5 opacity-0 transition-opacity duration-150 ease-[ease] group-hover:opacity-80 group-focus-visible:opacity-80">
        {keys}
      </span>
    </button>
  )
}

function BusinessSwitcher({ compact = false }: { compact?: boolean }) {
  const branchId = usePrefs((s) => s.branchId)
  const setBranch = usePrefs((s) => s.setBranch)
  const navigate = useNavigate()
  const branch = branchId === 'all' ? 'All branches' : business.branches.find((b) => b.id === branchId)?.name
  const options = [{ id: 'all', name: 'All branches', address: 'Combined numbers' }, ...business.branches]

  return (
    <Popover
      align="start"
      side={compact ? 'right' : 'bottom'}
      className="w-64 p-1.5"
      trigger={
        <button
          type="button"
          aria-label={compact ? business.name : undefined}
          className={cn(
            'press flex min-w-0 items-center gap-2.5 rounded-xl text-left hover:bg-fill data-[popup-open]:bg-fill',
            compact ? 'mx-auto size-10 justify-center' : 'h-11 flex-1 px-1.5',
          )}
        >
          <span className="grid size-7 shrink-0 place-items-center rounded-lg bg-fg text-[13px] font-semibold text-bg">S</span>
          {!compact && (
            <>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold text-fg">{business.name}</span>
                <span className="block truncate text-xs text-muted">{branch}</span>
              </span>
              <Icon icon={I.chevronsUpDown} size={15} className="text-faint" />
            </>
          )}
        </button>
      }
    >
      <div className="px-2.5 pt-1.5 pb-1 text-xs font-medium text-muted">Branch</div>
      {options.map((b) => (
        <button
          key={b.id}
          type="button"
          onClick={() => setBranch(b.id)}
          className="flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-left hover:bg-fill"
        >
          <span className="min-w-0 flex-1">
            <span className="block text-base text-fg">{b.name}</span>
            <span className="block truncate text-xs text-muted">{b.address}</span>
          </span>
          {branchId === b.id && <Icon icon={I.check} size={16} className="text-accent-fg" />}
        </button>
      ))}
      <div className="mx-2 my-1.5 h-px bg-border" />
      <button type="button" onClick={() => navigate('/settings/branches')} className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-base text-fg hover:bg-fill">
        <Icon icon={I.settings} size={16} className="text-muted" />
        Manage branches
      </button>
      <button type="button" onClick={() => navigate('/signup')} className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-base text-fg hover:bg-fill">
        <Icon icon={I.add} size={16} className="text-muted" />
        Create another business
      </button>
    </Popover>
  )
}

function SetupProgress() {
  const onboarding = usePrefs((s) => s.onboarding)
  if (!onboarding) return null
  const pct = Math.round((onboarding.done.length / 5) * 100)
  return (
    <NavLink to="/settings/setup" className="press mb-2 block rounded-xl bg-surface p-3 hover:bg-fill">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium text-fg">Finish setting up</span>
        <span className="text-muted tabular">{pct}%</span>
      </div>
      <div className="mt-2 h-1 overflow-hidden rounded-full bg-fill-active">
        <div className="h-full rounded-full bg-accent" style={{ width: `${pct}%` }} />
      </div>
    </NavLink>
  )
}

/**
 * A labelled section you can fold away, like Linear's "Workspace ▾". Sections
 * start open so every destination is visible; what you fold stays folded.
 * The section holding the current page opens without saving that as a choice.
 */
function NavSection({ group, compact, onNavigate }: { group: NavGroup; compact: boolean; onNavigate?: () => void }) {
  const { pathname } = useLocation()
  const active = group.items.some((it) => isActive(pathname, it.to))
  const key = `nav:${group.label}`
  const saved = useWorkspace((s) => s.sections[key] ?? true)
  const setSection = useWorkspace((s) => s.setSection)
  const [routeOpen, setRouteOpen] = useState(active)
  useEffect(() => setRouteOpen(active), [pathname, active])
  const open = saved || routeOpen
  const links = group.items.map((it) => <Item key={it.to} item={it} compact={compact} onNavigate={onNavigate} />)

  if (compact) return <div className="flex flex-col gap-1 border-t border-border pt-2">{links}</div>
  return (
    <Collapsible.Root open={open} onOpenChange={(value) => { setRouteOpen(false); setSection(key, value) }}>
      <Collapsible.Trigger className="group/section flex h-7 w-full items-center gap-1 rounded-lg px-2.5 text-xs font-medium text-faint hover:text-muted">
        {group.label}
        <Icon icon={I.chevronDown} size={12} className={cn('nav-caret transition-transform duration-150 ease-[var(--ease-out)] motion-reduce:transition-none', !open && '-rotate-90')} />
      </Collapsible.Trigger>
      <Collapsible.Panel className="collapse-panel">
        <div className="flex flex-col gap-0.5 pb-1">{links}</div>
      </Collapsible.Panel>
    </Collapsible.Root>
  )
}

function SettingsNavigation({ onNavigate }: { onNavigate?: () => void }) {
  const [query, setQuery] = useState('')
  const { pathname } = useLocation()
  const sections = useWorkspace((s) => s.sections)
  const setSection = useWorkspace((s) => s.setSection)
  const [routeGroup, setRouteGroup] = useState(() => SETTINGS_NAV.find((g) => g.items.some((it) => it.to === pathname))?.label)
  useEffect(() => {
    const active = SETTINGS_NAV.find((g) => g.items.some((it) => it.to === pathname))
    setRouteGroup(active?.label)
  }, [pathname])
  const groups = SETTINGS_NAV.map((g) => ({
    ...g,
    items: g.items.filter((it) => `${it.label} ${text(it.label)} ${g.label} ${text(g.label)}`.toLowerCase().includes(query.trim().toLowerCase())),
  })).filter((g) => g.items.length)
  return (
    <>
      <div className="mb-3">
        <SearchInput value={query} onChange={setQuery} placeholder="Find a setting" />
      </div>
      {groups.map((g) => {
        const open = !!query.trim() || routeGroup === g.label || !!(sections[`settings:${g.label}`] ?? true)
        return (
          <Collapsible.Root
            key={g.label}
            open={open}
            onOpenChange={(value) => {
              if (routeGroup === g.label) setRouteGroup(undefined)
              setSection(`settings:${g.label}`, value)
            }}
            className="mb-1.5"
          >
            <Collapsible.Trigger className="flex h-7 w-full items-center gap-1 rounded-lg px-2.5 text-left text-xs font-medium text-faint hover:text-muted">
              {g.label}
              <Icon icon={I.chevronDown} size={12} className={cn('shrink-0 transition-transform duration-150 ease-[var(--ease-out)] motion-reduce:transition-none', !open && '-rotate-90')} />
            </Collapsible.Trigger>
            <Collapsible.Panel className="collapse-panel">
              <div className="flex flex-col gap-0.5 pb-1">
                {g.items.map((it) => (
                  <NavLink key={it.to} to={it.to} onClick={onNavigate} className={({ isActive: on }) => rowClass(on)}>
                    <span className="truncate">{it.label}</span>
                  </NavLink>
                ))}
              </div>
            </Collapsible.Panel>
          </Collapsible.Root>
        )
      })}
      {!groups.length && <p className="px-3 py-4 text-sm text-muted">No settings found</p>}
    </>
  )
}

export function Sidebar({ onNavigate, compact = false }: { onNavigate?: () => void; compact?: boolean }) {
  const { pathname } = useLocation()
  const inSettings = pathname.startsWith('/settings')
  const badges = useBadges()
  const setCommand = useOverlays((s) => s.setCommand)
  const openDock = useAssistant((s) => s.openDock)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const run = (fn: () => void) => () => {
    onNavigate?.()
    fn()
  }

  return (
    <nav aria-label="Main navigation" className="flex h-full w-full flex-col bg-sidebar">
      <div className={cn('flex shrink-0 items-center gap-1 pt-2.5 pb-1', compact ? 'flex-col px-2' : 'px-2.5')}>
        <BusinessSwitcher compact={compact} />
        {!onNavigate && <NotificationsButton side={compact ? 'right' : 'bottom'} />}
        {onNavigate && <IconButton icon={I.close} label="Close navigation" size="sm" onClick={onNavigate} />}
      </div>

      <div className={cn('flex shrink-0 flex-col gap-0.5 pt-1 pb-2', compact ? 'px-2' : 'px-2.5')}>
        <ActionRow compact={compact} icon={I.search} label="Search" keys={<><Kbd>⌘</Kbd><Kbd>K</Kbd></>} onClick={run(() => setCommand(true))} />
        <ActionRow compact={compact} icon={I.magic} label="Ask AI" keys={<><Kbd>⌘</Kbd><Kbd>J</Kbd></>} onClick={run(() => openDock())} />
      </div>

      {inSettings ? (
        <>
          <div className={cn('pb-2', compact ? 'px-2' : 'px-2.5')}>
            <Item item={{ to: '/', label: 'Back to workspace', icon: I.chevronLeft }} compact={compact} onNavigate={onNavigate} />
          </div>
          {compact ? (
            <Popover
              side="right"
              open={settingsOpen}
              onOpenChange={setSettingsOpen}
              className="max-h-[80dvh] w-72 overflow-y-auto p-3"
              trigger={
                <button type="button" aria-label="Settings" className={railClass(true)}>
                  <Icon icon={I.settings} size={18} />
                </button>
              }
            >
              <SettingsNavigation onNavigate={() => { setSettingsOpen(false); onNavigate?.() }} />
            </Popover>
          ) : (
            <div className="min-h-0 flex-1 overflow-y-auto px-2.5 pb-4">
              <SettingsNavigation onNavigate={onNavigate} />
            </div>
          )}
        </>
      ) : (
        <div className={cn('min-h-0 flex-1 overflow-y-auto pb-4', compact ? 'flex flex-col gap-2 px-2' : 'px-2.5')}>
          <div className={cn('flex flex-col', compact ? 'gap-1 border-t border-border pt-2' : 'gap-0.5 pb-3')}>
            {NAV[0].items.map((it) => (
              <Item key={it.to} item={it} badge={badges[it.to]} compact={compact} onNavigate={onNavigate} />
            ))}
          </div>
          {NAV.slice(1).map((g) => (
            <NavSection key={g.label} group={g} compact={compact} onNavigate={onNavigate} />
          ))}
        </div>
      )}

      <div className={cn('shrink-0 pt-2 pb-3', compact ? 'flex flex-col items-center gap-1 px-2' : 'px-2.5')}>
        {!compact && !inSettings && <SetupProgress />}
        {!inSettings && <Item item={{ to: '/settings/business', label: 'Settings', icon: I.settings }} compact={compact} onNavigate={onNavigate} />}
        {compact ? (
          <div className="mt-1 border-t border-border pt-2">
            <ProfileMenu compact />
          </div>
        ) : (
          <div className="mt-1 flex items-center gap-0.5 border-t border-border pt-2">
            <ProfileMenu />
            <SyncStatus />
            <HideAmountsButton />
          </div>
        )}
      </div>
    </nav>
  )
}
