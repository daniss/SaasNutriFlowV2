import { NextRequest, NextResponse } from "next/server";
import { validateClientAuth } from "./client-auth-security";
import { checkRateLimit } from "./security-validation";

/**
 * Middleware for protecting client authentication routes
 * This middleware validates client tokens and applies rate limiting
 */
export async function withClientAuth(
  request: NextRequest,
  handler: (request: NextRequest, clientId: string) => Promise<NextResponse>,
  options: {
    rateLimit?: {
      key: string;
      maxRequests: number;
      windowMs: number;
    };
  } = {}
): Promise<NextResponse> {
  try {
    // Apply rate limiting if configured
    if (options.rateLimit) {
      const clientIP =
        request.headers.get("x-forwarded-for") ||
        request.headers.get("x-real-ip") ||
        "unknown";

      const rateLimit = checkRateLimit(
        `${options.rateLimit.key}:${clientIP}`,
        options.rateLimit.maxRequests,
        options.rateLimit.windowMs
      );

      if (!rateLimit.success) {
        return NextResponse.json(
          { error: "Trop de requêtes. Veuillez patienter." },
          { status: 429 }
        );
      }
    }

    // Validate client authentication
    const authResult = await validateClientAuth(request);
    if ("error" in authResult) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.status }
      );
    }

    // Call the actual handler with the authenticated client ID
    return await handler(request, authResult.clientId);
  } catch (error) {
    console.error("Client auth middleware error:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}

/**
 * Higher-order function to wrap API route handlers with client authentication
 */
export function protectClientRoute(
  handler: (request: NextRequest, clientId: string) => Promise<NextResponse>,
  options?: {
    rateLimit?: {
      key: string;
      maxRequests: number;
      windowMs: number;
    };
  }
) {
  return async (request: NextRequest) => {
    return withClientAuth(request, handler, options);
  };
}

/**
 * Predefined rate limiting configurations for different endpoint types
 */
export const rateLimitConfigs = {
  login: {
    key: "login",
    maxRequests: 5,
    windowMs: 15 * 60 * 1000, // 15 minutes
  },
  data: {
    key: "data",
    maxRequests: 30,
    windowMs: 60 * 1000, // 1 minute
  },
  documents: {
    key: "documents",
    maxRequests: 20,
    windowMs: 60 * 1000, // 1 minute
  },
  messaging: {
    key: "messaging",
    maxRequests: 10,
    windowMs: 60 * 1000, // 1 minute
  },
  gdpr: {
    key: "gdpr",
    maxRequests: 5,
    windowMs: 60 * 1000, // 1 minute
  },
};
