import { clients, type Client } from '@/data/clients'
import { seeded } from '@/lib/random'
import { NOW, TODAY, addDays, addMinutes } from '@/lib/time'

/* ─────────────── Catalog ─────────────── */

export type Biomaterial = 'Venous blood' | 'Capillary blood' | 'Urine' | 'Stool' | 'Swab' | 'Saliva' | 'Sputum'
export const BIOMATERIALS: Biomaterial[] = ['Venous blood', 'Capillary blood', 'Urine', 'Stool', 'Swab', 'Saliva', 'Sputum']

export type RangeGroup = 'Women' | 'Men' | 'Children'
export type Range = { group: RangeGroup; age: string; low: number; high: number }

export type Indicator = {
  id: string
  name: string
  unit: string
  decimals: number
  ranges: Range[]
  /** Qualitative results ("Detected / Not detected") instead of a number. */
  qualitative?: { normal: string; options: string[] }
}

export type ResultTemplate = { id: string; name: string; indicators: Indicator[]; editedAt: Date }

const adult = (low: number, high: number, women?: [number, number], children?: [number, number]): Range[] => [
  { group: 'Women', age: '18+', low: women?.[0] ?? low, high: women?.[1] ?? high },
  { group: 'Men', age: '18+', low, high },
  ...(children ? [{ group: 'Children' as const, age: '1–14', low: children[0], high: children[1] }] : []),
]

const ind = (id: string, name: string, unit: string, decimals: number, ranges: Range[]): Indicator => ({ id, name, unit, decimals, ranges })

