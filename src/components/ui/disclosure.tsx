import { Collapsible } from '@base-ui/react/collapsible'
import type { ReactNode } from 'react'
import { I, Icon } from '@/components/icons'
import { cn } from '@/lib/cn'
import { useWorkspace } from '@/lib/workspace'

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
      <Collapsible.Trigger className="group flex w-full items-center gap-3 rounded-xl py-3 text-left hover:text-fg">
        <Icon icon={I.chevronRight} size={16} className={cn('shrink-0 text-faint', open && 'rotate-90')} />
        <span className="min-w-0 flex-1">
          <span className="block text-lg font-medium text-fg">{title}</span>
          {description && <span className="mt-0.5 block text-sm text-muted">{description}</span>}
        </span>
        <span className="text-xs text-muted">{open ? 'Hide' : 'Show'}</span>
      </Collapsible.Trigger>
      <Collapsible.Panel keepMounted className="disclosure-panel">
        <div className="pt-2 pb-3">{children}</div>
      </Collapsible.Panel>
    </Collapsible.Root>
  )
}
