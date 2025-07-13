"use client";

import { useClientAuth } from "@/components/auth/ClientAuthProvider";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { AlertTriangle, Shield } from "lucide-react";
import { useState } from "react";

interface MandatoryConsentModalProps {
  isOpen: boolean;
  onConsentGiven: () => void;
}

export function MandatoryConsentModal({
  isOpen,
  onConsentGiven,
}: MandatoryConsentModalProps) {
  const { client } = useClientAuth();
  const { toast } = useToast();

  const [consents, setConsents] = useState({
    data_processing: false,
    health_data: false,
    photos: false,
    marketing: false,
    data_sharing: false,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showError, setShowError] = useState(false);

  // Required consents (cannot use portal without these)
  const requiredConsents = ["data_processing", "health_data"];

  // Check if required consents are given
  const hasRequiredConsents = requiredConsents.every(
    (consent) => consents[consent as keyof typeof consents]
  );

  const handleConsentChange = (consentType: string, checked: boolean) => {
    setConsents((prev) => ({
      ...prev,
      [consentType]: checked,
    }));
    setShowError(false);
  };

  const handleSubmit = async () => {
    if (!hasRequiredConsents) {
      setShowError(true);
      toast({
        title: "Consentements obligatoires",
        description:
          "Vous devez accepter les consentements obligatoires pour utiliser le portail client.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Save consents
      const response = await fetch("/api/client-auth/gdpr/consents", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          clientId: client?.id,
          consents: Object.entries(consents).map(([type, granted]) => ({
            consent_type: type,
            granted,
          })),
        }),
      });

      if (!response.ok) {
        throw new Error("Erreur lors de l'enregistrement des consentements");
      }

      // Mark as consents given
      localStorage.setItem("client-consents-given", "true");

      toast({
        title: "Consentements enregistrés",
        description:
          "Vos préférences de confidentialité ont été enregistrées avec succès.",
      });

      onConsentGiven();
    } catch (error) {
      console.error("Error saving consents:", error);
      toast({
        title: "Erreur",
        description:
          "Impossible d'enregistrer vos consentements. Veuillez réessayer.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={() => {}} modal>
      <DialogContent
        className="max-w-2xl max-h-[90vh] overflow-y-auto"
        onPointerDownOutside={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-6 w-6 text-emerald-600" />
            Consentements obligatoires
          </DialogTitle>
          <DialogDescription>
            Avant d'accéder à votre portail client, nous devons obtenir vos
            consentements pour le traitement de vos données personnelles
            conformément au RGPD.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {showError && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Vous devez accepter les consentements obligatoires (marqués par
                *) pour accéder au portail client.
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-4">
            {/* Mandatory Consent 1: Data Processing */}
            <div className="border rounded-lg p-4 bg-red-50 border-red-200">
              <div className="flex items-start space-x-3">
                <Checkbox
                  id="data_processing"
                  checked={consents.data_processing}
                  onCheckedChange={(checked) =>
                    handleConsentChange("data_processing", checked as boolean)
                  }
                  className="mt-1"
                />
                <div className="flex-1">
                  <label
                    htmlFor="data_processing"
                    className="text-sm font-medium cursor-pointer flex items-center gap-1"
                  >
                    Traitement des données personnelles *
                    <span className="text-red-500 text-xs">(Obligatoire)</span>
                  </label>
                  <p className="text-sm text-gray-600 mt-1">
                    J'autorise le traitement de mes données personnelles (nom,
                    prénom, email, téléphone) pour la gestion de mon dossier
                    nutritionnel et la communication avec mon nutritionniste.
                  </p>
                </div>
              </div>
            </div>

            {/* Mandatory Consent 2: Health Data */}
            <div className="border rounded-lg p-4 bg-red-50 border-red-200">
              <div className="flex items-start space-x-3">
                <Checkbox
                  id="health_data"
                  checked={consents.health_data}
                  onCheckedChange={(checked) =>
                    handleConsentChange("health_data", checked as boolean)
                  }
                  className="mt-1"
                />
                <div className="flex-1">
                  <label
                    htmlFor="health_data"
                    className="text-sm font-medium cursor-pointer flex items-center gap-1"
                  >
                    Traitement des données de santé *
                    <span className="text-red-500 text-xs">(Obligatoire)</span>
                  </label>
                  <p className="text-sm text-gray-600 mt-1">
                    J'autorise le traitement de mes données de santé sensibles
                    (poids, allergies, pathologies, habitudes alimentaires)
                    nécessaires au suivi nutritionnel.
                  </p>
                </div>
              </div>
            </div>

            {/* Optional Consent 3: Photos */}
            <div className="border rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <Checkbox
                  id="photos"
                  checked={consents.photos}
                  onCheckedChange={(checked) =>
                    handleConsentChange("photos", checked as boolean)
                  }
                  className="mt-1"
                />
                <div className="flex-1">
                  <label
                    htmlFor="photos"
                    className="text-sm font-medium cursor-pointer"
                  >
                    Utilisation de photos (Optionnel)
                  </label>
                  <p className="text-sm text-gray-600 mt-1">
                    J'autorise l'utilisation de mes photos corporelles pour le
                    suivi de ma progression et la documentation de mes
                    résultats.
                  </p>
                </div>
              </div>
            </div>

            {/* Optional Consent 4: Marketing */}
            <div className="border rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <Checkbox
                  id="marketing"
                  checked={consents.marketing}
                  onCheckedChange={(checked) =>
                    handleConsentChange("marketing", checked as boolean)
                  }
                  className="mt-1"
                />
                <div className="flex-1">
                  <label
                    htmlFor="marketing"
                    className="text-sm font-medium cursor-pointer"
                  >
                    Communications marketing (Optionnel)
                  </label>
                  <p className="text-sm text-gray-600 mt-1">
                    J'accepte de recevoir des newsletters, conseils
                    nutritionnels et offres promotionnelles par email.
                  </p>
                </div>
              </div>
            </div>

            {/* Optional Consent 5: Data Sharing */}
            <div className="border rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <Checkbox
                  id="data_sharing"
                  checked={consents.data_sharing}
                  onCheckedChange={(checked) =>
                    handleConsentChange("data_sharing", checked as boolean)
                  }
                  className="mt-1"
                />
                <div className="flex-1">
                  <label
                    htmlFor="data_sharing"
                    className="text-sm font-medium cursor-pointer"
                  >
                    Partage avec des tiers (Optionnel)
                  </label>
                  <p className="text-sm text-gray-600 mt-1">
                    J'autorise le partage de mes données avec des laboratoires
                    d'analyses, autres professionnels de santé ou partenaires
                    dans le cadre de mon suivi.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="text-xs text-gray-500 space-y-2">
            <p>
              * Les consentements marqués comme obligatoires sont nécessaires
              pour utiliser le portail client.
            </p>
            <p>
              Vous pouvez modifier vos consentements à tout moment dans la
              section "Confidentialité" de votre portail client.
            </p>
            <p>
              Conformément au RGPD, vous disposez d'un droit d'accès, de
              rectification, d'effacement, de limitation, de portabilité et
              d'opposition sur vos données personnelles.
            </p>
          </div>
        </div>

        <DialogFooter className="flex flex-col gap-3">
          <Button
            onClick={handleSubmit}
            disabled={!hasRequiredConsents || isSubmitting}
            className="w-full bg-emerald-600 hover:bg-emerald-700"
          >
            {isSubmitting
              ? "Enregistrement..."
              : "Enregistrer mes consentements"}
          </Button>

          {!hasRequiredConsents && (
            <p className="text-sm text-red-600 text-center">
              Vous devez accepter les consentements obligatoires pour continuer
            </p>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
