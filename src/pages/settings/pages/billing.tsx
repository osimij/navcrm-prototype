import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import { I, Icon } from '@/components/icons'
import { Badge } from '@/components/ui/badge'
import { Button, IconButton } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { ChoiceCard } from '@/components/ui/controls'
import { Modal } from '@/components/ui/dialog'
import { Field, Input } from '@/components/ui/input'
import { Figure, Meter, Money } from '@/components/ui/misc'
import { TD, TH, THead, TR, Table } from '@/components/ui/table'
import { isVisit } from '@/data/appointments'
import { business } from '@/data/business'
import { cn } from '@/lib/cn'
import { formatDate, formatMoney, formatNumber, monthLong } from '@/lib/format'
import { useData } from '@/lib/store'
import { NOW, TODAY, addDays } from '@/lib/time'
import { SettingsPage, SettingsSection } from '../ui'

type Plan = {
  id: string
  name: string
  price: string
  note: string
  limits: [string, string][]
  monthly: number | null
}

const PLANS: Plan[] = [
  {
    id: 'free',
    name: 'Free',
    price: '0 TJS',
    note: 'To try NavCRM with a small team',
    monthly: 0,
    limits: [['Branches', '1'], ['Staff', '2'], ['Bookings', '50 a month'], ['AI dialogs', '20 a month'], ['Storage', '1 GB'], ['Modules', '2']],
  },
  {
    id: 'visit',
    name: 'Per visit',
    price: '1.50 TJS per visit',
    note: 'Pay only for completed visits',
    monthly: null,
    limits: [['Branches', '3'], ['Staff', '15'], ['Bookings', 'Unlimited'], ['AI dialogs', '300 a month'], ['Storage', '10 GB'], ['Modules', 'All']],
  },
  {
    id: 'start',
    name: 'Start',
    price: '150 TJS a month',
    note: 'One location, small team',
    monthly: 150,
    limits: [['Branches', '1'], ['Staff', '5'], ['Bookings', '500 a month'], ['AI dialogs', '100 a month'], ['Storage', '5 GB'], ['Modules', '3']],
  },
  {
    id: 'business',
    name: 'Business',
    price: '350 TJS a month',
    note: 'Busy salons and clinics',
    monthly: 350,
    limits: [['Branches', '3'], ['Staff', '20'], ['Bookings', 'Unlimited'], ['AI dialogs', '500 a month'], ['Storage', '20 GB'], ['Modules', '6']],
  },
  {
    id: 'network',
    name: 'Network',
    price: '900 TJS a month',
    note: 'Chains with many branches',
    monthly: 900,
    limits: [['Branches', 'Unlimited'], ['Staff', 'Unlimited'], ['Bookings', 'Unlimited'], ['AI dialogs', '2,000 a month'], ['Storage', '100 GB'], ['Modules', 'All']],
  },
]

const PAY_WITH = [
  { id: 'alif', title: 'Alif', description: 'QR or app' },
  { id: 'dc', title: 'DC Wallet', description: 'QR or app' },
  { id: 'card', title: 'Bank card', description: 'Korti Milli, Visa' },
]

function monthAgo(n: number) {
  return new Date(NOW.getFullYear(), NOW.getMonth() - n, 1)
}

const INVOICES = [
  { date: monthAgo(0), what: 'Balance top-up', amount: 200, method: 'Alif QR' },
  { date: monthAgo(0), what: `${monthLong(monthAgo(1).getMonth())}: 1,034 visits`, amount: 1551, method: 'Bank transfer' },
  { date: addDays(monthAgo(0), -12), what: 'Balance top-up', amount: 100, method: 'DC Wallet' },
  { date: monthAgo(1), what: `${monthLong(monthAgo(2).getMonth())}: 986 visits`, amount: 1479, method: 'Bank transfer' },
  { date: monthAgo(2), what: `${monthLong(monthAgo(3).getMonth())}: 912 visits`, amount: 1368, method: 'Bank transfer' },
]

