import { NextRequest, NextResponse } from "next/server"
import { notificationService } from "@/lib/notification-service"
import { createClient } from "@/lib/supabase/server"
import bcryptjs from 'bcryptjs'

// Generate a simple temporary password
function generateTemporaryPassword(): string {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  let password = '';
  for (let i = 0; i < 8; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}

export async function POST(request: NextRequest) {
  try {
    // Authentication check
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    // Get dietitian profile to verify user is a dietitian
    const { data: dietitian, error: dietitianError } = await supabase
      .from('dietitians')
      .select('id, name')
      .eq('auth_user_id', user.id)
      .single()

    if (dietitianError || !dietitian) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { clientId } = body

    if (!clientId) {
      return NextResponse.json(
        { error: "Client ID is required" },
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

    if (clientError || !client) {
      return NextResponse.json(
        { error: "Client not found" },
        { status: 404 }
      )
    }

    // Check if client is not inactive
    if (client.status === 'inactive') {
      return NextResponse.json(
        { error: "Cannot send password to inactive client" },
        { status: 400 }
      )
    }

    // Check if client has an active account
    const { data: clientAccount, error: accountError } = await supabase
      .from('client_accounts')
      .select('id, email, is_active')
      .eq('client_id', clientId)
      .single()

    if (accountError || !clientAccount) {
      return NextResponse.json(
        { error: "Client account not found. Please create a client account first." },
        { status: 404 }
      )
    }

    if (!clientAccount.is_active) {
      return NextResponse.json(
        { error: "Client account is inactive" },
        { status: 400 }
      )
    }

    // Generate new temporary password
    const newTempPassword = generateTemporaryPassword()
    const saltRounds = 12
    const hashedPassword = await bcryptjs.hash(newTempPassword, saltRounds)

    // Update the client account with new password
    const { error: updateError } = await supabase
      .from('client_accounts')
      .update({
        password_hash: hashedPassword,
        updated_at: new Date().toISOString()
      })
      .eq('client_id', clientId)

    if (updateError) {
      console.error('Error updating client password:', updateError)
      return NextResponse.json(
        { error: "Failed to update password" },
        { status: 500 }
      )
    }

    // Prepare email content
    const emailContent = `
Bonjour ${client.name},

Votre nutritionniste ${dietitian.name} vous a envoyé un nouveau mot de passe pour accéder à votre portail client NutriFlow.

Vos identifiants de connexion :
📧 Email : ${clientAccount.email}
🔑 Nouveau mot de passe : ${newTempPassword}

Pour des raisons de sécurité, nous vous recommandons de changer votre mot de passe lors de votre prochaine connexion.

Connectez-vous à votre espace client pour consulter :
• Vos plans de repas personnalisés
• Votre progression
• Vos messages avec votre nutritionniste
• Vos factures et rendez-vous

Cordialement,
L'équipe NutriFlow
`.trim()

    const emailHtml = `
<html>
<body style="font-family: Arial, sans-serif; color: #333; line-height: 1.6;">
  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
    <h2 style="color: #10b981;">Nouveau mot de passe - NutriFlow</h2>
    <p>Bonjour ${client.name},</p>
    <p>Votre nutritionniste <strong>${dietitian.name}</strong> vous a envoyé un nouveau mot de passe pour accéder à votre portail client NutriFlow.</p>
    
    <div style="background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin: 20px 0;">
      <h3 style="color: #1f2937; margin-top: 0;">Vos identifiants de connexion :</h3>
      <p style="margin: 10px 0;">
        <strong>📧 Email :</strong> <code style="background-color: #e5e7eb; padding: 2px 6px; border-radius: 4px;">${clientAccount.email}</code>
      </p>
      <p style="margin: 10px 0;">
        <strong>🔑 Nouveau mot de passe :</strong> <code style="background-color: #e5e7eb; padding: 2px 6px; border-radius: 4px;">${newTempPassword}</code>
      </p>
    </div>
    
    <p style="color: #6b7280; font-size: 14px;">
      Pour des raisons de sécurité, nous vous recommandons de changer votre mot de passe lors de votre prochaine connexion.
    </p>
    
    <div style="background-color: #ecfdf5; border: 1px solid #d1fae5; border-radius: 8px; padding: 15px; margin: 20px 0;">
      <h4 style="color: #047857; margin-top: 0;">Connectez-vous pour consulter :</h4>
      <ul style="color: #065f46; margin: 0; padding-left: 20px;">
        <li>Vos plans de repas personnalisés</li>
        <li>Votre progression</li>
        <li>Vos messages avec votre nutritionniste</li>
        <li>Vos factures et rendez-vous</li>
      </ul>
    </div>

    <p>Cordialement,<br>L'équipe NutriFlow</p>
  </div>
</body>
</html>
`

    // Send the notification
    const result = await notificationService.sendEmail(
      clientAccount.email,
      "Nouveau mot de passe - NutriFlow",
      emailContent,
      emailHtml
    )

    if (!result) {
      return NextResponse.json(
        { error: "Failed to send password email" },
        { status: 500 }
      )
    }

    return NextResponse.json({ 
      success: true,
      message: "Password sent successfully"
    })
  } catch (error) {
    console.error("Error in send password API:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}