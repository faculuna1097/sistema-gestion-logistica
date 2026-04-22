// frontend/src/hooks/useInformeResuelto.ts

import { useEffect, useMemo, useState } from 'react'
import { useClientes } from './useClientes'
import { useFleteros } from './useFleteros'
import { useInformeWizard, calcularInforme } from './useInformeWizard'
import type { Informe, InformeData } from '../types'

/**
 * Resuelve un Informe guardado en su InformeData renderizable.
 *
 * Dado un Informe (con solo IDs y metadata), este hook:
 *   1. Fetchea los viajes asociados usando los filtros del informe (titular + rango).
 *   2. Resuelve el nombre del titular desde el listado de clientes/fleteros.
 *   3. Arma el InformeData listo para renderizar o exportar a PDF.
 *
 * Si el titular fue eliminado del sistema, el nombre se muestra como "Titular eliminado".
 * Si algún viaje fue eliminado (CASCADE del schema), simplemente no aparece en el resultado.
 *
 * El flag `ready` indica que los datos corresponden al `informe` actual
 * (no a un fetch previo). Los consumidores que disparan acciones irreversibles
 * (como exportar a PDF) deben esperar `ready === true` antes de actuar.
 * Los consumidores puramente visuales (como InformeDetailModal) pueden usar
 * `loading` directamente.
 *
 * Consumido por InformeDetailModal y por el handler de export PDF en InformesPage.
 */
export function useInformeResuelto(informe: Informe | null) {
  const { clientes } = useClientes()
  const { fleteros } = useFleteros()
  const { viajes, loading, error, cargar, limpiar } = useInformeWizard()

// "ready" es true solo cuando los viajes cargados corresponden al informe actual.
  // Evita que consumidores usen datos de un fetch previo o del estado inicial vacío.
  const [readyForInformeId, setReadyForInformeId] = useState<number | null>(null)

  // "loadingVisto" trackea si vimos loading=true desde que pedimos el informe actual.
  // Necesario porque useInformeWizard puede tener loading=false del ciclo anterior
  // (ej: lo usó el wizard antes). Sin este flag, ready se activaría prematuramente
  // con viajes stale.
  const [loadingVisto, setLoadingVisto] = useState(false)

  // Al cambiar de informe, resetear ready y cargar viajes filtrados.
  // Dependemos de informe?.id para evitar recargas cuando el padre re-renderiza
  // sin cambiar de informe.
  useEffect(() => {
    if (!informe) {
      setReadyForInformeId(null)
      setLoadingVisto(false)
      limpiar()
      return
    }

    // Invalidar ready y resetear el tracking del ciclo de loading.
    // Ambos flags arrancan en "no listo" hasta ver el ciclo completo loading true → false.
    setReadyForInformeId(null)
    setLoadingVisto(false)

    cargar({
      clienteId: informe.tipo === 'cliente' && informe.clienteId !== null ? informe.clienteId : undefined,
      fleteroId: informe.tipo === 'fletero' && informe.fleteroId !== null ? informe.fleteroId : undefined,
      desde: informe.rangoDesde,
      hasta: informe.rangoHasta,
    })
  }, [informe?.id, cargar, limpiar])  // eslint-disable-line react-hooks/exhaustive-deps

  // Paso 1: cuando vemos loading=true, registramos que el ciclo de fetch arrancó.
  // Esto confirma que cargar() fue efectivamente procesado por useInformeWizard.
  useEffect(() => {
    if (loading && !loadingVisto) {
      setLoadingVisto(true)
    }
  }, [loading, loadingVisto])

  // Paso 2: solo después de haber visto loading=true, cuando vuelve a false,
  // los datos corresponden al informe pedido. Marcamos ready.
  useEffect(() => {
    if (informe && loadingVisto && !loading && readyForInformeId !== informe.id) {
      setReadyForInformeId(informe.id)
    }
  }, [informe, loading, loadingVisto, readyForInformeId])

  const ready = informe !== null && readyForInformeId === informe.id

  // Mapa cliente_id → nombre (necesario para informes de fletero)
  const mapaClientes = useMemo(
    () => Object.fromEntries(clientes.map(c => [c.id, c.nombre])),
    [clientes]
  )

  // Resolver CUIT del titular
  const cuit = useMemo(() => {
    if (!informe) return null
    if (informe.tipo === 'cliente' && informe.clienteId !== null) {
      return clientes.find(c => c.id === informe.clienteId)?.cuit ?? null
    }
    if (informe.tipo === 'fletero' && informe.fleteroId !== null) {
      return fleteros.find(f => f.id === informe.fleteroId)?.cuit ?? null
    }
    return null
  }, [informe, clientes, fleteros])

  // Construir el InformeData a partir del informe guardado + los viajes fetcheados.
  // Solo lo devolvemos si ready === true; en caso contrario, null.
  // Así evitamos que consumidores vean un informe "vacío" durante el fetch inicial.
  const informeData = useMemo<InformeData | null>(() => {
    if (!informe) return null
    if (!ready) return null

    let actorNombre = 'Titular eliminado'
    if (informe.tipo === 'cliente' && informe.clienteId !== null) {
      actorNombre = clientes.find(c => c.id === informe.clienteId)?.nombre ?? 'Titular eliminado'
    } else if (informe.tipo === 'fletero' && informe.fleteroId !== null) {
      actorNombre = fleteros.find(f => f.id === informe.fleteroId)?.nombre ?? 'Titular eliminado'
    }

    const actorId = informe.tipo === 'cliente' ? informe.clienteId : informe.fleteroId

    const viajesDelInforme = viajes.filter(v => informe.viajeIds.includes(v.id))

    return calcularInforme(
      informe.tipo,
      { id: actorId ?? 0, nombre: actorNombre },
      { desde: informe.rangoDesde, hasta: informe.rangoHasta },
      viajesDelInforme,
      mapaClientes
    )
  }, [informe, ready, viajes, clientes, fleteros, mapaClientes])

  return { informeData, cuit, loading, error, ready }
}