/**
 * Inserts a demo tenant, its four agents, and sample transactions.
 * Usage: pnpm seed:demo   (requires DATABASE_URL and a migrated schema)
 */
import { drizzle } from 'drizzle-orm/node-postgres'
import pg from 'pg'
import { agents, tenants, transactions } from '../../packages/api/src/db/schema.js'

const url = process.env.DATABASE_URL
if (!url) throw new Error('DATABASE_URL is not set')

const pool = new pg.Pool({ connectionString: url })
const db = drizzle(pool)

const [tenant] = await db
  .insert(tenants)
  .values({ name: 'Demo Coffee Roasters', industry: 'ecommerce', paypalConnected: true })
  .returning()
if (!tenant) throw new Error('Failed to insert demo tenant')

await db.insert(agents).values(
  (['sentinel', 'treasury', 'commerce', 'growth'] as const).map((type) => ({
    tenantId: tenant.id,
    type,
  })),
)

const statuses = ['completed', 'completed', 'completed', 'refunded', 'disputed'] as const
const now = Date.now()
await db.insert(transactions).values(
  Array.from({ length: 25 }, (_, i) => ({
    tenantId: tenant.id,
    paypalOrderId: `DEMO-${String(i + 1).padStart(4, '0')}`,
    amount: (Math.round((15 + Math.random() * 300) * 100) / 100).toFixed(2),
    currency: 'USD',
    status: statuses[i % statuses.length],
    riskScore: Math.floor(Math.random() * 100),
    createdAt: new Date(now - i * 6 * 60 * 60 * 1000),
  })),
)

console.log(`Seeded demo tenant ${tenant.id}`)
console.log(`Next: pnpm seed:elastic ${tenant.id}`)
await pool.end()
