import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { toast } from 'sonner'
import { I } from '@/components/icons'
import { Avatar } from '@/components/ui/avatar'
import { Button, IconButton } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Chip, Switch } from '@/components/ui/controls'
import { Field, Input, Textarea } from '@/components/ui/input'
import { Menu, MenuItem } from '@/components/ui/menu'
import { Page, PageHeader } from '@/components/ui/page'
import { Select } from '@/components/ui/select'
import { Segmented } from '@/components/ui/tabs'
import {
  BASE_LABEL,
  CLIENTS_LABEL,
  METRIC_LABEL,
  PAY_CATEGORIES,
  RULE_META,
  payrollStaff,
  resolveScheme,
  type PeriodType,
  type Rule,
  type RuleType,
  type Scheme,
} from './data'
import { MoneyInput, Note, PercentInput } from './shared'
import { usePayroll } from './store'

const RULE_ORDER: RuleType[] = ['base', 'services', 'products', 'perService', 'tips', 'kpi', 'rental']

function defaults(type: RuleType): Rule {
  const id = `r${Date.now()}`
  switch (type) {
    case 'base':
      return { id, type, amount: 3000, per: 'month' }
    case 'services':
      return { id, type, percent: 40, base: 'after_discounts', whose: 'own', clients: 'all', scope: 'all' }
    case 'products':
      return { id, type, percent: 10, productBase: 'price' }
    case 'perService':
      return { id, type, amount: 20, scope: 'categories', categories: [] }
    case 'tips':
      return { id, type, percent: 100 }
    case 'kpi':
      return { id, type, amount: 500, metric: 'load', threshold: 80 }
    case 'rental':
      return { id, type, percent: 20 }
  }
}

function CategoryChips({ value, onChange }: { value: string[]; onChange: (v: string[]) => void }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {PAY_CATEGORIES.map((c) => (
        <Chip key={c} active={value.includes(c)} onClick={() => onChange(value.includes(c) ? value.filter((x) => x !== c) : [...value, c])}>
          {c}
        </Chip>
      ))}
    </div>
  )
}

