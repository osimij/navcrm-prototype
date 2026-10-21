import type { IconSvgElement } from '@hugeicons/react'
import { I } from '@/components/icons'
import { birthdaySoon, type Client } from '@/data/clients'
import { staffById } from '@/data/staff'
import { business } from '@/data/business'
import { TODAY, addDays, daysBetween } from '@/lib/time'

/* ─────────────── Segments ─────────────── */

export type SegmentId = 'lost60' | 'birthday' | 'vip' | 'lost' | 'regular' | 'new'

export type Segment = { id: SegmentId; name: string; description: string; match: (c: Client) => boolean }

export const SEGMENTS: Segment[] = [
  {
    id: 'lost60',
    name: 'Haven’t visited in 60 days',
    description: 'Came at least twice, last visit over 60 days ago',
    match: (c) => c.visits >= 2 && !!c.lastVisit && daysBetween(c.lastVisit, TODAY) > 60,
  },
  { id: 'birthday', name: 'Birthday this week', description: 'Birthday in the next 7 days', match: (c) => birthdaySoon(c) },
  { id: 'vip', name: 'VIP clients', description: 'Spent the most in the last year', match: (c) => c.category === 'vip' },
  { id: 'regular', name: 'Regular clients', description: '3 or more visits', match: (c) => c.category === 'regular' },
  { id: 'new', name: 'New clients', description: 'One visit so far', match: (c) => c.category === 'new' },
  { id: 'lost', name: 'Lost clients', description: 'Auto category: no visit for a long time', match: (c) => c.category === 'lost' },
]

export const segmentById = Object.fromEntries(SEGMENTS.map((s) => [s.id, s])) as Record<SegmentId, Segment>

/** Deterministic "messaged in the last 7 days" flag: we never message the same client twice a week. */
export function messagedRecently(c: Client) {
  const n = Number(c.id.replace(/\D/g, '')) || 0
  return n % 17 === 3 || n % 23 === 5
}

export type Audience = { mode: 'segment' | 'all' | 'pick'; segmentId: SegmentId; picked: string[] }

export function resolveAudience(clients: Client[], a: Audience) {
  const base = clients.filter((c) => !c.archived)
  const matched =
    a.mode === 'all' ? base : a.mode === 'segment' ? base.filter(segmentById[a.segmentId].match) : base.filter((c) => a.picked.includes(c.id))
  const noConsent = matched.filter((c) => !c.consentMarketing)
  const recent = matched.filter((c) => c.consentMarketing && messagedRecently(c))
  const recipients = matched.filter((c) => c.consentMarketing && !messagedRecently(c))
  return { matched, noConsent, recent, recipients }
}

/* ─────────────── Channels ─────────────── */

export type ChannelId = 'telegram' | 'push' | 'sms' | 'whatsapp'

export const CHANNELS: { id: ChannelId; name: string; icon: IconSvgElement; price: number; note: string }[] = [
  { id: 'telegram', name: 'Telegram', icon: I.telegram, price: 0, note: 'Free · clients who connected the bot' },
  { id: 'push', name: 'Push', icon: I.bell, price: 0, note: 'Free · clients with the booking app' },
  { id: 'sms', name: 'SMS', icon: I.message, price: 0.15, note: '0.15 TJS per message' },
  { id: 'whatsapp', name: 'WhatsApp', icon: I.whatsapp, price: 0.3, note: '0.30 TJS per message' },
]

export const channelById = Object.fromEntries(CHANNELS.map((c) => [c.id, c])) as Record<ChannelId, (typeof CHANNELS)[number]>

/** Does this client have the booking app? Roughly a third of non-Telegram clients do. */
const hasPush = (c: Client) => (Number(c.id.replace(/\D/g, '')) || 0) % 3 === 0

/**
 * The chain: each client gets the message once, through the first enabled
 * channel that reaches them. Telegram and push are free; SMS and WhatsApp cost money.
 */
export function routeMessages(recipients: Client[], enabled: Record<ChannelId, boolean>, smsParts = 1) {
  const counts: Record<ChannelId, number> = { telegram: 0, push: 0, sms: 0, whatsapp: 0 }
  let unreached = 0
  for (const c of recipients) {
    if (enabled.telegram && c.telegram) counts.telegram++
    else if (enabled.push && hasPush(c)) counts.push++
    else if (enabled.sms) counts.sms++
    else if (enabled.whatsapp) counts.whatsapp++
    else unreached++
  }
  const cost = counts.sms * channelById.sms.price * smsParts + counts.whatsapp * channelById.whatsapp.price
  return { counts, unreached, cost: Math.round(cost * 100) / 100 }
}

