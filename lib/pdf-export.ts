import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

interface MealPlan {
  id: string;
  title: string;
  client_name?: string;
  description?: string;
  duration_weeks: number;
  target_calories: number;
  content: any;
  created_at: string;
  dietitian_id: string;
}

interface Client {
  id: string;
  first_name: string;
  last_name: string;
  email?: string;
  phone?: string;
  date_of_birth?: string;
  goals?: string;
  weight_goal?: number;
  activity_level?: string;
  dietary_restrictions?: string[];
}

export class PDFExportService {
  private pdf: jsPDF;
  private pageHeight: number;
  private currentY: number;
  private margin: number = 20;
  private lineHeight: number = 6;

  constructor() {
    this.pdf = new jsPDF();
    this.pageHeight = this.pdf.internal.pageSize.height;
    this.currentY = this.margin;
  }

  /**
   * Export a meal plan to PDF
   */
  async exportMealPlan(mealPlan: MealPlan, client?: Client): Promise<void> {
    this.reset();
    
    // Header
    this.addHeader();
    
    // Title
    this.addTitle(mealPlan.title);
    
    // Client Information
    if (client) {
      this.addClientInfo(client);
    }
    
    // Plan Overview
    this.addPlanOverview(mealPlan);
    
    // Meal Plan Content
    this.addMealPlanContent(mealPlan.content);
    
    // Footer
    this.addFooter();
    
    // Save the PDF
    this.pdf.save(`plan-alimentaire-${mealPlan.title.replace(/\s+/g, '-').toLowerCase()}.pdf`);
  }

  /**
   * Export client progress report to PDF
   */
  async exportClientReport(client: Client, progressData: any[]): Promise<void> {
    this.reset();
    
    // Header
    this.addHeader();
    
    // Title
    this.addTitle(`Rapport de Progression - ${client.first_name} ${client.last_name}`);
    
    // Client Information
    this.addClientInfo(client);
    
    // Progress Summary
    this.addProgressSummary(progressData);
    
    // Weight Chart (if canvas element exists)
    await this.addWeightChart();
    
    // Footer
    this.addFooter();
    
    // Save the PDF
    this.pdf.save(`rapport-${client.first_name}-${client.last_name}.pdf`);
  }

  /**
   * Export invoice to PDF
   */
  async exportInvoice(invoice: any, client: Client, dietitian: any): Promise<void> {
    this.reset();
    
    // Header with business info
    this.addBusinessHeader(dietitian);
    
    // Invoice title and details
    this.addInvoiceHeader(invoice);
    
    // Client billing info
    this.addBillingInfo(client);
    
    // Invoice items
    this.addInvoiceItems(invoice.items || []);
    
    // Totals
    this.addInvoiceTotals(invoice);
    
    // Payment terms
    this.addPaymentTerms();
    
    // Footer
    this.addFooter();
    
    // Save the PDF
    this.pdf.save(`facture-${invoice.invoice_number}.pdf`);
  }

  private reset(): void {
    this.pdf = new jsPDF();
    this.currentY = this.margin;
  }

  private addHeader(): void {
    this.pdf.setFontSize(24);
    this.pdf.setTextColor(34, 197, 94); // Green color
    this.pdf.text('NutriFlow', this.margin, this.currentY);
    
    this.pdf.setFontSize(12);
    this.pdf.setTextColor(100, 100, 100);
    this.pdf.text('Plateforme Professionnelle de Nutrition', this.margin, this.currentY + 8);
    
    this.currentY += 25;
    this.addSeparator();
  }

  private addBusinessHeader(dietitian: any): void {
    this.pdf.setFontSize(20);
    this.pdf.setTextColor(34, 197, 94);
    this.pdf.text(dietitian.business_name || 'Cabinet de Nutrition', this.margin, this.currentY);
    
    this.currentY += 10;
    this.pdf.setFontSize(10);
    this.pdf.setTextColor(60, 60, 60);
    
    if (dietitian.address) {
      this.pdf.text(dietitian.address, this.margin, this.currentY);
      this.currentY += 5;
    }
    
    if (dietitian.phone) {
      this.pdf.text(`Tél: ${dietitian.phone}`, this.margin, this.currentY);
      this.currentY += 5;
    }
    
    if (dietitian.email) {
      this.pdf.text(`Email: ${dietitian.email}`, this.margin, this.currentY);
      this.currentY += 5;
    }
    
    this.currentY += 10;
    this.addSeparator();
  }

