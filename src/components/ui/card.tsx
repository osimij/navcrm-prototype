import type { ComponentProps, ReactNode } from 'react'
import { cn } from '@/lib/cn'

export function Card({ className, ...props }: ComponentProps<'div'>) {
  return <div className={cn('rounded-2xl bg-surface ring-1 ring-border', className)} {...props} />
}

export function CardHeader({
  title,
  description,
  action,
  className,
}: {
  title: ReactNode
  description?: ReactNode
  action?: ReactNode
  className?: string
}) {
  return (
    <div className={cn('flex min-h-14 items-center justify-between gap-3 px-5 pt-4 pb-2', className)}>
      <div className="min-w-0">
        <h3 className="text-base font-medium text-fg">{title}</h3>
        {description && <p className="mt-0.5 text-sm text-muted">{description}</p>}
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
