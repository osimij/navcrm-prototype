import { Collapsible } from '@base-ui/react/collapsible'
import { useEffect, useState } from 'react'
import { Tooltip } from '@/components/ui/tooltip'
import { IconButton } from '@/components/ui/button'
import { SearchInput } from '@/components/ui/input'
import { useWorkspace } from '@/lib/workspace'
import { text } from '@/i18n'
import { NavLink, useLocation, useNavigate } from 'react-router'
import { I, Icon } from '@/components/icons'
import { Popover } from '@/components/ui/popover'
import { business } from '@/data/business'
import { cn } from '@/lib/cn'
import { usePrefs } from '@/lib/store'
import { useInbox } from '@/pages/inbox/store'
import { isOverdue, useTasks } from '@/pages/tasks/store'
import { NAV, SETTINGS_NAV, type NavItem, type NavGroup } from './nav'

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

const itemClass = (active: boolean) =>
  cn(
    'group flex min-h-9 items-center gap-2.5 rounded-xl px-3 py-2 text-sm select-none',
    active ? 'bg-surface font-medium text-fg shadow-xs dark:bg-fill' : 'text-muted hover:bg-fill hover:text-fg',
  )

function Item({ item, badge, onNavigate, compact = false }: { item: NavItem; badge?: number; onNavigate?: () => void; compact?: boolean }) {
  const link = (
    <NavLink to={item.to} end={item.to === '/'} onClick={onNavigate} aria-label={compact ? item.label : undefined}
      className={({ isActive }) => cn(itemClass(isActive), compact && 'relative mx-auto size-10 justify-center p-0')}>
      {({ isActive }) => <>
        <Icon icon={item.icon} size={18} className={cn('shrink-0', isActive ? 'text-fg' : 'text-muted')} />
        {!compact && <span className="min-w-0 flex-1">{item.label}</span>}
        {!!badge && (compact ? <span className="absolute top-1.5 right-1.5 size-1.5 rounded-full bg-accent" /> :
          <span className="min-w-5 text-center text-xs text-muted tabular">{badge}</span>)}
      </>}
    </NavLink>
  )
  return compact ? <Tooltip content={item.label} side="right">{link}</Tooltip> : link
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
      className="w-64 p-1.5"
      trigger={
        <button
          type="button"
          aria-label={compact ? business.name : undefined}
          className={cn("press flex w-full items-center gap-2.5 rounded-xl px-2 py-1.5 text-left hover:bg-fill data-[popup-open]:bg-fill", compact && "justify-center px-0")}
        >
          <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-fg text-sm font-semibold text-bg">S</span>
          <span className={cn("min-w-0 flex-1", compact && "hidden")}>
            <span className="block truncate text-base font-medium text-fg">{business.name}</span>
            <span className="block truncate text-xs text-muted">{branch}</span>
          </span>
          {!compact && <Icon icon={I.chevronsUpDown} size={16} className="text-faint" />}
        </button>
      }
    >
      <div className="px-2.5 pt-1.5 pb-1 text-xs font-medium text-faint">Branch</div>
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
      <button
        type="button"
        onClick={() => navigate('/settings/branches')}
        className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-base text-fg hover:bg-fill"
      >
        <Icon icon={I.settings} size={16} className="text-muted" />
        Manage branches
      </button>
      <button
        type="button"
        onClick={() => navigate('/signup')}
        className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-base text-fg hover:bg-fill"
      >
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
    <NavLink to="/settings/setup" className="press mx-1 mb-2 block rounded-xl bg-surface p-3 ring-1 ring-border hover:bg-fill">
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

function NavigationGroup({ group, compact, onNavigate }: { group: NavGroup; compact: boolean; onNavigate?: () => void }) {
  const { pathname } = useLocation()
  const active = group.items.some((it) => pathname === it.to || pathname.startsWith(it.to + '/'))
  const key = `nav:${group.label}`
  const savedOpen = useWorkspace((s) => s.sections[key] ?? false)
  const [routeOpen, setRouteOpen] = useState(active)
  const open = routeOpen || savedOpen
  const setSection = useWorkspace((s) => s.setSection)
  const [flyout, setFlyout] = useState(false)
  // Reveal the current destination without saving automatic openings as a
  // preference. Visiting every section should not leave every group expanded.
  useEffect(() => { setRouteOpen(active) }, [pathname, active])
  const links = group.items.map((it) => <Item key={it.to} item={it} onNavigate={() => { setFlyout(false); onNavigate?.() }} />)
  if (compact) return (
    <Popover side="right" align="start" open={flyout} onOpenChange={setFlyout} className="w-64 p-2" trigger={
      <button type="button" aria-label={group.label} title={text(group.label ?? '')} className={cn('mx-auto grid size-10 place-items-center rounded-xl text-muted hover:bg-fill', active && 'bg-fill text-fg')}>
        <Icon icon={group.items[0].icon} size={18} />
      </button>
    }>
      <div className="px-3 py-2 text-xs font-medium text-muted">{group.label}</div>{links}
    </Popover>
  )
  return (
    <Collapsible.Root open={open} onOpenChange={(value) => { setRouteOpen(false); setSection(key, value) }}>
      <Collapsible.Trigger className="flex min-h-9 w-full items-center justify-between gap-2 rounded-lg px-3 text-xs font-medium text-muted hover:bg-fill">
        {group.label}<Icon icon={I.chevronRight} size={14} className={cn(open && 'rotate-90')} />
      </Collapsible.Trigger>
      <Collapsible.Panel className="disclosure-panel"><div className="flex flex-col gap-0.5">{links}</div></Collapsible.Panel>
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
  const groups = SETTINGS_NAV.map((g) => ({ ...g, items: g.items.filter((it) => `${it.label} ${text(it.label)} ${g.label} ${text(g.label)}`.toLowerCase().includes(query.trim().toLowerCase())) })).filter((g) => g.items.length)
  return <>
    <div className="mb-3"><SearchInput value={query} onChange={setQuery} placeholder="Find a setting" /></div>
    {groups.map((g) => {
      const open = !!query.trim() || routeGroup === g.label || !!sections[`settings:${g.label}`]
      return <Collapsible.Root key={g.label} open={open} onOpenChange={(value) => { if (routeGroup === g.label) setRouteGroup(undefined); setSection(`settings:${g.label}`, value) }} className="mb-2">
        <Collapsible.Trigger className="flex min-h-9 w-full items-center justify-between gap-2 rounded-lg px-3 text-left text-xs font-medium text-muted hover:bg-fill">
          {g.label}<Icon icon={I.chevronRight} size={14} className={cn('shrink-0', open && 'rotate-90')} />
        </Collapsible.Trigger>
        <Collapsible.Panel className="disclosure-panel">
          {g.items.map((it) => <NavLink key={it.to} to={it.to} onClick={onNavigate} className={({ isActive }) => itemClass(isActive)}>{it.label}</NavLink>)}
        </Collapsible.Panel>
      </Collapsible.Root>
    })}
    {!groups.length && <p className="px-3 py-4 text-sm text-muted">No settings found</p>}
  </>
}

export function Sidebar({ onNavigate, compact = false }: { onNavigate?: () => void; compact?: boolean }) {
  const { pathname } = useLocation()
  const inSettings = pathname.startsWith('/settings')
  const badges = useBadges()
  const [settingsOpen, setSettingsOpen] = useState(false)
  const assistant = { to: '/assistant', label: 'Assistant', icon: I.assistant }
  return (
    <nav aria-label="Main navigation" className="flex h-full w-full flex-col bg-sidebar">
      <div className="flex h-16 shrink-0 items-center gap-1 px-3">
        <div className="min-w-0 flex-1"><BusinessSwitcher compact={compact} /></div>
        {onNavigate && <IconButton icon={I.close} label="Close navigation" onClick={onNavigate} />}
      </div>
      {inSettings ? <>
        <div className="px-3 pb-3"><Item item={{ to: '/', label: 'Back to workspace', icon: I.chevronLeft }} compact={compact} onNavigate={onNavigate} /></div>
        {compact ? <Popover side="right" open={settingsOpen} onOpenChange={setSettingsOpen} className="max-h-[80dvh] w-72 overflow-y-auto p-3" trigger={
          <button type="button" aria-label="Settings" className="mx-auto grid size-10 place-items-center rounded-xl bg-fill text-fg"><Icon icon={I.settings} size={18} /></button>
        }><SettingsNavigation onNavigate={() => { setSettingsOpen(false); onNavigate?.() }} /></Popover> :
          <div className="min-h-0 flex-1 overflow-y-auto px-3 pb-4"><SettingsNavigation onNavigate={onNavigate} /></div>}
      </> : <>
        <div className="min-h-0 flex-1 overflow-y-auto px-3 pt-2 pb-4">
          <div className="flex flex-col gap-1">{NAV[0].items.map((it) => <Item key={it.to} item={it} badge={badges[it.to]} compact={compact} onNavigate={onNavigate} />)}</div>
          <div className="my-4 h-px bg-border" />
          <Item item={assistant} compact={compact} onNavigate={onNavigate} />
          <div className="mt-4 flex flex-col gap-2">{NAV.slice(1).map((g) => <NavigationGroup key={g.label} group={{ ...g, items: g.items.filter((it) => it.to !== '/assistant') }} compact={compact} onNavigate={onNavigate} />)}</div>
        </div>
        <div className="shrink-0 px-3 pt-2 pb-4">
          {!compact && <SetupProgress />}
          <Item item={{ to: '/settings/business', label: 'Settings', icon: I.settings }} compact={compact} onNavigate={onNavigate} />
        </div>
      </>}
    </nav>
  )
}
