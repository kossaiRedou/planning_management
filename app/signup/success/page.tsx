"use client"

export const dynamic = 'force-dynamic'

import { Suspense, useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CheckCircle2, Loader2, Mail, Shield } from "lucide-react"
import Link from "next/link"

function SuccessContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const sessionId = searchParams.get('session_id')
  const [countdown, setCountdown] = useState(10)
  const [isProcessing, setIsProcessing] = useState(true)

  useEffect(() => {
    // Check if webhook has processed (wait a bit for the webhook to complete)
    const checkTimer = setTimeout(() => {
      setIsProcessing(false)
    }, 3000)

    return () => clearTimeout(checkTimer)
  }, [])

  useEffect(() => {
    if (isProcessing) return

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          router.push('/login?welcome=true')
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [isProcessing, router])

  if (isProcessing) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center gap-4 py-12">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <div className="text-center">
              <h2 className="text-xl font-semibold mb-2">
                Finalisation de votre compte...
              </h2>
              <p className="text-sm text-muted-foreground">
                Veuillez patienter pendant que nous configurons votre organisation
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-2xl space-y-6">
        {/* Success Icon */}
        <div className="flex justify-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-green-500/15">
            <CheckCircle2 className="h-12 w-12 text-green-400" />
          </div>
        </div>

        {/* Success Card */}
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-3xl">
              Bienvenue sur ShiftMe !
            </CardTitle>
            <CardDescription className="text-base">
              Votre compte a été créé avec succès
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Trial Info */}
            <div className="rounded-lg bg-primary/10 p-4 text-sm text-primary">
              <div className="flex items-start gap-3">
                <Shield className="h-5 w-5 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-semibold mb-1">
                    Période d'essai de 14 jours activée
                  </p>
                  <p className="text-primary/80">
                    Profitez de toutes les fonctionnalités gratuitement pendant 14 jours.
                    Aucun paiement ne sera effectué avant la fin de la période d'essai.
                  </p>
                </div>
              </div>
            </div>

            {/* Next Steps */}
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Vous êtes prêt ! 🚀</h3>
              
              <div className="space-y-3">
                <div className="flex gap-3">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground flex-shrink-0">
                    1
                  </div>
                  <div>
                    <p className="font-medium">Connectez-vous avec vos identifiants</p>
                    <p className="text-sm text-muted-foreground">
                      Utilisez l'email et le mot de passe que vous avez choisis lors de l'inscription.
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground flex-shrink-0">
                    2
                  </div>
                  <div>
                    <p className="font-medium">Configurez votre organisation</p>
                    <p className="text-sm text-muted-foreground">
                      Ajoutez vos agents, créez vos sites et invitez d'autres administrateurs si besoin.
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground flex-shrink-0">
                    3
                  </div>
                  <div>
                    <p className="font-medium">Commencez à planifier</p>
                    <p className="text-sm text-muted-foreground">
                      Créez vos premiers shifts et gérez les disponibilités de vos équipes.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Help Info */}
            <div className="rounded-lg border border-border bg-muted/50 p-4">
              <div className="flex items-start gap-3">
                <Mail className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium mb-1">Besoin d'aide pour démarrer ?</p>
                  <p className="text-muted-foreground">
                    Notre équipe est disponible pour vous accompagner :{' '}
                    <a href="mailto:support@shiftme.sbs" className="text-primary hover:underline">
                      support@shiftme.sbs
                    </a>
                  </p>
                </div>
              </div>
            </div>

            {/* Action Button */}
            <div className="flex flex-col items-center gap-3 pt-4">
              <Button asChild size="lg" className="w-full sm:w-auto">
                <Link href="/login">
                  Se connecter maintenant
                </Link>
              </Button>
              <p className="text-sm text-muted-foreground">
                Redirection automatique dans {countdown} seconde{countdown > 1 ? 's' : ''}...
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Help */}
        <div className="text-center text-sm text-muted-foreground">
          <p>
            Besoin d'aide ?{' '}
            <a href="mailto:support@shiftme.sbs" className="text-primary hover:underline">
              Contactez notre support
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}

export default function SignupSuccessPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-muted-foreground">Chargement...</div>
      </div>
    }>
      <SuccessContent />
    </Suspense>
  )
}
