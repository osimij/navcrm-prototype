import type { IconSvgElement } from '@hugeicons/react'
import { useMemo } from 'react'
import { toast } from 'sonner'
import { ArrowDataTransferHorizontalIcon, Layers01Icon, ShoppingCart01Icon } from '@hugeicons/core-free-icons'
import { I, Icon } from '@/components/icons'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Money } from '@/components/ui/misc'
import { formatNumber } from '@/lib/format'
import { docTotal, isLow } from './data'
import { stockValue, useInventory } from './store'

function ReportCard({
  icon,
  title,
  description,
  figure,
  detail,
  file,
}: {
  icon: IconSvgElement
  title: string
  description: string
  figure: React.ReactNode
  detail: React.ReactNode
  file: string
}) {
  return (
    <Card className="flex flex-col p-5">
      <div className="flex items-start gap-3">
        <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-fill text-muted">
          <Icon icon={icon} size={18} />
        </span>
        <div className="min-w-0">
          <h3 className="text-base font-medium text-fg">{title}</h3>
          <p className="mt-0.5 text-sm text-muted">{description}</p>
        </div>
      </div>
      <div className="mt-5 text-3xl font-normal text-fg">{figure}</div>
      <div className="mt-1 text-sm text-muted">{detail}</div>
      <div className="mt-5 flex">
        <Button size="sm" icon={I.download} onClick={() => toast.success(`${file}.xlsx is downloading`)}>
          Download Excel
        </Button>
      </div>
    </Card>
  )
}

export function ReportsTab() {
  const products = useInventory((s) => s.products)
  const docs = useInventory((s) => s.docs)

  const stats = useMemo(() => {
    const posted = docs.filter((d) => d.status === 'posted')
    const received = posted.filter((d) => d.type === 'receipt').reduce((m, d) => m + docTotal(d), 0)
    const usedByVisits = posted.filter((d) => d.type === 'tech-card').reduce((m, d) => m + docTotal(d), 0) * 11
    const writtenOff = posted.filter((d) => d.type === 'write-off').reduce((m, d) => m + docTotal(d), 0)
    const retail = products.filter((p) => p.forSale && !p.archived)
    const soldUnits = retail.reduce((m, p) => m + Math.max(2, Math.round(p.min * 1.3)), 0)
    const soldRevenue = retail.reduce((m, p) => m + Math.max(2, Math.round(p.min * 1.3)) * p.sale, 0)
    const soldCost = retail.reduce((m, p) => m + Math.max(2, Math.round(p.min * 1.3)) * p.purchase, 0)
    return { received, usedByVisits, writtenOff, soldUnits, soldRevenue, soldCost, low: products.filter(isLow).length }
  }, [docs, products])

  return (
    <>
      <p className="mb-4 text-base text-muted">This month so far. Each file lists every product with its own numbers.</p>
      <div className="grid gap-5 sm:grid-cols-2">
        <ReportCard
          icon={Layers01Icon}
          title="Stock levels"
          description="What’s on hand in every store, at purchase price"
          figure={<Money value={stockValue(products)} />}
          detail={`${stats.low} products below minimum`}
          file="stock-levels"
        />
        <ReportCard
          icon={ArrowDataTransferHorizontalIcon}
          title="Product movement"
          description="Receipts, transfers, write-offs and tech-card use"
          figure={<Money value={stats.received} />}
          detail={
            <>
              received · <Money value={Math.round(stats.usedByVisits)} /> used in visits · <Money value={stats.writtenOff} /> written off
            </>
          }
          file="product-movement"
        />
        <ReportCard
          icon={I.trendUp}
          title="Turnover and cost"
          description="How fast stock sells or gets used, and what services cost you"
          figure="34 days"
          detail="Average time on the shelf. Nail consumables turn fastest, 12 days."
          file="turnover-and-cost"
        />
        <ReportCard
          icon={ShoppingCart01Icon}
          title="Products sold"
          description="Retail sales at the register, with margin"
          figure={<Money value={stats.soldRevenue} />}
          detail={
            <>
              {formatNumber(stats.soldUnits)} items · margin <Money value={stats.soldRevenue - stats.soldCost} />
            </>
          }
          file="products-sold"
        />
      </div>
    </>
  )
}
