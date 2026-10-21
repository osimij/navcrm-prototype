import { seeded } from '@/lib/random'
import { TODAY, addDays } from '@/lib/time'

export type ClientCategory = 'new' | 'regular' | 'vip' | 'lost'
export type ClientSource = 'Instagram' | 'Walk-in' | 'Referral' | '2GIS' | 'Yandex Maps' | 'Telegram bot' | 'Google' | 'Booking page'

export type Client = {
  id: string
  firstName: string
  lastName: string
  name: string
  phone: string
  gender: 'female' | 'male'
  birthday: Date | null
  category: ClientCategory
  visits: number
  totalSpent: number
  lastVisit: Date | null
  bonuses: number
  debt: number
  tags: string[]
  source: ClientSource
  consentMarketing: boolean
  favoriteStaffId: string
  createdAt: Date
  archived: boolean
  note?: string
  telegram?: boolean
}

export const CATEGORY_LABEL: Record<ClientCategory, string> = {
  new: 'New',
  regular: 'Regular',
  vip: 'VIP',
  lost: 'Lost',
}

const FEMALE = ['Madina', 'Nilufar', 'Gulnora', 'Mehrona', 'Manizha', 'Farzona', 'Tahmina', 'Sabrina', 'Mavjuda', 'Zulfiya', 'Nargis', 'Shabnam', 'Laylo', 'Munisa', 'Rukhshona', 'Sevara', 'Gulbahor', 'Farangis', 'Dilafruz', 'Zebo', 'Komila', 'Mohira', 'Shirin', 'Anisa', 'Bonu', 'Oisha', 'Robiya', 'Sumaya', 'Yasmina', 'Zarnigor', 'Aziza', 'Dildora', 'Feruza', 'Iroda', 'Lola', 'Marjona', 'Nodira', 'Ozoda', 'Sarvinoz', 'Sitora', 'Malika', 'Parvina']
const MALE = ['Farrukh', 'Behruz', 'Shahrom', 'Daler', 'Firdavs', 'Jamshed', 'Kamol', 'Mansur', 'Navruz', 'Parviz', 'Sino', 'Umed', 'Bahrom', 'Faridun', 'Abdullo', 'Siyovush', 'Khurshed', 'Alisher']
const SURNAMES = ['Rahimova', 'Saidova', 'Nazarova', 'Umarova', 'Yusupova', 'Kurbonova', 'Sharipova', 'Davlatova', 'Mirzoeva', 'Safarova', 'Hakimova', 'Boboeva', 'Nematova', 'Rajabova', 'Sodikova', 'Khalimova', 'Jurayeva', 'Azimova', 'Ismoilova', 'Kholova', 'Tursunova', 'Normatova', 'Sattorova', 'Qodirova', 'Odinaeva']
const OPERATORS = ['90', '91', '92', '93', '98', '50', '55', '88', '77', '00', '11']
const SOURCES: ClientSource[] = ['Instagram', 'Instagram', 'Walk-in', 'Referral', 'Referral', '2GIS', 'Yandex Maps', 'Telegram bot', 'Google', 'Booking page']
const TAGS = ['Prefers mornings', 'Sensitive skin', 'Allergic to latex', 'Pays with Alif', 'Bride 2026', 'Brings a friend', 'Corporate', 'Quiet visit']
const MASTERS = ['s1', 's1', 's2', 's2', 's3', 's4', 's6']

const r = seeded(20261022)

