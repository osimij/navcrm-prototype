import { useNavigate } from 'react-router'
import { toast } from 'sonner'
import { I, Icon } from '@/components/icons'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Meter } from '@/components/ui/misc'
import { business } from '@/data/business'
import { cn } from '@/lib/cn'
import { usePrefs } from '@/lib/store'
import { StepMark } from '../parts-a/common'
import { EditLink, SettingsPage, SettingsRow, SettingsSection } from '../ui'

const STEPS = [
  {
    id: 'business',
    title: 'About you and your business',
    why: 'Your name, business name and spheres. Spheres decide which sections and client fields you get.',
    to: '/settings/business',
    action: 'Review',
  },
  {
    id: 'team',
    title: 'Invite your team',
    why: 'Each master signs in with their phone and sees only their own calendar and earnings.',
    to: '/settings/staff',
    action: 'Invite',
  },
  {
    id: 'services',
    title: 'Add services and prices',
    why: 'Start from typical Dushanbe prices and adjust. Durations shape the free slots clients see.',
    to: '/settings/services',
    action: 'Add services',
  },
  {
    id: 'clients',
    title: 'Bring in your client base',
    why: 'Import from Excel, YCLIENTS, Dikidi or Fresha. Phones are normalized to +992 and duplicates merged.',
    to: '/clients/import',
    action: 'Import',
  },
  {
    id: 'booking',
    title: 'Share your booking link',
    why: 'Put it in your Instagram bio and on 2GIS. Bookings land in the calendar with reminders in Telegram.',
    to: '/settings/booking',
    action: 'Get link',
  },
]

export default function SetupSettings() {
  const onboarding = usePrefs((s) => s.onboarding)
  const completeStep = usePrefs((s) => s.completeStep)
  const navigate = useNavigate()

  // A business that signed up earlier has done everything but share its link.
  const done = onboarding ? STEPS.filter((s) => onboarding.done.includes(s.id)).map((s) => s.id) : ['business', 'team', 'services', 'clients']
  const next = STEPS.find((s) => !done.includes(s.id))
  const pct = Math.round((done.length / STEPS.length) * 100)

  return (
    <SettingsPage title="Quick start" description={`Five steps to get ${business.name} running. Most owners finish in about 20 minutes.`}>
      <Card className="mb-8 p-5">
        <div className="flex items-baseline justify-between">
          <span className="text-base text-fg">
            {done.length} of {STEPS.length} done
          </span>
          <span className="text-sm text-muted tabular">{pct}%</span>
        </div>
        <Meter value={pct} tone="accent" className="mt-3" />
      </Card>

      <ol className="mb-10 flex flex-col">
        {STEPS.map((s, i) => {
          const isDone = done.includes(s.id)
          const isNext = next?.id === s.id
          return (
            <li key={s.id} className="flex items-start gap-4 border-b border-border py-5 last:border-b-0">
              <StepMark n={i + 1} done={isDone} active={isNext} />
              <div className="min-w-0 flex-1">
                <div className={cn('text-base', isDone ? 'text-muted' : 'text-fg')}>{s.title}</div>
                <p className="mt-1 text-sm text-muted">{s.why}</p>
              </div>
              <Button
                size="sm"
                variant={isNext ? 'primary' : 'secondary'}
                onClick={() => {
                  // The home checklist tracks the first four; sharing the link is done by sharing it.
                  if (onboarding && s.id !== 'booking') completeStep(s.id)
                  navigate(s.to)
                }}
              >
                {isDone ? 'Open' : s.action}
              </Button>
            </li>
          )
        })}
      </ol>

      <SettingsSection title="Sample data">
        <div className="flex items-start gap-4 py-5">
          <span className="grid size-10 shrink-0 place-items-center rounded-full bg-fill text-muted">
            <Icon icon={I.database} size={18} />
          </span>
          <div className="min-w-0 flex-1">
            <div className="text-base text-fg">Sample data is on</div>
            <p className="mt-1 text-sm text-muted">6 masters, 18 services, 520 clients and two months of visits, so every screen has something to show. It never mixes with your real clients.</p>
          </div>
          <Button
            size="sm"
            variant="danger"
            onClick={() => toast('Sample data stays in this prototype', { description: 'In the product this clears all sample records in one step.' })}
          >
            Remove sample data
          </Button>
        </div>
      </SettingsSection>

      <SettingsSection title="Help">
        <div className="grid gap-3 pt-4 sm:grid-cols-2">
          <a
            href="https://t.me/NavCRM_Bot"
            target="_blank"
            rel="noreferrer"
            className="press flex items-center gap-3 rounded-xl bg-fill p-4 hover:bg-fill-hover"
          >
            <span className="grid size-10 place-items-center rounded-full bg-[#2AABEE] text-white">
              <Icon icon={I.telegram} size={18} />
            </span>
            <span>
              <span className="block text-base text-fg">Support chat in Telegram</span>
              <span className="block text-sm text-muted">Replies in about 10 minutes, 9:00–21:00</span>
            </span>
          </a>
          <a href="https://navcrm.tj" target="_blank" rel="noreferrer" className="press flex items-center gap-3 rounded-xl bg-fill p-4 hover:bg-fill-hover">
            <span className="grid size-10 place-items-center rounded-full bg-surface text-muted ring-1 ring-border">
              <Icon icon={I.book} size={18} />
            </span>
            <span>
              <span className="block text-base text-fg">Knowledge base</span>
              <span className="block text-sm text-muted">Guides in Tajik and Russian</span>
            </span>
          </a>
        </div>
      </SettingsSection>

      <SettingsSection title="Plan">
        <SettingsRow label="Pay per visit" description="Charged only for visits marked completed. No monthly fee.">
          <div>1.50 TJS per completed visit</div>
          <div className="mt-0.5 text-sm text-muted">Your first 50 visits are free.</div>
          <EditLink onClick={() => navigate('/settings/billing')}>See all plans</EditLink>
        </SettingsRow>
      </SettingsSection>
    </SettingsPage>
  )
}