/** SMS length: Cyrillic or emoji forces UCS-2 (70 chars), Latin fits 160. */
export function smsParts(text: string) {
  const unicode = /[^\u0000-\u007F]/.test(text)
  const single = unicode ? 70 : 160
  const multi = unicode ? 67 : 153
  return text.length <= single ? 1 : Math.ceil(text.length / multi)
}

/* ─────────────── Message variables ─────────────── */

export const VARIABLES = [
  { key: '{first_name}', label: 'First name' },
  { key: '{booking_link}', label: 'Booking link' },
  { key: '{bonus_balance}', label: 'Bonus balance' },
  { key: '{master}', label: 'Their master' },
]

export function fillMessage(text: string, c: Client | undefined, promo?: { code: string; percent: number; until: Date }) {
  const master = c ? staffById[c.favoriteStaffId]?.name.split(' ')[0] : 'Madina'
  let out = text
    .replaceAll('{first_name}', c?.firstName ?? 'Nilufar')
    .replaceAll('{booking_link}', business.bookingLink)
    .replaceAll('{bonus_balance}', `${c?.bonuses ?? 0} TJS`)
    .replaceAll('{master}', master ?? 'Madina')
  if (promo) out = out.replaceAll('{promo_code}', promo.code)
  return out
}

export const TEMPLATES: Record<SegmentId | 'all', string> = {
  lost60: 'Hi {first_name}! We haven’t seen you in a while at Sitora Beauty. {master} has free time this week. Book in one tap: {booking_link}',
  birthday: 'Happy birthday, {first_name}! A small gift from Sitora Beauty: −15% on any service this week. Book: {booking_link}',
  vip: '{first_name}, you’re one of our favourite guests. We’ve opened lash lamination with Shahlo, and you can try it first: {booking_link}',
  regular: 'Hi {first_name}! You have {bonus_balance} in bonuses at Sitora Beauty. Use them on your next visit: {booking_link}',
  new: 'Thank you for your first visit, {first_name}! Come back within a month and get −10% on your next one: {booking_link}',
  lost: 'Hi {first_name}, we miss you at Sitora Beauty. {master} would be glad to see you again: {booking_link}',
  all: 'Hi {first_name}! News from Sitora Beauty: {booking_link}',
}

/* ─────────────── Campaigns ─────────────── */

export type CampaignStatus = 'draft' | 'scheduled' | 'sending' | 'sent' | 'stopped' | 'failed'

export const STATUS_LABEL: Record<CampaignStatus, string> = {
  draft: 'Draft',
  scheduled: 'Scheduled',
  sending: 'Sending',
  sent: 'Sent',
  stopped: 'Stopped',
  failed: 'Failed',
}

export const STATUS_TONE: Record<CampaignStatus, 'neutral' | 'accent' | 'positive' | 'warning' | 'negative'> = {
  draft: 'neutral',
  scheduled: 'accent',
  sending: 'accent',
  sent: 'positive',
  stopped: 'warning',
  failed: 'negative',
}

export type Campaign = {
  id: string
  name: string
  status: CampaignStatus
  audienceLabel: string
  segmentId?: SegmentId
  recipients: number
  channels: ChannelId[]
  /** Messages per channel. */
  byChannel: Partial<Record<ChannelId, number>>
  date: Date | null
  delivered: number
  booked: number
  cameBack: number
  revenue: number
  cost: number
  message: string
  promo?: { code: string; percent: number; days: number }
  note?: string
}

