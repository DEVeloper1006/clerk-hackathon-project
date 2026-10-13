import { config } from 'dotenv'
import { z } from 'zod'

// Load the monorepo-root .env when present. Real env vars (Render, Astropods) take precedence.
config({ path: new URL('../../../../.env', import.meta.url).pathname })

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  DATABASE_URL: z.string().url(),
  REDIS_URL: z.string().url(),
  ELASTICSEARCH_URL: z.string().url(),

  LLM_PROVIDER: z.enum(['openai', 'anthropic']).default('openai'),
  OPENAI_API_KEY: z.string().optional(),
  OPENAI_MODEL: z.string().default('gpt-4o-mini'),

  CHANNEL3_API_KEY: z.string().optional(),
  KERNEL_API_KEY: z.string().optional(),

  RENDER_API_KEY: z.string().optional(),
  /** Render workspace (owner) id — required by Render when creating services. */
  RENDER_OWNER_ID: z.string().optional(),

  /** Comma-separated subset of agents to run in this process (e.g. "sentinel"). Empty = all. */
  AGENTS: z.string().optional(),
})

export type Env = z.infer<typeof envSchema>

const parsed = envSchema.safeParse(process.env)

if (!parsed.success) {
  console.error('Invalid environment variables:', parsed.error.flatten().fieldErrors)
  process.exit(1)
}

export const env: Env = parsed.data
