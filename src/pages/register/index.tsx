import { Route, Routes, useNavigate } from 'react-router'
import { I } from '@/components/icons'
import { Badge } from '@/components/ui/badge'
import { Button, IconButton } from '@/components/ui/button'
import { Page, PageHeader } from '@/components/ui/page'
import { LinkTabs } from '@/components/ui/tabs'
import { useData } from '@/lib/store'
import { Certificates } from './certificates'
import { Debts } from './debts'
import { Expenses } from './expenses'
import { Memberships } from './memberships'
import { Printer } from './printer'
import { Receipts } from './receipts'
import { Sale } from './sale'
import { ShiftTab } from './shift'
import { useRegister } from './store'

function RegisterLayout() {
  const shift = useRegister((s) => s.shift)
  const debtors = useData((s) => s.clients.filter((c) => c.debt > 0).length)
  const navigate = useNavigate()

  return (
    <Page width="wide">
      <PageHeader
        title="Register"
        meta={
          shift.open ? (
            <Badge tone="positive" dot>
              Shift open since {shift.openedAt}
            </Badge>
          ) : (
            <span className="flex items-center gap-2">
              <Badge dot>Shift closed</Badge>
              <Button size="sm" variant="secondary" onClick={() => navigate('/pos/shift')}>
                Open shift
              </Button>
            </span>
          )
        }
        actions={<IconButton icon={I.print} label="Receipt printer" onClick={() => navigate('/pos/printer')} />}
        tabs={
          <LinkTabs
            items={[
              { to: '/pos', label: 'Sale', end: true },
              { to: '/pos/receipts', label: 'Receipts' },
              { to: '/pos/shift', label: 'Shift' },
              { to: '/pos/debts', label: 'Debts', count: debtors || undefined },
              { to: '/pos/memberships', label: 'Memberships' },
              { to: '/pos/certificates', label: 'Certificates' },
              { to: '/pos/expenses', label: 'Expenses' },
            ]}
          />
        }
      />
      <Routes>
        <Route index element={<Sale />} />
        <Route path="receipts" element={<Receipts />} />
        <Route path="shift" element={<ShiftTab />} />
        <Route path="debts" element={<Debts />} />
        <Route path="memberships" element={<Memberships />} />
        <Route path="certificates" element={<Certificates />} />
        <Route path="expenses" element={<Expenses />} />
        <Route path="*" element={<Sale />} />
      </Routes>
    </Page>
  )
}

export default function Register() {
  return (
    <Routes>
      <Route path="printer" element={<Printer />} />
      <Route path="*" element={<RegisterLayout />} />
    </Routes>
  )
}
