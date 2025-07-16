import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { ShoppingListService } from "@/lib/shopping-list"

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

    const shoppingList = await ShoppingListService.getShoppingList(params.id)
    
    if (!shoppingList) {
      return NextResponse.json({ error: "Shopping list not found" }, { status: 404 })
    }

    // Verify ownership
    if (shoppingList.dietitian_id !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }
    
    return NextResponse.json({ shoppingList })
  } catch (error) {
    console.error("Error fetching shopping list:", error)
    return NextResponse.json(
      { error: "Failed to fetch shopping list" },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const updates = await request.json()
    
    // Verify ownership first
    const existingList = await ShoppingListService.getShoppingList(params.id)
    if (!existingList || existingList.dietitian_id !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const shoppingList = await ShoppingListService.updateShoppingList(params.id, updates)
    
    return NextResponse.json({ shoppingList })
  } catch (error) {
    console.error("Error updating shopping list:", error)
    return NextResponse.json(
      { error: "Failed to update shopping list" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Verify ownership first
    const existingList = await ShoppingListService.getShoppingList(params.id)
    if (!existingList || existingList.dietitian_id !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    await ShoppingListService.deleteShoppingList(params.id)
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting shopping list:", error)
    return NextResponse.json(
      { error: "Failed to delete shopping list" },
      { status: 500 }
    )
  }
}