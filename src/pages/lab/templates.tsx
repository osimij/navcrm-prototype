import { useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import { I } from '@/components/icons'
import { Button, IconButton } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Sheet } from '@/components/ui/dialog'
import { Field, Input, fieldBase } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { TD, TH, THead, TR, Table } from '@/components/ui/table'
import { cn } from '@/lib/cn'
import { formatDate, plural } from '@/lib/format'
import { NOW } from '@/lib/time'
import type { Indicator, Range, RangeGroup, ResultTemplate } from './data'
import { useLab } from './store'

const GROUPS: RangeGroup[] = ['Women', 'Men', 'Children']
const DEFAULT_AGE: Record<RangeGroup, string> = { Women: '18+', Men: '18+', Children: '1–14' }

const small = cn(fieldBase, 'h-8 px-2.5 text-sm')

function clone(t: ResultTemplate): ResultTemplate {
  return { ...t, indicators: t.indicators.map((i) => ({ ...i, ranges: i.ranges.map((r) => ({ ...r })) })) }
}

function RangeRow({ range, onChange, onRemove }: { range: Range; onChange: (r: Range) => void; onRemove: () => void }) {
  const num = (v: string) => Number(v.replace(',', '.')) || 0
  return (
    <div className="grid grid-cols-[120px_80px_1fr_1fr_28px] items-center gap-2">
      <Select value={range.group} onChange={(g) => onChange({ ...range, group: g })} options={GROUPS.map((g) => ({ value: g, label: g }))} className="h-8 text-sm" />
      <input aria-label="Age band" value={range.age} onChange={(e) => onChange({ ...range, age: e.target.value })} className={small} />
      <input aria-label="Low" inputMode="decimal" defaultValue={range.low} onBlur={(e) => onChange({ ...range, low: num(e.target.value) })} className={cn(small, 'tabular')} />
      <input aria-label="High" inputMode="decimal" defaultValue={range.high} onBlur={(e) => onChange({ ...range, high: num(e.target.value) })} className={cn(small, 'tabular')} />
      <IconButton icon={I.close} label="Remove range" size="xs" tooltip={false} onClick={onRemove} />
    </div>
  )
}

function IndicatorEditor({ value, onChange, onRemove }: { value: Indicator; onChange: (i: Indicator) => void; onRemove: () => void }) {
  return (
    <div className="rounded-xl p-4 ring-1 ring-border">
      <div className="flex items-end gap-2">
        <Field label="Indicator" className="flex-1">
          <Input value={value.name} onChange={(e) => onChange({ ...value, name: e.target.value })} placeholder="e.g. Hemoglobin" />
        </Field>
        <Field label="Unit" className="w-28">
          <Input value={value.unit} onChange={(e) => onChange({ ...value, unit: e.target.value })} placeholder="g/L" />
        </Field>
        <IconButton icon={I.delete} label="Remove indicator" onClick={onRemove} />
      </div>
      {value.qualitative ? (
        <p className="mt-3 text-sm text-muted">
          Qualitative result: {value.qualitative.options.join(' / ')}. Normal is <span className="text-fg">{value.qualitative.normal}</span>.
        </p>
      ) : (
        <div className="mt-4 flex flex-col gap-2">
          <div className="grid grid-cols-[120px_80px_1fr_1fr_28px] gap-2 text-xs font-medium text-faint">
            <span>Group</span>
            <span>Age</span>
            <span>Low</span>
            <span>High</span>
          </div>
          {value.ranges.map((r, idx) => (
            <RangeRow
              key={`${idx}-${r.group}`}
              range={r}
              onChange={(nr) => onChange({ ...value, ranges: value.ranges.map((x, j) => (j === idx ? nr : x)) })}
              onRemove={() => onChange({ ...value, ranges: value.ranges.filter((_, j) => j !== idx) })}
            />
          ))}
          {value.ranges.length < 3 && (
            <button
              type="button"
              onClick={() => {
                const missing = GROUPS.find((g) => !value.ranges.some((r) => r.group === g)) ?? 'Women'
                onChange({ ...value, ranges: [...value.ranges, { group: missing, age: DEFAULT_AGE[missing], low: 0, high: 0 }] })
              }}
              className="self-start text-sm font-medium text-accent-fg hover:underline underline-offset-4"
            >
              Add range
            </button>
          )}
        </div>
      )}
    </div>
  )
}

