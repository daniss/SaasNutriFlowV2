/**
 * Comprehensive notification service for email and SMS
 * Supports multiple providers: SendGrid, Resend for email; Twilio, OVH for SMS
 */

interface EmailProvider {
  send(to: string, subject: string, content: string, html?: string): Promise<boolean>
}

interface SMSProvider {
  send(to: string, message: string): Promise<boolean>
}

// Email Providers
class SendGridProvider implements EmailProvider {
  private apiKey: string
  private fromEmail: string

  constructor(apiKey: string, fromEmail: string) {
    this.apiKey = apiKey
    this.fromEmail = fromEmail
  }

  async send(to: string, subject: string, content: string, html?: string): Promise<boolean> {
    try {
      const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          personalizations: [{ to: [{ email: to }] }],
          from: { email: this.fromEmail },
          subject,
          content: [
            { type: 'text/plain', value: content },
            ...(html ? [{ type: 'text/html', value: html }] : [])
          ]
        })
      })

      return response.ok
    } catch (error) {
      console.error('SendGrid email error:', error)
      return false
    }
  }
}

class ResendProvider implements EmailProvider {
  private apiKey: string
  private fromEmail: string

  constructor(apiKey: string, fromEmail: string) {
    this.apiKey = apiKey
    this.fromEmail = fromEmail
  }

  async send(to: string, subject: string, content: string, html?: string): Promise<boolean> {
    try {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: this.fromEmail,
          to: [to],
          subject,
          text: content,
          ...(html && { html })
        })
      })

      return response.ok
    } catch (error) {
      console.error('Resend email error:', error)
      return false
    }
  }
}

// SMS Providers
class TwilioProvider implements SMSProvider {
  private accountSid: string
  private authToken: string
  private fromNumber: string

  constructor(accountSid: string, authToken: string, fromNumber: string) {
    this.accountSid = accountSid
    this.authToken = authToken
    this.fromNumber = fromNumber
  }

  async send(to: string, message: string): Promise<boolean> {
    try {
      const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${this.accountSid}/Messages.json`, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${Buffer.from(`${this.accountSid}:${this.authToken}`).toString('base64')}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          From: this.fromNumber,
          To: to,
          Body: message
        })
      })

      return response.ok
    } catch (error) {
      console.error('Twilio SMS error:', error)
      return false
    }
  }
}

class OVHSMSProvider implements SMSProvider {
  private applicationKey: string
  private applicationSecret: string
  private consumerKey: string
  private serviceName: string

  constructor(applicationKey: string, applicationSecret: string, consumerKey: string, serviceName: string) {
    this.applicationKey = applicationKey
    this.applicationSecret = applicationSecret
    this.consumerKey = consumerKey
    this.serviceName = serviceName
  }

  async send(to: string, message: string): Promise<boolean> {
    try {
      // OVH API requires signature generation - simplified implementation
      const timestamp = Math.floor(Date.now() / 1000)
      const method = 'POST'
      const url = `https://eu.api.ovh.com/1.0/sms/${this.serviceName}/jobs`
      
      const response = await fetch(url, {
        method,
        headers: {
          'X-Ovh-Application': this.applicationKey,
          'X-Ovh-Consumer': this.consumerKey,
          'X-Ovh-Timestamp': timestamp.toString(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message,
          receivers: [to],
          sender: 'NutriFlow'
        })
      })

      return response.ok
    } catch (error) {
      console.error('OVH SMS error:', error)
      return false
    }
  }
}

// Main Notification Service
export class NotificationService {
  private emailProvider: EmailProvider | null = null
  private smsProvider: SMSProvider | null = null

  constructor() {
    this.initializeProviders()
  }

  private initializeProviders() {
    // Initialize email provider
    const emailProvider = process.env.EMAIL_PROVIDER
    const fromEmail = process.env.FROM_EMAIL || 'noreply@nutriflow.com'

    if (emailProvider === 'sendgrid' && process.env.SENDGRID_API_KEY) {
      this.emailProvider = new SendGridProvider(process.env.SENDGRID_API_KEY, fromEmail)
    } else if (emailProvider === 'resend' && process.env.RESEND_API_KEY) {
      this.emailProvider = new ResendProvider(process.env.RESEND_API_KEY, fromEmail)
    }

    // Initialize SMS provider
    const smsProvider = process.env.SMS_PROVIDER

    if (smsProvider === 'twilio' && process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_PHONE_NUMBER) {
      this.smsProvider = new TwilioProvider(
        process.env.TWILIO_ACCOUNT_SID,
        process.env.TWILIO_AUTH_TOKEN,
        process.env.TWILIO_PHONE_NUMBER
      )
    } else if (smsProvider === 'ovh' && process.env.OVH_APPLICATION_KEY && process.env.OVH_APPLICATION_SECRET && process.env.OVH_CONSUMER_KEY && process.env.OVH_SERVICE_NAME) {
      this.smsProvider = new OVHSMSProvider(
        process.env.OVH_APPLICATION_KEY,
        process.env.OVH_APPLICATION_SECRET,
        process.env.OVH_CONSUMER_KEY,
        process.env.OVH_SERVICE_NAME
      )
    }
  }

