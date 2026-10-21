import { create } from 'zustand'
import type { IconSvgElement } from '@hugeicons/react'
import { I } from '@/components/icons'
import type { BookingSource, VisitStatus } from '@/data/appointments'
import type { LabelColor } from '@/data/business'
import { bookableStaff, type Staff } from '@/data/staff'
import { NOW, TODAY, addMinutes, isSameDay } from '@/lib/time'

/* ─────────────── Grid geometry ─────────────── */

export const DAY_START = 8 * 60
export const DAY_END = 21 * 60
export const HOUR_PX = 80
export const SLOT_MIN = 15
export const SLOT_PX = (HOUR_PX / 60) * SLOT_MIN
export const GRID_HEIGHT = ((DAY_END - DAY_START) / 60) * HOUR_PX

export const minToPx = (min: number) => ((min - DAY_START) / 60) * HOUR_PX
export const toMin = (hhmm: string) => {
  const [h, m] = hhmm.split(':').map(Number)
  return h * 60 + m
}

/* ─────────────── Who works when ─────────────── */

// Same weekly days off the demo bookings were generated with.
const OFF_DAY: Record<string, number> = { s1: 1, s2: 2, s3: 0, s4: 3, s5: 0, s6: 1 }

export function worksOn(s: Staff, date: Date) {
  if (!s.today) return false
  if (isSameDay(date, TODAY)) return true
  return OFF_DAY[s.id] !== date.getDay()
}

export function hoursOn(s: Staff, date: Date) {
  return worksOn(s, date) && s.today ? { start: toMin(s.today.start), end: toMin(s.today.end) } : null
}

/* ─────────────── Rooms ─────────────── */

export type Room = { id: string; name: string; staffId: string | null; icon: IconSvgElement }

export const ROOMS: Room[] = [
  { id: 'r1', name: 'Chair 1', staffId: 's1', icon: I.chair },
  { id: 'r2', name: 'Chair 2', staffId: null, icon: I.chair },
  { id: 'r3', name: 'Nail desk', staffId: 's2', icon: I.droplet },
  { id: 'r4', name: 'Cosmetology room', staffId: 's3', icon: I.stethoscope },
  { id: 'r5', name: 'Brow & lash station', staffId: 's4', icon: I.view },
  { id: 'r6', name: 'Barber chair', staffId: 's5', icon: I.scissors },
  { id: 'r7', name: 'Massage room', staffId: 's6', icon: I.chair },
]

/* ─────────────── Colors ─────────────── */

export type ColorBy = 'master' | 'service' | 'status' | 'source'

export const STATUS_COLOR: Record<VisitStatus, LabelColor> = {
  booked: 'slate',
  confirmed: 'indigo',
  arrived: 'amber',
  in_progress: 'sky',
  completed: 'green',
  no_show: 'rose',
  cancelled: 'slate',
}

export const SOURCE_COLOR: Record<BookingSource, LabelColor> = {
  phone: 'slate',
  online: 'indigo',
  instagram: 'rose',
  telegram: 'sky',
  walk_in: 'amber',
  assistant: 'violet',
}

/* ─────────────── Calendar settings ─────────────── */

type Settings = {
  colorBy: ColorBy
  staffMode: 'working' | 'all'
  showCancelled: boolean
  allowOverlap: boolean
  set: (p: Partial<Omit<Settings, 'set'>>) => void
}

export const useCalendarSettings = create<Settings>()((set) => ({
  colorBy: 'master',
  staffMode: 'working',
  showCancelled: false,
  allowOverlap: false,
  set: (p) => set(p),
}))

/* ─────────────── Waiting list ─────────────── */

export type Waiting = {
  id: string
  clientId: string
  serviceId: string
  staffId: string | null
  window: string
  addedAt: Date
}

const initialWaiting: Waiting[] = [
  { id: 'w1', clientId: 'c41', serviceId: 'v11', staffId: 's3', window: 'Today after 16:00', addedAt: addMinutes(NOW, -125) },
  { id: 'w2', clientId: 'c58', serviceId: 'v6', staffId: null, window: 'Today, any time', addedAt: addMinutes(NOW, -48) },
  { id: 'w3', clientId: 'c19', serviceId: 'v3', staffId: 's1', window: 'Tomorrow morning', addedAt: addMinutes(NOW, -60 * 22) },
  { id: 'w4', clientId: 'c66', serviceId: 'v10', staffId: 's4', window: 'Saturday, any time', addedAt: addMinutes(NOW, -60 * 30) },
]

type WaitingStore = {
  list: Waiting[]
  open: boolean
  setOpen: (o: boolean) => void
  add: (w: Waiting) => void
  remove: (id: string) => void
}

export const useWaitingList = create<WaitingStore>()((set) => ({
  list: initialWaiting,
  open: false,
  setOpen: (open) => set({ open }),
  add: (w) => set((s) => ({ list: [w, ...s.list] })),
  remove: (id) => set((s) => ({ list: s.list.filter((w) => w.id !== id) })),
}))

export const workingStaff = (date: Date, mode: 'working' | 'all') =>
  mode === 'all' ? bookableStaff : bookableStaff.filter((s) => worksOn(s, date))

/* ─────────────── URL date helpers ─────────────── */

export function toParam(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export function fromParam(p: string | null) {
  if (!p) return TODAY
  const [y, m, d] = p.split('-').map(Number)
  if (!y || !m || !d) return TODAY
  return new Date(y, m - 1, d)
}

/** Monday of the week containing `d`. */
export function weekStart(d: Date) {
  const x = new Date(d.getFullYear(), d.getMonth(), d.getDate())
  x.setDate(x.getDate() - ((x.getDay() + 6) % 7))
  return x
}