  private addTitle(title: string): void {
    this.pdf.setFontSize(18);
    this.pdf.setTextColor(0, 0, 0);
    this.pdf.text(title, this.margin, this.currentY);
    this.currentY += 15;
  }

  private addClientInfo(client: Client): void {
    this.pdf.setFontSize(14);
    this.pdf.setTextColor(0, 0, 0);
    this.pdf.text('Informations Client', this.margin, this.currentY);
    this.currentY += 10;
    
    this.pdf.setFontSize(10);
    this.pdf.setTextColor(60, 60, 60);
    
    const clientInfo = [
      `Nom: ${client.first_name} ${client.last_name}`,
      client.email ? `Email: ${client.email}` : null,
      client.phone ? `Téléphone: ${client.phone}` : null,
      client.date_of_birth ? `Date de naissance: ${new Date(client.date_of_birth).toLocaleDateString('fr-FR')}` : null,
      client.goals ? `Objectifs: ${client.goals}` : null,
      client.weight_goal ? `Poids objectif: ${client.weight_goal} kg` : null,
      client.activity_level ? `Niveau d'activité: ${client.activity_level}` : null,
      client.dietary_restrictions?.length ? `Restrictions: ${client.dietary_restrictions.join(', ')}` : null
    ].filter(Boolean);
    
    clientInfo.forEach(info => {
      if (info) {
        this.checkPageBreak();
        this.pdf.text(info, this.margin, this.currentY);
        this.currentY += this.lineHeight;
      }
    });
    
    this.currentY += 10;
    this.addSeparator();
  }

  private addPlanOverview(mealPlan: MealPlan): void {
    this.pdf.setFontSize(14);
    this.pdf.setTextColor(0, 0, 0);
    this.pdf.text('Aperçu du Plan', this.margin, this.currentY);
    this.currentY += 10;
    
    this.pdf.setFontSize(10);
    this.pdf.setTextColor(60, 60, 60);
    
    const overview = [
      `Durée: ${mealPlan.duration_weeks} semaine(s)`,
      `Objectif calorique: ${mealPlan.target_calories} kcal/jour`,
      mealPlan.description ? `Description: ${mealPlan.description}` : null,
      `Date de création: ${new Date(mealPlan.created_at).toLocaleDateString('fr-FR')}`
    ].filter(Boolean);
    
    overview.forEach(info => {
      if (info) {
        this.checkPageBreak();
        this.pdf.text(info, this.margin, this.currentY);
        this.currentY += this.lineHeight;
      }
    });
    
    this.currentY += 10;
    this.addSeparator();
  }

  private addMealPlanContent(content: any): void {
    if (!content || !content.days) return;
    
    this.pdf.setFontSize(14);
    this.pdf.setTextColor(0, 0, 0);
    this.pdf.text('Plan Alimentaire Détaillé', this.margin, this.currentY);
    this.currentY += 15;
    
    content.days.forEach((day: any, index: number) => {
      this.checkPageBreak(50); // Ensure enough space for a day
      
      // Day header
      this.pdf.setFontSize(12);
      this.pdf.setTextColor(34, 197, 94);
      this.pdf.text(`Jour ${index + 1}`, this.margin, this.currentY);
      this.currentY += 10;
      
      // Meals
      const meals = ['breakfast', 'lunch', 'dinner', 'snacks'];
      const mealNames = {
        breakfast: 'Petit-déjeuner',
        lunch: 'Déjeuner',
        dinner: 'Dîner',
        snacks: 'Collations'
      };
      
      meals.forEach(mealType => {
        if (day[mealType] && day[mealType].length > 0) {
          this.pdf.setFontSize(10);
          this.pdf.setTextColor(0, 0, 0);
          this.pdf.text(`${mealNames[mealType as keyof typeof mealNames]}:`, this.margin + 5, this.currentY);
          this.currentY += 6;
          
          day[mealType].forEach((item: any) => {
            this.checkPageBreak();
            this.pdf.setTextColor(60, 60, 60);
            this.pdf.text(`• ${item.name || item.food}${item.quantity ? ` (${item.quantity})` : ''}`, this.margin + 10, this.currentY);
            this.currentY += 5;
          });
          
          this.currentY += 3;
        }
      });
      
      this.currentY += 5;
    });
  }

