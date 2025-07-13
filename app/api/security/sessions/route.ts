import { checkRateLimit } from "@/lib/security-validation";
import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    // Rate limiting by IP
    const clientIP =
      request.headers.get("x-forwarded-for") ||
      request.headers.get("x-real-ip") ||
      "unknown";
    const rateLimit = checkRateLimit(`sessions:${clientIP}`, 20, 60 * 1000); // 20 requests per minute

    if (!rateLimit.success) {
      return NextResponse.json(
        { error: "Trop de requêtes de sessions. Veuillez patienter." },
        { status: 429 }
      );
    }

    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get current sessions for the user
    const { data: sessions, error } = await supabase
      .from("user_sessions")
      .select("*")
      .eq("user_id", user.id)
      .eq("is_active", true)
      .order("last_activity", { ascending: false });

    if (error) {
      console.error("Error fetching sessions:", error);
      return NextResponse.json(
        { error: "Failed to fetch sessions" },
        { status: 500 }
      );
    }

    // Get current session ID from the request (you might need to implement session tracking)
    const currentSessionId = "current"; // This would be obtained from your session tracking

    const formattedSessions = sessions.map((session) => ({
      id: session.id,
      device_info: session.device_info || {
        type: "desktop",
        name: "Unknown Device",
      },
      location: session.location_info,
      created_at: session.created_at,
      last_activity: session.last_activity,
      is_current: session.id === currentSessionId,
    }));

    return NextResponse.json({ sessions: formattedSessions });
  } catch (error) {
    console.error("Error in sessions API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { action } = await request.json();

    if (action === "revoke-all") {
      // Revoke all other sessions except current
      const currentSessionId = "current"; // This would be obtained from your session tracking

      const { error } = await supabase
        .from("user_sessions")
        .update({ is_active: false, ended_at: new Date().toISOString() })
        .eq("user_id", user.id)
        .neq("id", currentSessionId);

      if (error) {
        console.error("Error revoking sessions:", error);
        return NextResponse.json(
          { error: "Failed to revoke sessions" },
          { status: 500 }
        );
      }

      // Log security event
      await supabase.from("security_events").insert({
        user_id: user.id,
        event_type: "sessions_revoked",
        details: { action: "revoke_all_other_sessions" },
        ip_address: request.headers.get("x-forwarded-for") || "unknown",
      });

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Error in sessions API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
