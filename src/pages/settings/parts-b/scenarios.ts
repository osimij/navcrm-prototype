import { formatDate } from '@/lib/format'
import { text as localize } from '@/i18n'
import { TODAY, addDays } from '@/lib/time'
import type { ChannelId } from './shared'

export type Scenario = {
  id: string
  group: string
  name: string
  timing: string
  timingOptions?: string[]
  on: boolean
  channels: ChannelId[]
  text: string
  /** Languages that already have a written text. */
  langs: ('tg' | 'ru' | 'en')[]
  edited: string
}

const ALL: ChannelId[] = ['telegram', 'push', 'sms']
const FREE: ChannelId[] = ['telegram', 'push']

export const SCENARIO_GROUPS = ['Visits', 'After the visit', 'Payments & memberships', 'Orders, rental & lab', 'For staff']

export const SCENARIOS: Scenario[] = [
  { id: 'booked', group: 'Visits', name: 'Visit booked', timing: 'Right after booking', on: true, channels: ALL, langs: ['tg', 'ru', 'en'], edited: '12 Sep', text: 'Hi {first_name}! You’re booked for {service} with {master} on {date} at {time}. {business}, {address}. Change or cancel: {booking_link}' },
  { id: 'confirm', group: 'Visits', name: 'Ask to confirm', timing: 'Day before at 12:00', timingOptions: ['Day before at 12:00', 'Day before at 18:00', '6 h before'], on: true, channels: ALL, langs: ['tg', 'ru', 'en'], edited: '12 Sep', text: '{first_name}, see you tomorrow at {time} for {service}. Tap to confirm, or reschedule here: {booking_link}' },
  { id: 'r24', group: 'Visits', name: 'Reminder', timing: '24 h before', timingOptions: ['48 h before', '24 h before', '12 h before'], on: true, channels: ALL, langs: ['tg', 'ru', 'en'], edited: '3 Aug', text: 'Reminder: tomorrow at {time}, {service} with {master}. {business}, {address}.' },
  { id: 'r2', group: 'Visits', name: 'Reminder', timing: '2 h before', timingOptions: ['3 h before', '2 h before', '1 h before'], on: true, channels: FREE, langs: ['tg', 'ru'], edited: '3 Aug', text: 'See you at {time}! {master} is expecting you. Parking is behind the building.' },
  { id: 'moved', group: 'Visits', name: 'Visit moved', timing: 'When the time changes', on: true, channels: ALL, langs: ['tg', 'ru', 'en'], edited: '3 Aug', text: 'Your visit moved to {date} at {time} with {master}. If this doesn’t suit you: {booking_link}' },
  { id: 'cancelled', group: 'Visits', name: 'Visit cancelled', timing: 'When cancelled', on: true, channels: ALL, langs: ['tg', 'ru', 'en'], edited: '3 Aug', text: 'Your visit on {date} at {time} is cancelled. Book another time: {booking_link}' },
  { id: 'late', group: 'Visits', name: 'Master running late', timing: 'When marked late', on: true, channels: FREE, langs: ['tg', 'ru'], edited: '20 Jul', text: 'Sorry, {master} is running about {minutes} minutes late. We’ll keep your place.' },

  { id: 'review', group: 'After the visit', name: 'Ask for a review', timing: '2 h after the visit', timingOptions: ['1 h after the visit', '2 h after the visit', 'Next morning'], on: true, channels: FREE, langs: ['tg', 'ru', 'en'], edited: '1 Sep', text: 'Thank you for visiting, {first_name}! How was {service} with {master}? Rate us in one tap: {review_link}' },
  { id: 'rebook', group: 'After the visit', name: 'Time to come back', timing: 'By service interval', on: true, channels: FREE, langs: ['tg', 'ru'], edited: '1 Sep', text: '{first_name}, it’s been {days} days since your {service}. {master} has free time this week: {booking_link}' },
  { id: 'birthday', group: 'After the visit', name: 'Birthday greeting', timing: 'On the day at 10:00', on: true, channels: ALL, langs: ['tg', 'ru', 'en'], edited: '15 Jun', text: 'Happy birthday, {first_name}! We added {bonus} TJS to your bonuses, valid for 7 days.' },
  { id: 'checkup', group: 'After the visit', name: 'Planned check-up', timing: 'On the planned date', on: false, channels: FREE, langs: ['ru'], edited: '15 Jun', text: '{first_name}, it’s time for your planned check-up after {service}. Book here: {booking_link}' },
  { id: 'aftercare', group: 'After the visit', name: 'Aftercare and homework', timing: '1 h after the visit', on: false, channels: FREE, langs: ['ru'], edited: '15 Jun', text: 'Aftercare for {service}: {notes}' },

  { id: 'membership', group: 'Payments & memberships', name: 'Membership running out', timing: '2 visits or 5 days left', on: true, channels: FREE, langs: ['tg', 'ru', 'en'], edited: '2 Sep', text: 'Your {membership} has {left} left until {date}. Renew at your next visit and keep the price.' },
  { id: 'debt', group: 'Payments & memberships', name: 'Debt reminder', timing: '3 days after the visit', on: true, channels: ALL, langs: ['tg', 'ru'], edited: '2 Sep', text: '{first_name}, a balance of {amount} TJS is left from your visit on {date}. Pay at your next visit or by Alif.' },
  { id: 'installment', group: 'Payments & memberships', name: 'Installment due', timing: 'Day before payment', on: false, channels: ALL, langs: ['ru'], edited: '2 Sep', text: 'Tomorrow is the next installment of {amount} TJS for {item}.' },
  { id: 'receipt', group: 'Payments & memberships', name: 'Receipt link', timing: 'After payment', on: true, channels: FREE, langs: ['tg', 'ru', 'en'], edited: '2 Sep', text: 'Thank you! Your receipt for {amount} TJS: {receipt_link}' },

  { id: 'order', group: 'Orders, rental & lab', name: 'Order ready', timing: 'When ready', on: true, channels: ALL, langs: ['tg', 'ru'], edited: '9 Aug', text: 'Your order {order} is ready. Pick it up at {address}.' },
  { id: 'lab', group: 'Orders, rental & lab', name: 'Lab results ready', timing: 'When results are in', on: true, channels: FREE, langs: ['tg', 'ru', 'en'], edited: '9 Aug', text: '{first_name}, your results for {tests} are ready: {results_link}' },
  { id: 'waitlist', group: 'Orders, rental & lab', name: 'Free slot for the waiting list', timing: 'When a slot opens', on: true, channels: ALL, langs: ['tg', 'ru', 'en'], edited: '9 Aug', text: 'A time opened up: {date} at {time} with {master}. Book it before someone else does: {booking_link}' },
  { id: 'fitting', group: 'Orders, rental & lab', name: 'Fitting reminder', timing: 'Day before', on: false, channels: FREE, langs: ['ru'], edited: '9 Aug', text: 'Your fitting is tomorrow at {time}.' },
  { id: 'pickup', group: 'Orders, rental & lab', name: 'Rental pickup', timing: 'Day before', on: false, channels: FREE, langs: ['ru'], edited: '9 Aug', text: 'Your rental is ready for pickup tomorrow from {time}.' },
  { id: 'overdue', group: 'Orders, rental & lab', name: 'Overdue return', timing: 'Day after the return date', on: false, channels: ALL, langs: ['ru'], edited: '9 Aug', text: 'The return date for {item} has passed. Please bring it back today.' },
  { id: 'code', group: 'Orders, rental & lab', name: 'Verification code', timing: 'On request', on: true, channels: ['telegram', 'sms'], langs: ['tg', 'ru', 'en'], edited: '9 Aug', text: 'Your NavCRM code: {code}. Don’t share it with anyone.' },

  { id: 'staff-new', group: 'For staff', name: 'New online booking', timing: 'Right away', on: true, channels: FREE, langs: ['tg', 'ru', 'en'], edited: '5 Jul', text: 'New booking: {client}, {service}, {date} at {time}.' },
  { id: 'staff-cancel', group: 'For staff', name: 'Booking cancelled', timing: 'Right away', on: true, channels: FREE, langs: ['tg', 'ru', 'en'], edited: '5 Jul', text: '{client} cancelled {service} on {date} at {time}.' },
  { id: 'staff-move', group: 'For staff', name: 'Booking moved', timing: 'Right away', on: true, channels: FREE, langs: ['tg', 'ru', 'en'], edited: '5 Jul', text: '{client} moved {service} to {date} at {time}.' },
]

