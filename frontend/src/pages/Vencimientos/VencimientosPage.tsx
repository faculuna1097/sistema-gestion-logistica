// src/pages/Vencimientos/VencimientosPage.tsx

import { useVencimientos } from '../../hooks/useVencimientos';
import type { VencimientoRow, SemanaGroup } from '../../hooks/useVencimientos';


const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

function formatMes(mes: string): string {
  const [anio, mesNum] = mes.split('-').map(Number);
  return `${MESES[mesNum - 1]} ${anio}`;
}

function formatMonto(monto: number): string {
  return monto.toLocaleString('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 });
}

const COLS = ['Fecha viaje', 'Titular', 'N° Factura', 'Vencimiento', 'Monto'];

// Fila individual de la tabla
function FilaVencimiento({ fila }: { fila: VencimientoRow }) {
  return (
    <tr style={{ borderBottom: '1px solid #e8e8e4' }}>
      <td style={tdStyle}>{fila.fechaViaje   ?? '—'}</td>
      <td style={tdStyle}>{fila.titular}</td>
      <td style={tdStyle}>{fila.numero       ?? '—'}</td>
      <td style={tdStyle}>
        <span>{fila.vencimiento}</span>
        {(() => {
            const dias = diasHastaVencimiento(fila.vencimiento);
            const color = dias <= 5 ? '#c0392b' : '#888';
            const label = dias < 0 ? `hace ${Math.abs(dias)}d` : `en ${dias}d`;
            return (
            <span style={{ marginLeft: 8, fontSize: 11, fontWeight: 600, color }}>
                {label}
            </span>
            );
        })()}
        </td>
      <td style={{ ...tdStyle, textAlign: 'right' }}>{formatMonto(fila.monto)}</td>
    </tr>
  );
}

function diasHastaVencimiento(vencimiento: string): number {
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const vence = new Date(vencimiento + 'T12:00:00');
  return Math.round((vence.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24));
}

// Fila de subtotal de semana
function FilaSubtotal({ label, subtotal }: { label: string; subtotal: number }) {
  return (
    <tr style={{ backgroundColor: '#f0f0ec' }}>
      <td colSpan={4} style={{ ...tdStyle, fontWeight: 600, color: '#555' }}>{label} — Subtotal</td>
      <td style={{ ...tdStyle, textAlign: 'right', fontWeight: 600 }}>{formatMonto(subtotal)}</td>
    </tr>
  );
}

// Sección de vencidas (aparece arriba de cada tabla si hay filas)
function SeccionVencidas({ filas }: { filas: VencimientoRow[] }) {
  if (filas.length === 0) return null;
  return (
    <>
      <tr>
        <td colSpan={5} style={{ padding: '6px 12px', backgroundColor: '#fff0f0', color: '#c0392b', fontWeight: 700, fontSize: 12, letterSpacing: '0.05em' }}>
          ⚠ VENCIDAS
        </td>
      </tr>
      {filas.map(f => (
        <tr key={f.id} style={{ backgroundColor: '#fff5f5', borderBottom: '1px solid #f5c0c0' }}>
          <td style={tdStyle}>{f.fechaViaje   ?? '—'}</td>
          <td style={tdStyle}>{f.titular}</td>
          <td style={tdStyle}>{f.numero       ?? '—'}</td>
          <td style={{ ...tdStyle, color: '#c0392b', fontWeight: 600 }}>{f.vencimiento}</td>
          <td style={{ ...tdStyle, textAlign: 'right', color: '#c0392b', fontWeight: 600 }}>{formatMonto(f.monto)}</td>
        </tr>
      ))}
      
      <tr style={{ backgroundColor: '#fde8e8' }}>
        <td colSpan={4} style={{ ...tdStyle, fontWeight: 600, color: '#c0392b' }}>Subtotal vencidas</td>
        <td style={{ ...tdStyle, textAlign: 'right', fontWeight: 600, color: '#c0392b' }}>
          {formatMonto(filas.reduce((acc, f) => acc + f.monto, 0))}
        </td>
      </tr>
    </>
  );
}

// Tabla completa (cobranza o pagos)
function TablaVencimientos({
  titulo,
  vencidas,
  semanas,
  total,
}: {
  titulo: string;
  vencidas: VencimientoRow[];
  semanas: SemanaGroup[];
  total: number;
}) {
  const hayDatos = vencidas.length > 0 || semanas.length > 0;

  return (
    <div style={{ flex: 1, minWidth: 0 }}>
      <h2 style={{ fontSize: 16, fontWeight: 700, color: '#1a7a4a', marginBottom: 12 }}>
        {titulo}
      </h2>
      <table style={{ width: '100%', borderCollapse: 'collapse', backgroundColor: '#fff', borderRadius: 8, overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.07)' }}>
        <thead>
          <tr style={{ backgroundColor: '#1a7a4a' }}>
            {COLS.map(col => (
              <th key={col} style={thStyle}>{col}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          <SeccionVencidas filas={vencidas} />

          {!hayDatos && (
            <tr>
              <td colSpan={5} style={{ ...tdStyle, textAlign: 'center', color: '#aaa', padding: '24px 0' }}>
                Sin vencimientos
              </td>
            </tr>
          )}

          {semanas.map(semana => (
            <>
              {semana.filas.map(f => <FilaVencimiento key={f.id} fila={f} />)}
              <FilaSubtotal key={`sub-${semana.label}`} label={semana.label} subtotal={semana.subtotal} />
            </>
          ))}

          {hayDatos && (
            <tr style={{ backgroundColor: '#0d2b1a' }}>
              <td colSpan={4} style={{ ...tdStyle, fontWeight: 700, color: '#fff' }}>Total del mes</td>
              <td style={{ ...tdStyle, textAlign: 'right', fontWeight: 700, color: '#fff' }}>{formatMonto(total)}</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

// Page principal
export default function VencimientosPage() {
  const {
    mes,
    navegarMes,
    loading,
    error,
    vencidasCobranza,
    vencidasPagos,
    semanasCobranza,
    semanasPagos,
    totalCobranza,
    totalPagos,
  } = useVencimientos();

  return (
    <div style={{ padding: '32px 24px' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: '#1a1a1a', margin: 0 }}>Vencimientos</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={() => navegarMes(-1)} style={navBtnStyle}>←</button>
          <span style={{ fontSize: 16, fontWeight: 600, minWidth: 160, textAlign: 'center' }}>
            {formatMes(mes)}
          </span>
          <button onClick={() => navegarMes(1)} style={navBtnStyle}>→</button>
        </div>
      </div>

      {loading && <p style={{ color: '#888' }}>Cargando...</p>}
      {error   && <p style={{ color: '#c0392b' }}>{error}</p>}

      {!loading && !error && (
        <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start' }}>
          <TablaVencimientos
            titulo="Cobranza"
            vencidas={vencidasCobranza}
            semanas={semanasCobranza}
            total={totalCobranza}
          />
          <TablaVencimientos
            titulo="Pagos"
            vencidas={vencidasPagos}
            semanas={semanasPagos}
            total={totalPagos}
          />
        </div>
      )}
    </div>
  );
}

// Estilos compartidos
const thStyle: React.CSSProperties = {
  padding: '10px 12px',
  textAlign: 'left',
  fontSize: 13,
  fontWeight: 600,
  color: '#fff',
};

const tdStyle: React.CSSProperties = {
  padding: '9px 12px',
  fontSize: 13,
  color: '#2d2d2d',
};

const navBtnStyle: React.CSSProperties = {
  background: 'none',
  border: '1px solid #ccc',
  borderRadius: 6,
  padding: '4px 12px',
  cursor: 'pointer',
  fontSize: 16,
  color: '#333',
};