/**
 * PDF generation utilities for invoices and reports
 */

import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'
import type { Invoice, Client } from './supabase'

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
   * Generate PDF invoice from invoice data
   */
  static async generateInvoicePDF(invoiceData: InvoiceData): Promise<jsPDF> {
    const doc = new jsPDF()
    const pageWidth = doc.internal.pageSize.width
    const pageHeight = doc.internal.pageSize.height
    let yPosition = 20

    // Header
    doc.setFontSize(20)
    doc.setFont('helvetica', 'bold')
    doc.text('FACTURE', pageWidth / 2, yPosition, { align: 'center' })
    yPosition += 15

    // Invoice info
    doc.setFontSize(12)
    doc.setFont('helvetica', 'normal')
    doc.text(`Facture N° ${invoiceData.invoice_number}`, 20, yPosition)
    doc.text(`Date: ${this.formatDate(invoiceData.issue_date)}`, pageWidth - 20, yPosition, { align: 'right' })
    
    if (invoiceData.due_date) {
      yPosition += 7
      doc.text(`Échéance: ${this.formatDate(invoiceData.due_date)}`, pageWidth - 20, yPosition, { align: 'right' })
    }

    yPosition += 20

    // Dietitian info (left side)
    doc.setFont('helvetica', 'bold')
    doc.text('Émetteur:', 20, yPosition)
    yPosition += 7
    doc.setFont('helvetica', 'normal')
    doc.text(invoiceData.dietitian.name, 20, yPosition)
    
    if (invoiceData.dietitian.address) {
      yPosition += 5
      doc.text(invoiceData.dietitian.address, 20, yPosition)
    }
    
    if (invoiceData.dietitian.phone) {
      yPosition += 5
      doc.text(`Tél: ${invoiceData.dietitian.phone}`, 20, yPosition)
    }
    
    yPosition += 5
    doc.text(`Email: ${invoiceData.dietitian.email}`, 20, yPosition)
    
    if (invoiceData.dietitian.siret) {
      yPosition += 5
      doc.text(`SIRET: ${invoiceData.dietitian.siret}`, 20, yPosition)
    }

    // Client info (right side)
    const clientStartY = yPosition - (invoiceData.dietitian.address ? 27 : 22)
    doc.setFont('helvetica', 'bold')
    doc.text('Destinataire:', pageWidth - 20, clientStartY, { align: 'right' })
    
    let clientY = clientStartY + 7
    doc.setFont('helvetica', 'normal')
    
    if (invoiceData.clients) {
      doc.text(invoiceData.clients.name, pageWidth - 20, clientY, { align: 'right' })
      
      clientY += 5
      doc.text(`Email: ${invoiceData.clients.email}`, pageWidth - 20, clientY, { align: 'right' })
    }

    yPosition += 30

    // Services table
    doc.setFont('helvetica', 'bold')
    doc.text('Description', 20, yPosition)
    doc.text('Quantité', 100, yPosition)
    doc.text('Prix unitaire', 130, yPosition)
    doc.text('Total', pageWidth - 20, yPosition, { align: 'right' })
    
    yPosition += 3
    doc.line(20, yPosition, pageWidth - 20, yPosition)
    yPosition += 10

    // Service items
    doc.setFont('helvetica', 'normal')
    
    // For now, use the service_description and amount from the invoice
    doc.text(invoiceData.service_description || 'Service', 20, yPosition)
    doc.text('1', 100, yPosition)
    doc.text(this.formatCurrency(invoiceData.amount), 130, yPosition)
    doc.text(this.formatCurrency(invoiceData.amount), pageWidth - 20, yPosition, { align: 'right' })
    yPosition += 7

    yPosition += 10
    doc.line(20, yPosition, pageWidth - 20, yPosition)
    yPosition += 10

    // Totals
    doc.setFont('helvetica', 'bold')
    doc.text('Total:', pageWidth - 60, yPosition, { align: 'right' })
    doc.text(this.formatCurrency(invoiceData.amount), pageWidth - 20, yPosition, { align: 'right' })

    // Payment info
    yPosition += 20
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    
    doc.text(`Statut: ${invoiceData.status === 'paid' ? 'Payée' : invoiceData.status === 'sent' ? 'Envoyée' : 'Brouillon'}`, 20, yPosition)
    
    if (invoiceData.payment_date) {
      yPosition += 5
      doc.text(`Date de paiement: ${this.formatDate(invoiceData.payment_date)}`, 20, yPosition)
    }

    // Footer
    if (yPosition < pageHeight - 30) {
      doc.setFontSize(8)
      doc.text('Facture générée automatiquement par NutriFlow', pageWidth / 2, pageHeight - 20, { align: 'center' })
    }

    return doc
  }

  /**
   * Generate and download PDF invoice
   */
  static async downloadInvoicePDF(invoiceData: InvoiceData): Promise<void> {
    const doc = await this.generateInvoicePDF(invoiceData)
    const filename = `facture_${invoiceData.invoice_number}_${invoiceData.clients?.name?.replace(/\s+/g, '_') || 'client'}.pdf`
    doc.save(filename)
  }

  /**
   * Generate PDF blob for email attachment
   */
  static async generateInvoicePDFBlob(invoiceData: InvoiceData): Promise<Blob> {
    const doc = await this.generateInvoicePDF(invoiceData)
    return new Blob([doc.output('blob')], { type: 'application/pdf' })
  }

  /**
   * Generate PDF from HTML element (for complex layouts)
   */
  static async generatePDFFromHTML(element: HTMLElement, filename: string): Promise<void> {
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
    })

    const imgData = canvas.toDataURL('image/png')
    const pdf = new jsPDF()
    const imgWidth = 210
    const pageHeight = 295
    const imgHeight = (canvas.height * imgWidth) / canvas.width
    let heightLeft = imgHeight

    let position = 0

    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
    heightLeft -= pageHeight

    while (heightLeft >= 0) {
      position = heightLeft - imgHeight
      pdf.addPage()
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
      heightLeft -= pageHeight
    }

    pdf.save(filename)
  }
}

export default PDFGenerator
