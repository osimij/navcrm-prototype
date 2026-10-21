import { useState } from 'react'
import { toast } from 'sonner'
import { I, Icon } from '@/components/icons'
import { Button, IconButton } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Switch } from '@/components/ui/controls'
import { Modal } from '@/components/ui/dialog'
import { Field, Input } from '@/components/ui/input'
import { Menu, MenuItem } from '@/components/ui/menu'
import { EmptyState } from '@/components/ui/misc'
import { Select } from '@/components/ui/select'
import { Tabs } from '@/components/ui/tabs'
import { Table, TD, TH, THead, TR } from '@/components/ui/table'
import { SettingsPage } from '../ui'

type FieldType = 'text' | 'number' | 'date' | 'list' | 'yesno' | 'file'
type Entity = 'clients' | 'visits' | 'staff' | 'rooms'
type CustomField = { id: string; name: string; type: FieldType; required: boolean; inList: boolean; options?: string[] }

const TYPE_LABEL: Record<FieldType, string> = {
  text: 'Text',
  number: 'Number',
  date: 'Date',
  list: 'List',
  yesno: 'Yes / no',
  file: 'File',
}

const INITIAL: Record<Entity, CustomField[]> = {
  clients: [
    { id: 'f1', name: 'Hair type', type: 'list', required: false, inList: false, options: ['Straight', 'Wavy', 'Curly', 'Coily'] },
    { id: 'f2', name: 'Skin type', type: 'list', required: false, inList: false, options: ['Dry', 'Normal', 'Oily', 'Combination', 'Sensitive'] },
    { id: 'f3', name: 'Allergies', type: 'text', required: false, inList: true },
    { id: 'f4', name: 'Who referred them', type: 'text', required: false, inList: false },
  ],
  visits: [
    { id: 'f5', name: 'Color formula', type: 'text', required: false, inList: false },
    { id: 'f6', name: 'Skin reaction', type: 'list', required: false, inList: false, options: ['None', 'Mild redness', 'Irritation'] },
    { id: 'f7', name: 'Before and after photos', type: 'file', required: false, inList: false },
  ],
  staff: [
    { id: 'f8', name: 'Certificate number', type: 'text', required: false, inList: false },
    { id: 'f9', name: 'Medical check valid until', type: 'date', required: true, inList: true },
  ],
  rooms: [],
}

const ENTITY_LABEL: Record<Entity, string> = { clients: 'Clients', visits: 'Visits', staff: 'Staff', rooms: 'Chairs & rooms' }

