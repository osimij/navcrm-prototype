import { GoogleIcon, MapsIcon, MapsLocation01Icon } from '@hugeicons/core-free-icons'
import type { IconSvgElement } from '@hugeicons/react'
import { create } from 'zustand'
import { I } from '@/components/icons'
import type { LabelColor } from '@/data/business'
import { clientById } from '@/data/clients'
import { staffById } from '@/data/staff'
import { NOW, TODAY, addDays, addMinutes } from '@/lib/time'

export type PlatformId = 'instagram' | 'yandex' | '2gis' | 'google' | 'after_visit'
export type PlatformStatus = 'connected' | 'manual' | 'none'

export type Platform = {
  id: PlatformId
  name: string
  icon: IconSvgElement
  status: PlatformStatus
  url: string | null
  shortLink: string | null
  rating: number | null
  reviews: number | null
  steps: string[]
}

export const STATUS_LABEL: Record<PlatformStatus, string> = { connected: 'Connected', manual: 'Set up manually', none: 'Not set up' }

export const PLATFORMS: Platform[] = [
  {
    id: 'instagram',
    name: 'Instagram',
    icon: I.instagram,
    status: 'connected',
    url: 'instagram.com/sitora.beauty',
    shortLink: 'navcrm.tj/r/sitora-ig',
    rating: null,
    reviews: null,
    steps: ['Open your profile and tap Edit profile.', 'Paste the short link into the Website field.', 'Direct messages come to Inbox automatically.'],
  },
  {
    id: 'yandex',
    name: 'Yandex Maps',
    icon: MapsIcon,
    status: 'manual',
    url: 'yandex.com/maps/org/sitora_beauty',
    shortLink: 'navcrm.tj/r/sitora-ya',
    rating: 4.8,
    reviews: 126,
    steps: ['Open Yandex Business and choose your organization.', 'Paste the card text into the description.', 'Add the short link as the booking button.'],
  },
  {
    id: '2gis',
    name: '2GIS',
    icon: MapsLocation01Icon,
    status: 'manual',
    url: '2gis.tj/dushanbe/firm/sitora_beauty',
    shortLink: 'navcrm.tj/r/sitora-2g',
    rating: 4.7,
    reviews: 89,
    steps: ['Sign in to the 2GIS business account.', 'Under Contacts, add the short link as the website.', 'Check opening hours match the card text.'],
  },
  {
    id: 'google',
    name: 'Google Business',
    icon: GoogleIcon,
    status: 'none',
    url: null,
    shortLink: 'navcrm.tj/r/sitora-gg',
    rating: null,
    reviews: null,
    steps: ['Claim your business at business.google.com.', 'Add the short link under Booking.', 'Paste the card text into the description.'],
  },
  {
    id: 'after_visit',
    name: 'Post-visit reviews',
    icon: I.star,
    status: 'connected',
    url: null,
    shortLink: null,
    rating: 4.9,
    reviews: 312,
    steps: ['Clients get a Telegram message 2 hours after their visit.', 'Happy clients (4–5★) are invited to post on Yandex Maps or 2GIS.', 'Unhappy ones reach you privately first.'],
  },
]

type PlatformStore = { platforms: Platform[]; update: (id: PlatformId, patch: Partial<Platform>) => void }

export const usePlatforms = create<PlatformStore>()((set) => ({
  platforms: PLATFORMS,
  update: (id, patch) => set((s) => ({ platforms: s.platforms.map((p) => (p.id === id ? { ...p, ...patch } : p)) })),
}))

export type Period = '7' | '30' | '90'
export const DMS: Record<Period, number> = { '7': 34, '30': 146, '90': 410 }

/* ─────────────── Reviews ─────────────── */

export type ReviewSource = 'after_visit' | 'yandex' | '2gis' | 'google' | 'instagram'

export const SOURCE_LABEL: Record<ReviewSource, string> = {
  after_visit: 'After visit',
  yandex: 'Yandex Maps',
  '2gis': '2GIS',
  google: 'Google',
  instagram: 'Instagram',
}

export type Review = {
  id: string
  rating: number
  text: string
  author: string
  clientId?: string
  source: ReviewSource
  at: Date
  staffId?: string
  reply?: string
}

