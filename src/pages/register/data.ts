import { initialEntries, isVisit, type Appointment } from '@/data/appointments'
import type { PaymentMethodId } from '@/data/business'
import { clients } from '@/data/clients'
import { serviceById } from '@/data/services'
import { seeded } from '@/lib/random'
import { NOW, TODAY, addDays, addMinutes, at, isSameDay } from '@/lib/time'

/* ─────────────── Retail products (sold at the register) ─────────────── */

export type Product = {
  id: string
  name: string
  brand: string
  price: number
  stock: number
  barcode: string
}

export const products: Product[] = [
  { id: 'p1', name: 'Nutritive shampoo 250 ml', brand: 'Kérastase', price: 280, stock: 9, barcode: '3474636382606' },
  { id: 'p2', name: 'Absolut Repair mask 250 ml', brand: 'L’Oréal Professionnel', price: 210, stock: 6, barcode: '3474636975310' },
  { id: 'p3', name: 'Treatment oil 100 ml', brand: 'Moroccanoil', price: 390, stock: 4, barcode: '7290011521011' },
  { id: 'p4', name: 'OI All in One milk 135 ml', brand: 'Davines', price: 320, stock: 3, barcode: '8004608256663' },
  { id: 'p5', name: 'Total Results conditioner 300 ml', brand: 'Matrix', price: 150, stock: 11, barcode: '3474636908653' },
  { id: 'p6', name: 'SolarOil cuticle oil 15 ml', brand: 'CND', price: 95, stock: 14, barcode: '0639370903708' },
  { id: 'p7', name: 'Nail Envy strengthener 15 ml', brand: 'OPI', price: 180, stock: 2, barcode: '0619828127167' },
  { id: 'p8', name: 'Effaclar purifying gel 200 ml', brand: 'La Roche-Posay', price: 230, stock: 7, barcode: '3337872411991' },
  { id: 'p9', name: 'Sensibio H2O micellar 250 ml', brand: 'Bioderma', price: 190, stock: 0, barcode: '3401345935571' },
  { id: 'p10', name: 'Niacinamide 10% serum 30 ml', brand: 'The Ordinary', price: 140, stock: 12, barcode: '0769915190311' },
  { id: 'p11', name: 'Beard oil 50 ml', brand: 'Reuzel', price: 160, stock: 5, barcode: '0852578006713' },
  { id: 'p12', name: 'Hand care gift box', brand: 'Sitora Beauty', price: 250, stock: 8, barcode: '4600000000127' },
]

export const productById = Object.fromEntries(products.map((p) => [p.id, p])) as Record<string, Product>

/* ─────────────── Memberships ─────────────── */

export type MembershipType = {
  id: string
  name: string
  includes: string
  visits: number
  validDays: number
  price: number
  /** Price of the same visits bought one by one, to show the saving. */
  fullPrice: number
  freeze: boolean
  serviceIds: string[]
}

export const membershipTypes: MembershipType[] = [
  { id: 'm1', name: 'Manicure ×5', includes: 'Manicure or gel polish', visits: 5, validDays: 60, price: 400, fullPrice: 450, freeze: true, serviceIds: ['v5', 'v6'] },
  { id: 'm2', name: '8 visits a month', includes: 'Blow-dry, manicure, brows', visits: 8, validDays: 30, price: 1100, fullPrice: 1320, freeze: false, serviceIds: ['v2', 'v5', 'v8'] },
  { id: 'm3', name: 'Massage course ×10', includes: 'Back or full body massage', visits: 10, validDays: 90, price: 2800, fullPrice: 3200, freeze: true, serviceIds: ['v17', 'v18'] },
  { id: 'm4', name: 'Facial cleansing ×4', includes: 'Facial cleansing', visits: 4, validDays: 120, price: 1000, fullPrice: 1200, freeze: true, serviceIds: ['v11'] },
  { id: 'm5', name: 'Men’s haircut ×4', includes: 'Men’s haircut', visits: 4, validDays: 60, price: 240, fullPrice: 280, freeze: false, serviceIds: ['v14'] },
]

export const membershipTypeById = Object.fromEntries(membershipTypes.map((m) => [m.id, m])) as Record<string, MembershipType>

export type MembershipStatus = 'active' | 'frozen' | 'expired' | 'used' | 'closed'

export type Membership = {
  id: string
  typeId: string
  clientId: string
  used: number
  soldAt: Date
  validUntil: Date
  status: MembershipStatus
}

/* ─────────────── Certificates ─────────────── */

export type CertificateStatus = 'active' | 'used' | 'expired'

export type Certificate = {
  code: string
  kind: 'amount' | 'service'
  nominal: number
  balance: number
  serviceId?: string
  buyerId: string
  recipient?: string
  soldAt: Date
  validUntil: Date
  status: CertificateStatus
}