export const initialTemplates: ResultTemplate[] = [
  {
    id: 'cbc',
    name: 'Complete blood count',
    editedAt: addDays(TODAY, -64),
    indicators: [
      ind('hgb', 'Hemoglobin', 'g/L', 0, adult(130, 170, [120, 150], [115, 145])),
      ind('rbc', 'Red blood cells', '×10¹²/L', 2, adult(4.3, 5.7, [3.8, 5.1], [4.0, 5.2])),
      ind('wbc', 'White blood cells', '×10⁹/L', 1, adult(4.0, 9.0, undefined, [4.5, 13.5])),
      ind('plt', 'Platelets', '×10⁹/L', 0, adult(150, 400, undefined, [180, 400])),
      ind('hct', 'Hematocrit', '%', 1, adult(39, 49, [35, 45], [33, 41])),
      ind('esr', 'ESR', 'mm/h', 0, adult(2, 15, [2, 20], [2, 10])),
    ],
  },
  {
    id: 'glucose',
    name: 'Glucose metabolism',
    editedAt: addDays(TODAY, -120),
    indicators: [ind('glu', 'Glucose (fasting)', 'mmol/L', 1, adult(3.9, 5.5, undefined, [3.3, 5.6])), ind('hba1c', 'HbA1c', '%', 1, adult(4.0, 6.0))],
  },
  {
    id: 'lipids',
    name: 'Lipid panel',
    editedAt: addDays(TODAY, -120),
    indicators: [
      ind('chol', 'Total cholesterol', 'mmol/L', 1, adult(3.0, 5.2)),
      ind('hdl', 'HDL cholesterol', 'mmol/L', 1, adult(1.0, 2.2, [1.2, 2.4])),
      ind('ldl', 'LDL cholesterol', 'mmol/L', 1, adult(0.5, 3.0)),
      ind('tg', 'Triglycerides', 'mmol/L', 1, adult(0.4, 1.7)),
    ],
  },
  {
    id: 'liver',
    name: 'Liver enzymes',
    editedAt: addDays(TODAY, -200),
    indicators: [ind('alt', 'ALT', 'U/L', 0, adult(0, 41, [0, 33])), ind('ast', 'AST', 'U/L', 0, adult(0, 40, [0, 32]))],
  },
  {
    id: 'kidney',
    name: 'Kidney function',
    editedAt: addDays(TODAY, -200),
    indicators: [ind('creat', 'Creatinine', 'µmol/L', 0, adult(62, 106, [44, 80], [27, 62]))],
  },
  {
    id: 'iron',
    name: 'Iron status',
    editedAt: addDays(TODAY, -31),
    indicators: [ind('ferritin', 'Ferritin', 'ng/mL', 0, adult(30, 400, [13, 150], [7, 140])), ind('iron', 'Serum iron', 'µmol/L', 1, adult(11.6, 31.3, [9.0, 30.4]))],
  },
  {
    id: 'vitamins',
    name: 'Vitamins',
    editedAt: addDays(TODAY, -31),
    indicators: [ind('vitd', 'Vitamin D (25-OH)', 'ng/mL', 0, adult(30, 100, undefined, [30, 100])), ind('b12', 'Vitamin B12', 'pg/mL', 0, adult(197, 771))],
  },
  {
    id: 'thyroid',
    name: 'Thyroid',
    editedAt: addDays(TODAY, -88),
    indicators: [ind('tsh', 'TSH', 'mIU/L', 2, adult(0.4, 4.0, undefined, [0.7, 5.7])), ind('ft4', 'Free T4', 'pmol/L', 1, adult(9.0, 19.0))],
  },
  {
    id: 'hormones',
    name: 'Sex and stress hormones',
    editedAt: addDays(TODAY, -15),
    indicators: [
      ind('testo', 'Testosterone', 'nmol/L', 1, adult(8.6, 29.0, [0.3, 2.4])),
      ind('estr', 'Estradiol', 'pmol/L', 0, adult(40, 162, [46, 607])),
      ind('prl', 'Prolactin', 'ng/mL', 1, adult(4.0, 15.2, [4.8, 23.3])),
      ind('cort', 'Cortisol (morning)', 'nmol/L', 0, adult(166, 507)),
      ind('dhea', 'DHEA-S', 'µmol/L', 1, adult(2.2, 15.2, [0.9, 11.7])),
    ],
  },
  {
    id: 'urine',
    name: 'Urinalysis',
    editedAt: addDays(TODAY, -300),
    indicators: [
      ind('ph', 'pH', '', 1, adult(5.0, 7.0)),
      ind('sg', 'Specific gravity', '', 3, adult(1.005, 1.03)),
      ind('prot', 'Protein', 'g/L', 2, adult(0, 0.14)),
      ind('leu', 'Leukocytes', 'per field', 0, adult(0, 5, [0, 6])),
    ],
  },
  {
    id: 'micro',
    name: 'Microbiology',
    editedAt: addDays(TODAY, -45),
    indicators: [
      { id: 'koh', name: 'Fungal elements (KOH)', unit: '', decimals: 0, ranges: [], qualitative: { normal: 'Not detected', options: ['Not detected', 'Detected'] } },
      { id: 'hp', name: 'H. pylori antigen', unit: '', decimals: 0, ranges: [], qualitative: { normal: 'Negative', options: ['Negative', 'Positive'] } },
    ],
  },
]

export type TestCategory = 'Hematology' | 'Biochemistry' | 'Vitamins' | 'Hormones' | 'Urine' | 'Microbiology' | 'Packages'

export type LabTest = {
  id: string
  name: string
  code: string
  price: number
  /** Hours from sample to result. */
  turnaround: number
  biomaterial: Biomaterial
  category: TestCategory
  kind: 'test' | 'package'
  templateId: string | null
  /** Subset of the template's indicators this test reports. */
  indicatorIds?: string[]
  /** Tests bundled into a package. */
  includes?: string[]
  prep?: string
  active: boolean
}

const FASTING = 'Fasting 8–12 hours; plain water is fine'
const MORNING = 'Morning sample, before 10:00'

