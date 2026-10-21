export type LabelColor = 'indigo' | 'sky' | 'teal' | 'green' | 'amber' | 'orange' | 'rose' | 'violet' | 'slate'

export const LABEL_COLORS: LabelColor[] = ['indigo', 'sky', 'teal', 'green', 'amber', 'orange', 'rose', 'violet', 'slate']

/** CSS value for a label color, e.g. for `style={{ '--label': labelVar('rose') }}` */
export const labelVar = (c: LabelColor) => `var(--c-${c})`

export type Branch = {
  id: string
  name: string
  address: string
  phone: string
  hours: string
}

export const business = {
  name: 'Sitora Beauty',
  legalName: 'LLC “Sitora Beauty”',
  tin: '520 147 863',
  city: 'Dushanbe',
  phone: '+992 44 600 72 72',
  email: 'hello@sitora.tj',
  bookingLink: 'navcrm.tj/book/sitora',
  spheres: ['Beauty salon', 'Cosmetology', 'Laboratory'],
  plan: 'Per visit',
  pricePerVisit: 1.5,
  branches: [
    { id: 'b1', name: 'Rudaki 72', address: 'Rudaki Ave 72, Dushanbe', phone: '+992 44 600 72 72', hours: '09:00–21:00' },
    { id: 'b2', name: 'Somoni 14', address: 'Ismoili Somoni Ave 14, Dushanbe', phone: '+992 44 600 14 14', hours: '10:00–20:00' },
  ] as Branch[],
}

export const currentUser = {
  id: 's0',
  name: 'Zarina Karimova',
  firstName: 'Zarina',
  phone: '+992 93 555 10 20',
  role: 'Owner',
}

export const PAYMENT_METHODS = [
  { id: 'cash', name: 'Cash', short: 'Cash' },
  { id: 'card', name: 'Bank card', short: 'Card' },
  { id: 'alif', name: 'Alif QR', short: 'Alif' },
  { id: 'dc', name: 'DC Wallet QR', short: 'DC' },
  { id: 'milli', name: 'Korti Milli', short: 'Milli' },
  { id: 'eskhata', name: 'Eskhata', short: 'Eskhata' },
  { id: 'amonat', name: 'Amonatbonk', short: 'Amonat' },
  { id: 'vasl', name: 'Vasl', short: 'Vasl' },
  { id: 'transfer', name: 'Bank transfer', short: 'Transfer' },
] as const

export type PaymentMethodId = (typeof PAYMENT_METHODS)[number]['id']
