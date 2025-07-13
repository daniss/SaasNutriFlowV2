import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { code, userId } = await request.json();

    // If no userId provided, try to get from authenticated session
    let targetUserId = userId;
    if (!targetUserId) {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();
      if (authError || !user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      targetUserId = user.id;
    }

    if (!code || code.length !== 6) {
      return NextResponse.json({ error: "Code invalide" }, { status: 400 });
    }

    // Use service role to verify code for any user (for pre-auth 2FA)
    const supabaseAdmin = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Verify code using database function
    const { data: isValid, error } = await supabaseAdmin.rpc(
      "verify_email_2fa_code",
      {
        p_user_id: targetUserId,
        p_code: code,
      }
    );

    if (error) {
      console.error("Error verifying 2FA code:", error);
      return NextResponse.json(
        { error: "Failed to verify code" },
        { status: 500 }
      );
    }

    if (isValid) {
      return NextResponse.json({
        success: true,
        message: "Code vérifié avec succès",
      });
    } else {
      return NextResponse.json(
        {
          error: "Code invalide ou expiré",
          success: false,
        },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error("Error in email 2FA verify API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