export const initialTests: LabTest[] = [
  { id: 'p_cosmo', name: 'Hormone panel for cosmetology', code: 'P-010', price: 690, turnaround: 72, biomaterial: 'Venous blood', category: 'Packages', kind: 'package', templateId: null, includes: ['t_tsh', 't_ft4', 't_testo', 't_estr', 't_prl', 't_cort', 't_dhea'], prep: MORNING, active: true },
  { id: 'p_preproc', name: 'Pre-procedure check-up', code: 'P-020', price: 175, turnaround: 24, biomaterial: 'Venous blood', category: 'Packages', kind: 'package', templateId: null, includes: ['t_cbc', 't_glu', 't_alt', 't_ast', 't_creat'], prep: FASTING, active: true },
  { id: 'p_hair', name: 'Hair loss panel', code: 'P-030', price: 540, turnaround: 72, biomaterial: 'Venous blood', category: 'Packages', kind: 'package', templateId: null, includes: ['t_ferr', 't_iron', 't_vitd', 't_b12', 't_tsh'], prep: MORNING, active: true },
  { id: 't_cbc', name: 'Complete blood count', code: 'H-001', price: 85, turnaround: 24, biomaterial: 'Venous blood', category: 'Hematology', kind: 'test', templateId: 'cbc', prep: 'No food for 3 hours before', active: true },
  { id: 't_esr', name: 'ESR', code: 'H-002', price: 30, turnaround: 24, biomaterial: 'Venous blood', category: 'Hematology', kind: 'test', templateId: 'cbc', indicatorIds: ['esr'], active: true },
  { id: 't_glu', name: 'Glucose', code: 'B-001', price: 25, turnaround: 4, biomaterial: 'Capillary blood', category: 'Biochemistry', kind: 'test', templateId: 'glucose', indicatorIds: ['glu'], prep: FASTING, active: true },
  { id: 't_hba1c', name: 'HbA1c', code: 'B-002', price: 95, turnaround: 24, biomaterial: 'Venous blood', category: 'Biochemistry', kind: 'test', templateId: 'glucose', indicatorIds: ['hba1c'], active: true },
  { id: 't_lipid', name: 'Lipid panel', code: 'B-010', price: 140, turnaround: 24, biomaterial: 'Venous blood', category: 'Biochemistry', kind: 'test', templateId: 'lipids', prep: FASTING, active: true },
  { id: 't_alt', name: 'ALT', code: 'B-020', price: 30, turnaround: 24, biomaterial: 'Venous blood', category: 'Biochemistry', kind: 'test', templateId: 'liver', indicatorIds: ['alt'], prep: FASTING, active: true },
  { id: 't_ast', name: 'AST', code: 'B-021', price: 30, turnaround: 24, biomaterial: 'Venous blood', category: 'Biochemistry', kind: 'test', templateId: 'liver', indicatorIds: ['ast'], prep: FASTING, active: true },
  { id: 't_creat', name: 'Creatinine', code: 'B-030', price: 30, turnaround: 24, biomaterial: 'Venous blood', category: 'Biochemistry', kind: 'test', templateId: 'kidney', active: true },
  { id: 't_ferr', name: 'Ferritin', code: 'B-040', price: 110, turnaround: 48, biomaterial: 'Venous blood', category: 'Biochemistry', kind: 'test', templateId: 'iron', indicatorIds: ['ferritin'], active: true },
  { id: 't_iron', name: 'Serum iron', code: 'B-041', price: 45, turnaround: 24, biomaterial: 'Venous blood', category: 'Biochemistry', kind: 'test', templateId: 'iron', indicatorIds: ['iron'], prep: FASTING, active: true },
  { id: 't_vitd', name: 'Vitamin D (25-OH)', code: 'V-001', price: 220, turnaround: 72, biomaterial: 'Venous blood', category: 'Vitamins', kind: 'test', templateId: 'vitamins', indicatorIds: ['vitd'], active: true },
  { id: 't_b12', name: 'Vitamin B12', code: 'V-002', price: 160, turnaround: 72, biomaterial: 'Venous blood', category: 'Vitamins', kind: 'test', templateId: 'vitamins', indicatorIds: ['b12'], active: true },
  { id: 't_tsh', name: 'TSH', code: 'E-001', price: 90, turnaround: 48, biomaterial: 'Venous blood', category: 'Hormones', kind: 'test', templateId: 'thyroid', indicatorIds: ['tsh'], active: true },
  { id: 't_ft4', name: 'Free T4', code: 'E-002', price: 90, turnaround: 48, biomaterial: 'Venous blood', category: 'Hormones', kind: 'test', templateId: 'thyroid', indicatorIds: ['ft4'], active: true },
  { id: 't_testo', name: 'Testosterone', code: 'E-010', price: 120, turnaround: 48, biomaterial: 'Venous blood', category: 'Hormones', kind: 'test', templateId: 'hormones', indicatorIds: ['testo'], prep: 'Morning sample, before 11:00', active: true },
  { id: 't_estr', name: 'Estradiol', code: 'E-011', price: 120, turnaround: 48, biomaterial: 'Venous blood', category: 'Hormones', kind: 'test', templateId: 'hormones', indicatorIds: ['estr'], prep: 'Day 3–5 of the cycle for women', active: true },
  { id: 't_prl', name: 'Prolactin', code: 'E-012', price: 110, turnaround: 48, biomaterial: 'Venous blood', category: 'Hormones', kind: 'test', templateId: 'hormones', indicatorIds: ['prl'], prep: 'Rest 15 minutes before the sample', active: true },
  { id: 't_cort', name: 'Cortisol', code: 'E-013', price: 115, turnaround: 48, biomaterial: 'Venous blood', category: 'Hormones', kind: 'test', templateId: 'hormones', indicatorIds: ['cort'], prep: 'Morning 07:00–10:00, rest 15 minutes before', active: true },
  { id: 't_dhea', name: 'DHEA-S', code: 'E-014', price: 130, turnaround: 72, biomaterial: 'Venous blood', category: 'Hormones', kind: 'test', templateId: 'hormones', indicatorIds: ['dhea'], active: true },
  { id: 't_ua', name: 'Urinalysis', code: 'U-001', price: 45, turnaround: 24, biomaterial: 'Urine', category: 'Urine', kind: 'test', templateId: 'urine', prep: 'First morning urine in a sterile container', active: true },
  { id: 't_koh', name: 'Fungal skin test (KOH)', code: 'M-001', price: 90, turnaround: 24, biomaterial: 'Swab', category: 'Microbiology', kind: 'test', templateId: 'micro', indicatorIds: ['koh'], prep: 'No creams on the area for 2 days', active: true },
  { id: 't_hp', name: 'H. pylori stool antigen', code: 'M-010', price: 150, turnaround: 48, biomaterial: 'Stool', category: 'Microbiology', kind: 'test', templateId: 'micro', indicatorIds: ['hp'], active: true },
  { id: 't_b9', name: 'Folic acid', code: 'V-003', price: 140, turnaround: 72, biomaterial: 'Venous blood', category: 'Vitamins', kind: 'test', templateId: null, active: false },
]

