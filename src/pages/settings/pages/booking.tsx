import { useState } from 'react'
import { Link } from 'react-router'
import { toast } from 'sonner'
import { I, Icon } from '@/components/icons'
import { Button, IconButton } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Checkbox, Switch } from '@/components/ui/controls'
import { Modal } from '@/components/ui/dialog'
import { Field, Input } from '@/components/ui/input'
import { Meter, Money } from '@/components/ui/misc'
import { Popover } from '@/components/ui/popover'
import { Select } from '@/components/ui/select'
import { Segmented, Tabs } from '@/components/ui/tabs'
import { Table, TD, TH, THead, TR } from '@/components/ui/table'
import { business } from '@/data/business'
import { CodeBlock, CopyField, FakeQR, copy, useDraft } from '../parts-a/common'
import { SaveBar, SettingsPage, SettingsRow, SettingsSection } from '../ui'

type Tab = 'rules' | 'prepay' | 'links' | 'widget' | 'sources'

const LINK = business.bookingLink

const opt = (pairs: [string, string][]) => pairs.map(([value, label]) => ({ value, label }))

function Rules() {
  const f = useDraft({
    branches: { b1: true, b2: true } as Record<string, boolean>,
    step: '15',
    notice: '60',
    horizon: '30',
    deadline: '120',
    anyMaster: true,
    prices: true,
    reviews: true,
  })
  const { draft, patch } = f
  return (
    <>
      <SettingsSection title="Your booking page">
        <SettingsRow label="Link" description="Put it in your Instagram bio, on 2GIS and in Telegram.">
          <div className="flex items-center gap-2">
            <CopyField value={LINK} className="flex-1" />
            <IconButton icon={I.arrowUpRight} label="Open booking page" variant="outline" onClick={() => window.open(`https://${LINK}`, '_blank', 'noreferrer')} />
            <Popover
              align="end"
              className="p-4"
              trigger={<IconButton icon={I.qr} label="QR code" variant="outline" size="md" tooltip={false} />}
            >
              <div className="flex flex-col items-center gap-3">
                <FakeQR value={LINK} size={168} />
                <div className="text-sm text-muted">Print it for the reception desk</div>
                <Button size="sm" icon={I.download} onClick={() => toast.success('QR code saved as PNG')}>
                  Download PNG
                </Button>
              </div>
            </Popover>
          </div>
        </SettingsRow>
        <SettingsRow label="Branches taking bookings" description="Turn one off while it’s being renovated, for example.">
          <div className="flex flex-col gap-3">
            {business.branches.map((b) => (
              <Switch
                key={b.id}
                checked={draft.branches[b.id]}
                onChange={(on) => patch({ branches: { ...draft.branches, [b.id]: on } })}
                label={b.name}
                description={b.address}
              />
            ))}
          </div>
        </SettingsRow>
      </SettingsSection>

      <SettingsSection title="Rules">
        <SettingsRow label="Time step" description="How often start times are offered.">
          <Select value={draft.step} onChange={(step) => patch({ step })} options={opt([['15', 'Every 15 min'], ['30', 'Every 30 min'], ['60', 'Every hour']])} className="max-w-56" />
        </SettingsRow>
        <SettingsRow label="Minimum notice" description="So nobody books a visit that starts in five minutes.">
          <Select value={draft.notice} onChange={(notice) => patch({ notice })} options={opt([['0', 'None'], ['30', '30 min ahead'], ['60', '1 hour ahead'], ['120', '2 hours ahead'], ['1440', 'A day ahead']])} className="max-w-56" />
        </SettingsRow>
        <SettingsRow label="How far ahead" description="Clients can’t book beyond this.">
          <Select value={draft.horizon} onChange={(horizon) => patch({ horizon })} options={opt([['7', '1 week'], ['14', '2 weeks'], ['30', '30 days'], ['60', '60 days'], ['90', '90 days']])} className="max-w-56" />
        </SettingsRow>
        <SettingsRow label="Cancel or reschedule until" description="After this, clients have to call you.">
          <Select value={draft.deadline} onChange={(deadline) => patch({ deadline })} options={opt([['0', 'Any time'], ['120', '2 hours before'], ['720', '12 hours before'], ['1440', '24 hours before']])} className="max-w-56" />
        </SettingsRow>
        <SettingsRow label="Options">
          <div className="flex flex-col gap-4">
            <Switch checked={draft.anyMaster} onChange={(anyMaster) => patch({ anyMaster })} label="Let clients pick “any master”" description="Fills gaps: we pick whoever is free." />
            <Switch checked={draft.prices} onChange={(prices) => patch({ prices })} label="Show prices" />
            <Switch
              checked={draft.reviews}
              onChange={(reviews) => patch({ reviews })}
              label="Ask happy clients for a public review"
              description="Clients who rate a visit 4–5★ get a link to 2GIS, Yandex Maps or Google."
            />
          </div>
        </SettingsRow>
      </SettingsSection>
      <SaveBar dirty={f.dirty} onSave={() => f.save('Booking rules saved')} onDiscard={f.discard} />
    </>
  )
}

