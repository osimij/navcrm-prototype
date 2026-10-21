import { Navigate, Route, Routes } from 'react-router'
import { ImportClients } from './import'
import { ClientsList } from './list'
import { NewSegment } from './new-segment'
import { Segments } from './segments'

export default function Clients() {
  return (
    <Routes>
      <Route index element={<ClientsList />} />
      <Route path="segments" element={<Segments />} />
      <Route path="segments/new" element={<NewSegment />} />
      <Route path="import" element={<ImportClients />} />
      <Route path="*" element={<Navigate to="/clients" replace />} />
    </Routes>
  )
}
