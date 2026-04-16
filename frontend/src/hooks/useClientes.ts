// frontend/src/hooks/useClientes.ts

import { useState, useEffect, useCallback } from 'react'
import { api } from '../services/api'
import type { Cliente, CreateClienteDTO } from '../types'

export function useClientes() {
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchClientes = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await api.get<Cliente[]>('/clientes')
      setClientes(data)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al cargar clientes')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchClientes() }, [fetchClientes])

  const crearCliente = async (dto: CreateClienteDTO) => {
    const nuevo = await api.post<Cliente>('/clientes', dto)
    setClientes(prev => [...prev, nuevo].sort((a, b) => a.nombre.localeCompare(b.nombre)))
    return nuevo
  }

  const editarCliente = async (id: number, dto: Partial<CreateClienteDTO>) => {
    const actualizado = await api.put<Cliente>(`/clientes/${id}`, dto)
    setClientes(prev => prev.map(c => c.id === id ? actualizado : c))
    return actualizado
  }

  const eliminarCliente = async (id: number) => {
    await api.delete(`/clientes/${id}`)
    setClientes(prev => prev.filter(c => c.id !== id))
  }

  return { clientes, loading, error, crearCliente, editarCliente, eliminarCliente, refetch: fetchClientes }
}