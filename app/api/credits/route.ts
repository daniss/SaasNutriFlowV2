import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
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

    // Get credit balance
    const { data: credits, error: creditsError } = await supabase
      .from('dietitian_credits')
      .select('*')
      .eq('dietitian_id', dietitian.id)
      .single()

    if (creditsError) {
      // If no record exists, create one with 0 balance
      const { data: newCredits, error: createError } = await supabase
        .from('dietitian_credits')
        .insert({
          dietitian_id: dietitian.id,
          credits_balance: 0,
          total_earned: 0,
          total_spent: 0
        })
        .select()
        .single()

      if (createError) throw createError
      return NextResponse.json({ credits: newCredits })
    }

    // Get recent transactions
    const { data: transactions, error: transactionsError } = await supabase
      .from('credit_transactions')
      .select('*')
      .eq('dietitian_id', dietitian.id)
      .order('created_at', { ascending: false })
      .limit(20)

    if (transactionsError) throw transactionsError

    return NextResponse.json({
      credits,
      transactions: transactions || []
    })
  } catch (error) {
    console.error("Error fetching credits:", error)
    return NextResponse.json(
      { error: "Failed to fetch credits" },
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

    const { transaction_type, amount, description, reference_id, reference_type } = await request.json()

    // Validate input
    if (!transaction_type || !amount || amount <= 0) {
      return NextResponse.json(
        { error: "Invalid transaction data" },
        { status: 400 }
      )
    }

    // Valid transaction types
    const validTypes = ['earn', 'spend', 'refund', 'bonus']
    if (!validTypes.includes(transaction_type)) {
      return NextResponse.json(
        { error: "Invalid transaction type" },
        { status: 400 }
      )
    }

    // For spend transactions, check if user has sufficient balance
    if (transaction_type === 'spend') {
      const { data: currentCredits } = await supabase
        .from('dietitian_credits')
        .select('credits_balance')
        .eq('dietitian_id', dietitian.id)
        .single()

      const balance = currentCredits?.credits_balance || 0
      if (balance < amount) {
        return NextResponse.json(
          { error: "Insufficient credits" },
          { status: 400 }
        )
      }
    }

    // Create transaction (triggers will update the balance)
    const { data: transaction, error: transactionError } = await supabase
      .from('credit_transactions')
      .insert({
        dietitian_id: dietitian.id,
        transaction_type,
        amount,
        description,
        reference_id,
        reference_type
      })
      .select()
      .single()

    if (transactionError) throw transactionError

    // Get updated balance
    const { data: updatedCredits } = await supabase
      .from('dietitian_credits')
      .select('*')
      .eq('dietitian_id', dietitian.id)
      .single()

    return NextResponse.json({
      transaction,
      credits: updatedCredits
    }, { status: 201 })
  } catch (error) {
    console.error("Error creating credit transaction:", error)
    return NextResponse.json(
      { error: "Failed to create transaction" },
      { status: 500 }
    )
  }
}