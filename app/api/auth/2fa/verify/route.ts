import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

// Simple TOTP verification simulation
// In production, use a proper library like 'otpauth' or 'speakeasy'
const verifyTOTP = (token: string, secret: string): boolean => {
  // Mock verification - in real implementation, this would verify the TOTP
  // For demo purposes, accept tokens that are 6 digits
  return /^\d{6}$/.test(token);
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token, secret } = body;

    if (!token || !secret) {
      return NextResponse.json(
        { error: "Token et secret requis" },
        { status: 400 }
      );
    }

    // Verify the TOTP token
    const isValid = verifyTOTP(token, secret);

    if (!isValid) {
      return NextResponse.json({ error: "Code invalide" }, { status: 400 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    // Mock user ID - in real implementation, get from JWT
    const userId = "mock-user-id";

    // Enable 2FA for the user
    const { error: updateError } = await supabase
      .from("user_security")
      .update({
        two_factor_enabled: true,
        last_2fa_used: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", userId);

    if (updateError) {
      throw updateError;
    }

    // Log security event
    await supabase.rpc("log_security_event", {
      p_user_id: userId,
      p_event_type: "2fa_enabled",
      p_description: "User successfully enabled 2FA",
      p_severity: "info",
    });

    return NextResponse.json({
      success: true,
      message: "2FA activé avec succès",
    });
  } catch (error) {
    console.error("2FA verification error:", error);
    return NextResponse.json(
      { error: "Erreur lors de la vérification 2FA" },
      { status: 500 }
    );
  }
}
