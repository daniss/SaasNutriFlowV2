import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { GeneratedMealPlan, Meal, DayPlan } from '@/lib/gemini'

// Ultra-modern design system for AI-generated meal plans
const modernDesign = {
  // Primary brand colors
  colors: {
    primary: '#10b981',      // emerald-500 - main brand
    primaryLight: '#34d399', // emerald-400 - highlights
    primaryDark: '#059669',  // emerald-600 - depth
    
    // AI/Tech accent colors
    aiBlue: '#3b82f6',       // blue-500 - AI theme
    aiPurple: '#8b5cf6',     // violet-500 - AI accent
    aiCyan: '#06b6d4',       // cyan-500 - tech feel
    
    // Nutrition colors
    protein: '#ef4444',      // red-500 - protein
    carbs: '#f59e0b',        // amber-500 - carbs
    fat: '#8b5cf6',          // violet-500 - fat
    fiber: '#22c55e',        // green-500 - fiber
    
    // Meal type colors
    breakfast: '#fbbf24',    // yellow-400
    lunch: '#34d399',        // emerald-400
    dinner: '#a78bfa',       // purple-400
    snack: '#60a5fa',        // blue-400
    
    // Grayscale
    text: '#111827',         // gray-900
    textSecondary: '#374151', // gray-700
    textMuted: '#6b7280',    // gray-500
    textLight: '#9ca3af',    // gray-400
    
    // Backgrounds
    bgPaper: '#ffffff',      // white
    bgLight: '#f9fafb',      // gray-50
    bgMedium: '#f3f4f6',     // gray-100
    bgDark: '#e5e7eb',       // gray-200
    
    // Status colors
    success: '#22c55e',      // green-500
    warning: '#f59e0b',      // amber-500
    danger: '#ef4444',       // red-500
    info: '#3b82f6',         // blue-500
  },
  
  // Typography scale
  typography: {
    h1: { size: 28, weight: 'bold', leading: 1.2 },
    h2: { size: 20, weight: 'bold', leading: 1.3 },
    h3: { size: 16, weight: 'bold', leading: 1.4 },
    h4: { size: 14, weight: 'bold', leading: 1.4 },
    body: { size: 10, weight: 'normal', leading: 1.5 },
    bodyLarge: { size: 11, weight: 'normal', leading: 1.5 },
    caption: { size: 8, weight: 'normal', leading: 1.4 },
    overline: { size: 7, weight: 'bold', leading: 1.6 },
  },
  
  // Spacing system
  spacing: {
    xs: 2,
    sm: 4,
    md: 8,
    lg: 12,
    xl: 16,
    xxl: 24,
    xxxl: 32,
  },
  
  // Layout constants
  layout: {
    pageWidth: 210,
    pageHeight: 297,
    margin: 15,
    headerHeight: 40,
    footerHeight: 20,
    cornerRadius: 5,
    shadowOffset: 1,
  }
}

interface AIGenerationMetadata {
  prompt?: string
  generatedAt: string
  aiModel?: string
  dietitianName?: string
  clientName?: string
  processingTime?: number
  nutritionAnalysis?: {
    avgCalories: number
    avgProtein: number
    avgCarbs: number
    avgFat: number
    balanceScore: number
  }
}

export class UltraModernPDFGenerator {
  private pdf: jsPDF
  private currentY: number = 20
  private pageWidth: number
  private pageHeight: number
  private margin: number
  private contentWidth: number

  constructor() {
    this.pdf = new jsPDF('portrait', 'mm', 'a4')
    this.pageWidth = modernDesign.layout.pageWidth
    this.pageHeight = modernDesign.layout.pageHeight
    this.margin = modernDesign.layout.margin
    this.contentWidth = this.pageWidth - (this.margin * 2)
  }

  // Utility methods
  private hexToRgb(hex: string): [number, number, number] {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
    return result 
      ? [parseInt(result[1], 16), parseInt(result[2], 16), parseInt(result[3], 16)]
      : [0, 0, 0]
  }

  private setTypography(type: keyof typeof modernDesign.typography) {
    const typography = modernDesign.typography[type]
    this.pdf.setFontSize(typography.size)
    this.pdf.setFont('helvetica', typography.weight === 'bold' ? 'bold' : 'normal')
  }

