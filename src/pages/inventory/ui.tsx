import { Command } from 'cmdk'
import { useMemo, useState } from 'react'
import { I, Icon } from '@/components/icons'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Money } from '@/components/ui/misc'
import { Popover } from '@/components/ui/popover'
import { cn } from '@/lib/cn'
import { formatQty, isLow, type Product } from './data'
import { useInventory } from './store'

/** Money that keeps dirams for cheap consumables (0.30 TJS a neck strip). */
export function Price({ value, className }: { value: number; className?: string }) {
  return <Money value={value} decimals={!Number.isInteger(value)} className={className} />
}

export function TypeBadges({ p }: { p: Product }) {
  if (p.archived) return <Badge>Archived</Badge>
  return (
    <span className="flex flex-wrap gap-1">
      {p.forSale && <Badge tone="accent">For sale</Badge>}
      {p.consumable && <Badge>Consumable</Badge>}
      {p.sterile && <Badge tone="positive">Sterile</Badge>}
    </span>
  )
}

/** Quiet level bar: gray when fine, amber when below minimum. */
export function LevelBar({ value, max, low, className }: { value: number; max: number; low: boolean; className?: string }) {
  const pct = Math.max(2, Math.min(100, (value / max) * 100))
  return (
    <div className={cn('h-1 w-full overflow-hidden rounded-full bg-fill-active', className)}>
      <div className={cn('h-full rounded-full', low ? 'bg-warning' : 'bg-faint')} style={{ width: `${pct}%` }} />
    </div>
  )
}

/** Quantity on hand with a thin bar against twice the minimum. */
export function StockCell({ p }: { p: Product }) {
  const low = isLow(p)
  return (
    <div className="w-44">
      <div className={cn('text-base whitespace-nowrap tabular', low ? 'font-medium text-warning' : 'text-fg')}>
        {formatQty(p.stock, p.unit)}
        {p.min > 0 && <span className="font-normal text-faint"> / min {formatQty(p.min, p.unit).split(' ')[0]}</span>}
      </div>
      {p.min > 0 && <LevelBar value={p.stock} max={p.min * 2} low={low} className="mt-1.5 w-32" />}
    </div>
  )
}

/** Search products by name, SKU or barcode and add one to a list. */
export function ProductSearch({
  onSelect,
  exclude = [],
  filter,
  label = 'Add product',
  placeholder = 'Name, SKU or barcode',
}: {
  onSelect: (id: string) => void
  exclude?: string[]
  filter?: (p: Product) => boolean
  label?: string
  placeholder?: string
}) {
  const products = useInventory((s) => s.products)
  const [open, setOpen] = useState(false)
  const [q, setQ] = useState('')
  const list = useMemo(() => {
    const s = q.trim().toLowerCase()
    return products
      .filter((p) => !p.archived && !exclude.includes(p.id) && (!filter || filter(p)))
      .filter((p) => !s || p.name.toLowerCase().includes(s) || p.sku.toLowerCase().includes(s) || p.barcode.includes(s))
      .slice(0, 8)
  }, [products, q, exclude, filter])

  return (
    <Popover
      open={open}
      onOpenChange={(o) => {
        setOpen(o)
        if (!o) setQ('')
      }}
      className="w-96 overflow-hidden p-0"
      trigger={
        <Button size="sm" variant="secondary" icon={I.add}>
          {label}
        </Button>
      }
    >
      <Command shouldFilter={false} loop>
        <div className="flex items-center gap-2 border-b border-border px-3">
          <Icon icon={I.search} size={16} className="text-faint" />
          <Command.Input
            autoFocus
            value={q}
            onValueChange={setQ}
            placeholder={placeholder}
            className="h-11 flex-1 bg-transparent text-base text-fg outline-none placeholder:text-faint"
          />
        </div>
        <Command.List className="max-h-80 overflow-y-auto p-1">
          {list.map((p) => (
            <Command.Item
              key={p.id}
              value={p.id}
              onSelect={() => {
                onSelect(p.id)
                setOpen(false)
                setQ('')
              }}
              className="flex cursor-default items-center gap-3 rounded-lg px-2.5 py-2 outline-none data-[selected=true]:bg-fill"
            >
              <span className="min-w-0 flex-1">
                <span className="block truncate text-base text-fg">{p.name}</span>
                <span className="block text-sm text-muted tabular">{p.sku}</span>
              </span>
              <span className={cn('text-sm tabular', isLow(p) ? 'text-warning' : 'text-faint')}>{formatQty(p.stock, p.unit)}</span>
            </Command.Item>
          ))}
          {!list.length && <div className="px-3 py-3 text-base text-muted">No products match “{q}”.</div>}
        </Command.List>
      </Command>
    </Popover>
  )
}

/** Clickable KPI tile used on the Stock tab; same affordance as the Home tiles. */
export function StatTile({
  label,
  children,
  sub,
  onClick,
  active,
}: {
  label: string
  children: React.ReactNode
  sub: React.ReactNode
  onClick?: () => void
  active?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'press group block rounded-2xl bg-surface p-5 text-left ring-1 hover:bg-fill/50',
        active ? 'ring-fg' : 'ring-border',
      )}
    >
      <div className="flex items-center justify-between">
        <span className="text-base text-muted">{label}</span>
        <Icon icon={I.arrowUpRight} size={16} className="text-faint transition-colors group-hover:text-fg" />
      </div>
      <div className="mt-3 text-3xl font-normal text-fg">{children}</div>
      <div className="mt-1.5 text-sm text-muted">{sub}</div>
    </button>
  )
}
