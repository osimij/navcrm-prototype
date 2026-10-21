import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import { I, Icon } from '@/components/icons'
import { Avatar } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { EmptyState } from '@/components/ui/misc'
import { Toolbar } from '@/components/ui/page'
import { Select } from '@/components/ui/select'
import { TD, TH, THead, TR, Table, TableFooter } from '@/components/ui/table'
import { staffById } from '@/data/staff'
import { formatDayTime } from '@/lib/format'
import { NOW, addMinutes } from '@/lib/time'
import { SettingsPage } from '../ui'

type Area = 'visits' | 'clients' | 'register' | 'payroll' | 'settings' | 'access'
const AREA_LABEL: Record<Area, string> = {
  visits: 'Visits',
  clients: 'Clients',
  register: 'Register',
  payroll: 'Payroll',
  settings: 'Settings',
  access: 'Access',
}

type Entry = { id: number; minutesAgo: number; who: string | 'support' | 'system'; area: Area; action: string; object: string; device: string }

const RAW: Omit<Entry, 'id'>[] = [
  { minutesAgo: 6, who: 's7', area: 'visits', action: 'Moved a visit', object: 'Nilufar Davlatova · Hair coloring, 15:30 → 16:00', device: 'iPad · Front desk' },
  { minutesAgo: 18, who: 's7', area: 'register', action: 'Sold', object: 'Receipt #1052 · 450 TJS · Alif QR', device: 'iPad · Front desk' },
  { minutesAgo: 34, who: 'system', area: 'visits', action: 'Cancelled by client', object: 'Facial cleansing with Dilnoza, 16:15', device: 'Telegram bot' },
  { minutesAgo: 47, who: 's2', area: 'visits', action: 'Marked as completed', object: 'Gel polish manicure · Sabrina Rajabova', device: 'Android app' },
  { minutesAgo: 75, who: 's0', area: 'settings', action: 'Changed', object: 'Client notifications · Reminder 2 h before', device: 'Chrome · macOS' },
  { minutesAgo: 96, who: 's7', area: 'clients', action: 'Created client', object: 'Rukhshona Kurbonova · +992 93 ••• •• 18', device: 'iPad · Front desk' },
  { minutesAgo: 130, who: 's7', area: 'register', action: 'Gave a discount', object: 'Receipt #1047 · 10% · promo COMEBACK20', device: 'iPad · Front desk' },
  { minutesAgo: 192, who: 's0', area: 'register', action: 'Refunded', object: 'Receipt #1031 · 160 TJS · client complaint', device: 'Chrome · macOS' },
  { minutesAgo: 260, who: 's8', area: 'clients', action: 'Viewed medical record', object: 'Mavjuda Saidova', device: 'Chrome · Windows' },
  { minutesAgo: 311, who: 's7', area: 'register', action: 'Opened shift', object: 'Rudaki 72 · float 500 TJS', device: 'iPad · Front desk' },
  { minutesAgo: 60 * 20, who: 's7', area: 'register', action: 'Closed shift', object: 'Rudaki 72 · short by 20 TJS', device: 'iPad · Front desk' },
  { minutesAgo: 60 * 22, who: 's5', area: 'visits', action: 'Blocked time', object: 'Rustam Ismoilov · Personal, 18:00–19:00', device: 'Android app' },
  { minutesAgo: 60 * 26, who: 's0', area: 'payroll', action: 'Approved period', object: 'September · 6 staff · 38,420 TJS', device: 'Chrome · macOS' },
  { minutesAgo: 60 * 27, who: 's0', area: 'payroll', action: 'Added a bonus', object: 'Madina Rahimova · 500 TJS · best month', device: 'Chrome · macOS' },
  { minutesAgo: 60 * 30, who: 'support', area: 'access', action: 'Support access used', object: 'Checked a fiscal register error', device: 'NavCRM support' },
  { minutesAgo: 60 * 31, who: 's0', area: 'access', action: 'Granted support access', object: 'For 3 days', device: 'Chrome · macOS' },
  { minutesAgo: 60 * 44, who: 's0', area: 'settings', action: 'Changed role', object: 'Administrator · Register: All branches → Own branch', device: 'Chrome · macOS' },
  { minutesAgo: 60 * 50, who: 's7', area: 'clients', action: 'Merged duplicates', object: 'Gulnora Sharipova (2 profiles)', device: 'iPad · Front desk' },
  { minutesAgo: 60 * 52, who: 's0', area: 'clients', action: 'Exported clients', object: 'Segment “VIP clients” · 12 clients', device: 'Chrome · macOS' },
  { minutesAgo: 60 * 70, who: 's3', area: 'clients', action: 'Signed consent', object: 'Chemical peel consent · Laylo Sodikova', device: 'Tablet · Cabinet 1' },
  { minutesAgo: 60 * 74, who: 's0', area: 'settings', action: 'Changed prices', object: '3 services in Hair', device: 'Chrome · macOS' },
  { minutesAgo: 60 * 96, who: 's0', area: 'access', action: 'Invited staff', object: '+992 90 777 12 34 · Nail artist', device: 'Chrome · macOS' },
  { minutesAgo: 60 * 98, who: 's0', area: 'access', action: 'Signed out a device', object: 'Chrome · Windows · Somoni 14', device: 'Chrome · macOS' },
  { minutesAgo: 60 * 120, who: 's7', area: 'visits', action: 'Marked no-show', object: 'Farrukh Nazarov · Men’s haircut', device: 'iPad · Front desk' },
  { minutesAgo: 60 * 150, who: 's0', area: 'settings', action: 'Exported all data', object: 'Full archive · 46 MB', device: 'Chrome · macOS' },
]

