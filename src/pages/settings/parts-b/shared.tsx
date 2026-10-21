import { StatCard } from '@/components/ui/stat-card'
import type { IconSvgElement } from '@hugeicons/react'
import { useState, type ReactNode } from 'react'
import { toast } from 'sonner'
import { I, Icon } from '@/components/icons'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/cn'
import { seeded } from '@/lib/random'

/** Form state for a settings page: edits stay local until Save, the SaveBar shows only when dirty. */
export function useSettingsForm<T extends Record<string, unknown>>(initial: T, message = 'Changes saved') {
  const [saved, setSaved] = useState(initial)
  const [value, setValue] = useState(initial)
  const dirty = JSON.stringify(saved) !== JSON.stringify(value)
  const set = <K extends keyof T>(key: K, v: T[K]) => setValue((s) => ({ ...s, [key]: v }))
  return {
    value,
    set,
    dirty,
    save: () => {
      setSaved(value)
      toast.success(message)
    },
    discard: () => setValue(saved),
  }
}

export async function copyText(text: string, label = 'Copied') {
  try {
    await navigator.clipboard.writeText(text)
  } catch {
    /* clipboard may be blocked; the toast still confirms intent */
  }
  toast.success(label)
}

/** Read-only value with a copy button: links, keys, card data. */
export function CopyField({ value, display, className }: { value: string; display?: ReactNode; className?: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <div className={cn('flex h-9 min-w-0 items-center gap-2 rounded-[10px] bg-fill pr-1 pl-3', className)}>
      <span className="min-w-0 flex-1 truncate text-base text-fg tabular">{display ?? value}</span>
      <Button
        size="sm"
        variant="ghost"
        icon={copied ? I.check : I.copy}
        className="h-7"
        onClick={() => {
          copyText(value)
          setCopied(true)
          setTimeout(() => setCopied(false), 1600)
        }}
      >
        {copied ? 'Copied' : 'Copy'}
      </Button>
    </div>
  )
}

export type ChannelId = 'telegram' | 'push' | 'sms' | 'whatsapp'

export const CHANNELS: { id: ChannelId; label: string; icon: IconSvgElement; cost: number }[] = [
  { id: 'telegram', label: 'Telegram', icon: I.telegram, cost: 0 },
  { id: 'push', label: 'Push', icon: I.bell, cost: 0 },
  { id: 'sms', label: 'SMS', icon: I.message, cost: 0.15 },
  { id: 'whatsapp', label: 'WhatsApp', icon: I.whatsapp, cost: 0.4 },
]

/** Free channels first: the first channel the client can receive wins. */
export function ChannelChain({ enabled, className }: { enabled: ChannelId[]; className?: string }) {
  return (
    <span className={cn('inline-flex flex-wrap items-center gap-1', className)}>
      {CHANNELS.map((c, i) => {
        const on = enabled.includes(c.id)
        return (
          <span key={c.id} className="inline-flex shrink-0 items-center gap-1">
            {i > 0 && <span className={cn('text-xs', on ? 'text-faint' : 'text-disabled')}>→</span>}
            <Badge className={cn('gap-1 px-1.5', on ? 'text-fg' : 'text-disabled')}>
              <Icon icon={c.icon} size={12} />
              {c.label}
            </Badge>
          </span>
        )
      })}
    </span>
  )
}

/** Square monogram used for providers and banks that we don't ship logos for. */
export function ProviderMark({ name, tone = 'neutral', className }: { name: string; tone?: 'neutral' | 'accent'; className?: string }) {
  return (
    <span
      className={cn(
        'grid size-10 shrink-0 place-items-center rounded-xl text-sm font-semibold',
        tone === 'accent' ? 'bg-accent-soft text-accent-fg' : 'bg-fill text-fg',
        className,
      )}
      aria-hidden
    >
      {name
        .replace(/[^A-Za-z0-9 ]/g, '')
        .split(' ')
        .map((w) => w[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()}
    </span>
  )
}

/** Deterministic QR-looking code. It's a picture for the prototype, not a scannable code. */
export function QrPreview({ seed = 7, size = 132, className }: { seed?: number; size?: number; className?: string }) {
  const n = 25
  const r = seeded(seed)
  const cells: [number, number][] = []
  const finder = (x: number, y: number) => (x < 8 && y < 8) || (x > n - 9 && y < 8) || (x < 8 && y > n - 9)
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) if (!finder(x, y) && r.chance(0.48)) cells.push([x, y])
  const eye = (x: number, y: number) => (
    <g key={`${x}-${y}`}>
      <rect x={x} y={y} width={7} height={7} fill="currentColor" />
      <rect x={x + 1} y={y + 1} width={5} height={5} fill="#ffffff" />
      <rect x={x + 2} y={y + 2} width={3} height={3} fill="currentColor" />
    </g>
  )
  return (
    <div className={cn('inline-grid place-items-center rounded-2xl bg-white p-3 text-[#0b0b10] ring-1 ring-border', className)}>
      <svg width={size} height={size} viewBox={`0 0 ${n} ${n}`} shapeRendering="crispEdges" aria-label="QR code">
        {cells.map(([x, y]) => (
          <rect key={`${x}.${y}`} x={x} y={y} width={1} height={1} fill="currentColor" />
        ))}
        {eye(0, 0)}
        {eye(n - 8, 0)}
        {eye(0, n - 8)}
      </svg>
    </div>
  )
}

/** Small stat used across settings summaries. */
export function MiniStat({ label, value, hint }: { label: ReactNode; value: ReactNode; hint?: ReactNode }) {
  return (
    <StatCard label={label} value={value} sub={hint} size="sm" className="rounded-xl bg-fill ring-0" />
  )
}

/** Numbered how-to steps. */
export function Steps({ items }: { items: ReactNode[] }) {
  return (
    <ol className="flex flex-col gap-3">
      {items.map((it, i) => (
        <li key={i} className="flex gap-3 text-base text-fg">
          <span className="grid size-6 shrink-0 place-items-center rounded-full bg-fill text-xs font-medium text-muted tabular">{i + 1}</span>
          <span className="pt-0.5">{it}</span>
        </li>
      ))}
    </ol>
  )
}
