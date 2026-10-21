import { useEffect, useMemo, useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router'
import { toast } from 'sonner'
import { I, Icon } from '@/components/icons'
import { Button, IconButton } from '@/components/ui/button'
import { Card, CardHeader } from '@/components/ui/card'
import { DatePicker } from '@/components/ui/date-picker'
import { Field, Input, Textarea } from '@/components/ui/input'
import { EmptyState, Money } from '@/components/ui/misc'
import { Page, PageHeader } from '@/components/ui/page'
import { Select } from '@/components/ui/select'
import { Table, TD, TH, THead, TR } from '@/components/ui/table'
import { currentUser } from '@/data/business'
import { cn } from '@/lib/cn'
import { formatNumber } from '@/lib/format'
import { NOW, TODAY } from '@/lib/time'
import { DOC_TYPE, STORES, formatQty, type DocLine, type DocType, type Product } from './data'
import { useInventory } from './store'
import { Price, ProductSearch } from './ui'
import { DOC_ICON } from './documents'

const EDITABLE: DocType[] = ['receipt', 'write-off', 'transfer', 'stocktake']
const REASONS = ['Expired', 'Damaged', 'Used by the salon', 'Lost', 'Other']

type Line = DocLine & { input: string; costInput: string }

function storeHolds(store: string, p: Product) {
  if (store === 'Retail') return p.store === 'retail'
  if (store === 'Consumables') return p.store === 'consumables'
  if (store === 'Somoni 14 storage') return p.store === 'retail'
  return p.consumable
}

export function NewDocument() {
  const { type } = useParams()
  const t = type as DocType
  if (!EDITABLE.includes(t)) return <Navigate to="/inventory/documents" replace />
  return <DocumentForm key={t} type={t} />
}

function DocumentForm({ type }: { type: DocType }) {
  const navigate = useNavigate()
  const products = useInventory((s) => s.products)
  const suppliers = useInventory((s) => s.suppliers)
  const docs = useInventory((s) => s.docs)
  const addDoc = useInventory((s) => s.addDoc)
  const meta = DOC_TYPE[type]
  const byId = useMemo(() => Object.fromEntries(products.map((p) => [p.id, p])), [products])

  const [store, setStore] = useState(type === 'receipt' || type === 'transfer' ? 'Consumables' : 'Consumables')
  const [to, setTo] = useState('Somoni 14 storage')
  const [supplierId, setSupplierId] = useState('sp1')
  const [reason, setReason] = useState(REASONS[0])
  const [date, setDate] = useState(TODAY)
  const [comment, setComment] = useState('')
  const [lines, setLines] = useState<Line[]>([])
  const [tried, setTried] = useState(false)

  // A stocktake starts from everything the store should hold.
  useEffect(() => {
    if (type !== 'stocktake') return
    setLines(
      products
        .filter((p) => !p.archived && storeHolds(store, p))
        .map((p) => ({ productId: p.id, qty: p.stock, expected: p.stock, cost: p.purchase, input: '', costInput: String(p.purchase) })),
    )
  }, [type, store, products])

  const add = (id: string) => {
    const p = byId[id]
    setLines((l) => [...l, { productId: id, qty: 1, cost: p.purchase, input: '1', costInput: String(p.purchase) }])
  }

  const num = (v: string) => Number(v.replace(',', '.')) || 0
  const update = (id: string, patch: Partial<Line>) => setLines((l) => l.map((x) => (x.productId === id ? { ...x, ...patch } : x)))

  const counted = type === 'stocktake' ? lines.filter((l) => l.input !== '') : lines
  const total =
    type === 'stocktake'
      ? counted.reduce((m, l) => m + (num(l.input) - (l.expected ?? 0)) * l.cost, 0)
      : lines.reduce((m, l) => m + num(l.input) * num(l.costInput), 0)

  function scan() {
    const next = products.find((p) => !p.archived && storeHolds(store, p) && !lines.some((l) => l.productId === p.id))
    if (!next) return
    if (type === 'stocktake') {
      document.getElementById(`count-${next.id}`)?.focus()
    } else {
      add(next.id)
    }
    toast.success(`Scanned: ${next.name}`)
  }

  function finish(status: 'draft' | 'posted') {
    setTried(true)
    if (!counted.length) return
    const prefix = meta.prefix
    const latest = docs.filter((d) => d.no.startsWith(prefix)).map((d) => Number(d.no.split('-')[1]))
    const no = `${prefix}-${String(Math.max(0, ...latest) + 1).padStart(4, '0')}`
    addDoc({
      id: `d${Date.now()}`,
      no,
      type,
      status,
      warehouse: store,
      to: type === 'transfer' ? to : undefined,
      supplierId: type === 'receipt' ? supplierId : undefined,
      date: new Date(date.getFullYear(), date.getMonth(), date.getDate(), NOW.getHours(), NOW.getMinutes()),
      lines: counted.map((l) => ({
        productId: l.productId,
        qty: type === 'stocktake' ? num(l.input) - (l.expected ?? 0) : num(l.input),
        cost: type === 'stocktake' ? l.cost : num(l.costInput),
      })),
      comment: type === 'write-off' ? [reason, comment].filter(Boolean).join('. ') : comment || undefined,
      author: currentUser.name,
    })
    toast.success(status === 'posted' ? `${no} posted` : `${no} saved as draft`, {
      description: status === 'posted' ? 'Stock is updated.' : 'Post it when the goods are checked.',
    })
    navigate('/inventory/documents')
  }

  const storeOptions = STORES.map((s) => ({ value: s.name, label: s.name, hint: s.parent === 'Main warehouse' ? undefined : s.parent }))

  return (
    <Page width="default">
      <PageHeader
        back="/inventory/documents"
        title={`New ${meta.label.toLowerCase()}`}
        subtitle={meta.description}
        meta={<Icon icon={DOC_ICON[type]} size={20} className="text-faint" />}
      />

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
        <Card className="min-w-0 self-start">
          <CardHeader
            title={type === 'stocktake' ? 'Count' : 'Items'}
            description={
              type === 'stocktake'
                ? `${counted.length} of ${lines.length} counted. Leave a row empty if you didn’t count it.`
                : lines.length
                  ? `${lines.length} ${lines.length === 1 ? 'product' : 'products'}`
                  : undefined
            }
            action={
              <>
                <IconButton icon={I.scan} label="Scan barcode" size="sm" onClick={scan} />
                {type !== 'stocktake' && (
                  <ProductSearch
                    onSelect={add}
                    exclude={lines.map((l) => l.productId)}
                    filter={type === 'receipt' ? undefined : (p) => storeHolds(store, p)}
                  />
                )}
              </>
            }
          />
          {lines.length ? (
            <Table>
              <THead>
                <TH>Product</TH>
                {type === 'stocktake' ? (
                  <>
                    <TH align="right">Expected</TH>
                    <TH align="right">Counted</TH>
                    <TH align="right">Difference</TH>
                  </>
                ) : (
                  <>
                    {type === 'transfer' && <TH align="right">Available</TH>}
                    <TH align="right">Quantity</TH>
                    {type !== 'transfer' && <TH align="right">{type === 'receipt' ? 'Cost' : 'Cost each'}</TH>}
                    {type !== 'transfer' && <TH align="right">Sum</TH>}
                    <TH />
                  </>
                )}
              </THead>
              <tbody>
                {lines.map((l) => {
                  const p = byId[l.productId]
                  if (type === 'stocktake') {
                    const diff = l.input === '' ? null : num(l.input) - (l.expected ?? 0)
                    return (
                      <TR key={l.productId}>
                        <TD>
                          <div className="truncate">{p.name}</div>
                          <div className="text-sm text-muted tabular">{p.sku}</div>
                        </TD>
                        <TD align="right" muted>
                          {formatQty(l.expected ?? 0, p.unit)}
                        </TD>
                        <TD align="right">
                          <Input
                            id={`count-${p.id}`}
                            value={l.input}
                            onChange={(e) => update(p.id, { input: e.target.value })}
                            inputMode="decimal"
                            placeholder="—"
                            className="ml-auto w-24 text-right tabular"
                          />
                        </TD>
                        <TD align="right">
                          {diff == null ? (
                            <span className="text-faint">—</span>
                          ) : (
                            <span className={cn(diff > 0 ? 'text-positive' : diff < 0 ? 'text-negative' : 'text-muted')}>
                              {diff > 0 ? '+' : diff < 0 ? '−' : ''}
                              {formatQty(Math.abs(diff), p.unit)}
                              {diff !== 0 && (
                                <span className="block text-sm">
                                  <Money value={diff * l.cost} sign />
                                </span>
                              )}
                            </span>
                          )}
                        </TD>
                      </TR>
                    )
                  }
                  const over = type !== 'receipt' && num(l.input) > p.stock
                  return (
                    <TR key={l.productId}>
                      <TD>
                        <div className="truncate">{p.name}</div>
                        <div className="text-sm text-muted tabular">{p.sku}</div>
                      </TD>
                      {type === 'transfer' && (
                        <TD align="right" muted>
                          {formatQty(p.stock, p.unit)}
                        </TD>
                      )}
                      <TD align="right">
                        <Input
                          value={l.input}
                          onChange={(e) => update(p.id, { input: e.target.value })}
                          inputMode="decimal"
                          suffix={p.unit}
                          aria-invalid={over || undefined}
                          className="ml-auto w-32 text-right tabular"
                        />
                        {over && <div className="mt-1 text-xs text-negative">Only {formatQty(p.stock, p.unit)} in stock</div>}
                      </TD>
                      {type !== 'transfer' && (
                        <TD align="right">
                          {type === 'receipt' ? (
                            <Input
                              value={l.costInput}
                              onChange={(e) => update(p.id, { costInput: e.target.value })}
                              inputMode="decimal"
                              suffix="TJS"
                              className="ml-auto w-32 text-right tabular"
                            />
                          ) : (
                            <Price value={l.cost} />
                          )}
                        </TD>
                      )}
                      {type !== 'transfer' && (
                        <TD align="right">
                          <Money value={num(l.input) * num(l.costInput)} />
                        </TD>
                      )}
                      <TD align="right" className="w-12">
                        <IconButton
                          icon={I.delete}
                          label="Remove"
                          size="sm"
                          tooltip={false}
                          onClick={() => setLines((x) => x.filter((y) => y.productId !== l.productId))}
                        />
                      </TD>
                    </TR>
                  )
                })}
              </tbody>
            </Table>
          ) : (
            <EmptyState
              icon={I.scan}
              title="No items yet"
              description={type === 'receipt' ? 'Scan the barcodes on the delivery, or search by name.' : 'Scan a barcode or search to add products.'}
            />
          )}
          {tried && !counted.length && <p className="px-5 pb-4 text-sm text-negative">Add at least one product first.</p>}
        </Card>

        <div className="flex flex-col gap-4 self-start lg:sticky lg:top-6">
          <Card className="flex flex-col gap-4 p-5">
            <Field label={type === 'transfer' ? 'From' : 'Store'}>
              <Select value={store} onChange={setStore} options={storeOptions} />
            </Field>
            {type === 'transfer' && (
              <Field label="To" error={to === store ? 'Choose a different store' : undefined}>
                <Select value={to} onChange={setTo} options={storeOptions} />
              </Field>
            )}
            {type === 'receipt' && (
              <Field label="Supplier">
                <Select value={supplierId} onChange={setSupplierId} options={suppliers.map((s) => ({ value: s.id, label: s.name }))} />
              </Field>
            )}
            {type === 'write-off' && (
              <Field label="Reason">
                <Select value={reason} onChange={setReason} options={REASONS.map((r) => ({ value: r, label: r }))} />
              </Field>
            )}
            <Field label="Date">
              <DatePicker value={date} onChange={setDate} />
            </Field>
            <Field label="Comment" optional>
              <Textarea value={comment} onChange={(e) => setComment(e.target.value)} placeholder={type === 'receipt' ? 'Supplier invoice no.' : ''} className="min-h-16" />
            </Field>
          </Card>

          <Card className="p-5">
            <div className="flex items-baseline justify-between">
              <span className="text-base text-muted">{type === 'stocktake' ? 'Difference' : type === 'transfer' ? 'Quantity' : 'Total'}</span>
              {type === 'transfer' ? (
                <span className="text-2xl text-fg tabular">{formatNumber(lines.reduce((m, l) => m + num(l.input), 0))}</span>
              ) : (
                <Money value={total} sign={type === 'stocktake'} className="text-2xl" />
              )}
            </div>
            <div className="mt-4 flex gap-2">
              <Button className="flex-1" onClick={() => finish('draft')}>
                Save draft
              </Button>
              <Button variant="primary" className="flex-1" onClick={() => finish('posted')} disabled={type === 'transfer' && to === store}>
                Post
              </Button>
            </div>
            <p className="mt-3 text-xs text-faint">
              {type === 'stocktake'
                ? 'Posting writes off shortages and adds surpluses at purchase price.'
                : type === 'receipt'
                  ? 'Posting adds the goods to stock and updates purchase prices.'
                  : 'Posting updates stock right away.'}
            </p>
          </Card>
        </div>
      </div>
    </Page>
  )
}
