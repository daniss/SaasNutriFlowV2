import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { ShoppingListService } from "@/lib/shopping-list"

export async function PUT(
  request: Request,
  { params }: { params: { id: string; itemId: string } }
) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const updates = await request.json()
    
    // Verify ownership of the shopping list
    const shoppingList = await ShoppingListService.getShoppingList(params.id)
    if (!shoppingList || shoppingList.dietitian_id !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const item = await ShoppingListService.updateItem(params.itemId, updates)
    
    return NextResponse.json({ item })
  } catch (error) {
    console.error("Error updating shopping list item:", error)
    return NextResponse.json(
      { error: "Failed to update item" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string; itemId: string } }
) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Verify ownership of the shopping list
    const shoppingList = await ShoppingListService.getShoppingList(params.id)
    if (!shoppingList || shoppingList.dietitian_id !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    await ShoppingListService.deleteItem(params.itemId)
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting shopping list item:", error)
    return NextResponse.json(
      { error: "Failed to delete item" },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string; itemId: string } }
) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Verify ownership of the shopping list
    const shoppingList = await ShoppingListService.getShoppingList(params.id)
    if (!shoppingList || shoppingList.dietitian_id !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const item = await ShoppingListService.toggleItemPurchased(params.itemId)
    
    return NextResponse.json({ item })
  } catch (error) {
    console.error("Error toggling item purchase status:", error)
    return NextResponse.json(
      { error: "Failed to toggle item" },
      { status: 500 }
    )
  }
}