import { create } from 'zustand'
import { initialCampaigns, initialCards, type Campaign, type CampaignStatus, type DiscountCard } from './data'

type CampaignStore = {
  campaigns: Campaign[]
  cards: DiscountCard[]
  upsert: (c: Campaign) => void
  setStatus: (id: string, status: CampaignStatus) => void
  addCard: (c: DiscountCard) => void
}

export const useCampaigns = create<CampaignStore>()((set) => ({
  campaigns: initialCampaigns,
  cards: initialCards,
  upsert: (c) =>
    set((s) => (s.campaigns.some((x) => x.id === c.id) ? { campaigns: [c, ...s.campaigns.filter((x) => x.id !== c.id)] } : { campaigns: [c, ...s.campaigns] })),
  setStatus: (id, status) => set((s) => ({ campaigns: s.campaigns.map((c) => (c.id === id ? { ...c, status } : c)) })),
  addCard: (c) => set((s) => ({ cards: [c, ...s.cards] })),
}))
