import { seeded } from '@/lib/random'
import { NOW, TODAY, addDays, addMinutes } from '@/lib/time'
import { formatNumber } from '@/lib/format'
import { getLanguage } from '@/i18n/language'

export type Category = 'Hair care' | 'Hair color' | 'Nails' | 'Brows & lashes' | 'Skin care' | 'Disposables' | 'Massage'
export const CATEGORIES: Category[] = ['Hair care', 'Hair color', 'Nails', 'Brows & lashes', 'Skin care', 'Disposables', 'Massage']

export type Unit = 'pcs' | 'ml' | 'l' | 'g' | 'kg' | 'pack' | 'pair'
export const UNITS: Unit[] = ['pcs', 'ml', 'l', 'g', 'kg', 'pack', 'pair']

/** Store ids: where stock physically sits. */
export type StoreId = 'retail' | 'consumables' | 's1' | 's2' | 's3' | 's4' | 'somoni'

export type Product = {
  id: string
  name: string
  sku: string
  barcode: string
  category: Category
  unit: Unit
  /** What a tech card measures in when it differs from the stock unit: a 10 ml bottle used 0.3 ml at a time. */
  content?: { qty: number; unit: 'ml' | 'g' | 'use' }
  purchase: number
  sale: number
  stock: number
  min: number
  forSale: boolean
  consumable: boolean
  sterile: boolean
  supplierId: string
  store: 'retail' | 'consumables'
  vat: number
  archived?: boolean
  /** Days since the last count; over 45 means it needs a recount. */
  countedDaysAgo: number
  /** A difference showed up at the last write-off check. */
  mismatch?: boolean
}

export type Supplier = {
  id: string
  name: string
  contact: string
  phone: string
  email: string
  tin: string
  address: string
  notes?: string
}

export const suppliers: Supplier[] = [
  { id: 'sp1', name: 'Nail Pro Supply', contact: 'Feruza Azimova', phone: '+992932104455', email: 'orders@nailpro.tj', tin: '510 233 118', address: 'Bukhoro St 12, Dushanbe', notes: 'Delivers Tue and Fri. Free delivery from 600 TJS.' },
  { id: 'sp2', name: 'Kosmetika Dushanbe', contact: 'Daler Hakimov', phone: '+992987001212', email: 'sales@kosmetika.tj', tin: '520 908 441', address: 'Ayni St 48, Dushanbe', notes: 'Main hair-care distributor. Pays on 14-day terms.' },
  { id: 'sp3', name: 'BeautyHub Khujand', contact: 'Mehrona Sattorova', phone: '+992927445566', email: 'hub@beautyhub.tj', tin: '530 117 902', address: 'Lenin St 201, Khujand', notes: 'Lash and brow products. Ships by courier, 2 days.' },
  { id: 'sp4', name: 'MedSnab', contact: 'Firdavs Nazarov', phone: '+992900334411', email: 'medsnab@mail.tj', tin: '510 662 375', address: 'Somoni Ave 59, Dushanbe', notes: 'Medical consumables. Certificates attached to every delivery.' },
]

export const supplierById = Object.fromEntries(suppliers.map((s) => [s.id, s])) as Record<string, Supplier>

type Seed = Omit<Product, 'sku' | 'barcode' | 'vat' | 'countedDaysAgo'> & { countedDaysAgo?: number }

