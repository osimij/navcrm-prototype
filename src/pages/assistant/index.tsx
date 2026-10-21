import { useCallback, useEffect, useLayoutEffect, useRef, useState, type KeyboardEvent } from 'react'
import { Route, Routes, useNavigate, useSearchParams } from 'react-router'
import { BarChart } from '@/components/charts/bar-chart'
import { I, Icon } from '@/components/icons'
import { Button, IconButton } from '@/components/ui/button'
import { cn } from '@/lib/cn'
import { useOverlays } from '@/lib/overlays'
import { useData } from '@/lib/store'
import { SUGGESTIONS, answer, type Block } from './answers'
import { uid, useAssistant, type ChatMessage } from './store'

function Thinking() {
  return (
    <span className="flex h-6 items-center gap-1" aria-label="Thinking">
      {[0, 160, 320].map((d) => (
        <span key={d} className="size-1.5 animate-pulse rounded-full bg-faint [animation-duration:1s]" style={{ animationDelay: `${d}ms` }} />
      ))}
    </span>
  )
}

function AssistantMark() {
  return (
    <span className="grid size-8 shrink-0 place-items-center rounded-full bg-accent-soft text-accent-fg">
      <Icon icon={I.sparkles} size={16} />
    </span>
  )
}

function Blocks({ blocks, ask }: { blocks: Block[]; ask: (q: string) => void }) {
  return (
    <div className="flex min-w-0 flex-col gap-4">
      {blocks.map((b, i) => {
        switch (b.type) {
          case 'text':
            return (
              <p key={i} className="text-base leading-6 text-fg">
                {b.text}
              </p>
            )
          case 'table':
            return (
              <div key={i} className="overflow-x-auto rounded-xl ring-1 ring-border">
                <table className="w-full text-sm">
                  <thead>
                    <tr>
                      {b.columns.map((c, j) => (
                        <th key={j} className={cn('h-9 px-3.5 text-xs font-medium whitespace-nowrap text-faint', c.align === 'right' ? 'text-right' : 'text-left')}>
                          {c.label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {b.rows.map((r, j) => (
                      <tr key={j} className="border-t border-border">
                        {r.map((cell, k) => (
                          <td key={k} className={cn('h-10 px-3.5 text-fg', b.columns[k]?.align === 'right' ? 'text-right tabular whitespace-nowrap' : 'text-left')}>
                            {cell}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          case 'bars':
            return (
              <div key={i} className="rounded-xl p-4 ring-1 ring-border">
                <div className="mb-3 text-sm text-muted">{b.caption}</div>
                <BarChart bars={b.bars} height={120} renderTooltip={b.format ? (bar) => b.format!(bar) : undefined} />
              </div>
            )
          case 'post':
            return (
              <div key={i} className="rounded-xl bg-fill px-4 py-3.5 text-base leading-6 whitespace-pre-wrap text-fg">
                {b.text}
              </div>
            )
          case 'actions':
            return (
              <div key={i} className="flex flex-wrap gap-2">
                {b.actions.map((a) => (
                  <Button key={a.label} size="sm" variant={a.primary ? 'outline' : 'secondary'} icon={a.icon} onClick={a.run}>
                    {a.label}
                  </Button>
                ))}
              </div>
            )
          case 'suggestions':
            return (
              <div key={i} className="flex flex-wrap gap-2">
                {SUGGESTIONS.slice(0, 4).map((s) => (
                  <Button key={s} size="sm" variant="secondary" onClick={() => ask(s)}>
                    {s}
                  </Button>
                ))}
              </div>
            )
        }
      })}
    </div>
  )
}

function Message({ m, ask }: { m: ChatMessage; ask: (q: string) => void }) {
  if (m.role === 'user') {
    return (
      <div data-role="user" className="flex justify-end">
        <div className="max-w-[80%] rounded-2xl rounded-br-md bg-fill px-4 py-2.5 text-base leading-6 text-fg">{m.text}</div>
      </div>
    )
  }
  return (
    <div className="flex gap-3">
      <AssistantMark />
      <div className={cn('min-w-0 flex-1 pt-1', !m.pending && 'rise')}>{m.pending ? <Thinking /> : <Blocks blocks={m.blocks ?? []} ask={ask} />}</div>
    </div>
  )
}

function AssistantView() {
  const { chats, activeId, setActive, newChat, addMessage, resolve, ensureChat } = useAssistant()
  const navigate = useNavigate()
  const { openNewVisit, openClient } = useOverlays()
  const [params, setParams] = useSearchParams()
  const [text, setText] = useState('')
  const scroller = useRef<HTMLDivElement>(null)
  const area = useRef<HTMLTextAreaElement>(null)
  const handledQ = useRef<string | null>(null)

  const chat = chats.find((c) => c.id === activeId) ?? null
  const busy = !!chat?.messages.some((m) => m.pending)

  const ask = useCallback(
    (raw: string) => {
      const q = raw.trim()
      if (!q) return
      const chatId = ensureChat(q)
      addMessage(chatId, { id: uid('u'), role: 'user', text: q })
      const pendingId = uid('a')
      addMessage(chatId, { id: pendingId, role: 'assistant', pending: true })
      // A short beat while numbers are gathered; the answer then appears whole, not typed out.
      setTimeout(() => {
        const { entries, clients } = useData.getState()
        resolve(chatId, pendingId, answer(q, { entries, clients, navigate, openNewVisit, openClient, ask: (x) => askRef.current(x) }))
      }, 650 + Math.min(q.length * 4, 250))
    },
    [ensureChat, addMessage, resolve, navigate, openNewVisit, openClient],
  )
  const askRef = useRef(ask)
  askRef.current = ask

  // Questions typed into ⌘K arrive as ?q=… and are asked once, in a fresh chat.
  useEffect(() => {
    const q = params.get('q')
    if (!q) {
      handledQ.current = null
      return
    }
    if (handledQ.current === q) return
    handledQ.current = q
    newChat()
    ask(q)
    setParams({}, { replace: true })
  }, [params, setParams, ask, newChat])

  // New question: show it at the bottom. Finished answer: bring the question to the top so the answer reads from its start.
  const last = chat?.messages[chat.messages.length - 1]
  useLayoutEffect(() => {
    const el = scroller.current
    if (!el || !last) return
    if (last.pending) {
      el.scrollTop = el.scrollHeight
      return
    }
    const users = el.querySelectorAll<HTMLElement>('[data-role="user"]')
    const q = users[users.length - 1]
    if (q && el.scrollHeight > el.clientHeight) el.scrollTo({ top: q.offsetTop - 24, behavior: 'smooth' })
  }, [last?.id, last?.pending, last])

  useLayoutEffect(() => {
    const el = area.current
    if (!el) return
    el.style.height = '0px'
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`
  }, [text])

  function submit() {
    if (!text.trim() || busy) return
    ask(text)
    setText('')
  }

  function onKey(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault()
      submit()
    }
  }

  const groups = (['Today', 'This week'] as const).map((g) => ({ g, items: chats.filter((c) => c.group === g) })).filter((x) => x.items.length)

  return (
    <div className="flex h-full min-h-0 lg:border-t lg:border-border">
      <aside className="hidden w-[280px] shrink-0 flex-col border-r border-border md:flex">
        <div className="p-3">
          <Button icon={I.add} className="w-full" onClick={newChat}>
            New chat
          </Button>
        </div>
        <nav className="min-h-0 flex-1 overflow-y-auto px-2 pb-4">
          {groups.map(({ g, items }) => (
            <div key={g} className="mb-4">
              <div className="px-2.5 pb-1 text-xs font-medium text-faint">{g}</div>
              {items.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => {
                    setActive(c.id)
                    if (!c.messages.length) ask(c.title)
                  }}
                  className={cn(
                    'block w-full truncate rounded-lg px-2.5 py-2 text-left text-base',
                    c.id === activeId ? 'bg-fill-active text-fg' : 'text-muted hover:bg-fill hover:text-fg',
                  )}
                >
                  {c.title}
                </button>
              ))}
            </div>
          ))}
        </nav>
      </aside>

      <section className="flex min-w-0 flex-1 flex-col">
        <div className="flex h-14 shrink-0 items-center justify-between gap-4 border-b border-border px-6">
          <h1 className="truncate text-lg font-normal text-fg">{chat ? chat.title : 'Assistant'}</h1>
          <span className="hidden shrink-0 items-center gap-1.5 text-sm text-faint sm:flex">
            <Icon icon={I.lock} size={14} />
            Answers come from your data, within your permissions
          </span>
        </div>

        <div ref={scroller} className="min-h-0 flex-1 overflow-y-auto">
          {chat && chat.messages.length ? (
            <div className="mx-auto flex max-w-[760px] flex-col gap-6 px-6 pt-8 pb-10">
              {chat.messages.map((m) => (
                <Message key={m.id} m={m} ask={ask} />
              ))}
            </div>
          ) : (
            <div className="mx-auto flex min-h-full max-w-[640px] flex-col justify-center px-6 py-10">
              <span className="mb-5 grid size-12 place-items-center rounded-2xl bg-accent-soft text-accent-fg">
                <Icon icon={I.sparkles} size={22} />
              </span>
              <h2 className="text-2xl font-normal text-fg">Ask about your business</h2>
              <p className="mt-1.5 text-base text-muted">Revenue, visits, clients, staff load and stock, answered in plain words with the numbers behind them.</p>
              <div className="mt-7 grid gap-2 sm:grid-cols-2">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => ask(s)}
                    className="press rounded-xl px-4 py-3 text-left text-base text-fg ring-1 ring-border hover:bg-fill"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="shrink-0 px-6 pb-5">
          <div className="mx-auto max-w-[760px]">
            <div className="flex items-end gap-2 rounded-2xl bg-surface p-2 pl-4 ring-1 ring-border transition-[box-shadow] duration-150 focus-within:ring-accent focus-within:shadow-[0_0_0_4px_color-mix(in_oklab,var(--accent)_12%,transparent)]">
              <textarea
                ref={area}
                rows={1}
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={onKey}
                placeholder="Ask about revenue, clients, staff or stock"
                aria-label="Question"
                className="block max-h-40 min-h-8 flex-1 resize-none bg-transparent py-1.5 text-base leading-[21px] text-fg outline-none placeholder:text-faint"
              />
              <IconButton icon={I.send} label="Ask (Enter)" variant="primary" size="sm" disabled={!text.trim() || busy} onClick={submit} className="disabled:opacity-40" />
            </div>
            <p className="mt-2 text-center text-xs text-faint">Uses the register and calendar, updated within a minute. Check important numbers in Reports.</p>
          </div>
        </div>
      </section>
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
