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
      // Optimize: Fetch profile with organization in a single query
      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select(`
          *,
          organization:organizations(*)
        `)
        .eq('id', userId)
        .single()

      if (profileError) {
        console.error('Error fetching profile:', profileError)
        throw profileError
      }

      if (!profile || !profile.organization) {
        console.error('No profile or organization found')
        throw new Error('Profile not found')
      }

      // Get auth user email (from session, faster)
      const { data: { session: currentSession } } = await supabase.auth.getSession()

      const userData = {
        id: profile.id,
        organization_id: profile.organization_id,
        email: currentSession?.user?.email || '',
        firstName: profile.first_name,
        lastName: profile.last_name,
        role: profile.role as "owner" | "admin" | "agent",
        phone: profile.phone || undefined,
        certifications: profile.certifications || undefined,
        created_at: profile.created_at,
        updated_at: profile.updated_at,
      }
      setUser(userData)

      const org = profile.organization as any
      if (org) {
        const orgData = {
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
        }
        setOrganization(orgData)
      }
    } catch (error: any) {
      console.error('Auth error:', error.message)
      setUser(null)
      setOrganization(null)
      throw error
    }
  }, [supabase])

  const refreshUser = useCallback(async () => {
    const { data: { session: currentSession } } = await supabase.auth.getSession()
    if (currentSession?.user) {
      await fetchUserProfile(currentSession.user.id)
    }
  }, [supabase, fetchUserProfile])

  useEffect(() => {
    let mounted = true

    // Get initial session
    const initializeAuth = async () => {
      try {
        const { data: { session: initialSession } } = await supabase.auth.getSession()
        
        if (!mounted) return

        setSession(initialSession)
        
        if (initialSession?.user) {
          try {
            await fetchUserProfile(initialSession.user.id)
          } catch (error) {
            // Sign out if profile doesn't exist
            await supabase.auth.signOut()
            setSession(null)
          }
        }
      } catch (error) {
        console.error('Auth init error:', error)
      } finally {
        if (mounted) {
          setIsLoading(false)
        }
      }
    }

    initializeAuth()

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, currentSession) => {
      setSession(currentSession)
      
      if (currentSession?.user) {
        try {
          await fetchUserProfile(currentSession.user.id)
        } catch (error) {
          setUser(null)
          setOrganization(null)
        }
      } else {
        setUser(null)
        setOrganization(null)
      }
      setIsLoading(false)
    })

    return () => {
      mounted = false
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
        
        // Translate common Supabase errors to French
        let errorMessage = error.message
        if (error.message.includes('Invalid login credentials')) {
          errorMessage = 'Email ou mot de passe incorrect'
        } else if (error.message.includes('Email not confirmed')) {
          errorMessage = 'Veuillez confirmer votre email avant de vous connecter'
        } else if (error.message.includes('User not found')) {
          errorMessage = 'Aucun compte trouvé avec cet email'
        }
        
        return { success: false, error: errorMessage }
      }

      if (data.user) {
        try {
          await fetchUserProfile(data.user.id)
        } catch (profileError: any) {
          // Disconnect the user if profile fetch fails
          await supabase.auth.signOut()
          setIsLoading(false)
          return { 
            success: false, 
            error: 'Votre compte existe mais votre profil est introuvable. Veuillez contacter le support.' 
          }
        }
      }

      setIsLoading(false)
      return { success: true }
    } catch (error: any) {
      console.error('Login error:', error.message)
      setIsLoading(false)
      return { success: false, error: error.message || 'Une erreur est survenue' }
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