/* ─────────────── Receipts ─────────────── */

export type LineKind = 'service' | 'product' | 'membership' | 'certificate' | 'tip' | 'other' | 'rental' | 'deposit' | 'debt'

export type ReceiptLine = {
  id: string
  kind: LineKind
  name: string
  price: number
  qty: number
  staffId?: string
  /** Service, product, membership type or certificate code this line refers to. */
  ref?: string
}

export type ReceiptStatus = 'paid' | 'debt' | 'refund' | 'partial_refund' | 'voided'

export type Payment = { method: PaymentMethodId; amount: number }

export type Receipt = {
  id: string
  no: number
  at: Date
  clientId: string | null
  lines: ReceiptLine[]
  payments: Payment[]
  discount: number
  bonusesUsed: number
  total: number
  /** Still owed by the client on a debt receipt. */
  owed: number
  refunded: number
  status: ReceiptStatus
  cashier: string
  fiscal: string | null
  visitId?: string
}

export const RECEIPT_STATUS: Record<ReceiptStatus, { label: string; tone: 'neutral' | 'positive' | 'negative' | 'warning' }> = {
  paid: { label: 'Paid', tone: 'positive' },
  debt: { label: 'Debt', tone: 'negative' },
  refund: { label: 'Refunded', tone: 'neutral' },
  partial_refund: { label: 'Partly refunded', tone: 'warning' },
  voided: { label: 'Voided', tone: 'neutral' },
}

const r = seeded(1043)

function pickMethod(): PaymentMethodId {
  const x = r.next()
  // Dushanbe salons still take a lot of cash; QR wallets come next.
  return x < 0.46 ? 'cash' : x < 0.62 ? 'card' : x < 0.8 ? 'alif' : x < 0.88 ? 'dc' : x < 0.94 ? 'milli' : x < 0.97 ? 'eskhata' : x < 0.99 ? 'amonat' : 'vasl'
}

const fiscalNo = () => `FP ${r.int(1000, 9999)} ${r.int(1000, 9999)} ${r.int(1000, 9999)}`

function visitLines(a: Appointment): ReceiptLine[] {
  return a.serviceIds.map((id, i) => ({
    id: `${a.id}_${i}`,
    kind: 'service' as const,
    name: serviceById[id].name,
    price: serviceById[id].price,
    qty: 1,
    staffId: a.staffId,
    ref: id,
  }))
}

function buildReceipts(): Receipt[] {
  const from = addDays(TODAY, -6)
  const visits = initialEntries
    .filter((e): e is Appointment => isVisit(e) && e.status === 'completed' && e.start >= from && e.end <= NOW)
    .sort((a, b) => +a.end - +b.end)

  const list: Receipt[] = visits.map((a) => {
    const lines = visitLines(a)
    if (r.chance(0.18)) {
      const p = r.pick(products.filter((x) => x.stock > 0))
      lines.push({ id: `${a.id}_p`, kind: 'product', name: p.name, price: p.price, qty: 1, ref: p.id })
    }
    if (r.chance(0.12)) lines.push({ id: `${a.id}_t`, kind: 'tip', name: 'Tip', price: r.pick([20, 30, 50]), qty: 1, staffId: a.staffId })
    const total = lines.reduce((m, l) => m + l.price * l.qty, 0)
    const method = pickMethod()
    const split = r.chance(0.06) && method !== 'cash'
    const payments: Payment[] = split
      ? [
          { method, amount: total - 100 },
          { method: 'cash', amount: 100 },
        ]
      : [{ method, amount: total }]
    return {
      id: `r_${a.id}`,
      no: 0,
      at: addMinutes(a.end, r.int(1, 6)),
      clientId: a.clientId,
      lines,
      payments,
      discount: 0,
      bonusesUsed: 0,
      total,
      owed: 0,
      refunded: 0,
      status: 'paid',
      cashier: r.chance(0.82) ? 'Nigora Alieva' : 'Zarina Karimova',
      fiscal: fiscalNo(),
      visitId: a.id,
    }
  })

  // Clients who still owe money: their receipt was left partly unpaid.
  const debtors = clients.filter((c) => c.debt > 0)
  debtors.forEach((c, i) => {
    const daysAgo = [12, 4, 26, 9, 18, 2][i % 6]
    const svc = serviceById[['v3', 'v6', 'v13', 'v10', 'v4', 'v11'][i % 6]]
    const total = Math.max(svc.price, c.debt + 100)
    list.push({
      id: `r_debt_${c.id}`,
      no: 0,
      at: at(addDays(TODAY, -daysAgo), `${12 + (i % 6)}:${i % 2 ? '40' : '10'}`),
      clientId: c.id,
      lines: [{ id: `d_${c.id}`, kind: 'service', name: svc.name, price: total, qty: 1, staffId: svc.staffIds[0], ref: svc.id }],
      payments: [{ method: 'cash', amount: total - c.debt }],
      discount: 0,
      bonusesUsed: 0,
      total,
      owed: c.debt,
      refunded: 0,
      status: 'debt',
      cashier: 'Nigora Alieva',
      fiscal: fiscalNo(),
    })
  })

  list.sort((a, b) => +a.at - +b.at)
  const last = 1042
  list.forEach((rc, i) => (rc.no = last - (list.length - 1 - i)))

  // A few refunds and a voided receipt from earlier in the week.
  const earlier = list.filter((x) => x.status === 'paid' && !isSameDay(x.at, NOW))
  if (earlier[8]) Object.assign(earlier[8], { status: 'refund', refunded: earlier[8].total })
  if (earlier[21] && earlier[21].lines.length > 1) Object.assign(earlier[21], { status: 'partial_refund', refunded: earlier[21].lines[1].price })
  else if (earlier[22]) Object.assign(earlier[22], { status: 'partial_refund', refunded: Math.round(earlier[22].total / 2) })
  if (earlier[30]) Object.assign(earlier[30], { status: 'voided' })

  return list.reverse()
}

