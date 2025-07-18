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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import useAuditLogger from "@/hooks/useAuditLogger";
import { useAuth } from "@/hooks/useAuthNew";
import { supabase } from "@/lib/supabase";
import { FileText, Upload, X } from "lucide-react";
import { useState } from "react";

interface DocumentUploadProps {
  clientId: string;
  onUploadComplete?: () => void;
  trigger?: React.ReactNode;
}

const DOCUMENT_CATEGORIES = [
  { value: "general", label: "Général" },
  { value: "blood_test", label: "Analyses de sang" },
  { value: "prescription", label: "Prescriptions" },
  { value: "photo", label: "Photos" },
  { value: "report", label: "Rapports" },
  { value: "meal_plan", label: "Plans alimentaires" },
  { value: "exercise_plan", label: "Plans d'exercices" },
];

const ALLOWED_FILE_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
  "text/plain",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export function DocumentUpload({
  clientId,
  onUploadComplete,
  trigger,
}: DocumentUploadProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const { logDocumentUpload } = useAuditLogger();
  const [isOpen, setIsOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [isVisibleToClient, setIsVisibleToClient] = useState(true);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      toast({
        title: "Type de fichier non autorisé",
        description:
          "Veuillez sélectionner un fichier PDF, image, ou document Word.",
        variant: "destructive",
      });
      return;
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      toast({
        title: "Fichier trop volumineux",
        description: "La taille du fichier ne doit pas dépasser 10 MB.",
        variant: "destructive",
      });
      return;
    }

    setSelectedFile(file);
  };

  const handleUpload = async () => {
    if (!selectedFile || !user || !category) {
      toast({
        title: "Informations manquantes",
        description: "Veuillez sélectionner un fichier et une catégorie.",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);

    try {
      // Generate unique file path
      const fileExtension = selectedFile.name.split(".").pop();
      const fileName = `${Date.now()}-${Math.random()
        .toString(36)
        .substring(7)}.${fileExtension}`;
      const filePath = `${user.id}/${clientId}/${fileName}`;

      // Upload file to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("documents")
        .upload(filePath, selectedFile, {
          cacheControl: "3600",
          upsert: false,
        });

      if (uploadError) {
        console.error("Upload error:", uploadError);
        throw new Error("Échec du téléchargement du fichier");
      }

      // Save document metadata to database
      const { data: insertedDoc, error: dbError } = await supabase
        .from("documents")
        .insert({
          client_id: clientId,
          dietitian_id: user.id,
          name: selectedFile.name,
          file_path: uploadData.path,
          file_size: selectedFile.size,
          mime_type: selectedFile.type,
          category,
          description: description || null,
          is_visible_to_client: isVisibleToClient,
        })
        .select()
        .single();

      if (dbError) {
        console.error("Database error:", dbError);
        throw new Error("Échec de l'enregistrement des métadonnées");
      }

      // Log the document upload
      if (insertedDoc) {
        await logDocumentUpload(insertedDoc.id, {
          name: selectedFile.name,
          category,
          size: selectedFile.size,
          client_id: clientId,
        });
      }

      toast({
        title: "Document téléchargé",
        description: "Le document a été téléchargé avec succès.",
      });

      // Reset form
      setSelectedFile(null);
      setCategory("");
      setDescription("");
      setIsVisibleToClient(true);
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
            <Upload className="h-4 w-4 mr-2" />
            Télécharger un document
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="w-[95vw] sm:max-w-[500px] p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle>Télécharger un document</DialogTitle>
          <DialogDescription>
            Ajoutez un document pour ce client (analyses, prescriptions, photos,
            etc.)
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* File Selection */}
          <div>
            <Label htmlFor="file">Fichier *</Label>
            {!selectedFile ? (
              <div className="mt-1">
                <label htmlFor="file-upload" className="cursor-pointer">
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
                    <Upload className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                    <p className="text-sm text-gray-600">
                      Cliquez pour sélectionner un fichier
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      PDF, images, documents Word (max. 10MB)
                    </p>
                  </div>
                </label>
                <input
                  id="file-upload"
                  type="file"
                  className="hidden"
                  onChange={handleFileSelect}
                  accept={ALLOWED_FILE_TYPES.join(",")}
                />
              </div>
            ) : (
              <div className="mt-1 p-3 border rounded-lg bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <FileText className="h-4 w-4 text-blue-500" />
                    <div>
                      <p className="text-sm font-medium">{selectedFile.name}</p>
                      <p className="text-xs text-gray-500">
                        {formatFileSize(selectedFile.size)}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={removeSelectedFile}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Category Selection */}
          <div>
            <Label htmlFor="category">Catégorie *</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner une catégorie" />
              </SelectTrigger>
              <SelectContent>
                {DOCUMENT_CATEGORIES.map((cat) => (
                  <SelectItem key={cat.value} value={cat.value}>
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Description */}
          <div>
            <Label htmlFor="description">Description (optionnel)</Label>
            <Textarea
              id="description"
              placeholder="Description du document..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>

          {/* Visibility Option */}
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="visible-to-client"
              checked={isVisibleToClient}
              onChange={(e) => setIsVisibleToClient(e.target.checked)}
              className="rounded border-gray-300"
            />
            <Label htmlFor="visible-to-client" className="text-sm">
              Visible par le client dans son portail
            </Label>
          </div>
        </div>

        <DialogFooter className="flex flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={() => setIsOpen(false)} className="flex-1">
            Annuler
          </Button>
          <Button
            onClick={handleUpload}
            disabled={!selectedFile || !category || isUploading}
            className="flex-1"
          >
            {isUploading ? "Téléchargement..." : "Télécharger"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
