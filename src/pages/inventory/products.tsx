import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router'
import { toast } from 'sonner'
import { I, Icon } from '@/components/icons'
import { Badge } from '@/components/ui/badge'
import { Button, IconButton } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Checkbox, Chip, Switch } from '@/components/ui/controls'
import { DetailRow, Modal, Sheet } from '@/components/ui/dialog'
import { Field, Input, SearchInput } from '@/components/ui/input'
import { Menu, MenuItem, MenuSeparator } from '@/components/ui/menu'
import { EmptyState } from '@/components/ui/misc'
import { Toolbar } from '@/components/ui/page'
import { Select } from '@/components/ui/select'
import { Table, TableFooter, TD, TH, THead, TR } from '@/components/ui/table'
import { Segmented } from '@/components/ui/tabs'
import { serviceById } from '@/data/services'
import { cn } from '@/lib/cn'
import { formatDayTime, formatPercent, plural } from '@/lib/format'
import {
  CATEGORIES,
  UNITS,
  formatQty,
  isLow,
  movementsFor,
  stockByStore,
  suggestedQty,
  supplierById,
  usageUnit,
  type Category,
  type Product,
  type Unit,
} from './data'
import { useInventory } from './store'
import { LevelBar, Price, StockCell, TypeBadges } from './ui'

type TypeFilter = 'all' | 'sale' | 'consumable' | 'sterile' | 'archived'

export function ProductsTab() {
  const products = useInventory((s) => s.products)
  const openProduct = useInventory((s) => s.openProduct)
  const [q, setQ] = useState('')
  const [category, setCategory] = useState<string>('all')
  const [type, setType] = useState<TypeFilter>('all')

  const counts = useMemo(() => {
    const live = products.filter((p) => !p.archived)
    return {
      all: live.length,
      sale: live.filter((p) => p.forSale).length,
      consumable: live.filter((p) => p.consumable).length,
      sterile: live.filter((p) => p.sterile).length,
      archived: products.filter((p) => p.archived).length,
    }
  }, [products])

  const list = useMemo(() => {
    const s = q.trim().toLowerCase()
    return products.filter((p) => {
      if (type === 'archived' ? !p.archived : p.archived) return false
      if (type === 'sale' && !p.forSale) return false
      if (type === 'consumable' && !p.consumable) return false
      if (type === 'sterile' && !p.sterile) return false
      if (category !== 'all' && p.category !== category) return false
      if (s && !(p.name.toLowerCase().includes(s) || p.sku.toLowerCase().includes(s) || p.barcode.includes(s))) return false
      return true
    })
  }, [products, q, category, type])

  const chips: { value: TypeFilter; label: string }[] = [
    { value: 'all', label: 'All' },
    { value: 'sale', label: 'For sale' },
    { value: 'consumable', label: 'Consumables' },
    { value: 'sterile', label: 'Sterile' },
    { value: 'archived', label: 'Archived' },
  ]

  return (
    <>
      <Toolbar>
        <SearchInput value={q} onChange={setQ} placeholder="Name, SKU or barcode" className="w-full sm:w-72" />
        <Select
          look="pill"
          value={category}
          onChange={setCategory}
          options={[{ value: 'all', label: 'All categories' }, ...CATEGORIES.map((c) => ({ value: c, label: c }))]}
        />
        <div className="mx-1 hidden h-5 w-px bg-border sm:block" />
        {chips.map((c) => (
          <Chip key={c.value} active={type === c.value} onClick={() => setType(c.value)} count={counts[c.value]}>
            {c.label}
          </Chip>
        ))}
        <div className="ml-auto">
          <Menu align="end" trigger={<IconButton icon={I.more} label="More actions" variant="outline" size="sm" />}>
            <MenuItem icon={I.upload} onClick={() => toast('Drop an Excel or CSV file to import', { description: 'Columns are matched automatically. Duplicates by SKU are merged.' })}>
              Import from Excel
            </MenuItem>
            <MenuItem icon={I.download} onClick={() => toast.success('products.xlsx is downloading')}>
              Export to Excel
            </MenuItem>
            <MenuSeparator />
            <MenuItem icon={I.settings} onClick={() => toast('Categories: Hair care, Hair color, Nails, Brows & lashes, Skin care, Disposables, Massage')}>
              Categories
            </MenuItem>
          </Menu>
        </div>
      </Toolbar>

      <Card>
        {list.length ? (
          <>
            <Table>
              <THead>
                <TH>Product</TH>
                <TH>Category</TH>
                <TH>Type</TH>
                <TH>In stock</TH>
                <TH align="right">Purchase</TH>
                <TH align="right">Sale price</TH>
              </THead>
              <tbody>
                {list.map((p) => (
                  <TR key={p.id} onClick={() => openProduct(p.id)}>
                    <TD className="h-16">
                      <div className="flex items-center gap-2">
                        <span className={cn('truncate', p.archived && 'text-muted')}>{p.name}</span>
                        {isLow(p) && <Badge tone="warning">Low</Badge>}
                      </div>
                      <div className="text-sm text-muted tabular">{p.sku}</div>
                    </TD>
                    <TD muted>{p.category}</TD>
                    <TD>
                      <TypeBadges p={p} />
                    </TD>
                    <TD>
                      <StockCell p={p} />
                    </TD>
                    <TD align="right">
                      <Price value={p.purchase} />
                      {p.unit !== 'pcs' && <span className="text-sm text-faint"> / {p.unit}</span>}
                    </TD>
                    <TD align="right">{p.forSale ? <Price value={p.sale} /> : <span className="text-faint">Not sold</span>}</TD>
                  </TR>
                ))}
              </tbody>
            </Table>
            <TableFooter>
              <span>{plural(list.length, 'product')}</span>
              <span>{counts.all - list.length > 0 && type !== 'archived' ? `${counts.all - list.length} hidden by filters` : ''}</span>
            </TableFooter>
          </>
        ) : (
          <EmptyState icon={I.inventory} title="No products match" description="Try another name or SKU, or clear the filters.">
            <Button
              size="sm"
              onClick={() => {
                setQ('')
                setCategory('all')
                setType('all')
              }}
            >
              Clear filters
            </Button>
          </EmptyState>
        )}
      </Card>
    </>
  )
}

