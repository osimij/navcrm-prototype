import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router'
import { toast } from 'sonner'
import { I, Icon } from '@/components/icons'
import { Avatar } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button, IconButton } from '@/components/ui/button'
import { Modal, Sheet, DetailRow } from '@/components/ui/dialog'
import { Field, Input, PhoneInput, Textarea } from '@/components/ui/input'
import { Menu, MenuItem, MenuSeparator } from '@/components/ui/menu'
import { EmptyState, Money } from '@/components/ui/misc'
import { Switch } from '@/components/ui/controls'
import { Segmented, Tabs } from '@/components/ui/tabs'
import { STATUS_META, serviceNames, type Appointment } from '@/data/appointments'
import { CATEGORY_LABEL, type Client } from '@/data/clients'
import { staffById } from '@/data/staff'
import { cn } from '@/lib/cn'
import { formatDate, formatTime, formatNumber, formatPhone, formatRelative, plural, monthShort } from '@/lib/format'
import { useOverlays } from '@/lib/overlays'
import { useClient, useData } from '@/lib/store'
import { NOW, daysBetween } from '@/lib/time'
import { useNotes, notesFor } from '@/pages/clients/notes'
import { CATEGORY_TONE, TAGS, ageOf, birthdayIn, clientPayments, clientSince, clientVisits, formatWhen } from '@/pages/clients/utils'

type Tab = 'overview' | 'visits' | 'payments' | 'notes'

function Stat({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="min-w-0 rounded-xl bg-fill px-3.5 py-3">
      <div className="text-sm text-muted">{label}</div>
      <div className="mt-1 truncate text-lg text-fg tabular">{children}</div>
    </div>
  )
}

function EditClientModal({ client, open, onOpenChange }: { client: Client; open: boolean; onOpenChange: (o: boolean) => void }) {
  const updateClient = useData((s) => s.updateClient)
  const [first, setFirst] = useState(client.firstName)
  const [last, setLast] = useState(client.lastName)
  const [phone, setPhone] = useState(client.phone.replace(/\D/g, '').slice(-9))
  const [gender, setGender] = useState(client.gender)
  const [marketing, setMarketing] = useState(client.consentMarketing)

  useEffect(() => {
    if (!open) return
    setFirst(client.firstName)
    setLast(client.lastName)
    setPhone(client.phone.replace(/\D/g, '').slice(-9))
    setGender(client.gender)
    setMarketing(client.consentMarketing)
  }, [open, client])

  const valid = first.trim() && phone.length === 9
  function save() {
    if (!valid) return
    updateClient(client.id, {
      firstName: first.trim(),
      lastName: last.trim(),
      name: `${first.trim()} ${last.trim()}`.trim(),
      phone: `+992${phone}`,
      gender,
      consentMarketing: marketing,
    })
    onOpenChange(false)
    toast.success('Client updated')
  }

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title="Edit client"
      footer={
        <>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={save} disabled={!valid}>
            Save
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <Field label="Phone">
          <PhoneInput value={phone} onChange={setPhone} />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="First name">
            <Input value={first} onChange={(e) => setFirst(e.target.value)} />
          </Field>
          <Field label="Last name" optional>
            <Input value={last} onChange={(e) => setLast(e.target.value)} />
          </Field>
        </div>
        <Field label="Gender">
          <Segmented
            fill
            value={gender}
            onChange={setGender}
            items={[
              { value: 'female', label: 'Female' },
              { value: 'male', label: 'Male' },
            ]}
          />
        </Field>
        <Switch
          checked={marketing}
          onChange={setMarketing}
          label="Agrees to offers and promotions"
          description="Without this, campaigns skip the client. Reminders about visits still go out."
        />
      </div>
    </Modal>
  )
}

function VisitRow({ a, onOpen }: { a: Appointment; onOpen: () => void }) {
  const s = staffById[a.staffId]
  const meta = STATUS_META[a.status]
  return (
    <button type="button" onClick={onOpen} className="flex w-full items-center gap-3.5 rounded-xl px-3 py-2.5 text-left hover:bg-fill">
      <span className="w-10 shrink-0 text-center">
        <span className="block text-lg leading-6 text-fg tabular">{a.start.getDate()}</span>
        <span className="block text-xs text-faint">{monthShort(a.start.getMonth())}</span>
      </span>
      <span className="min-w-0 flex-1">
        <span className={cn('block truncate text-base', a.status === 'cancelled' ? 'text-muted line-through' : 'text-fg')}>{serviceNames(a)}</span>
        <span className="flex items-center gap-1.5 text-sm text-muted">
          <Avatar name={s.name} color={s.color} size="xs" />
          {s.name.split(' ')[0]} · {formatTime(a.start)}
        </span>
      </span>
      {a.status !== 'completed' && <Badge tone={meta.tone}>{meta.label}</Badge>}
      <Money value={a.price} className={cn('w-24 text-right text-base', a.status === 'cancelled' || a.status === 'no_show' ? 'text-faint' : '')} />
    </button>
  )
}

