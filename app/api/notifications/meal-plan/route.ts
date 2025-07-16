import { NextRequest, NextResponse } from "next/server"
import { notificationService } from "@/lib/notification-service"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    // Authentication check
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    // Get dietitian profile to verify user is a dietitian
    const { data: dietitian, error: dietitianError } = await supabase
      .from('dietitians')
      .select('id, name')
      .eq('auth_user_id', user.id)
      .single()

    if (dietitianError || !dietitian) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { clientEmail, mealPlanName } = body

    if (!clientEmail || !mealPlanName) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    // Send the notification using authenticated dietitian's name
    const result = await notificationService.sendMealPlanNotification(
      clientEmail,
      {
        name: mealPlanName,
        dietitianName: dietitian.name
      }
    )

    if (!result) {
      return NextResponse.json(
        { error: "Failed to send notification" },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error in meal plan notification API:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}