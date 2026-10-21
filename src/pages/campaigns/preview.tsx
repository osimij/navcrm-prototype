import type { ReactNode } from 'react'
import { I, Icon } from '@/components/icons'
import { business } from '@/data/business'
import { cn } from '@/lib/cn'

/** Highlights the booking link and promo code the way Telegram would render them. */
function richText(text: string, code?: string) {
  const parts: ReactNode[] = []
  const tokens = [business.bookingLink, ...(code ? [code] : [])]
  const re = new RegExp(`(${tokens.map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})`, 'g')
  text.split(re).forEach((p, i) => {
    if (p === business.bookingLink) parts.push(<span key={i} className="text-accent-fg underline decoration-accent-fg/40 underline-offset-2">{p}</span>)
    else if (code && p === code) parts.push(<span key={i} className="rounded bg-fill px-1 font-mono text-[12px] font-medium">{p}</span>)
    else parts.push(p)
  })
  return parts
}

/** A Telegram bot message, as the client will see it. */
export function MessageBubble({
  text,
  image,
  code,
  compact,
}: {
  text: string
  image?: boolean
  code?: string
  compact?: boolean
}) {
  return (
    <div className={cn('flex flex-col gap-1', compact ? 'max-w-full' : 'max-w-[88%]')}>
      <div className="overflow-hidden rounded-2xl rounded-bl-md bg-surface shadow-xs ring-1 ring-border">
        {image && (
          <div
            className="flex h-32 items-end p-2.5"
            style={{
              background:
                'linear-gradient(135deg, color-mix(in oklab, var(--c-amber) 55%, var(--surface)), color-mix(in oklab, var(--c-rose) 45%, var(--surface)))',
            }}
          >
            <span className="rounded-md bg-black/35 px-1.5 py-0.5 text-[11px] text-white">autumn-offer.jpg</span>
          </div>
        )}
        <div className="px-3 pt-2 pb-1.5 text-[13px] leading-[19px] whitespace-pre-wrap text-fg">
          {richText(text, code)}
          <span className="float-right mt-1.5 ml-3 text-[11px] text-faint tabular">14:20</span>
        </div>
      </div>
      <div className="grid h-8 place-items-center rounded-xl bg-surface/80 text-[13px] font-medium text-accent-fg ring-1 ring-border">Book a visit</div>
    </div>
  )
}

export function PhonePreview({ children, caption }: { children: ReactNode; caption?: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-3">
      <div className="w-[292px] rounded-[42px] bg-black p-2.5 shadow-modal ring-1 ring-border-strong">
        <div className="flex h-[560px] flex-col overflow-hidden rounded-[34px] bg-bg">
          <div className="flex h-8 shrink-0 items-center justify-between px-6 pt-1 text-[11px] font-semibold text-fg tabular">
            <span>14:20</span>
            <span className="h-4 w-20 rounded-full bg-black" />
            <span className="flex items-center gap-1">
              <span className="h-2 w-3.5 rounded-sm bg-fg/80" />
            </span>
          </div>
          <div className="flex shrink-0 items-center gap-2.5 border-b border-border px-3 py-2">
            <Icon icon={I.chevronLeft} size={18} className="text-accent-fg" />
            <span className="grid size-8 place-items-center rounded-full bg-fg text-xs font-semibold text-bg">S</span>
            <span className="min-w-0 leading-tight">
              <span className="block truncate text-[13px] font-medium text-fg">{business.name}</span>
              <span className="block text-[11px] text-faint">bot</span>
            </span>
          </div>
          <div className="flex min-h-0 flex-1 flex-col justify-end gap-2 overflow-y-auto bg-fill px-3 py-3">
            <div className="mx-auto mb-1 rounded-full bg-surface/70 px-2 py-0.5 text-[11px] text-faint">Today</div>
            {children}
          </div>
          <div className="flex h-11 shrink-0 items-center gap-2 border-t border-border px-3">
            <span className="h-7 flex-1 rounded-full bg-fill px-3 text-[12px] leading-7 text-faint">Message</span>
          </div>
        </div>
      </div>
      {caption && <div className="text-center text-sm text-muted">{caption}</div>}
    </div>
  )
}
