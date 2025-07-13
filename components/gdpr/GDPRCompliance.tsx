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
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { createClient } from "@/lib/supabase/client";
import {
  AlertTriangle,
  Clock,
  Download,
  FileText,
  Settings,
  Shield,
  Trash2,
} from "lucide-react";
import { useEffect, useState } from "react";

interface ConsentRecord {
  id: string;
  client_id: string;
  consent_type: string;
  granted: boolean;
  granted_at: string | null;
  withdrawn_at: string | null;
  version: string;
  purpose: string;
  legal_basis: string;
  client?: {
    first_name: string;
    last_name: string;
  };
}

interface DataExportRequest {
  id: string;
  client_id: string;
  request_type: string;
  status: string;
  requested_at: string;
  completed_at: string | null;
  download_url: string | null;
  expires_at: string | null;
  client?: {
    first_name: string;
    last_name: string;
  };
}

interface RetentionPolicy {
  id: string;
  data_category: string;
  retention_period_years: number;
  auto_delete: boolean;
  description: string;
}

export function GDPRCompliance() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [consentRecords, setConsentRecords] = useState<ConsentRecord[]>([]);
  const [exportRequests, setExportRequests] = useState<DataExportRequest[]>([]);
  const [retentionPolicies, setRetentionPolicies] = useState<RetentionPolicy[]>(
    []
  );

  // Dialog states
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<string>("");
  const [clients, setClients] = useState<any[]>([]);

  const supabase = createClient();

  useEffect(() => {
    loadGDPRData();
    loadClients();
  }, []);

  const loadGDPRData = async () => {
    try {
      setLoading(true);

      // Load consent records
      const { data: consents } = await supabase
        .from("consent_records")
        .select(
          `
          *,
          client:clients(first_name, last_name)
        `
        )
        .order("created_at", { ascending: false });

      if (consents) setConsentRecords(consents);

      // Load export requests
      const { data: exports } = await supabase
        .from("data_export_requests")
        .select(
          `
          *,
          client:clients(first_name, last_name)
        `
        )
        .order("requested_at", { ascending: false });

      if (exports) setExportRequests(exports);

      // Load retention policies
      const { data: policies } = await supabase
        .from("data_retention_policies")
        .select("*")
        .order("data_category");

      if (policies) setRetentionPolicies(policies);
    } catch (error) {
      console.error("Error loading GDPR data:", error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les données RGPD",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadClients = async () => {
    try {
      const { data } = await supabase
        .from("clients")
        .select("id, first_name, last_name")
        .order("first_name");

      if (data) setClients(data);
    } catch (error) {
      console.error("Error loading clients:", error);
    }
  };

  const handleCreateExportRequest = async () => {
    if (!selectedClient) return;

    try {
      setLoading(true);

      const { data, error } = await supabase.rpc("create_data_export_request", {
        p_dietitian_id: (await supabase.auth.getUser()).data.user?.id,
        p_client_id: selectedClient,
        p_request_type: "export",
      });

      if (error) throw error;

      toast({
        title: "Succès",
        description: "Demande d'export créée avec succès",
      });

      setExportDialogOpen(false);
      setSelectedClient("");
      loadGDPRData();
    } catch (error) {
      console.error("Error creating export request:", error);
      toast({
        title: "Erreur",
        description: "Impossible de créer la demande d'export",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAnonymizeClient = async () => {
    if (!selectedClient) return;

    try {
      setLoading(true);

      const { data, error } = await supabase.rpc("anonymize_client_data", {
        p_client_id: selectedClient,
        p_dietitian_id: (await supabase.auth.getUser()).data.user?.id,
        p_anonymization_type: "full",
      });

      if (error) throw error;

      toast({
        title: "Succès",
        description: "Données client anonymisées avec succès",
      });

      setDeleteDialogOpen(false);
      setSelectedClient("");
      loadGDPRData();
    } catch (error) {
      console.error("Error anonymizing client:", error);
      toast({
        title: "Erreur",
        description: "Impossible d'anonymiser les données",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateRetentionPolicy = async (
    policyId: string,
    years: number,
    autoDelete: boolean
  ) => {
    try {
      const { error } = await supabase
        .from("data_retention_policies")
        .update({
          retention_period_years: years,
          auto_delete: autoDelete,
        })
        .eq("id", policyId);

      if (error) throw error;

      toast({
        title: "Succès",
        description: "Politique de rétention mise à jour",
      });

      loadGDPRData();
    } catch (error) {
      console.error("Error updating retention policy:", error);
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour la politique",
        variant: "destructive",
      });
    }
  };

  const getConsentStatusBadge = (record: ConsentRecord) => {
    if (record.withdrawn_at) {
      return <Badge variant="destructive">Retiré</Badge>;
    } else if (record.granted) {
      return (
        <Badge variant="default" className="bg-green-600">
          Accordé
        </Badge>
      );
    } else {
      return <Badge variant="secondary">En attente</Badge>;
    }
  };

  const getExportStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return (
          <Badge variant="default" className="bg-green-600">
            Terminé
          </Badge>
        );
      case "processing":
        return <Badge variant="secondary">En cours</Badge>;
      case "failed":
        return <Badge variant="destructive">Échec</Badge>;
      default:
        return <Badge variant="outline">En attente</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Conformité RGPD</h1>
          <p className="text-gray-600">
            Gestion de la protection des données personnelles
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => setExportDialogOpen(true)}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Download className="mr-2 h-4 w-4" />
            Exporter des données
          </Button>
          <Button
            onClick={() => setDeleteDialogOpen(true)}
            variant="outline"
            className="border-red-200 text-red-600 hover:bg-red-50"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Droit à l'oubli
          </Button>
        </div>
      </div>

      <Tabs defaultValue="consent" className="space-y-6">
        <TabsList className="grid grid-cols-4 w-full max-w-2xl">
          <TabsTrigger value="consent" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Consentements
          </TabsTrigger>
          <TabsTrigger value="exports" className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            Exports
          </TabsTrigger>
          <TabsTrigger value="retention" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Rétention
          </TabsTrigger>
          <TabsTrigger value="privacy" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Confidentialité
          </TabsTrigger>
        </TabsList>

        {/* Consent Records Tab */}
        <TabsContent value="consent" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-blue-600" />
                Registre des consentements
              </CardTitle>
              <CardDescription>
                Suivi des consentements accordés par vos clients pour le
                traitement de leurs données
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {consentRecords.map((record) => (
                  <div
                    key={record.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="space-y-1">
                      <p className="font-medium">
                        {record.client?.first_name} {record.client?.last_name}
                      </p>
                      <p className="text-sm text-gray-600">
                        Type: {record.consent_type} • Base légale:{" "}
                        {record.legal_basis}
                      </p>
                      <p className="text-xs text-gray-500">
                        {record.granted_at
                          ? `Accordé le ${new Date(
                              record.granted_at
                            ).toLocaleDateString("fr-FR")}`
                          : "Non accordé"}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {getConsentStatusBadge(record)}
                      <Badge variant="outline">v{record.version}</Badge>
                    </div>
                  </div>
                ))}
                {consentRecords.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    Aucun consentement enregistré
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Data Exports Tab */}
        <TabsContent value="exports" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Download className="h-5 w-5 text-green-600" />
                Demandes d'export de données
              </CardTitle>
              <CardDescription>
                Historique des exports de données pour la portabilité des
                données
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {exportRequests.map((request) => (
                  <div
                    key={request.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="space-y-1">
                      <p className="font-medium">
                        {request.client?.first_name} {request.client?.last_name}
                      </p>
                      <p className="text-sm text-gray-600">
                        Type: {request.request_type}
                      </p>
                      <p className="text-xs text-gray-500">
                        Demandé le{" "}
                        {new Date(request.requested_at).toLocaleDateString(
                          "fr-FR"
                        )}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {getExportStatusBadge(request.status)}
                      {request.download_url &&
                        request.status === "completed" && (
                          <Button size="sm" variant="outline">
                            <Download className="h-4 w-4" />
                          </Button>
                        )}
                    </div>
                  </div>
                ))}
                {exportRequests.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    Aucune demande d'export
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Retention Policies Tab */}
        <TabsContent value="retention" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-orange-600" />
                Politiques de rétention des données
              </CardTitle>
              <CardDescription>
                Configuration des durées de conservation selon le type de
                données
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {retentionPolicies.map((policy) => (
                  <div
                    key={policy.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="space-y-1">
                      <p className="font-medium capitalize">
                        {policy.data_category.replace("_", " ")}
                      </p>
                      <p className="text-sm text-gray-600">
                        {policy.description}
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-sm">
                        <span className="font-medium">
                          {policy.retention_period_years}
                        </span>{" "}
                        ans
                      </div>
                      <Badge
                        variant={policy.auto_delete ? "default" : "secondary"}
                      >
                        {policy.auto_delete ? "Suppression auto" : "Manuel"}
                      </Badge>
                      <Button size="sm" variant="outline">
                        <Settings className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Privacy Policy Tab */}
        <TabsContent value="privacy" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-purple-600" />
                Politique de confidentialité
              </CardTitle>
              <CardDescription>
                Gestion des versions et acceptations de la politique de
                confidentialité
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  La politique de confidentialité actuelle (v1.0) est en vigueur
                  depuis le début du service. Toute modification nécessitera une
                  nouvelle acceptation des utilisateurs.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Export Dialog */}
      <Dialog open={exportDialogOpen} onOpenChange={setExportDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Exporter les données d'un client</DialogTitle>
            <DialogDescription>
              Générer un export complet des données personnelles d'un client
              conformément au RGPD
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Sélectionner un client</Label>
              <Select value={selectedClient} onValueChange={setSelectedClient}>
                <SelectTrigger>
                  <SelectValue placeholder="Choisir un client" />
                </SelectTrigger>
                <SelectContent>
                  {clients.map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.first_name} {client.last_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setExportDialogOpen(false)}
            >
              Annuler
            </Button>
            <Button
              onClick={handleCreateExportRequest}
              disabled={!selectedClient || loading}
            >
              Créer l'export
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete/Anonymize Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-red-600">Droit à l'oubli</DialogTitle>
            <DialogDescription>
              Anonymiser complètement les données d'un client. Cette action est
              irréversible.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                L'anonymisation remplacera toutes les données personnelles par
                des données génériques. Les données cliniques nécessaires
                peuvent être conservées selon vos obligations légales.
              </AlertDescription>
            </Alert>
            <div className="space-y-2">
              <Label>Sélectionner un client</Label>
              <Select value={selectedClient} onValueChange={setSelectedClient}>
                <SelectTrigger>
                  <SelectValue placeholder="Choisir un client" />
                </SelectTrigger>
                <SelectContent>
                  {clients.map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.first_name} {client.last_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
            >
              Annuler
            </Button>
            <Button
              variant="destructive"
              onClick={handleAnonymizeClient}
              disabled={!selectedClient || loading}
            >
              Anonymiser les données
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
