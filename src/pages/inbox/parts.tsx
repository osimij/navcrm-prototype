import { Tabs as T } from '@base-ui/react/tabs'
import { useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router'
import { ClientPicker } from '@/components/client-picker'
import { I, Icon } from '@/components/icons'
import { Avatar } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Modal } from '@/components/ui/dialog'
import { Field } from '@/components/ui/input'
import { cn } from '@/lib/cn'
import type { Channel } from './data'
import { useInbox } from './store'

const CHANNEL_STYLE: Record<Channel, { bg: string; icon: typeof I.telegram }> = {
  telegram: { bg: 'bg-[#2AABEE]', icon: I.telegram },
  whatsapp: { bg: 'bg-[#25D366]', icon: I.whatsapp },
  instagram: { bg: 'bg-[#E1306C]', icon: I.instagram },
  web: { bg: 'bg-accent', icon: I.web },
}

export function ChannelIcon({ channel, size = 14, className }: { channel: Channel; size?: number; className?: string }) {
  return <Icon icon={CHANNEL_STYLE[channel].icon} size={size} className={className} />
}

/** Avatar with the messenger it came from in the corner. */
export function ChannelAvatar({ name, channel, size = 'lg' }: { name: string; channel: Channel; size?: 'md' | 'lg' }) {
  const s = CHANNEL_STYLE[channel]
  return (
    <Avatar name={name} size={size}>
      <span
        className={cn(
          'absolute -right-0.5 -bottom-0.5 grid size-[18px] place-items-center rounded-full text-white ring-2 ring-[var(--bg)]',
          s.bg,
        )}
      >
        <Icon icon={s.icon} size={11} strokeWidth={2} />
      </span>
    </Avatar>
  )
}

/** Compact underline tabs with counts; the shared Tabs are too roomy for a 340px pane. */
export function FilterTabs<V extends string>({
  value,
  onChange,
  items,
}: {
  value: V
  onChange: (v: V) => void
  items: { value: V; label: string; count?: number }[]
}) {
  return (
    <T.Root value={value} onValueChange={(v) => onChange(v as V)}>
      <T.List className="relative flex gap-4 border-b border-border px-4">
        {items.map((it) => (
          <T.Tab
            key={it.value}
            value={it.value}
            className="flex h-10 items-center gap-1.5 text-sm whitespace-nowrap text-muted outline-none select-none transition-colors duration-150 hover:text-fg data-[active]:font-medium data-[active]:text-fg focus-visible:outline-2 focus-visible:outline-accent"
          >
            {it.label}
            {it.count ? <span className="text-xs text-faint tabular">{it.count}</span> : null}
          </T.Tab>
        ))}
        <T.Indicator className="absolute bottom-[-1px] left-0 h-0.5 w-(--active-tab-width) translate-x-(--active-tab-left) rounded-full bg-fg transition-[translate,width] duration-200 ease-[var(--ease-out)]" />
      </T.List>
    </T.Root>
  )
}

export function ComposeModal({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const [clientId, setClientId] = useState<string | null>(null)
  const start = useInbox((s) => s.start)
  const navigate = useNavigate()
  return (
    <Modal
      open={open}
      onOpenChange={(o) => {
        onOpenChange(o)
        if (!o) setClientId(null)
      }}
      title="Message a client"
      description="Opens their existing chat, or starts one through the Telegram bot."
      size="sm"
      footer={
        <>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            variant="primary"
            disabled={!clientId}
            onClick={() => {
              if (!clientId) return
              const id = start(clientId)
              onOpenChange(false)
              setClientId(null)
              navigate(`/inbox/${id}`)
            }}
          >
            Open chat
          </Button>
        </>
      }
    >
      <Field label="Client" hint="Clients without Telegram get an SMS with a link to the chat.">
        <ClientPicker value={clientId} onChange={setClientId} />
      </Field>
    </Modal>
  )
}

export function PaneHeader({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('flex h-14 shrink-0 items-center gap-2 border-b border-border px-4', className)}>{children}</div>
}