  private sanitizeText(text: string): string {
    return text
      .replace(/[^\u0000-\u007F]/g, (char) => {
        const replacements: { [key: string]: string } = {
          'à': 'a', 'á': 'a', 'â': 'a', 'ã': 'a', 'ä': 'a', 'å': 'a',
          'è': 'e', 'é': 'e', 'ê': 'e', 'ë': 'e',
          'ì': 'i', 'í': 'i', 'î': 'i', 'ï': 'i',
          'ò': 'o', 'ó': 'o', 'ô': 'o', 'õ': 'o', 'ö': 'o',
          'ù': 'u', 'ú': 'u', 'û': 'u', 'ü': 'u',
          'ý': 'y', 'ÿ': 'y',
          'ç': 'c', 'ñ': 'n',
          'À': 'A', 'Á': 'A', 'Â': 'A', 'Ã': 'A', 'Ä': 'A', 'Å': 'A',
          'È': 'E', 'É': 'E', 'Ê': 'E', 'Ë': 'E',
          'Ì': 'I', 'Í': 'I', 'Î': 'I', 'Ï': 'I',
          'Ò': 'O', 'Ó': 'O', 'Ô': 'O', 'Õ': 'O', 'Ö': 'O',
          'Ù': 'U', 'Ú': 'U', 'Û': 'U', 'Ü': 'U',
          'Ý': 'Y', 'Ÿ': 'Y',
          'Ç': 'C', 'Ñ': 'N',
          '–': '-', '—': '-', '…': '...',
          '€': 'EUR', '£': 'GBP', '¥': 'JPY',
          '°': 'deg', '±': '+/-', '×': 'x', '÷': '/',
          '™': 'TM', '®': '(R)', '©': '(C)',
          '🥗': '', '⏰': '', '🎯': '', '🌱': '', '💪': '',
          '🥘': '', '👨‍🍳': '', '🍽️': '', '🍲': '', '🥞': ''
        }
        return replacements[char] || char
      })
      .replace(/[\u0080-\uFFFF]/g, '')
  }

  private safeText(text: string, x: number, y: number, options?: any) {
    const sanitized = this.sanitizeText(text)
    this.pdf.text(sanitized, x, y, options)
  }

  private safeSplitTextToSize(text: string, maxWidth: number): string[] {
    const sanitized = this.sanitizeText(text)
    return this.pdf.splitTextToSize(sanitized, maxWidth)
  }

  private addNewPageIfNeeded(requiredSpace: number) {
    if (this.currentY + requiredSpace > this.pageHeight - this.margin - 20) {
      this.addNewPage()
    }
  }

  private addNewPage() {
    this.pdf.addPage()
    this.currentY = 20
  }

  // ULTRA-COMPACT cover page - minimal content only
  private drawCompactCoverPage(plan: GeneratedMealPlan, metadata: AIGenerationMetadata) {
    // Simple title
    this.pdf.setTextColor(...this.hexToRgb(modernDesign.colors.primary))
    this.setTypography('h1')
    this.safeText('Plan Alimentaire IA', this.pageWidth / 2, 50, { align: 'center' })
    
    // Client name
    this.pdf.setTextColor(...this.hexToRgb(modernDesign.colors.text))
    this.setTypography('h3')
    this.safeText(metadata.clientName || 'Client', this.pageWidth / 2, 70, { align: 'center' })
    
    // Duration and date
    this.pdf.setTextColor(...this.hexToRgb(modernDesign.colors.textSecondary))
    this.setTypography('body')
    this.safeText(`${plan.days.length} jours`, this.pageWidth / 2, 85, { align: 'center' })
    this.safeText(`Genere le ${new Date().toLocaleDateString('fr-FR')}`, this.pageWidth / 2, 95, { align: 'center' })
    
    // Skip to next section immediately
    this.currentY = 110
  }

