"use client"

import React, { Suspense } from "react"
import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, AlertCircle, CheckCircle2, ArrowLeft } from "lucide-react"
import Image from "next/image"

function WelcomeAlert() {
  const searchParams = useSearchParams()
  const [showWelcome, setShowWelcome] = useState(false)

  useEffect(() => {
    if (searchParams?.get('welcome') === 'true') {
      setShowWelcome(true)
    }
  }, [searchParams])

  if (!showWelcome) return null

  return (
    <Alert variant="default" className="w-full border-green-200 bg-green-50">
      <CheckCircle2 className="h-4 w-4 text-green-600" />
      <AlertDescription className="text-green-800">
        Votre compte a été créé avec succès ! Connectez-vous avec vos identifiants pour commencer.
      </AlertDescription>
    </Alert>
  )
}

function LoginForm() {
  const { login, isLoading, user } = useAuth()
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      router.push("/dashboard")
    }
  }, [user, router])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    
    const result = await login(email, password)
    
    if (!result.success) {
      setError(result.error || "Identifiants incorrects. Veuillez reessayer.")
    } else {
      router.push("/dashboard")
    }
  }

  return (
    <div className="login-page-wrap flex min-h-screen flex-col items-center justify-center px-4">
      <Link href="/" className="absolute left-4 top-4 flex items-center gap-2 text-sm text-[var(--ink-soft)] hover:text-[var(--accent)]">
        <ArrowLeft className="h-4 w-4" />
        Retour à l&apos;accueil
      </Link>
      <div className="flex w-full max-w-md flex-col items-center gap-8">
        <div className="flex flex-col items-center gap-3">
          <Image src="/logowithoutBG.png" alt="ShiftMe" width={56} height={56} className="rounded-2xl" />
          <h1 className="login-title text-2xl tracking-tight">
            ShiftMe
          </h1>
          <p className="login-sub text-sm">
            Planifiez vos équipes, simplement.
          </p>
        </div>

        {/* Welcome Alert */}
        <Suspense fallback={null}>
          <WelcomeAlert />
        </Suspense>

        <Card className="w-full">
          <CardHeader className="text-center">
            <CardTitle className="text-lg">Connexion</CardTitle>
            <CardDescription>
              Entrez vos identifiants pour acceder a votre espace
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="email">Adresse email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="prenom.nom@votreentreprise.fr"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="password">Mot de passe</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Votre mot de passe"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                />
              </div>

              {error && (
                <div className="flex items-center gap-2 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  {error}
                </div>
              )}

              <Button type="submit" className="w-full bg-[var(--ink)] hover:bg-[var(--accent)]" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Connexion en cours...
                  </>
                ) : (
                  "Se connecter"
                )}
              </Button>
            </form>

            <div className="mt-4 text-center text-sm text-[var(--ink-soft)]">
              Vous n&apos;avez pas encore de compte ?{' '}
              <Link href="/signup" className="text-accent font-medium hover:underline" style={{ color: 'var(--accent)' }}>
                Créer un compte
              </Link>
            </div>

            
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export function LoginPage() {
  return <LoginForm />
}
