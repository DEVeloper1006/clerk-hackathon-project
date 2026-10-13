import { drizzle } from 'drizzle-orm/node-postgres'
import pg from 'pg'
import { env } from './env.js'
import * as schema from '../db/schema.js'

// Pool connects lazily on first query, so the API boots without Postgres running.
export const pool = new pg.Pool({ connectionString: env.DATABASE_URL })

pool.on('error', (err) => {
  console.error('[db] pool error:', err.message)
})

export const db = drizzle(pool, { schema })
