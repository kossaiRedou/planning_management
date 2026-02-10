export type UserRole = "admin" | "agent"

export interface User {
  id: string
  email: string
  firstName: string
  lastName: string
  role: UserRole
  phone?: string
  certifications?: string[]
}

export interface Site {
  id: string
  name: string
  address: string
  contactName?: string
  contactPhone?: string
}

export interface Shift {
  id: string
  agentId: string
  siteId: string
  date: string // ISO date string YYYY-MM-DD
  startTime: string // HH:mm
  endTime: string // HH:mm
  notes?: string
  isNight: boolean
  isSunday: boolean
}

export interface Availability {
  id: string
  agentId: string
  date: string // ISO date string YYYY-MM-DD
  available: boolean
}

export interface ShiftWithDetails extends Shift {
  agent: User
  site: Site
}
