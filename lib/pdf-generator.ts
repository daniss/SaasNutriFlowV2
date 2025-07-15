import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { GeneratedMealPlan, Meal, DayPlan } from './gemini'

// Define colors for professional theme
const colors = {
  primary: '#10b981', // emerald-500
  secondary: '#3b82f6', // blue-500
  accent: '#8b5cf6', // purple-500
  text: '#1f2937', // gray-800
  lightText: '#6b7280', // gray-500
  background: '#f9fafb', // gray-50
  border: '#e5e7eb', // gray-200
}

export class ProfessionalPDFGenerator {
  private pdf: jsPDF
  private pageWidth: number
  private pageHeight: number
  private margin: number
  private contentWidth: number
  private currentY: number

  constructor() {
    this.pdf = new jsPDF('p', 'mm', 'a4')
    this.pageWidth = 210
    this.pageHeight = 297
    this.margin = 20
    this.contentWidth = this.pageWidth - (this.margin * 2)
    this.currentY = this.margin
    
    // Add custom fonts if needed
    this.setupFonts()
  }

  private setupFonts() {
    // For now using default fonts, but can be extended with custom fonts
    this.pdf.setFont('helvetica')
  }

  private addNewPageIfNeeded(requiredSpace: number = 30) {
    if (this.currentY + requiredSpace > this.pageHeight - this.margin) {
      this.pdf.addPage()
      this.currentY = this.margin
      return true
    }
    return false
  }

  private drawHeader(title: string, dietitianName: string) {
    // Logo area (placeholder)
    this.pdf.setFillColor(16, 185, 129) // emerald-500
    this.pdf.rect(this.margin, this.margin, 40, 15, 'F')
    this.pdf.setTextColor(255, 255, 255)
    this.pdf.setFontSize(12)
    this.pdf.setFont('helvetica', 'bold')
    this.pdf.text('NutriFlow', this.margin + 20, this.margin + 10, { align: 'center' })

    // Title
    this.pdf.setTextColor(31, 41, 55) // gray-800
    this.pdf.setFontSize(24)
    this.pdf.text(title, this.pageWidth / 2, this.margin + 30, { align: 'center' })

    // Subtitle
    this.pdf.setFontSize(12)
    this.pdf.setFont('helvetica', 'normal')
    this.pdf.setTextColor(107, 114, 128) // gray-500
    this.pdf.text(`Créé par ${dietitianName}`, this.pageWidth / 2, this.margin + 40, { align: 'center' })
    
    // Date
    this.pdf.text(new Date().toLocaleDateString('fr-FR'), this.pageWidth / 2, this.margin + 48, { align: 'center' })

    this.currentY = this.margin + 60
  }

