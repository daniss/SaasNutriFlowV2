"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Plus, Search, Filter, MoreHorizontal, Copy, Edit, Trash2, Star, Clock, Users } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { DashboardHeader } from "@/components/dashboard-header"
import { getStatusColor } from "@/lib/status"
import Link from "next/link"

export default function TemplatesPage() {
  const [searchTerm, setSearchTerm] = useState("")

  const templates = [
    {
      id: 1,
      name: "Perte de poids méditerranéenne",
      description: "Plan de repas méditerranéen de 7 jours axé sur une perte de poids saine",
      category: "Perte de poids",
      calories: "1 400-1 600",
      duration: "7 jours",
      difficulty: "Facile",
      rating: 4.8,
      usageCount: 24,
      lastUsed: "il y a 2 jours",
      tags: ["Méditerranéen", "Bon pour le cœur", "Anti-inflammatoire"],
      isFavorite: true,
    },
    {
      id: 2,
      name: "Prise de muscle riche en protéines",
      description: "Plan de 14 jours riche en protéines conçu pour la prise de muscle et la performance athlétique",
      category: "Prise de muscle",
      calories: "2 200-2 500",
      duration: "14 jours",
      difficulty: "Modéré",
      rating: 4.9,
      usageCount: 18,
      lastUsed: "il y a 1 semaine",
      tags: ["Riche en protéines", "Athlétique", "Performance"],
      isFavorite: false,
    },
    {
      id: 3,
      name: "Équilibré pour diabétiques",
      description: "Plan de repas à faible index glycémique pour la gestion du diabète avec une nutrition équilibrée",
      category: "Médical",
      calories: "1 600-1 800",
      duration: "10 jours",
      difficulty: "Facile",
      rating: 4.7,
      usageCount: 31,
      lastUsed: "il y a 3 jours",
      tags: ["Diabétique", "Faible IG", "Équilibré"],
      isFavorite: true,
    },
    {
      id: 4,
      name: "Détox végétalienne",
      description: "Programme de nettoyage végétalien de 21 jours axé sur les aliments complets",
      category: "Détox",
      calories: "1 500-1 700",
      duration: "21 jours",
      difficulty: "Difficile",
      rating: 4.6,
      usageCount: 12,
      lastUsed: "il y a 2 semaines",
      tags: ["Végétalien", "Détox", "Aliments complets"],
      isFavorite: false,
    },
    {
      id: 5,
      name: "DASH bon pour le cœur",
      description: "Plan inspiré du régime DASH pour l'amélioration de la santé cardiovasculaire",
      category: "Santé cardiaque",
      calories: "1 800-2 000",
      duration: "14 jours",
      difficulty: "Facile",
      rating: 4.8,
      usageCount: 27,
      lastUsed: "il y a 5 jours",
      tags: ["DASH", "Santé cardiaque", "Faible en sodium"],
      isFavorite: true,
    },
    {
      id: 6,
      name: "Perte de graisse cétogène",
      description: "Approche cétogène faible en glucides pour une perte de graisse rapide et la santé métabolique",
      category: "Perte de poids",
      calories: "1 300-1 500",
      duration: "7 jours",
      difficulty: "Difficile",
      rating: 4.5,
      usageCount: 15,
      lastUsed: "il y a 1 semaine",
      tags: ["Céto", "Faible en glucides", "Perte de graisse"],
      isFavorite: false,
    },
  ]

  const filteredTemplates = templates.filter(
    (template) =>
      template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      template.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      template.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      template.tags.some((tag) => tag.toLowerCase().includes(searchTerm.toLowerCase())),
  )

  return (
    <div className="space-y-6">
      <DashboardHeader 
        title="Bibliothèque de modèles"
        subtitle={`${templates.length} modèles de plans alimentaires disponibles pour votre pratique`}
        searchPlaceholder="Rechercher des modèles..."
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        action={
          <Button className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-soft hover:shadow-soft-lg transition-all duration-200 font-medium">
            <Plus className="mr-2 h-4 w-4" />
            Nouveau modèle
          </Button>
        }
      />

      <div className="px-6 space-y-6">
      {/* Templates Grid */}
      {filteredTemplates.length === 0 ? (
        <Card className="border-0 shadow-soft bg-white/80 backdrop-blur-sm animate-scale-in">
          <CardContent className="pt-16 pb-16">
            <div className="text-center">
              <div className="mx-auto h-20 w-20 bg-gradient-to-br from-emerald-100 to-emerald-200 rounded-2xl flex items-center justify-center mb-8 shadow-soft">
                <Search className="h-10 w-10 text-emerald-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Aucun modèle trouvé</h3>
              <p className="text-gray-600 text-sm mb-8 max-w-sm mx-auto leading-relaxed">
                Essayez d'ajuster vos termes de recherche ou créez un nouveau modèle.
              </p>
            </div>
          </CardContent>  
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 animate-slide-up animate-delay-200">
          {filteredTemplates.map((template, index) => (
            <Card 
              key={template.id} 
              className="group border-0 shadow-soft bg-white/90 backdrop-blur-sm hover:shadow-soft-lg transition-all duration-300 hover:-translate-y-1 animate-scale-in"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <CardTitle className="text-lg font-semibold text-gray-900 truncate">{template.name}</CardTitle>
                      {template.isFavorite && <Star className="h-4 w-4 fill-yellow-400 text-yellow-400 flex-shrink-0" />}
                    </div>
                    <CardDescription className="text-sm text-gray-600 line-clamp-2 leading-relaxed">{template.description}</CardDescription>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="hover:bg-gray-50 transition-colors duration-200">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="shadow-soft-lg border-0 bg-white/95 backdrop-blur-sm">
                      <DropdownMenuItem className="hover:bg-gray-50 transition-colors">
                        <Copy className="h-4 w-4 mr-2" />
                        Utiliser le modèle
                      </DropdownMenuItem>
                      <DropdownMenuItem className="hover:bg-gray-50 transition-colors">
                        <Edit className="h-4 w-4 mr-2" />
                        Modifier le modèle
                      </DropdownMenuItem>
                      <DropdownMenuItem className="hover:bg-gray-50 transition-colors">
                        <Copy className="h-4 w-4 mr-2 rotate-180" />
                        Dupliquer
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-red-600 hover:bg-red-50 hover:text-red-700 transition-colors">
                        <Trash2 className="h-4 w-4 mr-2" />
                        Supprimer
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  <Badge className={`${getStatusColor(template.category)} border-0 font-medium px-3 py-1`}>{template.category}</Badge>
                  <Badge className={`${getStatusColor(template.difficulty)} border-0 font-medium px-3 py-1`}>{template.difficulty}</Badge>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-500 font-medium">Durée</p>
                    <p className="font-semibold text-gray-900 tabular-nums">{template.duration}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 font-medium">Calories</p>
                    <p className="font-semibold text-gray-900 tabular-nums">{template.calories}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    <span className="font-semibold text-gray-900 tabular-nums">{template.rating}</span>
                  </div>
                  <div className="flex items-center gap-1 text-gray-600">
                    <Users className="h-3 w-3 opacity-60" />
                    <span className="font-medium tabular-nums">{template.usageCount} utilisations</span>
                  </div>
                </div>

                <div className="flex items-center gap-1 text-xs text-gray-500 font-medium">
                  <Clock className="h-3 w-3 opacity-60" />
                  <span>Dernière utilisation {template.lastUsed}</span>
                </div>

                <div className="flex flex-wrap gap-1">
                  {template.tags.map((tag) => (
                    <Badge key={tag} variant="outline" className="text-xs border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors">
                      {tag}
                    </Badge>
                  ))}
                </div>

                <div className="flex gap-2 pt-2">
                  <Button size="sm" className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white shadow-soft hover:shadow-soft-lg transition-all duration-200 font-medium">
                    <Copy className="h-4 w-4 mr-2" />
                    Utiliser le modèle
                  </Button>
                  <Button variant="outline" size="sm" className="border-gray-200 hover:bg-gray-50 hover:shadow-soft transition-all duration-200">
                    <Edit className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      </div>
    </div>
  )
}
