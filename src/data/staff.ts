import type { LabelColor } from './business'

export type StaffRole = 'Owner' | 'Administrator' | 'Master' | 'Tenant' | 'Lab technician'

export type Staff = {
  id: string
  /** Empty for invited staff who haven't set up their profile yet. */
  name: string
  phone: string
  role: StaffRole
  position: string
  color: LabelColor
  bookable: boolean
  branchIds: string[]
  /** Working hours today, null when off. */
  today: { start: string; end: string; break?: { start: string; end: string } } | null
  tenant?: boolean
  invited?: boolean
  rating?: number
}

export const staff: Staff[] = [
  { id: 's0', name: 'Zarina Karimova', phone: '+992935551020', role: 'Owner', position: 'Owner', color: 'slate', bookable: false, branchIds: ['b1', 'b2'], today: { start: '09:00', end: '18:00' } },
  { id: 's1', name: 'Madina Rahimova', phone: '+992934120056', role: 'Master', position: 'Hair stylist', color: 'indigo', bookable: true, branchIds: ['b1'], today: { start: '09:00', end: '19:00', break: { start: '13:00', end: '13:30' } }, rating: 4.9 },
  { id: 's2', name: 'Firuza Saidova', phone: '+992918804411', role: 'Master', position: 'Nail artist', color: 'rose', bookable: true, branchIds: ['b1'], today: { start: '10:00', end: '20:00', break: { start: '14:00', end: '14:30' } }, rating: 4.8 },
  { id: 's3', name: 'Dilnoza Nazarova', phone: '+992901237788', role: 'Master', position: 'Cosmetologist', color: 'teal', bookable: true, branchIds: ['b1'], today: { start: '09:00', end: '18:00', break: { start: '12:30', end: '13:00' } }, rating: 5.0 },
  { id: 's4', name: 'Shahlo Umarova', phone: '+992985553321', role: 'Master', position: 'Brow & lash artist', color: 'amber', bookable: true, branchIds: ['b1'], today: { start: '11:00', end: '20:00' }, rating: 4.9 },
  { id: 's5', name: 'Rustam Ismoilov', phone: '+992927770909', role: 'Master', position: 'Barber', color: 'sky', bookable: true, branchIds: ['b1', 'b2'], today: { start: '10:00', end: '20:00', break: { start: '15:00', end: '15:30' } }, rating: 4.7 },
  { id: 's6', name: 'Parvina Kurbonova', phone: '+992557003344', role: 'Tenant', position: 'Massage therapist', color: 'violet', bookable: true, branchIds: ['b1'], today: { start: '12:00', end: '20:00' }, tenant: true, rating: 4.8 },
  { id: 's7', name: 'Nigora Alieva', phone: '+992931112233', role: 'Administrator', position: 'Front desk', color: 'green', bookable: false, branchIds: ['b1'], today: { start: '09:00', end: '21:00' } },
  { id: 's8', name: 'Malika Yusupova', phone: '+992886665544', role: 'Lab technician', position: 'Lab technician', color: 'orange', bookable: false, branchIds: ['b1'], today: { start: '08:00', end: '16:00' } },
  { id: 's9', name: '', phone: '+992907771234', role: 'Master', position: 'Nail artist', color: 'rose', bookable: false, branchIds: ['b1'], today: null, invited: true },
]

export const staffById = Object.fromEntries(staff.map((s) => [s.id, s])) as Record<string, Staff>

/** Masters who take bookings and work today: these are the calendar columns. */
export const bookableStaff = staff.filter((s) => s.bookable)

export function staffName(s: Staff) {
  return s.name || 'Invited staff member'
}

export function firstName(s: Staff) {
  return s.name ? s.name.split(' ')[0] : 'Invited'
}