function TopUpModal({ open, onClose, onPaid }: { open: boolean; onClose: () => void; onPaid: (amount: number) => void }) {
  const [amount, setAmount] = useState(200)
  const [custom, setCustom] = useState('')
  const [via, setVia] = useState('alif')
  const [paying, setPaying] = useState(false)
  const value = custom ? Number(custom) : amount

  return (
    <Modal
      open={open}
      onOpenChange={(o) => !o && onClose()}
      title="Top up balance"
      description="Used for SMS, WhatsApp messages and AI dialogs over your plan."
      size="md"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            loading={paying}
            disabled={!value}
            onClick={() => {
              setPaying(true)
              setTimeout(() => {
                setPaying(false)
                onPaid(value)
              }, 800)
            }}
          >
            Pay {formatMoney(value || 0)}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-5">
        <Field label="Amount">
          <div className="grid grid-cols-4 gap-2">
            {[50, 100, 200, 500].map((a) => (
              <button
                key={a}
                type="button"
                onClick={() => {
                  setAmount(a)
                  setCustom('')
                }}
                className={cn(
                  'press h-10 rounded-xl text-base tabular ring-1 ring-inset',
                  !custom && amount === a ? 'bg-fg font-medium text-bg ring-fg' : 'bg-surface text-fg ring-border hover:bg-fill',
                )}
              >
                {a}
              </button>
            ))}
          </div>
          <Input
            className="mt-2"
            inputMode="numeric"
            placeholder="Other amount"
            value={custom}
            onChange={(e) => setCustom(e.target.value.replace(/\D/g, ''))}
            suffix="TJS"
          />
        </Field>
        <Field label="Pay with">
          <div className="grid grid-cols-3 gap-2">
            {PAY_WITH.map((p) => (
              <ChoiceCard key={p.id} selected={via === p.id} onClick={() => setVia(p.id)} title={p.title} description={p.description} />
            ))}
          </div>
        </Field>
        <p className="text-sm text-muted">About {formatNumber(Math.floor((value || 0) / 0.15))} SMS at 0.15 TJS each.</p>
      </div>
    </Modal>
  )
}

