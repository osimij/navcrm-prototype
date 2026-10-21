import { useState } from 'react'
import { Route, Routes, useLocation, useNavigate } from 'react-router'
import { I } from '@/components/icons'
import { Button } from '@/components/ui/button'
import { Page, PageHeader } from '@/components/ui/page'
import { LinkTabs } from '@/components/ui/tabs'
import { CampaignList } from './campaign-list'
import { DiscountCards, IssueCards } from './discount-cards'
import { DiscountOffer } from './discount-offer'
import { NewCampaign } from './new-campaign'
import { useCampaigns } from './store'

function CampaignsLayout() {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const cards = useCampaigns((s) => s.cards.length)
  const [offer, setOffer] = useState(false)
  const [issue, setIssue] = useState(false)
  const onCards = pathname.startsWith('/campaigns/discounts')

  return (
    <Page>
      <PageHeader
        title="Campaigns"
        subtitle="Bring clients back with messages, discounts and bonuses"
        actions={
          onCards ? (
            <Button variant="primary" icon={I.add} onClick={() => setIssue(true)}>
              Issue cards
            </Button>
          ) : (
            <>
              <Button icon={I.discount} onClick={() => setOffer(true)}>
                Discount offer
              </Button>
              <Button variant="primary" icon={I.add} onClick={() => navigate('/campaigns/new')}>
                New campaign
              </Button>
            </>
          )
        }
        tabs={
          <LinkTabs
            items={[
              { to: '/campaigns', label: 'Campaigns', end: true },
              { to: '/campaigns/discounts', label: 'Discount cards', count: cards },
            ]}
          />
        }
      />
      <Routes>
        <Route index element={<CampaignList />} />
        <Route path="discounts" element={<DiscountCards />} />
      </Routes>
      <DiscountOffer open={offer} onOpenChange={setOffer} />
      <IssueCards open={issue} onOpenChange={setIssue} />
    </Page>
  )
}

export default function Campaigns() {
  return (
    <Routes>
      <Route path="new" element={<NewCampaign />} />
      <Route path="*" element={<CampaignsLayout />} />
    </Routes>
  )
}