const SEED: Seed[] = [
  // Hair care
  { id: 'p1', name: 'Salon shampoo, repair', category: 'Hair care', unit: 'l', purchase: 95, sale: 0, stock: 3.4, min: 2, forSale: false, consumable: true, sterile: false, supplierId: 'sp2', store: 'consumables' },
  { id: 'p2', name: 'Salon conditioner', category: 'Hair care', unit: 'l', purchase: 110, sale: 0, stock: 1.6, min: 2, forSale: false, consumable: true, sterile: false, supplierId: 'sp2', store: 'consumables' },
  { id: 'p3', name: 'Repair shampoo 250 ml', category: 'Hair care', unit: 'pcs', purchase: 140, sale: 220, stock: 14, min: 6, forSale: true, consumable: false, sterile: false, supplierId: 'sp2', store: 'retail' },
  { id: 'p4', name: 'Hydrating hair mask 200 ml', category: 'Hair care', unit: 'pcs', purchase: 160, sale: 260, stock: 9, min: 4, forSale: true, consumable: false, sterile: false, supplierId: 'sp2', store: 'retail' },
  { id: 'p5', name: 'Heat protection spray 150 ml', category: 'Hair care', unit: 'pcs', purchase: 120, sale: 195, stock: 2, min: 4, forSale: true, consumable: false, sterile: false, supplierId: 'sp2', store: 'retail' },
  { id: 'p6', name: 'Argan oil serum 50 ml', category: 'Hair care', unit: 'pcs', purchase: 150, sale: 240, stock: 11, min: 4, forSale: true, consumable: false, sterile: false, supplierId: 'sp2', store: 'retail' },
  // Hair color
  { id: 'p7', name: 'Permanent color 7.1, 60 ml', category: 'Hair color', unit: 'pcs', content: { qty: 60, unit: 'ml' }, purchase: 48, sale: 0, stock: 22, min: 10, forSale: false, consumable: true, sterile: false, supplierId: 'sp2', store: 'consumables' },
  { id: 'p8', name: 'Permanent color 6.0, 60 ml', category: 'Hair color', unit: 'pcs', content: { qty: 60, unit: 'ml' }, purchase: 48, sale: 0, stock: 18, min: 10, forSale: false, consumable: true, sterile: false, supplierId: 'sp2', store: 'consumables' },
  { id: 'p9', name: 'Developer 6%', category: 'Hair color', unit: 'l', purchase: 70, sale: 0, stock: 2.8, min: 2, forSale: false, consumable: true, sterile: false, supplierId: 'sp2', store: 'consumables' },
  { id: 'p10', name: 'Blonding powder', category: 'Hair color', unit: 'g', purchase: 0.42, sale: 0, stock: 1500, min: 1000, forSale: false, consumable: true, sterile: false, supplierId: 'sp2', store: 'consumables' },
  { id: 'p11', name: 'Bond builder No.1, 100 ml', category: 'Hair color', unit: 'pcs', content: { qty: 100, unit: 'ml' }, purchase: 520, sale: 0, stock: 1, min: 1, forSale: false, consumable: true, sterile: false, supplierId: 'sp2', store: 'consumables', countedDaysAgo: 52, mismatch: true },
  // Nails
  { id: 'p12', name: 'Gel polish base 10 ml', category: 'Nails', unit: 'pcs', content: { qty: 10, unit: 'ml' }, purchase: 65, sale: 0, stock: 3, min: 5, forSale: false, consumable: true, sterile: false, supplierId: 'sp1', store: 'consumables' },
  { id: 'p13', name: 'Gel polish top 10 ml', category: 'Nails', unit: 'pcs', content: { qty: 10, unit: 'ml' }, purchase: 65, sale: 0, stock: 6, min: 5, forSale: false, consumable: true, sterile: false, supplierId: 'sp1', store: 'consumables' },
  { id: 'p14', name: 'Gel polish colors, set of 12', category: 'Nails', unit: 'pack', purchase: 480, sale: 0, stock: 4, min: 2, forSale: false, consumable: true, sterile: false, supplierId: 'sp1', store: 'consumables' },
  { id: 'p15', name: 'Nail files 180/240', category: 'Nails', unit: 'pcs', purchase: 4, sale: 0, stock: 120, min: 60, forSale: false, consumable: true, sterile: false, supplierId: 'sp1', store: 'consumables' },
  { id: 'p16', name: 'Lint-free wipes', category: 'Nails', unit: 'pcs', purchase: 0.05, sale: 0, stock: 900, min: 400, forSale: false, consumable: true, sterile: false, supplierId: 'sp1', store: 'consumables' },
  { id: 'p17', name: 'Cuticle oil 15 ml', category: 'Nails', unit: 'pcs', purchase: 28, sale: 55, stock: 18, min: 8, forSale: true, consumable: false, sterile: false, supplierId: 'sp1', store: 'retail' },
  { id: 'p18', name: 'Hand cream 75 ml', category: 'Nails', unit: 'pcs', purchase: 45, sale: 80, stock: 4, min: 6, forSale: true, consumable: false, sterile: false, supplierId: 'sp1', store: 'retail' },
  // Brows & lashes
  { id: 'p19', name: 'Brow tint, brown 15 ml', category: 'Brows & lashes', unit: 'pcs', content: { qty: 15, unit: 'ml' }, purchase: 85, sale: 0, stock: 5, min: 3, forSale: false, consumable: true, sterile: false, supplierId: 'sp3', store: 'consumables' },
  { id: 'p20', name: 'Lash lamination kit', category: 'Brows & lashes', unit: 'pack', content: { qty: 20, unit: 'use' }, purchase: 640, sale: 0, stock: 2, min: 2, forSale: false, consumable: true, sterile: false, supplierId: 'sp3', store: 'consumables' },
  { id: 'p21', name: 'Lash extension tray 0.07', category: 'Brows & lashes', unit: 'pcs', content: { qty: 4, unit: 'use' }, purchase: 120, sale: 0, stock: 9, min: 6, forSale: false, consumable: true, sterile: false, supplierId: 'sp3', store: 'consumables' },
  { id: 'p22', name: 'Lash glue 5 ml', category: 'Brows & lashes', unit: 'pcs', content: { qty: 5, unit: 'ml' }, purchase: 160, sale: 0, stock: 2, min: 3, forSale: false, consumable: true, sterile: false, supplierId: 'sp3', store: 'consumables' },
  // Skin care
  { id: 'p23', name: 'Cleansing gel', category: 'Skin care', unit: 'l', purchase: 260, sale: 0, stock: 1.2, min: 1, forSale: false, consumable: true, sterile: false, supplierId: 'sp4', store: 'consumables' },
  { id: 'p24', name: 'Glycolic peel 30%, 30 ml', category: 'Skin care', unit: 'pcs', content: { qty: 30, unit: 'ml' }, purchase: 380, sale: 0, stock: 3, min: 2, forSale: false, consumable: true, sterile: false, supplierId: 'sp4', store: 'consumables', countedDaysAgo: 61 },
  { id: 'p25', name: 'Hyaluronic serum 30 ml', category: 'Skin care', unit: 'pcs', purchase: 210, sale: 340, stock: 7, min: 3, forSale: true, consumable: false, sterile: false, supplierId: 'sp4', store: 'retail' },
  { id: 'p26', name: 'Sunscreen SPF 50, 50 ml', category: 'Skin care', unit: 'pcs', purchase: 190, sale: 310, stock: 5, min: 3, forSale: true, consumable: false, sterile: false, supplierId: 'sp4', store: 'retail' },
  { id: 'p27', name: 'Biorevitalization filler 1 ml', category: 'Skin care', unit: 'pcs', content: { qty: 1, unit: 'ml' }, purchase: 520, sale: 0, stock: 4, min: 2, forSale: false, consumable: true, sterile: true, supplierId: 'sp4', store: 'consumables' },
  // Disposables
  { id: 'p28', name: 'Neck strips', category: 'Disposables', unit: 'pcs', purchase: 0.3, sale: 0, stock: 640, min: 300, forSale: false, consumable: true, sterile: false, supplierId: 'sp2', store: 'consumables' },
  { id: 'p29', name: 'Disposable capes', category: 'Disposables', unit: 'pcs', purchase: 1.5, sale: 0, stock: 180, min: 100, forSale: false, consumable: true, sterile: false, supplierId: 'sp2', store: 'consumables' },
  { id: 'p30', name: 'Sterile needles 30G', category: 'Disposables', unit: 'pcs', purchase: 2.5, sale: 0, stock: 140, min: 100, forSale: false, consumable: true, sterile: true, supplierId: 'sp4', store: 'consumables' },
  { id: 'p31', name: 'Nitrile gloves', category: 'Disposables', unit: 'pair', purchase: 0.85, sale: 0, stock: 340, min: 200, forSale: false, consumable: true, sterile: false, supplierId: 'sp4', store: 'consumables', countedDaysAgo: 48 },
  { id: 'p32', name: 'Sterile wipes', category: 'Disposables', unit: 'pcs', purchase: 0.4, sale: 0, stock: 260, min: 150, forSale: false, consumable: true, sterile: true, supplierId: 'sp4', store: 'consumables' },
  { id: 'p33', name: 'Disposable towels, pack of 50', category: 'Disposables', unit: 'pack', purchase: 35, sale: 0, stock: 3, min: 4, forSale: false, consumable: true, sterile: false, supplierId: 'sp4', store: 'consumables' },
  // Massage
  { id: 'p34', name: 'Almond massage oil', category: 'Massage', unit: 'l', purchase: 140, sale: 0, stock: 2.5, min: 1, forSale: false, consumable: true, sterile: false, supplierId: 'sp2', store: 'consumables' },
  { id: 'p35', name: 'Massage cream 500 ml', category: 'Massage', unit: 'pcs', content: { qty: 500, unit: 'ml' }, purchase: 160, sale: 0, stock: 3, min: 2, forSale: false, consumable: true, sterile: false, supplierId: 'sp2', store: 'consumables' },
  { id: 'p36', name: 'Keratin mask 250 ml', category: 'Hair care', unit: 'pcs', purchase: 180, sale: 290, stock: 0, min: 0, forSale: true, consumable: false, sterile: false, supplierId: 'sp2', store: 'retail', archived: true },
]

