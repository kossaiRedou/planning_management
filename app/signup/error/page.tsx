"use client"

export const dynamic = 'force-dynamic'

import { Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { AlertCircle, Mail } from "lucide-react"
import Link from "next/link"

function ErrorContent() {
  const searchParams = useSearchParams()
  const errorType = searchParams.get('type')

  const getErrorMessage = () => {
    switch (errorType) {
      case 'payment_failed':
        return {
          title: "Paiement échoué",
          description: "Votre paiement n'a pas pu être traité",
          message: "Veuillez vérifier vos informations de paiement et réessayer.",
        }
      case 'webhook_error':
        return {
          title: "Erreur de configuration",
          description: "Un problème est survenu lors de la création de votre compte",
          message: "Votre paiement a été traité mais nous n'avons pas pu finaliser la création de votre compte. Notre équipe a été notifiée et vous contactera sous peu.",
        }
      default:
        return {
          title: "Une erreur est survenue",
          description: "Nous n'avons pas pu créer votre compte",
          message: "Une erreur inattendue s'est produite. Veuillez réessayer ou contacter notre support.",
        }
    }
  }

  const error = getErrorMessage()

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-2xl space-y-6">
        {/* Error Icon */}
        <div className="flex justify-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-destructive/10">
            <AlertCircle className="h-12 w-12 text-destructive" />
          </div>
        </div>

        {/* Error Card */}
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">{error.title}</CardTitle>
            <CardDescription className="text-base">
              {error.description}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Error Message */}
            <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-4 text-sm text-destructive">
              {error.message}
            </div>

            {/* Contact Support */}
            <div className="rounded-lg border border-border bg-muted/50 p-4">
              <div className="flex items-start gap-3">
                <Mail className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium mb-1">Besoin d'aide ?</p>
                  <p className="text-muted-foreground">
                    Notre équipe de support est disponible pour vous aider :{' '}
                    <a href="mailto:support@secu-planning.fr" className="text-primary hover:underline">
                      support@secu-planning.fr
                    </a>
                  </p>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <Button asChild className="flex-1">
                <Link href="/signup">
                  Réessayer l'inscription
                </Link>
              </Button>
              <Button asChild variant="outline" className="flex-1">
                <Link href="/login">
                  Retour à la connexion
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Help */}
        <div className="text-center text-sm text-muted-foreground">
          <p>
            Si le problème persiste, contactez-nous :{' '}
            <a href="mailto:support@secu-planning.fr" className="text-primary hover:underline">
              support@secu-planning.fr
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}

export default function SignupErrorPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-muted-foreground">Chargement...</div>
      </div>
    }>
      <ErrorContent />
    </Suspense>
  )
}