function RuleCard({ rule, onChange, onRemove }: { rule: Rule; onChange: (r: Rule) => void; onRemove: () => void }) {
  const set = (patch: Partial<Rule>) => onChange({ ...rule, ...patch })
  const meta = RULE_META[rule.type]
  return (
    <Card className="p-5">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-medium text-fg">{meta.label}</h3>
          <p className="mt-0.5 text-sm text-muted">{meta.hint}</p>
        </div>
        <IconButton icon={I.delete} label="Remove rule" size="sm" onClick={onRemove} />
      </div>

      {rule.type === 'base' && (
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Amount">
            <MoneyInput value={rule.amount ?? null} onChange={(v) => set({ amount: v ?? 0 })} />
          </Field>
          <Field label="Per">
            <Segmented fill value={rule.per ?? 'month'} onChange={(per) => set({ per })} items={[{ value: 'month', label: 'Month' }, { value: 'shift', label: 'Shift' }, { value: 'hour', label: 'Hour' }]} />
          </Field>
        </div>
      )}

      {rule.type === 'services' && (
        <div className="flex flex-col gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Share">
              <PercentInput value={rule.percent} onChange={(percent) => set({ percent })} />
            </Field>
            <Field label="Calculated from">
              <Select
                value={rule.base ?? 'after_discounts'}
                onChange={(base) => set({ base })}
                options={(Object.keys(BASE_LABEL) as (keyof typeof BASE_LABEL)[]).map((k) => ({ value: k, label: BASE_LABEL[k][0].toUpperCase() + BASE_LABEL[k].slice(1) }))}
              />
            </Field>
            <Field label="Whose visits">
              <Segmented fill value={rule.whose ?? 'own'} onChange={(whose) => set({ whose })} items={[{ value: 'own', label: 'Their own' }, { value: 'branch', label: 'Whole branch' }]} />
            </Field>
            <Field label="Clients">
              <Select value={rule.clients ?? 'all'} onChange={(clients) => set({ clients })} options={(Object.keys(CLIENTS_LABEL) as (keyof typeof CLIENTS_LABEL)[]).map((k) => ({ value: k, label: CLIENTS_LABEL[k] }))} />
            </Field>
          </div>
          <Field label="Applies to">
            <Segmented value={rule.scope ?? 'all'} onChange={(scope) => set({ scope })} items={[{ value: 'all', label: 'All services' }, { value: 'categories', label: 'Some categories' }]} />
          </Field>
          {rule.scope === 'categories' && <CategoryChips value={rule.categories ?? []} onChange={(categories) => set({ categories })} />}
        </div>
      )}

      {rule.type === 'products' && (
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Share">
            <PercentInput value={rule.percent} onChange={(percent) => set({ percent })} />
          </Field>
          <Field label="Calculated from">
            <Segmented fill value={rule.productBase ?? 'price'} onChange={(productBase) => set({ productBase })} items={[{ value: 'price', label: 'Sale price' }, { value: 'margin', label: 'Margin' }]} />
          </Field>
        </div>
      )}

      {rule.type === 'perService' && (
        <div className="flex flex-col gap-4">
          <Field label="Amount each time" className="sm:max-w-[50%] sm:pr-2">
            <MoneyInput value={rule.amount ?? null} onChange={(v) => set({ amount: v ?? 0 })} />
          </Field>
          <Field label="For" error={!(rule.categories ?? []).length ? 'Pick at least one category' : undefined}>
            <CategoryChips value={rule.categories ?? []} onChange={(categories) => set({ categories })} />
          </Field>
        </div>
      )}

      {(rule.type === 'tips' || rule.type === 'rental') && (
        <Field label="Share" className="sm:max-w-[50%] sm:pr-2">
          <PercentInput value={rule.percent} onChange={(percent) => set({ percent })} />
        </Field>
      )}

      {rule.type === 'kpi' && (
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Bonus">
            <MoneyInput value={rule.amount ?? null} onChange={(v) => set({ amount: v ?? 0 })} />
          </Field>
          <Field label="When">
            <Select value={rule.metric ?? 'load'} onChange={(metric) => set({ metric })} options={(Object.keys(METRIC_LABEL) as (keyof typeof METRIC_LABEL)[]).map((k) => ({ value: k, label: METRIC_LABEL[k] }))} />
          </Field>
          <Field label="Target">
            <Input
              inputMode="decimal"
              value={rule.threshold ?? ''}
              onChange={(e) => set({ threshold: Number(e.target.value.replace(/[^\d.]/g, '')) || 0 })}
              suffix={rule.metric === 'load' ? '%' : rule.metric === 'avg_receipt' ? 'TJS' : rule.metric === 'rating' ? '★' : ''}
              className="tabular"
            />
          </Field>
        </div>
      )}
    </Card>
  )
}

