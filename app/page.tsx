"use client"

export const dynamic = 'force-dynamic'

import { AuthProvider, useAuth } from "@/lib/auth-context"
import { LoginPage } from "@/components/login-page"
import { AgentDashboard } from "@/components/agent/agent-dashboard"
import { AdminDashboard } from "@/components/admin/admin-dashboard"

function AppContent() {
  const { user, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          <p className="text-sm text-muted-foreground">Chargement...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return <LoginPage />
  }

  // Owners and admins see the admin dashboard
  if (user.role === "owner" || user.role === "admin") {
    return <AdminDashboard />
  }

  // Agents see the agent dashboard
  return <AgentDashboard />
}

export default function Home() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  )
}