export const TEST_CATEGORIES: TestCategory[] = ['Packages', 'Hematology', 'Biochemistry', 'Vitamins', 'Hormones', 'Urine', 'Microbiology']

/* ─────────────── Partners and doctors ─────────────── */

export type Partner = {
  id: string
  name: string
  status: 'connected' | 'test' | 'off'
  ordersThisMonth: number
  avgTurnaround: number
  priceList: number
  address: string
  connectedAt?: Date
}

export const partners: Partner[] = [
  { id: 'p1', name: 'Diagnostika Plus', status: 'connected', ordersThisMonth: 34, avgTurnaround: 26, priceList: 212, address: 'Bokhtar St 37, Dushanbe', connectedAt: addDays(TODAY, -140) },
  { id: 'p2', name: 'MedLab Dushanbe', status: 'test', ordersThisMonth: 3, avgTurnaround: 31, priceList: 148, address: 'Rudaki Ave 104, Dushanbe' },
  { id: 'p3', name: 'Shifo Lab', status: 'off', ordersThisMonth: 0, avgTurnaround: 0, priceList: 0, address: 'Sino District, Dushanbe' },
]

export const OWN_LAB = 'own'
export const whereLabel = (where: string) => (where === OWN_LAB ? 'Own lab' : (partners.find((p) => p.id === where)?.name ?? 'Partner'))

export const DOCTORS = [
  { value: 's3', label: 'Dilnoza Nazarova', hint: 'Cosmetologist, in house' },
  { value: 'ext1', label: 'Dr. Farhod Rahmonov', hint: 'Endocrinologist' },
  { value: 'ext2', label: 'Dr. Gulchehra Aminova', hint: 'Gynecologist' },
  { value: 'self', label: 'Self-referred', hint: 'Patient’s own request' },
]
export const doctorLabel = (id: string) => DOCTORS.find((d) => d.value === id)?.label ?? id

/* ─────────────── Orders ─────────────── */

