import { useState } from 'react'
import { toast } from 'sonner'
import { I, Icon } from '@/components/icons'
import { Avatar } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button, IconButton } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Modal } from '@/components/ui/dialog'
import { Field, Input, Textarea } from '@/components/ui/input'
import { Menu, MenuItem } from '@/components/ui/menu'
import { EmptyState } from '@/components/ui/misc'
import { Select } from '@/components/ui/select'
import { Segmented } from '@/components/ui/tabs'
import { staffById } from '@/data/staff'
import { cn } from '@/lib/cn'
import { formatRelative } from '@/lib/format'
import { useOverlays } from '@/lib/overlays'
import { NOW, addDays } from '@/lib/time'
import { SOURCE_LABEL, suggestReply, useReviews, type Review, type ReviewSource } from './data'

function Stars({ rating, size = 15, onPick }: { rating: number; size?: number; onPick?: (n: number) => void }) {
  return (
    <span className="flex items-center gap-0.5" aria-label={`${rating} out of 5`}>
      {[1, 2, 3, 4, 5].map((n) => {
        const star = (
          <svg width={size} height={size} viewBox="0 0 20 20" aria-hidden>
            <path
              d="M10 1.8l2.5 5.1 5.6.8-4 3.9 1 5.6-5.1-2.6-5 2.6.9-5.6-4-3.9 5.6-.8z"
              fill={n <= rating ? (rating <= 2 ? 'var(--negative)' : 'var(--fg)') : 'var(--fill-active)'}
            />
          </svg>
        )
        return onPick ? (
          <button key={n} type="button" onClick={() => onPick(n)} className="press p-0.5" aria-label={`${n} stars`}>
            {star}
          </button>
        ) : (
          <span key={n}>{star}</span>
        )
      })}
    </span>
  )
}

/** How a reply gets out depends on the platform: maps have no API here, so we copy and open them. */
function postLabel(source: ReviewSource) {
  if (source === 'after_visit') return 'Send in Telegram'
  if (source === 'instagram') return 'Copy and open Instagram'
  return `Copy and open ${SOURCE_LABEL[source]}`
}

function ReviewCard({ review }: { review: Review }) {
  const reply = useReviews((s) => s.reply)
  const openClient = useOverlays((s) => s.openClient)
  const [composing, setComposing] = useState(false)
  const [text, setText] = useState('')
  const master = review.staffId ? staffById[review.staffId] : undefined
  const urgent = !review.reply && review.rating <= 2

  function post() {
    if (review.source !== 'after_visit') navigator.clipboard?.writeText(text).catch(() => {})
    reply(review.id, text)
    setComposing(false)
    toast.success(
      review.source === 'after_visit' ? `Reply sent to ${review.author.split(' ')[0]} in Telegram` : `Reply copied. Paste it on ${SOURCE_LABEL[review.source]}`,
      review.source === 'after_visit' ? undefined : { description: 'We’ve marked the review as answered.' },
    )
  }

  return (
    <Card className="p-5">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
        <Stars rating={review.rating} />
        <Badge>{SOURCE_LABEL[review.source]}</Badge>
        {urgent && <span className="text-sm text-negative">Reply within 24 hours</span>}
        <span className="ml-auto text-sm text-faint">{formatRelative(review.at)}</span>
      </div>
      <p className="mt-3 text-md text-fg">{review.text}</p>
      <div className="mt-3 flex items-center gap-2 text-sm text-muted">
        <Avatar name={review.author.replace('@', '')} size="xs" />
        {review.clientId ? (
          <button type="button" onClick={() => openClient(review.clientId!)} className="text-fg hover:underline underline-offset-4">
            {review.author}
          </button>
        ) : (
          <span className="text-fg">{review.author}</span>
        )}
        {master && <span>· with {master.name.split(' ')[0]}</span>}
      </div>

      {review.reply ? (
        <div className="mt-4 rounded-xl bg-fill px-4 py-3">
          <div className="mb-1 text-xs font-medium text-faint">Your reply</div>
          <p className="text-base text-fg">{review.reply}</p>
        </div>
      ) : composing ? (
        <div className="mt-4 flex flex-col gap-3">
          <Textarea autoFocus value={text} onChange={(e) => setText(e.target.value)} placeholder="Write a reply…" className="min-h-24" />
          <div className="flex flex-wrap items-center gap-2">
            <Button size="sm" variant="ghost" icon={I.sparkles} onClick={() => setText(suggestReply(review))}>
              Suggest a reply
            </Button>
            <span className="flex-1" />
            <Button size="sm" variant="ghost" onClick={() => setComposing(false)}>
              Cancel
            </Button>
            <Button size="sm" variant="primary" disabled={!text.trim()} onClick={post}>
              {postLabel(review.source)}
            </Button>
          </div>
        </div>
      ) : (
        <div className="mt-4">
          <Button size="sm" icon={I.message} onClick={() => setComposing(true)}>
            Reply
          </Button>
        </div>
      )}
    </Card>
  )
}

