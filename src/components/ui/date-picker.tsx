import { useState } from 'react'
import { cn } from '@/lib/cn'
import { formatDate, monthLong } from '@/lib/format'
import { NOW, isSameDay, startOfDay } from '@/lib/time'
import { I, Icon } from '../icons'
import { IconButton } from './button'
import { fieldBase } from './input'
import { Popover } from './popover'

const WEEK = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su']

/** Month grid, Monday first. */
export function MiniCalendar({
  value,
  onChange,
  marked,
  className,
}: {
  value: Date
  onChange: (d: Date) => void
  /** Days that get a small dot (e.g. have bookings). */
  marked?: (d: Date) => boolean
  className?: string
}) {
  const [view, setView] = useState(() => new Date(value.getFullYear(), value.getMonth(), 1))
  const first = new Date(view.getFullYear(), view.getMonth(), 1)
  const offset = (first.getDay() + 6) % 7
  const days = Array.from({ length: 42 }, (_, i) => new Date(view.getFullYear(), view.getMonth(), i - offset + 1))
  const rows = days[35].getMonth() !== view.getMonth() ? days.slice(0, 35) : days

  return (
    <div className={cn('w-[264px] select-none', className)}>
      <div className="mb-2 flex items-center justify-between pl-2">
        <span className="text-base font-medium text-fg">
          {monthLong(view.getMonth())} {view.getFullYear()}
        </span>
        <div className="flex">
          <IconButton icon={I.chevronLeft} label="Previous month" size="sm" tooltip={false} onClick={() => setView(new Date(view.getFullYear(), view.getMonth() - 1, 1))} />
          <IconButton icon={I.chevronRight} label="Next month" size="sm" tooltip={false} onClick={() => setView(new Date(view.getFullYear(), view.getMonth() + 1, 1))} />
        </div>
      </div>
      <div className="grid grid-cols-7 text-center text-xs text-faint">
        {WEEK.map((d) => (
          <span key={d} className="py-1">
            {d}
          </span>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-y-0.5">
        {rows.map((d) => {
          const inMonth = d.getMonth() === view.getMonth()
          const selected = isSameDay(d, value)
          const today = isSameDay(d, NOW)
          return (
            <button
              key={d.toISOString()}
              type="button"
              onClick={() => onChange(startOfDay(d))}
              className={cn(
                'press relative mx-auto grid size-9 place-items-center rounded-full text-sm tabular',
                selected ? 'bg-fg font-medium text-bg' : today ? 'font-semibold text-accent-fg hover:bg-fill' : 'hover:bg-fill',
                !inMonth && !selected && 'text-disabled',
              )}
            >
              {d.getDate()}
              {marked?.(d) && !selected && <span className="absolute bottom-1 size-1 rounded-full bg-faint" />}
            </button>
          )
        })}
      </div>
    </div>
  )
}

export function DatePicker({ value, onChange, className }: { value: Date; onChange: (d: Date) => void; className?: string }) {
  const [open, setOpen] = useState(false)
  return (
    <Popover
      open={open}
      onOpenChange={setOpen}
      className="p-3"
      trigger={
        <button type="button" className={cn(fieldBase, 'flex h-9 items-center gap-2 px-3 text-left data-[popup-open]:bg-surface data-[popup-open]:ring-accent', className)}>
          <Icon icon={I.calendar} size={16} className="text-faint" />
          <span className="flex-1">{formatDate(value, { weekday: true })}</span>
        </button>
      }
    >
      <MiniCalendar
        value={value}
        onChange={(d) => {
          onChange(d)
          setOpen(false)
        }}
      />
    </Popover>
  )
}