const r = seeded(7311)
const CAT_CODE: Record<Category, string> = {
  'Hair care': 'HC',
  'Hair color': 'CL',
  Nails: 'NL',
  'Brows & lashes': 'BL',
  'Skin care': 'SK',
  Disposables: 'DS',
  Massage: 'MS',
}

export const initialProducts: Product[] = SEED.map((p, i) => ({
  ...p,
  sku: `${CAT_CODE[p.category]}-${String(1040 + i * 7).padStart(4, '0')}`,
  barcode: `478${String(r.int(100000000, 999999999))}${r.int(0, 9)}`,
  vat: p.forSale ? 15 : 0,
  countedDaysAgo: p.countedDaysAgo ?? r.int(4, 30),
}))

export const isLow = (p: Product) => !p.archived && p.stock < p.min
export const needsRecount = (p: Product) => !p.archived && (p.countedDaysAgo > 45 || !!p.mismatch)

/** Unit a tech card measures in, and how many of those make one stock unit. */
export function usageUnit(p: Product): { unit: string; factor: number } {
  if (p.content) return { unit: p.content.unit, factor: p.content.qty }
  if (p.unit === 'l') return { unit: 'ml', factor: 1000 }
  if (p.unit === 'kg') return { unit: 'g', factor: 1000 }
  return { unit: p.unit, factor: 1 }
}

