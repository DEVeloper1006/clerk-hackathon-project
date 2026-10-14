// TODO: validate on startup (e.g. with zod) and fail fast on missing values.

export interface Env {
  PORT: number;
  DATABASE_URL: string;
  REDIS_URL: string;
  JWT_SECRET: string;
  SECRETS_ENCRYPTION_KEY: string;
}

export const env: Env = {
  PORT: Number(process.env.PORT ?? 3001),
  DATABASE_URL: process.env.DATABASE_URL ?? '',
  REDIS_URL: process.env.REDIS_URL ?? '',
  JWT_SECRET: process.env.JWT_SECRET ?? '',
  SECRETS_ENCRYPTION_KEY: process.env.SECRETS_ENCRYPTION_KEY ?? '',
};
