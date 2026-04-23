// frontend/src/pages/Facturas/NuevaFacturaModal.tsx

import { useState, useEffect, useMemo, useRef } from 'react'
import { useClientes } from '../../hooks/useClientes'
import { useFleteros } from '../../hooks/useFleteros'
import { useFacturaWizard, calcularFactura } from '../../hooks/useFacturaWizard'
import { Modal } from '../../components/Modal'
import { Button } from '../../components/Button'
import { FormField, inputStyle } from '../../components/FormFields'
import { theme } from '../../theme'
import { formatFecha, formatMoney } from '../../utils/format'
import { getRangoDefault, sumarDias } from '../../utils/fechas'
import { thStyle, tdBaseStyle, rowTotalStyle } from '../../components/tableStyles'
import type { TipoInforme, FacturarDTO, Factura, AjusteMontoFactura } from '../../types'

// ─── Estilos locales ──────────────────────────────────────────────────────────

// Input numérico inline para edición de monto (más compacto que inputStyle estándar).
const montoInputStyle: React.CSSProperties = {
  fontFamily: theme.font.family,
  fontSize: theme.font.size.sm,
  color: theme.colors.textPrimary,
  background: theme.colors.surface,
  border: `1px solid ${theme.colors.border}`,
  borderRadius: theme.radius.sm,
  padding: '4px 8px',
  outline: 'none',
  width: '120px',
  textAlign: 'right',
  fontVariantNumeric: 'tabular-nums',
}

// ─── Subcomponentes ───────────────────────────────────────────────────────────

function TipoButton({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        fontFamily: theme.font.family,
        fontSize: theme.font.size.base,
        fontWeight: active ? theme.font.weight.semibold : theme.font.weight.medium,
        padding: '10px 32px',
        borderRadius: theme.radius.md,
        border: `2px solid ${active ? theme.colors.primary : theme.colors.border}`,
        background: active ? theme.colors.primary : theme.colors.surface,
        color: active ? '#fff' : theme.colors.textSecondary,
        cursor: 'pointer',
        transition: 'all 0.15s',
      }}
    >
      {label}
    </button>
  )
}

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

// ─── Componente principal ─────────────────────────────────────────────────────

interface Props {
  open: boolean
  onClose: () => void
  // facturarLote del hook useFacturas. Devuelve las facturas actualizadas.
  onEmitir: (ids: number[], dto: FacturarDTO) => Promise<Factura[]>
}

