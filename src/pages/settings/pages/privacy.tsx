import { I, Icon } from '@/components/icons'
import { Select } from '@/components/ui/select'
import { useSettingsForm } from '../parts-b/shared'
import { SaveBar, SettingsPage, SettingsRow, SettingsSection } from '../ui'

const opt = (values: [string, string][]) => values.map(([value, label]) => ({ value, label }))

const ROWS = [
  { key: 'messages', label: 'Chats with clients', description: 'Telegram, WhatsApp, Instagram and booking page chats.', options: opt([['1y', '1 year'], ['2y', '2 years'], ['3y', '3 years'], ['keep', 'Keep']]) },
  { key: 'audit', label: 'Activity log', description: 'Who changed what. At least 1 year so disputes can be checked.', options: opt([['1y', '1 year'], ['3y', '3 years'], ['5y', '5 years']]) },
  { key: 'webhooks', label: 'Webhook log', description: 'Requests sent to your website or tools.', options: opt([['30d', '30 days'], ['90d', '90 days']]) },
  { key: 'consents', label: 'Signed consents', description: 'Kept after the client leaves, in case you need to prove consent.', options: opt([['3y', '3 years after the last visit'], ['5y', '5 years after the last visit']]) },
  { key: 'medical', label: 'Medical records', description: 'Cosmetology procedures, anamnesis, photos.', options: opt([['5y', '5 years after the last visit'], ['10y', '10 years after the last visit'], ['keep', 'Keep']]) },
  { key: 'lab', label: 'Lab results', description: 'Results and their PDFs.', options: opt([['5y', '5 years'], ['10y', '10 years'], ['keep', 'Keep']]) },
] as const

type Key = (typeof ROWS)[number]['key']

const FIXED = [
  'A deleted client is anonymized after 30 days: name and phone are removed, receipts stay for your accounts.',
  'Clients can ask to see or delete their data. You get a task, and it’s done within 30 days.',
  'Backups are kept for 35 days and then erased.',
  'Exports and support access are always recorded in the Activity log.',
]

export default function PrivacySettings() {
  const form = useSettingsForm<Record<Key, string>>({ messages: '2y', audit: '3y', webhooks: '30d', consents: '5y', medical: '10y', lab: '10y' })

  return (
    <SettingsPage title="Data retention" description="How long NavCRM keeps each kind of record before deleting it for good.">
      <SettingsSection title="You decide">
        {ROWS.map((r) => (
          <SettingsRow key={r.key} label={r.label} description={r.description}>
            <Select value={form.value[r.key]} onChange={(v) => form.set(r.key, v)} options={[...r.options]} />
          </SettingsRow>
        ))}
      </SettingsSection>
      <SettingsSection title="Always" description="These rules are the same for every business on NavCRM.">
        <ul className="mt-2">
          {FIXED.map((t) => (
            <li key={t} className="flex gap-3 border-b border-border py-3.5 text-base text-fg last:border-b-0">
              <Icon icon={I.lock} size={16} className="mt-0.5 text-faint" />
              {t}
            </li>
          ))}
        </ul>
      </SettingsSection>
      <SaveBar dirty={form.dirty} onSave={form.save} onDiscard={form.discard} />
    </SettingsPage>
  )
}
