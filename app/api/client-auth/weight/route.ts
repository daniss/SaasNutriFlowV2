import { validateClientAuth } from "@/lib/client-auth-security";
import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    // SECURITY FIX: Use secure client authentication
    const authResult = await validateClientAuth(request);
    if ("error" in authResult) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.status }
      );
    }
    const { clientId } = authResult;

    const { weight, notes } = await request.json();

    if (!weight) {
      return NextResponse.json({ error: "Poids requis" }, { status: 400 });
    }

    // Use service role to add weight measurement
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

    // Add weight measurement
    const { data: weightEntry, error: weightError } = await supabase
      .from("weight_history")
      .insert({
        client_id: clientId,
        weight: parseFloat(weight),
        recorded_date: new Date().toISOString().split("T")[0],
        notes: notes || null,
      })
      .select()
      .single();

    if (weightError) {
      console.error("Error adding weight measurement:", weightError);
      return NextResponse.json(
        { error: "Erreur lors de l'ajout de la mesure" },
        { status: 500 }
      );
    }

    // Update client's current weight
    const { error: updateError } = await supabase
      .from("clients")
      .update({
        current_weight: parseFloat(weight),
        updated_at: new Date().toISOString(),
      })
      .eq("id", clientId);

    if (updateError) {
      console.error("Error updating client weight:", updateError);
      // Don't fail the request if updating current_weight fails
    }

    return NextResponse.json({
      success: true,
      data: {
        id: weightEntry.id,
        weight: weightEntry.weight,
        date: weightEntry.recorded_date,
        notes: weightEntry.notes,
      },
      message: "Poids ajouté avec succès",
    });
  } catch (error) {
    console.error("Weight tracking error:", error);
    return NextResponse.json(
      { error: "Erreur lors de l'ajout du poids" },
      { status: 500 }
    );
  }
}
