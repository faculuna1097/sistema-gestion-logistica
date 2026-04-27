// frontend/src/utils/validation.ts

interface ContactFormFields {
  nombre: string
  email: string
  telefono: string
  cbu: string
  cuit: string
}

export type ContactFormErrors = Partial<Record<keyof ContactFormFields, string>>

export function validateContactForm(form: ContactFormFields): ContactFormErrors {
  const errors: ContactFormErrors = {}

  if (!form.nombre.trim()) {
    errors.nombre = 'El nombre es requerido'
  }

  if (form.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
    errors.email = 'Ingresá un email válido'
  }

  if (form.telefono.trim() && !/^\d{10}$/.test(form.telefono.trim())) {
    errors.telefono = 'Ingresá un teléfono válido (10 dígitos)'
  }

  if (form.cbu.trim() && !/^\d{22}$/.test(form.cbu.trim())) {
    errors.cbu = 'Ingresá un CBU válido (22 dígitos)'
  }

  if (form.cuit.trim() && !/^\d{11}$/.test(form.cuit.trim())) {
    errors.cuit = 'Ingresá un CUIT válido (11 dígitos)'
  }

  return errors
}

export function hasErrors(errors: ContactFormErrors): boolean {
  return Object.keys(errors).length > 0
}

// ─── Validación de formulario de viajes ───────────────────────────────────────

export interface ViajeFormFields {
  fecha: string
  clienteId: string
  valorCliente: string
  fleteroId: string
  costoFletero: string
}

export type ViajeFormErrors = Partial<Record<keyof ViajeFormFields, string>>

/**
 * Valida el formulario de creación/edición de viaje.
 * puedeEditarCobranza y puedeEditarPagoFletero controlan qué campos
 * son obligatorios según el estado de las facturas asociadas.
 */
export function validateViajeForm(
  form: ViajeFormFields,
  puedeEditarCobranza: boolean,
  puedeEditarPagoFletero: boolean
): ViajeFormErrors {
  const errors: ViajeFormErrors = {}

  if (!form.fecha) {
    errors.fecha = 'La fecha es requerida'
  }

  if (puedeEditarCobranza) {
    if (!form.clienteId) {
      errors.clienteId = 'Seleccioná un cliente'
    }
    if (form.valorCliente === '' || Number(form.valorCliente) < 0) {
      errors.valorCliente = 'Ingresá el valor del viaje'
    }
  }

  if (puedeEditarPagoFletero) {
    if (!form.fleteroId) {
      errors.fleteroId = 'Seleccioná un fletero'
    }
    if (form.costoFletero === '' || Number(form.costoFletero) < 0) {
      errors.costoFletero = 'Ingresá el costo del fletero'
    }
  }

  return errors
}