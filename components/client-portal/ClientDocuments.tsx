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
import { useToast } from "@/hooks/use-toast";
import { clientGet } from "@/lib/client-api";
import {
  AlertTriangle,
  Calendar,
  CheckCircle,
  Download,
  Eye,
  FileText,
  FolderOpen,
  User,
} from "lucide-react";
import { useEffect, useState } from "react";

interface ClientDocument {
  id: string;
  name: string;
  file_path: string;
  file_size: number;
  mime_type: string;
  category: string;
  description?: string;
  upload_date: string;
  is_visible_to_client: boolean;
  dietitian?: {
    first_name: string;
    last_name: string;
  };
}

const CATEGORY_LABELS = {
  general: "Général",
  blood_test: "Analyses de sang",
  prescription: "Prescriptions",
  photo: "Photos",
  report: "Rapports",
  meal_plan: "Plans alimentaires",
  exercise_plan: "Plans d'exercices",
};

const CATEGORY_COLORS = {
  general: "bg-gray-100 text-gray-800",
  blood_test: "bg-red-100 text-red-800",
  prescription: "bg-blue-100 text-blue-800",
  photo: "bg-green-100 text-green-800",
  report: "bg-purple-100 text-purple-800",
  meal_plan: "bg-orange-100 text-orange-800",
  exercise_plan: "bg-indigo-100 text-indigo-800",
};

const MIME_TYPE_ICONS = {
  "application/pdf": "📄",
  "image/jpeg": "🖼️",
  "image/png": "🖼️",
  "image/webp": "🖼️",
  "text/plain": "📝",
  "application/msword": "📝",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
    "📝",
};

export function ClientDocuments() {
  const { client } = useClientAuth();
  const { toast } = useToast();
  const [documents, setDocuments] = useState<ClientDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloadingIds, setDownloadingIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (client) {
      loadDocuments();
    }
  }, [client]);

  const loadDocuments = async () => {
    if (!client) return;

    try {
      setLoading(true);

      const response = await clientGet("/api/client-auth/documents");
      if (response.success && response.data) {
        setDocuments(response.data.documents || []);
      }
    } catch (error) {
      console.error("Error loading documents:", error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les documents",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const downloadDocument = async (doc: ClientDocument) => {
    if (!client) return;

    try {
      setDownloadingIds((prev) => new Set(prev).add(doc.id));

      // For file downloads, we need to use fetch directly to handle blob response
      const authToken = localStorage.getItem("client-token");
      if (!authToken) {
        throw new Error("Authentication required");
      }

      const response = await fetch(`/api/client-auth/documents/download`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          documentId: doc.id,
          filePath: doc.file_path,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to download document");
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = window.document.createElement("a");
      a.href = url;
      a.download = doc.name;
      window.document.body.appendChild(a);
      a.click();
      window.document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: "Téléchargement démarré",
        description: `Téléchargement de ${doc.name}`,
      });
    } catch (error) {
      console.error("Download error:", error);
      toast({
        title: "Erreur de téléchargement",
        description: "Impossible de télécharger le document",
        variant: "destructive",
      });
    } finally {
      setDownloadingIds((prev) => {
        const newSet = new Set(prev);
        newSet.delete(doc.id);
        return newSet;
      });
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="animate-pulse">
            <div className="h-24 bg-gray-100 rounded-lg"></div>
          </div>
        ))}
      </div>
    );
  }

  const visibleDocuments = documents.filter((doc) => doc.is_visible_to_client);

  if (visibleDocuments.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="mx-auto h-16 w-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
          <FolderOpen className="h-8 w-8 text-slate-400" />
        </div>
        <h3 className="text-lg font-semibold text-slate-900 mb-2">
          Aucun document disponible
        </h3>
        <p className="text-slate-600 mb-4">
          Votre diététicien n'a pas encore partagé de documents avec vous.
        </p>
        <Alert className="max-w-md mx-auto">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Les documents partagés par votre diététicien apparaîtront ici
            automatiquement.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Card */}
      <Card className="bg-gradient-to-r from-emerald-50 to-teal-50 border-emerald-200">
        <CardHeader>
          <CardTitle className="text-emerald-800 flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Mes Documents
          </CardTitle>
          <CardDescription className="text-emerald-700">
            {visibleDocuments.length} document
            {visibleDocuments.length > 1 ? "s" : ""} partagé
            {visibleDocuments.length > 1 ? "s" : ""} par votre diététicien
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Documents List */}
      <div className="space-y-4">
        {visibleDocuments.map((document) => (
          <Card
            key={document.id}
            className="hover:shadow-md transition-shadow duration-200"
          >
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4 flex-1">
                  <div className="text-2xl flex-shrink-0">
                    {MIME_TYPE_ICONS[
                      document.mime_type as keyof typeof MIME_TYPE_ICONS
                    ] || "📎"}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-slate-900 truncate">
                        {document.name}
                      </h3>
                      <Badge
                        className={`${
                          CATEGORY_COLORS[
                            document.category as keyof typeof CATEGORY_COLORS
                          ]
                        } shrink-0`}
                      >
                        {
                          CATEGORY_LABELS[
                            document.category as keyof typeof CATEGORY_LABELS
                          ]
                        }
                      </Badge>
                    </div>

                    {document.description && (
                      <p className="text-slate-600 text-sm mb-3 line-clamp-2">
                        {document.description}
                      </p>
                    )}

                    <div className="flex items-center gap-4 text-sm text-slate-500">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {formatDate(document.upload_date)}
                      </div>
                      <div className="flex items-center gap-1">
                        <FileText className="h-4 w-4" />
                        {formatFileSize(document.file_size)}
                      </div>
                      {document.dietitian && (
                        <div className="flex items-center gap-1">
                          <User className="h-4 w-4" />
                          {document.dietitian.first_name}{" "}
                          {document.dietitian.last_name}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 ml-4">
                  <Badge
                    variant="outline"
                    className="text-emerald-700 border-emerald-200"
                  >
                    <Eye className="h-3 w-3 mr-1" />
                    Visible
                  </Badge>
                  <Button
                    onClick={() => downloadDocument(document)}
                    disabled={downloadingIds.has(document.id)}
                    size="sm"
                    className="bg-emerald-600 hover:bg-emerald-700"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    {downloadingIds.has(document.id)
                      ? "Téléchargement..."
                      : "Télécharger"}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Info Alert */}
      <Alert>
        <CheckCircle className="h-4 w-4" />
        <AlertDescription>
          Seuls les documents que votre diététicien a choisi de partager avec
          vous sont visibles ici. Pour toute question concernant vos documents,
          contactez directement votre diététicien.
        </AlertDescription>
      </Alert>
    </div>
  );
}
