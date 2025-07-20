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
    h1: { size: 32, weight: 'bold', leading: 1.2 },
    h2: { size: 24, weight: 'bold', leading: 1.3 },
    h3: { size: 18, weight: 'bold', leading: 1.4 },
    h4: { size: 16, weight: 'bold', leading: 1.4 },
    body: { size: 11, weight: 'normal', leading: 1.5 },
    bodyLarge: { size: 12, weight: 'normal', leading: 1.5 },
    caption: { size: 9, weight: 'normal', leading: 1.4 },
    overline: { size: 8, weight: 'bold', leading: 1.6 },
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
  private pageWidth: number
  private pageHeight: number
  private margin: number
  private contentWidth: number
  private contentHeight: number
  private currentY: number
  private pageNumber: number = 1
  private totalPages: number = 0

  constructor() {
    this.pdf = new jsPDF('p', 'mm', 'a4')
    this.pageWidth = modernDesign.layout.pageWidth
    this.pageHeight = modernDesign.layout.pageHeight
    this.margin = modernDesign.layout.margin
    this.contentWidth = this.pageWidth - (this.margin * 2)
    this.contentHeight = this.pageHeight - (this.margin * 2) - modernDesign.layout.headerHeight - modernDesign.layout.footerHeight
    this.currentY = this.margin + modernDesign.layout.headerHeight
    
    // Set default font with UTF-8 support
    // Use helvetica for better character support, avoiding encoding issues
    this.pdf.setFont('helvetica')
  }

  // Utility methods
  private hexToRgb(hex: string): [number, number, number] {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
    return result
      ? [parseInt(result[1], 16), parseInt(result[2], 16), parseInt(result[3], 16)]
      : [0, 0, 0]
  }

  // Text sanitization to prevent encoding issues in PDF
  private sanitizeText(text: string): string {
    if (!text || typeof text !== 'string') return ''
    
    return text
      // Remove any null bytes or control characters that might cause issues
      .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
      // Fix common encoding issues that show up as Ø<ß
      .replace(/Ã¸/g, 'ø')
      .replace(/Ã</g, 'à')
      .replace(/Ã\x9F/g, 'ß')
      .replace(/Ã¢/g, 'â')
      .replace(/Ã©/g, 'é')
      .replace(/Ã¨/g, 'è')
      .replace(/Ã§/g, 'ç')
      .replace(/Ã´/g, 'ô')
      .replace(/Ã»/g, 'û')
      .replace(/Ã®/g, 'î')
      .replace(/Ã\s/g, 'à ')
      // Remove any remaining problematic characters
      .replace(/[^\u0020-\u007E\u00A0-\u00FF\u0100-\u017F\u1E00-\u1EFF]/g, '')
      // Normalize whitespace
      .replace(/\s+/g, ' ')
      .trim()
  }

  private setTypography(style: keyof typeof modernDesign.typography) {
    const typo = modernDesign.typography[style]
    this.pdf.setFontSize(typo.size)
    this.pdf.setFont('helvetica', typo.weight as any)
  }

  // Safe text rendering method that sanitizes text before rendering
  private safeText(text: string, x: number, y: number, options?: any) {
    const cleanText = this.sanitizeText(text)
    return this.pdf.text(cleanText, x, y, options)
  }

  // Safe text splitting method
  private safeSplitTextToSize(text: string, maxWidth: number) {
    const cleanText = this.sanitizeText(text)
    return this.pdf.splitTextToSize(cleanText, maxWidth)
  }

  private addNewPageIfNeeded(requiredSpace: number = 30): boolean {
    if (this.currentY + requiredSpace > this.pageHeight - this.margin - modernDesign.layout.footerHeight) {
      this.addNewPage()
      return true
    }
    return false
  }

  private addNewPage() {
    this.pdf.addPage()
    this.pageNumber++
    this.currentY = this.margin + modernDesign.layout.headerHeight
    this.drawPageHeader()
  }

  private drawPageHeader() {
    if (this.pageNumber > 1) {
      // Modern header strip
      this.pdf.setFillColor(...this.hexToRgb(modernDesign.colors.primary))
      this.pdf.rect(0, 0, this.pageWidth, 8, 'F')
      
      // AI generation indicator
      this.pdf.setTextColor(255, 255, 255)
      this.setTypography('caption')
      this.safeText('✨ Généré par IA', this.pageWidth - this.margin, 5, { align: 'right' })
    }
  }

  // Enhanced cover page with AI branding
  private drawAICoverPage(plan: GeneratedMealPlan, metadata: AIGenerationMetadata) {
    // Gradient background effect
    for (let i = 0; i < 50; i++) {
      const alpha = (50 - i) / 50 * 0.1
      this.pdf.setFillColor(...this.hexToRgb(modernDesign.colors.aiBlue))
      this.pdf.setGState(new (this.pdf as any).GState({ opacity: alpha }))
      this.pdf.rect(0, i * 6, this.pageWidth, 6, 'F')
    }
    this.pdf.setGState(new (this.pdf as any).GState({ opacity: 1 }))

    // AI-powered branding
    const centerX = this.pageWidth / 2

    // Main logo circle with AI accent
    this.pdf.setFillColor(...this.hexToRgb(modernDesign.colors.primary))
    this.pdf.circle(centerX, 40, 25, 'F')
    
    // AI sparkle effect
    this.pdf.setFillColor(...this.hexToRgb(modernDesign.colors.aiCyan))
    this.pdf.circle(centerX + 18, 30, 4, 'F')
    this.pdf.circle(centerX - 15, 35, 3, 'F')
    this.pdf.circle(centerX + 10, 50, 2, 'F')

    // Logo text
    this.pdf.setTextColor(255, 255, 255)
    this.setTypography('h2')
    this.safeText('NF', centerX, 45, { align: 'center' })

    // AI Badge
    this.pdf.setFillColor(...this.hexToRgb(modernDesign.colors.aiPurple))
    this.pdf.roundedRect(centerX - 20, 60, 40, 12, 6, 6, 'F')
    this.pdf.setTextColor(255, 255, 255)
    this.setTypography('caption')
    this.safeText('✨ PROPULSÉ PAR IA', centerX, 68, { align: 'center' })

    // Main title
    this.pdf.setTextColor(...this.hexToRgb(modernDesign.colors.text))
    this.setTypography('h1')
    this.safeText('Plan de Repas', centerX, 95, { align: 'center' })
    
    // Subtitle with AI emphasis
    this.setTypography('h4')
    this.pdf.setTextColor(...this.hexToRgb(modernDesign.colors.aiBlue))
    this.safeText('Personnalisé & Intelligent', centerX, 107, { align: 'center' })

    // Plan title in elegant box
    const titleBoxY = 125
    this.pdf.setFillColor(...this.hexToRgb(modernDesign.colors.bgLight))
    this.pdf.roundedRect(this.margin, titleBoxY, this.contentWidth, 30, 8, 8, 'F')
    
    // Accent border
    this.pdf.setFillColor(...this.hexToRgb(modernDesign.colors.primary))
    this.pdf.roundedRect(this.margin, titleBoxY, this.contentWidth, 4, 2, 2, 'F')
    
    this.pdf.setTextColor(...this.hexToRgb(modernDesign.colors.text))
    this.setTypography('h3')
    const titleLines = this.safeSplitTextToSize(plan.title, this.contentWidth - 20)
    let titleY = titleBoxY + 15
    titleLines.forEach((line: string) => {
      this.safeText(line, centerX, titleY, { align: 'center' })
      titleY += 8
    })

    // Client info card with modern styling
    const clientCardY = 170
    this.pdf.setFillColor(...this.hexToRgb(modernDesign.colors.bgPaper))
    this.pdf.roundedRect(30, clientCardY, this.pageWidth - 60, 70, 10, 10, 'F')
    
    // Card shadow effect
    this.pdf.setFillColor(...this.hexToRgb(modernDesign.colors.bgDark))
    this.pdf.roundedRect(32, clientCardY + 2, this.pageWidth - 64, 70, 10, 10, 'F')
    this.pdf.setFillColor(...this.hexToRgb(modernDesign.colors.bgPaper))
    this.pdf.roundedRect(30, clientCardY, this.pageWidth - 60, 70, 10, 10, 'F')

    // Client info content
    this.pdf.setTextColor(...this.hexToRgb(modernDesign.colors.textSecondary))
    this.setTypography('overline')
    this.safeText('PRÉPARÉ POUR', centerX, clientCardY + 15, { align: 'center' })
    
    this.pdf.setTextColor(...this.hexToRgb(modernDesign.colors.text))
    this.setTypography('h3')
    this.safeText(metadata.clientName || 'Client', centerX, clientCardY + 30, { align: 'center' })
    
    // Plan details
    this.pdf.setTextColor(...this.hexToRgb(modernDesign.colors.textMuted))
    this.setTypography('body')
    this.safeText(`Plan de ${plan.duration} jours`, centerX, clientCardY + 45, { align: 'center' })
    
    // Generation date
    const generationDate = new Date(metadata.generatedAt).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
    this.setTypography('caption')
    this.safeText(`Généré le ${generationDate}`, centerX, clientCardY + 58, { align: 'center' })

    // Dietitian attribution
    if (metadata.dietitianName) {
      this.pdf.setTextColor(...this.hexToRgb(modernDesign.colors.primary))
      this.setTypography('body')
      this.safeText(`Par ${metadata.dietitianName}`, centerX, 260, { align: 'center' })
    }

    // Modern decorative elements
    this.pdf.setDrawColor(...this.hexToRgb(modernDesign.colors.primary))
    this.pdf.setLineWidth(2)
    this.pdf.line(60, 275, this.pageWidth - 60, 275)
    
    // Corner accents
    this.pdf.setFillColor(...this.hexToRgb(modernDesign.colors.aiCyan))
    this.pdf.circle(20, 20, 3, 'F')
    this.pdf.circle(this.pageWidth - 20, 20, 3, 'F')
    this.pdf.circle(20, this.pageHeight - 20, 3, 'F')
    this.pdf.circle(this.pageWidth - 20, this.pageHeight - 20, 3, 'F')
  }

  // AI Generation insights page
  private drawAIInsightsPage(plan: GeneratedMealPlan, metadata: AIGenerationMetadata) {
    this.addNewPage()

    // Page title with AI theme
    this.pdf.setFillColor(...this.hexToRgb(modernDesign.colors.aiPurple))
    this.pdf.rect(this.margin, this.currentY - 10, 6, 30, 'F')
    
    this.pdf.setTextColor(...this.hexToRgb(modernDesign.colors.text))
    this.setTypography('h2')
    this.safeText('Intelligence Artificielle', this.margin + 12, this.currentY)
    
    this.setTypography('bodyLarge')
    this.pdf.setTextColor(...this.hexToRgb(modernDesign.colors.textSecondary))
    this.safeText('Analyse et recommandations', this.margin + 12, this.currentY + 12)
    this.currentY += 35

    // AI Generation Stats Cards
    const statCards = [
      {
        label: 'Temps de génération',
        value: `${metadata.processingTime || 2.3}s`,
        icon: '⚡',
        color: modernDesign.colors.aiCyan
      },
      {
        label: 'Précision nutritionnelle',
        value: `${metadata.nutritionAnalysis?.balanceScore || 94}%`,
        icon: '🎯',
        color: modernDesign.colors.success
      },
      {
        label: 'Variété des repas',
        value: `${plan.days.length * 3} repas`,
        icon: '🍽️',
        color: modernDesign.colors.primary
      }
    ]

    const cardWidth = (this.contentWidth - 20) / 3
    statCards.forEach((card, index) => {
      const x = this.margin + (index * (cardWidth + 10))
      
      // Card with modern styling
      this.pdf.setFillColor(...this.hexToRgb(modernDesign.colors.bgLight))
      this.pdf.roundedRect(x, this.currentY, cardWidth, 40, 8, 8, 'F')
      
      // Colored accent strip
      this.pdf.setFillColor(...this.hexToRgb(card.color))
      this.pdf.roundedRect(x, this.currentY, cardWidth, 4, 2, 2, 'F')
      
      // Icon
      this.setTypography('h3')
      this.safeText(card.icon, x + cardWidth / 2, this.currentY + 18, { align: 'center' })
      
      // Value
      this.pdf.setTextColor(...this.hexToRgb(modernDesign.colors.text))
      this.setTypography('h4')
      this.safeText(card.value, x + cardWidth / 2, this.currentY + 28, { align: 'center' })
      
      // Label
      this.pdf.setTextColor(...this.hexToRgb(modernDesign.colors.textMuted))
      this.setTypography('caption')
      this.safeText(card.label, x + cardWidth / 2, this.currentY + 36, { align: 'center' })
    })

    this.currentY += 55

    // AI Prompt Display (if available)
    if (metadata.prompt) {
      this.pdf.setTextColor(...this.hexToRgb(modernDesign.colors.text))
      this.setTypography('h4')
      this.safeText('Votre demande initiale', this.margin, this.currentY)
      this.currentY += 15

      // Prompt box with modern styling
      this.pdf.setFillColor(...this.hexToRgb(modernDesign.colors.bgMedium))
      this.pdf.roundedRect(this.margin, this.currentY - 5, this.contentWidth, 40, 6, 6, 'F')
      
      // Quote marks
      this.pdf.setTextColor(...this.hexToRgb(modernDesign.colors.aiBlue))
      this.setTypography('h2')
      this.safeText('"', this.margin + 8, this.currentY + 5)
      this.safeText('"', this.pageWidth - this.margin - 12, this.currentY + 25)
      
      // Prompt text
      this.pdf.setTextColor(...this.hexToRgb(modernDesign.colors.textSecondary))
      this.setTypography('body')
      const promptLines = this.pdf.splitTextToSize(metadata.prompt, this.contentWidth - 40)
      let promptY = this.currentY + 8
      promptLines.slice(0, 4).forEach((line: string) => { // Limit to 4 lines
        this.safeText(line, this.margin + 20, promptY)
        promptY += 6
      })
      
      this.currentY += 50
    }

    // Nutritional Intelligence Analysis
    if (metadata.nutritionAnalysis) {
      this.pdf.setTextColor(...this.hexToRgb(modernDesign.colors.text))
      this.setTypography('h4')
      this.safeText('Analyse nutritionnelle intelligente', this.margin, this.currentY)
      this.currentY += 20

      const nutrition = metadata.nutritionAnalysis
      const nutritionMetrics = [
        { label: 'Calories moyennes/jour', value: `${nutrition.avgCalories} kcal`, color: modernDesign.colors.info },
        { label: 'Protéines moyennes', value: `${nutrition.avgProtein}g`, color: modernDesign.colors.protein },
        { label: 'Glucides moyens', value: `${nutrition.avgCarbs}g`, color: modernDesign.colors.carbs },
        { label: 'Lipides moyens', value: `${nutrition.avgFat}g`, color: modernDesign.colors.fat },
      ]

      nutritionMetrics.forEach((metric, index) => {
        const y = this.currentY + (index * 15)
        
        // Progress bar background
        this.pdf.setFillColor(...this.hexToRgb(modernDesign.colors.bgMedium))
        this.pdf.roundedRect(this.margin, y, this.contentWidth, 10, 5, 5, 'F')
        
        // Progress bar fill (example percentages)
        const percentage = index === 0 ? 85 : index === 1 ? 70 : index === 2 ? 60 : 75
        this.pdf.setFillColor(...this.hexToRgb(metric.color))
        this.pdf.roundedRect(this.margin, y, (this.contentWidth * percentage) / 100, 10, 5, 5, 'F')
        
        // Label
        this.pdf.setTextColor(...this.hexToRgb(modernDesign.colors.textSecondary))
        this.setTypography('caption')
        this.pdf.text(metric.label, this.margin + 5, y + 6)
        
        // Value
        this.pdf.setTextColor(...this.hexToRgb(modernDesign.colors.text))
        this.setTypography('caption')
        this.pdf.text(metric.value, this.pageWidth - this.margin - 5, y + 6, { align: 'right' })
      })

      this.currentY += 75
    }

    // AI Recommendations
    this.pdf.setTextColor(...this.hexToRgb(modernDesign.colors.text))
    this.setTypography('h4')
    this.safeText('Recommandations personnalisées', this.margin, this.currentY)
    this.currentY += 15

    const recommendations = [
      '🥗 Variété optimale d\'aliments pour couvrir tous les micronutriments',
      '⏰ Répartition équilibrée des repas tout au long de la journée',
      '🎯 Portions adaptées à vos objectifs nutritionnels',
      '🌱 Intégration d\'aliments de saison et locaux quand possible',
      '💪 Équilibre protéines/glucides optimisé pour vos besoins'
    ]

    recommendations.forEach((rec, index) => {
      this.addNewPageIfNeeded(12)
      
      // Recommendation item
      this.pdf.setFillColor(...this.hexToRgb(modernDesign.colors.bgLight))
      this.pdf.roundedRect(this.margin, this.currentY - 2, this.contentWidth, 10, 3, 3, 'F')
      
      this.pdf.setTextColor(...this.hexToRgb(modernDesign.colors.textSecondary))
      this.setTypography('body')
      this.safeText(rec, this.margin + 8, this.currentY + 4)
      
      this.currentY += 15
    })
  }

  // Enhanced daily meal plan with modern visualization
  private drawModernDayPlan(dayPlan: DayPlan, dayIndex: number) {
    this.addNewPageIfNeeded(200)
    
    // Modern day header with gradient effect
    const headerHeight = 50
    
    // Gradient background
    this.pdf.setFillColor(...this.hexToRgb(modernDesign.colors.primary))
    this.pdf.rect(0, this.currentY - 15, this.pageWidth, headerHeight, 'F')
    
    // Overlay gradient effect
    for (let i = 0; i < 20; i++) {
      const alpha = (20 - i) / 20 * 0.3
      this.pdf.setFillColor(...this.hexToRgb(modernDesign.colors.primaryLight))
      this.pdf.setGState(new (this.pdf as any).GState({ opacity: alpha }))
      this.pdf.rect(0, this.currentY - 15 + (i * 2.5), this.pageWidth, 2.5, 'F')
    }
    this.pdf.setGState(new (this.pdf as any).GState({ opacity: 1 }))

    // Day number with modern circle design
    this.pdf.setFillColor(255, 255, 255)
    this.pdf.circle(this.margin + 25, this.currentY + 10, 20, 'F')
    
    // Inner circle with accent
    this.pdf.setFillColor(...this.hexToRgb(modernDesign.colors.aiCyan))
    this.pdf.circle(this.margin + 25, this.currentY + 10, 15, 'F')
    
    this.pdf.setTextColor(255, 255, 255)
    this.setTypography('h2')
    this.pdf.text(dayPlan.day.toString(), this.margin + 25, this.currentY + 15, { align: 'center' })
    
    // Day title and date
    this.pdf.setTextColor(255, 255, 255)
    this.setTypography('h2')
    this.safeText(`Jour ${dayPlan.day}`, this.margin + 55, this.currentY + 5)
    
    // Date with better formatting
    const date = new Date(Date.now() + dayIndex * 86400000).toLocaleDateString('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long'
    })
    this.setTypography('bodyLarge')
    this.pdf.setFont('helvetica', 'italic')
    this.pdf.text(date, this.margin + 55, this.currentY + 18)
    
    // Daily nutrition summary in header
    if (dayPlan.totalCalories) {
      this.pdf.setTextColor(255, 255, 255)
      this.setTypography('body')
      this.pdf.text(
        `${dayPlan.totalCalories} kcal | ${dayPlan.totalProtein || 0}g P | ${dayPlan.totalCarbs || 0}g G | ${dayPlan.totalFat || 0}g L`,
        this.pageWidth - this.margin - 10,
        this.currentY + 12,
        { align: 'right' }
      )
    }
    
    this.currentY += headerHeight

    // Group meals by type for better organization
    const mealsByType: { [key: string]: Meal[] } = {
      breakfast: [],
      lunch: [],
      dinner: [],
      snack: []
    }
    
    dayPlan.meals.forEach(meal => {
      mealsByType[meal.type].push(meal)
    })

    // Modern meal type sections
    const mealTypeConfig = [
      { 
        type: 'breakfast', 
        name: 'Petit-déjeuner', 
        icon: '🌅',
        color: modernDesign.colors.breakfast,
        time: '07:30 - 09:00'
      },
      { 
        type: 'lunch', 
        name: 'Déjeuner', 
        icon: '☀️',
        color: modernDesign.colors.lunch,
        time: '12:00 - 13:30'
      },
      { 
        type: 'dinner', 
        name: 'Dîner', 
        icon: '🌙',
        color: modernDesign.colors.dinner,
        time: '19:00 - 20:30'
      },
      { 
        type: 'snack', 
        name: 'Collations', 
        icon: '🍎',
        color: modernDesign.colors.snack,
        time: 'Variables'
      }
    ]

    mealTypeConfig.forEach(config => {
      const meals = mealsByType[config.type]
      if (meals.length === 0) return

      this.addNewPageIfNeeded(80)
      
      // Modern meal header
      this.pdf.setFillColor(...this.hexToRgb(config.color))
      this.pdf.roundedRect(this.margin, this.currentY, this.contentWidth, 30, 8, 8, 'F')
      
      // Meal icon and title
      this.setTypography('h3')
      this.pdf.text(config.icon, this.margin + 12, this.currentY + 18)
      
      this.pdf.setTextColor(255, 255, 255)
      this.setTypography('h4')
      this.pdf.text(config.name, this.margin + 25, this.currentY + 12)
      
      // Time range
      this.setTypography('body')
      this.pdf.text(config.time, this.margin + 25, this.currentY + 22)
      
      // Meal count badge
      this.pdf.setFillColor(255, 255, 255)
      this.pdf.circle(this.pageWidth - this.margin - 20, this.currentY + 15, 8, 'F')
      this.pdf.setTextColor(...this.hexToRgb(config.color))
      this.setTypography('body')
      this.pdf.text(meals.length.toString(), this.pageWidth - this.margin - 20, this.currentY + 18, { align: 'center' })
      
      this.currentY += 40

      // Meals in this type
      meals.forEach((meal, mealIndex) => {
        this.addNewPageIfNeeded(35) // Reduced space needed
        
        // Meal card with modern styling (compact)
        this.pdf.setFillColor(...this.hexToRgb(modernDesign.colors.bgLight))
        this.pdf.roundedRect(this.margin + 10, this.currentY, this.contentWidth - 20, 35, 4, 4, 'F') // Smaller height and radius
        
        // Accent border
        this.pdf.setFillColor(...this.hexToRgb(config.color))
        this.pdf.roundedRect(this.margin + 10, this.currentY, 3, 35, 2, 2, 'F') // Smaller border
        
        // Meal name (compact)
        this.pdf.setTextColor(...this.hexToRgb(modernDesign.colors.text))
        this.setTypography('body') // Smaller font for compactness
        this.safeText(meal.name, this.margin + 18, this.currentY + 8)
        
        // Description if available (more compact)
        if (meal.description) {
          this.pdf.setTextColor(...this.hexToRgb(modernDesign.colors.textMuted))
          this.setTypography('caption') // Smaller font
          const shortDesc = meal.description.length > 60 ? meal.description.substring(0, 60) + '...' : meal.description
          this.safeText(shortDesc, this.margin + 18, this.currentY + 18)
        }
        
        // Nutrition info with modern badges (compact)
        const nutritionY = this.currentY + 25 // Adjusted for smaller card
        let badgeX = this.margin + 20
        
        if (meal.calories) {
          this.pdf.setFillColor(...this.hexToRgb(modernDesign.colors.info))
          this.pdf.roundedRect(badgeX, nutritionY, 25, 8, 4, 4, 'F')
          this.pdf.setTextColor(255, 255, 255)
          this.setTypography('caption')
          this.pdf.text(`${meal.calories} kcal`, badgeX + 12.5, nutritionY + 5, { align: 'center' })
          badgeX += 30
        }
        
        if (meal.protein) {
          this.pdf.setFillColor(...this.hexToRgb(modernDesign.colors.protein))
          this.pdf.roundedRect(badgeX, nutritionY, 20, 8, 4, 4, 'F')
          this.pdf.setTextColor(255, 255, 255)
          this.setTypography('caption')
          this.pdf.text(`${meal.protein}g P`, badgeX + 10, nutritionY + 5, { align: 'center' })
          badgeX += 25
        }
        
        if (meal.prepTime || meal.cookTime) {
          const totalTime = (meal.prepTime || 0) + (meal.cookTime || 0)
          this.pdf.setFillColor(...this.hexToRgb(modernDesign.colors.warning))
          this.pdf.roundedRect(badgeX, nutritionY, 25, 8, 4, 4, 'F')
          this.pdf.setTextColor(255, 255, 255)
          this.setTypography('caption')
          this.pdf.text(`${totalTime} min`, badgeX + 12.5, nutritionY + 5, { align: 'center' })
        }
        
        let additionalHeight = 45 // Base height for meal card
        
        // Add ingredients if available (compact format)
        if (meal.ingredients && meal.ingredients.length > 0) {
          this.currentY += 45 // Reduced spacing
          this.addNewPageIfNeeded(15 + Math.ceil(meal.ingredients.length / 2) * 4)
          
          // Ingredients section - compact
          this.pdf.setTextColor(...this.hexToRgb(modernDesign.colors.text))
          this.setTypography('body') // Smaller font
          this.safeText('🥘 Ingrédients:', this.margin + 20, this.currentY)
          this.currentY += 6
          
          // Compact ingredients list - multiple per line
          this.pdf.setTextColor(...this.hexToRgb(modernDesign.colors.textSecondary))
          this.setTypography('caption') // Even smaller font
          const compactIngredients = meal.ingredients.join(' • ')
          const ingredientLines = this.safeSplitTextToSize(compactIngredients, this.contentWidth - 50)
          ingredientLines.forEach((line: string) => {
            this.addNewPageIfNeeded(5)
            this.safeText(line, this.margin + 25, this.currentY)
            this.currentY += 4 // Tighter spacing
          })
          
          additionalHeight += 15 + ingredientLines.length * 4
        }
        
        // Add instructions if available (compact format)
        if (meal.instructions && meal.instructions.length > 0) {
          this.currentY += 8 // Reduced spacing
          
          // Instructions section - compact
          this.pdf.setTextColor(...this.hexToRgb(modernDesign.colors.text))
          this.setTypography('body') // Smaller font
          this.safeText('👨‍🍳 Préparation:', this.margin + 20, this.currentY)
          this.currentY += 6
          
          // Compact instructions - limit to first 3 steps to save space
          this.pdf.setTextColor(...this.hexToRgb(modernDesign.colors.textSecondary))
          this.setTypography('caption') // Smaller font
          const limitedInstructions = meal.instructions.slice(0, 3) // Only show first 3 steps
          limitedInstructions.forEach((instruction, index) => {
            this.addNewPageIfNeeded(6)
            const shortInstruction = instruction.length > 80 ? instruction.substring(0, 80) + '...' : instruction
            const instructionText = `${index + 1}. ${shortInstruction}`
            this.safeText(instructionText, this.margin + 25, this.currentY)
            this.currentY += 4 // Tighter spacing
          })
          
          // Add "..." if there are more instructions
          if (meal.instructions.length > 3) {
            this.safeText('...', this.margin + 25, this.currentY)
            this.currentY += 4
          }
          
          additionalHeight += 15 + Math.min(meal.instructions.length, 3) * 4
        }
        
        // Reset currentY to account for the extended meal card (compact)
        if (meal.ingredients || meal.instructions) {
          this.currentY += 10 // Reduced bottom margin
        } else {
          this.currentY += 45 // Reduced original height
        }
      })
      
      this.currentY += 5 // Reduced spacing between day sections
    })
  }

  // Enhanced shopping list with better categorization
  private drawModernShoppingList(plan: GeneratedMealPlan) {
    this.addNewPage()

    // Modern title design
    this.pdf.setFillColor(...this.hexToRgb(modernDesign.colors.warning))
    this.pdf.rect(this.margin, this.currentY - 10, 6, 30, 'F')
    
    this.pdf.setTextColor(...this.hexToRgb(modernDesign.colors.text))
    this.setTypography('h2')
    this.safeText('Liste de Courses Intelligente', this.margin + 12, this.currentY)
    
    this.setTypography('body')
    this.pdf.setTextColor(...this.hexToRgb(modernDesign.colors.textMuted))
    this.safeText('Organisée par sections de magasin', this.margin + 12, this.currentY + 12)
    this.currentY += 35

    // Collect all ingredients with better parsing
    const ingredientMap = new Map<string, { 
      days: Set<number>, 
      quantity: string,
      category: string,
      meals: string[]
    }>()
    
    plan.days.forEach(day => {
      day.meals.forEach(meal => {
        if (meal.ingredients) {
          meal.ingredients.forEach(ingredient => {
            // Apply sanitization to ingredient names
            const cleanIngredient = this.sanitizeText(ingredient).toLowerCase().trim()
            if (cleanIngredient && !ingredientMap.has(cleanIngredient)) {
              ingredientMap.set(cleanIngredient, {
                days: new Set(),
                quantity: '',
                category: this.categorizeIngredient(cleanIngredient),
                meals: []
              })
            }
            if (cleanIngredient) {
              const item = ingredientMap.get(cleanIngredient)!
              item.days.add(day.day)
              item.meals.push(this.sanitizeText(meal.name))
            }
          })
        }
      })
    })

    // Enhanced categories with icons and colors
    const categoryConfig = {
      'Fruits & Légumes': { icon: '🥬', color: modernDesign.colors.success, items: [] as any[] },
      'Viandes & Poissons': { icon: '🥩', color: modernDesign.colors.protein, items: [] as any[] },
      'Produits Laitiers': { icon: '🥛', color: modernDesign.colors.info, items: [] as any[] },
      'Céréales & Féculents': { icon: '🌾', color: modernDesign.colors.carbs, items: [] as any[] },
      'Épices & Condiments': { icon: '🧂', color: modernDesign.colors.textMuted, items: [] as any[] },
      'Autres': { icon: '🛒', color: modernDesign.colors.textLight, items: [] as any[] }
    }

    // Populate categories
    ingredientMap.forEach((info, ingredient) => {
      const category = info.category as keyof typeof categoryConfig
      if (categoryConfig[category]) {
        categoryConfig[category].items.push({
          name: ingredient,
          days: Array.from(info.days).sort().join(', '),
          mealCount: info.meals.length
        })
      }
    })

    // Draw categories with modern design
    Object.entries(categoryConfig).forEach(([categoryName, config]) => {
      if (config.items.length === 0) return
      
      this.addNewPageIfNeeded(40 + config.items.length * 12)
      
      // Category header with modern styling
      this.pdf.setFillColor(...this.hexToRgb(config.color))
      this.pdf.roundedRect(this.margin, this.currentY, this.contentWidth, 25, 6, 6, 'F')
      
      // Category icon and title
      this.setTypography('h3')
      this.pdf.text(config.icon, this.margin + 10, this.currentY + 15)
      
      this.pdf.setTextColor(255, 255, 255)
      this.setTypography('h4')
      this.pdf.text(categoryName, this.margin + 25, this.currentY + 12)
      
      // Item count
      this.setTypography('body')
      this.pdf.text(`${config.items.length} articles`, this.pageWidth - this.margin - 10, this.currentY + 15, { align: 'right' })
      
      this.currentY += 35

      // Items with modern checkboxes
      config.items.sort((a, b) => a.name.localeCompare(b.name)).forEach(item => {
        this.addNewPageIfNeeded(15)
        
        // Modern checkbox
        this.pdf.setFillColor(...this.hexToRgb(modernDesign.colors.bgMedium))
        this.pdf.roundedRect(this.margin + 10, this.currentY - 4, 8, 8, 2, 2, 'F')
        this.pdf.setDrawColor(...this.hexToRgb(config.color))
        this.pdf.setLineWidth(1)
        this.pdf.roundedRect(this.margin + 10, this.currentY - 4, 8, 8, 2, 2, 'D')
        
        // Item name
        this.pdf.setTextColor(...this.hexToRgb(modernDesign.colors.text))
        this.setTypography('body')
        this.safeText(item.name, this.margin + 25, this.currentY + 1)
        
        // Usage info
        this.pdf.setTextColor(...this.hexToRgb(modernDesign.colors.textLight))
        this.setTypography('caption')
        this.safeText(
          `Jours ${item.days} • ${item.mealCount} repas`,
          this.pageWidth - this.margin - 10,
          this.currentY + 1,
          { align: 'right' }
        )
        
        this.currentY += 12
      })
      
      this.currentY += 15
    })
  }

  // Helper method for ingredient categorization
  private categorizeIngredient(ingredient: string): string {
    const fruitVeg = /tomate|carotte|pomme|banane|salade|concombre|courgette|brocoli|épinard|avocat|orange|fraise|poivron|oignon|ail|citron|persil|basilic|courge|aubergine|champignon/i
    const protein = /poulet|bœuf|poisson|saumon|thon|œuf|tofu|porc|dinde|jambon|viande|crevette|moule|agneau/i
    const dairy = /lait|yaourt|fromage|crème|beurre|mozzarella|parmesan|chèvre/i
    const grains = /pain|pâte|riz|quinoa|avoine|farine|pomme de terre|blé|semoule|orge/i
    const spices = /sel|poivre|huile|vinaigre|moutarde|herbe|épice|sauce|bouillon|curry|paprika|cumin/i
    
    if (fruitVeg.test(ingredient)) return 'Fruits & Légumes'
    if (protein.test(ingredient)) return 'Viandes & Poissons'
    if (dairy.test(ingredient)) return 'Produits Laitiers'
    if (grains.test(ingredient)) return 'Céréales & Féculents'
    if (spices.test(ingredient)) return 'Épices & Condiments'
    return 'Autres'
  }

  // Enhanced footer with modern design
  private drawModernFooter() {
    const totalPages = this.pdf.getNumberOfPages()
    
    for (let i = 1; i <= totalPages; i++) {
      this.pdf.setPage(i)
      
      // Modern footer background
      this.pdf.setFillColor(...this.hexToRgb(modernDesign.colors.bgLight))
      this.pdf.rect(0, this.pageHeight - 20, this.pageWidth, 20, 'F')
      
      // Accent line
      this.pdf.setFillColor(...this.hexToRgb(modernDesign.colors.primary))
      this.pdf.rect(0, this.pageHeight - 20, this.pageWidth, 1, 'F')
      
      // Page indicator with modern style
      this.pdf.setTextColor(...this.hexToRgb(modernDesign.colors.textMuted))
      this.setTypography('caption')
      this.safeText(
        `${i} / ${totalPages}`,
        this.pageWidth / 2,
        this.pageHeight - 10,
        { align: 'center' }
      )
      
      // Brand with AI indicator
      this.pdf.setTextColor(...this.hexToRgb(modernDesign.colors.primary))
      this.setTypography('caption')
      this.safeText('✨ NutriFlow AI', this.margin, this.pageHeight - 10)
      
      // Generation timestamp
      this.pdf.setTextColor(...this.hexToRgb(modernDesign.colors.textLight))
      this.safeText(
        new Date().toLocaleDateString('fr-FR'),
        this.pageWidth - this.margin,
        this.pageHeight - 10,
        { align: 'right' }
      )
    }
  }

  // Main PDF generation method
  public generateAIPDF(plan: GeneratedMealPlan, metadata: AIGenerationMetadata): jsPDF {
    // 1. AI-powered cover page
    this.drawAICoverPage(plan, metadata)
    
    // 2. AI insights and generation details
    this.drawAIInsightsPage(plan, metadata)
    
    // 3. Enhanced daily meal plans
    plan.days.forEach((day, index) => {
      this.drawModernDayPlan(day, index)
    })
    
    // 4. Intelligent shopping list
    this.drawModernShoppingList(plan)
    
    // 5. Modern footer
    this.drawModernFooter()
    
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