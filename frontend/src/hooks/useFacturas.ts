// frontend/src/hooks/useFacturas.ts 

import { useState, useEffect, useCallback } from 'react'
import { api } from '../services/api'
import type { Factura, FacturarDTO } from '../types'

// Exportada para que el wizard de NuevaFacturaModal pueda construir filtros tipados.
export interface FacturasFiltros {
  tipo?: string
  estado?: string
  cliente_id?: number
  fletero_id?: number
}

export function useFacturas(filtros?: FacturasFiltros) {
  const [facturas, setFacturas] = useState<Factura[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchFacturas = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams()
      if (filtros?.tipo)       params.append('tipo',       filtros.tipo)
      if (filtros?.estado)     params.append('estado',     filtros.estado)
      if (filtros?.cliente_id) params.append('cliente_id', String(filtros.cliente_id))
      if (filtros?.fletero_id) params.append('fletero_id', String(filtros.fletero_id))
      const query = params.toString() ? `?${params.toString()}` : ''
      const data = await api.get<Factura[]>(`/facturas${query}`)
      setFacturas(data)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al cargar facturas')
    } finally {
      setLoading(false)
    }
  }, [filtros?.tipo, filtros?.estado, filtros?.cliente_id, filtros?.fletero_id])

  useEffect(() => { fetchFacturas() }, [fetchFacturas])

  const facturar = async (id: number, dto: FacturarDTO) => {
    const actualizada = await api.patch<Factura>(`/facturas/${id}/facturar`, dto)
    setFacturas(prev => prev.map(f => f.id === id ? actualizada : f))
    return actualizada
  }

  const pagar = async (id: number) => {
    const actualizada = await api.patch<Factura>(`/facturas/${id}/pagar`)
    setFacturas(prev => prev.map(f => f.id === id ? actualizada : f))
    return actualizada
  }

  const revertir = async (id: number) => {
    const actualizada = await api.patch<Factura>(`/facturas/${id}/revertir`)
    setFacturas(prev => prev.map(f => f.id === id ? actualizada : f))
    return actualizada
  }

  // facturarLote ahora acepta ajustesMonto e incluyeIva vía FacturarDTO ampliado.
  // El spread `{ ids, ...dto }` los manda al backend tal cual; si vienen undefined,
  // el backend se comporta exactamente como antes (retrocompatibilidad).
  const facturarLote = async (ids: number[], dto: FacturarDTO) => {
    const actualizadas = await api.patch<Factura[]>(`/facturas/facturar-lote`, { ids, ...dto })
    setFacturas(prev => prev.map(f => {
      const actualizada = actualizadas.find(a => a.id === f.id)
      return actualizada ?? f
    }))
    return actualizadas
  }

  return { facturas, loading, error, facturar, facturarLote, pagar, revertir, refetch: fetchFacturas }
}