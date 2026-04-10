import { useState, useEffect, useCallback } from 'react'
import { api } from '../services/api'
import type { Factura, FacturarDTO } from '../types'

interface FacturasFiltros {
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
      if (filtros?.tipo) params.append('tipo', filtros.tipo)
      if (filtros?.estado) params.append('estado', filtros.estado)
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

  return { facturas, loading, error, facturar, pagar, refetch: fetchFacturas }
}