import { Collapsible } from '@base-ui/react/collapsible'
import type { ReactNode } from 'react'
import { I, Icon } from '@/components/icons'
import { cn } from '@/lib/cn'
import { useWorkspace } from '@/lib/workspace'

const caret = (open: boolean) =>
  cn('shrink-0 text-faint transition-transform duration-150 ease-[var(--ease-out)] motion-reduce:transition-none', !open && '-rotate-90')

/** Supporting detail stays available without competing with the primary task. */
export function Disclosure({ id, title, description, children, defaultOpen = false, className }: {
  id: string
  title: ReactNode
  description?: ReactNode
  children: ReactNode
  defaultOpen?: boolean
  className?: string
}) {
  const open = useWorkspace((s) => s.sections[id] ?? defaultOpen)
  const setSection = useWorkspace((s) => s.setSection)
  return (
    <Collapsible.Root open={open} onOpenChange={(value) => setSection(id, value)} className={cn('min-w-0', className)}>
      <h2>
        <Collapsible.Trigger className="group flex w-full items-center gap-3 rounded-xl py-3 text-left">
          <span className="min-w-0 flex-1">
            <span className="flex items-center gap-1.5 text-base font-semibold text-fg">
              {title}
              <Icon icon={I.chevronDown} size={14} className={caret(open)} />
            </span>
            {description && <span className="mt-0.5 block text-sm font-normal text-muted">{description}</span>}
          </span>
          <span className="text-xs font-normal text-muted group-hover:text-fg">{open ? 'Hide' : 'Show'}</span>
        </Collapsible.Trigger>
      </h2>
      <Collapsible.Panel keepMounted className="disclosure-panel">
        <div className="pt-2 pb-3">{children}</div>
      </Collapsible.Panel>
    </Collapsible.Root>
  )
}

/**
 * A card you can fold to its title, like Linear's grouped lists: the header
 * stays as a one-line summary (with a count) and the choice is remembered.
 */
export function SectionCard({
  id,
  title,
  count,
  action,
  defaultOpen = true,
  fill = false,
  children,
  className,
}: {
  id: string
  title: ReactNode
  count?: ReactNode
  action?: ReactNode
  defaultOpen?: boolean
  /** Stretch the body to the card's height (cards side by side in a row). */
  fill?: boolean
  children: ReactNode
  className?: string
}) {
  const open = useWorkspace((s) => s.sections[id] ?? defaultOpen)
  const setSection = useWorkspace((s) => s.setSection)
  return (
    <Collapsible.Root
      open={open}
      onOpenChange={(value) => setSection(id, value)}
      // A folded card keeps its own height instead of stretching to its row.
      className={cn('flex min-w-0 flex-col rounded-2xl bg-surface', fill && open && 'h-full', !open && 'self-start', className)}
    >
      <div className="flex min-h-14 shrink-0 items-center gap-2 pr-3 pl-5">
        <h2 className="min-w-0 flex-1">
          <Collapsible.Trigger className="group flex max-w-full items-center gap-2 py-3 text-left">
            <span className="truncate text-base font-semibold text-fg">{title}</span>
            {count != null && <span className="text-sm text-muted tabular">{count}</span>}
            <Icon icon={I.chevronDown} size={14} className={caret(open)} />
          </Collapsible.Trigger>
        </h2>
        {open && action}
      </div>
      <Collapsible.Panel className={cn('collapse-panel', fill && 'flex-1')}>
        <div className={cn('min-w-0', fill && 'flex h-full flex-col')}>{children}</div>
      </Collapsible.Panel>
    </Collapsible.Root>
  )
}
