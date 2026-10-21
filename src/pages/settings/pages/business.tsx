import { useState } from 'react'
import { toast } from 'sonner'
import { I, Icon } from '@/components/icons'
import { Button } from '@/components/ui/button'
import { Chip } from '@/components/ui/controls'
import { Select } from '@/components/ui/select'
import { business } from '@/data/business'
import { formatDate, formatTime } from '@/lib/format'
import { NOW, addDays } from '@/lib/time'
import { HexSwatches, InlineText, UploadTile, useDraft } from '../parts-a/common'
import { SaveBar, SettingsPage, SettingsRow, SettingsSection } from '../ui'

const SPHERES = [
  'Beauty salon',
  'Cosmetology & clinic',
  'Dentistry',
  'Laboratory',
  'Dress rental',
  'Auto service',
  'Fitness & sport',
  'Education',
  'Repair',
  'Cleaning',
]

const CITIES = ['Dushanbe', 'Khujand', 'Bokhtar', 'Kulob', 'Istaravshan', 'Hisor', 'Vahdat']
const PRIMARY = ['#0B0B10', '#0011FF', '#0F9F95', '#9457E0', '#E2457A', '#B25E09']
const ACCENT = ['#F4F4F6', '#EEF0FF', '#E6F6F3', '#F4EDFC', '#FDECF2', '#FDF3E5']

