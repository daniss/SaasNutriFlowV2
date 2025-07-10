import jsPDF from "jspdf"

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
  private doc: jsPDF
  private pageWidth: number
  private pageHeight: number
  private margins = { top: 20, right: 20, bottom: 20, left: 20 }
  private currentY = 0

  constructor() {
    this.doc = new jsPDF('p', 'mm', 'a4')
    this.pageWidth = this.doc.internal.pageSize.getWidth()
    this.pageHeight = this.doc.internal.pageSize.getHeight()
  }

  private checkPageBreak(requiredSpace: number = 20): void {
    if (this.currentY + requiredSpace > this.pageHeight - this.margins.bottom) {
      this.doc.addPage()
      this.currentY = this.margins.top
    }
  }

  private addHeader(title: string) {
    // Logo/Brand area
    this.doc.setFontSize(24)
    this.doc.setFont('helvetica', 'bold')
    this.doc.setTextColor(16, 185, 129) // emerald-500
    this.doc.text('NutriFlow', this.margins.left, this.margins.top + 10)
    
    // Title
    this.doc.setFontSize(20)
    this.doc.setFont('helvetica', 'bold')
    this.doc.setTextColor(0, 0, 0)
    this.doc.text(title, this.margins.left, this.margins.top + 25)
    
    // Separator line
    this.doc.setDrawColor(229, 231, 235) // slate-200
    this.doc.setLineWidth(0.5)
    this.doc.line(this.margins.left, this.margins.top + 30, this.pageWidth - this.margins.right, this.margins.top + 30)
    
    this.currentY = this.margins.top + 40
  }

  private addClientInfo(mealPlan: MealPlanPDFData): void {
    this.checkPageBreak(30)
    
    this.doc.setFontSize(16)
    this.doc.setFont('helvetica', 'bold')
    this.doc.setTextColor(0, 0, 0)
    this.doc.text('Informations Client', this.margins.left, this.currentY)
    this.currentY += 10

    this.doc.setFontSize(11)
    this.doc.setFont('helvetica', 'normal')
    this.doc.setTextColor(75, 85, 99) // slate-600
    
    // Client info in two columns
    const col1X = this.margins.left
    const col2X = this.pageWidth / 2
    
    this.doc.text(`Nom: ${mealPlan.clientName}`, col1X, this.currentY)
    this.doc.text(`Email: ${mealPlan.clientEmail}`, col2X, this.currentY)
    this.currentY += 6
    
    this.doc.text(`Durée: ${mealPlan.duration_days} jours`, col1X, this.currentY)
    if (mealPlan.calories_range) {
      this.doc.text(`Calories: ${mealPlan.calories_range}`, col2X, this.currentY)
    }
    this.currentY += 6
    
    this.doc.text(`Statut: ${mealPlan.status}`, col1X, this.currentY)
    this.doc.text(`Créé le: ${new Date(mealPlan.created_at).toLocaleDateString('fr-FR')}`, col2X, this.currentY)
    this.currentY += 15
  }

  private addPlanOverview(mealPlan: MealPlanPDFData): void {
    this.checkPageBreak(25)
    
    this.doc.setFontSize(16)
    this.doc.setFont('helvetica', 'bold')
    this.doc.setTextColor(0, 0, 0)
    this.doc.text('Aperçu du Plan', this.margins.left, this.currentY)
    this.currentY += 10

    if (mealPlan.description) {
      this.doc.setFontSize(11)
      this.doc.setFont('helvetica', 'normal')
      this.doc.setTextColor(75, 85, 99)
      
      // Split description into lines
      const lines = this.doc.splitTextToSize(mealPlan.description, this.pageWidth - this.margins.left - this.margins.right)
      lines.forEach((line: string) => {
        this.checkPageBreak()
        this.doc.text(line, this.margins.left, this.currentY)
        this.currentY += 5
      })
    }
    this.currentY += 10
  }

  private addDayPlan(dayPlan: any, dayNumber: number): void {
    this.checkPageBreak(40)
    
    // Day header
    this.doc.setFontSize(14)
    this.doc.setFont('helvetica', 'bold')
    this.doc.setTextColor(0, 0, 0)
    this.doc.text(`Jour ${dayNumber}`, this.margins.left, this.currentY)
    this.currentY += 10

    // Meals
    const mealTypes = [
      { key: 'breakfast', label: 'Petit-déjeuner' },
      { key: 'lunch', label: 'Déjeuner' },
      { key: 'dinner', label: 'Dîner' },
      { key: 'snacks', label: 'Collations' }
    ]

    mealTypes.forEach(({ key, label }) => {
      const meals = dayPlan.meals[key]
      if (meals && meals.length > 0) {
        this.checkPageBreak(15)
        
        this.doc.setFontSize(12)
        this.doc.setFont('helvetica', 'bold')
        this.doc.setTextColor(16, 185, 129)
        this.doc.text(label, this.margins.left + 5, this.currentY)
        this.currentY += 6

        this.doc.setFontSize(10)
        this.doc.setFont('helvetica', 'normal')
        this.doc.setTextColor(75, 85, 99)
        
        meals.forEach((meal: string) => {
          this.checkPageBreak()
          this.doc.text(`• ${meal}`, this.margins.left + 10, this.currentY)
          this.currentY += 4
        })
        this.currentY += 3
      }
    })

    // Notes if available
    if (dayPlan.notes) {
      this.checkPageBreak(15)
      this.doc.setFontSize(10)
      this.doc.setFont('helvetica', 'italic')
      this.doc.setTextColor(107, 114, 128)
      this.doc.text(`Notes: ${dayPlan.notes}`, this.margins.left + 5, this.currentY)
      this.currentY += 8
    }

    this.currentY += 5
  }

  private addFooter(): void {
    const pageCount = this.doc.getNumberOfPages()
    
    for (let i = 1; i <= pageCount; i++) {
      this.doc.setPage(i)
      
      // Footer line
      this.doc.setDrawColor(229, 231, 235)
      this.doc.setLineWidth(0.3)
      this.doc.line(this.margins.left, this.pageHeight - 25, this.pageWidth - this.margins.right, this.pageHeight - 25)
      
      // Footer text
      this.doc.setFontSize(8)
      this.doc.setFont('helvetica', 'normal')
      this.doc.setTextColor(128, 128, 128)
      this.doc.text('Généré par NutriFlow - Plateforme de gestion nutritionnelle', this.margins.left, this.pageHeight - 15)
      this.doc.text(`Page ${i} / ${pageCount}`, this.pageWidth - this.margins.right, this.pageHeight - 15, { align: 'right' })
    }
  }

  generate(mealPlan: MealPlanPDFData): jsPDF {
    try {
      // Add header
      this.addHeader(mealPlan.name)
      
      // Add client information
      this.addClientInfo(mealPlan)
      
      // Add plan overview
      this.addPlanOverview(mealPlan)
      
      // Add day plans
      mealPlan.dayPlans.forEach((dayPlan, index) => {
        this.addDayPlan(dayPlan, index + 1)
      })
      
      // Add footer to all pages
      this.addFooter()
      
      return this.doc
    } catch (error) {
      console.error('Error generating meal plan PDF:', error)
      throw new Error('Failed to generate meal plan PDF')
    }
  }
}

/**
 * Convenience function to generate meal plan PDF
 */
export function generateMealPlanPDF(mealPlan: MealPlanPDFData): jsPDF {
  const generator = new MealPlanPDFGenerator()
  return generator.generate(mealPlan)
}

/**
 * Download meal plan PDF
 */
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
