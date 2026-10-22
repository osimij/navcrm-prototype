import { Dialog as D } from '@base-ui/react/dialog'
import { useRef, type ReactElement, type ReactNode } from 'react'
import { cn } from '@/lib/cn'
import { I } from '../icons'
import { IconButton } from './button'

/**
 * Pattern rules for the whole app:
 * - Modal: quick create/edit with a handful of fields (new client, new visit, new task).
 * - Sheet: details of one record, opened from a list row (visit, client, receipt).
 * - Full page: long or multi-step work (campaign wizard, report builder, stock document).
 */

type ModalProps = {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  trigger?: ReactElement
  title: ReactNode
  description?: ReactNode
  children?: ReactNode
  footer?: ReactNode
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const modalWidths = { sm: 'w-[400px]', md: 'w-[520px]', lg: 'w-[680px]' }

export function Modal({ open, onOpenChange, trigger, title, description, children, footer, size = 'md', className }: ModalProps) {
  return (
    <D.Root open={open} onOpenChange={onOpenChange}>
      {trigger && <D.Trigger render={trigger} />}
      <D.Portal>
        <D.Backdrop className="backdrop fixed inset-0 z-50 bg-backdrop" />
        <D.Viewport className="fixed inset-0 z-50 grid grid-cols-1 place-items-center overflow-y-auto p-4 sm:p-8">
          <D.Popup
            className={cn(
              'modal relative flex max-h-[calc(100dvh-4rem)] min-w-0 max-w-full flex-col rounded-3xl bg-raised shadow-modal outline-none',
              modalWidths[size],
              className,
            )}
          >
            <div className="flex items-start gap-4 px-6 pt-6 pb-1">
              <div className="min-w-0 flex-1">
                <D.Title className="text-xl font-semibold tracking-[-0.01em] text-fg">{title}</D.Title>
                {description && <D.Description className="mt-1 text-base text-muted">{description}</D.Description>}
              </div>
              <D.Close render={<IconButton icon={I.close} label="Close" size="sm" variant="secondary" tooltip={false} className="-mt-0.5 -mr-1" />} />
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto px-6 pt-4 pb-6">{children}</div>
            {/* Revolut keeps actions on the dialog surface: no gray band, a hairline only when content scrolls. */}
            {footer && <div className="flex flex-wrap items-center justify-end gap-2 border-t border-border px-6 py-4">{footer}</div>}
          </D.Popup>
        </D.Viewport>
      </D.Portal>
    </D.Root>
  )
}

export const ModalClose = D.Close

type SheetProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  title?: ReactNode
  /** Small uppercase-free label above the title, e.g. "Visit" or "Client". */
  eyebrow?: ReactNode
  actions?: ReactNode
  children: ReactNode
  footer?: ReactNode
  width?: 'md' | 'lg' | 'xl'
}

const sheetWidths = { md: 'w-[440px]', lg: 'w-[520px]', xl: 'w-[640px]' }

export function Sheet({ open, onOpenChange, title, eyebrow, actions, children, footer, width = 'lg' }: SheetProps) {
  // Opened with a mouse, focus the sheet itself so no header button shows a focus ring;
  // opened from the keyboard, keep the default (first control) for accessibility.
  const popup = useRef<HTMLDivElement>(null)
  return (
    <D.Root open={open} onOpenChange={onOpenChange}>
      <D.Portal>
        <D.Backdrop className="backdrop fixed inset-0 z-50 bg-[color-mix(in_oklab,var(--backdrop)_55%,transparent)]" />
        <D.Popup
          ref={popup}
          initialFocus={(type) => (type === 'keyboard' ? true : popup.current)}
          className={cn(
            'sheet fixed top-2 right-2 bottom-2 z-50 flex max-w-[calc(100vw-1rem)] flex-col overflow-hidden rounded-[22px] bg-raised shadow-modal outline-none',
            sheetWidths[width],
          )}
        >
          <div className="flex items-center gap-2 border-b border-border px-5 py-3.5">
            <div className="min-w-0 flex-1">
              {eyebrow && <div className="text-xs font-medium text-muted">{eyebrow}</div>}
              {title && <D.Title className="break-words text-base font-semibold text-fg">{title}</D.Title>}
            </div>
            {actions}
            {/* Focus lands here on open, so a tooltip would pop up every time. */}
            <D.Close render={<IconButton icon={I.close} label="Close" size="sm" variant="secondary" tooltip={false} />} />
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>
          {footer && <div className="flex flex-wrap items-center gap-2 border-t border-border px-5 py-3">{footer}</div>}
        </D.Popup>
      </D.Portal>
    </D.Root>
  )
}

/** Mercury-style detail rows inside a sheet or settings page. */
export function DetailRow({ label, children, className }: { label: ReactNode; children: ReactNode; className?: string }) {
  return (
    <div className={cn('flex items-start justify-between gap-6 py-2.5 text-base', className)}>
      <span className="shrink-0 text-muted">{label}</span>
      <span className="min-w-0 text-right text-fg">{children}</span>
    </div>
  )
}
