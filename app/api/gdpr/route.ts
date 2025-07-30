import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const type = searchParams.get("type"); // 'consent', 'exports', 'retention', 'privacy'

    switch (type) {
      case "consent":
        const { data: consents } = await supabase
          .from("consent_records")
          .select(
            `
            *,
            client:clients(first_name, last_name)
          `
          )
          .eq("dietitian_id", user.id)
          .order("created_at", { ascending: false });

        return NextResponse.json({ data: consents });

      case "exports":
        const { data: exports } = await supabase
          .from("data_export_requests")
          .select(
            `
            *,
            client:clients(first_name, last_name)
          `
          )
          .eq("dietitian_id", user.id)
          .order("requested_at", { ascending: false });

        return NextResponse.json({ data: exports });

      case "retention":
        const { data: policies } = await supabase
          .from("data_retention_policies")
          .select("*")
          .eq("dietitian_id", user.id)
          .order("data_category");

        return NextResponse.json({ data: policies });

      case "privacy":
        const { data: privacyData } = await supabase
          .from("privacy_policy_versions")
          .select(
            `
            *,
            acceptances:privacy_policy_acceptances(
              id,
              accepted_at,
              client:clients(first_name, last_name)
            )
          `
          )
          .eq("is_current", true);

        return NextResponse.json({ data: privacyData });

      default:
        return NextResponse.json(
          { error: "Type non spécifié" },
          { status: 400 }
        );
    }
  } catch (error) {
    // TODO: Log GDPR API error to monitoring service;
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const body = await request.json();
    const { action, clientId, data: actionData } = body;

    switch (action) {
      case "create_export":
        const { data: exportRequest, error: exportError } = await supabase.rpc(
          "create_data_export_request",
          {
            p_dietitian_id: user.id,
            p_client_id: clientId,
            p_request_type: actionData?.type || "export",
          }
        );

        if (exportError) throw exportError;
        return NextResponse.json({ success: true, data: exportRequest });

      case "anonymize_client":
        const { data: anonymizeResult, error: anonymizeError } =
          await supabase.rpc("anonymize_client_data", {
            p_client_id: clientId,
            p_dietitian_id: user.id,
            p_anonymization_type: actionData?.type || "full",
          });

        if (anonymizeError) throw anonymizeError;
        return NextResponse.json({ success: true, data: anonymizeResult });

      case "update_consent":
        const { error: consentError } = await supabase
          .from("consent_records")
          .upsert({
            dietitian_id: user.id,
            client_id: clientId,
            consent_type: actionData.consentType,
            granted: actionData.granted,
            granted_at: actionData.granted ? new Date().toISOString() : null,
            withdrawn_at: !actionData.granted ? new Date().toISOString() : null,
            version: actionData.version || "1.0",
            purpose: actionData.purpose,
            legal_basis: actionData.legalBasis || "consent",
          });

        if (consentError) throw consentError;
        return NextResponse.json({ success: true });

      case "update_retention_policy":
        const { error: retentionError } = await supabase
          .from("data_retention_policies")
          .update({
            retention_period_years: actionData.years,
            auto_delete: actionData.autoDelete,
            description: actionData.description,
          })
          .eq("id", actionData.policyId)
          .eq("dietitian_id", user.id);

        if (retentionError) throw retentionError;
        return NextResponse.json({ success: true });

      default:
        return NextResponse.json(
          { error: "Action non reconnue" },
          { status: 400 }
        );
    }
  } catch (error) {
    // TODO: Log GDPR POST API error to monitoring service;
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
