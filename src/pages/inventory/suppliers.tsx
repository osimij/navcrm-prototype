import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router'
import { toast } from 'sonner'
import { I, Icon } from '@/components/icons'
import { Avatar } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { DetailRow, Modal, Sheet } from '@/components/ui/dialog'
import { Field, Input, PhoneInput, Textarea } from '@/components/ui/input'
import { Money } from '@/components/ui/misc'
import { Table, TableFooter, TD, TH, THead, TR } from '@/components/ui/table'
import { formatDate, formatPhone, plural } from '@/lib/format'
import { formatQty, isLow, orderTotal, type Supplier } from './data'
import { useInventory } from './store'

export function SuppliersTab() {
  const suppliers = useInventory((s) => s.suppliers)
  const products = useInventory((s) => s.products)
  const orders = useInventory((s) => s.orders)
  const [openId, setOpenId] = useState<string | null>(null)

  return (
    <>
      <Card>
        <Table>
          <THead>
            <TH>Supplier</TH>
            <TH>Contact</TH>
            <TH align="right">Products</TH>
            <TH>Open orders</TH>
            <TH>Last delivery</TH>
          </THead>
          <tbody>
            {suppliers.map((s) => {
              const mine = products.filter((p) => p.supplierId === s.id && !p.archived)
              const low = mine.filter(isLow).length
              const open = orders.filter((o) => o.supplierId === s.id && o.status === 'sent')
              const last = orders.filter((o) => o.supplierId === s.id && o.status === 'received').sort((a, b) => +b.date - +a.date)[0]
              return (
                <TR key={s.id} onClick={() => setOpenId(s.id)}>
                  <TD className="h-16">
                    <span className="flex items-center gap-3">
                      <Avatar name={s.name} size="md" />
                      <span className="min-w-0">
                        <span className="block truncate">{s.name}</span>
                        <span className="block text-sm text-muted">{s.email}</span>
                      </span>
                    </span>
                  </TD>
                  <TD>
                    <div>{s.contact}</div>
                    <div className="text-sm text-muted tabular">{formatPhone(s.phone)}</div>
                  </TD>
                  <TD align="right">
                    {mine.length}
                    {low > 0 && <div className="text-sm text-warning">{low} low</div>}
                  </TD>
                  <TD>{open.length ? <Badge tone="accent">{plural(open.length, 'order')}</Badge> : <span className="text-faint">None</span>}</TD>
                  <TD muted>{last ? formatDate(last.date) : '—'}</TD>
                </TR>
              )
            })}
          </tbody>
        </Table>
        <TableFooter>
          <span>{plural(suppliers.length, 'supplier')}</span>
        </TableFooter>
      </Card>
      <SupplierSheet id={openId} onClose={() => setOpenId(null)} />
    </>
  )
}

