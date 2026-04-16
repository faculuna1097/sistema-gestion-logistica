// src/utils/validation.ts

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