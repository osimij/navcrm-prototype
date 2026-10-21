import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router'
import { I } from '@/components/icons'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { EmptyState, Figure, Money } from '@/components/ui/misc'
import { Toolbar } from '@/components/ui/page'
import { Table, TableFooter, TD, TH, THead, TR } from '@/components/ui/table'
import { Segmented } from '@/components/ui/tabs'
import { cn } from '@/lib/cn'
import { formatTime, plural } from '@/lib/format'
import { NOW } from '@/lib/time'
import { isLow, needsRecount, supplierById } from './data'
import { stockValue, useInventory } from './store'
import { StatTile, StockCell } from './ui'

type Filter = 'all' | 'low' | 'recount'

export function StockTab() {
  const products = useInventory((s) => s.products)
  const openProduct = useInventory((s) => s.openProduct)
  const navigate = useNavigate()
  const [filter, setFilter] = useState<Filter>('all')

  const live = useMemo(() => products.filter((p) => !p.archived), [products])
  const low = live.filter(isLow)
  const recount = live.filter(needsRecount)
  const lowSuppliers = new Set(low.map((p) => p.supplierId)).size
  const list = (filter === 'low' ? low : filter === 'recount' ? recount : live)
    .slice()
    .sort((a, b) => Number(isLow(b)) - Number(isLow(a)) || Number(needsRecount(b)) - Number(needsRecount(a)))

  return (
    <>
      <div className="mb-5 grid gap-4 sm:grid-cols-3">
        <StatTile label="Stock value" sub="At purchase prices, all stores" onClick={() => setFilter('all')}>
          <Figure value={stockValue(products)} money />
          <span className="ml-1.5 text-sm text-faint">TJS</span>
        </StatTile>
        <StatTile
          label="Below minimum"
          sub={`From ${plural(lowSuppliers, 'supplier')}, ready to order`}
          onClick={() => setFilter('low')}
          active={filter === 'low'}
        >
          <Figure value={low.length} />
        </StatTile>
        <StatTile label="Needs recount" sub="Not counted in 45 days, or a mismatch" onClick={() => setFilter('recount')} active={filter === 'recount'}>
          <Figure value={recount.length} />
        </StatTile>
      </div>

      <Toolbar>
        <Segmented
          value={filter}
          onChange={setFilter}
          items={[
            { value: 'all', label: 'All' },
            { value: 'low', label: `Low · ${low.length}` },
            { value: 'recount', label: `Recount · ${recount.length}` },
          ]}
        />
        <span className="ml-auto text-sm text-faint">Data as of {formatTime(NOW)}</span>
        <Button size="sm" icon={I.add} onClick={() => navigate('/inventory/documents/new/receipt')}>
          New receipt
        </Button>
      </Toolbar>

      <Card>
        {list.length ? (
          <>
            <Table>
              <THead>
                <TH>Product</TH>
                <TH>In stock</TH>
                <TH align="right">Value</TH>
                <TH>Last counted</TH>
                <TH>Status</TH>
                <TH />
              </THead>
              <tbody>
                {list.map((p) => {
                  const lowNow = isLow(p)
                  const recountNow = needsRecount(p)
                  return (
                    <TR key={p.id} onClick={() => openProduct(p.id)}>
                      <TD className="h-16">
                        <div className="truncate">{p.name}</div>
                        <div className="text-sm text-muted">
                          {p.store === 'retail' ? 'Retail' : 'Consumables'} · {supplierById[p.supplierId].name}
                        </div>
                      </TD>
                      <TD>
                        <StockCell p={p} />
                      </TD>
                      <TD align="right">
                        <Money value={p.stock * p.purchase} />
                      </TD>
                      <TD>
                        <span className={cn('text-base', p.countedDaysAgo > 45 ? 'text-warning' : 'text-muted')}>
                          {p.countedDaysAgo === 0 ? 'Today' : `${p.countedDaysAgo} days ago`}
                        </span>
                        {p.mismatch && <div className="text-sm text-muted">Mismatch at last write-off</div>}
                      </TD>
                      <TD>
                        <span className="flex gap-1">
                          {lowNow && <Badge tone="warning">Below minimum</Badge>}
                          {recountNow && <Badge>Recount</Badge>}
                          {!lowNow && !recountNow && <span className="text-faint">OK</span>}
                        </span>
                      </TD>
                      <TD align="right" className="w-28">
                        {lowNow ? (
                          <Button size="sm" variant="secondary" onClick={(e) => (e.stopPropagation(), navigate('/inventory/orders'))}>
                            Order
                          </Button>
                        ) : recountNow ? (
                          <Button size="sm" variant="secondary" onClick={(e) => (e.stopPropagation(), navigate('/inventory/documents/new/stocktake'))}>
                            Count
                          </Button>
                        ) : null}
                      </TD>
                    </TR>
                  )
                })}
              </tbody>
            </Table>
            <TableFooter>
              <span>{plural(list.length, 'product')}</span>
            </TableFooter>
          </>
        ) : (
          <EmptyState icon={I.checkCircle} title={filter === 'low' ? 'Nothing is below minimum' : 'Everything has been counted recently'} description="Stock is in good shape." />
        )}
      </Card>
    </>
  )
}
