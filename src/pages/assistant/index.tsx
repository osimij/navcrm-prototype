import { useEffect, useRef } from 'react'
import { Route, Routes, useLocation, useNavigate, useSearchParams } from 'react-router'
import { toast } from 'sonner'
import { I, Icon } from '@/components/icons'
import { IconButton } from '@/components/ui/button'
import { Menu, MenuItem } from '@/components/ui/menu'
import { text as translate } from '@/i18n'
import { useWorkspace } from '@/lib/workspace'
import { Composer, HistoryButton, Thread, chatTitle } from './chat'
import { useAssistant } from './store'

const EXAMPLES = [
  { title: 'Understand revenue', description: 'See what changed and why', icon: I.chart, question: 'Why did revenue change?' },
  { title: 'Plan the day', description: 'Find free time in the schedule', icon: I.calendar, question: 'Which masters had free time today?' },
  { title: 'Bring clients back', description: 'Find who needs a follow-up', icon: I.clients, question: 'Who hasn’t visited in 60 days?' },
]

/** Linear's starting screen: one question in the middle, examples you can dismiss for good. */
function Start() {
  const ask = useAssistant((s) => s.ask)
  const shown = useWorkspace((s) => s.sections['assistant:examples'] ?? true)
  const setSection = useWorkspace((s) => s.setSection)
  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
      <div className="mx-auto flex w-full max-w-[680px] flex-1 flex-col justify-center px-5 pt-6 pb-[14vh] sm:px-8">
        <div className="mb-7 text-center">
          <span className="mx-auto grid size-11 place-items-center rounded-full bg-accent-soft text-accent-fg">
            <Icon icon={I.sparkles} size={20} />
          </span>
          <h1 className="mt-4 text-2xl font-semibold tracking-[-0.02em] text-fg">What can I help with?</h1>
          <p className="mt-1 text-sm text-muted">Ask about revenue, visits, clients or stock. Answers use your live data.</p>
        </div>
        <Composer chat={null} autoFocus />
        {shown && (
          <div className="answer-in mt-6">
            <div className="mb-2 flex items-center justify-between pl-1">
              <span className="text-xs font-medium text-muted">Get started with some examples</span>
              <IconButton icon={I.close} label="Hide examples" size="xs" iconSize={14} onClick={() => setSection('assistant:examples', false)} />
            </div>
            <div className="grid gap-2 sm:grid-cols-3">
              {EXAMPLES.map((s) => (
                <button
                  key={s.title}
                  type="button"
                  onClick={() => ask(translate(s.question))}
                  className="press flex flex-col rounded-2xl bg-surface p-4 text-left ring-1 ring-border hover:bg-fill/60"
                >
                  <Icon icon={s.icon} size={17} className="mb-5 text-muted" />
                  <span className="block text-sm font-medium text-fg">{s.title}</span>
                  <span className="mt-0.5 block text-xs leading-5 text-muted">{s.description}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function AssistantView() {
  const { chats, activeId, newChat, openDock, deleteChat, ask } = useAssistant()
  const navigate = useNavigate()
  const location = useLocation()
  const [params, setParams] = useSearchParams()
  const handled = useRef<string | null>(null)
  const chat = chats.find((c) => c.id === activeId) ?? null
  const started = !!chat?.messages.length

  // Links that carry a question (?q=…) start a fresh conversation, once.
  useEffect(() => {
    const q = params.get('q')
    if (!q) {
      handled.current = null
      return
    }
    if (handled.current === q) return
    handled.current = q
    newChat()
    ask(q)
    setParams({}, { replace: true })
  }, [params, setParams, newChat, ask])

  const asPanel = () => {
    openDock()
    if (location.key !== 'default') navigate(-1)
    else navigate('/')
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <header className="flex h-14 shrink-0 items-center gap-1 px-3 sm:px-5">
        <nav aria-label="Breadcrumb" className="flex min-w-0 flex-1 items-center gap-1.5 text-sm">
          <button type="button" onClick={newChat} className="flex shrink-0 items-center gap-1.5 rounded-lg px-1.5 py-1 font-medium text-muted hover:bg-fill hover:text-fg">
            <Icon icon={I.sparkles} size={15} className="text-accent-fg" />
            Assistant
          </button>
          {started && chat && (
            <>
              <Icon icon={I.chevronRight} size={13} className="shrink-0 text-faint" />
              <span translate="no" className="min-w-0 truncate font-medium text-fg" title={chatTitle(chat)}>
                {chatTitle(chat)}
              </span>
              <Menu align="start" trigger={<IconButton icon={I.more} label="Conversation actions" size="xs" iconSize={16} tooltip={false} />}>
                <MenuItem
                  icon={I.copy}
                  onClick={() => {
                    const value = document.querySelector<HTMLElement>('[data-thread]')?.innerText ?? ''
                    navigator.clipboard?.writeText(value).catch(() => {})
                    toast.success('Conversation copied')
                  }}
                >
                  Copy conversation
                </MenuItem>
                <MenuItem icon={I.delete} danger onClick={() => deleteChat(chat.id)}>
                  Delete
                </MenuItem>
              </Menu>
            </>
          )}
        </nav>
        <HistoryButton />
        <IconButton icon={I.add} label="New chat" size="sm" onClick={newChat} />
        <IconButton icon={I.shrink} label="Open as a panel" size="sm" onClick={asPanel} />
      </header>

      {started && chat ? (
        <Thread
          chat={chat}
          footer={
            <div className="shrink-0 px-4 pt-1 pb-4 sm:px-8">
              <div className="mx-auto max-w-[720px]">
                <Composer chat={chat} autoFocus />
                <p className="mt-2 text-center text-xs text-faint">Check important numbers in Reports.</p>
              </div>
            </div>
          }
        />
      ) : (
        <Start />
      )}
    </div>
  )
}

export default function Assistant() {
  return (
    <Routes>
      <Route index element={<AssistantView />} />
    </Routes>
  )
}