  private drawNutritionalOverview(plan: GeneratedMealPlan) {
    this.addNewPageIfNeeded(50)
    
    // Section title
    this.pdf.setFontSize(16)
    this.pdf.setFont('helvetica', 'bold')
    this.pdf.setTextColor(31, 41, 55)
    this.pdf.text('Vue d\'ensemble nutritionnelle', this.margin, this.currentY)
    this.currentY += 10

    // Create overview table
    const overviewData = [
      ['Durée du plan', `${plan.duration} jours`],
      ['Calories quotidiennes', `${plan.targetCalories || plan.nutritionalGoals?.dailyCalories || 'N/A'} kcal`],
      ['Répartition des macronutriments', ''],
      ['  • Protéines', `${plan.nutritionalGoals?.proteinPercentage || 25}%`],
      ['  • Glucides', `${plan.nutritionalGoals?.carbPercentage || 45}%`],
      ['  • Lipides', `${plan.nutritionalGoals?.fatPercentage || 30}%`],
    ]

    autoTable(this.pdf, {
      startY: this.currentY,
      head: [],
      body: overviewData,
      theme: 'plain',
      styles: {
        fontSize: 11,
        cellPadding: 5,
      },
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: 80 },
        1: { cellWidth: 90 },
      },
      alternateRowStyles: { fillColor: [249, 250, 251] }, // gray-50
      margin: { left: this.margin, right: this.margin },
    })

    this.currentY = (this.pdf as any).lastAutoTable.finalY + 15
  }

  private formatMealForPDF(meal: Meal): string[][] {
    const mealData: string[][] = []
    
    // Basic info
    mealData.push(['Nom', meal.name])
    if (meal.description) {
      mealData.push(['Description', meal.description])
    }
    
    // Nutritional info
    mealData.push(['Valeurs nutritionnelles', ''])
    mealData.push(['  • Calories', `${meal.calories || 0} kcal`])
    mealData.push(['  • Protéines', `${meal.protein || 0} g`])
    mealData.push(['  • Glucides', `${meal.carbs || 0} g`])
    mealData.push(['  • Lipides', `${meal.fat || 0} g`])
    if (meal.fiber) {
      mealData.push(['  • Fibres', `${meal.fiber} g`])
    }
    
    // Timing
    if (meal.prepTime || meal.cookTime) {
      mealData.push(['Temps de préparation', ''])
      if (meal.prepTime) {
        mealData.push(['  • Préparation', `${meal.prepTime} min`])
      }
      if (meal.cookTime) {
        mealData.push(['  • Cuisson', `${meal.cookTime} min`])
      }
    }
    
    return mealData
  }

  private drawDayPlan(day: DayPlan, dayIndex: number) {
    this.addNewPageIfNeeded(40)
    
    // Day header
    this.pdf.setFillColor(59, 130, 246) // blue-500
    this.pdf.rect(this.margin, this.currentY, this.contentWidth, 12, 'F')
    this.pdf.setTextColor(255, 255, 255)
    this.pdf.setFontSize(14)
    this.pdf.setFont('helvetica', 'bold')
    this.pdf.text(
      `Jour ${day.day} - ${day.date || new Date(Date.now() + dayIndex * 86400000).toLocaleDateString('fr-FR')}`,
      this.margin + 5,
      this.currentY + 8
    )
    
    // Day totals
    this.pdf.setFont('helvetica', 'normal')
    this.pdf.setFontSize(10)
    this.pdf.text(
      `${day.totalCalories || 0} kcal | ${day.totalProtein || 0}g P | ${day.totalCarbs || 0}g G | ${day.totalFat || 0}g L`,
      this.pageWidth - this.margin - 5,
      this.currentY + 8,
      { align: 'right' }
    )
    
    this.currentY += 20

    // Meals
    day.meals.forEach((meal) => {
      this.addNewPageIfNeeded(60)
      
      // Meal type badge
      const mealTypeColors: Record<string, string> = {
        breakfast: '#fbbf24', // yellow-400
        lunch: '#34d399', // green-400
        dinner: '#a78bfa', // purple-400
        snack: '#60a5fa', // blue-400
      }
      
      this.pdf.setFillColor(...this.hexToRgb(mealTypeColors[meal.type] || '#60a5fa'))
      this.pdf.rect(this.margin, this.currentY, 30, 8, 'F')
      this.pdf.setTextColor(255, 255, 255)
      this.pdf.setFontSize(10)
      this.pdf.setFont('helvetica', 'bold')
      const mealTypeText = meal.type.charAt(0).toUpperCase() + meal.type.slice(1)
      this.pdf.text(mealTypeText, this.margin + 15, this.currentY + 5.5, { align: 'center' })
      
      this.currentY += 12

      // Meal details table
      const mealData = this.formatMealForPDF(meal)
      
      autoTable(this.pdf, {
        startY: this.currentY,
        head: [],
        body: mealData,
        theme: 'plain',
        styles: {
          fontSize: 10,
          cellPadding: 3,
        },
        columnStyles: {
          0: { cellWidth: 50, fontStyle: 'bold' },
          1: { cellWidth: this.contentWidth - 50 },
        },
        margin: { left: this.margin, right: this.margin },
      })

      this.currentY = (this.pdf as any).lastAutoTable.finalY + 10

      // Ingredients
      if (meal.ingredients && meal.ingredients.length > 0) {
        this.pdf.setFont('helvetica', 'bold')
        this.pdf.setFontSize(10)
        this.pdf.setTextColor(31, 41, 55)
        this.pdf.text('Ingrédients:', this.margin, this.currentY)
        this.currentY += 5

        this.pdf.setFont('helvetica', 'normal')
        this.pdf.setFontSize(9)
        meal.ingredients.forEach((ingredient) => {
          this.pdf.text(`• ${ingredient}`, this.margin + 5, this.currentY)
          this.currentY += 4
        })
        this.currentY += 5
      }

      // Instructions
      if (meal.instructions && meal.instructions.length > 0) {
        this.addNewPageIfNeeded(40)
        this.pdf.setFont('helvetica', 'bold')
        this.pdf.setFontSize(10)
        this.pdf.setTextColor(31, 41, 55)
        this.pdf.text('Instructions:', this.margin, this.currentY)
        this.currentY += 5

        this.pdf.setFont('helvetica', 'normal')
        this.pdf.setFontSize(9)
        meal.instructions.forEach((instruction, index) => {
          const lines = this.pdf.splitTextToSize(`${index + 1}. ${instruction}`, this.contentWidth - 10)
          lines.forEach((line: string) => {
            this.pdf.text(line, this.margin + 5, this.currentY)
            this.currentY += 4
          })
        })
        this.currentY += 5
      }

      // Add separator
      this.pdf.setDrawColor(229, 231, 235) // gray-200
      this.pdf.line(this.margin, this.currentY, this.pageWidth - this.margin, this.currentY)
      this.currentY += 10
    })
  }

  private drawShoppingList(plan: GeneratedMealPlan) {
    this.pdf.addPage()
    this.currentY = this.margin
    
    // Shopping list header
    this.pdf.setFillColor(16, 185, 129) // emerald-500
    this.pdf.rect(this.margin, this.currentY, this.contentWidth, 12, 'F')
    this.pdf.setTextColor(255, 255, 255)
    this.pdf.setFontSize(16)
    this.pdf.setFont('helvetica', 'bold')
    this.pdf.text('Liste de courses', this.margin + 5, this.currentY + 8)
    
    this.currentY += 20

    // Generate comprehensive shopping list
    const ingredientMap = new Map<string, Set<number>>()
    
    plan.days.forEach((day, dayIndex) => {
      day.meals.forEach((meal) => {
        if (meal.ingredients) {
          meal.ingredients.forEach((ingredient) => {
            const normalized = ingredient.toLowerCase().trim()
            if (!ingredientMap.has(normalized)) {
              ingredientMap.set(normalized, new Set())
            }
            ingredientMap.get(normalized)!.add(dayIndex + 1)
          })
        }
      })
    })

    // Group by category (simple categorization)
    const categories: Record<string, string[]> = {
      'Fruits et légumes': [],
      'Protéines': [],
      'Produits laitiers': [],
      'Céréales et féculents': [],
      'Autres': [],
    }

    // Simple categorization logic
    ingredientMap.forEach((days, ingredient) => {
      let category = 'Autres'
      
      if (ingredient.match(/tomate|carotte|pomme|banane|salade|concombre|brocoli|courgette|épinard|avocat|citron|orange|fraise|myrtille/i)) {
        category = 'Fruits et légumes'
      } else if (ingredient.match(/poulet|bœuf|poisson|saumon|thon|œuf|tofu|porc|dinde|crevette/i)) {
        category = 'Protéines'
      } else if (ingredient.match(/lait|yaourt|fromage|crème|beurre|mozzarella|feta|ricotta/i)) {
        category = 'Produits laitiers'
      } else if (ingredient.match(/pain|pâte|riz|quinoa|avoine|farine|céréale|pomme de terre/i)) {
        category = 'Céréales et féculents'
      }
      
      categories[category].push(`${ingredient} (jours ${Array.from(days).join(', ')})`)
    })

    // Draw categories
    Object.entries(categories).forEach(([category, items]) => {
      if (items.length > 0) {
        this.addNewPageIfNeeded(40)
        
        this.pdf.setFont('helvetica', 'bold')
        this.pdf.setFontSize(12)
        this.pdf.setTextColor(31, 41, 55)
        this.pdf.text(category, this.margin, this.currentY)
        this.currentY += 7

        this.pdf.setFont('helvetica', 'normal')
        this.pdf.setFontSize(10)
        items.sort().forEach((item) => {
          this.pdf.text(`□ ${item}`, this.margin + 5, this.currentY)
          this.currentY += 5
        })
        this.currentY += 5
      }
    })
  }

  private drawNutritionalAnalysis(plan: GeneratedMealPlan) {
    this.pdf.addPage()
    this.currentY = this.margin
    
    // Analysis header
    this.pdf.setFillColor(139, 92, 246) // purple-500
    this.pdf.rect(this.margin, this.currentY, this.contentWidth, 12, 'F')
    this.pdf.setTextColor(255, 255, 255)
    this.pdf.setFontSize(16)
    this.pdf.setFont('helvetica', 'bold')
    this.pdf.text('Analyse nutritionnelle détaillée', this.margin + 5, this.currentY + 8)
    
    this.currentY += 20

    // Calculate weekly averages
    let totalDays = 0
    let totalCalories = 0
    let totalProtein = 0
    let totalCarbs = 0
    let totalFat = 0

    plan.days.forEach((day) => {
      if (day.totalCalories) {
        totalDays++
        totalCalories += day.totalCalories
        totalProtein += day.totalProtein || 0
        totalCarbs += day.totalCarbs || 0
        totalFat += day.totalFat || 0
      }
    })

    const avgCalories = totalDays > 0 ? Math.round(totalCalories / totalDays) : 0
    const avgProtein = totalDays > 0 ? Math.round(totalProtein / totalDays) : 0
    const avgCarbs = totalDays > 0 ? Math.round(totalCarbs / totalDays) : 0
    const avgFat = totalDays > 0 ? Math.round(totalFat / totalDays) : 0

    // Summary table
    const summaryData = [
      ['Moyenne quotidienne', 'Valeur', 'Pourcentage', 'Recommandation'],
      ['Calories totales', `${avgCalories} kcal`, '-', `${plan.targetCalories || avgCalories} kcal`],
      ['Protéines', `${avgProtein} g`, `${Math.round((avgProtein * 4 / avgCalories) * 100)}%`, `${plan.nutritionalGoals?.proteinPercentage || 25}%`],
      ['Glucides', `${avgCarbs} g`, `${Math.round((avgCarbs * 4 / avgCalories) * 100)}%`, `${plan.nutritionalGoals?.carbPercentage || 45}%`],
      ['Lipides', `${avgFat} g`, `${Math.round((avgFat * 9 / avgCalories) * 100)}%`, `${plan.nutritionalGoals?.fatPercentage || 30}%`],
    ]

    autoTable(this.pdf, {
      startY: this.currentY,
      head: [summaryData[0]],
      body: summaryData.slice(1),
      theme: 'striped',
      headStyles: {
        fillColor: [139, 92, 246], // purple-500
        textColor: 255,
      },
      styles: {
        fontSize: 10,
        cellPadding: 5,
      },
      margin: { left: this.margin, right: this.margin },
    })

    this.currentY = (this.pdf as any).lastAutoTable.finalY + 20

    // Daily breakdown
    this.pdf.setFont('helvetica', 'bold')
    this.pdf.setFontSize(14)
    this.pdf.setTextColor(31, 41, 55)
    this.pdf.text('Répartition journalière', this.margin, this.currentY)
    this.currentY += 10

    const dailyData = [
      ['Jour', 'Calories', 'Protéines', 'Glucides', 'Lipides'],
      ...plan.days.map((day) => [
        `Jour ${day.day}`,
        `${day.totalCalories || 0} kcal`,
        `${day.totalProtein || 0} g`,
        `${day.totalCarbs || 0} g`,
        `${day.totalFat || 0} g`,
      ])
    ]

    autoTable(this.pdf, {
      startY: this.currentY,
      head: [dailyData[0]],
      body: dailyData.slice(1),
      theme: 'striped',
      headStyles: {
        fillColor: [59, 130, 246], // blue-500
        textColor: 255,
      },
      styles: {
        fontSize: 10,
        cellPadding: 4,
      },
      margin: { left: this.margin, right: this.margin },
    })
  }

  private drawFooter() {
    const pages = this.pdf.getNumberOfPages()
    
    for (let i = 1; i <= pages; i++) {
      this.pdf.setPage(i)
      
      // Footer line
      this.pdf.setDrawColor(229, 231, 235) // gray-200
      this.pdf.line(this.margin, this.pageHeight - 25, this.pageWidth - this.margin, this.pageHeight - 25)
      
      // Page number
      this.pdf.setFontSize(9)
      this.pdf.setTextColor(107, 114, 128) // gray-500
      this.pdf.text(
        `Page ${i} sur ${pages}`,
        this.pageWidth / 2,
        this.pageHeight - 15,
        { align: 'center' }
      )
      
      // NutriFlow branding
      this.pdf.setFontSize(8)
      this.pdf.text(
        'Généré par NutriFlow - Plateforme de nutrition professionnelle',
        this.pageWidth / 2,
        this.pageHeight - 10,
        { align: 'center' }
      )
    }
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

  public generatePDF(plan: GeneratedMealPlan, dietitianName: string = 'Votre nutritionniste'): jsPDF {
    // Cover page
    this.drawHeader(plan.title, dietitianName)
    
    // Description
    if (plan.description) {
      this.pdf.setFontSize(12)
      this.pdf.setFont('helvetica', 'normal')
      this.pdf.setTextColor(107, 114, 128)
      const lines = this.pdf.splitTextToSize(plan.description, this.contentWidth)
      lines.forEach((line: string) => {
        this.pdf.text(line, this.margin, this.currentY)
        this.currentY += 6
      })
      this.currentY += 10
    }

    // Nutritional overview
    this.drawNutritionalOverview(plan)

    // Daily meal plans
    plan.days.forEach((day, index) => {
      this.drawDayPlan(day, index)
    })

    // Shopping list
    this.drawShoppingList(plan)

    // Nutritional analysis
    this.drawNutritionalAnalysis(plan)

    // Footer on all pages
    this.drawFooter()

    return this.pdf
  }
}

