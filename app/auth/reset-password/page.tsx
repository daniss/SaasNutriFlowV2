"use client";

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
import { createClient } from "@/lib/supabase/client";
import { ArrowLeft, Lock } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type React from "react";
import { useEffect, useState } from "react";

// Create a separate Supabase client just for this page to avoid AuthProvider interference
const supabaseResetClient = createClient();

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [sessionSet, setSessionSet] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Check if we have a valid session for password reset
    const checkSession = async () => {
      try {
        const {
          data: { session },
          error,
        } = await supabaseResetClient.auth.getSession();

        console.log("Reset password session check:", {
          session: !!session,
          error,
        });

        if (error) {
          console.error("Session error:", error);
          setError(
            "Lien de réinitialisation expiré ou invalide. Veuillez demander un nouveau lien."
          );
          return;
        }

        if (!session) {
          setError(
            "Lien de réinitialisation expiré ou invalide. Veuillez demander un nouveau lien."
          );
          return;
        }

        // Check if this is actually a recovery session
        const {
          data: { user },
        } = await supabaseResetClient.auth.getUser();
        if (!user) {
          setError(
            "Lien de réinitialisation expiré ou invalide. Veuillez demander un nouveau lien."
          );
          return;
        }

        console.log("Valid recovery session found");
        setSessionSet(true);
      } catch (err) {
        console.error("Session check error:", err);
        setError(
          "Lien de réinitialisation expiré ou invalide. Veuillez demander un nouveau lien."
        );
      }
    };

    checkSession();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    // Basic validation
    if (!password.trim() || !confirmPassword.trim()) {
      setError("Veuillez remplir tous les champs");
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setError("Le mot de passe doit contenir au moins 6 caractères");
      setLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError("Les mots de passe ne correspondent pas");
      setLoading(false);
      return;
    }

    try {
      console.log("Updating password...");
      const { error } = await supabaseResetClient.auth.updateUser({
        password: password,
      });

      if (error) {
        console.error("Password update error:", error);
        setError(
          "Erreur lors de la mise à jour du mot de passe: " + error.message
        );
      } else {
        console.log(
          "Password updated successfully, redirecting to dashboard..."
        );
        setSuccess(
          "Mot de passe mis à jour avec succès ! Connexion en cours..."
        );

        // Small delay for user feedback, then redirect to dashboard
        setTimeout(() => {
          router.push("/dashboard");
        }, 1000);
      }
    } catch (error) {
      console.error("❌ Password update exception:", error);
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
            <Lock className="h-8 w-8 text-emerald-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Nouveau mot de passe
            </h1>
            <p className="text-gray-600">
              Définissez votre nouveau mot de passe
            </p>
          </div>
        </div>

        {/* Reset Password Card */}
        <Card className="shadow-soft-lg border-0">
          <CardHeader className="space-y-1 text-center">
            <CardTitle className="text-xl text-gray-900">
              Réinitialisation
            </CardTitle>
            <CardDescription className="text-gray-600">
              Choisissez un nouveau mot de passe sécurisé pour votre compte
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Error Message */}
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-600">{error}</p>
                  {error.includes("invalide") && (
                    <div className="mt-2">
                      <Link
                        href="/forgot-password"
                        className="text-emerald-600 hover:text-emerald-700 font-medium transition-colors duration-200"
                      >
                        Demander un nouveau lien de réinitialisation
                      </Link>
                    </div>
                  )}
                </div>
              )}

              {/* Success Message */}
              {success && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
                  <p className="text-sm text-emerald-600">{success}</p>
                </div>
              )}

              {/* Password Fields - Only show if no error */}
              {!error && (
                <div className="space-y-4">
                  {/* New Password Field */}
                  <div className="space-y-2">
                    <Label
                      htmlFor="password"
                      className="text-sm font-medium text-gray-700"
                    >
                      Nouveau mot de passe
                    </Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        id="password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Entrez votre nouveau mot de passe"
                        className="pl-10 border-gray-200 focus:border-emerald-300 focus:ring-emerald-500/20"
                        required
                        disabled={loading}
                      />
                    </div>
                  </div>

                  {/* Confirm Password Field */}
                  <div className="space-y-2">
                    <Label
                      htmlFor="confirmPassword"
                      className="text-sm font-medium text-gray-700"
                    >
                      Confirmer le mot de passe
                    </Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        id="confirmPassword"
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Confirmez votre nouveau mot de passe"
                        className="pl-10 border-gray-200 focus:border-emerald-300 focus:ring-emerald-500/20"
                        required
                        disabled={loading}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Submit Button - Only show if no error */}
              {!error && (
                <Button
                  type="submit"
                  disabled={loading || !password || !confirmPassword}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-2.5 transition-colors duration-200"
                >
                  {loading ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Mise à jour en cours...
                    </div>
                  ) : (
                    "Mettre à jour le mot de passe"
                  )}
                </Button>
              )}
            </form>

            {/* Footer Links */}
            <div className="mt-6 text-center space-y-3">
              <Link
                href="/login"
                className="inline-flex items-center text-emerald-600 hover:text-emerald-700 font-medium transition-colors duration-200"
              >
                <ArrowLeft className="mr-1 h-4 w-4" />
                Retour à la connexion
              </Link>
              <br />
              <Link
                href="/"
                className="text-sm text-emerald-600 hover:text-emerald-700 font-medium transition-colors duration-200"
              >
                ← Retour au site principal
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
