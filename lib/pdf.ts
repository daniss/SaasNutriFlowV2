/**
 * Enhanced PDF generation utilities for invoices and reports
 */

import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import type { Invoice } from './supabase';

export interface InvoiceData extends Invoice {
  clients: { name: string; email: string } | null
  dietitian: {
    name: string
    email: string
    phone?: string
    address?: string
    siret?: string
  }
}

export class PDFGenerator {
  private static formatCurrency(amount: number): string {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount)
  }

  private static formatDate(date: string): string {
    return new Date(date).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })
  }

  /**
   * Generate PDF invoice from invoice data with enhanced styling
   */
  static async generateInvoicePDF(invoiceData: InvoiceData): Promise<jsPDF> {
    try {
      const doc = new jsPDF()
      const pageWidth = doc.internal.pageSize.width
      const pageHeight = doc.internal.pageSize.height
      let yPosition = 20

      // Header with branding
      doc.setFontSize(24)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(16, 185, 129) // emerald-500
      doc.text('NutriFlow', 20, yPosition)
      
      // Invoice title
      doc.setFontSize(20)
      doc.setTextColor(0, 0, 0)
      doc.text('FACTURE', pageWidth - 20, yPosition, { align: 'right' })
      yPosition += 20

      // Invoice details header
      doc.setFontSize(12)
      doc.setFont('helvetica', 'normal')
      doc.text(`Facture N°: ${invoiceData.invoice_number}`, pageWidth - 20, yPosition, { align: 'right' })
      yPosition += 8
      doc.text(`Date: ${invoiceData.created_at ? this.formatDate(invoiceData.created_at) : 'Non définie'}`, pageWidth - 20, yPosition, { align: 'right' })
      yPosition += 8
      doc.text(`Échéance: ${invoiceData.due_date ? this.formatDate(invoiceData.due_date) : 'Non définie'}`, pageWidth - 20, yPosition, { align: 'right' })
      yPosition += 20

      // Dietitian info
      doc.setFont('helvetica', 'bold')
      doc.text('De:', 20, yPosition)
      yPosition += 8
      doc.setFont('helvetica', 'normal')
      doc.text(invoiceData.dietitian.name, 20, yPosition)
      yPosition += 6
      doc.text(invoiceData.dietitian.email, 20, yPosition)
      if (invoiceData.dietitian.phone) {
        yPosition += 6
        doc.text(invoiceData.dietitian.phone, 20, yPosition)
      }
      if (invoiceData.dietitian.address) {
        yPosition += 6
        doc.text(invoiceData.dietitian.address, 20, yPosition)
      }
      if (invoiceData.dietitian.siret) {
        yPosition += 6
        doc.text(`SIRET: ${invoiceData.dietitian.siret}`, 20, yPosition)
      }

      // Client info
      yPosition = 80 // Reset position for client info
      doc.setFont('helvetica', 'bold')
      doc.text('À:', pageWidth - 80, yPosition)
      yPosition += 8
      doc.setFont('helvetica', 'normal')
      if (invoiceData.clients) {
        doc.text(invoiceData.clients.name, pageWidth - 80, yPosition)
        yPosition += 6
        doc.text(invoiceData.clients.email, pageWidth - 80, yPosition)
      }

      yPosition = 130 // Reset for invoice items

      // Items table header
      doc.setFillColor(245, 245, 245)
      doc.rect(20, yPosition - 5, pageWidth - 40, 15, 'F')
      doc.setFont('helvetica', 'bold')
      doc.text('Description', 25, yPosition + 5)
      doc.text('Quantité', pageWidth - 100, yPosition + 5)
      doc.text('Prix unitaire', pageWidth - 70, yPosition + 5)
      doc.text('Total', pageWidth - 25, yPosition + 5, { align: 'right' })
      yPosition += 20

      // Invoice items
      doc.setFont('helvetica', 'normal')
      
      // Use service description from invoice
      const serviceDescription = invoiceData.service_description || 'Consultation nutritionnelle'
      doc.text(serviceDescription, 25, yPosition)
      doc.text('1', pageWidth - 95, yPosition)
      doc.text(this.formatCurrency(invoiceData.amount), pageWidth - 70, yPosition)
      doc.text(this.formatCurrency(invoiceData.amount), pageWidth - 25, yPosition, { align: 'right' })
      yPosition += 10

      yPosition += 10

      // Total section
      doc.setFont('helvetica', 'bold')
      doc.text('Total HT:', pageWidth - 70, yPosition)
      doc.text(this.formatCurrency(invoiceData.amount), pageWidth - 25, yPosition, { align: 'right' })
      yPosition += 8
      doc.text('TVA (20%):', pageWidth - 70, yPosition)
      const tva = invoiceData.amount * 0.2
      doc.text(this.formatCurrency(tva), pageWidth - 25, yPosition, { align: 'right' })
      yPosition += 8
      
      doc.setFontSize(14)
      doc.text('Total TTC:', pageWidth - 70, yPosition)
      doc.text(this.formatCurrency(invoiceData.amount + tva), pageWidth - 25, yPosition, { align: 'right' })

      // Payment terms
      yPosition += 20
      doc.setFontSize(10)
      doc.setFont('helvetica', 'normal')
      doc.text('Conditions de paiement: Paiement à réception', 20, yPosition)
      yPosition += 6
      doc.text('En cas de retard de paiement, des pénalités de 3 fois le taux légal seront appliquées.', 20, yPosition)

      // Footer
      yPosition = pageHeight - 20
      doc.setFontSize(8)
      doc.setTextColor(128, 128, 128)
      doc.text('Facture générée par NutriFlow - Plateforme de gestion nutritionnelle', pageWidth / 2, yPosition, { align: 'center' })

      return doc
    } catch (error) {
      console.error('Error generating PDF:', error)
      throw new Error('Failed to generate PDF invoice')
    }
  }

  /**
   * Generate PDF from HTML element
   */
  static async generateFromHTML(element: HTMLElement, filename: string): Promise<jsPDF> {
    try {
      const canvas = await html2canvas(element, {
        scale: 2,
        logging: false,
        useCORS: true
      })
      
      const imgData = canvas.toDataURL('image/png')
      const doc = new jsPDF()
      const imgWidth = 210
      const pageHeight = 295
      const imgHeight = (canvas.height * imgWidth) / canvas.width
      let heightLeft = imgHeight

      let position = 0

      doc.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
      heightLeft -= pageHeight

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight
        doc.addPage()
        doc.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
        heightLeft -= pageHeight
      }

      return doc
    } catch (error) {
      console.error('Error generating PDF from HTML:', error)
      throw new Error('Failed to generate PDF from HTML')
    }
  }

  /**
   * Download PDF file
   */
  static downloadPDF(doc: jsPDF, filename: string): void {
    try {
      doc.save(filename)
    } catch (error) {
      console.error('Error downloading PDF:', error)
      throw new Error('Failed to download PDF')
    }
  }
}

export default PDFGenerator
