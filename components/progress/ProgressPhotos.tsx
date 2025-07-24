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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuthNew";
import { formatDate } from "@/lib/formatters";
import { supabase } from "@/lib/supabase";

// Local Document interface since it's not exported from supabase
interface Document {
  id: string;
  name: string;
  file_path: string;
  file_size: number;
  file_type: string;
  mime_type: string;
  client_id: string;
  dietitian_id: string;
  visibility: string;
  category: string;
  description: string;
  upload_date: string;
  metadata: any;
  created_at: string;
}
import {
  Calendar,
  Camera,
  ChevronLeft,
  ChevronRight,
  Download,
  Trash2,
  ZoomIn,
} from "lucide-react";
import { useEffect, useState } from "react";

interface ProgressPhotosProps {
  clientId: string;
  refreshTrigger?: number;
}

export function ProgressPhotos({
  clientId,
  refreshTrigger,
}: ProgressPhotosProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [photos, setPhotos] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPhoto, setSelectedPhoto] = useState<Document | null>(null);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [photoToDelete, setPhotoToDelete] = useState<Document | null>(null);
  const [photoUrls, setPhotoUrls] = useState<Record<string, string>>({});

  useEffect(() => {
    if (user && clientId) {
      fetchProgressPhotos();
    }
  }, [user, clientId, refreshTrigger]);

  const fetchProgressPhotos = async () => {
    try {
      const { data, error } = await supabase
        .from("documents")
        .select("*")
        .eq("client_id", clientId)
        .eq("dietitian_id", user?.id)
        .eq("category", "photo")
        .order("upload_date", { ascending: false });

      if (error) throw error;

      const progressPhotos = (data || []).filter(
        (doc) =>
          doc.metadata &&
          typeof doc.metadata === "object" &&
          "type" in doc.metadata &&
          doc.metadata.type === "progress_photo" &&
          // Only show photos that are visible to nutritionist (shared by client)
          (doc.metadata.visible_to_nutritionist === true || doc.metadata.uploaded_by === "nutritionist")
      );

      setPhotos(progressPhotos);

      // Create blob URLs for display using the same storage access pattern as download
      const urls: Record<string, string> = {};
      for (const photo of progressPhotos) {
        try {
          const { data, error } = await supabase.storage
            .from("documents")
            .download(photo.file_path);

          if (error) {
            console.error("Error downloading photo for display:", photo.id, error);
            continue;
          }

          // Create object URL for display
          const url = URL.createObjectURL(data);
          urls[photo.id] = url;
        } catch (error) {
          console.error("Error creating blob URL for photo:", photo.id, error);
        }
      }
      setPhotoUrls(urls);
    } catch (error) {
      console.error("Error fetching progress photos:", error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les photos de progrès",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const downloadPhoto = async (photo: Document) => {
    try {
      const { data, error } = await supabase.storage
        .from("documents")
        .download(photo.file_path);

      if (error) throw error;

      // Create download link
      const url = URL.createObjectURL(data);
      const a = window.document.createElement("a");
      a.href = url;
      a.download = photo.name;
      window.document.body.appendChild(a);
      a.click();
      window.document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: "Téléchargement démarré",
        description: `Téléchargement de ${photo.name}`,
      });
    } catch (error) {
      console.error("Download error:", error);
      toast({
        title: "Erreur de téléchargement",
        description: "Impossible de télécharger la photo",
        variant: "destructive",
      });
    }
  };

  const confirmDelete = (photo: Document) => {
    setPhotoToDelete(photo);
    setDeleteDialogOpen(true);
  };

  const deletePhoto = async () => {
    if (!photoToDelete) return;

    try {
      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from("documents")
        .remove([photoToDelete.file_path]);

      if (storageError) {
        console.error("Storage deletion error:", storageError);
      }

      // Delete from database
      const { error: dbError } = await supabase
        .from("documents")
        .delete()
        .eq("id", photoToDelete.id);

      if (dbError) throw dbError;

      setPhotos((prev) =>
        prev.filter((photo) => photo.id !== photoToDelete.id)
      );

      // Remove from URLs cache
      setPhotoUrls((prev) => {
        const newUrls = { ...prev };
        delete newUrls[photoToDelete.id];
        return newUrls;
      });

      toast({
        title: "Photo supprimée",
        description: "La photo de progrès a été supprimée avec succès",
      });
    } catch (error) {
      console.error("Delete error:", error);
      toast({
        title: "Erreur de suppression",
        description: "Impossible de supprimer la photo",
        variant: "destructive",
      });
    } finally {
      setDeleteDialogOpen(false);
      setPhotoToDelete(null);
    }
  };

  const openPhotoViewer = (photo: Document, index: number) => {
    setSelectedPhoto(photo);
    setSelectedIndex(index);
  };

  const navigatePhoto = (direction: "prev" | "next") => {
    if (!selectedPhoto) return;

    let newIndex = selectedIndex;
    if (direction === "prev" && selectedIndex > 0) {
      newIndex = selectedIndex - 1;
    } else if (direction === "next" && selectedIndex < photos.length - 1) {
      newIndex = selectedIndex + 1;
    }

    setSelectedIndex(newIndex);
    setSelectedPhoto(photos[newIndex]);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (photos.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <Camera className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Aucune photo de progrès
          </h3>
          <p className="text-gray-500">
            Ajoutez des photos pour suivre l'évolution visuelle de votre client
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="grid gap-3 md:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {photos.map((photo, index) => {
          const photoUrl = photoUrls[photo.id];

          return (
            <Card key={photo.id} className="overflow-hidden">
              <div className="aspect-square relative group cursor-pointer">
                {photoUrl ? (
                  <img
                    src={photoUrl}
                    alt={photo.name}
                    className="w-full h-full object-cover transition-transform group-hover:scale-105"
                    onClick={() => openPhotoViewer(photo, index)}
                  />
                ) : (
                  <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                    <Camera className="h-8 w-8 text-gray-400" />
                  </div>
                )}

                {/* Overlay */}
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all duration-200 flex items-center justify-center">
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex space-x-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        openPhotoViewer(photo, index);
                      }}
                    >
                      <ZoomIn className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        downloadPhoto(photo);
                      }}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        confirmDelete(photo);
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>

              <CardContent className="p-2 md:p-3">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-2 mb-2">
                  <Badge variant="secondary" className="text-xs w-fit">
                    <Calendar className="h-3 w-3 mr-1" />
                    <span className="hidden sm:inline">{formatDate(photo.upload_date)}</span>
                    <span className="sm:hidden">{formatDate(photo.upload_date, { month: 'short', day: 'numeric' })}</span>
                  </Badge>
                  {photo.metadata?.uploaded_by === "client" && (
                    <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-700 w-fit">
                      Client
                    </Badge>
                  )}
                </div>
                {photo.description && (
                  <p className="text-xs text-gray-600 truncate">
                    {photo.description}
                  </p>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Photo Viewer Dialog */}
      <Dialog
        open={!!selectedPhoto}
        onOpenChange={() => setSelectedPhoto(null)}
      >
        <DialogContent className="w-[95vw] sm:max-w-4xl p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle>{selectedPhoto?.name}</DialogTitle>
            <DialogDescription>
              {selectedPhoto && formatDate(selectedPhoto.upload_date)}
              {selectedPhoto?.description && ` • ${selectedPhoto.description}`}
            </DialogDescription>
          </DialogHeader>

          <div className="relative">
            {selectedPhoto && photoUrls[selectedPhoto.id] && (
              <img
                src={photoUrls[selectedPhoto.id]}
                alt={selectedPhoto.name}
                className="w-full h-auto max-h-[60vh] object-contain rounded-lg"
              />
            )}

            {/* Navigation */}
            {photos.length > 1 && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white hover:bg-opacity-70"
                  onClick={() => navigatePhoto("prev")}
                  disabled={selectedIndex === 0}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white hover:bg-opacity-70"
                  onClick={() => navigatePhoto("next")}
                  disabled={selectedIndex === photos.length - 1}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>

                {/* Photo counter */}
                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-50 text-white px-3 py-1 rounded-full text-sm">
                  {selectedIndex + 1} / {photos.length}
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="w-[95vw] sm:max-w-lg">
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer la photo</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer cette photo de progrès ? Cette
              action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={deletePhoto}
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
