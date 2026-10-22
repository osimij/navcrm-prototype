import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'
import { initials } from '@/lib/format'
import type { LabelColor } from '@/data/business'

const sizes = {
  xs: 'size-5 text-[9px]',
  sm: 'size-6 text-[10px]',
  md: 'size-8 text-xs',
  lg: 'size-10 text-sm',
  xl: 'size-14 text-lg',
}

const PALETTE: LabelColor[] = ['indigo', 'sky', 'teal', 'green', 'amber', 'orange', 'rose', 'violet']

function colorFor(name: string): LabelColor {
  let h = 0
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0
  return PALETTE[h % PALETTE.length]
}

/**
 * Initials avatar. Staff pass their calendar color so the same person reads the
 * same everywhere; clients get a stable color from their name.
 * Tables use text identities instead, including when an avatar is in a shared row.
 */
export function Avatar({
  name,
  color,
  size = 'md',
  className,
  children,
  inTable = false,
}: {
  name: string
  color?: LabelColor
  size?: keyof typeof sizes
  className?: string
  children?: ReactNode
  /** Tables show text identities; a list that is about people can opt in. */
  inTable?: boolean
}) {
  const c = color ?? colorFor(name || '?')
  return (
    <span
      style={{ ['--label' as string]: `var(--c-${c})` }}
      className={cn(
        // Sweatpals-style gradient initials: the person's color, lit from the top left.
        'avatar relative inline-grid shrink-0 place-items-center rounded-full font-semibold text-white/90 select-none',
        !inTable && 'in-table:hidden',
        sizes[size],
        className,
      )}
      aria-hidden
    >
      {name ? initials(name) : '?'}
      {children}
    </span>
  )
}

export function AvatarStack({ names, max = 3, size = 'sm' }: { names: { name: string; color?: LabelColor }[]; max?: number; size?: keyof typeof sizes }) {
  const shown = names.slice(0, max)
  const rest = names.length - shown.length
  return (
    <>
      <span className="flex -space-x-1.5 in-table:hidden">
        {shown.map((n, i) => (
          <Avatar key={i} name={n.name} color={n.color} size={size} className="ring-2 ring-surface" />
        ))}
        {rest > 0 && (
          <span className={cn('inline-grid place-items-center rounded-full bg-fill font-medium text-muted ring-2 ring-surface', sizes[size])}>
            +{rest}
          </span>
        )}
      </span>
      <span className="hidden max-w-56 truncate text-sm text-muted in-table:block" title={names.map((n) => n.name).join(', ')}>
        {shown.map((n) => n.name).join(', ')}{rest > 0 && ` +${rest}`}
      </span>
    </>
  )
}
