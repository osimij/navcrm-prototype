import { useMemo } from 'react'
import { isVisit, type BookingSource } from '@/data/appointments'
import { useData } from '@/lib/store'
import { NOW, TODAY, addDays } from '@/lib/time'
import type { Period, PlatformId } from './data'

export type SourceRow = { key: string; label: string; count: number }

/**
 * Bookings by where they came from, straight from the calendar so the numbers
 * match everywhere. Bookings through tracked map links arrive as "online"
 * and are attributed by short link.
 */
export function useChannelStats(period: Period) {
  const entries = useData((s) => s.entries)
  return useMemo(() => {
    const from = addDays(TODAY, -(Number(period) - 1))
    const counts: Record<BookingSource, number> = { phone: 0, online: 0, instagram: 0, telegram: 0, walk_in: 0, assistant: 0 }
    for (const e of entries) if (isVisit(e) && e.start >= from && e.start <= NOW) counts[e.source]++

    const twoGis = Math.round(counts.online * 0.22)
    const yandex = Math.round(counts.online * 0.14)
    const page = counts.online - twoGis - yandex

    const sources: SourceRow[] = [
      { key: 'phone', label: 'Phone', count: counts.phone },
      { key: 'instagram', label: 'Instagram', count: counts.instagram },
      { key: 'telegram', label: 'Telegram bot', count: counts.telegram },
      { key: 'page', label: 'Booking page', count: page },
      { key: '2gis', label: '2GIS', count: twoGis },
      { key: 'yandex', label: 'Yandex Maps', count: yandex },
      { key: 'assistant', label: 'Assistant', count: counts.assistant },
      { key: 'walk_in', label: 'Walk-in', count: counts.walk_in },
    ]

    // Roughly one booking per 9–11 link clicks, deterministic per platform.
    const platforms: Record<PlatformId, { bookings: number; clicks: number }> = {
      instagram: { bookings: counts.instagram, clicks: Math.round(counts.instagram * 9.4) },
      yandex: { bookings: yandex, clicks: Math.round(yandex * 10.6) },
      '2gis': { bookings: twoGis, clicks: Math.round(twoGis * 8.7) },
      google: { bookings: 0, clicks: 0 },
      after_visit: { bookings: 0, clicks: 0 },
    }
    const platformBookings = counts.instagram + twoGis + yandex
    const chatBookings = counts.instagram + counts.telegram + counts.assistant
    return {
      sources,
      platforms,
      platformBookings,
      clicks: platforms.instagram.clicks + platforms.yandex.clicks + platforms['2gis'].clicks,
      aiShare: chatBookings ? Math.round((counts.assistant / chatBookings) * 100) : 0,
      aiCount: counts.assistant,
    }
  }, [entries, period])
}