export type OrderStatus = 'awaiting' | 'sample_taken' | 'in_progress' | 'sent_partner' | 'ready' | 'sent'

export const ORDER_STATUS: Record<OrderStatus, { label: string; tone: 'neutral' | 'accent' | 'positive' | 'warning' | 'negative' }> = {
  awaiting: { label: 'Awaiting sample', tone: 'neutral' },
  sample_taken: { label: 'Sample taken', tone: 'accent' },
  in_progress: { label: 'In progress', tone: 'accent' },
  sent_partner: { label: 'At partner lab', tone: 'warning' },
  ready: { label: 'Ready', tone: 'positive' },
  sent: { label: 'Sent to patient', tone: 'neutral' },
}

export type LabOrder = {
  id: string
  no: number
  clientId: string
  testIds: string[]
  doctor: string
  where: string
  biomaterials: Biomaterial[]
  status: OrderStatus
  createdAt: Date
  sampleAt?: Date
  readyAt?: Date
  sentAt?: Date
  due: Date
  paid: boolean
  comment?: string
  fromVisit?: boolean
  /** indicator id → entered value */
  results: Record<string, string>
}

export const testById = (tests: LabTest[], id: string) => tests.find((t) => t.id === id)

/** Expand packages into their tests, without duplicates. */
export function expandTests(tests: LabTest[], ids: string[]) {
  const out: LabTest[] = []
  for (const id of ids) {
    const t = testById(tests, id)
    if (!t) continue
    const leaves = t.kind === 'package' ? (t.includes ?? []).map((x) => testById(tests, x)).filter(Boolean) as LabTest[] : [t]
    for (const l of leaves) if (!out.some((o) => o.id === l.id)) out.push(l)
  }
  return out
}

export function indicatorsFor(tests: LabTest[], templates: ResultTemplate[], ids: string[]) {
  const out: (Indicator & { testName: string })[] = []
  for (const t of expandTests(tests, ids)) {
    const tpl = templates.find((x) => x.id === t.templateId)
    if (!tpl) continue
    for (const i of tpl.indicators) {
      if (t.indicatorIds && !t.indicatorIds.includes(i.id)) continue
      if (!out.some((o) => o.id === i.id)) out.push({ ...i, testName: t.name })
    }
  }
  return out
}

export function rangeFor(i: Indicator, c: Client | undefined): Range | undefined {
  const age = c?.birthday ? Math.floor((NOW.getTime() - c.birthday.getTime()) / (365.25 * 86_400_000)) : 30
  const group: RangeGroup = age < 15 ? 'Children' : c?.gender === 'male' ? 'Men' : 'Women'
  return i.ranges.find((r) => r.group === group) ?? i.ranges.find((r) => r.group === 'Women')
}

export type Flag = 'high' | 'low' | 'abnormal' | null

export function flagFor(i: Indicator, value: string, c: Client | undefined): Flag {
  if (!value.trim()) return null
  if (i.qualitative) return value === i.qualitative.normal ? null : 'abnormal'
  const v = Number(value.replace(',', '.'))
  const r = rangeFor(i, c)
  if (Number.isNaN(v) || !r) return null
  if (v < r.low) return 'low'
  if (v > r.high) return 'high'
  return null
}

export function formatRange(i: Indicator, r?: Range) {
  if (i.qualitative) return i.qualitative.normal
  if (!r) return '—'
  if (r.low === 0) return `< ${r.high}`
  return `${r.low}–${r.high}`
}

export const orderAmount = (tests: LabTest[], o: { testIds: string[] }) => o.testIds.reduce((m, id) => m + (testById(tests, id)?.price ?? 0), 0)

export const turnaroundFor = (tests: LabTest[], ids: string[]) =>
  Math.max(0, ...ids.map((id) => testById(tests, id)?.turnaround ?? 0))

/** Biomaterials the selected tests need. */
export const biomaterialsFor = (tests: LabTest[], ids: string[]) => [...new Set(expandTests(tests, ids).map((t) => t.biomaterial))]

const r = seeded(7710)