const ENTRIES: Entry[] = RAW.map((e, i) => ({ ...e, id: i }))

function Who({ who }: { who: Entry['who'] }) {
  if (who === 'system')
    return (
      <span className="flex items-center gap-2.5">
        <span className="grid size-6 place-items-center rounded-full bg-fill text-muted">
          <Icon icon={I.refresh} size={12} />
        </span>
        <span className="text-muted">Automatic</span>
      </span>
    )
  if (who === 'support')
    return (
      <span className="flex items-center gap-2.5">
        <span className="grid size-6 place-items-center rounded-full bg-accent-soft text-accent-fg">
          <Icon icon={I.shield} size={12} />
        </span>
        NavCRM support
      </span>
    )
  const s = staffById[who]
  return (
    <span className="flex items-center gap-2.5">
      <Avatar name={s.name} color={s.color} size="sm" />
      {s.name}
    </span>
  )
}

export default function AuditSettings() {
  const [area, setArea] = useState<'all' | Area>('all')
  const [who, setWho] = useState('all')
  const [range, setRange] = useState('7')
  const people = [...new Set(ENTRIES.map((e) => e.who))]
  const rows = useMemo(
    () =>
      ENTRIES.filter(
        (e) => (area === 'all' || e.area === area) && (who === 'all' || e.who === who) && e.minutesAgo <= Number(range) * 24 * 60,
      ),
    [area, who, range],
  )

  return (
    <SettingsPage
      title="Activity log"
      description="Every change in NavCRM, who made it and from which device. Entries can’t be edited or deleted."
      wide
      actions={
        <Button icon={I.download} onClick={() => toast.success('Activity log exported', { description: `${rows.length} entries, Excel` })}>
          Export
        </Button>
      }
    >
      <Toolbar>
        <Select
          look="pill"
          value={area}
          onChange={setArea}
          options={[{ value: 'all', label: 'All actions' }, ...(Object.keys(AREA_LABEL) as Area[]).map((a) => ({ value: a, label: AREA_LABEL[a] }))]}
        />
        <Select
          look="pill"
          value={who}
          onChange={setWho}
          options={[
            { value: 'all', label: 'Everyone' },
            ...people.map((p) => ({ value: p, label: p === 'system' ? 'Automatic' : p === 'support' ? 'NavCRM support' : staffById[p].name })),
          ]}
        />
        <Select
          look="pill"
          value={range}
          onChange={setRange}
          options={[
            { value: '1', label: 'Today' },
            { value: '7', label: 'Last 7 days' },
            { value: '30', label: 'Last 30 days' },
          ]}
        />
      </Toolbar>
      <Card className="overflow-hidden">
        {rows.length ? (
          <>
            <Table>
              <THead>
                <TH>When</TH>
                <TH>Who</TH>
                <TH>Action</TH>
                <TH>Details</TH>
                <TH>From</TH>
              </THead>
              <tbody>
                {rows.map((e) => (
                  <TR key={e.id}>
                    <TD muted className="whitespace-nowrap">
                      {formatDayTime(addMinutes(NOW, -e.minutesAgo))}
                    </TD>
                    <TD className="whitespace-nowrap">
                      <Who who={e.who} />
                    </TD>
                    <TD className="whitespace-nowrap">
                      {e.action}
                      <Badge className="ml-2">{AREA_LABEL[e.area]}</Badge>
                    </TD>
                    <TD muted>{e.object}</TD>
                    <TD muted className="whitespace-nowrap">
                      {e.device}
                    </TD>
                  </TR>
                ))}
              </tbody>
            </Table>
            <TableFooter>
              <span>{rows.length} entries</span>
              <span className="text-faint">Kept for 3 years · change in Data retention</span>
            </TableFooter>
          </>
        ) : (
          <EmptyState icon={I.history} title="Nothing here" description="No changes match these filters." />
        )}
      </Card>
    </SettingsPage>
  )
}
