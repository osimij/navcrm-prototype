import { Navigate, Route, Routes, useLocation, useNavigate } from 'react-router'
import { toast } from 'sonner'
import { I } from '@/components/icons'
import { Button } from '@/components/ui/button'
import { Menu, MenuItem } from '@/components/ui/menu'
import { Page, PageHeader } from '@/components/ui/page'
import { LinkTabs } from '@/components/ui/tabs'
import { plural } from '@/lib/format'
import { TODAY } from '@/lib/time'
import { NewOrder } from './new-order'
import { OrderSheet } from './order-sheet'
import { Orders } from './orders'
import { Partners } from './partners'
import { LabReports } from './reports'
import { useLab } from './store'
import { Templates } from './templates'
import { Tests } from './tests'

function HeaderAction() {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const editTest = useLab((s) => s.editTest)
  const editTemplate = useLab((s) => s.editTemplate)

  if (pathname.startsWith('/lab/tests'))
    return (
      <Button variant="primary" icon={I.add} onClick={() => editTest('new')}>
        Add test
      </Button>
    )
  if (pathname.startsWith('/lab/templates'))
    return (
      <Button variant="primary" icon={I.add} onClick={() => editTemplate('new')}>
        New template
      </Button>
    )
  if (pathname.startsWith('/lab/partners')) return null
  if (pathname.startsWith('/lab/reports'))
    return (
      <Menu align="end" trigger={<Button icon={I.download} iconRight={I.chevronDown}>Export</Button>}>
        <MenuItem icon={I.download} onClick={() => toast.success('Lab report exported to Excel')}>
          Excel
        </MenuItem>
        <MenuItem icon={I.print} onClick={() => toast.success('Lab report saved as PDF')}>
          PDF
        </MenuItem>
      </Menu>
    )
  return (
    <Button variant="primary" icon={I.add} onClick={() => navigate('/lab/orders/new')}>
      New order
    </Button>
  )
}

function LabLayout() {
  const orders = useLab((s) => s.orders)
  const today = orders.filter((o) => o.createdAt >= TODAY).length
  const ready = orders.filter((o) => o.status === 'ready').length

  return (
    <Page width="wide">
      <PageHeader
        title="Laboratory"
        subtitle={`${plural(today, 'order')} today · ${ready} ready to send`}
        actions={<HeaderAction />}
        tabs={
          <LinkTabs
            items={[
              { to: '/lab', label: 'Orders', end: true },
              { to: '/lab/tests', label: 'Tests' },
              { to: '/lab/templates', label: 'Result templates' },
              { to: '/lab/partners', label: 'Partner labs' },
              { to: '/lab/reports', label: 'Reports' },
            ]}
          />
        }
      />
      <Routes>
        <Route index element={<Orders />} />
        <Route path="tests" element={<Tests />} />
        <Route path="templates" element={<Templates />} />
        <Route path="partners" element={<Partners />} />
        <Route path="reports" element={<LabReports />} />
        <Route path="*" element={<Navigate to="/lab" replace />} />
      </Routes>
      <OrderSheet />
    </Page>
  )
}

export default function Lab() {
  return (
    <Routes>
      <Route path="orders/new" element={<NewOrder />} />
      <Route path="*" element={<LabLayout />} />
    </Routes>
  )
}
