import { comparePassword } from "@/lib/client-account-utils";
import { createClientToken } from "@/lib/client-auth-security";
import {
  checkRateLimit,
  clientLoginSchema,
  validateInput,
} from "@/lib/security-validation";
import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const clientIP =
      request.headers.get("x-forwarded-for") ||
      request.headers.get("x-real-ip") ||
      "unknown";
    const rateLimit = checkRateLimit(`login:${clientIP}`, 5, 15 * 60 * 1000); // 5 attempts per 15 minutes

    if (!rateLimit.success) {
      return NextResponse.json(
        { error: "Trop de tentatives de connexion. Réessayez plus tard." },
        { status: 429 }
      );
    }

    const body = await request.json();

    // Input validation
    const validation = await validateInput(body, clientLoginSchema);
    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const { email, password } = validation.data;

    // Use service role to bypass RLS for client authentication
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

    // Find the client account by email
    // TODO: Log authentication events to monitoring service

    // First, let's check what client accounts exist (for debugging)
    const { data: allAccounts, error: debugError } = await supabase
      .from("client_accounts")
      .select("id, email, is_active")
      .limit(10);


    const { data: clientAccount, error: accountError } = await supabase
      .from("client_accounts")
      .select(
        `
        id,
        client_id,
        email,
        password_hash,
        is_active,
        clients!inner (
          id,
          name,
          email,
          dietitian_id
        )
      `
      )
      .eq("email", email.toLowerCase())
      .eq("is_active", true)
      .single();


    if (accountError || !clientAccount) {
      // TODO: Log authentication failure to monitoring service
      return NextResponse.json(
        { error: "Email ou mot de passe incorrect" },
        { status: 401 }
      );
    }

    // Verify password using bcrypt
    const isPasswordValid = await comparePassword(password, clientAccount.password_hash);

    // Debug logging (without exposing sensitive data)

    if (!isPasswordValid) {
      return NextResponse.json(
        { error: "Email ou mot de passe incorrect" },
        { status: 401 }
      );
    }

    // Update last login
    await supabase
      .from("client_accounts")
      .update({ last_login: new Date().toISOString() })
      .eq("id", clientAccount.id);

    // Create secure authentication token
    const clientId = clientAccount.client_id;
    const secureToken = createClientToken(clientId, clientAccount.email);

    // Return client session data with secure token
    const clientData = {
      id: clientAccount.client_id,
      name: (clientAccount.clients as any)?.name,
      email: clientAccount.email,
      account_id: clientAccount.id,
    };

    return NextResponse.json({
      success: true,
      client: clientData,
      token: secureToken, // SECURITY FIX: Secure token instead of exposing client ID
      message: "Connexion réussie",
    });
  } catch (error) {
    // TODO: Log error to monitoring service
    return NextResponse.json(
      { error: "Erreur lors de la connexion" },
      { status: 500 }
    );
  }
}
