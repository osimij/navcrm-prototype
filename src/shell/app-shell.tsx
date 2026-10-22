import { Dialog } from '@base-ui/react/dialog'
import { useEffect, useRef, useState } from 'react'
import { Navigate, Outlet, useLocation } from 'react-router'
import { ClientSheet } from '@/features/client-sheet'
import { NewClientModal } from '@/features/new-client-modal'
import { NewTaskModal } from '@/features/new-task-modal'
import { NewVisitModal } from '@/features/new-visit-modal'
import { VisitSheet } from '@/features/visit-sheet'
import { usePrefs } from '@/lib/store'
import { useWorkspace } from '@/lib/workspace'
import { cn } from '@/lib/cn'
import { CommandMenu } from './command-menu'
import { NotificationsSheet } from './notifications'
import { Sidebar } from './sidebar'
import { Topbar } from './topbar'

export function AppShell() {
  const signedIn = usePrefs((s) => s.signedIn)
  const collapsed = useWorkspace((s) => s.sidebarCollapsed)
  const [drawer, setDrawer] = useState(false)
  const { pathname } = useLocation()
  const main = useRef<HTMLElement>(null)

  // New page starts at the top; no transition, navigation happens all day.
  useEffect(() => {
    main.current?.scrollTo(0, 0)
  }, [pathname])

  if (!signedIn) return <Navigate to="/signin" replace />

  return (
    <div className="flex h-dvh overflow-hidden bg-bg">
      <aside className={cn('hidden shrink-0 border-r border-border lg:block', collapsed ? 'w-[72px]' : 'w-[248px]')}>
        <Sidebar compact={collapsed} />
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
        <Topbar onMenu={() => setDrawer(true)} />
        <main id="main-content" ref={main} tabIndex={-1} className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto outline-none">
          <Outlet />
        </main>
      </div>

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