export function ClientSheet() {
  const id = useOverlays((s) => s.clientId)
  const close = useOverlays((s) => s.close)
  const { openVisit, openNewVisit, openNewTask } = useOverlays()
  const live = useClient(id)
  const entries = useData((s) => s.entries)
  const updateClient = useData((s) => s.updateClient)
  const notesByClient = useNotes((s) => s.byClient)
  const addNote = useNotes((s) => s.add)
  const navigate = useNavigate()

  // Keep the last client rendered while the sheet animates out.
  const last = useRef<Client | undefined>(live)
  if (live) last.current = live
  const client = live ?? last.current

  const [tab, setTab] = useState<Tab>('overview')
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState('')

  useEffect(() => {
    if (id) {
      setTab('overview')
      setDraft('')
    }
  }, [id])

  const visits = useMemo(() => (client ? clientVisits(entries, client.id) : []), [entries, client])
  const upcoming = visits.filter((a) => a.start > NOW && a.status !== 'cancelled' && a.status !== 'completed').sort((a, b) => +a.start - +b.start)
  const past = visits.filter((a) => !upcoming.includes(a)).sort((a, b) => +b.start - +a.start)
  const payments = useMemo(() => (client ? clientPayments(entries, client) : []), [entries, client])

  if (!client) return null

  const onClose = () => close('clientId')
  const notes = notesFor(notesByClient, client.id, client.note)
  const next = upcoming[0]
  const avg = client.visits ? Math.round(client.totalSpent / client.visits) : 0
  const earlier = Math.max(0, client.visits - past.filter((a) => a.status === 'completed').length)
  const master = staffById[client.favoriteStaffId]
  const bday = birthdayIn(client)
  const age = ageOf(client)
  const interval =
    client.visits >= 3 && client.lastVisit ? Math.max(7, Math.round(daysBetween(clientSince(client), client.lastVisit) / Math.max(1, client.visits - 1))) : null

  const go = (to: string) => {
    onClose()
    navigate(to)
  }

  function archive() {
    const was = client!.archived
    updateClient(client!.id, { archived: !was })
    if (!was) {
      onClose()
      toast(`${client!.name} archived`, { action: { label: 'Undo', onClick: () => updateClient(client!.id, { archived: false }) } })
    } else toast.success(`${client!.name} restored`)
  }

  return (
    <>
      <Sheet
        open={!!live}
        onOpenChange={(o) => !o && onClose()}
        title="Client"
        width="xl"
        actions={
          <Menu align="end" trigger={<IconButton icon={I.more} label="More" size="sm" tooltip={false} />}>
            <MenuItem icon={I.edit} onClick={() => setEditing(true)}>
              Edit details
            </MenuItem>
            <MenuItem icon={I.tasks} onClick={() => openNewTask({ clientId: client.id })}>
              Add task
            </MenuItem>
            <MenuSeparator />
            <MenuItem icon={I.delete} danger={!client.archived} onClick={archive}>
              {client.archived ? 'Restore from archive' : 'Archive client'}
            </MenuItem>
          </Menu>
        }
      >
        <div className="px-6 pt-6">
          <div className="flex items-start gap-4">
            <Avatar name={client.name} size="xl" />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-2xl font-normal text-fg">{client.name}</h2>
                <Badge tone={CATEGORY_TONE[client.category]}>{CATEGORY_LABEL[client.category]}</Badge>
                {client.archived && <Badge>Archived</Badge>}
              </div>
              <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-base text-muted">
                <span className="flex items-center gap-1">
                  <span className="tabular">{formatPhone(client.phone)}</span>
                  <IconButton
                    icon={I.copy}
                    label="Copy phone"
                    size="xs"
                    iconSize={14}
                    onClick={() => {
                      navigator.clipboard?.writeText(client.phone).catch(() => {})
                      toast.success('Phone number copied')
                    }}
                  />
                </span>
                {client.telegram && (
                  <span className="flex items-center gap-1 text-sm">
                    <Icon icon={I.telegram} size={14} className="text-accent-fg" />
                    Telegram connected
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            <Button variant="primary" icon={I.calendarAdd} onClick={() => openNewVisit({ clientId: client.id })}>
              Book visit
            </Button>
            <Button icon={I.register} onClick={() => go(`/pos?client=${client.id}`)}>
              New sale
            </Button>
            <Button icon={I.message} onClick={() => go('/inbox')}>
              Message
            </Button>
          </div>

          {client.debt > 0 && (
            <div className="mt-5 flex items-center gap-3 rounded-xl bg-negative-soft px-4 py-3">
              <Icon icon={I.wallet} size={18} className="text-negative" />
              <span className="flex-1 text-base text-fg">
                Owes <Money value={client.debt} className="font-medium text-negative" /> from a previous visit
              </span>
              <Button size="sm" variant="secondary" onClick={() => go('/pos/debts')}>
                Collect
              </Button>
            </div>
          )}

          <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
            <Stat label="Visits">{formatNumber(client.visits)}</Stat>
            <Stat label="Spent">
              <Money value={client.totalSpent} />
            </Stat>
            <Stat label="Average receipt">
              <Money value={avg} />
            </Stat>
            <Stat label="Bonuses">
              <Money value={client.bonuses} currency={false} />
            </Stat>
          </div>

          <Tabs
            className="mt-6"
            value={tab}
            onChange={setTab}
            items={[
              { value: 'overview', label: 'Overview' },
              { value: 'visits', label: 'Visits', count: visits.length },
              { value: 'payments', label: 'Payments' },
              { value: 'notes', label: 'Notes', count: notes.length || undefined },
            ]}
          />
        </div>

        <div className="px-6 pt-5 pb-8">
          {tab === 'overview' && (
            <div className="flex flex-col gap-6">
              {next ? (
                <button
                  type="button"
                  onClick={() => openVisit(next.id)}
                  className="press flex items-center gap-4 rounded-xl bg-fill p-4 text-left hover:bg-fill-hover"
                >
                  <span className="grid size-10 place-items-center rounded-full bg-surface text-muted">
                    <Icon icon={I.calendar} size={18} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm text-muted">Next visit</span>
                    <span className="block text-base font-medium text-fg">{formatWhen(next.start)}</span>
                    <span className="block truncate text-sm text-muted">
                      {serviceNames(next)} with {staffById[next.staffId].name.split(' ')[0]}
                    </span>
                  </span>
                  <Badge tone={STATUS_META[next.status].tone}>{STATUS_META[next.status].label}</Badge>
                </button>
              ) : (
                <div className="flex items-center gap-4 rounded-xl bg-fill p-4">
                  <span className="grid size-10 place-items-center rounded-full bg-surface text-muted">
                    <Icon icon={I.calendar} size={18} />
                  </span>
                  <span className="text-base text-muted">
                    No visit booked.
                    {interval && client.lastVisit && (
                      <>
                        {' '}
                        Usually comes every {interval < 14 ? `${interval} days` : `${Math.round(interval / 7)} weeks`}; last time {formatRelative(client.lastVisit)}.
                      </>
                    )}
                  </span>
                </div>
              )}

              {notes[0] && (
                <div className="flex gap-3 rounded-xl bg-warning-soft px-4 py-3">
                  <Icon icon={I.note} size={18} className="mt-px text-warning" />
                  <div className="min-w-0">
                    <p className="text-base text-fg">{notes[0].text}</p>
                    <p className="mt-0.5 text-sm text-muted">
                      {notes[0].author}, {formatRelative(notes[0].at)}
                    </p>
                  </div>
                </div>
              )}

              <div>
                <div className="mb-2 text-sm font-medium text-muted">Tags</div>
                <div className="flex flex-wrap items-center gap-1.5">
                  {client.tags.map((t) => (
                    <span key={t} className="inline-flex h-7 items-center gap-1 rounded-full bg-fill pr-1 pl-3 text-sm text-fg">
                      {t}
                      <button
                        type="button"
                        aria-label={`Remove ${t}`}
                        onClick={() => updateClient(client.id, { tags: client.tags.filter((x) => x !== t) })}
                        className="grid size-5 place-items-center rounded-full text-faint hover:bg-fill-hover hover:text-fg"
                      >
                        <Icon icon={I.close} size={12} />
                      </button>
                    </span>
                  ))}
                  <Menu
                    trigger={
                      <button type="button" className="press inline-flex h-7 items-center gap-1 rounded-full px-2.5 text-sm text-muted ring-1 ring-inset ring-border hover:bg-fill hover:text-fg">
                        <Icon icon={I.add} size={14} />
                        Add tag
                      </button>
                    }
                  >
                    {TAGS.filter((t) => !client.tags.includes(t)).map((t) => (
                      <MenuItem key={t} onClick={() => updateClient(client.id, { tags: [...client.tags, t] })}>
                        {t}
                      </MenuItem>
                    ))}
                  </Menu>
                </div>
              </div>

              <div className="divide-y divide-border border-y border-border">
                <DetailRow label="Usual master">
                  <span className="inline-flex items-center gap-2">
                    <Avatar name={master.name} color={master.color} size="sm" />
                    {master.name}
                  </span>
                </DetailRow>
                <DetailRow label="Birthday">
                  {client.birthday ? (
                    <span className="inline-flex items-center gap-2">
                      {formatDate(client.birthday, { year: true })}
                      <span className="text-muted">· {age}</span>
                      {bday && <Badge tone="accent">{bday === 'today' ? 'Today' : `Birthday ${bday}`}</Badge>}
                    </span>
                  ) : (
                    <span className="text-faint">Not set</span>
                  )}
                </DetailRow>
                <DetailRow label="Reminders">{client.telegram ? 'Telegram, then SMS' : 'SMS'}</DetailRow>
                <DetailRow label="Came from">{client.source}</DetailRow>
                <DetailRow label="Client since">{formatDate(clientSince(client), { year: true })}</DetailRow>
              </div>

              <div>
                <div className="mb-1 text-sm font-medium text-muted">Consents</div>
                <div className="divide-y divide-border border-y border-border">
                  <DetailRow label="Personal data processing">
                    <span className="inline-flex items-center gap-1.5">
                      <Icon icon={I.checkCircle} size={16} className="text-positive" />
                      Signed {formatDate(clientSince(client), { year: true })}
                    </span>
                  </DetailRow>
                  <DetailRow label="Offers and promotions">
                    {client.consentMarketing ? (
                      <span className="inline-flex items-center gap-1.5">
                        <Icon icon={I.checkCircle} size={16} className="text-positive" />
                        Agreed
                      </span>
                    ) : (
                      <span className="text-muted">Not agreed · campaigns skip this client</span>
                    )}
                  </DetailRow>
                </div>
              </div>
            </div>
          )}

          {tab === 'visits' &&
            (visits.length ? (
              <div className="flex flex-col gap-5">
                {upcoming.length > 0 && (
                  <div>
                    <div className="mb-1 px-3 text-sm font-medium text-muted">Upcoming</div>
                    {upcoming.map((a) => (
                      <VisitRow key={a.id} a={a} onOpen={() => openVisit(a.id)} />
                    ))}
                  </div>
                )}
                {past.length > 0 && (
                  <div>
                    <div className="mb-1 px-3 text-sm font-medium text-muted">History</div>
                    {past.map((a) => (
                      <VisitRow key={a.id} a={a} onOpen={() => openVisit(a.id)} />
                    ))}
                  </div>
                )}
                {earlier > 0 && <p className="px-3 text-sm text-faint">And {plural(earlier, 'earlier visit')} before {formatDate(past.at(-1)?.start ?? NOW)}.</p>}
              </div>
            ) : (
              <EmptyState icon={I.calendar} title="No visits yet" description="Visits booked for this client will show up here." className="py-10" />
            ))}

          {tab === 'payments' &&
            (payments.length ? (
              <div>
                <div className="mb-3 flex items-baseline justify-between px-3">
                  <span className="text-sm text-muted">Paid in the last 60 days</span>
                  <Money value={payments.reduce((m, p) => m + p.amount, 0)} className="text-lg" />
                </div>
                {payments.map((p) => (
                  <div key={p.id} className="flex items-center gap-3.5 rounded-xl px-3 py-2.5">
                    <span className="grid size-9 shrink-0 place-items-center rounded-full bg-fill text-muted">
                      <Icon icon={p.kind === 'product' ? I.bag : I.receipt} size={16} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-base text-fg">{p.items}</span>
                      <span className="block text-sm text-muted">
                        #{p.number} · {formatDate(p.date)} · {p.method}
                      </span>
                    </span>
                    <Money value={p.amount} className="text-base" />
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState icon={I.receipt} title="No payments yet" description="Receipts from the register appear here." className="py-10" />
            ))}

          {tab === 'notes' && (
            <div>
              <form
                onSubmit={(e) => {
                  e.preventDefault()
                  if (!draft.trim()) return
                  addNote(client.id, draft.trim())
                  setDraft('')
                }}
                className="mb-5"
              >
                <Textarea
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  placeholder="Preferences, allergies, anything the next master should know"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                      e.preventDefault()
                      e.currentTarget.form?.requestSubmit()
                    }
                  }}
                />
                <div className="mt-2 flex justify-end">
                  <Button type="submit" size="sm" variant="primary" disabled={!draft.trim()}>
                    Add note
                  </Button>
                </div>
              </form>
              {notes.length ? (
                <ul className="flex flex-col gap-4">
                  {notes.map((n) => (
                    <li key={n.id} className="flex gap-3">
                      <Avatar name={n.author} size="sm" className="mt-0.5" />
                      <div className="min-w-0">
                        <div className="text-sm text-muted">
                          <span className="font-medium text-fg">{n.author}</span> · {formatRelative(n.at)}
                        </div>
                        <p className="mt-0.5 text-base text-fg">{n.text}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-center text-base text-muted">No notes yet.</p>
              )}
            </div>
          )}
        </div>
      </Sheet>
      <EditClientModal client={client} open={editing} onOpenChange={setEditing} />
    </>
  )
}
