import type { IconSvgElement } from '@hugeicons/react'
import { useState } from 'react'
import { useNavigate } from 'react-router'
import { I, Icon } from '@/components/icons'
import { Button } from '@/components/ui/button'
import { Sheet } from '@/components/ui/dialog'
import { EmptyState } from '@/components/ui/misc'
import { Segmented } from '@/components/ui/tabs'
import { cn } from '@/lib/cn'
import { formatRelative } from '@/lib/format'
import { useOverlays } from '@/lib/overlays'
import { NOW, addMinutes } from '@/lib/time'
import { clientById } from '@/data/clients'

type Note = {
  id: string
  icon: IconSvgElement
  tone: 'accent' | 'positive' | 'warning' | 'negative' | 'neutral'
  title: string
  body: string
  at: Date
  unread: boolean
  to?: string
  clientId?: string
}

const NOTES: Note[] = [
  { id: 'n1', icon: I.instagram, tone: 'accent', title: 'New booking from Instagram', body: `${clientById.c17.name} booked Lash lamination with Shahlo, today 15:30.`, at: addMinutes(NOW, -6), unread: true, to: '/calendar' },
  { id: 'n2', icon: I.cancelCircle, tone: 'neutral', title: 'Visit cancelled by client', body: 'Facial cleansing with Dilnoza, today 16:15. The slot was offered to 2 clients on the waiting list.', at: addMinutes(NOW, -34), unread: true, to: '/calendar' },
  { id: 'n3', icon: I.star, tone: 'negative', title: 'New 2★ review on 2GIS', body: '“Waited 25 minutes past my time.” Answer within 24 hours to keep your rating.', at: addMinutes(NOW, -95), unread: true, to: '/channels/reviews' },
  { id: 'n4', icon: I.lab, tone: 'positive', title: 'Lab results ready', body: `Complete blood count for ${clientById.c43.name}. Sent to the patient in Telegram.`, at: addMinutes(NOW, -255), unread: false, to: '/lab' },
  { id: 'n5', icon: I.inventory, tone: 'warning', title: 'Gel polish base is running low', body: '3 bottles left, minimum is 5. A draft order to Nail Pro Supply is ready.', at: addMinutes(NOW, -260), unread: false, to: '/inventory/orders' },
  { id: 'n6', icon: I.alert, tone: 'warning', title: 'Booking conflict resolved offline', body: 'Two admins booked Rustam at 18:00. The second visit moved to 18:45; the client was notified.', at: addMinutes(NOW, -60 * 20), unread: false, to: '/calendar' },
]

export const unreadCount = NOTES.filter((n) => n.unread).length

const tones = {
  accent: 'bg-accent-soft text-accent-fg',
  positive: 'bg-positive-soft text-positive',
  warning: 'bg-warning-soft text-warning',
  negative: 'bg-negative-soft text-negative',
  neutral: 'bg-fill text-muted',
}

export function NotificationsSheet() {
  const open = useOverlays((s) => s.notifications)
  const setOpen = useOverlays((s) => s.setNotifications)
  const navigate = useNavigate()
  const [filter, setFilter] = useState<'all' | 'unread'>('all')
  const [read, setRead] = useState<Set<string>>(new Set())
  const list = NOTES.filter((n) => filter === 'all' || (n.unread && !read.has(n.id)))

  return (
    <Sheet
      open={open}
      onOpenChange={setOpen}
      title="Notifications"
      width="md"
      actions={
        <Button size="sm" variant="ghost" onClick={() => setRead(new Set(NOTES.map((n) => n.id)))}>
          Mark all read
        </Button>
      }
      footer={
        <div className="flex w-full items-center gap-2 text-sm text-muted">
          <Icon icon={I.telegram} size={16} className="text-accent-fg" />
          Also sent to your Telegram
          <button type="button" className="ml-auto font-medium text-fg hover:underline underline-offset-4" onClick={() => (setOpen(false), navigate('/settings/notifications'))}>
            Settings
          </button>
        </div>
      }
    >
      <div className="px-5 pt-4 pb-2">
        <Segmented
          value={filter}
          onChange={setFilter}
          items={[
            { value: 'all', label: 'All' },
            { value: 'unread', label: 'Unread' },
          ]}
        />
      </div>
      {list.length ? (
        <ul className="px-2 pb-4">
          {list.map((n) => {
            const unread = n.unread && !read.has(n.id)
            return (
              <li key={n.id}>
                <button
                  type="button"
                  onClick={() => {
                    setRead((r) => new Set(r).add(n.id))
                    if (n.to) {
                      setOpen(false)
                      navigate(n.to)
                    }
                  }}
                  className="flex w-full gap-3 rounded-xl px-3 py-3 text-left hover:bg-fill"
                >
                  <span className={cn('grid size-9 shrink-0 place-items-center rounded-full', tones[n.tone])}>
                    <Icon icon={n.icon} size={18} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-2">
                      <span className={cn('flex-1 truncate text-base', unread ? 'font-medium text-fg' : 'text-fg')}>{n.title}</span>
                      <span className="shrink-0 text-xs text-faint">{formatRelative(n.at)}</span>
                    </span>
                    <span className="mt-0.5 block text-sm text-muted">{n.body}</span>
                  </span>
                  <span className={cn('mt-2 size-2 shrink-0 rounded-full', unread ? 'bg-accent' : 'bg-transparent')} />
                </button>
              </li>
            )
          })}
        </ul>
      ) : (
        <EmptyState icon={I.bell} title="You’re all caught up" description="Online bookings, cancellations and conflicts appear here." />
      )}
    </Sheet>
  )
}
