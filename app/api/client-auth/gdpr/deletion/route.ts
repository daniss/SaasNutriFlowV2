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

    // Create deletion request
    const { data: deletionRequest, error } = await supabase
      .from("data_export_requests")
      .insert({
        dietitian_id: (clientAccount.client as any).dietitian_id,
        client_id: clientAccount.client_id,
        requested_by: "client",
        request_type: "deletion",
        status: "pending",
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
            type: "data_deletion",
            clientName: `${(clientAccount.client as any).first_name} ${
              (clientAccount.client as any).last_name
            }`,
            clientEmail: (clientAccount.client as any).email,
            requestId: deletionRequest.id,
            urgent: true,
          }),
        }
      );
    } catch (emailError) {
      // TODO: Log error to monitoring service
      // Don't fail the request if email fails
    }

    return NextResponse.json({
      success: true,
      requestId: deletionRequest.id,
      message:
        "Votre demande de suppression a été envoyée. Un responsable vous contactera sous 48h.",
    });
  } catch (error) {
    // TODO: Log error to monitoring service
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
