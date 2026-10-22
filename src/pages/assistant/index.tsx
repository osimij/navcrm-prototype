import { useCallback, useEffect, useLayoutEffect, useRef, useState, type KeyboardEvent } from 'react'
import { Route, Routes, useNavigate, useSearchParams } from 'react-router'
import { BarChart } from '@/components/charts/bar-chart'
import { I, Icon } from '@/components/icons'
import { Sheet } from '@/components/ui/dialog'
import { Popover } from '@/components/ui/popover'
import { SearchInput } from '@/components/ui/input'
import { text as translate } from '@/i18n'
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
      <Icon icon={I.assistant} size={16} />
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
              <p key={i} className="text-base leading-6 text-fg [overflow-wrap:anywhere]">
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
                        <th key={j} className={cn('px-3.5 text-xs font-medium whitespace-nowrap text-faint', c.align === 'right' ? 'text-right' : 'text-left')}>
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
              <div key={i} className="rounded-xl bg-fill px-4 py-3.5 text-base leading-6 whitespace-pre-wrap text-fg [overflow-wrap:anywhere]">
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
                  <Button key={s} size="sm" variant="secondary" onClick={() => ask(translate(s))}>
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
        <div translate="no" className="min-w-0 max-w-[90%] rounded-2xl rounded-br-md bg-fill px-4 py-2.5 text-base leading-6 whitespace-pre-wrap text-fg [overflow-wrap:anywhere] sm:max-w-[80%]">{m.text}</div>
      </div>
    )
  }
  return (
    <div className="flex gap-3">
      <AssistantMark />
      <div className="min-w-0 flex-1 pt-1">{m.pending ? <Thinking /> : <Blocks blocks={m.blocks ?? []} ask={ask} />}</div>
    </div>
  )
}