export function generateProfessionalPDF(plan: GeneratedMealPlan, dietitianName?: string): jsPDF {
  const generator = new ProfessionalPDFGenerator()
  return generator.generatePDF(plan, dietitianName)
}

// Legacy exports for backward compatibility
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

export class MealPlanPDFGenerator {
  generate(mealPlan: MealPlanPDFData): jsPDF {
    // Convert legacy format to new format for PDF generation
    const convertedPlan: GeneratedMealPlan = {
      title: mealPlan.name,
      description: mealPlan.description,
      duration: mealPlan.duration_days,
      days: mealPlan.dayPlans.map((day, index) => ({
        day: day.day,
        date: new Date(Date.now() + index * 86400000).toISOString().split('T')[0],
        meals: [
          ...day.meals.breakfast.map(meal => ({ name: meal, type: 'breakfast' as const })),
          ...day.meals.lunch.map(meal => ({ name: meal, type: 'lunch' as const })),
          ...day.meals.dinner.map(meal => ({ name: meal, type: 'dinner' as const })),
          ...day.meals.snacks.map(meal => ({ name: meal, type: 'snack' as const })),
        ],
        totalCalories: 0,
        totalProtein: 0,
        totalCarbs: 0,
        totalFat: 0,
      })),
      targetCalories: parseInt(mealPlan.calories_range?.split('-')[0] || '2000'),
    }
    
    return generateProfessionalPDF(convertedPlan, 'Votre nutritionniste')
  }
}

export function generateMealPlanPDF(mealPlan: MealPlanPDFData): jsPDF {
  const generator = new MealPlanPDFGenerator()
  return generator.generate(mealPlan)
}

export function downloadMealPlanPDF(mealPlan: MealPlanPDFData, filename?: string): void {
  try {
    const doc = generateMealPlanPDF(mealPlan)
    const defaultFilename = `plan-repas-${mealPlan.clientName.replace(/\s+/g, '-').toLowerCase()}-${new Date().toISOString().split('T')[0]}.pdf`
    doc.save(filename || defaultFilename)
  } catch (error) {
    console.error('Error downloading meal plan PDF:', error)
    throw new Error('Failed to download meal plan PDF')
  }
}