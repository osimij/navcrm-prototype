import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router'
import { toast } from 'sonner'
import { I, Icon } from '@/components/icons'
import { Button } from '@/components/ui/button'
import { Card, CardHeader } from '@/components/ui/card'
import { Switch } from '@/components/ui/controls'
import { Meter } from '@/components/ui/misc'
import { Page, PageHeader } from '@/components/ui/page'
import { Select } from '@/components/ui/select'
import { TD, TH, THead, TR, Table } from '@/components/ui/table'
import { cn } from '@/lib/cn'
import { formatNumber } from '@/lib/format'

const GUIDES = [
  {
    id: 'yclients',
    name: 'YCLIENTS / Altegio',
    steps: ['Open Clients → Client base.', 'Click Export and choose Excel.', 'Upload the file here. Columns are matched automatically.'],
  },
  {
    id: 'dikidi',
    name: 'Dikidi',
    steps: ['In the business account, open Clients.', 'Open the “…” menu and choose Export to Excel.', 'Upload the file here.'],
  },
  {
    id: 'easyweek',
    name: 'EasyWeek',
    steps: ['Go to Settings → Data export.', 'Choose Customers and the CSV format.', 'Upload the file here.'],
  },
  {
    id: 'fresha',
    name: 'Fresha',
    steps: ['Open Clients → Options → Export.', 'Pick CSV and download.', 'Upload the file here.'],
  },
  {
    id: 'excel',
    name: 'Your own Excel file',
    steps: [
      'One client per row.',
      'Required: Phone and First name. Optional: Last name, Birthday (DD.MM.YYYY), Gender, Notes.',
      'Phones can be in any format; we convert them to +992.',
    ],
  },
]

type Target = 'phone' | 'first' | 'last' | 'birthday' | 'gender' | 'notes' | 'lastVisit' | 'spent' | 'skip'

const TARGETS: { value: Target; label: string }[] = [
  { value: 'phone', label: 'Phone' },
  { value: 'first', label: 'First name' },
  { value: 'last', label: 'Last name' },
  { value: 'birthday', label: 'Birthday' },
  { value: 'gender', label: 'Gender' },
  { value: 'notes', label: 'Notes' },
  { value: 'lastVisit', label: 'Last visit date' },
  { value: 'spent', label: 'Total spent' },
  { value: 'skip', label: 'Don’t import' },
]

const COLUMNS: { header: string; samples: string; target: Target }[] = [
  { header: 'Телефон', samples: '93 412 00 56 · 918804411 · +992 90 123 77 88', target: 'phone' },
  { header: 'Имя', samples: 'Madina · Firuza · Gulnora', target: 'first' },
  { header: 'Фамилия', samples: 'Rahimova · Saidova · Sharipova', target: 'last' },
  { header: 'Дата рождения', samples: '12.04.1994 · 03.11.1988 · —', target: 'birthday' },
  { header: 'Пол', samples: 'ж · ж · м', target: 'gender' },
  { header: 'Комментарий', samples: 'Allergic to latex · — · VIP', target: 'notes' },
  { header: 'Последний визит', samples: '14.09.2026 · 02.08.2026 · 21.10.2026', target: 'lastVisit' },
  { header: 'Мастер', samples: 'Madina · Firuza · —', target: 'skip' },
]

const TOTAL = 329

type Stage = 'idle' | 'mapping' | 'importing' | 'done'

