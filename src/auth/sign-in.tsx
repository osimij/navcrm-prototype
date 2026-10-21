import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router'
import { toast } from 'sonner'
import { I, Icon } from '@/components/icons'
import { Button } from '@/components/ui/button'
import { Field, Input, PhoneInput } from '@/components/ui/input'
import { usePrefs } from '@/lib/store'
import { AuthCard, AuthFrame, AuthTitle, CodeInput, ResendCode, TelegramNote } from './auth-ui'

type Step = 'password' | 'code' | 'reset-phone' | 'reset-code' | 'reset-new'

export function SignIn() {
  const signedIn = usePrefs((s) => s.signedIn)
  const signIn = usePrefs((s) => s.signIn)
  const navigate = useNavigate()
  const [step, setStep] = useState<Step>('password')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [codeError, setCodeError] = useState(false)

  if (signedIn) return <Navigate to="/" replace />

  const finish = () => {
    setLoading(true)
    setTimeout(() => {
      signIn()
      navigate('/')
    }, 650)
  }

  function submitPassword(e: React.FormEvent) {
    e.preventDefault()
    if (phone.length < 9) return setError('Enter your 9-digit phone number')
    if (!password) return setError('Enter your password')
    setError(null)
    finish()
  }

  function checkCode(code: string, next: () => void) {
    // Any code works in the prototype except 000000, which shows the error state.
    if (code === '000000') {
      setCodeError(true)
      return
    }
    setCodeError(false)
    next()
  }

  return (
    <AuthFrame
      aside={
        <>
          New to NavCRM?{' '}
          <Link to="/signup" className="font-medium text-fg hover:underline underline-offset-4">
            Create an account
          </Link>
        </>
      }
    >
      {step === 'password' && (
        <AuthCard>
          <AuthTitle title="Sign in" subtitle="Use the phone number your business registered you with." />
          <form onSubmit={submitPassword} className="flex flex-col gap-4">
            <Field label="Phone number" htmlFor="phone">
              <PhoneInput id="phone" value={phone} onChange={setPhone} size="lg" autoFocus invalid={!!error && phone.length < 9} />
            </Field>
            <Field
              label={
                <span className="flex w-full items-center justify-between">
                  Password
                </span>
              }
              error={error}
            >
              <Input
                type={showPw ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                size="lg"
                autoComplete="current-password"
                aria-invalid={!!error && !password}
                suffix={
                  <button
                    type="button"
                    aria-label={showPw ? 'Hide password' : 'Show password'}
                    onClick={() => setShowPw(!showPw)}
                    className="grid size-8 place-items-center rounded-full text-faint hover:bg-fill hover:text-fg"
                  >
                    <Icon icon={showPw ? I.viewOff : I.view} size={18} />
                  </button>
                }
              />
            </Field>
            <button
              type="button"
              onClick={() => (setError(null), setStep('reset-phone'))}
              className="-mt-1 self-start text-sm text-muted hover:text-fg hover:underline underline-offset-4"
            >
              Forgot password?
            </button>
            <Button type="submit" variant="primary" size="lg" loading={loading} className="mt-1 w-full">
              Sign in
            </Button>
          </form>
          <div className="my-5 flex items-center gap-3 text-xs text-faint">
            <span className="h-px flex-1 bg-border" />
            or
            <span className="h-px flex-1 bg-border" />
          </div>
          <Button
            variant="secondary"
            size="lg"
            className="w-full"
            icon={I.telegram}
            onClick={() => {
              if (phone.length < 9) return setError('Enter your phone number first')
              setError(null)
              setStep('code')
            }}
          >
            Get a code in Telegram
          </Button>
        </AuthCard>
      )}

      {step === 'code' && (
        <AuthCard>
          <AuthTitle title="Enter the code" />
          <TelegramNote phone={phone} />
          <CodeInput error={codeError} onComplete={(c) => checkCode(c, finish)} />
          {codeError && <p className="mt-2 text-sm text-negative">That code doesn’t match. Check Telegram and try again.</p>}
          <div className="mt-5 flex items-center justify-between">
            <ResendCode onResend={() => toast('Code sent by SMS')} />
            <Button variant="ghost" size="sm" onClick={() => setStep('password')}>
              Use password
            </Button>
          </div>
        </AuthCard>
      )}

      {step === 'reset-phone' && (
        <AuthCard>
          <AuthTitle title="Reset your password" subtitle="We’ll send a code to Telegram, or by SMS if you don’t use it." />
          <form
            onSubmit={(e) => {
              e.preventDefault()
              if (phone.length < 9) return setError('Enter your 9-digit phone number')
              setError(null)
              setStep('reset-code')
            }}
            className="flex flex-col gap-4"
          >
            <Field label="Phone number" error={error}>
              <PhoneInput value={phone} onChange={setPhone} size="lg" autoFocus />
            </Field>
            <div className="flex items-center justify-between">
              <Button variant="ghost" onClick={() => setStep('password')}>
                Back
              </Button>
              <Button type="submit" variant="primary" size="lg">
                Send code
              </Button>
            </div>
          </form>
        </AuthCard>
      )}

      {step === 'reset-code' && (
        <AuthCard>
          <AuthTitle title="Enter the code" />
          <TelegramNote phone={phone} />
          <CodeInput error={codeError} onComplete={(c) => checkCode(c, () => setStep('reset-new'))} />
          {codeError && <p className="mt-2 text-sm text-negative">That code doesn’t match. Check Telegram and try again.</p>}
          <div className="mt-5">
            <ResendCode onResend={() => toast('Code sent by SMS')} />
          </div>
        </AuthCard>
      )}

      {step === 'reset-new' && (
        <AuthCard>
          <AuthTitle title="Choose a new password" />
          <form
            onSubmit={(e) => {
              e.preventDefault()
              if (password.length < 8) return setError('Use at least 8 characters')
              toast.success('Password updated')
              finish()
            }}
            className="flex flex-col gap-4"
          >
            <Field label="New password" hint="At least 8 characters" error={error}>
              <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} size="lg" autoFocus autoComplete="new-password" />
            </Field>
            <Button type="submit" variant="primary" size="lg" loading={loading} className="w-full">
              Save and sign in
            </Button>
          </form>
        </AuthCard>
      )}
    </AuthFrame>
  )
}
