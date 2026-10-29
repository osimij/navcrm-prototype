import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { MemoryRouter } from 'react-router'
import { Toaster } from 'sonner'
import { App } from './App'
import { TooltipProvider } from './components/ui/tooltip'
import { setLanguage } from './i18n/language'
import { applyTheme, usePrefs } from './lib/store'
import './styles/index.css'
import './lib/input-modality'

/**
 * The CRM as the landing page's hero shows it, inside an iframe: already signed in, in Russian
 * and light, with routes kept in memory so the static landing server needs no rewrites.
 * The starting route comes from the hash (embed.html#/calendar).
 */
setLanguage('ru')
usePrefs.setState({ signedIn: true, theme: 'light', onboarding: null })
applyTheme('light')

const start = location.hash.slice(1) || '/'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <MemoryRouter initialEntries={[start]}>
      <TooltipProvider>
        <App />
        {/* Same look as the full prototype's toasts (main.tsx) */}
        <Toaster
          containerAriaLabel="Уведомления"
          theme="light"
          position="bottom-center"
          gap={8}
          offset={20}
          toastOptions={{
            style: {
              background: 'var(--surface-raised)',
              color: 'var(--fg)',
              border: 'none',
              boxShadow: 'var(--shadow-popover)',
              borderRadius: '14px',
              fontFamily: 'inherit',
              fontSize: '14px',
            },
            classNames: {
              description: '!text-[var(--muted)] !text-[13px]',
              actionButton: '!bg-[var(--fill)] !text-[var(--fg)] !rounded-full !h-7 !px-3 !text-[13px] !font-medium',
              success: '[&_[data-icon]]:!text-[var(--positive)]',
            },
          }}
        />
      </TooltipProvider>
    </MemoryRouter>
  </StrictMode>,
)
