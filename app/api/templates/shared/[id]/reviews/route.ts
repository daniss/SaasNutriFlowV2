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

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const offset = (page - 1) * limit

    const { data: reviews, error } = await supabase
      .from('template_reviews')
      .select(`
        id,
        rating,
        review_text,
        is_verified_purchase,
        helpfulness_score,
        created_at,
        updated_at,
        dietitians!template_reviews_reviewer_id_fkey (
          first_name,
          last_name,
          practice_name
        )
      `)
      .eq('shared_template_id', params.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) throw error

    // Get total count
    const { count } = await supabase
      .from('template_reviews')
      .select('*', { count: 'exact', head: true })
      .eq('shared_template_id', params.id)

    return NextResponse.json({
      reviews: reviews || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      }
    })
  } catch (error) {
    // TODO: Log API error to monitoring service
    return NextResponse.json(
      { error: "Failed to fetch reviews" },
      { status: 500 }
    )
  }
}

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

    // Get dietitian profile
    const { data: dietitian, error: dietitianError } = await supabase
      .from('dietitians')
      .select('id')
      .eq('auth_user_id', user.id)
      .single()

    if (dietitianError || !dietitian) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { rating, review_text } = await request.json()

    // Validate rating
    if (!rating || rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: "Rating must be between 1 and 5" },
        { status: 400 }
      )
    }

    // Check if template exists
    const { data: template, error: templateError } = await supabase
      .from('shared_templates')
      .select('id, author_id')
      .eq('id', params.id)
      .single()

    if (templateError || !template) {
      return NextResponse.json({ error: "Template not found" }, { status: 404 })
    }

    // Check if user is the author (can't review own template)
    if (template.author_id === dietitian.id) {
      return NextResponse.json({ error: "Cannot review your own template" }, { status: 400 })
    }

    // Check if user has purchased the template
    const { data: purchase } = await supabase
      .from('template_purchases')
      .select('id')
      .eq('shared_template_id', params.id)
      .eq('buyer_id', dietitian.id)
      .single()

    const isVerifiedPurchase = !!purchase

    // Create review
    const { data: review, error: reviewError } = await supabase
      .from('template_reviews')
      .insert({
        shared_template_id: params.id,
        reviewer_id: dietitian.id,
        rating,
        review_text,
        is_verified_purchase: isVerifiedPurchase
      })
      .select(`
        id,
        rating,
        review_text,
        is_verified_purchase,
        helpfulness_score,
        created_at,
        dietitians!template_reviews_reviewer_id_fkey (
          first_name,
          last_name,
          practice_name
        )
      `)
      .single()

    if (reviewError) {
      // Handle duplicate review error
      if (reviewError.code === '23505') {
        return NextResponse.json(
          { error: "You have already reviewed this template" },
          { status: 400 }
        )
      }
      throw reviewError
    }

    return NextResponse.json({ review }, { status: 201 })
  } catch (error) {
    // TODO: Log API error to monitoring service
    return NextResponse.json(
      { error: "Failed to create review" },
      { status: 500 }
    )
  }
}