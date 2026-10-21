import { I, Icon } from '@/components/icons'
import { Avatar } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Money } from '@/components/ui/misc'
import { STATUS_META, isVisit, serviceNames, type Appointment } from '@/data/appointments'
import { CATEGORY_LABEL } from '@/data/clients'
import { staffById } from '@/data/staff'
import { formatDate, formatDay, formatPhone, formatTime } from '@/lib/format'
import { useOverlays } from '@/lib/overlays'
import { useClient, useData } from '@/lib/store'
import { NOW } from '@/lib/time'

/** What the admin needs while replying: who this is, what's booked, what's owed. */
export function ClientContext({ clientId }: { clientId: string }) {
  const client = useClient(clientId)
  const entries = useData((s) => s.entries)
  const { openClient, openNewVisit, openVisit } = useOverlays()
  if (!client) return null

  const visits = entries.filter((e): e is Appointment => isVisit(e) && e.clientId === clientId)
  const next = visits
    .filter((a) => a.start > NOW && a.status !== 'cancelled' && a.status !== 'completed')
    .sort((a, b) => +a.start - +b.start)[0]
  const past = visits
    .filter((a) => a.status === 'completed')
    .sort((a, b) => +b.start - +a.start)
    // Never list more past visits than the client's own visit count says they've had.
    .slice(0, Math.min(3, client.visits))

  return (
    <aside className="hidden w-[300px] shrink-0 flex-col overflow-y-auto border-l border-border xl:flex">
      <div className="flex flex-col items-center px-5 pt-6 pb-5 text-center">
        <Avatar name={client.name} size="xl" />
        <button type="button" onClick={() => openClient(client.id)} className="mt-3 text-base font-medium text-fg hover:underline underline-offset-4">
          {client.name}
        </button>
        <span className="mt-0.5 text-sm text-muted tabular">{formatPhone(client.phone)}</span>
        <div className="mt-2.5 flex flex-wrap justify-center gap-1.5">
          <Badge tone={client.category === 'vip' ? 'accent' : client.category === 'lost' ? 'warning' : 'neutral'}>{CATEGORY_LABEL[client.category]}</Badge>
          {client.tags.map((t) => (
            <Badge key={t}>{t}</Badge>
          ))}
        </div>
      </div>

      {client.debt > 0 && (
        <div className="mx-4 mb-3 flex items-center gap-2 rounded-xl bg-negative-soft px-3 py-2.5 text-sm text-negative">
          <Icon icon={I.wallet} size={16} />
          Owes <Money value={client.debt} className="font-medium" />
        </div>
      )}

      <div className="mx-4 grid grid-cols-3 overflow-hidden rounded-xl bg-fill text-center">
        {[
          ['Visits', String(client.visits)],
          ['Spent', <Money key="s" value={client.totalSpent} currency={false} />],
          ['Bonuses', <Money key="b" value={client.bonuses} currency={false} />],
        ].map(([label, value]) => (
          <div key={label as string} className="px-2 py-2.5">
            <div className="text-base text-fg tabular">{value}</div>
            <div className="text-xs text-muted">{label}</div>
          </div>
        ))}
      </div>

      <section className="px-4 pt-5">
        <h3 className="mb-2 px-1 text-xs font-medium text-faint">Next visit</h3>
        {next ? (
          <button type="button" onClick={() => openVisit(next.id)} className="press w-full rounded-xl p-3 text-left ring-1 ring-border hover:bg-fill">
            <div className="flex items-center justify-between gap-2">
              <span className="text-base font-medium text-fg">
                {formatDay(next.start)}, {formatTime(next.start)}
              </span>
              <Badge tone={STATUS_META[next.status].tone}>{STATUS_META[next.status].label}</Badge>
            </div>
            <div className="mt-1 text-sm text-muted">
              {serviceNames(next)} · {staffById[next.staffId].name.split(' ')[0]}
            </div>
          </button>
        ) : (
          <p className="px-1 text-sm text-muted">Nothing booked.</p>
        )}
      </section>

      {past.length > 0 && (
        <section className="px-4 pt-5">
          <h3 className="mb-1 px-1 text-xs font-medium text-faint">Recent visits</h3>
          <ul>
            {past.map((a) => (
              <li key={a.id}>
                <button type="button" onClick={() => openVisit(a.id)} className="flex w-full items-center gap-3 rounded-lg px-1 py-2 text-left hover:bg-fill">
                  <span className="w-14 shrink-0 text-sm text-muted tabular">{formatDate(a.start)}</span>
                  <span className="min-w-0 flex-1 truncate text-sm text-fg">{serviceNames(a)}</span>
                  <Money value={a.price} currency={false} className="text-sm text-muted" />
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      {client.note && (
        <section className="px-4 pt-5">
          <h3 className="mb-1 px-1 text-xs font-medium text-faint">Note</h3>
          <p className="px-1 text-sm text-fg">{client.note}</p>
        </section>
      )}

      <div className="mt-auto flex flex-col gap-2 p-4">
        <Button icon={I.calendarAdd} onClick={() => openNewVisit({ clientId: client.id })}>
          Book a visit
        </Button>
        <Button variant="ghost" onClick={() => openClient(client.id)}>
          Open profile
        </Button>
      </div>
    </aside>
  )
}
