import { useRef, useState, type ReactNode } from 'react'
import { toast } from 'sonner'
import { I, Icon } from '@/components/icons'
import { Button, IconButton } from '@/components/ui/button'
import { Input, fieldBase } from '@/components/ui/input'
import { LABEL_COLORS, type LabelColor } from '@/data/business'
import { cn } from '@/lib/cn'
import { seeded } from '@/lib/random'
import { EditLink } from '../ui'

/** Form state with a saved copy, so the SaveBar only shows real changes. */
export function useDraft<T>(initial: T) {
  const [saved, setSaved] = useState(initial)
  const [draft, setDraft] = useState(initial)
  const dirty = JSON.stringify(saved) !== JSON.stringify(draft)
  return {
    draft,
    setDraft,
    dirty,
    patch: (p: Partial<T>) => setDraft((d) => ({ ...d, ...p })),
    save: (message = 'Changes saved') => {
      setSaved(draft)
      toast.success(message)
    },
    discard: () => setDraft(saved),
  }
}

/** Value with Mercury's "Edit ›" link that turns into an input in place. */
export function InlineText({
  value,
  onSave,
  placeholder = 'Not set',
  inputMode,
}: {
  value: string
  onSave: (v: string) => void
  placeholder?: string
  inputMode?: 'text' | 'email' | 'tel' | 'numeric'
}) {
  const [editing, setEditing] = useState(false)
  const [v, setV] = useState(value)
  if (!editing) {
    return (
      <div>
        <div className={value ? 'text-fg' : 'text-faint'}>{value || placeholder}</div>
        <EditLink
          onClick={() => {
            setV(value)
            setEditing(true)
          }}
        />
      </div>
    )
  }
  return (
    <form
      className="flex flex-col gap-2"
      onSubmit={(e) => {
        e.preventDefault()
        onSave(v.trim())
        setEditing(false)
        toast.success('Saved')
      }}
      onKeyDown={(e) => e.key === 'Escape' && (e.stopPropagation(), setEditing(false))}
    >
      <Input autoFocus value={v} inputMode={inputMode} onChange={(e) => setV(e.target.value)} />
      <div className="flex gap-2">
        <Button size="sm" variant="primary" type="submit">
          Save
        </Button>
        <Button size="sm" variant="ghost" onClick={() => setEditing(false)}>
          Cancel
        </Button>
      </div>
    </form>
  )
}

/** Calendar label colors (staff, services). */
export function LabelSwatches({ value, onChange }: { value: LabelColor; onChange: (c: LabelColor) => void }) {
  return (
    <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Color">
      {LABEL_COLORS.map((c) => (
        <button
          key={c}
          type="button"
          role="radio"
          aria-checked={value === c}
          aria-label={c}
          onClick={() => onChange(c)}
          className={cn(
            'press grid size-7 place-items-center rounded-full ring-offset-2 ring-offset-raised',
            value === c && 'ring-2 ring-fg',
          )}
          style={{ background: `var(--c-${c})` }}
        >
          {value === c && <Icon icon={I.check} size={14} strokeWidth={2.4} className="text-white" />}
        </button>
      ))}
    </div>
  )
}

/** Brand colors are real hex values: they go on the booking page and receipts. */
export function HexSwatches({ value, onChange, colors }: { value: string; onChange: (c: string) => void; colors: string[] }) {
  return (
    <div className="flex flex-wrap gap-2" role="radiogroup">
      {colors.map((c) => (
        <button
          key={c}
          type="button"
          role="radio"
          aria-checked={value === c}
          aria-label={c}
          onClick={() => onChange(c)}
          className={cn('press grid size-8 place-items-center rounded-full ring-offset-2 ring-offset-bg', value === c && 'ring-2 ring-fg')}
          style={{ background: c }}
        >
          {value === c && <Icon icon={I.check} size={14} strokeWidth={2.4} className={isLight(c) ? 'text-[#0b0b10]' : 'text-white'} />}
        </button>
      ))}
    </div>
  )
}

function isLight(hex: string) {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16))
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.7
}

export async function copy(text: string, what = 'Copied') {
  try {
    await navigator.clipboard.writeText(text)
  } catch {
    /* clipboard can be blocked; the toast still confirms intent */
  }
  toast.success(what)
}

