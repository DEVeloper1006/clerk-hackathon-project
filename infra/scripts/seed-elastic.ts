/**
 * Creates the tenant-prefixed Elasticsearch indices for one tenant.
 * Usage: pnpm seed:elastic <tenantId>   (defaults to DEMO_TENANT_ID)
 */
import { Client } from '@elastic/elasticsearch'

const url = process.env.ELASTICSEARCH_URL
if (!url) throw new Error('ELASTICSEARCH_URL is not set')

const tenantId = process.argv[2] ?? process.env.DEMO_TENANT_ID
if (!tenantId) throw new Error('Pass a tenantId argument or set DEMO_TENANT_ID')

const client = new Client({ node: url })

const mappings: Record<string, Record<string, Record<string, unknown>>> = {
  transactions: {
    tenantId: { type: 'keyword' },
    paypalOrderId: { type: 'keyword' },
    amount: { type: 'scaled_float', scaling_factor: 100 },
    currency: { type: 'keyword' },
    status: { type: 'keyword' },
    riskScore: { type: 'integer' },
    createdAt: { type: 'date' },
  },
  'agent-events': {
    tenantId: { type: 'keyword' },
    agentType: { type: 'keyword' },
    action: { type: 'keyword' },
    detail: { type: 'object' },
    timestamp: { type: 'date' },
  },
  'audit-log': {
    tenantId: { type: 'keyword' },
    actor: { type: 'keyword' },
    action: { type: 'keyword' },
    timestamp: { type: 'date' },
  },
}

for (const [suffix, properties] of Object.entries(mappings)) {
  const index = `${tenantId.toLowerCase()}-${suffix}`
  if (await client.indices.exists({ index })) {
    console.log(`exists  ${index}`)
    continue
  }
  // Cast: the ES client's property types are a large union; these literals are valid mappings.
  await client.indices.create({ index, mappings: { properties: properties as never } })
  console.log(`created ${index}`)
}
