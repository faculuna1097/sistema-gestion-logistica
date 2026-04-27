// frontend/src/hooks/useVencimientos.ts

import { useState, useEffect, useMemo } from 'react'
import { api } from '../services/api'
import { obtenerSemanasDelMes } from '../utils/fechas'
import type { Orden } from '../components/OrdenToggle'

export interface VencimientoRow {
  id: number
  tipo: 'cobranza' | 'pago_fletero'
  titular: string
  numero: string | null
  monto: number
  vencimiento: string
}

export interface SemanaGroup {
  label: string
  filas: VencimientoRow[]
  subtotal: number
  esActual: boolean
}

interface VencimientosData {
  vencidas: VencimientoRow[]
  delMes: VencimientoRow[]
}

function getMesActual(): string {
  return new Date().toISOString().slice(0, 7)
}

/**
 * Distribuye filas en semanas reales (lunes-domingo) recortadas al mes filtrado.
 * Las filas dentro de cada semana van ordenadas por vencimiento ascendente fijo.
 * El orden entre semanas (asc o desc) se decide en el caller.
 */
function agruparPorSemanaReal(filas: VencimientoRow[], mes: string): SemanaGroup[] {
  const semanas = obtenerSemanasDelMes(mes)

  return semanas
    .map(({ desde, hasta, labelHeader, esActual }) => {
      const filasDeEstaSemana = filas
        .filter(f => f.vencimiento >= desde && f.vencimiento <= hasta)
        .sort((a, b) => a.vencimiento.localeCompare(b.vencimiento))

      const subtotal = filasDeEstaSemana.reduce((acc, f) => acc + f.monto, 0)

      return { label: labelHeader, filas: filasDeEstaSemana, subtotal, esActual }
    })
    .filter(s => s.filas.length > 0)
}

export function useVencimientos() {
  const [mes, setMes] = useState<string>(getMesActual())
  const [orden, setOrden] = useState<Orden>('desc')
  const [data, setData] = useState<VencimientosData>({ vencidas: [], delMes: [] })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setLoading(true)
    setError(null)
    api.get<VencimientosData>(`/vencimientos?mes=${mes}`)
      .then(res => setData(res))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [mes])

  // Separar por tipo
  const vencidasCobranza = useMemo(() => data.vencidas.filter(f => f.tipo === 'cobranza'),     [data.vencidas])
  const vencidasPagos    = useMemo(() => data.vencidas.filter(f => f.tipo === 'pago_fletero'), [data.vencidas])
  const cobranzaDelMes   = useMemo(() => data.delMes.filter(f => f.tipo === 'cobranza'),       [data.delMes])
  const pagosDelMes      = useMemo(() => data.delMes.filter(f => f.tipo === 'pago_fletero'),   [data.delMes])

  // Agrupar por semana real (recortada a bordes del mes) y aplicar orden entre semanas
  const semanasCobranza = useMemo(() => {
    const base = agruparPorSemanaReal(cobranzaDelMes, mes)
    return orden === 'desc' ? [...base].reverse() : base
  }, [cobranzaDelMes, mes, orden])

  const semanasPagos = useMemo(() => {
    const base = agruparPorSemanaReal(pagosDelMes, mes)
    return orden === 'desc' ? [...base].reverse() : base
  }, [pagosDelMes, mes, orden])

  // Totales del mes
  const totalCobranza = useMemo(() => cobranzaDelMes.reduce((acc, f) => acc + f.monto, 0), [cobranzaDelMes])
  const totalPagos    = useMemo(() => pagosDelMes.reduce((acc, f) => acc + f.monto, 0),    [pagosDelMes])

  return {
    mes,
    setMes,
    orden,
    setOrden,
    loading,
    error,
    vencidasCobranza,
    vencidasPagos,
    semanasCobranza,
    semanasPagos,
    totalCobranza,
    totalPagos,
  }
}