  async sendEmail(to: string, subject: string, content: string, html?: string): Promise<boolean> {
    if (!this.emailProvider) {
      console.warn('No email provider configured')
      return false
    }

    try {
      return await this.emailProvider.send(to, subject, content, html)
    } catch (error) {
      console.error('Email sending failed:', error)
      return false
    }
  }

  async sendSMS(to: string, message: string): Promise<boolean> {
    if (!this.smsProvider) {
      console.warn('No SMS provider configured')
      return false
    }

    try {
      return await this.smsProvider.send(to, message)
    } catch (error) {
      console.error('SMS sending failed:', error)
      return false
    }
  }

  // Convenience methods for common notifications
  async sendAppointmentReminder(clientEmail: string, clientPhone: string | null, appointmentDetails: {
    date: string
    time: string
    dietitianName: string
  }): Promise<{ email: boolean; sms: boolean }> {
    const { date, time, dietitianName } = appointmentDetails
    
    const emailSubject = 'Rappel de rendez-vous - NutriFlow'
    const emailContent = `
Bonjour,

Nous vous rappelons votre rendez-vous avec ${dietitianName} :

📅 Date : ${new Date(date).toLocaleDateString('fr-FR')}
🕒 Heure : ${time}

Si vous avez des questions ou devez reporter votre rendez-vous, n'hésitez pas à nous contacter.

Cordialement,
L'équipe NutriFlow
    `.trim()

    const smsMessage = `Rappel: RDV avec ${dietitianName} le ${new Date(date).toLocaleDateString('fr-FR')} à ${time}. NutriFlow`

    const results = {
      email: await this.sendEmail(clientEmail, emailSubject, emailContent),
      sms: clientPhone ? await this.sendSMS(clientPhone, smsMessage) : false
    }

    return results
  }

  async sendInvoiceNotification(clientEmail: string, invoiceDetails: {
    invoiceNumber: string
    amount: number
    dueDate: string
    dietitianName: string
  }): Promise<boolean> {
    const { invoiceNumber, amount, dueDate, dietitianName } = invoiceDetails
    
    const subject = `Facture ${invoiceNumber} - NutriFlow`
    const content = `
Bonjour,

Vous avez reçu une nouvelle facture de ${dietitianName} :

📋 Numéro : ${invoiceNumber}
💰 Montant : ${new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(amount)}
📅 Date d'échéance : ${new Date(dueDate).toLocaleDateString('fr-FR')}

Vous pouvez consulter et télécharger votre facture depuis votre espace client.

Cordialement,
L'équipe NutriFlow
    `.trim()

    return await this.sendEmail(clientEmail, subject, content)
  }

  async sendMealPlanNotification(clientEmail: string, mealPlanDetails: {
    name: string
    dietitianName: string
  }): Promise<boolean> {
    const { name, dietitianName } = mealPlanDetails
    
    const subject = 'Nouveau plan de repas disponible - NutriFlow'
    const content = `
Bonjour,

${dietitianName} a créé un nouveau plan de repas pour vous :

📋 Plan : ${name}

Vous pouvez le consulter dès maintenant dans votre espace client.

Bon appétit !
L'équipe NutriFlow
    `.trim()

    return await this.sendEmail(clientEmail, subject, content)
  }

  async sendWelcomeEmail(clientEmail: string, clientName: string, dietitianName: string): Promise<boolean> {
    const subject = 'Bienvenue sur NutriFlow !'
    const content = `
Bonjour ${clientName},

Bienvenue sur NutriFlow ! Vous avez été ajouté(e) comme client(e) de ${dietitianName}.

Grâce à cette plateforme, vous pourrez :
• Consulter vos plans de repas personnalisés
• Suivre votre progression
• Communiquer avec votre nutritionniste
• Accéder à vos factures et rendez-vous

Connectez-vous à votre espace client pour commencer !

Cordialement,
L'équipe NutriFlow
    `.trim()

    return await this.sendEmail(clientEmail, subject, content)
  }
}

// Singleton instance
export const notificationService = new NotificationService()

// Type exports
export type { EmailProvider, SMSProvider }
