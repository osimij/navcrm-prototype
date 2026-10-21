import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router'
import { toast } from 'sonner'
import { I, Icon } from '@/components/icons'
import { Avatar, AvatarStack } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button, IconButton } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { DatePicker } from '@/components/ui/date-picker'
import { Modal } from '@/components/ui/dialog'
import { Field } from '@/components/ui/input'
import { Menu, MenuItem } from '@/components/ui/menu'
import { Select } from '@/components/ui/select'
import { Table, TD, TH, THead, TR } from '@/components/ui/table'
import { Segmented } from '@/components/ui/tabs'
import { staffById } from '@/data/staff'
import { formatDate } from '@/lib/format'
import { TODAY } from '@/lib/time'
import { POSITIONS, payrollStaff, resolveScheme, type Assignment } from './data'
import { Note } from './shared'
import { usePayroll } from './store'

function AssignModal({ edit, onDone }: { edit: Assignment | null; onDone: () => void }) {
  const open = usePayroll((s) => s.modal === 'assign')
  const setModal = usePayroll((s) => s.setModal)
  const schemes = usePayroll((s) => s.schemes)
  const assignments = usePayroll((s) => s.assignments)
  const addAssignment = usePayroll((s) => s.addAssignment)
  const [kind, setKind] = useState<'staff' | 'position'>('staff')
  const [staffId, setStaffId] = useState(payrollStaff[0].id)
  const [position, setPosition] = useState(POSITIONS[0])
  const [schemeId, setSchemeId] = useState(schemes[0].id)
  const [from, setFrom] = useState(TODAY)

  useEffect(() => {
    if (!open) return
    if (edit) {
      setKind(edit.target.kind)
      if (edit.target.kind === 'staff') setStaffId(edit.target.staffId)
      else setPosition(edit.target.position)
      setSchemeId(edit.schemeId)
    } else {
      setKind('staff')
      setSchemeId(schemes.find((s) => s.active)?.id ?? schemes[0].id)
    }
    setFrom(new Date(TODAY.getFullYear(), TODAY.getMonth() + 1, 1))
  }, [open, edit, schemes])

  const close = () => {
    setModal(null)
    onDone()
  }
  const positionScheme = assignments.find((a) => a.target.kind === 'position' && a.target.position === staffById[staffId].position)

  return (
    <Modal
      open={open}
      onOpenChange={(o) => !o && close()}
      title={edit ? 'Change scheme' : 'Assign scheme'}
      size="sm"
      footer={
        <>
          <Button variant="ghost" onClick={close}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={() => {
              addAssignment({ id: `as${Date.now()}`, target: kind === 'staff' ? { kind, staffId } : { kind, position }, schemeId, from })
              close()
              toast.success('Scheme assigned', { description: `From ${formatDate(from)}. Earlier periods keep their old scheme.` })
            }}
          >
            Assign
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        {!edit && (
          <Field label="Assign to">
            <Segmented fill value={kind} onChange={setKind} items={[{ value: 'staff', label: 'A person' }, { value: 'position', label: 'A position' }]} />
          </Field>
        )}
        {kind === 'staff' ? (
          <Field
            label="Person"
            hint={positionScheme ? `Overrides their position’s scheme: ${schemes.find((s) => s.id === positionScheme.schemeId)?.name}` : undefined}
          >
            <Select
              value={staffId}
              onChange={setStaffId}
              disabled={!!edit}
              options={payrollStaff.map((s) => ({ value: s.id, label: s.name, hint: s.position, icon: <Avatar name={s.name} color={s.color} size="sm" /> }))}
            />
          </Field>
        ) : (
          <Field label="Position" hint="Everyone in this position without a personal scheme">
            <Select value={position} onChange={setPosition} disabled={!!edit} options={POSITIONS.map((p) => ({ value: p, label: p }))} />
          </Field>
        )}
        <Field label="Scheme">
          <Select value={schemeId} onChange={setSchemeId} options={schemes.filter((s) => s.active).map((s) => ({ value: s.id, label: s.name }))} />
        </Field>
        <Field label="From">
          <DatePicker value={from} onChange={setFrom} />
        </Field>
      </div>
    </Modal>
  )
}

export function Assignments() {
  const assignments = usePayroll((s) => s.assignments)
  const schemes = usePayroll((s) => s.schemes)
  const setModal = usePayroll((s) => s.setModal)
  const navigate = useNavigate()
  const [edit, setEdit] = useState<Assignment | null>(null)

  const rows = [...assignments].sort((a, b) => (a.target.kind === b.target.kind ? 0 : a.target.kind === 'position' ? -1 : 1))

  return (
    <>
      <Note className="mb-5">A scheme assigned to a person overrides the scheme of their position.</Note>
      <Card>
        <Table>
          <THead>
            <TH>Applies to</TH>
            <TH>Scheme</TH>
            <TH>From</TH>
            <TH>Covers</TH>
            <TH className="w-12" />
          </THead>
          <tbody>
            {rows.map((a) => {
              const scheme = schemes.find((s) => s.id === a.schemeId)
              const covered =
                a.target.kind === 'staff'
                  ? [staffById[a.target.staffId]]
                  : payrollStaff.filter((s) => s.position === (a.target as { position: string }).position)
              const effective = covered.filter((s) => resolveScheme(s.id, assignments)?.schemeId === a.schemeId)
              const overridden = covered.filter((s) => !effective.includes(s))
              return (
                <TR key={a.id}>
                  <TD>
                    {a.target.kind === 'staff' ? (
                      <span className="flex items-center gap-2.5">
                        <Avatar name={staffById[a.target.staffId].name} color={staffById[a.target.staffId].color} size="md" />
                        <span>
                          <span className="block text-base text-fg">{staffById[a.target.staffId].name}</span>
                          <span className="block text-sm text-muted">Person</span>
                        </span>
                      </span>
                    ) : (
                      <span className="flex items-center gap-2.5">
                        <span className="grid size-8 place-items-center rounded-full bg-fill text-muted">
                          <Icon icon={I.briefcase} size={16} />
                        </span>
                        <span>
                          <span className="block text-base text-fg">{a.target.position}</span>
                          <span className="block text-sm text-muted">Position</span>
                        </span>
                      </span>
                    )}
                  </TD>
                  <TD>
                    <button type="button" className="text-left text-fg hover:underline underline-offset-4" onClick={() => navigate(`/payroll/schemes/${a.schemeId}`)}>
                      {scheme?.name}
                    </button>
                  </TD>
                  <TD muted>{formatDate(a.from)}</TD>
                  <TD>
                    <span className="flex items-center gap-2">
                      {effective.length > 0 && <AvatarStack names={effective.map((s) => ({ name: s.name, color: s.color }))} />}
                      {overridden.length > 0 && <Badge>Overridden for {overridden.map((s) => s.name.split(' ')[0]).join(', ')}</Badge>}
                      {!covered.length && <span className="text-sm text-faint">Nobody in this position</span>}
                    </span>
                  </TD>
                  <TD align="right">
                    <Menu trigger={<IconButton icon={I.more} label="Actions" size="sm" />} align="end">
                      <MenuItem
                        icon={I.edit}
                        onClick={() => {
                          setEdit(a)
                          setModal('assign')
                        }}
                      >
                        Change scheme
                      </MenuItem>
                    </Menu>
                  </TD>
                </TR>
              )
            })}
          </tbody>
        </Table>
      </Card>
      <AssignModal edit={edit} onDone={() => setEdit(null)} />
    </>
  )
}
