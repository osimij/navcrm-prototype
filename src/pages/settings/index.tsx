import { Navigate, Route, Routes } from 'react-router'
import SetupSettings from './pages/setup'
import BusinessSettings from './pages/business'
import BranchesSettings from './pages/branches'
import CustomFieldsSettings from './pages/custom-fields'
import StaffSettings from './pages/staff'
import RolesSettings from './pages/roles'
import SchedulesSettings from './pages/schedules'
import ServicesSettings from './pages/services'
import ResourcesSettings from './pages/resources'
import HolidaysSettings from './pages/holidays'
import BookingSettings from './pages/booking'
import ConsentsSettings from './pages/consents'
import PaymentsSettings from './pages/payments'
import FiscalSettings from './pages/fiscal'
import LoyaltySettings from './pages/loyalty'
import BillingSettings from './pages/billing'
import PayoutsSettings from './pages/payouts'
import NotificationsSettings from './pages/notifications'
import TelegramSettings from './pages/telegram'
import AiSettings from './pages/ai'
import CatalogSettings from './pages/catalog'
import IntegrationsSettings from './pages/integrations'
import ApiSettings from './pages/api'
import ExportSettings from './pages/export'
import PrivacySettings from './pages/privacy'
import AuditSettings from './pages/audit'
import ProfileSettings from './pages/profile'
import SessionsSettings from './pages/sessions'
import CalendarSyncSettings from './pages/calendar-sync'

export default function Settings() {
  return (
    <Routes>
      <Route index element={<Navigate to="business" replace />} />
      <Route path="setup" element={<SetupSettings />} />
      <Route path="business" element={<BusinessSettings />} />
      <Route path="branches" element={<BranchesSettings />} />
      <Route path="custom-fields" element={<CustomFieldsSettings />} />
      <Route path="staff" element={<StaffSettings />} />
      <Route path="roles" element={<RolesSettings />} />
      <Route path="schedules" element={<SchedulesSettings />} />
      <Route path="services" element={<ServicesSettings />} />
      <Route path="resources" element={<ResourcesSettings />} />
      <Route path="holidays" element={<HolidaysSettings />} />
      <Route path="booking" element={<BookingSettings />} />
      <Route path="consents" element={<ConsentsSettings />} />
      <Route path="payments" element={<PaymentsSettings />} />
      <Route path="fiscal" element={<FiscalSettings />} />
      <Route path="loyalty" element={<LoyaltySettings />} />
      <Route path="billing" element={<BillingSettings />} />
      <Route path="payouts" element={<PayoutsSettings />} />
      <Route path="notifications" element={<NotificationsSettings />} />
      <Route path="telegram" element={<TelegramSettings />} />
      <Route path="ai" element={<AiSettings />} />
      <Route path="catalog" element={<CatalogSettings />} />
      <Route path="integrations" element={<IntegrationsSettings />} />
      <Route path="api" element={<ApiSettings />} />
      <Route path="export" element={<ExportSettings />} />
      <Route path="privacy" element={<PrivacySettings />} />
      <Route path="audit" element={<AuditSettings />} />
      <Route path="profile" element={<ProfileSettings />} />
      <Route path="sessions" element={<SessionsSettings />} />
      <Route path="calendar-sync" element={<CalendarSyncSettings />} />
      <Route path="*" element={<Navigate to="business" replace />} />
    </Routes>
  )
}
