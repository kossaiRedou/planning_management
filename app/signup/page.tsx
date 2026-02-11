"use client"

export const dynamic = 'force-dynamic'

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { getStripe } from "@/lib/stripe/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Shield, ArrowLeft, ArrowRight, Loader2, Check } from "lucide-react"
import { Badge } from "@/components/ui/badge"

type Step = 'organization' | 'admin' | 'plan'

export default function SignupPage() {
  const router = useRouter()
  const [step, setStep] = useState<Step>('organization')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  // Organization data
  const [orgName, setOrgName] = useState('')
  const [orgEmail, setOrgEmail] = useState('')
  const [orgPhone, setOrgPhone] = useState('')
  const [orgAddress, setOrgAddress] = useState('')

  // Admin data
  const [adminFirstName, setAdminFirstName] = useState('')
  const [adminLastName, setAdminLastName] = useState('')
  const [adminEmail, setAdminEmail] = useState('')
  const [adminPassword, setAdminPassword] = useState('')
  const [adminConfirmPassword, setAdminConfirmPassword] = useState('')

  // Plan selection
  const [selectedPlan, setSelectedPlan] = useState<'standard' | 'premium'>('standard')

  const supabase = createClient()

  async function handleNext() {
    setError('')

    if (step === 'organization') {
      if (!orgName || !orgEmail) {
        setError('Veuillez remplir tous les champs obligatoires')
        return
      }
      setStep('admin')
    } else if (step === 'admin') {
      if (!adminFirstName || !adminLastName || !adminEmail || !adminPassword) {
        setError('Veuillez remplir tous les champs obligatoires')
        return
      }
      if (adminPassword !== adminConfirmPassword) {
        setError('Les mots de passe ne correspondent pas')
        return
      }
      if (adminPassword.length < 6) {
        setError('Le mot de passe doit contenir au moins 6 caractères')
        return
      }
      setStep('plan')
    }
  }

  async function handleSubmit() {
    setIsLoading(true)
    setError('')

    try {
      // Create Stripe Checkout Session (user will be created by webhook after payment)
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          plan: selectedPlan,
          adminEmail: adminEmail,
          organizationData: {
            name: orgName,
            email: orgEmail,
            phone: orgPhone,
            address: orgAddress,
          },
          adminData: {
            firstName: adminFirstName,
            lastName: adminLastName,
          },
        }),
      })

      const { sessionId, error: checkoutError } = await response.json()

      if (checkoutError) throw new Error(checkoutError)

      // Redirect to Stripe Checkout
      const stripe = await getStripe()
      if (!stripe) throw new Error('Stripe failed to load')

      const { error: redirectError } = await stripe.redirectToCheckout({
        sessionId,
      })

      if (redirectError) throw redirectError

    } catch (err: any) {
      console.error('Signup error:', err)
      setError(err.message || 'Une erreur est survenue lors de l\'inscription')
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="mb-8 flex flex-col items-center gap-3">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary">
            <Shield className="h-7 w-7 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Créer votre compte
          </h1>
          <p className="text-sm text-muted-foreground">
            Commencez à gérer vos plannings en quelques minutes
          </p>
        </div>

        {/* Progress */}
        <div className="mb-8 flex items-center justify-center gap-2">
          <div className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium ${
            step === 'organization' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
          }`}>
            {step === 'organization' ? '1' : <Check className="h-4 w-4" />}
          </div>
          <div className={`h-1 w-16 rounded ${
            step !== 'organization' ? 'bg-primary' : 'bg-muted'
          }`} />
          <div className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium ${
            step === 'admin' ? 'bg-primary text-primary-foreground' : 
            step === 'plan' ? 'bg-muted text-foreground' : 'bg-muted text-muted-foreground'
          }`}>
            {step === 'plan' ? <Check className="h-4 w-4" /> : '2'}
          </div>
          <div className={`h-1 w-16 rounded ${
            step === 'plan' ? 'bg-primary' : 'bg-muted'
          }`} />
          <div className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium ${
            step === 'plan' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
          }`}>
            3
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>
              {step === 'organization' && 'Informations de votre agence'}
              {step === 'admin' && 'Votre compte administrateur'}
              {step === 'plan' && 'Choisissez votre plan'}
            </CardTitle>
            <CardDescription>
              {step === 'organization' && 'Commencez par les informations de votre agence de sécurité'}
              {step === 'admin' && 'Créez votre compte pour gérer l\'agence'}
              {step === 'plan' && 'Sélectionnez le plan adapté à vos besoins'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {step === 'organization' && (
              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="orgName">Nom de l'agence *</Label>
                  <Input
                    id="orgName"
                    placeholder="SecuPro Services"
                    value={orgName}
                    onChange={(e) => setOrgName(e.target.value)}
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="orgEmail">Email de l'agence *</Label>
                  <Input
                    id="orgEmail"
                    type="email"
                    placeholder="contact@secupro.fr"
                    value={orgEmail}
                    onChange={(e) => setOrgEmail(e.target.value)}
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="orgPhone">Téléphone</Label>
                  <Input
                    id="orgPhone"
                    placeholder="01 23 45 67 89"
                    value={orgPhone}
                    onChange={(e) => setOrgPhone(e.target.value)}
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="orgAddress">Adresse</Label>
                  <Input
                    id="orgAddress"
                    placeholder="12 Rue de la Paix, 75000 Paris"
                    value={orgAddress}
                    onChange={(e) => setOrgAddress(e.target.value)}
                  />
                </div>
              </div>
            )}

            {step === 'admin' && (
              <div className="flex flex-col gap-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="firstName">Prénom *</Label>
                    <Input
                      id="firstName"
                      placeholder="Jean"
                      value={adminFirstName}
                      onChange={(e) => setAdminFirstName(e.target.value)}
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="lastName">Nom *</Label>
                    <Input
                      id="lastName"
                      placeholder="Dupont"
                      value={adminLastName}
                      onChange={(e) => setAdminLastName(e.target.value)}
                    />
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="adminEmail">Email *</Label>
                  <Input
                    id="adminEmail"
                    type="email"
                    placeholder="jean.dupont@secupro.fr"
                    value={adminEmail}
                    onChange={(e) => setAdminEmail(e.target.value)}
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="password">Mot de passe *</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="confirmPassword">Confirmer le mot de passe *</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="••••••••"
                    value={adminConfirmPassword}
                    onChange={(e) => setAdminConfirmPassword(e.target.value)}
                  />
                </div>
              </div>
            )}

            {step === 'plan' && (
              <div className="flex flex-col gap-4">
                <div className="grid gap-4 md:grid-cols-2">
                  {/* Standard Plan */}
                  <button
                    type="button"
                    onClick={() => setSelectedPlan('standard')}
                    className={`flex flex-col gap-3 rounded-lg border-2 p-6 text-left transition-colors ${
                      selectedPlan === 'standard'
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <div>
                      <h3 className="text-lg font-semibold">Standard</h3>
                      <p className="text-2xl font-bold">49€<span className="text-sm font-normal text-muted-foreground">/mois</span></p>
                    </div>
                    <ul className="flex flex-col gap-2 text-sm">
                      <li className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-primary" />
                        Jusqu'à 20 agents
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-primary" />
                        Jusqu'à 50 sites
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-primary" />
                        Planning temps réel
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-primary" />
                        Export CSV
                      </li>
                    </ul>
                  </button>

                  {/* Premium Plan */}
                  <button
                    type="button"
                    onClick={() => setSelectedPlan('premium')}
                    className={`relative flex flex-col gap-3 rounded-lg border-2 p-6 text-left transition-colors ${
                      selectedPlan === 'premium'
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <Badge className="absolute right-4 top-4">Recommandé</Badge>
                    <div>
                      <h3 className="text-lg font-semibold">Premium</h3>
                      <p className="text-2xl font-bold">99€<span className="text-sm font-normal text-muted-foreground">/mois</span></p>
                    </div>
                    <ul className="flex flex-col gap-2 text-sm">
                      <li className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-primary" />
                        Agents illimités
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-primary" />
                        Sites illimités
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-primary" />
                        Tout du plan Standard
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-primary" />
                        Export PDF
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-primary" />
                        Support prioritaire
                      </li>
                    </ul>
                  </button>
                </div>

                <div className="rounded-lg bg-muted p-4 text-sm text-muted-foreground">
                  <p>✓ 14 jours d'essai gratuit</p>
                  <p>✓ Annulation à tout moment</p>
                  <p>✓ Paiement sécurisé par Stripe</p>
                </div>
              </div>
            )}

            {error && (
              <div className="mt-4 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {error}
              </div>
            )}

            <div className="mt-6 flex items-center justify-between gap-4">
              {step !== 'organization' && (
                <Button
                  variant="outline"
                  onClick={() => {
                    if (step === 'admin') setStep('organization')
                    if (step === 'plan') setStep('admin')
                  }}
                  disabled={isLoading}
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Retour
                </Button>
              )}
              
              {step !== 'plan' ? (
                <Button onClick={handleNext} className="ml-auto">
                  Suivant
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              ) : (
                <Button onClick={handleSubmit} disabled={isLoading} className="ml-auto">
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Redirection...
                    </>
                  ) : (
                    'Procéder au paiement'
                  )}
                </Button>
              )}
            </div>

            <div className="mt-4 text-center text-sm text-muted-foreground">
              Vous avez déjà un compte ?{' '}
              <button
                type="button"
                onClick={() => router.push('/login')}
                className="text-primary hover:underline"
              >
                Se connecter
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
