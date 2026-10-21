import type { Appointment, VisitStatus } from '@/data/appointments'
import { NOW, isSameDay } from '@/lib/time'

/** The happy path a visit moves through. No-show and cancelled sit outside it. */
export const FLOW: { status: VisitStatus; label: string }[] = [
  { status: 'booked', label: 'Booked' },
  { status: 'confirmed', label: 'Confirmed' },
  { status: 'arrived', label: 'Arrived' },
  { status: 'in_progress', label: 'In progress' },
  { status: 'completed', label: 'Completed' },
]

export type NextStep = { label: string; status?: VisitStatus; checkout?: boolean }

/** The one thing the front desk does next with this visit. */
export function nextStep(a: Appointment): NextStep | null {
  const today = isSameDay(a.start, NOW)
  switch (a.status) {
    case 'booked':
      return { label: 'Confirm visit', status: 'confirmed' }
    case 'confirmed':
      return today ? { label: 'Mark arrived', status: 'arrived' } : null
    case 'arrived':
      return { label: 'Start visit', status: 'in_progress' }
    case 'in_progress':
      return { label: 'Check out', checkout: true }
    default:
      return null
  }
}

export const STATUS_TOAST: Partial<Record<VisitStatus, string>> = {
  confirmed: 'Visit confirmed',
  arrived: 'Marked as arrived',
  in_progress: 'Visit started',
  no_show: 'Marked as no-show',
  cancelled: 'Visit cancelled',
}

/** Visits that are done can't be dragged around the calendar. */
export const isMovable = (a: Appointment) => a.status !== 'completed' && a.status !== 'no_show' && a.status !== 'cancelled'
