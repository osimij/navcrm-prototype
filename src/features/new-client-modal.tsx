import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/controls'
import { Modal } from '@/components/ui/dialog'
import { Field, Input, PhoneInput } from '@/components/ui/input'
import { Segmented } from '@/components/ui/tabs'
import type { Client } from '@/data/clients'
import { useOverlays } from '@/lib/overlays'
import { useData } from '@/lib/store'
import { TODAY } from '@/lib/time'

export function NewClientModal() {
  const state = useOverlays((s) => s.newClient)
  const close = useOverlays((s) => s.close)
  const openClient = useOverlays((s) => s.openClient)
  const clients = useData((s) => s.clients)
  const addClient = useData((s) => s.addClient)

  const [phone, setPhone] = useState('')
  const [first, setFirst] = useState('')
  const [last, setLast] = useState('')
  const [gender, setGender] = useState<'none' | 'female' | 'male'>('none')
  const [birthday, setBirthday] = useState('')
  const [consentData, setConsentData] = useState(true)
  const [consentMarketing, setConsentMarketing] = useState(false)
  const [touched, setTouched] = useState(false)

  useEffect(() => {
    if (!state) return
    const [f = '', ...rest] = (state.name ?? '').trim().split(/\s+/)
    setFirst(f)
    setLast(rest.join(' '))
    setPhone(state.phone?.slice(-9) ?? '')
    setGender('none')
    setBirthday('')
    setConsentData(true)
    setConsentMarketing(false)
    setTouched(false)
  }, [state])

  const duplicate = phone.length === 9 ? clients.find((c) => c.phone.endsWith(phone)) : undefined
  const valid = phone.length === 9 && first.trim().length > 0 && !duplicate

  function submit() {
    setTouched(true)
    if (!valid) return
    const id = `c${Date.now()}`
    const client: Client = {
      id,
      firstName: first.trim(),
      lastName: last.trim(),
      name: `${first.trim()} ${last.trim()}`.trim(),
      phone: `+992${phone}`,
      gender: gender === 'male' ? 'male' : 'female',
      birthday: null,
      category: 'new',
      visits: 0,
      totalSpent: 0,
      lastVisit: null,
      bonuses: 0,
      debt: 0,
      tags: [],
      source: 'Walk-in',
      consentMarketing,
      favoriteStaffId: 's1',
      createdAt: TODAY,
      archived: false,
    }
    addClient(client)
    state?.onCreated?.(id)
    close('newClient')
    toast.success(`${client.name} added to clients`)
  }

  return (
    <Modal
      open={!!state}
      onOpenChange={(o) => !o && close('newClient')}
      title="New client"
      size="md"
      footer={
        <>
          <Button variant="ghost" onClick={() => close('newClient')}>
            Cancel
          </Button>
          <Button variant="primary" onClick={submit} disabled={touched && !valid}>
            Create client
          </Button>
        </>
      }
    >
      <form
        className="flex flex-col gap-4"
        onSubmit={(e) => {
          e.preventDefault()
          submit()
        }}
      >
        <Field
          label="Phone"
          error={
            duplicate ? (
              <>
                Already a client: {duplicate.name}.{' '}
                <button
                  type="button"
                  className="font-medium underline underline-offset-2"
                  onClick={() => {
                    close('newClient')
                    openClient(duplicate.id)
                  }}
                >
                  Open profile
                </button>
              </>
            ) : touched && phone.length < 9 ? (
              'Enter all 9 digits'
            ) : undefined
          }
          hint="Used for reminders in Telegram, then SMS."
        >
          <PhoneInput value={phone} onChange={setPhone} autoFocus invalid={!!duplicate || (touched && phone.length < 9)} />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="First name" error={touched && !first.trim() ? 'Required' : undefined}>
            <Input value={first} onChange={(e) => setFirst(e.target.value)} aria-invalid={touched && !first.trim()} />
          </Field>
          <Field label="Last name" optional>
            <Input value={last} onChange={(e) => setLast(e.target.value)} />
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Gender" optional>
            <Segmented
              value={gender}
              onChange={setGender}
              items={[
                { value: 'none', label: 'Not set' },
                { value: 'female', label: 'Female' },
                { value: 'male', label: 'Male' },
              ]}
              fill
            />
          </Field>
          <Field label="Birthday" optional hint="For birthday greetings and bonuses">
            <Input value={birthday} onChange={(e) => setBirthday(e.target.value)} placeholder="DD.MM.YYYY" inputMode="numeric" />
          </Field>
        </div>
        <div className="flex flex-col gap-2.5 rounded-xl bg-fill p-3.5">
          <Checkbox checked={consentData} onChange={setConsentData} label="Agrees to processing of personal data" />
          <Checkbox checked={consentMarketing} onChange={setConsentMarketing} label="Agrees to receive offers and promotions" />
        </div>
        <button type="submit" hidden />
      </form>
    </Modal>
  )
}
