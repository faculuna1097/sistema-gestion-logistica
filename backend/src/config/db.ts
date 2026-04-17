// backend/src/config/db.ts
import { Pool } from 'pg'
import dotenv from 'dotenv'

dotenv.config()

// Validación temprana: si falta la variable crítica, el proceso muere acá
// con un mensaje claro, en lugar de fallar más tarde con un error críptico.
const DATABASE_URL = process.env.DATABASE_URL
if (!DATABASE_URL) {
  throw new Error('[db] DATABASE_URL no está definida en las variables de entorno')
}

export const pool = new Pool({
  connectionString: DATABASE_URL,
  // SSL explícito — requerido por Supabase tanto en local como en producción.
  // rejectUnauthorized: false es estándar para Supabase porque usa certificados
  // emitidos por su propia CA que pg no valida out-of-the-box.
  // La conexión sigue siendo encriptada por TLS.
  ssl: { rejectUnauthorized: false },
  // Límite conservador de conexiones simultáneas. Para un backend chico
  // con un solo cliente esto sobra y nos deja headroom en Supabase.
  max: 5,
})

// Si una conexión idle del pool falla (ej: timeout de Supabase), lo logueamos
// pero no crasheamos el proceso. Las nuevas requests abrirán nuevas conexiones.
pool.on('error', (err) => {
  console.error('[db] error inesperado en cliente idle del pool:', err.message)
})