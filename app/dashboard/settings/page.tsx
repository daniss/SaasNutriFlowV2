"use client"

import type React from "react"

import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { useAuth } from "@/hooks/useAuthNew"
import { Bell, Loader2, Mail, MapPin, Palette, Phone, Save, Shield, User } from "lucide-react"
import { useEffect, useState } from "react"

export default function SettingsPage() {
  const { user, profile, updateProfile, loading: authLoading } = useAuth()
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState("")
  const [error, setError] = useState("")

  // Profile form state
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [title, setTitle] = useState("")
  const [bio, setBio] = useState("")
  const [address, setAddress] = useState("")
  const [city, setCity] = useState("")
  const [state, setState] = useState("")
  const [zipCode, setZipCode] = useState("")

  // Notification preferences
  const [emailNotifications, setEmailNotifications] = useState(true)
  const [smsNotifications, setSmsNotifications] = useState(false)
  const [appointmentReminders, setAppointmentReminders] = useState(true)
  const [marketingEmails, setMarketingEmails] = useState(false)

  // Load profile data when component mounts
  useEffect(() => {
    if (profile) {
      setFirstName(profile.first_name || "")
      setLastName(profile.last_name || "")
      setEmail(profile.email || "")
      setPhone(profile.phone || "")
      setTitle(profile.title || "")
      setBio(profile.bio || "")
      setAddress(profile.address || "")
      setCity(profile.city || "")
      setState(profile.state || "")
      setZipCode(profile.zip_code || "")
    }
    if (user) {
      setEmail(user.email || "")
    }
  }, [profile, user])

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    setSuccess("")

    try {
      const updates = {
        first_name: firstName,
        last_name: lastName,
        phone,
        title,
        bio,
        address,
        city,
        state,
        zip_code: zipCode,
      }

      const { error } = await updateProfile(updates)

      if (error) {
        setError(error)
      } else {
        setSuccess("Profil mis à jour avec succès !")
        setTimeout(() => setSuccess(""), 3000)
      }
    } catch (err) {
      setError("Échec de la mise à jour du profil")
    } finally {
      setLoading(false)
    }
  }

  if (authLoading) {
    return (
      <div className="flex-1 min-h-screen bg-gradient-to-br from-gray-50/50 via-white to-emerald-50/20 flex items-center justify-center">
        <div className="flex items-center gap-3">
          <Loader2 className="h-6 w-6 animate-spin text-emerald-600" />
          <span className="text-gray-600 font-medium">Chargement des paramètres...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 space-y-8 p-6 lg:p-8 bg-gradient-to-br from-gray-50/50 via-white to-emerald-50/20 min-h-screen">
      {/* Header Section */}
      <div className="space-y-2 animate-fade-in">
        <h1 className="text-2xl lg:text-3xl font-semibold tracking-tight text-gray-900">
          Paramètres
        </h1>
        <p className="text-gray-600 text-sm lg:text-base font-medium">
          Gérez les paramètres de votre compte et vos préférences
        </p>
      </div>

      {success && (
        <Alert className="border-emerald-200 bg-emerald-50 text-emerald-800 animate-scale-in">
          <AlertDescription className="font-medium">{success}</AlertDescription>
        </Alert>
      )}

      {error && (
        <Alert variant="destructive" className="animate-scale-in">
          <AlertDescription className="font-medium">{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid gap-8 animate-slide-up animate-delay-100">
        {/* Profile Information */}
        <Card className="border-0 shadow-soft bg-white/90 backdrop-blur-sm">
          <CardHeader className="pb-6">
            <CardTitle className="flex items-center gap-3 text-lg font-semibold text-gray-900">
              <div className="h-10 w-10 bg-emerald-100 rounded-xl flex items-center justify-center">
                <User className="h-5 w-5 text-emerald-600" />
              </div>
              Informations du profil
            </CardTitle>
            <CardDescription className="text-gray-600 leading-relaxed">
              Mettez à jour vos informations personnelles et professionnelles
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleProfileUpdate} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName" className="text-sm font-semibold text-gray-700">Prénom</Label>
                  <Input
                    id="firstName"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="Entrez votre prénom"
                    className="border-gray-200 focus:border-emerald-300 focus:ring-emerald-500/20"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName" className="text-sm font-semibold text-gray-700">Nom de famille</Label>
                  <Input
                    id="lastName"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Entrez votre nom de famille"
                    className="border-gray-200 focus:border-emerald-300 focus:ring-emerald-500/20"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-semibold text-gray-700">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      className="pl-10 border-gray-200 bg-gray-50 text-gray-500"
                      disabled
                      placeholder="L'email ne peut pas être modifié"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-sm font-semibold text-gray-700">Numéro de téléphone</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="phone"
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="pl-10 border-gray-200 focus:border-emerald-300 focus:ring-emerald-500/20"
                      placeholder="Entrez votre numéro de téléphone"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="title" className="text-sm font-semibold text-gray-700">Titre professionnel</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="ex. Diététicien(ne) agréé(e), Nutritionniste"
                  className="border-gray-200 focus:border-emerald-300 focus:ring-emerald-500/20"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="bio" className="text-sm font-semibold text-gray-700">Biographie</Label>
                <Textarea
                  id="bio"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Parlez-vous à vos clients de vous et de votre expertise"
                  rows={4}
                  className="border-gray-200 focus:border-emerald-300 focus:ring-emerald-500/20 resize-none"
                />
              </div>

              <Separator />

              <div className="space-y-4">
                <h4 className="font-medium flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Informations d'adresse
                </h4>
                <div className="space-y-2">
                  <Label htmlFor="address">Adresse</Label>
                  <Input
                    id="address"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Entrez votre adresse"
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="city">Ville</Label>
                    <Input id="city" value={city} onChange={(e) => setCity(e.target.value)} placeholder="Ville" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="state">Région/État</Label>
                    <Input id="state" value={state} onChange={(e) => setState(e.target.value)} placeholder="Région" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="zipCode">Code postal</Label>
                    <Input
                      id="zipCode"
                      value={zipCode}
                      onChange={(e) => setZipCode(e.target.value)}
                      placeholder="Code postal"
                    />
                  </div>
                </div>
              </div>

              <Button 
                type="submit" 
                disabled={loading} 
                className="w-full md:w-auto bg-emerald-600 hover:bg-emerald-700 text-white shadow-soft hover:shadow-soft-lg transition-all duration-200 font-medium"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Enregistrement...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Enregistrer les modifications
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Notification Preferences */}
        <Card className="border-0 shadow-soft bg-white/90 backdrop-blur-sm">
          <CardHeader className="pb-6">
            <CardTitle className="flex items-center gap-3 text-lg font-semibold text-gray-900">
              <div className="h-10 w-10 bg-blue-100 rounded-xl flex items-center justify-center">
                <Bell className="h-5 w-5 text-blue-600" />
              </div>
              Préférences de notification
            </CardTitle>
            <CardDescription className="text-gray-600 leading-relaxed">
              Choisissez comment vous souhaitez être notifié des mises à jour importantes
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Notifications par email</Label>
                <p className="text-sm text-muted-foreground">Recevoir des notifications par email</p>
              </div>
              <Switch checked={emailNotifications} onCheckedChange={setEmailNotifications} />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Notifications SMS</Label>
                <p className="text-sm text-muted-foreground">Recevoir des notifications par message texte</p>
              </div>
              <Switch checked={smsNotifications} onCheckedChange={setSmsNotifications} />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Rappels de rendez-vous</Label>
                <p className="text-sm text-muted-foreground">Être rappelé des rendez-vous à venir</p>
              </div>
              <Switch checked={appointmentReminders} onCheckedChange={setAppointmentReminders} />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Emails marketing</Label>
                <p className="text-sm text-muted-foreground">Recevoir des mises à jour sur les nouvelles fonctionnalités et conseils</p>
              </div>
              <Switch checked={marketingEmails} onCheckedChange={setMarketingEmails} />
            </div>
          </CardContent>
        </Card>

        {/* Notification Providers Configuration */}
        <Card className="border-0 shadow-soft bg-white/90 backdrop-blur-sm">
          <CardHeader className="pb-6">
            <CardTitle className="flex items-center gap-3 text-lg font-semibold text-gray-900">
              <div className="h-10 w-10 bg-purple-100 rounded-xl flex items-center justify-center">
                <Mail className="h-5 w-5 text-purple-600" />
              </div>
              Configuration des fournisseurs de notification
            </CardTitle>
            <CardDescription className="text-gray-600 leading-relaxed">
              Configurez vos fournisseurs d'email et SMS pour l'envoi de notifications
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <h4 className="font-medium text-gray-900">Fournisseurs d'email</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="sendgridApi" className="text-sm font-semibold text-gray-700">SendGrid API Key</Label>
                  <Input
                    id="sendgridApi"
                    type="password"
                    placeholder="sg-xxxxxxxxxxxxxxxxxxxx"
                    className="border-gray-200 focus:border-purple-300 focus:ring-purple-500/20"
                  />
                  <p className="text-xs text-gray-500">Clé API SendGrid pour l'envoi d'emails</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="resendApi" className="text-sm font-semibold text-gray-700">Resend API Key</Label>
                  <Input
                    id="resendApi"
                    type="password"
                    placeholder="re_xxxxxxxxxxxxxxxxxxxx"
                    className="border-gray-200 focus:border-purple-300 focus:ring-purple-500/20"
                  />
                  <p className="text-xs text-gray-500">Clé API Resend pour l'envoi d'emails</p>
                </div>
              </div>
            </div>
            
            <Separator />
            
            <div className="space-y-4">
              <h4 className="font-medium text-gray-900">Fournisseurs SMS</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="twilioSid" className="text-sm font-semibold text-gray-700">Twilio Account SID</Label>
                  <Input
                    id="twilioSid"
                    type="password"
                    placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                    className="border-gray-200 focus:border-purple-300 focus:ring-purple-500/20"
                  />
                  <p className="text-xs text-gray-500">SID de compte Twilio</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="twilioToken" className="text-sm font-semibold text-gray-700">Twilio Auth Token</Label>
                  <Input
                    id="twilioToken"
                    type="password"
                    placeholder="Token d'authentification"
                    className="border-gray-200 focus:border-purple-300 focus:ring-purple-500/20"
                  />
                  <p className="text-xs text-gray-500">Token d'authentification Twilio</p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="ovhApiKey" className="text-sm font-semibold text-gray-700">OVH SMS API Key</Label>
                  <Input
                    id="ovhApiKey"
                    type="password"
                    placeholder="Clé API OVH SMS"
                    className="border-gray-200 focus:border-purple-300 focus:ring-purple-500/20"
                  />
                  <p className="text-xs text-gray-500">Clé API OVH pour SMS</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ovhApiSecret" className="text-sm font-semibold text-gray-700">OVH SMS API Secret</Label>
                  <Input
                    id="ovhApiSecret"
                    type="password"
                    placeholder="Secret API OVH SMS"
                    className="border-gray-200 focus:border-purple-300 focus:ring-purple-500/20"
                  />
                  <p className="text-xs text-gray-500">Secret API OVH pour SMS</p>
                </div>
              </div>
            </div>
            
            <Separator />
            
            <div className="space-y-4">
              <h4 className="font-medium text-gray-900">Fournisseurs de paiement</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="stripeKey" className="text-sm font-semibold text-gray-700">Stripe Secret Key</Label>
                  <Input
                    id="stripeKey"
                    type="password"
                    placeholder="sk_test_xxxxxxxxxxxxxxxxxxxx"
                    className="border-gray-200 focus:border-purple-300 focus:ring-purple-500/20"
                  />
                  <p className="text-xs text-gray-500">Clé secrète Stripe pour les paiements</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="paypalClientId" className="text-sm font-semibold text-gray-700">PayPal Client ID</Label>
                  <Input
                    id="paypalClientId"
                    type="password"
                    placeholder="Client ID PayPal"
                    className="border-gray-200 focus:border-purple-300 focus:ring-purple-500/20"
                  />
                  <p className="text-xs text-gray-500">ID client PayPal pour les paiements</p>
                </div>
              </div>
            </div>

            <Alert>
              <AlertDescription>
                <strong>Note de sécurité :</strong> Ces clés API sont sensibles et doivent être conservées en toute sécurité. 
                Utilisez des variables d'environnement pour les stocker en production.
              </AlertDescription>
            </Alert>
            
            <Button className="bg-purple-600 hover:bg-purple-700 text-white shadow-soft transition-all duration-200">
              <Save className="mr-2 h-4 w-4" />
              Sauvegarder la configuration
            </Button>
          </CardContent>
        </Card>

        {/* Security Settings */}
        <Card className="border-0 shadow-soft bg-white/90 backdrop-blur-sm">
          <CardHeader className="pb-6">
            <CardTitle className="flex items-center gap-3 text-lg font-semibold text-gray-900">
              <div className="h-10 w-10 bg-orange-100 rounded-xl flex items-center justify-center">
                <Shield className="h-5 w-5 text-orange-600" />
              </div>
              Paramètres de sécurité
            </CardTitle>
            <CardDescription className="text-gray-600 leading-relaxed">
              Gérez la sécurité et la confidentialité de votre compte
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Mot de passe</Label>
              <p className="text-sm text-muted-foreground">Dernière modification : Jamais</p>
              <Button variant="outline" size="sm" className="border-gray-200 hover:bg-gray-50 hover:shadow-soft transition-all duration-200">
                Changer le mot de passe
              </Button>
            </div>
            <Separator />
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-gray-700">Authentification à deux facteurs</Label>
              <p className="text-sm text-gray-600">Ajoutez une couche de sécurité supplémentaire à votre compte</p>
              <Button variant="outline" size="sm" className="border-gray-200 hover:bg-gray-50 hover:shadow-soft transition-all duration-200">
                Activer l'A2F
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Client Portal Customization */}
        <Card className="border-0 shadow-soft bg-white/90 backdrop-blur-sm">
          <CardHeader className="pb-6">
            <CardTitle className="flex items-center gap-3 text-lg font-semibold text-gray-900">
              <div className="h-10 w-10 bg-purple-100 rounded-xl flex items-center justify-center">
                <Palette className="h-5 w-5 text-purple-600" />
              </div>
              Personnalisation du portail client
            </CardTitle>
            <CardDescription className="text-gray-600 leading-relaxed">
              Personnalisez l'apparence de votre portail client
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="portalTitle">Titre du portail</Label>
              <Input id="portalTitle" placeholder="Nom de votre cabinet" defaultValue="Portail Client NutriFlow" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="welcomeMessage">Message de bienvenue</Label>
              <Textarea
                id="welcomeMessage"
                placeholder="Message de bienvenue pour vos clients"
                defaultValue="Bienvenue sur votre portail de nutrition personnalisé !"
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label>Couleurs de marque</Label>
              <div className="flex gap-2">
                <div className="w-8 h-8 rounded bg-emerald-500 border-2 border-gray-300"></div>
                <div className="w-8 h-8 rounded bg-blue-500 border"></div>
                <div className="w-8 h-8 rounded bg-purple-500 border"></div>
                <div className="w-8 h-8 rounded bg-orange-500 border"></div>
              </div>
            </div>
            <Button variant="outline" size="sm">
              Aperçu du portail
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
