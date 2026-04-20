// src/hooks/useVencimientos.ts

import { useState, useEffect, useMemo } from 'react';
import { api } from '../services/api';

export interface VencimientoRow {
  id: number;
  tipo: 'cobranza' | 'pago_fletero';
  titular: string;
  numero: string | null;
  monto: number;
  vencimiento: string;
}

export interface SemanaGroup {
  label: string;
  filas: VencimientoRow[];
  subtotal: number;
}

interface VencimientosData {
  vencidas: VencimientoRow[];
  delMes: VencimientoRow[];
}

function getMesActual(): string {
  return new Date().toISOString().slice(0, 7);
}

// Agrupa un array de filas en semanas fijas: 1-7, 8-14, 15-21, 22-fin
function agruparPorSemana(filas: VencimientoRow[]): SemanaGroup[] {
  const semanas = [
    { label: 'Semana 1 (1 – 7)',   desde: 1,  hasta: 7  },
    { label: 'Semana 2 (8 – 14)',  desde: 8,  hasta: 14 },
    { label: 'Semana 3 (15 – 21)', desde: 15, hasta: 21 },
    { label: 'Semana 4 (22 – 31)', desde: 22, hasta: 31 },
  ];

  return semanas
    .map(({ label, desde, hasta }) => {
      const filasDeEstaSemana = filas.filter(f => {
        const dia = new Date(f.vencimiento + 'T12:00:00').getDate();
        return dia >= desde && dia <= hasta;
      });
      const subtotal = filasDeEstaSemana.reduce((acc, f) => acc + f.monto, 0);
      return { label, filas: filasDeEstaSemana, subtotal };
    })
    .filter(s => s.filas.length > 0); // omitir semanas vacías
}

export function useVencimientos() {
  const [mes, setMes] = useState<string>(getMesActual());
  const [data, setData] = useState<VencimientosData>({ vencidas: [], delMes: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    api.get<VencimientosData>(`/vencimientos?mes=${mes}`)
      .then(res => setData(res))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [mes]);

  function navegarMes(direccion: -1 | 1) {
    const [anio, mesNum] = mes.split('-').map(Number);
    const fecha = new Date(anio, mesNum - 1 + direccion, 1);
    setMes(fecha.toISOString().slice(0, 7));
  }

  // Separar por tipo
  const vencidasCobranza  = useMemo(() => data.vencidas.filter(f => f.tipo === 'cobranza'),    [data.vencidas]);
  const vencidasPagos     = useMemo(() => data.vencidas.filter(f => f.tipo === 'pago_fletero'), [data.vencidas]);
  const cobranzaDelMes    = useMemo(() => data.delMes.filter(f => f.tipo === 'cobranza'),       [data.delMes]);
  const pagosDelMes       = useMemo(() => data.delMes.filter(f => f.tipo === 'pago_fletero'),   [data.delMes]);

  // Agrupar por semana
  const semanasCobranza = useMemo(() => agruparPorSemana(cobranzaDelMes), [cobranzaDelMes]);
  const semanasPagos    = useMemo(() => agruparPorSemana(pagosDelMes),    [pagosDelMes]);

  // Totales del mes
  const totalCobranza = useMemo(() => cobranzaDelMes.reduce((acc, f) => acc + f.monto, 0), [cobranzaDelMes]);
  const totalPagos    = useMemo(() => pagosDelMes.reduce((acc, f) => acc + f.monto, 0),    [pagosDelMes]);

  return {
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
  };
}