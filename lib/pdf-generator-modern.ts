import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

export interface MealPlanPDFData {
  id: string
  name: string
  description?: string
  clientName: string
  clientEmail: string
  duration_days: number
  calories_range?: string
  status: string
  created_at: string
  dayPlans: Array<{
    day: number
    meals: {
      breakfast: string[]
      lunch: string[]
      dinner: string[]
      snacks: string[]
    }
    notes?: string
  }>
}

// Modern color palette
const colors = {
  primary: '#10b981', // emerald-500
  primaryDark: '#059669', // emerald-600
  secondary: '#3b82f6', // blue-500
  accent: '#f59e0b', // amber-500
  success: '#22c55e', // green-500
  danger: '#ef4444', // red-500
  warning: '#f59e0b', // amber-500
  
  // Grays
  text: '#111827', // gray-900
  textMuted: '#6b7280', // gray-500
  textLight: '#9ca3af', // gray-400
  
  // Backgrounds
  bgLight: '#f9fafb', // gray-50
  bgMedium: '#f3f4f6', // gray-100
  border: '#e5e7eb', // gray-200
  borderDark: '#d1d5db', // gray-300
  
  // Meal type colors
  breakfast: '#fbbf24', // yellow-400
  lunch: '#34d399', // green-400
  dinner: '#a78bfa', // purple-400
  snack: '#60a5fa', // blue-400
}

interface ModernMealPlan {
  id: string
  name: string
  description?: string
  clientName: string
  clientEmail: string
  duration_days: number
  calories_range?: string
  status: string
  created_at: string
  dietitianName?: string
  dayPlans: Array<{
    day: number
    meals: {
      breakfast: any[]
      lunch: any[]
      dinner: any[]
      snacks: any[]
    }
    notes?: string
    breakfastHour?: string
    lunchHour?: string
    dinnerHour?: string
    snacksHour?: string
    breakfastEnabled?: boolean
    lunchEnabled?: boolean
    dinnerEnabled?: boolean
    snacksEnabled?: boolean
  }>
}

export class ModernPDFGenerator {
  private pdf: jsPDF
  private pageWidth: number
  private pageHeight: number
  private margin: number
  private contentWidth: number
  private currentY: number
  private pageNumber: number = 1

  constructor() {
    this.pdf = new jsPDF('p', 'mm', 'a4')
    this.pageWidth = 210
    this.pageHeight = 297
    this.margin = 15
    this.contentWidth = this.pageWidth - (this.margin * 2)
    this.currentY = this.margin
    
    // Add Unicode font support for emojis and special characters
    this.pdf.setFont('helvetica')
  }

  private hexToRgb(hex: string): [number, number, number] {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
    return result
      ? [
          parseInt(result[1], 16),
          parseInt(result[2], 16),
          parseInt(result[3], 16),
        ]
      : [0, 0, 0]
  }

  private addNewPageIfNeeded(requiredSpace: number = 30): boolean {
    if (this.currentY + requiredSpace > this.pageHeight - this.margin - 15) {
      this.pdf.addPage()
      this.currentY = this.margin
      this.pageNumber++
      this.drawPageHeader()
      return true
    }
    return false
  }

  private drawPageHeader() {
    if (this.pageNumber > 1) {
      // Small header for subsequent pages
      this.pdf.setFillColor(...this.hexToRgb(colors.primary))
      this.pdf.rect(0, 0, this.pageWidth, 8, 'F')
      this.currentY = 20
    }
  }

