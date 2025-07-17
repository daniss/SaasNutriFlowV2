"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuthNew";
import { formatDate } from "@/lib/formatters";
import { supabase, type Document } from "@/lib/supabase";
import {
  Download,
  Eye,
  EyeOff,
  FileIcon,
  FileText,
  Image,
  MoreVertical,
  Trash2,
} from "lucide-react";
import { useEffect, useState } from "react";

interface DocumentListProps {
  clientId: string;
  refreshTrigger?: number;
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

export function DocumentList({ clientId, refreshTrigger }: DocumentListProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [documentToDelete, setDocumentToDelete] = useState<Document | null>(
    null
  );

  useEffect(() => {
    if (user && clientId) {
      fetchDocuments();
    }
  }, [user, clientId, refreshTrigger]);

  const fetchDocuments = async () => {
    try {
      const { data, error } = await supabase
        .from("documents")
        .select("*")
        .eq("client_id", clientId)
        .eq("dietitian_id", user?.id)
        .order("upload_date", { ascending: false });

      if (error) throw error;

      // Filter out progress photos - they should only appear in the progress photos section
      const filteredDocuments = (data || []).filter(doc => {
        if (doc.metadata && typeof doc.metadata === 'object' && 
            'type' in doc.metadata && doc.metadata.type === 'progress_photo') {
          return false;
        }
        return true;
      });

      setDocuments(filteredDocuments);
    } catch (error) {
      console.error("Error fetching documents:", error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les documents",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const downloadDocument = async (document: Document) => {
    try {
      const { data, error } = await supabase.storage
        .from("documents")
        .download(document.file_path);

      if (error) throw error;

      // Create download link
      const url = URL.createObjectURL(data);
      const a = window.document.createElement("a");
      a.href = url;
      a.download = document.name;
      window.document.body.appendChild(a);
      a.click();
      window.document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: "Téléchargement démarré",
        description: `Téléchargement de ${document.name}`,
      });
    } catch (error) {
      console.error("Download error:", error);
      toast({
        title: "Erreur de téléchargement",
        description: "Impossible de télécharger le document",
        variant: "destructive",
      });
    }
  };

  const toggleVisibility = async (document: Document) => {
    try {
      const { error } = await supabase
        .from("documents")
        .update({ is_visible_to_client: !document.is_visible_to_client })
        .eq("id", document.id);

      if (error) throw error;

      setDocuments((prev) =>
        prev.map((doc) =>
          doc.id === document.id
            ? { ...doc, is_visible_to_client: !doc.is_visible_to_client }
            : doc
        )
      );

      toast({
        title: "Visibilité mise à jour",
        description: `Document ${
          document.is_visible_to_client ? "masqué au" : "visible par le"
        } client`,
      });
    } catch (error) {
      console.error("Visibility update error:", error);
      toast({
        title: "Erreur",
        description: "Impossible de modifier la visibilité",
        variant: "destructive",
      });
    }
  };

  const confirmDelete = (document: Document) => {
    setDocumentToDelete(document);
    setDeleteDialogOpen(true);
  };

  const deleteDocument = async () => {
    if (!documentToDelete) return;

    try {
      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from("documents")
        .remove([documentToDelete.file_path]);

      if (storageError) {
        console.error("Storage deletion error:", storageError);
        // Continue with database deletion even if storage fails
      }

      // Delete from database
      const { error: dbError } = await supabase
        .from("documents")
        .delete()
        .eq("id", documentToDelete.id);

      if (dbError) throw dbError;

      setDocuments((prev) =>
        prev.filter((doc) => doc.id !== documentToDelete.id)
      );

      toast({
        title: "Document supprimé",
        description: "Le document a été supprimé avec succès",
      });
    } catch (error) {
      console.error("Delete error:", error);
      toast({
        title: "Erreur de suppression",
        description: "Impossible de supprimer le document",
        variant: "destructive",
      });
    } finally {
      setDeleteDialogOpen(false);
      setDocumentToDelete(null);
    }
  };

  const getFileIcon = (mimeType: string | null) => {
    if (!mimeType) return FileText;

    if (mimeType.startsWith("image/")) return Image;
    if (mimeType === "application/pdf") return FileText;
    return FileIcon;
  };

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return "Taille inconnue";
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (documents.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Aucun document
          </h3>
          <p className="text-gray-500">
            Téléchargez des documents pour ce client
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="grid gap-4">
        {documents.map((document) => {
          const FileIcon = getFileIcon(document.mime_type);

          return (
            <Card key={document.id}>
              <CardContent className="p-3 md:p-4">
                <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
                  <div className="flex items-center space-x-3 min-w-0 flex-1">
                    <FileIcon className="h-8 w-8 md:h-10 md:w-10 text-blue-500 flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <h4 className="text-sm font-medium text-gray-900 truncate">
                        {document.name}
                      </h4>
                      <div className="flex flex-wrap items-center gap-1 md:gap-2 mt-1">
                        <Badge
                          variant="secondary"
                          className={`text-xs ${
                            CATEGORY_COLORS[
                              document.category as keyof typeof CATEGORY_COLORS
                            ]
                          }`}
                        >
                          {
                            CATEGORY_LABELS[
                              document.category as keyof typeof CATEGORY_LABELS
                            ]
                          }
                        </Badge>
                        <span className="text-xs text-gray-500">
                          {formatFileSize(document.file_size)}
                        </span>
                        <span className="text-xs text-gray-500 hidden sm:inline">
                          {formatDate(document.upload_date)}
                        </span>
                      </div>
                      {document.description && (
                        <p className="text-xs text-gray-600 mt-1 truncate">
                          {document.description}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end space-x-2 flex-shrink-0">
                    {document.is_visible_to_client ? (
                      <div title="Visible par le client">
                        <Eye className="h-4 w-4 text-green-500" />
                      </div>
                    ) : (
                      <div title="Masqué au client">
                        <EyeOff className="h-4 w-4 text-gray-400" />
                      </div>
                    )}

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => downloadDocument(document)}
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Télécharger
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => toggleVisibility(document)}
                        >
                          {document.is_visible_to_client ? (
                            <>
                              <EyeOff className="h-4 w-4 mr-2" />
                              Masquer au client
                            </>
                          ) : (
                            <>
                              <Eye className="h-4 w-4 mr-2" />
                              Rendre visible
                            </>
                          )}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => confirmDelete(document)}
                          className="text-red-600"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Supprimer
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer le document</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer "{documentToDelete?.name}" ?
              Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={deleteDocument}
              className="bg-red-600 hover:bg-red-700"
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
