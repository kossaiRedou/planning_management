"use client"

export const dynamic = 'force-dynamic'

import { AuthProvider, useAuth } from "@/lib/auth-context"
import { LoginPage } from "@/components/login-page"
import { AgentDashboard } from "@/components/agent/agent-dashboard"
import { AdminDashboard } from "@/components/admin/admin-dashboard"

function AppContent() {
  const { user } = useAuth()

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
