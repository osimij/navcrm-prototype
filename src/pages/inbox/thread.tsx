import { useEffect, useLayoutEffect, useRef, useState, type KeyboardEvent } from 'react'
import { useNavigate } from 'react-router'
import { PauseIcon, PlayIcon } from '@hugeicons/core-free-icons'
import { toast } from 'sonner'
import { I, Icon } from '@/components/icons'
import { Avatar } from '@/components/ui/avatar'
import { Button, IconButton } from '@/components/ui/button'
import { Menu, MenuItem, MenuLabel, MenuSeparator } from '@/components/ui/menu'
import { Select } from '@/components/ui/select'
import { currentUser } from '@/data/business'
import { staffById } from '@/data/staff'
import { cn } from '@/lib/cn'
import { formatDay, formatPhone, formatTime } from '@/lib/format'
import { useOverlays } from '@/lib/overlays'
import { useClient } from '@/lib/store'
import { isSameDay } from '@/lib/time'
import { CHANNEL_LABEL, QUICK_REPLIES, type Conversation, type Message } from './data'
import { ChannelAvatar, ChannelIcon, PaneHeader } from './parts'
import { useInbox } from './store'

const ASSIGNABLE = ['s0', 's7', 's1', 's2', 's3', 's4', 's5'].map((id) => staffById[id])

/** One-time entrance for a message sent in this session (WAAPI, transform + opacity only). */
function enter(el: HTMLElement | null) {
  if (!el || el.dataset.entered) return
  el.dataset.entered = '1'
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return
  el.animate(
    [
      { opacity: 0, transform: 'translateY(4px)' },
      { opacity: 1, transform: 'none' },
    ],
    { duration: 180, easing: 'cubic-bezier(0.23, 1, 0.32, 1)' },
  )
}

const BARS = [6, 10, 14, 9, 16, 12, 18, 11, 7, 13, 17, 10, 6, 12, 15, 9, 13, 8, 5, 10, 14, 7]

function VoiceNote({ duration, mine }: { duration: string; mine: boolean }) {
  const [playing, setPlaying] = useState(false)
  const [sec] = duration.split(':').slice(1).map(Number)
  const bars = (
    <span className="flex h-5 items-center gap-[2px]">
      {BARS.map((h, i) => (
        <span key={i} className="w-[3px] rounded-full bg-current" style={{ height: h }} />
      ))}
    </span>
  )
  return (
    <span className="flex items-center gap-3">
      <button
        type="button"
        aria-label={playing ? 'Pause' : 'Play voice message'}
        onClick={() => setPlaying(!playing)}
        className={cn('press grid size-8 shrink-0 place-items-center rounded-full', mine ? 'bg-white/20' : 'bg-surface text-fg shadow-xs')}
      >
        <Icon icon={playing ? PauseIcon : PlayIcon} size={15} />
      </button>
      <span className="relative text-faint">
        {bars}
        {/* Played portion is the same bars in full color, revealed with clip-path (linear: it's progress). */}
        <span
          aria-hidden
          onTransitionEnd={() => setPlaying(false)}
          className="absolute inset-0 text-fg"
          style={{
            clipPath: playing ? 'inset(0 0 0 0)' : 'inset(0 100% 0 0)',
            transition: playing ? `clip-path ${sec || 14}s linear` : 'clip-path 200ms var(--ease-out)',
          }}
        >
          {bars}
        </span>
      </span>
      <span className="text-sm tabular text-muted">{duration}</span>
    </span>
  )
}

