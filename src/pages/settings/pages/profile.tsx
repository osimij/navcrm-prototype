import { useState } from 'react'
import { toast } from 'sonner'
import { Avatar } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/controls'
import { Modal } from '@/components/ui/dialog'
import { Field, Input } from '@/components/ui/input'
import { Page } from '@/components/ui/page'
import { Select } from '@/components/ui/select'
import { business, currentUser } from '@/data/business'
import { formatPhone } from '@/lib/format'
import { EditLink, SettingsRow, SettingsSection } from '../ui'
import { useLanguage, setLanguage, type Language } from '@/i18n/language'

type Dialog = 'name' | 'password' | 'pin' | 'phone' | 'delete' | null

export default function ProfileSettings() {
  const [first, setFirst] = useState(currentUser.firstName)
  const [last, setLast] = useState('Karimova')
  const lang = useLanguage()
  const [twoStep, setTwoStep] = useState(true)
  const [telegram, setTelegram] = useState(true)
  const [pinSet, setPinSet] = useState(false)
  const [dialog, setDialog] = useState<Dialog>(null)
  const [draftFirst, setDraftFirst] = useState(first)
  const [draftLast, setDraftLast] = useState(last)
  const [pw, setPw] = useState({ current: '', next: '' })
  const [pin, setPin] = useState('')
  const name = `${first} ${last}`.trim()
  const close = () => setDialog(null)

  return (
    <Page width="narrow">
      <header className="mb-6 flex items-center gap-4 border-b border-border pb-6">
        <Avatar name={name} color="slate" size="xl" />
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-3xl font-normal text-fg">{name}</h1>
            <Badge>{currentUser.role}</Badge>
          </div>
          <p className="mt-1 text-base text-muted">{business.name}, both branches</p>
        </div>
      </header>

      <SettingsSection>
        <SettingsRow label="Profile picture" description="Shown to your team in the calendar and chats.">
          <Avatar name={name} color="slate" size="lg" />
          <div>
            <EditLink onClick={() => toast('Choose a photo from your device')}>Upload photo</EditLink>
          </div>
        </SettingsRow>
        <SettingsRow label="Name">
          {name}
          <div>
            <EditLink
              onClick={() => {
                setDraftFirst(first)
                setDraftLast(last)
                setDialog('name')
              }}
            />
          </div>
        </SettingsRow>
        <SettingsRow label="Interface language" description="Only for you. Clients get messages in their own language.">
          <Select
            value={lang}
            onChange={(l: Language) => setLanguage(l)}
            className="max-w-56"
            options={[
              { value: 'ru', label: 'Русский' },
              { value: 'en', label: 'English' },
            ]}
          />
        </SettingsRow>
      </SettingsSection>

      <SettingsSection title="Signing in">
        <SettingsRow label="Phone number" description="This is your login.">
          <span className="tabular">{formatPhone(currentUser.phone.replace(/\s/g, ''))}</span>
          <div>
            <EditLink onClick={() => setDialog('phone')}>Change</EditLink>
          </div>
        </SettingsRow>
        <SettingsRow label="Password">
          <span className="text-muted">Changed 3 months ago</span>
          <div>
            <EditLink onClick={() => (setPw({ current: '', next: '' }), setDialog('password'))}>Change</EditLink>
          </div>
        </SettingsRow>
        <SettingsRow label="Two-step sign-in" description="After the password, we send a code to your Telegram when you sign in on a new device.">
          <Switch
            checked={twoStep}
            onChange={(on) => {
              setTwoStep(on)
              toast(on ? 'Two-step sign-in is on' : 'Two-step sign-in is off', { description: on ? undefined : 'Anyone with your password can now sign in.' })
            }}
          />
        </SettingsRow>
        <SettingsRow label="Device PIN" description="Unlock NavCRM on a shared front-desk tablet without typing your password.">
          <span className="text-muted">{pinSet ? 'Set · 4 digits' : 'Not set'}</span>
          <div>
            <EditLink onClick={() => (setPin(''), setDialog('pin'))}>{pinSet ? 'Change PIN' : 'Set PIN'}</EditLink>
          </div>
        </SettingsRow>
        <SettingsRow label="Telegram" description="For sign-in codes and business alerts.">
          {telegram ? (
            <>
              @zarina_k
              <div>
                <EditLink onClick={() => (setTelegram(false), toast('Telegram unlinked'))}>Unlink</EditLink>
              </div>
            </>
          ) : (
            <Button size="sm" onClick={() => (setTelegram(true), toast.success('Telegram linked as @zarina_k'))}>
              Link Telegram
            </Button>
          )}
        </SettingsRow>
      </SettingsSection>

      <SettingsSection>
        <SettingsRow label="Delete my account" description="Removes your login. The business stays with its other owners; if you’re the only owner, transfer it first.">
          <Button variant="danger" size="sm" onClick={() => setDialog('delete')}>
            Delete account
          </Button>
        </SettingsRow>
      </SettingsSection>

      <Modal
        open={dialog === 'name'}
        onOpenChange={(o) => !o && close()}
        title="Your name"
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={close}>
              Cancel
            </Button>
            <Button
              variant="primary"
              disabled={!draftFirst.trim()}
              onClick={() => {
                setFirst(draftFirst.trim())
                setLast(draftLast.trim())
                close()
                toast.success('Name updated')
              }}
            >
              Save
            </Button>
          </>
        }
      >
        <div className="grid grid-cols-2 gap-3">
          <Field label="First name">
            <Input value={draftFirst} onChange={(e) => setDraftFirst(e.target.value)} autoFocus />
          </Field>
          <Field label="Last name">
            <Input value={draftLast} onChange={(e) => setDraftLast(e.target.value)} />
          </Field>
        </div>
      </Modal>

      <Modal
        open={dialog === 'password'}
        onOpenChange={(o) => !o && close()}
        title="Change password"
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={close}>
              Cancel
            </Button>
            <Button
              variant="primary"
              disabled={!pw.current || pw.next.length < 8}
              onClick={() => {
                close()
                toast.success('Password changed', { description: 'Other devices stay signed in.' })
              }}
            >
              Change password
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          <Field label="Current password">
            <Input type="password" value={pw.current} onChange={(e) => setPw({ ...pw, current: e.target.value })} autoFocus autoComplete="current-password" />
          </Field>
          <Field label="New password" hint="At least 8 characters">
            <Input type="password" value={pw.next} onChange={(e) => setPw({ ...pw, next: e.target.value })} autoComplete="new-password" />
          </Field>
        </div>
      </Modal>

      <Modal
        open={dialog === 'pin'}
        onOpenChange={(o) => !o && close()}
        title={pinSet ? 'Change device PIN' : 'Set a device PIN'}
        description="Works only on devices where you’ve signed in with your password."
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={close}>
              Cancel
            </Button>
            <Button
              variant="primary"
              disabled={pin.length !== 4}
              onClick={() => {
                setPinSet(true)
                close()
                toast.success('PIN saved')
              }}
            >
              Save PIN
            </Button>
          </>
        }
      >
        <Field label="4-digit PIN">
          <Input
            type="password"
            inputMode="numeric"
            value={pin}
            onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
            autoFocus
            className="max-w-40 text-center tabular"
          />
        </Field>
      </Modal>

      <Modal
        open={dialog === 'phone'}
        onOpenChange={(o) => !o && close()}
        title="Change phone number"
        size="sm"
        footer={
          <Button variant="primary" onClick={close}>
            Got it
          </Button>
        }
      >
        <p className="text-base text-muted">
          We’ll confirm the new number with a code in Telegram or by SMS, then ask for a code sent to your current number. Your team sees the change in the
          Activity log.
        </p>
      </Modal>

      <Modal
        open={dialog === 'delete'}
        onOpenChange={(o) => !o && close()}
        title="Delete your account?"
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={close}>
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={() => {
                close()
                toast('You’re the only owner of Sitora Beauty', { description: 'Transfer ownership in Staff before deleting your account.' })
              }}
            >
              Delete account
            </Button>
          </>
        }
      >
        <p className="text-base text-muted">You’ll be signed out everywhere. Visits, clients and receipts stay with the business.</p>
      </Modal>
    </Page>
  )
}
