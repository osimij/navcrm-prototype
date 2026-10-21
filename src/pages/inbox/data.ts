import { clientById } from '@/data/clients'
import { NOW, addMinutes } from '@/lib/time'

export type Channel = 'telegram' | 'whatsapp' | 'instagram' | 'web'

export const CHANNEL_LABEL: Record<Channel, string> = {
  telegram: 'Telegram',
  whatsapp: 'WhatsApp',
  instagram: 'Instagram',
  web: 'Booking page',
}

export type Message = {
  id: string
  from: 'client' | 'staff' | 'assistant' | 'system'
  at: Date
  text?: string
  staffId?: string
  /** Voice notes, photos and files arrive from messengers too. */
  kind?: 'voice' | 'photo' | 'file'
  duration?: string
  file?: { name: string; size: string }
  /** Added during this session: gets a one-time entrance. */
  fresh?: boolean
}

export type Conversation = {
  id: string
  clientId: string
  channel: Channel
  handle?: string
  assigneeId: string | null
  status: 'open' | 'closed'
  /** The client-facing assistant is answering until a person takes over. */
  ai: boolean
  unread: number
  messages: Message[]
}

let n = 0
const m = (from: Message['from'], minsAgo: number, text: string, extra: Partial<Message> = {}): Message => ({
  id: `m${++n}`,
  from,
  at: addMinutes(NOW, -minsAgo),
  text,
  ...extra,
})

const first = (id: string) => clientById[id]?.firstName ?? 'there'

