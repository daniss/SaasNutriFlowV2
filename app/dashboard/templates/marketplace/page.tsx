"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Search,
  Star,
  Download,
  Users,
  Clock,
  ChefHat,
  Calendar,
  Filter,
  SortAsc,
  SortDesc,
  Coins,
  Heart,
  Eye,
  ShoppingCart
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { DashboardHeader } from "@/components/dashboard-header"
import { DashboardSkeleton } from "@/components/shared/skeletons"
import { useAuth } from "@/hooks/useAuthNew"
import { useRouter } from "next/navigation"

interface SharedTemplate {
  id: string
  template_id: string
  template_type: 'recipe' | 'meal_plan'
  title: string
  description: string
  category: string
  tags: string[]
  difficulty: string
  prep_time: number
  servings: number
  nutritional_info: any
  price_credits: number
  download_count: number
  rating_average: number
  rating_count: number
  is_featured: boolean
  created_at: string
  dietitians: {
    first_name: string
    last_name: string
    practice_name: string
  }
}

interface Pagination {
  page: number
  limit: number
  total: number
  totalPages: number
}

export default function TemplateMarketplacePage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const router = useRouter()
  
  const [templates, setTemplates] = useState<SharedTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0
  })
  
  // Filters
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string>("")
  const [selectedType, setSelectedType] = useState<string>("")
  const [sortBy, setSortBy] = useState("created_at")
  const [sortOrder, setSortOrder] = useState("desc")
  const [showFeatured, setShowFeatured] = useState(false)

  // User credits
  const [userCredits, setUserCredits] = useState(0)

  useEffect(() => {
    if (user) {
      fetchTemplates()
      fetchUserCredits()
    }
  }, [user, pagination.page, selectedCategory, selectedType, sortBy, sortOrder])

  const fetchTemplates = async () => {
    try {
      setLoading(true)
      
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        sortBy,
        sortOrder
      })
      
      if (selectedCategory) params.append('category', selectedCategory)
      if (selectedType) params.append('type', selectedType)
      if (searchTerm) params.append('search', searchTerm)
      
      const response = await fetch(`/api/templates/shared?${params}`)
      const data = await response.json()
      
      if (!response.ok) throw new Error(data.error)
      
      setTemplates(data.templates)
      setPagination(data.pagination)
    } catch (error) {
      console.error('Error fetching templates:', error)
      toast({
        title: "Erreur",
        description: "Impossible de charger les modèles",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchUserCredits = async () => {
    try {
      const response = await fetch('/api/credits')
      const data = await response.json()
      
      if (response.ok) {
        setUserCredits(data.credits.credits_balance)
      }
    } catch (error) {
      console.error('Error fetching credits:', error)
    }
  }

  const handleSearch = () => {
    setPagination(prev => ({ ...prev, page: 1 }))
    fetchTemplates()
  }

  const handlePurchase = async (templateId: string, title: string, price: number) => {
    try {
      if (price > userCredits) {
        toast({
          title: "Crédits insuffisants",
          description: `Vous avez besoin de ${price} crédits mais vous n'en avez que ${userCredits}`,
          variant: "destructive"
        })
        return
      }

      const response = await fetch(`/api/templates/shared/${templateId}/purchase`, {
        method: 'POST'
      })
      
      const data = await response.json()
      
      if (!response.ok) throw new Error(data.error)
      
      toast({
        title: "Achat réussi",
        description: price === 0 ? "Modèle téléchargé avec succès" : `Modèle "${title}" acheté pour ${price} crédits`,
      })
      
      // Update user credits
      setUserCredits(prev => prev - price)
      
      // Refresh templates to update download count
      fetchTemplates()
    } catch (error) {
      console.error('Error purchasing template:', error)
      toast({
        title: "Erreur",
        description: "Impossible d'acheter le modèle",
        variant: "destructive"
      })
    }
  }

  const getCategoryColor = (category: string) => {
    const colors = {
      'breakfast': 'bg-orange-100 text-orange-800',
      'lunch': 'bg-blue-100 text-blue-800',
      'dinner': 'bg-purple-100 text-purple-800',
      'snack': 'bg-green-100 text-green-800',
      'vegetarian': 'bg-emerald-100 text-emerald-800',
      'weight-loss': 'bg-red-100 text-red-800',
      'muscle-gain': 'bg-indigo-100 text-indigo-800',
    }
    return colors[category as keyof typeof colors] || 'bg-gray-100 text-gray-800'
  }

  const getDifficultyColor = (difficulty: string) => {
    const colors = {
      'easy': 'bg-green-100 text-green-800',
      'medium': 'bg-yellow-100 text-yellow-800',
      'hard': 'bg-red-100 text-red-800',
    }
    return colors[difficulty as keyof typeof colors] || 'bg-gray-100 text-gray-800'
  }

  if (loading && templates.length === 0) {
    return <DashboardSkeleton />
  }

  return (
    <div className="space-y-6">
      <DashboardHeader 
        title="Marketplace de modèles"
        subtitle={`Découvrez et achetez des modèles créés par des nutritionnistes professionnels`}
        action={
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Coins className="h-4 w-4" />
              <span>{userCredits} crédits</span>
            </div>
            <Button 
              variant="outline"
              onClick={() => router.push('/dashboard/templates')}
            >
              Mes modèles
            </Button>
          </div>
        }
      />

      <div className="px-6 space-y-6">
        {/* Search and Filters */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Rechercher des modèles..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                className="pl-10"
              />
            </div>
            <Button onClick={handleSearch} className="bg-emerald-600 hover:bg-emerald-700">
              Rechercher
            </Button>
          </div>

          <div className="flex items-center gap-4 flex-wrap">
            <Select value={selectedType} onValueChange={setSelectedType}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Type de modèle" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Tous les types</SelectItem>
                <SelectItem value="recipe">Recettes</SelectItem>
                <SelectItem value="meal_plan">Plans alimentaires</SelectItem>
              </SelectContent>
            </Select>

            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Catégorie" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Toutes les catégories</SelectItem>
                <SelectItem value="breakfast">Petit-déjeuner</SelectItem>
                <SelectItem value="lunch">Déjeuner</SelectItem>
                <SelectItem value="dinner">Dîner</SelectItem>
                <SelectItem value="snack">Collation</SelectItem>
                <SelectItem value="vegetarian">Végétarien</SelectItem>
                <SelectItem value="weight-loss">Perte de poids</SelectItem>
                <SelectItem value="muscle-gain">Prise de muscle</SelectItem>
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Trier par" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="created_at">Date de création</SelectItem>
                <SelectItem value="rating_average">Note moyenne</SelectItem>
                <SelectItem value="download_count">Téléchargements</SelectItem>
                <SelectItem value="title">Titre</SelectItem>
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            >
              {sortOrder === 'asc' ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        {/* Templates Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {templates.map((template) => (
            <Card key={template.id} className="border-0 shadow-soft bg-white/80 backdrop-blur-sm hover:shadow-soft-md transition-all duration-200 group">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-base font-semibold text-gray-900 mb-1 line-clamp-1">
                      {template.title}
                    </CardTitle>
                    <CardDescription className="text-sm text-gray-600 line-clamp-2">
                      {template.description}
                    </CardDescription>
                  </div>
                  {template.is_featured && (
                    <Badge className="bg-yellow-100 text-yellow-800 border-0">
                      <Star className="h-3 w-3 mr-1" />
                      Vedette
                    </Badge>
                  )}
                </div>
              </CardHeader>
              
              <CardContent className="space-y-3">
                {/* Author */}
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Users className="h-3 w-3" />
                  <span>
                    {template.dietitians.practice_name || 
                     `${template.dietitians.first_name} ${template.dietitians.last_name}`}
                  </span>
                </div>

                {/* Badges */}
                <div className="flex flex-wrap gap-2">
                  <Badge className={`${getCategoryColor(template.category)} border-0 font-medium px-3 py-1`}>
                    {template.category}
                  </Badge>
                  {template.difficulty && (
                    <Badge className={`${getDifficultyColor(template.difficulty)} border-0 font-medium px-3 py-1`}>
                      {template.difficulty}
                    </Badge>
                  )}
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="flex items-center gap-2 text-gray-600">
                    <Clock className="h-3 w-3" />
                    <span>{template.prep_time ? `${template.prep_time}min` : 'Variable'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <Download className="h-3 w-3" />
                    <span>{template.download_count}</span>
                  </div>
                </div>

                {/* Rating */}
                {template.rating_count > 0 && (
                  <div className="flex items-center gap-2 text-sm">
                    <div className="flex items-center gap-1">
                      <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                      <span className="font-medium">{template.rating_average.toFixed(1)}</span>
                    </div>
                    <span className="text-gray-500">({template.rating_count})</span>
                  </div>
                )}

                {/* Tags */}
                {template.tags && template.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {template.tags.slice(0, 3).map((tag) => (
                      <Badge key={tag} variant="outline" className="text-xs px-2 py-0.5">
                        {tag}
                      </Badge>
                    ))}
                    {template.tags.length > 3 && (
                      <Badge variant="outline" className="text-xs px-2 py-0.5">
                        +{template.tags.length - 3}
                      </Badge>
                    )}
                  </div>
                )}

                {/* Purchase Button */}
                <div className="flex items-center justify-between pt-2">
                  <div className="flex items-center gap-1 text-sm font-medium">
                    {template.price_credits === 0 ? (
                      <span className="text-green-600">Gratuit</span>
                    ) : (
                      <>
                        <Coins className="h-3 w-3 text-yellow-500" />
                        <span>{template.price_credits} crédits</span>
                      </>
                    )}
                  </div>
                  <Button
                    size="sm"
                    onClick={() => handlePurchase(template.id, template.title, template.price_credits)}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white"
                    disabled={template.price_credits > userCredits}
                  >
                    <ShoppingCart className="h-3 w-3 mr-1" />
                    {template.price_credits === 0 ? 'Télécharger' : 'Acheter'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 pt-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPagination(prev => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
              disabled={pagination.page === 1}
            >
              Précédent
            </Button>
            <span className="text-sm text-gray-600">
              Page {pagination.page} sur {pagination.totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPagination(prev => ({ ...prev, page: Math.min(prev.totalPages, prev.page + 1) }))}
              disabled={pagination.page === pagination.totalPages}
            >
              Suivant
            </Button>
          </div>
        )}

        {/* Empty State */}
        {!loading && templates.length === 0 && (
          <div className="text-center py-12">
            <div className="mx-auto w-24 h-24 mb-4 bg-gray-100 rounded-full flex items-center justify-center">
              <Search className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Aucun modèle trouvé
            </h3>
            <p className="text-gray-600 mb-4">
              Essayez d'ajuster vos filtres ou termes de recherche
            </p>
            <Button 
              variant="outline"
              onClick={() => {
                setSearchTerm("")
                setSelectedCategory("")
                setSelectedType("")
                setSortBy("created_at")
                setSortOrder("desc")
                fetchTemplates()
              }}
            >
              Réinitialiser les filtres
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}