"use client";

import { useState } from "react";
import { Search, Book, MessageSquare, Shield, Users, Utensils, Calendar, CreditCard, BarChart3 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

const helpCategories = [
  {
    id: "getting-started",
    title: "Premiers pas",
    description: "Configuration initiale et tour d'horizon de l'interface",
    icon: Book,
    color: "bg-blue-500",
    articles: 8,
    topics: [
      "Configuration du profil diététicien",
      "Tour d'horizon de l'interface",
      "Création du premier client",
      "Paramètres de base"
    ]
  },
  {
    id: "client-management",
    title: "Gestion des clients",
    description: "Créer, modifier et suivre vos clients efficacement",
    icon: Users,
    color: "bg-emerald-500",
    articles: 12,
    topics: [
      "Créer un profil client",
      "Suivi des données de santé",
      "Gestion des documents",
      "Export de données RGPD"
    ]
  },
  {
    id: "meal-planning",
    title: "Plans alimentaires & IA",
    description: "Utilisation du générateur IA et création de plans personnalisés",
    icon: Utensils,
    color: "bg-orange-500",
    articles: 15,
    topics: [
      "Générateur IA avec Gemini",
      "Création manuelle de plans",
      "Système de templates",
      "Export PDF des plans"
    ]
  },
  {
    id: "security",
    title: "Sécurité & Authentification",
    description: "Configuration de la sécurité et authentification à deux facteurs",
    icon: Shield,
    color: "bg-red-500",
    articles: 6,
    topics: [
      "Authentification à deux facteurs (TOTP)",
      "Gestion des mots de passe",
      "Partage sécurisé avec clients",
      "Bonnes pratiques sécurité"
    ]
  },
  {
    id: "appointments",
    title: "Rendez-vous & Calendrier",
    description: "Planification et gestion des rendez-vous",
    icon: Calendar,
    color: "bg-purple-500",
    articles: 7,
    topics: [
      "Créer un rendez-vous",
      "Synchronisation calendrier",
      "Rappels automatiques",
      "Gestion des créneaux"
    ]
  },
  {
    id: "billing",
    title: "Facturation & Paiements",
    description: "Gestion de la facturation et intégration Stripe",
    icon: CreditCard,
    color: "bg-green-500",
    articles: 9,
    topics: [
      "Créer une facture",
      "Configuration Stripe",
      "Paiements en ligne",
      "Suivi des recettes"
    ]
  },
  {
    id: "analytics",
    title: "Analyses & Rapports",
    description: "Analyses nutritionnelles et rapports de suivi",
    icon: BarChart3,
    color: "bg-indigo-500",
    articles: 5,
    topics: [
      "Analyses nutritionnelles",
      "Rapports de progression",
      "Statistiques clients",
      "Export des données"
    ]
  }
];

const popularArticles = [
  {
    title: "Comment configurer l'authentification à deux facteurs ?",
    category: "Sécurité",
    views: 1234,
    href: "/dashboard/help/security/two-factor-auth"
  },
  {
    title: "Créer votre premier plan alimentaire avec l'IA",
    category: "Plans alimentaires",
    views: 987,
    href: "/dashboard/help/meal-planning/ai-generator"
  },
  {
    title: "Ajouter un nouveau client - Guide complet",
    category: "Gestion des clients", 
    views: 856,
    href: "/dashboard/help/client-management/add-client"
  },
  {
    title: "Configurer les paiements Stripe",
    category: "Facturation",
    views: 743,
    href: "/dashboard/help/billing/stripe-setup"
  }
];

export default function HelpPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredCategories, setFilteredCategories] = useState(helpCategories);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (!query.trim()) {
      setFilteredCategories(helpCategories);
      return;
    }

    const filtered = helpCategories.filter(category =>
      category.title.toLowerCase().includes(query.toLowerCase()) ||
      category.description.toLowerCase().includes(query.toLowerCase()) ||
      category.topics.some(topic => topic.toLowerCase().includes(query.toLowerCase()))
    );
    setFilteredCategories(filtered);
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Centre d'aide NutriFlow
        </h1>
        <p className="text-xl text-gray-600 mb-8">
          Trouvez rapidement les réponses à vos questions et optimisez votre pratique
        </p>
        
        {/* Search Bar */}
        <div className="relative max-w-2xl mx-auto">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
          <Input
            type="text"
            placeholder="Rechercher dans l'aide (ex: authentification, client, plan alimentaire...)"
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-12 py-3 text-lg border-2 border-gray-200 rounded-xl focus:border-emerald-500 focus:ring-0"
          />
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mb-12">
        <div className="flex flex-wrap justify-center gap-4">
          <Link href="/dashboard/help/feedback">
            <Button variant="outline" className="flex items-center gap-2 border-emerald-200 text-emerald-700 hover:bg-emerald-50">
              <MessageSquare className="h-4 w-4" />
              Envoyer des commentaires
            </Button>
          </Link>
          <Link href="/dashboard/help/getting-started">
            <Button variant="outline" className="flex items-center gap-2 border-blue-200 text-blue-700 hover:bg-blue-50">
              <Book className="h-4 w-4" />
              Guide de démarrage
            </Button>
          </Link>
          <Link href="mailto:support@nutriflow.fr">
            <Button variant="outline" className="flex items-center gap-2 border-purple-200 text-purple-700 hover:bg-purple-50">
              Contact Support
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2">
          {/* Categories */}
          <div className="grid md:grid-cols-2 gap-6 mb-12">
            {filteredCategories.map((category) => {
              const IconComponent = category.icon;
              return (
                <Link key={category.id} href={`/dashboard/help/${category.id}`}>
                  <Card className="h-full hover:shadow-lg transition-all duration-200 border-l-4 border-l-transparent hover:border-l-emerald-500 cursor-pointer">
                    <CardHeader>
                      <div className="flex items-start gap-4">
                        <div className={`p-3 rounded-xl ${category.color} text-white`}>
                          <IconComponent className="h-6 w-6" />
                        </div>
                        <div className="flex-1">
                          <CardTitle className="text-lg mb-2">{category.title}</CardTitle>
                          <CardDescription className="text-sm">
                            {category.description}
                          </CardDescription>
                        </div>
                        <Badge variant="secondary" className="text-xs">
                          {category.articles} articles
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {category.topics.slice(0, 3).map((topic, index) => (
                          <div key={index} className="flex items-center gap-2 text-sm text-gray-600">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                            {topic}
                          </div>
                        ))}
                        {category.topics.length > 3 && (
                          <div className="text-sm text-emerald-600 font-medium mt-2">
                            +{category.topics.length - 3} autres sujets
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>

          {searchQuery && filteredCategories.length === 0 && (
            <div className="text-center py-12">
              <div className="text-gray-400 mb-4">
                <Search className="h-12 w-12 mx-auto" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Aucun résultat trouvé
              </h3>
              <p className="text-gray-600 mb-4">
                Essayez avec d'autres mots-clés ou parcourez les catégories
              </p>
              <Button 
                variant="outline" 
                onClick={() => {
                  setSearchQuery("");
                  setFilteredCategories(helpCategories);
                }}
              >
                Effacer la recherche
              </Button>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1">
          <div className="space-y-6">
            {/* Popular Articles */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Articles populaires</CardTitle>
                <CardDescription>
                  Les guides les plus consultés
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {popularArticles.map((article, index) => (
                    <Link key={index} href={article.href}>
                      <div className="p-3 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer border border-gray-100">
                        <h4 className="font-medium text-sm mb-1 line-clamp-2">
                          {article.title}
                        </h4>
                        <div className="flex items-center justify-between text-xs text-gray-500">
                          <span>{article.category}</span>
                          <span>{article.views} vues</span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Contact Support */}
            <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200">
              <CardHeader>
                <CardTitle className="text-lg text-emerald-900">
                  Besoin d'aide personnalisée ?
                </CardTitle>
                <CardDescription className="text-emerald-700">
                  Notre équipe support est là pour vous aider
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <Link href="/dashboard/help/feedback">
                    <Button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white">
                      <MessageSquare className="h-4 w-4 mr-2" />
                      Envoyer un message
                    </Button>
                  </Link>
                  <a href="mailto:support@nutriflow.fr">
                    <Button variant="outline" className="w-full border-emerald-300 text-emerald-700 hover:bg-emerald-50">
                      Email: support@nutriflow.fr
                    </Button>
                  </a>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}