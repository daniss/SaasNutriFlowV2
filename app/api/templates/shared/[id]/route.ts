import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

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

    const { data: template, error } = await supabase
      .from('shared_templates')
      .select(`
        id,
        template_id,
        template_type,
        author_id,
        title,
        description,
        category,
        tags,
        difficulty,
        prep_time,
        servings,
        nutritional_info,
        sharing_level,
        price_credits,
        download_count,
        rating_average,
        rating_count,
        is_featured,
        metadata,
        created_at,
        updated_at,
        dietitians!shared_templates_author_id_fkey (
          id,
          first_name,
          last_name,
          practice_name,
          bio,
          specializations
        )
      `)
      .eq('id', params.id)
      .eq('is_approved', true)
      .single()

    if (error) {
      return NextResponse.json({ error: "Template not found" }, { status: 404 })
    }

    // Get recent reviews
    const { data: reviews } = await supabase
      .from('template_reviews')
      .select(`
        id,
        rating,
        review_text,
        is_verified_purchase,
        created_at,
        dietitians!template_reviews_reviewer_id_fkey (
          first_name,
          last_name,
          practice_name
        )
      `)
      .eq('shared_template_id', params.id)
      .order('created_at', { ascending: false })
      .limit(10)

    return NextResponse.json({
      template,
      reviews: reviews || []
    })
  } catch (error) {
    console.error("Error fetching shared template:", error)
    return NextResponse.json(
      { error: "Failed to fetch template" },
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

    // Get dietitian profile
    const { data: dietitian, error: dietitianError } = await supabase
      .from('dietitians')
      .select('id')
      .eq('auth_user_id', user.id)
      .single()

    if (dietitianError || !dietitian) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const updateData = await request.json()

    // Update shared template (only if user is the author)
    const { data: template, error } = await supabase
      .from('shared_templates')
      .update({
        ...updateData,
        updated_at: new Date().toISOString()
      })
      .eq('id', params.id)
      .eq('author_id', dietitian.id)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: "Template not found or unauthorized" }, { status: 404 })
    }

    return NextResponse.json({ template })
  } catch (error) {
    console.error("Error updating shared template:", error)
    return NextResponse.json(
      { error: "Failed to update template" },
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

    // Get dietitian profile
    const { data: dietitian, error: dietitianError } = await supabase
      .from('dietitians')
      .select('id')
      .eq('auth_user_id', user.id)
      .single()

    if (dietitianError || !dietitian) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Delete shared template (only if user is the author)
    const { error } = await supabase
      .from('shared_templates')
      .delete()
      .eq('id', params.id)
      .eq('author_id', dietitian.id)

    if (error) {
      return NextResponse.json({ error: "Template not found or unauthorized" }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting shared template:", error)
    return NextResponse.json(
      { error: "Failed to delete template" },
      { status: 500 }
    )
  }
}