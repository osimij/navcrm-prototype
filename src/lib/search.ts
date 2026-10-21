import type { Client } from '@/data/clients'

/**
 * Front desks look clients up by name or by the last digits of their phone,
 * so both work in every client search.
 */
export function searchClients(clients: Client[], query: string, limit = 8) {
  const q = query.trim().toLowerCase()
  const active = clients.filter((c) => !c.archived)
  if (!q) {
    return [...active].sort((a, b) => (b.lastVisit?.getTime() ?? 0) - (a.lastVisit?.getTime() ?? 0)).slice(0, limit)
  }
  const digits = q.replace(/\D/g, '')
  const words = q.split(/\s+/).filter(Boolean)
  return active
    .filter((c) => {
      if (digits.length >= 2 && digits.length === q.replace(/\s/g, '').length) {
        const phone = c.phone.replace(/\D/g, '')
        return digits.length <= 4 ? phone.endsWith(digits) || phone.includes(digits) : phone.includes(digits)
      }
      const name = c.name.toLowerCase()
      return words.every((w) => name.includes(w))
    })
    .slice(0, limit)
}
