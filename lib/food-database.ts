// Advanced Food Database Integration for NutriFlow
// This module provides comprehensive food data, nutritional information, and AI-powered recommendations

export interface FoodItem {
  id: string
  name: string
  brand?: string
  category: string
  barcode?: string
  nutrition: NutritionalInfo
  portions: Portion[]
  allergens: string[]
  labels: string[] // organic, gluten-free, vegan, etc.
  origin?: string
  seasonality?: string[]
  sustainability_score?: number
  glycemic_index?: number
  inflammatory_score?: number
}

export interface NutritionalInfo {
  calories: number // per 100g
  protein: number
  carbs: number
  fat: number
  saturated_fat: number
  fiber: number
  sugar: number
  sodium: number
  potassium: number
  calcium: number
  iron: number
  magnesium: number
  phosphorus: number
  zinc: number
  vitamin_a: number
  vitamin_c: number
  vitamin_d: number
  vitamin_e: number
  vitamin_k: number
  vitamin_b6: number
  vitamin_b12: number
  folate: number
  thiamine: number
  riboflavin: number
  niacin: number
  biotin: number
  pantothenic_acid: number
  omega_3: number
  omega_6: number
  cholesterol: number
  caffeine?: number
  alcohol?: number
}

export interface Portion {
  name: string
  weight_grams: number
  description?: string
}

export interface FoodSearchResult {
  items: FoodItem[]
  total: number
  filters: {
    categories: string[]
    allergens: string[]
    labels: string[]
    brands: string[]
  }
}

export interface NutritionalAnalysis {
  dailyValues: { [key: string]: { amount: number; percentage: number } }
  macroDistribution: { protein: number; carbs: number; fat: number }
  micronutrientStatus: { [key: string]: 'low' | 'adequate' | 'high' | 'excessive' }
  healthScore: number
  recommendations: string[]
  warnings: string[]
}

export class FoodDatabase {
  private apiKey: string
  private baseUrl: string
  
  constructor() {
    // In production, these would come from environment variables
    this.apiKey = process.env.FOOD_DATABASE_API_KEY || ''
    this.baseUrl = process.env.FOOD_DATABASE_URL || 'https://api.fooddata.gov'
  }

  // Comprehensive food search with advanced filtering
  async searchFoods(
    query: string,
    options: {
      category?: string
      allergen_free?: string[]
      labels?: string[]
      limit?: number
      offset?: number
      include_branded?: boolean
      sort_by?: 'relevance' | 'name' | 'calories' | 'protein'
    } = {}
  ): Promise<FoodSearchResult> {
    try {
      // For demo purposes, return comprehensive mock data
      // In production, this would integrate with USDA FoodData Central, OpenFoodFacts, or similar APIs
      
      const mockFoods = this.getMockFoodDatabase()
      const filtered = mockFoods.filter(food => 
        food.name.toLowerCase().includes(query.toLowerCase()) ||
        food.category.toLowerCase().includes(query.toLowerCase())
      )

      if (options.category) {
        filtered.splice(0, filtered.length, ...filtered.filter(f => f.category === options.category))
      }

      if (options.allergen_free) {
        filtered.splice(0, filtered.length, ...filtered.filter(f => 
          !options.allergen_free!.some(allergen => f.allergens.includes(allergen))
        ))
      }

      if (options.labels) {
        filtered.splice(0, filtered.length, ...filtered.filter(f => 
          options.labels!.some(label => f.labels.includes(label))
        ))
      }

      const startIndex = options.offset || 0
      const endIndex = startIndex + (options.limit || 20)
      const paginatedResults = filtered.slice(startIndex, endIndex)

      return {
        items: paginatedResults,
        total: filtered.length,
        filters: {
          categories: [...new Set(mockFoods.map(f => f.category))],
          allergens: [...new Set(mockFoods.flatMap(f => f.allergens))],
          labels: [...new Set(mockFoods.flatMap(f => f.labels))],
          brands: [...new Set(mockFoods.map(f => f.brand).filter(Boolean))] as string[]
        }
      }
    } catch (error) {
      console.error('Error searching foods:', error)
      throw new Error('Failed to search food database')
    }
  }

  // Get detailed food information by ID
  async getFoodById(id: string): Promise<FoodItem | null> {
    try {
      const mockFoods = this.getMockFoodDatabase()
      return mockFoods.find(food => food.id === id) || null
    } catch (error) {
      console.error('Error fetching food by ID:', error)
      return null
    }
  }

