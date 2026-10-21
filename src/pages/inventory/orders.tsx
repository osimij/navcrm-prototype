import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { I } from '@/components/icons'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardHeader } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/controls'
import { DetailRow, Sheet } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { EmptyState, Money } from '@/components/ui/misc'
import { Table, TableFooter, TD, TH, THead, TR } from '@/components/ui/table'
import { formatDate, formatDayTime, formatPhone, plural } from '@/lib/format'
import { NOW } from '@/lib/time'
import { formatQty, isLow, orderTotal, suggestedQty, supplierById, type OrderStatus, type SupplierOrder } from './data'
import { useInventory } from './store'
import { Price } from './ui'

const STATUS: Record<OrderStatus, { label: string; tone: 'accent' | 'positive' | 'neutral' }> = {
  sent: { label: 'Sent', tone: 'accent' },
  received: { label: 'Received', tone: 'positive' },
  draft: { label: 'Draft', tone: 'neutral' },
}

export function OrdersTab() {
  const products = useInventory((s) => s.products)
  const orders = useInventory((s) => s.orders)
  const addOrders = useInventory((s) => s.addOrders)
  const [openId, setOpenId] = useState<string | null>(null)

  // Products already on an order that hasn't arrived don't need ordering again.
  const onOrder = useMemo(
    () => new Set(orders.filter((o) => o.status === 'sent').flatMap((o) => o.lines.map((l) => l.productId))),
    [orders],
  )
  const low = products.filter(isLow)
  const toOrder = low.filter((p) => !onOrder.has(p.id))

  const [picked, setPicked] = useState<Record<string, boolean>>({})
  const [qty, setQty] = useState<Record<string, string>>({})
  useEffect(() => {
    setPicked(Object.fromEntries(toOrder.map((p) => [p.id, true])))
    setQty(Object.fromEntries(toOrder.map((p) => [p.id, String(suggestedQty(p))])))
    // Reset when the set of products to order changes.
  }, [toOrder.map((p) => p.id).join()])

  const selected = toOrder.filter((p) => picked[p.id])
  const num = (v: string) => Number(v.replace(',', '.')) || 0
  const sum = selected.reduce((m, p) => m + num(qty[p.id] ?? '0') * p.purchase, 0)
  const bySupplier = selected.reduce<Record<string, typeof selected>>((m, p) => ((m[p.supplierId] ??= []).push(p), m), {})

  function create() {
    const base = Math.max(...orders.map((o) => Number(o.no.split('-')[1])))
    const created: SupplierOrder[] = Object.entries(bySupplier).map(([sid, items], i) => ({
      id: `o${Date.now()}${i}`,
      no: `PO-${String(base + i + 1).padStart(4, '0')}`,
      supplierId: sid,
      lines: items.map((p) => ({ productId: p.id, qty: num(qty[p.id]), cost: p.purchase })),
      status: 'sent',
      date: NOW,
    }))
    addOrders(created)
    toast.success(created.length === 1 ? `Order sent to ${supplierById[created[0].supplierId].name}` : `${created.length} orders sent`, {
      description: created.length > 1 ? created.map((o) => supplierById[o.supplierId].name).join(', ') : 'They’ll get it in Telegram and by email.',
    })
  }

  return (
    <div className="flex flex-col gap-5">
      <Card>
        <CardHeader
          title="Below minimum"
          description="Suggested quantities bring stock back to twice the minimum."
        />
        {low.length ? (
          <>
            <ul className="px-2 pb-2">
              {low.map((p) => {
                const ordered = onOrder.has(p.id)
                return (
                  <li key={p.id} className="flex items-center gap-4 rounded-xl px-3 py-2.5">
                    {ordered ? (
                      <span className="w-[18px]" />
                    ) : (
                      <Checkbox checked={!!picked[p.id]} onChange={(v) => setPicked((x) => ({ ...x, [p.id]: v }))} />
                    )}
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-base text-fg">{p.name}</span>
                      <span className="block text-sm text-muted">{supplierById[p.supplierId].name}</span>
                    </span>
                    <span className="w-28 text-sm text-warning tabular">
                      {formatQty(p.stock, p.unit)} of {formatQty(p.min, p.unit).split(' ')[0]}
                    </span>
                    {ordered ? (
                      <span className="flex w-56 justify-end">
                        <Badge tone="accent">On order</Badge>
                      </span>
                    ) : (
                      <>
                        <Input
                          value={qty[p.id] ?? ''}
                          onChange={(e) => setQty((x) => ({ ...x, [p.id]: e.target.value }))}
                          inputMode="decimal"
                          suffix={p.unit}
                          disabled={!picked[p.id]}
                          className="w-28 text-right tabular"
                          aria-label={`Quantity of ${p.name}`}
                        />
                        <Money value={num(qty[p.id] ?? '0') * p.purchase} className="w-24 text-right text-base" />
                      </>
                    )}
                  </li>
                )
              })}
            </ul>
            <div className="flex flex-wrap items-center gap-3 border-t border-border px-5 py-3.5">
              <span className="text-sm text-muted">
                {selected.length
                  ? `${plural(selected.length, 'product')} from ${plural(Object.keys(bySupplier).length, 'supplier')} · `
                  : 'Nothing selected'}
                {selected.length > 0 && <Money value={sum} className="text-fg" />}
              </span>
              <Button variant="primary" className="ml-auto" disabled={!selected.length} onClick={create}>
                {Object.keys(bySupplier).length > 1 ? `Create ${Object.keys(bySupplier).length} orders` : 'Create order'}
              </Button>
            </div>
          </>
        ) : (
          <EmptyState icon={I.checkCircle} title="Nothing to order" description="Every product is above its minimum." />
        )}
      </Card>

      <Card>
        <CardHeader title="Supplier orders" />
        <Table>
          <THead>
            <TH>No.</TH>
            <TH>Supplier</TH>
            <TH align="right">Items</TH>
            <TH align="right">Amount</TH>
            <TH>Status</TH>
            <TH>Sent</TH>
          </THead>
          <tbody>
            {orders.map((o) => (
              <TR key={o.id} onClick={() => setOpenId(o.id)}>
                <TD className="tabular">{o.no}</TD>
                <TD>{supplierById[o.supplierId].name}</TD>
                <TD align="right">{o.lines.length}</TD>
                <TD align="right">
                  <Money value={orderTotal(o)} />
                </TD>
                <TD>
                  <Badge tone={STATUS[o.status].tone} dot>
                    {STATUS[o.status].label}
                  </Badge>
                </TD>
                <TD muted>{formatDayTime(o.date)}</TD>
              </TR>
            ))}
          </tbody>
        </Table>
        <TableFooter>
          <span>{plural(orders.length, 'order')}</span>
        </TableFooter>
      </Card>

      <OrderSheet id={openId} onClose={() => setOpenId(null)} />
    </div>
  )
}

