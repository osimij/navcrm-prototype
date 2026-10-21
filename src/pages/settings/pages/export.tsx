import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { I, Icon } from '@/components/icons'
import { Button } from '@/components/ui/button'
import { Meter } from '@/components/ui/misc'
import { formatDate, formatTime } from '@/lib/format'
import { NOW, addDays } from '@/lib/time'
import { SettingsPage, SettingsRow, SettingsSection } from '../ui'

const INCLUDED: { icon: typeof I.clients; title: string; detail: string }[] = [
  { icon: I.clients, title: 'Clients, visits and tasks', detail: 'CSV, one file per table' },
  { icon: I.receipt, title: 'Receipts, payments and expenses', detail: 'CSV with every line item' },
  { icon: I.database, title: 'Everything else', detail: 'JSON: settings, staff, stock, payroll, messages' },
  { icon: I.chart, title: 'Summary workbook', detail: 'Excel with revenue, clients and staff by month' },
  { icon: I.image, title: 'Files', detail: 'Folder with photos, signed consents and lab results (PDF)' },
]

type Phase = 'idle' | 'preparing' | 'ready'

export default function ExportSettings() {
  const [phase, setPhase] = useState<Phase>('idle')
  const [progress, setProgress] = useState(0)
  const [readyAt, setReadyAt] = useState<Date | null>(null)

  useEffect(() => {
    if (phase !== 'preparing') return
    const t = setInterval(() => {
      setProgress((p) => {
        const next = Math.min(100, p + 7 + Math.random() * 12)
        if (next >= 100) {
          clearInterval(t)
          setPhase('ready')
          setReadyAt(new Date())
        }
        return next
      })
    }, 240)
    return () => clearInterval(t)
  }, [phase])

  const step = progress < 30 ? 'Clients and visits' : progress < 60 ? 'Receipts and payments' : progress < 85 ? 'Files' : 'Packing the archive'

  return (
    <SettingsPage
      title="Export all data"
      description="Everything your business keeps in NavCRM, in open formats you can use anywhere."
      actions={
        phase === 'ready' ? (
          <Button variant="primary" icon={I.download} onClick={() => toast.success('Download started', { description: 'navcrm-sitora-export.zip · 48 MB' })}>
            Download
          </Button>
        ) : (
          <Button variant="primary" loading={phase === 'preparing'} onClick={() => (setProgress(0), setPhase('preparing'))}>
            {phase === 'preparing' ? 'Preparing…' : 'Prepare export'}
          </Button>
        )
      }
    >
      {phase !== 'idle' && (
        <div className="rise mb-10 rounded-2xl bg-surface p-5 ring-1 ring-border">
          {phase === 'preparing' ? (
            <>
              <div className="mb-3 flex items-center justify-between text-sm">
                <span className="text-fg">{step}</span>
                <span className="text-muted tabular">{Math.round(progress)}%</span>
              </div>
              <Meter value={progress} tone="accent" />
              <p className="mt-3 text-sm text-muted">You can leave this page. We’ll also send the link to your Telegram.</p>
            </>
          ) : (
            <div className="flex items-center gap-3">
              <span className="grid size-9 place-items-center rounded-full bg-positive-soft text-positive">
                <Icon icon={I.check} size={18} />
              </span>
              <div>
                <div className="text-base text-fg">Your export is ready · 48 MB</div>
                <div className="text-sm text-muted">The link works until {readyAt && `${formatTime(readyAt)} tomorrow`}.</div>
              </div>
            </div>
          )}
        </div>
      )}

      <SettingsSection title="What’s included">
        <ul>
          {INCLUDED.map((it) => (
            <li key={it.title} className="flex items-center gap-3 border-b border-border py-3.5 last:border-b-0">
              <span className="grid size-9 place-items-center rounded-full bg-fill text-muted">
                <Icon icon={it.icon} size={18} />
              </span>
              <span>
                <span className="block text-base text-fg">{it.title}</span>
                <span className="block text-sm text-muted">{it.detail}</span>
              </span>
            </li>
          ))}
        </ul>
      </SettingsSection>

      <SettingsSection title="Good to know">
        <SettingsRow label="Link lifetime">24 hours, then the archive is deleted.</SettingsRow>
        <SettingsRow label="Who can export">Owners only. Each export is recorded in the Activity log.</SettingsRow>
        <SettingsRow label="Previous exports">
          <span className="text-muted">{formatDate(addDays(NOW, -38))} by Zarina Karimova, expired</span>
        </SettingsRow>
      </SettingsSection>
    </SettingsPage>
  )
}
