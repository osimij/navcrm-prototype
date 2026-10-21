import { useState } from 'react'
import { Link } from 'react-router'
import { toast } from 'sonner'
import { I, Icon } from '@/components/icons'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Modal } from '@/components/ui/dialog'
import { Field, Input, PhoneInput } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Table, TD, TH, THead, TR } from '@/components/ui/table'
import { business, type Branch } from '@/data/business'
import { staff } from '@/data/staff'
import { formatPhone } from '@/lib/format'
import { NOW, minutesOfDay } from '@/lib/time'
import { timeOptions } from '../parts-a/common'
import { SettingsPage } from '../ui'

type Row = Branch & { opens: string; closes: string }

function isOpen(opens: string, closes: string) {
  const toMin = (t: string) => Number(t.slice(0, 2)) * 60 + Number(t.slice(3))
  const now = minutesOfDay(NOW)
  return now >= toMin(opens) && now < toMin(closes)
}

export default function BranchesSettings() {
  const [rows, setRows] = useState<Row[]>(() =>
    business.branches.map((b) => {
      const [opens, closes] = b.hours.split('–')
      return { ...b, opens, closes }
    }),
  )
  const [editing, setEditing] = useState<Row | 'new' | null>(null)
  const [form, setForm] = useState({ name: '', address: '', phone: '', opens: '09:00', closes: '20:00' })
  const [touched, setTouched] = useState(false)

  function open(row: Row | 'new') {
    setTouched(false)
    setEditing(row)
    setForm(
      row === 'new'
        ? { name: '', address: '', phone: '', opens: '09:00', closes: '20:00' }
        : { name: row.name, address: row.address, phone: row.phone.replace(/\D/g, '').slice(-9), opens: row.opens, closes: row.closes },
    )
  }

  function save() {
    setTouched(true)
    if (!form.name.trim() || !form.address.trim()) return
    const phone = form.phone.length === 9 ? `+992${form.phone}` : ''
    if (editing === 'new') {
      setRows((r) => [...r, { id: `b${Date.now()}`, name: form.name, address: form.address, phone, hours: `${form.opens}–${form.closes}`, opens: form.opens, closes: form.closes }])
      toast.success(`${form.name} added`, { description: 'Set weekday hours and assign staff next.' })
    } else if (editing) {
      setRows((r) => r.map((x) => (x.id === editing.id ? { ...x, ...form, phone: phone || x.phone } : x)))
      toast.success('Branch saved')
    }
    setEditing(null)
  }

  return (
    <SettingsPage
      wide
      title="Branches"
      description="Each branch has its own address, hours, staff and cash register. Reports can compare them."
      actions={
        <Button variant="primary" icon={I.add} onClick={() => open('new')}>
          Add branch
        </Button>
      }
    >
      <Card>
        <Table>
          <THead>
            <TH>Branch</TH>
            <TH>Phone</TH>
            <TH>Today</TH>
            <TH align="right">Staff</TH>
            <TH>Status</TH>
          </THead>
          <tbody>
            {rows.map((b) => {
              const openNow = isOpen(b.opens, b.closes)
              const count = staff.filter((s) => s.branchIds.includes(b.id)).length
              return (
                <TR key={b.id} onClick={() => open(b)}>
                  <TD>
                    <div className="text-fg">{b.name}</div>
                    <div className="text-sm text-muted">{b.address}</div>
                  </TD>
                  <TD muted className="tabular">
                    {b.phone ? formatPhone(b.phone) : '—'}
                  </TD>
                  <TD>
                    <div className="tabular">
                      {b.opens}–{b.closes}
                    </div>
                    <div className={openNow ? 'text-sm text-positive' : 'text-sm text-muted'}>{openNow ? 'Open now' : 'Closed now'}</div>
                  </TD>
                  <TD align="right">{count}</TD>
                  <TD>
                    <Badge tone="positive" dot>
                      Active
                    </Badge>
                  </TD>
                </TR>
              )
            })}
          </tbody>
        </Table>
      </Card>
      <p className="mt-4 text-sm text-muted">
        Different hours on some weekdays? Set them in{' '}
        <Link to="/settings/schedules" className="font-medium text-fg hover:underline underline-offset-4">
          Working hours
        </Link>
        .
      </p>

      <Modal
        open={!!editing}
        onOpenChange={(o) => !o && setEditing(null)}
        title={editing === 'new' ? 'Add branch' : 'Edit branch'}
        footer={
          <>
            <Button variant="ghost" onClick={() => setEditing(null)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={save}>
              {editing === 'new' ? 'Add branch' : 'Save'}
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
          <Field label="Name" hint="Short, so it fits the branch switcher. Usually the street." error={touched && !form.name.trim() ? 'Required' : undefined}>
            <Input autoFocus value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Somoni 14" />
          </Field>
          <Field
            label="Address"
            error={touched && !form.address.trim() ? 'Required' : undefined}
            hint={
              form.address.trim() ? (
                <a
                  className="inline-flex items-center gap-1 font-medium text-accent-fg hover:underline underline-offset-4"
                  href={`https://yandex.com/maps/?text=${encodeURIComponent(form.address + ', Dushanbe')}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  <Icon icon={I.mapPin} size={13} />
                  Check on the map
                </a>
              ) : (
                'Clients see it on the booking page and in reminders.'
              )
            }
          >
            <Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="Street and building" />
          </Field>
          <Field label="Phone" optional>
            <PhoneInput value={form.phone} onChange={(phone) => setForm({ ...form, phone })} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Opens">
              <Select value={form.opens} onChange={(opens) => setForm({ ...form, opens })} options={timeOptions(6, 14)} />
            </Field>
            <Field label="Closes" error={form.closes <= form.opens ? 'Must be after opening' : undefined}>
              <Select value={form.closes} onChange={(closes) => setForm({ ...form, closes })} options={timeOptions(12, 23)} />
            </Field>
          </div>
          <button type="submit" hidden />
        </form>
      </Modal>
    </SettingsPage>
  )
}