  private drawCoverPage(plan: ModernMealPlan) {
    // Background gradient effect
    for (let i = 0; i < 100; i++) {
      const alpha = 1 - (i / 100)
      this.pdf.setFillColor(...this.hexToRgb(colors.primary))
      this.pdf.setGState(new (this.pdf as any).GState({ opacity: alpha * 0.1 }))
      this.pdf.rect(0, i * 3, this.pageWidth, 3, 'F')
    }
    this.pdf.setGState(new (this.pdf as any).GState({ opacity: 1 }))

    // Logo/Brand area
    this.pdf.setFillColor(...this.hexToRgb(colors.primary))
    this.pdf.circle(this.pageWidth / 2, 40, 20, 'F')
    this.pdf.setTextColor(255, 255, 255)
    this.pdf.setFontSize(20)
    this.pdf.setFont('helvetica', 'bold')
    this.pdf.text('NF', this.pageWidth / 2, 45, { align: 'center' })

    // Title
    this.pdf.setTextColor(...this.hexToRgb(colors.text))
    this.pdf.setFontSize(32)
    this.pdf.text('Plan de Repas', this.pageWidth / 2, 80, { align: 'center' })
    
    // Plan name
    this.pdf.setFontSize(24)
    this.pdf.setFont('helvetica', 'normal')
    const titleLines = this.pdf.splitTextToSize(plan.name, this.contentWidth)
    let titleY = 100
    titleLines.forEach((line: string) => {
      this.pdf.text(line, this.pageWidth / 2, titleY, { align: 'center' })
      titleY += 10
    })

    // Client info box
    const boxY = 140
    this.pdf.setFillColor(...this.hexToRgb(colors.bgLight))
    this.pdf.roundedRect(30, boxY, this.pageWidth - 60, 60, 5, 5, 'F')
    
    // Client name
    this.pdf.setTextColor(...this.hexToRgb(colors.text))
    this.pdf.setFontSize(16)
    this.pdf.setFont('helvetica', 'bold')
    this.pdf.text('Préparé pour', this.pageWidth / 2, boxY + 15, { align: 'center' })
    
    this.pdf.setFontSize(20)
    this.pdf.setFont('helvetica', 'normal')
    this.pdf.text(plan.clientName, this.pageWidth / 2, boxY + 30, { align: 'center' })
    
    // Duration and date
    this.pdf.setFontSize(14)
    this.pdf.setTextColor(...this.hexToRgb(colors.textMuted))
    this.pdf.text(`Plan de ${plan.duration_days} jours`, this.pageWidth / 2, boxY + 45, { align: 'center' })

    // Created date
    const createdDate = new Date(plan.created_at).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    })
    this.pdf.setFontSize(12)
    this.pdf.text(`Créé le ${createdDate}`, this.pageWidth / 2, boxY + 55, { align: 'center' })

    // Dietitian info
    if (plan.dietitianName) {
      this.pdf.setFontSize(12)
      this.pdf.setFont('helvetica', 'italic')
      this.pdf.text(`Par ${plan.dietitianName}`, this.pageWidth / 2, 220, { align: 'center' })
    }

    // Decorative elements
    this.pdf.setDrawColor(...this.hexToRgb(colors.primary))
    this.pdf.setLineWidth(2)
    this.pdf.line(60, 240, this.pageWidth - 60, 240)
  }

  private drawTableOfContents(plan: ModernMealPlan) {
    this.pdf.addPage()
    this.currentY = 30

    // Title
    this.pdf.setFillColor(...this.hexToRgb(colors.primary))
    this.pdf.rect(this.margin, this.currentY - 10, 5, 25, 'F')
    
    this.pdf.setTextColor(...this.hexToRgb(colors.text))
    this.pdf.setFontSize(24)
    this.pdf.setFont('helvetica', 'bold')
    this.pdf.text('Sommaire', this.margin + 10, this.currentY)
    this.currentY += 30

    // Sections
    const sections = [
      { title: 'Vue d\'ensemble', page: 3, icon: '•' },
      { title: 'Objectifs nutritionnels', page: 4, icon: '•' },
      { title: 'Plans de repas quotidiens', page: 5, icon: '•' },
    ]

    sections.forEach((section) => {
      this.pdf.setFillColor(...this.hexToRgb(colors.bgLight))
      this.pdf.roundedRect(this.margin, this.currentY - 5, this.contentWidth, 15, 3, 3, 'F')
      
      // Icon placeholder
      this.pdf.setFontSize(16)
      this.pdf.text(section.icon, this.margin + 5, this.currentY + 3)
      
      // Title
      this.pdf.setTextColor(...this.hexToRgb(colors.text))
      this.pdf.setFontSize(14)
      this.pdf.setFont('helvetica', 'normal')
      this.pdf.text(section.title, this.margin + 20, this.currentY + 3)
      
      // Page number
      this.pdf.setTextColor(...this.hexToRgb(colors.textMuted))
      this.pdf.text(`Page ${section.page}`, this.pageWidth - this.margin - 20, this.currentY + 3)
      
      // Dotted line
      this.pdf.setDrawColor(...this.hexToRgb(colors.border))
      // Draw manual dotted line since setLineDash is not available
      const lineY = this.currentY + 3
      const startX = this.margin + 20 + this.pdf.getTextWidth(section.title) + 5
      const endX = this.pageWidth - this.margin - 25
      let currentX = startX
      while (currentX < endX) {
        this.pdf.line(currentX, lineY, Math.min(currentX + 1, endX), lineY)
        currentX += 3
      }
      
      this.currentY += 20
    })

    // Description if available
    if (plan.description) {
      this.currentY += 20
      this.pdf.setFillColor(...this.hexToRgb(colors.accent))
      this.pdf.rect(this.margin, this.currentY - 5, 5, 40, 'F')
      
      this.pdf.setTextColor(...this.hexToRgb(colors.text))
      this.pdf.setFontSize(14)
      this.pdf.setFont('helvetica', 'bold')
      this.pdf.text('À propos de ce plan', this.margin + 10, this.currentY)
      this.currentY += 10
      
      this.pdf.setFontSize(12)
      this.pdf.setFont('helvetica', 'normal')
      this.pdf.setTextColor(...this.hexToRgb(colors.textMuted))
      const descLines = this.pdf.splitTextToSize(plan.description, this.contentWidth - 20)
      descLines.forEach((line: string) => {
        this.pdf.text(line, this.margin + 10, this.currentY)
        this.currentY += 6
      })
    }
  }

  private drawNutritionalOverview(plan: ModernMealPlan) {
    this.pdf.addPage()
    this.currentY = 30

    // Title with icon
    this.pdf.setFillColor(...this.hexToRgb(colors.primary))
    this.pdf.rect(this.margin, this.currentY - 10, 5, 25, 'F')
    
    this.pdf.setTextColor(...this.hexToRgb(colors.text))
    this.pdf.setFontSize(24)
    this.pdf.setFont('helvetica', 'bold')
    this.pdf.text('Vue d\'ensemble nutritionnelle', this.margin + 10, this.currentY)
    this.currentY += 35

    // Key metrics cards
    const metrics = [
      { 
        label: 'Durée du plan', 
        value: `${plan.duration_days} jours`,
        color: colors.primary,
        icon: 'J'
      },
      { 
        label: 'Calories cibles', 
        value: plan.calories_range || '2000-2200 kcal',
        color: colors.secondary,
        icon: 'C'
      },
      { 
        label: 'Repas par jour', 
        value: '4 repas',
        color: colors.accent,
        icon: 'R'
      },
    ]

    const cardWidth = (this.contentWidth - 20) / 3
    metrics.forEach((metric, index) => {
      const x = this.margin + (index * (cardWidth + 10))
      
      // Card background
      this.pdf.setFillColor(...this.hexToRgb(colors.bgLight))
      this.pdf.roundedRect(x, this.currentY, cardWidth, 35, 5, 5, 'F')
      
      // Colored accent
      this.pdf.setFillColor(...this.hexToRgb(metric.color))
      this.pdf.rect(x, this.currentY, cardWidth, 3, 'F')
      
      // Icon
      this.pdf.setFontSize(20)
      this.pdf.text(metric.icon, x + cardWidth / 2, this.currentY + 12, { align: 'center' })
      
      // Value
      this.pdf.setTextColor(...this.hexToRgb(colors.text))
      this.pdf.setFontSize(16)
      this.pdf.setFont('helvetica', 'bold')
      this.pdf.text(metric.value, x + cardWidth / 2, this.currentY + 22, { align: 'center' })
      
      // Label
      this.pdf.setFontSize(10)
      this.pdf.setFont('helvetica', 'normal')
      this.pdf.setTextColor(...this.hexToRgb(colors.textMuted))
      this.pdf.text(metric.label, x + cardWidth / 2, this.currentY + 30, { align: 'center' })
    })

    this.currentY += 50

    // Macronutrient distribution
    this.pdf.setTextColor(...this.hexToRgb(colors.text))
    this.pdf.setFontSize(18)
    this.pdf.setFont('helvetica', 'bold')
    this.pdf.text('Répartition des macronutriments', this.margin, this.currentY)
    this.currentY += 15

    // Macro bars
    const macros = [
      { name: 'Protéines', percentage: 25, color: colors.danger, icon: 'P' },
      { name: 'Glucides', percentage: 45, color: colors.success, icon: 'G' },
      { name: 'Lipides', percentage: 30, color: colors.warning, icon: 'L' },
    ]

    macros.forEach((macro) => {
      // Icon
      this.pdf.setFontSize(14)
      this.pdf.text(macro.icon, this.margin, this.currentY)
      
      // Label
      this.pdf.setTextColor(...this.hexToRgb(colors.text))
      this.pdf.setFontSize(12)
      this.pdf.setFont('helvetica', 'normal')
      this.pdf.text(macro.name, this.margin + 15, this.currentY)
      
      // Percentage
      this.pdf.setFont('helvetica', 'bold')
      this.pdf.text(`${macro.percentage}%`, this.pageWidth - this.margin - 20, this.currentY)
      
      // Progress bar
      const barY = this.currentY + 3
      const barWidth = this.contentWidth - 40
      
      // Background
      this.pdf.setFillColor(...this.hexToRgb(colors.bgMedium))
      this.pdf.roundedRect(this.margin + 15, barY, barWidth, 6, 3, 3, 'F')
      
      // Fill
      this.pdf.setFillColor(...this.hexToRgb(macro.color))
      this.pdf.roundedRect(
        this.margin + 15, 
        barY, 
        (barWidth * macro.percentage) / 100, 
        6, 
        3, 
        3, 
        'F'
      )
      
      this.currentY += 18
    })

    this.currentY += 20

    // Weekly goals section
    this.pdf.setTextColor(...this.hexToRgb(colors.text))
    this.pdf.setFontSize(18)
    this.pdf.setFont('helvetica', 'bold')
    this.pdf.text('Objectifs hebdomadaires', this.margin, this.currentY)
    this.currentY += 15

    // Goals checklist
    const goals = [
      '• Maintenir une hydratation adéquate (2L d\'eau/jour)',
      '• Consommer 5 portions de fruits et légumes par jour',
      '• Limiter les aliments transformés',
      '• Privilégier les protéines maigres',
      '• Inclure des fibres à chaque repas',
    ]

    this.pdf.setFillColor(...this.hexToRgb(colors.bgLight))
    this.pdf.roundedRect(this.margin, this.currentY - 5, this.contentWidth, goals.length * 8 + 10, 5, 5, 'F')
    
    this.pdf.setTextColor(...this.hexToRgb(colors.textMuted))
    this.pdf.setFontSize(11)
    this.pdf.setFont('helvetica', 'normal')
    
    goals.forEach((goal) => {
      this.pdf.text(goal, this.margin + 10, this.currentY + 5)
      this.currentY += 8
    })
  }

  private formatFoodItem(food: any): string {
    // Handle simple strings (most common case for AI-generated meals)
    if (typeof food === 'string') {
      return food
    }
    
    // Handle null/undefined
    if (!food) {
      return 'Repas non spécifié'
    }
    
    // Handle AI-generated meals (with name and nutrition)
    if (food.name) {
      let result = food.name
      if (food.calories) {
        result += ` - ${food.calories} kcal`
      }
      return result
    }
    
    // Handle ANSES-CIQUAL foods 
    if (food.name_fr) {
      let result = food.name_fr
      if (food.quantity) {
        result += ` (${food.quantity}g)`
      }
      if (food.energy_kcal) {
        const calories = food.quantity 
          ? Math.round((food.energy_kcal * food.quantity) / 100)
          : food.energy_kcal
        result += ` - ${calories} kcal`
      }
      return result
    }
    
    // Handle meal objects with original_meal_name (from AI conversion)
    if (food.original_meal_name) {
      return food.original_meal_name
    }
    
    // Handle meal objects with description
    if (food.description) {
      return food.description
    }
    
    // Last resort fallback
    return String(food)
  }

  private formatIngredientText(ingredient: any): string {
    // If it's already a string, return it
    if (typeof ingredient === 'string') {
      return ingredient
    }
    
    // If it's an object, try to extract meaningful text
    if (typeof ingredient === 'object' && ingredient !== null) {
      // Try common ingredient object properties
      if (ingredient.name) {
        let result = ingredient.name
        // Add quantity if available
        if (ingredient.quantity) {
          result = `${ingredient.quantity} ${result}`
        } else if (ingredient.amount) {
          result = `${ingredient.amount} ${result}`
        }
        // Add unit if available
        if (ingredient.unit) {
          result = `${result} ${ingredient.unit}`
        }
        return result
      }
      
      // Try other common properties
      if (ingredient.ingredient) {
        return ingredient.ingredient
      }
      
      if (ingredient.description) {
        return ingredient.description
      }
      
      if (ingredient.text) {
        return ingredient.text
      }
      
      // If it has properties, try to construct a readable string
      const keys = Object.keys(ingredient)
      if (keys.length > 0) {
        // Try to find the most likely ingredient name property
        const nameKey = keys.find(key => 
          key.toLowerCase().includes('name') || 
          key.toLowerCase().includes('ingredient') ||
          key.toLowerCase().includes('item')
        )
        if (nameKey) {
          return String(ingredient[nameKey])
        }
        
        // Otherwise, use the first non-empty string property
        for (const key of keys) {
          const value = ingredient[key]
          if (typeof value === 'string' && value.trim()) {
            return value
          }
        }
      }
    }
    
    // Fallback to string conversion
    return String(ingredient || '')
  }

  private calculateMealNutrition(foods: any[]): {
    calories: number
    protein: number
    carbs: number
    fat: number
  } {
    let totals = {
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0
    }

    if (!Array.isArray(foods)) {
      return totals
    }

    foods.forEach(food => {
      // Skip null/undefined items
      if (!food) return
      
      // For strings (AI meal names), we can't calculate nutrition
      if (typeof food === 'string') {
        return // Skip strings - no nutrition data available
      }
      
      // Handle AI-generated meals (with direct nutrition values)
      if (food.calories || food.protein || food.carbs || food.fat) {
        totals.calories += food.calories || 0
        totals.protein += food.protein || 0
        totals.carbs += food.carbs || 0
        totals.fat += food.fat || 0
      }
      // Handle ANSES-CIQUAL foods (with quantity and per-100g values)
      else if (food.quantity && food.energy_kcal) {
        const factor = food.quantity / 100
        totals.calories += Math.round((food.energy_kcal || 0) * factor)
        totals.protein += Math.round((food.protein_g || 0) * factor * 10) / 10
        totals.carbs += Math.round((food.carbohydrate_g || 0) * factor * 10) / 10
        totals.fat += Math.round((food.fat_g || 0) * factor * 10) / 10
      }
      // Handle meal objects with nutrition (from meal plan conversion)
      else if (food.original_meal_name && (food.calories_target || food.nutrition)) {
        const nutrition = food.nutrition || {}
        totals.calories += food.calories_target || nutrition.calories || 0
        totals.protein += nutrition.protein || 0
        totals.carbs += nutrition.carbs || 0
        totals.fat += nutrition.fat || 0
      }
    })

    return totals
  }

  private drawDayPlan(dayPlan: any, dayIndex: number) {
    
    this.addNewPageIfNeeded(250)
    
    // Day header with modern design
    const headerHeight = 40
    
    // Background gradient
    this.pdf.setFillColor(...this.hexToRgb(colors.primary))
    this.pdf.rect(0, this.currentY - 10, this.pageWidth, headerHeight, 'F')
    
    // Day number circle
    this.pdf.setFillColor(255, 255, 255)
    this.pdf.circle(this.margin + 20, this.currentY + 10, 15, 'F')
    this.pdf.setTextColor(...this.hexToRgb(colors.primary))
    this.pdf.setFontSize(20)
    this.pdf.setFont('helvetica', 'bold')
    this.pdf.text(dayPlan.day.toString(), this.margin + 20, this.currentY + 15, { align: 'center' })
    
    // Day title
    this.pdf.setTextColor(255, 255, 255)
    this.pdf.setFontSize(22)
    this.pdf.text(`Jour ${dayPlan.day}`, this.margin + 45, this.currentY + 10)
    
    // Date
    const date = new Date(Date.now() + dayIndex * 86400000).toLocaleDateString('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long'
    })
    this.pdf.setFontSize(12)
    this.pdf.setFont('helvetica', 'normal')
    this.pdf.text(date, this.margin + 45, this.currentY + 20)
    
    this.currentY += headerHeight + 10

    // Notes if available
    if (dayPlan.notes) {
      this.pdf.setFillColor(...this.hexToRgb(colors.bgLight))
      this.pdf.roundedRect(this.margin, this.currentY - 5, this.contentWidth, 25, 5, 5, 'F')
      
      this.pdf.setTextColor(...this.hexToRgb(colors.textMuted))
      this.pdf.setFontSize(11)
      this.pdf.setFont('helvetica', 'italic')
      const noteLines = this.pdf.splitTextToSize(dayPlan.notes, this.contentWidth - 20)
      noteLines.forEach((line: string) => {
        this.pdf.text(line, this.margin + 10, this.currentY + 5)
        this.currentY += 6
      })
      this.currentY += 15
    }

    // Meal sections
    const mealTypes = [
      { 
        key: 'breakfast', 
        name: 'Petit-déjeuner', 
        icon: 'PD',
        color: colors.breakfast,
        hour: dayPlan.breakfastHour || '08:00',
        enabled: dayPlan.breakfastEnabled !== false
      },
      { 
        key: 'lunch', 
        name: 'Déjeuner', 
        icon: 'DJ',
        color: colors.lunch,
        hour: dayPlan.lunchHour || '12:00',
        enabled: dayPlan.lunchEnabled !== false
      },
      { 
        key: 'dinner', 
        name: 'Dîner', 
        icon: 'DN',
        color: colors.dinner,
        hour: dayPlan.dinnerHour || '19:00',
        enabled: dayPlan.dinnerEnabled !== false
      },
      { 
        key: 'snacks', 
        name: 'Collations', 
        icon: 'CO',
        color: colors.snack,
        hour: dayPlan.snacksHour || '16:00',
        enabled: dayPlan.snacksEnabled !== false
      },
    ]

    mealTypes.forEach((mealType) => {
      if (!mealType.enabled || !dayPlan.meals[mealType.key] || dayPlan.meals[mealType.key].length === 0) {
        return // Skip disabled or empty meals
      }

      this.addNewPageIfNeeded(60)
      
      // Meal header
      this.pdf.setFillColor(...this.hexToRgb(mealType.color))
      this.pdf.roundedRect(this.margin, this.currentY, this.contentWidth, 25, 5, 5, 'F')
      
      // Icon
      this.pdf.setFontSize(16)
      this.pdf.text(mealType.icon, this.margin + 10, this.currentY + 15)
      
      // Meal name
      this.pdf.setTextColor(255, 255, 255)
      this.pdf.setFontSize(14)
      this.pdf.setFont('helvetica', 'bold')
      this.pdf.text(mealType.name, this.margin + 30, this.currentY + 10)
      
      // Time
      this.pdf.setFontSize(12)
      this.pdf.setFont('helvetica', 'normal')
      this.pdf.text(`${mealType.hour}`, this.margin + 30, this.currentY + 18)
      
      // Nutrition totals for this meal
      const mealNutrition = this.calculateMealNutrition(dayPlan.meals[mealType.key])
      if (mealNutrition.calories > 0) {
        this.pdf.setFontSize(11)
        this.pdf.text(
          `${mealNutrition.calories} kcal | ${mealNutrition.protein}g P | ${mealNutrition.carbs}g G | ${mealNutrition.fat}g L`,
          this.pageWidth - this.margin - 10,
          this.currentY + 15,
          { align: 'right' }
        )
      }
      
      this.currentY += 30

      // Food items
      const foods = dayPlan.meals[mealType.key]
      
      foods.forEach((food: any, index: number) => {
        this.addNewPageIfNeeded(30) // Increase space needed for recipes
        
        // Alternating background
        if (index % 2 === 0) {
          this.pdf.setFillColor(...this.hexToRgb(colors.bgLight))
          this.pdf.rect(this.margin, this.currentY - 3, this.contentWidth, 12, 'F')
        }
        
        // Food item
        this.pdf.setTextColor(...this.hexToRgb(colors.text))
        this.pdf.setFontSize(11)
        this.pdf.setFont('helvetica', 'normal')
        
        const foodText = this.formatFoodItem(food)
        const foodLines = this.pdf.splitTextToSize(foodText, this.contentWidth - 20)
        
        foodLines.forEach((line: string) => {
          this.pdf.text(`• ${line}`, this.margin + 10, this.currentY + 3)
          this.currentY += 6
        })
        
        // Add recipe details if available
        
        if (food.recipe) {
          this.currentY += 3
          
          // Add ingredients if available
          if (food.recipe.ingredients && Array.isArray(food.recipe.ingredients) && food.recipe.ingredients.length > 0) {
            try {
            // Recipe ingredients header
            this.pdf.setFontSize(10)
            this.pdf.setFont('helvetica', 'bold')
            this.pdf.setTextColor(...this.hexToRgb(colors.primaryDark))
            this.pdf.text('Ingrédients:', this.margin + 15, this.currentY + 3)
            this.currentY += 8
            
            // Ingredients list
            this.pdf.setFont('helvetica', 'normal')
            this.pdf.setFontSize(9)
            this.pdf.setTextColor(...this.hexToRgb(colors.textMuted))
            
            food.recipe.ingredients.forEach((ingredient: any) => {
              const ingredientText = this.formatIngredientText(ingredient)
              if (ingredientText.trim()) {
                this.addNewPageIfNeeded(8)
                
                const ingredientLines = this.pdf.splitTextToSize(`• ${ingredientText}`, this.contentWidth - 25)
                
                ingredientLines.forEach((line: string) => {
                  this.pdf.text(line, this.margin + 20, this.currentY + 3)
                  this.currentY += 5
                })
              }
            })
            
            this.currentY += 3
            } catch (error) {
              console.error('Error processing recipe ingredients:', error)
            }
          }
          
          // Add instructions if available
          if (food.recipe.instructions && Array.isArray(food.recipe.instructions) && food.recipe.instructions.length > 0) {
            try {
            // Recipe instructions header
            this.pdf.setFontSize(10)
            this.pdf.setFont('helvetica', 'bold')
            this.pdf.setTextColor(...this.hexToRgb(colors.primaryDark))
            this.pdf.text('Instructions:', this.margin + 15, this.currentY + 3)
            this.currentY += 8
          
          // Instructions steps
          this.pdf.setFont('helvetica', 'normal')
          this.pdf.setFontSize(9)
          this.pdf.setTextColor(...this.hexToRgb(colors.textMuted))
          
          food.recipe.instructions.forEach((instruction: any, stepIndex: number) => {
            const instructionText = typeof instruction === 'string' ? instruction : String(instruction || '')
            if (instructionText.trim()) {
              this.addNewPageIfNeeded(12)
              
              const stepText = `${stepIndex + 1}. ${instructionText}`
              const stepLines = this.pdf.splitTextToSize(stepText, this.contentWidth - 25)
              
              stepLines.forEach((line: string, lineIndex: number) => {
                const indent = lineIndex === 0 ? 20 : 25 // Indent continuation lines more
                this.pdf.text(line, this.margin + indent, this.currentY + 3)
                this.currentY += 5
              })
            }
          })
          
            this.currentY += 5
            } catch (error) {
              console.error('Error processing recipe instructions:', error)
            }
          }
        }
        
        this.currentY += 4
      })
      
      this.currentY += 10
    })

    // Day summary
    const dayTotals = {
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0
    }

    Object.keys(dayPlan.meals).forEach(mealKey => {
      const nutrition = this.calculateMealNutrition(dayPlan.meals[mealKey])
      dayTotals.calories += nutrition.calories
      dayTotals.protein += nutrition.protein
      dayTotals.carbs += nutrition.carbs
      dayTotals.fat += nutrition.fat
    })

    if (dayTotals.calories > 0) {
      this.currentY += 10
      this.pdf.setFillColor(...this.hexToRgb(colors.primaryDark))
      this.pdf.roundedRect(this.margin, this.currentY, this.contentWidth, 20, 5, 5, 'F')
      
      this.pdf.setTextColor(255, 255, 255)
      this.pdf.setFontSize(12)
      this.pdf.setFont('helvetica', 'bold')
      this.pdf.text('Total du jour:', this.margin + 10, this.currentY + 12)
      
      this.pdf.setFont('helvetica', 'normal')
      this.pdf.text(
        `${dayTotals.calories} kcal | ${dayTotals.protein}g protéines | ${dayTotals.carbs}g glucides | ${dayTotals.fat}g lipides`,
        this.pageWidth - this.margin - 10,
        this.currentY + 12,
        { align: 'right' }
      )
      
      this.currentY += 30
    }
  }

  // Shopping list method removed for MVP


  // Notes section method removed for MVP

  private drawFooter() {
    const totalPages = this.pdf.getNumberOfPages()
    
    for (let i = 1; i <= totalPages; i++) {
      this.pdf.setPage(i)
      
      // Footer background
      this.pdf.setFillColor(...this.hexToRgb(colors.bgLight))
      this.pdf.rect(0, this.pageHeight - 20, this.pageWidth, 20, 'F')
      
      // Page number
      this.pdf.setTextColor(...this.hexToRgb(colors.textMuted))
      this.pdf.setFontSize(10)
      this.pdf.setFont('helvetica', 'normal')
      this.pdf.text(
        `${i} / ${totalPages}`,
        this.pageWidth / 2,
        this.pageHeight - 10,
        { align: 'center' }
      )
      
      // Branding
      this.pdf.setTextColor(...this.hexToRgb(colors.primary))
      this.pdf.setFontSize(9)
      this.pdf.text(
        'NutriFlow',
        this.margin,
        this.pageHeight - 10
      )
      
      // Date
      this.pdf.setTextColor(...this.hexToRgb(colors.textLight))
      this.pdf.text(
        new Date().toLocaleDateString('fr-FR'),
        this.pageWidth - this.margin,
        this.pageHeight - 10,
        { align: 'right' }
      )
    }
  }

  public generatePDF(plan: ModernMealPlan): jsPDF {
    // 1. Cover page
    this.drawCoverPage(plan)
    
    // 2. Table of contents
    this.drawTableOfContents(plan)
    
    // 3. Nutritional overview
    this.drawNutritionalOverview(plan)
    
    // 4. Daily meal plans
    plan.dayPlans.forEach((day, index) => {
      this.drawDayPlan(day, index)
    })
    
    // Removed shopping list and notes sections for MVP
    
    // 8. Add footer to all pages
    this.drawFooter()
    
    return this.pdf
  }
}

export function generateModernMealPlanPDF(mealPlan: ModernMealPlan): jsPDF {
  const generator = new ModernPDFGenerator()
  return generator.generatePDF(mealPlan)
}

export function downloadModernMealPlanPDF(mealPlan: ModernMealPlan, filename?: string): void {
  try {
    const doc = generateModernMealPlanPDF(mealPlan)
    const defaultFilename = `plan-repas-${mealPlan.clientName.replace(/\s+/g, '-').toLowerCase()}-${new Date().toISOString().split('T')[0]}.pdf`
    doc.save(filename || defaultFilename)
  } catch (error) {
    console.error('Error downloading modern meal plan PDF:', error)
    throw new Error('Failed to download meal plan PDF')
  }
}