export const initialReceipts = buildReceipts()

/* ─────────────── Memberships & certificates sold ─────────────── */

function buildMemberships(): Membership[] {
  const rr = seeded(808)
  const pool = clients.filter((c) => !c.archived && c.category !== 'lost')
  const out: Membership[] = []
  for (let i = 0; i < 22; i++) {
    const type = rr.pick(membershipTypes)
    const soldDaysAgo = rr.int(2, 150)
    const soldAt = addDays(TODAY, -soldDaysAgo)
    const validUntil = addDays(soldAt, type.validDays)
    const used = Math.min(type.visits, rr.int(0, type.visits))
    let status: MembershipStatus = 'active'
    if (used >= type.visits) status = 'used'
    else if (validUntil < TODAY) status = 'expired'
    else if (type.freeze && rr.chance(0.12)) status = 'frozen'
    else if (rr.chance(0.04)) status = 'closed'
    const client = i === 0 ? pool[0] : rr.pick(pool)
    out.push({ id: `ms${i + 1}`, typeId: type.id, clientId: client.id, used, soldAt, validUntil, status })
  }
  // The demo's VIP holds an active manicure membership.
  out[0] = { id: 'ms1', typeId: 'm1', clientId: 'c1', used: 2, soldAt: addDays(TODAY, -21), validUntil: addDays(TODAY, 39), status: 'active' }
  return out
}

export const initialMemberships = buildMemberships()

const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
export function makeCertificateCode(seed = Date.now()) {
  const rr = seeded(seed)
  const part = (n: number) => Array.from({ length: n }, () => CODE_CHARS[rr.int(0, CODE_CHARS.length - 1)]).join('')
  return `SB-${part(4)}-${part(2)}`
}

function buildCertificates(): Certificate[] {
  const rr = seeded(5150)
  const pool = clients.filter((c) => !c.archived)
  const nominals = [300, 500, 500, 1000, 1000, 1500, 2000]
  const out: Certificate[] = []
  for (let i = 0; i < 14; i++) {
    const service = rr.chance(0.3)
    const svc = rr.pick(['v3', 'v11', 'v18', 'v10'])
    const nominal = service ? serviceById[svc].price : rr.pick(nominals)
    const soldAt = addDays(TODAY, -rr.int(3, 200))
    const validUntil = addDays(soldAt, 180)
    let balance = service ? nominal : rr.chance(0.4) ? nominal : rr.chance(0.5) ? Math.round((nominal * rr.int(1, 6)) / 100) * 10 : 0
    let status: CertificateStatus = balance === 0 ? 'used' : validUntil < TODAY ? 'expired' : 'active'
    if (service && rr.chance(0.3)) {
      balance = 0
      status = 'used'
    }
    out.push({
      code: makeCertificateCode(9000 + i),
      kind: service ? 'service' : 'amount',
      nominal,
      balance,
      serviceId: service ? svc : undefined,
      buyerId: rr.pick(pool).id,
      recipient: rr.chance(0.5) ? rr.pick(['Mother', 'Sister', 'For a colleague', 'Wedding gift']) : undefined,
      soldAt,
      validUntil,
      status,
    })
  }
  out[0] = { ...out[0], code: 'SB-7K4Q-M2', kind: 'amount', nominal: 1000, balance: 650, status: 'active', validUntil: addDays(TODAY, 96) }
  return out
}

export const initialCertificates = buildCertificates()

/* ─────────────── Expenses ─────────────── */

export const EXPENSE_CATEGORIES = ['Rent', 'Utilities', 'Supplies', 'Salary', 'Advertising', 'Taxes', 'Other'] as const
export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number]

export type Expense = {
  id: string
  date: Date
  category: ExpenseCategory
  description: string
  amount: number
  source: 'cash' | 'bank'
  by: string
}

