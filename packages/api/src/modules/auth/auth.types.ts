export interface JwtUser {
  userId: string
  tenantId: string
  email: string
}

declare module '@fastify/jwt' {
  interface FastifyJWT {
    payload: JwtUser
    user: JwtUser
  }
}