function Prepayment() {
  const f = useDraft({ on: true, newClients: true, noShows: true, noShowCount: '2', mode: 'percent' as 'full' | 'percent' | 'fixed', amount: '30', timeout: '30' })
  const { draft, patch } = f
  return (
    <>
      <SettingsSection title="Prepayment" description="Cuts no-shows. Clients pay with Alif, DC Wallet or Korti Milli right on the booking page.">
        <SettingsRow label="Ask for prepayment">
          <Switch aria-label="Ask for prepayment" checked={draft.on} onChange={(on) => patch({ on })} />
        </SettingsRow>
        {draft.on && (
          <>
            <SettingsRow label="Who pays ahead">
              <div className="flex flex-col gap-3">
                <Checkbox checked={draft.newClients} onChange={(newClients) => patch({ newClients })} label="New clients" />
                <div className="flex flex-wrap items-center gap-2">
                  <Checkbox checked={draft.noShows} onChange={(noShows) => patch({ noShows })} label="Clients with at least" />
                  <Select value={draft.noShowCount} onChange={(noShowCount) => patch({ noShowCount })} options={opt([['1', '1 no-show'], ['2', '2 no-shows'], ['3', '3 no-shows']])} look="pill" />
                </div>
              </div>
            </SettingsRow>
            <SettingsRow label="Amount">
              <div className="flex flex-wrap items-center gap-3">
                <Segmented
                  value={draft.mode}
                  onChange={(mode) => patch({ mode })}
                  items={[
                    { value: 'full', label: 'Full price' },
                    { value: 'percent', label: 'Percent' },
                    { value: 'fixed', label: 'Fixed' },
                  ]}
                />
                {draft.mode !== 'full' && (
                  <Input
                    className="w-28"
                    inputMode="numeric"
                    suffix={draft.mode === 'percent' ? '%' : 'TJS'}
                    value={draft.amount}
                    onChange={(e) => patch({ amount: e.target.value.replace(/\D/g, '') })}
                  />
                )}
              </div>
              {draft.mode === 'percent' && (
                <p className="mt-2 text-sm text-muted">
                  For a <Money value={450} /> coloring that’s <Money value={Math.round((450 * Number(draft.amount || 0)) / 100)} />.
                </p>
              )}
            </SettingsRow>
            <SettingsRow label="Unpaid bookings" description="The slot is freed and offered to the waiting list.">
              <Select value={draft.timeout} onChange={(timeout) => patch({ timeout })} options={opt([['15', 'Cancel after 15 min'], ['30', 'Cancel after 30 min'], ['60', 'Cancel after 1 hour']])} className="max-w-56" />
            </SettingsRow>
          </>
        )}
      </SettingsSection>
      <p className="-mt-6 text-sm text-muted">
        Payments go through your connected provider.{' '}
        <Link to="/settings/payouts" className="font-medium text-fg hover:underline underline-offset-4">
          Online payments
        </Link>
      </p>
      <SaveBar dirty={f.dirty} onSave={() => f.save('Prepayment rules saved')} onDiscard={f.discard} />
    </>
  )
}

type ShortLink = { id: string; channel: string; slug: string; clicks: number; bookings: number }

function Links() {
  const [links, setLinks] = useState<ShortLink[]>([
    { id: 'l1', channel: 'Instagram bio', slug: 'k7Qa', clicks: 1284, bookings: 96 },
    { id: 'l2', channel: '2GIS', slug: 'p2Xm', clicks: 412, bookings: 38 },
    { id: 'l3', channel: 'Yandex Maps', slug: 'y9Lc', clicks: 268, bookings: 21 },
    { id: 'l4', channel: 'Google Business', slug: 'g4Hd', clicks: 97, bookings: 6 },
    { id: 'l5', channel: 'QR at reception', slug: 'q1Rt', clicks: 143, bookings: 29 },
    { id: 'l6', channel: 'Telegram channel', slug: 't6Nv', clicks: 188, bookings: 14 },
  ])
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  return (
    <SettingsSection
      title="Tracked links"
      description="One link per place you share it, so you can see which one brings visits. Last 30 days."
      action={
        <Button size="sm" variant="secondary" icon={I.add} onClick={() => setOpen(true)}>
          New link
        </Button>
      }
    >
      <Card className="mt-4">
        <Table>
          <THead>
            <TH>Where it’s shared</TH>
            <TH>Link</TH>
            <TH align="right">Clicks</TH>
            <TH align="right">Bookings</TH>
            <TH align="right">Conversion</TH>
          </THead>
          <tbody>
            {links.map((l) => (
              <TR key={l.id}>
                <TD>{l.channel}</TD>
                <TD>
                  <button type="button" onClick={() => copy(`navcrm.tj/r/${l.slug}`, 'Link copied')} className="inline-flex items-center gap-1.5 text-muted hover:text-fg">
                    navcrm.tj/r/{l.slug}
                    <Icon icon={I.copy} size={14} />
                  </button>
                </TD>
                <TD align="right">{l.clicks.toLocaleString('en-US')}</TD>
                <TD align="right">{l.bookings}</TD>
                <TD align="right" className="text-muted">
                  {l.clicks ? `${((l.bookings / l.clicks) * 100).toFixed(1)}%` : '—'}
                </TD>
              </TR>
            ))}
          </tbody>
        </Table>
      </Card>
      <Modal
        open={open}
        onOpenChange={setOpen}
        title="New tracked link"
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              disabled={!name.trim()}
              onClick={() => {
                const slug = Math.random().toString(36).slice(2, 6)
                setLinks((l) => [...l, { id: slug, channel: name.trim(), slug, clicks: 0, bookings: 0 }])
                setOpen(false)
                setName('')
                copy(`navcrm.tj/r/${slug}`, 'Link created and copied')
              }}
            >
              Create and copy
            </Button>
          </>
        }
      >
        <Field label="Where will you share it?">
          <Input autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Flyers at Dushanbe Mall" />
        </Field>
      </Modal>
    </SettingsSection>
  )
}

