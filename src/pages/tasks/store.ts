import { SmileIcon } from '@hugeicons/core-free-icons'
import type { IconSvgElement } from '@hugeicons/react'
import { create } from 'zustand'
import { I } from '@/components/icons'
import { NOW, TODAY, addDays, addMinutes, at } from '@/lib/time'

export type TaskType = 'call' | 'renewal' | 'review' | 'checkin' | 'conflict' | 'chat' | 'other'
/** Tasks the system creates from events, not people. */
export type TaskSource = 'review' | 'conflict' | 'chat' | 'membership'

export type TaskComment = { id: string; author: string; text: string; at: Date }

export type Task = {
  id: string
  title: string
  type: TaskType
  due: Date
  assigneeId: string
  clientId?: string
  details?: string
  source?: TaskSource
  done: boolean
  doneAt?: Date
  createdAt: Date
  createdBy: string
  comments: TaskComment[]
}

export const TYPE_META: Record<TaskType, { label: string; icon: IconSvgElement }> = {
  call: { label: 'Call back', icon: I.phone },
  renewal: { label: 'Membership renewal', icon: I.repeat },
  review: { label: 'Bad review', icon: I.star },
  checkin: { label: 'Check in', icon: SmileIcon },
  conflict: { label: 'Booking conflict', icon: I.calendarBlock },
  chat: { label: 'Chat question', icon: I.message },
  other: { label: 'Other', icon: I.tasks },
}

export const SOURCE_LABEL: Record<TaskSource, string> = {
  review: 'From 2★ review',
  conflict: 'From booking conflict',
  chat: 'From chat',
  membership: 'Membership ending',
}

/** The signed-in owner. "Mine" filters by this. */
export const ME = 's0'

const y = addDays(TODAY, -1)
const t1 = addDays(TODAY, 1)

