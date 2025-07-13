import { checkRateLimit } from "@/lib/security-validation";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    // Rate limiting by IP
    const clientIP =
      request.headers.get("x-forwarded-for") ||
      request.headers.get("x-real-ip") ||
      "unknown";
    const rateLimit = checkRateLimit(`logout:${clientIP}`, 10, 60 * 1000); // 10 requests per minute

    if (!rateLimit.success) {
      return NextResponse.json(
        { error: "Trop de requêtes. Veuillez patienter." },
        { status: 429 }
      );
    }

    // Create response to clear the client session
    const response = NextResponse.json({
      success: true,
      message: "Déconnexion réussie",
    });

    // Clear client session cookie (we'll implement this cookie in the next step)
    response.cookies.set("client-session", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 0, // Expire immediately
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Client logout error:", error);
    return NextResponse.json(
      { error: "Erreur lors de la déconnexion" },
      { status: 500 }
    );
  }
}
