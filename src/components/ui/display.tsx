import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'
import { useWorkspace } from '@/lib/workspace'
import { I } from '../icons'
import { Button } from './button'
import { Popover } from './popover'

/**
 * Which columns a list shows, remembered per list. Lists start with the few
 * columns most people need; the rest are one toggle away (Linear's display
 * properties), so a dense table never has to show everything at once.
 */
export function useColumns<T extends string>(list: string, defaults: Record<T, boolean>) {
  const sections = useWorkspace((s) => s.sections)
  const setSection = useWorkspace((s) => s.setSection)
  const ids = Object.keys(defaults) as T[]
  const visible = (id: T) => sections[`${list}:col:${id}`] ?? defaults[id]
  return {
    visible,
    toggle: (id: T) => setSection(`${list}:col:${id}`, !visible(id)),
    hiddenCount: ids.filter((id) => !visible(id)).length,
    reset: () => ids.forEach((id) => setSection(`${list}:col:${id}`, defaults[id])),
  }
}

/** The "Display" button and its panel. Sections inside are stacked with hairlines. */
export function DisplayMenu({ children, badge }: { children: ReactNode; badge?: number }) {
  return (
    <Popover
      align="end"
      className="w-[320px] max-w-[calc(100vw-1.5rem)] p-0"
      trigger={
        <Button size="sm" variant="secondary" icon={I.sliders}>
          Display
          {!!badge && <span className="ml-0.5 text-xs text-muted tabular">{badge} hidden</span>}
        </Button>
      }
    >
      {children}
    </Popover>
  )
}

export function DisplaySection({ title, action, children }: { title: ReactNode; action?: ReactNode; children: ReactNode }) {
  return (
    <div className="border-t border-border px-4 py-3.5 first:border-t-0">
      <div className="mb-2.5 flex items-center justify-between gap-2">
        <span className="text-xs font-medium text-muted">{title}</span>
        {action}
      </div>
      {children}
    </div>
  )
}

/** Toggle chips for the properties a list shows. */
export function PropertyChips<T extends string>({ items, visible, toggle }: { items: { id: T; label: ReactNode }[]; visible: (id: T) => boolean; toggle: (id: T) => void }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map((it) => {
        const on = visible(it.id)
        return (
          <button
            key={it.id}
            type="button"
            aria-pressed={on}
            onClick={() => toggle(it.id)}
            className={cn(
              'press h-7 rounded-full px-2.5 text-xs font-medium ring-1 ring-inset',
              on ? 'bg-accent-soft text-accent-fg ring-[color-mix(in_oklab,var(--accent)_28%,transparent)]' : 'text-muted ring-border-strong hover:text-fg',
            )}
          >
            {it.label}
          </button>
        )
      })}
    </div>
  )
}
