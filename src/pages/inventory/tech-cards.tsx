import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { I, Icon } from '@/components/icons'
import { Button, IconButton } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { StatCard } from '@/components/ui/stat-card'
import { Sheet } from '@/components/ui/dialog'
import { Input, SearchInput } from '@/components/ui/input'
import { EmptyState, Money } from '@/components/ui/misc'
import { Toolbar } from '@/components/ui/page'
import { Table, TableFooter, TD, TH, THead, TR } from '@/components/ui/table'
import { Segmented } from '@/components/ui/tabs'
import { services, type Service } from '@/data/services'
import { cn } from '@/lib/cn'
import { formatDuration, formatPercent, plural } from '@/lib/format'
import { formatQty, isLow, usageUnit, type Product, type TechLine } from './data'
import { useInventory } from './store'
import { Price, ProductSearch } from './ui'

type Filter = 'all' | 'with' | 'without'

export function lineCost(p: Product, qty: number) {
  return (qty / usageUnit(p).factor) * p.purchase
}

export function TechCardsTab() {
  const techCards = useInventory((s) => s.techCards)
  const products = useInventory((s) => s.products)
  const [filter, setFilter] = useState<Filter>('all')
  const [q, setQ] = useState('')
  const [openId, setOpenId] = useState<string | null>(null)
  const byId = useMemo(() => Object.fromEntries(products.map((p) => [p.id, p])), [products])

  const cost = (sid: string) => (techCards[sid] ?? []).reduce((m, l) => m + lineCost(byId[l.productId], l.qty), 0)
  const withCard = services.filter((s) => techCards[s.id]?.length)
  const list = services.filter((s) => {
    const has = !!techCards[s.id]?.length
    if (filter === 'with' && !has) return false
    if (filter === 'without' && has) return false
    return !q.trim() || s.name.toLowerCase().includes(q.trim().toLowerCase())
  })

  return (
    <>
      <Toolbar>
        <Segmented
          value={filter}
          onChange={setFilter}
          items={[
            { value: 'all', label: 'All' },
            { value: 'with', label: `With card · ${withCard.length}` },
            { value: 'without', label: `Without · ${services.length - withCard.length}` },
          ]}
        />
        <SearchInput value={q} onChange={setQ} placeholder="Service" className="w-full sm:w-60" />
        <p className="ml-auto max-w-md text-sm text-muted">
          When a visit is completed, its consumables are written off from the master’s station first, then from Consumables.
        </p>
      </Toolbar>

      <Card>
        {list.length ? (
          <>
            <Table>
              <THead>
                <TH>Service</TH>
                <TH>Consumables</TH>
                <TH align="right">Cost per visit</TH>
                <TH align="right">Share of price</TH>
                <TH align="right">Price</TH>
              </THead>
              <tbody>
                {list.map((s) => {
                  const lines = techCards[s.id] ?? []
                  const c = cost(s.id)
                  const runningLow = lines.some((l) => isLow(byId[l.productId]))
                  return (
                    <TR key={s.id} onClick={() => setOpenId(s.id)}>
                      <TD>
                        <span className="flex items-center gap-2.5">
                          <span className="size-2 shrink-0 rounded-full" style={{ background: `var(--c-${s.color})` }} />
                          <span className="truncate">{s.name}</span>
                        </span>
                        <span className="ml-[18px] block text-sm text-muted">
                          {s.category} · {formatDuration(s.duration)}
                        </span>
                      </TD>
                      <TD>
                        {lines.length ? (
                          <span className="flex items-center gap-2">
                            <span className="text-fg">{plural(lines.length, 'item')}</span>
                            {runningLow && (
                              <span className="flex items-center gap-1 text-sm text-warning">
                                <Icon icon={I.alert} size={14} />
                                one is low
                              </span>
                            )}
                          </span>
                        ) : (
                          <span className="text-faint">No card yet</span>
                        )}
                      </TD>
                      <TD align="right">{lines.length ? <Money value={c} decimals /> : <span className="text-faint">—</span>}</TD>
                      <TD align="right" muted>
                        {lines.length ? formatPercent((c / s.price) * 100, 1) : '—'}
                      </TD>
                      <TD align="right">
                        <Money value={s.price} />
                      </TD>
                    </TR>
                  )
                })}
              </tbody>
            </Table>
            <TableFooter>
              <span>{plural(list.length, 'service')}</span>
            </TableFooter>
          </>
        ) : (
          <EmptyState icon={I.scissors} title="No services match" />
        )}
      </Card>

      <TechCardSheet service={services.find((s) => s.id === openId)} onClose={() => setOpenId(null)} />
    </>
  )
}

