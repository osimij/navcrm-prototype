import { Door01Icon, FlashIcon } from '@hugeicons/core-free-icons'
import type { IconSvgElement } from '@hugeicons/react'
import { useState } from 'react'
import { toast } from 'sonner'
import { I, Icon } from '@/components/icons'
import { Button, IconButton } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/controls'
import { Modal } from '@/components/ui/dialog'
import { Field, Input } from '@/components/ui/input'
import { Menu, MenuItem } from '@/components/ui/menu'
import { Select } from '@/components/ui/select'
import { Table, TD, TH, THead, TR } from '@/components/ui/table'
import { business } from '@/data/business'
import { SERVICE_CATEGORIES, serviceById, services } from '@/data/services'
import { RESOURCES, type Resource, type ResourceType } from '../parts-a/data'
import { SettingsPage } from '../ui'

const TYPE_ICON: Record<ResourceType, IconSvgElement> = { Chair: I.chair, Room: Door01Icon, Station: I.droplet, Equipment: FlashIcon }
const TYPES: ResourceType[] = ['Chair', 'Room', 'Station', 'Equipment']

function servicesLabel(ids: string[]) {
  const names = ids.map((id) => serviceById[id]?.name).filter(Boolean)
  if (names.length <= 2) return names.join(', ')
  return `${names.slice(0, 2).join(', ')} +${names.length - 2}`
}

export default function ResourcesSettings() {
  const [list, setList] = useState<Resource[]>(RESOURCES)
  const [editing, setEditing] = useState<Resource | null>(null)
  const [isNew, setIsNew] = useState(false)

  function open(r: Resource | null) {
    setIsNew(!r)
    setEditing(r ? { ...r } : { id: '', name: '', type: 'Chair', branchId: 'b1', serviceIds: [] })
  }

  function save() {
    if (!editing || !editing.name.trim()) return
    if (isNew) {
      setList((l) => [...l, { ...editing, id: `r${Date.now()}` }])
      toast.success(`${editing.name} added`)
    } else {
      setList((l) => l.map((r) => (r.id === editing.id ? editing : r)))
      toast.success('Saved')
    }
    setEditing(null)
  }

  return (
    <SettingsPage
      wide
      title="Chairs, rooms & equipment"
      description="Places and devices that can’t be booked twice at once."
      actions={
        <Button variant="primary" icon={I.add} onClick={() => open(null)}>
          Add resource
        </Button>
      }
    >
      <Card>
        <Table>
          <THead>
            <TH>Name</TH>
            <TH>Branch</TH>
            <TH>Used for</TH>
            <TH className="w-12" />
          </THead>
          <tbody>
            {list.map((r) => (
              <TR key={r.id} onClick={() => open(r)}>
                <TD>
                  <span className="flex items-center gap-3">
                    <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-fill text-muted">
                      <Icon icon={TYPE_ICON[r.type]} size={16} />
                    </span>
                    <span>
                      <span className="block text-fg">{r.name}</span>
                      <span className="block text-sm text-muted">
                        {r.type}
                        {r.note && ` · ${r.note}`}
                      </span>
                    </span>
                  </span>
                </TD>
                <TD muted className="whitespace-nowrap">{business.branches.find((b) => b.id === r.branchId)?.name}</TD>
                <TD muted>{r.serviceIds.length ? servicesLabel(r.serviceIds) : <span className="text-faint">Not linked</span>}</TD>
                <TD align="right">
                  <span onClick={(e) => e.stopPropagation()}>
                    <Menu align="end" trigger={<IconButton icon={I.more} label="Actions" size="sm" tooltip={false} />}>
                      <MenuItem icon={I.edit} onClick={() => open(r)}>
                        Edit
                      </MenuItem>
                      <MenuItem
                        icon={I.delete}
                        danger
                        onClick={() => {
                          setList((l) => l.filter((x) => x.id !== r.id))
                          toast(`${r.name} removed`, { action: { label: 'Undo', onClick: () => setList((l) => [...l, r]) } })
                        }}
                      >
                        Remove
                      </MenuItem>
                    </Menu>
                  </span>
                </TD>
              </TR>
            ))}
          </tbody>
        </Table>
      </Card>

      <Modal
        open={!!editing}
        onOpenChange={(o) => !o && setEditing(null)}
        title={isNew ? 'Add resource' : editing?.name}
        footer={
          <>
            <Button variant="ghost" onClick={() => setEditing(null)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={save} disabled={!editing?.name.trim()}>
              {isNew ? 'Add' : 'Save'}
            </Button>
          </>
        }
      >
        {editing && (
          <div className="flex flex-col gap-4">
            <Field label="Name">
              <Input autoFocus value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} placeholder="e.g. Chair 3" />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Type">
                <Select value={editing.type} onChange={(type) => setEditing({ ...editing, type })} options={TYPES.map((t) => ({ value: t, label: t }))} />
              </Field>
              <Field label="Branch">
                <Select value={editing.branchId} onChange={(branchId) => setEditing({ ...editing, branchId })} options={business.branches.map((b) => ({ value: b.id, label: b.name }))} />
              </Field>
            </div>
            <Field label="Services that need it">
              <div className="max-h-64 overflow-y-auto rounded-xl bg-fill p-3">
                {SERVICE_CATEGORIES.map((c) => (
                  <div key={c} className="mb-3 last:mb-0">
                    <div className="mb-1.5 text-xs font-medium text-faint">{c}</div>
                    <div className="flex flex-col gap-2">
                      {services
                        .filter((s) => s.category === c)
                        .map((s) => (
                          <Checkbox
                            key={s.id}
                            checked={editing.serviceIds.includes(s.id)}
                            onChange={(on) =>
                              setEditing({ ...editing, serviceIds: on ? [...editing.serviceIds, s.id] : editing.serviceIds.filter((x) => x !== s.id) })
                            }
                            label={s.name}
                          />
                        ))}
                    </div>
                  </div>
                ))}
              </div>
            </Field>
          </div>
        )}
      </Modal>
    </SettingsPage>
  )
}
