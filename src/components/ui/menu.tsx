import { Menu as M } from '@base-ui/react/menu'
import type { IconSvgElement } from '@hugeicons/react'
import type { ReactElement, ReactNode } from 'react'
import { cn } from '@/lib/cn'
import { Icon } from '../icons'

export function Menu({
  trigger,
  children,
  align = 'start',
  side = 'bottom',
  className,
}: {
  trigger: ReactElement
  children: ReactNode
  align?: 'start' | 'center' | 'end'
  side?: 'top' | 'bottom' | 'left' | 'right'
  className?: string
}) {
  return (
    <M.Root>
      <M.Trigger render={trigger} />
      <M.Portal>
        <M.Positioner className="z-[60] outline-none" sideOffset={6} align={align} side={side}>
          <M.Popup className={cn('popup min-w-52 rounded-xl bg-raised p-1 shadow-popover outline-none', className)}>
            {children}
          </M.Popup>
        </M.Positioner>
      </M.Portal>
    </M.Root>
  )
}

export function MenuItem({
  icon,
  children,
  hint,
  onClick,
  danger,
  disabled,
}: {
  icon?: IconSvgElement
  children: ReactNode
  hint?: ReactNode
  onClick?: () => void
  danger?: boolean
  disabled?: boolean
}) {
  return (
    <M.Item
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'flex cursor-default items-center gap-2.5 rounded-lg px-2.5 py-2 text-base outline-none select-none data-[highlighted]:bg-fill data-[disabled]:opacity-50',
        danger ? 'text-negative' : 'text-fg',
      )}
    >
      {icon && <Icon icon={icon} size={18} className={danger ? '' : 'text-muted'} />}
      <span className="flex-1">{children}</span>
      {hint && <span className="text-xs text-faint">{hint}</span>}
    </M.Item>
  )
}

export function MenuSeparator() {
  return <M.Separator className="mx-2 my-1 h-px bg-border" />
}

export function MenuLabel({ children }: { children: ReactNode }) {
  return <div className="px-2.5 pt-2 pb-1 text-xs font-medium text-faint">{children}</div>
}
