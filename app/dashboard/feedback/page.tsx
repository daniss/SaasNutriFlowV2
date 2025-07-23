"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { DashboardHeader } from "@/components/dashboard-header";
import { useAuth } from "@/hooks/useAuthNew";
import {
  Bug,
  Lightbulb,
  Send,
  CheckCircle,
  Clock,
  Zap,
  Heart,
  AlertTriangle,
  Loader2,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";

const feedbackTypes = [
  {
    value: "bug",
    label: "🐛 Signaler un bug",
    description: "Quelque chose ne fonctionne pas correctement",
    icon: Bug,
    color: "text-red-600",
    bgColor: "bg-red-50",
    borderColor: "border-red-200",
  },
  {
    value: "improvement",
    label: "✨ Suggérer une amélioration",
    description: "Une idée pour améliorer une fonctionnalité existante",
    icon: Lightbulb,
    color: "text-blue-600",
    bgColor: "bg-blue-50",
    borderColor: "border-blue-200",
  },
  {
    value: "feature",
    label: "🚀 Nouvelle fonctionnalité",
    description: "Une idée pour une toute nouvelle fonctionnalité",
    icon: Zap,
    color: "text-purple-600",
    bgColor: "bg-purple-50",
    borderColor: "border-purple-200",
  },
];

const urgencyLevels = [
  { value: "low", label: "📝 Faible - Quand vous avez le temps", color: "text-gray-600" },
  { value: "medium", label: "⚡ Moyenne - Dans les prochains jours", color: "text-orange-600" },
  { value: "high", label: "🔥 Élevée - Bloque mon travail", color: "text-red-600" },
];

export default function FeedbackPage() {
  const { user, profile } = useAuth();
  const [selectedType, setSelectedType] = useState<string>("");
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    urgency: "",
    stepsToReproduce: "",
    expectedBehavior: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const selectedTypeData = feedbackTypes.find(type => type.value === selectedType);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedType || !formData.title || !formData.description) {
      toast({
        title: "Champs manquants",
        description: "Veuillez remplir tous les champs obligatoires",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/feedback", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type: selectedType,
          title: formData.title,
          description: formData.description,
          urgency: formData.urgency || "medium",
          stepsToReproduce: formData.stepsToReproduce,
          expectedBehavior: formData.expectedBehavior,
          userEmail: user?.email,
          userName: profile?.first_name || "Utilisateur",
        }),
      });

      if (response.ok) {
        setIsSubmitted(true);
        toast({
          title: "Feedback envoyé !",
          description: "Merci pour votre retour. Nous reviendrons vers vous sous 2 jours maximum.",
        });
      } else {
        throw new Error("Erreur lors de l'envoi");
      }
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible d'envoyer votre feedback. Réessayez plus tard.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="space-y-6">
        <DashboardHeader
          title="Feedback envoyé !"
          subtitle="Merci pour votre contribution à l'amélioration de NutriFlow"
          showSearch={false}
        />

        <div className="px-6">
          <Card className="max-w-2xl mx-auto border-0 shadow-soft bg-gradient-to-br from-emerald-50 to-emerald-100/50">
            <CardContent className="pt-12 pb-12 text-center">
              <div className="w-20 h-20 bg-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="h-10 w-10 text-white" />
              </div>
              
              <h2 className="text-2xl font-bold text-emerald-900 mb-4">
                Votre feedback a été envoyé !
              </h2>
              
              <p className="text-emerald-700 mb-6 max-w-md mx-auto">
                Nous avons bien reçu votre {selectedTypeData?.label.toLowerCase()}. 
                Notre équipe l'examine et vous répondra dans un délai maximum de <strong>2 jours</strong>.
              </p>

              <div className="flex items-center justify-center gap-2 text-emerald-600 mb-8">
                <Clock className="h-5 w-5" />
                <span className="font-medium">Réponse garantie sous 48h</span>
              </div>

              <div className="flex gap-3 justify-center">
                <Button
                  onClick={() => {
                    setIsSubmitted(false);
                    setSelectedType("");
                    setFormData({
                      title: "",
                      description: "",
                      urgency: "",
                      stepsToReproduce: "",
                      expectedBehavior: "",
                    });
                  }}
                  variant="outline"
                  className="border-emerald-300 text-emerald-700 hover:bg-emerald-50"
                >
                  Envoyer un autre feedback
                </Button>
                <Button
                  onClick={() => window.history.back()}
                  className="bg-emerald-600 hover:bg-emerald-700"
                >
                  Retour au dashboard
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <DashboardHeader
        title="Feedback & Suggestions"
        subtitle="Aidez-nous à améliorer NutriFlow - Réponse garantie sous 2 jours"
        showSearch={false}
      />

      <div className="px-6">
        <div className="max-w-4xl mx-auto">
          {/* Quick Info Banner */}
          <Alert className="mb-8 border-emerald-200 bg-emerald-50">
            <Heart className="h-4 w-4 text-emerald-600" />
            <AlertDescription className="text-emerald-800">
              <strong>Votre avis compte !</strong> Tous les retours sont lus personnellement. 
              Solutions et améliorations implémentées en maximum <strong>2 jours</strong>.
            </AlertDescription>
          </Alert>

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Type Selection */}
            <Card className="border-0 shadow-soft">
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center">
                    <AlertTriangle className="h-4 w-4 text-emerald-600" />
                  </div>
                  De quoi s'agit-il ?
                </CardTitle>
                <CardDescription>
                  Sélectionnez le type de feedback que vous souhaitez envoyer
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-3">
                  {feedbackTypes.map((type) => {
                    const Icon = type.icon;
                    return (
                      <button
                        key={type.value}
                        type="button"
                        onClick={() => setSelectedType(type.value)}
                        className={`p-4 rounded-xl border-2 transition-all text-left hover:shadow-soft ${
                          selectedType === type.value
                            ? `${type.borderColor} ${type.bgColor} shadow-soft`
                            : "border-gray-200 hover:border-gray-300"
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <Icon className={`h-5 w-5 mt-1 ${selectedType === type.value ? type.color : "text-gray-400"}`} />
                          <div>
                            <h3 className={`font-semibold mb-1 ${selectedType === type.value ? type.color : "text-gray-900"}`}>
                              {type.label}
                            </h3>
                            <p className="text-sm text-gray-600">
                              {type.description}
                            </p>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {selectedType && (
              <>
                {/* Main Form */}
                <Card className="border-0 shadow-soft">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-3">
                      {selectedTypeData && <selectedTypeData.icon className={`h-5 w-5 ${selectedTypeData.color}`} />}
                      Détails de votre {selectedTypeData?.label.toLowerCase()}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Title */}
                    <div className="space-y-2">
                      <Label htmlFor="title">
                        Titre court et descriptif *
                      </Label>
                      <Input
                        id="title"
                        value={formData.title}
                        onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                        placeholder={
                          selectedType === "bug" 
                            ? "Ex: Impossible de sauvegarder un plan alimentaire"
                            : selectedType === "improvement"
                            ? "Ex: Ajouter un filtre par date dans les clients"
                            : "Ex: Système de notifications push pour les clients"
                        }
                        className="text-base"
                      />
                    </div>

                    {/* Description */}
                    <div className="space-y-2">
                      <Label htmlFor="description">
                        Description détaillée *
                      </Label>
                      <Textarea
                        id="description"
                        value={formData.description}
                        onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                        placeholder={
                          selectedType === "bug"
                            ? "Décrivez le problème en détail. Que faisiez-vous quand c'est arrivé ?"
                            : "Expliquez votre idée et pourquoi ce serait utile pour votre travail quotidien"
                        }
                        rows={4}
                        className="resize-none"
                      />
                    </div>

                    {/* Bug-specific fields */}
                    {selectedType === "bug" && (
                      <>
                        <div className="space-y-2">
                          <Label htmlFor="steps">
                            Étapes pour reproduire le problème
                          </Label>
                          <Textarea
                            id="steps"
                            value={formData.stepsToReproduce}
                            onChange={(e) => setFormData(prev => ({ ...prev, stepsToReproduce: e.target.value }))}
                            placeholder="1. Je clique sur...&#10;2. Puis je...&#10;3. Et là ça bug..."
                            rows={3}
                            className="resize-none"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="expected">
                            Comportement attendu
                          </Label>
                          <Textarea
                            id="expected"
                            value={formData.expectedBehavior}
                            onChange={(e) => setFormData(prev => ({ ...prev, expectedBehavior: e.target.value }))}
                            placeholder="Que devrait-il se passer normalement ?"
                            rows={2}
                            className="resize-none"
                          />
                        </div>
                      </>
                    )}

                    {/* Urgency */}
                    <div className="space-y-2">
                      <Label>Niveau d'urgence</Label>
                      <Select value={formData.urgency} onValueChange={(value) => setFormData(prev => ({ ...prev, urgency: value }))}>
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionner le niveau d'urgence" />
                        </SelectTrigger>
                        <SelectContent>
                          {urgencyLevels.map((level) => (
                            <SelectItem key={level.value} value={level.value}>
                              <span className={level.color}>
                                {level.label}
                              </span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </CardContent>
                </Card>

                {/* Submit */}
                <Card className="border-0 shadow-soft bg-gradient-to-r from-emerald-50 to-blue-50">
                  <CardContent className="pt-6">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                      <div className="text-center sm:text-left">
                        <h3 className="font-semibold text-gray-900 mb-1">
                          Prêt à envoyer votre feedback ?
                        </h3>
                        <p className="text-sm text-gray-600">
                          Réponse garantie sous 48h • Implementation en 2 jours max
                        </p>
                      </div>
                      
                      <Button
                        type="submit"
                        disabled={isSubmitting}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-soft hover:shadow-soft-lg transition-all duration-200 px-8"
                      >
                        {isSubmitting ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Envoi en cours...
                          </>
                        ) : (
                          <>
                            <Send className="mr-2 h-4 w-4" />
                            Envoyer le feedback
                          </>
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}