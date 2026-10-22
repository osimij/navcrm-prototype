import type { ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { Page, PageHeader } from '@/components/ui/page'
import { cn } from '@/lib/cn'
import { I, Icon } from '@/components/icons'

/**
 * Settings follow Mercury: the main sidebar swaps to the settings list, and each
 * page is a narrow column of label/value rows with hairlines between them.
 */
export function SettingsPage({
  title,
  description,
  actions,
  children,
  wide,
}: {
  title: ReactNode
  description?: ReactNode
  actions?: ReactNode
  children: ReactNode
  /** Tables and matrices get more room. */
  wide?: boolean
}) {
  return (
    <Page width={wide ? 'default' : 'narrow'}>
      <PageHeader title={title} subtitle={description} actions={actions} />
      {children}
    </Page>
  )
}

/** A titled group of rows. */
export function SettingsSection({
  title,
  description,
  action,
  children,
  className,
}: {
  title?: ReactNode
  description?: ReactNode
  action?: ReactNode
  children: ReactNode
  className?: string
}) {
  return (
    <section className={cn('mb-6 rounded-2xl bg-surface px-5 py-4 sm:px-6', className)}>
      {(title || action) && (
        <div className="mb-1 flex flex-wrap items-end justify-between gap-4 border-b border-border pb-4">
          <div>
            {title && <h2 className="text-lg font-medium text-fg">{title}</h2>}
            {description && <p className="mt-0.5 text-base text-muted">{description}</p>}
          </div>
          {action}
        </div>
      )}
      {children}
    </section>
  )
}

/** Label and help on the left, the value or control on the right. */
export function SettingsRow({
  label,
  description,
  children,
  className,
}: {
  label: ReactNode
  description?: ReactNode
  children: ReactNode
  className?: string
}) {
  return (
    <div className={cn('grid gap-2 border-b border-border py-5 last:border-b-0 sm:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] sm:gap-8', className)}>
      <div>
        <div className="text-base text-fg">{label}</div>
        {description && <p className="mt-1 text-sm text-muted">{description}</p>}
      </div>
      <div className="min-w-0 text-base text-fg">{children}</div>
    </div>
  )
}

/** Mercury's "Edit ›" link under a value. */
export function EditLink({ children = 'Edit', onClick }: { children?: ReactNode; onClick?: () => void }) {
  return (
    <button type="button" onClick={onClick} className="mt-1.5 inline-flex items-center gap-0.5 text-sm font-medium text-accent-fg hover:underline underline-offset-4">
      {children}
      <Icon icon={I.chevronRight} size={14} />
    </button>
  )
}

/** Appears only when a form has unsaved changes. */
export function SaveBar({ dirty, onSave, onDiscard }: { dirty: boolean; onSave: () => void; onDiscard: () => void }) {
  if (!dirty) return null
  return (
    <div className="rise sticky bottom-4 z-20 mx-auto mt-6 flex w-fit max-w-full flex-wrap items-center gap-3 rounded-2xl bg-raised py-1.5 pr-1.5 pl-5 shadow-popover sm:rounded-full">
      <span className="text-sm text-muted">Unsaved changes</span>
      <Button size="sm" variant="ghost" onClick={onDiscard}>
        Discard
      </Button>
      <Button size="sm" variant="primary" onClick={onSave}>
        Save
      </Button>
    </div>
  )
}
