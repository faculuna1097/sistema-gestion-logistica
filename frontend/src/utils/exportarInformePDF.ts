// frontend/src/utils/exportarInformePDF.ts

import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import type { InformeData, InformeClienteFila, InformeFleteroFila } from '../types'

// ─── Datos de la empresa emisora ─────────────────────────────────────────────
// TODO: reemplazar con los datos reales cuando el cliente los pase.
// Alternativa futura: migrar a variables de entorno (VITE_EMPRESA_RAZON_SOCIAL, etc.)
// si aparece la necesidad de configurar sin tocar código.

const EMPRESA = {
  razonSocial: 'Logística',
  cuit: '',
}

// ─── Color primario en formato [R, G, B] (jsPDF no acepta hex) ───────────────
const COLOR_PRIMARIO: [number, number, number] = [26, 122, 74]       // #1a7a4a
const COLOR_TEXTO: [number, number, number] = [26, 31, 28]           // theme.textPrimary
const COLOR_TEXTO_SECUNDARIO: [number, number, number] = [90, 107, 98] // theme.textSecondary
const COLOR_TEXTO_MUTED: [number, number, number] = [143, 163, 152]  // theme.textMuted
const COLOR_BORDE: [number, number, number] = [228, 231, 225]        // theme.border
const COLOR_FONDO_ALT: [number, number, number] = [249, 250, 247]    // theme.surfaceHover

// ─── Helpers de formato ──────────────────────────────────────────────────────

function formatFecha(fecha: string): string {
  return new Date(fecha + 'T00:00:00').toLocaleDateString('es-AR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
  })
}

function formatFechaISO(iso: string): string {
  return new Date(iso).toLocaleDateString('es-AR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
  })
}

function formatMoney(n: number): string {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency', currency: 'ARS', maximumFractionDigits: 2,
  }).format(n)
}

// ─── Parámetros ──────────────────────────────────────────────────────────────

interface ExportarInformePDFParams {
  informeData: InformeData
  codigo: string
  cuit: string | null
  fechaEmision: string           // ISO string del createdAt
}

// ─── Función principal ───────────────────────────────────────────────────────