const UNIT_LABEL: Record<string, [string, string]> = {
  pcs: ['pc', 'pcs'],
  pack: ['pack', 'packs'],
  pair: ['pair', 'pairs'],
  use: ['use', 'uses'],
  ml: ['ml', 'ml'],
  l: ['l', 'l'],
  g: ['g', 'g'],
  kg: ['kg', 'kg'],
}

export function formatQty(qty: number, unit: string) {
  if (getLanguage() === 'ru') {
    const units: Record<string, string> = { pcs: 'шт.', ml: 'мл', l: 'л', g: 'г', kg: 'кг', pack: 'уп.', pair: 'пар.', use: 'примен.' }
    return `${new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 2 }).format(qty)} ${units[unit] ?? unit}`
  }
  const n = Number.isInteger(qty) ? formatNumber(qty) : qty < 10 ? String(Math.round(qty * 100) / 100) : formatNumber(qty, 1)
  const [one, many] = UNIT_LABEL[unit] ?? [unit, unit]
  return `${n} ${qty === 1 ? one : many}`
}

export const STORES: { id: StoreId; name: string; parent: string; note: string; kind: 'store' | 'cabinet' }[] = [
  { id: 'retail', name: 'Retail', parent: 'Main warehouse', note: 'The register sells from here', kind: 'store' },
  { id: 'consumables', name: 'Consumables', parent: 'Main warehouse', note: 'Tech cards write off from here', kind: 'store' },
  { id: 's1', name: 'Madina’s station', parent: 'Main warehouse', note: 'Her visits write off here first, then from Consumables', kind: 'cabinet' },
  { id: 's2', name: 'Firuza’s nail desk', parent: 'Main warehouse', note: 'Her visits write off here first, then from Consumables', kind: 'cabinet' },
  { id: 's3', name: 'Dilnoza’s cabinet', parent: 'Main warehouse', note: 'Sterile stock for procedures, checked weekly', kind: 'cabinet' },
  { id: 's4', name: 'Shahlo’s station', parent: 'Main warehouse', note: 'Her visits write off here first, then from Consumables', kind: 'cabinet' },
  { id: 'somoni', name: 'Somoni 14 storage', parent: 'Somoni 14', note: 'Second branch. Transfers come from Rudaki 72', kind: 'store' },
]