function TechCardSheet({ service, onClose }: { service?: Service; onClose: () => void }) {
  const techCards = useInventory((s) => s.techCards)
  const products = useInventory((s) => s.products)
  const setTechCard = useInventory((s) => s.setTechCard)
  const byId = useMemo(() => Object.fromEntries(products.map((p) => [p.id, p])), [products])
  const [shown, setShown] = useState<Service | undefined>(service)
  const [lines, setLines] = useState<(TechLine & { input: string })[]>([])

  useEffect(() => {
    if (!service) return
    setShown(service)
    setLines((techCards[service.id] ?? []).map((l) => ({ ...l, input: String(l.qty) })))
  }, [service, techCards])

  const s = service ?? shown
  const num = (v: string) => Number(v.replace(',', '.')) || 0
  const total = lines.reduce((m, l) => m + lineCost(byId[l.productId], num(l.input)), 0)

  return (
    <Sheet
      open={!!service}
      onOpenChange={(o) => !o && onClose()}
      eyebrow="Tech card"
      title={s?.name}
      width="xl"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            className="ml-auto"
            onClick={() => {
              if (!s) return
              setTechCard(
                s.id,
                lines.filter((l) => num(l.input) > 0).map((l) => ({ productId: l.productId, qty: num(l.input) })),
              )
              toast.success(`Tech card saved for ${s.name}`, { description: 'Applies to visits completed from now on.' })
              onClose()
            }}
          >
            Save tech card
          </Button>
        </>
      }
    >
      {s && (
        <div className="flex flex-col gap-6 px-5 py-5">
          <p className="text-base text-muted">
            What one visit uses. It’s written off automatically when the visit is marked completed, so stock and service costs stay accurate without counting by hand.
          </p>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <h3 className="text-sm font-medium text-muted">Per visit</h3>
              <ProductSearch
                label="Add item"
                onSelect={(id) => setLines((l) => [...l, { productId: id, qty: 1, input: '1' }])}
                exclude={lines.map((l) => l.productId)}
                filter={(p) => p.consumable}
              />
            </div>
            {lines.length ? (
              <ul className="overflow-hidden rounded-xl ring-1 ring-border">
                {lines.map((l) => {
                  const p = byId[l.productId]
                  const u = usageUnit(p)
                  return (
                    <li key={l.productId} className="flex items-center gap-3 border-b border-border px-4 py-2.5 last:border-b-0">
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-base text-fg">{p.name}</span>
                        <span className={cn('block text-sm', isLow(p) ? 'text-warning' : 'text-muted')}>
                          {formatQty(p.stock, p.unit)} in stock
                          {p.content && ` · ${formatQty(p.content.qty, p.content.unit)} each`}
                        </span>
                      </span>
                      <Input
                        value={l.input}
                        onChange={(e) => setLines((x) => x.map((y) => (y.productId === l.productId ? { ...y, input: e.target.value } : y)))}
                        inputMode="decimal"
                        suffix={u.unit}
                        className="w-28 text-right tabular"
                        aria-label={`Quantity of ${p.name}`}
                      />
                      <Price value={Math.round(lineCost(p, num(l.input)) * 100) / 100} className="w-20 text-right text-sm text-muted" />
                      <IconButton
                        icon={I.delete}
                        label="Remove"
                        size="sm"
                        tooltip={false}
                        onClick={() => setLines((x) => x.filter((y) => y.productId !== l.productId))}
                      />
                    </li>
                  )
                })}
              </ul>
            ) : (
              <div className="rounded-xl bg-fill px-4 py-6 text-center text-base text-muted">
                No consumables yet. Add what a master uses for one {s.name.toLowerCase()}.
              </div>
            )}
          </div>

          <div className="grid grid-cols-3 gap-3">
            <StatCard size="sm" className="rounded-xl bg-fill p-3 ring-0" valueClassName="text-lg" label="Consumables" value={<Money value={Math.round(total * 100) / 100} decimals />} />
            <StatCard size="sm" className="rounded-xl bg-fill p-3 ring-0" valueClassName="text-lg" label="Service price" value={<Money value={s.price} />} />
            <StatCard size="sm" className="rounded-xl bg-fill p-3 ring-0" valueClassName="text-lg" label="Left after" value={<Money value={Math.round((s.price - total) * 100) / 100} decimals />} />
          </div>
        </div>
      )}
    </Sheet>
  )
}
