import { Tooltip as T } from '@base-ui/react/tooltip'
import type { ReactElement, ReactNode } from 'react'
import { cn } from '@/lib/cn'

export const TooltipProvider = ({ children }: { children: ReactNode }) => (
  <T.Provider delay={450} closeDelay={0}>
    {children}
  </T.Provider>
)

export function Tooltip({
  content,
  children,
  side = 'bottom',
  className,
}: {
  content: ReactNode
  children: ReactElement
  side?: 'top' | 'bottom' | 'left' | 'right'
  className?: string
}) {
  return (
    <T.Root>
      <T.Trigger render={children} />
      <T.Portal>
        <T.Positioner side={side} sideOffset={6} className="z-[70]">
          <T.Popup
            className={cn(
              'tooltip rounded-md bg-fg px-2 py-1 text-xs font-medium text-bg shadow-sm',
              className,
            )}
          >
            {content}
          </T.Popup>
        </T.Positioner>
      </T.Portal>
    </T.Root>
  )
}
