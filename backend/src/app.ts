// backend/src/app.ts

import express from 'express'
import dotenv from 'dotenv'
import cors from 'cors'
import { pool } from './config/db'
import clientesRouter from './routes/clientes.routes'
import fleterosRouter from './routes/fleteros.routes'
import viajesRouter from './routes/viajes.routes'
import facturasRouter from './routes/facturas.routes'
import vencimientosRouter from './routes/vencimientos.routes'
import informesRouter from './routes/informes.routes'

dotenv.config()

const app = express()

// CORS — los orígenes permitidos vienen de la variable CORS_ORIGINS,
// separados por coma. Esto permite tener una config distinta en local
// (solo localhost) y en producción (localhost + dominio de Vercel)
// sin tocar código.
//
// Ejemplo en .env local:    CORS_ORIGINS=http://localhost:5173
// Ejemplo en Render:        CORS_ORIGINS=http://localhost:5173,https://mi-app.vercel.app
const allowedOrigins = (process.env.CORS_ORIGINS || 'http://localhost:5173')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean)

app.use(
  cors({
    origin: (origin, callback) => {
      // Requests sin Origin header (Postman, curl, healthchecks de Render)
      // son permitidas. El Origin header solo lo manda el navegador.
      if (!origin) return callback(null, true)

      if (allowedOrigins.includes(origin)) {
        return callback(null, true)
      }

      console.warn(`[cors] origen bloqueado: ${origin}`)
      return callback(new Error(`Origen no permitido por CORS: ${origin}`))
    },
  })
)

app.use(express.json())

const PORT = process.env.PORT || 3000

app.use('/clientes', clientesRouter)
app.use('/fleteros', fleterosRouter)
app.use('/viajes', viajesRouter)
app.use('/facturas', facturasRouter)
app.use('/vencimientos', vencimientosRouter)
app.use('/informes', informesRouter)

app.get('/health', async (req, res) => {
  try {
    await pool.query('SELECT 1')
    res.json({ status: 'ok', db: 'conectada' })
  } catch (err) {
    res.status(500).json({ status: 'error', db: 'sin conexión' })
  }
})

app.listen(PORT, () => {
  console.log(`[app] servidor corriendo en puerto ${PORT}`)
  console.log(`[app] orígenes CORS permitidos: ${allowedOrigins.join(', ')}`)
})