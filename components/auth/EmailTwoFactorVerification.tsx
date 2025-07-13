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
import { useToast } from "@/hooks/use-toast";
import { useEmailTwoFactor } from "@/hooks/useEmailTwoFactor";
import { CheckCircle, Loader2, Mail, Shield } from "lucide-react";
import { useEffect, useState } from "react";

interface EmailTwoFactorVerificationProps {
  onVerificationSuccess: () => void;
  userEmail?: string;
}

export function EmailTwoFactorVerification({
  onVerificationSuccess,
  userEmail,
}: EmailTwoFactorVerificationProps) {
  const { sendEmailCode, verifyEmailCode, loading } = useEmailTwoFactor();
  const { toast } = useToast();

  const [verificationCode, setVerificationCode] = useState("");
  const [codeSent, setCodeSent] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [devCode, setDevCode] = useState<string>("");

  useEffect(() => {
    // Auto-send code when component mounts
    handleSendCode();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
    // Return undefined explicitly for the else case
    return undefined;
  }, [countdown]);

  const handleSendCode = async () => {
    const result = await sendEmailCode();

    if (result.success) {
      setCodeSent(true);
      setCountdown(60); // 60 seconds cooldown
      setVerificationCode("");
      setAttempts(0);

      // In development, show the code
      if (result.code) {
        setDevCode(result.code);
      }

      toast({
        title: "Code envoyé",
        description:
          result.message ||
          "Un code de vérification a été envoyé à votre email.",
      });
    } else {
      toast({
        title: "Erreur",
        description: result.message || "Impossible d'envoyer le code.",
        variant: "destructive",
      });
    }
  };

  const handleVerifyCode = async () => {
    if (verificationCode.length !== 6) {
      toast({
        title: "Code invalide",
        description: "Le code doit contenir 6 chiffres.",
        variant: "destructive",
      });
      return;
    }

    const result = await verifyEmailCode(verificationCode);

    if (result.success) {
      toast({
        title: "Vérification réussie",
        description: "Accès autorisé à votre compte.",
      });
      onVerificationSuccess();
    } else {
      setAttempts((prev) => prev + 1);
      setVerificationCode("");

      toast({
        title: "Code invalide",
        description: result.message || "Le code saisi est incorrect.",
        variant: "destructive",
      });
    }
  };

  const handleResendCode = () => {
    if (countdown === 0) {
      handleSendCode();
    }
  };

  const maskedEmail = userEmail
    ? userEmail.replace(/(.{2})(.*)(@.*)/, "$1***$3")
    : "votre email";

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md border-0 shadow-xl bg-white/95 backdrop-blur-sm">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center">
            <Shield className="h-8 w-8 text-emerald-600" />
          </div>
          <div>
            <CardTitle className="text-2xl font-bold text-gray-900">
              Vérification en deux étapes
            </CardTitle>
            <CardDescription className="text-gray-600 mt-2">
              Pour sécuriser votre compte, entrez le code envoyé à {maskedEmail}
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {process.env.NODE_ENV === "development" && devCode && (
            <Alert className="border-blue-200 bg-blue-50">
              <AlertDescription className="text-blue-800 font-mono">
                <strong>Mode développement:</strong> Code = {devCode}
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="verification-code" className="font-medium">
                Code de vérification
              </Label>
              <Input
                id="verification-code"
                type="text"
                placeholder="000000"
                value={verificationCode}
                onChange={(e) =>
                  setVerificationCode(
                    e.target.value.replace(/\D/g, "").slice(0, 6)
                  )
                }
                className="text-center text-lg tracking-widest font-mono"
                maxLength={6}
                autoComplete="one-time-code"
                autoFocus
              />
            </div>

            <Button
              onClick={handleVerifyCode}
              disabled={loading || verificationCode.length !== 6}
              className="w-full bg-emerald-600 hover:bg-emerald-700"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Vérification...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Vérifier le code
                </>
              )}
            </Button>
          </div>

          <div className="text-center space-y-4">
            <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
              <Mail className="h-4 w-4" />
              <span>Code envoyé à {maskedEmail}</span>
            </div>

            {attempts > 0 && (
              <Alert className="border-yellow-200 bg-yellow-50">
                <AlertDescription className="text-yellow-800">
                  {attempts === 1 && "Code incorrect. Veuillez réessayer."}
                  {attempts === 2 && "Attention: il vous reste 1 tentative."}
                  {attempts >= 3 &&
                    "Trop de tentatives. Un nouveau code sera nécessaire."}
                </AlertDescription>
              </Alert>
            )}

            <Button
              variant="outline"
              onClick={handleResendCode}
              disabled={countdown > 0 || loading}
              className="w-full"
            >
              {countdown > 0
                ? `Renvoyer le code dans ${countdown}s`
                : "Renvoyer le code"}
            </Button>
          </div>

          <div className="text-center">
            <p className="text-xs text-gray-500">
              Le code expire dans 10 minutes. Si vous ne le recevez pas,
              vérifiez vos spams ou contactez le support.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
