// frontend/src/pages/Facturas/FacturaDetailModal.tsx

import { Modal } from '../../components/Modal'
import { Button } from '../../components/Button'
import { FacturaPreview } from './FacturaPreview'
import type { FacturaPreviewData } from '../../hooks/useFacturaWizard'

interface Props {
  preview: FacturaPreviewData | null   // null = modal cerrado
  numero: string | null
  fechaEmision: string | null
  vencimiento: string | null
  cuit: string | null
  onClose: () => void
}

export function FacturaDetailModal({
  preview,
  numero,
  fechaEmision,
  vencimiento,
  cuit,
  onClose,
}: Props) {
  return (
    <Modal
      open={preview !== null}
      onClose={onClose}
      title={numero ? `Factura ${numero}` : 'Factura'}
      width="920px"
    >
      {preview && (
        <FacturaPreview
          factura={preview}
          numero={numero}
          fechaEmision={fechaEmision}
          vencimiento={vencimiento}
          cuit={cuit}
        />
      )}

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '24px' }}>
        <Button variant="secondary" onClick={onClose}>Cerrar</Button>
      </div>
    </Modal>
  )
}