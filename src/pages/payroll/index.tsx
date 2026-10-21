import { Route, Routes, useLocation, useNavigate } from 'react-router'
import { I } from '@/components/icons'
import { Button } from '@/components/ui/button'
import { Page, PageHeader } from '@/components/ui/page'
import { LinkTabs } from '@/components/ui/tabs'
import { Adjustments } from './adjustments'
import { Assignments } from './assignments'
import { PeriodDetail } from './period-detail'
import { Periods } from './periods'
import { Payouts } from './payouts'
import { SchemeEditor } from './scheme-editor'
import { Schemes } from './schemes'
import { usePayroll } from './store'
import { Timesheet } from './timesheet'

const TABS = [
  { to: '/payroll', label: 'Periods', end: true },
  { to: '/payroll/schemes', label: 'Schemes' },
  { to: '/payroll/assignments', label: 'Assignments' },
  { to: '/payroll/payouts', label: 'Payouts' },
  { to: '/payroll/adjustments', label: 'Bonuses & fines' },
  { to: '/payroll/timesheet', label: 'Timesheet' },
]

function PayrollTabs() {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const setModal = usePayroll((s) => s.setModal)
  const tab = pathname.replace(/^\/payroll\/?/, '').split('/')[0] || 'periods'

  // One primary action per tab, always in the same place.
  const action: Record<string, React.ReactNode> = {
    periods: (
      <Button variant="primary" icon={I.add} onClick={() => setModal('period')}>
        New period
      </Button>
    ),
    schemes: (
      <Button variant="primary" icon={I.add} onClick={() => navigate('/payroll/schemes/new')}>
        New scheme
      </Button>
    ),
    assignments: (
      <Button variant="primary" icon={I.add} onClick={() => setModal('assign')}>
        Assign scheme
      </Button>
    ),
    payouts: (
      <Button variant="primary" icon={I.cash} onClick={() => setModal('payout')}>
        Pay out
      </Button>
    ),
    adjustments: (
      <Button variant="primary" icon={I.add} onClick={() => setModal('adjustment')}>
        Add bonus or fine
      </Button>
    ),
    timesheet: (
      <Button variant="primary" icon={I.add} onClick={() => setModal('timesheet')}>
        Add entry
      </Button>
    ),
  }

  return (
    <Page width="wide">
      <PageHeader
        title="Payroll"
        subtitle="Calculate, review and approve. Approved periods are locked."
        actions={action[tab]}
        tabs={<LinkTabs items={TABS} />}
      />
      <Routes>
        <Route index element={<Periods />} />
        <Route path="schemes" element={<Schemes />} />
        <Route path="assignments" element={<Assignments />} />
        <Route path="payouts" element={<Payouts />} />
        <Route path="adjustments" element={<Adjustments />} />
        <Route path="timesheet" element={<Timesheet />} />
      </Routes>
    </Page>
  )
}

export default function Payroll() {
  return (
    <Routes>
      <Route path="periods/:id" element={<PeriodDetail />} />
      <Route path="schemes/:id" element={<SchemeEditor />} />
      <Route path="*" element={<PayrollTabs />} />
    </Routes>
  )
}
