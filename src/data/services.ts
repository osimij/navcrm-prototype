import type { LabelColor } from './business'

export type ServiceCategory = 'Hair' | 'Nails' | 'Brows & lashes' | 'Cosmetology' | 'Barber' | 'Massage'

export type Service = {
  id: string
  name: string
  category: ServiceCategory
  duration: number
  price: number
  staffIds: string[]
  color: LabelColor
  onlineBooking: boolean
  /** Consumables written off from stock when the visit completes. */
  techCard?: { productId: string; qty: number }[]
}

export const SERVICE_CATEGORIES: ServiceCategory[] = ['Hair', 'Nails', 'Brows & lashes', 'Cosmetology', 'Barber', 'Massage']

export const services: Service[] = [
  { id: 'v1', name: 'Women’s haircut', category: 'Hair', duration: 60, price: 150, staffIds: ['s1'], color: 'indigo', onlineBooking: true },
  { id: 'v2', name: 'Blow-dry & styling', category: 'Hair', duration: 45, price: 120, staffIds: ['s1'], color: 'indigo', onlineBooking: true },
  { id: 'v3', name: 'Hair coloring', category: 'Hair', duration: 150, price: 450, staffIds: ['s1'], color: 'indigo', onlineBooking: true },
  { id: 'v4', name: 'Balayage', category: 'Hair', duration: 180, price: 650, staffIds: ['s1'], color: 'indigo', onlineBooking: false },
  { id: 'v5', name: 'Manicure', category: 'Nails', duration: 60, price: 90, staffIds: ['s2'], color: 'rose', onlineBooking: true },
  { id: 'v6', name: 'Gel polish manicure', category: 'Nails', duration: 90, price: 160, staffIds: ['s2'], color: 'rose', onlineBooking: true },
  { id: 'v7', name: 'Pedicure', category: 'Nails', duration: 75, price: 150, staffIds: ['s2'], color: 'rose', onlineBooking: true },
  { id: 'v8', name: 'Brow shaping & tint', category: 'Brows & lashes', duration: 45, price: 80, staffIds: ['s4'], color: 'amber', onlineBooking: true },
  { id: 'v9', name: 'Lash lamination', category: 'Brows & lashes', duration: 60, price: 180, staffIds: ['s4'], color: 'amber', onlineBooking: true },
  { id: 'v10', name: 'Lash extensions', category: 'Brows & lashes', duration: 120, price: 300, staffIds: ['s4'], color: 'amber', onlineBooking: true },
  { id: 'v11', name: 'Facial cleansing', category: 'Cosmetology', duration: 75, price: 300, staffIds: ['s3'], color: 'teal', onlineBooking: true },
  { id: 'v12', name: 'Chemical peel', category: 'Cosmetology', duration: 45, price: 350, staffIds: ['s3'], color: 'teal', onlineBooking: true },
  { id: 'v13', name: 'Biorevitalization', category: 'Cosmetology', duration: 45, price: 900, staffIds: ['s3'], color: 'teal', onlineBooking: false },
  { id: 'v14', name: 'Men’s haircut', category: 'Barber', duration: 45, price: 70, staffIds: ['s5'], color: 'sky', onlineBooking: true },
  { id: 'v15', name: 'Beard trim', category: 'Barber', duration: 30, price: 50, staffIds: ['s5'], color: 'sky', onlineBooking: true },
  { id: 'v16', name: 'Haircut + beard', category: 'Barber', duration: 60, price: 110, staffIds: ['s5'], color: 'sky', onlineBooking: true },
  { id: 'v17', name: 'Back massage', category: 'Massage', duration: 45, price: 180, staffIds: ['s6'], color: 'violet', onlineBooking: true },
  { id: 'v18', name: 'Full body massage', category: 'Massage', duration: 90, price: 320, staffIds: ['s6'], color: 'violet', onlineBooking: true },
]

export const serviceById = Object.fromEntries(services.map((s) => [s.id, s])) as Record<string, Service>

export const servicesFor = (staffId: string) => services.filter((s) => s.staffIds.includes(staffId))