  // Analyze nutritional content of a meal or day
  async analyzeNutrition(
    foods: Array<{ foodId: string; portionSize: number; unit: string }>,
    targetValues?: Partial<NutritionalInfo>
  ): Promise<NutritionalAnalysis> {
    try {
      const foodItems = await Promise.all(
        foods.map(async item => {
          const food = await this.getFoodById(item.foodId)
          return { food, portion: item.portionSize }
        })
      )

      // Calculate total nutrition
      const totalNutrition = foodItems.reduce((total, item) => {
        if (!item.food) return total
        
        const factor = item.portion / 100 // convert to per 100g basis
        
        Object.keys(item.food.nutrition).forEach(key => {
          const nutritionKey = key as keyof NutritionalInfo
          const value = item.food!.nutrition[nutritionKey]
          if (typeof value === 'number') {
            total[nutritionKey] = (total[nutritionKey] || 0) + (value * factor)
          }
        })
        
        return total
      }, {} as Partial<NutritionalInfo>)

      // Calculate daily value percentages (based on standard 2000 calorie diet)
      const dailyValues = this.calculateDailyValues(totalNutrition)
      
      // Analyze macro distribution
      const macroDistribution = this.calculateMacroDistribution(totalNutrition)
      
      // Assess micronutrient status
      const micronutrientStatus = this.assessMicronutrients(totalNutrition)
      
      // Calculate overall health score
      const healthScore = this.calculateHealthScore(totalNutrition, macroDistribution)
      
      // Generate recommendations
      const recommendations = this.generateRecommendations(totalNutrition, micronutrientStatus)
      
      // Generate warnings
      const warnings = this.generateWarnings(totalNutrition, dailyValues)

      return {
        dailyValues,
        macroDistribution,
        micronutrientStatus,
        healthScore,
        recommendations,
        warnings
      }
    } catch (error) {
      console.error('Error analyzing nutrition:', error)
      throw new Error('Failed to analyze nutrition')
    }
  }

  // Get personalized food recommendations
  async getRecommendations(
    userProfile: {
      age: number
      gender: 'male' | 'female'
      activity_level: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active'
      goals: string[]
      allergies: string[]
      preferences: string[]
      health_conditions?: string[]
    },
    currentNutrition?: Partial<NutritionalInfo>
  ): Promise<{
    recommended_foods: FoodItem[]
    foods_to_limit: FoodItem[]
    meal_ideas: Array<{
      name: string
      description: string
      foods: string[]
      nutrition_highlights: string[]
    }>
  }> {
    try {
      const mockFoods = this.getMockFoodDatabase()
      
      // Filter foods based on allergies and preferences
      let suitableFoods = mockFoods.filter(food => 
        !userProfile.allergies.some(allergen => food.allergens.includes(allergen))
      )

      if (userProfile.preferences.includes('vegetarian')) {
        suitableFoods = suitableFoods.filter(food => food.labels.includes('vegetarian'))
      }

      if (userProfile.preferences.includes('vegan')) {
        suitableFoods = suitableFoods.filter(food => food.labels.includes('vegan'))
      }

      // Recommend based on goals
      const recommended_foods = this.selectFoodsForGoals(suitableFoods, userProfile.goals)
      const foods_to_limit = this.selectFoodsToLimit(mockFoods, userProfile.goals)
      
      const meal_ideas = [
        {
          name: "Petit-déjeuner énergisant",
          description: "Riche en protéines et fibres pour bien commencer la journée",
          foods: ["Avoine complète", "Myrtilles fraîches", "Amandes", "Yaourt grec"],
          nutrition_highlights: ["25g protéines", "8g fibres", "Antioxydants"]
        },
        {
          name: "Déjeuner équilibré",
          description: "Combinaison parfaite de protéines, légumes et glucides complexes",
          foods: ["Quinoa", "Saumon grillé", "Brocolis", "Avocat"],
          nutrition_highlights: ["Oméga-3", "Vitamines B", "Potassium"]
        },
        {
          name: "Collation post-entraînement",
          description: "Récupération optimale après l'effort",
          foods: ["Banane", "Beurre d'amande", "Graines de chia"],
          nutrition_highlights: ["Glucides rapides", "Protéines", "Électrolytes"]
        }
      ]

      return {
        recommended_foods: recommended_foods.slice(0, 10),
        foods_to_limit: foods_to_limit.slice(0, 5),
        meal_ideas
      }
    } catch (error) {
      console.error('Error getting recommendations:', error)
      throw new Error('Failed to get food recommendations')
    }
  }

