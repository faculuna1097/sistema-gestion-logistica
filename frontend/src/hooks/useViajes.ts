import { useState, useEffect, useCallback } from 'react'
import { api } from '../services/api'
import type { Viaje, CreateViajeDTO } from '../types'

export function useViajes() {
  const [viajes, setViajes] = useState<Viaje[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchViajes = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await api.get<Viaje[]>('/viajes')
      setViajes(data)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al cargar viajes')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchViajes() }, [fetchViajes])

// AGREGAR VIAJE
  const crearViaje = async (dto: CreateViajeDTO) => {
    const nuevo = await api.post<Viaje>('/viajes', dto)
    setViajes(prev => [nuevo, ...prev])
    return nuevo
  }

// EDITAR VIAJE
  const editarViaje = async (id: number, dto: Partial<CreateViajeDTO>) => {
      const actualizado = await api.put<Viaje>(`/viajes/${id}`, dto)
      setViajes(prev => prev.map(v => v.id === id ? actualizado : v))
      return actualizado
  }


// ELIMINAR VIAJE
  const eliminarViaje = async (id: number) => {
    await api.delete(`/viajes/${id}`)
    setViajes(prev => prev.filter(v => v.id !== id))
  }

  return { viajes, loading, error, crearViaje, editarViaje, eliminarViaje, refetch: fetchViajes }
}