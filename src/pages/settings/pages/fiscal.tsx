import { toast } from 'sonner'
import { I } from '@/components/icons'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { ChoiceCard } from '@/components/ui/controls'
import { Field, Input } from '@/components/ui/input'
import { Money } from '@/components/ui/misc'
import { Select } from '@/components/ui/select'
import { TD, TH, THead, TR, Table } from '@/components/ui/table'
import { business } from '@/data/business'
import { formatDayTime } from '@/lib/format'
import { seeded } from '@/lib/random'
import { NOW, addMinutes } from '@/lib/time'
import { useState } from 'react'
import { useSettingsForm } from '../parts-b/shared'
import { SaveBar, SettingsPage, SettingsSection } from '../ui'

type Mode = 'none' | 'external' | 'device' | 'cloud'

const MODES: { id: Mode; title: string; description: string; icon: typeof I.receipt }[] = [
  { id: 'none', title: 'Non-fiscal receipt', description: 'Receipt by Telegram or print, without tax registration', icon: I.receipt },
  { id: 'external', title: 'External cash register', description: 'You punch sales into your own register; we store its number', icon: I.store },
  { id: 'device', title: 'Online register device', description: 'Connected register prints fiscal receipts. Test mode only', icon: I.print },
  { id: 'cloud', title: 'Cloud register via API', description: 'Receipts are registered automatically, nothing to print', icon: I.plug },
]

type QueueStatus = 'sent' | 'waiting' | 'error'
const r = seeded(1717)
const QUEUE = Array.from({ length: 9 }, (_, i) => {
  const status: QueueStatus = i === 1 ? 'error' : i < 3 ? 'waiting' : 'sent'
  return {
    id: `R-${1052 - i}`,
    at: addMinutes(NOW, -(i * 23 + r.int(2, 14))),
    amount: r.int(6, 60) * 10,
    branch: i % 3 === 2 ? business.branches[1].name : business.branches[0].name,
    status,
  }
})

const STATUS: Record<QueueStatus, { label: string; tone: 'positive' | 'neutral' | 'negative' }> = {
  sent: { label: 'Registered', tone: 'positive' },
  waiting: { label: 'In queue', tone: 'neutral' },
  error: { label: 'Rejected', tone: 'negative' },
}

export default function FiscalSettings() {
  const form = useSettingsForm({
    b1: 'cloud' as Mode,
    b2: 'external' as Mode,
    b1Register: '',
    b2Register: 'KKM 0010472318',
    provider: 'partner',
    apiKey: 'cr_live_•••••••••••••a93c',
  })
  const [queue, setQueue] = useState(QUEUE)
  const v = form.value

  return (
    <SettingsPage title="Fiscal receipts" description="How each branch registers sales with the tax authority.">
      <>
        {business.branches.map((b) => {
          const key = b.id as 'b1' | 'b2'
          const regKey = key === 'b1' ? 'b1Register' : 'b2Register'
          const mode = v[key]
          return (
            <SettingsSection key={b.id} title={b.name} description={b.address}>
              <div className="mt-4 grid gap-2.5 sm:grid-cols-2">
                {MODES.map((m) => (
                  <ChoiceCard
                    key={m.id}
                    selected={mode === m.id}
                    onClick={() => form.set(key, m.id)}
                    icon={m.icon}
                    title={m.title}
                    description={m.description}
                  />
                ))}
              </div>
              {mode === 'external' && (
                <div className="mt-4 max-w-sm">
                  <Field label="Register number" hint="Printed on the register’s registration card">
                    <Input
                      value={v[regKey]}
                      onChange={(e) => form.set(regKey, e.target.value)}
                      placeholder="KKM 0000000000"
                    />
                  </Field>
                </div>
              )}
              {mode === 'cloud' && (
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <Field label="Provider">
                    <Select
                      value={v.provider}
                      onChange={(p) => form.set('provider', p)}
                      options={[
                        { value: 'partner', label: 'NavCRM partner register' },
                        { value: 'custom', label: 'My own provider (API)' },
                      ]}
                    />
                  </Field>
                  <Field label="API key">
                    <Input value={v.apiKey} onChange={(e) => form.set('apiKey', e.target.value)} />
                  </Field>
                </div>
              )}
              {mode === 'device' && (
                <p className="mt-4 rounded-xl bg-warning-soft px-3.5 py-3 text-sm text-warning">
                  Online register devices are in test mode: receipts print but aren’t sent to the tax authority yet.
                </p>
              )}
            </SettingsSection>
          )
        })}
      </>

      <SettingsSection
        title="Registration queue"
        description="Receipts sent to the cloud register. Rejected ones retry after you fix the reason."
        action={
          <Button size="sm" icon={I.refresh} onClick={() => toast.success('Queue checked', { description: 'Rejected receipts will be resent.' })}>
            Check now
          </Button>
        }
      >
        <Card className="mt-4 overflow-hidden">
          <Table>
            <THead>
              <TH>Receipt</TH>
              <TH>Time</TH>
              <TH>Branch</TH>
              <TH>Status</TH>
              <TH align="right">Amount</TH>
              <TH />
            </THead>
            <tbody>
              {queue.map((q) => (
                <TR key={q.id}>
                  <TD className="tabular">{q.id}</TD>
                  <TD muted>{formatDayTime(q.at)}</TD>
                  <TD muted>{q.branch}</TD>
                  <TD>
                    <Badge tone={STATUS[q.status].tone}>
                      {STATUS[q.status].label}
                    </Badge>
                    {q.status === 'error' && <span className="mt-1 block text-xs text-muted">No tax rate on “Gift certificate”</span>}
                  </TD>
                  <TD align="right">
                    <Money value={q.amount} />
                  </TD>
                  <TD align="right">
                    {q.status === 'error' && (
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => {
                          setQueue((list) => list.map((x) => (x.id === q.id ? { ...x, status: 'waiting' } : x)))
                          toast.success(`${q.id} sent again`)
                        }}
                      >
                        Retry
                      </Button>
                    )}
                  </TD>
                </TR>
              ))}
            </tbody>
          </Table>
        </Card>
      </SettingsSection>

      <SaveBar dirty={form.dirty} onSave={form.save} onDiscard={form.discard} />
    </SettingsPage>
  )
}
