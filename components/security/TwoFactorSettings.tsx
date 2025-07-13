"use client";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { use2FA } from "@/hooks/use2FA";
import { useEmailTwoFactor } from "@/hooks/useEmailTwoFactor";
import { createClient } from "@/lib/supabase/client";
import {
  AlertTriangle,
  Mail,
  Settings,
  Shield,
  ShieldCheck,
  Smartphone,
} from "lucide-react";
import { useEffect, useState } from "react";

export function TwoFactorSettings() {
  const { status, setup2FA, verify2FA, disable2FA, generateBackupCodes } =
    use2FA();
  const { sendEmailCode, verifyEmailCode } = useEmailTwoFactor();
  const { toast } = useToast();

  const [currentMethod, setCurrentMethod] = useState<"email" | "totp">("email");
  const [isEnabled, setIsEnabled] = useState(true);
  const [loading, setLoading] = useState(false);
  const [testDialogOpen, setTestDialogOpen] = useState(false);
  const [testCode, setTestCode] = useState("");
  const [setupDialogOpen, setSetupDialogOpen] = useState(false);
  const [setupData, setSetupData] = useState<any>(null);
  const [verificationCode, setVerificationCode] = useState("");

  const supabase = createClient();

  useEffect(() => {
    loadSecuritySettings();
  }, []);

  const loadSecuritySettings = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data: security } = await supabase
        .from("user_security")
        .select("two_factor_enabled, two_factor_method")
        .eq("user_id", user.id)
        .single();

      if (security) {
        setIsEnabled(security.two_factor_enabled ?? true);
        setCurrentMethod(security.two_factor_method || "email");
      }
    } catch (error) {
      console.error("Error loading security settings:", error);
    }
  };

  const toggleTwoFactor = async () => {
    setLoading(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const newStatus = !isEnabled;

      const { error } = await supabase.from("user_security").upsert({
        user_id: user.id,
        two_factor_enabled: newStatus,
        two_factor_method: currentMethod,
        updated_at: new Date().toISOString(),
      });

      if (error) throw error;

      setIsEnabled(newStatus);

      toast({
        title: newStatus ? "2FA activé" : "2FA désactivé",
        description: newStatus
          ? "L'authentification à deux facteurs est maintenant activée."
          : "L'authentification à deux facteurs a été désactivée.",
      });
    } catch (error) {
      console.error("Error toggling 2FA:", error);
      toast({
        title: "Erreur",
        description: "Impossible de modifier les paramètres 2FA.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const switchMethod = async (method: "email" | "totp") => {
    if (method === "totp") {
      // Setup TOTP
      const data = await setup2FA();
      if (data) {
        setSetupData(data);
        setSetupDialogOpen(true);
      }
    } else {
      // Switch to email
      setLoading(true);
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) return;

        const { error } = await supabase.from("user_security").upsert({
          user_id: user.id,
          two_factor_enabled: true,
          two_factor_method: "email",
          two_factor_secret: null, // Clear TOTP secret
          updated_at: new Date().toISOString(),
        });

        if (error) throw error;

        setCurrentMethod("email");
        toast({
          title: "Méthode mise à jour",
          description: "2FA par email activé.",
        });
      } catch (error) {
        console.error("Error switching to email 2FA:", error);
        toast({
          title: "Erreur",
          description: "Impossible de changer la méthode 2FA.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    }
  };

  const testEmailCode = async () => {
    const result = await sendEmailCode();
    if (result.success) {
      setTestDialogOpen(true);
      toast({
        title: "Code de test envoyé",
        description: "Vérifiez votre email pour le code de test.",
      });
    }
  };

  const verifyTestCode = async () => {
    const result = await verifyEmailCode(testCode);
    if (result.success) {
      setTestDialogOpen(false);
      setTestCode("");
      toast({
        title: "Test réussi",
        description: "L'authentification par email fonctionne correctement.",
      });
    } else {
      toast({
        title: "Test échoué",
        description: result.message || "Code incorrect.",
        variant: "destructive",
      });
    }
  };

  const handleVerifySetup = async () => {
    if (!verificationCode || !setupData) return;

    const success = await verify2FA(verificationCode, setupData.secret);
    if (success) {
      setSetupDialogOpen(false);
      setSetupData(null);
      setVerificationCode("");
      setCurrentMethod("totp");
      toast({
        title: "TOTP activé",
        description: "L'authentification TOTP a été configurée avec succès.",
      });
    } else {
      toast({
        title: "Code invalide",
        description: "Le code de vérification est incorrect.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Authentification à deux facteurs (2FA)
          </CardTitle>
          <CardDescription>
            Sécurisez votre compte avec l'authentification à deux facteurs par
            email ou application
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {isEnabled ? (
                <ShieldCheck className="h-5 w-5 text-green-500" />
              ) : (
                <Shield className="h-5 w-5 text-gray-400" />
              )}
              <div>
                <p className="font-medium">Authentification à deux facteurs</p>
                <p className="text-sm text-gray-500">
                  {isEnabled
                    ? `Activée via ${
                        currentMethod === "email" ? "email" : "application TOTP"
                      }`
                    : "Désactivée - Recommandé pour plus de sécurité"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={isEnabled ? "default" : "secondary"}>
                {isEnabled ? "Activé" : "Désactivé"}
              </Badge>
              <Button
                variant="outline"
                onClick={toggleTwoFactor}
                disabled={loading}
                size="sm"
              >
                {isEnabled ? "Désactiver" : "Activer"}
              </Button>
            </div>
          </div>

          {isEnabled && (
            <div className="space-y-4 mt-4 p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">Méthode d'authentification</h4>
                <Badge variant="outline">
                  {currentMethod === "email" ? "Email" : "Application TOTP"}
                </Badge>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Button
                  variant={currentMethod === "email" ? "default" : "outline"}
                  onClick={() =>
                    currentMethod !== "email" && switchMethod("email")
                  }
                  className="justify-start"
                  disabled={loading}
                >
                  <Mail className="h-4 w-4 mr-2" />
                  Email (Recommandé)
                </Button>

                <Button
                  variant={currentMethod === "totp" ? "default" : "outline"}
                  onClick={() =>
                    currentMethod !== "totp" && switchMethod("totp")
                  }
                  className="justify-start"
                  disabled={loading}
                >
                  <Smartphone className="h-4 w-4 mr-2" />
                  Application TOTP
                </Button>
              </div>

              {currentMethod === "email" && (
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm font-medium">
                      Test de l'envoi d'email
                    </p>
                    <p className="text-xs text-gray-500">
                      Vérifiez que vous recevez bien les codes
                    </p>
                  </div>
                  <Button variant="outline" size="sm" onClick={testEmailCode}>
                    <Settings className="h-4 w-4 mr-2" />
                    Tester
                  </Button>
                </div>
              )}
            </div>
          )}

          <div className="text-xs text-gray-500">
            La 2FA par email est activée par défaut pour tous les nouveaux
            comptes pour garantir la sécurité.
          </div>
        </CardContent>
      </Card>

      {/* Test Email Dialog */}
      <Dialog open={testDialogOpen} onOpenChange={setTestDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Test d'authentification par email</DialogTitle>
            <DialogDescription>
              Entrez le code reçu par email pour tester le système
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="test-code">Code de test</Label>
              <Input
                id="test-code"
                placeholder="Entrez le code à 6 chiffres"
                value={testCode}
                onChange={(e) => setTestCode(e.target.value)}
                maxLength={6}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setTestDialogOpen(false)}>
              Annuler
            </Button>
            <Button
              onClick={verifyTestCode}
              disabled={testCode.length !== 6}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              Vérifier
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Setup TOTP Dialog */}
      <Dialog open={setupDialogOpen} onOpenChange={setSetupDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Configurer l'authentification TOTP</DialogTitle>
            <DialogDescription>
              Scannez le code QR avec votre application d'authentification
            </DialogDescription>
          </DialogHeader>

          {setupData && (
            <div className="space-y-4">
              <div className="text-center">
                <img
                  src={setupData.qrCode}
                  alt="QR Code TOTP"
                  className="mx-auto w-48 h-48 border rounded-lg"
                />
              </div>

              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Sauvegardez ces codes de sauvegarde en lieu sûr :
                  <div className="mt-2 p-2 bg-gray-100 rounded text-xs font-mono">
                    {setupData.backupCodes.slice(0, 3).join(", ")}...
                  </div>
                </AlertDescription>
              </Alert>

              <div className="space-y-2">
                <Label htmlFor="verification-code">Code de vérification</Label>
                <Input
                  id="verification-code"
                  placeholder="Entrez le code à 6 chiffres"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value)}
                  maxLength={6}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setSetupDialogOpen(false)}>
              Annuler
            </Button>
            <Button
              onClick={handleVerifySetup}
              disabled={loading || verificationCode.length !== 6}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              Vérifier et activer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
