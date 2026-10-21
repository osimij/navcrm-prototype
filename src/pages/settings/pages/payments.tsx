import { text as translate } from '@/i18n'
import { useState } from 'react'
import { toast } from 'sonner'
import { I } from '@/components/icons'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Switch } from '@/components/ui/controls'
import { Modal } from '@/components/ui/dialog'
import { Field, Input, Textarea } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { TD, TH, THead, TR, Table } from '@/components/ui/table'
import { ProviderMark, useSettingsForm } from '../parts-b/shared'
import { SaveBar, SettingsPage, SettingsRow, SettingsSection } from '../ui'

type MethodType = 'Cash' | 'Card' | 'QR' | 'Transfer' | 'Other'
type Method = { id: string; name: string; type: MethodType; fiscal: boolean; commission: number; active: boolean }

const INITIAL: Method[] = [
  { id: 'cash', name: 'Cash', type: 'Cash', fiscal: true, commission: 0, active: true },
  { id: 'card', name: 'Bank card', type: 'Card', fiscal: true, commission: 1.5, active: true },
  { id: 'alif', name: 'Alif QR', type: 'QR', fiscal: true, commission: 1, active: true },
  { id: 'dc', name: 'DC Wallet QR', type: 'QR', fiscal: true, commission: 1, active: true },
  { id: 'milli', name: 'Korti Milli', type: 'Card', fiscal: true, commission: 1.2, active: true },
  { id: 'eskhata', name: 'Eskhata', type: 'QR', fiscal: true, commission: 1, active: true },
  { id: 'amonat', name: 'Amonatbonk', type: 'QR', fiscal: true, commission: 1, active: false },
  { id: 'vasl', name: 'Vasl', type: 'QR', fiscal: true, commission: 1.5, active: false },
  { id: 'transfer', name: 'Bank transfer', type: 'Transfer', fiscal: false, commission: 0, active: true },
  { id: 'other', name: 'Other', type: 'Other', fiscal: false, commission: 0, active: false },
]

const TYPES: MethodType[] = ['Cash', 'Card', 'QR', 'Transfer', 'Other']

function MethodModal({
  method,
  onClose,
  onSave,
}: {
  method: Method | 'new' | null
  onClose: () => void
  onSave: (m: Method) => void
}) {
  const blank: Method = { id: '', name: '', type: 'QR', fiscal: true, commission: 0, active: true }
  const [draft, setDraft] = useState<Method>(blank)
  // Keep the last opened target so the title doesn't change while the modal animates out.
  const [shown, setShown] = useState<Method | 'new' | null>(null)
  const [prev, setPrev] = useState<Method | 'new' | null>(null)
  if (method !== prev) {
    setPrev(method)
    if (method) {
      setShown(method)
      setDraft(method === 'new' ? blank : method)
    }
  }
  const isNew = shown === 'new'

  return (
    <Modal
      open={!!method}
      onOpenChange={(o) => !o && onClose()}
      title={isNew ? 'Add payment method' : draft.name || 'Payment method'}
      size="sm"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            disabled={!draft.name.trim()}
            onClick={() => onSave({ ...draft, id: draft.id || `m${Date.now()}` })}
          >
            {isNew ? 'Add method' : 'Save'}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <Field label="Name shown on receipts">
          <Input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} autoFocus placeholder="e.g. Humo QR" />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Type">
            <Select value={draft.type} onChange={(t) => setDraft({ ...draft, type: t })} options={TYPES.map((t) => ({ value: t, label: t }))} />
          </Field>
          <Field label="Bank fee" hint="Counted in the profit report">
            <Input
              inputMode="decimal"
              value={String(draft.commission)}
              onChange={(e) => setDraft({ ...draft, commission: Number(e.target.value.replace(',', '.')) || 0 })}
              suffix="%"
            />
          </Field>
        </div>
        <Switch
          checked={draft.fiscal}
          onChange={(v) => setDraft({ ...draft, fiscal: v })}
          label="Print a fiscal receipt"
          description="Sends the sale to your cash register or cloud register."
        />
      </div>
    </Modal>
  )
}

