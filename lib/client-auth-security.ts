/**
 * Secure client authentication utilities
 * Replaces the vulnerable clientId parameter approach
 */

import { createClient } from "@supabase/supabase-js";
import { createHmac } from "crypto";

const SECRET_KEY = process.env.CLIENT_AUTH_SECRET;

if (!SECRET_KEY) {
  throw new Error(
    "CLIENT_AUTH_SECRET environment variable must be configured. " +
    "Generate a secure random string and set it in your .env file."
  );
}

export interface ClientSession {
  clientId: string;
  email: string;
  expiresAt: number;
}

/**
 * Creates a secure token for client authentication
 */
function createSecureToken(data: ClientSession): string {
  const payload = JSON.stringify(data);
  const signature = createHmac("sha256", SECRET_KEY!)
    .update(payload)
    .digest("hex");
  const token = Buffer.from(JSON.stringify({ payload, signature })).toString(
    "base64"
  );
  return token;
}

/**
 * Validates a secure token and returns the session data
 */
function validateSecureToken(token: string): ClientSession | null {
  try {
    const decoded = JSON.parse(Buffer.from(token, "base64").toString());
    const { payload, signature } = decoded;

    // Verify signature
    const expectedSignature = createHmac("sha256", SECRET_KEY!)
      .update(payload)
      .digest("hex");
    if (signature !== expectedSignature) {
      return null;
    }

    const sessionData: ClientSession = JSON.parse(payload);

    // Check expiration
    if (Date.now() > sessionData.expiresAt) {
      return null;
    }

    return sessionData;
  } catch {
    return null;
  }
}

/**
 * Validates a client session token and returns the clientId
 * @param token Secure token from Authorization header
 * @returns clientId if valid, null if invalid
 */
export async function validateClientSession(
  token: string
): Promise<string | null> {
  try {
    const sessionData = validateSecureToken(token);
    if (!sessionData) {
      return null;
    }

    // Verify client still exists and is active
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

    const { data: clientAccount } = await supabase
      .from("client_accounts")
      .select("client_id, is_active")
      .eq("client_id", sessionData.clientId)
      .eq("is_active", true)
      .single();

    return clientAccount ? sessionData.clientId : null;
  } catch (error) {
    console.error("Client session validation error:", error);
    return null;
  }
}

/**
 * Creates a secure token for client authentication
 * @param clientId Client ID
 * @param email Client email
 * @returns Secure token
 */
export function createClientToken(clientId: string, email: string): string {
  const expiresAt = Date.now() + 24 * 60 * 60 * 1000; // 24 hours

  const sessionData: ClientSession = {
    clientId,
    email,
    expiresAt,
  };

  return createSecureToken(sessionData);
}

/**
 * Middleware to validate client authentication
 */
export async function validateClientAuth(
  request: Request
): Promise<{ clientId: string } | { error: string; status: number }> {
  const authHeader = request.headers.get("authorization");

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return { error: "Token d'authentification requis", status: 401 };
  }

  const token = authHeader.split(" ")[1];
  const clientId = await validateClientSession(token);

  if (!clientId) {
    return { error: "Session client invalide", status: 401 };
  }

  return { clientId };
}