export const initialCampaigns: Campaign[] = [
  {
    id: 'k1',
    name: 'Win back: 60 days away',
    status: 'sent',
    audienceLabel: 'Haven’t visited in 60 days',
    segmentId: 'lost60',
    recipients: 46,
    channels: ['telegram', 'sms'],
    byChannel: { telegram: 29, sms: 17 },
    date: addDays(TODAY, -12),
    delivered: 44,
    booked: 9,
    cameBack: 7,
    revenue: 2340,
    cost: 2.55,
    message: TEMPLATES.lost60,
  },
  {
    id: 'k2',
    name: 'Birthday week −15%',
    status: 'sent',
    audienceLabel: 'Birthday this week',
    segmentId: 'birthday',
    recipients: 11,
    channels: ['telegram', 'push', 'sms'],
    byChannel: { telegram: 7, push: 2, sms: 2 },
    date: addDays(TODAY, -5),
    delivered: 11,
    booked: 5,
    cameBack: 4,
    revenue: 1120,
    cost: 0.3,
    message: TEMPLATES.birthday,
    promo: { code: 'BDAY15', percent: 15, days: 7 },
  },
  {
    id: 'k3',
    name: 'Autumn coloring with Madina',
    status: 'sent',
    audienceLabel: 'Regular clients',
    segmentId: 'regular',
    recipients: 182,
    channels: ['telegram', 'sms'],
    byChannel: { telegram: 118, sms: 64 },
    date: addDays(TODAY, -31),
    delivered: 176,
    booked: 29,
    cameBack: 23,
    revenue: 9870,
    cost: 19.2,
    message: 'Hi {first_name}! Autumn is the time to refresh your colour. {master} has opened Saturday mornings for coloring: {booking_link}',
  },
  {
    id: 'k4',
    name: 'VIP preview: lash lamination',
    status: 'scheduled',
    audienceLabel: 'VIP clients',
    segmentId: 'vip',
    recipients: 12,
    channels: ['telegram', 'push'],
    byChannel: { telegram: 9, push: 3 },
    date: new Date(addDays(TODAY, 1).setHours(10, 0, 0, 0)),
    delivered: 0,
    booked: 0,
    cameBack: 0,
    revenue: 0,
    cost: 0,
    message: TEMPLATES.vip,
  },
  {
    id: 'k5',
    name: 'Second visit −10%',
    status: 'draft',
    audienceLabel: 'New clients',
    segmentId: 'new',
    recipients: 27,
    channels: ['telegram', 'sms'],
    byChannel: {},
    date: null,
    delivered: 0,
    booked: 0,
    cameBack: 0,
    revenue: 0,
    cost: 0,
    message: TEMPLATES.new,
    promo: { code: 'BACK10', percent: 10, days: 30 },
  },
  {
    id: 'k6',
    name: 'We miss you',
    status: 'stopped',
    audienceLabel: 'Lost clients',
    segmentId: 'lost',
    recipients: 38,
    channels: ['telegram', 'sms'],
    byChannel: { telegram: 21, sms: 17 },
    date: addDays(TODAY, -19),
    delivered: 36,
    booked: 3,
    cameBack: 2,
    revenue: 610,
    cost: 2.55,
    message: TEMPLATES.lost,
    note: 'Stopped by Zarina after 38 of 61 messages: the master went on leave.',
  },
  {
    id: 'k7',
    name: 'Facial cleansing season',
    status: 'sent',
    audienceLabel: 'All clients',
    recipients: 109,
    channels: ['telegram', 'push', 'sms'],
    byChannel: { telegram: 71, push: 12, sms: 26 },
    date: addDays(TODAY, -46),
    delivered: 104,
    booked: 21,
    cameBack: 18,
    revenue: 5400,
    cost: 3.9,
    message: 'Hi {first_name}! After summer your skin needs a reset. Facial cleansing with Dilnoza, 300 TJS: {booking_link}',
  },
  {
    id: 'k8',
    name: 'WhatsApp reminder test',
    status: 'failed',
    audienceLabel: 'Picked clients',
    recipients: 5,
    channels: ['whatsapp'],
    byChannel: { whatsapp: 5 },
    date: addDays(TODAY, -2),
    delivered: 0,
    booked: 0,
    cameBack: 0,
    revenue: 0,
    cost: 0,
    message: 'Hi {first_name}! Testing our new WhatsApp number.',
    note: 'Not sent: the balance for paid channels was empty. Top up in Plan & billing.',
  },
]

/* ─────────────── Discount cards ─────────────── */

export type DiscountCard = {
  id: string
  name: string
  target: string
  holders: number
  percent: number
  issued: Date
  uses: number
}

export const initialCards: DiscountCard[] = [
  { id: 'd1', name: 'VIP card', target: 'VIP clients', holders: 12, percent: 10, issued: addDays(TODAY, -120), uses: 31 },
  { id: 'd2', name: 'Regular card', target: 'Regular clients', holders: 118, percent: 5, issued: addDays(TODAY, -200), uses: 214 },
  { id: 'd3', name: 'Family of staff', target: '8 picked clients', holders: 8, percent: 20, issued: addDays(TODAY, -64), uses: 17 },
  { id: 'd4', name: 'Nilufar Davlatova', target: 'Personal card', holders: 1, percent: 15, issued: addDays(TODAY, -30), uses: 3 },
]

export function promoCode(prefix: string, percent: number) {
  return `${prefix}${percent}`
}
