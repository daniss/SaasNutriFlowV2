"use client"

import { useState, useEffect, Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Mail, Clock, CheckCircle } from "lucide-react"
import { useAuth } from "@/components/auth/AuthProviderNew"
import Link from "next/link"

function CheckEmailContent() {
  const [resendCooldown, setResendCooldown] = useState(10)
  const [isResending, setIsResending] = useState(false)
  const [resendSuccess, setResendSuccess] = useState(false)
  const searchParams = useSearchParams()
  const router = useRouter()
  const { signUp } = useAuth()

  const email = searchParams.get('email')
  const message = searchParams.get('message')

  useEffect(() => {
    if (!email) {
      router.push('/signup')
      return
    }

    // Start countdown for resend button
    if (resendCooldown > 0) {
      const timer = setTimeout(() => {
        setResendCooldown(resendCooldown - 1)
      }, 1000)
      return () => clearTimeout(timer)
    }
    
    // Return undefined explicitly for other code paths
    return undefined
  }, [resendCooldown, email, router])

  const handleResend = async () => {
    if (!email || resendCooldown > 0) return

    setIsResending(true)
    setResendSuccess(false)

    try {
      // Use Supabase's resend confirmation email functionality
      const response = await fetch('/api/auth/resend-confirmation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email })
      })

      const result = await response.json()
      
      if (!response.ok || result.error) {
        console.error('Erreur lors du renvoi:', result.error)
      } else {
        setResendSuccess(true)
        setResendCooldown(10) // Reset cooldown
      }
    } catch (error) {
      console.error('Erreur lors du renvoi:', error)
    } finally {
      setIsResending(false)
    }
  }

  if (!email) {
    return null // Will redirect to signup
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center">
            <Mail className="w-8 h-8 text-emerald-600" />
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900">
            Vérifiez votre e-mail
          </CardTitle>
          <CardDescription className="text-gray-600">
            Un e-mail de confirmation a été envoyé à
          </CardDescription>
          <p className="font-medium text-gray-900 break-all">
            {email}
          </p>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {message === 'email_confirmation_required' && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <div className="w-5 h-5 rounded-full bg-red-100 flex items-center justify-center mt-0.5">
                  <div className="w-2 h-2 bg-red-600 rounded-full" />
                </div>
                <div className="text-sm text-red-800">
                  <p className="font-medium mb-1">🔒 Accès sécurisé requis</p>
                  <p>Vous devez confirmer votre adresse e-mail avant d'accéder au tableau de bord pour des raisons de sécurité.</p>
                </div>
              </div>
            </div>
          )}
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <Mail className="w-5 h-5 text-blue-600 mt-0.5" />
              <div className="text-sm text-blue-800">
                <p className="font-medium mb-1">Étapes suivantes :</p>
                <ol className="list-decimal list-inside space-y-1">
                  <li>Vérifiez votre boîte de réception</li>
                  <li>Cliquez sur le lien de confirmation</li>
                  <li>Connectez-vous à votre compte</li>
                </ol>
              </div>
            </div>
          </div>

          {resendSuccess && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <p className="text-sm font-medium text-green-800">
                  E-mail de confirmation renvoyé avec succès !
                </p>
              </div>
            </div>
          )}

          <div className="space-y-4">
            <Button
              onClick={handleResend}
              disabled={resendCooldown > 0 || isResending}
              variant="outline"
              className="w-full"
            >
              {isResending ? (
                "Envoi en cours..."
              ) : resendCooldown > 0 ? (
                <div className="flex items-center space-x-2">
                  <Clock className="w-4 h-4" />
                  <span>Renvoyer dans {resendCooldown}s</span>
                </div>
              ) : (
                "Renvoyer l'e-mail"
              )}
            </Button>

            <div className="text-center space-y-2">
              <p className="text-sm text-gray-600">
                Vous n'avez pas reçu l'e-mail ? Vérifiez vos spams.
              </p>
              <Link 
                href="/signup" 
                className="text-sm text-emerald-600 hover:text-emerald-700 font-medium"
              >
                Retour à l'inscription
              </Link>
            </div>
          </div>

          <div className="border-t pt-4">
            <p className="text-xs text-gray-500 text-center">
              Vous avez déjà un compte ?{" "}
              <Link 
                href="/login" 
                className="text-emerald-600 hover:text-emerald-700 font-medium"
              >
                Se connecter
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default function CheckEmailPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center">
              <Mail className="w-8 h-8 text-emerald-600 animate-pulse" />
            </div>
            <CardTitle className="text-2xl font-bold text-gray-900">
              Chargement...
            </CardTitle>
          </CardHeader>
        </Card>
      </div>
    }>
      <CheckEmailContent />
    </Suspense>
  )
}