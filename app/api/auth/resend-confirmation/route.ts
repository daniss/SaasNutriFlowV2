import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { z } from 'zod'

const ResendSchema = z.object({
  email: z.string().email('Invalid email address'),
})

// Use service role key for admin operations
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: Request) {
  try {
    // Parse and validate request body
    const body = await request.json()
    const { email } = ResendSchema.parse(body)

    // Resend confirmation email using Supabase
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: email,
      options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/auth/confirm`,
      }
    })

    if (error) {
      console.error('Resend confirmation error:', error)
      return NextResponse.json(
        { error: 'Failed to resend confirmation email' },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Confirmation email resent successfully'
    })

  } catch (error) {
    console.error('API Error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid email address' },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}