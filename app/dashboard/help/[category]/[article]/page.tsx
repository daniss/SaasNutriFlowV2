"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { ArrowLeft, Clock, Eye, ThumbsUp, ThumbsDown, Share2, Bookmark, BookmarkCheck } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { getCategoryById, getArticleById, getPopularArticles } from "@/lib/help-content";
import ReactMarkdown from "react-markdown";

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

export default function ArticlePage() {
  const params = useParams();
  const categoryId = params.category as string;
  const articleId = params.article as string;
  const { toast } = useToast();
  
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [hasVoted, setHasVoted] = useState<'up' | 'down' | null>(null);
  
  const category = getCategoryById(categoryId);
  const article = getArticleById(articleId);
  const popularArticles = getPopularArticles(4);

  if (!category || !article) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Article non trouvé</h1>
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

  const handleBookmark = () => {
    setIsBookmarked(!isBookmarked);
    toast({
      title: isBookmarked ? "Retiré des favoris" : "Ajouté aux favoris",
      description: isBookmarked 
        ? "L'article a été retiré de vos favoris" 
        : "L'article a été ajouté à vos favoris"
    });
  };

  const handleVote = (type: 'up' | 'down') => {
    if (hasVoted === type) {
      setHasVoted(null);
      toast({
        title: "Vote retiré",
        description: "Votre évaluation a été retirée"
      });
    } else {
      setHasVoted(type);
      toast({
        title: type === 'up' ? "Merci !" : "Merci pour votre retour",
        description: type === 'up' 
          ? "Votre évaluation positive nous aide à améliorer nos contenus"
          : "Nous allons améliorer cet article grâce à votre retour"
      });
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: article.title,
          text: article.description,
          url: window.location.href,
        });
      } catch (err) {
        // User cancelled sharing
      }
    } else {
      // Fallback to clipboard
      await navigator.clipboard.writeText(window.location.href);
      toast({
        title: "Lien copié !",
        description: "Le lien de l'article a été copié dans le presse-papiers"
      });
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="grid lg:grid-cols-4 gap-8">
        {/* Main Article Content */}
        <div className="lg:col-span-3">
          {/* Navigation */}
          <div className="flex items-center gap-2 text-sm text-gray-600 mb-6">
            <Link href="/dashboard/help" className="hover:text-emerald-600">
              Aide
            </Link>
            <span>/</span>
            <Link href={`/dashboard/help/${categoryId}`} className="hover:text-emerald-600">
              {category.title}
            </Link>
            <span>/</span>
            <span className="text-gray-900">{article.title}</span>
          </div>

          {/* Article Header */}
          <div className="mb-8">
            <div className="flex items-start justify-between gap-4 mb-4">
              <h1 className="text-3xl font-bold text-gray-900 leading-tight">
                {article.title}
              </h1>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleBookmark}
                  className={isBookmarked ? "bg-emerald-50 border-emerald-200" : ""}
                >
                  {isBookmarked ? (
                    <BookmarkCheck className="h-4 w-4" />
                  ) : (
                    <Bookmark className="h-4 w-4" />
                  )}
                </Button>
                <Button variant="outline" size="sm" onClick={handleShare}>
                  <Share2 className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <p className="text-xl text-gray-600 mb-6">{article.description}</p>

            {/* Article Metadata */}
            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 mb-6">
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                {article.estimatedReadTime} min de lecture
              </div>
              <div className="flex items-center gap-1">
                <Eye className="h-4 w-4" />
                {article.views || 0} vues
              </div>
              <Badge className={difficultyColors[article.difficulty]} variant="secondary">
                {difficultyLabels[article.difficulty]}
              </Badge>
              {article.featured && (
                <Badge className="bg-amber-100 text-amber-800 border-amber-200">
                  ⭐ Recommandé
                </Badge>
              )}
              <span>Mis à jour le {new Date(article.lastUpdated).toLocaleDateString('fr-FR')}</span>
            </div>

            {/* Tags */}
            <div className="flex flex-wrap gap-2 mb-6">
              {article.tags.map((tag) => (
                <Badge key={tag} variant="outline" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>

            <Separator />
          </div>

          {/* Article Content */}
          <div className="prose prose-lg max-w-none mb-8">
            <ReactMarkdown
              components={{
                h1: ({children}) => <h1 className="text-2xl font-bold text-gray-900 mt-8 mb-4">{children}</h1>,
                h2: ({children}) => <h2 className="text-xl font-semibold text-gray-900 mt-6 mb-3">{children}</h2>,
                h3: ({children}) => <h3 className="text-lg font-semibold text-gray-900 mt-5 mb-2">{children}</h3>,
                p: ({children}) => <p className="text-gray-700 mb-4 leading-relaxed">{children}</p>,
                ul: ({children}) => <ul className="list-disc list-inside mb-4 space-y-1 text-gray-700">{children}</ul>,
                ol: ({children}) => <ol className="list-decimal list-inside mb-4 space-y-1 text-gray-700">{children}</ol>,
                li: ({children}) => <li className="leading-relaxed">{children}</li>,
                blockquote: ({children}) => (
                  <blockquote className="border-l-4 border-emerald-500 bg-emerald-50 p-4 my-6 italic">
                    {children}
                  </blockquote>
                ),
                code: ({children}) => (
                  <code className="bg-gray-100 px-2 py-1 rounded text-sm font-mono">
                    {children}
                  </code>
                ),
                pre: ({children}) => (
                  <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto my-6">
                    {children}
                  </pre>
                ),
                strong: ({children}) => <strong className="font-semibold text-gray-900">{children}</strong>,
                a: ({href, children}) => (
                  <a href={href} className="text-emerald-600 hover:text-emerald-700 underline">
                    {children}
                  </a>
                )
              }}
            >
              {article.content}
            </ReactMarkdown>
          </div>

          {/* Article Footer */}
          <div className="border-t pt-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-gray-900 mb-2">Cet article vous a-t-il été utile ?</h3>
                <div className="flex gap-2">
                  <Button
                    variant={hasVoted === 'up' ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleVote('up')}
                    className={hasVoted === 'up' ? "bg-green-600 hover:bg-green-700" : ""}
                  >
                    <ThumbsUp className="h-4 w-4 mr-1" />
                    Oui ({(article.helpful || 0) + (hasVoted === 'up' ? 1 : 0)})
                  </Button>
                  <Button
                    variant={hasVoted === 'down' ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleVote('down')}
                    className={hasVoted === 'down' ? "bg-red-600 hover:bg-red-700" : ""}
                  >
                    <ThumbsDown className="h-4 w-4 mr-1" />
                    Non
                  </Button>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600 mb-2">Besoin d'aide supplémentaire ?</p>
                <Link href="/dashboard/help/feedback">
                  <Button variant="outline" size="sm">
                    Contacter le support
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1">
          <div className="space-y-6">
            {/* Navigation */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Navigation</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Link href="/dashboard/help">
                  <Button variant="ghost" className="w-full justify-start" size="sm">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Retour à l'aide
                  </Button>
                </Link>
                <Link href={`/dashboard/help/${categoryId}`}>
                  <Button variant="ghost" className="w-full justify-start" size="sm">
                    Voir tous les articles de {category.title}
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Related Articles */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Articles populaires</CardTitle>
                <CardDescription>
                  Les guides les plus consultés
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {popularArticles.filter(a => a.id !== article.id).slice(0, 3).map((relatedArticle) => (
                    <Link 
                      key={relatedArticle.id} 
                      href={`/dashboard/help/${relatedArticle.category}/${relatedArticle.id}`}
                    >
                      <div className="p-3 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer border border-gray-100">
                        <h4 className="font-medium text-sm mb-1 line-clamp-2">
                          {relatedArticle.title}
                        </h4>
                        <div className="flex items-center justify-between text-xs text-gray-500">
                          <span>{relatedArticle.estimatedReadTime} min</span>
                          <span>{relatedArticle.views} vues</span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Quick Help */}
            <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200">
              <CardHeader>
                <CardTitle className="text-lg text-emerald-900">
                  Aide rapide
                </CardTitle>
                <CardDescription className="text-emerald-700">
                  Toujours pas trouvé ce que vous cherchez ?
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Link href="/dashboard/help/feedback">
                  <Button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white">
                    Poser une question
                  </Button>
                </Link>
                <a href="mailto:support@nutriflow.fr">
                  <Button variant="outline" className="w-full border-emerald-300 text-emerald-700 hover:bg-emerald-50">
                    Email: support@nutriflow.fr
                  </Button>
                </a>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}