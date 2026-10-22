import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router'
import { I, Icon } from '@/components/icons'
import { IconButton } from '@/components/ui/button'
import { Popover } from '@/components/ui/popover'
import { Tooltip } from '@/components/ui/tooltip'
import { currentUser } from '@/data/business'
import { suggestionsFor } from './answers'
import { Composer, HistoryList, SuggestionRows, Thread, chatTitle } from './chat'
import { bindAssistant, useAssistant } from './store'

const EASE_OUT = [0.23, 1, 0.32, 1] as const

/** Keyboard toggles skip the animation, like every other keyboard-driven overlay here. */
const fromKeyboard = () => document.documentElement.dataset.input === 'keyboard'

function DockHeader() {
  const { chats, activeId, newChat, closeDock } = useAssistant()
  const navigate = useNavigate()
  const [history, setHistory] = useState(false)
  const chat = chats.find((c) => c.id === activeId) ?? null
  return (
    <div className="flex h-12 shrink-0 items-center gap-1 border-b border-border pr-2 pl-3">
      <Popover
        open={history}
        onOpenChange={setHistory}
        align="start"
        className="w-[340px] max-w-[calc(100vw-1.5rem)] p-0"
        trigger={
          <button type="button" className="flex min-w-0 flex-1 items-center gap-1.5 rounded-lg px-1.5 py-1 text-left hover:bg-fill data-[popup-open]:bg-fill">
            <Icon icon={I.sparkles} size={15} className="shrink-0 text-accent-fg" />
            <span translate="no" className="truncate text-sm font-medium text-fg">
              {chatTitle(chat)}
            </span>
            <Icon icon={I.chevronDown} size={13} className="shrink-0 text-faint" />
          </button>
        }
      >
        <HistoryList onPick={() => setHistory(false)} />
      </Popover>
      <IconButton icon={I.add} label="New chat" size="sm" onClick={newChat} />
      <IconButton
        icon={I.expand}
        label="Open full page"
        size="sm"
        onClick={() => {
          closeDock()
          navigate('/assistant')
        }}
      />
      <IconButton icon={I.close} label="Close" size="sm" onClick={closeDock} />
    </div>
  )
}

function DockStart() {
  const { pathname } = useLocation()
  return (
    <div className="flex min-h-0 flex-1 flex-col justify-end overflow-y-auto px-2 pb-1">
      <div className="px-3 pt-6 pb-4">
        <span className="grid size-9 place-items-center rounded-full bg-accent-soft text-accent-fg">
          <Icon icon={I.sparkles} size={17} />
        </span>
        <h2 className="mt-3 text-lg font-semibold tracking-[-0.01em] text-fg">Hi {currentUser.firstName}, what do you need?</h2>
        <p className="mt-0.5 text-sm text-muted">Ask about revenue, visits, clients or stock.</p>
      </div>
      <div className="px-3 pb-1 text-xs font-medium text-muted">Suggested for this page</div>
      <SuggestionRows items={suggestionsFor(pathname)} />
    </div>
  )
}

/**
 * The assistant as a panel you can open from any page (⌘J), the way Linear and
 * Mercury do it. It keeps the conversation while you move around, expands to a
 * full page, and never blocks the screen behind it.
 */
export function AssistantDock() {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const { dock, chats, activeId, openDock, closeDock, toggleDock } = useAssistant()
  const reduce = useReducedMotion()
  const onPage = pathname.startsWith('/assistant')
  const open = dock && !onPage
  const chat = chats.find((c) => c.id === activeId) ?? null
  const instant = fromKeyboard()

  useEffect(() => bindAssistant(navigate), [navigate])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && !e.shiftKey && e.key.toLowerCase() === 'j') {
        e.preventDefault()
        if (pathname.startsWith('/assistant')) return
        toggleDock()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [toggleDock, pathname])

  // Variants take `instant` at exit time too, so closing with Escape is as immediate as opening with ⌘J.
  const variants = {
    hidden: (now: boolean) => ({ opacity: 0, transform: reduce ? 'none' : 'translateY(10px) scale(0.97)', transition: { duration: now ? 0 : 0.15, ease: EASE_OUT } }),
    shown: (now: boolean) => ({ opacity: 1, transform: 'translateY(0px) scale(1)', transition: { duration: now ? 0 : 0.22, ease: EASE_OUT } }),
  }

  return (
    <>
      {!open && !onPage && (
        <Tooltip
          side="left"
          content={
            <span className="flex items-center gap-2">
              Ask AI <span className="opacity-60">⌘J</span>
            </span>
          }
        >
          <button
            type="button"
            aria-label="Ask AI"
            onClick={openDock}
            className="press fixed right-4 bottom-4 z-30 grid size-11 place-items-center rounded-full bg-fg text-bg shadow-popover sm:right-5 sm:bottom-5"
          >
            <Icon icon={I.sparkles} size={20} />
          </button>
        </Tooltip>
      )}
      <AnimatePresence custom={instant}>
        {open && (
          <motion.section
            key="dock"
            role="dialog"
            aria-label="Assistant"
            custom={instant}
            variants={variants}
            initial="hidden"
            animate="shown"
            exit="hidden"
            // Anchored to the launcher it grows from.
            style={{ transformOrigin: 'bottom right' }}
            onKeyDown={(e) => {
              if (e.key === 'Escape' && !e.defaultPrevented) closeDock()
            }}
            className="fixed right-4 bottom-4 z-40 flex h-[min(640px,calc(100dvh-2rem))] w-[400px] max-w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-[22px] bg-raised shadow-modal max-sm:inset-x-2 max-sm:top-16 max-sm:bottom-2 max-sm:h-auto max-sm:w-auto max-sm:max-w-none"
          >
            <DockHeader />
            {chat?.messages.length ? <Thread chat={chat} compact /> : <DockStart />}
            <div className="shrink-0 p-3 pt-1.5">
              <Composer chat={chat} compact autoFocus />
            </div>
          </motion.section>
        )}
      </AnimatePresence>
    </>
  )
}
