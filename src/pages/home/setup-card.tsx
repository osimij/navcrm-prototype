import { useNavigate } from 'react-router'
import { toast } from 'sonner'
import { I, Icon } from '@/components/icons'
import { Button, IconButton } from '@/components/ui/button'
import { cn } from '@/lib/cn'
import { usePrefs } from '@/lib/store'

export const SETUP_STEPS = [
  { id: 'account', title: 'Create your account', to: '/settings/profile' },
  { id: 'business', title: 'Describe your business', to: '/settings/business' },
  { id: 'services', title: 'Add services and prices', to: '/settings/services', hint: 'Start from typical Dushanbe prices' },
  { id: 'team', title: 'Set your team’s hours', to: '/settings/schedules', hint: 'Free slots come from schedules' },
  { id: 'clients', title: 'Import your clients', to: '/clients/import', hint: 'From Excel, YCLIENTS, Dikidi or Fresha' },
]

/** Shown after sign-up until setup is done or dismissed. */
export function SetupCard() {
  const onboarding = usePrefs((s) => s.onboarding)
  const completeStep = usePrefs((s) => s.completeStep)
  const finish = usePrefs((s) => s.finishOnboarding)
  const navigate = useNavigate()
  if (!onboarding) return null
  const done = onboarding.done
  const next = SETUP_STEPS.find((s) => !done.includes(s.id))

  return (
    <section className="rise mb-8 rounded-2xl bg-surface ring-1 ring-border">
      <div className="flex items-start justify-between gap-4 px-6 pt-5">
        <div>
          <h2 className="text-lg font-medium text-fg">Finish setting up</h2>
          <p className="mt-0.5 text-base text-muted">
            {done.length} of {SETUP_STEPS.length} done. You’re looking around with sample data; it won’t mix with your real clients.
          </p>
        </div>
        <IconButton icon={I.close} label="Hide setup" size="sm" onClick={finish} />
      </div>
      <ol className="grid gap-2 p-4 sm:grid-cols-5">
        {SETUP_STEPS.map((s, i) => {
          const isDone = done.includes(s.id)
          const isNext = next?.id === s.id
          return (
            <li key={s.id}>
              <button
                type="button"
                onClick={() => {
                  completeStep(s.id)
                  navigate(s.to)
                }}
                className={cn(
                  'press flex h-full w-full flex-col items-start justify-between gap-3 rounded-xl p-3.5 text-left',
                  isNext ? 'bg-accent-soft' : 'bg-fill hover:bg-fill-hover',
                )}
              >
                <span
                  className={cn(
                    'grid size-6 shrink-0 place-items-center rounded-full text-xs font-medium',
                    isDone ? 'bg-positive text-white' : isNext ? 'bg-accent text-on-accent' : 'bg-surface text-muted ring-1 ring-border',
                  )}
                >
                  {isDone ? <Icon icon={I.check} size={13} strokeWidth={2.4} /> : i + 1}
                </span>
                <span>
                  <span className={cn('block text-base', isDone ? 'text-muted line-through decoration-faint' : 'text-fg')}>{s.title}</span>
                  {s.hint && !isDone && <span className="mt-0.5 block text-sm text-muted">{s.hint}</span>}
                </span>
              </button>
            </li>
          )
        })}
      </ol>
      <div className="flex flex-wrap items-center gap-3 border-t border-border px-6 py-3 text-sm text-muted">
        <Icon icon={I.database} size={16} />
        Sample data: 6 masters, 18 services, 520 clients
        <Button
          size="sm"
          variant="ghost"
          className="ml-auto"
          onClick={() => toast('Sample data stays in this prototype', { description: 'In the product this clears all sample records in one step.' })}
        >
          Remove sample data
        </Button>
      </div>
    </section>
  )
}