function OrderSheet({ id, onClose }: { id: string | null; onClose: () => void }) {
  const order = useInventory((s) => s.orders.find((o) => o.id === id))
  const products = useInventory((s) => s.products)
  const receiveOrder = useInventory((s) => s.receiveOrder)
  const [shown, setShown] = useState<SupplierOrder | undefined>(order)
  useEffect(() => {
    if (order) setShown(order)
  }, [order])
  const o = order ?? shown
  const byId = Object.fromEntries(products.map((p) => [p.id, p]))
  const supplier = o ? supplierById[o.supplierId] : null

  return (
    <Sheet
      open={!!order}
      onOpenChange={(v) => !v && onClose()}
      eyebrow="Supplier order"
      title={o?.no}
      footer={
        o?.status === 'sent' ? (
          <Button
            variant="primary"
            className="ml-auto"
            onClick={() => {
              receiveOrder(o.id)
              toast.success(`${o.no} received`, { description: 'Stock is updated and a receipt document was posted.' })
            }}
          >
            Mark as received
          </Button>
        ) : undefined
      }
    >
      {o && supplier && (
        <div className="flex flex-col gap-6 px-5 py-5">
          <div className="divide-y divide-border">
            <DetailRow label="Status">
              <Badge tone={STATUS[o.status].tone} dot>
                {STATUS[o.status].label}
              </Badge>
            </DetailRow>
            <DetailRow label="Supplier">{supplier.name}</DetailRow>
            <DetailRow label="Contact">
              {supplier.contact}
              <span className="block text-sm text-muted tabular">{formatPhone(supplier.phone)}</span>
            </DetailRow>
            <DetailRow label="Sent">{formatDate(o.date, { weekday: true })}</DetailRow>
          </div>
          <div className="overflow-hidden rounded-xl ring-1 ring-border">
            {o.lines.map((l) => {
              const p = byId[l.productId]
              return (
                <div key={l.productId} className="flex items-center gap-3 border-b border-border px-4 py-3 last:border-b-0">
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-base text-fg">{p?.name}</span>
                    <span className="block text-sm text-muted tabular">
                      {formatQty(l.qty, p?.unit ?? 'pcs')} × <Price value={l.cost} />
                    </span>
                  </span>
                  <Money value={l.qty * l.cost} />
                </div>
              )
            })}
            <div className="flex items-center justify-between bg-fill/60 px-4 py-3 text-base">
              <span className="text-muted">Total</span>
              <Money value={orderTotal(o)} className="font-medium" />
            </div>
          </div>
        </div>
      )}
    </Sheet>
  )
}
