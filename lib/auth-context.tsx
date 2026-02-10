"use client"

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react"
import { createClient } from "./supabase/client"
import type { User, Organization } from "./types"
import type { Session } from "@supabase/supabase-js"

interface AuthContextType {
  user: User | null
  organization: Organization | null
  session: Session | null
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  logout: () => Promise<void>
  isLoading: boolean
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [organization, setOrganization] = useState<Organization | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const supabase = createClient()

  const fetchUserProfile = useCallback(async (userId: string) => {
    try {
      // Fetch user profile
      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (profileError) throw profileError

      if (profile) {
        // Fetch organization
        const { data: org, error: orgError } = await supabase
          .from('organizations')
          .select('*')
          .eq('id', profile.organization_id)
          .single()

        if (orgError) throw orgError

        // Get auth user email
        const { data: { user: authUser } } = await supabase.auth.getUser()

        setUser({
          id: profile.id,
          organization_id: profile.organization_id,
          email: authUser?.email || '',
          firstName: profile.first_name,
          lastName: profile.last_name,
          role: profile.role as "owner" | "admin" | "agent",
          phone: profile.phone || undefined,
          certifications: profile.certifications || undefined,
          created_at: profile.created_at,
          updated_at: profile.updated_at,
        })

        if (org) {
          setOrganization({
            id: org.id,
            name: org.name,
            email: org.email,
            phone: org.phone || undefined,
            address: org.address || undefined,
            logo_url: org.logo_url || undefined,
            stripe_customer_id: org.stripe_customer_id || undefined,
            stripe_subscription_id: org.stripe_subscription_id || undefined,
            subscription_status: org.subscription_status as 'active' | 'trialing' | 'past_due' | 'canceled',
            subscription_plan: org.subscription_plan as 'standard' | 'premium',
            trial_ends_at: org.trial_ends_at || undefined,
            created_at: org.created_at,
            updated_at: org.updated_at,
          })
        }
      }
    } catch (error) {
      console.error('Error fetching user profile:', error)
      setUser(null)
      setOrganization(null)
    }
  }, [supabase])

  const refreshUser = useCallback(async () => {
    const { data: { session: currentSession } } = await supabase.auth.getSession()
    if (currentSession?.user) {
      await fetchUserProfile(currentSession.user.id)
    }
  }, [supabase, fetchUserProfile])

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session: initialSession } }) => {
      setSession(initialSession)
      if (initialSession?.user) {
        fetchUserProfile(initialSession.user.id)
      }
      setIsLoading(false)
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, currentSession) => {
      setSession(currentSession)
      if (currentSession?.user) {
        await fetchUserProfile(currentSession.user.id)
      } else {
        setUser(null)
        setOrganization(null)
      }
      setIsLoading(false)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [supabase, fetchUserProfile])

  const login = useCallback(async (email: string, password: string) => {
    setIsLoading(true)
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        setIsLoading(false)
        return { success: false, error: error.message }
      }

      if (data.user) {
        await fetchUserProfile(data.user.id)
      }

      setIsLoading(false)
      return { success: true }
    } catch (error) {
      setIsLoading(false)
      return { success: false, error: 'Une erreur est survenue' }
    }
  }, [supabase, fetchUserProfile])

  const logout = useCallback(async () => {
    await supabase.auth.signOut()
    setUser(null)
    setOrganization(null)
    setSession(null)
  }, [supabase])

  return (
    <AuthContext.Provider value={{ user, organization, session, login, logout, isLoading, refreshUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
