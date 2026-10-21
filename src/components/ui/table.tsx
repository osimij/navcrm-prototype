import type { ComponentProps, ReactNode } from 'react'
import { cn } from '@/lib/cn'
import { I, Icon } from '../icons'

/**
 * Mercury-style table: hairline rows, quiet header, whole row clickable.
 * Use <Table> inside a Card or directly on the page.
 */
export function Table({ className, ...props }: ComponentProps<'table'>) {
  return (
    <div className="w-full overflow-x-auto">
      <table className={cn('w-full border-separate border-spacing-0 text-base', className)} {...props} />
    </div>
  )
}

export function THead({ children }: { children: ReactNode }) {
  return (
    <thead>
      <tr>{children}</tr>
    </thead>
  )
}

export function TH({
  children,
  align = 'left',
  className,
  sort,
  onSort,
}: {
  children?: ReactNode
  align?: 'left' | 'right' | 'center'
  className?: string
  sort?: 'asc' | 'desc' | null
  onSort?: () => void
}) {
  const content = (
    <span className={cn('inline-flex items-center gap-1', align === 'right' && 'flex-row-reverse')}>
      {children}
      {sort && <Icon icon={I.chevronDown} size={12} className={cn('text-faint', sort === 'asc' && 'rotate-180')} />}
    </span>
  )
  return (
    <th
      className={cn(
        'h-9 border-b border-border px-3 text-left text-xs font-medium whitespace-nowrap text-faint first:pl-5 last:pr-5',
        align === 'right' && 'text-right',
        align === 'center' && 'text-center',
        className,
      )}
    >
      {onSort ? (
        <button type="button" onClick={onSort} className="hover:text-fg">
          {content}
        </button>
      ) : (
        content
      )}
    </th>
  )
}

export function TR({
  children,
  onClick,
  selected,
  className,
}: {
  children: ReactNode
  onClick?: () => void
  selected?: boolean
  className?: string
}) {
  return (
    <tr
      onClick={onClick}
      data-selected={selected || undefined}
      className={cn(
        'group/row transition-colors duration-100',
        onClick && 'cursor-pointer hover:bg-fill/60 data-[selected]:bg-fill',
        className,
      )}
    >
      {children}
    </tr>
  )
}

export function TD({
  children,
  align = 'left',
  className,
  muted,
}: {
  children?: ReactNode
  align?: 'left' | 'right' | 'center'
  className?: string
  muted?: boolean
}) {
  return (
    <td
      className={cn(
        'h-[52px] border-b border-border px-3 align-middle first:pl-5 last:pr-5 group-last/row:border-b-0',
        align === 'right' && 'text-right tabular',
        align === 'center' && 'text-center',
        muted ? 'text-muted' : 'text-fg',
        className,
      )}
    >
      {children}
    </td>
  )
}

/** Footer line under a table: count + pagination. */
export function TableFooter({ children }: { children: ReactNode }) {
  return <div className="flex items-center justify-between px-5 py-3 text-sm text-muted">{children}</div>
}
