import { createClient } from './supabase/client'
import { PLANS } from './stripe/server'
import type { Organization } from './types'

export async function checkAgentLimit(organization: Organization): Promise<{ allowed: boolean; current: number; limit: number }> {
  const supabase = createClient()
  
  const plan = PLANS[organization.subscription_plan as keyof typeof PLANS]
  const limit = plan.limits.agents

  // Count current agents
  const { count, error } = await supabase
    .from('user_profiles')
    .select('*', { count: 'exact', head: true })
    .eq('organization_id', organization.id)
    .eq('role', 'agent')

  if (error) {
    console.error('Error counting agents:', error)
    return { allowed: false, current: 0, limit }
  }

  const current = count || 0
  const allowed = current < limit

  return { allowed, current, limit }
}

export async function checkSiteLimit(organization: Organization): Promise<{ allowed: boolean; current: number; limit: number }> {
  const supabase = createClient()
  
  const plan = PLANS[organization.subscription_plan as keyof typeof PLANS]
  const limit = plan.limits.sites

  // Count current sites
  const { count, error } = await supabase
    .from('sites')
    .select('*', { count: 'exact', head: true })
    .eq('organization_id', organization.id)

  if (error) {
    console.error('Error counting sites:', error)
    return { allowed: false, current: 0, limit }
  }

  const current = count || 0
  const allowed = current < limit

  return { allowed, current, limit }
}

export function getLimitMessage(entityType: 'agents' | 'sites', limit: number): string {
  if (limit === Infinity) {
    return `Nombre ${entityType === 'agents' ? 'd\'agents' : 'de sites'} illimité`
  }
  return `Limite de ${limit} ${entityType === 'agents' ? 'agents' : 'sites'} atteinte. Passez au plan Premium pour en ajouter davantage.`
}
