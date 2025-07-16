import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { PlanSchedulingService } from "@/lib/plan-scheduling"

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    
    const deliveries = await PlanSchedulingService.getDeliveries(params.id)
    
    return NextResponse.json({ deliveries })
  } catch (error) {
    console.error("Error fetching deliveries:", error)
    return NextResponse.json(
      { error: "Failed to fetch deliveries" },
      { status: 500 }
    )
  }
}