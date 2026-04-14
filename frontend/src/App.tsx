import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AppLayout } from './layout/AppLayout'
import { ViajesPage } from './pages/Viajes/ViajesPage.tsx'
import { ClientesPage } from './pages/Clientes/ClientesPage.tsx'
import { FleterosPage } from './pages/Fleteros/FleterosPage.tsx'
import { FacturasPage } from './pages/Facturas/FacturasPage.tsx'
import VencimientosPage from './pages/Vencimientos/VencimientosPage.tsx'


export default function App() {
  return (
    <BrowserRouter>
      <AppLayout>
        <Routes>
          <Route path="/" element={<Navigate to="/viajes" replace />} />
          <Route path="/viajes"   element={<ViajesPage />} />
          <Route path="/facturas" element={<FacturasPage />} />
          <Route path="/clientes" element={<ClientesPage />} />
          <Route path="/fleteros" element={<FleterosPage />} />
          <Route path="/vencimientos" element={<VencimientosPage />} />
        </Routes>
      </AppLayout>
    </BrowserRouter>
  )
}