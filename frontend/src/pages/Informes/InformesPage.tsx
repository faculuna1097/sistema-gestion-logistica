// frontend/src/pages/Informes/InformesPage.tsx

import { useState, useEffect } from 'react'
import { Button } from '../../components/Button'
import { Modal } from '../../components/Modal'
import { NuevoInformeModal } from './NuevoInformeModal'
import { HistorialInformes } from './HistorialInformes'
import { InformeDetailModal } from './InformeDetailModal'
import { useInformes } from '../../hooks/useInforme'
import { useInformeResuelto } from '../../hooks/useInformeResuelto'
import { exportarInformePDF } from '../../utils/exportarInformePDF'
import { theme } from '../../theme'
import type { Informe } from '../../types'

export function InformesPage() {
  const [modalOpen, setModalOpen] = useState(false)
  const [detailTarget, setDetailTarget] = useState<Informe | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Informe | null>(null)
  const [exportTarget, setExportTarget] = useState<Informe | null>(null)
  const [deleting, setDeleting] = useState(false)

  const { informes, loading, error, crearInforme, eliminarInforme } = useInformes()
  const handleVerInforme = (informe: Informe) => {
    setDetailTarget(informe)
  }

  const handleConfirmarEliminar = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await eliminarInforme(deleteTarget.id)
      setDeleteTarget(null)
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Error al eliminar el informe')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div style={{ padding: '32px' }}>

      {/* Header: grid 3 columnas igual que las otras páginas */}
      <div style={{
        display: 'grid', gridTemplateColumns: '1fr auto 1fr',
        alignItems: 'center', marginBottom: '32px',
      }}>
        <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
          <Button onClick={() => setModalOpen(true)}>+ Nuevo informe</Button>
        </div>
        <div />
        <div />
      </div>

      <HistorialInformes
        informes={informes}
        loading={loading}
        error={error}
        onVerInforme={handleVerInforme}
        onExportarInforme={setExportTarget}
        onEliminarInforme={setDeleteTarget}
      />

      {/* Componente invisible que dispara la exportación cuando hay target */}
      <InformeExporter
        informe={exportTarget}
        onDone={() => setExportTarget(null)}
      />

      <NuevoInformeModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onGuardar={crearInforme}
      />

      <InformeDetailModal
        informe={detailTarget}
        onClose={() => setDetailTarget(null)}
      />
      
      {/* Modal: confirmar eliminación */}
      <Modal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Eliminar informe" width="400px">
        <div style={{
          fontFamily: theme.font.family,
          fontSize: theme.font.size.base,
          color: theme.colors.textSecondary,
          marginBottom: '20px',
          lineHeight: 1.6,
        }}>
          ¿Eliminar el informe{' '}
          <strong style={{ color: theme.colors.textPrimary }}>{deleteTarget?.codigo}</strong>?
          {' '}Esta acción no se puede deshacer.
        </div>
        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
          <Button variant="secondary" onClick={() => setDeleteTarget(null)}>Cancelar</Button>
          <Button variant="danger" onClick={handleConfirmarEliminar} loading={deleting}>Eliminar</Button>
        </div>
      </Modal>
    </div>
  )
}


// ─── Componente auxiliar: dispara la exportación a PDF ────────────────────
// Usa el hook useInformeResuelto (que requiere vivir en un componente) para
// armar el InformeData cuando `informe` cambia a un valor no nulo.
// Cuando los datos están listos, genera el PDF y avisa al padre via onDone.

interface InformeExporterProps {
  informe: Informe | null
  onDone: () => void
}

function InformeExporter({ informe, onDone }: InformeExporterProps) {
  const { informeData, cuit, ready, error } = useInformeResuelto(informe)

  useEffect(() => {
    if (!informe) return
    if (!ready) return

    if (error) {
      alert(`Error al preparar el informe: ${error}`)
      onDone()
      return
    }

    if (informeData) {
      try {
        exportarInformePDF({
          informeData,
          codigo: informe.codigo,
          cuit,
          fechaEmision: informe.createdAt,
        })
      } catch (err) {
        alert(`Error al generar el PDF: ${err instanceof Error ? err.message : 'Error desconocido'}`)
      } finally {
        onDone()
      }
    }
  }, [informe, informeData, cuit, ready, error, onDone])

  return null
}