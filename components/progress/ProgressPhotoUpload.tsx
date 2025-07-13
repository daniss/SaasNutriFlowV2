"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuthNew";
import { supabase } from "@/lib/supabase";
import { Camera, X } from "lucide-react";
import { useState } from "react";

interface ProgressPhotoUploadProps {
  clientId: string;
  onUploadComplete?: () => void;
  trigger?: React.ReactNode;
}

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

export function ProgressPhotoUpload({
  clientId,
  onUploadComplete,
  trigger,
}: ProgressPhotoUploadProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [notes, setNotes] = useState("");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      toast({
        title: "Type de fichier non autorisé",
        description: "Veuillez sélectionner une image (JPEG, PNG, WebP).",
        variant: "destructive",
      });
      return;
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      toast({
        title: "Fichier trop volumineux",
        description: "La taille de l'image ne doit pas dépasser 5 MB.",
        variant: "destructive",
      });
      return;
    }

    setSelectedFile(file);

    // Create preview
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
  };

  const handleUpload = async () => {
    if (!selectedFile || !user) {
      toast({
        title: "Fichier manquant",
        description: "Veuillez sélectionner une photo.",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);

    try {
      // Generate unique file path
      const fileExtension = selectedFile.name.split(".").pop();
      const fileName = `progress-${Date.now()}-${Math.random()
        .toString(36)
        .substring(7)}.${fileExtension}`;
      const filePath = `progress-photos/${user.id}/${clientId}/${fileName}`;

      // Upload file to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("documents")
        .upload(filePath, selectedFile, {
          cacheControl: "3600",
          upsert: false,
        });

      if (uploadError) {
        console.error("Upload error:", uploadError);
        throw new Error("Échec du téléchargement de la photo");
      }

      // Save photo metadata to documents table
      const { error: dbError } = await supabase.from("documents").insert({
        client_id: clientId,
        dietitian_id: user.id,
        name: `Photo de progrès - ${new Date().toLocaleDateString("fr-FR")}`,
        file_path: uploadData.path,
        file_size: selectedFile.size,
        mime_type: selectedFile.type,
        category: "photo",
        description: notes || null,
        is_visible_to_client: true,
        metadata: {
          type: "progress_photo",
          upload_date: new Date().toISOString(),
        },
      });

      if (dbError) {
        console.error("Database error:", dbError);
        throw new Error("Échec de l'enregistrement de la photo");
      }

      toast({
        title: "Photo téléchargée",
        description: "La photo de progrès a été ajoutée avec succès.",
      });

      // Reset form
      setSelectedFile(null);
      setNotes("");
      setPreviewUrl(null);
      setIsOpen(false);

      // Callback for parent component
      onUploadComplete?.();
    } catch (error) {
      console.error("Upload process error:", error);
      toast({
        title: "Erreur de téléchargement",
        description:
          error instanceof Error
            ? error.message
            : "Une erreur inattendue s'est produite.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const removeSelectedFile = () => {
    setSelectedFile(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button>
            <Camera className="h-4 w-4 mr-2" />
            Ajouter une photo de progrès
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Ajouter une photo de progrès</DialogTitle>
          <DialogDescription>
            Prenez ou téléchargez une photo pour suivre les progrès visuels de
            votre client
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* File Selection */}
          <div>
            <Label htmlFor="photo">Photo *</Label>
            {!selectedFile ? (
              <div className="mt-1">
                <label htmlFor="photo-upload" className="cursor-pointer">
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
                    <Camera className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                    <p className="text-sm text-gray-600">
                      Cliquez pour sélectionner une photo
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      JPEG, PNG, WebP (max. 5MB)
                    </p>
                  </div>
                </label>
                <input
                  id="photo-upload"
                  type="file"
                  className="hidden"
                  onChange={handleFileSelect}
                  accept={ALLOWED_IMAGE_TYPES.join(",")}
                />
              </div>
            ) : (
              <div className="mt-1 space-y-3">
                {previewUrl && (
                  <div className="relative inline-block">
                    <img
                      src={previewUrl}
                      alt="Aperçu"
                      className="h-32 w-32 object-cover rounded-lg border"
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={removeSelectedFile}
                      className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-red-500 text-white hover:bg-red-600"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                )}
                <div className="p-3 border rounded-lg bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">{selectedFile.name}</p>
                      <p className="text-xs text-gray-500">
                        {formatFileSize(selectedFile.size)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Notes */}
          <div>
            <Label htmlFor="notes">Notes (optionnel)</Label>
            <Textarea
              id="notes"
              placeholder="Contexte de la photo, observations, mesures..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Annuler
          </Button>
          <Button
            onClick={handleUpload}
            disabled={!selectedFile || isUploading}
          >
            {isUploading ? "Téléchargement..." : "Ajouter la photo"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