function makeClient(i: number): Client {
  // The first 136 clients are referenced across the demo; later ones add a realistic base
  // (and more men for the barber).
  const male = i < 136 ? i % 7 === 6 : i % 4 === 3
  const firstName = male ? r.pick(MALE) : r.pick(FEMALE)
  const surname = r.pick(SURNAMES)
  const lastName = male ? surname.replace(/a$/, '') : surname
  const roll = r.next()
  const category: ClientCategory = roll < 0.09 ? 'vip' : roll < 0.52 ? 'regular' : roll < 0.74 ? 'new' : 'lost'

  const visits =
    category === 'new' ? r.int(1, 2) : category === 'regular' ? r.int(3, 18) : category === 'vip' ? r.int(14, 46) : r.int(2, 9)
  const avg = category === 'vip' ? r.int(420, 780) : r.int(110, 360)
  const lastDays =
    category === 'new' ? r.int(0, 18) : category === 'regular' ? r.int(1, 48) : category === 'vip' ? r.int(0, 26) : r.int(64, 240)

  const bdayYear = r.int(1978, 2004)
  const bday = new Date(bdayYear, r.int(0, 11), r.int(1, 28))

  return {
    id: `c${i + 1}`,
    firstName,
    lastName,
    name: `${firstName} ${lastName}`,
    phone: `+992${r.pick(OPERATORS)}${String(r.int(1000000, 9999999))}`,
    gender: male ? 'male' : 'female',
    birthday: r.chance(0.86) ? bday : null,
    category,
    visits,
    totalSpent: Math.round((visits * avg) / 10) * 10,
    lastVisit: addDays(TODAY, -lastDays),
    bonuses: category === 'vip' ? r.int(300, 1400) : category === 'regular' ? r.int(0, 420) : 0,
    debt: 0,
    tags: r.chance(0.35) ? [r.pick(TAGS)] : [],
    source: r.pick(SOURCES),
    consentMarketing: r.chance(0.86),
    favoriteStaffId: male ? 's5' : r.pick(MASTERS),
    createdAt: addDays(TODAY, -(lastDays + visits * r.int(14, 40))),
    archived: false,
    telegram: r.chance(0.62),
  }
}

export const clients: Client[] = Array.from({ length: 520 }, (_, i) => makeClient(i))

// A few hand-placed details so every filter and story in the demo has data.
const patch = (i: number, p: Partial<Client>) => Object.assign(clients[i], p)
patch(0, { firstName: 'Nilufar', lastName: 'Davlatova', name: 'Nilufar Davlatova', gender: 'female', category: 'vip', visits: 38, totalSpent: 24860, bonuses: 1240, lastVisit: addDays(TODAY, -9), favoriteStaffId: 's1', tags: ['Prefers mornings'], note: 'Coffee without sugar. Always books coloring with Madina.', telegram: true, source: 'Referral' })
patch(1, { firstName: 'Mehrona', lastName: 'Safarova', name: 'Mehrona Safarova', gender: 'female', category: 'regular', debt: 320, visits: 11, totalSpent: 3640 })
patch(2, { firstName: 'Farzona', lastName: 'Hakimova', name: 'Farzona Hakimova', gender: 'female', birthday: new Date(1994, addDays(TODAY, 2).getMonth(), addDays(TODAY, 2).getDate()), category: 'regular' })
patch(3, { birthday: new Date(1989, addDays(TODAY, 4).getMonth(), addDays(TODAY, 4).getDate()) })
patch(4, { birthday: new Date(2001, addDays(TODAY, 1).getMonth(), addDays(TODAY, 1).getDate()) })
patch(5, { debt: 150 })
patch(9, { debt: 560, category: 'regular' })
patch(14, { debt: 90 })
patch(20, { archived: true })
patch(31, { archived: true })
patch(7, { firstName: 'Shabnam', lastName: 'Nematova', name: 'Shabnam Nematova', gender: 'female', category: 'lost', visits: 7, lastVisit: addDays(TODAY, -73), totalSpent: 1890 })
patch(12, { category: 'new', visits: 1, lastVisit: TODAY, createdAt: TODAY, totalSpent: 160 })
patch(16, { category: 'new', visits: 0, lastVisit: null, createdAt: TODAY, totalSpent: 0, source: 'Instagram' })
patch(23, { category: 'new', visits: 1, lastVisit: TODAY, createdAt: TODAY, totalSpent: 300, source: 'Telegram bot' })

export const clientById = Object.fromEntries(clients.map((c) => [c.id, c])) as Record<string, Client>

/** Clients whose birthday falls within the next 7 days. */
export function birthdaySoon(c: Client, days = 7) {
  if (!c.birthday) return false
  for (let d = 0; d <= days; d++) {
    const day = addDays(TODAY, d)
    if (day.getMonth() === c.birthday.getMonth() && day.getDate() === c.birthday.getDate()) return true
  }
  return false
}
