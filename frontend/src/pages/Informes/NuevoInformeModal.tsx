// frontend/src/pages/Informes/NuevoInformeModal.tsx

import { useState, useEffect, useMemo } from 'react'
import { useClientes } from '../../hooks/useClientes'
import { useFleteros } from '../../hooks/useFleteros'
import { useInformeWizard, calcularInforme } from '../../hooks/useInformeWizard'
import { Modal } from '../../components/Modal'
import { Button } from '../../components/Button'
import { PillButton } from '../../components/PillButton'
import { FormField, inputStyle } from '../../components/FormFields'
import { useCheckboxMasterRef } from '../../hooks/useCheckboxMasterRef'
import { theme } from '../../theme'
import { formatFecha, formatMoneyRound } from '../../utils/format'
import { getRangoDefault } from '../../utils/fechas'
import { thStyle, tdBaseStyle } from '../../components/tableStyles'
import { InformePreview } from './InformePreview'
import type { TipoInforme, InformeData, CreateInformeDTO, Informe } from '../../types'

// ─── Componente principal ─────────────────────────────────────────────────────

interface Props {
  open: boolean
  onClose: () => void
  onGuardar: (dto: CreateInformeDTO) => Promise<Informe>
}

export function NuevoInformeModal({ open, onClose, onGuardar }: Props) {
  // Estado del wizard
  const [paso, setPaso] = useState<1 | 2 | 3>(1)
  const [tipo, setTipo] = useState<TipoInforme | null>(null)
  const [actorId, setActorId] = useState<number | null>(null)
  const rangoDefault = useMemo(() => getRangoDefault(), [])
  const [desde, setDesde] = useState(rangoDefault.desde)
  const [hasta, setHasta] = useState(rangoDefault.hasta)
  const [seleccionados, setSeleccionados] = useState<Set<number>>(new Set())
  const [informeGenerado, setInformeGenerado] = useState<InformeData | null>(null)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  // Datos externos
  const { clientes } = useClientes()
  const { fleteros } = useFleteros()
  const { viajes, loading, error, cargar, limpiar } = useInformeWizard()

  // Mapa cliente_id → nombre (para el caso "informe de fletero")
  const mapaClientes = useMemo(
    () => Object.fromEntries(clientes.map(c => [c.id, c.nombre])),
    [clientes]
  )

  // Lista de actores visible en el paso 1 según el tipo elegido
  const actores = tipo === 'cliente' ? clientes : tipo === 'fletero' ? fleteros : []
  const actorElegido = actores.find(a => a.id === actorId)

  // Reset completo al cerrar
  const handleClose = () => {
    setPaso(1)
    setTipo(null)
    setActorId(null)
    setDesde(rangoDefault.desde)
    setHasta(rangoDefault.hasta)
    setSeleccionados(new Set())
    setInformeGenerado(null)
    setSaving(false)
    setSaveError(null)
    limpiar()
    onClose()
  }

  // Fetch de viajes al entrar al paso 2 o al cambiar filtros
  useEffect(() => {
    if (paso !== 2 || !tipo || actorId === null) return

    // Al cambiar filtros limpiamos la selección previa
    setSeleccionados(new Set())

    cargar({
      clienteId: tipo === 'cliente' ? actorId : undefined,
      fleteroId: tipo === 'fletero' ? actorId : undefined,
      desde,
      hasta,
    })
  }, [paso, tipo, actorId, desde, hasta, cargar])

  // Al cambiar tipo en paso 1, reseteamos el actor elegido
  const handleCambiarTipo = (nuevoTipo: TipoInforme) => {
    setTipo(prev => (prev === nuevoTipo ? null : nuevoTipo))
    setActorId(null)
  }

  // Selección de viajes
  const toggleSeleccion = (id: number) => {
    setSeleccionados(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  // Checkbox master: tilda todo si no todos están tildados; destilda si todos lo están
  const todosSeleccionados = viajes.length > 0 && seleccionados.size === viajes.length
  const algunosSeleccionados = seleccionados.size > 0 && !todosSeleccionados

  const toggleSeleccionarTodos = () => {
    if (todosSeleccionados) {
      setSeleccionados(new Set())
    } else {
      setSeleccionados(new Set(viajes.map(v => v.id)))
    }
  }

  const checkboxMasterRef = useCheckboxMasterRef(algunosSeleccionados)


  // Generar el informe y avanzar al paso 3
  const handleGenerar = () => {
    if (!tipo || !actorElegido || seleccionados.size === 0) return

    const viajesSeleccionados = viajes.filter(v => seleccionados.has(v.id))
    const informe = calcularInforme(
      tipo,
      { id: actorElegido.id, nombre: actorElegido.nombre },
      { desde, hasta },
      viajesSeleccionados,
      mapaClientes
    )
    setInformeGenerado(informe)
    setPaso(3)
  }

  // Volver de paso 3 a paso 2 (preservando selección)
  const handleVolver = () => {
    setInformeGenerado(null)
    setSaveError(null)
    setPaso(2)
  }

  // Guardar el informe: POST al backend vía callback del padre
  const handleGuardar = async () => {
    if (!tipo || !actorElegido || seleccionados.size === 0) return

    const dto: CreateInformeDTO = {
      tipo,
      clienteId: tipo === 'cliente' ? actorElegido.id : null,
      fleteroId: tipo === 'fletero' ? actorElegido.id : null,
      rangoDesde: desde,
      rangoHasta: hasta,
      viajeIds: Array.from(seleccionados),
    }

    setSaving(true)
    setSaveError(null)
    try {
      await onGuardar(dto)
      handleClose()
    } catch (err: unknown) {
      setSaveError(err instanceof Error ? err.message : 'Error al guardar el informe')
    } finally {
      setSaving(false)
    }
  }

  // Disabled del botón "Siguiente" en paso 1
  const puedeAvanzarPaso1 = tipo !== null && actorId !== null
  const puedeGenerar = seleccionados.size > 0

  return (
    <Modal open={open} onClose={handleClose} title="Nuevo informe" width="920px">
      {/* Breadcrumb */}
      <div style={{
        display: 'flex', gap: '12px', marginBottom: '20px',
        fontFamily: theme.font.family, fontSize: theme.font.size.sm,
      }}>
        <BreadcrumbPaso n={1} label="Actor"     activo={paso === 1} completado={paso > 1} />
        <BreadcrumbPaso n={2} label="Viajes"    activo={paso === 2} completado={paso > 2} />
        <BreadcrumbPaso n={3} label="Informe"   activo={paso === 3} completado={false} />
      </div>

      {(error || saveError) && (
        <div style={{
          background: theme.colors.dangerLight, color: theme.colors.danger,
          padding: '12px 16px', borderRadius: theme.radius.md, marginBottom: '20px',
          fontFamily: theme.font.family, fontSize: theme.font.size.sm,
        }}>
          {saveError ?? error}
        </div>
      )}

      {/* ═══ Paso 1: elegir tipo y actor ═══════════════════════════════════════ */}
      {paso === 1 && (
        <div>
          <div style={{ marginBottom: '20px' }}>
            <div style={{
              fontFamily: theme.font.family, fontSize: theme.font.size.sm,
              color: theme.colors.textSecondary, marginBottom: '8px',
            }}>
              Tipo de informe
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <PillButton label="Cliente" active={tipo === 'cliente'} onClick={() => handleCambiarTipo('cliente')} />
              <PillButton label="Fletero" active={tipo === 'fletero'} onClick={() => handleCambiarTipo('fletero')} />
            </div>
          </div>

          {tipo !== null && (
            <FormField label={tipo === 'cliente' ? 'Cliente' : 'Fletero'} required>
              <select
                style={inputStyle}
                value={actorId ?? ''}
                onChange={e => setActorId(e.target.value ? Number(e.target.value) : null)}
              >
                <option value="">— Seleccionar —</option>
                {actores.map(a => (
                  <option key={a.id} value={a.id}>{a.nombre}</option>
                ))}
              </select>
            </FormField>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '28px' }}>
            <Button variant="secondary" onClick={handleClose}>Cancelar</Button>
            <Button onClick={() => setPaso(2)} disabled={!puedeAvanzarPaso1}>Siguiente →</Button>
          </div>
        </div>
      )}

      {/* ═══ Paso 2: seleccionar viajes ═══════════════════════════════════════ */}
      {paso === 2 && tipo && actorElegido && (
        <div>
          <div style={{
            fontFamily: theme.font.family, fontSize: theme.font.size.sm,
            color: theme.colors.textSecondary, marginBottom: '16px',
          }}>
            Viajes de <strong style={{ color: theme.colors.textPrimary }}>{actorElegido.nombre}</strong>
          </div>

          {/* Filtros de rango */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
            <FormField label="Desde">
              <input style={inputStyle} type="date" value={desde} onChange={e => setDesde(e.target.value)} />
            </FormField>
            <FormField label="Hasta">
              <input style={inputStyle} type="date" value={hasta} onChange={e => setHasta(e.target.value)} />
            </FormField>
          </div>

          {/* Tabla de viajes */}
          <div style={{
            background: theme.colors.surface, borderRadius: theme.radius.lg,
            border: `1px solid ${theme.colors.border}`, overflow: 'hidden',
            maxHeight: '360px', overflowY: 'auto',
          }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${theme.colors.border}` }}>
                  <th style={{ ...thStyle, width: '40px' }}>
                    <input
                      ref={checkboxMasterRef}
                      type="checkbox"
                      checked={todosSeleccionados}
                      onChange={toggleSeleccionarTodos}
                      disabled={viajes.length === 0}
                      aria-label="Seleccionar todos"
                      style={{ cursor: 'pointer', accentColor: theme.colors.primary, width: '16px', height: '16px' }}
                    />
                  </th>
                  <th style={thStyle}>N° Viaje</th>
                  <th style={thStyle}>Fecha</th>
                  {tipo === 'cliente' && <th style={thStyle}>Remito</th>}
                  {tipo === 'cliente' && <th style={thStyle}>Destinatario</th>}
                  {tipo === 'fletero' && <th style={thStyle}>Cliente</th>}
                  <th style={{ ...thStyle, textAlign: 'right' }}>Valor</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={tipo === 'cliente' ? 6 : 5} style={{ padding: '32px', textAlign: 'center', color: theme.colors.textMuted, fontFamily: theme.font.family, fontSize: theme.font.size.sm }}>
                      Cargando...
                    </td>
                  </tr>
                ) : viajes.length === 0 ? (
                  <tr>
                    <td colSpan={tipo === 'cliente' ? 6 : 5} style={{ padding: '32px', textAlign: 'center', color: theme.colors.textMuted, fontFamily: theme.font.family, fontSize: theme.font.size.sm }}>
                      No hay viajes en ese rango
                    </td>
                  </tr>
                ) : viajes.map((v, i) => {
                  const seleccionada = seleccionados.has(v.id)
                  const valorMostrado = tipo === 'cliente' ? v.valorCliente : v.costoFletero
                  return (
                    <tr
                      key={v.id}
                      style={{
                        borderBottom: i < viajes.length - 1 ? `1px solid ${theme.colors.borderLight}` : 'none',
                        background: seleccionada ? theme.colors.primaryLight : 'transparent',
                        cursor: 'pointer', transition: 'background 0.1s',
                      }}
                      onClick={() => toggleSeleccion(v.id)}
                      onMouseEnter={e => { if (!seleccionada) e.currentTarget.style.background = theme.colors.surfaceHover }}
                      onMouseLeave={e => { e.currentTarget.style.background = seleccionada ? theme.colors.primaryLight : 'transparent' }}
                    >
                      <td style={{ padding: '12px 16px' }}>
                        <input
                          type="checkbox"
                          checked={seleccionada}
                          onChange={() => toggleSeleccion(v.id)}
                          onClick={e => e.stopPropagation()}
                          style={{ cursor: 'pointer', accentColor: theme.colors.primary, width: '16px', height: '16px' }}
                        />
                      </td>
                      <td style={{ ...tdBaseStyle, fontVariantNumeric: 'tabular-nums', color: theme.colors.textPrimary }}>
                        #{v.id}
                      </td>
                      <td style={{ ...tdBaseStyle, whiteSpace: 'nowrap' }}>{formatFecha(v.fecha)}</td>
                      {tipo === 'cliente' && <td style={tdBaseStyle}>{v.numeroRemito ?? '—'}</td>}
                      {tipo === 'cliente' && <td style={tdBaseStyle}>{v.destinatario ?? '—'}</td>}
                      {tipo === 'fletero' && <td style={{ ...tdBaseStyle, color: theme.colors.textPrimary }}>{mapaClientes[v.clienteId] ?? `Cliente ${v.clienteId}`}</td>}
                      <td style={{ ...tdBaseStyle, textAlign: 'right', fontVariantNumeric: 'tabular-nums', color: theme.colors.textPrimary }}>
                        {formatMoneyRound(valorMostrado)}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '20px' }}>
            <Button variant="secondary" onClick={() => setPaso(1)}>← Atrás</Button>
            <div style={{ display: 'flex', gap: '8px' }}>
              <Button variant="secondary" onClick={handleClose}>Cancelar</Button>
              <Button onClick={handleGenerar} disabled={!puedeGenerar}>
                Generar informe ({seleccionados.size})
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ═══ Paso 3: vista previa del informe ════════════════════════════════ */}
      {paso === 3 && informeGenerado && (
        <div>
          <InformePreview informe={informeGenerado} />

          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '24px' }}>
            <Button variant="secondary" onClick={handleVolver} disabled={saving}>← Volver</Button>
            <div style={{ display: 'flex', gap: '8px' }}>
              <Button variant="secondary" onClick={handleClose} disabled={saving}>Cancelar</Button>
              <Button onClick={handleGuardar} loading={saving}>Guardar informe</Button>
            </div>
          </div>
        </div>
      )}
    </Modal>
  )
}

// ─── Breadcrumb ───────────────────────────────────────────────────────────────

function BreadcrumbPaso({ n, label, activo, completado }: { n: number; label: string; activo: boolean; completado: boolean }) {
  const color = activo ? theme.colors.primary : completado ? theme.colors.textSecondary : theme.colors.textMuted
  const weight = activo ? theme.font.weight.semibold : theme.font.weight.medium
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color, fontWeight: weight }}>
      <span style={{
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        width: '22px', height: '22px', borderRadius: '50%',
        border: `1.5px solid ${color}`, fontSize: theme.font.size.xs,
        background: completado ? color : 'transparent',
        color: completado ? '#fff' : color,
      }}>
        {n}
      </span>
      {label}
    </div>
  )
}