function Bubble({ m, last, channelLabel }: { m: Message; last: boolean; channelLabel: string }) {
  if (m.from === 'system') {
    return (
      <div ref={m.fresh ? enter : undefined} className="my-2 flex justify-center">
        <span className="inline-flex max-w-[80%] items-center gap-1.5 rounded-full bg-fill px-3 py-1 text-center text-xs text-muted">
          {m.text?.startsWith('Assistant') && <Icon icon={I.assistant} size={12} className="text-accent-fg" />}
          {m.text}
        </span>
      </div>
    )
  }
  const mine = m.from !== 'client'
  const ai = m.from === 'assistant'
  const author = ai ? 'Assistant' : m.from === 'staff' ? (m.staffId === currentUser.id ? 'You' : staffById[m.staffId ?? '']?.name.split(' ')[0]) : null

  let body: React.ReactNode = m.text
  if (m.kind === 'voice') body = <VoiceNote duration={m.duration ?? '0:10'} mine={mine && !ai} />
  if (m.kind === 'photo')
    body = (
      <span
        className="block h-40 w-56 rounded-xl bg-[linear-gradient(135deg,color-mix(in_oklab,var(--c-rose)_45%,var(--surface)),color-mix(in_oklab,var(--c-violet)_35%,var(--surface)))]"
        role="img"
        aria-label="Photo from client"
      >
        <span className="flex h-full items-end p-2.5">
          <span className="inline-flex items-center gap-1 rounded-full bg-black/35 px-2 py-0.5 text-xs text-white">
            <Icon icon={I.image} size={12} /> Photo
          </span>
        </span>
      </span>
    )
  if (m.kind === 'file')
    body = (
      <span className="flex items-center gap-3">
        <span className={cn('grid size-9 place-items-center rounded-lg', mine && !ai ? 'bg-white/20' : 'bg-surface text-muted')}>
          <Icon icon={I.invoice} size={18} />
        </span>
        <span className="min-w-0">
          <span className="block truncate font-medium">{m.file?.name}</span>
          <span className={cn('block text-xs', mine && !ai ? 'text-white/70' : 'text-muted')}>{m.file?.size}</span>
        </span>
      </span>
    )

  const media = m.kind === 'photo'
  return (
    <div ref={m.fresh ? enter : undefined} className={cn('flex flex-col', mine ? 'items-end' : 'items-start', last ? 'mb-3' : 'mb-1')}>
      <div
        className={cn(
          'max-w-[min(72%,520px)] text-base leading-[21px] break-words whitespace-pre-wrap',
          media ? 'p-1' : 'px-3.5 py-2',
          'rounded-[18px]',
          mine ? (last ? 'rounded-br-md' : '') : last ? 'rounded-bl-md' : '',
          !mine && 'bg-fill text-fg',
          mine && !ai && 'bg-accent text-on-accent',
          ai && 'bg-accent-soft text-fg',
        )}
      >
        {body}
      </div>
      {last && (
        <span className="mt-1 flex items-center gap-1 px-1 text-[11px] text-faint">
          {ai && <Icon icon={I.assistant} size={11} className="text-accent-fg" />}
          {author && <span>{author} ·</span>}
          {formatTime(m.at)}
          {!mine && <span>· {channelLabel}</span>}
        </span>
      )}
    </div>
  )
}

