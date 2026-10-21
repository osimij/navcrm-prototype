import { StatCard } from '@/components/ui/stat-card'
import type { ReactNode } from 'react'
import { Link, useNavigate } from 'react-router'
import { I, Icon } from '@/components/icons'
import { Card, CardHeader } from '@/components/ui/card'
import { Figure, Meter } from '@/components/ui/misc'
import { Segmented } from '@/components/ui/tabs'
import { TD, TH, THead, TR, Table } from '@/components/ui/table'
import { formatNumber } from '@/lib/format'
import { DMS, STATUS_LABEL, usePlatforms, useReviews, type Period } from './data'
import { useChannelStats } from './stats'

function Kpi({ label, value, suffix, sub, to }: { label: string; value: number; suffix?: string; sub: ReactNode; to: string }) {
  return (
    <StatCard label={label} value={<Figure value={value} />} suffix={suffix} sub={sub} to={to} />
  )
}

export function Overview({ period, setPeriod }: { period: Period; setPeriod: (p: Period) => void }) {
  const stats = useChannelStats(period)
  const unreplied = useReviews((s) => s.reviews.filter((r) => !r.reply).length)
  const navigate = useNavigate()
  const platforms = usePlatforms((s) => s.platforms)
  const total = stats.sources.reduce((m, s) => m + s.count, 0)

  return (
    <>
      <div className="mb-5 flex items-center justify-between gap-3">
        <p className="text-base text-muted">Bookings are counted from tracked links and chats, so they match the calendar.</p>
        <Segmented
          value={period}
          onChange={setPeriod}
          items={[
            { value: '7', label: '7 days' },
            { value: '30', label: '30 days' },
            { value: '90', label: '90 days' },
          ]}
        />
      </div>

      <div className="grid grid-cols-2 gap-5 lg:grid-cols-4">
        <Kpi label="Bookings from platforms" value={stats.platformBookings} sub={`${formatNumber(stats.clicks)} link clicks`} to="/channels/platforms" />
        <Kpi label="New Instagram chats" value={DMS[period]} sub="First reply in 4 min on average" to="/inbox" />
        <Kpi label="Booked by the assistant" value={stats.aiShare} suffix="%" sub={`${formatNumber(stats.aiCount)} chat bookings with no admin`} to="/inbox" />
        <Kpi label="Reviews without a reply" value={unreplied} sub={unreplied ? 'Reply within a day to protect your rating' : 'All answered'} to="/channels/reviews" />
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)]">
        <Card className="overflow-hidden">
          <CardHeader title="Platforms" action={<Link to="/channels/platforms" className="text-sm font-medium text-muted hover:text-fg">Manage</Link>} />
          <Table>
            <THead>
              <TH>Platform</TH>
              <TH align="right">Bookings</TH>
              <TH align="right">Clicks</TH>
              <TH align="right">Rating</TH>
            </THead>
            <tbody>
              {platforms.map((p) => {
                const s = stats.platforms[p.id]
                const tracked = p.id !== 'after_visit' && p.status !== 'none'
                return (
                  <TR key={p.id} onClick={() => navigate(p.id === 'after_visit' ? '/channels/reviews' : '/channels/platforms')}>
                    <TD>
                      <span className="flex items-center gap-3">
                        <span className="grid size-8 shrink-0 place-items-center rounded-full bg-fill text-muted">
                          <Icon icon={p.icon} size={16} />
                        </span>
                        <span className="min-w-0">
                          <span className="block text-base text-fg">{p.name}</span>
                          {p.status === 'none' ? (
                            <span className="block text-sm text-warning">Not set up</span>
                          ) : (
                            <span className="block text-sm text-muted">{p.id === 'after_visit' ? 'Asked 2 hours after each visit' : STATUS_LABEL[p.status]}</span>
                          )}
                        </span>
                      </span>
                    </TD>
                    <TD align="right">{tracked ? formatNumber(s.bookings) : <span className="text-faint">—</span>}</TD>
                    <TD align="right" muted>
                      {tracked ? formatNumber(s.clicks) : <span className="text-faint">—</span>}
                    </TD>
                    <TD align="right">
                      {p.rating ? (
                        <span className="whitespace-nowrap">
                          ★ {p.rating.toFixed(1)} <span className="text-sm text-faint">· {p.reviews}</span>
                        </span>
                      ) : (
                        <span className="text-faint">—</span>
                      )}
                    </TD>
                  </TR>
                )
              })}
            </tbody>
          </Table>
        </Card>

        <Card>
          <CardHeader title="Where bookings came from" description={`${formatNumber(total)} bookings in ${period} days`} />
          <ul className="flex flex-col gap-3 px-5 pt-2 pb-5">
            {[...stats.sources]
              .sort((a, b) => b.count - a.count)
              .map((s) => (
                <li key={s.key}>
                  <div className="mb-1.5 flex items-baseline justify-between gap-3 text-sm">
                    <span className="text-fg">{s.label}</span>
                    <span className="text-muted tabular">
                      {formatNumber(s.count)} <span className="inline-block w-9 text-right text-faint">{total ? Math.round((s.count / total) * 100) : 0}%</span>
                    </span>
                  </div>
                  <Meter value={s.count} max={stats.sources.reduce((m, x) => Math.max(m, x.count), 1)} className="h-1" />
                </li>
              ))}
          </ul>
        </Card>
      </div>

      {platforms.some((p) => p.status === 'none') && (
        <Link to="/channels/platforms" className="press mt-5 flex items-center gap-4 rounded-2xl bg-fill p-5 hover:bg-fill-hover">
          <span className="grid size-10 shrink-0 place-items-center rounded-full bg-surface text-muted ring-1 ring-border">
            <Icon icon={I.mapPin} size={20} />
          </span>
          <span className="min-w-0 flex-1">
            <span className="flex items-center gap-2 text-base font-medium text-fg">
              {platforms.find((p) => p.status === 'none')?.name} isn’t set up yet
            </span>
            <span className="block text-sm text-muted">Clients searching on Google Maps can’t book you. Setup takes about 10 minutes.</span>
          </span>
          <Icon icon={I.chevronRight} size={18} className="text-faint" />
        </Link>
      )}
    </>
  )
}
