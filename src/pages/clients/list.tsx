import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router'
import { toast } from 'sonner'
import { I } from '@/components/icons'
import { Avatar } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button, IconButton } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/controls'
import { SearchInput } from '@/components/ui/input'
import { Menu, MenuItem } from '@/components/ui/menu'
import { EmptyState, Money } from '@/components/ui/misc'
import { Page, PageHeader, Toolbar } from '@/components/ui/page'
import { Select } from '@/components/ui/select'
import { TD, TH, THead, TR, Table, TableFooter } from '@/components/ui/table'
import { CATEGORY_LABEL, birthdaySoon, type Client } from '@/data/clients'
import { formatNumber, formatPhone, plural } from '@/lib/format'
import { useOverlays } from '@/lib/overlays'
import { searchClients } from '@/lib/search'
import { useData } from '@/lib/store'
import { CATEGORY_TONE, TAGS, daysAgo, formatWhen, nextVisitMap } from './utils'

type Filter = 'all' | 'debt' | 'birthday' | 'new' | 'regular' | 'vip' | 'lost' | 'archived'
type Sort = 'last' | 'name' | 'spent' | 'visits'

const FILTERS: { id: Exclude<Filter, 'all'>; label: string; test: (c: Client) => boolean }[] = [
  { id: 'debt', label: 'With debt', test: (c) => !c.archived && c.debt > 0 },
  { id: 'birthday', label: 'Birthday this week', test: (c) => !c.archived && birthdaySoon(c) },
  { id: 'new', label: 'New', test: (c) => !c.archived && c.category === 'new' },
  { id: 'regular', label: 'Regular', test: (c) => !c.archived && c.category === 'regular' },
  { id: 'vip', label: 'VIP', test: (c) => !c.archived && c.category === 'vip' },
  { id: 'lost', label: 'Lost', test: (c) => !c.archived && c.category === 'lost' },
  { id: 'archived', label: 'Archived', test: (c) => c.archived },
]

const SORTS: { value: Sort; label: string }[] = [
  { value: 'last', label: 'Last visit' },
  { value: 'name', label: 'Name' },
  { value: 'spent', label: 'Total spent' },
  { value: 'visits', label: 'Visits' },
]

const PAGE = 30

