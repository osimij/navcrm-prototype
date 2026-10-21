import type { ReactNode } from 'react'
import { useNavigate } from 'react-router'
import { cn } from '@/lib/cn'
import { I } from '../icons'
import { IconButton } from './button'

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
  return <div className={cn('mx-auto w-full px-5 pt-6 pb-16 sm:px-8 lg:px-10', widths[width], className)}>{children}</div>
}

/**
 * Title row: regular-weight title like Mercury, quiet subtitle, actions on the right.
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
  const navigate = useNavigate()
  return (
    <header className={cn('mb-6', tabs && 'mb-5', className)}>
      <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-3 sm:flex-nowrap">
        <div className="flex min-w-0 flex-[1_1_16rem] items-start gap-2">
          {back && <IconButton icon={I.chevronLeft} label="Back" onClick={() => navigate(back)} className="-ml-2" />}
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-3xl font-normal text-fg">{title}</h1>
              {meta}
            </div>
            {subtitle && <p className="mt-1 text-base text-muted">{subtitle}</p>}
          </div>
        </div>
        {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
      </div>
      {tabs && <div className="mt-5">{tabs}</div>}
    </header>
  )
}

/** Horizontal row of filters above a list. */
export function Toolbar({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('mb-4 flex flex-wrap items-center gap-2', className)}>{children}</div>
}