/** Read-only value with a copy button: links, scripts, IDs. */
export function CopyField({ value, mono, className }: { value: string; mono?: boolean; className?: string }) {
  return (
    <div className={cn(fieldBase, 'flex h-9 items-center gap-2 pr-1 pl-3 hover:ring-transparent', className)}>
      <span className={cn('min-w-0 flex-1 truncate', mono && 'font-mono text-sm')}>{value}</span>
      <IconButton icon={I.copy} label="Copy" size="xs" onClick={() => copy(value)} />
    </div>
  )
}

export function CodeBlock({ code }: { code: string }) {
  return (
    <div className="relative rounded-xl bg-fill">
      <pre className="overflow-x-auto p-4 pr-12 font-mono text-[12.5px] leading-5 text-fg">{code}</pre>
      <IconButton icon={I.copy} label="Copy code" size="sm" className="absolute top-2 right-2" onClick={() => copy(code, 'Code copied')} />
    </div>
  )
}

/** Dashed drop target that opens the file picker. */
export function UploadTile({ title, hint, children, className }: { title: string; hint?: string; children?: ReactNode; className?: string }) {
  const ref = useRef<HTMLInputElement>(null)
  return (
    <button
      type="button"
      onClick={() => ref.current?.click()}
      className={cn(
        'press flex w-full items-center gap-3 rounded-xl border border-dashed border-border-strong p-3 text-left hover:bg-fill',
        className,
      )}
    >
      {children ?? (
        <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-fill text-muted">
          <Icon icon={I.upload} size={18} />
        </span>
      )}
      <span className="min-w-0">
        <span className="block text-base text-fg">{title}</span>
        {hint && <span className="block text-sm text-muted">{hint}</span>}
      </span>
      <input
        ref={ref}
        type="file"
        hidden
        onChange={(e) => {
          const f = e.target.files?.[0]
          if (f) toast.success(`${f.name} uploaded`)
        }}
      />
    </button>
  )
}

/** A believable QR pattern for the prototype (not scannable). */
export function FakeQR({ value, size = 140 }: { value: string; size?: number }) {
  const n = 25
  let h = 0
  for (let i = 0; i < value.length; i++) h = (h * 31 + value.charCodeAt(i)) >>> 0
  const r = seeded(h)
  const cell = size / n
  const finder = (x: number, y: number) => {
    const inBox = (ox: number, oy: number) => x >= ox && x < ox + 7 && y >= oy && y < oy + 7
    for (const [ox, oy] of [
      [0, 0],
      [n - 7, 0],
      [0, n - 7],
    ]) {
      if (inBox(ox, oy)) {
        const dx = x - ox
        const dy = y - oy
        const ring = dx === 0 || dy === 0 || dx === 6 || dy === 6
        const core = dx >= 2 && dx <= 4 && dy >= 2 && dy <= 4
        return ring || core ? 1 : 0
      }
    }
    return -1
  }
  const rects: ReactNode[] = []
  for (let y = 0; y < n; y++)
    for (let x = 0; x < n; x++) {
      const f = finder(x, y)
      const on = f === -1 ? r.chance(0.48) : f === 1
      if (on) rects.push(<rect key={`${x}-${y}`} x={x * cell} y={y * cell} width={cell + 0.2} height={cell + 0.2} />)
    }
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="rounded-md bg-white p-2" aria-label="QR code">
      <g fill="#0b0b10">{rects}</g>
    </svg>
  )
}

export function timeOptions(from = 7, to = 23, step = 30) {
  const out: { value: string; label: string }[] = []
  for (let m = from * 60; m <= to * 60; m += step) {
    const t = `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`
    out.push({ value: t, label: t })
  }
  return out
}

export const WEEKDAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

/** Numbered or checked step marker used in checklists. */
export function StepMark({ n, done, active }: { n: number; done?: boolean; active?: boolean }) {
  return (
    <span
      className={cn(
        'grid size-7 shrink-0 place-items-center rounded-full text-sm font-medium',
        done ? 'bg-positive text-white' : active ? 'bg-accent text-on-accent' : 'bg-surface text-muted ring-1 ring-border',
      )}
    >
      {done ? <Icon icon={I.check} size={14} strokeWidth={2.4} /> : n}
    </span>
  )
}
