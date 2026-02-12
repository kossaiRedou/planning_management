"use client"

export const dynamic = 'force-dynamic'

import { LoginPage } from "@/components/login-page"
import { AuthProvider } from "@/lib/auth-context"

export default function Login() {
  return (
    <AuthProvider>
      <LoginPage />
    </AuthProvider>
  )
}