/* ─────────────── Product sheet ─────────────── */

export function ProductSheet() {
  const id = useInventory((s) => s.productId)
  const openProduct = useInventory((s) => s.openProduct)
  const product = useInventory((s) => s.products.find((p) => p.id === id))
  const techCards = useInventory((s) => s.techCards)
  const navigate = useNavigate()
  const [editing, setEditing] = useState(false)
  // Keep the last product while the sheet animates out.
  const [shown, setShown] = useState<Product | undefined>(product)
  useEffect(() => {
    if (product) setShown(product)
  }, [product])
  const p = product ?? shown

  const usedIn = p
    ? Object.entries(techCards)
        .map(([sid, lines]) => ({ service: serviceById[sid], line: lines.find((l) => l.productId === p.id) }))
        .filter((x) => x.line)
    : []
  const unit = p ? usageUnit(p) : null

  return (
    <>
      <Sheet
        open={!!product}
        onOpenChange={(o) => !o && openProduct(null)}
        eyebrow="Product"
        title={p?.name}
        footer={
          <Button icon={I.edit} onClick={() => setEditing(true)}>
            Edit product
          </Button>
        }
      >
        {p && (
          <div className="flex flex-col gap-7 px-5 py-5">
            <div>
              <div className="flex items-baseline justify-between gap-4">
                <div className={cn('text-4xl font-normal tabular', isLow(p) ? 'text-warning' : 'text-fg')}>{formatQty(p.stock, p.unit)}</div>
                {p.min > 0 && <span className="text-sm text-muted">minimum {formatQty(p.min, p.unit)}</span>}
              </div>
              {p.min > 0 && <LevelBar value={p.stock} max={p.min * 2} low={isLow(p)} className="mt-3 h-1.5" />}
              {isLow(p) && (
                <div className="mt-4 flex items-center gap-3 rounded-xl bg-warning-soft px-3.5 py-3 text-sm text-warning">
                  <Icon icon={I.alert} size={16} />
                  <span className="flex-1">
                    Below minimum. Suggested order: {formatQty(suggestedQty(p), p.unit)} from {supplierById[p.supplierId].name}.
                  </span>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => {
                      openProduct(null)
                      navigate('/inventory/orders')
                    }}
                  >
                    Order
                  </Button>
                </div>
              )}
            </div>

            <section>
              <h3 className="mb-1 text-sm font-medium text-muted">Details</h3>
              <div className="divide-y divide-border">
                <DetailRow label="SKU">
                  <span className="tabular">{p.sku}</span>
                </DetailRow>
                <DetailRow label="Barcode">
                  <span className="tabular">{p.barcode}</span>
                </DetailRow>
                <DetailRow label="Category">{p.category}</DetailRow>
                <DetailRow label="Unit">
                  {p.unit}
                  {p.content && <span className="text-muted"> · {formatQty(p.content.qty, p.content.unit)} each</span>}
                </DetailRow>
                <DetailRow label="Purchase price">
                  <Price value={p.purchase} />
                </DetailRow>
                {p.forSale && (
                  <>
                    <DetailRow label="Sale price">
                      <Price value={p.sale} />
                    </DetailRow>
                    <DetailRow label="Margin">{formatPercent(((p.sale - p.purchase) / p.sale) * 100)}</DetailRow>
                  </>
                )}
                <DetailRow label="Supplier">{supplierById[p.supplierId]?.name}</DetailRow>
                <DetailRow label="Type">
                  <span className="inline-flex">
                    <TypeBadges p={p} />
                  </span>
                </DetailRow>
              </div>
            </section>

            <section>
              <h3 className="mb-2 text-sm font-medium text-muted">Where it is</h3>
              <ul className="overflow-hidden rounded-xl ring-1 ring-border">
                {stockByStore(p).map((s) => (
                  <li key={s.store} className="flex items-center justify-between border-b border-border px-4 py-2.5 text-base last:border-b-0">
                    <span className="text-fg">{s.store}</span>
                    <span className="text-muted tabular">{formatQty(s.qty, p.unit)}</span>
                  </li>
                ))}
              </ul>
            </section>

            {usedIn.length > 0 && unit && (
              <section>
                <h3 className="mb-2 text-sm font-medium text-muted">Written off by tech cards</h3>
                <ul className="flex flex-col gap-1">
                  {usedIn.map(({ service, line }) => (
                    <li key={service.id} className="flex items-center gap-3 py-1.5 text-base">
                      <span className="size-2 rounded-full" style={{ background: `var(--c-${service.color})` }} />
                      <span className="flex-1 text-fg">{service.name}</span>
                      <span className="text-muted tabular">{formatQty(line!.qty, unit.unit)} per visit</span>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            <section>
              <h3 className="mb-2 text-sm font-medium text-muted">Recent movement</h3>
              <ul className="flex flex-col">
                {movementsFor(p).map((m) => (
                  <li key={m.id} className="flex items-center gap-3 border-b border-border py-2.5 last:border-b-0">
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-base text-fg">{m.label}</span>
                      <span className="block text-sm text-muted">
                        {formatDayTime(m.date)}
                        {m.doc && ` · ${m.doc}`}
                      </span>
                    </span>
                    <span className={cn('text-base tabular', m.qty > 0 ? 'text-positive' : 'text-muted')}>
                      {m.qty > 0 ? '+' : '−'}
                      {formatQty(Math.abs(m.qty), m.unit)}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          </div>
        )}
      </Sheet>
      {p && <ProductModal open={editing} onOpenChange={setEditing} product={p} />}
    </>
  )
}

/* ─────────────── Add / edit product ─────────────── */

type Lang = 'tg' | 'ru' | 'en'

export function ProductModal({
  open,
  onOpenChange,
  product,
}: {
  open: boolean
  onOpenChange: (o: boolean) => void
  product?: Product
}) {
  const products = useInventory((s) => s.products)
  const suppliers = useInventory((s) => s.suppliers)
  const addProductItem = useInventory((s) => s.addProductItem)
  const updateProduct = useInventory((s) => s.updateProduct)
  const navigate = useNavigate()

  const [lang, setLang] = useState<Lang>('en')
  const [names, setNames] = useState<Record<Lang, string>>({ tg: '', ru: '', en: '' })
  const [sku, setSku] = useState('')
  const [barcode, setBarcode] = useState('')
  const [category, setCategory] = useState<Category>('Hair care')
  const [unit, setUnit] = useState<Unit>('pcs')
  const [purchase, setPurchase] = useState('')
  const [sale, setSale] = useState('')
  const [min, setMin] = useState('')
  const [vat, setVat] = useState('0')
  const [supplierId, setSupplierId] = useState('sp2')
  const [forSale, setForSale] = useState(true)
  const [consumable, setConsumable] = useState(false)
  const [sterile, setSterile] = useState(false)
  const [active, setActive] = useState(true)
  const [touched, setTouched] = useState(false)

  useEffect(() => {
    if (!open) return
    setLang('en')
    setTouched(false)
    if (product) {
      setNames({ tg: '', ru: '', en: product.name })
      setSku(product.sku)
      setBarcode(product.barcode)
      setCategory(product.category)
      setUnit(product.unit)
      setPurchase(String(product.purchase))
      setSale(product.sale ? String(product.sale) : '')
      setMin(String(product.min))
      setVat(String(product.vat))
      setSupplierId(product.supplierId)
      setForSale(product.forSale)
      setConsumable(product.consumable)
      setSterile(product.sterile)
      setActive(!product.archived)
    } else {
      setNames({ tg: '', ru: '', en: '' })
      setSku(`HC-${String(1300 + products.length).padStart(4, '0')}`)
      setBarcode('')
      setCategory('Hair care')
      setUnit('pcs')
      setPurchase('')
      setSale('')
      setMin('')
      setVat('15')
      setSupplierId('sp2')
      setForSale(true)
      setConsumable(false)
      setSterile(false)
      setActive(true)
    }
  }, [open, product, products.length])

  const num = (v: string) => Number(v.replace(',', '.')) || 0
  const nameMissing = !names.en.trim()

  function save() {
    setTouched(true)
    if (nameMissing) {
      setLang('en')
      return
    }
    const patch = {
      name: names.en.trim(),
      sku,
      barcode,
      category,
      unit,
      purchase: num(purchase),
      sale: forSale ? num(sale) : 0,
      min: num(min),
      vat: num(vat),
      supplierId,
      forSale,
      consumable,
      sterile,
      archived: !active,
      store: forSale ? ('retail' as const) : ('consumables' as const),
    }
    if (product) {
      updateProduct(product.id, patch)
      toast.success('Product updated')
    } else {
      addProductItem({ ...patch, id: `p${Date.now()}`, stock: 0, countedDaysAgo: 0 })
      toast.success(`${patch.name} added`, {
        description: 'Post a receipt to put it in stock.',
        action: { label: 'New receipt', onClick: () => navigate('/inventory/documents/new/receipt') },
      })
    }
    onOpenChange(false)
  }

  const langLabel: Record<Lang, string> = { tg: 'Tajik', ru: 'Russian', en: 'English' }

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title={product ? 'Edit product' : 'Add product'}
      size="lg"
      footer={
        <>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={save}>
            {product ? 'Save' : 'Add product'}
          </Button>
        </>
      }
    >
      <form
        className="flex flex-col gap-5"
        onSubmit={(e) => {
          e.preventDefault()
          save()
        }}
      >
        <Field
          label={
            <span className="flex items-center justify-between gap-3">
              <span>Name</span>
            </span>
          }
          error={touched && nameMissing ? 'English name is required' : undefined}
          hint={lang === 'en' ? 'Shown on receipts and in the booking page' : `Shown to clients who use NavCRM in ${langLabel[lang]}`}
        >
          <div className="flex flex-col gap-2">
            <Segmented
              size="sm"
              value={lang}
              onChange={setLang}
              items={[
                { value: 'tg', label: 'Тоҷикӣ' },
                { value: 'ru', label: 'Русский' },
                { value: 'en', label: 'English' },
              ]}
            />
            <Input
              autoFocus
              value={names[lang]}
              onChange={(e) => setNames((n) => ({ ...n, [lang]: e.target.value }))}
              placeholder={lang === 'en' ? 'e.g. Repair shampoo 250 ml' : lang === 'ru' ? 'напр. Шампунь восстанавливающий' : 'масалан, Шампуни барқарорсозанда'}
              aria-invalid={touched && nameMissing && lang === 'en'}
            />
          </div>
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="SKU">
            <Input value={sku} onChange={(e) => setSku(e.target.value)} className="tabular" />
          </Field>
          <Field label="Barcode" optional>
            <Input
              value={barcode}
              onChange={(e) => setBarcode(e.target.value)}
              placeholder="Scan or type"
              className="tabular"
              suffix={
                <IconButton
                  icon={I.scan}
                  label="Scan with camera"
                  size="xs"
                  tooltip={false}
                  className="-mr-2"
                  onClick={() => {
                    setBarcode('4780071' + String(Date.now()).slice(-6))
                    toast.success('Barcode scanned')
                  }}
                />
              }
            />
          </Field>
          <Field label="Category">
            <Select value={category} onChange={(v) => setCategory(v as Category)} options={CATEGORIES.map((c) => ({ value: c, label: c }))} />
          </Field>
          <Field label="Unit">
            <Select value={unit} onChange={(v) => setUnit(v as Unit)} options={UNITS.map((u) => ({ value: u, label: u }))} />
          </Field>
          <Field label="Purchase price">
            <Input value={purchase} onChange={(e) => setPurchase(e.target.value)} inputMode="decimal" placeholder="0" suffix="TJS" className="tabular" />
          </Field>
          <Field label="Sale price" hint={forSale ? undefined : 'Only for products sold at the register'}>
            <Input
              value={sale}
              onChange={(e) => setSale(e.target.value)}
              inputMode="decimal"
              placeholder="0"
              suffix="TJS"
              disabled={!forSale}
              className="tabular"
            />
          </Field>
          <Field label="Minimum stock" hint="We’ll notify you and draft a supplier order">
            <Input value={min} onChange={(e) => setMin(e.target.value)} inputMode="decimal" placeholder="0" suffix={unit} className="tabular" />
          </Field>
          <Field label="VAT">
            <Input value={vat} onChange={(e) => setVat(e.target.value)} inputMode="decimal" suffix="%" className="tabular" />
          </Field>
        </div>

        <Field label="Supplier">
          <Select value={supplierId} onChange={setSupplierId} options={suppliers.map((s) => ({ value: s.id, label: s.name }))} />
        </Field>

        <div className="flex flex-col gap-3 rounded-xl bg-fill p-4">
          <Checkbox checked={forSale} onChange={setForSale} label="Sold at the register" />
          <Checkbox
            checked={consumable}
            onChange={setConsumable}
            label={
              <>
                Consumable for services
                <span className="block text-sm text-muted">Tech cards can write it off when a visit is completed</span>
              </>
            }
          />
          <Checkbox checked={sterile} onChange={setSterile} label="Sterile, single use" />
        </div>

        <Switch checked={active} onChange={setActive} label="Active" description="Inactive products are archived and hidden from the register" />
        <button type="submit" hidden />
      </form>
    </Modal>
  )
}

export function AddProductModal() {
  const open = useInventory((s) => s.addProduct)
  const setOpen = useInventory((s) => s.setAddProduct)
  return <ProductModal open={open} onOpenChange={setOpen} />
}
