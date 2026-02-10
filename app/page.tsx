"use client"

import { AuthProvider, useAuth } from "@/lib/auth-context"
import { LoginPage } from "@/components/login-page"
import { AgentDashboard } from "@/components/agent/agent-dashboard"
import { AdminDashboard } from "@/components/admin/admin-dashboard"

function AppContent() {
  const { user } = useAuth()

  if (!user) {
    return <LoginPage />
  }

  if (user.role === "admin") {
    return <AdminDashboard />
  }

  return <AgentDashboard />
}

export default function Home() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  )
}
