"use client"

import React from "react"

import { useState } from "react"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Shield, Loader2, AlertCircle } from "lucide-react"

export function LoginPage() {
  const { login, isLoading } = useAuth()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    const result = await login(email, password)
    if (!result.success) {
      setError(result.error || "Identifiants incorrects. Veuillez reessayer.")
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="flex w-full max-w-md flex-col items-center gap-8">
        <div className="flex flex-col items-center gap-3">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary">
            <Shield className="h-7 w-7 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Secu-Planning
          </h1>
          <p className="text-sm text-muted-foreground">
            Gestion des plannings de securite
          </p>
        </div>

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
                  placeholder="prenom.nom@secu-planning.fr"
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

              <Button type="submit" className="w-full" disabled={isLoading}>
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

            <div className="mt-4 text-center text-sm text-muted-foreground">
              Vous n'avez pas encore de compte ?{' '}
              <a
                href="/signup"
                className="text-primary font-medium hover:underline"
              >
                Créer un compte
              </a>
            </div>

            <div className="mt-6 rounded-lg border border-border bg-muted/50 p-3">
              <p className="mb-2 text-xs font-medium text-muted-foreground">
                Comptes de demonstration :
              </p>
              <div className="flex flex-col gap-1 text-xs text-muted-foreground">
                <p>
                  <span className="font-medium text-foreground">Admin :</span>{" "}
                  admin@secu-planning.fr
                </p>
                <p>
                  <span className="font-medium text-foreground">Agent :</span>{" "}
                  jean.martin@secu-planning.fr
                </p>
                <p className="mt-1 italic">
                  Mot de passe : nimporte lequel
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
