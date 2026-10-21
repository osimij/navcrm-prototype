import type { IconSvgElement } from '@hugeicons/react'
import { useId, type ComponentProps, type ReactNode } from 'react'
import { cn } from '@/lib/cn'
import { I, Icon } from '../icons'

/** Shared look for every text-like control, so inputs, selects and pickers match. */
export const fieldBase =
  'w-full rounded-[10px] bg-fill text-base text-fg outline-none ring-1 ring-inset ring-transparent transition-[background-color,box-shadow] duration-150 ' +
  'hover:ring-border-strong focus:bg-surface focus:ring-accent focus:shadow-[0_0_0_4px_color-mix(in_oklab,var(--accent)_14%,transparent)] ' +
  'disabled:opacity-60 aria-[invalid=true]:ring-negative'

type InputProps = Omit<ComponentProps<'input'>, 'size'> & {
  icon?: IconSvgElement
  suffix?: ReactNode
  size?: 'md' | 'lg'
  /** With an icon or suffix, `className` styles the wrapper; this styles the input itself. */
  inputClassName?: string
}

export function Input({ icon, suffix, size = 'md', className, inputClassName, ...props }: InputProps) {
  const h = size === 'lg' ? 'h-11 text-md' : 'h-9'
  if (!icon && !suffix) return <input className={cn(fieldBase, h, 'px-3', className, inputClassName)} {...props} />
  return (
    <div className={cn('relative flex items-center', className)}>
      {icon && <Icon icon={icon} size={16} className="pointer-events-none absolute left-3 text-faint" />}
      <input className={cn(fieldBase, h, icon ? 'pl-9' : 'pl-3', suffix ? 'pr-12' : 'pr-3', inputClassName)} {...props} />
      {suffix && <div className="absolute right-3 flex items-center text-sm text-faint">{suffix}</div>}
    </div>
  )
}

export function Textarea({ className, ...props }: ComponentProps<'textarea'>) {
  return <textarea className={cn(fieldBase, 'min-h-20 resize-none px-3 py-2 leading-5', className)} {...props} />
}

export function Field({
  label,
  hint,
  error,
  optional,
  children,
  className,
  htmlFor,
}: {
  label?: ReactNode
  hint?: ReactNode
  error?: ReactNode
  optional?: boolean
  children: ReactNode
  className?: string
  htmlFor?: string
}) {
  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      {label && (
        <label htmlFor={htmlFor} className="text-sm font-medium text-muted">
          {label}
          {optional && <span className="font-normal text-faint"> · optional</span>}
        </label>
      )}
      {children}
      {error ? (
        <p className="flex items-center gap-1.5 text-xs text-negative">
          <Icon icon={I.alert} size={14} />
          {error}
        </p>
      ) : hint ? (
        <p className="text-xs text-faint">{hint}</p>
      ) : null}
    </div>
  )
}

export function SearchInput({
  value,
  onChange,
  placeholder = 'Search',
  className,
  autoFocus,
}: {
  value: string
  onChange: (v: string) => void
  placeholder?: string
  className?: string
  autoFocus?: boolean
}) {
  return (
    <div className={cn('relative flex items-center', className)}>
      <Icon icon={I.search} size={16} className="pointer-events-none absolute left-3 text-faint" />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoFocus={autoFocus}
        className={cn(fieldBase, 'h-9 pr-9 pl-9')}
        onKeyDown={(e) => e.key === 'Escape' && value && (e.stopPropagation(), onChange(''))}
      />
      {value && (
        <button
          type="button"
          aria-label="Clear search"
          onClick={() => onChange('')}
          className="absolute right-2 grid size-6 place-items-center rounded-full text-faint hover:bg-fill-hover hover:text-fg"
        >
          <Icon icon={I.close} size={14} />
        </button>
      )}
    </div>
  )
}

/** Tajik mobile number: fixed +992 prefix, 9 digits shown as "93 123 45 67". */
export function PhoneInput({
  value,
  onChange,
  size = 'md',
  autoFocus,
  id,
  invalid,
}: {
  value: string
  onChange: (digits: string) => void
  size?: 'md' | 'lg'
  autoFocus?: boolean
  id?: string
  invalid?: boolean
}) {
  const auto = useId()
  const d = value.replace(/\D/g, '').slice(0, 9)
  const shown = [d.slice(0, 2), d.slice(2, 5), d.slice(5, 7), d.slice(7, 9)].filter(Boolean).join(' ')
  return (
    <div className="relative flex items-center">
      <span
        className={cn(
          'pointer-events-none absolute left-3 tabular text-muted',
          size === 'lg' ? 'text-md' : 'text-base',
        )}
      >
        +992
      </span>
      <input
        id={id ?? auto}
        inputMode="tel"
        autoComplete="tel-national"
        autoFocus={autoFocus}
        aria-invalid={invalid || undefined}
        placeholder="93 123 45 67"
        value={shown}
        onChange={(e) => onChange(e.target.value.replace(/\D/g, '').slice(0, 9))}
        className={cn(fieldBase, 'tabular', size === 'lg' ? 'h-11 pl-[58px] text-md' : 'h-9 pl-[55px]', 'pr-3')}
      />
    </div>
  )
}
