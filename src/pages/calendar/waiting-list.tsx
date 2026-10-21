import { useState } from 'react'
import { toast } from 'sonner'
import { ClientPicker } from '@/components/client-picker'
import { I, Icon } from '@/components/icons'
import { Avatar } from '@/components/ui/avatar'
import { Button, IconButton } from '@/components/ui/button'
import { Modal, Sheet } from '@/components/ui/dialog'
import { Field } from '@/components/ui/input'
import { Menu, MenuItem, MenuSeparator } from '@/components/ui/menu'
import { EmptyState } from '@/components/ui/misc'
import { Select } from '@/components/ui/select'
import { serviceById, services } from '@/data/services'
import { bookableStaff, staffById } from '@/data/staff'
import { formatRelative } from '@/lib/format'
import { useOverlays } from '@/lib/overlays'
import { useData } from '@/lib/store'
import { NOW } from '@/lib/time'
import { useWaitingList } from './data'

const WINDOWS = ['Today, any time', 'Today after 16:00', 'Tomorrow morning', 'Tomorrow evening', 'This week, any time', 'Saturday, any time']

function AddToWaitingList({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const add = useWaitingList((s) => s.add)
  const clients = useData((s) => s.clients)
  const [clientId, setClientId] = useState<string | null>(null)
  const [serviceId, setServiceId] = useState<string>('v1')
  const [staffId, setStaffId] = useState<string>('any')
  const [window, setWindow] = useState(WINDOWS[0])
  const capable = bookableStaff.filter((s) => serviceById[serviceId].staffIds.includes(s.id))

  function submit() {
    if (!clientId) return
    add({ id: `w${Date.now()}`, clientId, serviceId, staffId: staffId === 'any' ? null : staffId, window, addedAt: NOW })
    onOpenChange(false)
    const c = clients.find((x) => x.id === clientId)
    toast.success(`${c?.firstName} is on the waiting list`, { description: 'We’ll offer the first matching free time in Telegram.' })
    setClientId(null)
  }

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title="Add to waiting list"
      size="sm"
      footer={
        <>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={submit} disabled={!clientId}>
            Add
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <Field label="Client">
          <ClientPicker value={clientId} onChange={setClientId} />
        </Field>
        <Field label="Service">
          <Select
            value={serviceId}
            onChange={(v) => {
              setServiceId(v)
              setStaffId('any')
            }}
            options={services.map((s) => ({ value: s.id, label: s.name, hint: s.category }))}
          />
        </Field>
        <Field label="Master">
          <Select
            value={staffId}
            onChange={setStaffId}
            options={[{ value: 'any', label: 'Any master' }, ...capable.map((s) => ({ value: s.id, label: s.name }))]}
          />
        </Field>
        <Field label="When it suits them">
          <Select value={window} onChange={setWindow} options={WINDOWS.map((w) => ({ value: w, label: w }))} />
        </Field>
      </div>
    </Modal>
  )
}

export function WaitingListSheet() {
  const open = useWaitingList((s) => s.open)
  const setOpen = useWaitingList((s) => s.setOpen)
  const list = useWaitingList((s) => s.list)
  const remove = useWaitingList((s) => s.remove)
  const add = useWaitingList((s) => s.add)
  const clients = useData((s) => s.clients)
  const openNewVisit = useOverlays((s) => s.openNewVisit)
  const [adding, setAdding] = useState(false)

  return (
    <>
      <Sheet
        open={open}
        onOpenChange={setOpen}
        title="Waiting list"
        width="md"
        actions={
          <Button size="sm" variant="secondary" icon={I.add} onClick={() => setAdding(true)}>
            Add
          </Button>
        }
      >
        <p className="px-5 pt-4 text-sm text-muted">
          When a visit is cancelled, the freed time is offered to matching clients in Telegram automatically. The first to confirm gets it.
        </p>
        {list.length ? (
          <ul className="px-2 py-3">
            {list.map((w) => {
              const c = clients.find((x) => x.id === w.clientId)
              const svc = serviceById[w.serviceId]
              const master = w.staffId ? staffById[w.staffId].name.split(' ')[0] : 'Any master'
              if (!c) return null
              return (
                <li key={w.id} className="flex items-center gap-3 rounded-xl px-3 py-3 hover:bg-fill">
                  <Avatar name={c.name} />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-base text-fg">{c.name}</div>
                    <div className="truncate text-sm text-muted">
                      {svc.name} · {master}
                    </div>
                    <div className="mt-0.5 flex items-center gap-1.5 text-xs text-faint">
                      <Icon icon={I.clock} size={12} />
                      {w.window} · added {formatRelative(w.addedAt)}
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() =>
                      toast.success(`Free time offered to ${c.firstName}`, {
                        description: 'Sent in Telegram. They can confirm in one tap; you’ll get a notification.',
                      })
                    }
                  >
                    Offer time
                  </Button>
                  <Menu align="end" trigger={<IconButton icon={I.more} label="More" size="sm" tooltip={false} />}>
                    <MenuItem
                      icon={I.calendarAdd}
                      onClick={() => {
                        setOpen(false)
                        openNewVisit({ clientId: c.id, serviceIds: [w.serviceId], staffId: w.staffId ?? undefined })
                      }}
                    >
                      Book now
                    </MenuItem>
                    <MenuSeparator />
                    <MenuItem
                      icon={I.delete}
                      danger
                      onClick={() => {
                        remove(w.id)
                        toast(`${c.firstName} removed from the waiting list`, { action: { label: 'Undo', onClick: () => add(w) } })
                      }}
                    >
                      Remove
                    </MenuItem>
                  </Menu>
                </li>
              )
            })}
          </ul>
        ) : (
          <EmptyState icon={I.hourglass} title="Nobody is waiting" description="Add clients who want a time that’s fully booked." />
        )}
        {/* Rendered inside the sheet so it counts as a nested dialog, not an outside click. */}
        <AddToWaitingList open={adding} onOpenChange={setAdding} />
      </Sheet>
    </>
  )
}
