// backend/src/utils/dynamicUpdate.ts

/**
 * Construye dinámicamente la cláusula SET de un UPDATE a partir de un DTO parcial.
 *
 * Reglas:
 * - Itera sobre las claves del fieldMap (lista blanca de columnas updateables),
 *   no sobre las claves del data. Cualquier campo extra del DTO se ignora.
 * - Si data[key] === undefined → la columna no se incluye en el SET (no se toca).
 * - Cualquier otro valor (incluyendo null, 0, '', false) → se incluye en el SET.
 *
 * @param data      Objeto parcial con los valores a actualizar.
 * @param fieldMap  Mapeo de claves del DTO (camelCase) a nombres de columna (snake_case).
 * @param startIndex Índice inicial de placeholders. Default 1 ($1, $2, ...).
 * @returns         { setClause, values, nextIndex } — listo para concatenar con el WHERE.
 *                  Si no hay campos para actualizar, setClause es '' y values es [].
 *
 * @example
 * const { setClause, values, nextIndex } = buildDynamicUpdate(
 *   { nombre: 'Juan', cbu: null, email: undefined },
 *   { nombre: 'nombre', cbu: 'cbu', email: 'email' }
 * );
 * // setClause: "nombre = $1, cbu = $2"
 * // values: ['Juan', null]
 * // nextIndex: 3
 *
 * // Uso en repository:
 * const result = await executor.query(
 *   `UPDATE clientes SET ${setClause} WHERE id = $${nextIndex} RETURNING ${COLUMNS}`,
 *   [...values, id]
 * );
 */
export function buildDynamicUpdate<T extends object>(
  data: T,
  fieldMap: Partial<Record<keyof T, string>>,
  startIndex: number = 1
): { setClause: string; values: unknown[]; nextIndex: number } {
  const setParts: string[] = [];
  const values: unknown[] = [];
  let index = startIndex;

  for (const key of Object.keys(fieldMap) as Array<keyof T>) {
    const columnName = fieldMap[key];
    if (columnName === undefined) continue; // safety, no debería pasar

    const value = data[key];
    if (value === undefined) continue; // ausente → no tocar la columna

    setParts.push(`${columnName} = $${index}`);
    values.push(value);
    index++;
  }

  return {
    setClause: setParts.join(', '),
    values,
    nextIndex: index,
  };
}