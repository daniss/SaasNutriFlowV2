// Email and SMS Service Integration
// Supports multiple providers: SendGrid, Resend, Twilio, OVH SMS

interface EmailProvider {
  sendEmail(params: EmailParams): Promise<EmailResult>;
}

interface SMSProvider {
  sendSMS(params: SMSParams): Promise<SMSResult>;
}

interface EmailParams {
  to: string | string[];
  subject: string;
  htmlContent?: string;
  textContent?: string;
  templateId?: string;
  templateData?: Record<string, any>;
  attachments?: EmailAttachment[];
  replyTo?: string;
}

interface SMSParams {
  to: string;
  message: string;
  from?: string;
}

interface EmailAttachment {
  filename: string;
  content: string; // Base64 encoded
  type: string;
}

interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

interface SMSResult {
  success: boolean;
  messageId?: string;
  error?: string;
  cost?: number;
}

interface NotificationTemplate {
  id: string;
  name: string;
  type: 'email' | 'sms';
  subject?: string;
  content: string;
  variables: string[];
}

// SendGrid Email Provider
class SendGridProvider implements EmailProvider {
  private apiKey: string;
  private baseUrl = 'https://api.sendgrid.com/v3';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async sendEmail(params: EmailParams): Promise<EmailResult> {
    try {
      const payload = {
        personalizations: [
          {
            to: Array.isArray(params.to) 
              ? params.to.map(email => ({ email }))
              : [{ email: params.to }],
            dynamic_template_data: params.templateData || {}
          }
        ],
        from: { email: process.env.FROM_EMAIL || 'noreply@nutriflow.com' },
        subject: params.subject,
        content: [
          {
            type: 'text/html',
            value: params.htmlContent || params.textContent || ''
          }
        ],
        template_id: params.templateId,
        reply_to: params.replyTo ? { email: params.replyTo } : undefined,
        attachments: params.attachments?.map(att => ({
          content: att.content,
          filename: att.filename,
          type: att.type,
          disposition: 'attachment'
        }))
      };

      const response = await fetch(`${this.baseUrl}/mail/send`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        return {
          success: true,
          messageId: response.headers.get('x-message-id') || undefined
        };
      } else {
        const error = await response.text();
        return {
          success: false,
          error: `SendGrid error: ${error}`
        };
      }
    } catch (error) {
      return {
        success: false,
        error: `SendGrid connection error: ${error}`
      };
    }
  }
}

// Resend Email Provider
class ResendProvider implements EmailProvider {
  private apiKey: string;
  private baseUrl = 'https://api.resend.com';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async sendEmail(params: EmailParams): Promise<EmailResult> {
    try {
      const payload = {
        from: process.env.FROM_EMAIL || 'noreply@nutriflow.com',
        to: Array.isArray(params.to) ? params.to : [params.to],
        subject: params.subject,
        html: params.htmlContent,
        text: params.textContent,
        reply_to: params.replyTo,
        attachments: params.attachments
      };

      const response = await fetch(`${this.baseUrl}/emails`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        const result = await response.json();
        return {
          success: true,
          messageId: result.id
        };
      } else {
        const error = await response.text();
        return {
          success: false,
          error: `Resend error: ${error}`
        };
      }
    } catch (error) {
      return {
        success: false,
        error: `Resend connection error: ${error}`
      };
    }
  }
}

// Twilio SMS Provider
class TwilioSMSProvider implements SMSProvider {
  private accountSid: string;
  private authToken: string;
  private baseUrl: string;

  constructor(accountSid: string, authToken: string) {
    this.accountSid = accountSid;
    this.authToken = authToken;
    this.baseUrl = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}`;
  }

  async sendSMS(params: SMSParams): Promise<SMSResult> {
    try {
      const formData = new URLSearchParams();
      formData.append('To', params.to);
      formData.append('From', params.from || process.env.TWILIO_PHONE_NUMBER || '');
      formData.append('Body', params.message);

      const response = await fetch(`${this.baseUrl}/Messages.json`, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${Buffer.from(`${this.accountSid}:${this.authToken}`).toString('base64')}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: formData
      });

      if (response.ok) {
        const result = await response.json();
        return {
          success: true,
          messageId: result.sid,
          cost: parseFloat(result.price || '0')
        };
      } else {
        const error = await response.text();
        return {
          success: false,
          error: `Twilio error: ${error}`
        };
      }
    } catch (error) {
      return {
        success: false,
        error: `Twilio connection error: ${error}`
      };
    }
  }
}

// OVH SMS Provider (French provider)
class OVHSMSProvider implements SMSProvider {
  private applicationKey: string;
  private applicationSecret: string;
  private consumerKey: string;
  private serviceName: string;

  constructor(applicationKey: string, applicationSecret: string, consumerKey: string, serviceName: string) {
    this.applicationKey = applicationKey;
    this.applicationSecret = applicationSecret;
    this.consumerKey = consumerKey;
    this.serviceName = serviceName;
  }

  async sendSMS(params: SMSParams): Promise<SMSResult> {
    try {
      // OVH API requires specific authentication headers
      const timestamp = Math.floor(Date.now() / 1000);
      const method = 'POST';
      const url = `https://eu.api.ovh.com/1.0/sms/${this.serviceName}/jobs`;
      const body = JSON.stringify({
        message: params.message,
        receivers: [params.to],
        sender: params.from || process.env.OVH_SMS_SENDER || 'NutriFlow'
      });

