import type { IconSvgElement } from '@hugeicons/react'
import { I } from '@/components/icons'

export type NavItem = { to: string; label: string; icon: IconSvgElement; keywords?: string }
export type NavGroup = { label?: string; items: NavItem[] }

/**
 * Main navigation. Compared with the current product:
 * - "Work" loses its label: these are the daily screens and need no heading.
 * - "My earnings" moves to the profile menu; it's personal, not company money.
 * - Settings stays pinned at the bottom instead of falling below the fold.
 */
export const NAV: NavGroup[] = [
  {
    items: [
      { to: '/', label: 'Home', icon: I.home, keywords: 'dashboard overview' },
      { to: '/calendar', label: 'Calendar', icon: I.calendar, keywords: 'appointments bookings schedule journal' },
      { to: '/clients', label: 'Clients', icon: I.clients, keywords: 'crm customers base' },
      { to: '/pos', label: 'Register', icon: I.register, keywords: 'pos cash sale checkout receipts kassa' },
      { to: '/inbox', label: 'Inbox', icon: I.inbox, keywords: 'messages chats telegram whatsapp' },
      { to: '/tasks', label: 'Tasks', icon: I.tasks, keywords: 'to do call back' },
    ],
  },
  {
    label: 'Operations',
    items: [
      { to: '/inventory', label: 'Inventory', icon: I.inventory, keywords: 'stock warehouse products' },
      { to: '/lab', label: 'Laboratory', icon: I.lab, keywords: 'tests analyses orders' },
    ],
  },
  {
    label: 'Growth',
    items: [
      { to: '/campaigns', label: 'Campaigns', icon: I.campaigns, keywords: 'marketing mailing discounts bonuses loyalty' },
      { to: '/channels', label: 'Instagram & maps', icon: I.channels, keywords: 'channels reviews 2gis yandex google' },
      { to: '/assistant', label: 'Assistant', icon: I.assistant, keywords: 'ai ask' },
    ],
  },
  {
    label: 'Money',
    items: [
      { to: '/reports', label: 'Reports', icon: I.reports, keywords: 'analytics revenue profit' },
      { to: '/payroll', label: 'Payroll', icon: I.payroll, keywords: 'salary wages' },
      { to: '/sublease', label: 'Sublease', icon: I.sublease, keywords: 'tenants rent chair' },
    ],
  },
]

export type SettingsItem = { to: string; label: string; keywords?: string }
export type SettingsGroup = { label: string; items: SettingsItem[] }

export const SETTINGS_NAV: SettingsGroup[] = [
  {
    label: 'Business',
    items: [
      { to: '/settings/setup', label: 'Quick start' },
      { to: '/settings/business', label: 'Business profile' },
      { to: '/settings/branches', label: 'Branches' },
      { to: '/settings/custom-fields', label: 'Custom fields' },
    ],
  },
  {
    label: 'Team',
    items: [
      { to: '/settings/staff', label: 'Staff' },
      { to: '/settings/roles', label: 'Roles & permissions' },
      { to: '/settings/schedules', label: 'Working hours' },
    ],
  },
  {
    label: 'Services & booking',
    items: [
      { to: '/settings/services', label: 'Services & prices' },
      { to: '/settings/resources', label: 'Chairs, rooms & equipment' },
      { to: '/settings/holidays', label: 'Holidays' },
      { to: '/settings/booking', label: 'Online booking' },
      { to: '/settings/consents', label: 'Consents & forms' },
    ],
  },
  {
    label: 'Money',
    items: [
      { to: '/settings/payments', label: 'Payment methods' },
      { to: '/settings/fiscal', label: 'Fiscal receipts' },
      { to: '/settings/loyalty', label: 'Bonuses & loyalty' },
      { to: '/settings/billing', label: 'Plan & billing' },
      { to: '/settings/payouts', label: 'Online payments' },
    ],
  },
  {
    label: 'Client communication',
    items: [
      { to: '/settings/notifications', label: 'Client notifications' },
      { to: '/settings/telegram', label: 'Telegram bot' },
      { to: '/settings/ai', label: 'AI assistant for clients' },
      { to: '/settings/catalog', label: 'NavCRM catalog' },
    ],
  },
  {
    label: 'Integrations & data',
    items: [
      { to: '/settings/integrations', label: 'Integrations' },
      { to: '/settings/api', label: 'API & webhooks' },
      { to: '/settings/export', label: 'Export all data' },
      { to: '/settings/privacy', label: 'Data retention' },
      { to: '/settings/audit', label: 'Activity log' },
    ],
  },
  {
    label: 'My account',
    items: [
      { to: '/settings/profile', label: 'My profile' },
      { to: '/settings/sessions', label: 'Devices & sessions' },
      { to: '/settings/calendar-sync', label: 'Calendar sync' },
    ],
  },
]
