import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'
import type { LabelColor } from '@/data/business'

export type Tone = 'neutral' | 'accent' | 'positive' | 'warning' | 'negative'

const tones: Record<Tone, string> = {
  neutral: 'bg-fill text-muted',
  accent: 'bg-accent-soft text-accent-fg',
  positive: 'bg-positive-soft text-positive',
  warning: 'bg-warning-soft text-warning',
  negative: 'bg-negative-soft text-negative',
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
  dot,
  children,
  className,
}: {
  tone?: Tone
  dot?: boolean
  children: ReactNode
  className?: string
}) {
  return (
    <span
      className={cn(
        'inline-flex h-[22px] shrink-0 items-center gap-1.5 rounded-full px-2 text-xs font-medium whitespace-nowrap',
        tones[tone],
        className,
      )}
    >
      {dot && <span className={cn('size-1.5 rounded-full', dots[tone])} />}
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
      className={cn('label-soft inline-flex h-[22px] items-center gap-1.5 rounded-full px-2 text-xs font-medium text-fg', className)}
    >
      <span className="size-1.5 rounded-full bg-[var(--label)]" />
      {children}
    </span>
  )
}