export function ImportClients() {
  const navigate = useNavigate()
  const fileInput = useRef<HTMLInputElement>(null)
  const [stage, setStage] = useState<Stage>('idle')
  const [file, setFile] = useState('sitora_clients_2026.xlsx')
  const [map, setMap] = useState<Target[]>(COLUMNS.map((c) => c.target))
  const [merge, setMerge] = useState(true)
  const [progress, setProgress] = useState(0)
  const [dragging, setDragging] = useState(false)
  const [guide, setGuide] = useState<string | null>(null)

  useEffect(() => {
    if (stage !== 'importing') return
    if (progress >= TOTAL) {
      const done = setTimeout(() => setStage('done'), 250)
      return () => clearTimeout(done)
    }
    const t = setTimeout(() => setProgress((p) => Math.min(TOTAL, p + 23)), 80)
    return () => clearTimeout(t)
  }, [stage, progress])

  const start = (name: string) => {
    setFile(name)
    setMap(COLUMNS.map((c) => c.target))
    setStage('mapping')
  }

  const hasPhone = map.includes('phone')

  return (
    <Page width="narrow">
      <PageHeader back="/clients" title="Import clients" subtitle="Bring your client base from Excel or another booking system." />

      {stage === 'idle' && (
        <>
          <div
            onDragOver={(e) => {
              e.preventDefault()
              setDragging(true)
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => {
              e.preventDefault()
              setDragging(false)
              const f = e.dataTransfer.files[0]
              if (f) start(f.name)
            }}
            className={cn(
              'flex flex-col items-center rounded-2xl border border-dashed px-6 py-12 text-center transition-colors duration-150',
              dragging ? 'border-accent bg-accent-soft' : 'border-border-strong bg-surface',
            )}
          >
            <span className="grid size-12 place-items-center rounded-2xl bg-fill text-muted">
              <Icon icon={I.upload} size={22} />
            </span>
            <h2 className="mt-4 text-base font-medium text-fg">Drop an .xlsx or .csv file here</h2>
            <p className="mt-1 max-w-sm text-base text-muted">Phones are converted to +992 automatically, and clients with the same phone are merged.</p>
            <div className="mt-5 flex flex-wrap justify-center gap-2">
              <Button variant="primary" onClick={() => fileInput.current?.click()}>
                Choose file
              </Button>
              <Button onClick={() => start('sitora_clients_2026.xlsx')}>Try with a sample file</Button>
            </div>
            <input
              ref={fileInput}
              type="file"
              accept=".xlsx,.xls,.csv"
              hidden
              onChange={(e) => {
                const f = e.target.files?.[0]
                if (f) start(f.name)
              }}
            />
          </div>

          <h2 className="mt-10 mb-3 text-lg font-medium text-fg">Moving from another system</h2>
          <Card className="overflow-hidden">
            <ul className="divide-y divide-border">
              {GUIDES.map((g) => {
                const open = guide === g.id
                return (
                  <li key={g.id}>
                    <button
                      type="button"
                      aria-expanded={open}
                      onClick={() => setGuide(open ? null : g.id)}
                      className="flex w-full items-center gap-3 px-5 py-4 text-left hover:bg-fill/60"
                    >
                      <span className="flex-1 text-base text-fg">{g.name}</span>
                      <Icon icon={I.chevronDown} size={16} className={cn('text-faint transition-transform duration-200 ease-[var(--ease-out)]', open && 'rotate-180')} />
                    </button>
                    {open && (
                      <ol className="flex flex-col gap-2 px-5 pb-5">
                        {g.steps.map((s, i) => (
                          <li key={i} className="flex gap-3 text-base text-muted">
                            <span className="grid size-6 shrink-0 place-items-center rounded-full bg-fill text-xs font-medium text-fg">{i + 1}</span>
                            <span className="pt-0.5">{s}</span>
                          </li>
                        ))}
                        {g.id === 'excel' && (
                          <li className="pl-9">
                            <Button size="sm" variant="link" onClick={() => toast.success('Template downloaded: navcrm_clients_template.xlsx')}>
                              Download the template
                            </Button>
                          </li>
                        )}
                      </ol>
                    )}
                  </li>
                )
              })}
            </ul>
          </Card>
        </>
      )}

      {stage === 'mapping' && (
        <Card className="rise overflow-hidden">
          <CardHeader
            title={file}
            description={`${formatNumber(TOTAL)} rows found. Check how the columns map to client fields.`}
            action={
              <Button size="sm" variant="ghost" onClick={() => setStage('idle')}>
                Choose another file
              </Button>
            }
          />
          <Table>
            <THead>
              <TH className="text-left">Column in your file</TH>
              <TH className="hidden text-left sm:table-cell">Examples</TH>
              <TH className="text-left">Import as</TH>
            </THead>
            <tbody>
              {COLUMNS.map((col, i) => (
                <TR key={col.header}>
                  <TD className="font-medium">{col.header}</TD>
                  <TD muted className="hidden max-w-60 truncate text-sm sm:table-cell">
                    {col.samples}
                  </TD>
                  <TD className="w-48">
                    <Select
                      value={map[i]}
                      onChange={(v) => setMap((m) => m.map((x, j) => (j === i ? v : x)))}
                      options={TARGETS}
                    />
                  </TD>
                </TR>
              ))}
            </tbody>
          </Table>
          <div className="flex flex-col gap-4 border-t border-border px-5 py-4">
            <Switch
              checked={merge}
              onChange={setMerge}
              label="Merge with existing clients by phone"
              description="Visits, notes and birthdays are added to the existing profile instead of creating a duplicate."
            />
          </div>
          <div className="flex items-center justify-end gap-2 border-t border-border px-5 py-4">
            {!hasPhone && <span className="mr-auto text-sm text-negative">Pick the column with phone numbers</span>}
            <Button variant="ghost" onClick={() => setStage('idle')}>
              Cancel
            </Button>
            <Button
              variant="primary"
              disabled={!hasPhone}
              onClick={() => {
                setProgress(0)
                setStage('importing')
              }}
            >
              Import {formatNumber(TOTAL)} clients
            </Button>
          </div>
        </Card>
      )}

      {stage === 'importing' && (
        <Card className="p-6">
          <div className="flex items-baseline justify-between">
            <span className="text-base text-fg">Importing {file}</span>
            <span className="text-sm text-muted tabular">
              {formatNumber(progress)} of {formatNumber(TOTAL)}
            </span>
          </div>
          <Meter value={progress} max={TOTAL} tone="accent" className="mt-3" />
          <p className="mt-3 text-sm text-muted">You can leave this page; we’ll notify you when it’s done.</p>
        </Card>
      )}

      {stage === 'done' && (
        <Card className="rise p-6">
          <span className="grid size-12 place-items-center rounded-full bg-positive-soft text-positive">
            <Icon icon={I.checkCircle} size={24} />
          </span>
          <h2 className="mt-4 text-2xl font-normal text-fg">312 clients imported</h2>
          <ul className="mt-4 divide-y divide-border border-y border-border">
            <li className="flex items-center gap-3 py-3 text-base text-fg">
              <Icon icon={I.users} size={18} className="text-muted" />
              <span className="flex-1">{merge ? '14 duplicates merged into existing clients' : '14 rows had phones already in your base'}</span>
            </li>
            <li className="flex items-center gap-3 py-3 text-base text-fg">
              <Icon icon={I.alert} size={18} className="text-warning" />
              <span className="flex-1">3 rows skipped: phone number isn’t valid</span>
              <Button size="sm" variant="ghost" icon={I.download} onClick={() => toast.success('Downloaded skipped_rows.xlsx')}>
                Skipped rows
              </Button>
            </li>
          </ul>
          <p className="mt-4 text-sm text-muted">Categories (New, Regular, VIP, Lost) were assigned from visit history.</p>
          <div className="mt-6 flex gap-2">
            <Button variant="primary" onClick={() => navigate('/clients')}>
              View clients
            </Button>
            <Button onClick={() => setStage('idle')}>Import another file</Button>
          </div>
        </Card>
      )}
    </Page>
  )
}