export default function CustomFieldsSettings() {
  const [entity, setEntity] = useState<Entity>('clients')
  const [fields, setFields] = useState(INITIAL)
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [type, setType] = useState<FieldType>('text')
  const [options, setOptions] = useState<string[]>([])
  const [option, setOption] = useState('')
  const [required, setRequired] = useState(false)
  const [inList, setInList] = useState(false)
  const [touched, setTouched] = useState(false)

  const list = fields[entity]

  function startAdd() {
    setName('')
    setType('text')
    setOptions([])
    setOption('')
    setRequired(false)
    setInList(false)
    setTouched(false)
    setOpen(true)
  }

  function addOption() {
    const v = option.trim()
    if (v && !options.includes(v)) setOptions([...options, v])
    setOption('')
  }

  function save() {
    setTouched(true)
    if (!name.trim() || (type === 'list' && options.length < 2)) return
    setFields((f) => ({
      ...f,
      [entity]: [...f[entity], { id: `f${Date.now()}`, name: name.trim(), type, required, inList, options: type === 'list' ? options : undefined }],
    }))
    setOpen(false)
    toast.success(`“${name.trim()}” added to ${ENTITY_LABEL[entity].toLowerCase()}`)
  }

  const update = (id: string, p: Partial<CustomField>) =>
    setFields((f) => ({ ...f, [entity]: f[entity].map((x) => (x.id === id ? { ...x, ...p } : x)) }))

  return (
    <SettingsPage
      wide
      title="Custom fields"
      description="Extra details you want to keep that NavCRM doesn’t ask for by default."
      actions={
        <Button variant="primary" icon={I.add} onClick={startAdd}>
          Add field
        </Button>
      }
    >
      <Tabs
        value={entity}
        onChange={setEntity}
        items={(Object.keys(ENTITY_LABEL) as Entity[]).map((e) => ({ value: e, label: ENTITY_LABEL[e], count: fields[e].length }))}
        className="mb-5"
      />

      <Card>
        {list.length ? (
          <Table>
            <THead>
              <TH>Field</TH>
              <TH>Type</TH>
              <TH>Required</TH>
              <TH>Show in list</TH>
              <TH className="w-12" />
            </THead>
            <tbody>
              {list.map((f) => (
                <TR key={f.id}>
                  <TD>
                    <div>{f.name}</div>
                    {f.options && <div className="truncate text-sm text-muted">{f.options.join(', ')}</div>}
                  </TD>
                  <TD muted>{TYPE_LABEL[f.type]}</TD>
                  <TD>{f.required ? <Icon icon={I.check} size={16} className="text-fg" /> : <span className="text-faint">—</span>}</TD>
                  <TD>
                    <Switch aria-label={`Show ${f.name} in lists`} checked={f.inList} onChange={(v) => update(f.id, { inList: v })} />
                  </TD>
                  <TD align="right">
                    <Menu align="end" trigger={<IconButton icon={I.more} label="Field actions" size="sm" tooltip={false} />}>
                      <MenuItem icon={I.check} onClick={() => update(f.id, { required: !f.required })}>
                        {f.required ? 'Make optional' : 'Make required'}
                      </MenuItem>
                      <MenuItem
                        icon={I.delete}
                        danger
                        onClick={() => {
                          setFields((all) => ({ ...all, [entity]: all[entity].filter((x) => x.id !== f.id) }))
                          toast(`“${f.name}” removed`, {
                            action: { label: 'Undo', onClick: () => setFields((all) => ({ ...all, [entity]: list })) },
                          })
                        }}
                      >
                        Remove
                      </MenuItem>
                    </Menu>
                  </TD>
                </TR>
              ))}
            </tbody>
          </Table>
        ) : (
          <EmptyState
            icon={I.chair}
            title="No extra fields for chairs and rooms"
            description="For example a last disinfection date or an inventory number."
          >
            <Button icon={I.add} onClick={startAdd}>
              Add field
            </Button>
          </EmptyState>
        )}
      </Card>
      <p className="mt-4 text-sm text-muted">
        Cars, rental items, work orders and repairs appear here when you add the matching sphere in your business profile.
      </p>

      <Modal
        open={open}
        onOpenChange={setOpen}
        title={`New field for ${ENTITY_LABEL[entity].toLowerCase()}`}
        footer={
          <>
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={save}>
              Add field
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          <Field label="Name" error={touched && !name.trim() ? 'Required' : undefined}>
            <Input autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Hair type" />
          </Field>
          <Field label="Type">
            <Select value={type} onChange={setType} options={(Object.keys(TYPE_LABEL) as FieldType[]).map((t) => ({ value: t, label: TYPE_LABEL[t] }))} />
          </Field>
          {type === 'list' && (
            <Field label="Options" error={touched && options.length < 2 ? 'Add at least two options' : undefined} hint="Press Enter to add each option.">
              <div className="flex flex-col gap-2">
                {options.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {options.map((o) => (
                      <span key={o} className="inline-flex h-7 items-center gap-1 rounded-full bg-fill pr-1 pl-3 text-sm text-fg">
                        {o}
                        <button
                          type="button"
                          aria-label={`Remove ${o}`}
                          onClick={() => setOptions(options.filter((x) => x !== o))}
                          className="grid size-5 place-items-center rounded-full text-faint hover:bg-fill-hover hover:text-fg"
                        >
                          <Icon icon={I.close} size={12} />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
                <Input
                  value={option}
                  onChange={(e) => setOption(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      addOption()
                    }
                  }}
                  placeholder="Type an option"
                />
              </div>
            </Field>
          )}
          <div className="flex flex-col gap-4 rounded-xl bg-fill p-4">
            <Switch checked={required} onChange={setRequired} label="Required" description="Can’t save the record without it." />
            <Switch checked={inList} onChange={setInList} label="Show in the list" description="Adds a column to the table." />
          </div>
        </div>
      </Modal>
    </SettingsPage>
  )
}
