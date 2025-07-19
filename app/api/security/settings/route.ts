import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user security settings
    const { data: security, error } = await supabase
      .from("user_security")
      .select("require_2fa_for_sensitive_actions")
      .eq("user_id", user.id)
      .single();

    if (error && error.code !== "PGRST116") {
      // Not found error
      console.error("Error fetching security settings:", error);
      return NextResponse.json(
        { error: "Failed to fetch settings" },
        { status: 500 }
      );
    }

    const settings = security || {
      require_2fa_for_sensitive_actions: false,
    };

    return NextResponse.json({ settings });
  } catch (error) {
    console.error("Error in settings API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const updates = await request.json();

    // Validate settings
    const allowedFields = ["require_2fa_for_sensitive_actions"];

    const filteredUpdates = Object.fromEntries(
      Object.entries(updates).filter(([key]) => allowedFields.includes(key))
    );

    if (Object.keys(filteredUpdates).length === 0) {
      return NextResponse.json(
        { error: "No valid fields to update" },
        { status: 400 }
      );
    }

    // Update or insert security settings
    const { error } = await supabase.from("user_security").upsert({
      user_id: user.id,
      ...filteredUpdates,
      updated_at: new Date().toISOString(),
    });

    if (error) {
      console.error("Error updating security settings:", error);
      return NextResponse.json(
        { error: "Failed to update settings" },
        { status: 500 }
      );
    }

    // Log security event
    await supabase.from("security_events").insert({
      user_id: user.id,
      event_type: "security_settings_updated",
      details: { updated_fields: Object.keys(filteredUpdates) },
      ip_address: request.headers.get("x-forwarded-for") || "unknown",
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in settings update API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
