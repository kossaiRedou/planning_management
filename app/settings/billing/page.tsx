"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/auth-context"
import { createClient } from "@/lib/supabase/client"
import { PLANS } from "@/lib/stripe/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Check, CreditCard, AlertCircle, Loader2 } from "lucide-react"

export default function BillingPage() {
  const { organization, refreshUser } = useAuth()
  const supabase = createClient()
  
  const [isLoading, setIsLoading] = useState(false)
  const [portalLoading, setPortalLoading] = useState(false)

  if (!organization) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-muted-foreground">Chargement...</div>
      </div>
    )
  }

  const currentPlan = PLANS[organization.subscription_plan as keyof typeof PLANS]
  const isActive = ['active', 'trialing'].includes(organization.subscription_status)

  async function handleUpgrade() {
    setIsLoading(true)
    try {
      const newPlan = organization.subscription_plan === 'standard' ? 'premium' : 'standard'
      
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: newPlan }),
      })

      const { sessionId, error } = await response.json()
      if (error) throw new Error(error)

      // Redirect to Stripe Checkout
      const { getStripe } = await import('@/lib/stripe/client')
      const stripe = await getStripe()
      if (!stripe) throw new Error('Stripe failed to load')

      await stripe.redirectToCheckout({ sessionId })
    } catch (error: any) {
      console.error('Error:', error)
      alert(`Erreur: ${error.message}`)
    } finally {
      setIsLoading(false)
    }
  }

  async function handleManageSubscription() {
    setPortalLoading(true)
    try {
      const response = await fetch('/api/create-portal-session', {
        method: 'POST',
      })

      const { url, error } = await response.json()
      if (error) throw new Error(error)

      window.location.href = url
    } catch (error: any) {
      console.error('Error:', error)
      alert(`Erreur: ${error.message}`)
      setPortalLoading(false)
    }
  }

  const getStatusBadge = () => {
    switch (organization.subscription_status) {
      case 'active':
        return <Badge className="bg-green-500">Actif</Badge>
      case 'trialing':
        return <Badge className="bg-blue-500">Période d'essai</Badge>
      case 'past_due':
        return <Badge variant="destructive">Paiement en retard</Badge>
      case 'canceled':
        return <Badge variant="secondary">Annulé</Badge>
      default:
        return <Badge variant="outline">{organization.subscription_status}</Badge>
    }
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6 py-8">
      <div>
        <h1 className="text-3xl font-bold">Abonnement et facturation</h1>
        <p className="text-muted-foreground">
          Gérez votre abonnement et vos informations de paiement
        </p>
      </div>

      {/* Current Plan Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Plan actuel</CardTitle>
              <CardDescription>
                Votre abonnement {currentPlan.name}
              </CardDescription>
            </div>
            {getStatusBadge()}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-bold">
              {currentPlan.price / 100}€
            </span>
            <span className="text-muted-foreground">/mois</span>
          </div>

          {organization.trial_ends_at && organization.subscription_status === 'trialing' && (
            <div className="rounded-lg bg-blue-50 p-4 text-sm text-blue-900">
              <AlertCircle className="inline h-4 w-4 mr-2" />
              Votre période d'essai se termine le{' '}
              {new Date(organization.trial_ends_at).toLocaleDateString('fr-FR')}
            </div>
          )}

          {organization.subscription_status === 'past_due' && (
            <div className="rounded-lg bg-destructive/10 p-4 text-sm text-destructive">
              <AlertCircle className="inline h-4 w-4 mr-2" />
              Votre paiement est en retard. Veuillez mettre à jour vos informations de paiement.
            </div>
          )}

          <div className="space-y-2">
            <h4 className="font-semibold">Fonctionnalités incluses :</h4>
            <ul className="space-y-2">
              {currentPlan.features.map((feature) => (
                <li key={feature} className="flex items-center gap-2 text-sm">
                  <Check className="h-4 w-4 text-primary" />
                  {feature}
                </li>
              ))}
            </ul>
          </div>

          <Separator />

          <div className="flex gap-3">
            {isActive && (
              <Button
                onClick={handleManageSubscription}
                disabled={portalLoading}
                variant="outline"
              >
                {portalLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Redirection...
                  </>
                ) : (
                  <>
                    <CreditCard className="mr-2 h-4 w-4" />
                    Gérer l'abonnement
                  </>
                )}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Other Plans */}
      <div>
        <h2 className="mb-4 text-xl font-semibold">Autres plans disponibles</h2>
        <div className="grid gap-4 md:grid-cols-2">
          {Object.entries(PLANS).map(([key, plan]) => {
            if (key === organization.subscription_plan) return null

            return (
              <Card key={key} className="relative">
                <CardHeader>
                  <CardTitle>{plan.name}</CardTitle>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold">
                      {plan.price / 100}€
                    </span>
                    <span className="text-muted-foreground">/mois</span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ul className="space-y-2">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-center gap-2 text-sm">
                        <Check className="h-4 w-4 text-primary" />
                        {feature}
                      </li>
                    ))}
                  </ul>

                  {isActive && (
                    <Button
                      onClick={handleUpgrade}
                      disabled={isLoading}
                      className="w-full"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Chargement...
                        </>
                      ) : (
                        <>
                          {key === 'premium' ? 'Passer au Premium' : 'Rétrograder vers Standard'}
                        </>
                      )}
                    </Button>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>

      {/* Help */}
      <Card>
        <CardHeader>
          <CardTitle>Besoin d'aide ?</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Si vous avez des questions sur votre abonnement ou si vous rencontrez des problèmes,
            contactez-nous à{' '}
            <a href="mailto:support@secu-planning.fr" className="text-primary hover:underline">
              support@secu-planning.fr
            </a>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
