import type { IconSvgElement } from '@hugeicons/react'
import { useEffect, useMemo, useState } from 'react'
import { ArrowDataTransferHorizontalIcon, PackageReceiveIcon, PackageRemoveIcon, ClipboardIcon } from '@hugeicons/core-free-icons'
import { toast } from 'sonner'
import { I, Icon } from '@/components/icons'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Chip } from '@/components/ui/controls'
import { DetailRow, Sheet } from '@/components/ui/dialog'
import { EmptyState, Money } from '@/components/ui/misc'
import { Toolbar } from '@/components/ui/page'
import { Table, TableFooter, TD, TH, THead, TR } from '@/components/ui/table'
import { formatDate, formatDayTime, plural } from '@/lib/format'
import { DOC_STATUS, DOC_TYPE, docTotal, formatQty, supplierById, type DocStatus, type DocType, type StockDoc } from './data'
import { useInventory } from './store'
import { Price } from './ui'

export const DOC_ICON: Record<DocType, IconSvgElement> = {
  receipt: PackageReceiveIcon,
  'write-off': PackageRemoveIcon,
  transfer: ArrowDataTransferHorizontalIcon,
  stocktake: ClipboardIcon,
  'tech-card': I.scissors,
}

const TYPES: DocType[] = ['receipt', 'write-off', 'transfer', 'stocktake', 'tech-card']
const STATUSES: DocStatus[] = ['draft', 'posted', 'cancelled']

export function DocumentsTab() {
  const docs = useInventory((s) => s.docs)
  const [type, setType] = useState<DocType | null>(null)
  const [status, setStatus] = useState<DocStatus | null>(null)
  const [openId, setOpenId] = useState<string | null>(null)

  const list = useMemo(() => docs.filter((d) => (!type || d.type === type) && (!status || d.status === status)), [docs, type, status])

  return (
    <>
      <Toolbar>
        {TYPES.map((t) => (
          <Chip key={t} active={type === t} onClick={() => setType(type === t ? null : t)} count={docs.filter((d) => d.type === t).length}>
            {DOC_TYPE[t].label}
          </Chip>
        ))}
        <div className="mx-1 hidden h-5 w-px bg-border sm:block" />
        {STATUSES.map((s) => (
          <Chip key={s} active={status === s} onClick={() => setStatus(status === s ? null : s)}>
            {DOC_STATUS[s].label}
          </Chip>
        ))}
      </Toolbar>

      <Card>
        {list.length ? (
          <>
            <Table>
              <THead>
                <TH>No.</TH>
                <TH>Type</TH>
                <TH>Store</TH>
                <TH>Supplier</TH>
                <TH align="right">Items</TH>
                <TH align="right">Amount</TH>
                <TH>Status</TH>
                <TH>Date</TH>
              </THead>
              <tbody>
                {list.map((d) => (
                  <TR key={d.id} onClick={() => setOpenId(d.id)}>
                    <TD className="tabular">{d.no}</TD>
                    <TD>
                      <span className="flex items-center gap-2">
                        <Icon icon={DOC_ICON[d.type]} size={16} className="text-muted" />
                        {DOC_TYPE[d.type].label}
                      </span>
                    </TD>
                    <TD muted>
                      {d.warehouse}
                      {d.to && ` → ${d.to}`}
                    </TD>
                    <TD muted>{d.supplierId ? supplierById[d.supplierId].name : '—'}</TD>
                    <TD align="right">{d.lines.length}</TD>
                    <TD align="right">
                      <Money value={docTotal(d)} />
                    </TD>
                    <TD>
                      <Badge tone={DOC_STATUS[d.status].tone} dot>
                        {DOC_STATUS[d.status].label}
                      </Badge>
                    </TD>
                    <TD muted className="whitespace-nowrap">
                      {formatDayTime(d.date)}
                    </TD>
                  </TR>
                ))}
              </tbody>
            </Table>
            <TableFooter>
              <span>{plural(list.length, 'document')}</span>
            </TableFooter>
          </>
        ) : (
          <EmptyState icon={I.invoice} title="No documents match" description="Clear a filter to see more." />
        )}
      </Card>

      <DocumentSheet id={openId} onClose={() => setOpenId(null)} />
    </>
  )
}

function DocumentSheet({ id, onClose }: { id: string | null; onClose: () => void }) {
  const doc = useInventory((s) => s.docs.find((d) => d.id === id))
  const products = useInventory((s) => s.products)
  const setDocStatus = useInventory((s) => s.setDocStatus)
  const [shown, setShown] = useState<StockDoc | undefined>(doc)
  useEffect(() => {
    if (doc) setShown(doc)
  }, [doc])
  const d = doc ?? shown
  const byId = Object.fromEntries(products.map((p) => [p.id, p]))

  return (
    <Sheet
      open={!!doc}
      onOpenChange={(o) => !o && onClose()}
      eyebrow={d && DOC_TYPE[d.type].label}
      title={d?.no}
      footer={
        d &&
        (d.status === 'draft' ? (
          <>
            <Button
              variant="ghost"
              onClick={() => {
                setDocStatus(d.id, 'cancelled')
                toast(`${d.no} cancelled`)
              }}
            >
              Cancel document
            </Button>
            <Button
              variant="primary"
              className="ml-auto"
              onClick={() => {
                setDocStatus(d.id, 'posted')
                toast.success(`${d.no} posted`, { description: 'Stock is updated.' })
              }}
            >
              Post
            </Button>
          </>
        ) : (
          <Button icon={I.print} onClick={() => toast.success(`${d.no}.pdf is ready to print`)}>
            Print
          </Button>
        ))
      }
    >
      {d && (
        <div className="flex flex-col gap-6 px-5 py-5">
          <div className="flex items-center gap-3">
            <Badge tone={DOC_STATUS[d.status].tone} dot>
              {DOC_STATUS[d.status].label}
            </Badge>
            <span className="text-sm text-muted">{DOC_TYPE[d.type].description}</span>
          </div>
          <div className="divide-y divide-border">
            <DetailRow label="Date">{formatDate(d.date, { weekday: true })}</DetailRow>
            <DetailRow label={d.to ? 'From' : 'Store'}>{d.warehouse}</DetailRow>
            {d.to && <DetailRow label="To">{d.to}</DetailRow>}
            {d.supplierId && <DetailRow label="Supplier">{supplierById[d.supplierId].name}</DetailRow>}
            <DetailRow label="Created by">{d.author}</DetailRow>
            {d.comment && <DetailRow label="Comment">{d.comment}</DetailRow>}
          </div>
          <div className="overflow-hidden rounded-xl ring-1 ring-border">
            {d.lines.map((l) => {
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
              <Money value={docTotal(d)} className="font-medium" />
            </div>
          </div>
        </div>
      )}
    </Sheet>
  )
}
