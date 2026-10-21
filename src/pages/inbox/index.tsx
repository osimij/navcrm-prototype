import { Route, Routes, useParams } from 'react-router'
import { I } from '@/components/icons'
import { EmptyState } from '@/components/ui/misc'
import { cn } from '@/lib/cn'
import { ClientContext } from './context'
import { ConversationList } from './list'
import { useInbox } from './store'
import { Thread } from './thread'

/**
 * Three panes: conversations, the thread, and the client it belongs to.
 * Fills the main area edge to edge, like a messenger, instead of a padded page.
 */
function InboxView() {
  const { id } = useParams()
  const conv = useInbox((s) => s.conversations.find((c) => c.id === id))

  return (
    <div className="flex h-full min-h-0 lg:border-t lg:border-border">
      <ConversationList activeId={conv?.id} className={cn('w-full shrink-0 border-r border-border md:w-[340px]', conv ? 'hidden md:flex' : 'flex')} />
      {conv ? (
        <>
          <Thread key={conv.id} conv={conv} />
          <ClientContext clientId={conv.clientId} />
        </>
      ) : (
        <div className="hidden flex-1 items-center justify-center md:flex">
          <EmptyState
            icon={I.inbox}
            title={id ? 'This conversation no longer exists' : 'Pick a conversation'}
            description="Messages from Telegram, WhatsApp, Instagram and the booking page land here, with the client’s visits and balance alongside."
          />
        </div>
      )}
    </div>
  )
}

export default function Inbox() {
  return (
    <Routes>
      <Route index element={<InboxView />} />
      <Route path=":id" element={<InboxView />} />
    </Routes>
  )
}
