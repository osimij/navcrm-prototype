import { useMemo, useState, type PointerEvent } from 'react'
import { cn } from '@/lib/cn'
import { useWidth } from './use-width'

export type LinePoint = { value: number; projected?: boolean }

/**
 * Scrubbable line chart. Drag or hover across it and `onScrub` reports the
 * nearest point, so a headline number can count to that day.
 * Projected points (e.g. the rest of today from bookings) draw dashed.
 */
export function LineChart({
  points,
  height = 160,
  onScrub,
  ticks,
  zero = false,
  className,
  dataKey,
  area = false,
}: {
  points: LinePoint[]
  height?: number
  onScrub?: (index: number | null) => void
  /** Labels under the chart at given point indexes. */
  ticks?: { index: number; label: string }[]
  /** Start the y axis at zero (cumulative values). */
  zero?: boolean
  className?: string
  /** Changes when the dataset changes, to fade the new line in. */
  dataKey?: string
  area?: boolean
}) {
  const [ref, width] = useWidth<HTMLDivElement>()
  const [active, setActive] = useState<number | null>(null)
  const padTop = 10
  const padBottom = 6
  const inner = height - padTop - padBottom

  const { xs, ys } = useMemo(() => {
    const vals = points.map((p) => p.value)
    const max = Math.max(...vals, 1)
    const min = zero ? 0 : Math.min(...vals)
    const span = max - min || 1
    const lo = zero ? 0 : min - span * 0.25
    const hi = max + span * 0.12
    const n = points.length
    const xs = points.map((_, i) => (n === 1 ? width / 2 : (i / (n - 1)) * width))
    const ys = points.map((p) => padTop + inner - ((p.value - lo) / (hi - lo)) * inner)
    return { xs, ys }
  }, [points, width, zero, inner])

  const lastSolid = points.reduce((m, p, i) => (p.projected ? m : i), 0)
  const solid = xs
    .slice(0, lastSolid + 1)
    .map((x, i) => `${i ? 'L' : 'M'}${x.toFixed(1)},${ys[i].toFixed(1)}`)
    .join('')
  const projected =
    lastSolid < points.length - 1
      ? xs
          .slice(lastSolid)
          .map((x, i) => `${i ? 'L' : 'M'}${x.toFixed(1)},${ys[lastSolid + i].toFixed(1)}`)
          .join('')
      : ''
  const areaPath = solid && `${solid}L${xs[lastSolid].toFixed(1)},${height}L0,${height}Z`

  function handleMove(e: PointerEvent<HTMLDivElement>) {
    if (!width) return
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    let best = 0
    for (let i = 1; i < xs.length; i++) if (Math.abs(xs[i] - x) < Math.abs(xs[best] - x)) best = i
    if (best !== active) {
      setActive(best)
      onScrub?.(best)
    }
  }
  function handleLeave() {
    setActive(null)
    onScrub?.(null)
  }

  return (
    <div className={cn('select-none', className)}>
      <div
        ref={ref}
        className="relative touch-none"
        style={{ height }}
        onPointerMove={handleMove}
        onPointerDown={handleMove}
        onPointerLeave={handleLeave}
      >
        {width > 0 && (
          <svg width={width} height={height} className="absolute inset-0 overflow-visible" aria-hidden>
            {[0.15, 0.5, 0.85].map((f) => (
              <line
                key={f}
                x1={0}
                x2={width}
                y1={padTop + inner * f}
                y2={padTop + inner * f}
                stroke="var(--border-strong)"
                strokeDasharray="2 5"
                strokeLinecap="round"
              />
            ))}
            <g key={dataKey} className="chart-fade">
              {area && areaPath && <path d={areaPath} fill="url(#lc-area)" />}
              <path d={solid} fill="none" stroke="var(--fg)" strokeWidth={1.75} strokeLinejoin="round" strokeLinecap="round" />
              {projected && (
                <path
                  d={projected}
                  fill="none"
                  stroke="var(--faint)"
                  strokeWidth={1.5}
                  strokeDasharray="3 5"
                  strokeLinecap="round"
                />
              )}
              {lastSolid < points.length - 1 && active == null && (
                <circle cx={xs[lastSolid]} cy={ys[lastSolid]} r={3.5} fill="var(--accent)" stroke="var(--surface)" strokeWidth={2} />
              )}
            </g>
            <defs>
              <linearGradient id="lc-area" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0" stopColor="var(--fg)" stopOpacity="0.06" />
                <stop offset="1" stopColor="var(--fg)" stopOpacity="0" />
              </linearGradient>
            </defs>
            {active != null && (
              <g>
                <line x1={xs[active]} x2={xs[active]} y1={0} y2={height} stroke="var(--border-strong)" />
                <circle
                  cx={xs[active]}
                  cy={ys[active]}
                  r={4.5}
                  fill="var(--surface)"
                  stroke={points[active].projected ? 'var(--faint)' : 'var(--fg)'}
                  strokeWidth={2}
                />
              </g>
            )}
          </svg>
        )}
      </div>
      {ticks && width > 0 && (
        <div className="relative mt-2 h-4 text-xs text-faint">
          {ticks.map((t) => {
            const x = xs[t.index] ?? 0
            const edge = t.index === 0 ? 'left' : t.index === points.length - 1 ? 'right' : 'center'
            return (
              <span
                key={t.index}
                className="absolute top-0 whitespace-nowrap tabular"
                style={
                  edge === 'left'
                    ? { left: 0 }
                    : edge === 'right'
                      ? { right: 0 }
                      : { left: x, transform: 'translateX(-50%)' }
                }
              >
                {t.label}
              </span>
            )
          })}
        </div>
      )}
    </div>
  )
}