  // ULTRA-COMPACT: ALL days on as few pages as possible (2-3 days per page)
  private drawUltraCompactDailyPlans(plan: GeneratedMealPlan) {
    let daysPerPage = 4 // Try to fit 4 days per page for maximum compactness
    let currentPageDays = 0
    
    plan.days.forEach((day, dayIndex) => {
      // Start new page every 4 days, or if current page is the cover page
      if (currentPageDays === 0 && dayIndex > 0) {
        this.addNewPage()
        this.currentY = 20
      }
      
      this.drawUltraCompactDay(day, dayIndex)
      currentPageDays++
      
      if (currentPageDays >= daysPerPage) {
        currentPageDays = 0
      }
    })
  }

  // ULTRA-COMPACT day plan - only essential meal names
  private drawUltraCompactDay(dayPlan: DayPlan, dayIndex: number) {
    this.addNewPageIfNeeded(60) // Minimal space needed
    
    // SIMPLE day header - no fancy graphics
    this.pdf.setTextColor(...this.hexToRgb(modernDesign.colors.primary))
    this.setTypography('h4')
    this.safeText(`Jour ${dayPlan.day}`, this.margin, this.currentY)
    this.currentY += 10
    
    // COMPACT meals in a simple list format - ONLY meal names
    const mealsToShow = ['breakfast', 'lunch', 'dinner'] as const
    
    mealsToShow.forEach(mealType => {
      const meals = (dayPlan.meals as any)?.[mealType] || []
      if (meals.length > 0) {
        // Meal type label
        this.pdf.setTextColor(...this.hexToRgb(modernDesign.colors.textSecondary))
        this.setTypography('caption')
        const mealLabel = mealType === 'breakfast' ? 'Petit-dej' : 
                         mealType === 'lunch' ? 'Dejeuner' : 'Diner'
        this.safeText(mealLabel, this.margin, this.currentY)
        
        // Meal content - ONLY meal names, no ingredients/instructions/recipes
        this.pdf.setTextColor(...this.hexToRgb(modernDesign.colors.text))
        this.setTypography('caption')
        const mealText = meals.slice(0, 1).map((meal: any) => 
          typeof meal === 'string' ? meal : meal.name || 'Repas'
        ).join('')
        
        // Drastically shorten text to save space
        const shortMealText = mealText.length > 40 ? mealText.substring(0, 40) + '...' : mealText
        this.safeText(shortMealText, this.margin + 20, this.currentY)
        
        this.currentY += 8 // Very tight spacing
      }
    })
    
    // Minimal space between days
    this.currentY += 6
  }
  
  // SIMPLE footer
  private drawSimpleFooter() {
    const totalPages = this.pdf.getNumberOfPages()
    
    for (let i = 1; i <= totalPages; i++) {
      this.pdf.setPage(i)
      
      // Simple footer line
      this.pdf.setTextColor(...this.hexToRgb(modernDesign.colors.textLight))
      this.setTypography('caption')
      this.safeText(`Page ${i}/${totalPages}`, this.pageWidth / 2, this.pageHeight - 10, { align: 'center' })
    }
  }

  // ULTRA-COMPACT PDF generation method - all content on minimal pages
  public generateAIPDF(plan: GeneratedMealPlan, metadata: AIGenerationMetadata): jsPDF {
    // 1. Compact cover page with basic info only
    this.drawCompactCoverPage(plan, metadata)
    
    // 2. ALL daily meal plans on single pages (4 days per page)
    this.drawUltraCompactDailyPlans(plan)
    
    // 3. Simple footer
    this.drawSimpleFooter()
    
    return this.pdf
  }
}

// Export functions
export function generateUltraModernAIPDF(
  plan: GeneratedMealPlan, 
  metadata: AIGenerationMetadata
): jsPDF {
  const generator = new UltraModernPDFGenerator()
  return generator.generateAIPDF(plan, metadata)
}

export function downloadUltraModernAIPDF(
  plan: GeneratedMealPlan, 
  metadata: AIGenerationMetadata,
  filename?: string
): void {
  try {
    const doc = generateUltraModernAIPDF(plan, metadata)
    const defaultFilename = `ai-meal-plan-${(metadata.clientName || 'client').replace(/\s+/g, '-').toLowerCase()}-${new Date().toISOString().split('T')[0]}.pdf`
    doc.save(filename || defaultFilename)
  } catch (error) {
    console.error('Error downloading ultra-modern AI meal plan PDF:', error)
    throw new Error('Failed to download AI meal plan PDF')
  }
}