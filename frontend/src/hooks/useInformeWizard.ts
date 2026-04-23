// frontend/src/hooks/useInformeWizard.ts

import { useState, useCallback } from 'react'
import { api } from '../services/api'
import { IVA_ALICUOTA } from '../utils/iva'
import type { Viaje, ViajeFilters, TipoInforme, InformeData, InformeClienteFila, InformeFleteroFila } from '../types'

/**
 * Hook para traer viajes filtrados desde el backend.
 *
 * A diferencia de los hooks de listado (useClientes, useFleteros...), este
 * NO fetchea al montar. El fetch se dispara explícitamente con `cargar`
 * cuando el usuario eligió filtros y quiere ver los resultados.
 */
export function useInformeWizard() {
  const [viajes, setViajes] = useState<Viaje[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const cargar = useCallback(async (filtros: ViajeFilters) => {
    setLoading(true)
    setError(null)
    try {
      // Construimos query string. Solo incluimos los filtros definidos.
      // Nota: el endpoint /viajes acepta snake_case en la URL; el hook hace la
      // traducción de camelCase (interno) a snake_case (wire format).
      const params = new URLSearchParams()
      if (filtros.clienteId !== undefined) params.append('cliente_id', String(filtros.clienteId))
      if (filtros.fleteroId !== undefined) params.append('fletero_id', String(filtros.fleteroId))
      if (filtros.desde     !== undefined) params.append('desde', filtros.desde)
      if (filtros.hasta     !== undefined) params.append('hasta', filtros.hasta)

      const queryString = params.toString()
      const url = `/viajes${queryString ? `?${queryString}` : ''}`

      const data = await api.get<Viaje[]>(url)
      setViajes(data)
    } catch (err: unknown) {
      const mensaje = err instanceof Error ? err.message : 'Error al cargar viajes'
      setError(mensaje)
      setViajes([])
    } finally {
      setLoading(false)
    }
  }, [])

  const limpiar = useCallback(() => {
    setViajes([])
    setError(null)
  }, [])

  return { viajes, loading, error, cargar, limpiar }
}

/**
 * Calcula el informe completo a partir de los viajes seleccionados.
 * Función pura — no depende de React. Puede llamarse desde cualquier lado.
 *
 * - Para tipo 'cliente': la columna "valor" usa valorCliente del viaje.
 * - Para tipo 'fletero': la columna "valor" usa costoFletero del viaje.
 *
 * El IVA es fijo al 21% sobre el subtotal.
 */
export function calcularInforme(
  tipo: TipoInforme,
  actor: { id: number; nombre: string },
  rango: { desde: string; hasta: string },
  viajesSeleccionados: Viaje[],
  mapaClientes?: Record<number, string>
): InformeData {
  let filas: InformeClienteFila[] | InformeFleteroFila[]

  if (tipo === 'cliente') {
    filas = viajesSeleccionados.map((v): InformeClienteFila => ({
      viajeId:      v.id,
      fecha:        v.fecha,
      numeroRemito: v.numeroRemito,
      destinatario: v.destinatario,
      valor:        v.valorCliente,
    }))
  } else {
    // Para fletero necesitamos el nombre del cliente del viaje.
    // Se resuelve a través del mapa que pasa el componente (cliente_id → nombre),
    // mismo patrón que FacturasPage usa con clienteMap.
    filas = viajesSeleccionados.map((v): InformeFleteroFila => ({
      viajeId:       v.id,
      fecha:         v.fecha,
      clienteNombre: mapaClientes?.[v.clienteId] ?? `Cliente ${v.clienteId}`,
      valor:         v.costoFletero,
    }))
  }

  const subtotal = filas.reduce((sum, f) => sum + f.valor, 0)
  const iva = subtotal * IVA_ALICUOTA
  const total = subtotal + iva

  return {
    tipo,
    actor,
    rango,
    filas,
    subtotal,
    iva,
    total,
  }
}