const INITIAL: Task[] = [
  {
    id: 't1',
    title: 'Reply to the 2★ review on 2GIS and call the client',
    type: 'review',
    source: 'review',
    due: at(y, '18:00'),
    assigneeId: 's0',
    clientId: 'c41',
    details: '“Waited 25 minutes past my time.” Rustam was running late after a walk-in. Offer a free beard trim on the next visit.',
    done: false,
    createdAt: at(y, '16:05'),
    createdBy: 'NavCRM',
    comments: [{ id: 'k1', author: 'Nigora Alieva', text: 'She prefers WhatsApp, not calls.', at: at(y, '16:40') }],
  },
  {
    id: 't2',
    title: 'Ask Shabnam why she stopped coming',
    type: 'checkin',
    due: at(TODAY, '11:00'),
    assigneeId: 's7',
    clientId: 'c8',
    details: 'Lost client: last visit 73 days ago. Usually came every 3 weeks for coloring.',
    done: false,
    createdAt: addDays(NOW, -3),
    createdBy: 'Zarina Karimova',
    comments: [],
  },
  {
    id: 't3',
    title: 'Agree a date for Mehrona to pay her debt',
    type: 'call',
    due: at(TODAY, '12:30'),
    assigneeId: 's7',
    clientId: 'c2',
    details: 'Owes 320 TJS from the gel polish visit on the 9th.',
    done: false,
    createdAt: addDays(NOW, -5),
    createdBy: 'Zarina Karimova',
    comments: [],
  },
  {
    id: 't4',
    title: 'Call Farzona back about a bridal makeup trial',
    type: 'call',
    due: at(TODAY, '15:00'),
    assigneeId: 's7',
    clientId: 'c3',
    done: false,
    createdAt: addMinutes(NOW, -95),
    createdBy: 'Nigora Alieva',
    comments: [],
  },
  {
    id: 't5',
    title: 'Two bookings for Rustam at 18:00: move one',
    type: 'conflict',
    source: 'conflict',
    due: at(TODAY, '16:30'),
    assigneeId: 's0',
    details: 'Booked offline on two devices. The second visit was moved to 18:45 automatically; confirm with the client.',
    done: false,
    createdAt: addMinutes(NOW, -40),
    createdBy: 'NavCRM',
    comments: [],
  },
  {
    id: 't6',
    title: 'Answer a question about lash extension aftercare',
    type: 'chat',
    source: 'chat',
    due: at(TODAY, '18:00'),
    assigneeId: 's4',
    clientId: 'c17',
    details: 'Asked in Instagram Direct: “Can I wash my face the same day?” The assistant passed it to a person.',
    done: false,
    createdAt: addMinutes(NOW, -25),
    createdBy: 'NavCRM',
    comments: [],
  },
  {
    id: 't7',
    title: 'Offer to renew the 8-visit manicure membership',
    type: 'renewal',
    source: 'membership',
    due: at(t1, '10:00'),
    assigneeId: 's7',
    clientId: 'c11',
    details: '1 visit left, expires on Sunday.',
    done: false,
    createdAt: addDays(NOW, -1),
    createdBy: 'NavCRM',
    comments: [],
  },
  {
    id: 't8',
    title: 'Order gel polish base from Nail Pro Supply',
    type: 'other',
    due: at(t1, '12:00'),
    assigneeId: 's0',
    done: false,
    createdAt: addMinutes(NOW, -260),
    createdBy: 'Zarina Karimova',
    comments: [],
  },
  {
    id: 't9',
    title: 'Ask Nilufar how the new shade held up',
    type: 'checkin',
    due: at(addDays(TODAY, 3), '11:00'),
    assigneeId: 's1',
    clientId: 'c1',
    done: false,
    createdAt: addDays(NOW, -9),
    createdBy: 'Madina Rahimova',
    comments: [],
  },
  {
    id: 't10',
    title: 'Plan the December schedule with the masters',
    type: 'other',
    due: at(addDays(TODAY, 5), '10:00'),
    assigneeId: 's0',
    done: false,
    createdAt: addDays(NOW, -2),
    createdBy: 'Zarina Karimova',
    comments: [],
  },
  {
    id: 't11',
    title: 'Call Dildora to move her Saturday visit',
    type: 'call',
    due: at(y, '17:00'),
    assigneeId: 's7',
    clientId: 'c5',
    done: true,
    doneAt: at(y, '16:20'),
    createdAt: addDays(NOW, -2),
    createdBy: 'Nigora Alieva',
    comments: [],
  },
  {
    id: 't12',
    title: 'Send the price list to the corporate client',
    type: 'other',
    due: at(TODAY, '12:00'),
    assigneeId: 's0',
    done: true,
    doneAt: at(TODAY, '10:15'),
    createdAt: addDays(NOW, -1),
    createdBy: 'Zarina Karimova',
    comments: [],
  },
]

type TasksState = {
  tasks: Task[]
  add: (t: Omit<Task, 'id' | 'done' | 'createdAt' | 'createdBy' | 'comments'>) => Task
  setDone: (id: string, done: boolean) => void
  update: (id: string, patch: Partial<Task>) => void
  comment: (id: string, text: string) => void
}

export const useTasks = create<TasksState>()((set) => ({
  tasks: INITIAL,
  add: (t) => {
    const task: Task = { ...t, id: `t${Date.now()}`, done: false, createdAt: NOW, createdBy: 'Zarina Karimova', comments: [] }
    set((s) => ({ tasks: [task, ...s.tasks] }))
    return task
  },
  setDone: (id, done) => set((s) => ({ tasks: s.tasks.map((t) => (t.id === id ? { ...t, done, doneAt: done ? NOW : undefined } : t)) })),
  update: (id, patch) => set((s) => ({ tasks: s.tasks.map((t) => (t.id === id ? { ...t, ...patch } : t)) })),
  comment: (id, text) =>
    set((s) => ({
      tasks: s.tasks.map((t) =>
        t.id === id ? { ...t, comments: [...t.comments, { id: `k${Date.now()}`, author: 'Zarina Karimova', text, at: NOW }] } : t,
      ),
    })),
}))

export const isOverdue = (t: Task) => !t.done && t.due < NOW

export function timeOptions() {
  const out: { value: string; label: string }[] = []
  for (let m = 8 * 60; m <= 21 * 60; m += 30) {
    const v = `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`
    out.push({ value: v, label: v })
  }
  return out
}
