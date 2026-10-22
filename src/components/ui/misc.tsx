import NumberFlow, { type Format } from '@number-flow/react'
import type { IconSvgElement } from '@hugeicons/react'
import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'
import { CURRENCY, formatMoney } from '@/lib/format'
import { usePrefs } from '@/lib/store'
import { I, Icon } from '../icons'
import { getLocale } from '@/i18n/language'

export function Kbd({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <kbd
      className={cn(
        'inline-grid h-5 min-w-5 place-items-center rounded-[5px] bg-surface px-1 font-sans text-[11px] font-medium text-faint ring-1 ring-border',
        className,
      )}
    >
      {children}
    </kbd>
  )
}

const HIDDEN = '••••'

/**
 * Inline money. Respects "Hide amounts" (eye icon in the top bar), which matters
 * at a front desk where clients can see the screen.
 */
export function Money({
  value,
  className,
  sign,
  decimals,
  currency = true,
  tone,
}: {
  value: number
  className?: string
  sign?: boolean
  decimals?: boolean
  currency?: boolean
  /** Color positive/negative amounts. */
  tone?: boolean
}) {
  const hidden = usePrefs((s) => s.hideAmounts)
  const color = tone ? (value > 0 ? 'text-positive' : value < 0 ? 'text-negative' : '') : ''
  if (hidden) return <span className={cn('tabular text-faint', className)}>{HIDDEN}</span>
  const text = formatMoney(value, { sign, decimals, currency: false })
  return (
    <span className={cn('tabular whitespace-nowrap', color, className)}>
      {text}
      {currency && <span className="text-[0.86em] text-faint"> {CURRENCY}</span>}
    </span>
  )
}

/** Animated figure for numbers that change in place (dashboard, totals). */
export function Figure({
  value,
  format,
  suffix,
  prefix,
  className,
  money,
}: {
  value: number
  format?: Format
  suffix?: string
  prefix?: string
  className?: string
  /** Hide when "Hide amounts" is on. */
  money?: boolean
}) {
  const hidden = usePrefs((s) => s.hideAmounts)
  if (money && hidden) return <span className={cn('figure text-faint', className)}>{HIDDEN}</span>
  return (
    <NumberFlow
      value={value}
      animated={typeof document === 'undefined' || document.documentElement.dataset.input !== 'keyboard'}
      format={format ?? { maximumFractionDigits: 0 }}
      locales={getLocale()}
      prefix={prefix}
      suffix={suffix}
      className={cn('figure', className)}
      transformTiming={{ duration: 240, easing: 'cubic-bezier(0.23, 1, 0.32, 1)' }}
      spinTiming={{ duration: 240, easing: 'cubic-bezier(0.23, 1, 0.32, 1)' }}
      opacityTiming={{ duration: 160, easing: 'cubic-bezier(0.23, 1, 0.32, 1)' }}
    />
  )
}

/** "↗ 12%" style change indicator. */
export function Delta({
  value,
  suffix = '%',
  invert,
  className,
  children,
}: {
  value: number
  suffix?: string
  /** For metrics where down is good (no-shows, debt). */
  invert?: boolean
  className?: string
  children?: ReactNode
}) {
  const up = value > 0
  const flat = Math.round(value) === 0
  const good = invert ? !up : up
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 text-sm font-medium tabular',
        flat ? 'text-muted' : good ? 'text-positive' : 'text-negative',
        className,
      )}
    >
      {!flat && <Icon icon={up ? I.arrowUpRight : I.arrowDownLeft} size={14} strokeWidth={2} />}
      {flat ? '0' : `${up ? '+' : '−'}${Math.abs(Math.round(value))}`}
      {suffix}
      {children}
    </span>
  )
}

export function pctChange(now: number, prev: number) {
  if (!prev) return 0
  return ((now - prev) / prev) * 100
}

export function EmptyState({
  icon,
  title,
  description,
  children,
  className,
}: {
  icon: IconSvgElement
  title: ReactNode
  description?: ReactNode
  children?: ReactNode
  className?: string
}) {
  return (
    <div className={cn('flex flex-col items-center px-6 py-14 text-center', className)}>
      {/* Sweatpals empty states: a single glyph, a plain sentence, one action. */}
      <Icon icon={icon} size={26} strokeWidth={1.5} className="mb-3 text-fg" />
      <h3 className="text-md font-semibold text-fg">{title}</h3>
      {description && <p className="mt-1 max-w-sm text-sm text-muted">{description}</p>}
      {children && <div className="mt-5 flex flex-wrap justify-center gap-2">{children}</div>}
    </div>
  )
}

/** Thin progress / capacity bar. */
export function Meter({
  value,
  max = 100,
  tone = 'chart',
  className,
}: {
  value: number
  max?: number
  tone?: 'chart' | 'fg' | 'accent' | 'positive' | 'warning' | 'negative'
  className?: string
}) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100))
  const color = { chart: 'bg-chart', fg: 'bg-fg', accent: 'bg-accent', positive: 'bg-positive', warning: 'bg-warning', negative: 'bg-negative' }[tone]
  return (
    <div className={cn('h-1.5 w-full overflow-hidden rounded-full bg-fill-active', className)}>
      <div className={cn('h-full rounded-full', color)} style={{ width: `${pct}%` }} />
    </div>
  )
}

export function Divider({ className }: { className?: string }) {
  return <div className={cn('h-px bg-border', className)} />
}

/** Small key/value pair used in stat rows. */
export function KeyValue({ label, value, className }: { label: ReactNode; value: ReactNode; className?: string }) {
  return (
    <div className={cn('flex min-w-0 flex-col justify-between gap-2', className)}>
      <div className="text-sm text-muted">{label}</div>
      <div className="text-xl font-normal text-fg tabular">{value}</div>
    </div>
  )
}
