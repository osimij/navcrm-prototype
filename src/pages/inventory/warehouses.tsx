import { useMemo } from 'react'
import { useNavigate } from 'react-router'
import { WarehouseIcon } from '@hugeicons/core-free-icons'
import { I, Icon } from '@/components/icons'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardHeader } from '@/components/ui/card'
import { Money } from '@/components/ui/misc'
import { Table, TD, TH, THead, TR } from '@/components/ui/table'
import { business } from '@/data/business'
import { STORES, stockByStore } from './data'
import { useInventory } from './store'

export function WarehousesTab() {
  const products = useInventory((s) => s.products)
  const navigate = useNavigate()

  const totals = useMemo(() => {
    const m = new Map<string, { items: number; value: number }>()
    for (const p of products.filter((x) => !x.archived)) {
      for (const s of stockByStore(p)) {
        if (s.qty <= 0) continue
        const t = m.get(s.store) ?? { items: 0, value: 0 }
        t.items++
        t.value += s.qty * p.purchase
        m.set(s.store, t)
      }
    }
    return m
  }, [products])

  const groups = [
    { name: 'Main warehouse', place: business.branches[0], stores: STORES.filter((s) => s.parent === 'Main warehouse') },
    { name: 'Somoni 14 storage', place: business.branches[1], stores: STORES.filter((s) => s.parent !== 'Main warehouse') },
  ]

  return (
    <div className="flex flex-col gap-5">
      {groups.map((g) => {
        const value = g.stores.reduce((m, s) => m + (totals.get(s.name)?.value ?? 0), 0)
        return (
          <Card key={g.name}>
            <CardHeader
              title={
                <span className="flex items-center gap-2">
                  <Icon icon={WarehouseIcon} size={18} className="text-muted" />
                  {g.name}
                </span>
              }
              description={`${g.place.address} · ${g.stores.length === 1 ? 'one store' : `${g.stores.length} stores`}`}
              action={
                <span className="text-base text-muted">
                  <Money value={value} className="text-fg" />
                </span>
              }
            />
            <Table>
              <THead>
                <TH className="w-72">Store</TH>
                <TH>How it’s used</TH>
                <TH align="right" className="w-28">Products</TH>
                <TH align="right" className="w-36">Value</TH>
              </THead>
              <tbody>
                {g.stores.map((s) => {
                  const t = totals.get(s.name)
                  return (
                    <TR key={s.id}>
                      <TD>
                        <span className="flex items-center gap-2">
                          {s.name}
                          {s.kind === 'cabinet' && <Badge>Master’s cabinet</Badge>}
                        </span>
                      </TD>
                      <TD muted>{s.note}</TD>
                      <TD align="right">{t?.items ?? 0}</TD>
                      <TD align="right">
                        <Money value={t?.value ?? 0} />
                      </TD>
                    </TR>
                  )
                })}
              </tbody>
            </Table>
          </Card>
        )
      })}
      <div className="flex flex-wrap items-center gap-3 rounded-2xl bg-fill px-5 py-4 text-base text-muted">
        <Icon icon={I.info} size={18} />
        <span className="flex-1">
          Masters’ cabinets keep a small working stock at each station. Refill them with a transfer from Consumables.
        </span>
        <Button size="sm" variant="secondary" onClick={() => navigate('/inventory/documents/new/transfer')}>
          New transfer
        </Button>
      </div>
    </div>
  )
}
