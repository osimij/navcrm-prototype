import { useState } from 'react'
import { text as translate } from '@/i18n'
import { toast } from 'sonner'
import { I, Icon } from '@/components/icons'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { ChoiceCard } from '@/components/ui/controls'
import { Textarea } from '@/components/ui/input'
import { Page, PageHeader } from '@/components/ui/page'
import { Segmented } from '@/components/ui/tabs'
import { business } from '@/data/business'
import { cn } from '@/lib/cn'
import { formatTime } from '@/lib/format'
import { NOW } from '@/lib/time'

function Row({ label, description, children }: { label: string; description?: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-3 border-b border-border py-5 last:border-b-0 sm:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] sm:gap-8">
      <div>
        <div className="text-base text-fg">{label}</div>
        {description && <p className="mt-1 text-sm text-muted">{description}</p>}
      </div>
      <div className="min-w-0">{children}</div>
    </div>
  )
}

/** Paper preview: the width follows the selected roll, so 58 vs 80 mm is visible. */
function ReceiptPreview({ width, footer }: { width: '58' | '80'; footer: string }) {
  const line = (a: string, b: string) => (
    <div className="flex justify-between gap-3">
      <span className="truncate">{a}</span>
      <span className="shrink-0">{b}</span>
    </div>
  )
  return (
    <div
      className={cn(
        'mx-auto bg-white px-4 py-5 font-mono text-[11px] leading-[16px] text-[#111] shadow-[0_1px_3px_rgb(0_0_0/0.12),0_8px_24px_-8px_rgb(0_0_0/0.2)]',
        width === '58' ? 'w-[220px]' : 'w-[300px]',
      )}
    >
      <div className="text-center font-semibold">{business.name.toUpperCase()}</div>
      <div className="mb-2 text-center">{business.branches[0].address}</div>
      <div className="mb-2 border-t border-dashed border-[#999]" />
      {line('#1043', `${String(NOW.getDate()).padStart(2, '0')}.${String(NOW.getMonth() + 1).padStart(2, '0')}.${NOW.getFullYear()} ${formatTime(NOW)}`)}
      {line('Cashier', 'N. Alieva')}
      <div className="my-2 border-t border-dashed border-[#999]" />
      {line('Hair coloring', '450.00')}
      {line('  Madina R.', '')}
      {line('Nutritive shampoo', '280.00')}
      <div className="my-2 border-t border-dashed border-[#999]" />
      {line('TOTAL', '730.00')}
      {line('Alif QR', '730.00')}
      <div className="my-2 border-t border-dashed border-[#999]" />
      <div className="text-center whitespace-pre-line">{footer || ' '}</div>
    </div>
  )
}

export function Printer() {
  const [paper, setPaper] = useState<'58' | '80'>('58')
  const [via, setVia] = useState<'bluetooth' | 'usb'>('bluetooth')
  const [state, setState] = useState<'idle' | 'connecting' | 'connected'>('idle')
  const [footer, setFooter] = useState(() => translate('Thank you! Book your next visit:\nnavcrm.tj/book/sitora'))

  function connect() {
    setState('connecting')
    setTimeout(() => {
      setState('connected')
      toast.success('Printer connected', { description: via === 'bluetooth' ? 'Xprinter XP-58IIH via Bluetooth' : 'Xprinter XP-58IIH via USB' })
    }, 1100)
  }

  return (
    <Page width="default">
      <PageHeader
        back="/pos"
        title="Receipt printer"
        subtitle="Settings for this device only. Each register computer or tablet keeps its own printer."
        actions={
          state === 'connected' ? (
            <Button variant="primary" icon={I.print} onClick={() => toast('Printing a test receipt')}>
              Print test receipt
            </Button>
          ) : (
            <Button variant="primary" loading={state === 'connecting'} onClick={connect}>
              Connect printer
            </Button>
          )
        }
      />
      <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_340px]">
        <Card className="px-6">
          <Row label="Status">
            {state === 'connected' ? (
              <div className="flex items-center gap-2">
                <Badge tone="positive">
                  Connected
                </Badge>
                <span className="text-base text-muted">Xprinter XP-58IIH</span>
                <Button size="sm" variant="ghost" className="ml-auto" onClick={() => setState('idle')}>
                  Disconnect
                </Button>
              </div>
            ) : (
              <Badge>{state === 'connecting' ? 'Looking for printers…' : 'Not connected'}</Badge>
            )}
          </Row>
          <Row label="Paper width" description="Check the roll in your printer. Most compact printers use 58 mm.">
            <Segmented
              value={paper}
              onChange={setPaper}
              items={[
                { value: '58', label: '58 mm' },
                { value: '80', label: '80 mm' },
              ]}
            />
          </Row>
          <Row label="Connection">
            <div className="grid grid-cols-2 gap-2">
              <ChoiceCard selected={via === 'bluetooth'} onClick={() => setVia('bluetooth')} icon={I.mobile} title="Bluetooth" description="Tablets and phones" />
              <ChoiceCard selected={via === 'usb'} onClick={() => setVia('usb')} icon={I.computer} title="USB cable" description="Computers at the desk" />
            </div>
          </Row>
          <Row label="Works on">
            <ul className="flex flex-col gap-2.5 text-base">
              {[
                { ok: true, text: 'Android with Chrome: Bluetooth and USB' },
                { ok: true, text: 'Windows and Mac with Chrome or Edge: USB and Bluetooth' },
                { ok: false, text: 'iPhone and iPad: only printers with Bluetooth Low Energy' },
              ].map((x) => (
                <li key={x.text} className="flex items-start gap-2.5">
                  <Icon icon={x.ok ? I.checkCircle : I.info} size={18} className={cn('mt-px', x.ok ? 'text-positive' : 'text-warning')} />
                  <span className="text-fg">{x.text}</span>
                </li>
              ))}
            </ul>
            <p className="mt-3 text-sm text-muted">Wi-Fi and network printers connect through the SB Business app on the same network.</p>
          </Row>
          <Row label="Text at the bottom" description="Printed on every receipt from this register.">
            <Textarea value={footer} onChange={(e) => setFooter(e.target.value)} rows={3} />
          </Row>
        </Card>
        <div className="lg:sticky lg:top-6">
          <div className="mb-3 text-sm font-medium text-muted">Preview</div>
          <div className="rounded-2xl bg-fill py-8">
            <ReceiptPreview width={paper} footer={footer} />
          </div>
        </div>
      </div>
    </Page>
  )
}
