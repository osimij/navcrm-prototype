import { useState } from 'react'
import { Route, Routes } from 'react-router'
import { Page, PageHeader } from '@/components/ui/page'
import { LinkTabs } from '@/components/ui/tabs'
import { useReviews, type Period } from './data'
import { Overview } from './overview'
import { Photos } from './photos'
import { Platforms } from './platforms'
import { Reviews } from './reviews'

export default function Channels() {
  const [period, setPeriod] = useState<Period>('30')
  const unreplied = useReviews((s) => s.reviews.filter((r) => !r.reply).length)
  return (
    <Page>
      <PageHeader
        title="Instagram & maps"
        subtitle="Where clients find you, and what they say"
        tabs={
          <LinkTabs
            items={[
              { to: '/channels', label: 'Overview', end: true },
              { to: '/channels/platforms', label: 'Platforms' },
              { to: '/channels/reviews', label: 'Reviews', count: unreplied || undefined },
              { to: '/channels/photos', label: 'Photos' },
            ]}
          />
        }
      />
      <Routes>
        <Route index element={<Overview period={period} setPeriod={setPeriod} />} />
        <Route path="platforms" element={<Platforms />} />
        <Route path="reviews" element={<div className="max-w-[860px]"><Reviews /></div>} />
        <Route path="photos" element={<Photos />} />
      </Routes>
    </Page>
  )
}
