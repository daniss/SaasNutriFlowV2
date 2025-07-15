import { NextRequest, NextResponse } from "next/server"
import { notificationService } from "@/lib/notification-service"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { clientEmail, mealPlanName, dietitianName } = body

    if (!clientEmail || !mealPlanName || !dietitianName) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    // Send the notification
    const result = await notificationService.sendMealPlanNotification(
      clientEmail,
      {
        name: mealPlanName,
        dietitianName: dietitianName
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