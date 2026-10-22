import { Dialog } from '@base-ui/react/dialog'
import { useEffect, useRef, useState } from 'react'
import { Navigate, Outlet, useLocation } from 'react-router'
import { I, Icon } from '@/components/icons'
import { IconButton } from '@/components/ui/button'
import { Tooltip } from '@/components/ui/tooltip'
import { ClientSheet } from '@/features/client-sheet'
import { NewClientModal } from '@/features/new-client-modal'
import { NewTaskModal } from '@/features/new-task-modal'
import { NewVisitModal } from '@/features/new-visit-modal'
import { VisitSheet } from '@/features/visit-sheet'
import { text } from '@/i18n'
import { useLanguage } from '@/i18n/language'
import { cn } from '@/lib/cn'
import { useOverlays } from '@/lib/overlays'
import { usePrefs } from '@/lib/store'
import { useWorkspace } from '@/lib/workspace'
import { AssistantDock } from '@/pages/assistant/dock'
import { NotificationsButton } from './account'
import { CommandMenu } from './command-menu'
import { currentPage } from './nav'
import { NotificationsSheet } from './notifications'
import { Sidebar } from './sidebar'

/** Typing in a field must never trigger a single-key shortcut. */
function isTyping(target: EventTarget | null) {
  const el = target as HTMLElement | null
  return !!el && (el.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName))
}

export function AppShell() {
  const signedIn = usePrefs((s) => s.signedIn)
  const collapsed = useWorkspace((s) => s.sidebarCollapsed)
  const toggleSidebar = useWorkspace((s) => s.toggleSidebar)
  const setCommand = useOverlays((s) => s.setCommand)
  const [drawer, setDrawer] = useState(false)
  const { pathname } = useLocation()
  const language = useLanguage()
  const main = useRef<HTMLElement>(null)
  const page = currentPage(pathname)

  // New page starts at the top; no transition, navigation happens all day.
  useEffect(() => {
    main.current?.scrollTo(0, 0)
  }, [pathname])

  // The browser tab says where you are, too.
  useEffect(() => {
    document.title = `${text(page)} · NavCRM`
  }, [page, language])

  // "[" folds the sidebar, as in Linear. Keyboard toggles are instant by design.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== '[' || e.metaKey || e.ctrlKey || e.altKey || isTyping(e.target)) return
      e.preventDefault()
      toggleSidebar()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [toggleSidebar])

  if (!signedIn) return <Navigate to="/signin" replace />

  return (
    <div className="flex h-dvh overflow-hidden bg-bg" style={{ ['--sidebar-w' as string]: collapsed ? '64px' : '240px' }}>
      <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:rounded-lg focus:bg-raised focus:p-3">
        Skip to content
      </a>
      {/* Revolut lets the light sidebar share the canvas; Sweatpals draws a hairline in the dark. */}
      <aside className={cn('relative hidden shrink-0 lg:block dark:border-r dark:border-border', collapsed ? 'w-16' : 'w-60')}>
        <Sidebar compact={collapsed} />
        {/* Sweatpals keeps a round handle on the sidebar edge: always findable, never in the way. */}
        <Tooltip
          side="right"
          content={
            <span className="flex items-center gap-2">
              {collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              <span className="opacity-60">[</span>
            </span>
          }
        >
          <button
            type="button"
            onClick={toggleSidebar}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            aria-expanded={!collapsed}
            className="press absolute top-1/2 -right-3 z-20 grid size-6 -translate-y-1/2 place-items-center rounded-full bg-bg text-muted ring-1 ring-border-strong hover:text-fg"
          >
            <Icon icon={collapsed ? I.chevronRight : I.chevronLeft} size={13} strokeWidth={2} />
          </button>
        </Tooltip>
      </aside>

      <Dialog.Root open={drawer} onOpenChange={setDrawer}>
        <Dialog.Portal>
          <Dialog.Backdrop className="backdrop fixed inset-0 z-50 bg-backdrop lg:hidden" />
          <Dialog.Popup className="nav-drawer fixed inset-y-0 left-0 z-50 w-[280px] max-w-[85vw] shadow-modal lg:hidden">
            <Dialog.Title className="sr-only">Navigation</Dialog.Title>
            <Sidebar onNavigate={() => setDrawer(false)} />
          </Dialog.Popup>
        </Dialog.Portal>
      </Dialog.Root>

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Phones get a slim bar: where you are, plus the two things you reach for. */}
        <header className="flex h-14 shrink-0 items-center gap-1 border-b border-border px-2 lg:hidden">
          <IconButton icon={I.menu} label="Menu" onClick={() => setDrawer(true)} />
          <span className="min-w-0 flex-1 truncate px-1 text-base font-semibold text-fg" aria-current="page">
            {page}
          </span>
          <IconButton icon={I.search} label="Search" onClick={() => setCommand(true)} />
          <NotificationsButton />
        </header>
        <main id="main-content" ref={main} tabIndex={-1} className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto outline-none">
          <Outlet />
        </main>
      </div>

      <AssistantDock />
      <CommandMenu />
      <NotificationsSheet />
      <NewVisitModal />
      <NewClientModal />
      <NewTaskModal />
      <ClientSheet />
      <VisitSheet />
    </div>
  )
}