  // Barcode scanning for quick food entry
  async scanBarcode(barcode: string): Promise<FoodItem | null> {
    try {
      // In production, this would integrate with OpenFoodFacts or similar API
      const mockFoods = this.getMockFoodDatabase()
      return mockFoods.find(food => food.barcode === barcode) || null
    } catch (error) {
      console.error('Error scanning barcode:', error)
      return null
    }
  }

  // Private helper methods
  private getMockFoodDatabase(): FoodItem[] {
    return [
      {
        id: "avoine-complete",
        name: "Avoine complète",
        category: "Céréales",
        nutrition: {
          calories: 389,
          protein: 16.9,
          carbs: 66.3,
          fat: 6.9,
          saturated_fat: 1.2,
          fiber: 10.6,
          sugar: 0.99,
          sodium: 2,
          potassium: 429,
          calcium: 54,
          iron: 4.7,
          magnesium: 177,
          phosphorus: 523,
          zinc: 4.0,
          vitamin_a: 0,
          vitamin_c: 0,
          vitamin_d: 0,
          vitamin_e: 0.42,
          vitamin_k: 2.0,
          vitamin_b6: 0.12,
          vitamin_b12: 0,
          folate: 56,
          thiamine: 0.76,
          riboflavin: 0.14,
          niacin: 0.96,
          biotin: 20,
          pantothenic_acid: 1.35,
          omega_3: 0.11,
          omega_6: 2.42,
          cholesterol: 0,
        },
        portions: [
          { name: "1 tasse cuite", weight_grams: 234 },
          { name: "1/2 tasse sèche", weight_grams: 40 }
        ],
        allergens: ["gluten"],
        labels: ["wholefood", "high-fiber", "vegetarian", "vegan"],
        origin: "Canada",
        seasonality: ["all-year"],
        sustainability_score: 8,
        glycemic_index: 55,
        inflammatory_score: -2
      },
      {
        id: "saumon-atlantique",
        name: "Saumon atlantique",
        category: "Poissons",
        nutrition: {
          calories: 208,
          protein: 25.4,
          carbs: 0,
          fat: 12.4,
          saturated_fat: 3.05,
          fiber: 0,
          sugar: 0,
          sodium: 44,
          potassium: 628,
          calcium: 9,
          iron: 0.25,
          magnesium: 30,
          phosphorus: 252,
          zinc: 0.64,
          vitamin_a: 12,
          vitamin_c: 0,
          vitamin_d: 526,
          vitamin_e: 1.22,
          vitamin_k: 0.1,
          vitamin_b6: 0.94,
          vitamin_b12: 2.38,
          folate: 26,
          thiamine: 0.23,
          riboflavin: 0.15,
          niacin: 8.42,
          biotin: 5,
          pantothenic_acid: 1.66,
          omega_3: 2.18,
          omega_6: 0.86,
          cholesterol: 55,
        },
        portions: [
          { name: "1 filet (150g)", weight_grams: 150 },
          { name: "85g portion", weight_grams: 85 }
        ],
        allergens: ["fish"],
        labels: ["high-protein", "omega-3-rich", "wild-caught"],
        origin: "Atlantique Nord",
        seasonality: ["all-year"],
        sustainability_score: 6,
        inflammatory_score: -3
      },
      {
        id: "brocoli-frais",
        name: "Brocoli frais",
        category: "Légumes",
        nutrition: {
          calories: 34,
          protein: 2.8,
          carbs: 6.6,
          fat: 0.4,
          saturated_fat: 0.1,
          fiber: 2.6,
          sugar: 1.5,
          sodium: 33,
          potassium: 316,
          calcium: 47,
          iron: 0.73,
          magnesium: 21,
          phosphorus: 66,
          zinc: 0.41,
          vitamin_a: 31,
          vitamin_c: 89.2,
          vitamin_d: 0,
          vitamin_e: 0.78,
          vitamin_k: 101.6,
          vitamin_b6: 0.18,
          vitamin_b12: 0,
          folate: 63,
          thiamine: 0.07,
          riboflavin: 0.12,
          niacin: 0.64,
          biotin: 1.5,
          pantothenic_acid: 0.57,
          omega_3: 0.02,
          omega_6: 0.06,
          cholesterol: 0,
        },
        portions: [
          { name: "1 tasse hachée", weight_grams: 91 },
          { name: "1 tête moyenne", weight_grams: 608 }
        ],
        allergens: [],
        labels: ["low-calorie", "high-vitamin-c", "antioxidant", "vegetarian", "vegan"],
        origin: "Local",
        seasonality: ["fall", "winter", "spring"],
        sustainability_score: 9,
        glycemic_index: 15,
        inflammatory_score: -4
      },
      {
        id: "quinoa-tricolore",
        name: "Quinoa tricolore",
        category: "Céréales",
        nutrition: {
          calories: 368,
          protein: 14.1,
          carbs: 64.2,
          fat: 6.1,
          saturated_fat: 0.7,
          fiber: 7.0,
          sugar: 4.6,
          sodium: 5,
          potassium: 563,
          calcium: 47,
          iron: 4.6,
          magnesium: 197,
          phosphorus: 457,
          zinc: 3.1,
          vitamin_a: 1,
          vitamin_c: 0,
          vitamin_d: 0,
          vitamin_e: 2.44,
          vitamin_k: 0,
          vitamin_b6: 0.49,
          vitamin_b12: 0,
          folate: 184,
          thiamine: 0.36,
          riboflavin: 0.32,
          niacin: 1.52,
          biotin: 0,
          pantothenic_acid: 0.77,
          omega_3: 0.26,
          omega_6: 2.98,
          cholesterol: 0,
        },
        portions: [
          { name: "1 tasse cuite", weight_grams: 185 },
          { name: "1/4 tasse sèche", weight_grams: 43 }
        ],
        allergens: [],
        labels: ["complete-protein", "gluten-free", "vegetarian", "vegan", "superfood"],
        origin: "Pérou",
        seasonality: ["all-year"],
        sustainability_score: 7,
        glycemic_index: 35,
        inflammatory_score: -1
      },
      {
        id: "avocat-hass",
        name: "Avocat Hass",
        category: "Fruits",
        nutrition: {
          calories: 160,
          protein: 2.0,
          carbs: 8.5,
          fat: 14.7,
          saturated_fat: 2.1,
          fiber: 6.7,
          sugar: 0.7,
          sodium: 7,
          potassium: 485,
          calcium: 12,
          iron: 0.55,
          magnesium: 29,
          phosphorus: 52,
          zinc: 0.64,
          vitamin_a: 7,
          vitamin_c: 10,
          vitamin_d: 0,
          vitamin_e: 2.07,
          vitamin_k: 21,
          vitamin_b6: 0.26,
          vitamin_b12: 0,
          folate: 20,
          thiamine: 0.07,
          riboflavin: 0.13,
          niacin: 1.74,
          biotin: 3.2,
          pantothenic_acid: 1.39,
          omega_3: 0.11,
          omega_6: 1.69,
          cholesterol: 0,
        },
        portions: [
          { name: "1 avocat moyen", weight_grams: 150 },
          { name: "1/2 avocat", weight_grams: 75 }
        ],
        allergens: [],
        labels: ["healthy-fats", "potassium-rich", "vegetarian", "vegan", "keto-friendly"],
        origin: "Mexique",
        seasonality: ["all-year"],
        sustainability_score: 5,
        glycemic_index: 15,
        inflammatory_score: -2
      }
      // Add more foods as needed...
    ]
  }

