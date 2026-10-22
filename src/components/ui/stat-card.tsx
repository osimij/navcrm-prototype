import type { ReactNode } from 'react'
import { Link } from 'react-router'
import { cn } from '@/lib/cn'
import { I, Icon } from '../icons'

/** Compact stats: label above, value and supporting text together at the bottom. */
export function StatCard({
  label,
  value,
  suffix,
  sub,
  to,
  onClick,
  active,
  size = 'md',
  aside,
  footer,
  className,
  valueClassName,
}: {
  label: ReactNode
  value: ReactNode
  suffix?: ReactNode
  sub?: ReactNode
  to?: string
  onClick?: () => void
  active?: boolean
  size?: 'sm' | 'md'
  aside?: ReactNode
  footer?: ReactNode
  className?: string
  valueClassName?: string
}) {
  const clickable = !!to || !!onClick
  const classes = cn(
    'flex min-w-0 flex-col justify-between rounded-2xl bg-surface text-left',
    size === 'sm' ? 'gap-2 px-4 py-3' : 'min-h-[104px] gap-4 p-5',
    clickable && 'press group hover:bg-[color-mix(in_oklab,var(--fg)_3%,var(--surface))]',
    // Selected filter card, as in Sweatpals' member counts: tinted, with an accent edge.
    active && 'bg-accent-soft ring-1 ring-[color-mix(in_oklab,var(--accent)_60%,transparent)] hover:bg-accent-soft',
    className,
  )
  const content = (
    <>
      <div className="flex items-start justify-between gap-2">
        <div className={cn('min-w-0 text-muted', size === 'sm' ? 'text-sm' : 'text-base')}>{label}</div>
        {/* The arrow means "opens a page"; filter cards change the list in place and carry none. */}
        {to && <Icon icon={I.arrowUpRight} size={16} className="mt-0.5 shrink-0 text-faint transition-colors group-hover:text-fg" />}
      </div>
      <div className="flex min-w-0 flex-col gap-0.5">
        <div className="flex min-w-0 items-end justify-between gap-3">
          <div className="flex min-w-0 flex-1 flex-col gap-0.5">
            <div className="flex min-w-0 flex-wrap items-baseline gap-x-1.5">
              <div className={cn('min-w-0 font-medium text-fg tabular', size === 'sm' ? 'text-xl' : 'text-2xl', valueClassName)}>{value}</div>
              {suffix && <span className="text-sm text-faint">{suffix}</span>}
            </div>
            {sub != null && <div className={cn('text-muted', size === 'sm' ? 'text-xs' : 'text-sm')}>{sub}</div>}
          </div>
          {aside}
        </div>
        {footer && <div className="mt-3">{footer}</div>}
      </div>
    </>
  )
  if (to) return <Link to={to} data-slot="stat-card" className={classes}>{content}</Link>
  if (onClick) return <button type="button" onClick={onClick} aria-pressed={active} data-slot="stat-card" className={classes}>{content}</button>
  return <div data-slot="stat-card" className={classes}>{content}</div>
}

/**
 * Figures side by side, split by hairlines and without boxes, as on Sweatpals'
 * overview and member profile. Lighter than a row of cards for supporting numbers.
 */
export function StatStrip({
  items,
  className,
}: {
  items: { label: ReactNode; value: ReactNode; sub?: ReactNode; to?: string }[]
  className?: string
}) {
  return (
    <dl className={cn('grid min-w-0 grid-cols-2 gap-y-5 sm:flex sm:flex-wrap', className)}>
      {items.map((it, i) => {
        const body = (
          <>
            <dt className="flex items-center gap-1 text-sm text-muted">
              {it.label}
              {it.to && <Icon icon={I.arrowUpRight} size={13} className="text-faint transition-colors group-hover:text-fg" />}
            </dt>
            <dd className="mt-1 text-xl font-medium text-fg tabular">{it.value}</dd>
            {it.sub != null && <dd className="mt-0.5 text-xs text-muted">{it.sub}</dd>}
          </>
        )
        return (
          <div
            key={i}
            className={cn(
              'min-w-0 px-5 sm:flex-1 sm:border-l sm:border-border sm:first:border-l-0 sm:first:pl-0',
              i % 2 === 0 ? 'max-sm:pl-0' : 'max-sm:border-l max-sm:border-border',
            )}
          >
            {it.to ? <Link to={it.to} className="group block">{body}</Link> : body}
          </div>
        )
      })}
    </dl>
  )
}
