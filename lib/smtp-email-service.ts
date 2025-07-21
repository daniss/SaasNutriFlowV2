/**
 * Server-only SMTP email service using nodemailer
 * This file should only be imported in API routes or server-side code
 */

interface EmailOptions {
  to: string
  subject: string
  text: string
  html?: string
}

export class SMTPEmailService {
  private static instance: SMTPEmailService
  private transporter: any = null

  private constructor() {}

  public static getInstance(): SMTPEmailService {
    if (!SMTPEmailService.instance) {
      SMTPEmailService.instance = new SMTPEmailService()
    }
    return SMTPEmailService.instance
  }

  private async getTransporter() {
    if (this.transporter) {
      return this.transporter
    }

    // Only import nodemailer server-side
    if (typeof window !== 'undefined') {
      throw new Error('SMTP service can only be used server-side')
    }

    const nodemailer = await import('nodemailer')

    const smtpPort = parseInt(process.env.SMTP_PORT || '587')
    const smtpSecure = process.env.SMTP_SECURE === 'true' || smtpPort === 465

    this.transporter = nodemailer.default.createTransport({
      host: process.env.SMTP_HOST,
      port: smtpPort,
      secure: smtpSecure,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
      tls: {
        rejectUnauthorized: false // Allow self-signed certificates
      }
    })

    return this.transporter
  }

  public async sendEmail(options: EmailOptions): Promise<boolean> {
    try {
      if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
        console.log('📧 SMTP Mock Email:')
        console.log(`To: ${options.to}`)
        console.log(`Subject: ${options.subject}`)
        console.log(`Text: ${options.text}`)
        if (options.html) console.log(`HTML: ${options.html}`)
        return true
      }

      const transporter = await this.getTransporter()
      const fromEmail = process.env.FROM_EMAIL || 'noreply@nutriflow.com'

      const info = await transporter.sendMail({
        from: fromEmail,
        to: options.to,
        subject: options.subject,
        text: options.text,
        ...(options.html && { html: options.html })
      })

      console.log('📧 SMTP Email sent:', info.messageId)
      return true
    } catch (error) {
      console.error('SMTP email error:', error)
      return false
    }
  }

  public isConfigured(): boolean {
    return !!(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS)
  }
}

export const smtpEmailService = SMTPEmailService.getInstance()