"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Plus, Search, Filter, MoreHorizontal, Copy, Edit, Trash2, Star, Clock, Users } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { DashboardHeader } from "@/components/dashboard-header"
import Link from "next/link"

export default function TemplatesPage() {
  const [searchTerm, setSearchTerm] = useState("")

  const templates = [
    {
      id: 1,
      name: "Mediterranean Weight Loss",
      description: "7-day Mediterranean-style meal plan focused on healthy weight loss",
      category: "Weight Loss",
      calories: "1,400-1,600",
      duration: "7 days",
      difficulty: "Easy",
      rating: 4.8,
      usageCount: 24,
      lastUsed: "2 days ago",
      tags: ["Mediterranean", "Heart Healthy", "Anti-inflammatory"],
      isFavorite: true,
    },
    {
      id: 2,
      name: "High Protein Muscle Building",
      description: "14-day high-protein plan designed for muscle gain and athletic performance",
      category: "Muscle Gain",
      calories: "2,200-2,500",
      duration: "14 days",
      difficulty: "Moderate",
      rating: 4.9,
      usageCount: 18,
      lastUsed: "1 week ago",
      tags: ["High Protein", "Athletic", "Performance"],
      isFavorite: false,
    },
    {
      id: 3,
      name: "Diabetic-Friendly Balanced",
      description: "Low-glycemic meal plan for diabetes management with balanced nutrition",
      category: "Medical",
      calories: "1,600-1,800",
      duration: "10 days",
      difficulty: "Easy",
      rating: 4.7,
      usageCount: 31,
      lastUsed: "3 days ago",
      tags: ["Diabetic", "Low Glycemic", "Balanced"],
      isFavorite: true,
    },
    {
      id: 4,
      name: "Plant-Based Detox",
      description: "21-day plant-based cleansing program with whole foods focus",
      category: "Detox",
      calories: "1,500-1,700",
      duration: "21 days",
      difficulty: "Hard",
      rating: 4.6,
      usageCount: 12,
      lastUsed: "2 weeks ago",
      tags: ["Vegan", "Detox", "Whole Foods"],
      isFavorite: false,
    },
    {
      id: 5,
      name: "Heart-Healthy DASH",
      description: "DASH diet-inspired plan for cardiovascular health improvement",
      category: "Heart Health",
      calories: "1,800-2,000",
      duration: "14 days",
      difficulty: "Easy",
      rating: 4.8,
      usageCount: 27,
      lastUsed: "5 days ago",
      tags: ["DASH", "Heart Health", "Low Sodium"],
      isFavorite: true,
    },
    {
      id: 6,
      name: "Keto Fat Loss",
      description: "Low-carb ketogenic approach for rapid fat loss and metabolic health",
      category: "Weight Loss",
      calories: "1,300-1,500",
      duration: "7 days",
      difficulty: "Hard",
      rating: 4.5,
      usageCount: 15,
      lastUsed: "1 week ago",
      tags: ["Keto", "Low Carb", "Fat Loss"],
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

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "Weight Loss":
        return "bg-emerald-100 text-emerald-800"
      case "Muscle Gain":
        return "bg-blue-100 text-blue-800"
      case "Medical":
        return "bg-red-100 text-red-800"
      case "Detox":
        return "bg-purple-100 text-purple-800"
      case "Heart Health":
        return "bg-orange-100 text-orange-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "Easy":
        return "bg-green-100 text-green-800"
      case "Moderate":
        return "bg-yellow-100 text-yellow-800"
      case "Hard":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <div className="space-y-6">
      <DashboardHeader 
        title="Templates Library"
        subtitle={`${templates.length} meal plan templates available for your practice`}
        searchPlaceholder="Search templates..."
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        action={
          <Button className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-soft hover:shadow-soft-lg transition-all duration-200 font-medium">
            <Plus className="mr-2 h-4 w-4" />
            New Template
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
              <h3 className="text-lg font-semibold text-gray-900 mb-3">No templates found</h3>
              <p className="text-gray-600 text-sm mb-8 max-w-sm mx-auto leading-relaxed">
                Try adjusting your search terms or create a new template.
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
                        Use Template
                      </DropdownMenuItem>
                      <DropdownMenuItem className="hover:bg-gray-50 transition-colors">
                        <Edit className="h-4 w-4 mr-2" />
                        Edit Template
                      </DropdownMenuItem>
                      <DropdownMenuItem className="hover:bg-gray-50 transition-colors">
                        <Copy className="h-4 w-4 mr-2 rotate-180" />
                        Duplicate
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-red-600 hover:bg-red-50 hover:text-red-700 transition-colors">
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  <Badge className={`${getCategoryColor(template.category)} border-0 font-medium px-3 py-1`}>{template.category}</Badge>
                  <Badge className={`${getDifficultyColor(template.difficulty)} border-0 font-medium px-3 py-1`}>{template.difficulty}</Badge>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-500 font-medium">Duration</p>
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
                    <span className="font-medium tabular-nums">{template.usageCount} uses</span>
                  </div>
                </div>

                <div className="flex items-center gap-1 text-xs text-gray-500 font-medium">
                  <Clock className="h-3 w-3 opacity-60" />
                  <span>Last used {template.lastUsed}</span>
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
                    Use Template
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
