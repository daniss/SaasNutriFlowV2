import { validateClientSession } from "@/lib/client-auth-security";
import {
  authTokenSchema,
  checkRateLimit,
  validateInput,
} from "@/lib/security-validation";
import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    // Rate limiting by IP
    const clientIP =
      request.headers.get("x-forwarded-for") ||
      request.headers.get("x-real-ip") ||
      "unknown";
    const rateLimit = checkRateLimit(`data:${clientIP}`, 50, 60 * 1000); // 50 requests per minute

    if (!rateLimit.success) {
      return NextResponse.json(
        { error: "Trop de requêtes. Veuillez patienter." },
        { status: 429 }
      );
    }

    // SECURITY FIX: Validate client session instead of accepting arbitrary clientId
    const authHeader = request.headers.get("authorization");

    // Input validation
    const validation = await validateInput({ authHeader }, authTokenSchema);
    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 401 });
    }

    const token = (validation.data as { authHeader: string }).authHeader.split(
      " "
    )[1];

    // Validate client token and get clientId from secure session
    const clientId = await validateClientSession(token);
    if (!clientId) {
      return NextResponse.json(
        { error: "Session client invalide" },
        { status: 401 }
      );
    }

    // Use service role to fetch client data
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

    // Fetch client profile with related data
    const { data: client, error: clientError } = await supabase
      .from("clients")
      .select(
        `
        id,
        name,
        email,
        phone,
        age,
        height,
        current_weight,
        goal_weight,
        goal,
        plan_type,
        status,
        notes,
        join_date,
        last_session,
        next_appointment,
        progress_percentage
      `
      )
      .eq("id", clientId)
      .single();

    if (clientError || !client) {
      return NextResponse.json({ error: "Client non trouvé" }, { status: 404 });
    }

    // Fetch current meal plan
    const { data: currentMealPlan, error: mealPlanError } = await supabase
      .from("meal_plans")
      .select(
        `
        id,
        name,
        description,
        plan_content,
        calories_range,
        duration_days,
        status,
        created_at
      `
      )
      .eq("client_id", clientId)
      .eq("status", "Active")
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    // Fetch weight history
    const { data: weightHistory, error: weightError } = await supabase
      .from("weight_history")
      .select("id, weight, recorded_date, notes")
      .eq("client_id", clientId)
      .order("recorded_date", { ascending: false })
      .limit(20);

    // Fetch upcoming appointments
    const { data: appointments, error: appointmentsError } = await supabase
      .from("appointments")
      .select(
        `
        id,
        title,
        description,
        appointment_date,
        appointment_time,
        duration_minutes,
        type,
        status,
        location,
        is_virtual,
        meeting_link,
        notes
      `
      )
      .eq("client_id", clientId)
      .gte("appointment_date", new Date().toISOString().split("T")[0])
      .order("appointment_date", { ascending: true })
      .limit(10);

    // Fetch recent messages from conversations
    const { data: conversation, error: conversationError } = await supabase
      .from("conversations")
      .select(
        `
        id,
        messages (
          id,
          sender_type,
          content,
          created_at,
          read_at
        )
      `
      )
      .eq("client_id", clientId)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    let conversationMessages: any[] = [];
    if (conversation && conversation.messages) {
      conversationMessages = conversation.messages
        .sort(
          (a: any, b: any) =>
            new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        )
        .slice(-20); // Get last 20 messages
    }

    // Calculate progress based on weight history
    const calculateProgress = (
      initialWeight: number,
      currentWeight: number,
      goalWeight: number
    ): number => {
      if (goalWeight < initialWeight) {
        // Weight loss goal
        const totalWeightToLose = initialWeight - goalWeight;
        const weightLost = Math.max(0, initialWeight - currentWeight);
        return Math.min(
          100,
          Math.round((weightLost / totalWeightToLose) * 100)
        );
      } else if (goalWeight > initialWeight) {
        // Weight gain goal
        const totalWeightToGain = goalWeight - initialWeight;
        const weightGained = Math.max(0, currentWeight - initialWeight);
        return Math.min(
          100,
          Math.round((weightGained / totalWeightToGain) * 100)
        );
      }
      return 0;
    };

    // Calculate actual progress if we have weight data
    let actualProgress = client.progress_percentage || 0;
    if (
      weightHistory &&
      weightHistory.length > 0 &&
      client.current_weight &&
      client.goal_weight
    ) {
      const initialWeight =
        weightHistory[weightHistory.length - 1]?.weight ||
        client.current_weight;
      actualProgress = calculateProgress(
        initialWeight,
        client.current_weight,
        client.goal_weight
      );
    }

    // Format response data
    const clientPortalData = {
      profile: {
        name: client.name,
        email: client.email,
        phone: client.phone,
        age: client.age,
        height: client.height,
        currentWeight: client.current_weight,
        goalWeight: client.goal_weight,
        goal: client.goal,
        planType: client.plan_type,
        joinDate: client.join_date,
        progress: actualProgress,
      },
      currentPlan: currentMealPlan
        ? {
            id: currentMealPlan.id,
            name: currentMealPlan.name,
            description: currentMealPlan.description,
            caloriesRange: currentMealPlan.calories_range,
            duration: currentMealPlan.duration_days,
            status: currentMealPlan.status,
            content: currentMealPlan.plan_content,
          }
        : null,
      weightHistory:
        weightHistory?.map((w) => ({
          date: w.recorded_date,
          weight: w.weight,
          notes: w.notes,
        })) || [],
      appointments:
        appointments?.map((a) => ({
          id: a.id,
          title: a.title,
          date: a.appointment_date,
          time: a.appointment_time,
          type: a.type,
          status: a.status,
          location: a.location,
          isVirtual: a.is_virtual,
          meetingLink: a.meeting_link,
          notes: a.notes,
        })) || [],
      messages:
        conversationMessages?.map((m: any) => ({
          id: m.id,
          content: m.content,
          sender: m.sender_type,
          timestamp: m.created_at,
          read: !!m.read_at,
        })) || [],
    };

    return NextResponse.json({
      success: true,
      data: clientPortalData,
    });
  } catch (error) {
    console.error("Client data fetch error:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des données" },
      { status: 500 }
    );
  }
}
