import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { I, Icon } from '@/components/icons'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Switch } from '@/components/ui/controls'
import { Modal } from '@/components/ui/dialog'
import { Field, Input, SearchInput, Textarea } from '@/components/ui/input'
import { EmptyState, Money } from '@/components/ui/misc'
import { Toolbar } from '@/components/ui/page'
import { Select } from '@/components/ui/select'
import { Segmented } from '@/components/ui/tabs'
import { TD, TH, THead, TR, Table, TableFooter } from '@/components/ui/table'
import { cn } from '@/lib/cn'
import { plural } from '@/lib/format'
import { BIOMATERIALS, testById, type Biomaterial, type LabTest } from './data'
import { useLab } from './store'

const hours = (h: number) => (h < 24 || h % 24 ? `${h} h` : `${h / 24} ${h === 24 ? 'day' : 'days'}`)

function TestModal() {
  const editing = useLab((s) => s.testEditing)
  const editTest = useLab((s) => s.editTest)
  const tests = useLab((s) => s.tests)
  const templates = useLab((s) => s.templates)
  const saveTest = useLab((s) => s.saveTest)
  const existing = editing && editing !== 'new' ? testById(tests, editing) : undefined

  const [kind, setKind] = useState<'test' | 'package'>('test')
  const [lang, setLang] = useState<'tg' | 'ru' | 'en'>('en')
  const [names, setNames] = useState({ tg: '', ru: '', en: '' })
  const [code, setCode] = useState('')
  const [price, setPrice] = useState('')
  const [turnaround, setTurnaround] = useState('24')
  const [bio, setBio] = useState<Biomaterial>('Venous blood')
  const [templateId, setTemplateId] = useState('none')
  const [includes, setIncludes] = useState<string[]>([])
  const [prep, setPrep] = useState('')
  const [active, setActive] = useState(true)
  const [touched, setTouched] = useState(false)

  useEffect(() => {
    if (!editing) return
    setKind(existing?.kind ?? 'test')
    setLang('en')
    setNames({ tg: '', ru: '', en: existing?.name ?? '' })
    setCode(existing?.code ?? '')
    setPrice(existing ? String(existing.price) : '')
    setTurnaround(String(existing?.turnaround ?? 24))
    setBio(existing?.biomaterial ?? 'Venous blood')
    setTemplateId(existing?.templateId ?? 'none')
    setIncludes(existing?.includes ?? [])
    setPrep(existing?.prep ?? '')
    setActive(existing?.active ?? true)
    setTouched(false)
  }, [editing, existing])

  const singles = tests.filter((t) => t.kind === 'test' && t.active)
  const separately = includes.reduce((m, id) => m + (testById(tests, id)?.price ?? 0), 0)
  const valid = names.en.trim() && Number(price) > 0 && (kind === 'test' || includes.length > 1)

  function save() {
    setTouched(true)
    if (!valid) return
    const t: LabTest = {
      id: existing?.id ?? `t_${Date.now()}`,
      name: names.en.trim(),
      code: code.trim() || '—',
      price: Number(price),
      turnaround: Number(turnaround) || 24,
      biomaterial: kind === 'package' ? 'Venous blood' : bio,
      category: kind === 'package' ? 'Packages' : (existing?.category ?? 'Biochemistry'),
      kind,
      templateId: kind === 'package' || templateId === 'none' ? null : templateId,
      indicatorIds: existing?.indicatorIds,
      includes: kind === 'package' ? includes : undefined,
      prep: prep.trim() || undefined,
      active,
    }
    saveTest(t)
    editTest(null)
    toast.success(existing ? `${t.name} updated` : `${t.name} added to the catalog`)
  }

  const langHint = { tg: 'Tajik', ru: 'Russian', en: 'English' }[lang]

  return (
    <Modal
      open={!!editing}
      onOpenChange={(o) => !o && editTest(null)}
      title={existing ? existing.name : kind === 'package' ? 'New package' : 'New test'}
      size="lg"
      footer={
        <>
          <Button variant="ghost" onClick={() => editTest(null)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={save}>
            {existing ? 'Save changes' : kind === 'package' ? 'Add package' : 'Add test'}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        {!existing && (
          <Segmented
            value={kind}
            onChange={setKind}
            items={[
              { value: 'test', label: 'Single test' },
              { value: 'package', label: 'Package' },
            ]}
          />
        )}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-muted">Name</span>
            <Segmented
              size="sm"
              value={lang}
              onChange={setLang}
              items={[
                { value: 'tg', label: 'TJ' },
                { value: 'ru', label: 'RU' },
                { value: 'en', label: 'EN' },
              ]}
            />
          </div>
          <Input
            value={names[lang]}
            onChange={(e) => setNames((n) => ({ ...n, [lang]: e.target.value }))}
            placeholder={`Name in ${langHint}`}
            aria-invalid={touched && !names.en.trim()}
          />
          <p className="text-xs text-faint">
            {touched && !names.en.trim() ? <span className="text-negative">An English name is required</span> : 'Patients see the name in their language on results and receipts.'}
          </p>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <Field label="Code">
            <Input value={code} onChange={(e) => setCode(e.target.value)} placeholder="B-050" />
          </Field>
          <Field label="Price" error={touched && !(Number(price) > 0) ? 'Required' : undefined}>
            <Input value={price} onChange={(e) => setPrice(e.target.value.replace(/\D/g, ''))} inputMode="numeric" suffix="TJS" aria-invalid={touched && !(Number(price) > 0)} />
          </Field>
          <Field label="Turnaround">
            <Input value={turnaround} onChange={(e) => setTurnaround(e.target.value.replace(/\D/g, ''))} inputMode="numeric" suffix="hours" />
          </Field>
        </div>

        {kind === 'test' ? (
          <div className="grid grid-cols-2 gap-3">
            <Field label="Biomaterial">
              <Select value={bio} onChange={setBio} options={BIOMATERIALS.map((b) => ({ value: b, label: b }))} />
            </Field>
            <Field label="Result template" hint="Defines indicators and reference ranges">
              <Select value={templateId} onChange={setTemplateId} options={[{ value: 'none', label: 'No template' }, ...templates.map((t) => ({ value: t.id, label: t.name }))]} />
            </Field>
          </div>
        ) : (
          <Field
            label="Included tests"
            error={touched && includes.length < 2 ? 'A package needs at least 2 tests' : undefined}
            hint={includes.length ? (
              <>
                {plural(includes.length, 'test')}, <Money value={separately} /> if ordered separately
              </>
            ) : undefined}
          >
            <div className="max-h-56 overflow-y-auto rounded-xl ring-1 ring-border">
              {singles.map((t) => {
                const on = includes.includes(t.id)
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setIncludes((cur) => (on ? cur.filter((x) => x !== t.id) : [...cur, t.id]))}
                    className="flex w-full items-center gap-3 border-b border-border px-3 py-2 text-left last:border-b-0 hover:bg-fill"
                  >
                    <span className={cn('grid size-[18px] shrink-0 place-items-center rounded-[5px] ring-1 ring-inset', on ? 'bg-accent text-on-accent ring-accent' : 'ring-border-strong')}>
                      {on && <Icon icon={I.check} size={12} strokeWidth={2.4} />}
                    </span>
                    <span className="flex-1 text-base text-fg">{t.name}</span>
                    <Money value={t.price} className="text-sm text-muted" />
                  </button>
                )
              })}
            </div>
          </Field>
        )}

        <Field label="Patient preparation" optional hint="Shown on the referral and sent with the booking reminder">
          <Textarea value={prep} onChange={(e) => setPrep(e.target.value)} placeholder="e.g. Fasting 8–12 hours; plain water is fine" />
        </Field>
        <Switch checked={active} onChange={setActive} label="Available for new orders" />
      </div>
    </Modal>
  )
}

