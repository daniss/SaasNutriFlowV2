"use client";

import type React from "react";

import { DashboardHeader } from "@/components/dashboard-header";
import { PasswordSettings } from "@/components/security/PasswordSettings";
import { TwoFactorSettings } from "@/components/security/TwoFactorSettings";
import { SubscriptionStatusCard } from "@/components/dashboard/SubscriptionStatusCard";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/useAuthNew";
import {
  Bell,
  CreditCard,
  FileText,
  Loader2,
  Mail,
  MapPin,
  // MASKED FOR MVP - Palette icon removed (client portal customization)
  // Palette,
  Phone,
  Save,
  Shield,
  User,
} from "lucide-react";
import { useEffect, useState } from "react";

export default function SettingsPage() {
  const { user, profile, updateProfile, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  // Profile form state
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [title, setTitle] = useState("");
  const [bio, setBio] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [zipCode, setZipCode] = useState("");

  // Notification preferences
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [smsNotifications, setSmsNotifications] = useState(false);
  const [appointmentReminders, setAppointmentReminders] = useState(true);
  const [marketingEmails, setMarketingEmails] = useState(false);

  // Load profile data when component mounts
  useEffect(() => {
    if (profile) {
      setFirstName(profile.first_name || "");
      setLastName(profile.last_name || "");
      setEmail(profile.email || "");
      setPhone(profile.phone || "");
      setTitle(profile.title || "");
      setBio(profile.bio || "");
      setAddress(profile.address || "");
      setCity(profile.city || "");
      setState(profile.state || "");
      setZipCode(profile.zip_code || "");
    }
    if (user) {
      setEmail(user.email || "");
    }
  }, [profile, user]);

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

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
      };

      const { error } = await updateProfile(updates);

      if (error) {
        setError(error);
      } else {
        setSuccess("Profil mis à jour avec succès !");
        setTimeout(() => setSuccess(""), 3000);
      }
    } catch (err) {
      setError("Échec de la mise à jour du profil");
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="flex-1 min-h-screen bg-gradient-to-br from-gray-50/50 via-white to-emerald-50/20 flex items-center justify-center">
        <div className="flex items-center gap-3">
          <Loader2 className="h-6 w-6 animate-spin text-emerald-600" />
          <span className="text-gray-600 font-medium">
            Chargement des paramètres...
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <DashboardHeader
        title="Paramètres"
        subtitle="Gérez les paramètres de votre compte et vos préférences"
        showSearch={false}
      />

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

      <Tabs
        defaultValue="profile"
        className="space-y-6 animate-slide-up animate-delay-100"
      >
        <TabsList className="grid grid-cols-4 w-full max-w-2xl">
          <TabsTrigger value="profile" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
            <User className="h-4 w-4" />
            <span className="hidden sm:inline">Profil</span>
            <span className="sm:hidden">Profil</span>
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
            <Shield className="h-4 w-4" />
            <span className="hidden sm:inline">Sécurité</span>
            <span className="sm:hidden">Sécurité</span>
          </TabsTrigger>
          <TabsTrigger value="gdpr" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
            <FileText className="h-4 w-4" />
            <span className="hidden sm:inline">RGPD</span>
            <span className="sm:hidden">RGPD</span>
          </TabsTrigger>
          <TabsTrigger value="billing" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
            <CreditCard className="h-4 w-4" />
            <span className="hidden sm:inline">Abonnement</span>
            <span className="sm:hidden">Abo</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-8">
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
                    <Label
                      htmlFor="firstName"
                      className="text-sm font-semibold text-gray-700"
                    >
                      Prénom
                    </Label>
                    <Input
                      id="firstName"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder="Entrez votre prénom"
                      className="border-gray-200 focus:border-emerald-300 focus:ring-emerald-500/20 text-base"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label
                      htmlFor="lastName"
                      className="text-sm font-semibold text-gray-700"
                    >
                      Nom de famille
                    </Label>
                    <Input
                      id="lastName"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      placeholder="Entrez votre nom de famille"
                      className="border-gray-200 focus:border-emerald-300 focus:ring-emerald-500/20 text-base"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label
                      htmlFor="email"
                      className="text-sm font-semibold text-gray-700"
                    >
                      Email
                    </Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="email"
                        type="email"
                        value={email}
                        className="pl-10 border-gray-200 bg-gray-50 text-gray-500 text-base"
                        disabled
                        placeholder="L'email ne peut pas être modifié"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label
                      htmlFor="phone"
                      className="text-sm font-semibold text-gray-700"
                    >
                      Numéro de téléphone
                    </Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="phone"
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="pl-10 border-gray-200 focus:border-emerald-300 focus:ring-emerald-500/20 text-base"
                        placeholder="Entrez votre numéro de téléphone"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="title"
                    className="text-sm font-semibold text-gray-700"
                  >
                    Titre professionnel
                  </Label>
                  <Input
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="ex. Diététicien(ne) agréé(e), Nutritionniste"
                    className="border-gray-200 focus:border-emerald-300 focus:ring-emerald-500/20 text-base"
                  />
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="bio"
                    className="text-sm font-semibold text-gray-700"
                  >
                    Biographie
                  </Label>
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
                      className="text-base"
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="city">Ville</Label>
                      <Input
                        id="city"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        placeholder="Ville"
                        className="text-base"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="state">Région/État</Label>
                      <Input
                        id="state"
                        value={state}
                        onChange={(e) => setState(e.target.value)}
                        placeholder="Région"
                        className="text-base"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="zipCode">Code postal</Label>
                      <Input
                        id="zipCode"
                        value={zipCode}
                        onChange={(e) => setZipCode(e.target.value)}
                        placeholder="Code postal"
                        className="text-base"
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
                Choisissez comment vous souhaitez être notifié des mises à jour
                importantes
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Notifications par email</Label>
                  <p className="text-sm text-muted-foreground">
                    Recevoir des notifications par email
                  </p>
                </div>
                <Switch
                  checked={emailNotifications}
                  onCheckedChange={setEmailNotifications}
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Notifications SMS</Label>
                  <p className="text-sm text-muted-foreground">
                    Recevoir des notifications par message texte
                  </p>
                </div>
                <Switch
                  checked={smsNotifications}
                  onCheckedChange={setSmsNotifications}
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Rappels de rendez-vous</Label>
                  <p className="text-sm text-muted-foreground">
                    Être rappelé des rendez-vous à venir
                  </p>
                </div>
                <Switch
                  checked={appointmentReminders}
                  onCheckedChange={setAppointmentReminders}
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Emails marketing</Label>
                  <p className="text-sm text-muted-foreground">
                    Recevoir des mises à jour sur les nouvelles fonctionnalités
                    et conseils
                  </p>
                </div>
                <Switch
                  checked={marketingEmails}
                  onCheckedChange={setMarketingEmails}
                />
              </div>
            </CardContent>
          </Card>

          {/* MASKED FOR MVP - Notification Providers Configuration will be added in future
          <Card className="border-0 shadow-soft bg-white/90 backdrop-blur-sm">
            <CardHeader className="pb-6">
              <CardTitle className="flex items-center gap-3 text-lg font-semibold text-gray-900">
                <div className="h-10 w-10 bg-purple-100 rounded-xl flex items-center justify-center">
                  <Mail className="h-5 w-5 text-purple-600" />
                </div>
                Configuration des fournisseurs de notification
              </CardTitle>
              <CardDescription className="text-gray-600 leading-relaxed">
                Configurez vos fournisseurs d'email et SMS pour l'envoi de
                notifications
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              ... [All notification provider fields removed for MVP]
            </CardContent>
          </Card>
          */}

          {/* MASKED FOR MVP - Client Portal Customization will be added in future
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
              ... [All portal customization fields removed for MVP]
            </CardContent>
          </Card>
          */}
        </TabsContent>

        <TabsContent value="security" className="space-y-8">
          <PasswordSettings />
          <TwoFactorSettings />
        </TabsContent>

        <TabsContent value="gdpr" className="space-y-8">
          {/* GDPR Compliance Information */}
          <Card className="border-0 shadow-soft bg-white/90 backdrop-blur-sm">
            <CardHeader className="pb-6">
              <CardTitle className="flex items-center gap-3 text-lg font-semibold text-gray-900">
                <div className="h-10 w-10 bg-blue-100 rounded-xl flex items-center justify-center">
                  <FileText className="h-5 w-5 text-blue-600" />
                </div>
                Conformité RGPD
              </CardTitle>
              <CardDescription className="text-gray-600 leading-relaxed">
                Gestion des données personnelles et conformité réglementaire
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-2">
                  Demandes de données de vos clients
                </h4>
                <p className="text-sm text-blue-800 mb-3">
                  Vos clients peuvent demander l'export ou la suppression de leurs données via leur portail client. 
                  Ces demandes vous seront automatiquement transmises par email.
                </p>
                <p className="text-xs text-blue-700">
                  ✓ Export de données : Traitement automatique sous 48h<br/>
                  ✓ Suppression de données : Contactez le support pour assistance<br/>
                  ✓ Gestion des consentements : Disponible dans le portail client
                </p>
              </div>

              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
                <h4 className="font-medium text-emerald-900 mb-2">
                  Conservation des données
                </h4>
                <div className="text-sm text-emerald-800 space-y-1">
                  <p>• <strong>Données client :</strong> 7 ans après fin de suivi</p>
                  <p>• <strong>Données de santé :</strong> 10 ans (obligation légale)</p>
                  <p>• <strong>Messages :</strong> 3 ans après dernier échange</p>
                  <p>• <strong>Photos :</strong> Jusqu'à révocation du consentement</p>
                </div>
              </div>

              <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-2">
                  Support RGPD
                </h4>
                <p className="text-sm text-gray-700 mb-3">
                  Pour toute demande RGPD complexe ou assistance avec la conformité, contactez notre équipe support.
                </p>
                <Button 
                  variant="outline" 
                  className="w-full sm:w-auto"
                  onClick={() => window.location.href = 'mailto:contact@nutri-flow.me?subject=Demande%20RGPD%20-%20Support'}
                >
                  <Mail className="mr-2 h-4 w-4" />
                  Contacter le support RGPD
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="billing" className="space-y-8">
          <SubscriptionStatusCard showUsage={true} showActions={true} variant="default" />
        </TabsContent>

      </Tabs>
    </div>
  );
}