function SupplierSheet({ id, onClose }: { id: string | null; onClose: () => void }) {
  const supplier = useInventory((s) => s.suppliers.find((x) => x.id === id))
  const products = useInventory((s) => s.products)
  const orders = useInventory((s) => s.orders)
  const navigate = useNavigate()
  const [shown, setShown] = useState<Supplier | undefined>(supplier)
  useEffect(() => {
    if (supplier) setShown(supplier)
  }, [supplier])
  const s = supplier ?? shown
  const mine = s ? products.filter((p) => p.supplierId === s.id && !p.archived) : []
  const history = s ? orders.filter((o) => o.supplierId === s.id) : []
  const lowCount = mine.filter(isLow).length

  return (
    <Sheet
      open={!!supplier}
      onOpenChange={(o) => !o && onClose()}
      eyebrow="Supplier"
      title={s?.name}
      footer={
        lowCount > 0 ? (
          <Button
            variant="primary"
            className="ml-auto"
            onClick={() => {
              onClose()
              navigate('/inventory/orders')
            }}
          >
            Order {plural(lowCount, 'low product')}
          </Button>
        ) : undefined
      }
    >
      {s && (
        <div className="flex flex-col gap-6 px-5 py-5">
          <div className="divide-y divide-border">
            <DetailRow label="Contact">{s.contact}</DetailRow>
            <DetailRow label="Phone">
              <a href={`tel:${s.phone}`} className="tabular hover:underline underline-offset-4">
                {formatPhone(s.phone)}
              </a>
            </DetailRow>
            <DetailRow label="Email">{s.email}</DetailRow>
            <DetailRow label="TIN">
              <span className="tabular">{s.tin}</span>
            </DetailRow>
            <DetailRow label="Address">{s.address}</DetailRow>
          </div>
          {s.notes && (
            <div className="flex gap-3 rounded-xl bg-fill px-4 py-3 text-base text-fg">
              <Icon icon={I.note} size={18} className="mt-px text-muted" />
              {s.notes}
            </div>
          )}
          <section>
            <h3 className="mb-2 text-sm font-medium text-muted">Products · {mine.length}</h3>
            <ul className="overflow-hidden rounded-xl ring-1 ring-border">
              {mine.map((p) => (
                <li key={p.id} className="flex items-center justify-between gap-3 border-b border-border px-4 py-2.5 text-base last:border-b-0">
                  <span className="truncate text-fg">{p.name}</span>
                  <span className={isLow(p) ? 'text-warning tabular' : 'text-muted tabular'}>{formatQty(p.stock, p.unit)}</span>
                </li>
              ))}
            </ul>
          </section>
          {history.length > 0 && (
            <section>
              <h3 className="mb-2 text-sm font-medium text-muted">Orders</h3>
              <ul className="flex flex-col">
                {history.map((o) => (
                  <li key={o.id} className="flex items-center gap-3 border-b border-border py-2.5 text-base last:border-b-0">
                    <span className="tabular text-fg">{o.no}</span>
                    <span className="flex-1 text-sm text-muted">{formatDate(o.date)}</span>
                    <Badge tone={o.status === 'received' ? 'positive' : 'accent'}>{o.status === 'received' ? 'Received' : 'Sent'}</Badge>
                    <Money value={orderTotal(o)} className="w-24 text-right" />
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      )}
    </Sheet>
  )
}

export function AddSupplierModal() {
  const open = useInventory((s) => s.addSupplier)
  const setOpen = useInventory((s) => s.setAddSupplier)
  const addSupplierItem = useInventory((s) => s.addSupplierItem)
  const [name, setName] = useState('')
  const [contact, setContact] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [tin, setTin] = useState('')
  const [address, setAddress] = useState('')
  const [notes, setNotes] = useState('')
  const [touched, setTouched] = useState(false)

  useEffect(() => {
    if (!open) return
    setName('')
    setContact('')
    setPhone('')
    setEmail('')
    setTin('')
    setAddress('')
    setNotes('')
    setTouched(false)
  }, [open])

  const phoneBad = phone.length > 0 && phone.length < 9

  function save() {
    setTouched(true)
    if (!name.trim() || phoneBad) return
    addSupplierItem({
      id: `sp${Date.now()}`,
      name: name.trim(),
      contact: contact.trim(),
      phone: phone ? `+992${phone}` : '',
      email: email.trim(),
      tin: tin.trim(),
      address: address.trim(),
      notes: notes.trim() || undefined,
    })
    toast.success(`${name.trim()} added to suppliers`)
    setOpen(false)
  }

  return (
    <Modal
      open={open}
      onOpenChange={setOpen}
      title="Add supplier"
      footer={
        <>
          <Button variant="ghost" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={save}>
            Add supplier
          </Button>
        </>
      }
    >
      <form
        className="flex flex-col gap-4"
        onSubmit={(e) => {
          e.preventDefault()
          save()
        }}
      >
        <Field label="Company name" error={touched && !name.trim() ? 'Required' : undefined}>
          <Input value={name} onChange={(e) => setName(e.target.value)} autoFocus placeholder="e.g. Nail Pro Supply" aria-invalid={touched && !name.trim()} />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Contact person" optional>
            <Input value={contact} onChange={(e) => setContact(e.target.value)} />
          </Field>
          <Field label="Phone" optional error={touched && phoneBad ? 'Enter all 9 digits' : undefined}>
            <PhoneInput value={phone} onChange={setPhone} invalid={touched && phoneBad} />
          </Field>
          <Field label="Email" optional hint="Orders are sent here and in Telegram">
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </Field>
          <Field label="TIN" optional>
            <Input value={tin} onChange={(e) => setTin(e.target.value)} inputMode="numeric" className="tabular" />
          </Field>
        </div>
        <Field label="Address" optional>
          <Input value={address} onChange={(e) => setAddress(e.target.value)} />
        </Field>
        <Field label="Notes" optional>
          <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Delivery days, payment terms, minimum order" />
        </Field>
        <button type="submit" hidden />
      </form>
    </Modal>
  )
}
