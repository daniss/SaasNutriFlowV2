import { validateClientSession } from "@/lib/client-auth-security";
import {
  authTokenSchema,
  checkRateLimit,
  validateInput,
} from "@/lib/security-validation";
import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    // Rate limiting by IP - more permissive for session validation
    const clientIP =
      request.headers.get("x-forwarded-for") ||
      request.headers.get("x-real-ip") ||
      "unknown";
    const rateLimit = checkRateLimit(`validate:${clientIP}`, 100, 60 * 1000); // 100 requests per minute

    if (!rateLimit.success) {
      return NextResponse.json(
        { error: "Trop de requêtes. Veuillez patienter." },
        { status: 429 }
      );
    }

    // SECURITY: Validate client session
    const authHeader = request.headers.get("authorization");

    // Input validation
    const validation = await validateInput({ authHeader }, authTokenSchema);
    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 401 });
    }

    const token = (validation.data as { authHeader: string }).authHeader.split(
      " "
    )[1];

    // Validate client token and get clientId from secure session
    const clientId = await validateClientSession(token);
    if (!clientId) {
      return NextResponse.json(
        { error: "Session client invalide" },
        { status: 401 }
      );
    }

    // Use service role to get basic client info
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

    // Get basic client info for session validation
    const { data: client, error: clientError } = await supabase
      .from("clients")
      .select("id, name, email")
      .eq("id", clientId)
      .single();

    if (clientError || !client) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      client: {
        id: client.id,
        name: client.name,
        email: client.email,
      },
    });
  } catch (error) {
    console.error("Client session validation error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
