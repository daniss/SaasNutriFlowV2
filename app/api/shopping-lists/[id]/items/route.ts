import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { ShoppingListService } from "@/lib/shopping-list"

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const itemData = await request.json()
    
    // Verify ownership of the shopping list
    const shoppingList = await ShoppingListService.getShoppingList(params.id)
    if (!shoppingList || shoppingList.dietitian_id !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const item = await ShoppingListService.addItem(params.id, itemData)
    
    return NextResponse.json({ item }, { status: 201 })
  } catch (error) {
    console.error("Error adding shopping list item:", error)
    return NextResponse.json(
      { error: "Failed to add item" },
      { status: 500 }
    )
  }
}