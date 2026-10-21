import { OTPField } from '@base-ui/react/otp-field'
import { useEffect, useState, type ReactNode } from 'react'
import { Link } from 'react-router'
import { I, Icon } from '@/components/icons'
import { cn } from '@/lib/cn'
import { NavCRMMark } from '@/shell/sidebar'

/** Signed-out frame: logo left, one link right, content centered. */
export function AuthFrame({
  children,
  aside,
  progress,
}: {
  children: ReactNode
  aside?: ReactNode
  /** 0..1, shows Mercury's thin progress line under the header during sign-up. */
  progress?: number
}) {
  return (
    <div className={cn('min-h-dvh', progress != null ? 'bg-bg' : 'bg-[color-mix(in_oklab,var(--fill)_70%,var(--bg))] dark:bg-bg')}>
      <header className="relative flex h-16 items-center justify-between px-5 sm:px-8">
        <Link to="/signin" className="flex items-center gap-2.5">
          <NavCRMMark className="size-7" />
          <span className="text-lg font-semibold text-fg">NavCRM</span>
        </Link>
        <div className="text-base text-muted">{aside}</div>
        {progress != null && (
          <div className="absolute inset-x-0 bottom-0 h-0.5 bg-border">
            <div
              className="h-full origin-left bg-accent transition-transform duration-500 ease-[var(--ease-out)]"
              style={{ transform: `scaleX(${progress})` }}
            />
          </div>
        )}
      </header>
      <main className="flex justify-center px-4 pt-[9vh] pb-16">{children}</main>
    </div>
  )
}

export function AuthCard({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn('w-full max-w-[420px] rounded-3xl bg-surface p-7 shadow-[0_1px_2px_rgb(16_16_24/0.04),0_8px_32px_-12px_rgb(16_16_24/0.12)] ring-1 ring-border sm:p-8', className)}>
      {children}
    </div>
  )
}

export function AuthTitle({ title, subtitle }: { title: ReactNode; subtitle?: ReactNode }) {
  return (
    <div className="mb-6">
      <h1 className="text-2xl font-normal text-fg">{title}</h1>
      {subtitle && <p className="mt-1.5 text-base text-muted">{subtitle}</p>}
    </div>
  )
}

/** One question per screen during sign-up; each new step slides in once. */
export function Step({ children, stepKey }: { children: ReactNode; stepKey: string }) {
  return (
    <div key={stepKey} className="w-full max-w-[440px] animate-[step-in_300ms_var(--ease-out)_both] motion-reduce:animate-none">
      {children}
    </div>
  )
}

export function CodeInput({ onComplete, error }: { onComplete: (code: string) => void; error?: boolean }) {
  const [value, setValue] = useState('')
  return (
    <OTPField.Root
      length={6}
      value={value}
      onValueChange={setValue}
      onValueComplete={onComplete}
      className="flex gap-2"
      aria-label="Verification code"
    >
      {Array.from({ length: 6 }, (_, i) => (
        <OTPField.Input
          key={i}
          aria-label={i === 0 ? undefined : `Digit ${i + 1} of 6`}
          autoFocus={i === 0}
          className={cn(
            'h-14 w-full min-w-0 rounded-xl bg-fill text-center text-2xl text-fg tabular outline-none ring-1 ring-inset transition-[box-shadow,background-color] duration-150',
            'focus:bg-surface focus:ring-2 focus:ring-accent',
            error ? 'ring-negative' : 'ring-transparent',
            i === 2 && 'mr-2',
          )}
        />
      ))}
    </OTPField.Root>
  )
}

/** "Didn't get it? Send by SMS in 0:42": Telegram first because it's free. */
export function ResendCode({ onResend }: { onResend: () => void }) {
  const [left, setLeft] = useState(45)
  useEffect(() => {
    if (left <= 0) return
    const t = setTimeout(() => setLeft(left - 1), 1000)
    return () => clearTimeout(t)
  }, [left])
  return (
    <p className="text-sm text-muted">
      Didn’t get it?{' '}
      {left > 0 ? (
        <span className="tabular">Send by SMS in 0:{String(left).padStart(2, '0')}</span>
      ) : (
        <button
          type="button"
          className="font-medium text-accent-fg hover:underline underline-offset-4"
          onClick={() => {
            onResend()
            setLeft(45)
          }}
        >
          Send by SMS
        </button>
      )}
    </p>
  )
}

export function TelegramNote({ phone }: { phone: string }) {
  return (
    <div className="mb-6 flex items-center gap-3 rounded-xl bg-fill px-3.5 py-3">
      <span className="grid size-9 place-items-center rounded-full bg-[#2AABEE] text-white">
        <Icon icon={I.telegram} size={18} />
      </span>
      <p className="text-sm text-muted">
        We sent a 6-digit code to <span className="font-medium text-fg">Telegram</span> for{' '}
        <span className="text-fg tabular">+992 {phone.slice(0, 2)} ••• •• {phone.slice(-2)}</span>
      </p>
    </div>
  )
}
