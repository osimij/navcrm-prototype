import { Navigate, Outlet, Route, Routes, useLocation, useNavigate } from 'react-router'
import { I } from '@/components/icons'
import { Button } from '@/components/ui/button'
import { Menu, MenuItem } from '@/components/ui/menu'
import { Money } from '@/components/ui/misc'
import { Page, PageHeader } from '@/components/ui/page'
import { LinkTabs } from '@/components/ui/tabs'
import { DOC_TYPE, isLow, type DocType } from './data'
import { DOC_ICON, DocumentsTab } from './documents'
import { NewDocument } from './new-document'
import { OrdersTab } from './orders'
import { AddProductModal, ProductSheet, ProductsTab } from './products'
import { ReportsTab } from './reports'
import { StockTab } from './stock'
import { stockValue, useInventory } from './store'
import { AddSupplierModal, SuppliersTab } from './suppliers'
import { TechCardsTab } from './tech-cards'
import { WarehousesTab } from './warehouses'

const NEW_DOCS: DocType[] = ['receipt', 'write-off', 'transfer', 'stocktake']

function InventoryLayout() {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const products = useInventory((s) => s.products)
  const orders = useInventory((s) => s.orders)
  const setAddProduct = useInventory((s) => s.setAddProduct)
  const setAddSupplier = useInventory((s) => s.setAddSupplier)
  const tab = pathname.replace(/^\/inventory\/?/, '').split('/')[0] || 'products'

  const onOrder = new Set(orders.filter((o) => o.status === 'sent').flatMap((o) => o.lines.map((l) => l.productId)))
  const toOrder = products.filter((p) => isLow(p) && !onOrder.has(p.id)).length

  // One primary action per tab; tabs without a create action show none.
  const actions =
    tab === 'products' ? (
      <Button variant="primary" icon={I.add} onClick={() => setAddProduct(true)}>
        Add product
      </Button>
    ) : tab === 'documents' ? (
      <Menu
        align="end"
        trigger={
          <Button variant="primary" icon={I.add} iconRight={I.chevronDown}>
            New document
          </Button>
        }
      >
        {NEW_DOCS.map((t) => (
          <MenuItem key={t} icon={DOC_ICON[t]} onClick={() => navigate(`/inventory/documents/new/${t}`)}>
            {DOC_TYPE[t].label}
          </MenuItem>
        ))}
      </Menu>
    ) : tab === 'suppliers' ? (
      <Button variant="primary" icon={I.add} onClick={() => setAddSupplier(true)}>
        Add supplier
      </Button>
    ) : null

  return (
    <Page width="wide">
      <PageHeader
        title="Inventory"
        subtitle={
          <>
            Main warehouse and Somoni 14 · stock value <Money value={stockValue(products)} />
          </>
        }
        actions={actions}
        tabs={
          <LinkTabs
            items={[
              { to: '/inventory', label: 'Products', end: true },
              { to: '/inventory/stock', label: 'Stock' },
              { to: '/inventory/documents', label: 'Documents' },
              { to: '/inventory/tech-cards', label: 'Tech cards' },
              { to: '/inventory/orders', label: 'Orders', count: toOrder || undefined },
              { to: '/inventory/suppliers', label: 'Suppliers' },
              { to: '/inventory/warehouses', label: 'Warehouses' },
              { to: '/inventory/reports', label: 'Reports' },
            ]}
          />
        }
      />
      <Outlet />
      <ProductSheet />
      <AddProductModal />
      <AddSupplierModal />
    </Page>
  )
}

export default function Inventory() {
  return (
    <Routes>
      <Route path="documents/new/:type" element={<NewDocument />} />
      <Route element={<InventoryLayout />}>
        <Route index element={<ProductsTab />} />
        <Route path="stock" element={<StockTab />} />
        <Route path="documents" element={<DocumentsTab />} />
        <Route path="tech-cards" element={<TechCardsTab />} />
        <Route path="orders" element={<OrdersTab />} />
        <Route path="suppliers" element={<SuppliersTab />} />
        <Route path="warehouses" element={<WarehousesTab />} />
        <Route path="reports" element={<ReportsTab />} />
        <Route path="*" element={<Navigate to="/inventory" replace />} />
      </Route>
    </Routes>
  )
}