      // Generate signature for OVH API
      const signature = this.generateOVHSignature(method, url, body, timestamp);

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'X-Ovh-Application': this.applicationKey,
          'X-Ovh-Timestamp': timestamp.toString(),
          'X-Ovh-Signature': signature,
          'X-Ovh-Consumer': this.consumerKey,
          'Content-Type': 'application/json'
        },
        body
      });

      if (response.ok) {
        const result = await response.json();
        return {
          success: true,
          messageId: result.ids?.[0]?.toString()
        };
      } else {
        const error = await response.text();
        return {
          success: false,
          error: `OVH SMS error: ${error}`
        };
      }
    } catch (error) {
      return {
        success: false,
        error: `OVH SMS connection error: ${error}`
      };
    }
  }

  private generateOVHSignature(method: string, url: string, body: string, timestamp: number): string {
    const crypto = require('crypto');
    const toSign = `${this.applicationSecret}+${this.consumerKey}+${method}+${url}+${body}+${timestamp}`;
    return '$1$' + crypto.createHash('sha1').update(toSign).digest('hex');
  }
}

// Main Notification Service
export class NotificationService {
  private emailProvider: EmailProvider | undefined;
  private smsProvider: SMSProvider | undefined;

  constructor() {
    this.initializeProviders();
  }

