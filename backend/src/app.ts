import express from 'express'
import dotenv from 'dotenv'
import { pool } from './config/db'
import clientesRouter from './routes/clientes.routes'
import fleterosRouter from './routes/fleteros.routes'

dotenv.config()

const app = express()
app.use(express.json())

const PORT = process.env.PORT || 3000

app.use('/clientes', clientesRouter)
app.use('/fleteros', fleterosRouter)


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
})