// frontend/src/hooks/useInformes.ts

import { useState, useEffect, useCallback } from 'react'
import { api } from '../services/api'
import type { Informe, CreateInformeDTO } from '../types'

export function useInformes() {
  const [informes, setInformes] = useState<Informe[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchInformes = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await api.get<Informe[]>('/informes')
      setInformes(data)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al cargar informes')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchInformes() }, [fetchInformes])

  // CREAR INFORME
  const crearInforme = async (dto: CreateInformeDTO) => {
    const nuevo = await api.post<Informe>('/informes', dto)
    setInformes(prev => [nuevo, ...prev])
    return nuevo
  }

  // ELIMINAR INFORME
  const eliminarInforme = async (id: number) => {
    await api.delete(`/informes/${id}`)
    setInformes(prev => prev.filter(i => i.id !== id))
  }

  return { informes, loading, error, crearInforme, eliminarInforme, refetch: fetchInformes }
}