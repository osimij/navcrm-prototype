import { useMemo, useState } from 'react'
import { Link } from 'react-router'
import { I, Icon } from '@/components/icons'
import { Avatar } from '@/components/ui/avatar'
import { IconButton } from '@/components/ui/button'
import { SearchInput } from '@/components/ui/input'
import { currentUser } from '@/data/business'
import { staffById } from '@/data/staff'
import { cn } from '@/lib/cn'
import { formatListTime } from '@/lib/format'
import { useData } from '@/lib/store'
import type { Conversation, Message } from './data'
import { ChannelAvatar, ComposeModal, FilterTabs, PaneHeader } from './parts'
import { lastMessage, useInbox } from './store'

type Filter = 'open' | 'mine' | 'unassigned' | 'closed'

const matches: Record<Filter, (c: Conversation) => boolean> = {
  open: (c) => c.status === 'open',
  mine: (c) => c.status === 'open' && c.assigneeId === currentUser.id,
  unassigned: (c) => c.status === 'open' && !c.assigneeId,
  closed: (c) => c.status === 'closed',
}

export function preview(m: Message) {
  const body = m.kind === 'voice' ? `Voice message ${m.duration}` : m.kind === 'photo' ? 'Photo' : m.kind === 'file' ? m.file?.name : m.text
  if (m.from === 'staff') return `${m.staffId === currentUser.id ? 'You' : staffById[m.staffId ?? '']?.name.split(' ')[0]}: ${body}`
  if (m.from === 'assistant') return `Assistant: ${body}`
  return body
}

export function ConversationList({ activeId, className }: { activeId?: string; className?: string }) {
  const conversations = useInbox((s) => s.conversations)
  const clients = useData((s) => s.clients)
  const [filter, setFilter] = useState<Filter>('open')
  const [query, setQuery] = useState('')
  const [compose, setCompose] = useState(false)

  const byId = useMemo(() => Object.fromEntries(clients.map((c) => [c.id, c])), [clients])
  const q = query.trim().toLowerCase()
  const digits = q.replace(/\D/g, '')

  const list = conversations
    .filter(matches[filter])
    .filter((c) => {
      if (!q) return true
      const client = byId[c.clientId]
      if (!client) return false
      if (digits.length >= 2 && client.phone.replace(/\D/g, '').includes(digits)) return true
      return client.name.toLowerCase().includes(q) || (c.handle?.toLowerCase().includes(q.replace(/^@/, '')) ?? false)
    })
    .sort((a, b) => +lastMessage(b).at - +lastMessage(a).at)

  const counts = {
    open: conversations.filter(matches.open).length,
    mine: conversations.filter(matches.mine).length,
    unassigned: conversations.filter(matches.unassigned).length,
  }

  return (
    <div className={cn('flex min-h-0 flex-col', className)}>
      <PaneHeader className="justify-between">
        <h1 className="text-xl font-normal text-fg">Inbox</h1>
        <IconButton icon={I.edit} label="Message a client" onClick={() => setCompose(true)} />
      </PaneHeader>
      <div className="px-4 pt-3 pb-2">
        <SearchInput value={query} onChange={setQuery} placeholder="Name, phone or @nickname" />
      </div>
      <FilterTabs
        value={filter}
        onChange={setFilter}
        items={[
          { value: 'open', label: 'Open', count: counts.open },
          { value: 'mine', label: 'Mine', count: counts.mine },
          { value: 'unassigned', label: 'Unassigned', count: counts.unassigned },
          { value: 'closed', label: 'Closed' },
        ]}
      />
      <ul className="min-h-0 flex-1 overflow-y-auto p-2">
        {list.map((c) => {
          const client = byId[c.clientId]
          if (!client) return null
          const last = lastMessage(c)
          const assignee = c.assigneeId ? staffById[c.assigneeId] : null
          const active = c.id === activeId
          return (
            <li key={c.id}>
              <Link
                to={`/inbox/${c.id}`}
                className={cn('flex gap-3 rounded-xl px-3 py-2.5', active ? 'bg-fill-active' : 'hover:bg-fill')}
              >
                <ChannelAvatar name={client.name} channel={c.channel} />
                <span className="min-w-0 flex-1">
                  <span className="flex items-baseline gap-2">
                    <span className={cn('min-w-0 flex-1 truncate text-base text-fg', c.unread > 0 && 'font-medium')}>{client.name}</span>
                    <span className={cn('shrink-0 text-xs tabular', c.unread ? 'text-accent-fg' : 'text-faint')}>{formatListTime(last.at)}</span>
                  </span>
                  <span className="mt-0.5 flex items-center gap-2">
                    <span className={cn('min-w-0 flex-1 truncate text-sm', c.unread ? 'text-fg' : 'text-muted')}>{preview(last)}</span>
                    {c.unread > 0 ? (
                      <span className="grid h-[18px] min-w-[18px] place-items-center rounded-full bg-accent px-1 text-[11px] font-medium text-on-accent tabular">
                        {c.unread}
                      </span>
                    ) : c.ai ? (
                      <span className="flex items-center gap-1 text-xs font-medium text-accent-fg" title="The assistant is answering">
                        <Icon icon={I.assistant} size={13} />
                        AI
                      </span>
                    ) : assignee ? (
                      <Avatar name={assignee.name} color={assignee.color} size="xs" />
                    ) : null}
                  </span>
                </span>
              </Link>
            </li>
          )
        })}
        {!list.length && (
          <li className="px-4 py-10 text-center text-base text-muted">
            {q ? `No conversations match “${query}”.` : filter === 'mine' ? 'Nothing assigned to you.' : filter === 'unassigned' ? 'Every conversation has an owner.' : 'No conversations here.'}
          </li>
        )}
      </ul>
      <ComposeModal open={compose} onOpenChange={setCompose} />
    </div>
  )
}