  private addProgressSummary(progressData: any[]): void {
    if (!progressData || progressData.length === 0) return;
    
    this.pdf.setFontSize(14);
    this.pdf.setTextColor(0, 0, 0);
    this.pdf.text('Résumé des Progrès', this.margin, this.currentY);
    this.currentY += 15;
    
    const firstEntry = progressData[0];
    const lastEntry = progressData[progressData.length - 1];
    const weightChange = lastEntry.weight - firstEntry.weight;
    
    this.pdf.setFontSize(10);
    this.pdf.setTextColor(60, 60, 60);
    
    const summary = [
      `Période: ${new Date(firstEntry.recorded_at).toLocaleDateString('fr-FR')} - ${new Date(lastEntry.recorded_at).toLocaleDateString('fr-FR')}`,
      `Poids initial: ${firstEntry.weight} kg`,
      `Poids actuel: ${lastEntry.weight} kg`,
      `Évolution: ${weightChange > 0 ? '+' : ''}${weightChange.toFixed(1)} kg`,
      `Nombre de mesures: ${progressData.length}`
    ];
    
    summary.forEach(info => {
      this.checkPageBreak();
      this.pdf.text(info, this.margin, this.currentY);
      this.currentY += this.lineHeight;
    });
    
    this.currentY += 10;
    this.addSeparator();
  }

  private async addWeightChart(): Promise<void> {
    const chartElement = document.getElementById('weight-chart');
    if (!chartElement) return;
    
    try {
      const canvas = await html2canvas(chartElement);
      const imgData = canvas.toDataURL('image/png');
      
      this.checkPageBreak(100);
      
      this.pdf.setFontSize(14);
      this.pdf.setTextColor(0, 0, 0);
      this.pdf.text('Graphique d\'Évolution du Poids', this.margin, this.currentY);
      this.currentY += 15;
      
      const imgWidth = 170;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      this.pdf.addImage(imgData, 'PNG', this.margin, this.currentY, imgWidth, imgHeight);
      this.currentY += imgHeight + 10;
    } catch (error) {
      console.error('Error adding chart to PDF:', error);
    }
  }

  private addInvoiceHeader(invoice: any): void {
    // Invoice title
    this.pdf.setFontSize(20);
    this.pdf.setTextColor(0, 0, 0);
    this.pdf.text('FACTURE', this.pdf.internal.pageSize.width - 60, this.currentY);
    
    this.currentY += 15;
    
    // Invoice details
    this.pdf.setFontSize(10);
    this.pdf.setTextColor(60, 60, 60);
    
    const invoiceDetails = [
      `Numéro: ${invoice.invoice_number}`,
      `Date: ${new Date(invoice.invoice_date).toLocaleDateString('fr-FR')}`,
      `Échéance: ${new Date(invoice.due_date).toLocaleDateString('fr-FR')}`,
      `Statut: ${invoice.status}`
    ];
    
    invoiceDetails.forEach(detail => {
      this.pdf.text(detail, this.pdf.internal.pageSize.width - 80, this.currentY);
      this.currentY += 5;
    });
    
    this.currentY += 10;
    this.addSeparator();
  }

  private addBillingInfo(client: Client): void {
    this.pdf.setFontSize(12);
    this.pdf.setTextColor(0, 0, 0);
    this.pdf.text('Facturer à:', this.margin, this.currentY);
    this.currentY += 8;
    
    this.pdf.setFontSize(10);
    this.pdf.setTextColor(60, 60, 60);
    
    const billingInfo = [
      `${client.first_name} ${client.last_name}`,
      client.email || '',
      client.phone || ''
    ].filter(Boolean);
    
    billingInfo.forEach(info => {
      this.pdf.text(info, this.margin, this.currentY);
      this.currentY += 5;
    });
    
    this.currentY += 15;
  }

