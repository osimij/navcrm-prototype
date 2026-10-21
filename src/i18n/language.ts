import { useSyncExternalStore } from 'react'

export type Language = 'en' | 'ru'
const listeners = new Set<() => void>()
const storageKey = 'navcrm-language'
function readLanguage(): Language {
  try { return localStorage.getItem(storageKey) === 'ru' ? 'ru' : 'en' } catch { return 'en' }
}
let language = readLanguage()
export const getLanguage = () => language
export const getLocale = () => language === 'ru' ? 'ru-RU' : 'en-US'
export function setLanguage(next: Language) {
  if (next !== 'en' && next !== 'ru') return
  language = next
  try { localStorage.setItem(storageKey, next) } catch { /* Private browsing can disable storage. */ }
  if (typeof document !== 'undefined') document.documentElement.lang = next
  for (const notify of listeners) notify()
}
export function useLanguage() {
  return useSyncExternalStore((notify) => { listeners.add(notify); return () => listeners.delete(notify) }, getLanguage, getLanguage)
}
if (typeof document !== 'undefined') document.documentElement.lang = language
if (typeof window !== 'undefined') window.addEventListener('storage', (event) => {
  if (event.key === storageKey) setLanguage(readLanguage())
})
