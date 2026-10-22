import { Select as S } from '@base-ui/react/select'
import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'
import { I, Icon } from '../icons'
import { fieldBase } from './input'
import { node } from '@/i18n'

export type Option<V extends string = string> = { value: V; label: ReactNode; hint?: ReactNode; icon?: ReactNode }

/**
 * Single-value select. Two looks: `field` (inside forms) and `pill` (filters and
 * toolbars, matching the filter chips).
 */
export function Select<V extends string>({
  value,
  onChange,
  options,
  placeholder = 'Select',
  look = 'field',
  className,
  align = 'start',
  disabled,
  prefix,
}: {
  value: V | null
  onChange: (v: V) => void
  options: Option<V>[]
  placeholder?: string
  look?: 'field' | 'pill'
  className?: string
  align?: 'start' | 'end'
  disabled?: boolean
  prefix?: ReactNode
}) {
  const items = options.map((o) => ({ value: o.value, label: node(o.label) }))
  return (
    <S.Root items={items} value={value} onValueChange={(v) => v != null && onChange(v as V)} disabled={disabled}>
      <S.Trigger
        className={cn(
          'flex min-w-0 max-w-full items-center justify-between gap-2 text-left select-none',
          look === 'field'
            ? cn(fieldBase, 'h-9 px-3 data-[popup-open]:bg-surface data-[popup-open]:ring-accent')
            : 'press h-8 rounded-full bg-surface pr-2.5 pl-3 text-sm font-medium text-fg shadow-xs ring-1 ring-inset ring-border hover:bg-fill data-[popup-open]:bg-fill',
          className,
        )}
      >
        <span className="flex min-w-0 items-center gap-1.5">
          {prefix && <span className="text-faint">{prefix}</span>}
          <S.Value className="truncate data-[placeholder]:text-faint" placeholder={placeholder} />
        </span>
        <S.Icon className="text-faint">
          <Icon icon={look === 'pill' ? I.chevronDown : I.chevronsUpDown} size={look === 'pill' ? 14 : 16} />
        </S.Icon>
      </S.Trigger>
      <S.Portal>
        <S.Positioner className="z-[60] outline-none" sideOffset={6} align={align} alignItemWithTrigger={false}>
          <S.Popup className="popup min-w-[max(var(--anchor-width),12rem)] rounded-xl bg-raised p-1 shadow-popover outline-none">
            <S.List className="max-h-[min(var(--available-height),22rem)] overflow-y-auto">
              {options.map((o) => (
                <S.Item
                  key={o.value}
                  value={o.value}
                  className="grid cursor-default grid-cols-[1fr_16px] items-center gap-3 rounded-lg px-2.5 py-2 text-base text-fg outline-none select-none data-[highlighted]:bg-fill"
                >
                  <span className="flex min-w-0 items-center gap-2">
                    {o.icon}
                    <span className="min-w-0">
                      <S.ItemText className="block truncate">{o.label}</S.ItemText>
                      {o.hint && <span className="block text-xs text-faint">{o.hint}</span>}
                    </span>
                  </span>
                  <S.ItemIndicator className="text-accent-fg">
                    <Icon icon={I.check} size={16} />
                  </S.ItemIndicator>
                </S.Item>
              ))}
            </S.List>
          </S.Popup>
        </S.Positioner>
      </S.Portal>
    </S.Root>
  )
}
