"use client";

import type React from "react";
import { Suspense } from "react";

import { useClientAuth } from "@/components/auth/ClientAuthProvider";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuthNew";
import { Activity, Eye, EyeOff, Lock, Mail, Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

function LoginContent() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, signIn, loading: authLoading } = useAuth();
  const { isAuthenticated: isClientAuthenticated, isLoading: isClientLoading } =
    useClientAuth();

  // Redirect if nutritionist is already authenticated
  useEffect(() => {
    if (user && !authLoading) {
      router.push("/dashboard");
    }
  }, [user, authLoading, router]);

  // Redirect if client is authenticated - they shouldn't access nutritionist login
  useEffect(() => {
    if (isClientAuthenticated && !isClientLoading) {
      router.push("/client-portal");
    }
  }, [isClientAuthenticated, isClientLoading, router]);

  // Check for success message from signup or email confirmation
  useEffect(() => {
    const message = searchParams.get("message");
    if (message === "account_created") {
      setSuccessMessage("Compte créé avec succès ! Veuillez vérifier votre email pour confirmer votre compte avant de vous connecter.");
    } else if (message === "email_confirmed") {
      setSuccessMessage("Email confirmé avec succès ! Vous pouvez maintenant vous connecter.");
    }
    
    if (message) {
      // Clear the message from URL after showing it
      const url = new URL(window.location.href);
      url.searchParams.delete("message");
      window.history.replaceState({}, "", url.toString());
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    // Basic validation
    if (!email.trim() || !password.trim()) {
      setError("Veuillez remplir tous les champs");
      setLoading(false);
      return;
    }

    try {
      const { error } = await signIn(email, password);

      if (error) {
        setError(error || "Échec de la connexion");
      } else {
        // Success - redirect will happen via useEffect when user state updates
      }
    } catch (error) {
      setError("Une erreur inattendue s'est produite");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-emerald-100 rounded-full">
            <Activity className="h-8 w-8 text-emerald-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Connexion NutriFlow
            </h1>
            <p className="text-gray-600">
              Tableau de bord nutritionniste
            </p>
          </div>
        </div>

        {/* Login Card */}
        <Card className="shadow-soft-lg border-0">
          <CardHeader className="space-y-1 text-center">
            <CardTitle className="text-xl text-gray-900">
              Connexion
            </CardTitle>
            <CardDescription className="text-gray-600">
              Accédez à votre tableau de bord nutritionniste
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email Field */}
              <div className="space-y-2">
                <Label
                  htmlFor="email"
                  className="text-sm font-medium text-gray-700"
                >
                  Adresse email
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="votre@email.fr"
                    className="pl-10 border-gray-200 focus:border-emerald-300 focus:ring-emerald-500/20 text-base"
                    required
                    disabled={loading}
                  />
                </div>
              </div>

              {/* Password Field */}
              <div className="space-y-2">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-0">
                  <Label
                    htmlFor="password"
                    className="text-sm font-medium text-gray-700"
                  >
                    Mot de passe
                  </Label>
                  <Link
                    href="/forgot-password"
                    className="text-sm text-emerald-600 hover:text-emerald-700 transition-colors duration-200"
                  >
                    Mot de passe oublié ?
                  </Link>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Votre mot de passe"
                    className="pl-10 pr-10 border-gray-200 focus:border-emerald-300 focus:ring-emerald-500/20 text-base"
                    required
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    disabled={loading}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Success Message */}
              {successMessage && (
                <Alert className="border-emerald-200 bg-emerald-50 text-emerald-700">
                  <AlertDescription>{successMessage}</AlertDescription>
                </Alert>
              )}

              {/* Error Message */}
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={loading || !email || !password}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-2.5 transition-colors duration-200"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Connexion...
                  </>
                ) : (
                  "Se connecter"
                )}
              </Button>
            </form>

            {/* Footer Links */}
            <div className="mt-6 text-center space-y-3">
              <p className="text-sm text-gray-600">
                Vous n'avez pas de compte ?{" "}
                <Link
                  href="/signup"
                  className="text-emerald-600 hover:text-emerald-700 font-medium transition-colors duration-200"
                >
                  S'inscrire
                </Link>
              </p>
              <div className="pt-2 border-t border-gray-100">
                <Link
                  href="/"
                  className="text-sm text-emerald-600 hover:text-emerald-700 font-medium transition-colors duration-200"
                >
                  ← Retour au site principal
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-soft-lg border-0">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold text-center flex items-center justify-center">
              <Activity className="w-6 h-6 mr-2 text-emerald-600 animate-pulse" />
              Chargement...
            </CardTitle>
          </CardHeader>
        </Card>
      </div>
    }>
      <LoginContent />
    </Suspense>
  );
}