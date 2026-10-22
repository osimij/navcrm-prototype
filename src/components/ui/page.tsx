import type { ReactNode } from 'react'
import { Link } from 'react-router'
import { cn } from '@/lib/cn'
import { labelForRoute } from '@/shell/nav'
import { I, Icon } from '../icons'

const widths = {
  default: 'max-w-[1160px]',
  wide: 'max-w-[1440px]',
  narrow: 'max-w-[760px]',
  full: 'max-w-none',
}

/** Page content container. Every routed page starts with this. */
export function Page({
  children,
  width = 'default',
  className,
}: {
  children: ReactNode
  width?: keyof typeof widths
  className?: string
}) {
  return <div className={cn('mx-auto w-full px-5 pt-6 pb-24 sm:px-8 lg:px-10 lg:pt-8', widths[width], className)}>{children}</div>
}

/**
 * Title row: a compact semibold title (Sweatpals), quiet subtitle, actions on the right.
 * Nested pages name their parent above the title so you always know where you are.
 * Tabs go in `tabs` so they sit flush under the header.
 */
export function PageHeader({
  title,
  subtitle,
  actions,
  tabs,
  back,
  className,
  meta,
}: {
  title: ReactNode
  subtitle?: ReactNode
  actions?: ReactNode
  tabs?: ReactNode
  /** Route to go back to (full-page forms). */
  back?: string
  className?: string
  /** Inline element right after the title, e.g. a status pill. */
  meta?: ReactNode
}) {
  return (
    <header className={cn('mb-6', tabs && 'mb-5', className)}>
      {back && (
        <Link to={back} className="-ml-1 mb-2 inline-flex items-center gap-1 rounded-full py-0.5 pr-2 pl-1 text-sm text-muted hover:text-fg">
          <Icon icon={I.chevronLeft} size={15} />
          {labelForRoute(back)}
        </Link>
      )}
      <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-3 sm:flex-nowrap">
        <div className="min-w-0 flex-[1_1_16rem]">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-semibold tracking-[-0.02em] text-fg">{title}</h1>
            {meta}
          </div>
          {subtitle && <p className="mt-1 text-sm text-muted">{subtitle}</p>}
        </div>
        {actions && <div className="flex min-w-0 max-w-full shrink-0 flex-wrap items-center gap-2">{actions}</div>}
      </div>
      {tabs && <div className="mt-5">{tabs}</div>}
    </header>
  )
}

/** Horizontal row of filters above a list. */
export function Toolbar({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('mb-4 flex flex-wrap items-center gap-2', className)}>{children}</div>
}
