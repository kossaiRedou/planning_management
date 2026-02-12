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
      console.log('Fetching profile for user:', userId)
      
      // Fetch user profile
      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (profileError) {
        console.error('Error fetching profile:', profileError)
        throw profileError
      }

      if (!profile) {
        console.error('No profile found for user:', userId)
        throw new Error('Profile not found')
      }

      console.log('Profile found:', profile)

      // Fetch organization
      const { data: org, error: orgError } = await supabase
        .from('organizations')
        .select('*')
        .eq('id', profile.organization_id)
        .single()

      if (orgError) {
        console.error('Error fetching organization:', orgError)
        throw orgError
      }

      console.log('Organization found:', org)

      // Get auth user email
      const { data: { user: authUser } } = await supabase.auth.getUser()

      const userData = {
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
      }

      console.log('Setting user data:', userData)
      setUser(userData)

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
        console.log('Setting organization data:', orgData)
        setOrganization(orgData)
      }
    } catch (error: any) {
      console.error('Error fetching user profile:', error)
      console.error('Error details:', {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint
      })
      setUser(null)
      setOrganization(null)
      // Re-throw the error so the caller knows it failed
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
    // Get initial session
    supabase.auth.getSession().then(async ({ data: { session: initialSession } }) => {
      setSession(initialSession)
      if (initialSession?.user) {
        try {
          await fetchUserProfile(initialSession.user.id)
        } catch (error) {
          console.error('Failed to fetch profile on mount:', error)
          // Sign out if profile doesn't exist
          await supabase.auth.signOut()
        }
      }
      setIsLoading(false)
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, currentSession) => {
      setSession(currentSession)
      if (currentSession?.user) {
        try {
          await fetchUserProfile(currentSession.user.id)
        } catch (error) {
          console.error('Failed to fetch profile on auth change:', error)
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
      subscription.unsubscribe()
    }
  }, [supabase, fetchUserProfile])

  const login = useCallback(async (email: string, password: string) => {
    setIsLoading(true)
    try {
      console.log('Tentative de connexion avec:', email)
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        console.error('Erreur de connexion:', error)
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
        console.log('Connexion réussie, récupération du profil...')
        try {
          await fetchUserProfile(data.user.id)
          console.log('Profil récupéré avec succès')
        } catch (profileError: any) {
          console.error('Erreur lors de la récupération du profil:', profileError)
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
      console.error('Exception lors de la connexion:', error)
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
