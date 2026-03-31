"use client"

import { createContext, useContext, useState, useEffect, useCallback, useMemo, type ReactNode } from "react"
import { createClient, resetClient } from "./supabase/client"
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
  const supabase = useMemo(() => createClient(), [])

  const fetchUserProfile = useCallback(async (userId: string, emailFromSession?: string) => {
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select(`
        *,
        organization:organizations(*)
      `)
      .eq('id', userId)
      .single()

    if (profileError || !profile || !(profile as any).organization) {
      setUser(null)
      setOrganization(null)
      throw new Error('Profile not found')
    }

    const email = emailFromSession ?? ''
    const profileData = profile as any

    setUser({
      id: profileData.id,
      organization_id: profileData.organization_id,
      email,
      firstName: profileData.first_name,
      lastName: profileData.last_name,
      role: profileData.role as "owner" | "admin" | "agent",
      phone: profileData.phone || undefined,
      certifications: profileData.certifications || undefined,
      created_at: profileData.created_at,
      updated_at: profileData.updated_at,
    })

    const org = profileData.organization as any
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
  }, [supabase])

  const refreshUser = useCallback(async () => {
    const { data: { session: s } } = await supabase.auth.getSession()
    if (s?.user) {
      await fetchUserProfile(s.user.id, s.user.email ?? undefined)
    }
  }, [supabase, fetchUserProfile])

  useEffect(() => {
    let mounted = true

    const safetyTimer = setTimeout(() => { if (mounted) setIsLoading(false) }, 5000)

    supabase.auth.getSession().then(async ({ data: { session: s } }) => {
      if (!mounted) return
      setSession(s)
      if (s?.user) {
        try {
          await fetchUserProfile(s.user.id, s.user.email ?? undefined)
        } catch {
          await supabase.auth.signOut().catch(() => {})
          setSession(null)
        }
      }
    }).catch(() => {}).finally(() => {
      if (mounted) setIsLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, currentSession) => {
        if (!mounted) return
        setSession(currentSession)
        if (currentSession?.user) {
          try {
            await fetchUserProfile(currentSession.user.id, currentSession.user.email ?? undefined)
          } catch {
            await supabase.auth.signOut().catch(() => {})
            setUser(null)
            setOrganization(null)
            setSession(null)
          }
        } else {
          setUser(null)
          setOrganization(null)
        }
      }
    )

    return () => {
      mounted = false
      clearTimeout(safetyTimer)
      subscription.unsubscribe()
    }
  }, [supabase, fetchUserProfile])

  const login = useCallback(async (email: string, password: string) => {
    setIsLoading(true)
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password })

      if (error) {
        setIsLoading(false)
        let msg = error.message
        if (msg.includes('Invalid login credentials')) msg = 'Email ou mot de passe incorrect'
        else if (msg.includes('Email not confirmed')) msg = 'Veuillez confirmer votre email avant de vous connecter'
        else if (msg.includes('User not found')) msg = 'Aucun compte trouvé avec cet email'
        return { success: false, error: msg }
      }

      if (data.user) {
        try {
          await Promise.race([
            fetchUserProfile(data.user.id, data.user.email ?? undefined),
            new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 8000)),
          ])
        } catch {
          await supabase.auth.signOut().catch(() => {})
          setIsLoading(false)
          return { success: false, error: 'Profil introuvable ou serveur lent. Réessayez.' }
        }
      }

      setIsLoading(false)
      return { success: true }
    } catch (error) {
      setIsLoading(false)
      const msg = error instanceof Error ? error.message : 'Une erreur est survenue'
      return { success: false, error: msg }
    }
  }, [supabase, fetchUserProfile])

  const logout = useCallback(async () => {
    await supabase.auth.signOut({ scope: 'local' }).catch(() => {})
    setUser(null)
    setOrganization(null)
    setSession(null)
    resetClient()
    window.location.href = '/login'
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
