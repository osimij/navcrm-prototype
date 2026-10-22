import type { IconSvgElement } from '@hugeicons/react'
import type { ComponentProps, ReactNode } from 'react'
import { cn } from '@/lib/cn'
import { Icon } from '../icons'
import { Tooltip } from './tooltip'

type Variant = 'primary' | 'secondary' | 'soft' | 'outline' | 'ghost' | 'danger' | 'link'
type Size = 'sm' | 'md' | 'lg'

/**
 * Secondary reads per theme: a gray filled pill in light (Revolut) and an
 * outlined pill in dark (Sweatpals). `soft` is Revolut's lavender action pill,
 * for quick actions that sit next to the content they act on.
 */
const variants: Record<Variant, string> = {
  primary: 'bg-accent text-on-accent hover:bg-accent-hover disabled:opacity-40',
  secondary:
    'bg-[var(--button-secondary)] text-fg ring-1 ring-inset ring-[var(--button-secondary-ring)] hover:bg-[var(--button-secondary-hover)] data-[popup-open]:bg-[var(--button-secondary-hover)] disabled:text-disabled',
  soft: 'bg-accent-soft text-accent-fg hover:bg-[color-mix(in_oklab,var(--accent)_15%,var(--surface))] data-[popup-open]:bg-[color-mix(in_oklab,var(--accent)_15%,var(--surface))] disabled:opacity-50',
  outline:
    'bg-transparent text-fg ring-1 ring-inset ring-border-strong hover:bg-fill data-[popup-open]:bg-fill disabled:text-disabled',
  ghost: 'text-fg hover:bg-fill data-[popup-open]:bg-fill disabled:text-disabled',
  danger: 'bg-negative-soft text-negative hover:bg-[color-mix(in_oklab,var(--negative)_16%,var(--surface))] disabled:opacity-50',
  link: 'text-accent-fg hover:underline underline-offset-4 !h-auto !px-0',
}

const sizes: Record<Size, string> = {
  sm: 'h-8 px-3 gap-1.5 text-sm',
  md: 'h-9 px-4 gap-2 text-base',
  lg: 'h-11 px-5 gap-2 text-md',
}

const iconSizes: Record<Size, number> = { sm: 16, md: 18, lg: 18 }

export type ButtonProps = ComponentProps<'button'> & {
  variant?: Variant
  size?: Size
  icon?: IconSvgElement
  iconRight?: IconSvgElement
  loading?: boolean
}

export function Button({
  variant = 'secondary',
  size = 'md',
  icon,
  iconRight,
  loading,
  className,
  children,
  type = 'button',
  ...props
}: ButtonProps) {
  const s = iconSizes[size]
  return (
    <button
      type={type}
      className={cn(
        'press inline-flex shrink-0 items-center justify-center rounded-full font-medium whitespace-nowrap select-none',
        sizes[size],
        variants[variant],
        icon && variant !== 'link' && (size === 'sm' ? 'pl-2.5' : 'pl-3.5'),
        className,
      )}
      {...props}
      disabled={props.disabled || loading}
    >
      {loading ? <Spinner size={s} /> : icon ? <Icon icon={icon} size={s} /> : null}
      {children}
      {iconRight && <Icon icon={iconRight} size={s - 2} className="-mr-1 opacity-70" />}
    </button>
  )
}

type IconButtonProps = ComponentProps<'button'> & {
  icon: IconSvgElement
  /** Required: used as the accessible name and the tooltip. */
  label: string
  variant?: Exclude<Variant, 'link' | 'primary'> | 'primary'
  size?: 'xs' | 'sm' | 'md'
  tooltip?: boolean
  badge?: boolean
  iconSize?: number
}

export function IconButton({
  icon,
  label,
  variant = 'ghost',
  size = 'md',
  tooltip = true,
  badge,
  iconSize,
  className,
  type = 'button',
  ...props
}: IconButtonProps) {
  const dim = size === 'xs' ? 'size-7' : size === 'sm' ? 'size-8' : 'size-9'
  const btn = (
    <button
      type={type}
      aria-label={label}
      className={cn(
        'press relative inline-flex shrink-0 items-center justify-center rounded-full text-muted hover:text-fg',
        dim,
        variants[variant],
        variant === 'primary' && 'text-on-accent hover:text-on-accent',
        className,
      )}
      {...props}
    >
      <Icon icon={icon} size={iconSize ?? (size === 'md' ? 20 : 18)} />
      {badge && <span className="absolute top-1.5 right-1.5 size-2 rounded-full bg-negative ring-2 ring-bg" />}
    </button>
  )
  if (!tooltip) return btn
  return <Tooltip content={label}>{btn}</Tooltip>
}

export function Spinner({ size = 16, className }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      className={cn('shrink-0 animate-spin [animation-duration:600ms]', className)}
      aria-hidden
    >
      <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeOpacity="0.2" strokeWidth="2.5" />
      <path d="M21 12a9 9 0 0 0-9-9" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  )
}

/** A row of buttons that sit together, e.g. page header actions. */
export function ButtonRow({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('flex flex-wrap items-center gap-2', className)}>{children}</div>
}
