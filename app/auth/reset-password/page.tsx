"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, Lock, ArrowLeft } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

// Create a separate Supabase client just for this page to avoid AuthProvider interference
const supabaseResetClient = createClient()

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [sessionSet, setSessionSet] = useState(false)
  const router = useRouter()

  useEffect(() => {
    // Check if we have the necessary parameters from the email link
    const hashParams = new URLSearchParams(window.location.hash.substring(1))
    const accessToken = hashParams.get("access_token")
    const refreshToken = hashParams.get("refresh_token")
    const type = hashParams.get("type")
    
    console.log("Hash params:", { accessToken: !!accessToken, refreshToken: !!refreshToken, type })
    
    if (!accessToken || !refreshToken || type !== "recovery") {
      setError("Lien de réinitialisation expiré ou invalide. Veuillez demander un nouveau lien.")
      return
    }

    // Set the session on our isolated client
    const setSession = async () => {
      try {
        const { error } = await supabaseResetClient.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        })
        
        if (error) {
          console.error("Session error:", error)
          setError("Lien de réinitialisation expiré ou invalide. Veuillez demander un nouveau lien.")
        } else {
          console.log("Session set for password reset (isolated)")
          setSessionSet(true)
          // Clear the hash from the URL for security
          window.history.replaceState({}, document.title, window.location.pathname)
        }
      } catch (err) {
        console.error("Session setup error:", err)
        setError("Lien de réinitialisation expiré ou invalide. Veuillez demander un nouveau lien.")
      }
    }

    setSession()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    setSuccess("")

    // Basic validation
    if (!password.trim() || !confirmPassword.trim()) {
      setError("Veuillez remplir tous les champs")
      setLoading(false)
      return
    }

    if (password.length < 6) {
      setError("Le mot de passe doit contenir au moins 6 caractères")
      setLoading(false)
      return
    }

    if (password !== confirmPassword) {
      setError("Les mots de passe ne correspondent pas")
      setLoading(false)
      return
    }

    try {
      console.log("Updating password...")
      const { error } = await supabaseResetClient.auth.updateUser({
        password: password
      })

      if (error) {
        console.error("Password update error:", error)
        setError("Erreur lors de la mise à jour du mot de passe: " + error.message)
      } else {
        console.log("Password updated successfully, redirecting to dashboard...")
        setSuccess("Mot de passe mis à jour avec succès ! Connexion en cours...")
        
        // Small delay for user feedback, then redirect to dashboard
        setTimeout(() => {
          router.push("/dashboard")
        }, 1000)
      }
    } catch (error) {
      console.error("❌ Password update exception:", error)
      setError("Une erreur inattendue s'est produite")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">Nouveau mot de passe</CardTitle>
          <CardDescription className="text-center">
            Choisissez un nouveau mot de passe pour votre compte
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>
                  {error}
                  {error.includes("invalide") && (
                    <div className="mt-2">
                      <Link href="/forgot-password" className="text-blue-600 hover:underline">
                        Demander un nouveau lien de réinitialisation
                      </Link>
                    </div>
                  )}
                </AlertDescription>
              </Alert>
            )}
            {success && (
              <Alert>
                <AlertDescription>{success}</AlertDescription>
              </Alert>
            )}
            {!error && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="password">Nouveau mot de passe</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="password"
                      type="password"
                      placeholder="Entrez votre nouveau mot de passe"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10"
                      required
                      disabled={loading}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirmer le mot de passe</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="confirmPassword"
                      type="password"
                      placeholder="Confirmez votre nouveau mot de passe"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="pl-10"
                      required
                      disabled={loading}
                    />
                  </div>
                </div>
              </div>
            )}
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            {!error && (
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Mise à jour en cours...
                  </>
                ) : (
                  "Mettre à jour le mot de passe"
                )}
              </Button>
            )}
            <div className="text-center text-sm">
              <Link href="/login" className="inline-flex items-center text-blue-600 hover:underline">
                <ArrowLeft className="mr-1 h-4 w-4" />
                Retour à la connexion
              </Link>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