function AddReview({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const add = useReviews((s) => s.add)
  const [source, setSource] = useState<ReviewSource>('yandex')
  const [rating, setRating] = useState(5)
  const [author, setAuthor] = useState('')
  const [text, setText] = useState('')
  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title="Add a review"
      description="For reviews left somewhere we can’t read automatically."
      footer={
        <>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            variant="primary"
            disabled={!author.trim() || !text.trim()}
            onClick={() => {
              add({ id: `r${Date.now()}`, rating, text: text.trim(), author: author.trim(), source, at: NOW })
              onOpenChange(false)
              setAuthor('')
              setText('')
              toast.success('Review added')
            }}
          >
            Add review
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Where">
            <Select
              value={source}
              onChange={setSource}
              options={(['yandex', '2gis', 'google', 'instagram'] as ReviewSource[]).map((s) => ({ value: s, label: SOURCE_LABEL[s] }))}
            />
          </Field>
          <Field label="Rating">
            <div className="flex h-9 items-center">
              <Stars rating={rating} size={20} onPick={setRating} />
            </div>
          </Field>
        </div>
        <Field label="Author">
          <Input value={author} onChange={(e) => setAuthor(e.target.value)} placeholder="Name as shown on the platform" />
        </Field>
        <Field label="Review">
          <Textarea value={text} onChange={(e) => setText(e.target.value)} />
        </Field>
      </div>
    </Modal>
  )
}

function ImportReviews({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const add = useReviews((s) => s.add)
  return (
    <Modal open={open} onOpenChange={onOpenChange} title="Import reviews" size="sm">
      <button
        type="button"
        onClick={() => {
          add({ id: `r${Date.now()}`, rating: 5, text: 'Very friendly staff and the place is spotless.', author: 'Oisha N.', source: '2gis', at: addDays(NOW, -1) })
          onOpenChange(false)
          toast.success('1 new review imported', { description: '88 were already here and were skipped.' })
        }}
        className="press flex w-full flex-col items-center gap-2 rounded-2xl border border-dashed border-border-strong px-6 py-10 text-center hover:bg-fill"
      >
        <Icon icon={I.upload} size={22} className="text-muted" />
        <span className="text-base text-fg">Drop a file or click to choose</span>
        <span className="text-sm text-muted">CSV or Excel exported from Yandex Business or the 2GIS business account</span>
      </button>
    </Modal>
  )
}

export function Reviews() {
  const reviews = useReviews((s) => s.reviews)
  const [filter, setFilter] = useState<'all' | 'noreply' | 'negative'>('all')
  const [source, setSource] = useState<'any' | ReviewSource>('any')
  const [adding, setAdding] = useState(false)
  const [importing, setImporting] = useState(false)

  const noReply = reviews.filter((r) => !r.reply).length
  const negative = reviews.filter((r) => r.rating <= 3).length
  const list = reviews
    .filter((r) => (filter === 'noreply' ? !r.reply : filter === 'negative' ? r.rating <= 3 : true))
    .filter((r) => source === 'any' || r.source === source)
    .sort((a, b) => +b.at - +a.at)

  return (
    <>
      <div className="mb-5 flex flex-wrap items-center gap-2">
        <Segmented
          value={filter}
          onChange={setFilter}
          items={[
            { value: 'all', label: 'All' },
            { value: 'noreply', label: `No reply · ${noReply}` },
            { value: 'negative', label: `Negative · ${negative}` },
          ]}
        />
        <Select
          look="pill"
          value={source}
          onChange={setSource}
          options={[{ value: 'any', label: 'All sources' }, ...(Object.keys(SOURCE_LABEL) as ReviewSource[]).map((s) => ({ value: s, label: SOURCE_LABEL[s] }))]}
        />
        <span className="ml-auto hidden text-sm text-muted sm:inline">★ 4.8 average across 568 reviews</span>
        <Menu align="end" trigger={<IconButton icon={I.more} label="More" variant="outline" size="sm" tooltip={false} />}>
          <MenuItem icon={I.add} onClick={() => setAdding(true)}>
            Add a review
          </MenuItem>
          <MenuItem icon={I.upload} onClick={() => setImporting(true)}>
            Import from file
          </MenuItem>
        </Menu>
      </div>

      {list.length ? (
        <div className={cn('grid gap-4')}>
          {list.map((r) => (
            <ReviewCard key={r.id} review={r} />
          ))}
        </div>
      ) : (
        <Card>
          <EmptyState
            icon={I.star}
            title={filter === 'noreply' ? 'Every review has a reply' : 'No reviews here'}
            description={filter === 'noreply' ? 'New reviews from after-visit messages and maps show up here.' : 'Try another source or filter.'}
          />
        </Card>
      )}

      <AddReview open={adding} onOpenChange={setAdding} />
      <ImportReviews open={importing} onOpenChange={setImporting} />
    </>
  )
}
