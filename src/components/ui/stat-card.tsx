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
    'flex min-w-0 flex-col justify-between rounded-2xl bg-surface text-left ring-1 ring-border',
    size === 'sm' ? 'gap-2 px-4 py-3' : 'min-h-36 gap-3 p-4',
    clickable && 'press group hover:bg-fill/50',
    active && 'ring-fg',
    className,
  )
  const content = (
    <>
      <div className="flex items-start justify-between gap-2">
        <div className={cn('min-w-0 text-muted', size === 'sm' ? 'text-sm' : 'text-base')}>{label}</div>
        {clickable && <Icon icon={I.arrowUpRight} size={16} className="mt-0.5 shrink-0 text-faint transition-colors group-hover:text-fg" />}
      </div>
      <div className="flex min-w-0 flex-col gap-0.5">
        <div className="flex min-w-0 items-end justify-between gap-3">
          <div className="flex min-w-0 flex-1 flex-col gap-0.5">
            <div className="flex min-w-0 flex-wrap items-baseline gap-x-1.5">
              <div className={cn('min-w-0 font-normal text-fg tabular', size === 'sm' ? 'text-xl' : 'text-3xl', valueClassName)}>{value}</div>
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
