import { Dialog } from '@base-ui/react/dialog'
import { Command } from 'cmdk'
import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router'
import { ClientRow } from '@/components/client-picker'
import { I, Icon } from '@/components/icons'
import { Kbd } from '@/components/ui/misc'
import { CATEGORY_LABEL } from '@/data/clients'
import type { IconSvgElement } from '@hugeicons/react'
import { useOverlays } from '@/lib/overlays'
import { searchClients } from '@/lib/search'
import { useData } from '@/lib/store'
import { useAssistant } from '@/pages/assistant/store'
import { ASSISTANT_ITEM, NAV, SETTINGS_NAV } from './nav'

const itemClass =
  'flex h-11 cursor-default items-center gap-3 rounded-lg px-3 text-base text-fg outline-none select-none data-[selected=true]:bg-fill'
const groupClass =
  '[&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:pt-3 [&_[cmdk-group-heading]]:pb-1.5 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-faint'

/**
 * ⌘K. Opened dozens of times a day from the keyboard, so per Emil's rule it
 * has no open/close animation at all.
 */
export function CommandMenu() {
  const open = useOverlays((s) => s.command)
  const setOpen = useOverlays((s) => s.setCommand)
  const { openClient, openNewVisit, openNewClient, openNewTask } = useOverlays()
  const clients = useData((s) => s.clients)
  const navigate = useNavigate()
  const [q, setQ] = useState('')

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setOpen(!useOverlays.getState().command)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [setOpen])

  useEffect(() => {
    if (!open) setQ('')
  }, [open])

  const run = (fn: () => void) => {
    setOpen(false)
    fn()
  }

  const query = q.trim().toLowerCase()
  const matchedClients = useMemo(() => (query ? searchClients(clients, q, 5) : []), [clients, q, query])

  const actions: { label: string; icon: IconSvgElement; run: () => void; hint?: string }[] = [
    { label: 'New visit', icon: I.calendarAdd, run: () => openNewVisit() },
    { label: 'New sale', icon: I.register, run: () => navigate('/pos') },
    { label: 'New client', icon: I.userAdd, run: () => openNewClient() },
    { label: 'New task', icon: I.tasks, run: () => openNewTask() },
    { label: 'Block time for a master', icon: I.calendarBlock, run: () => openNewVisit({ mode: 'block' }) },
  ]
  const pages = [
    ...[...NAV.flatMap((g) => g.items), ASSISTANT_ITEM].map((it) => ({ label: it.label, to: it.to, icon: it.icon, keywords: it.keywords ?? '' })),
    { label: 'My earnings', to: '/me', icon: I.earnings, keywords: 'salary clock in' },
    ...SETTINGS_NAV.flatMap((g) => g.items.map((it) => ({ label: `Settings: ${it.label}`, to: it.to, icon: I.settings, keywords: g.label }))),
  ]
  const filteredActions = query ? actions.filter((a) => a.label.toLowerCase().includes(query)) : actions
  const filteredPages = query
    ? pages.filter((p) => `${p.label} ${p.keywords}`.toLowerCase().includes(query)).slice(0, 6)
    : pages.slice(0, 8)

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-[80] bg-backdrop" />
        <Dialog.Popup className="fixed top-[12vh] left-1/2 z-[80] w-[640px] max-w-[calc(100vw-2rem)] -translate-x-1/2 overflow-hidden rounded-2xl bg-raised shadow-modal outline-none">
          <Dialog.Title className="sr-only">Search and commands</Dialog.Title>
          <Command shouldFilter={false} loop>
            <div className="flex items-center gap-3 border-b border-border px-4">
              <Icon icon={I.search} size={18} className="text-faint" />
              <Command.Input
                autoFocus
                value={q}
                onValueChange={setQ}
                placeholder="Search clients by name or phone, pages, actions"
                className="h-14 flex-1 bg-transparent text-md text-fg outline-none placeholder:text-faint"
              />
              <Kbd>Esc</Kbd>
            </div>
            <Command.List className="max-h-[min(60vh,460px)] overflow-y-auto p-2">
              {matchedClients.length > 0 && (
                <Command.Group heading="Clients" className={groupClass}>
                  {matchedClients.map((c) => (
                    <Command.Item key={c.id} value={`client-${c.id}`} onSelect={() => run(() => openClient(c.id))} className={`${itemClass} h-14`}>
                      <span className="min-w-0 flex-1">
                        <ClientRow client={c} />
                      </span>
                      <span className="text-xs text-faint">{CATEGORY_LABEL[c.category]}</span>
                    </Command.Item>
                  ))}
                </Command.Group>
              )}
              {filteredActions.length > 0 && (
                <Command.Group heading="Actions" className={groupClass}>
                  {filteredActions.map((a) => (
                    <Command.Item key={a.label} value={`action-${a.label}`} onSelect={() => run(a.run)} className={itemClass}>
                      <Icon icon={a.icon} size={18} className="text-muted" />
                      {a.label}
                    </Command.Item>
                  ))}
                </Command.Group>
              )}
              {filteredPages.length > 0 && (
                <Command.Group heading="Go to" className={groupClass}>
                  {filteredPages.map((p) => (
                    <Command.Item key={p.to} value={`page-${p.to}`} onSelect={() => run(() => navigate(p.to))} className={itemClass}>
                      <Icon icon={p.icon} size={18} className="text-muted" />
                      {p.label}
                    </Command.Item>
                  ))}
                </Command.Group>
              )}
              {query && (
                <Command.Group heading="Assistant" className={groupClass}>
                  <Command.Item
                    value="ask"
                    onSelect={() => run(() => useAssistant.getState().askInDock(q))}
                    className={itemClass}
                  >
                    <Icon icon={I.magic} size={18} className="text-accent-fg" />
                    <span className="truncate">
                      Ask the assistant: <span className="text-muted">“{q}”</span>
                    </span>
                  </Command.Item>
                </Command.Group>
              )}
            </Command.List>
            <div className="flex items-center gap-4 border-t border-border px-4 py-2.5 text-xs text-faint">
              <span className="flex items-center gap-1.5">
                <Kbd>↑</Kbd>
                <Kbd>↓</Kbd> to move
              </span>
              <span className="flex items-center gap-1.5">
                <Kbd>↵</Kbd> to open
              </span>
              <span className="ml-auto">Tip: type the last 4 digits of a phone number</span>
            </div>
          </Command>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
