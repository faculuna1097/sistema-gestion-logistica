// frontend/src/hooks/useFacturaWizard.ts

import { useState, useCallback } from 'react'
import { api } from '../services/api'
import { IVA_ALICUOTA } from './useInformeWizard'
import type { Factura, Viaje, TipoInforme, TipoFactura } from '../types'

// ============================================================
// Tipos del wizard
// ============================================================

/**
 * Fila combinada que arma el wizard en el paso 2: un viaje del actor
 * que tiene una factura sin_facturar correspondiente.
 *
 * Estructura ancha intencional: trae todos los campos posibles (destinatario,
 * clienteId, etc.) sin discriminar por tipo. La UI elige qué columnas mostrar
 * según el tipo del wizard. Mismo principio que el `Viaje` del backend, que
 * trae `clienteNombre?` y `fleteroNombre?` aunque solo uno tenga sentido por contexto.
 */
export interface ViajeConFacturaSinFacturar {
  // datos del viaje
  viajeId: number
  fecha: string
  numeroRemito: string | null
  destinatario: string | null     // útil cuando tipo='cliente'
  clienteId: number               // útil para resolver nombre cuando tipo='fletero'

  // datos de la factura sin_facturar correspondiente
  facturaId: number
  montoOriginal: number           // factura.monto actual; default editable en paso 3
}

// Filas del preview de factura (lo que muestra paso 3 y FacturaDetailModal).
// Análogas a InformeClienteFila / InformeFleteroFila pero llevan el monto
// efectivo (que puede haber sido ajustado por el usuario) y el id de la factura.

export interface FacturaClienteFila {
  viajeId: number
  facturaId: number
  fecha: string
  numeroRemito: string | null
  destinatario: string | null
  monto: number                   // monto efectivo (con ajuste si lo hay)
}

export interface FacturaFleteroFila {
  viajeId: number
  facturaId: number
  fecha: string
  clienteNombre: string
  monto: number
}

/**
 * Datos derivados que renderiza FacturaPreview (paso 3 del wizard y detail modal).
 *
 * Diferencias intencionales con InformeData:
 *  - No tiene `rango`: la factura no representa un período, representa un
 *    conjunto específico de viajes. El rango era solo filtro de búsqueda.
 *  - Tiene `incluyeIva`: el componente lo necesita para decidir si renderiza
 *    la fila de IVA o no.
 *  - `iva` puede ser 0 (cuando incluyeIva=false), no es siempre 21% del subtotal.
 */
export interface FacturaPreviewData {
  tipo: TipoInforme
  actor: { id: number; nombre: string }
  filas: FacturaClienteFila[] | FacturaFleteroFila[]
  incluyeIva: boolean
  subtotal: number
  iva: number                     // 0 si incluyeIva=false
  total: number                   // subtotal + iva
}

// ============================================================
// Hook
// ============================================================

interface CargarFiltros {
  tipo: TipoInforme               // reuso del tipo: 'cliente' | 'fletero'
  actorId: number
  desde: string                   // YYYY-MM-DD
  hasta: string                   // YYYY-MM-DD
}

/**
 * Hook del wizard de NuevaFacturaModal.
 *
 * Como `useInformeWizard`, NO fetchea al montar. El fetch se dispara
 * explícitamente con `cargar` cuando el usuario eligió actor + rango y
 * pasó al paso 2.
 *
 * Internamente hace dos queries en paralelo (facturas sin_facturar del actor
 * + viajes del actor en el rango) y arma el array combinado client-side.
 * Decidido así para no agregar un endpoint específico del wizard al backend
 * (volumen trivial, endpoints existentes ya cubren el caso).
 */