function Widget() {
  const button = `<script src="https://navcrm.tj/widget.js" data-business="sitora" data-type="button" async></script>`
  const inline = `<div id="navcrm-booking"></div>\n<script src="https://navcrm.tj/widget.js" data-business="sitora" data-type="inline" data-target="navcrm-booking" async></script>`
  return (
    <>
      <SettingsSection title="Booking button" description="A floating “Book a visit” button on every page of your website. Paste before </body>.">
        <div className="pt-4">
          <CodeBlock code={button} />
        </div>
      </SettingsSection>
      <SettingsSection title="Form on a page" description="The full booking form inside one page, for example “Book online”.">
        <div className="pt-4">
          <CodeBlock code={inline} />
        </div>
      </SettingsSection>
    </>
  )
}

const SOURCES = [
  { channel: 'Instagram', bookings: 96, revenue: 24180, cancel: 9 },
  { channel: 'Telegram bot', bookings: 71, revenue: 19650, cancel: 6 },
  { channel: 'Booking page (direct)', bookings: 58, revenue: 16920, cancel: 7 },
  { channel: '2GIS', bookings: 38, revenue: 9480, cancel: 11 },
  { channel: 'QR at reception', bookings: 29, revenue: 6210, cancel: 3 },
  { channel: 'Yandex Maps', bookings: 21, revenue: 5160, cancel: 10 },
  { channel: 'AI assistant', bookings: 17, revenue: 4890, cancel: 5 },
  { channel: 'Google Business', bookings: 6, revenue: 1320, cancel: 17 },
]

function Sources() {
  const max = Math.max(...SOURCES.map((s) => s.bookings))
  const total = SOURCES.reduce((m, s) => m + s.bookings, 0)
  return (
    <SettingsSection
      title="Where online bookings come from"
      description={`${total} online bookings in the last 30 days.`}
      action={
        <Link to="/reports" className="text-sm font-medium text-fg hover:underline underline-offset-4">
          Full report
        </Link>
      }
    >
      <Card className="mt-4">
        <Table>
          <THead>
            <TH>Channel</TH>
            <TH className="w-[30%]">Bookings</TH>
            <TH align="right">Revenue</TH>
            <TH align="right">Cancelled</TH>
          </THead>
          <tbody>
            {SOURCES.map((s) => (
              <TR key={s.channel}>
                <TD>{s.channel}</TD>
                <TD>
                  <div className="flex items-center gap-3">
                    <Meter value={s.bookings} max={max} className="h-1 flex-1" />
                    <span className="w-8 text-right tabular">{s.bookings}</span>
                  </div>
                </TD>
                <TD align="right">
                  <Money value={s.revenue} />
                </TD>
                <TD align="right" className={s.cancel > 12 ? 'text-negative' : 'text-muted'}>
                  {s.cancel}%
                </TD>
              </TR>
            ))}
          </tbody>
        </Table>
      </Card>
    </SettingsSection>
  )
}

export default function BookingSettings() {
  const [tab, setTab] = useState<Tab>('rules')
  return (
    <SettingsPage
      title="Online booking"
      description="How clients book you without calling: the booking page, Telegram bot and website."
    >
      <Tabs
        value={tab}
        onChange={setTab}
        className="mb-6"
        items={[
          { value: 'rules', label: 'Rules' },
          { value: 'prepay', label: 'Prepayment' },
          { value: 'links', label: 'Links & QR' },
          { value: 'widget', label: 'Website' },
          { value: 'sources', label: 'Sources' },
        ]}
      />
      {tab === 'rules' && <Rules />}
      {tab === 'prepay' && <Prepayment />}
      {tab === 'links' && <Links />}
      {tab === 'widget' && <Widget />}
      {tab === 'sources' && <Sources />}
    </SettingsPage>
  )
}
