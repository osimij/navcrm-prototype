import { Navigate, Route, Routes } from 'react-router'
import ReportBuilder from './builder'
import CashReport from './cash'
import ClientsReport from './clients'
import { MarketingReport, NetworkReport, OnlineReport, PayrollReport, StockReport } from './compact'
import DebtorsReport from './debtors'
import ReportsHub from './hub'
import LoadReport from './load'
import RevenueReport from './revenue'

export default function Reports() {
  return (
    <Routes>
      <Route index element={<ReportsHub />} />
      <Route path="revenue" element={<RevenueReport />} />
      <Route path="cash" element={<CashReport />} />
      <Route path="debtors" element={<DebtorsReport />} />
      <Route path="load" element={<LoadReport />} />
      <Route path="clients" element={<ClientsReport />} />
      <Route path="online" element={<OnlineReport />} />
      <Route path="payroll" element={<PayrollReport />} />
      <Route path="stock" element={<StockReport />} />
      <Route path="marketing" element={<MarketingReport />} />
      <Route path="network" element={<NetworkReport />} />
      <Route path="builder" element={<ReportBuilder />} />
      <Route path="*" element={<Navigate to="/reports" replace />} />
    </Routes>
  )
}
