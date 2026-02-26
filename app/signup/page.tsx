"use client"

export const dynamic = "force-dynamic"

import { Suspense, useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { getStripe } from "@/lib/stripe/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, Check, AlertCircle } from "lucide-react"
import Image from "next/image"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"

function SignupForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [canceledMessage, setCanceledMessage] = useState(false)

  useEffect(() => {
    if (searchParams.get("canceled") === "true") {
      setCanceledMessage(true)
      const timer = setTimeout(() => setCanceledMessage(false), 10000)
      return () => clearTimeout(timer)
    }
  }, [searchParams])

  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [companyName, setCompanyName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [selectedPlan, setSelectedPlan] = useState<"standard" | "premium">("standard")

  function validate() {
    if (!firstName?.trim() || !lastName?.trim() || !companyName?.trim() || !email?.trim() || !password) {
      setError("Veuillez remplir tous les champs obligatoires")
      return false
    }
    if (password !== confirmPassword) {
      setError("Les mots de passe ne correspondent pas")
      return false
    }
    if (password.length < 6) {
      setError("Le mot de passe doit contenir au moins 6 caractères")
      return false
    }
    setError("")
    return true
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return

    setIsLoading(true)
    setError("")

    try {
      const response = await fetch("/api/create-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          plan: selectedPlan,
          adminEmail: email.trim(),
          adminPassword: password,
          organizationData: {
            name: companyName.trim(),
            email: email.trim(),
            phone: "",
            address: "",
          },
          adminData: {
            firstName: firstName.trim(),
            lastName: lastName.trim(),
          },
        }),
      })

      const data = await response.json()
      const { sessionId } = data
      const checkoutError = data.error

      if (checkoutError) throw new Error(checkoutError)
      if (!sessionId) throw new Error("Session de paiement introuvable")

      const stripe = await getStripe()
      if (!stripe) throw new Error("Stripe n'a pas pu se charger")

      const { error: redirectError } = await stripe.redirectToCheckout({ sessionId })
      if (redirectError) throw redirectError
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Une erreur est survenue lors de l'inscription"
      setError(message)
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-lg">
        <div className="mb-6 flex flex-col items-center gap-3">
          <Image src="/logowithoutBG.png" alt="ShiftMe" width={56} height={56} className="rounded-2xl" />
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Créer votre compte</h1>
          <p className="text-center text-sm text-muted-foreground">
            Un formulaire, puis redirection vers le paiement sécurisé.
          </p>
        </div>

        {canceledMessage && (
          <Alert variant="default" className="mb-6 border-yellow-200 bg-yellow-50">
            <AlertCircle className="h-4 w-4 text-yellow-600" />
            <AlertDescription className="text-yellow-800">
              Paiement annulé. Vous pouvez reprendre l&apos;inscription à tout moment.
            </AlertDescription>
          </Alert>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Inscription</CardTitle>
            <CardDescription>
              Prénom, nom, entreprise, email et mot de passe. Choisissez ensuite votre plan.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="firstName">Prénom *</Label>
                  <Input
                    id="firstName"
                    placeholder="Jean"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    disabled={isLoading}
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="lastName">Nom *</Label>
                  <Input
                    id="lastName"
                    placeholder="Dupont"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    disabled={isLoading}
                  />
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="companyName">Nom de l&apos;entreprise *</Label>
                <Input
                  id="companyName"
                  placeholder="Mon Agence"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  disabled={isLoading}
                />
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="email">Adresse email *</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="vous@votreentreprise.fr"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                />
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="password">Mot de passe *</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                />
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="confirmPassword">Confirmer le mot de passe *</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={isLoading}
                />
              </div>

              <div className="flex flex-col gap-2">
                <Label>Plan *</Label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setSelectedPlan("standard")}
                    className={`flex flex-col gap-2 rounded-lg border-2 p-4 text-left transition-colors ${
                      selectedPlan === "standard"
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/50"
                    }`}
                  >
                    <span className="font-semibold">Standard</span>
                    <span className="text-lg font-bold">49€<span className="text-sm font-normal text-muted-foreground">/mois</span></span>
                    <ul className="flex flex-col gap-1 text-xs text-muted-foreground">
                      <li className="flex items-center gap-1"><Check className="h-3 w-3 text-primary" /> 20 agents</li>
                      <li className="flex items-center gap-1"><Check className="h-3 w-3 text-primary" /> 50 sites</li>
                    </ul>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedPlan("premium")}
                    className={`relative flex flex-col gap-2 rounded-lg border-2 p-4 text-left transition-colors ${
                      selectedPlan === "premium"
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/50"
                    }`}
                  >
                    <Badge className="absolute right-2 top-2 text-xs">Recommandé</Badge>
                    <span className="font-semibold">Premium</span>
                    <span className="text-lg font-bold">99€<span className="text-sm font-normal text-muted-foreground">/mois</span></span>
                    <ul className="flex flex-col gap-1 text-xs text-muted-foreground">
                      <li className="flex items-center gap-1"><Check className="h-3 w-3 text-primary" /> Agents illimités</li>
                      <li className="flex items-center gap-1"><Check className="h-3 w-3 text-primary" /> Sites illimités</li>
                    </ul>
                  </button>
                </div>
              </div>

              <p className="text-xs text-muted-foreground">
                14 jours d&apos;essai gratuit · Paiement sécurisé Stripe · Annulation à tout moment
              </p>

              {error && (
                <div className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  {error}
                </div>
              )}

              <Button type="submit" disabled={isLoading} className="w-full">
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Redirection vers le paiement...
                  </>
                ) : (
                  "Procéder au paiement"
                )}
              </Button>
            </form>

            <p className="mt-4 text-center text-sm text-muted-foreground">
              Vous avez déjà un compte ?{" "}
              <button
                type="button"
                onClick={() => router.push("/login")}
                className="text-primary hover:underline"
              >
                Se connecter
              </button>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default function SignupPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-background">
          <div className="text-muted-foreground">Chargement...</div>
        </div>
      }
    >
      <SignupForm />
    </Suspense>
  )
}