export default function PaymentsSettings() {
  const form = useSettingsForm({
    rounding: 'none',
    allowNegative: false,
    shiftOnly: true,
    tip: '10',
    footer: translate('Thank you for visiting Sitora Beauty! Book again: navcrm.tj/book/sitora'),
  })
  const [methods, setMethods] = useState(INITIAL)
  const [editing, setEditing] = useState<Method | 'new' | null>(null)
  const v = form.value

  return (
    <SettingsPage
      title="Payment methods"
      description="How the register takes money and what ends up on receipts."
      actions={
        <Button variant="primary" icon={I.add} onClick={() => setEditing('new')}>
          Add method
        </Button>
      }
    >
      <SettingsSection title="Methods" description="Turned-off methods are hidden at the register but stay in past receipts.">
        <Card className="mt-4 overflow-hidden">
          <Table>
            <THead>
              <TH>Method</TH>
              <TH>Type</TH>
              <TH>Receipt</TH>
              <TH align="right">Bank fee</TH>
              <TH align="right">On</TH>
            </THead>
            <tbody>
              {methods.map((m) => (
                <TR key={m.id} onClick={() => setEditing(m)}>
                  <TD>
                    <span className="flex items-center gap-3">
                      <ProviderMark name={m.name} className="size-8 rounded-lg text-xs" />
                      <span className={m.active ? 'text-fg' : 'text-muted'}>{m.name}</span>
                    </span>
                  </TD>
                  <TD muted>{m.type}</TD>
                  <TD muted={!m.fiscal}>{m.fiscal ? 'Fiscal' : 'Non-fiscal'}</TD>
                  <TD align="right" muted>
                    {m.commission ? `${m.commission}%` : '—'}
                  </TD>
                  <TD align="right">
                    <span onClick={(e) => e.stopPropagation()} className="inline-flex">
                      <Switch
                        aria-label={`${m.name} payments`}
                        checked={m.active}
                        onChange={(on) => {
                          setMethods((list) => list.map((x) => (x.id === m.id ? { ...x, active: on } : x)))
                          toast.success(`${m.name} ${on ? 'turned on' : 'turned off'} at the register`)
                        }}
                      />
                    </span>
                  </TD>
                </TR>
              ))}
            </tbody>
          </Table>
        </Card>
      </SettingsSection>

      <SettingsSection title="Register rules">
        <SettingsRow label="Cash rounding" description="Round cash totals so you don’t need small coins.">
          <Select
            value={v.rounding}
            onChange={(r) => form.set('rounding', r)}
            options={[
              { value: 'none', label: 'Don’t round' },
              { value: '0.1', label: 'To 0.10 TJS' },
              { value: '0.5', label: 'To 0.50 TJS' },
              { value: '1', label: 'To 1 TJS' },
            ]}
          />
        </SettingsRow>
        <SettingsRow label="Sell items that aren’t in stock" description="Stock goes below zero and shows up in Inventory for a recount.">
          <Switch aria-label="Sell items that aren’t in stock" checked={v.allowNegative} onChange={(x) => form.set('allowNegative', x)} />
        </SettingsRow>
        <SettingsRow label="Sell only during an open shift" description="Keeps cash in the drawer matching the shift report.">
          <Switch aria-label="Sell only during an open shift" checked={v.shiftOnly} onChange={(x) => form.set('shiftOnly', x)} />
        </SettingsRow>
        <SettingsRow label="Suggested tip" description="Pre-selected when a client adds a tip.">
          <Select
            value={v.tip}
            onChange={(t) => form.set('tip', t)}
            options={[
              { value: '0', label: 'No suggestion' },
              { value: '5', label: '5%' },
              { value: '10', label: '10%' },
              { value: '15', label: '15%' },
            ]}
          />
        </SettingsRow>
        <SettingsRow label="Receipt footer" description="Printed and sent at the bottom of every receipt.">
          <Textarea value={v.footer} maxLength={160} onChange={(e) => form.set("footer", e.target.value)} rows={3} />
          <p className="mt-1.5 text-xs text-faint tabular">{v.footer.length} / 160</p>
        </SettingsRow>
      </SettingsSection>

      <SaveBar dirty={form.dirty} onSave={form.save} onDiscard={form.discard} />

      <MethodModal
        method={editing}
        onClose={() => setEditing(null)}
        onSave={(m) => {
          setMethods((list) => (list.some((x) => x.id === m.id) ? list.map((x) => (x.id === m.id ? m : x)) : [...list, m]))
          toast.success(editing === 'new' ? `${m.name} added` : `${m.name} saved`)
          setEditing(null)
        }}
      />
    </SettingsPage>
  )
}
