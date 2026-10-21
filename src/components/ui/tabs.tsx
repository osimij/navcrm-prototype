import { Tabs as T } from '@base-ui/react/tabs'
import type { ReactNode } from 'react'
import { NavLink, useLocation } from 'react-router'
import { cn } from '@/lib/cn'

type TabItem<V extends string> = { value: V; label: ReactNode; count?: number }

const tabClass =
  'relative flex h-10 items-center gap-1.5 px-0.5 text-base whitespace-nowrap text-muted outline-none select-none transition-colors duration-150 hover:text-fg data-[active]:text-fg focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-accent'

function Count({ n }: { n: number }) {
  return <span className="rounded-full bg-fill px-1.5 text-xs leading-[18px] text-muted tabular">{n}</span>
}

const indicator =
  'absolute bottom-[-1px] left-0 h-0.5 w-(--active-tab-width) translate-x-(--active-tab-left) rounded-full bg-fg transition-[translate,width] duration-200 ease-[var(--ease-out)]'

/** Underlined tabs for switching views within a page. */
export function Tabs<V extends string>({
  value,
  onChange,
  items,
  className,
}: {
  value: V
  onChange: (v: V) => void
  items: TabItem<V>[]
  className?: string
}) {
  return (
    <T.Root value={value} onValueChange={(v) => onChange(v as V)}>
      <T.List className={cn('relative flex gap-6 border-b border-border', className)}>
        {items.map((it) => (
          <T.Tab key={it.value} value={it.value} className={tabClass}>
            {it.label}
            {it.count != null && <Count n={it.count} />}
          </T.Tab>
        ))}
        <T.Indicator className={indicator} />
      </T.List>
    </T.Root>
  )
}

/** Same tabs, but each tab is its own URL (sections like Register or Inventory). */
export function LinkTabs({ items, className }: { items: { to: string; label: ReactNode; count?: number; end?: boolean }[]; className?: string }) {
  const { pathname } = useLocation()
  // The most specific matching tab wins, so "/pos" doesn't stay active on "/pos/receipts".
  const active =
    [...items]
      .sort((a, b) => b.to.length - a.to.length)
      .find((it) => pathname === it.to || (!it.end && pathname.startsWith(it.to + '/')))?.to ?? items[0]?.to
  return (
    <T.Root value={active}>
      <T.List className={cn('relative flex gap-6 overflow-x-auto border-b border-border [scrollbar-width:none]', className)}>
        {items.map((it) => (
          <T.Tab key={it.to} value={it.to} nativeButton={false} render={<NavLink to={it.to} end={it.end} />} className={tabClass}>
            {it.label}
            {it.count != null && <Count n={it.count} />}
          </T.Tab>
        ))}
        <T.Indicator className={indicator} />
      </T.List>
    </T.Root>
  )
}

/** Pill segmented control: period switches, view modes. */
export function Segmented<V extends string>({
  value,
  onChange,
  items,
  size = 'md',
  fill,
  className,
}: {
  value: V
  onChange: (v: V) => void
  items: { value: V; label: ReactNode }[]
  size?: 'sm' | 'md'
  /** Stretch to the container width with equal segments. */
  fill?: boolean
  className?: string
}) {
  return (
    <T.Root value={value} onValueChange={(v) => onChange(v as V)}>
      <T.List className={cn('relative rounded-full bg-fill p-0.5', fill ? 'flex w-full' : 'inline-flex', className)}>
        {items.map((it) => (
          <T.Tab
            key={it.value}
            value={it.value}
            className={cn(
              'relative z-[1] flex items-center justify-center gap-1.5 rounded-full font-medium whitespace-nowrap text-muted outline-none select-none transition-colors duration-150 hover:text-fg data-[active]:text-fg focus-visible:outline-2 focus-visible:outline-accent',
              size === 'sm' ? 'h-7 px-3 text-sm' : 'h-8 px-3.5 text-sm',
              fill && 'flex-1',
            )}
          >
            {it.label}
          </T.Tab>
        ))}
        <T.Indicator className="absolute top-0.5 left-0 h-[calc(100%-4px)] w-(--active-tab-width) translate-x-(--active-tab-left) rounded-full bg-surface shadow-sm ring-1 ring-border transition-[translate,width] duration-200 ease-[var(--ease-out)] dark:bg-fill-active dark:ring-0" />
      </T.List>
    </T.Root>
  )
}
