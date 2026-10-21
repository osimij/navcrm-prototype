import { useState } from 'react'
import { toast } from 'sonner'
import { I, Icon } from '@/components/icons'
import { Button } from '@/components/ui/button'
import { Modal } from '@/components/ui/dialog'
import { Segmented, Tabs } from '@/components/ui/tabs'
import { CopyField, Steps } from '../parts-b/shared'
import { SettingsPage, SettingsRow, SettingsSection } from '../ui'

function token() {
  return Math.random().toString(36).slice(2, 10) + Math.random().toString(36).slice(2, 10)
}

const GUIDES: Record<'google' | 'iphone' | 'outlook', string[]> = {
  google: [
    'Copy your calendar link above.',
    'Open Google Calendar on a computer, then Other calendars → + → From URL.',
    'Paste the link and click Add calendar. New visits appear within a few hours.',
  ],
  iphone: [
    'Copy your calendar link above.',
    'Open Settings → Calendar → Accounts → Add Account → Other → Add Subscribed Calendar.',
    'Paste the link, tap Next, then Save.',
  ],
  outlook: [
    'Copy your calendar link above.',
    'In Outlook on the web, open Calendar → Add calendar → Subscribe from web.',
    'Paste the link, name it “NavCRM” and click Import.',
  ],
}

export default function CalendarSyncSettings() {
  const [secret, setSecret] = useState('zk8f3a91c2d7e4b6')
  const [scope, setScope] = useState<'mine' | 'all'>('all')
  const [app, setApp] = useState<'google' | 'iphone' | 'outlook'>('google')
  const [confirm, setConfirm] = useState(false)
  const url = `webcal://navcrm.tj/ical/${secret}.ics${scope === 'mine' ? '?only=me' : ''}`

  return (
    <SettingsPage title="Calendar sync" description="See your NavCRM schedule in Google Calendar, on your iPhone or in Outlook.">
      <SettingsSection>
        <SettingsRow label="Your calendar link" description="Private to you. Calendar apps check it every few hours.">
          <CopyField value={url} />
          <p className="mt-2 flex items-start gap-1.5 text-sm text-muted">
            <Icon icon={I.lock} size={14} className="mt-0.5 shrink-0" />
            Anyone with this link can see the visits in it. If it leaks, reset it.
          </p>
        </SettingsRow>
        <SettingsRow label="Include">
          <Segmented
            value={scope}
            onChange={setScope}
            items={[
              { value: 'all', label: 'All visits I can see' },
              { value: 'mine', label: 'Only my visits' },
            ]}
          />
        </SettingsRow>
        <SettingsRow label="Reset link" description="The old link stops working everywhere it was added.">
          <Button size="sm" variant="secondary" icon={I.refresh} onClick={() => setConfirm(true)}>
            Reset link
          </Button>
        </SettingsRow>
      </SettingsSection>

      <SettingsSection title="How to add it">
        <Tabs
          value={app}
          onChange={setApp}
          className="mb-5"
          items={[
            { value: 'google', label: 'Google Calendar' },
            { value: 'iphone', label: 'iPhone' },
            { value: 'outlook', label: 'Outlook' },
          ]}
        />
        <Steps items={GUIDES[app]} />
        <p className="mt-5 text-sm text-muted">This is one-way: changes made in those apps don’t come back to NavCRM. For two-way sync, connect Google Calendar in Integrations.</p>
      </SettingsSection>

      <Modal
        open={confirm}
        onOpenChange={setConfirm}
        title="Reset your calendar link?"
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setConfirm(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={() => {
                setSecret(token())
                setConfirm(false)
                toast.success('New link created', { description: 'Add it to your calendar apps again.' })
              }}
            >
              Reset link
            </Button>
          </>
        }
      >
        <p className="text-base text-muted">Calendars using the old link stop updating until you add the new one.</p>
      </Modal>
    </SettingsPage>
  )
}
