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
import { createClient } from "@/lib/supabase/client";
import {
  AlertTriangle,
  CheckCircle,
  Eye,
  EyeOff,
  Lock,
  Shield,
} from "lucide-react";
import React, { useState } from "react";

export function PasswordSettings() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [lastPasswordChange, setLastPasswordChange] = useState<string | null>(
    null
  );

  const supabase = createClient();

  React.useEffect(() => {
    loadPasswordInfo();
  }, []);

  const loadPasswordInfo = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        // Try to get last password change from user metadata or profile
        const lastChange =
          user.user_metadata?.last_password_change || user.updated_at;
        setLastPasswordChange(lastChange);
      }
    } catch (error) {
      console.error("Error loading password info:", error);
    }
  };

  const validatePasswordStrength = (password: string) => {
    const requirements = {
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /\d/.test(password),
    };

    return {
      isValid: Object.values(requirements).every((req) => req),
      requirements,
    };
  };

  const handlePasswordChange = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir tous les champs",
        variant: "destructive",
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      toast({
        title: "Erreur",
        description: "Les nouveaux mots de passe ne correspondent pas",
        variant: "destructive",
      });
      return;
    }

    // Comprehensive password strength validation
    const passwordValidation = validatePasswordStrength(newPassword);

    if (!passwordValidation.isValid) {
      const missingRequirements = [];
      if (!passwordValidation.requirements.length)
        missingRequirements.push("au moins 8 caractères");
      if (!passwordValidation.requirements.uppercase)
        missingRequirements.push("une lettre majuscule");
      if (!passwordValidation.requirements.lowercase)
        missingRequirements.push("une lettre minuscule");
      if (!passwordValidation.requirements.number)
        missingRequirements.push("un chiffre");

      toast({
        title: "Mot de passe trop faible",
        description: `Le mot de passe doit contenir : ${missingRequirements.join(
          ", "
        )}`,
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      // First verify the current password by trying to sign in
      const { error: verifyError } = await supabase.auth.signInWithPassword({
        email: (await supabase.auth.getUser()).data.user?.email || "",
        password: currentPassword,
      });

      if (verifyError) {
        toast({
          title: "Erreur",
          description: "Mot de passe actuel incorrect",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      // Update the password
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) {
        toast({
          title: "Erreur",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Succès",
          description: "Votre mot de passe a été modifié avec succès",
        });
        setChangePasswordOpen(false);
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        loadPasswordInfo(); // Reload to get new timestamp
      }
    } catch (error) {
      toast({
        title: "Erreur",
        description:
          "Une erreur est survenue lors de la modification du mot de passe",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const formatLastChange = (dateString: string | null) => {
    if (!dateString) return "Jamais";

    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("fr-FR", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch {
      return "Jamais";
    }
  };

  return (
    <>
      <Card className="border-0 shadow-soft bg-white/90 backdrop-blur-sm">
        <CardHeader className="pb-6">
          <CardTitle className="flex items-center gap-3 text-lg font-semibold text-gray-900">
            <div className="h-10 w-10 bg-orange-100 rounded-xl flex items-center justify-center">
              <Lock className="h-5 w-5 text-orange-600" />
            </div>
            Mot de passe
          </CardTitle>
          <CardDescription className="text-gray-600 leading-relaxed">
            Gérez la sécurité de votre mot de passe
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:justify-between p-4 bg-gray-50 rounded-lg">
            <div className="space-y-1">
              <p className="text-sm font-medium text-gray-900">
                Dernière modification
              </p>
              <p className="text-sm text-gray-600">
                {formatLastChange(lastPasswordChange)}
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setChangePasswordOpen(true)}
              className="border-gray-200 hover:bg-gray-50 hover:shadow-soft transition-all duration-200 text-xs sm:text-sm px-3 sm:px-4 py-2 sm:py-2.5"
            >
              <Lock className="mr-1 sm:mr-2 h-4 w-4 flex-shrink-0" />
              <span className="hidden sm:inline">Changer le mot de passe</span>
              <span className="sm:hidden">Changer</span>
            </Button>
          </div>

          <Alert>
            <Shield className="h-4 w-4" />
            <AlertDescription>
              Utilisez un mot de passe fort avec au moins 8 caractères, incluant
              des lettres majuscules, minuscules, chiffres et caractères
              spéciaux.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Change Password Dialog */}
      <Dialog open={changePasswordOpen} onOpenChange={setChangePasswordOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5 text-orange-600" />
              Changer le mot de passe
            </DialogTitle>
            <DialogDescription>
              Entrez votre mot de passe actuel et choisissez un nouveau mot de
              passe sécurisé.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="currentPassword">Mot de passe actuel</Label>
              <div className="relative">
                <Input
                  id="currentPassword"
                  type={showCurrentPassword ? "text" : "password"}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Entrez votre mot de passe actuel"
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                >
                  {showCurrentPassword ? (
                    <EyeOff className="h-4 w-4 text-gray-400" />
                  ) : (
                    <Eye className="h-4 w-4 text-gray-400" />
                  )}
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="newPassword">Nouveau mot de passe</Label>
              <div className="relative">
                <Input
                  id="newPassword"
                  type={showNewPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Entrez votre nouveau mot de passe"
                  className={`pr-10 ${
                    newPassword &&
                    !validatePasswordStrength(newPassword).isValid
                      ? "border-orange-300 focus:border-orange-400 focus:ring-orange-200"
                      : newPassword &&
                        validatePasswordStrength(newPassword).isValid
                      ? "border-green-300 focus:border-green-400 focus:ring-green-200"
                      : ""
                  }`}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                >
                  {showNewPassword ? (
                    <EyeOff className="h-4 w-4 text-gray-400" />
                  ) : (
                    <Eye className="h-4 w-4 text-gray-400" />
                  )}
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">
                Confirmer le nouveau mot de passe
              </Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirmez votre nouveau mot de passe"
                  className={`pr-10 ${
                    confirmPassword && newPassword !== confirmPassword
                      ? "border-red-300 focus:border-red-400 focus:ring-red-200"
                      : confirmPassword &&
                        newPassword === confirmPassword &&
                        newPassword
                      ? "border-green-300 focus:border-green-400 focus:ring-green-200"
                      : ""
                  }`}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4 text-gray-400" />
                  ) : (
                    <Eye className="h-4 w-4 text-gray-400" />
                  )}
                </Button>
              </div>
              {confirmPassword && newPassword !== confirmPassword && (
                <p className="text-xs text-red-600 flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  Les mots de passe ne correspondent pas
                </p>
              )}
            </div>

            {newPassword && (
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-700">
                  Sécurité du mot de passe
                </p>
                {(() => {
                  const validation = validatePasswordStrength(newPassword);
                  return (
                    <>
                      <div className="flex items-center gap-2 text-xs">
                        {validation.requirements.length ? (
                          <CheckCircle className="h-3 w-3 text-green-500" />
                        ) : (
                          <AlertTriangle className="h-3 w-3 text-orange-500" />
                        )}
                        <span
                          className={
                            validation.requirements.length
                              ? "text-green-600"
                              : "text-orange-600"
                          }
                        >
                          Au moins 8 caractères
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        {validation.requirements.uppercase &&
                        validation.requirements.lowercase ? (
                          <CheckCircle className="h-3 w-3 text-green-500" />
                        ) : (
                          <AlertTriangle className="h-3 w-3 text-orange-500" />
                        )}
                        <span
                          className={
                            validation.requirements.uppercase &&
                            validation.requirements.lowercase
                              ? "text-green-600"
                              : "text-orange-600"
                          }
                        >
                          Majuscules et minuscules
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        {validation.requirements.number ? (
                          <CheckCircle className="h-3 w-3 text-green-500" />
                        ) : (
                          <AlertTriangle className="h-3 w-3 text-orange-500" />
                        )}
                        <span
                          className={
                            validation.requirements.number
                              ? "text-green-600"
                              : "text-orange-600"
                          }
                        >
                          Au moins un chiffre
                        </span>
                      </div>
                      {!validation.isValid && (
                        <Alert className="mt-2">
                          <AlertTriangle className="h-4 w-4" />
                          <AlertDescription className="text-xs">
                            Votre mot de passe doit respecter tous les critères
                            de sécurité ci-dessus.
                          </AlertDescription>
                        </Alert>
                      )}
                    </>
                  );
                })()}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setChangePasswordOpen(false)}
              disabled={loading}
            >
              Annuler
            </Button>
            <Button
              onClick={handlePasswordChange}
              disabled={
                loading ||
                !currentPassword ||
                !newPassword ||
                !confirmPassword ||
                newPassword !== confirmPassword ||
                !validatePasswordStrength(newPassword).isValid
              }
              className="bg-orange-600 hover:bg-orange-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-xs sm:text-sm"
            >
              {loading ? "Modification..." : (
                <>
                  <span className="hidden sm:inline">Modifier le mot de passe</span>
                  <span className="sm:hidden">Modifier</span>
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
