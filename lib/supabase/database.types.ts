export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      organizations: {
        Row: {
          id: string
          name: string
          email: string
          phone: string | null
          address: string | null
          logo_url: string | null
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          subscription_status: string
          subscription_plan: string
          trial_ends_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          email: string
          phone?: string | null
          address?: string | null
          logo_url?: string | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          subscription_status?: string
          subscription_plan?: string
          trial_ends_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          email?: string
          phone?: string | null
          address?: string | null
          logo_url?: string | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          subscription_status?: string
          subscription_plan?: string
          trial_ends_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      user_profiles: {
        Row: {
          id: string
          organization_id: string
          first_name: string
          last_name: string
          role: string
          phone: string | null
          certifications: string[] | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          organization_id: string
          first_name: string
          last_name: string
          role: string
          phone?: string | null
          certifications?: string[] | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          first_name?: string
          last_name?: string
          role?: string
          phone?: string | null
          certifications?: string[] | null
          created_at?: string
          updated_at?: string
        }
      }
      sites: {
        Row: {
          id: string
          organization_id: string
          name: string
          address: string
          contact_name: string | null
          contact_phone: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          name: string
          address: string
          contact_name?: string | null
          contact_phone?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          name?: string
          address?: string
          contact_name?: string | null
          contact_phone?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      shifts: {
        Row: {
          id: string
          organization_id: string
          agent_id: string
          site_id: string
          date: string
          start_time: string
          end_time: string
          notes: string | null
          is_night: boolean
          is_sunday: boolean
          status: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          agent_id: string
          site_id: string
          date: string
          start_time: string
          end_time: string
          notes?: string | null
          is_night?: boolean
          is_sunday?: boolean
          status?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          agent_id?: string
          site_id?: string
          date?: string
          start_time?: string
          end_time?: string
          notes?: string | null
          is_night?: boolean
          is_sunday?: boolean
          status?: string
          created_at?: string
          updated_at?: string
        }
      }
      availabilities: {
        Row: {
          id: string
          organization_id: string
          agent_id: string
          date: string
          available: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          agent_id: string
          date: string
          available?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          agent_id?: string
          date?: string
          available?: boolean
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}