function fakeValue(i: Indicator, c: Client | undefined, abnormal: boolean) {
  if (i.qualitative) return abnormal ? i.qualitative.options[1] : i.qualitative.normal
  const range = rangeFor(i, c)
  if (!range) return ''
  const span = range.high - range.low
  let v: number
  if (abnormal) v = r.chance(0.6) ? range.low - Math.max(span * 0.18, range.low * 0.25) : range.high + span * 0.22
  else v = range.low + span * (0.18 + r.next() * 0.6)
  return Math.max(0, v).toFixed(i.decimals)
}

type Seed = {
  no: number
  client: string
  tests: string[]
  doctor: string
  where: string
  status: OrderStatus
  /** Minutes before now that the order was created. */
  ago: number
  paid?: boolean
  comment?: string
  fromVisit?: boolean
  /** Indicator ids that come back outside the range. */
  abnormal?: string[]
}

const SEEDS: Seed[] = [
  { no: 1060, client: 'c5', tests: ['p_preproc'], doctor: 's3', where: OWN_LAB, status: 'awaiting', ago: 12, fromVisit: true, comment: 'Before biorevitalization on Saturday' },
  { no: 1059, client: 'c11', tests: ['t_ferr', 't_vitd'], doctor: 's3', where: OWN_LAB, status: 'awaiting', ago: 26 },
  { no: 1058, client: 'c22', tests: ['t_cbc', 't_glu'], doctor: 'self', where: OWN_LAB, status: 'sample_taken', ago: 48 },
  { no: 1057, client: 'c1', tests: ['p_hair'], doctor: 's3', where: 'p1', status: 'sent_partner', ago: 95, comment: 'Diffuse hair thinning for 4 months' },
  { no: 1056, client: 'c27', tests: ['t_tsh', 't_ft4'], doctor: 'ext1', where: OWN_LAB, status: 'in_progress', ago: 140 },
  { no: 1055, client: 'c43', tests: ['t_cbc'], doctor: 's3', where: OWN_LAB, status: 'sent', ago: 260, abnormal: ['hgb'] },
  { no: 1054, client: 'c18', tests: ['t_cbc', 't_alt', 't_ast'], doctor: 's3', where: OWN_LAB, status: 'ready', ago: 300, fromVisit: true },
  { no: 1053, client: 'c14', tests: ['t_testo', 't_glu'], doctor: 'self', where: OWN_LAB, status: 'ready', ago: 330, abnormal: ['testo'] },
  { no: 1052, client: 'c30', tests: ['t_koh'], doctor: 's3', where: OWN_LAB, status: 'in_progress', ago: 380, comment: 'Scaling on the left cheek' },
  { no: 1051, client: 'c36', tests: ['p_cosmo'], doctor: 'ext2', where: 'p1', status: 'sent_partner', ago: 60 * 20, paid: true },
  { no: 1050, client: 'c2', tests: ['t_ua', 't_cbc'], doctor: 'self', where: OWN_LAB, status: 'ready', ago: 60 * 22, paid: false },
  { no: 1049, client: 'c12', tests: ['t_lipid', 't_hba1c'], doctor: 'ext1', where: OWN_LAB, status: 'sent', ago: 60 * 27, abnormal: ['ldl'] },
  { no: 1048, client: 'c29', tests: ['t_vitd', 't_b12'], doctor: 's3', where: 'p1', status: 'sent', ago: 60 * 45, abnormal: ['vitd'] },
  { no: 1047, client: 'c3', tests: ['t_ferr', 't_iron'], doctor: 's3', where: OWN_LAB, status: 'sent', ago: 60 * 50, abnormal: ['ferritin'] },
  { no: 1046, client: 'c21', tests: ['t_hp'], doctor: 'self', where: 'p1', status: 'sent', ago: 60 * 51 },
  { no: 1045, client: 'c40', tests: ['t_estr', 't_prl'], doctor: 'ext2', where: OWN_LAB, status: 'in_progress', ago: 60 * 53 },
  { no: 1044, client: 'c32', tests: ['p_preproc'], doctor: 's3', where: OWN_LAB, status: 'sent', ago: 60 * 96 },
  { no: 1043, client: 'c10', tests: ['t_cort', 't_dhea'], doctor: 'ext1', where: 'p2', status: 'sent', ago: 60 * 120 },
  { no: 1042, client: 'c15', tests: ['t_cbc'], doctor: 's3', where: OWN_LAB, status: 'sent', ago: 60 * 140 },
  { no: 1041, client: 'c20', tests: ['t_tsh'], doctor: 'self', where: OWN_LAB, status: 'sent', ago: 60 * 165 },
]