export function exportarInformePDF({
  informeData,
  codigo,
  cuit,
  fechaEmision,
}: ExportarInformePDFParams): void {
  const doc = new jsPDF({
    unit: 'mm',
    format: 'a4',
    orientation: 'portrait',
  })

  const pageWidth = doc.internal.pageSize.getWidth()
  const marginX = 15
  let y = 20

  // ═══ ZONA 1 — Header superior ═════════════════════════════════════════════
  // Izquierda: razón social + CUIT del emisor
  // Derecha: código del informe + fecha de emisión

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(14)
  doc.setTextColor(...COLOR_TEXTO)
  doc.text(EMPRESA.razonSocial, marginX, y)

  if (EMPRESA.cuit) {
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.setTextColor(...COLOR_TEXTO_SECUNDARIO)
    doc.text(`CUIT ${EMPRESA.cuit}`, marginX, y + 5)
  }

  // Código del informe (alineado a la derecha, destacado)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(13)
  doc.setTextColor(...COLOR_PRIMARIO)
  doc.text(codigo, pageWidth - marginX, y, { align: 'right' })

  // Fecha de emisión debajo del código
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(...COLOR_TEXTO_SECUNDARIO)
  doc.text(`Emitido: ${formatFechaISO(fechaEmision)}`, pageWidth - marginX, y + 5, { align: 'right' })

  y += 14

  // Línea divisoria
  doc.setDrawColor(...COLOR_BORDE)
  doc.setLineWidth(0.3)
  doc.line(marginX, y, pageWidth - marginX, y)
  y += 10

  // ═══ ZONA 2 — Datos del destinatario ══════════════════════════════════════

  const tituloTipo = informeData.tipo === 'cliente' ? 'INFORME DE CLIENTE' : 'INFORME DE FLETERO'

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9)
  doc.setTextColor(...COLOR_TEXTO_MUTED)
  doc.text(tituloTipo, marginX, y)
  y += 6

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(16)
  doc.setTextColor(...COLOR_TEXTO)
  doc.text(informeData.actor.nombre, marginX, y)
  y += 6

  if (cuit) {
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    doc.setTextColor(...COLOR_TEXTO_SECUNDARIO)
    doc.text(`CUIT ${cuit}`, marginX, y)
    y += 5
  }

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.setTextColor(...COLOR_TEXTO_SECUNDARIO)
  const periodoTexto = `Período: ${formatFecha(informeData.rango.desde)} al ${formatFecha(informeData.rango.hasta)}`
  doc.text(periodoTexto, marginX, y)
  y += 10

  // ═══ ZONA 3 — Tabla de viajes ═════════════════════════════════════════════

  const esInformeCliente = informeData.tipo === 'cliente'

  const head = esInformeCliente
    ? [['Fecha', 'N° Viaje', 'Remito', 'Destinatario', 'Valor']]
    : [['Fecha', 'N° Viaje', 'Cliente', 'Valor']]

  const body = esInformeCliente
    ? (informeData.filas as InformeClienteFila[]).map(f => [
        formatFecha(f.fecha),
        `#${f.viajeId}`,
        f.numeroRemito ?? '—',
        f.destinatario ?? '—',
        formatMoney(f.valor),
      ])
    : (informeData.filas as InformeFleteroFila[]).map(f => [
        formatFecha(f.fecha),
        `#${f.viajeId}`,
        f.clienteNombre,
        formatMoney(f.valor),
      ])

  autoTable(doc, {
    startY: y,
    head,
    body,
    margin: { left: marginX, right: marginX },
    theme: 'plain',
    styles: {
      font: 'helvetica',
      fontSize: 9,
      cellPadding: 3,
      textColor: COLOR_TEXTO_SECUNDARIO,
      lineColor: COLOR_BORDE,
      lineWidth: 0.1,
    },
    headStyles: {
      fillColor: COLOR_FONDO_ALT,
      textColor: COLOR_TEXTO_MUTED,
      fontStyle: 'bold',
      fontSize: 8,
      lineWidth: { bottom: 0.3 },
      lineColor: COLOR_BORDE,
    },
    bodyStyles: {
      lineWidth: { bottom: 0.1 },
      lineColor: COLOR_BORDE,
    },
    columnStyles: esInformeCliente
      ? {
          0: { cellWidth: 22 },                                   // Fecha
          1: { cellWidth: 20 },                                   // N° Viaje
          2: { cellWidth: 30 },                                   // Remito
          3: { cellWidth: 'auto' },                               // Destinatario (elastic)
          4: { cellWidth: 32, halign: 'right' },                  // Valor
        }
      : {
          0: { cellWidth: 22 },                                   // Fecha
          1: { cellWidth: 20 },                                   // N° Viaje
          2: { cellWidth: 'auto' },                               // Cliente (elastic)
          3: { cellWidth: 32, halign: 'right' },                  // Valor
        },
  })

  // @ts-expect-error — lastAutoTable se asigna al doc por el plugin pero no está en los types
  y = doc.lastAutoTable.finalY + 10

  // ═══ ZONA 4 — Totales + pie ═══════════════════════════════════════════════

  // Recuadro de totales alineado a la derecha (ancho fijo de 80mm)
  const boxWidth = 80
  const boxX = pageWidth - marginX - boxWidth
  const rowHeight = 8

  // Subtotal
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.setTextColor(...COLOR_TEXTO_SECUNDARIO)
  doc.text('Subtotal', boxX + 3, y + 5)
  doc.setTextColor(...COLOR_TEXTO)
  doc.text(formatMoney(informeData.subtotal), boxX + boxWidth - 3, y + 5, { align: 'right' })

  // IVA
  y += rowHeight
  doc.setTextColor(...COLOR_TEXTO_SECUNDARIO)
  doc.text('IVA (21%)', boxX + 3, y + 5)
  doc.setTextColor(...COLOR_TEXTO)
  doc.text(formatMoney(informeData.iva), boxX + boxWidth - 3, y + 5, { align: 'right' })

  // Total (destacado)
  y += rowHeight
  doc.setFillColor(...COLOR_PRIMARIO)
  doc.rect(boxX, y, boxWidth, rowHeight, 'F')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.setTextColor(255, 255, 255)
  doc.text('Total', boxX + 3, y + 5.5)
  doc.text(formatMoney(informeData.total), boxX + boxWidth - 3, y + 5.5, { align: 'right' })

  // Pie de página
  const pageHeight = doc.internal.pageSize.getHeight()
  doc.setFont('helvetica', 'italic')
  doc.setFontSize(8)
  doc.setTextColor(...COLOR_TEXTO_MUTED)
  doc.text(
    'Documento informativo — No válido como factura',
    pageWidth / 2,
    pageHeight - 10,
    { align: 'center' }
  )

  // ═══ Descarga ═════════════════════════════════════════════════════════════

  doc.save(`${codigo}.pdf`)
}