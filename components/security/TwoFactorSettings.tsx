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
import { useSupabaseTOTP } from "@/hooks/useSupabaseTOTP";
import {
  AlertTriangle,
  Shield,
  ShieldCheck,
  Smartphone,
  Trash2,
  Plus,
} from "lucide-react";
import { useState } from "react";

export function TwoFactorSettings() {
  const { 
    status, 
    enrollTOTP, 
    verifyTOTPEnrollment, 
    unenrollTOTP, 
    loading 
  } = useSupabaseTOTP();
  const { toast } = useToast();

  const [setupDialogOpen, setSetupDialogOpen] = useState(false);
  const [setupData, setSetupData] = useState<any>(null);
  const [verificationCode, setVerificationCode] = useState("");
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [factorToDelete, setFactorToDelete] = useState<string | null>(null);

  const handleEnrollTOTP = async () => {
    const enrollmentData = await enrollTOTP("Authenticator App");
    if (enrollmentData) {
      setSetupData(enrollmentData);
      setSetupDialogOpen(true);
    } else {
      toast({
        title: "Erreur",
        description: "Impossible de configurer l'authentification TOTP.",
        variant: "destructive",
      });
    }
  };

  const handleVerifySetup = async () => {
    if (!verificationCode || !setupData) return;

    const success = await verifyTOTPEnrollment(setupData.factorId, verificationCode);
    if (success) {
      setSetupDialogOpen(false);
      setSetupData(null);
      setVerificationCode("");
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

  const handleDeleteFactor = async () => {
    if (!factorToDelete) return;

    const result = await unenrollTOTP(factorToDelete);
    if (result.success) {
      setConfirmDeleteOpen(false);
      setFactorToDelete(null);
      toast({
        title: "Facteur supprimé",
        description: "L'authentification TOTP a été désactivée.",
      });
    } else {
      setConfirmDeleteOpen(false);
      setFactorToDelete(null);
      
      if (result.requiresAAL2) {
        toast({
          title: "Authentification requise",
          description: result.error || "Vous devez d'abord vous authentifier avec votre code TOTP pour supprimer ce facteur.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Erreur",
          description: result.error || "Impossible de supprimer le facteur d'authentification.",
          variant: "destructive",
        });
      }
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("fr-FR", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const verifiedFactors = status.factors.filter(f => f.status === "verified");

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Authentification à deux facteurs (TOTP)
          </CardTitle>
          <CardDescription>
            Sécurisez votre compte avec une application d'authentification comme Google Authenticator, Authy ou 1Password
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4 sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              {status.isEnabled ? (
                <ShieldCheck className="h-5 w-5 text-green-500" />
              ) : (
                <Shield className="h-5 w-5 text-gray-400" />
              )}
              <div>
                <p className="font-medium">Authentification TOTP</p>
                <p className="text-sm text-gray-500">
                  {status.isEnabled
                    ? `${verifiedFactors.length} facteur${verifiedFactors.length > 1 ? "s" : ""} configuré${verifiedFactors.length > 1 ? "s" : ""}`
                    : "Aucun facteur configuré - Recommandé pour plus de sécurité"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <Badge variant={status.isEnabled ? "default" : "secondary"}>
                {status.isEnabled ? "Activé" : "Désactivé"}
              </Badge>
              <Button
                variant="outline"
                onClick={handleEnrollTOTP}
                disabled={loading}
                size="sm"
                className="text-xs sm:text-sm px-3 sm:px-4 py-2 sm:py-2.5"
              >
                <Plus className="h-4 w-4 mr-1 sm:mr-2 flex-shrink-0" />
                <span className="hidden sm:inline">Ajouter facteur</span>
                <span className="sm:hidden">Ajouter</span>
              </Button>
            </div>
          </div>

          {status.isEnabled && (
            <div className="space-y-3 mt-4 p-4 bg-gray-50 rounded-lg">
              <h4 className="font-medium">Facteurs d'authentification configurés</h4>
              
              {verifiedFactors.map((factor) => (
                <div key={factor.id} className="flex items-center justify-between p-3 bg-white rounded-lg border">
                  <div className="flex items-center gap-3">
                    <Smartphone className="h-4 w-4 text-green-500" />
                    <div>
                      <p className="font-medium">{factor.friendly_name || "Application TOTP"}</p>
                      <p className="text-xs text-gray-500">
                        Configuré le {formatDate(factor.created_at)}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setFactorToDelete(factor.id);
                      setConfirmDeleteOpen(true);
                    }}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}

              {verifiedFactors.length === 0 && (
                <div className="text-center py-4 text-gray-500">
                  Aucun facteur TOTP configuré
                </div>
              )}
            </div>
          )}

          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              L'authentification TOTP offre une sécurité renforcée en générant des codes temporaires 
              via une application d'authentification sur votre téléphone.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

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
                  <p className="font-medium mb-2">Étapes de configuration :</p>
                  <ol className="text-sm space-y-1 list-decimal list-inside">
                    <li>Ouvrez votre application d'authentification</li>
                    <li>Scannez le code QR ci-dessus</li>
                    <li>Entrez le code généré ci-dessous</li>
                  </ol>
                </AlertDescription>
              </Alert>

              <div className="space-y-2">
                <Label htmlFor="verification-code">Code de vérification</Label>
                <Input
                  id="verification-code"
                  placeholder="Entrez le code à 6 chiffres"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  maxLength={6}
                  className="text-center text-lg tracking-widest"
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setSetupDialogOpen(false);
              setSetupData(null);
              setVerificationCode("");
            }}>
              Annuler
            </Button>
            <Button
              onClick={handleVerifySetup}
              disabled={loading || verificationCode.length !== 6}
              className="bg-emerald-600 hover:bg-emerald-700 text-xs sm:text-sm"
            >
              <span className="hidden sm:inline">Vérifier et activer</span>
              <span className="sm:hidden">Vérifier</span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirm Delete Dialog */}
      <Dialog open={confirmDeleteOpen} onOpenChange={setConfirmDeleteOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Supprimer le facteur d'authentification</DialogTitle>
            <DialogDescription>
              Êtes-vous sûr de vouloir supprimer ce facteur d'authentification ? 
              Cela réduira la sécurité de votre compte.
            </DialogDescription>
          </DialogHeader>

          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Une fois supprimé, vous ne pourrez plus utiliser cette application 
              d'authentification pour vous connecter.
            </AlertDescription>
          </Alert>

          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setConfirmDeleteOpen(false);
              setFactorToDelete(null);
            }}>
              Annuler
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteFactor}
              disabled={loading}
            >
              Supprimer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}