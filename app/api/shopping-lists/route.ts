import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { ShoppingListService } from "@/lib/shopping-list"

export async function GET(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const clientId = searchParams.get('client_id')
    const status = searchParams.get('status')
    const isTemplate = searchParams.get('is_template')

    const filters: any = {}
    if (clientId) filters.clientId = clientId
    if (status) filters.status = status
    if (isTemplate) filters.isTemplate = isTemplate === 'true'

    const shoppingLists = await ShoppingListService.getShoppingLists(user.id, filters)
    
    return NextResponse.json({ shoppingLists })
  } catch (error) {
    console.error("Error fetching shopping lists:", error)
    return NextResponse.json(
      { error: "Failed to fetch shopping lists" },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { type, ...listData } = body

    let shoppingList

    if (type === 'from_template') {
      shoppingList = await ShoppingListService.generateFromTemplate(
        user.id,
        listData.templateId,
        listData.options || {}
      )
    } else if (type === 'from_meal_plan') {
      shoppingList = await ShoppingListService.generateFromMealPlan(
        user.id,
        listData.mealPlanId,
        listData.options || {}
      )
    } else {
      shoppingList = await ShoppingListService.createShoppingList(user.id, listData)
    }
    
    return NextResponse.json({ shoppingList }, { status: 201 })
  } catch (error) {
    console.error("Error creating shopping list:", error)
    return NextResponse.json(
      { error: "Failed to create shopping list" },
      { status: 500 }
    )
  }
}