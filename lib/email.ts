// Enhanced email service using the new notification system
import { notificationService } from "./notification-service";

export interface EmailData {
  to: string;
  subject: string;
  htmlContent: string;
  textContent?: string;
  attachments?: {
    filename: string;
    content: string | Buffer;
    contentType: string;
  }[];
}

export interface InvoiceEmailData {
  invoiceNumber: string;
  clientName: string;
  clientEmail: string;
  serviceDescription: string;
  amount: number;
  dueDate: string | null;
  notes?: string;
  pdfContent?: string | Buffer;
}

export class EmailService {
  private static instance: EmailService;

  private constructor() {}

  public static getInstance(): EmailService {
    if (!EmailService.instance) {
      EmailService.instance = new EmailService();
    }
    return EmailService.instance;
  }

  public isEmailServiceAvailable(): boolean {
    // Check if notification service has email provider configured
    return !!(
      process.env.EMAIL_PROVIDER &&
      (process.env.SENDGRID_API_KEY || process.env.RESEND_API_KEY)
    );
  }

  public async sendInvoiceEmail(
    invoiceData: InvoiceEmailData
  ): Promise<{ success: boolean; message: string }> {
    if (!this.isEmailServiceAvailable()) {
      return this.fallbackToMailto(invoiceData);
    }

    try {
      const subject = `Facture ${invoiceData.invoiceNumber} - NutriFlow`;
      const textContent = this.generateEmailTemplate(invoiceData);
      const htmlContent = this.generateHTMLEmailTemplate(invoiceData);

      const success = await notificationService.sendEmail(
        invoiceData.clientEmail,
        subject,
        textContent,
        htmlContent
      );

      if (success) {
        return {
          success: true,
          message: `Email envoyé avec succès à ${invoiceData.clientEmail}`,
        };
      } else {
        return this.fallbackToMailto(invoiceData);
      }
    } catch (error) {
      console.error("Error sending email:", error);
      return this.fallbackToMailto(invoiceData);
    }
  }

  private fallbackToMailto(invoiceData: InvoiceEmailData): {
    success: boolean;
    message: string;
  } {
    const subject = `Facture ${invoiceData.invoiceNumber} - NutriFlow`;
    const body = this.generateEmailTemplate(invoiceData);

    const mailtoLink = `mailto:${
      invoiceData.clientEmail
    }?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

    // Open default email client
    if (typeof window !== "undefined") {
      window.location.href = mailtoLink;
    }

    return {
      success: true,
      message: `Ouverture du client email pour ${invoiceData.clientEmail}`,
    };
  }

  private generateEmailTemplate(invoiceData: InvoiceEmailData): string {
    return `Cher(e) ${invoiceData.clientName},

J'espère que ce message vous trouve en bonne santé. Veuillez trouver ci-joint votre facture pour les services de nutrition fournis.

Détails de la facture :
- Numéro de facture : ${invoiceData.invoiceNumber}
- Service : ${invoiceData.serviceDescription}
- Montant : ${invoiceData.amount.toFixed(2)} €
- Date d'échéance : ${
      invoiceData.dueDate
        ? new Date(invoiceData.dueDate).toLocaleDateString("fr-FR")
        : "À réception"
    }

${invoiceData.notes ? `Notes supplémentaires : ${invoiceData.notes}` : ""}

Merci d'avoir choisi nos services de nutrition. Si vous avez des questions concernant cette facture, n'hésitez pas à nous contacter.

Cordialement,
Votre Diététicien(ne)

---
Cette facture a été générée depuis NutriFlow
Généré le ${new Date().toLocaleDateString("fr-FR")}`;
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
            <p><strong>Numéro de facture :</strong> ${
              invoiceData.invoiceNumber
            }</p>
            <p><strong>Service :</strong> ${invoiceData.serviceDescription}</p>
            <p><strong>Montant :</strong> <span class="amount">${invoiceData.amount.toFixed(
              2
            )} €</span></p>
            <p><strong>Date d'échéance :</strong> ${
              invoiceData.dueDate
                ? new Date(invoiceData.dueDate).toLocaleDateString("fr-FR")
                : "À réception"
            }</p>
            ${
              invoiceData.notes
                ? `<p><strong>Notes :</strong> ${invoiceData.notes}</p>`
                : ""
            }
        </div>
        
        <p>Merci d'avoir choisi nos services de nutrition. Si vous avez des questions concernant cette facture, n'hésitez pas à nous contacter.</p>
        
        <p>Cordialement,<br>
        Votre Diététicien(ne)</p>
        
        <div class="footer">
            <p>Cette facture a été générée depuis NutriFlow</p>
            <p>Généré le ${new Date().toLocaleDateString("fr-FR")}</p>
        </div>
    </div>
</body>
</html>`;
  }

  // Method to send appointment reminders
  public async sendEmail(
    emailData: EmailData
  ): Promise<{ success: boolean; message: string }> {
    if (!this.isEmailServiceAvailable()) {
      // Fallback: log the email if service is not configured
      console.log("Email (service not configured):", {
        to: emailData.to,
        subject: emailData.subject,
        html: emailData.htmlContent,
      });

      return {
        success: false,
        message: "Service email non configuré",
      };
    }

    try {
      const success = await notificationService.sendEmail(
        emailData.to,
        emailData.subject,
        emailData.textContent || emailData.htmlContent.replace(/<[^>]*>/g, ""),
        emailData.htmlContent
      );

      return {
        success,
        message: success
          ? `Email envoyé avec succès à ${emailData.to}`
          : "Erreur lors de l'envoi de l'email",
      };
    } catch (error) {
      console.error("Error sending email:", error);
      return {
        success: false,
        message: "Erreur lors de l'envoi de l'email",
      };
    }
  }

  public async sendAppointmentReminder(data: {
    clientName: string;
    clientEmail: string;
    appointmentDate: string;
    appointmentTime: string;
    appointmentType: string;
    location?: string;
    meetingLink?: string;
  }): Promise<{ success: boolean; message: string }> {
    const subject = `Rappel de rendez-vous - ${data.appointmentDate}`;
    const textContent = `Cher(e) ${data.clientName},

Ceci est un rappel pour votre rendez-vous de ${data.appointmentType} prévu le ${
      data.appointmentDate
    } à ${data.appointmentTime}.

${data.location ? `Lieu : ${data.location}` : ""}
${data.meetingLink ? `Lien de visioconférence : ${data.meetingLink}` : ""}

Si vous avez besoin de modifier ou annuler ce rendez-vous, veuillez nous contacter dès que possible.

Cordialement,
Votre Diététicien(ne)`;

    if (!this.isEmailServiceAvailable()) {
      const mailtoLink = `mailto:${
        data.clientEmail
      }?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(
        textContent
      )}`;
      if (typeof window !== "undefined") {
        window.location.href = mailtoLink;
      }
      return {
        success: true,
        message: `Ouverture du client email pour ${data.clientEmail}`,
      };
    }

    try {
      const success = await notificationService.sendEmail(
        data.clientEmail,
        subject,
        textContent
      );
      return {
        success,
        message: success
          ? `Rappel envoyé avec succès à ${data.clientEmail}`
          : "Erreur lors de l'envoi du rappel",
      };
    } catch (error) {
      console.error("Error sending appointment reminder:", error);
      return {
        success: false,
        message: "Erreur lors de l'envoi du rappel",
      };
    }
  }
}

export const emailService = EmailService.getInstance();
