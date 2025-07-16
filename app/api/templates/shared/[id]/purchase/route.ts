import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

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

    // Get shared template
    const { data: sharedTemplate, error: templateError } = await supabase
      .from('shared_templates')
      .select('*')
      .eq('id', params.id)
      .eq('is_approved', true)
      .single()

    if (templateError || !sharedTemplate) {
      return NextResponse.json({ error: "Template not found" }, { status: 404 })
    }

    // Check if user already owns this template
    const { data: existingPurchase } = await supabase
      .from('template_purchases')
      .select('id')
      .eq('shared_template_id', params.id)
      .eq('buyer_id', dietitian.id)
      .single()

    if (existingPurchase) {
      return NextResponse.json({ error: "Template already purchased" }, { status: 400 })
    }

    // Check if user is the author (can't purchase own template)
    if (sharedTemplate.author_id === dietitian.id) {
      return NextResponse.json({ error: "Cannot purchase your own template" }, { status: 400 })
    }

    const creditsRequired = sharedTemplate.price_credits

    // If template is free, create purchase record
    if (creditsRequired === 0) {
      const { data: purchase, error: purchaseError } = await supabase
        .from('template_purchases')
        .insert({
          shared_template_id: params.id,
          buyer_id: dietitian.id,
          purchase_type: 'free',
          credits_spent: 0
        })
        .select()
        .single()

      if (purchaseError) throw purchaseError

      // Get the original template data for copying
      const originalTemplate = await getOriginalTemplateData(
        supabase,
        sharedTemplate.template_id,
        sharedTemplate.template_type
      )

      return NextResponse.json({
        purchase,
        template: originalTemplate,
        message: "Template downloaded successfully"
      })
    }

    // For paid templates, check user's credit balance
    const { data: userCredits } = await supabase
      .from('dietitian_credits')
      .select('credits_balance')
      .eq('dietitian_id', dietitian.id)
      .single()

    const currentBalance = userCredits?.credits_balance || 0

    if (currentBalance < creditsRequired) {
      return NextResponse.json({
        error: "Insufficient credits",
        required: creditsRequired,
        available: currentBalance
      }, { status: 400 })
    }

    // Create purchase record
    const { data: purchase, error: purchaseError } = await supabase
      .from('template_purchases')
      .insert({
        shared_template_id: params.id,
        buyer_id: dietitian.id,
        purchase_type: 'credits',
        credits_spent: creditsRequired
      })
      .select()
      .single()

    if (purchaseError) throw purchaseError

    // Process credit transaction for buyer
    await supabase
      .from('credit_transactions')
      .insert({
        dietitian_id: dietitian.id,
        transaction_type: 'spend',
        amount: creditsRequired,
        description: `Purchase template: ${sharedTemplate.title}`,
        reference_id: purchase.id,
        reference_type: 'purchase'
      })

    // Process credit transaction for seller (author gets 80% of credits)
    const authorEarnings = Math.floor(creditsRequired * 0.8)
    await supabase
      .from('credit_transactions')
      .insert({
        dietitian_id: sharedTemplate.author_id,
        transaction_type: 'earn',
        amount: authorEarnings,
        description: `Template sale: ${sharedTemplate.title}`,
        reference_id: purchase.id,
        reference_type: 'template_sale'
      })

    // Get the original template data for copying
    const originalTemplate = await getOriginalTemplateData(
      supabase,
      sharedTemplate.template_id,
      sharedTemplate.template_type
    )

    return NextResponse.json({
      purchase,
      template: originalTemplate,
      message: "Template purchased successfully"
    })
  } catch (error) {
    console.error("Error purchasing template:", error)
    return NextResponse.json(
      { error: "Failed to purchase template" },
      { status: 500 }
    )
  }
}

async function getOriginalTemplateData(
  supabase: any,
  templateId: string,
  templateType: string
) {
  const tableName = templateType === 'recipe' ? 'recipe_templates' : 'meal_plan_templates'
  
  const { data: template, error } = await supabase
    .from(tableName)
    .select('*')
    .eq('id', templateId)
    .single()

  if (error) throw error
  return template
}