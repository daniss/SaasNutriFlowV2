"use client";

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
import { useSupabaseTOTP } from "@/hooks/useSupabaseTOTP";
import { createClient } from "@/lib/supabase/client";
import { AlertTriangle, Shield, Smartphone, LogOut } from "lucide-react";
import { useEffect, useState } from "react";

interface TOTPVerificationDialogProps {
  onVerificationSuccess: () => void;
  onCancel: () => void;
}

export function TOTPVerificationDialog({
  onVerificationSuccess,
  onCancel,
}: TOTPVerificationDialogProps) {
  const { challengeTOTP, verifyTOTPChallenge, status } = useSupabaseTOTP();
  const supabase = createClient();
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [challengeData, setChallengeData] = useState<{
    challengeId: string;
    factorId: string;
  } | null>(null);

  useEffect(() => {
    // Wait for factors to load before making decisions
    if (status.loading) return;
    
    // Check if there are verified factors
    const verifiedFactors = status.factors.filter(f => f.status === "verified");
    
    if (verifiedFactors.length > 0) {
      initializeChallenge();
    } else {
      // Gracefully handle case where dialog shown without verified factors
      console.warn("🔐 TOTP Dialog shown without verified factors - calling onCancel to exit gracefully");
      setError("Aucune méthode de vérification disponible");
      // Don't force logout - let parent handle this gracefully
      setTimeout(() => {
        onCancel(); // Let TwoFactorProvider handle this
      }, 1000);
    }
  }, [status.loading, status.factors, onCancel]);

  const initializeChallenge = async () => {
    setLoading(true);
    try {
      const challenge = await challengeTOTP();
      if (challenge) {
        setChallengeData(challenge);
      } else {
        setError("Aucun facteur TOTP configuré trouvé");
      }
    } catch (error) {
      console.error("Error initializing TOTP challenge:", error);
      setError("Erreur lors de l'initialisation de la vérification");
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    if (!challengeData || !code) return;

    setLoading(true);
    setError("");

    try {
      const success = await verifyTOTPChallenge(
        challengeData.challengeId,
        challengeData.factorId,
        code
      );

      if (success) {
        onVerificationSuccess();
      } else {
        setError("Code de vérification incorrect");
        setCode("");
        // Create a new challenge for the next attempt
        await initializeChallenge();
      }
    } catch (error) {
      console.error("Error verifying TOTP:", error);
      setError("Erreur lors de la vérification");
    } finally {
      setLoading(false);
    }
  };

  const handleCodeChange = (value: string) => {
    // Only allow digits and limit to 6 characters
    const numericValue = value.replace(/\D/g, "").slice(0, 6);
    setCode(numericValue);
    setError("");
  };

  const verifiedFactors = status.factors.filter(f => f.status === "verified");

  const handleLogout = async () => {
    setLoading(true);
    await supabase.auth.signOut();
    // The parent component will handle the navigation
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-white to-cyan-50 p-4">
      <Card className="w-full max-w-md border-0 shadow-xl bg-white/90 backdrop-blur-sm">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center">
            <Shield className="h-8 w-8 text-emerald-600" />
          </div>
          <div>
            <CardTitle className="text-xl font-semibold text-gray-900">
              Authentification à deux facteurs
            </CardTitle>
            <CardDescription className="text-gray-600 mt-2">
              Entrez le code de votre application d'authentification pour continuer
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Factor Info */}
          {verifiedFactors.length > 0 && (
            <div className="flex items-center gap-3 p-3 bg-emerald-50 rounded-lg">
              <Smartphone className="h-5 w-5 text-emerald-600" />
              <div className="text-sm">
                <p className="font-medium text-emerald-800">
                  {verifiedFactors[0].friendly_name || "Application TOTP"}
                </p>
                <p className="text-emerald-600">
                  Ouvrez votre application d'authentification
                </p>
              </div>
            </div>
          )}

          {/* Code Input */}
          <div className="space-y-2">
            <Label htmlFor="totp-code" className="text-sm font-medium">
              Code de vérification
            </Label>
            <Input
              id="totp-code"
              type="text"
              inputMode="numeric"
              placeholder="000000"
              value={code}
              onChange={(e) => handleCodeChange(e.target.value)}
              className="text-center text-2xl tracking-[0.5em] font-mono h-14 border-2"
              maxLength={6}
              autoComplete="one-time-code"
              autoFocus
            />
          </div>

          {/* Error Message */}
          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Instructions */}
          <div className="text-xs text-gray-500 space-y-1">
            <p>• Ouvrez votre application d'authentification</p>
            <p>• Trouvez le code pour NutriFlow</p>
            <p>• Entrez le code à 6 chiffres ci-dessus</p>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <Button
              onClick={handleVerify}
              disabled={loading || code.length !== 6 || !challengeData}
              className="w-full bg-emerald-600 hover:bg-emerald-700 h-12"
            >
              {loading ? "Vérification..." : "Vérifier"}
            </Button>

            <Button
              variant="outline"
              onClick={handleLogout}
              disabled={loading}
              className="w-full text-gray-600 hover:text-gray-800 border-gray-300"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Se déconnecter
            </Button>
          </div>

          {/* Security Notice */}
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="text-xs">
              La vérification MFA est obligatoire pour accéder à votre compte.
              Votre sécurité est notre priorité.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
}