import { createClient } from "@/lib/supabase/client";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();

    // Get client from session
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    // Get client account and dietitian
    const { data: clientAccount } = await supabase
      .from("client_accounts")
      .select(
        `
        client_id,
        client:clients(first_name, last_name, email, dietitian_id)
      `
      )
      .eq("id", session.user.id)
      .single();

    if (!clientAccount?.client) {
      return NextResponse.json(
        { error: "Compte client non trouvé" },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { requestType } = body;

    // Create export request
    const { data: exportRequest, error } = await supabase
      .from("data_export_requests")
      .insert({
        dietitian_id: (clientAccount.client as any).dietitian_id,
        client_id: clientAccount.client_id,
        requested_by: "client",
        request_type: requestType || "export",
        status: "pending",
        expires_at: new Date(
          Date.now() + 7 * 24 * 60 * 60 * 1000
        ).toISOString(), // 7 days
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    // Send email notification to admin
    try {
      await fetch(
        `${process.env.NEXT_PUBLIC_APP_URL}/api/notifications/gdpr-request`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: "data_export",
            clientName: `${(clientAccount.client as any).first_name} ${
              (clientAccount.client as any).last_name
            }`,
            clientEmail: (clientAccount.client as any).email,
            requestId: exportRequest.id,
            requestType,
          }),
        }
      );
    } catch (emailError) {
      console.error("Failed to send notification email:", emailError);
      // Don't fail the request if email fails
    }

    return NextResponse.json({
      success: true,
      requestId: exportRequest.id,
      message: "Votre demande a été envoyée. Vous recevrez un email sous 48h.",
    });
  } catch (error) {
    console.error("Error in client GDPR export API:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