export function NuevaFacturaModal({ open, onClose, onEmitir }: Props) {
  // ── Estado del wizard ────────────────────────────────────────────────────
  const [paso, setPaso] = useState<1 | 2 | 3>(1)
  const [tipo, setTipo] = useState<TipoInforme | null>(null)
  const [actorId, setActorId] = useState<number | null>(null)

  const rangoDefault = useMemo(() => getRangoDefault(), [])
  const [desde, setDesde] = useState(rangoDefault.desde)
  const [hasta, setHasta] = useState(rangoDefault.hasta)

  const [seleccionados, setSeleccionados] = useState<Set<number>>(new Set())

  // ── Estado del paso 3 ────────────────────────────────────────────────────
  // Map solo con ajustes (decisión B): facturaId → monto editado.
  // Si una factura no está en el map, su monto efectivo = montoOriginal.
  const [ajustesMonto, setAjustesMonto] = useState<Map<number, number>>(new Map())
  const [erroresMonto, setErroresMonto] = useState<Map<number, string>>(new Map())

  const [incluyeIva, setIncluyeIva] = useState(true)
  const [numero, setNumero] = useState('')
  const [fechaEmision, setFechaEmision] = useState(rangoDefault.hoy)
  const [vencimiento, setVencimiento] = useState(sumarDias(rangoDefault.hoy, 30))

  // Si el usuario edita manualmente el vencimiento, dejamos de auto-recalcular.
  const [vencimientoTocado, setVencimientoTocado] = useState(false)

  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  // ── Datos externos ───────────────────────────────────────────────────────
  const { clientes } = useClientes()
  const { fleteros } = useFleteros()
  const { viajesConFactura, loading, error, cargar, limpiar } = useFacturaWizard()

  const mapaClientes = useMemo(
    () => Object.fromEntries(clientes.map(c => [c.id, c.nombre])),
    [clientes]
  )

  const actores = tipo === 'cliente' ? clientes : tipo === 'fletero' ? fleteros : []
  const actorElegido = actores.find(a => a.id === actorId)

  // ── Reset completo al cerrar ─────────────────────────────────────────────
  const handleClose = () => {
    setPaso(1)
    setTipo(null)
    setActorId(null)
    setDesde(rangoDefault.desde)
    setHasta(rangoDefault.hasta)
    setSeleccionados(new Set())
    setAjustesMonto(new Map())
    setErroresMonto(new Map())
    setIncluyeIva(true)
    setNumero('')
    setFechaEmision(rangoDefault.hoy)
    setVencimiento(sumarDias(rangoDefault.hoy, 30))
    setVencimientoTocado(false)
    setSaving(false)
    setSaveError(null)
    limpiar()
    onClose()
  }

  // ── Fetch al entrar al paso 2 o cambiar filtros ──────────────────────────
  useEffect(() => {
    if (paso !== 2 || !tipo || actorId === null) return
    setSeleccionados(new Set())
    cargar({ tipo, actorId, desde, hasta })
  }, [paso, tipo, actorId, desde, hasta, cargar])

  // ── Recálculo automático del vencimiento cuando cambia fechaEmision ──────
  // Solo si el usuario no lo editó manualmente.
  useEffect(() => {
    if (vencimientoTocado || !fechaEmision) return
    setVencimiento(sumarDias(fechaEmision, 30))
  }, [fechaEmision, vencimientoTocado])

  const handleCambiarTipo = (nuevoTipo: TipoInforme) => {
    setTipo(prev => (prev === nuevoTipo ? null : nuevoTipo))
    setActorId(null)
  }

  // ── Selección de viajes (paso 2) ─────────────────────────────────────────
  const toggleSeleccion = (viajeId: number) => {
    setSeleccionados(prev => {
      const next = new Set(prev)
      next.has(viajeId) ? next.delete(viajeId) : next.add(viajeId)
      return next
    })
  }

  const todosSeleccionados = viajesConFactura.length > 0 && seleccionados.size === viajesConFactura.length
  const algunosSeleccionados = seleccionados.size > 0 && !todosSeleccionados

  const toggleSeleccionarTodos = () => {
    if (todosSeleccionados) {
      setSeleccionados(new Set())
    } else {
      setSeleccionados(new Set(viajesConFactura.map(v => v.viajeId)))
    }
  }

  const checkboxMasterRef = useRef<HTMLInputElement>(null)
  useEffect(() => {
    if (checkboxMasterRef.current) {
      checkboxMasterRef.current.indeterminate = algunosSeleccionados
    }
  }, [algunosSeleccionados])

  // ── Avanzar a paso 3 ─────────────────────────────────────────────────────
  const handleAvanzarAPaso3 = () => {
    if (!tipo || !actorElegido || seleccionados.size === 0) return
    // Limpiamos ajustes/errores cada vez que entramos al paso 3 desde paso 2
    // (la selección puede haber cambiado).
    setAjustesMonto(new Map())
    setErroresMonto(new Map())
    setSaveError(null)
    setPaso(3)
  }

  // ── Volver a paso 2 ──────────────────────────────────────────────────────
  const handleVolverAPaso2 = () => {
    setSaveError(null)
    setPaso(2)
  }

  // ── Edición de monto en paso 3 ───────────────────────────────────────────
  // Estado intermedio: input controlado por string para permitir tipear libremente.
  // Lo convertimos a número solo onBlur (validación C2).
  const [montosString, setMontosString] = useState<Map<number, string>>(new Map())

  const handleCambiarMontoInput = (facturaId: number, valor: string) => {
    setMontosString(prev => {
      const next = new Map(prev)
      next.set(facturaId, valor)
      return next
    })
  }

  const handleBlurMonto = (facturaId: number, montoOriginal: number) => {
    const valorString = montosString.get(facturaId)
    if (valorString === undefined) return  // no se editó

    // Permitimos vacío como "volver al original".
    if (valorString.trim() === '') {
      setAjustesMonto(prev => {
        const next = new Map(prev)
        next.delete(facturaId)
        return next
      })
      setErroresMonto(prev => {
        const next = new Map(prev)
        next.delete(facturaId)
        return next
      })
      setMontosString(prev => {
        const next = new Map(prev)
        next.delete(facturaId)
        return next
      })
      return
    }

    const num = Number(valorString)

    // Validación C2: número finito >= 0
    if (!Number.isFinite(num) || num < 0) {
      setErroresMonto(prev => {
        const next = new Map(prev)
        next.set(facturaId, 'Monto inválido')
        return next
      })
      return
    }

    // Si el monto editado coincide con el original, no es ajuste.
    if (num === montoOriginal) {
      setAjustesMonto(prev => {
        const next = new Map(prev)
        next.delete(facturaId)
        return next
      })
    } else {
      setAjustesMonto(prev => {
        const next = new Map(prev)
        next.set(facturaId, num)
        return next
      })
    }

    setErroresMonto(prev => {
      const next = new Map(prev)
      next.delete(facturaId)
      return next
    })
  }

  // ── Cálculo del preview en vivo (paso 3) ─────────────────────────────────
  const viajesSeleccionados = useMemo(
    () => viajesConFactura.filter(v => seleccionados.has(v.viajeId)),
    [viajesConFactura, seleccionados]
  )

  const preview = useMemo(() => {
    if (!tipo || !actorElegido) return null
    return calcularFactura(
      tipo,
      { id: actorElegido.id, nombre: actorElegido.nombre },
      viajesSeleccionados,
      ajustesMonto,
      incluyeIva,
      mapaClientes
    )
  }, [tipo, actorElegido, viajesSeleccionados, ajustesMonto, incluyeIva, mapaClientes])

  // ── Emitir factura ───────────────────────────────────────────────────────
  const handleEmitir = async () => {
    if (!preview) return

    // Validaciones de los inputs del paso 3
    if (!numero.trim())   { setSaveError('El número es requerido');     return }
    if (!fechaEmision)    { setSaveError('La fecha de emisión es requerida'); return }
    if (!vencimiento)     { setSaveError('El vencimiento es requerido'); return }
    if (erroresMonto.size > 0) {
      setSaveError('Hay montos inválidos en la tabla')
      return
    }

    // Armado del array de ajustes para el backend.
    const ajustesArray: AjusteMontoFactura[] = Array.from(ajustesMonto.entries()).map(
      ([id, monto]) => ({ id, monto })
    )

    // IDs son los facturaId de los viajes seleccionados.
    const ids = viajesSeleccionados.map(v => v.facturaId)

    const dto: FacturarDTO = {
      numero: numero.trim(),
      fechaEmision,
      vencimiento,
      incluyeIva,
      ...(ajustesArray.length > 0 && { ajustesMonto: ajustesArray }),
    }

    setSaving(true)
    setSaveError(null)
    try {
      await onEmitir(ids, dto)
      handleClose()
    } catch (err: unknown) {
      setSaveError(err instanceof Error ? err.message : 'Error al emitir la factura')
    } finally {
      setSaving(false)
    }
  }

  const puedeAvanzarPaso1 = tipo !== null && actorId !== null
  const puedeAvanzarPaso2 = seleccionados.size > 0

  return (
    <Modal open={open} onClose={handleClose} title="Nueva factura" width="920px">
      {/* Breadcrumb */}
      <div style={{
        display: 'flex', gap: '12px', marginBottom: '20px',
        fontFamily: theme.font.family, fontSize: theme.font.size.sm,
      }}>
        <BreadcrumbPaso n={1} label="Actor"    activo={paso === 1} completado={paso > 1} />
        <BreadcrumbPaso n={2} label="Viajes"   activo={paso === 2} completado={paso > 2} />
        <BreadcrumbPaso n={3} label="Emisión"  activo={paso === 3} completado={false} />
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

      {/* ═══ Paso 1: actor ═══════════════════════════════════════════════════ */}
      {paso === 1 && (
        <div>
          <div style={{ marginBottom: '20px' }}>
            <div style={{
              fontFamily: theme.font.family, fontSize: theme.font.size.sm,
              color: theme.colors.textSecondary, marginBottom: '8px',
            }}>
              Tipo de factura
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <TipoButton label="Cliente" active={tipo === 'cliente'} onClick={() => handleCambiarTipo('cliente')} />
              <TipoButton label="Fletero" active={tipo === 'fletero'} onClick={() => handleCambiarTipo('fletero')} />
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

      {/* ═══ Paso 2: viajes ═════════════════════════════════════════════════ */}
      {paso === 2 && tipo && actorElegido && (
        <div>
          <div style={{
            fontFamily: theme.font.family, fontSize: theme.font.size.sm,
            color: theme.colors.textSecondary, marginBottom: '16px',
          }}>
            Viajes pendientes de facturar de <strong style={{ color: theme.colors.textPrimary }}>{actorElegido.nombre}</strong>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
            <FormField label="Desde">
              <input style={inputStyle} type="date" value={desde} onChange={e => setDesde(e.target.value)} />
            </FormField>
            <FormField label="Hasta">
              <input style={inputStyle} type="date" value={hasta} onChange={e => setHasta(e.target.value)} />
            </FormField>
          </div>

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
                      disabled={viajesConFactura.length === 0}
                      aria-label="Seleccionar todos"
                      style={{ cursor: 'pointer', accentColor: theme.colors.primary, width: '16px', height: '16px' }}
                    />
                  </th>
                  <th style={thStyle}>N° Viaje</th>
                  <th style={thStyle}>Fecha</th>
                  {tipo === 'cliente' && <th style={thStyle}>Remito</th>}
                  {tipo === 'cliente' && <th style={thStyle}>Destinatario</th>}
                  {tipo === 'fletero' && <th style={thStyle}>Cliente</th>}
                  <th style={{ ...thStyle, textAlign: 'right' }}>Monto</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={tipo === 'cliente' ? 6 : 5} style={{ padding: '32px', textAlign: 'center', color: theme.colors.textMuted, fontFamily: theme.font.family, fontSize: theme.font.size.sm }}>
                      Cargando...
                    </td>
                  </tr>
                ) : viajesConFactura.length === 0 ? (
                  <tr>
                    <td colSpan={tipo === 'cliente' ? 6 : 5} style={{ padding: '32px', textAlign: 'center', color: theme.colors.textMuted, fontFamily: theme.font.family, fontSize: theme.font.size.sm }}>
                      No hay viajes pendientes de facturar en ese rango
                    </td>
                  </tr>
                ) : viajesConFactura.map((v, i) => {
                  const seleccionada = seleccionados.has(v.viajeId)
                  return (
                    <tr
                      key={v.viajeId}
                      style={{
                        borderBottom: i < viajesConFactura.length - 1 ? `1px solid ${theme.colors.borderLight}` : 'none',
                        background: seleccionada ? theme.colors.primaryLight : 'transparent',
                        cursor: 'pointer', transition: 'background 0.1s',
                      }}
                      onClick={() => toggleSeleccion(v.viajeId)}
                      onMouseEnter={e => { if (!seleccionada) e.currentTarget.style.background = theme.colors.surfaceHover }}
                      onMouseLeave={e => { e.currentTarget.style.background = seleccionada ? theme.colors.primaryLight : 'transparent' }}
                    >
                      <td style={{ padding: '12px 16px' }}>
                        <input
                          type="checkbox"
                          checked={seleccionada}
                          onChange={() => toggleSeleccion(v.viajeId)}
                          onClick={e => e.stopPropagation()}
                          style={{ cursor: 'pointer', accentColor: theme.colors.primary, width: '16px', height: '16px' }}
                        />
                      </td>
                      <td style={{ ...tdBaseStyle, fontVariantNumeric: 'tabular-nums', color: theme.colors.textPrimary }}>
                        #{v.viajeId}
                      </td>
                      <td style={{ ...tdBaseStyle, whiteSpace: 'nowrap' }}>{formatFecha(v.fecha)}</td>
                      {tipo === 'cliente' && <td style={tdBaseStyle}>{v.numeroRemito ?? '—'}</td>}
                      {tipo === 'cliente' && <td style={tdBaseStyle}>{v.destinatario ?? '—'}</td>}
                      {tipo === 'fletero' && <td style={{ ...tdBaseStyle, color: theme.colors.textPrimary }}>{mapaClientes[v.clienteId] ?? `Cliente ${v.clienteId}`}</td>}
                      <td style={{ ...tdBaseStyle, textAlign: 'right', fontVariantNumeric: 'tabular-nums', color: theme.colors.textPrimary }}>
                        {formatMoney(v.montoOriginal)}
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
              <Button onClick={handleAvanzarAPaso3} disabled={!puedeAvanzarPaso2}>
                Siguiente ({seleccionados.size}) →
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ═══ Paso 3: emisión ═════════════════════════════════════════════════ */}
      {paso === 3 && preview && tipo && (
        <div>
          {/* Resumen del actor */}
          <div style={{ marginBottom: '16px' }}>
            <div style={{
              fontFamily: theme.font.family,
              fontSize: theme.font.size.xs,
              fontWeight: theme.font.weight.semibold,
              color: theme.colors.textMuted,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              marginBottom: '4px',
            }}>
              Factura al {tipo === 'cliente' ? 'Cliente' : 'Fletero'}
            </div>
            <div style={{
              fontFamily: theme.font.family,
              fontSize: theme.font.size.lg,
              fontWeight: theme.font.weight.semibold,
              color: theme.colors.textPrimary,
            }}>
              {preview.actor.nombre}
            </div>
          </div>

          {/* Tabla editable */}
          <div style={{
            background: theme.colors.surface, borderRadius: theme.radius.lg,
            border: `1px solid ${theme.colors.border}`, overflow: 'hidden',
            maxHeight: '180px', overflowY: 'auto', marginBottom: '20px',
          }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${theme.colors.border}` }}>
                  <th style={thStyle}>N° Viaje</th>
                  <th style={thStyle}>Fecha</th>
                  {tipo === 'cliente' && <th style={thStyle}>Remito</th>}
                  {tipo === 'cliente' && <th style={thStyle}>Destinatario</th>}
                  {tipo === 'fletero' && <th style={thStyle}>Cliente</th>}
                  <th style={{ ...thStyle, textAlign: 'right' }}>Monto</th>
                </tr>
              </thead>
              <tbody>
                {viajesSeleccionados.map((v, i) => {
                  const valorActual = ajustesMonto.get(v.facturaId) ?? v.montoOriginal
                  const valorInput = montosString.get(v.facturaId) ?? String(valorActual)
                  const error = erroresMonto.get(v.facturaId)
                  const tieneAjuste = ajustesMonto.has(v.facturaId)

                  return (
                    <tr
                      key={v.facturaId}
                      style={{ borderBottom: i < viajesSeleccionados.length - 1 ? `1px solid ${theme.colors.borderLight}` : 'none' }}
                    >
                      <td style={{ ...tdBaseStyle, fontVariantNumeric: 'tabular-nums', color: theme.colors.textPrimary }}>
                        #{v.viajeId}
                      </td>
                      <td style={{ ...tdBaseStyle, whiteSpace: 'nowrap' }}>{formatFecha(v.fecha)}</td>
                      {tipo === 'cliente' && <td style={tdBaseStyle}>{v.numeroRemito ?? '—'}</td>}
                      {tipo === 'cliente' && <td style={tdBaseStyle}>{v.destinatario ?? '—'}</td>}
                      {tipo === 'fletero' && <td style={{ ...tdBaseStyle, color: theme.colors.textPrimary }}>{mapaClientes[v.clienteId] ?? `Cliente ${v.clienteId}`}</td>}
                      <td style={{ ...tdBaseStyle, textAlign: 'right' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '2px' }}>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={valorInput}
                            onChange={e => handleCambiarMontoInput(v.facturaId, e.target.value)}
                            onBlur={() => handleBlurMonto(v.facturaId, v.montoOriginal)}
                            style={{
                              ...montoInputStyle,
                              borderColor: error ? theme.colors.danger : theme.colors.border,
                            }}
                          />
                          {error && (
                            <span style={{
                              fontSize: theme.font.size.xs,
                              color: theme.colors.danger,
                              fontFamily: theme.font.family,
                            }}>
                              {error}
                            </span>
                          )}
                          {!error && tieneAjuste && (
                            <span style={{
                              fontSize: theme.font.size.xs,
                              color: theme.colors.textMuted,
                              fontFamily: theme.font.family,
                              fontVariantNumeric: 'tabular-nums',
                            }}>
                              orig: {formatMoney(v.montoOriginal)}
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Inputs de emisión */}
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '12px', marginBottom: '20px' }}>
            <FormField label="Número de factura" required>
              <input
                style={inputStyle}
                value={numero}
                onChange={e => setNumero(e.target.value)}
                placeholder="Ej: 0001-00001234"
                autoFocus
              />
            </FormField>
            <FormField label="Fecha emisión" required>
              <input
                style={inputStyle}
                type="date"
                value={fechaEmision}
                onChange={e => setFechaEmision(e.target.value)}
              />
            </FormField>
            <FormField label="Vencimiento" required>
              <input
                style={inputStyle}
                type="date"
                value={vencimiento}
                onChange={e => {
                  setVencimiento(e.target.value)
                  setVencimientoTocado(true)
                }}
              />
            </FormField>
          </div>

          {/* Toggle IVA */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: '10px',
            padding: '12px 16px',
            background: theme.colors.surfaceHover,
            borderRadius: theme.radius.md,
            marginBottom: '16px',
            cursor: 'pointer',
          }}
            onClick={() => setIncluyeIva(prev => !prev)}
          >
            <input
              type="checkbox"
              checked={incluyeIva}
              onChange={e => setIncluyeIva(e.target.checked)}
              onClick={e => e.stopPropagation()}
              style={{ cursor: 'pointer', accentColor: theme.colors.primary, width: '16px', height: '16px' }}
            />
            <span style={{
              fontFamily: theme.font.family,
              fontSize: theme.font.size.sm,
              color: theme.colors.textPrimary,
              fontWeight: theme.font.weight.medium,
            }}>
              Incluye IVA (21%)
            </span>
          </div>

          {/* Bloque de totales — recalculado en vivo */}
          <div style={{
            background: theme.colors.surface,
            border: `1px solid ${theme.colors.border}`,
            borderRadius: theme.radius.lg,
            boxShadow: theme.shadow.sm,
            overflow: 'hidden',
            marginBottom: '24px',
          }}>
            {incluyeIva && (
              <>
                <div style={{ ...rowTotalStyle, borderTop: 'none' }}>
                  <span>Subtotal</span>
                  <span style={{ fontVariantNumeric: 'tabular-nums', color: theme.colors.textPrimary }}>
                    {formatMoney(preview.subtotal)}
                  </span>
                </div>
                <div style={rowTotalStyle}>
                  <span>IVA (21%)</span>
                  <span style={{ fontVariantNumeric: 'tabular-nums', color: theme.colors.textPrimary }}>
                    {formatMoney(preview.iva)}
                  </span>
                </div>
              </>
            )}
            <div style={{
              ...rowTotalStyle,
              borderTop: incluyeIva ? `1px solid ${theme.colors.borderLight}` : 'none',
              background: theme.colors.sidebarBg,
              color: '#fff',
              fontWeight: theme.font.weight.semibold,
              fontSize: theme.font.size.base,
            }}>
              <span>Total</span>
              <span style={{ fontVariantNumeric: 'tabular-nums' }}>
                {formatMoney(preview.total)}
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <Button variant="secondary" onClick={handleVolverAPaso2} disabled={saving}>← Volver</Button>
            <div style={{ display: 'flex', gap: '8px' }}>
              <Button variant="secondary" onClick={handleClose} disabled={saving}>Cancelar</Button>
              <Button onClick={handleEmitir} loading={saving}>Emitir factura</Button>
            </div>
          </div>
        </div>
      )}
    </Modal>
  )
}