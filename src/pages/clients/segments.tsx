import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router'
import { toast } from 'sonner'
import { ClientRow } from '@/components/client-picker'
import { I, Icon } from '@/components/icons'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Modal, Sheet } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Page, PageHeader } from '@/components/ui/page'
import { formatNumber, plural } from '@/lib/format'
import { useOverlays } from '@/lib/overlays'
import { useData } from '@/lib/store'
import { COUNTED_AT, SEGMENTS, type Segment } from './utils'
import { useCustomSegments } from './segment-store'

function CategoriesModal({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const [regular, setRegular] = useState('3')
  const [vip, setVip] = useState('8000')
  const [lost, setLost] = useState('60')
  const row = (label: string, hint: string, value: string, set: (v: string) => void, unit: string) => (
    <div className="flex items-center justify-between gap-6 py-4">
      <div>
        <div className="text-base text-fg">{label}</div>
        <div className="mt-0.5 text-sm text-muted">{hint}</div>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <span className="w-24">
          <Input value={value} onChange={(e) => set(e.target.value.replace(/\D/g, ''))} inputMode="numeric" className="text-right tabular" />
        </span>
        <span className="w-14 text-sm text-muted">{unit}</span>
      </div>
    </div>
  )
  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title="Client categories"
      description="Clients move between categories automatically every night."
      footer={
        <>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={() => {
              onOpenChange(false)
              toast.success('Categories saved', { description: 'Clients will be recounted tonight at 03:00.' })
            }}
          >
            Save
          </Button>
        </>
      }
    >
      <div className="divide-y divide-border">
        {row('Regular', 'From this many visits', regular, setRegular, 'visits')}
        {row('VIP', 'From this much spent in total', vip, setVip, 'TJS')}
        {row('Lost', 'No visit for this many days', lost, setLost, 'days')}
      </div>
      <p className="mt-2 rounded-xl bg-fill px-3.5 py-3 text-sm text-muted">Every client starts as New after their first visit.</p>
    </Modal>
  )
}

export function Segments() {
  const navigate = useNavigate()
  const clients = useData((s) => s.clients)
  const openClient = useOverlays((s) => s.openClient)
  const custom = useCustomSegments((s) => s.segments)
  const [categories, setCategories] = useState(false)
  const [open, setOpen] = useState<Segment | null>(null)

  const all = useMemo(() => [...SEGMENTS, ...custom], [custom])
  const active = useMemo(() => clients.filter((c) => !c.archived), [clients])
  const counts = useMemo(() => Object.fromEntries(all.map((s) => [s.id, active.filter(s.match).length])), [all, active])
  const sample = open ? active.filter(open.match).slice(0, 6) : []

  const campaign = (s: Segment) => navigate(`/campaigns/new?segment=${s.id}`)

  return (
    <Page>
      <PageHeader
        back="/clients"
        title="Segments"
        subtitle="Saved groups of clients for campaigns, discount cards and reports"
        actions={
          <>
            <Button onClick={() => setCategories(true)}>Client categories</Button>
            <Button variant="primary" icon={I.add} onClick={() => navigate('/clients/segments/new')}>
              New segment
            </Button>
          </>
        }
      />

      <Card className="overflow-hidden">
        <ul className="divide-y divide-border">
          {all.map((s) => (
            <li key={s.id}>
              <div
                role="button"
                tabIndex={0}
                onClick={() => setOpen(s)}
                onKeyDown={(e) => e.key === 'Enter' && setOpen(s)}
                className="flex cursor-pointer items-center gap-4 px-5 py-4 transition-colors duration-100 hover:bg-fill/60"
              >
                <span className="grid size-10 shrink-0 place-items-center rounded-full bg-fill text-muted">
                  <Icon icon={s.builtIn ? I.users : I.filter} size={18} />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="truncate text-base text-fg">{s.name}</span>
                    {s.builtIn && <Badge>Built-in</Badge>}
                  </div>
                  <div className="truncate text-sm text-muted">{s.conditions.join(' · ')}</div>
                </div>
                <div className="hidden text-right sm:block">
                  <div className="text-lg text-fg tabular">{formatNumber(counts[s.id])}</div>
                  <div className="text-xs text-faint">counted today {COUNTED_AT}</div>
                </div>
                <Button
                  size="sm"
                  variant="secondary"
                  icon={I.campaigns}
                  disabled={!counts[s.id]}
                  onClick={(e) => {
                    e.stopPropagation()
                    campaign(s)
                  }}
                >
                  Send campaign
                </Button>
              </div>
            </li>
          ))}
        </ul>
      </Card>

      <Sheet
        open={!!open}
        onOpenChange={(o) => !o && setOpen(null)}
        eyebrow={open?.builtIn ? 'Built-in segment' : 'Segment'}
        title={open?.name}
        width="md"
        footer={
          open && (
            <Button variant="primary" icon={I.campaigns} className="w-full" disabled={!counts[open.id]} onClick={() => campaign(open)}>
              Send campaign to {plural(counts[open.id] ?? 0, 'client')}
            </Button>
          )
        }
      >
        {open && (
          <div className="flex flex-col gap-6 p-5">
            <div>
              <div className="text-sm text-muted">Matching clients</div>
              <div className="mt-1 text-4xl font-normal text-fg tabular">{formatNumber(counts[open.id])}</div>
              <div className="mt-1 text-sm text-faint">Counted today at {COUNTED_AT}. Updates every night.</div>
            </div>
            <div>
              <div className="mb-2 text-sm font-medium text-muted">Conditions</div>
              <ul className="flex flex-col gap-1.5">
                {open.conditions.map((c) => (
                  <li key={c} className="flex items-center gap-2.5 rounded-xl bg-fill px-3.5 py-2.5 text-base text-fg">
                    <Icon icon={I.check} size={16} className="text-muted" />
                    {c}
                  </li>
                ))}
              </ul>
              {open.builtIn && <p className="mt-2 text-sm text-faint">Built-in segments can’t be edited. Duplicate one to change its conditions.</p>}
            </div>
            {sample.length > 0 && (
              <div>
                <div className="mb-1 text-sm font-medium text-muted">Some of them</div>
                {sample.map((c) => (
                  <button key={c.id} type="button" onClick={() => openClient(c.id)} className="flex w-full items-center rounded-xl px-2 py-2 text-left hover:bg-fill">
                    <ClientRow client={c} />
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </Sheet>

      <CategoriesModal open={categories} onOpenChange={setCategories} />
    </Page>
  )
}
