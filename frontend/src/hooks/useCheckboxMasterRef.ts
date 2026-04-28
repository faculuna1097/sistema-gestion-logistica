// frontend/src/hooks/useCheckboxMasterRef.ts

import { useRef, useEffect } from 'react'

/**
 * Maneja el estado visual "indeterminate" de un checkbox master.
 * Retorna un ref para poner en el <input type="checkbox"> master.
 *
 * @param indeterminate - true cuando algunos (pero no todos) los items están seleccionados.
 */
export function useCheckboxMasterRef(indeterminate: boolean) {
  const ref = useRef<HTMLInputElement>(null)
  useEffect(() => {
    if (ref.current) ref.current.indeterminate = indeterminate
  }, [indeterminate])
  return ref
}