import { Command } from 'cmdk'
import { useMemo, useState } from 'react'
import { CATEGORY_LABEL, type Client } from '@/data/clients'
import { cn } from '@/lib/cn'
import { formatPhone } from '@/lib/format'
import { useOverlays } from '@/lib/overlays'
import { searchClients } from '@/lib/search'
import { useData } from '@/lib/store'
import { I, Icon } from './icons'
import { Avatar } from './ui/avatar'
import { Badge } from './ui/badge'
import { fieldBase } from './ui/input'
import { Popover } from './ui/popover'

export function ClientRow({ client, compact }: { client: Client; compact?: boolean }) {
  return (
    <span className="flex min-w-0 items-center gap-2.5">
      <Avatar name={client.name} size={compact ? 'sm' : 'md'} />
      <span className="min-w-0">
        <span className="block truncate text-base text-fg">{client.name}</span>
        {!compact && <span className="block truncate text-sm text-muted tabular">{formatPhone(client.phone)}</span>}
      </span>
    </span>
  )
}

/** Search clients by name or the last 4 digits of their phone; create one inline. */
export function ClientPicker({
  value,
  onChange,
  placeholder = 'Name or last 4 digits of phone',
}: {
  value: string | null
  onChange: (id: string | null) => void
  placeholder?: string
}) {
  const clients = useData((s) => s.clients)
  const openNewClient = useOverlays((s) => s.openNewClient)
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const results = useMemo(() => searchClients(clients, query, 7), [clients, query])
  const selected = value ? clients.find((c) => c.id === value) : null

  function create() {
    setOpen(false)
    const digits = query.replace(/\D/g, '')
    openNewClient({
      name: digits ? undefined : query,
      phone: digits.length >= 7 ? digits : undefined,
      onCreated: (id) => onChange(id),
    })
  }

  return (
    <Popover
      open={open}
      onOpenChange={(o) => {
        setOpen(o)
        if (!o) setQuery('')
      }}
      className="w-[var(--anchor-width)] min-w-80 overflow-hidden p-0"
      trigger={
        <button
          type="button"
          className={cn(
            fieldBase,
            'flex items-center gap-2 px-3 text-left data-[popup-open]:bg-surface data-[popup-open]:ring-accent',
            selected ? 'h-12' : 'h-9',
          )}
        >
          {selected ? (
            <>
              <span className="min-w-0 flex-1">
                <ClientRow client={selected} />
              </span>
              {selected.debt > 0 && <Badge tone="negative">Debt</Badge>}
              {selected.category === 'vip' && <Badge tone="accent">VIP</Badge>}
            </>
          ) : (
            <>
              <Icon icon={I.search} size={16} className="text-faint" />
              <span className="flex-1 text-faint">{placeholder}</span>
            </>
          )}
        </button>
      }
    >
      <Command shouldFilter={false} loop className="flex flex-col">
        <div className="flex items-center gap-2 border-b border-border px-3">
          <Icon icon={I.search} size={16} className="text-faint" />
          <Command.Input
            autoFocus
            value={query}
            onValueChange={setQuery}
            placeholder={placeholder}
            className="h-11 flex-1 bg-transparent text-base text-fg outline-none placeholder:text-faint"
          />
        </div>
        <Command.List className="max-h-80 overflow-y-auto p-1">
          {!query && <div className="px-2.5 pt-2 pb-1 text-xs font-medium text-faint">Recent clients</div>}
          {results.map((c) => (
            <Command.Item
              key={c.id}
              value={c.id}
              onSelect={() => {
                onChange(c.id)
                setOpen(false)
              }}
              className="flex cursor-default items-center gap-3 rounded-lg px-2.5 py-2 outline-none data-[selected=true]:bg-fill"
            >
              <span className="min-w-0 flex-1">
                <ClientRow client={c} />
              </span>
              <span className="text-xs text-faint">{CATEGORY_LABEL[c.category]}</span>
            </Command.Item>
          ))}
          {query && !results.length && <div className="px-3 py-3 text-base text-muted">No clients match “{query}”.</div>}
          <Command.Item
            value="__create"
            onSelect={create}
            className="mt-1 flex cursor-default items-center gap-2.5 rounded-lg px-2.5 py-2.5 text-base text-accent-fg outline-none data-[selected=true]:bg-fill"
          >
            <span className="grid size-8 place-items-center rounded-full bg-accent-soft">
              <Icon icon={I.userAdd} size={16} />
            </span>
            {query ? `New client “${query}”` : 'New client'}
          </Command.Item>
        </Command.List>
      </Command>
    </Popover>
  )
}
