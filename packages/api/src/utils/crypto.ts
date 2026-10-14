// AES-256-GCM encrypt/decrypt for tenant secrets (SECRETS_ENCRYPTION_KEY).
// Never return, log, or publish a decrypted value.

export function encrypt(_plaintext: string): string {
  throw new Error('Not implemented');
}

export function decrypt(_ciphertext: string): string {
  throw new Error('Not implemented');
}
