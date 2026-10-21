import { NavLink, useLocation, useNavigate } from 'react-router'
import { I, Icon } from '@/components/icons'
import { Popover } from '@/components/ui/popover'
import { business } from '@/data/business'
import { cn } from '@/lib/cn'
import { usePrefs } from '@/lib/store'
import { useInbox } from '@/pages/inbox/store'
import { isOverdue, useTasks } from '@/pages/tasks/store'
import { NAV, SETTINGS_NAV, type NavItem } from './nav'

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
    'press group flex h-8 items-center gap-2.5 rounded-lg px-2.5 text-base select-none',
    active ? 'bg-fill-active font-medium text-fg' : 'text-muted hover:bg-fill hover:text-fg',
  )

function Item({ item, badge, onNavigate }: { item: NavItem; badge?: number; onNavigate?: () => void }) {
  return (
    <NavLink to={item.to} end={item.to === '/'} onClick={onNavigate} className={({ isActive }) => itemClass(isActive)}>
      {({ isActive }) => (
        <>
          <Icon icon={item.icon} size={18} className={isActive ? 'text-fg' : 'text-faint group-hover:text-muted'} />
          <span className="flex-1 truncate">{item.label}</span>
          {badge ? (
            <span className="min-w-5 rounded-full bg-fill-active px-1.5 text-center text-xs leading-5 font-medium text-muted tabular">
              {badge}
            </span>
          ) : null}
        </>
      )}
    </NavLink>
  )
}

function BusinessSwitcher() {
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
          className="press flex w-full items-center gap-2.5 rounded-xl px-2 py-1.5 text-left hover:bg-fill data-[popup-open]:bg-fill"
        >
          <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-fg text-sm font-semibold text-bg">S</span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-base font-medium text-fg">{business.name}</span>
            <span className="block truncate text-xs text-muted">{branch}</span>
          </span>
          <Icon icon={I.chevronsUpDown} size={16} className="text-faint" />
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
        className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-base text-fg hover:bg-fill"
      >
        <Icon icon={I.settings} size={16} className="text-muted" />
        Manage branches
      </button>
      <button
        type="button"
        onClick={() => navigate('/signup')}
        className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-base text-fg hover:bg-fill"
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
        <div className="h-full rounded-full bg-accent transition-[width] duration-500 ease-[var(--ease-out)]" style={{ width: `${pct}%` }} />
      </div>
    </NavLink>
  )
}

export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const { pathname } = useLocation()
  const inSettings = pathname.startsWith('/settings')
  const badges = useBadges()

  return (
    <nav className="flex h-full w-full flex-col bg-sidebar">
      <div className="flex h-14 shrink-0 items-center px-2.5">
        <BusinessSwitcher />
      </div>

      {inSettings ? (
        <div className="min-h-0 flex-1 overflow-y-auto px-2.5 pb-4">
          <NavLink
            to="/"
            onClick={onNavigate}
            className="press mb-3 flex h-8 items-center gap-2 rounded-lg px-2 text-base font-medium text-fg hover:bg-fill"
          >
            <Icon icon={I.chevronLeft} size={18} className="text-muted" />
            Settings
          </NavLink>
          {SETTINGS_NAV.map((g) => (
            <div key={g.label} className="mb-4">
              <div className="px-2.5 pb-1 text-xs font-medium text-faint">{g.label}</div>
              {g.items.map((it) => (
                <NavLink key={it.to} to={it.to} onClick={onNavigate} className={({ isActive }) => cn(itemClass(isActive), 'h-[30px] pl-2.5')}>
                  {it.label}
                </NavLink>
              ))}
            </div>
          ))}
        </div>
      ) : (
        <>
          <div className="min-h-0 flex-1 overflow-y-auto px-2.5 pt-1 pb-4">
            {NAV.map((g, i) => (
              <div key={i} className={cn(i > 0 && 'mt-5')}>
                {g.label && <div className="px-2.5 pb-1 text-xs font-medium text-faint">{g.label}</div>}
                <div className="flex flex-col gap-px">
                  {g.items.map((it) => (
                    <Item key={it.to} item={it} badge={badges[it.to]} onNavigate={onNavigate} />
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div className="shrink-0 px-2.5 pt-2 pb-3">
            <SetupProgress />
            <Item item={{ to: '/settings/business', label: 'Settings', icon: I.settings }} onNavigate={onNavigate} />
          </div>
        </>
      )}
    </nav>
  )
}
