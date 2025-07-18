"use client";

import type React from "react";

import { useClientAuth } from "@/components/auth/ClientAuthProvider";
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
import { useAuth } from "@/hooks/useAuthNew";
import { useTwoStepAuth } from "@/hooks/useTwoStepAuth";
import { Activity, Eye, EyeOff, Lock, Mail, Shield } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [twoFACode, setTwoFACode] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { isAuthenticated: isClientAuthenticated, isLoading: isClientLoading } =
    useClientAuth();
  const { authState, validateCredentials, verifyAndComplete, resetAuth } =
    useTwoStepAuth();

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

  // Handle two-step auth completion
  useEffect(() => {
    if (authState.step === "complete") {
      console.log("🔗 Two-step auth completed, redirecting to dashboard");
      router.push("/dashboard");
    }
  }, [authState.step, router]);

  const handleCredentialsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const result = await validateCredentials(email, password);

      if (
        result.success &&
        "requiresVerification" in result &&
        result.requiresVerification
      ) {
        // Move to 2FA step - the hook manages the state
        console.log("Credentials validated, waiting for 2FA");
      } else if (result.success) {
        // Direct login (2FA disabled) - redirect will happen via useEffect
        console.log("Direct login successful");
      }
      // Errors are handled by the hook's authState
    } catch (error) {
      console.error("❌ Credential validation exception:", error);
    }
  };

  const handleTwoFASubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      console.log("🔐 Submitting 2FA code:", twoFACode);
      const result = await verifyAndComplete(twoFACode);
      console.log("🔐 2FA verification result:", result);

      if (result.success) {
        console.log("✅ Two-step authentication successful");
        // Clear the 2FA code input
        setTwoFACode("");

        // Small delay to ensure auth state updates, then redirect
        setTimeout(() => {
          console.log("🚀 Redirecting to dashboard after auth state update");
          router.push("/dashboard");
        }, 100);

        // Also try immediate redirect as backup
        router.push("/dashboard");
      } else {
        console.error("❌ 2FA verification failed:", result.error);
        setTwoFACode(""); // Clear on failure
      }
      // Errors are handled by the hook's authState
    } catch (error) {
      console.error("❌ 2FA verification exception:", error);
      setTwoFACode("");
    }
  };

  const isCredentialsStep = authState.step === "credentials";
  const is2FAStep = authState.step === "verification";

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-emerald-100 rounded-full">
            {is2FAStep ? (
              <Shield className="h-8 w-8 text-emerald-600" />
            ) : (
              <Activity className="h-8 w-8 text-emerald-600" />
            )}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {is2FAStep ? "Vérification de sécurité" : "Connexion NutriFlow"}
            </h1>
            <p className="text-gray-600">
              {is2FAStep
                ? "Saisissez le code envoyé par email"
                : "Tableau de bord nutritionniste"}
            </p>
          </div>
        </div>

        {/* Login Card */}
        <Card className="shadow-soft-lg border-0">
          <CardHeader className="space-y-1 text-center">
            <CardTitle className="text-xl text-gray-900">
              {is2FAStep ? "Code de vérification" : "Connexion"}
            </CardTitle>
            <CardDescription className="text-gray-600">
              {is2FAStep
                ? `Code envoyé à ${authState.email?.replace(
                    /(.{2})(.*)(@.*)/,
                    "$1***$3"
                  )}`
                : "Accédez à votre tableau de bord nutritionniste"}
            </CardDescription>
          </CardHeader>

          <CardContent>
            {isCredentialsStep && (
              <form onSubmit={handleCredentialsSubmit} className="space-y-4">
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
                      disabled={authState.loading}
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
                      disabled={authState.loading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      disabled={authState.loading}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Error Message */}
                {authState.error && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-600">{authState.error}</p>
                  </div>
                )}

                {/* Submit Button */}
                <Button
                  type="submit"
                  disabled={authState.loading || !email || !password}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-2.5 transition-colors duration-200"
                >
                  {authState.loading ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Vérification...
                    </div>
                  ) : (
                    "Se connecter"
                  )}
                </Button>
              </form>
            )}

            {is2FAStep && (
              <form onSubmit={handleTwoFASubmit} className="space-y-4">
                {/* 2FA Code Field */}
                <div className="space-y-2">
                  <Label
                    htmlFor="twoFACode"
                    className="text-sm font-medium text-gray-700"
                  >
                    Code de vérification
                  </Label>
                  <div className="relative">
                    <Shield className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="twoFACode"
                      type="text"
                      value={twoFACode}
                      onChange={(e) =>
                        setTwoFACode(
                          e.target.value.replace(/\D/g, "").slice(0, 6)
                        )
                      }
                      placeholder="123456"
                      className="pl-10 border-gray-200 focus:border-emerald-300 focus:ring-emerald-500/20 text-center font-mono text-lg tracking-widest text-base"
                      required
                      disabled={authState.loading}
                      maxLength={6}
                    />
                  </div>
                </div>

                {/* Error Message */}
                {authState.error && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-600">{authState.error}</p>
                  </div>
                )}

                {/* Submit Button */}
                <Button
                  type="submit"
                  disabled={authState.loading || twoFACode.length !== 6}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-2.5 transition-colors duration-200"
                >
                  {authState.loading ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Vérification...
                    </div>
                  ) : (
                    "Vérifier le code"
                  )}
                </Button>

                {/* Back button */}
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setTwoFACode("");
                    resetAuth();
                  }}
                  className="w-full"
                  disabled={authState.loading}
                >
                  Retour
                </Button>
              </form>
            )}

            {/* Footer Links - only show in credentials step */}
            {isCredentialsStep && (
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
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
