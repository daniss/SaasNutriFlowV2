import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const type = searchParams.get('type') // 'recipe' or 'meal_plan'
    const search = searchParams.get('search')
    const sortBy = searchParams.get('sortBy') || 'created_at'
    const sortOrder = searchParams.get('sortOrder') || 'desc'
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = (page - 1) * limit

    // Build query
    let query = supabase
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
          practice_name
        )
      `)
      .eq('is_approved', true)
      .eq('sharing_level', 'public')

    // Apply filters
    if (category) {
      query = query.eq('category', category)
    }
    
    if (type) {
      query = query.eq('template_type', type)
    }
    
    if (search) {
      query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`)
    }

    // Apply sorting
    const validSortFields = ['created_at', 'rating_average', 'download_count', 'title']
    const sortField = validSortFields.includes(sortBy) ? sortBy : 'created_at'
    const ascending = sortOrder === 'asc'
    
    query = query.order(sortField, { ascending })

    // Apply pagination
    query = query.range(offset, offset + limit - 1)

    const { data: templates, error } = await query

    if (error) throw error

    // Get total count for pagination
    const { count } = await supabase
      .from('shared_templates')
      .select('*', { count: 'exact', head: true })
      .eq('is_approved', true)
      .eq('sharing_level', 'public')

    return NextResponse.json({
      templates: templates || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      }
    })
  } catch (error) {
    console.error("Error fetching shared templates:", error)
    return NextResponse.json(
      { error: "Failed to fetch shared templates" },
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

    // Get dietitian profile
    const { data: dietitian, error: dietitianError } = await supabase
      .from('dietitians')
      .select('id')
      .eq('auth_user_id', user.id)
      .single()

    if (dietitianError || !dietitian) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const {
      template_id,
      template_type,
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
      metadata
    } = await request.json()

    // Validate required fields
    if (!template_id || !template_type || !title) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    // Verify template ownership
    const tableName = template_type === 'recipe' ? 'recipe_templates' : 'meal_plan_templates'
    const { data: originalTemplate, error: templateError } = await supabase
      .from(tableName)
      .select('id')
      .eq('id', template_id)
      .eq('dietitian_id', dietitian.id)
      .single()

    if (templateError || !originalTemplate) {
      return NextResponse.json({ error: "Template not found" }, { status: 404 })
    }

    // Create shared template
    const { data: sharedTemplate, error: shareError } = await supabase
      .from('shared_templates')
      .insert({
        template_id,
        template_type,
        author_id: dietitian.id,
        title,
        description,
        category,
        tags,
        difficulty,
        prep_time,
        servings,
        nutritional_info,
        sharing_level: sharing_level || 'public',
        price_credits: price_credits || 0,
        metadata
      })
      .select()
      .single()

    if (shareError) throw shareError

    // If template has a price, give author some credits as bonus
    if (price_credits > 0) {
      await supabase
        .from('credit_transactions')
        .insert({
          dietitian_id: dietitian.id,
          transaction_type: 'bonus',
          amount: Math.floor(price_credits * 0.1), // 10% bonus for sharing
          description: `Bonus for sharing template: ${title}`,
          reference_id: sharedTemplate.id,
          reference_type: 'template_share'
        })
    }

    return NextResponse.json({ template: sharedTemplate }, { status: 201 })
  } catch (error) {
    console.error("Error sharing template:", error)
    return NextResponse.json(
      { error: "Failed to share template" },
      { status: 500 }
    )
  }
}