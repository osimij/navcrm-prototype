import { useState } from 'react'
import { cn } from '@/lib/cn'
import { useWidth } from './use-width'

export type Bar = { label: string; value: number; secondary?: number; muted?: boolean }

/**
 * Vertical bars with an optional stacked secondary value. Hover shows the value
 * through `renderTooltip`; no decorative motion since this is data people read.
 */
export function BarChart({
  bars,
  height = 180,
  className,
  renderTooltip,
  showLabels = true,
  labelEvery = 1,
}: {
  bars: Bar[]
  height?: number
  className?: string
  renderTooltip?: (bar: Bar, index: number) => React.ReactNode
  showLabels?: boolean
  labelEvery?: number
}) {
  const [ref, width] = useWidth<HTMLDivElement>()
  const [active, setActive] = useState<number | null>(null)
  const max = Math.max(...bars.map((b) => b.value + (b.secondary ?? 0)), 1) * 1.08
  const gap = bars.length > 20 ? 3 : bars.length > 10 ? 6 : 10
  const bw = width ? Math.max(2, (width - gap * (bars.length - 1)) / bars.length) : 0

  return (
    <div className={cn('select-none', className)}>
      <div ref={ref} className="relative" style={{ height }} onPointerLeave={() => setActive(null)}>
        {width > 0 &&
          bars.map((b, i) => {
            const h1 = (b.value / max) * height
            const h2 = ((b.secondary ?? 0) / max) * height
            const x = i * (bw + gap)
            const dim = active != null && active !== i
            return (
              <div
                key={i}
                className="absolute bottom-0 flex flex-col justify-end"
                style={{ left: x, width: bw, height }}
                onPointerEnter={() => setActive(i)}
              >
                {h2 > 0 && (
                  <div
                    className={cn('w-full rounded-t-[4px] bg-chart-soft transition-opacity duration-150', dim && 'opacity-40')}
                    style={{ height: h2 }}
                  />
                )}
                <div
                  className={cn(
                    'w-full transition-opacity duration-150',
                    h2 > 0 ? '' : 'rounded-t-[4px]',
                    b.muted ? 'bg-fill-active' : 'bg-chart',
                    dim && 'opacity-30',
                  )}
                  style={{ height: Math.max(h1, b.value > 0 ? 2 : 0) }}
                />
                {active === i && renderTooltip && (
                  <div
                    className="pointer-events-none absolute z-10 -translate-x-1/2 rounded-lg bg-fg px-2 py-1 text-xs font-medium whitespace-nowrap text-bg shadow-sm"
                    style={{ left: bw / 2, bottom: h1 + h2 + 8 }}
                  >
                    {renderTooltip(b, i)}
                  </div>
                )}
              </div>
            )
          })}
      </div>
      {showLabels && width > 0 && (
        <div className="relative mt-2 h-4 text-xs text-faint">
          {bars.map((b, i) =>
            i % labelEvery === 0 ? (
              <span
                key={i}
                className="absolute top-0 -translate-x-1/2 whitespace-nowrap tabular"
                style={{ left: i * (bw + gap) + bw / 2 }}
              >
                {b.label}
              </span>
            ) : null,
          )}
        </div>
      )}
    </div>
  )
}

export function Sparkline({ values, className, height = 28, width = 88 }: { values: number[]; className?: string; height?: number; width?: number }) {
  const max = Math.max(...values)
  const min = Math.min(...values)
  const span = max - min || 1
  const d = values
    .map((v, i) => `${i ? 'L' : 'M'}${((i / (values.length - 1)) * width).toFixed(1)},${(height - 2 - ((v - min) / span) * (height - 4)).toFixed(1)}`)
    .join('')
  return (
    <svg width={width} height={height} className={className} aria-hidden>
      <path d={d} fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  )
}
