"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { ArrowLeft, Clock, Eye, ThumbsUp, Search, Filter } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getCategoryById, searchArticles } from "@/lib/help-content";
import type { HelpArticle } from "@/lib/help-content";

const difficultyColors = {
  beginner: "bg-green-100 text-green-800",
  intermediate: "bg-yellow-100 text-yellow-800", 
  advanced: "bg-red-100 text-red-800"
};

const difficultyLabels = {
  beginner: "Débutant",
  intermediate: "Intermédiaire",
  advanced: "Avancé"
};

export default function CategoryPage() {
  const params = useParams();
  const categoryId = params.category as string;
  const category = getCategoryById(categoryId);
  
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("featured"); // featured, newest, popular, difficulty
  const [filteredArticles, setFilteredArticles] = useState<HelpArticle[]>([]);

  if (!category) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Catégorie non trouvée</h1>
          <Link href="/dashboard/help">
            <Button variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour à l'aide
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  // Filter and sort articles
  const getFilteredAndSortedArticles = () => {
    let articles = category.articles;
    
    // Apply search filter
    if (searchQuery.trim()) {
      articles = searchArticles(searchQuery, [categoryId]);
    }
    
    // Apply sorting
    switch (sortBy) {
      case "featured":
        articles = articles.sort((a, b) => {
          if (a.featured && !b.featured) return -1;
          if (!a.featured && b.featured) return 1;
          return (b.views || 0) - (a.views || 0);
        });
        break;
      case "newest":
        articles = articles.sort((a, b) => 
          new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime()
        );
        break;
      case "popular":
        articles = articles.sort((a, b) => (b.views || 0) - (a.views || 0));
        break;
      case "difficulty":
        const difficultyOrder = { beginner: 0, intermediate: 1, advanced: 2 };
        articles = articles.sort((a, b) => 
          difficultyOrder[a.difficulty] - difficultyOrder[b.difficulty]
        );
        break;
    }
    
    return articles;
  };

  const sortedArticles = getFilteredAndSortedArticles();

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Link href="/dashboard/help">
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour à l'aide
          </Button>
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <div className={`p-2 rounded-lg ${category.color} text-white`}>
              <div className="w-6 h-6" /> {/* Icon placeholder */}
            </div>
            <h1 className="text-3xl font-bold text-gray-900">{category.title}</h1>
            <Badge variant="secondary">{category.articles.length} articles</Badge>
          </div>
          <p className="text-gray-600">{category.description}</p>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-8">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Rechercher dans cette catégorie..."
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2">
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[180px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="featured">Recommandés</SelectItem>
              <SelectItem value="popular">Plus populaires</SelectItem>
              <SelectItem value="newest">Plus récents</SelectItem>
              <SelectItem value="difficulty">Par difficulté</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Articles Grid */}
      {sortedArticles.length > 0 ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sortedArticles.map((article) => (
            <Link key={article.id} href={`/dashboard/help/${categoryId}/${article.id}`}>
              <Card className="h-full hover:shadow-lg transition-all duration-200 cursor-pointer border-l-4 border-l-transparent hover:border-l-emerald-500">
                <CardHeader>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <CardTitle className="text-lg line-clamp-2 leading-tight">
                      {article.title}
                    </CardTitle>
                    {article.featured && (
                      <Badge className="bg-amber-100 text-amber-800 border-amber-200 text-xs whitespace-nowrap">
                        ⭐ Recommandé
                      </Badge>
                    )}
                  </div>
                  <CardDescription className="line-clamp-3">
                    {article.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {/* Tags */}
                    <div className="flex flex-wrap gap-1">
                      {article.tags.slice(0, 3).map((tag) => (
                        <Badge key={tag} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                      {article.tags.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{article.tags.length - 3}
                        </Badge>
                      )}
                    </div>

                    {/* Metadata */}
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {article.estimatedReadTime} min
                        </div>
                        <div className="flex items-center gap-1">
                          <Eye className="h-3 w-3" />
                          {article.views || 0}
                        </div>
                        {article.helpful && (
                          <div className="flex items-center gap-1">
                            <ThumbsUp className="h-3 w-3" />
                            {article.helpful}
                          </div>
                        )}
                      </div>
                      <Badge 
                        className={difficultyColors[article.difficulty]} 
                        variant="secondary"
                      >
                        {difficultyLabels[article.difficulty]}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <Search className="h-12 w-12 mx-auto" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {searchQuery ? "Aucun article trouvé" : "Aucun article dans cette catégorie"}
          </h3>
          <p className="text-gray-600 mb-4">
            {searchQuery 
              ? "Essayez avec d'autres mots-clés ou effacez votre recherche"
              : "Cette catégorie sera bientôt enrichie avec de nouveaux articles"
            }
          </p>
          {searchQuery && (
            <Button 
              variant="outline" 
              onClick={() => setSearchQuery("")}
            >
              Effacer la recherche
            </Button>
          )}
        </div>
      )}

      {/* Category Stats */}
      {sortedArticles.length > 0 && (
        <div className="mt-12 p-6 bg-gray-50 rounded-xl">
          <h3 className="font-semibold text-gray-900 mb-4">Statistiques de la catégorie</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-emerald-600">{category.articles.length}</div>
              <div className="text-sm text-gray-600">Articles</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-blue-600">
                {category.articles.reduce((sum, article) => sum + (article.views || 0), 0)}
              </div>
              <div className="text-sm text-gray-600">Vues totales</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-purple-600">
                {Math.round(category.articles.reduce((sum, article) => sum + article.estimatedReadTime, 0) / category.articles.length)}
              </div>
              <div className="text-sm text-gray-600">Temps moyen (min)</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-amber-600">
                {category.articles.filter(a => a.featured).length}
              </div>
              <div className="text-sm text-gray-600">Recommandés</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}