  private addInvoiceItems(items: any[]): void {
    // Table header
    this.pdf.setFontSize(10);
    this.pdf.setTextColor(0, 0, 0);
    this.pdf.text('Description', this.margin, this.currentY);
    this.pdf.text('Quantité', this.margin + 80, this.currentY);
    this.pdf.text('Prix unitaire', this.margin + 120, this.currentY);
    this.pdf.text('Total', this.margin + 160, this.currentY);
    
    this.currentY += 8;
    this.addSeparator();
    
    // Items
    this.pdf.setTextColor(60, 60, 60);
    items.forEach(item => {
      this.checkPageBreak();
      this.pdf.text(item.description, this.margin, this.currentY);
      this.pdf.text(item.quantity.toString(), this.margin + 80, this.currentY);
      this.pdf.text(`${item.unit_price}€`, this.margin + 120, this.currentY);
      this.pdf.text(`${(item.quantity * item.unit_price).toFixed(2)}€`, this.margin + 160, this.currentY);
      this.currentY += 6;
    });
    
    this.currentY += 10;
  }

  private addInvoiceTotals(invoice: any): void {
    this.addSeparator();
    
    this.pdf.setFontSize(10);
    this.pdf.setTextColor(0, 0, 0);
    
    const subtotal = invoice.amount || 0;
    const tax = subtotal * 0.2; // 20% TVA
    const total = subtotal + tax;
    
    this.pdf.text('Sous-total:', this.margin + 120, this.currentY);
    this.pdf.text(`${subtotal.toFixed(2)}€`, this.margin + 160, this.currentY);
    this.currentY += 6;
    
    this.pdf.text('TVA (20%):', this.margin + 120, this.currentY);
    this.pdf.text(`${tax.toFixed(2)}€`, this.margin + 160, this.currentY);
    this.currentY += 6;
    
    this.pdf.setFontSize(12);
    this.pdf.setTextColor(0, 0, 0);
    this.pdf.text('Total:', this.margin + 120, this.currentY);
    this.pdf.text(`${total.toFixed(2)}€`, this.margin + 160, this.currentY);
    
    this.currentY += 15;
  }

  private addPaymentTerms(): void {
    this.pdf.setFontSize(10);
    this.pdf.setTextColor(60, 60, 60);
    
    const terms = [
      'Conditions de paiement:',
      '• Paiement sous 30 jours',
      '• Pénalités de retard applicables selon l\'art. L441-6 du Code de commerce',
      '• En cas de retard de paiement, une indemnité forfaitaire de 40€ sera due'
    ];
    
    terms.forEach(term => {
      this.checkPageBreak();
      this.pdf.text(term, this.margin, this.currentY);
      this.currentY += 5;
    });
    
    this.currentY += 10;
  }

  private addSeparator(): void {
    this.pdf.setDrawColor(200, 200, 200);
    this.pdf.line(this.margin, this.currentY, this.pdf.internal.pageSize.width - this.margin, this.currentY);
    this.currentY += 10;
  }

  private addFooter(): void {
    const pageCount = this.pdf.getNumberOfPages();
    
    for (let i = 1; i <= pageCount; i++) {
      this.pdf.setPage(i);
      this.pdf.setFontSize(8);
      this.pdf.setTextColor(150, 150, 150);
      
      const footerY = this.pageHeight - 10;
      this.pdf.text('Généré par NutriFlow - Plateforme Professionnelle de Nutrition', this.margin, footerY);
      this.pdf.text(`Page ${i} sur ${pageCount}`, this.pdf.internal.pageSize.width - 40, footerY);
    }
  }

  private checkPageBreak(minSpace: number = 20): void {
    if (this.currentY + minSpace > this.pageHeight - 30) {
      this.pdf.addPage();
      this.currentY = this.margin;
    }
  }
}

// Export singleton instance
export const pdfExportService = new PDFExportService();
