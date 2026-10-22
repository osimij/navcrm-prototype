import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router'
import { toast } from 'sonner'
import { I } from '@/components/icons'
import { Avatar } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button, IconButton } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Checkbox, Chip, Switch } from '@/components/ui/controls'
import { DisplayMenu, DisplaySection, PropertyChips, useColumns } from '@/components/ui/display'
import { SearchInput } from '@/components/ui/input'
import { Menu, MenuItem } from '@/components/ui/menu'
import { EmptyState, Money } from '@/components/ui/misc'
import { Page, PageHeader, Toolbar } from '@/components/ui/page'
import { Select } from '@/components/ui/select'
import { StatCard } from '@/components/ui/stat-card'
import { TD, TH, THead, TR, Table, TableFooter } from '@/components/ui/table'
import { CATEGORY_LABEL, birthdaySoon, type Client, type ClientCategory } from '@/data/clients'
import { cn } from '@/lib/cn'
import { formatNumber, formatPhone, plural } from '@/lib/format'
import { useOverlays } from '@/lib/overlays'
import { searchClients } from '@/lib/search'
import { useData } from '@/lib/store'
import { useWorkspace } from '@/lib/workspace'
import { CATEGORY_TONE, TAGS, daysAgo, formatWhen, nextVisitMap } from './utils'

type Category = 'all' | ClientCategory
type Sort = 'last' | 'name' | 'spent' | 'visits'
type Column = 'category' | 'visits' | 'spent' | 'last' | 'next' | 'bonuses' | 'debt'

/** Counts double as filters, as on Sweatpals' member page: one glance, one click. */
const CATEGORIES: { id: Category; label: string }[] = [
  { id: 'all', label: 'All clients' },
  { id: 'vip', label: 'VIP' },
  { id: 'regular', label: 'Regular' },
  { id: 'new', label: 'New' },
  { id: 'lost', label: 'Lost' },
]

const SORTS: { value: Sort; label: string }[] = [
  { value: 'last', label: 'Last visit' },
  { value: 'name', label: 'Name' },
  { value: 'spent', label: 'Total spent' },
  { value: 'visits', label: 'Visits' },
]

const COLUMNS: { id: Column; label: string }[] = [
  { id: 'category', label: 'Category' },
  { id: 'visits', label: 'Visits' },
  { id: 'spent', label: 'Spent' },
  { id: 'last', label: 'Last visit' },
  { id: 'next', label: 'Next visit' },
  { id: 'bonuses', label: 'Bonuses' },
  { id: 'debt', label: 'Debt' },
]

const PAGE = 30