function TemplateSheet() {
  const editing = useLab((s) => s.templateEditing)
  const editTemplate = useLab((s) => s.editTemplate)
  const templates = useLab((s) => s.templates)
  const saveTemplate = useLab((s) => s.saveTemplate)
  const [draft, setDraft] = useState<ResultTemplate | null>(null)
  const last = useRef<ResultTemplate | null>(null)

  useEffect(() => {
    if (!editing) return
    const existing = templates.find((t) => t.id === editing)
    setDraft(
      existing
        ? clone(existing)
        : {
            id: `tpl${Date.now()}`,
            name: '',
            editedAt: NOW,
            indicators: [{ id: `i${Date.now()}`, name: '', unit: '', decimals: 1, ranges: [{ group: 'Women', age: '18+', low: 0, high: 0 }, { group: 'Men', age: '18+', low: 0, high: 0 }] }],
          },
    )
    // Only reset when a different template opens.
  }, [editing])

  if (draft) last.current = draft
  const shown = draft ?? last.current
  const isNew = !!editing && !templates.some((t) => t.id === editing)

  function save() {
    if (!draft || !draft.name.trim()) return toast.error('Give the template a name')
    saveTemplate({ ...draft, name: draft.name.trim(), editedAt: NOW, indicators: draft.indicators.filter((i) => i.name.trim()) })
    editTemplate(null)
    toast.success(isNew ? 'Template created' : 'Template saved', { description: 'New orders use the updated ranges.' })
  }

  return (
    <Sheet
      open={!!editing}
      onOpenChange={(o) => {
        if (!o) {
          editTemplate(null)
          setDraft(null)
        }
      }}
      eyebrow="Result template"
      title={shown?.name || 'New template'}
      width="xl"
      footer={
        <>
          <span className="mr-auto text-sm text-muted">Results already sent keep the ranges they were checked against.</span>
          <Button variant="ghost" onClick={() => editTemplate(null)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={save}>
            {isNew ? 'Create template' : 'Save'}
          </Button>
        </>
      }
    >
      {shown && (
        <div className="flex flex-col gap-5 px-5 py-5">
          <Field label="Template name">
            <Input value={shown.name} onChange={(e) => setDraft({ ...shown, name: e.target.value })} placeholder="e.g. Iron status" autoFocus={isNew} />
          </Field>
          <div className="flex items-center justify-between">
            <h3 className="text-base font-medium text-fg">Indicators</h3>
            <span className="text-sm text-muted">Ranges are picked by the patient’s sex and age</span>
          </div>
          {shown.indicators.map((ind, idx) => (
            <IndicatorEditor
              key={ind.id}
              value={ind}
              onChange={(v) => setDraft({ ...shown, indicators: shown.indicators.map((x, j) => (j === idx ? v : x)) })}
              onRemove={() => setDraft({ ...shown, indicators: shown.indicators.filter((_, j) => j !== idx) })}
            />
          ))}
          <Button
            variant="secondary"
            size="sm"
            icon={I.add}
            className="self-start"
            onClick={() =>
              setDraft({
                ...shown,
                indicators: [...shown.indicators, { id: `i${Date.now()}`, name: '', unit: '', decimals: 1, ranges: [{ group: 'Women', age: '18+', low: 0, high: 0 }] }],
              })
            }
          >
            Add indicator
          </Button>
        </div>
      )}
    </Sheet>
  )
}

export function Templates() {
  const templates = useLab((s) => s.templates)
  const tests = useLab((s) => s.tests)
  const editTemplate = useLab((s) => s.editTemplate)

  return (
    <>
      <Card>
        <Table>
          <THead>
            <TH>Template</TH>
            <TH>Indicators</TH>
            <TH>Used by</TH>
            <TH align="right">Last edited</TH>
          </THead>
          <tbody>
            {templates.map((t) => {
              const used = tests.filter((x) => x.templateId === t.id)
              return (
                <TR key={t.id} onClick={() => editTemplate(t.id)}>
                  <TD>{t.name}</TD>
                  <TD muted>
                    <span className="block max-w-md truncate">
                      <span className="text-fg tabular">{t.indicators.length}</span> · {t.indicators.map((i) => i.name).join(', ')}
                    </span>
                  </TD>
                  <TD muted className="whitespace-nowrap">
                    {used.length ? plural(used.length, 'test') : 'Not used yet'}
                  </TD>
                  <TD muted align="right" className="whitespace-nowrap">
                    {formatDate(t.editedAt)}
                  </TD>
                </TR>
              )
            })}
          </tbody>
        </Table>
      </Card>
      <TemplateSheet />
    </>
  )
}
