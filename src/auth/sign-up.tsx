import type { IconSvgElement } from '@hugeicons/react'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { toast } from 'sonner'
import { I, Icon } from '@/components/icons'
import { Button, IconButton } from '@/components/ui/button'
import { ChoiceCard } from '@/components/ui/controls'
import { Field, Input, PhoneInput } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { usePrefs } from '@/lib/store'
import { AuthFrame, CodeInput, ResendCode, Step, TelegramNote } from './auth-ui'

const SPHERES: { id: string; title: string; description: string; icon: IconSvgElement }[] = [
  { id: 'beauty', title: 'Beauty salon', description: 'Hair, nails, brows, barbers', icon: I.scissors },
  { id: 'medical', title: 'Cosmetology & clinic', description: 'Procedures, medical records', icon: I.stethoscope },
  { id: 'dental', title: 'Dentistry', description: 'Treatment plans, X-rays', icon: I.tooth },
  { id: 'lab', title: 'Laboratory', description: 'Tests, results, partner labs', icon: I.testTube },
  { id: 'rental', title: 'Dress rental', description: 'Fittings, pickup and return', icon: I.dress },
  { id: 'auto', title: 'Auto service', description: 'Cars, work orders, bays', icon: I.car },
  { id: 'fitness', title: 'Fitness & sport', description: 'Classes, memberships', icon: I.dumbbell },
  { id: 'education', title: 'Education', description: 'Groups, lessons, homework', icon: I.book },
  { id: 'repair', title: 'Repair', description: 'Devices, repair tickets', icon: I.wrench },
  { id: 'cleaning', title: 'Cleaning', description: 'On-site visits, crews', icon: I.clean },
]

const CITIES = ['Dushanbe', 'Khujand', 'Bokhtar', 'Kulob', 'Istaravshan', 'Hisor', 'Vahdat', 'Other']

const STEPS = ['phone', 'code', 'you', 'business', 'spheres', 'team', 'done'] as const
type StepId = (typeof STEPS)[number]

function Heading({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mb-7">
      <h1 className="text-3xl font-normal text-fg">{title}</h1>
      {subtitle && <p className="mt-2 text-md text-muted">{subtitle}</p>}
    </div>
  )
}