/** Splits a product's stock across stores for the product sheet. */
export function stockByStore(p: Product): { store: string; qty: number }[] {
  if (p.store === 'retail') {
    const branch = Math.floor(p.stock / 4)
    return [
      { store: 'Retail', qty: p.stock - branch },
      ...(branch ? [{ store: 'Somoni 14 storage', qty: branch }] : []),
    ]
  }
  const cabinet: Record<string, string> = { 'Hair care': 'Madina’s station', 'Hair color': 'Madina’s station', Nails: 'Firuza’s nail desk', 'Brows & lashes': 'Shahlo’s station', 'Skin care': 'Dilnoza’s cabinet' }
  const at = cabinet[p.category]
  if (!at || p.stock < 2) return [{ store: 'Consumables', qty: p.stock }]
  const inCab = Number.isInteger(p.stock) ? Math.max(1, Math.floor(p.stock / 3)) : Math.round((p.stock / 3) * 10) / 10
  return [
    { store: 'Consumables', qty: Math.round((p.stock - inCab) * 10) / 10 },
    { store: at, qty: inCab },
  ]
}

/* ─────────────── Tech cards ─────────────── */

export type TechLine = { productId: string; qty: number }

/** Quantities are in each product's use unit (ml, g, use, pcs). */
export const initialTechCards: Record<string, TechLine[]> = {
  v1: [{ productId: 'p1', qty: 15 }, { productId: 'p28', qty: 1 }, { productId: 'p29', qty: 1 }],
  v3: [{ productId: 'p7', qty: 60 }, { productId: 'p9', qty: 60 }, { productId: 'p1', qty: 20 }, { productId: 'p2', qty: 15 }, { productId: 'p31', qty: 1 }, { productId: 'p28', qty: 1 }],
  v4: [{ productId: 'p10', qty: 40 }, { productId: 'p9', qty: 80 }, { productId: 'p11', qty: 5 }, { productId: 'p31', qty: 1 }, { productId: 'p28', qty: 1 }],
  v5: [{ productId: 'p15', qty: 1 }, { productId: 'p16', qty: 5 }, { productId: 'p31', qty: 1 }],
  v6: [{ productId: 'p12', qty: 0.3 }, { productId: 'p13', qty: 0.3 }, { productId: 'p15', qty: 1 }, { productId: 'p16', qty: 6 }, { productId: 'p31', qty: 1 }],
  v7: [{ productId: 'p15', qty: 1 }, { productId: 'p16', qty: 5 }, { productId: 'p31', qty: 1 }],
  v8: [{ productId: 'p19', qty: 1 }, { productId: 'p32', qty: 2 }],
  v9: [{ productId: 'p20', qty: 1 }, { productId: 'p32', qty: 2 }],
  v10: [{ productId: 'p21', qty: 1 }, { productId: 'p22', qty: 0.2 }, { productId: 'p32', qty: 2 }],
  v11: [{ productId: 'p23', qty: 20 }, { productId: 'p32', qty: 2 }, { productId: 'p31', qty: 1 }],
  v12: [{ productId: 'p24', qty: 1 }, { productId: 'p31', qty: 1 }, { productId: 'p32', qty: 2 }],
  v13: [{ productId: 'p27', qty: 1 }, { productId: 'p30', qty: 2 }, { productId: 'p31', qty: 1 }, { productId: 'p32', qty: 2 }],
  v14: [{ productId: 'p1', qty: 10 }, { productId: 'p28', qty: 1 }],
  v15: [{ productId: 'p28', qty: 1 }],
  v18: [{ productId: 'p34', qty: 30 }, { productId: 'p35', qty: 10 }],
}

/* ─────────────── Documents ─────────────── */

export type DocType = 'receipt' | 'write-off' | 'transfer' | 'stocktake' | 'tech-card'
export type DocStatus = 'draft' | 'posted' | 'cancelled'

export const DOC_TYPE: Record<DocType, { label: string; prefix: string; description: string }> = {
  receipt: { label: 'Receipt', prefix: 'R', description: 'Goods arriving from a supplier. Posting adds them to stock.' },
  'write-off': { label: 'Write-off', prefix: 'W', description: 'Spoiled, expired or used for the salon itself. Posting removes them from stock.' },
  transfer: { label: 'Transfer', prefix: 'T', description: 'Move stock between stores or to the Somoni 14 branch.' },
  stocktake: { label: 'Stocktake', prefix: 'S', description: 'Count what’s on the shelf. Differences are written off or added when you post.' },
  'tech-card': { label: 'Tech-card write-off', prefix: 'C', description: 'Created automatically when visits are completed.' },
}

