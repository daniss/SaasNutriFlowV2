import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Use service role key for admin operations
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    // Check if user exists in the profiles table
    const { data, error } = await supabase
      .from('profiles')
      .select('email')
      .eq('email', email)
      .maybeSingle()
    
    if (error) {
      console.error('Error checking user in profiles:', error)
      // If there's an error, still try to check auth users
    }

    // If found in profiles, user exists
    if (data) {
      return NextResponse.json({ exists: true })
    }

    // Fallback: check auth users with admin API
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers()
    
    if (authError) {
      console.error('Error checking auth users:', authError)
      return NextResponse.json({ error: 'Failed to check user' }, { status: 500 })
    }

    // Check if any user has this email
    const exists = authUsers.users.some(user => user.email === email)

    return NextResponse.json({ exists })
  } catch (error) {
    console.error('Error in check-user API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
