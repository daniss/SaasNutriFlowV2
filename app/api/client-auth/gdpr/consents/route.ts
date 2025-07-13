import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    // Get client ID from URL params (similar to data API)
    const url = new URL(request.url);
    const clientId = url.searchParams.get("clientId");

    if (!clientId) {
      return NextResponse.json({ error: "Client ID requis" }, { status: 400 });
    }

    // Use service role to fetch client data (bypassing RLS like other client APIs)
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

    // Get consent records for this client
    const { data: consents, error: consentsError } = await supabase
      .from("consent_records")
      .select("*")
      .eq("client_id", clientId)
      .order("created_at", { ascending: false });

    if (consentsError) {
      console.error("Error fetching consents:", consentsError);
      return NextResponse.json(
        { error: "Erreur lors de la récupération des consentements" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      consents: consents || [],
    });
  } catch (error) {
    console.error("Error in client GDPR consents GET API:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { clientId, consents } = body;

    if (!clientId) {
      return NextResponse.json({ error: "Client ID requis" }, { status: 400 });
    }

    if (!consents || !Array.isArray(consents)) {
      return NextResponse.json(
        { error: "Données de consentement invalides" },
        { status: 400 }
      );
    }

    // Use service role to save consent data (bypassing RLS like other client APIs)
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

    // Get client information to find dietitian_id
    const { data: client, error: clientError } = await supabase
      .from("clients")
      .select("id, dietitian_id")
      .eq("id", clientId)
      .single();

    if (clientError || !client) {
      console.error("Error finding client:", clientError);
      return NextResponse.json({ error: "Client non trouvé" }, { status: 404 });
    }

    // Process each consent
    const results = [];
    for (const consent of consents) {
      const { consent_type, granted } = consent;

      if (!consent_type || typeof granted !== "boolean") {
        continue; // Skip invalid consent entries
      }

      // Check if consent record already exists
      const { data: existingConsent } = await supabase
        .from("consent_records")
        .select("id")
        .eq("client_id", clientId)
        .eq("consent_type", consent_type)
        .single();

      if (existingConsent) {
        // Update existing consent
        const { data: updatedConsent, error: updateError } = await supabase
          .from("consent_records")
          .update({
            granted,
            granted_at: granted ? new Date().toISOString() : null,
            withdrawn_at: !granted ? new Date().toISOString() : null,
            updated_at: new Date().toISOString(),
          })
          .eq("id", existingConsent.id)
          .select()
          .single();

        if (updateError) {
          console.error("Error updating consent:", updateError);
        } else {
          results.push(updatedConsent);
        }
      } else {
        // Create new consent record
        const { data: newConsent, error: insertError } = await supabase
          .from("consent_records")
          .insert({
            dietitian_id: client.dietitian_id,
            client_id: clientId,
            consent_type,
            granted,
            granted_at: granted ? new Date().toISOString() : null,
            withdrawn_at: !granted ? new Date().toISOString() : null,
            version: "1.0",
            purpose: getConsentPurpose(consent_type),
            legal_basis: "consent",
          })
          .select()
          .single();

        if (insertError) {
          console.error("Error creating consent:", insertError);
        } else {
          results.push(newConsent);
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: "Consentements mis à jour avec succès",
      consents: results,
    });
  } catch (error) {
    console.error("Error in client GDPR consents POST API:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// Helper function to get consent purpose description
function getConsentPurpose(consentType: string): string {
  const purposes = {
    data_processing:
      "Traitement des données personnelles pour la gestion du dossier nutritionnel",
    health_data:
      "Traitement des données de santé sensibles pour le suivi nutritionnel",
    photos: "Utilisation de photos corporelles pour le suivi de progression",
    marketing: "Communications marketing et newsletters",
    data_sharing:
      "Partage de données avec des tiers (laboratoires, professionnels de santé)",
  };
  return (
    purposes[consentType as keyof typeof purposes] ||
    "Consentement pour traitement de données"
  );
}