export default function BillingSettings() {
  const entries = useData((s) => s.entries)
  const [balance, setBalance] = useState(84.2)
  const [topUp, setTopUp] = useState(false)
  const [switching, setSwitching] = useState<Plan | null>(null)
  const [current, setCurrent] = useState('visit')

  const usage = useMemo(() => {
    const monthStart = new Date(NOW.getFullYear(), NOW.getMonth(), 1)
    const visits = entries.filter((e) => isVisit(e) && e.status === 'completed' && e.start >= monthStart && e.start <= NOW).length
    const day = NOW.getDate()
    const days = new Date(NOW.getFullYear(), NOW.getMonth() + 1, 0).getDate()
    const amount = visits * business.pricePerVisit
    return { visits, amount, forecast: Math.round((amount / day) * days), day, days }
  }, [entries])
  const cheaper = PLANS.find((p) => p.id === 'business')!

  return (
    <SettingsPage
      title="Plan & billing"
      description="What you pay NavCRM, and the balance for messages."
      wide
      actions={
        <Button variant="primary" icon={I.add} onClick={() => setTopUp(true)}>
          Top up balance
        </Button>
      }
    >
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
        <Card className="p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base text-muted">Current plan</span>
                <Badge tone="accent">{PLANS.find((p) => p.id === current)?.name}</Badge>
              </div>
              <div className="mt-2 text-2xl text-fg">1.50 TJS per completed visit</div>
              <p className="mt-1 text-sm text-muted">No monthly fee. Cancelled visits and no-shows are free.</p>
            </div>
            <div className="text-right">
              <div className="text-sm text-muted">
                {monthLong(NOW.getMonth())} so far · {usage.visits} visits
              </div>
              <div className="mt-1 text-2xl text-fg">
                <Money value={usage.amount} decimals />
              </div>
            </div>
          </div>
          <div className="mt-6">
            <div className="mb-2 flex items-center justify-between text-sm">
              <span className="text-muted">
                Day {usage.day} of {usage.days}
              </span>
              <span className="text-muted">
                Expected for the month <Money value={usage.forecast} className="text-fg" />
              </span>
            </div>
            <Meter value={usage.day} max={usage.days} tone="accent" />
          </div>
          {usage.forecast > (cheaper.monthly ?? 0) && (
            <div className="mt-5 flex flex-wrap items-center gap-3 rounded-xl bg-fill px-4 py-3">
              <Icon icon={I.info} size={18} className="text-muted" />
              <p className="min-w-0 flex-1 text-sm text-fg">
                At this pace, the Business plan would cost <Money value={(usage.forecast - 350)} /> less this month.
              </p>
              <Button size="sm" variant="secondary" onClick={() => setSwitching(cheaper)}>
                Compare
              </Button>
            </div>
          )}
        </Card>

        <Card className="flex flex-col p-6">
          <div className="text-base text-muted">Message balance</div>
          <div className="mt-2 flex items-baseline gap-2">
            <Figure value={balance} money format={{ minimumFractionDigits: 2, maximumFractionDigits: 2 }} className="text-4xl font-normal text-fg" />
            <span className="text-sm text-faint">TJS</span>
          </div>
          <dl className="mt-4 flex flex-col gap-2 text-sm">
            {[
              ['SMS · 412 sent', 61.8],
              ['WhatsApp · 36 sent', 14.4],
              ['AI dialogs over plan', 0],
            ].map(([l, a]) => (
              <div key={l as string} className="flex justify-between">
                <dt className="text-muted">{l}</dt>
                <dd>
                  <Money value={a as number} decimals />
                </dd>
              </div>
            ))}
          </dl>
          <p className="mt-auto pt-4 text-xs text-faint">Last 30 days. Telegram and push messages are free.</p>
        </Card>
      </div>

      <SettingsSection title="Plans" className="mt-10" description="Switching takes effect on the 1st of next month. Your data and settings stay.">
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {PLANS.map((p) => {
            const isCurrent = p.id === current
            return (
              <div key={p.id} className={cn('flex flex-col rounded-2xl p-5 ring-1', isCurrent ? 'bg-accent-soft ring-accent' : 'bg-surface ring-border')}>
                <div className="flex items-center justify-between">
                  <span className="text-base font-medium text-fg">{p.name}</span>
                  {isCurrent && <Icon icon={I.checkCircle} size={18} className="text-accent-fg" />}
                </div>
                <div className="mt-2 text-lg text-fg">{p.price}</div>
                <p className="mt-0.5 text-sm text-muted">{p.note}</p>
                <dl className="mt-4 flex flex-col gap-1.5 border-t border-border pt-4 text-sm">
                  {p.limits.map(([k, val]) => (
                    <div key={k} className="flex justify-between gap-2">
                      <dt className="text-muted">{k}</dt>
                      <dd className="text-right text-fg">{val}</dd>
                    </div>
                  ))}
                </dl>
                <Button size="sm" variant={isCurrent ? 'ghost' : 'secondary'} disabled={isCurrent} className="mt-5" onClick={() => setSwitching(p)}>
                  {isCurrent ? 'Current plan' : 'Switch'}
                </Button>
              </div>
            )
          })}
        </div>
      </SettingsSection>

      <SettingsSection title="Invoices and payments">
        <Card className="mt-4 overflow-hidden">
          <Table>
            <THead>
              <TH>Date</TH>
              <TH>Description</TH>
              <TH>Paid with</TH>
              <TH>Status</TH>
              <TH align="right">Amount</TH>
              <TH />
            </THead>
            <tbody>
              {INVOICES.map((inv, i) => (
                <TR key={i}>
                  <TD muted>{formatDate(inv.date < TODAY ? inv.date : TODAY)}</TD>
                  <TD>{inv.what}</TD>
                  <TD muted>{inv.method}</TD>
                  <TD>
                    <Badge tone="positive">
                      Paid
                    </Badge>
                  </TD>
                  <TD align="right">
                    <Money value={inv.amount} decimals />
                  </TD>
                  <TD align="right">
                    <IconButton icon={I.download} label="Download PDF" size="sm" onClick={() => toast.success('Invoice downloaded')} />
                  </TD>
                </TR>
              ))}
            </tbody>
          </Table>
        </Card>
      </SettingsSection>

      <TopUpModal
        open={topUp}
        onClose={() => setTopUp(false)}
        onPaid={(a) => {
          setBalance((b) => b + a)
          setTopUp(false)
          toast.success(`${formatMoney(a)} added to your balance`)
        }}
      />

      <Modal
        open={!!switching}
        onOpenChange={(o) => !o && setSwitching(null)}
        title={`Switch to ${switching?.name}?`}
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setSwitching(null)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={() => {
                if (switching) {
                  setCurrent(switching.id)
                  toast.success(`${switching.name} starts on the 1st`, { description: 'We’ll send the first invoice in Telegram.' })
                }
                setSwitching(null)
              }}
            >
              Switch plan
            </Button>
          </>
        }
      >
        {switching && (
          <div className="flex flex-col gap-3 text-base text-muted">
            <p>
              {switching.price}. Based on this month you’d pay{' '}
              <span className="text-fg">{switching.monthly != null ? formatMoney(switching.monthly) : formatMoney(usage.forecast)}</span> instead of{' '}
              <span className="text-fg">{formatMoney(usage.forecast)}</span>.
            </p>
            <p>
              Limits: {switching.limits.map(([k, v]) => `${k.toLowerCase()} ${v.toLowerCase()}`).join(', ')}.
            </p>
          </div>
        )}
      </Modal>
    </SettingsPage>
  )
}
