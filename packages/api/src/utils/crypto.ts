import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto'
import { env } from '../config/env.js'

const ALGORITHM = 'aes-256-gcm'
const IV_BYTES = 12

export class SecretsNotConfiguredError extends Error {
  constructor() {
    super('SECRETS_ENCRYPTION_KEY is not configured')
    this.name = 'SecretsNotConfiguredError'
  }
}

function key(): Buffer {
  if (!env.SECRETS_ENCRYPTION_KEY) throw new SecretsNotConfiguredError()
  return Buffer.from(env.SECRETS_ENCRYPTION_KEY, 'base64')
}

export function isSecretsConfigured(): boolean {
  return Boolean(env.SECRETS_ENCRYPTION_KEY)
}

/** AES-256-GCM. Output: base64(iv).base64(authTag).base64(ciphertext). */
export function encryptSecret(plaintext: string): string {
  const iv = randomBytes(IV_BYTES)
  const cipher = createCipheriv(ALGORITHM, key(), iv)
  const ciphertext = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()])
  return [iv, cipher.getAuthTag(), ciphertext].map((b) => b.toString('base64')).join('.')
}

export function decryptSecret(encoded: string): string {
  const [iv, tag, ciphertext] = encoded.split('.').map((part) => Buffer.from(part, 'base64'))
  if (!iv || !tag || !ciphertext) throw new Error('Malformed encrypted secret')
  const decipher = createDecipheriv(ALGORITHM, key(), iv)
  decipher.setAuthTag(tag)
  return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString('utf8')
}