function AssistantView() {
  const { chats, activeId, setActive, newChat, addMessage, resolve, ensureChat, drafts, setDraft } = useAssistant()
  const navigate = useNavigate()
  const { openNewVisit, openClient } = useOverlays()
  const [params, setParams] = useSearchParams()
  const text = drafts[activeId ?? 'new'] ?? ''
  const setText = (value: string) => setDraft(activeId, value)
  const [historyOpen, setHistoryOpen] = useState(false)
  const [historyQuery, setHistoryQuery] = useState('')
  const [moreSuggestions, setMoreSuggestions] = useState(false)
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
        resolve(chatId, pendingId, answer(q, { entries, clients, navigate, openNewVisit, openClient, ask: (x) => askRef.current(translate(x)) }))
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
    if (q && el.scrollHeight > el.clientHeight) el.scrollTo({ top: el.scrollTop + q.getBoundingClientRect().top - el.getBoundingClientRect().top - 24 })
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
    requestAnimationFrame(() => area.current?.focus())
  }

  function onKey(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault()
      submit()
    }
  }

  const groups = (['Today', 'This week'] as const).map((g) => ({ g, items: chats.filter((c) => c.group === g && `${c.title} ${translate(c.title)}`.toLowerCase().includes(historyQuery.toLowerCase())) })).filter((x) => x.items.length)

  const hasMessages = !!chat?.messages.length
  const chatTitle = chat ? (chat.titleIsUserText ? chat.title : translate(chat.title)) : translate('Assistant')
  const composer = (
    <div className="w-full rounded-2xl bg-surface p-3 shadow-xs ring-1 ring-border focus-within:ring-border-strong">
      <textarea ref={area} rows={2} value={text} onChange={(e) => setText(e.target.value)} onKeyDown={onKey}
        placeholder={hasMessages ? 'Ask a follow-up question' : 'What would you like to know?'} aria-label="Question"
        className="block max-h-40 min-h-16 w-full resize-none bg-transparent px-1 py-2 text-md leading-6 text-fg outline-none placeholder:text-faint" />
      <div className="mt-2 flex items-center justify-between gap-3">
        <Popover className="w-72 p-4" trigger={<button type="button" className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs text-muted hover:bg-fill"><Icon icon={I.lock} size={13} />Business data<Icon icon={I.chevronDown} size={12} /></button>}>
          <p className="text-sm text-fg">Answers come from your data, within your permissions</p>
          <p className="mt-2 text-xs text-muted">Uses the register and calendar, updated within a minute. Check important numbers in Reports.</p>
        </Popover>
        <IconButton icon={I.send} label="Ask (Enter)" variant="primary" size="sm" disabled={!text.trim() || busy} onClick={submit} />
      </div>
    </div>
  )

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex min-h-14 shrink-0 items-center justify-between gap-3 px-4 sm:px-8">
        <h1 translate="no" className="min-w-0 truncate text-base font-medium text-fg" title={chatTitle}>{chatTitle}</h1>
        <div className="flex shrink-0 items-center gap-1">
          <Button size="sm" variant="ghost" icon={I.history} onClick={() => setHistoryOpen(true)}>History</Button>
          <IconButton icon={I.add} label="New chat" size="sm" onClick={() => { newChat(); requestAnimationFrame(() => area.current?.focus()) }} />
        </div>
      </div>

      <div ref={scroller} className="relative min-h-0 flex-1 overflow-y-auto">
        {hasMessages ? <div role="log" aria-label="Conversation" aria-live="polite" aria-busy={busy} className="mx-auto flex max-w-[800px] flex-col gap-8 px-4 pt-8 pb-10 sm:px-8">
          {chat!.messages.map((m) => <Message key={m.id} m={m} ask={ask} />)}
        </div> : <div className="mx-auto flex min-h-full max-w-[720px] flex-col justify-center px-5 pt-10 pb-20 sm:px-8">
          <div className="mb-7">
            <AssistantMark />
            <h2 className="mt-5 text-3xl font-normal tracking-tight text-fg">A little clarity for your day</h2>
            <p className="mt-2 text-base text-muted">Ask a question. Find the numbers. Decide what comes next.</p>
          </div>
          {composer}
          <div className="mt-5 grid gap-2 sm:grid-cols-3">
            {[
              { title: 'Understand revenue', description: 'See what changed today', icon: I.chart, question: SUGGESTIONS[0] },
              { title: 'Plan the day', description: 'Find time in the schedule', icon: I.calendar, question: 'Who has free time today?' },
              { title: 'Bring clients back', description: 'Find who needs a follow-up', icon: I.clients, question: 'Who hasn’t visited in 60 days?' },
            ].map((s) => <button key={s.title} type="button" onClick={() => ask(translate(s.question))} className="press rounded-xl border border-border p-4 text-left hover:bg-surface">
              <Icon icon={s.icon} size={18} className="mb-4 text-muted" />
              <span className="block text-sm font-medium text-fg">{s.title}</span>
              <span className="mt-1 block text-xs leading-5 text-muted">{s.description}</span>
            </button>)}
          </div>
          <div className="mt-3">
            <Button variant="ghost" size="sm" onClick={() => setMoreSuggestions(!moreSuggestions)} aria-expanded={moreSuggestions}>{moreSuggestions ? 'Fewer ideas' : 'More ideas'}</Button>
            {moreSuggestions && <div className="mt-2 flex flex-wrap gap-2">{SUGGESTIONS.slice(1).map((q) => <Button key={q} variant="outline" size="sm" onClick={() => ask(translate(q))} className="h-auto min-h-8 whitespace-normal py-2 text-left">{q}</Button>)}</div>}
          </div>
        </div>}
      </div>
      {hasMessages && <div className="shrink-0 px-4 pt-2 pb-4 sm:px-8"><div className="mx-auto max-w-[736px]">{composer}<p className="mt-2 text-center text-xs text-faint">Check important numbers in Reports.</p></div></div>}

      <Sheet open={historyOpen} onOpenChange={setHistoryOpen} title="Chat history" width="md">
        <div className="p-4">
          <div className="mb-4 flex gap-2"><SearchInput value={historyQuery} onChange={setHistoryQuery} placeholder="Search conversations" /><IconButton icon={I.add} label="New chat" onClick={() => { newChat(); setHistoryOpen(false) }} /></div>
          {groups.map(({ g, items }) => <div key={g} className="mb-5">
            <h2 className="px-3 py-2 text-xs font-medium text-muted">{g}</h2>
            {items.map((c) => <button key={c.id} type="button" aria-current={c.id === activeId ? 'true' : undefined} onClick={() => { setActive(c.id); if (!c.messages.length) ask(translate(c.title)); setHistoryOpen(false) }}
              className={cn('flex w-full items-start gap-3 rounded-xl px-3 py-3 text-left text-sm', c.id === activeId ? 'bg-fill text-fg' : 'text-muted hover:bg-fill hover:text-fg')}>
              <Icon icon={I.assistant} size={16} className="mt-0.5 shrink-0" /><span translate="no" className="line-clamp-2 min-w-0 [overflow-wrap:anywhere]">{c.titleIsUserText ? c.title : translate(c.title)}</span>
            </button>)}
          </div>)}
          {!groups.length && <p className="px-3 py-6 text-sm text-muted">No conversations found</p>}
        </div>
      </Sheet>
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