export function Tests() {
  const tests = useLab((s) => s.tests)
  const templates = useLab((s) => s.templates)
  const editTest = useLab((s) => s.editTest)
  const saveTest = useLab((s) => s.saveTest)
  const [query, setQuery] = useState('')
  const [kind, setKind] = useState<'all' | 'test' | 'package'>('all')

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase()
    return tests.filter(
      (t) => (kind === 'all' || t.kind === kind) && (!q || t.name.toLowerCase().includes(q) || t.code.toLowerCase().includes(q)),
    )
  }, [tests, query, kind])

  return (
    <>
      <Toolbar>
        <SearchInput value={query} onChange={setQuery} placeholder="Search tests" className="w-full sm:w-72" />
        <Segmented
          value={kind}
          onChange={setKind}
          items={[
            { value: 'all', label: 'All' },
            { value: 'test', label: 'Single tests' },
            { value: 'package', label: 'Packages' },
          ]}
        />
      </Toolbar>
      <Card>
        {rows.length ? (
          <>
            <Table>
              <THead>
                <TH>Name</TH>
                <TH>Code</TH>
                <TH>Biomaterial</TH>
                <TH>Turnaround</TH>
                <TH>Result template</TH>
                <TH align="right">Price</TH>
                <TH align="right">Active</TH>
              </THead>
              <tbody>
                {rows.map((t) => (
                  <TR key={t.id} onClick={() => editTest(t.id)} className={cn(!t.active && '[&_td]:text-faint')}>
                    <TD>
                      <span className="flex items-center gap-2">
                        <span className="truncate">{t.name}</span>
                        {t.kind === 'package' && <Badge tone="accent">{plural(t.includes?.length ?? 0, 'test')}</Badge>}
                      </span>
                    </TD>
                    <TD muted className="tabular">
                      {t.code}
                    </TD>
                    <TD muted className="whitespace-nowrap">
                      {t.biomaterial}
                    </TD>
                    <TD muted className="whitespace-nowrap">
                      {hours(t.turnaround)}
                    </TD>
                    <TD muted className="whitespace-nowrap">
                      {t.kind === 'package' ? 'From included tests' : (templates.find((x) => x.id === t.templateId)?.name ?? 'No template')}
                    </TD>
                    <TD align="right">
                      <Money value={t.price} />
                    </TD>
                    <TD align="right">
                      <span className="inline-flex" onClick={(e) => e.stopPropagation()}>
                        <Switch
                          checked={t.active}
                          onChange={(v) => {
                            saveTest({ ...t, active: v })
                            toast(v ? `${t.name} is available again` : `${t.name} hidden from new orders`)
                          }}
                        />
                      </span>
                    </TD>
                  </TR>
                ))}
              </tbody>
            </Table>
            <TableFooter>
              <span>
                {plural(tests.filter((t) => t.active).length, 'active test')} · {plural(tests.filter((t) => t.kind === 'package').length, 'package')}
              </span>
            </TableFooter>
          </>
        ) : (
          <EmptyState icon={I.lab} title="No tests match" description="Search by name or code. Missing a test? Add it to the catalog from the top right.">
            <Button
              variant="secondary"
              onClick={() => {
                setQuery('')
                setKind('all')
              }}
            >
              Clear search
            </Button>
          </EmptyState>
        )}
      </Card>
      <TestModal />
    </>
  )
}
