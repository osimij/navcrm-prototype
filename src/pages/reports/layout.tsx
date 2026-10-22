import { StatCard } from '@/components/ui/stat-card'
import { useMemo, useState, type ReactNode } from 'react'
import { useAssistant } from '@/pages/assistant/store'
import { toast } from 'sonner'
import { I, Icon } from '@/components/icons'
import { Avatar } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { MiniCalendar } from '@/components/ui/date-picker'
import { Menu, MenuItem } from '@/components/ui/menu'
import { Figure } from '@/components/ui/misc'
import { Page, PageHeader, Toolbar } from '@/components/ui/page'
import { Popover } from '@/components/ui/popover'
import { Select } from '@/components/ui/select'
import { bookableStaff } from '@/data/staff'
import { cn } from '@/lib/cn'
import { formatDate } from '@/lib/format'
import { text as translate } from '@/i18n'
import { TODAY, addDays } from '@/lib/time'
import { RANGE_OPTIONS, rangeFor, rangeText, type Filters, type RangeKey, type Segment } from './data'

export function useReportFilters(initial: RangeKey = 'last-30') {
  const [rangeKey, setRangeKey] = useState<RangeKey>(initial)
  const [custom, setCustom] = useState({ from: addDays(TODAY, -13), to: TODAY })
  const [staffId, setStaffId] = useState('all')
  const [segment, setSegment] = useState<Segment>('all')
  const range = useMemo(() => rangeFor(rangeKey, custom), [rangeKey, custom])
  const filters: Filters = useMemo(() => ({ range, staffId, segment }), [range, staffId, segment])
  return { rangeKey, setRangeKey, custom, setCustom, staffId, setStaffId, segment, setSegment, range, filters }
}

export type ReportFilterState = ReturnType<typeof useReportFilters>

const pill =
  'press flex h-8 items-center gap-1.5 rounded-full bg-surface pr-2.5 pl-3 text-sm font-medium text-fg shadow-xs ring-1 ring-inset ring-border hover:bg-fill data-[popup-open]:bg-fill'

/** Custom period: two month grids in one popover, styled like the other filter pills. */
function CustomRange({ f }: { f: ReportFilterState }) {
  return (
    <Popover
      className="p-4"
      trigger={
        <button type="button" className={pill}>
          <span className="tabular">
            {formatDate(f.custom.from)} – {formatDate(f.custom.to)}
          </span>
          <Icon icon={I.chevronDown} size={14} className="text-faint" />
        </button>
      }
    >
      <div className="flex flex-col gap-6 sm:flex-row">
        <div>
          <div className="mb-2 px-2 text-xs font-medium text-faint">From</div>
          <MiniCalendar value={f.custom.from} onChange={(d) => f.setCustom((c) => ({ ...c, from: d }))} />
        </div>
        <div>
          <div className="mb-2 px-2 text-xs font-medium text-faint">To</div>
          <MiniCalendar value={f.custom.to} onChange={(d) => f.setCustom((c) => ({ ...c, to: d }))} />
        </div>
      </div>
      <p className="mt-3 px-2 text-xs text-faint">The prototype keeps the last 60 days.</p>
    </Popover>
  )
}

export const SEGMENT_OPTIONS: { value: Segment; label: string }[] = [
  { value: 'all', label: 'All clients' },
  { value: 'new', label: 'New clients' },
  { value: 'regular', label: 'Regular clients' },
  { value: 'vip', label: 'VIP clients' },
  { value: 'lost', label: 'Lost clients' },
]

export function FilterBar({
  f,
  staff = true,
  segment = true,
  children,
}: {
  f: ReportFilterState
  staff?: boolean
  segment?: boolean
  /** Grouping control, placed at the right end. */
  children?: ReactNode
}) {
  return (
    <Toolbar className="mb-5">
      <Select
        look="pill"
        value={f.rangeKey}
        onChange={f.setRangeKey}
        options={RANGE_OPTIONS}
        prefix={<Icon icon={I.calendar} size={15} />}
      />
      {f.rangeKey === 'custom' && <CustomRange f={f} />}
      {staff && (
        <Select
          look="pill"
          value={f.staffId}
          onChange={f.setStaffId}
          options={[
            { value: 'all', label: 'All masters' },
            ...bookableStaff
              .filter((s) => !s.tenant)
              .map((s) => ({ value: s.id, label: s.name, icon: <Avatar name={s.name} color={s.color} size="xs" /> })),
          ]}
        />
      )}
      {segment && <Select look="pill" value={f.segment} onChange={f.setSegment} options={SEGMENT_OPTIONS} />}
      {f.rangeKey !== 'custom' && <span className="text-sm text-faint tabular">{rangeText(f.range)}</span>}
      {children && <div className="ml-auto min-w-0 max-w-full">{children}</div>}
    </Toolbar>
  )
}

export function ReportLayout({
  title,
  subtitle,
  question,
  primary,
  children,
}: {
  title: string
  subtitle?: ReactNode
  /** What "Ask assistant" asks about this report. */
  question: string
  primary?: ReactNode
  children: ReactNode
}) {
  const exported = (kind: string) =>
    toast.success(`${title} exported`, { description: `${title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.${kind} saved to Downloads` })
  return (
    <Page>
      <PageHeader
        back="/reports"
        title={title}
        subtitle={subtitle}
        actions={
          <>
            <Button variant="soft" icon={I.sparkles} onClick={() => useAssistant.getState().askInDock(translate(question))}>
              Ask AI
            </Button>
            <Menu
              align="end"
              trigger={
                <Button icon={I.download} iconRight={I.chevronDown}>
                  Export
                </Button>
              }
            >
              <MenuItem icon={I.download} onClick={() => exported('xlsx')}>
                Excel (.xlsx)
              </MenuItem>
              <MenuItem icon={I.print} onClick={() => exported('pdf')}>
                PDF
              </MenuItem>
            </Menu>
            {primary}
          </>
        }
      />
      {children}
    </Page>
  )
}

export function KpiRow({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('mb-5 grid grid-cols-2 gap-4 lg:grid-cols-4', className)}>{children}</div>
}

export function Kpi({
  label,
  value,
  money,
  suffix,
  sub,
  decimals,
}: {
  label: ReactNode
  value: number
  money?: boolean
  suffix?: string
  sub?: ReactNode
  decimals?: number
}) {
  return (
    <StatCard label={label} value={<Figure value={value} money={money} format={decimals ? { minimumFractionDigits: decimals, maximumFractionDigits: decimals } : undefined} />} suffix={suffix} sub={sub} />
  )
}

/** Chart legend chip: small swatch + label. */
export function LegendItem({ swatch, children }: { swatch: string; children: ReactNode }) {
  return (
    <span className="flex items-center gap-1.5 text-sm text-muted">
      <span className={cn('size-2.5 rounded-[3px]', swatch)} />
      {children}
    </span>
  )
}
