export type Industry = 'freelancer' | 'ecommerce' | 'agency' | 'other'

export interface Tenant {
  id: string
  name: string
  paypalConnected: boolean
  industry: Industry
  createdAt: string
}
