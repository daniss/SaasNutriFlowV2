import { NextRequest, NextResponse } from "next/server"
import { smtpEmailService } from "@/lib/smtp-email-service"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    // Authentication check
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError) {
      console.error("Auth error:", authError)
      return NextResponse.json(
        { error: "Authentication failed: " + authError.message },
        { status: 401 }
      )
    }
    
    if (!user) {
      console.error("No user found in session")
      return NextResponse.json(
        { error: "No user session found" },
        { status: 401 }
      )
    }

    // Get dietitian profile to verify user is a dietitian
    const { data: dietitian, error: dietitianError } = await supabase
      .from('dietitians')
      .select('id, name')
      .eq('auth_user_id', user.id)
      .single()

    if (dietitianError) {
      console.error("Dietitian lookup error:", dietitianError)
      return NextResponse.json(
        { error: "Dietitian profile not found: " + dietitianError.message },
        { status: 401 }
      )
    }

    if (!dietitian) {
      console.error("No dietitian profile found for user:", user.id)
      return NextResponse.json(
        { error: "Dietitian profile not found" },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { clientId, mealPlanName } = body

    if (!clientId || !mealPlanName) {
      return NextResponse.json(
        { error: "Client ID and meal plan name are required" },
        { status: 400 }
      )
    }

    // Get client details and verify it belongs to this dietitian
    const { data: client, error: clientError } = await supabase
      .from('clients')
      .select('id, name, email, status, dietitian_id')
      .eq('id', clientId)
      .eq('dietitian_id', dietitian.id)
      .single()

    if (clientError) {
      console.error("Client lookup error:", clientError)
      return NextResponse.json(
        { error: "Client lookup failed: " + clientError.message },
        { status: 404 }
      )
    }

    if (!client) {
      console.error("Client not found for ID:", clientId)
      return NextResponse.json(
        { error: "Client not found" },
        { status: 404 }
      )
    }

    // Check if client is not inactive
    if (client.status === 'inactive') {
      return NextResponse.json(
        { error: "Cannot send notification to inactive client" },
        { status: 400 }
      )
    }

    // Prepare email content
    const emailSubject = "Nouveau plan alimentaire disponible - NutriFlow"
    
    const emailContent = `
Bonjour ${client.name},

Votre nutritionniste ${dietitian.name} vient de vous partager un plan alimentaire.

📋 Plan : ${mealPlanName}

Connectez-vous à votre portail client pour télécharger et consulter votre nouveau plan alimentaire personnalisé.

Vous pouvez accéder à votre espace client pour consulter :
• Votre nouveau plan de repas personnalisé
• Vos recettes détaillées
• Vos conseils nutritionnels
• Votre suivi de progression

Bon appétit !

Cordialement,
L'équipe NutriFlow
`.trim()

    const emailHtml = `
<html>
<body style="font-family: Arial, sans-serif; color: #333; line-height: 1.6;">
  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
    <h2 style="color: #10b981;">Nouveau plan alimentaire disponible - NutriFlow</h2>
    <p>Bonjour ${client.name},</p>
    <p>Votre nutritionniste <strong>${dietitian.name}</strong> vient de vous partager un plan alimentaire.</p>
    
    <div style="background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin: 20px 0;">
      <h3 style="color: #1f2937; margin-top: 0;">📋 Nouveau plan disponible :</h3>
      <p style="margin: 10px 0;">
        <strong>Plan :</strong> <span style="color: #059669; font-weight: bold;">${mealPlanName}</span>
      </p>
    </div>
    
    <p style="color: #374151; font-size: 16px; margin: 20px 0;">
      Connectez-vous à votre portail client pour télécharger et consulter votre nouveau plan alimentaire personnalisé.
    </p>
    
    <div style="background-color: #ecfdf5; border: 1px solid #d1fae5; border-radius: 8px; padding: 15px; margin: 20px 0;">
      <h4 style="color: #047857; margin-top: 0;">Vous pouvez accéder à votre espace client pour consulter :</h4>
      <ul style="color: #065f46; margin: 0; padding-left: 20px;">
        <li>Votre nouveau plan de repas personnalisé</li>
        <li>Vos recettes détaillées</li>
        <li>Vos conseils nutritionnels</li>
        <li>Votre suivi de progression</li>
      </ul>
    </div>

    <p style="color: #059669; font-weight: bold; text-align: center; margin: 20px 0;">Bon appétit !</p>

    <p>Cordialement,<br>L'équipe NutriFlow</p>
  </div>
</body>
</html>
`

    // Send the notification
    const result = await smtpEmailService.sendEmail({
      to: client.email,
      subject: emailSubject,
      text: emailContent,
      html: emailHtml
    })

    if (!result) {
      return NextResponse.json(
        { error: "Failed to send meal plan notification email" },
        { status: 500 }
      )
    }

    return NextResponse.json({ 
      success: true,
      message: "Meal plan shared notification sent successfully"
    })
  } catch (error) {
    console.error("Error in meal plan shared API:", error)
    const errorMessage = error instanceof Error ? error.message : "Unknown error"
    return NextResponse.json(
      { error: "Internal server error: " + errorMessage },
      { status: 500 }
    )
  }
}