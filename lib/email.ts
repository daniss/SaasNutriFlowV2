// Email service for sending invoices and notifications
// This is a placeholder implementation - you'll need to configure with a real email service

export interface EmailData {
  to: string
  subject: string
  htmlContent: string
  attachments?: {
    filename: string
    content: string | Buffer
    contentType: string
  }[]
}

export interface InvoiceEmailData {
  invoiceNumber: string
  clientName: string
  clientEmail: string
  serviceDescription: string
  amount: number
  dueDate: string | null
  notes?: string
  pdfContent?: string | Buffer
}

export class EmailService {
  private static instance: EmailService
  private isConfigured = false

  private constructor() {
    // Check if email service is configured
    this.isConfigured = !!(
      process.env.NEXT_PUBLIC_EMAIL_SERVICE_CONFIGURED ||
      process.env.RESEND_API_KEY ||
      process.env.SENDGRID_API_KEY ||
      process.env.NODEMAILER_CONFIG
    )
  }

  public static getInstance(): EmailService {
    if (!EmailService.instance) {
      EmailService.instance = new EmailService()
    }
    return EmailService.instance
  }

  public isEmailServiceAvailable(): boolean {
    return this.isConfigured
  }

  public async sendInvoiceEmail(invoiceData: InvoiceEmailData): Promise<{ success: boolean; message: string }> {
    if (!this.isConfigured) {
      return this.fallbackToMailto(invoiceData)
    }

    try {
      // TODO: Implement actual email sending with your preferred service
      // Examples:
      // - Resend (recommended for modern apps)
      // - SendGrid
      // - Nodemailer with SMTP
      // - AWS SES

      // For now, return a placeholder response
      console.log('Email service not fully configured, using mailto fallback')
      return this.fallbackToMailto(invoiceData)

    } catch (error) {
      console.error('Error sending email:', error)
      return {
        success: false,
        message: 'Erreur lors de l\'envoi de l\'email. Veuillez réessayer.'
      }
    }
  }

  private fallbackToMailto(invoiceData: InvoiceEmailData): { success: boolean; message: string } {
    const subject = `Facture ${invoiceData.invoiceNumber} - NutriFlow`
    const body = this.generateEmailTemplate(invoiceData)
    
    const mailtoLink = `mailto:${invoiceData.clientEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
    
    // Open default email client
    if (typeof window !== 'undefined') {
      window.location.href = mailtoLink
    }
    
    return {
      success: true,
      message: `Ouverture du client email pour ${invoiceData.clientEmail}`
    }
  }

  private generateEmailTemplate(invoiceData: InvoiceEmailData): string {
    return `Cher(e) ${invoiceData.clientName},

J'espère que ce message vous trouve en bonne santé. Veuillez trouver ci-joint votre facture pour les services de nutrition fournis.

Détails de la facture :
- Numéro de facture : ${invoiceData.invoiceNumber}
- Service : ${invoiceData.serviceDescription}
- Montant : ${invoiceData.amount.toFixed(2)} €
- Date d'échéance : ${invoiceData.dueDate ? new Date(invoiceData.dueDate).toLocaleDateString('fr-FR') : 'À réception'}

${invoiceData.notes ? `Notes supplémentaires : ${invoiceData.notes}` : ''}

Merci d'avoir choisi nos services de nutrition. Si vous avez des questions concernant cette facture, n'hésitez pas à nous contacter.

Cordialement,
Votre Diététicien(ne)

---
Cette facture a été générée depuis NutriFlow
Généré le ${new Date().toLocaleDateString('fr-FR')}`
  }

  public generateHTMLEmailTemplate(invoiceData: InvoiceEmailData): string {
    return `
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Facture ${invoiceData.invoiceNumber}</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #059669; color: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
        .invoice-details { background-color: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .footer { background-color: #f3f4f6; padding: 15px; border-radius: 8px; margin-top: 20px; font-size: 0.9em; color: #6b7280; }
        .amount { font-size: 1.2em; font-weight: bold; color: #059669; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>NutriFlow</h1>
            <p>Facture de services nutritionnels</p>
        </div>
        
        <p>Cher(e) ${invoiceData.clientName},</p>
        
        <p>J'espère que ce message vous trouve en bonne santé. Veuillez trouver ci-joint votre facture pour les services de nutrition fournis.</p>
        
        <div class="invoice-details">
            <h3>Détails de la facture</h3>
            <p><strong>Numéro de facture :</strong> ${invoiceData.invoiceNumber}</p>
            <p><strong>Service :</strong> ${invoiceData.serviceDescription}</p>
            <p><strong>Montant :</strong> <span class="amount">${invoiceData.amount.toFixed(2)} €</span></p>
            <p><strong>Date d'échéance :</strong> ${invoiceData.dueDate ? new Date(invoiceData.dueDate).toLocaleDateString('fr-FR') : 'À réception'}</p>
            ${invoiceData.notes ? `<p><strong>Notes :</strong> ${invoiceData.notes}</p>` : ''}
        </div>
        
        <p>Merci d'avoir choisi nos services de nutrition. Si vous avez des questions concernant cette facture, n'hésitez pas à nous contacter.</p>
        
        <p>Cordialement,<br>
        Votre Diététicien(ne)</p>
        
        <div class="footer">
            <p>Cette facture a été générée depuis NutriFlow</p>
            <p>Généré le ${new Date().toLocaleDateString('fr-FR')}</p>
        </div>
    </div>
</body>
</html>`
  }

  // Method to send appointment reminders
  public async sendAppointmentReminder(data: {
    clientName: string
    clientEmail: string
    appointmentDate: string
    appointmentTime: string
    appointmentType: string
    location?: string
    meetingLink?: string
  }): Promise<{ success: boolean; message: string }> {
    const subject = `Rappel de rendez-vous - ${data.appointmentDate}`
    const body = `Cher(e) ${data.clientName},

Ceci est un rappel pour votre rendez-vous de ${data.appointmentType} prévu le ${data.appointmentDate} à ${data.appointmentTime}.

${data.location ? `Lieu : ${data.location}` : ''}
${data.meetingLink ? `Lien de visioconférence : ${data.meetingLink}` : ''}

Si vous avez besoin de modifier ou annuler ce rendez-vous, veuillez nous contacter dès que possible.

Cordialement,
Votre Diététicien(ne)`

    if (!this.isConfigured) {
      const mailtoLink = `mailto:${data.clientEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
      if (typeof window !== 'undefined') {
        window.location.href = mailtoLink
      }
      return {
        success: true,
        message: `Ouverture du client email pour ${data.clientEmail}`
      }
    }

    // TODO: Implement actual email sending
    return {
      success: false,
      message: 'Service email non configuré'
    }
  }
}

export const emailService = EmailService.getInstance()
