// Email service for NutriFlow
// This is a placeholder implementation for email functionality
// In production, you would integrate with services like SendGrid, Resend, or AWS SES

export interface EmailData {
  to: string
  subject: string
  html: string
  from?: string
}

export interface ReminderEmailData {
  clientName: string
  clientEmail: string
  dietitianName: string
  reminderType: string
  message: string
  scheduledDate: string
}

export interface MealPlanShareData {
  clientName: string
  clientEmail: string
  dietitianName: string
  planName: string
  planDescription?: string
  attachmentUrl?: string
}

export class EmailService {
  private apiKey: string
  private fromEmail: string

  constructor() {
    // In production, these would come from environment variables
    this.apiKey = process.env.EMAIL_API_KEY || ''
    this.fromEmail = process.env.FROM_EMAIL || 'noreply@nutriflow.com'
  }

  async sendEmail(emailData: EmailData): Promise<boolean> {
    // Placeholder implementation
    // In production, replace with actual email service integration
    console.log('📧 Email would be sent:', {
      to: emailData.to,
      subject: emailData.subject,
      from: emailData.from || this.fromEmail,
      preview: emailData.html.substring(0, 100) + '...'
    })

    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1000))

    // Simulate 95% success rate
    return Math.random() > 0.05
  }

  generateReminderEmail(data: ReminderEmailData): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Rappel NutriFlow</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #10b981, #059669); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; }
          .footer { background: #f9fafb; padding: 20px; text-align: center; border-radius: 0 0 8px 8px; border: 1px solid #e5e7eb; border-top: none; }
          .button { display: inline-block; background: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
          .reminder-box { background: #f0fdf4; border-left: 4px solid #10b981; padding: 16px; margin: 20px 0; border-radius: 4px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🥗 NutriFlow</h1>
            <p>Rappel de votre diététicien(ne)</p>
          </div>
          
          <div class="content">
            <h2>Bonjour ${data.clientName},</h2>
            
            <p>Votre diététicien(ne) <strong>${data.dietitianName}</strong> vous envoie un rappel important :</p>
            
            <div class="reminder-box">
              <h3>📅 ${data.reminderType}</h3>
              <p>${data.message}</p>
              <p><strong>Date prévue :</strong> ${new Date(data.scheduledDate).toLocaleDateString('fr-FR', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}</p>
            </div>
            
            <p>N'hésitez pas à contacter votre diététicien(ne) si vous avez des questions ou si vous souhaitez ajuster votre planning.</p>
            
            <p>À bientôt !<br>
            <strong>${data.dietitianName}</strong></p>
          </div>
          
          <div class="footer">
            <p><small>Ce message a été envoyé via NutriFlow, votre plateforme de suivi nutritionnel.<br>
            Si vous ne souhaitez plus recevoir ces rappels, contactez votre diététicien(ne).</small></p>
          </div>
        </div>
      </body>
      </html>
    `
  }

  generateMealPlanShareEmail(data: MealPlanShareData): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Nouveau Plan Alimentaire - NutriFlow</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #10b981, #059669); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; }
          .footer { background: #f9fafb; padding: 20px; text-align: center; border-radius: 0 0 8px 8px; border: 1px solid #e5e7eb; border-top: none; }
          .plan-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin: 20px 0; }
          .button { display: inline-block; background: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🥗 NutriFlow</h1>
            <p>Votre nouveau plan alimentaire est prêt !</p>
          </div>
          
          <div class="content">
            <h2>Bonjour ${data.clientName},</h2>
            
            <p>Votre diététicien(ne) <strong>${data.dietitianName}</strong> a préparé un nouveau plan alimentaire personnalisé pour vous :</p>
            
            <div class="plan-card">
              <h3>📋 ${data.planName}</h3>
              ${data.planDescription ? `<p>${data.planDescription}</p>` : ''}
              <p><strong>Créé spécialement pour vos objectifs nutritionnels</strong></p>
            </div>
            
            ${data.attachmentUrl ? `
              <p>📎 <strong>Plan alimentaire en pièce jointe</strong><br>
              Vous trouverez votre plan détaillé en pièce jointe de cet email.</p>
            ` : ''}
            
            <p>Ce plan a été conçu en tenant compte de vos préférences alimentaires, vos objectifs et vos contraintes. N'hésitez pas à contacter votre diététicien(ne) pour toute question ou ajustement.</p>
            
            <h4>📞 Conseils de votre diététicien(ne) :</h4>
            <ul>
              <li>Suivez le plan progressivement et à votre rythme</li>
              <li>N'hésitez pas à faire des substitutions en cas d'allergie ou d'aversion</li>
              <li>Contactez-moi pour toute question ou difficulté</li>
              <li>Tenez un journal alimentaire pour suivre vos progrès</li>
            </ul>
            
            <p>Bonne dégustation et à bientôt !<br>
            <strong>${data.dietitianName}</strong></p>
          </div>
          
          <div class="footer">
            <p><small>Ce message a été envoyé via NutriFlow, votre plateforme de suivi nutritionnel.<br>
            Pour toute question, répondez directement à cet email.</small></p>
          </div>
        </div>
      </body>
      </html>
    `
  }

  async sendReminderEmail(data: ReminderEmailData): Promise<boolean> {
    const emailData: EmailData = {
      to: data.clientEmail,
      subject: `Rappel: ${data.reminderType} - ${data.dietitianName}`,
      html: this.generateReminderEmail(data),
      from: this.fromEmail
    }

    return this.sendEmail(emailData)
  }

  async sendMealPlanShare(data: MealPlanShareData): Promise<boolean> {
    const emailData: EmailData = {
      to: data.clientEmail,
      subject: `Nouveau plan alimentaire: ${data.planName}`,
      html: this.generateMealPlanShareEmail(data),
      from: this.fromEmail
    }

    return this.sendEmail(emailData)
  }

  async sendAppointmentReminder(
    clientName: string,
    clientEmail: string,
    dietitianName: string,
    appointmentDate: string,
    appointmentType: string
  ): Promise<boolean> {
    const reminderData: ReminderEmailData = {
      clientName,
      clientEmail,
      dietitianName,
      reminderType: `Rendez-vous ${appointmentType}`,
      message: `Vous avez un rendez-vous prévu avec votre diététicien(ne). N'oubliez pas d'apporter vos questions et votre journal alimentaire si vous en tenez un.`,
      scheduledDate: appointmentDate
    }

    return this.sendReminderEmail(reminderData)
  }

  async sendWelcomeEmail(
    clientName: string,
    clientEmail: string,
    dietitianName: string
  ): Promise<boolean> {
    const emailData: EmailData = {
      to: clientEmail,
      subject: `Bienvenue chez ${dietitianName} - NutriFlow`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Bienvenue - NutriFlow</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #10b981, #059669); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; }
            .footer { background: #f9fafb; padding: 20px; text-align: center; border-radius: 0 0 8px 8px; border: 1px solid #e5e7eb; border-top: none; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🥗 Bienvenue chez NutriFlow !</h1>
            </div>
            
            <div class="content">
              <h2>Bonjour ${clientName},</h2>
              
              <p>Bienvenue dans l'accompagnement nutritionnel avec <strong>${dietitianName}</strong> !</p>
              
              <p>Vous allez recevoir vos plans alimentaires, rappels et conseils personnalisés directement par email. Votre diététicien(ne) est là pour vous accompagner dans l'atteinte de vos objectifs nutritionnels.</p>
              
              <h3>📋 Prochaines étapes :</h3>
              <ul>
                <li>Votre diététicien(ne) va établir votre plan alimentaire personnalisé</li>
                <li>Vous recevrez des rappels pour vos rendez-vous et objectifs</li>
                <li>N'hésitez pas à poser toutes vos questions</li>
              </ul>
              
              <p>À très bientôt !<br>
              <strong>${dietitianName}</strong></p>
            </div>
            
            <div class="footer">
              <p><small>Ce message a été envoyé via NutriFlow.</small></p>
            </div>
          </div>
        </body>
        </html>
      `,
      from: this.fromEmail
    }

    return this.sendEmail(emailData)
  }
}

// Singleton instance
export const emailService = new EmailService()

// Helper functions for easy usage
export const sendReminderEmail = (data: ReminderEmailData) => emailService.sendReminderEmail(data)
export const sendMealPlanShare = (data: MealPlanShareData) => emailService.sendMealPlanShare(data)
export const sendAppointmentReminder = (
  clientName: string,
  clientEmail: string,
  dietitianName: string,
  appointmentDate: string,
  appointmentType: string
) => emailService.sendAppointmentReminder(clientName, clientEmail, dietitianName, appointmentDate, appointmentType)
export const sendWelcomeEmail = (
  clientName: string,
  clientEmail: string,
  dietitianName: string
) => emailService.sendWelcomeEmail(clientName, clientEmail, dietitianName)