  private initializeProviders(): void {
    // Initialize email provider based on environment
    const emailProvider = process.env.EMAIL_PROVIDER || 'sendgrid';
    
    switch (emailProvider) {
      case 'sendgrid':
        if (process.env.SENDGRID_API_KEY) {
          this.emailProvider = new SendGridProvider(process.env.SENDGRID_API_KEY);
        }
        break;
      case 'resend':
        if (process.env.RESEND_API_KEY) {
          this.emailProvider = new ResendProvider(process.env.RESEND_API_KEY);
        }
        break;
    }

    // Initialize SMS provider based on environment
    const smsProvider = process.env.SMS_PROVIDER || 'twilio';
    
    switch (smsProvider) {
      case 'twilio':
        if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
          this.smsProvider = new TwilioSMSProvider(
            process.env.TWILIO_ACCOUNT_SID,
            process.env.TWILIO_AUTH_TOKEN
          );
        }
        break;
      case 'ovh':
        if (process.env.OVH_APPLICATION_KEY && process.env.OVH_APPLICATION_SECRET && 
            process.env.OVH_CONSUMER_KEY && process.env.OVH_SERVICE_NAME) {
          this.smsProvider = new OVHSMSProvider(
            process.env.OVH_APPLICATION_KEY,
            process.env.OVH_APPLICATION_SECRET,
            process.env.OVH_CONSUMER_KEY,
            process.env.OVH_SERVICE_NAME
          );
        }
        break;
    }
  }

  // Predefined notification templates
  private templates: Record<string, NotificationTemplate> = {
    appointment_reminder: {
      id: 'appointment_reminder',
      name: 'Rappel de rendez-vous',
      type: 'email',
      subject: 'Rappel: Rendez-vous demain avec {{dietitian_name}}',
      content: `
        <h2>Rappel de rendez-vous</h2>
        <p>Bonjour {{client_name}},</p>
        <p>Nous vous rappelons votre rendez-vous prévu demain:</p>
        <ul>
          <li><strong>Date:</strong> {{appointment_date}}</li>
          <li><strong>Heure:</strong> {{appointment_time}}</li>
          <li><strong>Diététicien(ne):</strong> {{dietitian_name}}</li>
          <li><strong>Type:</strong> {{appointment_type}}</li>
        </ul>
        {{#if video_link}}
        <p><strong>Lien de visioconférence:</strong> <a href="{{video_link}}">Rejoindre la consultation</a></p>
        {{/if}}
        <p>N'hésitez pas à nous contacter si vous avez des questions.</p>
        <p>À bientôt,<br>{{dietitian_name}}</p>
      `,
      variables: ['client_name', 'appointment_date', 'appointment_time', 'dietitian_name', 'appointment_type', 'video_link']
    },
    appointment_reminder_sms: {
      id: 'appointment_reminder_sms',
      name: 'Rappel RDV SMS',
      type: 'sms',
      content: 'Rappel: RDV demain {{appointment_time}} avec {{dietitian_name}}. {{#if video_link}}Lien: {{video_link}}{{/if}}',
      variables: ['appointment_time', 'dietitian_name', 'video_link']
    },
    meal_plan_ready: {
      id: 'meal_plan_ready',
      name: 'Plan alimentaire prêt',
      type: 'email',
      subject: 'Votre nouveau plan alimentaire est prêt!',
      content: `
        <h2>Votre plan alimentaire personnalisé</h2>
        <p>Bonjour {{client_name}},</p>
        <p>Votre nouveau plan alimentaire "<strong>{{plan_title}}</strong>" est maintenant disponible!</p>
        <p><strong>Caractéristiques du plan:</strong></p>
        <ul>
          <li>Durée: {{duration_weeks}} semaine(s)</li>
          <li>Objectif calorique: {{target_calories}} kcal/jour</li>
          <li>Créé le: {{creation_date}}</li>
        </ul>
        <p>Vous pouvez consulter votre plan en vous connectant à votre espace client ou en contactant directement votre diététicien(ne).</p>
        <p>Bonne continuation dans votre parcours nutritionnel!</p>
        <p>{{dietitian_name}}</p>
      `,
      variables: ['client_name', 'plan_title', 'duration_weeks', 'target_calories', 'creation_date', 'dietitian_name']
    },
    progress_check: {
      id: 'progress_check',
      name: 'Suivi des progrès',
      type: 'email',
      subject: 'Comment se passe votre suivi nutritionnel?',
      content: `
        <h2>Suivi de vos progrès</h2>
        <p>Bonjour {{client_name}},</p>
        <p>J'espère que tout se passe bien avec votre plan alimentaire.</p>
        <p>N'hésitez pas à partager vos retours, questions ou difficultés. Votre réussite est ma priorité!</p>
        <p>Vous pouvez me répondre directement à cet email ou prendre rendez-vous pour un suivi.</p>
        <p>Continuez vos efforts, vous êtes sur la bonne voie!</p>
        <p>{{dietitian_name}}</p>
      `,
      variables: ['client_name', 'dietitian_name']
    },
    invoice_sent: {
      id: 'invoice_sent',
      name: 'Facture envoyée',
      type: 'email',
      subject: 'Facture {{invoice_number}} - {{business_name}}',
      content: `
        <h2>Nouvelle facture</h2>
        <p>Bonjour {{client_name}},</p>
        <p>Veuillez trouver votre facture en pièce jointe.</p>
        <p><strong>Détails de la facture:</strong></p>
        <ul>
          <li>Numéro: {{invoice_number}}</li>
          <li>Date: {{invoice_date}}</li>
          <li>Montant: {{amount}}€</li>
          <li>Échéance: {{due_date}}</li>
        </ul>
        <p>Le règlement peut être effectué par virement bancaire ou chèque.</p>
        <p>Merci pour votre confiance.</p>
        <p>{{dietitian_name}}<br>{{business_name}}</p>
      `,
      variables: ['client_name', 'invoice_number', 'invoice_date', 'amount', 'due_date', 'dietitian_name', 'business_name']
    }
  };

  /**
   * Send email notification
   */
  async sendEmail(params: EmailParams): Promise<EmailResult> {
    if (!this.emailProvider) {
      return {
        success: false,
        error: 'No email provider configured'
      };
    }

    return await this.emailProvider.sendEmail(params);
  }

  /**
   * Send SMS notification
   */
  async sendSMS(params: SMSParams): Promise<SMSResult> {
    if (!this.smsProvider) {
      return {
        success: false,
        error: 'No SMS provider configured'
      };
    }

    return await this.smsProvider.sendSMS(params);
  }

  /**
   * Send notification using template
   */
  async sendTemplate(
    templateId: string, 
    to: string, 
    data: Record<string, any>,
    type: 'email' | 'sms' = 'email'
  ): Promise<EmailResult | SMSResult> {
    const template = this.templates[templateId];
    if (!template) {
      return {
        success: false,
        error: `Template ${templateId} not found`
      };
    }

    if (template.type !== type) {
      return {
        success: false,
        error: `Template ${templateId} is not of type ${type}`
      };
    }

    const content = this.processTemplate(template.content, data);
    
    if (type === 'email') {
      const subject = template.subject ? this.processTemplate(template.subject, data) : 'Notification';
      return await this.sendEmail({
        to,
        subject,
        htmlContent: content
      });
    } else {
      return await this.sendSMS({
        to,
        message: content
      });
    }
  }

  /**
   * Send appointment reminder
   */
  async sendAppointmentReminder(
    client: { email?: string; phone?: string; first_name: string },
    appointment: any,
    dietitian: any,
    preferredChannel: 'email' | 'sms' | 'both' = 'email'
  ): Promise<{ email?: EmailResult; sms?: SMSResult }> {
    const data = {
      client_name: client.first_name,
      appointment_date: new Date(appointment.appointment_date).toLocaleDateString('fr-FR'),
      appointment_time: new Date(appointment.appointment_date).toLocaleTimeString('fr-FR', { 
        hour: '2-digit', 
        minute: '2-digit' 
      }),
      dietitian_name: `${dietitian.first_name} ${dietitian.last_name}`,
      appointment_type: appointment.appointment_type || 'Consultation',
      video_link: appointment.video_link || ''
    };

    const results: { email?: EmailResult; sms?: SMSResult } = {};

    if ((preferredChannel === 'email' || preferredChannel === 'both') && client.email) {
      results.email = await this.sendTemplate('appointment_reminder', client.email, data, 'email');
    }

    if ((preferredChannel === 'sms' || preferredChannel === 'both') && client.phone) {
      results.sms = await this.sendTemplate('appointment_reminder_sms', client.phone, data, 'sms');
    }

    return results;
  }

  /**
   * Send meal plan notification
   */
  async sendMealPlanNotification(
    client: { email: string; first_name: string },
    mealPlan: any,
    dietitian: any
  ): Promise<EmailResult> {
    const data = {
      client_name: client.first_name,
      plan_title: mealPlan.title,
      duration_weeks: mealPlan.duration_weeks,
      target_calories: mealPlan.target_calories,
      creation_date: new Date(mealPlan.created_at).toLocaleDateString('fr-FR'),
      dietitian_name: `${dietitian.first_name} ${dietitian.last_name}`
    };

    return await this.sendTemplate('meal_plan_ready', client.email, data, 'email');
  }

  /**
   * Send invoice email
   */
  async sendInvoiceEmail(
    client: { email: string; first_name: string; last_name: string },
    invoice: any,
    dietitian: any,
    pdfAttachment?: string
  ): Promise<EmailResult> {
    const data = {
      client_name: `${client.first_name} ${client.last_name}`,
      invoice_number: invoice.invoice_number,
      invoice_date: new Date(invoice.invoice_date).toLocaleDateString('fr-FR'),
      amount: invoice.amount,
      due_date: new Date(invoice.due_date).toLocaleDateString('fr-FR'),
      dietitian_name: `${dietitian.first_name} ${dietitian.last_name}`,
      business_name: dietitian.business_name || 'Cabinet de Nutrition'
    };

    const emailParams: EmailParams = {
      to: client.email,
      subject: this.processTemplate(this.templates.invoice_sent.subject!, data),
      htmlContent: this.processTemplate(this.templates.invoice_sent.content, data)
    };

    if (pdfAttachment) {
      emailParams.attachments = [{
        filename: `facture-${invoice.invoice_number}.pdf`,
        content: pdfAttachment,
        type: 'application/pdf'
      }];
    }

    return await this.sendEmail(emailParams);
  }

  /**
   * Process template with data
   */
  private processTemplate(template: string, data: Record<string, any>): string {
    let processed = template;
    
    // Replace simple variables {{variable}}
    Object.keys(data).forEach(key => {
      const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
      processed = processed.replace(regex, data[key] || '');
    });

    // Handle conditional blocks {{#if variable}}...{{/if}}
    processed = processed.replace(/{{#if\s+(\w+)}}(.*?){{\/if}}/gs, (match, variable, content) => {
      return data[variable] ? content : '';
    });

    return processed;
  }

  /**
   * Get available templates
   */
  getTemplates(): Record<string, NotificationTemplate> {
    return { ...this.templates };
  }

  /**
   * Add custom template
   */
  addTemplate(template: NotificationTemplate): void {
    this.templates[template.id] = template;
  }
}

// Export singleton instance
export const notificationService = new NotificationService();
