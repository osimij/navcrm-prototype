import { Collapsible } from '@base-ui/react/collapsible'
import { useEffect, useLayoutEffect, useRef, useState, type KeyboardEvent, type ReactNode, type RefObject } from 'react'
import { toast } from 'sonner'
import { BarChart } from '@/components/charts/bar-chart'
import { I, Icon } from '@/components/icons'
import { Button, IconButton } from '@/components/ui/button'
import { SearchInput } from '@/components/ui/input'
import { Popover } from '@/components/ui/popover'
import { Tooltip } from '@/components/ui/tooltip'
import { text as translate } from '@/i18n'
import { useLanguage } from '@/i18n/language'
import { cn } from '@/lib/cn'
import { plural } from '@/lib/format'
import { SUGGESTIONS, type Block } from './answers'
import { useAssistant, type Chat, type ChatMessage } from './store'

/* ───────────────────────── Time ───────────────────────── */

/** Linear's compact ages in history: "now", "5m", "3h", "2d". */
function Ago({ at }: { at: number }) {
  const ru = useLanguage() === 'ru'
  const min = Math.max(0, Math.round((Date.now() - at) / 60_000))
  const label =
    min < 1 ? (ru ? 'сейчас' : 'now') : min < 60 ? `${min}${ru ? ' мин' : 'm'}` : min < 1440 ? `${Math.round(min / 60)}${ru ? ' ч' : 'h'}` : `${Math.round(min / 1440)}${ru ? ' д' : 'd'}`
  return <span className="shrink-0 text-xs text-faint tabular">{label}</span>
}

function groupOf(at: number): 'Today' | 'Yesterday' | 'This week' | 'Earlier' {
  const start = new Date()
  start.setHours(0, 0, 0, 0)
  if (at >= +start) return 'Today'
  if (at >= +start - 86_400_000) return 'Yesterday'
  if (at >= +start - 6 * 86_400_000) return 'This week'
  return 'Earlier'
}

export const chatTitle = (chat: Chat | null) => (chat ? (chat.titleIsUserText ? chat.title : translate(chat.title)) : translate('New chat'))

/* ───────────────────────── History ───────────────────────── */

/** History lives in a popover next to the conversation, grouped by day (Linear). */
export function HistoryList({ onPick }: { onPick: () => void }) {
  const { chats, activeId, setActive, ask, deleteChat } = useAssistant()
  const [query, setQuery] = useState('')
  const q = query.trim().toLowerCase()
  const groups = (['Today', 'Yesterday', 'This week', 'Earlier'] as const)
    .map((g) => ({ g, items: chats.filter((c) => groupOf(c.at) === g && `${c.title} ${translate(c.title)}`.toLowerCase().includes(q)) }))
    .filter((x) => x.items.length)
  return (
    <div className="flex max-h-[min(70dvh,480px)] flex-col">
      <div className="p-2 pb-1">
        <SearchInput value={query} onChange={setQuery} placeholder="Search conversations" autoFocus />
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto px-1.5 pb-1.5">
        {groups.map(({ g, items }) => (
          <div key={g}>
            <h3 className="px-2.5 pt-3 pb-1 text-xs font-medium text-muted">{g}</h3>
            {items.map((c) => (
              <div key={c.id} className="group/row relative">
                <button
                  type="button"
                  aria-current={c.id === activeId ? 'true' : undefined}
                  onClick={() => {
                    setActive(c.id)
                    if (!c.messages.length) ask(translate(c.title))
                    onPick()
                  }}
                  className={cn(
                    'flex w-full items-start gap-3 rounded-lg py-2 pr-9 pl-2.5 text-left text-sm',
                    c.id === activeId ? 'bg-fill text-fg' : 'text-fg hover:bg-fill',
                  )}
                >
                  <span translate="no" className="line-clamp-2 min-w-0 flex-1 [overflow-wrap:anywhere]">
                    {c.titleIsUserText ? c.title : translate(c.title)}
                  </span>
                  <Ago at={c.at} />
                </button>
                <button
                  type="button"
                  aria-label="Delete conversation"
                  onClick={() => deleteChat(c.id)}
                  // Revealed on hover, but always reachable from the keyboard.
                  className="absolute top-1.5 right-1 grid size-7 place-items-center rounded-md text-faint opacity-0 group-hover/row:opacity-100 hover:bg-fill-hover hover:text-fg focus-visible:opacity-100"
                >
                  <Icon icon={I.close} size={14} />
                </button>
              </div>
            ))}
          </div>
        ))}
        {!groups.length && <p className="px-3 py-6 text-center text-sm text-muted">No conversations found</p>}
      </div>
    </div>
  )
}