function Composer({ conv }: { conv: Conversation }) {
  const send = useInbox((s) => s.send)
  const setStatus = useInbox((s) => s.setStatus)
  const [text, setText] = useState('')
  const area = useRef<HTMLTextAreaElement>(null)
  const file = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setText('')
    area.current?.focus()
  }, [conv.id])

  useLayoutEffect(() => {
    const el = area.current
    if (!el) return
    el.style.height = '0px'
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`
  }, [text])

  function submit() {
    const t = text.trim()
    if (!t) return
    send(conv.id, t)
    setText('')
  }

  function onKey(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault()
      submit()
    }
  }

  if (conv.status === 'closed') {
    return (
      <div className="flex items-center justify-center gap-3 border-t border-border px-4 py-4 text-sm text-muted">
        This conversation is closed. A new message from the client reopens it.
        <Button size="sm" onClick={() => setStatus(conv.id, 'open')}>
          Reopen
        </Button>
      </div>
    )
  }

  return (
    <div className="shrink-0 px-4 pb-4">
      {conv.ai && (
        <div className="mb-2 flex items-center gap-2 rounded-xl bg-accent-soft px-3 py-2 text-sm text-fg">
          <Icon icon={I.assistant} size={15} className="text-accent-fg" />
          The assistant is answering this chat. Send a message to take over.
        </div>
      )}
      <div className="rounded-2xl bg-surface ring-1 ring-border transition-[box-shadow] duration-150 focus-within:ring-accent focus-within:shadow-[0_0_0_4px_color-mix(in_oklab,var(--accent)_12%,transparent)]">
        <textarea
          ref={area}
          rows={1}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={onKey}
          placeholder="Write a reply"
          aria-label="Reply"
          className="block max-h-40 w-full resize-none bg-transparent px-4 pt-3 pb-1 text-base leading-[21px] text-fg outline-none placeholder:text-faint"
        />
        <div className="flex items-center gap-1 px-2 pb-2">
          <IconButton icon={I.attach} label="Attach photo or file" size="sm" onClick={() => file.current?.click()} />
          <input
            ref={file}
            type="file"
            hidden
            onChange={(e) => {
              const f = e.target.files?.[0]
              if (f) send(conv.id, '', { kind: f.type.startsWith('image/') ? 'photo' : 'file', file: { name: f.name, size: `${Math.max(1, Math.round(f.size / 1024))} KB` } })
              e.target.value = ''
            }}
          />
          <Menu
            align="start"
            side="top"
            trigger={
              <button type="button" className="press flex h-8 items-center gap-1.5 rounded-full px-2.5 text-sm text-muted hover:bg-fill hover:text-fg data-[popup-open]:bg-fill">
                <Icon icon={I.note} size={16} />
                Quick replies
              </button>
            }
          >
            <MenuLabel>Insert</MenuLabel>
            {QUICK_REPLIES.map((q) => (
              <MenuItem
                key={q.label}
                onClick={() => {
                  setText((t) => (t ? `${t} ${q.text}` : q.text))
                  requestAnimationFrame(() => area.current?.focus())
                }}
              >
                {q.label}
              </MenuItem>
            ))}
          </Menu>
          <span className="ml-auto hidden items-center gap-1.5 pr-2 text-xs text-faint sm:flex">
            <ChannelIcon channel={conv.channel} size={13} />
            Replying in {CHANNEL_LABEL[conv.channel]}
          </span>
          <IconButton icon={I.send} label="Send (Enter)" variant="primary" size="sm" disabled={!text.trim()} onClick={submit} className="disabled:opacity-40" />
        </div>
      </div>
    </div>
  )
}

export function Thread({ conv }: { conv: Conversation }) {
  const client = useClient(conv.clientId)
  const assign = useInbox((s) => s.assign)
  const setStatus = useInbox((s) => s.setStatus)
  const markRead = useInbox((s) => s.markRead)
  const { openClient, openNewTask, openNewVisit } = useOverlays()
  const scroller = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()

  useEffect(() => {
    markRead(conv.id)
  }, [conv.id, conv.unread, markRead])

  // Jump to the latest message: instantly, since switching threads happens all day.
  useLayoutEffect(() => {
    const el = scroller.current
    if (el) el.scrollTop = el.scrollHeight
  }, [conv.id, conv.messages.length])

  if (!client) return null
  const lastClientText = [...conv.messages].reverse().find((m) => m.from === 'client' && m.text)?.text

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col">
      <PaneHeader className="gap-3 px-5">
        <IconButton icon={I.chevronLeft} label="Back to conversations" tooltip={false} onClick={() => navigate('/inbox')} className="-ml-2 md:hidden" />
        <ChannelAvatar name={client.name} channel={conv.channel} size="md" />
        <button type="button" onClick={() => openClient(client.id)} className="min-w-0 text-left">
          <span className="block truncate text-base font-medium text-fg hover:underline underline-offset-4">{client.name}</span>
          <span className="block truncate text-xs text-muted">
            {CHANNEL_LABEL[conv.channel]} · {conv.handle ?? formatPhone(client.phone)}
          </span>
        </button>
        <div className="ml-auto flex items-center gap-2">
          <Select
            look="pill"
            align="end"
            value={conv.assigneeId ?? 'none'}
            onChange={(v) => assign(conv.id, v === 'none' ? null : v, staffById[v]?.name.split(' ')[0])}
            options={[
              { value: 'none', label: 'Unassigned' },
              ...ASSIGNABLE.map((s) => ({
                value: s.id,
                label: s.id === currentUser.id ? `${s.name} (you)` : s.name,
                icon: <Avatar name={s.name} color={s.color} size="xs" />,
              })),
            ]}
            className="hidden max-w-48 lg:flex"
          />
          <Button size="sm" variant="secondary" icon={conv.status === 'open' ? I.check : I.refresh} onClick={() => setStatus(conv.id, conv.status === 'open' ? 'closed' : 'open')}>
            {conv.status === 'open' ? 'Close' : 'Reopen'}
          </Button>
          <Menu align="end" trigger={<IconButton icon={I.more} label="More" size="sm" tooltip={false} />}>
            <MenuItem icon={I.calendarAdd} onClick={() => openNewVisit({ clientId: client.id })}>
              Book a visit
            </MenuItem>
            <MenuItem icon={I.tasks} onClick={() => openNewTask({ clientId: client.id, title: lastClientText ? `Reply: “${lastClientText.slice(0, 48)}${lastClientText.length > 48 ? '…' : ''}”` : `Follow up with ${client.firstName}` })}>
              Create task
            </MenuItem>
            <MenuSeparator />
            <MenuItem icon={I.user} onClick={() => openClient(client.id)}>
              Open profile
            </MenuItem>
            <MenuItem
              icon={I.copy}
              onClick={() => {
                navigator.clipboard?.writeText(client.phone).catch(() => {})
                toast.success('Phone number copied')
              }}
            >
              Copy phone number
            </MenuItem>
          </Menu>
        </div>
      </PaneHeader>

      <div ref={scroller} className="min-h-0 flex-1 overflow-y-auto px-5 pt-4 pb-2 sm:px-8">
        {conv.messages.map((m, i) => {
          const prev = conv.messages[i - 1]
          const next = conv.messages[i + 1]
          const newDay = !prev || !isSameDay(prev.at, m.at)
          const sameGroup = (a?: Message, b?: Message) =>
            !!a && !!b && a.from === b.from && a.staffId === b.staffId && a.from !== 'system' && Math.abs(+b.at - +a.at) < 5 * 60_000 && isSameDay(a.at, b.at)
          return (
            <div key={m.id}>
              {newDay && (
                <div className="my-4 flex items-center gap-3 text-xs text-faint">
                  <span className="h-px flex-1 bg-border" />
                  {formatDay(m.at)}
                  <span className="h-px flex-1 bg-border" />
                </div>
              )}
              <Bubble m={m} last={!sameGroup(m, next)} channelLabel={CHANNEL_LABEL[conv.channel]} />
            </div>
          )
        })}
      </div>

      <Composer conv={conv} />
    </div>
  )
}

