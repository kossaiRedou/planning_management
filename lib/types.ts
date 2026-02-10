export type UserRole = "owner" | "admin" | "agent"

export interface Organization {
  id: string
  name: string
  email: string
  phone?: string
  address?: string
  logo_url?: string
  stripe_customer_id?: string
  stripe_subscription_id?: string
  subscription_status: 'active' | 'trialing' | 'past_due' | 'canceled'
  subscription_plan: 'standard' | 'premium'
  trial_ends_at?: string
  created_at: string
  updated_at: string
}

export interface User {
  id: string
  organization_id: string
  email: string
  firstName: string
  lastName: string
  role: UserRole
  phone?: string
  certifications?: string[]
  created_at?: string
  updated_at?: string
}

export interface Site {
  id: string
  organization_id: string
  name: string
  address: string
  contactName?: string
  contactPhone?: string
  created_at?: string
  updated_at?: string
}

export interface Shift {
  id: string
  organization_id: string
  agentId: string
  siteId: string
  date: string // ISO date string YYYY-MM-DD
  startTime: string // HH:mm
  endTime: string // HH:mm
  notes?: string
  isNight: boolean
  isSunday: boolean
  status?: 'scheduled' | 'completed' | 'canceled'
  created_at?: string
  updated_at?: string
}

export interface Availability {
  id: string
  organization_id: string
  agentId: string
  date: string // ISO date string YYYY-MM-DD
  available: boolean
  created_at?: string
  updated_at?: string
}

export interface ShiftWithDetails extends Shift {
  agent: User
  site: Site
}