export function useFacturaWizard() {
  const [viajesConFactura, setViajesConFactura] = useState<ViajeConFacturaSinFacturar[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const cargar = useCallback(async (filtros: CargarFiltros) => {
    setLoading(true)
    setError(null)
    try {
      // Determinar el tipo de factura a buscar según el actor.
      // Cliente → cobranza ; Fletero → pago_fletero.
      const tipoFactura: TipoFactura = filtros.tipo === 'cliente' ? 'cobranza' : 'pago_fletero'

      // Construir los query strings.
      // Nota: el endpoint /facturas hoy acepta cliente_id/fletero_id en snake_case
      // (deuda técnica anotada). Por eso pasamos las claves así.
      const paramFacturas = new URLSearchParams({
        estado: 'sin_facturar',
        tipo: tipoFactura,
      })
      if (filtros.tipo === 'cliente') {
        paramFacturas.append('cliente_id', String(filtros.actorId))
      } else {
        paramFacturas.append('fletero_id', String(filtros.actorId))
      }

      const paramViajes = new URLSearchParams({
        desde: filtros.desde,
        hasta: filtros.hasta,
      })
      if (filtros.tipo === 'cliente') {
        paramViajes.append('cliente_id', String(filtros.actorId))
      } else {
        paramViajes.append('fletero_id', String(filtros.actorId))
      }

      // Dos queries en paralelo.
      const [facturas, viajes] = await Promise.all([
        api.get<Factura[]>(`/facturas?${paramFacturas.toString()}`),
        api.get<Viaje[]>(`/viajes?${paramViajes.toString()}`),
      ])

      // Mapa facturaPorViajeId para lookup O(1) en el merge.
      // Filtramos las que tengan viajeId no nulo (las pago_servicio no tienen
      // viaje asociado, pero ya filtramos por tipo arriba así que no deberían venir;
      // este check es defensa en profundidad).
      const facturasPorViajeId = new Map<number, Factura>()
      for (const f of facturas) {
        if (f.viajeId !== null) {
          facturasPorViajeId.set(f.viajeId, f)
        }
      }

      // Merge: por cada viaje, si existe factura sin_facturar correspondiente,
      // armamos la fila combinada. Los viajes sin factura sin_facturar quedan
      // afuera (caso real: viajes ya facturados en períodos anteriores que
      // entran en el rango pedido).
      const filas: ViajeConFacturaSinFacturar[] = []
      for (const v of viajes) {
        const factura = facturasPorViajeId.get(v.id)
        if (!factura) continue
        filas.push({
          viajeId:       v.id,
          fecha:         v.fecha,
          numeroRemito:  v.numeroRemito,
          destinatario:  v.destinatario,
          clienteId:     v.clienteId,
          facturaId:     factura.id,
          montoOriginal: factura.monto,
        })
      }

      setViajesConFactura(filas)
    } catch (err: unknown) {
      const mensaje = err instanceof Error ? err.message : 'Error al cargar viajes'
      setError(mensaje)
      setViajesConFactura([])
    } finally {
      setLoading(false)
    }
  }, [])

  const limpiar = useCallback(() => {
    setViajesConFactura([])
    setError(null)
  }, [])

  return { viajesConFactura, loading, error, cargar, limpiar }
}

// ============================================================
// Función pura — calcula el preview de la factura
// ============================================================

/**
 * Arma el FacturaPreviewData a partir de las filas seleccionadas + ajustes + IVA.
 * Función pura — no depende de React. La consumen NuevaFacturaModal (paso 3)
 * y FacturaDetailModal.
 *
 * - Para tipo 'cliente': la columna del preview muestra destinatario + remito.
 * - Para tipo 'fletero': la columna del preview muestra el cliente del viaje.
 *
 * El monto efectivo de cada fila es: `ajustesMonto.get(facturaId) ?? montoOriginal`.
 * El IVA es 21% del subtotal cuando incluyeIva=true, 0 si no.
 */
export function calcularFactura(
  tipo: TipoInforme,
  actor: { id: number; nombre: string },
  viajesSeleccionados: ViajeConFacturaSinFacturar[],
  ajustesMonto: Map<number, number>,
  incluyeIva: boolean,
  mapaClientes?: Record<number, string>
): FacturaPreviewData {
  let filas: FacturaClienteFila[] | FacturaFleteroFila[]

  if (tipo === 'cliente') {
    filas = viajesSeleccionados.map((v): FacturaClienteFila => ({
      viajeId:      v.viajeId,
      facturaId:    v.facturaId,
      fecha:        v.fecha,
      numeroRemito: v.numeroRemito,
      destinatario: v.destinatario,
      monto:        ajustesMonto.get(v.facturaId) ?? v.montoOriginal,
    }))
  } else {
    filas = viajesSeleccionados.map((v): FacturaFleteroFila => ({
      viajeId:       v.viajeId,
      facturaId:     v.facturaId,
      fecha:         v.fecha,
      clienteNombre: mapaClientes?.[v.clienteId] ?? `Cliente ${v.clienteId}`,
      monto:         ajustesMonto.get(v.facturaId) ?? v.montoOriginal,
    }))
  }

  const subtotal = filas.reduce((sum, f) => sum + f.monto, 0)
  const iva = incluyeIva ? subtotal * IVA_ALICUOTA : 0
  const total = subtotal + iva

  return {
    tipo,
    actor,
    filas,
    incluyeIva,
    subtotal,
    iva,
    total,
  }
}

// ============================================================
// Helper para reconstruir un FacturaPreviewData desde facturas ya emitidas
// ============================================================

/**
 * Arma un FacturaPreviewData a partir de un grupo de facturas YA EMITIDAS
 * (todas con el mismo número). Lo usa FacturaDetailModal para mostrar el detalle
 * sin tener que ir a la DB — los datos ya están en memoria gracias a useFacturas
 * y useViajes.
 *
 * Diferencias con calcularFactura:
 *  - calcularFactura recibe ViajeConFacturaSinFacturar[] (filas combinadas del
 *    wizard, con ajustes de monto pendientes).
 *  - armarPreviewDesdeFacturas recibe Factura[] ya emitidas + Viaje[] del sistema,
 *    y los matchea por viajeId. El monto es el monto persistido de cada factura
 *    (no hay ajustes pendientes).
 *
 * Si una factura tiene viajeId que no aparece en el array de viajes, se omite
 * la fila (defensa en profundidad: en la práctica no debería pasar porque el
 * DELETE de viaje borra primero las facturas asociadas, pero si pasara, no
 * crasheamos).
 */
export function armarPreviewDesdeFacturas(
  tipo: TipoInforme,
  actor: { id: number; nombre: string },
  facturas: Factura[],
  viajes: Viaje[],
  incluyeIva: boolean,
  mapaClientes?: Record<number, string>
): FacturaPreviewData {
  // Mapa de viajes por id para lookup O(1).
  const viajesPorId = new Map<number, Viaje>()
  for (const v of viajes) viajesPorId.set(v.id, v)

  let filas: FacturaClienteFila[] | FacturaFleteroFila[]

  if (tipo === 'cliente') {
    const filasCliente: FacturaClienteFila[] = []
    for (const f of facturas) {
      if (f.viajeId === null) continue
      const v = viajesPorId.get(f.viajeId)
      if (!v) continue
      filasCliente.push({
        viajeId:      v.id,
        facturaId:    f.id,
        fecha:        v.fecha,
        numeroRemito: v.numeroRemito,
        destinatario: v.destinatario,
        monto:        f.monto,
      })
    }
    filas = filasCliente
  } else {
    const filasFletero: FacturaFleteroFila[] = []
    for (const f of facturas) {
      if (f.viajeId === null) continue
      const v = viajesPorId.get(f.viajeId)
      if (!v) continue
      filasFletero.push({
        viajeId:       v.id,
        facturaId:     f.id,
        fecha:         v.fecha,
        clienteNombre: mapaClientes?.[v.clienteId] ?? `Cliente ${v.clienteId}`,
        monto:         f.monto,
      })
    }
    filas = filasFletero
  }

  const subtotal = filas.reduce((sum, f) => sum + f.monto, 0)
  const iva = incluyeIva ? subtotal * IVA_ALICUOTA : 0
  const total = subtotal + iva

  return {
    tipo,
    actor,
    filas,
    incluyeIva,
    subtotal,
    iva,
    total,
  }
}