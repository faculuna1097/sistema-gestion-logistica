// frontend/src/pages/Informes/InformeDetailModal.tsx

import { useInformeResuelto } from '../../hooks/useInformeResuelto'
import { Modal } from '../../components/Modal'
import { Button } from '../../components/Button'
import { InformePreview } from './InformePreview'
import { theme } from '../../theme'
import type { Informe } from '../../types'

interface Props {
  informe: Informe | null   // null = modal cerrado
  onClose: () => void
}

export function InformeDetailModal({ informe, onClose }: Props) {
  const { informeData, loading, error } = useInformeResuelto(informe)

  return (
    <Modal
      open={informe !== null}
      onClose={onClose}
      title={informe?.codigo ?? ''}
      width="920px"
    >
      {error && (
        <div style={{
          background: theme.colors.dangerLight,
          color: theme.colors.danger,
          padding: '12px 16px',
          borderRadius: theme.radius.md,
          marginBottom: '20px',
          fontFamily: theme.font.family,
          fontSize: theme.font.size.sm,
        }}>
          {error}
        </div>
      )}

      {loading && (
        <div style={{
          padding: '48px',
          textAlign: 'center',
          fontFamily: theme.font.family,
          color: theme.colors.textMuted,
        }}>
          Cargando informe...
        </div>
      )}

      {!loading && !error && informeData && (
        <InformePreview informe={informeData} />
      )}

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '24px' }}>
        <Button variant="secondary" onClick={onClose}>Cerrar</Button>
      </div>
    </Modal>
  )
}