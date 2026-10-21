import { useMemo, useState } from 'react'
import { I } from '@/components/icons'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { StatCard } from '@/components/ui/stat-card'
import { Chip } from '@/components/ui/controls'
import { EmptyState, Money } from '@/components/ui/misc'
import { Toolbar } from '@/components/ui/page'
import { TD, TH, THead, TR, Table } from '@/components/ui/table'
import { formatDate, formatDayTime, formatNumber } from '@/lib/format'
import { NOW, addDays } from '@/lib/time'
import { STATUS_LABEL, STATUS_TONE, type CampaignStatus } from './data'
import { CampaignSheet, ChannelIcons } from './campaign-sheet'
import { useCampaigns } from './store'

const STATUSES: CampaignStatus[] = ['draft', 'scheduled', 'sending', 'sent', 'stopped', 'failed']

export function CampaignList() {
  const campaigns = useCampaigns((s) => s.campaigns)
  const [status, setStatus] = useState<CampaignStatus | null>(null)
  const [openId, setOpenId] = useState<string | null>(null)

  const counts = useMemo(() => Object.fromEntries(STATUSES.map((s) => [s, campaigns.filter((c) => c.status === s).length])), [campaigns])
  const list = status ? campaigns.filter((c) => c.status === status) : campaigns
  const open = campaigns.find((c) => c.id === openId) ?? null

  // The number owners care about: did people come back, and was it worth it.
  const since = addDays(NOW, -90)
  const recent = campaigns.filter((c) => c.date && c.date >= since && (c.status === 'sent' || c.status === 'stopped'))
  const back = recent.reduce((m, c) => m + c.cameBack, 0)
  const revenue = recent.reduce((m, c) => m + c.revenue, 0)
  const cost = recent.reduce((m, c) => m + c.cost, 0)

  return (
    <>
      <Card className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatCard label="Came back after a campaign" value={formatNumber(back)} sub="clients, last 90 days" className="bg-transparent ring-0" />
        <StatCard label="Revenue from their visits" value={<Money value={revenue} />} sub="within 14 days of the message" className="bg-transparent ring-0" />
        <StatCard label="Spent on messages" value={<Money value={cost} decimals />} sub="Telegram and push are free" className="bg-transparent ring-0" />
      </Card>

      <Toolbar>
        {STATUSES.map((s) => (
          <Chip key={s} active={status === s} onClick={() => setStatus(status === s ? null : s)} count={counts[s]}>
            {STATUS_LABEL[s]}
          </Chip>
        ))}
      </Toolbar>

      <Card className="overflow-hidden">
        {list.length ? (
          <Table>
            <THead>
              <TH>Campaign</TH>
              <TH>Channels</TH>
              <TH>Status</TH>
              <TH>Date</TH>
              <TH align="right">Delivered</TH>
              <TH align="right">Came back in 14 days</TH>
            </THead>
            <tbody>
              {list.map((c) => {
                const sent = c.status === 'sent' || c.status === 'stopped'
                return (
                  <TR key={c.id} onClick={() => setOpenId(c.id)} selected={openId === c.id}>
                    <TD>
                      <div className="text-base text-fg">{c.name}</div>
                      <div className="text-sm text-muted">
                        {c.audienceLabel} · {formatNumber(c.recipients)} clients
                      </div>
                    </TD>
                    <TD>
                      <ChannelIcons channels={c.channels} />
                    </TD>
                    <TD>
                      <Badge tone={STATUS_TONE[c.status]}>
                        {STATUS_LABEL[c.status]}
                      </Badge>
                    </TD>
                    <TD muted className="whitespace-nowrap">
                      {c.date ? (c.status === 'scheduled' ? formatDayTime(c.date) : formatDate(c.date)) : '—'}
                    </TD>
                    <TD align="right" muted>
                      {sent ? `${Math.round((c.delivered / c.recipients) * 100)}%` : c.status === 'sending' ? 'Going out' : '—'}
                    </TD>
                    <TD align="right">
                      {sent ? (
                        <span className="whitespace-nowrap">
                          <span className="text-fg">{c.cameBack}</span>
                          <span className="text-faint"> · </span>
                          <Money value={c.revenue} className="text-muted" />
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
        ) : (
          <EmptyState icon={I.campaigns} title={`No ${STATUS_LABEL[status!].toLowerCase()} campaigns`} description="Campaigns with this status will show up here.">
            <Button onClick={() => setStatus(null)}>Show all</Button>
          </EmptyState>
        )}
      </Card>

      <CampaignSheet campaign={open} onClose={() => setOpenId(null)} />
    </>
  )
}