function buildOrders(tests: LabTest[], templates: ResultTemplate[]): LabOrder[] {
  return SEEDS.map((s) => {
    const createdAt = addMinutes(NOW, -s.ago)
    const client = clients.find((c) => c.id === s.client)
    const hours = turnaroundFor(tests, s.tests)
    const sampled = s.status !== 'awaiting'
    const sampleAt = sampled ? addMinutes(createdAt, 8 + r.int(0, 20)) : undefined
    const due = addMinutes(sampleAt ?? createdAt, hours * 60)
    const finished = s.status === 'ready' || s.status === 'sent'
    // Results can't be ready in the future; recent "sent" orders went out a couple of hours ago.
    const latest = addMinutes(NOW, s.status === 'sent' ? -150 : -25)
    const computed = finished ? addMinutes(sampleAt!, Math.round(hours * 60 * (0.55 + r.next() * 0.4))) : undefined
    const readyAt = computed && computed > latest ? latest : computed
    const results: Record<string, string> = {}
    if (s.status === 'in_progress' || finished) {
      const list = indicatorsFor(tests, templates, s.tests)
      list.forEach((i, idx) => {
        if (s.status === 'in_progress' && idx % 2 === 1) return
        results[i.id] = fakeValue(i, client, !!s.abnormal?.includes(i.id))
      })
    }
    return {
      id: `lo${s.no}`,
      no: s.no,
      clientId: s.client,
      testIds: s.tests,
      doctor: s.doctor,
      where: s.where,
      biomaterials: biomaterialsFor(tests, s.tests),
      status: s.status,
      createdAt,
      sampleAt,
      readyAt,
      sentAt: s.status === 'sent' && readyAt ? addMinutes(readyAt, 6) : undefined,
      due,
      paid: s.paid ?? true,
      comment: s.comment,
      fromVisit: s.fromVisit,
      results,
    }
  })
}

export const initialOrders = buildOrders(initialTests, initialTemplates)

/* ─────────────── History for reports ─────────────── */

const hr = seeded(9001)

export type DayStat = { date: Date; orders: number; revenue: number; overdue: number; abnormal: number; byTest: Record<string, number> }

/** Daily lab activity for the last 120 days, deterministic. */
export const history: DayStat[] = Array.from({ length: 120 }, (_, i) => {
  const date = addDays(TODAY, i - 119)
  const weekday = date.getDay()
  const base = weekday === 0 ? 3 : weekday === 6 ? 9 : 7
  const orders = Math.max(0, base + hr.int(-3, 4))
  const byTest: Record<string, number> = {}
  let revenue = 0
  const pool = ['t_cbc', 't_cbc', 't_glu', 'p_preproc', 'p_preproc', 't_ferr', 't_vitd', 't_vitd', 't_tsh', 'p_cosmo', 'p_hair', 't_lipid', 't_ua', 't_testo', 't_koh', 't_hba1c']
  for (let k = 0; k < orders; k++) {
    const id = hr.pick(pool)
    byTest[id] = (byTest[id] ?? 0) + 1
    revenue += initialTests.find((t) => t.id === id)?.price ?? 0
  }
  return {
    date,
    orders,
    revenue,
    overdue: hr.chance(0.35) ? 1 : 0,
    abnormal: Math.round(orders * (0.12 + hr.next() * 0.16)),
    byTest,
  }
})

/** Typical turnaround per test from history (hours), stable per test. */
export function medianTurnaround(t: LabTest) {
  const jitter = (t.code.charCodeAt(t.code.length - 1) % 7) - 3
  return Math.max(2, Math.round(t.turnaround * 0.78 + jitter))
}

export const abnormalShare = (t: LabTest) => {
  const n = t.code.charCodeAt(2) + t.code.charCodeAt(4)
  return t.id === 't_vitd' ? 58 : t.id === 't_ferr' ? 34 : 6 + (n % 19)
}
