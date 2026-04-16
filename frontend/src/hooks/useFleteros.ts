// src/hooks/useFleteros.ts

import { useState, useEffect, useCallback } from 'react'
import { api } from '../services/api'
import type { Fletero, CreateFleteroDTO } from '../types'

export function useFleteros() {
  const [fleteros, setFleteros] = useState<Fletero[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchFleteros = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await api.get<Fletero[]>('/fleteros')
      setFleteros(data)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al cargar fleteros')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchFleteros() }, [fetchFleteros])

  const crearFletero = async (dto: CreateFleteroDTO) => {
    const nuevo = await api.post<Fletero>('/fleteros', dto)
    setFleteros(prev => [...prev, nuevo].sort((a, b) => a.nombre.localeCompare(b.nombre)))
    return nuevo
  }

  const editarFletero = async (id: number, dto: Partial<CreateFleteroDTO>) => {
    const actualizado = await api.put<Fletero>(`/fleteros/${id}`, dto)
    setFleteros(prev => prev.map(f => f.id === id ? actualizado : f))
    return actualizado
  }

  const eliminarFletero = async (id: number) => {
    await api.delete(`/fleteros/${id}`)
    setFleteros(prev => prev.filter(f => f.id !== id))
  }

  return { fleteros, loading, error, crearFletero, editarFletero, eliminarFletero, refetch: fetchFleteros }
}