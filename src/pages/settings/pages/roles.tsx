import { useState } from 'react'
import { toast } from 'sonner'
import { I, Icon } from '@/components/icons'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Chip } from '@/components/ui/controls'
import { Modal } from '@/components/ui/dialog'
import { Field, Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { cn } from '@/lib/cn'
import { SaveBar, SettingsPage } from '../ui'

type Scope = 'none' | 'own' | 'branch' | 'all'

const SCOPES: { value: Scope; label: string }[] = [
  { value: 'none', label: 'No access' },
  { value: 'own', label: 'Own only' },
  { value: 'branch', label: 'Own branch' },
  { value: 'all', label: 'All branches' },
]

const GROUPS = [
  { id: 'overview', name: 'Overview & reports', what: 'Home, reports, revenue numbers' },
  { id: 'clients', name: 'Clients & tasks', what: 'Client base, phones, notes, tasks' },
  { id: 'calendar', name: 'Calendar & services', what: 'Bookings, time off, service list' },
  { id: 'register', name: 'Register & sales', what: 'Sales, refunds, cash shifts, debts' },
  { id: 'inventory', name: 'Inventory', what: 'Products, stock documents, orders' },
  { id: 'payroll', name: 'Payroll & timesheet', what: 'Accruals, payouts, hours' },
  { id: 'sublease', name: 'Sublease', what: 'Tenants, rent, tenants’ money' },
  { id: 'marketing', name: 'Marketing, messages & reviews', what: 'Campaigns, inbox, review replies' },
  { id: 'medical', name: 'Medical records & consents', what: 'Signed consents, procedure notes' },
  { id: 'industry', name: 'Industry sections', what: 'Laboratory orders and results' },
  { id: 'ai', name: 'AI assistant', what: 'Ask questions about business data' },
  { id: 'settings', name: 'Business settings', what: 'Everything under Settings' },
] as const

type GroupId = (typeof GROUPS)[number]['id']
type Perms = Record<GroupId, Scope>

const fill = (s: Scope): Perms => Object.fromEntries(GROUPS.map((g) => [g.id, s])) as Perms

const TEMPLATES: Record<string, { people: number; about: string; perms: Perms }> = {
  Owner: { people: 1, about: 'Full access to everything, always.', perms: fill('all') },
  Manager: { people: 0, about: 'Runs the business day to day, without business settings.', perms: { ...fill('all'), medical: 'branch', settings: 'none' } },
  Administrator: {
    people: 1,
    about: 'Front desk: books clients, takes payments, answers messages.',
    perms: { ...fill('branch'), payroll: 'none', sublease: 'none', medical: 'none', ai: 'own', settings: 'none' },
  },
  Master: {
    people: 6,
    about: 'Sees their own calendar, clients and earnings.',
    perms: { ...fill('none'), overview: 'own', clients: 'own', calendar: 'own', register: 'own', payroll: 'own', ai: 'own' },
  },
  Doctor: {
    people: 0,
    about: 'Like a master, plus medical records for their patients.',
    perms: { ...fill('none'), overview: 'own', clients: 'own', calendar: 'own', register: 'own', payroll: 'own', medical: 'own', industry: 'own', ai: 'own' },
  },
  'Lab technician': {
    people: 1,
    about: 'Works with lab orders and results.',
    perms: { ...fill('none'), clients: 'branch', medical: 'branch', industry: 'branch' },
  },
  Accountant: {
    people: 0,
    about: 'Money only: reports, register, payroll, stock value.',
    perms: { ...fill('none'), overview: 'all', register: 'all', payroll: 'all', sublease: 'all', inventory: 'all' },
  },
  Tenant: {
    people: 1,
    about: 'Rents a chair. Sees only their own clients and money.',
    perms: { ...fill('none'), overview: 'own', clients: 'own', calendar: 'own', register: 'own', sublease: 'own' },
  },
}

type Role = { name: string; template: string; people: number; about: string }

export default function RolesSettings() {
  const [roles, setRoles] = useState<Role[]>(() =>
    Object.entries(TEMPLATES).map(([name, t]) => ({ name, template: name, people: t.people, about: t.about })),
  )
  const [saved, setSaved] = useState<Record<string, Perms>>(() => Object.fromEntries(Object.entries(TEMPLATES).map(([n, t]) => [n, t.perms])))
  const [selected, setSelected] = useState('Administrator')
  const [draft, setDraft] = useState<Perms>(saved.Administrator)
  const [newOpen, setNewOpen] = useState(false)
  const [newName, setNewName] = useState('')
  const [newFrom, setNewFrom] = useState('Master')

  const role = roles.find((r) => r.name === selected)!
  const locked = selected === 'Owner'
  const dirty = JSON.stringify(draft) !== JSON.stringify(saved[selected])
  const template = TEMPLATES[role.template].perms
  const differsFromTemplate = JSON.stringify(draft) !== JSON.stringify(template)

  function select(name: string) {
    if (dirty) {
      toast('Save or discard your changes first')
      return
    }
    setSelected(name)
    setDraft(saved[name])
  }

  function createRole() {
    const name = newName.trim()
    if (!name || roles.some((r) => r.name.toLowerCase() === name.toLowerCase())) return
    setRoles((r) => [...r, { name, template: newFrom, people: 0, about: `Based on ${newFrom}.` }])
    setSaved((s) => ({ ...s, [name]: TEMPLATES[newFrom].perms }))
    setSelected(name)
    setDraft(TEMPLATES[newFrom].perms)
    setNewOpen(false)
    setNewName('')
    toast.success(`Role “${name}” created`)
  }

  const list = (
    <ul className="flex flex-col gap-px">
      {roles.map((r) => (
        <li key={r.name}>
          <button
            type="button"
            onClick={() => select(r.name)}
            className={cn(
              'press flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2 text-left text-base',
              selected === r.name ? 'bg-fill-active font-medium text-fg' : 'text-muted hover:bg-fill hover:text-fg',
            )}
          >
            <span className="truncate">{r.name}</span>
            <span className="text-sm font-normal text-faint tabular">{r.people}</span>
          </button>
        </li>
      ))}
    </ul>
  )

  return (
    <SettingsPage
      wide
      title="Roles & permissions"
      description="What each role can see and change. Scope limits it to their own records, their branch, or every branch."
      actions={
        <Button variant="primary" icon={I.add} onClick={() => setNewOpen(true)}>
          New role
        </Button>
      }
    >
      <div className="grid gap-6 xl:grid-cols-[220px_minmax(0,1fr)]">
        <div className="hidden xl:block">{list}</div>
        <div className="flex gap-1.5 overflow-x-auto pb-1 [scrollbar-width:none] xl:hidden">
          {roles.map((r) => (
            <Chip key={r.name} active={selected === r.name} onClick={() => select(r.name)} count={r.people}>
              {r.name}
            </Chip>
          ))}
        </div>

        <Card className="min-w-0">
          <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border px-5 py-4">
            <div className="min-w-0">
              <h2 className="text-lg font-medium text-fg">{role.name}</h2>
              <p className="mt-0.5 text-sm text-muted">
                {role.about} {role.people > 0 ? `${role.people} ${role.people === 1 ? 'person has' : 'people have'} this role.` : 'Nobody has this role yet.'}
              </p>
            </div>
            {!locked && differsFromTemplate && (
              <Button size="sm" variant="ghost" icon={I.reload} onClick={() => setDraft(template)}>
                Reset to template
              </Button>
            )}
          </div>
          {locked && (
            <div className="flex items-center gap-2 border-b border-border bg-fill/60 px-5 py-3 text-sm text-muted">
              <Icon icon={I.lock} size={15} />
              The owner always has full access, so these can’t be changed.
            </div>
          )}
          <ul>
            {GROUPS.map((g) => (
              <li key={g.id} className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2 border-b border-border px-5 py-3.5 last:border-b-0">
                <div className="min-w-0 flex-1 basis-56">
                  <div className="text-base text-fg">{g.name}</div>
                  <div className="text-sm text-muted">{g.what}</div>
                </div>
                <Select
                  look="pill"
                  align="end"
                  value={draft[g.id]}
                  disabled={locked}
                  onChange={(v) => setDraft((d) => ({ ...d, [g.id]: v }))}
                  options={SCOPES}
                  className={cn('w-36 justify-between', draft[g.id] === 'none' && 'text-muted')}
                />
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <SaveBar
        dirty={dirty && !locked}
        onSave={() => {
          setSaved((s) => ({ ...s, [selected]: draft }))
          toast.success(`${role.name} permissions saved`, { description: 'Applies the next time they open NavCRM.' })
        }}
        onDiscard={() => setDraft(saved[selected])}
      />

      <Modal
        open={newOpen}
        onOpenChange={setNewOpen}
        title="New role"
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setNewOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={createRole} disabled={!newName.trim()}>
              Create role
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          <Field label="Name">
            <Input autoFocus value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="e.g. Senior master" onKeyDown={(e) => e.key === 'Enter' && createRole()} />
          </Field>
          <Field label="Start from" hint="Copies its permissions. You can change them after.">
            <Select value={newFrom} onChange={setNewFrom} options={Object.keys(TEMPLATES).filter((t) => t !== 'Owner').map((t) => ({ value: t, label: t }))} />
          </Field>
        </div>
      </Modal>
    </SettingsPage>
  )
}
