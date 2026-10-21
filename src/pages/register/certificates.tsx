import { useState } from 'react'
import { useNavigate } from 'react-router'
import { I, Icon } from '@/components/icons'
import { Badge, type Tone } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Chip } from '@/components/ui/controls'
import { Input } from '@/components/ui/input'
import { EmptyState, Money } from '@/components/ui/misc'
import { Toolbar } from '@/components/ui/page'
import { TD, TH, THead, TR, Table } from '@/components/ui/table'
import { serviceById } from '@/data/services'
import { formatDate } from '@/lib/format'
import { useOverlays } from '@/lib/overlays'
import { useData } from '@/lib/store'
import type { Certificate, CertificateStatus } from './data'
import { useRegister } from './store'

const STATUS: Record<CertificateStatus, { label: string; tone: Tone }> = {
  active: { label: 'Active', tone: 'positive' },
  used: { label: 'Used', tone: 'neutral' },
  expired: { label: 'Expired', tone: 'neutral' },
}

const typeLabel = (c: Certificate) => (c.kind === 'service' && c.serviceId ? serviceById[c.serviceId].name : 'Amount')

function CheckResult({ cert }: { cert: Certificate }) {
  const buyer = useData((s) => s.clients.find((c) => c.id === cert.buyerId))
  const navigate = useNavigate()
  return (
    <div className="rise mt-4 flex flex-wrap items-center gap-x-8 gap-y-3 rounded-xl bg-fill px-4 py-3.5">
      <span className="grid size-10 place-items-center rounded-full bg-surface text-muted">
        <Icon icon={I.gift} size={18} />
      </span>
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-base text-fg tabular">{cert.code}</span>
          <Badge tone={STATUS[cert.status].tone}>{STATUS[cert.status].label}</Badge>
        </div>
        <div className="mt-0.5 text-sm text-muted">
          {typeLabel(cert)} · bought by {buyer?.name ?? 'walk-in client'}
          {cert.recipient && ` for “${cert.recipient}”`} · valid until {formatDate(cert.validUntil)}
        </div>
      </div>
      <div className="ml-auto text-right">
        <div className="text-sm text-muted">Balance</div>
        <Money value={cert.balance} className="text-xl" />
      </div>
      {cert.status === 'active' && (
        <Button variant="secondary" onClick={() => navigate('/pos')}>
          Pay with it
        </Button>
      )}
    </div>
  )
}

export function Certificates() {
  const certificates = useRegister((s) => s.certificates)
  const clients = useData((s) => s.clients)
  const openClient = useOverlays((s) => s.openClient)
  const navigate = useNavigate()
  const [code, setCode] = useState('')
  const [checked, setChecked] = useState<Certificate | null | undefined>(undefined)
  const [status, setStatus] = useState<CertificateStatus | 'all'>('all')

  const list = certificates.filter((c) => status === 'all' || c.status === status)
  const count = (s: CertificateStatus) => certificates.filter((c) => c.status === s).length

  function check() {
    const q = code.trim().toUpperCase().replace(/\s/g, '')
    if (!q) return
    setChecked(certificates.find((c) => c.code.replace(/-/g, '') === q.replace(/-/g, '')) ?? null)
  }

  return (
    <>
      <Card className="mb-6 p-5">
        <h3 className="text-base font-medium text-fg">Check a certificate</h3>
        <p className="mt-0.5 text-sm text-muted">Enter the code printed on it to see its balance before paying.</p>
        <form
          className="mt-3 flex max-w-md gap-2"
          onSubmit={(e) => {
            e.preventDefault()
            check()
          }}
        >
          <Input
            value={code}
            onChange={(e) => {
              setCode(e.target.value.toUpperCase())
              setChecked(undefined)
            }}
            placeholder="SB-7K4Q-M2"
            className="flex-1 tabular"
            icon={I.gift}
          />
          <Button type="submit" variant="secondary">
            Check
          </Button>
        </form>
        {checked === null && <p className="mt-3 text-sm text-negative">No certificate with this code. Check the letters and try again.</p>}
        {checked && <CheckResult cert={checked} />}
      </Card>

      <Toolbar>
        <Chip active={status === 'all'} onClick={() => setStatus('all')} count={certificates.length}>
          All
        </Chip>
        {(Object.keys(STATUS) as CertificateStatus[]).map((s) => (
          <Chip key={s} active={status === s} onClick={() => setStatus(s)} count={count(s)}>
            {STATUS[s].label}
          </Chip>
        ))}
        <Button variant="primary" icon={I.add} className="ml-auto" onClick={() => navigate('/pos?add=certificate')}>
          Sell certificate
        </Button>
      </Toolbar>

      <Card>
        {list.length ? (
          <Table>
            <THead>
              <TH>Code</TH>
              <TH>For</TH>
              <TH align="right">Value</TH>
              <TH align="right">Balance</TH>
              <TH>Bought by</TH>
              <TH>Valid until</TH>
              <TH>Status</TH>
            </THead>
            <tbody>
              {list.map((c) => {
                const buyer = clients.find((x) => x.id === c.buyerId)
                return (
                  <TR key={c.code} onClick={buyer ? () => openClient(buyer.id) : undefined}>
                    <TD className="tabular">{c.code}</TD>
                    <TD muted>{typeLabel(c)}</TD>
                    <TD align="right">
                      <Money value={c.nominal} />
                    </TD>
                    <TD align="right">
                      <Money value={c.balance} className={c.balance === 0 ? 'text-faint' : ''} />
                    </TD>
                    <TD>{buyer?.name ?? <span className="text-muted">Walk-in</span>}</TD>
                    <TD muted>{formatDate(c.validUntil)}</TD>
                    <TD>
                      <Badge tone={STATUS[c.status].tone}>{STATUS[c.status].label}</Badge>
                    </TD>
                  </TR>
                )
              })}
            </tbody>
          </Table>
        ) : (
          <EmptyState icon={I.gift} title="No certificates here" />
        )}
      </Card>
    </>
  )
}
