import { env } from '../config/env.js'

export interface ProductResult {
  id: string
  title: string
  price: number
  currency: string
  url: string
}

export async function searchProducts(tenantId: string, query: string): Promise<ProductResult[]> {
  // TODO: implement — install @channel3/sdk and query the product catalog with env.CHANNEL3_API_KEY.
  if (!env.CHANNEL3_API_KEY) return []
  void tenantId
  void query
  return []
}
