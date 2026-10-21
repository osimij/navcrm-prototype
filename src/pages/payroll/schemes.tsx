import { useNavigate } from 'react-router'
import { AvatarStack } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/cn'
import { formatMoney } from '@/lib/format'
import { BASE_LABEL, METRIC_LABEL, payrollStaff, resolveScheme, type Rule } from './data'
import { usePayroll } from './store'

export function ruleSummary(r: Rule) {
  switch (r.type) {
    case 'base':
      return `${formatMoney(r.amount ?? 0)} per ${r.per ?? 'month'}`
    case 'services': {
      const whose = r.whose === 'branch' ? 'branch services' : 'services'
      const base = r.base && r.base !== 'price' ? `, ${BASE_LABEL[r.base]}` : ''
      return `${r.percent}% of ${whose}${base}`
    }
    case 'products':
      return `${r.percent}% of product sales${r.productBase === 'margin' ? ' margin' : ''}`
    case 'perService':
      return `${formatMoney(r.amount ?? 0)} per ${(r.categories?.join(', ') || 'service').toLowerCase().replace(/s$/, '')}`
    case 'tips':
      return `${r.percent}% of tips`
    case 'kpi':
      return `${formatMoney(r.amount ?? 0)} bonus if ${METRIC_LABEL[r.metric ?? 'load'].toLowerCase()} ${r.threshold}${r.metric === 'load' ? '%' : ''}`
    case 'rental':
      return `${r.percent}% of rental revenue`
  }
}

export function Schemes() {
  const schemes = usePayroll((s) => s.schemes)
  const assignments = usePayroll((s) => s.assignments)
  const navigate = useNavigate()

  return (
    <div className="grid gap-5 md:grid-cols-2">
      {schemes.map((sc) => {
        const people = payrollStaff.filter((s) => resolveScheme(s.id, assignments)?.schemeId === sc.id)
        return (
          <button
            key={sc.id}
            type="button"
            onClick={() => navigate(`/payroll/schemes/${sc.id}`)}
            className={cn('press flex flex-col rounded-2xl bg-surface p-5 text-left ring-1 ring-border hover:bg-fill/50', !sc.active && 'opacity-70')}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h3 className="text-base font-medium text-fg">{sc.name}</h3>
                <p className="mt-0.5 text-sm text-muted">{sc.description}</p>
              </div>
              {!sc.active && <Badge>Inactive</Badge>}
            </div>
            <ul className="mt-4 flex flex-col gap-1.5">
              {sc.rules.map((r) => (
                <li key={r.id} className="flex items-center gap-2.5 text-base text-fg">
                  <span className="size-1.5 shrink-0 rounded-full bg-faint" />
                  {ruleSummary(r)}
                </li>
              ))}
            </ul>
            <div className="mt-5 flex items-center gap-3 border-t border-border pt-4 text-sm text-muted">
              {people.length ? (
                <>
                  <AvatarStack names={people.map((p) => ({ name: p.name, color: p.color }))} max={4} />
                  <span className="truncate">{people.map((p) => p.name.split(' ')[0]).join(', ')}</span>
                </>
              ) : (
                <span>Nobody on this scheme</span>
              )}
              <span className="ml-auto shrink-0">{sc.period === 'Month' ? 'Monthly' : sc.period === 'Shift' ? 'Per shift' : sc.period}</span>
            </div>
          </button>
        )
      })}
    </div>
  )
}
