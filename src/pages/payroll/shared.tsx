import { StatCard } from '@/components/ui/stat-card'
import type { ReactNode } from 'react'
import { I, Icon } from '@/components/icons'
import { Avatar } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Figure } from '@/components/ui/misc'
import { staffById } from '@/data/staff'
import { cn } from '@/lib/cn'
import { CURRENCY, formatNumber } from '@/lib/format'
import { STATUS_LABEL, type PeriodStatus } from './data'

/** Read-only KPI tile used across payroll, sublease and earnings. */
export function StatTile({
  label,
  value,
  sub,
  money,
  suffix,
  tone,
  className,
}: {
  label: ReactNode
  value: number
  sub?: ReactNode
  money?: boolean
  suffix?: string
  tone?: 'negative' | 'positive'
  className?: string
}) {
  return (
    <StatCard label={label} value={<Figure value={value} money={money} />} suffix={suffix ?? (money ? CURRENCY : undefined)} sub={sub} className={className} valueClassName={tone === 'negative' && value > 0 ? 'text-negative' : tone === 'positive' ? 'text-positive' : undefined} />
  )
}

export function StaffCell({ staffId, sub }: { staffId: string; sub?: ReactNode }) {
  const s = staffById[staffId]
  return (
    <span className="flex min-w-0 items-center gap-2.5">
      <Avatar name={s.name} color={s.color} size="md" />
      <span className="min-w-0">
        <span className="block truncate text-base text-fg">{s.name}</span>
        <span className="block truncate text-sm text-muted">{sub ?? s.position}</span>
      </span>
    </span>
  )
}

export function PeriodBadge({ status }: { status: PeriodStatus }) {
  if (status === 'approved')
    return (
      <Badge tone="positive">
        <Icon icon={I.lock} size={12} strokeWidth={2} />
        {STATUS_LABEL.approved}
      </Badge>
    )
  return (
    <Badge tone={status === 'calculated' ? 'accent' : 'neutral'}>
      {STATUS_LABEL[status]}
    </Badge>
  )
}

/** Whole-somoni amount field: digits only, grouped as you type. */
export function MoneyInput({
  value,
  onChange,
  autoFocus,
  invalid,
  placeholder = '0',
}: {
  value: number | null
  onChange: (v: number | null) => void
  autoFocus?: boolean
  invalid?: boolean
  placeholder?: string
}) {
  return (
    <Input
      inputMode="numeric"
      autoFocus={autoFocus}
      aria-invalid={invalid || undefined}
      placeholder={placeholder}
      value={value == null ? '' : formatNumber(value)}
      onChange={(e) => {
        const d = e.target.value.replace(/\D/g, '').slice(0, 9)
        onChange(d ? Number(d) : null)
      }}
      suffix={CURRENCY}
      className="tabular"
    />
  )
}

export function PercentInput({ value, onChange }: { value: number | undefined; onChange: (v: number) => void }) {
  return (
    <Input
      inputMode="decimal"
      value={value ?? ''}
      onChange={(e) => {
        const n = Number(e.target.value.replace(/[^\d.]/g, ''))
        onChange(Number.isFinite(n) ? Math.min(100, n) : 0)
      }}
      suffix="%"
      className="tabular"
    />
  )
}

/** Quiet explanatory note: why a number is what it is. */
export function Note({ children, icon = I.info, className }: { children: ReactNode; icon?: typeof I.info; className?: string }) {
  return (
    <div className={cn('flex items-start gap-3 rounded-xl bg-fill px-4 py-3 text-sm text-muted', className)}>
      <Icon icon={icon} size={16} className="mt-px shrink-0 text-faint" />
      <div className="min-w-0">{children}</div>
    </div>
  )
}
