import { useState } from 'react'
import { toast } from 'sonner'
import { I, Icon } from '@/components/icons'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Field, Input } from '@/components/ui/input'
import { EmptyState, Money } from '@/components/ui/misc'
import { Select } from '@/components/ui/select'
import { business } from '@/data/business'
import { MiniStat, Steps } from '../parts-b/shared'
import { SettingsPage, SettingsRow, SettingsSection } from '../ui'

const BANKS = ['Alif Bank', 'Dushanbe City Bank', 'Eskhata', 'Amonatbonk', 'Orienbank', 'Spitamen Bank', 'Arvand']

export default function PayoutsSettings() {
  const [bank, setBank] = useState('Alif Bank')
  const [account, setAccount] = useState('')
  const [bic, setBic] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const ready = account.replace(/\D/g, '').length === 20 && bic.trim().length >= 6

  return (
    <SettingsPage
      title="Online payments"
      description="Let clients prepay on the booking page and in Telegram. The money comes to your bank account."
      actions={
        <Button
          variant="primary"
          disabled={!ready || submitted}
          onClick={() => {
            setSubmitted(true)
            toast.success('Sent for verification', { description: 'We’ll message you in Telegram within 1–2 business days.' })
          }}
        >
          {submitted ? 'Sent for verification' : 'Submit for verification'}
        </Button>
      }
    >
      <SettingsSection title="Status">
        <SettingsRow label="Online prepayment" description="Prepayment rules (who pays and how much) are set in Online booking.">
          {submitted ? (
            <Badge tone="warning">
              Verifying account
            </Badge>
          ) : (
            <Badge>Off</Badge>
          )}
          <p className="mt-2 text-sm text-muted">
            {submitted
              ? 'Your details are with the bank. Prepayment turns on by itself once they’re confirmed.'
              : 'Add your payout account below. Until then clients can still prepay at the register with Alif or DC QR.'}
          </p>
        </SettingsRow>
        <SettingsRow label="How it works">
          <Steps
            items={[
              'A client books online and pays the prepayment by card or Alif, DC Wallet QR.',
              'The visit is confirmed automatically; unpaid bookings are released after 15 minutes.',
              'Every weekday we send the previous day’s payments to your account, minus the bank fee of 1.5%.',
            ]}
          />
        </SettingsRow>
      </SettingsSection>

      <SettingsSection title="Payout account" description="Must belong to the business. We check it with the bank before the first payout.">
        <SettingsRow label="Account holder">
          {business.legalName}
          <p className="mt-0.5 text-sm text-muted">TIN {business.tin}</p>
        </SettingsRow>
        <SettingsRow label="Bank">
          <Select value={bank} onChange={setBank} options={BANKS.map((b) => ({ value: b, label: b }))} disabled={submitted} />
        </SettingsRow>
        <SettingsRow label="Account number" description="20 digits, from your bank statement.">
          <Field>
            <Input
              inputMode="numeric"
              value={account}
              onChange={(e) => setAccount(e.target.value.replace(/[^\d ]/g, '').slice(0, 24))}
              placeholder="2020 4972 0000 0000 0000"
              className="tabular"
              disabled={submitted}
            />
          </Field>
        </SettingsRow>
        <SettingsRow label="Bank code (BIC)">
          <Input value={bic} onChange={(e) => setBic(e.target.value.toUpperCase())} placeholder="350101369" className="max-w-56 tabular" disabled={submitted} />
        </SettingsRow>
      </SettingsSection>

      <SettingsSection title="Money" description="Updates as soon as the first client pays online.">
        <div className="mt-4 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
          <MiniStat label="Received" value={<Money value={0} />} />
          <MiniStat label="Bank fees" value={<Money value={0} />} />
          <MiniStat label="To pay out" value={<Money value={0} />} />
          <MiniStat label="Paid out" value={<Money value={0} />} />
        </div>
        <EmptyState
          icon={I.card}
          title="No online payments yet"
          description="Each payment will show the client, visit, fee and the payout it belongs to."
          className="py-10"
        />
        <p className="flex items-center gap-2 text-sm text-faint">
          <Icon icon={I.lock} size={14} />
          Card details are handled by the bank. NavCRM never sees them.
        </p>
      </SettingsSection>
    </SettingsPage>
  )
}
