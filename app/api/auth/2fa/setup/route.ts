import { createClient } from "@supabase/supabase-js";
import * as crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";

// In a real implementation, you'd use a proper TOTP library like 'otpauth'
// For this example, we'll simulate the functionality
const generateSecret = (): string => {
  return crypto.randomBytes(20).toString("base64");
};

const generateBackupCodes = (): string[] => {
  const codes = [];
  for (let i = 0; i < 10; i++) {
    codes.push(crypto.randomInt(100000, 999999).toString());
  }
  return codes;
};

const generateQRCodeUrl = (secret: string, email: string): string => {
  const otpauth = `otpauth://totp/NutriFlow:${email}?secret=${secret}&issuer=NutriFlow`;
  // Return Google Charts QR code URL for simplicity
  return `https://chart.googleapis.com/chart?chs=200x200&chld=M|0&cht=qr&chl=${encodeURIComponent(
    otpauth
  )}`;
};

export async function POST(request: NextRequest) {
  try {
    // Get user from session
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

    // For this example, we'll extract user info from the request
    // In a real implementation, you'd get this from the session
    const authHeader = request.headers.get("authorization");
    if (!authHeader) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    // Mock user extraction - in real implementation, decode JWT
    const userId = "mock-user-id"; // This would come from JWT validation
    const userEmail = "user@example.com"; // This would come from JWT validation

    // Generate 2FA setup data
    const secret = generateSecret();
    const qrCode = generateQRCodeUrl(secret, userEmail);
    const backupCodes = generateBackupCodes();

    // Store the temporary setup in the database
    const { error: upsertError } = await supabase.from("user_security").upsert({
      user_id: userId,
      two_factor_secret: secret, // In production, encrypt this
      backup_codes: backupCodes, // In production, encrypt these
      backup_codes_count: backupCodes.length,
      two_factor_enabled: false, // Will be enabled after verification
      updated_at: new Date().toISOString(),
    });

    if (upsertError) {
      throw upsertError;
    }

    // Log security event
    await supabase.rpc("log_security_event", {
      p_user_id: userId,
      p_event_type: "2fa_setup_initiated",
      p_description: "User initiated 2FA setup",
      p_severity: "info",
    });

    return NextResponse.json({
      success: true,
      setup: {
        secret,
        qrCode,
        backupCodes,
      },
    });
  } catch (error) {
    console.error("2FA setup error:", error);
    return NextResponse.json(
      { error: "Erreur lors de la configuration 2FA" },
      { status: 500 }
    );
  }
}