  private calculateDailyValues(nutrition: Partial<NutritionalInfo>): { [key: string]: { amount: number; percentage: number } } {
    const dailyRecommendations = {
      calories: 2000,
      protein: 50,
      carbs: 300,
      fat: 65,
      fiber: 25,
      sodium: 2300,
      potassium: 3500,
      calcium: 1000,
      iron: 18,
      vitamin_c: 90,
      vitamin_d: 20
    }

    const result: { [key: string]: { amount: number; percentage: number } } = {}

    Object.entries(dailyRecommendations).forEach(([key, recommended]) => {
      const amount = nutrition[key as keyof NutritionalInfo] || 0
      const percentage = (amount / recommended) * 100
      result[key] = { amount, percentage }
    })

    return result
  }

  private calculateMacroDistribution(nutrition: Partial<NutritionalInfo>): { protein: number; carbs: number; fat: number } {
    const calories = nutrition.calories || 0
    const protein = (nutrition.protein || 0) * 4
    const carbs = (nutrition.carbs || 0) * 4
    const fat = (nutrition.fat || 0) * 9

    const total = protein + carbs + fat
    
    if (total === 0) return { protein: 0, carbs: 0, fat: 0 }

    return {
      protein: (protein / total) * 100,
      carbs: (carbs / total) * 100,
      fat: (fat / total) * 100
    }
  }

