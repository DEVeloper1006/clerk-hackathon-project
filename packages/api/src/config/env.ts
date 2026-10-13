import { config } from 'dotenv'
import { z } from 'zod'

// Load the monorepo-root .env when present. Real env vars (Render, CI) take precedence.
config({ path: new URL('../../../../.env', import.meta.url).pathname })

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().int().positive().default(3001),
  CORS_ORIGIN: z.string().default('http://localhost:5173'),

  DATABASE_URL: z.string().url(),
  REDIS_URL: z.string().url(),
  ELASTICSEARCH_URL: z.string().url(),

  PAYPAL_CLIENT_ID: z.string().optional(),
  PAYPAL_CLIENT_SECRET: z.string().optional(),
  PAYPAL_API_BASE: z.string().url().default('https://api-m.sandbox.paypal.com'),
  PAYPAL_REDIRECT_URI: z.string().url().optional(),

  OPENAI_API_KEY: z.string().optional(),
  JWT_SECRET: z.string().min(16),

  CHANNEL3_API_KEY: z.string().optional(),
  KERNEL_API_KEY: z.string().optional(),
  ZAPIER_WEBHOOK_URL: z.string().url().optional().or(z.literal('')),

  RENDER_API_KEY: z.string().optional(),
  /** Render workspace (owner) id — required by Render when creating services. */
  RENDER_OWNER_ID: z.string().optional(),
  /** 32-byte key, base64-encoded, for AES-256-GCM encryption of tenant secrets. */
  SECRETS_ENCRYPTION_KEY: z.preprocess(
    (v) => (v === '' ? undefined : v),
    z
      .string()
      .refine((v) => Buffer.from(v, 'base64').length === 32, 'Must be 32 bytes, base64-encoded')
      .optional(),
  ),
})

export type Env = z.infer<typeof envSchema>

const parsed = envSchema.safeParse(process.env)

if (!parsed.success) {
  console.error('Invalid environment variables:', parsed.error.flatten().fieldErrors)
  process.exit(1)
}

export const env: Env = parsed.data