export const DOC_STATUS: Record<DocStatus, { label: string; tone: 'neutral' | 'positive' | 'negative' }> = {
  draft: { label: 'Draft', tone: 'neutral' },
  posted: { label: 'Posted', tone: 'positive' },
  cancelled: { label: 'Cancelled', tone: 'negative' },
}

export type DocLine = { productId: string; qty: number; cost: number; expected?: number }

export type StockDoc = {
  id: string
  no: string
  type: DocType
  status: DocStatus
  warehouse: string
  to?: string
  supplierId?: string
  date: Date
  lines: DocLine[]
  comment?: string
  author: string
}

const dr = seeded(5102)
const DOC_PLAN: { type: DocType; status: DocStatus; day: number; supplierId?: string; lines: [string, number][]; warehouse: string; to?: string; comment?: string; author: string }[] = [
  { type: 'tech-card', status: 'posted', day: 0, warehouse: 'Consumables', lines: [['p1', 0.24], ['p28', 14], ['p31', 11], ['p16', 32]], author: 'NavCRM', comment: 'Visits completed today' },
  { type: 'receipt', status: 'draft', day: 0, supplierId: 'sp3', warehouse: 'Consumables', lines: [['p22', 4], ['p20', 2]], author: 'Nigora Alieva', comment: 'Courier arrives tomorrow, check quantities' },
  { type: 'tech-card', status: 'posted', day: -1, warehouse: 'Consumables', lines: [['p1', 0.31], ['p28', 18], ['p31', 15], ['p12', 0.2]], author: 'NavCRM', comment: 'Visits completed yesterday' },
  { type: 'receipt', status: 'posted', day: -2, supplierId: 'sp1', warehouse: 'Consumables', lines: [['p13', 6], ['p15', 100], ['p16', 500], ['p14', 2]], author: 'Nigora Alieva' },
  { type: 'transfer', status: 'posted', day: -3, warehouse: 'Retail', to: 'Somoni 14 storage', lines: [['p3', 4], ['p6', 3], ['p17', 5]], author: 'Zarina Karimova' },
  { type: 'write-off', status: 'posted', day: -5, warehouse: 'Consumables', lines: [['p24', 1]], author: 'Dilnoza Nazarova', comment: 'Expired 18 Oct' },
  { type: 'receipt', status: 'posted', day: -6, supplierId: 'sp2', warehouse: 'Retail', lines: [['p3', 12], ['p4', 8], ['p6', 10], ['p5', 6]], author: 'Nigora Alieva' },
  { type: 'receipt', status: 'cancelled', day: -8, supplierId: 'sp2', warehouse: 'Consumables', lines: [['p9', 2]], author: 'Nigora Alieva', comment: 'Duplicate of R-0137' },
  { type: 'receipt', status: 'posted', day: -8, supplierId: 'sp2', warehouse: 'Consumables', lines: [['p7', 12], ['p8', 10], ['p9', 3], ['p1', 3], ['p2', 2]], author: 'Nigora Alieva' },
  { type: 'stocktake', status: 'posted', day: -12, warehouse: 'Consumables', lines: [['p15', 128], ['p16', 940], ['p28', 655], ['p29', 186]], author: 'Zarina Karimova', comment: 'Monthly count' },
  { type: 'receipt', status: 'posted', day: -14, supplierId: 'sp4', warehouse: 'Consumables', lines: [['p27', 4], ['p30', 100], ['p32', 200], ['p31', 200]], author: 'Nigora Alieva' },
  { type: 'write-off', status: 'posted', day: -19, warehouse: 'Retail', lines: [['p18', 2]], author: 'Nigora Alieva', comment: 'Damaged in delivery' },
  { type: 'receipt', status: 'posted', day: -23, supplierId: 'sp3', warehouse: 'Consumables', lines: [['p19', 4], ['p21', 6], ['p20', 2]], author: 'Nigora Alieva' },
]

const counters: Record<string, number> = { R: 142, W: 31, T: 18, S: 9, C: 486 }

