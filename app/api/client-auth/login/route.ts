import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { hashPassword } from '@/lib/client-account-utils'

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email et mot de passe requis' },
        { status: 400 }
      )
    }

    // Use service role to bypass RLS for client authentication
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Find the client account by email
    console.log("🔍 Looking for client account with email:", email.toLowerCase())
    
    // First, let's check what client accounts exist (for debugging)
    const { data: allAccounts, error: debugError } = await supabase
      .from('client_accounts')
      .select('id, email, is_active')
      .limit(10)
    
    console.log("🔍 All client accounts in database:", allAccounts)
    
    const { data: clientAccount, error: accountError } = await supabase
      .from('client_accounts')
      .select(`
        id,
        client_id,
        email,
        password_hash,
        is_active,
        clients!inner (
          id,
          name,
          email,
          dietitian_id
        )
      `)
      .eq('email', email.toLowerCase())
      .eq('is_active', true)
      .single()

    console.log("🔍 Supabase query result:", { clientAccount, accountError })

    if (accountError || !clientAccount) {
      console.log("❌ No client account found or error:", accountError)
      return NextResponse.json(
        { error: 'Email ou mot de passe incorrect' },
        { status: 401 }
      )
    }

    // Verify password (simple hash comparison for demo)
    const providedPasswordHash = hashPassword(password)
    
    // Debug logging
    console.log("🔍 Login Debug:", {
      email: email.toLowerCase(),
      providedPassword: password,
      providedPasswordHash,
      storedPasswordHash: clientAccount.password_hash,
      hashesMatch: providedPasswordHash === clientAccount.password_hash
    })
    
    if (providedPasswordHash !== clientAccount.password_hash) {
      return NextResponse.json(
        { error: 'Email ou mot de passe incorrect' },
        { status: 401 }
      )
    }

    // Update last login
    await supabase
      .from('client_accounts')
      .update({ last_login: new Date().toISOString() })
      .eq('id', clientAccount.id)

    // Return client session data (without password hash)
    const clientData = {
      id: clientAccount.client_id,
      name: (clientAccount.clients as any)?.name,
      email: clientAccount.email,
      account_id: clientAccount.id
    }

    return NextResponse.json({
      success: true,
      client: clientData,
      message: 'Connexion réussie'
    })

  } catch (error) {
    console.error('Client login error:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la connexion' },
      { status: 500 }
    )
  }
}