export const VARIABLES = ['{first_name}', '{service}', '{master}', '{date}', '{time}', '{business}', '{address}', '{booking_link}']

const SAMPLE: Record<string, string> = {
  '{first_name}': 'Nilufar',
  '{client}': 'Nilufar Davlatova',
  '{service}': 'Hair coloring',
  '{master}': 'Madina',
  '{date}': formatDate(addDays(TODAY, 1), { weekday: true }),
  '{time}': '16:00',
  '{business}': 'Sitora Beauty',
  '{address}': 'Rudaki Ave 72',
  '{booking_link}': 'navcrm.tj/b/s1t',
  '{review_link}': 'navcrm.tj/r/4k2',
  '{receipt_link}': 'navcrm.tj/c/1043',
  '{results_link}': 'navcrm.tj/l/77a',
  '{minutes}': '15',
  '{days}': '35',
  '{bonus}': '100',
  '{amount}': '320',
  '{membership}': '8-visit manicure membership',
  '{left}': '2 visits',
  '{code}': '482 913',
  '{tests}': 'complete blood count',
  '{order}': '#218',
  '{item}': 'evening dress',
  '{notes}': 'avoid washing your hair for 48 hours.',
}

export function fillSample(text: string) {
  return localize(text).replace(/\{[a-z_]+\}/g, (m) => m === '{date}' ? formatDate(addDays(TODAY, 1), { weekday: true }) : localize(SAMPLE[m] ?? m))
}
