import { EmailService } from "@/lib/email";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, clientName, clientEmail, requestId, requestType, urgent } =
      body;

    // Email content based on request type
    const emailContent = {
      data_export: {
        subject: `[RGPD] Demande d'export de données - ${clientName}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #059669;">Nouvelle demande d'export de données RGPD</h2>
            
            <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="margin: 0 0 10px 0; color: #374151;">Détails de la demande</h3>
              <p><strong>Client :</strong> ${clientName}</p>
              <p><strong>Email :</strong> ${clientEmail}</p>
              <p><strong>Type :</strong> ${requestType}</p>
              <p><strong>ID de la demande :</strong> ${requestId}</p>
              <p><strong>Date :</strong> ${new Date().toLocaleString(
                "fr-FR"
              )}</p>
            </div>
            
            <div style="background: #dbeafe; padding: 15px; border-radius: 8px; border-left: 4px solid #3b82f6;">
              <p style="margin: 0; color: #1e40af;">
                <strong>Action requise :</strong> Vous devez traiter cette demande sous 30 jours (RGPD Article 12).
              </p>
            </div>
            
            <div style="margin-top: 20px;">
              <p>Pour traiter cette demande :</p>
              <ol>
                <li>Connectez-vous au tableau de bord NutriFlow</li>
                <li>Allez dans "Conformité RGPD" → "Exports"</li>
                <li>Générez l'export de données pour ${clientName}</li>
                <li>Envoyez le lien sécurisé au client</li>
              </ol>
            </div>
            
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #6b7280;">
              <p>Cette notification a été générée automatiquement par NutriFlow.<br>
              Pour plus d'informations sur la conformité RGPD, consultez la documentation.</p>
            </div>
          </div>
        `,
      },
      data_deletion: {
        subject: `[URGENT - RGPD] Demande de suppression de données - ${clientName}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #dc2626;">Demande URGENTE de suppression de données RGPD</h2>
            
            <div style="background: #fef2f2; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #dc2626;">
              <h3 style="margin: 0 0 10px 0; color: #7f1d1d;">⚠️ Action urgente requise</h3>
              <p style="color: #7f1d1d; margin: 0;">
                Le client ${clientName} demande la suppression complète de ses données personnelles.
              </p>
            </div>
            
            <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="margin: 0 0 10px 0; color: #374151;">Détails de la demande</h3>
              <p><strong>Client :</strong> ${clientName}</p>
              <p><strong>Email :</strong> ${clientEmail}</p>
              <p><strong>Type :</strong> Droit à l'oubli (suppression complète)</p>
              <p><strong>ID de la demande :</strong> ${requestId}</p>
              <p><strong>Date :</strong> ${new Date().toLocaleString(
                "fr-FR"
              )}</p>
            </div>
            
            <div style="background: #fef3c7; padding: 15px; border-radius: 8px; border-left: 4px solid #f59e0b;">
              <p style="margin: 0; color: #92400e;">
                <strong>Délai légal :</strong> 30 jours maximum pour traiter cette demande (RGPD Article 17).
              </p>
            </div>
            
            <div style="margin-top: 20px;">
              <p><strong>Étapes à suivre :</strong></p>
              <ol>
                <li>Contactez le client pour confirmer l'identité et la demande</li>
                <li>Vérifiez s'il y a des obligations légales de conservation</li>
                <li>Connectez-vous au tableau de bord NutriFlow</li>
                <li>Allez dans "Conformité RGPD" → "Droit à l'oubli"</li>
                <li>Procédez à l'anonymisation des données</li>
                <li>Confirmez au client que ses données ont été supprimées</li>
              </ol>
            </div>
            
            <div style="background: #fee2e2; padding: 15px; border-radius: 8px; margin-top: 20px;">
              <p style="margin: 0; color: #991b1b; font-size: 14px;">
                <strong>Important :</strong> Certaines données peuvent être conservées pour des obligations légales 
                (dossiers médicaux, comptabilité). Documentez les raisons de toute conservation.
              </p>
            </div>
            
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #6b7280;">
              <p>Cette notification a été générée automatiquement par NutriFlow.<br>
              En cas de problème, contactez immédiatement l'équipe technique.</p>
            </div>
          </div>
        `,
      },
    };

    const content = emailContent[type as keyof typeof emailContent];
    if (!content) {
      return NextResponse.json(
        { error: "Type de notification non reconnu" },
        { status: 400 }
      );
    }

    // Send email using EmailService
    try {
      const emailService = EmailService.getInstance();

      if (!emailService.isEmailServiceAvailable()) {
        // Fallback: log the email if service is not configured
        console.log("GDPR Email Notification (service not configured):", {
          to: "contact@nutri-flow.me",
          subject: content.subject,
          html: content.html,
        });

        return NextResponse.json({
          success: true,
          message: "Notification enregistrée (service email non configuré)",
        });
      }

      // Send the actual email
      const emailData = {
        to: "contact@nutri-flow.me",
        subject: content.subject,
        htmlContent: content.html,
        textContent: content.html.replace(/<[^>]*>/g, ""), // Strip HTML for text version
      };

      const emailResult = await emailService.sendEmail(emailData);

      if (emailResult.success) {
        console.log(
          "GDPR notification sent successfully to contact@nutri-flow.me"
        );
        return NextResponse.json({
          success: true,
          message: "Notification envoyée à l'équipe de conformité",
        });
      } else {
        console.log("Email service failed, logging notification:", emailData);
        return NextResponse.json({
          success: true,
          message: "Notification enregistrée (problème d'envoi)",
        });
      }
    } catch (emailError) {
      console.error("Error sending GDPR email:", emailError);

      // Fallback: log the email content
      console.log("GDPR Email Notification (fallback):", {
        to: "contact@nutri-flow.me",
        subject: content.subject,
        html: content.html,
      });

      return NextResponse.json({
        success: true,
        message: "Notification enregistrée (problème d'envoi)",
      });
    }
  } catch (error) {
    console.error("Error sending GDPR notification:", error);
    return NextResponse.json(
      { error: "Erreur lors de l'envoi de la notification" },
      { status: 500 }
    );
  }
}
