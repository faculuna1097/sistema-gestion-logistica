// frontend/src/hooks/useFacturas.ts

import { useState, useEffect, useCallback } from 'react'
import { api } from '../services/api'
import type { Factura, FacturarDTO } from '../types'

/**
 * Filtros aceptados por el hook de listado de facturas.
 *
 * Campos en camelCase (convención del frontend). La serialización a snake_case
 * para el wire format ocurre internamente al construir la URL.
 *
 * Exportado por si otro hook o componente lo quiere consumir. Hoy no hay
 * consumers externos, pero dejarlo exportado habilita tipado desde el caller
 * sin redeclararlo.
 */
export interface FacturasFiltros {
  tipo?: string
  estado?: string
  clienteId?: number
  fleteroId?: number
}

export function useFacturas(filtros?: FacturasFiltros) {
  const [facturas, setFacturas] = useState<Factura[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchFacturas = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      // Serialización a snake_case: el endpoint del backend acepta snake_case
      // en los query params (contrato de URL). El camelCase vive solo en el
      // lado React.
      // Chequeo por `!== undefined` (no truthy) para que id=0 — aunque hoy no
      // ocurra — no sea tratado como ausencia de filtro.
      const params = new URLSearchParams()
      if (filtros?.tipo      !== undefined) params.append('tipo',       filtros.tipo)
      if (filtros?.estado    !== undefined) params.append('estado',     filtros.estado)
      if (filtros?.clienteId !== undefined) params.append('cliente_id', String(filtros.clienteId))
      if (filtros?.fleteroId !== undefined) params.append('fletero_id', String(filtros.fleteroId))
      const query = params.toString() ? `?${params.toString()}` : ''
      const data = await api.get<Factura[]>(`/facturas${query}`)
      setFacturas(data)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al cargar facturas')
    } finally {
      setLoading(false)
    }
  }, [filtros?.tipo, filtros?.estado, filtros?.clienteId, filtros?.fleteroId])

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

  // facturarLote acepta ajustesMonto e incluyeIva vía FacturarDTO ampliado.
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