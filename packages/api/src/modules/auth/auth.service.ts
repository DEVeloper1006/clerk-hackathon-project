import type { JwtUser } from './auth.types.js'

export interface RegisterInput {
  email: string
  password: string
  businessName: string
}

export interface LoginInput {
  email: string
  password: string
}

export async function register(_input: RegisterInput): Promise<JwtUser | null> {
  // TODO: implement — create tenant + user rows, hash password, return JWT claims.
  return null
}

export async function login(_input: LoginInput): Promise<JwtUser | null> {
  // TODO: implement — look up user by email, verify password hash, return JWT claims.
  return null
}
