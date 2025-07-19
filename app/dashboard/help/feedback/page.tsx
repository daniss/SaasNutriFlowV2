"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Send, Upload, X } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";

interface FeedbackFormData {
  category: string;
  title: string;
  description: string;
  priority: string;
  contact_email: string;
}

const feedbackCategories = [
  { value: "bug", label: "🐛 Signaler un bug", description: "Quelque chose ne fonctionne pas comme prévu" },
  { value: "suggestion", label: "💡 Suggestion d'amélioration", description: "Idée pour améliorer une fonctionnalité existante" },
  { value: "feature_request", label: "✨ Demande de nouvelle fonctionnalité", description: "Proposer une nouvelle fonctionnalité" },
  { value: "question", label: "❓ Question générale", description: "Besoin d'aide ou de clarification" }
];

const priorityLevels = [
  { value: "low", label: "Faible", description: "Amélioration ou suggestion non urgente", color: "bg-gray-500" },
  { value: "medium", label: "Moyenne", description: "Fonctionnalité utile ou bug mineur", color: "bg-yellow-500" },
  { value: "high", label: "Élevée", description: "Bug important ou fonctionnalité critique", color: "bg-red-500" }
];

export default function FeedbackPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [attachments, setAttachments] = useState<File[]>([]);
  
  const [formData, setFormData] = useState<FeedbackFormData>({
    category: "",
    title: "",
    description: "",
    priority: "medium",
    contact_email: ""
  });

  const handleInputChange = (field: keyof FeedbackFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    const validFiles = files.filter(file => {
      const isValidType = file.type.startsWith('image/') || file.type === 'application/pdf';
      const isValidSize = file.size <= 5 * 1024 * 1024; // 5MB max
      return isValidType && isValidSize;
    });
    
    if (validFiles.length !== files.length) {
      toast({
        title: "Fichiers non valides",
        description: "Seules les images et PDF de moins de 5MB sont acceptés",
        variant: "destructive"
      });
    }
    
    setAttachments(prev => [...prev, ...validFiles].slice(0, 3)); // Max 3 files
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.category || !formData.title || !formData.description) {
      toast({
        title: "Champs requis manquants",
        description: "Veuillez remplir tous les champs obligatoires",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Create FormData for file uploads
      const submitData = new FormData();
      submitData.append('category', formData.category);
      submitData.append('title', formData.title);
      submitData.append('description', formData.description);
      submitData.append('priority', formData.priority);
      submitData.append('contact_email', formData.contact_email);
      submitData.append('page_url', window.location.href);
      submitData.append('user_agent', navigator.userAgent);
      
      // Add attachments
      attachments.forEach((file, index) => {
        submitData.append(`attachment_${index}`, file);
      });

      const response = await fetch('/api/feedback', {
        method: 'POST',
        body: submitData
      });

      if (!response.ok) {
        throw new Error('Erreur lors de l\'envoi');
      }

      toast({
        title: "Feedback envoyé !",
        description: "Merci pour votre retour. Nous reviendrons vers vous rapidement.",
      });

      // Reset form
      setFormData({
        category: "",
        title: "",
        description: "",
        priority: "medium",
        contact_email: ""
      });
      setAttachments([]);
      
      // Redirect after success
      setTimeout(() => {
        router.push('/dashboard/help');
      }, 2000);

    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible d'envoyer le feedback. Veuillez réessayer.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedCategory = feedbackCategories.find(cat => cat.value === formData.category);
  const selectedPriority = priorityLevels.find(p => p.value === formData.priority);

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Link href="/dashboard/help">
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour à l'aide
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Envoyer des commentaires
          </h1>
          <p className="text-gray-600 mt-2">
            Aidez-nous à améliorer NutriFlow en partageant vos idées, signalant des bugs ou posant des questions
          </p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Main Form */}
        <div className="lg:col-span-2">
          <form onSubmit={handleSubmit} className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Votre feedback</CardTitle>
                <CardDescription>
                  Plus vous êtes précis, mieux nous pourrons vous aider
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Category Selection */}
                <div className="space-y-3">
                  <Label htmlFor="category">Type de feedback *</Label>
                  <Select value={formData.category} onValueChange={(value) => handleInputChange('category', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionnez le type de feedback" />
                    </SelectTrigger>
                    <SelectContent>
                      {feedbackCategories.map((category) => (
                        <SelectItem key={category.value} value={category.value}>
                          <div className="flex flex-col">
                            <span>{category.label}</span>
                            <span className="text-xs text-gray-500">{category.description}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {selectedCategory && (
                    <p className="text-sm text-gray-600">{selectedCategory.description}</p>
                  )}
                </div>

                {/* Title */}
                <div className="space-y-2">
                  <Label htmlFor="title">Titre *</Label>
                  <Input
                    id="title"
                    placeholder="Résumé en quelques mots"
                    value={formData.title}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    maxLength={100}
                  />
                  <p className="text-xs text-gray-500">{formData.title.length}/100 caractères</p>
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <Label htmlFor="description">Description détaillée *</Label>
                  <Textarea
                    id="description"
                    placeholder="Décrivez votre feedback en détail. Pour un bug, expliquez les étapes pour le reproduire."
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    rows={6}
                    maxLength={1000}
                  />
                  <p className="text-xs text-gray-500">{formData.description.length}/1000 caractères</p>
                </div>

                {/* Priority */}
                <div className="space-y-3">
                  <Label htmlFor="priority">Priorité</Label>
                  <Select value={formData.priority} onValueChange={(value) => handleInputChange('priority', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {priorityLevels.map((priority) => (
                        <SelectItem key={priority.value} value={priority.value}>
                          <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${priority.color}`}></div>
                            <span>{priority.label}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {selectedPriority && (
                    <p className="text-sm text-gray-600">{selectedPriority.description}</p>
                  )}
                </div>

                {/* Contact Email */}
                <div className="space-y-2">
                  <Label htmlFor="contact_email">Email de contact (optionnel)</Label>
                  <Input
                    id="contact_email"
                    type="email"
                    placeholder="votre@email.com"
                    value={formData.contact_email}
                    onChange={(e) => handleInputChange('contact_email', e.target.value)}
                  />
                  <p className="text-xs text-gray-500">
                    Pour que nous puissions vous tenir informé du suivi de votre feedback
                  </p>
                </div>

                {/* File Attachments */}
                <div className="space-y-3">
                  <Label>Pièces jointes (optionnel)</Label>
                  <div className="border-2 border-dashed border-gray-200 rounded-lg p-4">
                    <input
                      type="file"
                      id="file-upload"
                      multiple
                      accept="image/*,.pdf"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                    <label
                      htmlFor="file-upload"
                      className="flex flex-col items-center justify-center cursor-pointer"
                    >
                      <Upload className="h-8 w-8 text-gray-400 mb-2" />
                      <span className="text-sm text-gray-600">
                        Cliquez pour ajouter des captures d'écran ou documents
                      </span>
                      <span className="text-xs text-gray-500 mt-1">
                        Images et PDF, max 5MB par fichier (max 3 fichiers)
                      </span>
                    </label>
                  </div>

                  {/* Attachment List */}
                  {attachments.length > 0 && (
                    <div className="space-y-2">
                      {attachments.map((file, index) => (
                        <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                          <span className="text-sm truncate">{file.name}</span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeAttachment(index)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Submit Button */}
            <div className="flex gap-4">
              <Button 
                type="submit" 
                disabled={isSubmitting}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700"
              >
                {isSubmitting ? (
                  "Envoi en cours..."
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Envoyer le feedback
                  </>
                )}
              </Button>
              <Link href="/dashboard/help">
                <Button type="button" variant="outline">
                  Annuler
                </Button>
              </Link>
            </div>
          </form>
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1">
          <div className="space-y-6">
            {/* Tips Card */}
            <Card className="bg-blue-50 border-blue-200">
              <CardHeader>
                <CardTitle className="text-lg text-blue-900">
                  💡 Conseils pour un bon feedback
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-blue-800 space-y-3">
                <div>
                  <strong>Pour signaler un bug :</strong>
                  <ul className="list-disc list-inside mt-1 space-y-1">
                    <li>Décrivez les étapes pour reproduire le problème</li>
                    <li>Ajoutez des captures d'écran si possible</li>
                    <li>Mentionnez votre navigateur et appareil</li>
                  </ul>
                </div>
                <div>
                  <strong>Pour suggérer une amélioration :</strong>
                  <ul className="list-disc list-inside mt-1 space-y-1">
                    <li>Expliquez pourquoi cette amélioration serait utile</li>
                    <li>Décrivez le comportement souhaité</li>
                    <li>Mentionnez des cas d'usage concrets</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            {/* Response Time */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">⏰ Temps de réponse</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-red-500"></div>
                  <div>
                    <div className="font-medium text-sm">Priorité élevée</div>
                    <div className="text-xs text-gray-600">24-48h</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                  <div>
                    <div className="font-medium text-sm">Priorité moyenne</div>
                    <div className="text-xs text-gray-600">2-5 jours</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-gray-500"></div>
                  <div>
                    <div className="font-medium text-sm">Priorité faible</div>
                    <div className="text-xs text-gray-600">1-2 semaines</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}