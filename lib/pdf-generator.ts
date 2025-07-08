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

  constructor() {
    this.doc = new jsPDF('p', 'mm', 'a4')
    this.pageWidth = this.doc.internal.pageSize.getWidth()
    this.pageHeight = this.doc.internal.pageSize.getHeight()
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
    
    return this.margins.top + 40
  }

  private addClientInfo(mealPlan: MealPlanPDFData, currentY: number): number {
    this.doc.setFontSize(16)
    this.doc.setFont('helvetica', 'bold')
    this.doc.setTextColor(0, 0, 0)
    this.doc.text('Informations Client', this.margins.left, currentY)
    currentY += 10

    this.doc.setFontSize(11)
    this.doc.setFont('helvetica', 'normal')
    this.doc.setTextColor(75, 85, 99) // slate-600
    
    // Client info in two columns
    const col1X = this.margins.left
    const col2X = this.pageWidth / 2
    
    this.doc.text(`Nom: ${mealPlan.clientName}`, col1X, currentY)
    this.doc.text(`Email: ${mealPlan.clientEmail}`, col2X, currentY)
    currentY += 6
    
    this.doc.text(`Durée: ${mealPlan.duration_days} jours`, col1X, currentY)
    if (mealPlan.calories_range) {
      this.doc.text(`Calories: ${mealPlan.calories_range}`, col2X, currentY)
    }
    currentY += 6
    
    this.doc.text(`Statut: ${mealPlan.status}`, col1X, currentY)
    this.doc.text(`Créé le: ${new Date(mealPlan.created_at).toLocaleDateString('fr-FR')}`, col2X, currentY)
    currentY += 15

    return currentY
  }

  private addPlanOverview(mealPlan: MealPlanPDFData, currentY: number): number {
    this.doc.setFontSize(16)
    this.doc.setFont('helvetica', 'bold')
    this.doc.setTextColor(0, 0, 0)
    this.doc.text('Aperçu du Plan', this.margins.left, currentY)
    currentY += 10

    if (mealPlan.description) {
      this.doc.setFontSize(11)
      this.doc.setFont('helvetica', 'normal')
      this.doc.setTextColor(75, 85, 99)
      
      // Split long descriptions
      const splitDescription = this.doc.splitTextToSize(mealPlan.description, this.pageWidth - this.margins.left - this.margins.right)
      this.doc.text(splitDescription, this.margins.left, currentY)
      currentY += splitDescription.length * 5 + 10
    }

    return currentY
  }

  private addDayPlan(dayPlan: MealPlanPDFData['dayPlans'][0], currentY: number): number {
    // Check if we need a new page
    if (currentY > this.pageHeight - 60) {
      this.doc.addPage()
      currentY = this.margins.top
    }

    // Day header
    this.doc.setFontSize(14)
    this.doc.setFont('helvetica', 'bold')
    this.doc.setTextColor(0, 0, 0)
    this.doc.text(`Jour ${dayPlan.day}`, this.margins.left, currentY)
    currentY += 12

    // Meals
    const mealTypes = [
      { key: 'breakfast', name: 'Petit-déjeuner', color: [251, 146, 60] }, // orange
      { key: 'lunch', name: 'Déjeuner', color: [59, 130, 246] }, // blue
      { key: 'dinner', name: 'Dîner', color: [139, 92, 246] }, // purple
      { key: 'snacks', name: 'Collations', color: [16, 185, 129] } // emerald
    ]

    for (const mealType of mealTypes) {
      const meals = dayPlan.meals[mealType.key as keyof typeof dayPlan.meals]
      
      // Meal type header
      this.doc.setFontSize(12)
      this.doc.setFont('helvetica', 'bold')
      this.doc.setTextColor(mealType.color[0], mealType.color[1], mealType.color[2])
      this.doc.text(mealType.name, this.margins.left, currentY)
      currentY += 8

      // Meal items
      this.doc.setFontSize(10)
      this.doc.setFont('helvetica', 'normal')
      this.doc.setTextColor(75, 85, 99)
      
      if (meals.length === 0) {
        this.doc.text('• Aucun repas planifié', this.margins.left + 5, currentY)
        currentY += 5
      } else {
        for (const meal of meals) {
          const splitMeal = this.doc.splitTextToSize(`• ${meal}`, this.pageWidth - this.margins.left - this.margins.right - 5)
          this.doc.text(splitMeal, this.margins.left + 5, currentY)
          currentY += splitMeal.length * 4
        }
      }
      currentY += 3
    }

    // Notes if any
    if (dayPlan.notes) {
      this.doc.setFontSize(10)
      this.doc.setFont('helvetica', 'italic')
      this.doc.setTextColor(192, 132, 252) // purple-300
      this.doc.text('Note:', this.margins.left, currentY)
      currentY += 5
      
      const splitNotes = this.doc.splitTextToSize(dayPlan.notes, this.pageWidth - this.margins.left - this.margins.right)
      this.doc.text(splitNotes, this.margins.left, currentY)
      currentY += splitNotes.length * 4
    }

    currentY += 10

    return currentY
  }

  private addFooter() {
    const footerY = this.pageHeight - this.margins.bottom
    
    this.doc.setFontSize(8)
    this.doc.setFont('helvetica', 'normal')
    this.doc.setTextColor(156, 163, 175) // slate-400
    
    // Date generated
    const today = new Date().toLocaleDateString('fr-FR')
    this.doc.text(`Généré le ${today} par NutriFlow`, this.margins.left, footerY)
    
    // Page number - using a simpler approach
    const pageCount = (this.doc as any).internal.getNumberOfPages()
    this.doc.text(`Page ${pageCount}`, this.pageWidth - this.margins.right - 15, footerY)
  }

  public generate(mealPlan: MealPlanPDFData): string {
    let currentY = this.addHeader(mealPlan.name)
    
    // Client information
    currentY = this.addClientInfo(mealPlan, currentY)
    
    // Plan overview
    currentY = this.addPlanOverview(mealPlan, currentY)
    
    // Daily plans
    this.doc.setFontSize(16)
    this.doc.setFont('helvetica', 'bold')
    this.doc.setTextColor(0, 0, 0)
    this.doc.text('Plans Repas Quotidiens', this.margins.left, currentY)
    currentY += 15

    for (const dayPlan of mealPlan.dayPlans) {
      currentY = this.addDayPlan(dayPlan, currentY)
    }

    // Add footer to all pages
    const totalPages = (this.doc as any).internal.getNumberOfPages()
    for (let i = 1; i <= totalPages; i++) {
      this.doc.setPage(i)
      this.addFooter()
    }

    // Return the PDF as base64 string
    return this.doc.output('datauristring')
  }

  public download(mealPlan: MealPlanPDFData, filename?: string) {
    this.generate(mealPlan)
    const fileName = filename || `plan-alimentaire-${mealPlan.clientName}-${new Date().toISOString().split('T')[0]}.pdf`
    this.doc.save(fileName)
  }

  public getBlob(mealPlan: MealPlanPDFData): Blob {
    this.generate(mealPlan)
    return this.doc.output('blob')
  }
}

export const generateMealPlanPDF = (mealPlan: MealPlanPDFData, filename?: string) => {
  const generator = new MealPlanPDFGenerator()
  generator.download(mealPlan, filename)
}

export const getMealPlanPDFBlob = (mealPlan: MealPlanPDFData): Blob => {
  const generator = new MealPlanPDFGenerator()
  return generator.getBlob(mealPlan)
}