export function SchemeEditor() {
  const { id } = useParams()
  const navigate = useNavigate()
  const existing = usePayroll((s) => s.schemes.find((x) => x.id === id))
  const assignments = usePayroll((s) => s.assignments)
  const saveScheme = usePayroll((s) => s.saveScheme)
  const isNew = !existing
  const [draft, setDraft] = useState<Scheme>(
    () => existing ?? { id: `sc${Date.now()}`, name: '', description: '', period: 'Month', active: true, rules: [defaults('services')] },
  )
  const [touched, setTouched] = useState(false)
  const people = payrollStaff.filter((s) => resolveScheme(s.id, assignments)?.schemeId === draft.id)

  function save() {
    setTouched(true)
    if (!draft.name.trim() || !draft.rules.length) return
    saveScheme({ ...draft, name: draft.name.trim() })
    toast.success(isNew ? 'Scheme created' : 'Scheme saved', {
      description: people.length ? `Applies from the next calculation for ${people.length} people.` : 'Assign it to a person or position to use it.',
    })
    navigate('/payroll/schemes')
  }

  return (
    <Page width="narrow">
      <PageHeader
        back="/payroll/schemes"
        title={isNew ? 'New scheme' : draft.name || 'Untitled scheme'}
        actions={
          <Button variant="primary" onClick={save}>
            {isNew ? 'Create scheme' : 'Save changes'}
          </Button>
        }
      />

      <Card className="mb-8 flex flex-col gap-4 p-5">
        <Field label="Name" error={touched && !draft.name.trim() ? 'Give the scheme a name' : undefined}>
          <Input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} placeholder="e.g. Master 40% of services" autoFocus={isNew} />
        </Field>
        <Field label="Description" optional>
          <Textarea value={draft.description} onChange={(e) => setDraft({ ...draft, description: e.target.value })} className="min-h-16" />
        </Field>
        <Field label="Usual period" className="sm:max-w-[50%] sm:pr-2">
          <Select
            value={draft.period}
            onChange={(period: PeriodType) => setDraft({ ...draft, period })}
            options={(['Month', 'Half-month', 'Week', 'Shift'] as PeriodType[]).map((p) => ({ value: p, label: p }))}
          />
        </Field>
        <Switch
          checked={draft.active}
          onChange={(active) => setDraft({ ...draft, active })}
          label="Active"
          description="Inactive schemes can’t be assigned and aren’t used in new calculations."
        />
      </Card>

      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="text-lg font-medium text-fg">Rules</h2>
        <Menu trigger={<Button size="sm" icon={I.add}>Add rule</Button>} align="end">
          {RULE_ORDER.map((t) => (
            <MenuItem key={t} hint={draft.rules.some((r) => r.type === t) && t !== 'kpi' ? 'Added' : undefined} onClick={() => setDraft({ ...draft, rules: [...draft.rules, defaults(t)] })}>
              {RULE_META[t].label}
            </MenuItem>
          ))}
        </Menu>
      </div>
      <div className="flex flex-col gap-3">
        {draft.rules.map((r) => (
          <RuleCard
            key={r.id}
            rule={r}
            onChange={(next) => setDraft({ ...draft, rules: draft.rules.map((x) => (x.id === r.id ? next : x)) })}
            onRemove={() => setDraft({ ...draft, rules: draft.rules.filter((x) => x.id !== r.id) })}
          />
        ))}
        {!draft.rules.length && (
          <p className={`rounded-2xl bg-fill px-5 py-6 text-center text-base ${touched ? 'text-negative' : 'text-muted'}`}>Add at least one rule.</p>
        )}
      </div>

      <Note className="mt-5">
        When rules overlap, the most specific one wins: a rule for a category beats a rule for all services. A scheme assigned to a person replaces
        the scheme of their position. Bonuses and fines from the Bonuses & fines tab are added on top of every scheme.
      </Note>

      <div className="mt-10">
        <h2 className="mb-3 text-lg font-medium text-fg">Who’s on this scheme</h2>
        {people.length ? (
          <ul className="flex flex-col">
            {people.map((p) => (
              <li key={p.id} className="flex items-center gap-3 border-b border-border py-3 last:border-b-0">
                <Avatar name={p.name} color={p.color} size="md" />
                <span className="min-w-0 flex-1">
                  <span className="block text-base text-fg">{p.name}</span>
                  <span className="block text-sm text-muted">
                    {resolveScheme(p.id, assignments)?.via === 'personal' ? 'Assigned personally' : `Through position “${p.position}”`}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-base text-muted">
            Nobody yet.{' '}
            <Link to="/payroll/assignments" className="text-fg underline underline-offset-4">
              Assign it
            </Link>{' '}
            after saving.
          </p>
        )}
      </div>
    </Page>
  )
}
