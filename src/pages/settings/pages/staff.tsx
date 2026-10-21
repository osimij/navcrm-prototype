import { useMemo, useState, type ReactNode } from 'react'
import { toast } from 'sonner'
import { I, Icon } from '@/components/icons'
import { Avatar } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Checkbox, Chip, Switch } from '@/components/ui/controls'
import { DatePicker } from '@/components/ui/date-picker'
import { DetailRow, Modal, Sheet } from '@/components/ui/dialog'
import { Field, Input, PhoneInput, Textarea } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Segmented, Tabs } from '@/components/ui/tabs'
import { Table, TD, TH, THead, TR } from '@/components/ui/table'
import { business, type LabelColor } from '@/data/business'
import { SERVICE_CATEGORIES, services } from '@/data/services'
import { staff as baseStaff, type Staff, type StaffRole } from '@/data/staff'
import { formatDate, formatPhone, formatRelative } from '@/lib/format'
import { TODAY, addDays } from '@/lib/time'
import { LabelSwatches, UploadTile } from '../parts-a/common'
import { SettingsPage } from '../ui'

type Member = Staff & { status: 'working' | 'invited' | 'dismissed'; hired: Date; dismissed?: Date }

const HIRED: Record<string, number> = { s0: 1460, s1: 1020, s2: 640, s3: 820, s4: 410, s5: 560, s6: 300, s7: 700, s8: 380, s9: 2 }

const INITIAL: Member[] = [
  ...baseStaff.map((s) => ({ ...s, status: (s.invited ? 'invited' : 'working') as Member['status'], hired: addDays(TODAY, -(HIRED[s.id] ?? 200)) })),
  {
    id: 'sx',
    name: 'Mavjuda Rahimova',
    phone: '+992987654321',
    role: 'Master',
    position: 'Nail artist',
    color: 'rose',
    bookable: false,
    branchIds: ['b1'],
    today: null,
    status: 'dismissed',
    hired: addDays(TODAY, -520),
    dismissed: addDays(TODAY, -71),
  },
]

const ROLES: StaffRole[] = ['Owner', 'Administrator', 'Master', 'Tenant', 'Lab technician']
const ROLE_OPTIONS = ['Owner', 'Manager', 'Administrator', 'Master', 'Doctor', 'Lab technician', 'Accountant', 'Tenant'].map((r) => ({ value: r, label: r }))
const branchName = (id: string) => business.branches.find((b) => b.id === id)?.name ?? id

function NameCell({ m }: { m: Member }) {
  if (m.status === 'invited') {
    return (
      <span className="flex items-center gap-3">
        <span className="min-w-0">
          <span className="block text-fg">Invited {m.position.toLowerCase()}</span>
          <span className="block text-sm text-muted">Hasn’t joined yet · invited {formatRelative(m.hired)}</span>
        </span>
      </span>
    )
  }
  return (
    <span className="flex items-center gap-3">
      <Avatar name={m.name} color={m.color} />
      <span className="min-w-0">
        <span className="block truncate text-fg">{m.name}</span>
        <span className="block truncate text-sm text-muted">{m.position}</span>
      </span>
    </span>
  )
}

const STATUS: Record<Member['status'], { label: string; tone: 'positive' | 'warning' | 'neutral' }> = {
  working: { label: 'Working', tone: 'positive' },
  invited: { label: 'Invite sent', tone: 'warning' },
  dismissed: { label: 'Dismissed', tone: 'neutral' },
}

type Draft = {
  first: string
  last: string
  phone: string
  lang: string
  role: string
  branches: string[]
  position: string
  hired: Date
  type: 'employee' | 'tenant'
  specs: string[]
  color: LabelColor
  bookable: boolean
  displayName: string
  bio: string
}

const emptyDraft = (): Draft => ({
  first: '',
  last: '',
  phone: '',
  lang: 'tg',
  role: 'Master',
  branches: ['b1'],
  position: '',
  hired: TODAY,
  type: 'employee',
  specs: [],
  color: 'indigo',
  bookable: true,
  displayName: '',
  bio: '',
})

