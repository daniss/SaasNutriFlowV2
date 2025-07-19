"use client";

import { useState, useEffect } from "react";
import { Search, Book, MessageSquare, Shield, Users, Utensils, Calendar, CreditCard, BarChart3 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { fetchHelpCategories, getPopularArticles, searchArticles, HelpCategory, HelpArticle } from "@/lib/help-content-api";

// Icon mapping for categories
const iconMap: Record<string, any> = {
  Book,
  Users,
  Utensils,
  Shield,
  Calendar,
  CreditCard,
  BarChart3,
  MessageSquare
};

export default function HelpPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [categories, setCategories] = useState<HelpCategory[]>([]);
  const [filteredCategories, setFilteredCategories] = useState<HelpCategory[]>([]);
  const [popularArticles, setPopularArticles] = useState<HelpArticle[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch data on component mount
  useEffect(() => {
    const loadData = async () => {
      try {
        const [categoriesData, popularData] = await Promise.all([
          fetchHelpCategories(),
          getPopularArticles(4)
        ]);
        
        setCategories(categoriesData);
        setFilteredCategories(categoriesData);
        setPopularArticles(popularData);
      } catch (error) {
        console.error('Error loading help data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (!query.trim()) {
      setFilteredCategories(categories);
      return;
    }

    const filtered = categories.filter(category =>
      category.title.toLowerCase().includes(query.toLowerCase()) ||
      category.description.toLowerCase().includes(query.toLowerCase())
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
          <Link href="/dashboard/help/getting-started">
            <Button variant="outline" className="flex items-center gap-2 border-blue-200 text-blue-700 hover:bg-blue-50">
              <Book className="h-4 w-4" />
              Guide de démarrage
            </Button>
          </Link>
          <a href="mailto:contact@nutri-flow.me">
            <Button variant="outline" className="flex items-center gap-2 border-purple-200 text-purple-700 hover:bg-purple-50">
              Contact Support
            </Button>
          </a>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2">
          {/* Categories */}
          {loading ? (
            <div className="grid md:grid-cols-2 gap-6 mb-12">
              {[...Array(6)].map((_, index) => (
                <Card key={index} className="h-full">
                  <CardHeader>
                    <div className="flex items-start gap-4">
                      <div className="w-14 h-14 bg-gray-200 rounded-xl animate-pulse"></div>
                      <div className="flex-1">
                        <div className="h-5 bg-gray-200 rounded animate-pulse mb-2"></div>
                        <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4"></div>
                      </div>
                      <div className="w-16 h-6 bg-gray-200 rounded animate-pulse"></div>
                    </div>
                  </CardHeader>
                </Card>
              ))}
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-6 mb-12">
              {filteredCategories.map((category) => {
                const IconComponent = iconMap[category.icon] || Book;
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
                        <div className="text-sm text-gray-600">
                          Explorez les articles de cette catégorie pour approfondir vos connaissances.
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                );
              })}
            </div>
          )}

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
                  setFilteredCategories(categories);
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
                  {loading ? (
                    [...Array(4)].map((_, index) => (
                      <div key={index} className="p-3 rounded-lg border border-gray-100">
                        <div className="h-4 bg-gray-200 rounded animate-pulse mb-2"></div>
                        <div className="flex items-center justify-between">
                          <div className="h-3 bg-gray-200 rounded animate-pulse w-20"></div>
                          <div className="h-3 bg-gray-200 rounded animate-pulse w-16"></div>
                        </div>
                      </div>
                    ))
                  ) : (
                    popularArticles.map((article, index) => (
                      <Link key={index} href={`/dashboard/help/${article.category}/${article.id}`}>
                        <div className="p-3 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer border border-gray-100">
                          <h4 className="font-medium text-sm mb-1 line-clamp-2">
                            {article.title}
                          </h4>
                          <div className="flex items-center justify-between text-xs text-gray-500">
                            <span>{article.categoryTitle || article.category}</span>
                            <span>{article.views} vues</span>
                          </div>
                        </div>
                      </Link>
                    ))
                  )}
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
                  <a href="mailto:contact@nutri-flow.me">
                    <Button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white">
                      Email: contact@nutri-flow.me
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