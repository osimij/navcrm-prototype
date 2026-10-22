import { Checkbox as C } from '@base-ui/react/checkbox'
import { Switch as S } from '@base-ui/react/switch'
import type { IconSvgElement } from '@hugeicons/react'
import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'
import { I, Icon } from '../icons'

export function Checkbox({
  checked,
  onChange,
  label,
  className,
  round,
  'aria-label': ariaLabel,
}: {
  checked: boolean
  onChange: (v: boolean) => void
  label?: ReactNode
  className?: string
  /** Round checkboxes are used for completing tasks. */
  round?: boolean
  'aria-label'?: string
}) {
  const box = (
    <C.Root
      checked={checked}
      aria-label={ariaLabel}
      onCheckedChange={onChange}
      onClick={(e) => e.stopPropagation()}
      className={cn(
        'press flex size-[18px] shrink-0 items-center justify-center bg-surface text-on-accent ring-1 ring-inset ring-border-strong',
        'data-[checked]:bg-accent data-[checked]:ring-accent hover:ring-faint',
        round ? 'rounded-full' : 'rounded-[5px]',
      )}
    >
      <C.Indicator
        keepMounted
        className="flex transition-[opacity,transform] duration-150 ease-[var(--ease-out)] data-[unchecked]:scale-50 data-[unchecked]:opacity-0 motion-reduce:transition-none"
      >
        <Icon icon={I.check} size={13} strokeWidth={2.4} />
      </C.Indicator>
    </C.Root>
  )
  if (!label) return box
  return (
    <label className={cn('flex cursor-pointer items-start gap-2.5 text-base text-fg select-none', className)}>
      <span className="pt-px">{box}</span>
      <span className="min-w-0">{label}</span>
    </label>
  )
}

export function Switch({
  checked,
  onChange,
  label,
  description,
  className,
  'aria-label': ariaLabel,
}: {
  checked: boolean
  onChange: (v: boolean) => void
  label?: ReactNode
  description?: ReactNode
  className?: string
  'aria-label'?: string
}) {
  // Fixed pixel dimensions need 16px of travel: 38 - 18 - (2 * 2).
  const sw = (
    <S.Root
      checked={checked}
      onCheckedChange={onChange}
      aria-label={ariaLabel}
      className="relative inline-flex h-[22px] w-[38px] shrink-0 items-center rounded-full bg-fill-active p-[2px] align-middle transition-colors duration-150 ease-[ease] data-[checked]:bg-accent motion-reduce:transition-none"
    >
      <S.Thumb className="block size-[18px] shrink-0 rounded-full bg-white shadow-[0_1px_3px_rgb(0_0_0/0.2)] transition-transform duration-150 ease-[var(--ease-out)] data-[checked]:translate-x-[16px] motion-reduce:transition-none" />
    </S.Root>
  )
  if (!label) return sw
  return (
    <label className={cn('flex cursor-pointer items-start justify-between gap-6 select-none', className)}>
      <span className="min-w-0">
        <span className="block text-base text-fg">{label}</span>
        {description && <span className="mt-0.5 block text-sm text-muted">{description}</span>}
      </span>
      {sw}
    </label>
  )
}

/** Large selectable cards: business spheres, payment methods, task types. */
export function ChoiceCard({
  selected,
  onClick,
  icon,
  title,
  description,
  className,
  disabled,
}: {
  selected: boolean
  onClick: () => void
  icon?: IconSvgElement
  title: ReactNode
  description?: ReactNode
  className?: string
  disabled?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={selected}
      className={cn(
        'press relative flex flex-col items-start gap-3 rounded-xl p-3.5 text-left ring-1 ring-inset',
        selected ? 'bg-accent-soft ring-accent' : 'bg-surface ring-border hover:bg-fill',
        disabled && !selected && 'opacity-45',
        className,
      )}
    >
      {icon && <Icon icon={icon} size={20} className={selected ? 'text-accent-fg' : 'text-muted'} />}
      <span>
        <span className="block text-base font-medium text-fg">{title}</span>
        {description && <span className="mt-0.5 block text-sm text-muted">{description}</span>}
      </span>
      <span
        className={cn(
          'absolute top-3 right-3 grid size-[18px] place-items-center rounded-full transition-[opacity,transform] duration-150 ease-[var(--ease-out)] motion-reduce:transition-none',
          selected ? 'scale-100 bg-accent text-on-accent opacity-100' : 'scale-75 opacity-0',
        )}
      >
        <Icon icon={I.check} size={12} strokeWidth={2.4} />
      </span>
    </button>
  )
}

/** Toggleable filter chip with an optional count: "With debt 4". */
export function Chip({
  active,
  onClick,
  children,
  count,
  icon,
}: {
  active: boolean
  onClick: () => void
  children: ReactNode
  count?: number
  icon?: IconSvgElement
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        'press inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full px-3 text-sm font-medium ring-1 ring-inset',
        active
          ? 'bg-accent-soft text-accent-fg ring-[color-mix(in_oklab,var(--accent)_32%,transparent)]'
          : 'bg-[var(--button-secondary)] text-fg ring-[var(--button-secondary-ring)] hover:bg-[var(--button-secondary-hover)]',
      )}
    >
      {icon && <Icon icon={icon} size={15} className={active ? '' : 'text-muted'} />}
      {children}
      {count != null && <span className={cn('tabular', active ? 'opacity-75' : 'text-faint')}>{count}</span>}
    </button>
  )
}
