import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import type { Database } from './database.types'

let clientInstance: ReturnType<typeof createClientComponentClient<Database>> | null = null

export function createClient() {
  if (clientInstance) return clientInstance
  clientInstance = createClientComponentClient<Database>()
  return clientInstance
}

export function resetClient() {
  clientInstance = null
}
