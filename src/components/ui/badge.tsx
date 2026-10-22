import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'
import type { LabelColor } from '@/data/business'

export type Tone = 'neutral' | 'accent' | 'positive' | 'warning' | 'negative'

const tones: Record<Tone, string> = {
  neutral: 'text-muted',
  accent: 'text-accent-fg',
  positive: 'text-positive',
  warning: 'text-warning',
  negative: 'text-negative',
}

const dots: Record<Tone, string> = {
  neutral: 'bg-faint',
  accent: 'bg-accent-fg',
  positive: 'bg-positive',
  warning: 'bg-warning',
  negative: 'bg-negative',
}

export function Badge({
  tone = 'neutral',
  children,
  className,
}: {
  tone?: Tone
  children: ReactNode
  className?: string
}) {
  return (
    <span
      className={cn(
        // Sweatpals status pills: a quiet tint of the status color, no outline.
        'inline-flex h-[22px] shrink-0 items-center gap-1.5 rounded-full bg-current/10 px-2 text-xs font-medium whitespace-nowrap',
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  )
}

export function Dot({ tone = 'neutral', className }: { tone?: Tone; className?: string }) {
  return <span className={cn('inline-block size-2 shrink-0 rounded-full', dots[tone], className)} />
}

/** A colored label chip for staff, services or calendar labels. */
export function LabelChip({ color, children, className }: { color: LabelColor; children: ReactNode; className?: string }) {
  return (
    <span
      style={{ ['--label' as string]: `var(--c-${color})` }}
      className={cn('inline-flex h-[22px] items-center rounded-full bg-current/10 px-2 text-xs font-medium text-[color:var(--label)]', className)}
    >
      {children}
    </span>
  )
}