export function SignUp() {
  const navigate = useNavigate()
  const startOnboarding = usePrefs((s) => s.startOnboarding)
  const [step, setStep] = useState<StepId>('phone')
  const [phone, setPhone] = useState('')
  const [first, setFirst] = useState('')
  const [last, setLast] = useState('')
  const [password, setPassword] = useState('')
  const [bizName, setBizName] = useState('')
  const [city, setCity] = useState('Dushanbe')
  const [spheres, setSpheres] = useState<string[]>([])
  const [invites, setInvites] = useState<{ phone: string; role: string }[]>([{ phone: '', role: 'master' }])
  const [touched, setTouched] = useState(false)
  const [codeError, setCodeError] = useState(false)

  const idx = STEPS.indexOf(step)
  const go = (s: StepId) => {
    setTouched(false)
    setStep(s)
  }
  const back = () => idx > 0 && go(STEPS[idx - 1 === 1 ? 0 : idx - 1])

  const toggleSphere = (id: string) =>
    setSpheres((s) => (s.includes(id) ? s.filter((x) => x !== id) : s.length < 4 ? [...s, id] : s))

  return (
    <AuthFrame
      progress={step === 'done' ? 1 : (idx + 1) / STEPS.length}
      aside={
        step === 'phone' ? (
          <>
            Have an account?{' '}
            <Link to="/signin" className="font-medium text-fg hover:underline underline-offset-4">
              Sign in
            </Link>
          </>
        ) : null
      }
    >
      {step !== 'phone' && step !== 'done' && (
        <div className="fixed top-20 left-4 sm:left-8">
          <IconButton icon={I.chevronLeft} label="Back" onClick={back} />
        </div>
      )}

      {step === 'phone' && (
        <Step stepKey="phone">
          <Heading title="Create your account" subtitle="Start with your mobile number. It’s also how your team and clients will reach you." />
          <form
            className="flex flex-col gap-5"
            onSubmit={(e) => {
              e.preventDefault()
              setTouched(true)
              if (phone.length === 9) go('code')
            }}
          >
            <Field label="Phone number" error={touched && phone.length < 9 ? 'Enter all 9 digits' : undefined}>
              <PhoneInput value={phone} onChange={setPhone} size="lg" autoFocus invalid={touched && phone.length < 9} />
            </Field>
            <Button type="submit" variant="primary" size="lg" className="self-start px-7" iconRight={I.chevronRight}>
              Continue
            </Button>
            <p className="text-sm text-faint">
              By continuing you agree to the NavCRM <span className="underline underline-offset-2">Terms</span> and{' '}
              <span className="underline underline-offset-2">Privacy policy</span>. Free for your first 50 visits.
            </p>
          </form>
        </Step>
      )}

      {step === 'code' && (
        <Step stepKey="code">
          <Heading title="Verify your number" />
          <TelegramNote phone={phone} />
          <CodeInput
            error={codeError}
            onComplete={(c) => {
              if (c === '000000') return setCodeError(true)
              setCodeError(false)
              go('you')
            }}
          />
          {codeError && <p className="mt-2 text-sm text-negative">That code doesn’t match. Check Telegram and try again.</p>}
          <div className="mt-5">
            <ResendCode onResend={() => toast('Code sent by SMS')} />
          </div>
        </Step>
      )}

      {step === 'you' && (
        <Step stepKey="you">
          <Heading title="What’s your name?" subtitle="Your team sees this in the calendar and chats." />
          <form
            className="flex flex-col gap-4"
            onSubmit={(e) => {
              e.preventDefault()
              setTouched(true)
              if (first.trim() && password.length >= 8) go('business')
            }}
          >
            <div className="grid grid-cols-2 gap-3">
              <Field label="First name" error={touched && !first.trim() ? 'Required' : undefined}>
                <Input value={first} onChange={(e) => setFirst(e.target.value)} size="lg" autoFocus />
              </Field>
              <Field label="Last name" optional>
                <Input value={last} onChange={(e) => setLast(e.target.value)} size="lg" />
              </Field>
            </div>
            <Field label="Password" hint="At least 8 characters" error={touched && password.length < 8 ? 'At least 8 characters' : undefined}>
              <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} size="lg" autoComplete="new-password" />
            </Field>
            <Button type="submit" variant="primary" size="lg" className="mt-2 self-start px-7" iconRight={I.chevronRight}>
              Continue
            </Button>
          </form>
        </Step>
      )}

      {step === 'business' && (
        <Step stepKey="business">
          <Heading title="Tell us about your business" subtitle="Clients see this name on your booking page and in reminders." />
          <form
            className="flex flex-col gap-4"
            onSubmit={(e) => {
              e.preventDefault()
              setTouched(true)
              if (bizName.trim()) go('spheres')
            }}
          >
            <Field label="Business name" error={touched && !bizName.trim() ? 'Required' : undefined}>
              <Input value={bizName} onChange={(e) => setBizName(e.target.value)} size="lg" autoFocus placeholder="e.g. Sitora Beauty" />
            </Field>
            <Field label="City">
              <Select value={city} onChange={setCity} options={CITIES.map((c) => ({ value: c, label: c }))} className="h-11 text-md" />
            </Field>
            <Button type="submit" variant="primary" size="lg" className="mt-2 self-start px-7" iconRight={I.chevronRight}>
              Continue
            </Button>
          </form>
        </Step>
      )}

      {step === 'spheres' && (
        <div className="w-full max-w-[640px] animate-[step-in_300ms_var(--ease-out)_both]">
          <Heading title="What does your business do?" subtitle="Pick up to 4. NavCRM adapts its terms, client fields and sections to match." />
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
            {SPHERES.map((s) => (
              <ChoiceCard
                key={s.id}
                selected={spheres.includes(s.id)}
                disabled={spheres.length >= 4 && !spheres.includes(s.id)}
                onClick={() => toggleSphere(s.id)}
                icon={s.icon}
                title={s.title}
                description={s.description}
              />
            ))}
          </div>
          <div className="mt-7 flex items-center gap-4">
            <Button variant="primary" size="lg" className="px-7" disabled={!spheres.length} iconRight={I.chevronRight} onClick={() => go('team')}>
              Continue
            </Button>
            <span className="text-sm text-muted tabular">{spheres.length} of 4 selected</span>
          </div>
        </div>
      )}

      {step === 'team' && (
        <Step stepKey="team">
          <Heading title="Invite your team" subtitle="They’ll get a Telegram message with a link to join. Their phone number is their login." />
          <div className="flex flex-col gap-2.5">
            {invites.map((inv, i) => (
              <div key={i} className="grid grid-cols-[1fr_150px] gap-2">
                <PhoneInput
                  value={inv.phone}
                  onChange={(p) => setInvites((list) => list.map((x, j) => (j === i ? { ...x, phone: p } : x)))}
                  autoFocus={i === invites.length - 1}
                />
                <Select
                  value={inv.role}
                  onChange={(r) => setInvites((list) => list.map((x, j) => (j === i ? { ...x, role: r } : x)))}
                  options={[
                    { value: 'master', label: 'Master' },
                    { value: 'admin', label: 'Administrator' },
                    { value: 'manager', label: 'Manager' },
                  ]}
                />
              </div>
            ))}
          </div>
          <Button
            variant="ghost"
            size="sm"
            icon={I.add}
            className="mt-2 -ml-1"
            onClick={() => setInvites((l) => [...l, { phone: '', role: 'master' }])}
          >
            Add another
          </Button>
          <div className="mt-7 flex items-center gap-2">
            <Button
              variant="primary"
              size="lg"
              className="px-7"
              onClick={() => {
                const n = invites.filter((i) => i.phone.length === 9).length
                if (n) toast.success(`${n} invitation${n > 1 ? 's' : ''} sent`)
                go('done')
              }}
            >
              Send invites
            </Button>
            <Button variant="ghost" size="lg" onClick={() => go('done')}>
              Skip for now
            </Button>
          </div>
        </Step>
      )}

      {step === 'done' && (
        <Step stepKey="done">
          <div className="mb-6 grid size-14 place-items-center rounded-full bg-positive-soft text-positive">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path
                d="M5 12.5l4.5 4.5L19 7.5"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="[stroke-dasharray:24] [stroke-dashoffset:24] animate-[draw_480ms_var(--ease-out)_200ms_forwards] motion-reduce:animate-none motion-reduce:[stroke-dashoffset:0]"
              />
            </svg>
          </div>
          <Heading
            title={`${bizName.trim() || 'Your business'} is ready`}
            subtitle={`Welcome, ${first.trim() || 'there'}. We added sample clients, services and visits so you can look around. Remove them in one click when you’re ready.`}
          />
          <div className="mb-7 flex flex-col gap-1 rounded-2xl bg-surface p-2 ring-1 ring-border">
            {[
              { icon: I.calendar, title: 'Your booking page is live', text: 'navcrm.tj/book/' + (bizName.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-') || 'your-business') },
              { icon: I.telegram, title: 'Reminders go out in Telegram first', text: 'Then push, SMS and WhatsApp only if needed' },
              { icon: I.checkCircle, title: '3 steps left to finish setup', text: 'Services and prices, team hours, client import' },
            ].map((r) => (
              <div key={r.title} className="flex items-center gap-3 rounded-xl px-3 py-2.5">
                <span className="grid size-9 place-items-center rounded-full bg-fill text-muted">
                  <Icon icon={r.icon} size={18} />
                </span>
                <span>
                  <span className="block text-base text-fg">{r.title}</span>
                  <span className="block text-sm text-muted">{r.text}</span>
                </span>
              </div>
            ))}
          </div>
          <Button
            variant="primary"
            size="lg"
            className="px-7"
            iconRight={I.chevronRight}
            onClick={() => {
              startOnboarding()
              navigate('/')
            }}
          >
            Open NavCRM
          </Button>
        </Step>
      )}
    </AuthFrame>
  )
}