function FormSection({ title, hint, children }: { title: string; hint?: string; children: ReactNode }) {
  return (
    <section className="border-t border-border pt-5 first:border-t-0 first:pt-0">
      <h3 className="text-base font-medium text-fg">{title}</h3>
      {hint && <p className="mt-0.5 text-sm text-muted">{hint}</p>}
      <div className="mt-4 flex flex-col gap-4">{children}</div>
    </section>
  )
}

function StaffForm({ draft, set, touched }: { draft: Draft; set: (p: Partial<Draft>) => void; touched: boolean }) {
  return (
    <div className="flex flex-col gap-6">
      <FormSection title="Name" hint="Leave it empty and they’ll fill it in when they accept the invite.">
        <div className="grid grid-cols-2 gap-3">
          <Field label="First name" optional>
            <Input value={draft.first} onChange={(e) => set({ first: e.target.value })} autoFocus />
          </Field>
          <Field label="Last name" optional>
            <Input value={draft.last} onChange={(e) => set({ last: e.target.value })} />
          </Field>
        </div>
      </FormSection>

      <FormSection title="Sign-in">
        <Field label="Phone" hint="This is their login. We send the invite in Telegram, or by SMS." error={touched && draft.phone.length < 9 ? 'Enter all 9 digits' : undefined}>
          <PhoneInput value={draft.phone} onChange={(phone) => set({ phone })} invalid={touched && draft.phone.length < 9} />
        </Field>
        <Field label="Language for their notifications">
          <Select
            value={draft.lang}
            onChange={(lang) => set({ lang })}
            options={[
              { value: 'tg', label: 'Тоҷикӣ' },
              { value: 'ru', label: 'Русский' },
              { value: 'en', label: 'English' },
            ]}
          />
        </Field>
      </FormSection>

      <FormSection title="Access" hint="What they can see and change. Fine-tune roles in Roles & permissions.">
        <Field label="Role">
          <Select value={draft.role} onChange={(role) => set({ role, type: role === 'Tenant' ? 'tenant' : draft.type })} options={ROLE_OPTIONS} />
        </Field>
        <Field label="Branches" error={touched && !draft.branches.length ? 'Pick at least one branch' : undefined}>
          <div className="flex flex-col gap-2.5">
            {business.branches.map((b) => (
              <Checkbox
                key={b.id}
                checked={draft.branches.includes(b.id)}
                onChange={(v) => set({ branches: v ? [...draft.branches, b.id] : draft.branches.filter((x) => x !== b.id) })}
                label={
                  <>
                    {b.name} <span className="text-muted">· {b.address}</span>
                  </>
                }
              />
            ))}
          </div>
        </Field>
      </FormSection>

      <FormSection title="Work">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Position">
            <Input value={draft.position} onChange={(e) => set({ position: e.target.value })} placeholder="e.g. Hair stylist" />
          </Field>
          <Field label="Hired">
            <DatePicker value={draft.hired} onChange={(hired) => set({ hired })} />
          </Field>
        </div>
        <Field label="Works as" hint={draft.type === 'tenant' ? 'Rents a chair. Their visits aren’t counted in salon revenue or payroll.' : 'Paid through payroll.'}>
          <Segmented
            fill
            value={draft.type}
            onChange={(type) => set({ type })}
            items={[
              { value: 'employee', label: 'Salon employee' },
              { value: 'tenant', label: 'Tenant' },
            ]}
          />
        </Field>
        <Field label="Specializations">
          <div className="flex flex-wrap gap-1.5">
            {SERVICE_CATEGORIES.map((c) => (
              <Chip key={c} active={draft.specs.includes(c)} onClick={() => set({ specs: draft.specs.includes(c) ? draft.specs.filter((x) => x !== c) : [...draft.specs, c] })}>
                {c}
              </Chip>
            ))}
          </div>
        </Field>
        <Field label="Calendar color">
          <LabelSwatches value={draft.color} onChange={(color) => set({ color })} />
        </Field>
        <Switch checked={draft.bookable} onChange={(bookable) => set({ bookable })} label="Clients can book them online" description="Shown on your booking page and in the Telegram bot." />
      </FormSection>

      <FormSection title="Profile for clients" hint="What clients see when they pick a master.">
        <UploadTile title="Add a photo" hint="A clear face photo gets more bookings" />
        <Field label="Display name" optional>
          <Input value={draft.displayName} onChange={(e) => set({ displayName: e.target.value })} placeholder={draft.first || 'e.g. Madina'} />
        </Field>
        <Field label="About" optional>
          <Textarea value={draft.bio} onChange={(e) => set({ bio: e.target.value })} placeholder="Experience, what they’re best at" />
        </Field>
      </FormSection>
    </div>
  )
}