const INITIAL_REVIEWS: Review[] = [
  {
    id: 'r1',
    rating: 2,
    text: 'Waited 25 minutes past my booked time and nobody told me why. The haircut itself was good, but I had to rush to work right after.',
    author: 'Mavjuda S.',
    source: '2gis',
    at: addMinutes(NOW, -95),
    staffId: 's1',
  },
  { id: 'r2', rating: 5, text: 'Dilnoza is so gentle. First facial in years where my skin didn’t go red afterwards.', author: clientById.c24.name, clientId: 'c24', source: 'after_visit', at: addMinutes(NOW, -170), staffId: 's3' },
  { id: 'r3', rating: 4, text: 'Lovely manicure, the gel lasted three weeks. Parking on Rudaki is hard though.', author: 'Gulnora R.', source: 'yandex', at: addDays(NOW, -2), staffId: 's2' },
  {
    id: 'r4',
    rating: 5,
    text: 'Madina understood exactly what I wanted. Best coloring I’ve had in Dushanbe.',
    author: 'Nilufar Davlatova',
    clientId: 'c1',
    source: 'after_visit',
    at: addDays(NOW, -3),
    staffId: 's1',
    reply: 'Nilufar, thank you! Madina was smiling all evening after reading this. See you at your next appointment.',
  },
  { id: 'r5', rating: 3, text: 'Good service, but prices went up since spring and nobody mentioned it when I booked.', author: 'Farrukh N.', source: 'google', at: addDays(NOW, -4), staffId: 's5' },
  {
    id: 'r6',
    rating: 5,
    text: 'Rustam is the best barber in town. Quick, precise, and never late.',
    author: 'Behruz K.',
    source: '2gis',
    at: addDays(NOW, -6),
    staffId: 's5',
    reply: 'Behruz, thank you for the kind words. Rustam says hi and keeps Saturday mornings open for you.',
  },
  { id: 'r7', rating: 5, text: 'Obsessed with my lashes. Booked again for next month 😍', author: '@laylo.style', source: 'instagram', at: addDays(NOW, -7), staffId: 's4' },
  {
    id: 'r8',
    rating: 1,
    text: 'My booking was moved to another day without asking me first.',
    author: 'Shirin Kholova',
    source: 'after_visit',
    at: addDays(NOW, -9),
    staffId: 's2',
    reply: 'Shirin, you’re right and we’re sorry. Moving a visit must always start with a call to you. We’ve fixed this with the team and added a 10% discount to your next visit.',
  },
  {
    id: 'r9',
    rating: 5,
    text: 'Clean, calm, and they remember how you take your coffee.',
    author: 'Sevara M.',
    source: 'yandex',
    at: addDays(NOW, -12),
    reply: 'Thank you, Sevara! Your coffee will be waiting, no sugar.',
  },
  { id: 'r10', rating: 4, text: 'Massage was great, the room was a little cold though.', author: 'Zebo T.', source: 'after_visit', at: addDays(NOW, -14), staffId: 's6' },
]

type ReviewStore = { reviews: Review[]; reply: (id: string, text: string) => void; add: (r: Review) => void }

export const useReviews = create<ReviewStore>()((set) => ({
  reviews: INITIAL_REVIEWS,
  reply: (id, text) => set((s) => ({ reviews: s.reviews.map((r) => (r.id === id ? { ...r, reply: text } : r)) })),
  add: (r) => set((s) => ({ reviews: [r, ...s.reviews] })),
}))

/** A specific, human draft: names the person and what they said, never a template-sounding apology. */
export function suggestReply(r: Review) {
  const name = r.author.startsWith('@') ? '' : r.author.split(' ')[0]
  const hi = name ? `${name}, ` : ''
  const master = r.staffId ? staffById[r.staffId]?.name.split(' ')[0] : undefined
  if (r.rating <= 2) {
    const detail = /25 minutes/.test(r.text) ? 'Waiting 25 minutes without a word from us isn’t acceptable' : 'This isn’t the experience we want for anyone'
    return `${hi}thank you for telling us, and we’re sorry. ${detail}. We’ve talked with the front desk: if a master runs late, you’ll now get a Telegram message right away. Please write to us at +992 44 600 72 72, we’d like to make it up to you on your next visit.`
  }
  if (r.rating === 3) {
    return `${hi}thank you for the honest feedback. You’re right that we should mention price changes when you book; our admins will do that from now on. We hope to see you again${master ? ` with ${master}` : ''}.`
  }
  return `${hi}thank you so much! ${master ? `${master} will be really happy to read this. ` : ''}We look forward to seeing you again at Sitora Beauty.`
}

/* ─────────────── Portfolio photos ─────────────── */

export type Photo = { id: string; service: string; staffId: string; at: Date; consent: Date; color: LabelColor }

const PHOTO_SEED: [string, string, number][] = [
  ['Balayage', 's1', 2],
  ['Gel polish manicure', 's2', 3],
  ['Lash lamination', 's4', 4],
  ['Facial cleansing', 's3', 6],
  ['Haircut + beard', 's5', 7],
  ['Hair coloring', 's1', 9],
  ['Brow shaping & tint', 's4', 11],
  ['Pedicure', 's2', 13],
  ['Chemical peel', 's3', 16],
  ['Men’s haircut', 's5', 18],
  ['Women’s haircut', 's1', 21],
  ['Lash extensions', 's4', 25],
]

export const PHOTOS: Photo[] = PHOTO_SEED.map(([service, staffId, d], i) => ({
  id: `p${i + 1}`,
  service,
  staffId,
  at: addDays(TODAY, -d),
  consent: addDays(TODAY, -d),
  color: staffById[staffId].color,
}))
