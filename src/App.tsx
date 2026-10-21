import { Navigate, Route, Routes } from 'react-router'
import { SignIn } from './auth/sign-in'
import { SignUp } from './auth/sign-up'
import Assistant from './pages/assistant'
import Calendar from './pages/calendar'
import Campaigns from './pages/campaigns'
import Channels from './pages/channels'
import Clients from './pages/clients'
import Earnings from './pages/earnings'
import Home from './pages/home/home'
import Inbox from './pages/inbox'
import Inventory from './pages/inventory'
import Lab from './pages/lab'
import Payroll from './pages/payroll'
import Register from './pages/register'
import Reports from './pages/reports'
import Settings from './pages/settings'
import Sublease from './pages/sublease'
import Tasks from './pages/tasks'
import { AppShell } from './shell/app-shell'

/**
 * Each section owns its sub-routes (e.g. /pos/receipts), so sections can be
 * worked on independently.
 */
export function App() {
  return (
    <Routes>
      <Route path="/signin" element={<SignIn />} />
      <Route path="/signup" element={<SignUp />} />
      <Route element={<AppShell />}>
        <Route index element={<Home />} />
        <Route path="calendar/*" element={<Calendar />} />
        <Route path="clients/*" element={<Clients />} />
        <Route path="pos/*" element={<Register />} />
        <Route path="inbox/*" element={<Inbox />} />
        <Route path="tasks/*" element={<Tasks />} />
        <Route path="inventory/*" element={<Inventory />} />
        <Route path="lab/*" element={<Lab />} />
        <Route path="campaigns/*" element={<Campaigns />} />
        <Route path="channels/*" element={<Channels />} />
        <Route path="assistant/*" element={<Assistant />} />
        <Route path="reports/*" element={<Reports />} />
        <Route path="payroll/*" element={<Payroll />} />
        <Route path="sublease/*" element={<Sublease />} />
        <Route path="me/*" element={<Earnings />} />
        <Route path="settings/*" element={<Settings />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}
