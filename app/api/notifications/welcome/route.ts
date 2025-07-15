import { NextRequest, NextResponse } from "next/server"
import { notificationService } from "@/lib/notification-service"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { clientEmail, clientName, dietitianName, accountEmail, tempPassword } = body

    if (!clientEmail || !clientName || !dietitianName) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    let emailContent = `
Bonjour ${clientName},

Bienvenue sur NutriFlow ! Vous avez été ajouté(e) comme client(e) de ${dietitianName}.

Grâce à cette plateforme, vous pourrez :
• Consulter vos plans de repas personnalisés
• Suivre votre progression
• Communiquer avec votre nutritionniste
• Accéder à vos factures et rendez-vous
`.trim()

    let emailHtml = `
<html>
<body style="font-family: Arial, sans-serif; color: #333; line-height: 1.6;">
  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
    <h2 style="color: #10b981;">Bienvenue sur NutriFlow !</h2>
    <p>Bonjour ${clientName},</p>
    <p>Vous avez été ajouté(e) comme client(e) de <strong>${dietitianName}</strong>.</p>
    
    <p>Grâce à cette plateforme, vous pourrez :</p>
    <ul>
      <li>Consulter vos plans de repas personnalisés</li>
      <li>Suivre votre progression</li>
      <li>Communiquer avec votre nutritionniste</li>
      <li>Accéder à vos factures et rendez-vous</li>
    </ul>
`.trim()

    // If client account was created, add login credentials
    if (accountEmail && tempPassword) {
      emailContent += `

Vos identifiants de connexion :
📧 Email : ${accountEmail}
🔑 Mot de passe temporaire : ${tempPassword}

Pour des raisons de sécurité, nous vous recommandons de changer votre mot de passe lors de votre première connexion.
`

      emailHtml += `
    <div style="background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin: 20px 0;">
      <h3 style="color: #1f2937; margin-top: 0;">Vos identifiants de connexion :</h3>
      <p style="margin: 10px 0;">
        <strong>📧 Email :</strong> <code style="background-color: #e5e7eb; padding: 2px 6px; border-radius: 4px;">${accountEmail}</code>
      </p>
      <p style="margin: 10px 0;">
        <strong>🔑 Mot de passe temporaire :</strong> <code style="background-color: #e5e7eb; padding: 2px 6px; border-radius: 4px;">${tempPassword}</code>
      </p>
    </div>
    <p style="color: #6b7280; font-size: 14px;">
      Pour des raisons de sécurité, nous vous recommandons de changer votre mot de passe lors de votre première connexion.
    </p>
`
    }

    emailContent += `

Cordialement,
L'équipe NutriFlow
`

    emailHtml += `
    <p>Cordialement,<br>L'équipe NutriFlow</p>
  </div>
</body>
</html>
`

    // Send the notification
    const result = await notificationService.sendEmail(
      clientEmail,
      "Bienvenue sur NutriFlow !",
      emailContent,
      emailHtml
    )

    if (!result) {
      return NextResponse.json(
        { error: "Failed to send notification" },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error in welcome notification API:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}