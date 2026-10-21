import type { ComponentProps, ReactNode } from 'react'
import { cn } from '@/lib/cn'

export function Card({ className, ...props }: ComponentProps<'div'>) {
  return <div className={cn('min-w-0 rounded-2xl bg-surface ring-1 ring-border', className)} {...props} />
}

export function CardHeader({
  title,
  description,
  descriptionInline = false,
  action,
  className,
}: {
  title: ReactNode
  description?: ReactNode
  descriptionInline?: boolean
  action?: ReactNode
  className?: string
}) {
  return (
    <div className={cn('flex min-h-14 items-center justify-between gap-3 px-5 pt-4 pb-2', className)}>
      <div className={cn('min-w-0', descriptionInline && 'flex flex-wrap items-baseline gap-x-2 gap-y-0.5')}>
        <h3 className="text-base font-medium text-fg">{title}</h3>
        {description && <p className={cn('text-sm text-muted', !descriptionInline && 'mt-0.5')}>{description}</p>}
      </div>
      {action && <div className="flex shrink-0 items-center gap-1">{action}</div>}
    </div>
  )
}

/** A gray, borderless tile (the "Send / Deposit / Swap" tiles from the reference). */
export function Tile({ className, ...props }: ComponentProps<'div'>) {
  return <div className={cn('rounded-xl bg-fill', className)} {...props} />
}

/** Section heading on a page, outside cards. */
export function SectionTitle({ children, action, className }: { children: ReactNode; action?: ReactNode; className?: string }) {
  return (
    <div className={cn('mb-3 flex items-center justify-between gap-3', className)}>
      <h2 className="text-lg font-medium text-fg">{children}</h2>
      {action}
    </div>
  )
}
