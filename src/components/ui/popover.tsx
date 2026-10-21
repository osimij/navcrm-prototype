import { Popover as P } from '@base-ui/react/popover'
import type { ReactElement, ReactNode } from 'react'
import { cn } from '@/lib/cn'

export function Popover({
  trigger,
  children,
  align = 'start',
  side = 'bottom',
  open,
  onOpenChange,
  className,
  sideOffset = 6,
}: {
  trigger: ReactElement
  children: ReactNode
  align?: 'start' | 'center' | 'end'
  side?: 'top' | 'bottom' | 'left' | 'right'
  open?: boolean
  onOpenChange?: (open: boolean) => void
  className?: string
  sideOffset?: number
}) {
  return (
    <P.Root open={open} onOpenChange={onOpenChange}>
      <P.Trigger render={trigger} />
      <P.Portal>
        <P.Positioner className="z-[60]" sideOffset={sideOffset} align={align} side={side} collisionPadding={12}>
          <P.Popup className={cn('popup rounded-2xl bg-raised shadow-popover outline-none', className)}>{children}</P.Popup>
        </P.Positioner>
      </P.Portal>
    </P.Root>
  )
}

export const PopoverClose = P.Close