export function HistoryButton() {
  const [open, setOpen] = useState(false)
  return (
    <Popover
      open={open}
      onOpenChange={setOpen}
      align="end"
      className="w-[340px] max-w-[calc(100vw-1.5rem)] p-0"
      trigger={
        <Button size="sm" variant="ghost" icon={I.history}>
          History
        </Button>
      }
    >
      <HistoryList onPick={() => setOpen(false)} />
    </Popover>
  )
}

/* ───────────────────────── Answers ───────────────────────── */

function Blocks({ blocks, ask, fresh }: { blocks: Block[]; ask: (q: string) => void; fresh: boolean }) {
  return (
    // A new answer arrives as a short cascade; reopening an old one shows it as it is.
    <div className={cn('flex min-w-0 flex-col gap-4', !fresh && 'answer-static')}>
      {blocks.map((b, i) => {
        const style = { animationDelay: `${Math.min(i, 4) * 50}ms` }
        switch (b.type) {
          case 'text':
            return (
              <p key={i} style={style} className="answer-in text-base leading-[22px] text-fg [overflow-wrap:anywhere]">
                {b.text}
              </p>
            )
          case 'table':
            return (
              <div key={i} style={style} className="answer-in overflow-x-auto rounded-xl ring-1 ring-border">
                <table className="w-full text-sm">
                  <thead>
                    <tr>
                      {b.columns.map((c, j) => (
                        <th key={j} className={cn('!h-9 px-3 text-xs font-medium whitespace-nowrap text-muted', c.align === 'right' ? 'text-right' : 'text-left')}>
                          {c.label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {b.rows.map((r, j) => (
                      <tr key={j} className="border-t border-border">
                        {r.map((cell, k) => (
                          // One line per row: a narrow panel scrolls the table sideways instead of wrapping names.
                          <td key={k} className={cn('h-10 px-3 whitespace-nowrap text-fg', b.columns[k]?.align === 'right' ? 'text-right tabular' : 'text-left')}>
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
              <div key={i} style={style} className="answer-in rounded-xl p-4 ring-1 ring-border">
                <div className="mb-3 text-sm text-muted">{b.caption}</div>
                <BarChart bars={b.bars} height={120} renderTooltip={b.format ? (bar) => b.format!(bar) : undefined} />
              </div>
            )
          case 'post':
            return (
              <div key={i} style={style} className="answer-in rounded-xl bg-fill px-4 py-3.5 text-base leading-6 whitespace-pre-wrap text-fg [overflow-wrap:anywhere]">
                {b.text}
              </div>
            )
          case 'actions':
            return (
              <div key={i} style={style} className="answer-in flex flex-wrap gap-2">
                {b.actions.map((a) => (
                  <Button key={a.label} size="sm" variant={a.primary ? 'soft' : 'secondary'} icon={a.icon} onClick={a.run}>
                    {a.label}
                  </Button>
                ))}
              </div>
            )
          case 'suggestions':
            return (
              <div key={i} style={style} className="answer-in flex flex-wrap gap-2">
                {SUGGESTIONS.slice(0, 4).map((s) => (
                  <Button key={s} size="sm" variant="secondary" onClick={() => ask(translate(s))} className="h-auto min-h-8 whitespace-normal py-1.5 text-left">
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

/** While working: a shimmering "Thinking…" and the step being done, as Linear shows it. */
function Working({ steps, startedAt }: { steps: string[]; startedAt?: number }) {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 150)
    return () => clearInterval(id)
  }, [])
  const step = Math.min(steps.length - 1, Math.floor((now - (startedAt ?? now)) / 450))
  return (
    <div aria-label="Thinking">
      <span className="shimmer-text text-sm font-medium">Thinking…</span>
      {steps[step] && <div className="mt-2 border-l-2 border-border pl-3 text-sm text-muted">{steps[step]}</div>}
    </div>
  )
}

function Trace({ steps, duration }: { steps: string[]; duration?: number }) {
  const [open, setOpen] = useState(false)
  const seconds = Math.max(1, Math.round((duration ?? 1000) / 1000))
  return (
    <Collapsible.Root open={open} onOpenChange={setOpen} className="mb-3">
      <Collapsible.Trigger className="flex items-center gap-1 rounded-md text-xs text-muted hover:text-fg">
        Worked for {plural(seconds, 'second')}
        <Icon icon={I.chevronRight} size={12} className={cn('transition-transform duration-150 ease-[var(--ease-out)] motion-reduce:transition-none', open && 'rotate-90')} />
      </Collapsible.Trigger>
      <Collapsible.Panel className="collapse-panel">
        <ul className="mt-2 flex flex-col gap-1 border-l-2 border-border pl-3 text-sm text-muted">
          {steps.map((s) => (
            <li key={s}>{s}</li>
          ))}
        </ul>
      </Collapsible.Panel>
    </Collapsible.Root>
  )
}

function AnswerActions({ chatId, m, target }: { chatId: string; m: ChatMessage; target: RefObject<HTMLDivElement | null> }) {
  const setFeedback = useAssistant((s) => s.setFeedback)
  const copy = () => {
    const value = target.current?.innerText ?? ''
    navigator.clipboard?.writeText(value).catch(() => {})
    toast.success('Answer copied')
  }
  const rate = (value: 'up' | 'down') => {
    const next = m.feedback === value ? undefined : value
    setFeedback(chatId, m.id, next)
    if (next) toast.success('Thanks for the feedback', { description: next === 'down' ? 'We’ll use it to make answers like this better.' : undefined })
  }
  const btn = 'press grid size-7 place-items-center rounded-md text-faint hover:bg-fill hover:text-fg aria-pressed:text-fg'
  return (
    <div className="answer-actions mt-3 flex items-center gap-0.5">
      <Tooltip content="Copy answer">
        <button type="button" aria-label="Copy answer" onClick={copy} className={btn}>
          <Icon icon={I.copy} size={15} />
        </button>
      </Tooltip>
      <Tooltip content="Helpful">
        <button type="button" aria-label="Helpful" aria-pressed={m.feedback === 'up'} onClick={() => rate('up')} className={btn}>
          <Icon icon={I.thumbsUp} size={15} />
        </button>
      </Tooltip>
      <Tooltip content="Not helpful">
        <button type="button" aria-label="Not helpful" aria-pressed={m.feedback === 'down'} onClick={() => rate('down')} className={btn}>
          <Icon icon={I.thumbsDown} size={15} />
        </button>
      </Tooltip>
    </div>
  )
}

function Message({ chatId, m, ask }: { chatId: string; m: ChatMessage; ask: (q: string) => void }) {
  const body = useRef<HTMLDivElement>(null)
  if (m.role === 'user')
    return (
      <div data-role="user" className="flex justify-end">
        <div
          translate="no"
          className="min-w-0 max-w-[88%] rounded-2xl rounded-br-md bg-fill px-3.5 py-2 text-base leading-[22px] whitespace-pre-wrap text-fg [overflow-wrap:anywhere]"
        >
          {m.text}
        </div>
      </div>
    )
  if (m.pending) return <Working steps={m.steps ?? []} startedAt={m.startedAt} />
  return (
    <div className="group/answer min-w-0">
      {m.steps && <Trace steps={m.steps} duration={m.duration} />}
      {m.stopped ? (
        <p className="text-sm text-muted">You stopped this answer.</p>
      ) : (
        <>
          <div ref={body}>
            <Blocks blocks={m.blocks ?? []} ask={ask} fresh={Date.now() - (m.resolvedAt ?? 0) < 1500} />
          </div>
          <AnswerActions chatId={chatId} m={m} target={body} />
        </>
      )}
    </div>
  )
}

/**
 * The conversation. A new question scrolls to the bottom; a finished answer
 * brings its question to the top so the answer reads from the start. When you
 * scroll back, a "Latest" pill brings you down again.
 */
export function Thread({ chat, compact = false, footer }: { chat: Chat; compact?: boolean; footer?: ReactNode }) {
  const ask = useAssistant((s) => s.ask)
  const scroller = useRef<HTMLDivElement>(null)
  const [away, setAway] = useState(false)
  const busy = chat.messages.some((m) => m.pending)
  const last = chat.messages[chat.messages.length - 1]

  useLayoutEffect(() => {
    const el = scroller.current
    if (!el || !last) return
    if (last.pending) {
      el.scrollTop = el.scrollHeight
      return
    }
    const users = el.querySelectorAll<HTMLElement>('[data-role="user"]')
    const q = users[users.length - 1]
    if (q && el.scrollHeight > el.clientHeight) el.scrollTo({ top: el.scrollTop + q.getBoundingClientRect().top - el.getBoundingClientRect().top - 20 })
  }, [last?.id, last?.pending, last])

  const onScroll = () => {
    const el = scroller.current
    if (el) setAway(el.scrollHeight - el.scrollTop - el.clientHeight > 160)
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="relative min-h-0 flex-1">
        <div ref={scroller} onScroll={onScroll} className="absolute inset-0 overflow-y-auto">
          <div
            role="log"
            aria-label="Conversation"
            aria-live="polite"
            aria-busy={busy}
            data-thread
            className={cn('mx-auto flex flex-col', compact ? 'gap-6 px-4 pt-5 pb-6' : 'max-w-[760px] gap-8 px-5 pt-8 pb-10 sm:px-8')}
          >
            {chat.messages.map((m) => (
              <Message key={m.id} chatId={chat.id} m={m} ask={ask} />
            ))}
          </div>
        </div>
        {away && (
          <button
            type="button"
            onClick={() => scroller.current?.scrollTo({ top: scroller.current.scrollHeight })}
            className="latest-pill press absolute bottom-3 left-1/2 flex h-8 -translate-x-1/2 items-center gap-1.5 rounded-full bg-raised px-3 text-sm font-medium text-fg shadow-popover"
          >
            <Icon icon={I.arrowDown} size={14} />
            Latest
          </button>
        )}
      </div>
      {footer}
    </div>
  )
}

/* ───────────────────────── Composer ───────────────────────── */

export function Composer({ chat, compact = false, autoFocus = false }: { chat: Chat | null; compact?: boolean; autoFocus?: boolean }) {
  const { drafts, setDraft, ask, stop, activeId } = useAssistant()
  const value = drafts[activeId ?? 'new'] ?? ''
  const area = useRef<HTMLTextAreaElement>(null)
  const busy = !!chat?.messages.some((m) => m.pending)
  const started = !!chat?.messages.length

  useLayoutEffect(() => {
    const el = area.current
    if (!el) return
    el.style.height = '0px'
    el.style.height = `${Math.min(el.scrollHeight, compact ? 120 : 180)}px`
  }, [value, compact])

  useEffect(() => {
    if (autoFocus) area.current?.focus()
  }, [autoFocus, activeId])

  function submit() {
    if (!value.trim() || busy) return
    ask(value)
    setDraft(activeId, '')
    // A new conversation gets its own id; clear the "new" draft too.
    setDraft(null, '')
    requestAnimationFrame(() => area.current?.focus())
  }

  function onKey(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault()
      submit()
    }
  }

  return (
    <div className="w-full rounded-2xl bg-surface p-2.5 shadow-[var(--shadow-xs)] ring-1 ring-border transition-shadow duration-150 ease-[ease] focus-within:ring-border-strong dark:bg-fill/60">
      <textarea
        ref={area}
        rows={1}
        value={value}
        onChange={(e) => setDraft(activeId, e.target.value)}
        onKeyDown={onKey}
        placeholder={started ? 'Reply…' : 'Ask anything about your business…'}
        aria-label="Question"
        className={cn('block w-full resize-none bg-transparent px-1.5 py-1.5 text-base leading-[22px] text-fg outline-none placeholder:text-faint', compact ? 'min-h-9' : 'min-h-12')}
      />
      <div className="mt-1.5 flex items-center justify-between gap-3">
        <Popover
          className="w-72 p-4"
          side="top"
          trigger={
            <button type="button" className="flex items-center gap-1.5 rounded-lg px-1.5 py-1 text-xs text-muted hover:bg-fill hover:text-fg data-[popup-open]:bg-fill">
              <Icon icon={I.lock} size={13} />
              Business data
              <Icon icon={I.chevronDown} size={12} />
            </button>
          }
        >
          <p className="text-sm text-fg">Answers come from your data, within your permissions</p>
          <p className="mt-2 text-xs text-muted">Uses the register and calendar, updated within a minute. Check important numbers in Reports.</p>
        </Popover>
        {busy && chat ? (
          <IconButton icon={I.stop} label="Stop answering" variant="secondary" size="sm" iconSize={14} onClick={() => stop(chat.id)} />
        ) : (
          <IconButton icon={I.arrowUp} label="Send (Enter)" variant="primary" size="sm" disabled={!value.trim()} onClick={submit} />
        )}
      </div>
    </div>
  )
}

/* ───────────────────────── Start ───────────────────────── */

export function SuggestionRows({ items }: { items: { question: string; icon: typeof I.chart }[] }) {
  const ask = useAssistant((s) => s.ask)
  return (
    <ul className="flex flex-col">
      {items.map((s, i) => (
        <li key={s.question} style={{ animationDelay: `${i * 40}ms` }} className="answer-in">
          <button type="button" onClick={() => ask(translate(s.question))} className="press flex w-full items-center gap-3 rounded-xl px-2.5 py-2 text-left text-sm text-fg hover:bg-fill">
            <span className="grid size-7 shrink-0 place-items-center rounded-full bg-accent-soft text-accent-fg">
              <Icon icon={s.icon} size={14} />
            </span>
            <span className="min-w-0 flex-1">{s.question}</span>
            <Icon icon={I.arrowUpRight} size={14} className="text-faint" />
          </button>
        </li>
      ))}
    </ul>
  )
}
