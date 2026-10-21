import { useState } from 'react'
import { toast } from 'sonner'
import { I, Icon } from '@/components/icons'
import { Avatar } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { DetailRow, Modal } from '@/components/ui/dialog'
import { EmptyState } from '@/components/ui/misc'
import { Select } from '@/components/ui/select'
import { bookableStaff, staffById } from '@/data/staff'
import { cn } from '@/lib/cn'
import { formatDate } from '@/lib/format'
import { PHOTOS, type Photo } from './data'

/** Placeholder art: no real photos in the prototype, so each tile is a soft wash of the master's color. */
function Art({ photo, side, className }: { photo: Photo; side: 'before' | 'after'; className?: string }) {
  const c = `var(--c-${photo.color})`
  const background =
    side === 'after'
      ? `radial-gradient(120% 90% at 20% 15%, color-mix(in oklab, ${c} 55%, var(--surface)) 0%, transparent 60%), linear-gradient(160deg, color-mix(in oklab, ${c} 30%, var(--surface)), color-mix(in oklab, ${c} 10%, var(--fill)))`
      : `linear-gradient(160deg, color-mix(in oklab, ${c} 10%, var(--fill-active)), var(--fill))`
  return (
    <div className={cn('relative grid place-items-center', className)} style={{ background }}>
      <Icon icon={I.image} size={28} className={side === 'after' ? 'text-fg/25' : 'text-fg/15'} />
    </div>
  )
}

function Tile({ photo, onOpen }: { photo: Photo; onOpen: () => void }) {
  const [side, setSide] = useState<'before' | 'after'>('after')
  const master = staffById[photo.staffId]
  return (
    <div className="group relative overflow-hidden rounded-2xl ring-1 ring-border">
      <button type="button" onClick={onOpen} className="block w-full text-left" aria-label={`${photo.service} by ${master.name}`}>
        <Art photo={photo} side={side} className="aspect-[4/5] w-full" />
        <div className="absolute inset-x-0 bottom-0 bg-linear-to-t from-black/55 to-transparent px-3.5 pt-10 pb-3 text-white">
          <div className="text-base font-medium">{photo.service}</div>
          <div className="text-sm text-white/75">
            {master.name.split(' ')[0]} · {formatDate(photo.at)}
          </div>
        </div>
      </button>
      <div className="absolute top-2.5 left-2.5 flex rounded-full bg-black/35 p-0.5 text-xs font-medium text-white backdrop-blur-sm">
        {(['before', 'after'] as const).map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setSide(s)}
            className={cn('h-6 rounded-full px-2.5 capitalize transition-colors duration-150', side === s ? 'bg-white text-black' : 'hover:bg-white/15')}
          >
            {s}
          </button>
        ))}
      </div>
    </div>
  )
}

export function Photos() {
  const [master, setMaster] = useState('all')
  const [hidden, setHidden] = useState<string[]>([])
  const [open, setOpen] = useState<Photo | null>(null)
  const list = PHOTOS.filter((p) => !hidden.includes(p.id) && (master === 'all' || p.staffId === master))

  return (
    <>
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <Select
          look="pill"
          value={master}
          onChange={setMaster}
          options={[{ value: 'all', label: 'All masters' }, ...bookableStaff.map((s) => ({ value: s.id, label: s.name }))]}
        />
        <p className="flex items-center gap-2 text-sm text-muted">
          <Icon icon={I.shield} size={16} />
          Only from clients who agreed to publication. Masters add photos from their phone after a visit.
        </p>
      </div>

      {list.length ? (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
          {list.map((p) => (
            <Tile key={p.id} photo={p} onOpen={() => setOpen(p)} />
          ))}
        </div>
      ) : (
        <EmptyState icon={I.image} title="No photos yet" description="When a master adds before and after photos with the client’s consent, they appear here." />
      )}

      <Modal
        open={!!open}
        onOpenChange={(o) => !o && setOpen(null)}
        title={open?.service}
        size="lg"
        footer={
          <>
            <Button
              variant="danger"
              className="mr-auto"
              onClick={() => {
                if (!open) return
                const id = open.id
                setHidden((h) => [...h, id])
                setOpen(null)
                toast('Removed from portfolio', { action: { label: 'Undo', onClick: () => setHidden((h) => h.filter((x) => x !== id)) } })
              }}
            >
              Remove from portfolio
            </Button>
            <Button variant="ghost" onClick={() => setOpen(null)}>
              Close
            </Button>
          </>
        }
      >
        {open && (
          <div className="flex flex-col gap-5">
            <div className="grid grid-cols-2 gap-3">
              {(['before', 'after'] as const).map((s) => (
                <div key={s}>
                  <Art photo={open} side={s} className="aspect-[4/5] rounded-xl" />
                  <div className="mt-2 text-sm text-muted capitalize">{s}</div>
                </div>
              ))}
            </div>
            <div className="divide-y divide-border">
              <DetailRow label="Master">
                <span className="inline-flex items-center gap-2">
                  <Avatar name={staffById[open.staffId].name} color={staffById[open.staffId].color} size="xs" />
                  {staffById[open.staffId].name}
                </span>
              </DetailRow>
              <DetailRow label="Visit">{formatDate(open.at, { weekday: true })}</DetailRow>
              <DetailRow label="Publication consent">Signed {formatDate(open.consent)}, version 2</DetailRow>
              <DetailRow label="Shown on">Booking page and NavCRM catalog</DetailRow>
            </div>
          </div>
        )}
      </Modal>
    </>
  )
}