export function ClientsList() {
  const clients = useData((s) => s.clients)
  const entries = useData((s) => s.entries)
  const updateClient = useData((s) => s.updateClient)
  const { openClient, openNewClient } = useOverlays()
  const navigate = useNavigate()
  const sections = useWorkspace((s) => s.sections)
  const setSection = useWorkspace((s) => s.setSection)
  const values = useWorkspace((s) => s.values)
  const setValue = useWorkspace((s) => s.setValue)
  const cols = useColumns<Column>('clients', { category: true, visits: false, spent: true, last: true, next: true, bonuses: false, debt: true })

  const [query, setQuery] = useState('')
  const [category, setCategory] = useState<Category>('all')
  const [withDebt, setWithDebt] = useState(false)
  const [birthdays, setBirthdays] = useState(false)
  const [limit, setLimit] = useState(PAGE)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const sort = (SORTS.find((o) => o.value === values['clients:sort'])?.value ?? 'last') as Sort
  const setSort = (value: Sort) => setValue('clients:sort', value)
  const showArchived = sections['clients:archived'] ?? false

  const next = useMemo(() => nextVisitMap(entries), [entries])
  const active = clients.filter((c) => !c.archived)
  const count = (id: Category) => (id === 'all' ? active.length : active.filter((c) => c.category === id).length)
  const debtors = active.filter((c) => c.debt > 0).length
  const birthdayCount = active.filter((c) => birthdaySoon(c)).length

  const rows = useMemo(() => {
    let list = clients.filter((c) => (showArchived ? true : !c.archived))
    if (category !== 'all') list = list.filter((c) => c.category === category)
    if (withDebt) list = list.filter((c) => c.debt > 0)
    if (birthdays) list = list.filter((c) => birthdaySoon(c))
    if (query.trim()) {
      // Reuse the shared lookup so phone digits and names behave as everywhere else.
      const ids = new Set(searchClients(list.map((c) => ({ ...c, archived: false })), query, 500).map((c) => c.id))
      list = list.filter((c) => ids.has(c.id))
    }
    const by: Record<Sort, (a: Client, b: Client) => number> = {
      last: (a, b) => (b.lastVisit?.getTime() ?? 0) - (a.lastVisit?.getTime() ?? 0),
      name: (a, b) => a.name.localeCompare(b.name),
      spent: (a, b) => b.totalSpent - a.totalSpent,
      visits: (a, b) => b.visits - a.visits,
    }
    return [...list].sort(by[sort])
  }, [clients, category, withDebt, birthdays, query, sort, showArchived])

  const shown = rows.slice(0, limit)
  const allShownSelected = shown.length > 0 && shown.every((c) => selected.has(c.id))
  const toggle = (id: string) =>
    setSelected((s) => {
      const n = new Set(s)
      if (n.has(id)) n.delete(id)
      else n.add(id)
      return n
    })
  const filtered = category !== 'all' || withDebt || birthdays || !!query.trim()

  const reset = () => {
    setQuery('')
    setCategory('all')
    setWithDebt(false)
    setBirthdays(false)
    setLimit(PAGE)
  }
  const pick = (id: Category) => {
    setCategory(id)
    setLimit(PAGE)
    setSelected(new Set())
  }
  const v = cols.visible

  return (
    <Page width="wide">
      <PageHeader
        title="Clients"
        actions={
          <>
            <Button icon={I.users} onClick={() => navigate('/clients/segments')}>
              Segments
            </Button>
            <Menu align="end" trigger={<IconButton icon={I.more} label="More actions" variant="secondary" tooltip={false} />}>
              <MenuItem icon={I.upload} onClick={() => navigate('/clients/import')}>
                Import clients
              </MenuItem>
              <MenuItem
                icon={I.download}
                onClick={() => toast.success('Export started', { description: `${formatNumber(active.length)} clients, Excel. We’ll send the file to your Telegram.` })}
              >
                Export to Excel
              </MenuItem>
            </Menu>
            <Button variant="primary" icon={I.userAdd} onClick={() => openNewClient()}>
              New client
            </Button>
          </>
        }
      />

      <div className="mb-5 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
        {CATEGORIES.map((c) => (
          <StatCard key={c.id} size="sm" label={c.label} value={formatNumber(count(c.id))} active={category === c.id} onClick={() => pick(c.id)} />
        ))}
      </div>

      <Toolbar>
        <SearchInput
          value={query}
          onChange={(value) => {
            setQuery(value)
            setLimit(PAGE)
          }}
          placeholder="Name or last 4 digits of phone"
          className="w-full sm:w-80"
        />
        <Chip active={withDebt} onClick={() => setWithDebt(!withDebt)} icon={I.wallet} count={debtors}>
          With debt
        </Chip>
        <Chip active={birthdays} onClick={() => setBirthdays(!birthdays)} icon={I.gift} count={birthdayCount}>
          Birthday this week
        </Chip>
        <span className="flex-1" />
        <DisplayMenu badge={cols.hiddenCount}>
          <DisplaySection title="Ordering">
            <Select value={sort} onChange={setSort} options={SORTS} />
          </DisplaySection>
          <DisplaySection
            title="Columns"
            action={
              <button type="button" onClick={cols.reset} className="text-xs text-muted hover:text-fg">
                Reset
              </button>
            }
          >
            <PropertyChips items={COLUMNS} visible={cols.visible} toggle={cols.toggle} />
          </DisplaySection>
          <DisplaySection title="List">
            <Switch checked={showArchived} onChange={(value) => setSection('clients:archived', value)} label="Show archived clients" />
          </DisplaySection>
        </DisplayMenu>
      </Toolbar>

      <Card className="overflow-hidden">
        {rows.length ? (
          <>
            <Table>
              <THead>
                <TH className="w-10 !pr-0">
                  <Checkbox
                    aria-label="Select all visible clients"
                    checked={allShownSelected}
                    onChange={(value) => setSelected(value ? new Set(shown.map((c) => c.id)) : new Set())}
                  />
                </TH>
                <TH className="text-left">Client</TH>
                {v('category') && <TH className="hidden text-left sm:table-cell">Category</TH>}
                {v('visits') && <TH align="right" className="hidden md:table-cell">Visits</TH>}
                {v('spent') && <TH align="right">Spent, TJS</TH>}
                {v('last') && <TH className="hidden text-left lg:table-cell">Last visit</TH>}
                {v('next') && <TH className="hidden text-left xl:table-cell">Next visit</TH>}
                {v('bonuses') && <TH align="right" className="hidden lg:table-cell">Bonuses</TH>}
                {v('debt') && <TH align="right" className="hidden sm:table-cell">Debt, TJS</TH>}
              </THead>
              <tbody>
                {shown.map((c) => {
                  const nv = next.get(c.id)
                  return (
                    <TR key={c.id} onClick={() => openClient(c.id)} selected={selected.has(c.id)}>
                      <TD className="w-10 !pr-0">
                        <Checkbox aria-label={`Select ${c.name}`} checked={selected.has(c.id)} onChange={() => toggle(c.id)} />
                      </TD>
                      <TD className="max-sm:py-3">
                        <div className="flex min-w-0 items-center gap-3">
                          <Avatar name={c.name} inTable />
                          <div className="min-w-0">
                            <button
                              type="button"
                              className="block max-w-[11rem] truncate text-left font-medium text-fg hover:underline sm:max-w-none"
                              onClick={(e) => {
                                e.stopPropagation()
                                openClient(c.id)
                              }}
                            >
                              {c.name}
                            </button>
                            <div className="truncate text-sm text-muted tabular">{formatPhone(c.phone)}</div>
                            {v('category') && (
                              <div className="mt-1 sm:hidden">
                                <Badge tone={CATEGORY_TONE[c.category]}>{CATEGORY_LABEL[c.category]}</Badge>
                              </div>
                            )}
                          </div>
                        </div>
                      </TD>
                      {v('category') && (
                        <TD className="hidden sm:table-cell">
                          <Badge tone={CATEGORY_TONE[c.category]}>{CATEGORY_LABEL[c.category]}</Badge>
                        </TD>
                      )}
                      {v('visits') && (
                        <TD align="right" className="hidden md:table-cell">
                          {c.visits}
                        </TD>
                      )}
                      {v('spent') && (
                        <TD align="right" className="py-3 max-sm:pr-5">
                          <Money value={c.totalSpent} currency={false} />
                          {v('debt') && c.debt > 0 && (
                            <div className="mt-1 text-xs text-negative sm:hidden">
                              Debt: <Money value={c.debt} currency={false} />
                            </div>
                          )}
                        </TD>
                      )}
                      {v('last') && (
                        <TD muted className="hidden whitespace-nowrap lg:table-cell">
                          {c.lastVisit ? daysAgo(c.lastVisit) : 'No visits yet'}
                        </TD>
                      )}
                      {v('next') && (
                        <TD muted className="hidden whitespace-nowrap xl:table-cell">
                          {nv ? <span className="text-fg">{formatWhen(nv.start)}</span> : <span className="text-faint">—</span>}
                        </TD>
                      )}
                      {v('bonuses') && (
                        <TD align="right" className="hidden lg:table-cell">
                          {c.bonuses ? <Money value={c.bonuses} currency={false} className="text-muted" /> : <span className="text-faint">—</span>}
                        </TD>
                      )}
                      {v('debt') && (
                        <TD align="right" className="hidden sm:table-cell">
                          {c.debt > 0 ? <Money value={c.debt} currency={false} className="text-negative" /> : <span className="text-faint">—</span>}
                        </TD>
                      )}
                    </TR>
                  )
                })}
              </tbody>
            </Table>
            <TableFooter>
              <span>
                Showing {formatNumber(shown.length)} of {plural(rows.length, 'client')}
              </span>
              {rows.length > limit && (
                <Button size="sm" variant="secondary" onClick={() => setLimit((l) => l + PAGE)}>
                  Show more
                </Button>
              )}
            </TableFooter>
          </>
        ) : (
          <EmptyState
            icon={I.search}
            title="No clients match"
            description={query ? `Nothing found for “${query}”. Search by name or the last 4 digits of the phone.` : 'No clients in this group yet.'}
          >
            {filtered && <Button onClick={reset}>Clear filters</Button>}
            {query && (
              <Button variant="primary" icon={I.userAdd} onClick={() => openNewClient({ name: /\d/.test(query) ? undefined : query })}>
                New client
              </Button>
            )}
          </EmptyState>
        )}
      </Card>

      {selected.size > 0 && (
        // Linear's selection bar: centered over the list, out of the way of the assistant button.
        <div
          className={cn(
            'float-bar fixed bottom-5 left-1/2 z-30 flex max-w-[calc(100vw-2rem)] -translate-x-1/2 flex-wrap items-center gap-1 rounded-2xl bg-raised p-1.5 shadow-popover sm:rounded-full sm:pl-4',
            'lg:left-[calc(50%+var(--sidebar-w,0px)/2)]',
          )}
        >
          <span className="mr-1 text-sm font-medium text-fg tabular">{selected.size} selected</span>
          <Button size="sm" variant="ghost" icon={I.campaigns} onClick={() => navigate(`/campaigns/new?clients=${[...selected].join(',')}`)}>
            Send campaign
          </Button>
          <Menu
            side="top"
            align="center"
            trigger={
              <Button size="sm" variant="ghost" icon={I.discount}>
                Add tag
              </Button>
            }
          >
            {TAGS.map((t) => (
              <MenuItem
                key={t}
                onClick={() => {
                  for (const id of selected) {
                    const c = clients.find((x) => x.id === id)
                    if (c && !c.tags.includes(t)) updateClient(id, { tags: [...c.tags, t] })
                  }
                  toast.success(`Tagged ${plural(selected.size, 'client')} “${t}”`)
                }}
              >
                {t}
              </MenuItem>
            ))}
          </Menu>
          <Button size="sm" variant="ghost" icon={I.download} onClick={() => toast.success(`Exporting ${plural(selected.size, 'client')} to Excel`)}>
            Export
          </Button>
          <span className="mx-1 h-5 w-px bg-border" />
          <IconButton icon={I.close} label="Clear selection" size="sm" onClick={() => setSelected(new Set())} />
        </div>
      )}
    </Page>
  )
}