export default function BusinessSettings() {
  const [info, setInfo] = useState({
    name: business.name,
    publicName: 'Sitora Beauty & Clinic',
    legalName: business.legalName,
    tin: business.tin,
    phone: business.phone,
    email: business.email,
  })
  const form = useDraft({
    spheres: ['Beauty salon', 'Cosmetology & clinic', 'Laboratory'],
    city: business.city,
    primary: '#0B0B10',
    accent: '#F4F4F6',
    language: 'tg',
    nameOrder: 'first',
  })
  const { draft, patch } = form
  const [support, setSupport] = useState<{ until: Date } | null>(null)
  const [supportDays, setSupportDays] = useState('3')

  const set = (k: keyof typeof info) => (v: string) => setInfo((i) => ({ ...i, [k]: v }))

  function toggleSphere(s: string) {
    if (draft.spheres.includes(s)) {
      if (draft.spheres.length === 1) return toast('Keep at least one sphere')
      patch({ spheres: draft.spheres.filter((x) => x !== s) })
    } else {
      if (draft.spheres.length >= 4) return toast('Up to 4 spheres', { description: 'Remove one to add another.' })
      patch({ spheres: [...draft.spheres, s] })
    }
  }

  return (
    <SettingsPage title="Business profile" description="How your business appears to clients, on receipts and in reminders.">
      <SettingsSection title="Details">
        <SettingsRow label="Business name" description="Used inside NavCRM and on receipts.">
          <InlineText value={info.name} onSave={set('name')} />
        </SettingsRow>
        <SettingsRow label="Name shown to clients" description="On your booking page, in the catalog and in reminders.">
          <InlineText value={info.publicName} onSave={set('publicName')} />
        </SettingsRow>
        <SettingsRow label="Legal name">
          <InlineText value={info.legalName} onSave={set('legalName')} />
        </SettingsRow>
        <SettingsRow label="TIN" description="Taxpayer number for fiscal receipts and invoices.">
          <InlineText value={info.tin} onSave={set('tin')} inputMode="numeric" />
        </SettingsRow>
        <SettingsRow label="Phone">
          <InlineText value={info.phone} onSave={set('phone')} inputMode="tel" />
        </SettingsRow>
        <SettingsRow label="Email" description="Invoices from NavCRM go here.">
          <InlineText value={info.email} onSave={set('email')} inputMode="email" />
        </SettingsRow>
        <SettingsRow label="City">
          <Select value={draft.city} onChange={(city) => patch({ city })} options={CITIES.map((c) => ({ value: c, label: c }))} className="max-w-60" />
        </SettingsRow>
      </SettingsSection>

      <SettingsSection
        title="What you do"
        description="Pick up to 4. Spheres change the words NavCRM uses, the client fields you get and which sections appear in the sidebar."
      >
        <div className="flex flex-wrap gap-2 pt-4">
          {SPHERES.map((s) => (
            <Chip key={s} active={draft.spheres.includes(s)} onClick={() => toggleSphere(s)}>
              {s}
            </Chip>
          ))}
        </div>
        <p className="mt-3 text-sm text-muted">
          {draft.spheres.includes('Laboratory') ? 'Laboratory adds the Laboratory section with orders, tests and result templates.' : 'Add Laboratory to get lab orders and result templates.'}
        </p>
      </SettingsSection>

      <SettingsSection title="Brand" description="Your logo and colors on the booking page, receipts and Telegram messages.">
        <SettingsRow label="Logo" description="Square PNG or SVG, at least 256 px.">
          <UploadTile title="Replace logo" hint="Current: Sitora mark">
            <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-fg text-base font-semibold text-bg">S</span>
          </UploadTile>
        </SettingsRow>
        <SettingsRow label="Main color" description="Buttons and links on your booking page.">
          <HexSwatches value={draft.primary} onChange={(primary) => patch({ primary })} colors={PRIMARY} />
        </SettingsRow>
        <SettingsRow label="Background color" description="Behind your logo and page header.">
          <HexSwatches value={draft.accent} onChange={(accent) => patch({ accent })} colors={ACCENT} />
          <div className="mt-4 flex items-center gap-3 rounded-xl p-3" style={{ background: draft.accent }}>
            <span className="grid size-8 place-items-center rounded-lg text-sm font-semibold text-white" style={{ background: draft.primary }}>
              S
            </span>
            <span className="flex-1 text-sm font-medium text-[#0b0b10]">{info.publicName}</span>
            <span className="rounded-full px-3 py-1.5 text-xs font-medium text-white" style={{ background: draft.primary }}>
              Book a visit
            </span>
          </div>
          <p className="mt-1.5 text-xs text-faint">Preview of your booking page header</p>
        </SettingsRow>
      </SettingsSection>

      <SettingsSection title="Language and region">
        <SettingsRow label="Language for clients" description="Reminders and the booking page start in this language. Clients can switch.">
          <Select
            value={draft.language}
            onChange={(language) => patch({ language })}
            options={[
              { value: 'tg', label: 'Тоҷикӣ' },
              { value: 'ru', label: 'Русский' },
              { value: 'en', label: 'English' },
            ]}
            className="max-w-60"
          />
        </SettingsRow>
        <SettingsRow label="Time zone">
          <div>Asia/Dushanbe (UTC+5)</div>
          <div className="mt-0.5 text-sm text-muted">Tajikistan has no daylight saving time.</div>
        </SettingsRow>
        <SettingsRow label="Name order" description="How client and staff names are written everywhere.">
          <Select
            value={draft.nameOrder}
            onChange={(nameOrder) => patch({ nameOrder })}
            options={[
              { value: 'first', label: 'First name, last name', hint: 'Nilufar Davlatova' },
              { value: 'last', label: 'Last name, first name', hint: 'Davlatova Nilufar' },
            ]}
            className="max-w-60"
          />
        </SettingsRow>
      </SettingsSection>

      <SettingsSection title="Support access">
        <SettingsRow
          label="Let NavCRM support see your account"
          description="Only when you ask for help. Access ends on its own, and every action support takes is in the activity log."
        >
          {support ? (
            <div>
              <div className="flex items-center gap-2">
                <span className="size-2 rounded-full bg-positive" />
                On until {formatDate(support.until, { weekday: true })}, {formatTime(support.until)}
              </div>
              <Button
                size="sm"
                variant="secondary"
                className="mt-3"
                onClick={() => {
                  setSupport(null)
                  toast.success('Support access revoked')
                }}
              >
                Revoke now
              </Button>
            </div>
          ) : (
            <div>
              <div className="flex items-center gap-2 text-muted">
                <Icon icon={I.lock} size={16} />
                Off
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <Select
                  value={supportDays}
                  onChange={setSupportDays}
                  look="pill"
                  options={[
                    { value: '1', label: 'For 1 day' },
                    { value: '3', label: 'For 3 days' },
                    { value: '7', label: 'For 7 days' },
                  ]}
                />
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => {
                    const until = addDays(NOW, Number(supportDays))
                    setSupport({ until })
                    toast.success('Support can see your account', { description: `Until ${formatDate(until)}. You can revoke it anytime.` })
                  }}
                >
                  Grant access
                </Button>
              </div>
            </div>
          )}
        </SettingsRow>
      </SettingsSection>

      <SaveBar dirty={form.dirty} onSave={() => form.save('Business profile saved')} onDiscard={form.discard} />
    </SettingsPage>
  )
}
