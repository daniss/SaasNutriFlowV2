import {
  checkRateLimit,
  emailCheckSchema,
  validateInput,
} from "@/lib/security-validation";
import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

// Use service role key for admin operations
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    // Rate limiting by IP
    const clientIP =
      request.headers.get("x-forwarded-for") ||
      request.headers.get("x-real-ip") ||
      "unknown";
    const rateLimit = checkRateLimit(`check-user:${clientIP}`, 10, 60 * 1000); // 10 requests per minute

    if (!rateLimit.success) {
      return NextResponse.json(
        { error: "Trop de vérifications d'utilisateur. Veuillez patienter." },
        { status: 429 }
      );
    }

    const body = await request.json();

    // Input validation
    const validation = await validateInput(
      { email: body.email },
      emailCheckSchema
    );
    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const { email } = validation.data as { email: string };

    // Check if user exists in the profiles table
    const { data, error } = await supabase
      .from("profiles")
      .select("email")
      .eq("email", email)
      .maybeSingle();

    if (error) {
      console.error("Error checking user in profiles:", error);
      // If there's an error, still try to check auth users
    }

    // If found in profiles, user exists
    if (data) {
      return NextResponse.json({ exists: true });
    }

    // Fallback: check auth users with admin API
    const { data: authUsers, error: authError } =
      await supabase.auth.admin.listUsers();

    if (authError) {
      console.error("Error checking auth users:", authError);
      return NextResponse.json(
        { error: "Failed to check user" },
        { status: 500 }
      );
    }

    // Check if any user has this email
    const exists = authUsers.users.some((user) => user.email === email);

    return NextResponse.json({ exists });
  } catch (error) {
    console.error("Error in check-user API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
