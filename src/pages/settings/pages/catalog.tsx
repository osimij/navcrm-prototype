import { useState } from 'react'
import { toast } from 'sonner'
import { I, Icon } from '@/components/icons'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox, Chip, Switch } from '@/components/ui/controls'
import { Textarea } from '@/components/ui/input'
import { Segmented } from '@/components/ui/tabs'
import { cn } from '@/lib/cn'
import { MiniStat, useSettingsForm } from '../parts-b/shared'
import { SaveBar, SettingsPage, SettingsRow, SettingsSection } from '../ui'

const CATEGORIES = ['Hair', 'Nails', 'Brows & lashes', 'Cosmetology', 'Barbershop', 'Massage', 'Makeup', 'Spa', 'Laboratory']
type Lang = 'tg' | 'ru' | 'en'

export default function CatalogSettings() {
  const form = useSettingsForm({
    published: true,
    prices: true,
    masters: true,
    photos: true,
    audience: 'any' as 'any' | 'women' | 'men',
    categories: ['Hair', 'Nails', 'Brows & lashes', 'Cosmetology'] as string[],
    descTg: 'Салони зебоӣ дар маркази Душанбе: мӯй, нохун, абрӯ ва косметология. Сабти онлайн 24/7.',
    descRu: 'Салон красоты в центре Душанбе: волосы, ногти, брови и косметология. Онлайн-запись круглосуточно.',
    descEn: 'Beauty salon in central Dushanbe: hair, nails, brows and cosmetology. Book online any time.',
  })
  const [lang, setLang] = useState<Lang>('en')
  const v = form.value
  const descKey = lang === 'tg' ? 'descTg' : lang === 'ru' ? 'descRu' : 'descEn'
  const full = v.categories.length >= 5
  const toggle = (c: string) =>
    form.set('categories', v.categories.includes(c) ? v.categories.filter((x) => x !== c) : full ? v.categories : [...v.categories, c])

  return (
    <SettingsPage
      title="NavCRM catalog"
      description="People in Tajikistan find salons and clinics in the NavCRM catalog and book straight into your calendar."
      actions={
        <Button icon={I.arrowUpRight} onClick={() => toast('Opens navcrm.tj/catalog/sitora in a new tab')}>
          View listing
        </Button>
      }
    >
      <SettingsSection title="Last 30 days">
        <div className="mt-4 grid grid-cols-2 gap-2.5 sm:grid-cols-3">
          <MiniStat label="Listing views" value="2,412" />
          <MiniStat label="Went to booking" value="318" hint="13% of views" />
          <MiniStat label="Bookings" value="74" hint="23% of those" />
          <MiniStat label="Calls" value="41" />
          <MiniStat label="Route requests" value="96" />
          <MiniStat label="Rating" value="4.8" hint="from 212 reviews" />
        </div>
      </SettingsSection>

      <SettingsSection title="Listing">
        <SettingsRow label="Show in the catalog" description="Changes to the description and photos are checked within a day.">
          <div className="flex items-center justify-between gap-3">
            {v.published ? (
              <Badge tone="positive" dot>
                Published
              </Badge>
            ) : (
              <Badge dot>Hidden</Badge>
            )}
            <Switch checked={v.published} onChange={(x) => form.set('published', x)} />
          </div>
        </SettingsRow>
        <SettingsRow label="Show">
          <div className="flex flex-col gap-2.5">
            <Checkbox checked={v.prices} onChange={(x) => form.set('prices', x)} label="Prices" />
            <Checkbox checked={v.masters} onChange={(x) => form.set('masters', x)} label="Masters and their ratings" />
            <Checkbox checked={v.photos} onChange={(x) => form.set('photos', x)} label="Portfolio photos (only with client consent)" />
          </div>
        </SettingsRow>
        <SettingsRow label="Who you serve">
          <Segmented
            value={v.audience}
            onChange={(a) => form.set('audience', a)}
            items={[
              { value: 'any', label: 'Everyone' },
              { value: 'women', label: 'Women' },
              { value: 'men', label: 'Men' },
            ]}
          />
        </SettingsRow>
        <SettingsRow label="Categories" description={`Up to 5. ${v.categories.length} chosen.`}>
          <div className="flex flex-wrap gap-1.5">
            {CATEGORIES.map((c) => {
              const on = v.categories.includes(c)
              return (
                <span key={c} className={cn(!on && full && 'opacity-45')}>
                  <Chip active={on} onClick={() => toggle(c)}>
                    {c}
                  </Chip>
                </span>
              )
            })}
          </div>
        </SettingsRow>
        <SettingsRow label="Description" description="Shown under your name. Each language is shown to people who use it.">
          <Segmented
            size="sm"
            value={lang}
            onChange={setLang}
            className="mb-2"
            items={[
              { value: 'tg', label: 'Тоҷикӣ' },
              { value: 'ru', label: 'Русский' },
              { value: 'en', label: 'English' },
            ]}
          />
          <Textarea rows={3} value={v[descKey]} maxLength={300} onChange={(e) => form.set(descKey, e.target.value)} />
          <p className="mt-1.5 flex items-center justify-between text-xs text-faint">
            <span className="flex items-center gap-1">
              <Icon icon={I.info} size={12} />
              No phone numbers or links; clients book through the button.
            </span>
            <span className="tabular">{v[descKey].length} / 300</span>
          </p>
        </SettingsRow>
      </SettingsSection>

      <SaveBar dirty={form.dirty} onSave={form.save} onDiscard={form.discard} />
    </SettingsPage>
  )
}