export const initialConversations: Conversation[] = [
  {
    id: 'cv1',
    clientId: 'c17',
    channel: 'instagram',
    handle: `@${first('c17').toLowerCase()}.k`,
    assigneeId: null,
    status: 'open',
    ai: true,
    unread: 0,
    messages: [
      m('client', 52, 'Hi! How much is lash lamination? Do you have anything today?'),
      m('assistant', 51, 'Hi! Lash lamination is 180 TJS and takes about an hour. Today Shahlo is free at 15:30 or 17:00. Which works for you?'),
      m('client', 47, '15:30 please'),
      m('system', 47, 'Assistant booked Lash lamination · Today 15:30 with Shahlo'),
      m('assistant', 46, 'Done, see you at 15:30 at Rudaki Ave 72. I’ll send you a reminder an hour before.'),
      m('client', 44, 'Thank you!'),
    ],
  },
  {
    id: 'cv2',
    clientId: 'c1',
    channel: 'telegram',
    handle: '@nilufar_d',
    assigneeId: 's7',
    status: 'open',
    ai: false,
    unread: 1,
    messages: [
      m('client', 38, 'Hi Nigora, I’m running about 10 minutes late for my 16:00 today. Is that okay?'),
      m('staff', 35, 'Of course, Madina will wait for you.', { staffId: 's7' }),
      m('client', 6, 'Thank you. Can she do the same shade as last time? 7.1'),
    ],
  },
  {
    id: 'cv3',
    clientId: 'c2',
    channel: 'whatsapp',
    assigneeId: null,
    status: 'open',
    ai: false,
    unread: 2,
    messages: [
      m('staff', 60 * 26, 'Hi Mehrona, a reminder that 320 TJS is left to pay for your last visit.', { staffId: 's7' }),
      m('client', 14, '', { kind: 'voice', duration: '0:14' }),
      m('client', 13, 'Can I pay the rest on Saturday when I come for my nails?'),
    ],
  },
  {
    id: 'cv4',
    clientId: 'c11',
    channel: 'telegram',
    assigneeId: 's0',
    status: 'open',
    ai: false,
    unread: 1,
    messages: [
      m('client', 60 * 20, 'I had a 12:00 booking yesterday and waited 25 minutes. This is the second time.'),
      m('staff', 60 * 19 + 40, 'I’m very sorry about that. I’m passing this to our manager right now.', { staffId: 's7' }),
      m('system', 60 * 19 + 39, 'Nigora assigned this conversation to Zarina'),
      m('client', 22, 'Still waiting for an answer.'),
    ],
  },
  {
    id: 'cv5',
    clientId: 'c30',
    channel: 'telegram',
    assigneeId: null,
    status: 'open',
    ai: false,
    unread: 1,
    messages: [
      m('client', 140, 'Hello, are my blood test results ready?'),
      m('assistant', 139, 'Yes, your complete blood count is ready. Here is the PDF.'),
      m('assistant', 139, '', { kind: 'file', file: { name: 'CBC_results.pdf', size: '118 KB' } }),
      m('client', 31, 'One value is marked as high. Should I worry?'),
      m('assistant', 30, 'I can’t interpret results, so I’ve asked our team to reply. Someone will write to you shortly.'),
      m('system', 30, 'Assistant handed the conversation to the team'),
    ],
  },
  {
    id: 'cv6',
    clientId: 'c41',
    channel: 'web',
    assigneeId: 's7',
    status: 'open',
    ai: false,
    unread: 1,
    messages: [
      m('client', 95, 'Do you do balayage on long hair? How much?'),
      m('staff', 90, 'Yes, from 650 TJS depending on length and thickness. Would you like a free 15-minute consultation with Madina first?', { staffId: 's7' }),
      m('client', 18, 'Yes please. Saturday morning?'),
    ],
  },
  {
    id: 'cv7',
    clientId: 'c3',
    channel: 'telegram',
    handle: '@farzona.h',
    assigneeId: null,
    status: 'open',
    ai: true,
    unread: 0,
    messages: [
      m('client', 75, 'Can I come at 12 instead of 10 tomorrow?'),
      m('assistant', 74, 'Madina is free at 12:15 tomorrow. Shall I move your haircut and blow-dry there?'),
      m('client', 72, 'Yes'),
      m('system', 72, 'Assistant moved Women’s haircut + Blow-dry to Tomorrow 12:15'),
      m('assistant', 72, 'Done. Tomorrow at 12:15 with Madina.'),
    ],
  },
  {
    id: 'cv8',
    clientId: 'c55',
    channel: 'instagram',
    handle: `@${first('c55').toLowerCase()}_nails`,
    assigneeId: null,
    status: 'open',
    ai: false,
    unread: 1,
    messages: [
      m('client', 130, '', { kind: 'photo' }),
      m('client', 130, 'Can you do this design?'),
      m('staff', 120, 'Yes! That’s gel polish with hand-painted art, about 2 hours, 220 TJS. Firuza does it best.', { staffId: 's7' }),
      m('client', 9, 'Great, book me for Friday after 17:00'),
    ],
  },
  {
    id: 'cv9',
    clientId: 'c63',
    channel: 'telegram',
    assigneeId: null,
    status: 'open',
    ai: true,
    unread: 0,
    messages: [
      m('client', 60 * 49, 'Is Rustam working on Sunday?'),
      m('assistant', 60 * 49 - 1, 'Rustam is off on Sundays. On Saturday he’s free at 11:00 and 15:30. Want me to book one?'),
      m('client', 60 * 48, 'Not yet, I’ll let you know'),
    ],
  },
  {
    id: 'cv10',
    clientId: 'c12',
    channel: 'telegram',
    assigneeId: 's7',
    status: 'closed',
    ai: false,
    unread: 0,
    messages: [
      m('client', 60 * 22, 'Thank you, everything was great yesterday!'),
      m('staff', 60 * 22 - 5, 'Thank you for coming! See you next time.', { staffId: 's7' }),
    ],
  },
  {
    id: 'cv11',
    clientId: 'c19',
    channel: 'whatsapp',
    assigneeId: 's7',
    status: 'closed',
    ai: false,
    unread: 0,
    messages: [
      m('client', 60 * 75, 'Do you sell gift certificates?'),
      m('staff', 60 * 74, 'Yes, for any amount from 200 TJS or for a specific service. They’re valid for 3 months.', { staffId: 's7' }),
      m('client', 60 * 73, 'Great, I’ll come by tomorrow to buy one.'),
    ],
  },
]

export const QUICK_REPLIES = [
  { label: 'Address and hours', text: 'We’re at Rudaki Ave 72, Dushanbe. Open every day 09:00–21:00.' },
  { label: 'Price list', text: 'Here are our prices: navcrm.tj/book/sitora/prices' },
  { label: 'Booking link', text: 'You can pick a time here: navcrm.tj/book/sitora' },
  { label: 'Running late', text: 'No problem, we’ll wait for you. Please let us know if you’re more than 15 minutes late.' },
]
