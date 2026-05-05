import type { Factura } from '../types'

export function getNombreTitular(
  f: Factura,
  clienteMap: Record<number, string>,
  fleteroMap: Record<number, string>
): string {
  if (f.clienteId) return clienteMap[f.clienteId] ?? `Cliente ${f.clienteId}`
  if (f.fleteroId) return fleteroMap[f.fleteroId] ?? `Fletero ${f.fleteroId}`
  return '—'
}

export function agruparFacturasPorNumero(
  facturas: Factura[],
  getNombre: (f: Factura) => string
): Array<{
  numero: string
  items: Factura[]
  titular: string
  tipo: Factura['tipo']
  montoTotal: number
  vencimiento: string | null
  count: number
}> {
  const map = new Map<string, Factura[]>()
  for (const f of facturas) {
    const key = f.numero ?? `__${f.id}`
    if (!map.has(key)) map.set(key, [])
    map.get(key)!.push(f)
  }
  return Array.from(map.entries()).map(([numero, items]) => ({
    numero,
    items,
    titular: getNombre(items[0]),
    tipo: items[0].tipo,
    montoTotal: items.reduce((sum, f) => sum + f.monto, 0),
    vencimiento: items[0].vencimiento,
    count: items.length,
  }))
}