export function makeDocs(products: Product[]): StockDoc[] {
  const byId = Object.fromEntries(products.map((p) => [p.id, p]))
  return DOC_PLAN.map((d, i) => {
    const prefix = DOC_TYPE[d.type].prefix
    const no = `${prefix}-${String(counters[prefix]--).padStart(4, '0')}`
    return {
      id: `d${i + 1}`,
      no,
      type: d.type,
      status: d.status,
      warehouse: d.warehouse,
      to: d.to,
      supplierId: d.supplierId,
      date: addMinutes(addDays(TODAY, d.day), d.day === 0 ? 9 * 60 + dr.int(10, 290) : dr.int(9 * 60, 19 * 60)),
      lines: d.lines.map(([pid, qty]) => ({ productId: pid, qty, cost: byId[pid].purchase })),
      comment: d.comment,
      author: d.author,
    }
  })
}

export const docTotal = (d: StockDoc) => d.lines.reduce((m, l) => m + l.qty * l.cost, 0)

/* ─────────────── Supplier orders ─────────────── */

export type OrderStatus = 'sent' | 'received' | 'draft'
export type SupplierOrder = {
  id: string
  no: string
  supplierId: string
  lines: { productId: string; qty: number; cost: number }[]
  status: OrderStatus
  date: Date
}

export const initialOrders: SupplierOrder[] = [
  { id: 'o4', no: 'PO-0058', supplierId: 'sp3', lines: [{ productId: 'p22', qty: 4, cost: 160 }, { productId: 'p20', qty: 2, cost: 640 }], status: 'sent', date: addDays(NOW, -1) },
  { id: 'o3', no: 'PO-0057', supplierId: 'sp1', lines: [{ productId: 'p13', qty: 6, cost: 65 }, { productId: 'p15', qty: 100, cost: 4 }, { productId: 'p16', qty: 500, cost: 0.05 }, { productId: 'p14', qty: 2, cost: 480 }], status: 'received', date: addDays(NOW, -4) },
  { id: 'o2', no: 'PO-0056', supplierId: 'sp2', lines: [{ productId: 'p3', qty: 12, cost: 140 }, { productId: 'p4', qty: 8, cost: 160 }, { productId: 'p6', qty: 10, cost: 150 }, { productId: 'p5', qty: 6, cost: 120 }], status: 'received', date: addDays(NOW, -9) },
  { id: 'o1', no: 'PO-0055', supplierId: 'sp4', lines: [{ productId: 'p27', qty: 4, cost: 520 }, { productId: 'p30', qty: 100, cost: 2.5 }, { productId: 'p32', qty: 200, cost: 0.4 }], status: 'received', date: addDays(NOW, -16) },
]

export const orderTotal = (o: SupplierOrder) => o.lines.reduce((m, l) => m + l.qty * l.cost, 0)

/** Enough to get back to twice the minimum, in whole stock units. */
export function suggestedQty(p: Product) {
  return Math.max(1, Math.ceil(p.min * 2 - p.stock))
}

/* ─────────────── Movement history for one product ─────────────── */

export type Movement = { id: string; date: Date; label: string; qty: number; unit: string; doc?: string }

/** Recent stock movement for the product sheet. Tech-card use is shown in the unit masters measure in. */
export function movementsFor(p: Product): Movement[] {
  const m = seeded(p.id.split('').reduce((a, c) => a + c.charCodeAt(0), 0) * 97)
  const usage = usageUnit(p)
  const perVisit = Object.values(initialTechCards)
    .flat()
    .filter((l) => l.productId === p.id)
    .map((l) => l.qty)
  const per = perVisit.length ? perVisit.reduce((a, b) => a + b, 0) / perVisit.length : 0
  const out: Movement[] = []
  for (let i = 0; i < 6; i++) {
    const day = -i * m.int(1, 4)
    const date = addMinutes(addDays(TODAY, day), m.int(10 * 60, 19 * 60))
    if (i === 3) {
      out.push({ id: `${p.id}m${i}`, date, label: `Receipt from ${supplierById[p.supplierId].name}`, qty: Math.max(1, Math.round(p.min * 1.5)), unit: p.unit, doc: `R-0${m.int(130, 142)}` })
    } else if (p.forSale) {
      out.push({ id: `${p.id}m${i}`, date, label: 'Sold at the register', qty: -m.int(1, 2), unit: p.unit })
    } else if (per > 0) {
      const visits = m.int(3, 14)
      out.push({ id: `${p.id}m${i}`, date, label: `Tech cards, ${visits} visits`, qty: -Math.round(per * visits * 100) / 100, unit: usage.unit })
    } else {
      out.push({ id: `${p.id}m${i}`, date, label: 'Written off by a master', qty: -1, unit: p.unit })
    }
  }
  return out.sort((a, b) => +b.date - +a.date)
}