export default function StaffSettings() {
  const [tab, setTab] = useState<'staff' | 'positions'>('staff')
  const [filter, setFilter] = useState<'working' | 'dismissed' | 'all'>('working')
  const [members, setMembers] = useState<Member[]>(INITIAL)
  const [selected, setSelected] = useState<string | null>(null)
  const [modal, setModal] = useState<'new' | string | null>(null)
  const [draft, setDraft] = useState<Draft>(emptyDraft)
  const [touched, setTouched] = useState(false)

  const visible = members.filter((m) => (filter === 'all' ? true : filter === 'working' ? m.status !== 'dismissed' : m.status === 'dismissed'))
  const current = members.find((m) => m.id === selected)

  const positions = useMemo(() => {
    const map = new Map<string, Member[]>()
    for (const m of members.filter((x) => x.status !== 'dismissed')) map.set(m.position, [...(map.get(m.position) ?? []), m])
    return [...map.entries()]
  }, [members])

  function openNew() {
    setDraft(emptyDraft())
    setTouched(false)
    setModal('new')
  }

  function openEdit(m: Member) {
    const [first = '', ...rest] = m.name.split(' ')
    setDraft({
      ...emptyDraft(),
      first,
      last: rest.join(' '),
      phone: m.phone.replace(/\D/g, '').slice(-9),
      role: m.role,
      branches: m.branchIds,
      position: m.position,
      hired: m.hired,
      type: m.tenant ? 'tenant' : 'employee',
      color: m.color,
      bookable: m.bookable,
      specs: [...new Set(services.filter((s) => s.staffIds.includes(m.id)).map((s) => s.category))],
    })
    setTouched(false)
    setSelected(null)
    setModal(m.id)
  }

  function resend(m: Member) {
    toast.success('Invite sent again', { description: `Telegram message to ${formatPhone(m.phone)}.` })
  }

  function save() {
    setTouched(true)
    if (draft.phone.length < 9 || !draft.branches.length) return
    const name = `${draft.first.trim()} ${draft.last.trim()}`.trim()
    if (modal === 'new') {
      setMembers((list) => [
        ...list,
        {
          id: `s${Date.now()}`,
          name,
          phone: `+992${draft.phone}`,
          role: (ROLES.includes(draft.role as StaffRole) ? draft.role : 'Master') as StaffRole,
          position: draft.position || draft.role,
          color: draft.color,
          bookable: draft.bookable,
          branchIds: draft.branches,
          today: null,
          tenant: draft.type === 'tenant',
          status: 'invited',
          hired: draft.hired,
        },
      ])
      toast.success('Invite sent', { description: `${name || 'They'} will get a Telegram message with a link to join.` })
    } else {
      setMembers((list) =>
        list.map((m) =>
          m.id === modal
            ? { ...m, name: name || m.name, position: draft.position, color: draft.color, bookable: draft.bookable, branchIds: draft.branches, tenant: draft.type === 'tenant' }
            : m,
        ),
      )
      toast.success('Profile saved')
    }
    setModal(null)
  }

  return (
    <SettingsPage
      wide
      title="Staff"
      description="Everyone who signs in to NavCRM. Their phone number is their login."
      actions={
        <Button variant="primary" icon={I.userAdd} onClick={openNew}>
          Add staff member
        </Button>
      }
    >
      <Tabs
        value={tab}
        onChange={setTab}
        className="mb-5"
        items={[
          { value: 'staff', label: 'Staff', count: members.filter((m) => m.status !== 'dismissed').length },
          { value: 'positions', label: 'Positions', count: positions.length },
        ]}
      />

      {tab === 'staff' ? (
        <>
          <div className="mb-4">
            <Segmented
              value={filter}
              onChange={setFilter}
              items={[
                { value: 'working', label: 'Working' },
                { value: 'dismissed', label: 'Dismissed' },
                { value: 'all', label: 'All' },
              ]}
            />
          </div>
          <Card>
            <Table>
              <THead>
                <TH>Name</TH>
                <TH>Role</TH>
                <TH>Branches</TH>
                <TH>Phone</TH>
                <TH>Online booking</TH>
                <TH>Status</TH>
              </THead>
              <tbody>
                {visible.map((m) => (
                  <TR key={m.id} onClick={() => setSelected(m.id)}>
                    <TD>
                      <NameCell m={m} />
                    </TD>
                    <TD muted>{m.role}</TD>
                    <TD muted>{m.branchIds.map(branchName).join(', ')}</TD>
                    <TD muted className="tabular whitespace-nowrap">
                      {formatPhone(m.phone)}
                    </TD>
                    <TD>{m.bookable ? <Badge tone="accent">Bookable</Badge> : <span className="text-faint">—</span>}</TD>
                    <TD>
                      {m.status === 'invited' ? (
                        <Button
                          size="sm"
                          variant="secondary"
                          icon={I.send}
                          onClick={(e) => {
                            e.stopPropagation()
                            resend(m)
                          }}
                        >
                          Resend invite
                        </Button>
                      ) : (
                        <Badge tone={STATUS[m.status].tone}>
                          {STATUS[m.status].label}
                        </Badge>
                      )}
                    </TD>
                  </TR>
                ))}
              </tbody>
            </Table>
          </Card>
        </>
      ) : (
        <Card>
          <Table>
            <THead>
              <TH>Position</TH>
              <TH>People</TH>
              <TH>Usual role</TH>
              <TH>Payroll scheme</TH>
            </THead>
            <tbody>
              {positions.map(([pos, list]) => (
                <TR key={pos}>
                  <TD>{pos}</TD>
                  <TD>
                    <span className="text-sm text-muted tabular">{list.length}</span>
                  </TD>
                  <TD muted>{list[0].role}</TD>
                  <TD muted>
                    {list[0].tenant
                      ? 'Rent, no payroll'
                      : list[0].role === 'Master'
                        ? '40% of services + 10% of products'
                        : list[0].role === 'Owner'
                          ? '—'
                          : 'Monthly salary'}
                  </TD>
                </TR>
              ))}
            </tbody>
          </Table>
        </Card>
      )}

      <Sheet
        open={!!current}
        onOpenChange={(o) => !o && setSelected(null)}
        eyebrow="Staff member"
        title={current ? current.name || 'Invited staff member' : ''}
        footer={
          current && (
            <>
              {current.status === 'invited' ? (
                <>
                  <Button variant="primary" icon={I.send} onClick={() => resend(current)}>
                    Resend invite
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => {
                      setMembers((l) => l.filter((m) => m.id !== current.id))
                      setSelected(null)
                      toast('Invite cancelled')
                    }}
                  >
                    Cancel invite
                  </Button>
                </>
              ) : (
                <>
                  <Button variant="secondary" icon={I.edit} onClick={() => openEdit(current)}>
                    Edit
                  </Button>
                  {current.status === 'working' && current.role !== 'Owner' && (
                    <Button
                      variant="ghost"
                      className="ml-auto text-negative"
                      onClick={() => {
                        const id = current.id
                        setMembers((l) => l.map((m) => (m.id === id ? { ...m, status: 'dismissed', dismissed: TODAY, bookable: false } : m)))
                        setSelected(null)
                        toast(`${current.name} dismissed`, {
                          description: 'They can no longer sign in. Their history stays.',
                          action: { label: 'Undo', onClick: () => setMembers((l) => l.map((m) => (m.id === id ? { ...m, status: 'working', dismissed: undefined } : m))) },
                        })
                      }}
                    >
                      Dismiss
                    </Button>
                  )}
                </>
              )}
            </>
          )
        }
      >
        {current && (
          <div className="p-5">
            <div className="mb-5 flex items-center gap-4">
              {current.status === 'invited' ? (
                <span className="grid size-14 place-items-center rounded-full border border-dashed border-border-strong text-faint">
                  <Icon icon={I.user} size={22} />
                </span>
              ) : (
                <Avatar name={current.name} color={current.color} size="xl" />
              )}
              <div>
                <div className="text-lg text-fg">{current.name || `Invited ${current.position.toLowerCase()}`}</div>
                <div className="text-sm text-muted">{current.position}</div>
                <Badge tone={STATUS[current.status].tone} className="mt-2">
                  {STATUS[current.status].label}
                </Badge>
              </div>
            </div>
            {current.status === 'invited' && (
              <p className="mb-4 rounded-xl bg-fill px-3.5 py-3 text-sm text-muted">
                Invited {formatDate(current.hired)}. They haven’t opened the link yet. Their name appears here once they join.
              </p>
            )}
            <div className="divide-y divide-border">
              <DetailRow label="Role">{current.role}</DetailRow>
              <DetailRow label="Branches">{current.branchIds.map(branchName).join(', ')}</DetailRow>
              <DetailRow label="Phone (login)">
                <span className="tabular">{formatPhone(current.phone)}</span>
              </DetailRow>
              <DetailRow label={current.status === 'invited' ? 'Invited' : 'Hired'}>{formatDate(current.hired, { year: true })}</DetailRow>
              {current.dismissed && <DetailRow label="Dismissed">{formatDate(current.dismissed, { year: true })}</DetailRow>}
              <DetailRow label="Works as">{current.tenant ? 'Tenant (rents a chair)' : 'Salon employee'}</DetailRow>
              <DetailRow label="Online booking">{current.bookable ? 'On' : 'Off'}</DetailRow>
              {current.today && (
                <DetailRow label="Today">
                  <span className="tabular">
                    {current.today.start}–{current.today.end}
                    {current.today.break && <span className="text-muted"> · break {current.today.break.start}</span>}
                  </span>
                </DetailRow>
              )}
              {current.rating && (
                <DetailRow label="Client rating">
                  <span className="inline-flex items-center gap-1">
                    <Icon icon={I.star} size={14} className="text-warning" />
                    {current.rating.toFixed(1)}
                  </span>
                </DetailRow>
              )}
            </div>
            {services.some((s) => s.staffIds.includes(current.id)) && (
              <div className="mt-6">
                <div className="mb-2 text-sm font-medium text-muted">Services</div>
                <div className="flex flex-wrap gap-1.5">
                  {services
                    .filter((s) => s.staffIds.includes(current.id))
                    .map((s) => (
                      <Badge key={s.id}>
                        {s.name}
                      </Badge>
                    ))}
                </div>
              </div>
            )}
          </div>
        )}
      </Sheet>

      <Modal
        open={!!modal}
        onOpenChange={(o) => !o && setModal(null)}
        title={modal === 'new' ? 'Add staff member' : 'Edit staff member'}
        size="lg"
        footer={
          <>
            <Button variant="ghost" onClick={() => setModal(null)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={save} icon={modal === 'new' ? I.send : undefined}>
              {modal === 'new' ? 'Send invite' : 'Save'}
            </Button>
          </>
        }
      >
        <StaffForm draft={draft} set={(p) => setDraft((d) => ({ ...d, ...p }))} touched={touched} />
      </Modal>
    </SettingsPage>
  )
}
