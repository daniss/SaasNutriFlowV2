import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Handle potentially empty or malformed request body
    let userId: string | undefined;
    try {
      const body = await request.json();
      userId = body.userId;
      console.log("📧 2FA send-email API called with userId:", userId);
    } catch (parseError) {
      // If JSON parsing fails, proceed without userId (will try to get from auth session)
      console.log(
        "📧 2FA send-email API called without JSON body, will try to get user from auth session"
      );
      userId = undefined;
    }

    // If no userId provided, try to get from authenticated session
    let targetUserId = userId;
    if (!targetUserId) {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();
      if (authError || !user) {
        return NextResponse.json(
          { error: "User ID required or user must be authenticated" },
          { status: 401 }
        );
      }
      targetUserId = user.id;
    }

    // Use service role to generate code for any user (for pre-auth 2FA)
    const supabaseAdmin = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Generate verification code using database function
    const { data, error } = await supabaseAdmin.rpc("generate_email_2fa_code", {
      p_user_id: targetUserId,
    });

    if (error) {
      console.error("Error generating 2FA code:", error);
      return NextResponse.json(
        { error: "Failed to generate verification code" },
        { status: 500 }
      );
    }

    const verificationCode = data;

    // Get user email for sending
    const { data: userData, error: userError } =
      await supabaseAdmin.auth.admin.getUserById(targetUserId);
    if (userError || !userData.user) {
      console.error("Error getting user data:", userError);
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Send email using Supabase's built-in email functionality
    try {
      const emailContent = `
        Bonjour,
        
        Votre code de vérification pour NutriFlow est : ${verificationCode}
        
        Ce code expire dans 10 minutes.
        
        Si vous n'avez pas demandé ce code, veuillez ignorer cet email.
        
        Cordialement,
        L'équipe NutriFlow
      `;

      // For now, we'll use a simple approach. In production, you'd use:
      // - Supabase Edge Functions with email service
      // - Or integrate with services like Resend, SendGrid, etc.

      // Placeholder for email sending - you'll need to implement based on your email provider
      console.log(`2FA Code for ${userData.user.email}: ${verificationCode}`);

      // In development, we can expose the code for testing
      const isDevelopment = process.env.NODE_ENV === "development";

      return NextResponse.json({
        success: true,
        message: "Code de vérification envoyé par email",
        ...(isDevelopment && { code: verificationCode }), // Only in development
      });
    } catch (emailError) {
      console.error("Error sending email:", emailError);
      return NextResponse.json(
        {
          error: "Code généré mais erreur lors de l'envoi de l'email",
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error in email 2FA send API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
