import { lazy, StrictMode, Suspense } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Route, Routes } from 'react-router'
import { Toaster } from 'sonner'
import { TooltipProvider } from './components/ui/tooltip'
import { usePrefs } from './lib/store'
import './styles/index.css'
import './lib/input-modality'
import { useLanguage } from './i18n/language'

// Visitors can read the landing page before loading the full CRM prototype.
const Landing = lazy(() => import('./pages/landing'))
const App = lazy(() => import('./App').then((module) => ({ default: module.App })))

function Toasts() {
  const language = useLanguage()
  const theme = usePrefs((s) => s.theme)
  return (
    <Toaster
      containerAriaLabel={language === 'ru' ? 'Уведомления' : 'Notifications'}
      theme={theme}
      position="bottom-center"
      gap={8}
      offset={20}
      toastOptions={{
        style: {
          // Match the app's tokens instead of Sonner's defaults.
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
  )
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <TooltipProvider>
        <Suspense fallback={<div role="status" aria-label="Загрузка" style={{ minHeight: '100dvh' }} />}>
          <Routes>
            <Route path="/landing" element={<Landing />} />
            <Route path="/*" element={<App />} />
          </Routes>
        </Suspense>
        <Toasts />
      </TooltipProvider>
    </BrowserRouter>
  </StrictMode>,
)