  private assessMicronutrients(nutrition: Partial<NutritionalInfo>): { [key: string]: 'low' | 'adequate' | 'high' | 'excessive' } {
    // Simplified assessment logic
    const assessment: { [key: string]: 'low' | 'adequate' | 'high' | 'excessive' } = {}
    
    const micronutrients = ['vitamin_c', 'vitamin_d', 'calcium', 'iron', 'potassium']
    
    micronutrients.forEach(nutrient => {
      const value = nutrition[nutrient as keyof NutritionalInfo] || 0
      // Simplified thresholds - in production, these would be more sophisticated
      if (value < 50) assessment[nutrient] = 'low'
      else if (value < 100) assessment[nutrient] = 'adequate'
      else if (value < 200) assessment[nutrient] = 'high'
      else assessment[nutrient] = 'excessive'
    })

    return assessment
  }

  private calculateHealthScore(nutrition: Partial<NutritionalInfo>, macros: any): number {
    let score = 50 // Base score

    // Positive factors
    if ((nutrition.fiber || 0) > 10) score += 10
    if ((nutrition.omega_3 || 0) > 1) score += 10
    if ((nutrition.protein || 0) > 20) score += 5
    if (macros.protein > 15 && macros.protein < 35) score += 5

    // Negative factors
    if ((nutrition.sodium || 0) > 1000) score -= 10
    if ((nutrition.sugar || 0) > 25) score -= 10
    if ((nutrition.saturated_fat || 0) > 20) score -= 5

    return Math.max(0, Math.min(100, score))
  }

  private generateRecommendations(nutrition: Partial<NutritionalInfo>, microStatus: any): string[] {
    const recommendations: string[] = []

    if (microStatus.vitamin_c === 'low') {
      recommendations.push("Ajoutez plus d'agrumes et de légumes colorés")
    }
    if (microStatus.calcium === 'low') {
      recommendations.push("Incluez plus de produits laitiers ou d'alternatives enrichies")
    }
    if ((nutrition.fiber || 0) < 10) {
      recommendations.push("Augmentez votre consommation de légumes et grains entiers")
    }
    if ((nutrition.omega_3 || 0) < 1) {
      recommendations.push("Ajoutez des poissons gras ou graines de lin")
    }

    return recommendations
  }

  private generateWarnings(nutrition: Partial<NutritionalInfo>, dailyValues: any): string[] {
    const warnings: string[] = []

    if (dailyValues.sodium?.percentage > 75) {
      warnings.push("Attention: apport en sodium élevé")
    }
    if (dailyValues.calories?.percentage > 120) {
      warnings.push("Attention: apport calorique élevé")
    }
    if ((nutrition.sugar || 0) > 50) {
      warnings.push("Attention: apport en sucre élevé")
    }

    return warnings
  }

  private selectFoodsForGoals(foods: FoodItem[], goals: string[]): FoodItem[] {
    return foods.filter(food => {
      if (goals.includes('perte_poids')) {
        return food.nutrition.calories < 200 && food.nutrition.fiber > 3
      }
      if (goals.includes('prise_masse')) {
        return food.nutrition.protein > 15 || food.nutrition.calories > 300
      }
      if (goals.includes('sante_cardiaque')) {
        return food.nutrition.omega_3 > 0.5 || food.labels.includes('heart-healthy')
      }
      return true
    })
  }

  private selectFoodsToLimit(foods: FoodItem[], goals: string[]): FoodItem[] {
    return foods.filter(food => {
      if (goals.includes('perte_poids')) {
        return food.nutrition.calories > 400 || food.nutrition.sugar > 15
      }
      if (goals.includes('sante_cardiaque')) {
        return food.nutrition.saturated_fat > 5 || food.nutrition.sodium > 300
      }
      return food.nutrition.sodium > 500 || food.nutrition.sugar > 20
    })
  }
}

// Export singleton instance
export const foodDatabase = new FoodDatabase()
