"use client";

import { useClientAuth } from "@/components/auth/ClientAuthProvider";
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
import { clientGet, clientPost } from "@/lib/client-api";
import {
  AlertTriangle,
  CheckCircle,
  Clock,
  Download,
  FileText,
  Mail,
  Settings,
  Shield,
  Trash2,
} from "lucide-react";
import { useEffect, useState } from "react";

interface ConsentOption {
  type: string;
  title: string;
  description: string;
  required: boolean;
  granted: boolean;
}

export function ClientGDPRRights() {
  const { toast } = useToast();
  const { client } = useClientAuth();
  const [loading, setLoading] = useState(false);
  const [consents, setConsents] = useState<ConsentOption[]>([
    {
      type: "data_processing",
      title: "Traitement des données personnelles",
      description:
        "Autoriser le traitement de mes données personnelles pour le suivi nutritionnel",
      required: true,
      granted: false,
    },
    {
      type: "health_data",
      title: "Données de santé",
      description:
        "Autoriser le traitement de mes données de santé (poids, mesures, conditions médicales)",
      required: true,
      granted: false,
    },
    {
      type: "photos",
      title: "Photos de progression",
      description: "Autoriser la prise et le stockage de photos de progression",
      required: false,
      granted: false,
    },
    {
      type: "marketing",
      title: "Communications marketing",
      description: "Recevoir des newsletters et informations promotionnelles",
      required: false,
      granted: false,
    },
    {
      type: "data_sharing",
      title: "Partage de données",
      description:
        "Autoriser le partage anonymisé de données à des fins de recherche",
      required: false,
      granted: false,
    },
  ]);

  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [consentDialogOpen, setConsentDialogOpen] = useState(false);

  useEffect(() => {
    loadConsentStatus();
  }, []);

  const loadConsentStatus = async () => {
    if (!client?.id) return;

    try {
      // Load current consent status from API using secure authentication
      const response = await clientGet("/api/client-auth/gdpr/consents");

      if (response.success && response.data) {
        const data = response.data;
        if (data.consents) {
          setConsents((prev) =>
            prev.map((consent) => {
              const existing = data.consents.find(
                (c: any) => c.consent_type === consent.type
              );
              return {
                ...consent,
                granted: existing ? existing.granted : false,
              };
            })
          );
        }
      }
    } catch (error) {
      console.error("Error loading consent status:", error);
    }
  };

  const handleConsentChange = (type: string, granted: boolean) => {
    setConsents((prev) =>
      prev.map((consent) =>
        consent.type === type ? { ...consent, granted } : consent
      )
    );
  };
  const saveConsents = async () => {
    if (!client?.id) return;

    try {
      setLoading(true);
      const response = await clientPost("/api/client-auth/gdpr/consents", {
        consents: consents.map((consent) => ({
          consent_type: consent.type,
          granted: consent.granted,
        })),
      });

      if (response.success) {
        toast({
          title: "Succès",
          description: "Vos préférences de consentement ont été sauvegardées",
        });
        setConsentDialogOpen(false);
      } else {
        throw new Error("Failed to save consents");
      }
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de sauvegarder vos préférences",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const requestDataExport = async () => {
    try {
      setLoading(true);

      const response = await clientPost("/api/client-auth/gdpr/export", {
        requestType: "export",
      });

      if (response.success) {
        toast({
          title: "Demande envoyée",
          description:
            "Votre demande d'export a été envoyée. Vous recevrez un email avec le lien de téléchargement sous 48h.",
        });
        setExportDialogOpen(false);
      } else {
        throw new Error("Failed to request export");
      }
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible d'envoyer la demande d'export",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const requestDataDeletion = async () => {
    try {
      setLoading(true);

      const response = await clientPost("/api/client-auth/gdpr/deletion", {
        requestType: "deletion",
      });

      if (response.success) {
        toast({
          title: "Demande envoyée",
          description:
            "Votre demande de suppression a été envoyée. Un responsable vous contactera sous 48h.",
        });
        setDeleteDialogOpen(false);
      } else {
        throw new Error("Failed to request deletion");
      }
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible d'envoyer la demande de suppression",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Mes droits et données personnelles
        </h2>
        <p className="text-gray-600">
          Gérez vos consentements et exercez vos droits sur vos données
          personnelles
        </p>
      </div>

      {/* Consent Management */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-blue-600" />
            Mes consentements
          </CardTitle>
          <CardDescription>
            Gérez vos autorisations pour le traitement de vos données
            personnelles
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {consents.map((consent) => (
              <div
                key={consent.type}
                className="flex flex-col sm:flex-row sm:items-start sm:justify-between p-3 sm:p-4 border rounded-lg gap-2 sm:gap-0"
              >
                <div className="space-y-1 flex-1">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                    <p className="font-medium">{consent.title}</p>
                    {consent.required && (
                      <Badge variant="secondary" className="text-xs w-fit">
                        Obligatoire
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs sm:text-sm text-gray-600">{consent.description}</p>
                </div>
                <div className="flex items-center gap-2 sm:ml-4">
                  {consent.granted ? (
                    <Badge variant="default" className="bg-green-600 w-fit">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      <span className="hidden sm:inline">Accordé</span>
                      <span className="sm:hidden">OK</span>
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="w-fit">
                      <AlertTriangle className="h-3 w-3 mr-1" />
                      <span className="hidden sm:inline">{consent.required ? "Requis" : "Non accordé"}</span>
                      <span className="sm:hidden">{consent.required ? "Requis" : "Non"}</span>
                    </Badge>
                  )}
                </div>
              </div>
            ))}

            <Button
              onClick={() => setConsentDialogOpen(true)}
              className="w-full mt-4"
              variant="outline"
            >
              <Settings className="mr-2 h-4 w-4" />
              Modifier mes consentements
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Data Rights */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-purple-600" />
            Mes droits sur mes données
          </CardTitle>
          <CardDescription>
            Exercez vos droits conformément au RGPD
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Data Export */}
            <div className="p-3 sm:p-4 border rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Download className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
                <h3 className="font-medium text-sm sm:text-base">Portabilité des données</h3>
              </div>
              <p className="text-xs sm:text-sm text-gray-600 mb-3 sm:mb-4">
                Recevez une copie complète de toutes vos données personnelles
                dans un format lisible.
              </p>
              <Button
                onClick={() => setExportDialogOpen(true)}
                variant="outline"
                size="sm"
                className="w-full"
              >
                Demander mes données
              </Button>
            </div>

            {/* Data Deletion */}
            <div className="p-3 sm:p-4 border rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Trash2 className="h-4 w-4 sm:h-5 sm:w-5 text-red-600" />
                <h3 className="font-medium text-sm sm:text-base">Droit à l'oubli</h3>
              </div>
              <p className="text-xs sm:text-sm text-gray-600 mb-3 sm:mb-4">
                Demandez la suppression complète de vos données personnelles de
                nos systèmes.
              </p>
              <Button
                onClick={() => setDeleteDialogOpen(true)}
                variant="outline"
                size="sm"
                className="w-full border-red-200 text-red-600 hover:bg-red-50"
              >
                Demander la suppression
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Data Retention Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-orange-600" />
            Conservation des données
          </CardTitle>
          <CardDescription>
            Informations sur la durée de conservation de vos données
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center p-3 bg-gray-50 rounded gap-1 sm:gap-0">
              <span className="text-xs sm:text-sm font-medium">Données de profil</span>
              <span className="text-xs sm:text-sm text-gray-600">
                7 ans après la fin du suivi
              </span>
            </div>
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center p-3 bg-gray-50 rounded gap-1 sm:gap-0">
              <span className="text-xs sm:text-sm font-medium">Données de santé</span>
              <span className="text-xs sm:text-sm text-gray-600">
                10 ans (obligation légale)
              </span>
            </div>
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center p-3 bg-gray-50 rounded gap-1 sm:gap-0">
              <span className="text-xs sm:text-sm font-medium">Photos de progression</span>
              <span className="text-xs sm:text-sm text-gray-600">
                Jusqu'à révocation du consentement
              </span>
            </div>
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center p-3 bg-gray-50 rounded gap-1 sm:gap-0">
              <span className="text-xs sm:text-sm font-medium">Messages</span>
              <span className="text-xs sm:text-sm text-gray-600">
                3 ans après le dernier message
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Consent Dialog */}
      <Dialog open={consentDialogOpen} onOpenChange={setConsentDialogOpen}>
        <DialogContent className="w-[95vw] sm:max-w-lg p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle>Modifier mes consentements</DialogTitle>
            <DialogDescription>
              Vous pouvez modifier vos autorisations à tout moment. Les
              consentements obligatoires sont nécessaires pour votre suivi
              nutritionnel.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {consents.map((consent) => (
              <div key={consent.type} className="flex items-start space-x-3">
                <Checkbox
                  id={consent.type}
                  checked={consent.granted}
                  onCheckedChange={(checked) =>
                    handleConsentChange(consent.type, !!checked)
                  }
                  disabled={consent.required}
                />
                <div className="space-y-1 flex-1">
                  <label
                    htmlFor={consent.type}
                    className="text-sm font-medium cursor-pointer"
                  >
                    {consent.title}
                    {consent.required && (
                      <span className="text-red-500 ml-1">*</span>
                    )}
                  </label>
                  <p className="text-xs text-gray-600">{consent.description}</p>
                </div>
              </div>
            ))}
          </div>
          <DialogFooter className="flex flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={() => setConsentDialogOpen(false)}
              className="flex-1"
            >
              Annuler
            </Button>
            <Button onClick={saveConsents} disabled={loading} className="flex-1">
              Sauvegarder
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Export Dialog */}
      <Dialog open={exportDialogOpen} onOpenChange={setExportDialogOpen}>
        <DialogContent className="w-[95vw] sm:max-w-lg p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle>Demander mes données</DialogTitle>
            <DialogDescription>
              Vous recevrez un email avec un lien sécurisé pour télécharger
              toutes vos données personnelles sous 48 heures.
            </DialogDescription>
          </DialogHeader>
          <Alert>
            <Mail className="h-4 w-4" />
            <AlertDescription>
              Les données incluront : profil, historique de poids, plans
              alimentaires, messages, rendez-vous et photos de progression.
            </AlertDescription>
          </Alert>
          <DialogFooter className="flex flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={() => setExportDialogOpen(false)}
              className="flex-1"
            >
              Annuler
            </Button>
            <Button onClick={requestDataExport} disabled={loading} className="flex-1">
              Confirmer la demande
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="w-[95vw] sm:max-w-lg p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle className="text-red-600">
              Demander la suppression de mes données
            </DialogTitle>
            <DialogDescription>
              Cette action supprimera définitivement toutes vos données
              personnelles. Certaines données peuvent être conservées pour des
              obligations légales.
            </DialogDescription>
          </DialogHeader>
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Attention : Cette action est irréversible. Vous perdrez l'accès à
              votre compte et à toutes vos données.
            </AlertDescription>
          </Alert>
          <DialogFooter className="flex flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              className="flex-1"
            >
              Annuler
            </Button>
            <Button
              variant="destructive"
              onClick={requestDataDeletion}
              disabled={loading}
              className="flex-1"
            >
              Confirmer la suppression
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
