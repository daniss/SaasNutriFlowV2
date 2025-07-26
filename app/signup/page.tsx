"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, Mail, Lock, User, Phone, MapPin, CheckCircle, XCircle } from "lucide-react"
import { useAuth } from "@/hooks/useAuthNew"

export default function SignupPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [passwordConfirm, setPasswordConfirm] = useState("")
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [phone, setPhone] = useState("")
  const [address, setAddress] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const router = useRouter()
  const { signUp } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    setSuccess("")

    // Basic validation
    if (!firstName.trim() || !lastName.trim() || !email.trim() || !password.trim() || !passwordConfirm.trim()) {
      setError("Veuillez remplir tous les champs obligatoires")
      setLoading(false)
      return
    }

    if (password.length < 6) {
      setError("Le mot de passe doit contenir au moins 6 caractères")
      setLoading(false)
      return
    }

    if (password !== passwordConfirm) {
      setError("Les mots de passe ne correspondent pas")
      setLoading(false)
      return
    }

    try {
      const { error } = await signUp(email, password, firstName, lastName, phone, address)

      if (error) {
        setError(error || "Échec de la création du compte")
      } else {
        setSuccess("Compte créé avec succès ! Redirection vers la page de connexion...")
        // Redirect to login after a short delay to show success message
        setTimeout(() => {
          router.push("/login?message=account_created")
        }, 2000)
      }
    } catch (error) {
      console.error("❌ Signup exception:", error)
      setError("An unexpected error occurred")
    } finally {
      setLoading(false)
    }
  }

  // Check if error is about duplicate email
  const isEmailAlreadyExistsError = error && error.includes("compte avec cet email existe déjà")

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-soft-lg border-0">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">Créez votre compte NutriFlow</CardTitle>
          <CardDescription className="text-center">
            Entrez vos informations pour commencer avec votre cabinet de nutrition
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>
                  {error}
                  {isEmailAlreadyExistsError && (
                    <div className="mt-2">
                      <Link href="/login" className="text-emerald-600 hover:text-emerald-700 font-medium transition-colors duration-200">
                        Se connecter avec ce compte
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
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName" className="text-sm font-medium text-gray-700">Prénom</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="firstName"
                    type="text"
                    placeholder="Votre prénom"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="pl-10 text-base border-gray-200 focus:border-emerald-300 focus:ring-emerald-500/20"
                    required
                    disabled={loading}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName" className="text-sm font-medium text-gray-700">Nom</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="lastName"
                    type="text"
                    placeholder="Votre nom"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="pl-10 text-base border-gray-200 focus:border-emerald-300 focus:ring-emerald-500/20"
                    required
                    disabled={loading}
                  />
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium text-gray-700">Adresse email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="email"
                  type="email"
                  placeholder="votre@email.fr"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 text-base border-gray-200 focus:border-emerald-300 focus:ring-emerald-500/20"
                  required
                  disabled={loading}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium text-gray-700">Mot de passe</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="password"
                  type="password"
                  placeholder="Créer un mot de passe"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 text-base border-gray-200 focus:border-emerald-300 focus:ring-emerald-500/20"
                  required
                  disabled={loading}
                  minLength={6}
                />
              </div>
              <p className="text-xs text-gray-500">Le mot de passe doit contenir au moins 6 caractères</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="passwordConfirm" className="text-sm font-medium text-gray-700">Confirmer le mot de passe</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="passwordConfirm"
                  type="password"
                  placeholder="Confirmer votre mot de passe"
                  value={passwordConfirm}
                  onChange={(e) => setPasswordConfirm(e.target.value)}
                  className={`pl-10 pr-10 text-base border-gray-200 focus:border-emerald-300 focus:ring-emerald-500/20 ${
                    passwordConfirm && (password === passwordConfirm ? 'border-emerald-300' : 'border-red-300')
                  }`}
                  required
                  disabled={loading}
                  minLength={6}
                />
                {passwordConfirm && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    {password === passwordConfirm ? (
                      <CheckCircle className="h-4 w-4 text-emerald-500" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-500" />
                    )}
                  </div>
                )}
              </div>
              {passwordConfirm && password !== passwordConfirm && (
                <p className="text-xs text-red-500">Les mots de passe ne correspondent pas</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone" className="text-sm font-medium text-gray-700">Téléphone <span className="text-gray-400">(optionnel)</span></Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="phone"
                  type="tel"
                  placeholder="01 23 45 67 89"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="pl-10 text-base border-gray-200 focus:border-emerald-300 focus:ring-emerald-500/20"
                  disabled={loading}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="address" className="text-sm font-medium text-gray-700">Adresse <span className="text-gray-400">(optionnel)</span></Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="address"
                  type="text"
                  placeholder="Votre adresse professionnelle"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="pl-10 text-base border-gray-200 focus:border-emerald-300 focus:ring-emerald-500/20"
                  disabled={loading}
                />
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-2.5 transition-colors duration-200" disabled={loading || !firstName || !lastName || !email || !password || !passwordConfirm}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Création du compte...
                </>
              ) : (
                "Créer mon compte"
              )}
            </Button>
            <div className="text-center text-sm">
              Vous avez déjà un compte ?{" "}
              <Link href="/login" className="text-emerald-600 hover:text-emerald-700 font-medium transition-colors duration-200">
                Se connecter
              </Link>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