export function ClientsList() {
  const clients = useData((s) => s.clients)
  const entries = useData((s) => s.entries)
  const updateClient = useData((s) => s.updateClient)
  const { openClient, openNewClient } = useOverlays()
  const navigate = useNavigate()

  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState<Filter>('all')
  const [sort, setSort] = useState<Sort>('last')
  const [limit, setLimit] = useState(PAGE)
  const [selected, setSelected] = useState<Set<string>>(new Set())

  const next = useMemo(() => nextVisitMap(entries), [entries])
  const active = clients.filter((c) => !c.archived)
  const vip = active.filter((c) => c.category === 'vip').length

  const rows = useMemo(() => {
    const f = FILTERS.find((x) => x.id === filter)
    let list = f ? clients.filter(f.test) : clients.filter((c) => !c.archived)
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
  }, [clients, filter, query, sort])

  const shown = rows.slice(0, limit)
  const allShownSelected = shown.length > 0 && shown.every((c) => selected.has(c.id))
  const toggle = (id: string) =>
    setSelected((s) => {
      const n = new Set(s)
      if (n.has(id)) n.delete(id)
      else n.add(id)
      return n
    })

  const reset = () => {
    setQuery('')
    setFilter('all')
    setLimit(PAGE)
  }

  return (
    <Page width="wide">
      <PageHeader
        title="Clients"
        subtitle={`${formatNumber(active.length)} clients · ${vip} VIP`}
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

      <Toolbar>
        <SearchInput
          value={query}
          onChange={(v) => {
            setQuery(v)
            setLimit(PAGE)
          }}
          placeholder="Name or last 4 digits of phone"
          className="w-full sm:w-80"
        />
        <Select<Filter>
          look="pill"
          value={filter}
          prefix="Filter:"
          className={filter !== 'all' ? 'bg-accent-soft ring-accent/20' : undefined}
          onChange={(value) => {
            setFilter(value)
            setLimit(PAGE)
            setSelected(new Set())
          }}
          options={[
            { value: 'all', label: 'All clients', hint: plural(active.length, 'client') },
            ...FILTERS.map((f) => ({ value: f.id, label: f.label, hint: plural(clients.filter(f.test).length, 'client') })),
          ]}
        />
        <span className="flex-1" />
        <Select look="pill" value={sort} onChange={setSort} options={SORTS} prefix="Sort:" align="end" />
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
                    onChange={(v) => setSelected(v ? new Set(shown.map((c) => c.id)) : new Set())}
                  />
                </TH>
                <TH className="text-left">Client</TH>
                <TH className="hidden text-left sm:table-cell">Category</TH>
                <TH align="right" className="hidden md:table-cell">
                  Visits
                </TH>
                <TH align="right">Spent, TJS</TH>
                <TH className="hidden text-left lg:table-cell">Last visit</TH>
                <TH className="hidden text-left xl:table-cell">Next visit</TH>
                <TH align="right" className="hidden lg:table-cell">
                  Bonuses
                </TH>
                <TH align="right" className="hidden sm:table-cell">Debt, TJS</TH>
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
                          <Avatar name={c.name} />
                          <div className="min-w-0">
                            <button type="button" className="block max-w-[11rem] truncate text-left text-fg hover:underline sm:max-w-none" onClick={(e) => { e.stopPropagation(); openClient(c.id) }}>{c.name}</button>
                            <div className="truncate text-sm text-muted tabular">{formatPhone(c.phone)}</div>
                            <div className="mt-1 sm:hidden"><Badge tone={CATEGORY_TONE[c.category]}>{CATEGORY_LABEL[c.category]}</Badge></div>
                          </div>
                        </div>
                      </TD>
                      <TD className="hidden sm:table-cell">
                        <Badge tone={CATEGORY_TONE[c.category]}>{CATEGORY_LABEL[c.category]}</Badge>
                      </TD>
                      <TD align="right" className="hidden md:table-cell">
                        {c.visits}
                      </TD>
                      <TD align="right" className="py-3 max-sm:pr-5">
                        <Money value={c.totalSpent} currency={false} />
                        {c.debt > 0 && <div className="mt-1 text-xs text-negative sm:hidden">Debt: <Money value={c.debt} currency={false} /></div>}
                      </TD>
                      <TD muted className="hidden whitespace-nowrap lg:table-cell">
                        {c.lastVisit ? daysAgo(c.lastVisit) : 'No visits yet'}
                      </TD>
                      <TD muted className="hidden whitespace-nowrap xl:table-cell">
                        {nv ? <span className="text-fg">{formatWhen(nv.start)}</span> : <span className="text-faint">—</span>}
                      </TD>
                      <TD align="right" className="hidden lg:table-cell">
                        {c.bonuses ? <Money value={c.bonuses} currency={false} className="text-muted" /> : <span className="text-faint">—</span>}
                      </TD>
                      <TD align="right" className="hidden sm:table-cell">
                        {c.debt > 0 ? <Money value={c.debt} currency={false} className="text-negative" /> : <span className="text-faint">—</span>}
                      </TD>
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
            <Button onClick={reset}>Clear filters</Button>
            {query && (
              <Button variant="primary" icon={I.userAdd} onClick={() => openNewClient({ name: /\d/.test(query) ? undefined : query })}>
                New client
              </Button>
            )}
          </EmptyState>
        )}
      </Card>

      {selected.size > 0 && (
        <div className="rise fixed right-4 bottom-6 left-4 z-30 flex flex-wrap items-center gap-1 rounded-2xl bg-raised p-2 shadow-popover sm:right-8 sm:left-auto sm:max-w-[calc(100%-4rem)] sm:rounded-full sm:pl-5">
          <span className="mr-2 text-sm font-medium text-fg tabular">{selected.size} selected</span>
          <Button
            size="sm"
            variant="ghost"
            icon={I.campaigns}
            onClick={() => navigate(`/campaigns/new?clients=${[...selected].join(',')}`)}
          >
            Send campaign
          </Button>
          <Menu side="top" align="center" trigger={<Button size="sm" variant="ghost" icon={I.discount}>Add tag</Button>}>
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
          <Button
            size="sm"
            variant="ghost"
            icon={I.download}
            onClick={() => toast.success(`Exporting ${plural(selected.size, 'client')} to Excel`)}
          >
            Export
          </Button>
          <span className="mx-1 h-5 w-px bg-border" />
          <IconButton icon={I.close} label="Clear selection" size="sm" onClick={() => setSelected(new Set())} />
        </div>
      )}
    </Page>
  )
}
