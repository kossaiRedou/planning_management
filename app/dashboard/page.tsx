"use client"

export const dynamic = "force-dynamic"

import { useAuth } from "@/lib/auth-context"
import { LoginPage } from "@/components/login-page"
import { AgentDashboard } from "@/components/agent/agent-dashboard"
import { AdminDashboard } from "@/components/admin/admin-dashboard"
import { LoadingScreen } from "@/components/loading-screen"

export default function DashboardPage() {
  const { user, isLoading } = useAuth()

  if (isLoading) {
    return <LoadingScreen />
  }

  if (!user) {
    return <LoginPage />
  }

  if (user.role === "owner" || user.role === "admin") {
    return <AdminDashboard />
  }

  return <AgentDashboard />
}