function monthDay(d: number, monthsAgo = 0) {
  const x = new Date(TODAY.getFullYear(), TODAY.getMonth() - monthsAgo, Math.min(d, 28))
  return x > TODAY ? TODAY : x
}

export const initialExpenses: Expense[] = [
  { id: 'e1', date: TODAY, category: 'Other', description: 'Drinking water delivery', amount: 120, source: 'cash', by: 'Nigora Alieva' },
  { id: 'e2', date: addDays(TODAY, -1), category: 'Supplies', description: 'Nail Pro Supply: gel bases, files', amount: 2380, source: 'bank', by: 'Zarina Karimova' },
  { id: 'e3', date: addDays(TODAY, -3), category: 'Advertising', description: 'Instagram promotion, 7 days', amount: 600, source: 'bank', by: 'Zarina Karimova' },
  { id: 'e4', date: addDays(TODAY, -4), category: 'Other', description: 'Cleaning supplies', amount: 240, source: 'cash', by: 'Nigora Alieva' },
  { id: 'e5', date: addDays(TODAY, -6), category: 'Supplies', description: 'Kosmetika Plus: peels, masks', amount: 1640, source: 'bank', by: 'Zarina Karimova' },
  { id: 'e6', date: monthDay(15), category: 'Salary', description: 'Advances for 3 masters', amount: 3000, source: 'cash', by: 'Zarina Karimova' },
  { id: 'e7', date: monthDay(10), category: 'Utilities', description: 'Electricity, Barqi Tojik', amount: 980, source: 'bank', by: 'Zarina Karimova' },
  { id: 'e8', date: monthDay(10), category: 'Utilities', description: 'Water and heating', amount: 470, source: 'bank', by: 'Zarina Karimova' },
  { id: 'e9', date: monthDay(5), category: 'Taxes', description: 'Social tax for September', amount: 2100, source: 'bank', by: 'Zarina Karimova' },
  { id: 'e10', date: monthDay(1), category: 'Rent', description: 'Rent, Rudaki 72', amount: 12000, source: 'bank', by: 'Zarina Karimova' },
  { id: 'e11', date: monthDay(1), category: 'Other', description: 'Internet, Babilon-T', amount: 350, source: 'bank', by: 'Zarina Karimova' },
  { id: 'e12', date: monthDay(26, 1), category: 'Supplies', description: 'Hair color, Matrix distributor', amount: 3120, source: 'bank', by: 'Zarina Karimova' },
  { id: 'e13', date: monthDay(15, 1), category: 'Salary', description: 'Advances for 4 masters', amount: 4000, source: 'cash', by: 'Zarina Karimova' },
  { id: 'e14', date: monthDay(10, 1), category: 'Utilities', description: 'Electricity and water', amount: 1390, source: 'bank', by: 'Zarina Karimova' },
  { id: 'e15', date: monthDay(5, 1), category: 'Taxes', description: 'Social tax for August', amount: 2100, source: 'bank', by: 'Zarina Karimova' },
  { id: 'e16', date: monthDay(1, 1), category: 'Rent', description: 'Rent, Rudaki 72', amount: 12000, source: 'bank', by: 'Zarina Karimova' },
  { id: 'e17', date: monthDay(18, 1), category: 'Advertising', description: '2GIS premium listing', amount: 450, source: 'bank', by: 'Zarina Karimova' },
]

/* ─────────────── Shift history ─────────────── */

export type ShiftRecord = {
  id: string
  date: Date
  openedAt: string
  closedAt: string
  by: string
  expected: number
  counted: number
  comment?: string
}

export const initialShifts: ShiftRecord[] = Array.from({ length: 10 }, (_, i) => {
  const rr = seeded(300 + i)
  const date = addDays(TODAY, -(i + 1))
  const expected = Math.round(rr.int(1800, 4600) / 10) * 10
  const diff = i === 2 ? -20 : i === 6 ? 10 : i === 8 ? -50 : 0
  return {
    id: `sh${i}`,
    date,
    openedAt: `09:0${rr.int(0, 9)}`,
    closedAt: `21:${String(rr.int(2, 25)).padStart(2, '0')}`,
    by: i % 4 === 3 ? 'Zarina Karimova' : 'Nigora Alieva',
    expected,
    counted: expected + diff,
    comment: diff === -50 ? 'Change given twice to one client' : diff === -20 ? 'Rounding on three receipts' : undefined,
  }
})

/* ─────────────── Promo codes ─────────────── */

export const PROMO_CODES: Record<string, { percent: number; note: string }> = {
  AUTUMN15: { percent: 15, note: 'Autumn offer, until 30 Nov' },
  WELCOME10: { percent: 10, note: 'First visit' },
  VIP20: { percent: 20, note: 'VIP clients' },
}
